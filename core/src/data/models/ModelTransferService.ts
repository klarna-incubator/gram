import { randomUUID } from "crypto";
import { EventEmitter } from "node:events";
import log4js from "log4js";
import pg from "pg";
import { NotFoundError, InvalidInputError } from "../../util/errors.js";
import { DataAccessLayer } from "../dal.js";
import { LinkObjectType } from "../links/Link.js";
import { SuggestionID } from "../../suggestions/models.js";
import {
  MODEL_TRANSFER_SCHEMA_VERSION,
  ModelExportPayload,
  ModelImportOptions,
  ModelImportResult,
} from "./ModelTransfer.js";

type ImportedSuggestion = {
  threats: Map<string, string>;
  controls: Map<string, string>;
};

export class ModelTransferService extends EventEmitter {
  private log = log4js.getLogger("ModelTransferService");

  constructor(private dal: DataAccessLayer) {
    super();
  }

  async exportModel(
    modelId: string,
    exportedBy: string
  ): Promise<ModelExportPayload> {
    const model = await this.dal.modelService.getById(modelId);
    if (!model) {
      throw new NotFoundError();
    }

    const [threats, controls, mitigations] = await Promise.all([
      this.dal.threatService.list(modelId),
      this.dal.controlService.list(modelId),
      this.dal.mitigationService.list(modelId),
    ]);

    const [review, resourceMatchings] = await Promise.all([
      this.dal.reviewService.getByModelId(modelId),
      this.dal.resourceMatchingService.list(modelId),
    ]);

    const links = [
      ...(await this.dal.linkService.listLinks(LinkObjectType.Model, modelId)),
      ...(
        await Promise.all(
          threats.map((threat) =>
            this.dal.linkService.listLinks(LinkObjectType.Threat, threat.id!)
          )
        )
      ).flat(),
      ...(
        await Promise.all(
          controls.map((control) =>
            this.dal.linkService.listLinks(LinkObjectType.Control, control.id!)
          )
        )
      ).flat(),
    ];

    const flowGroups = await Promise.all(
      model.data.dataFlows.map((dataFlow) =>
        this.dal.flowService.listFlows(modelId, dataFlow.id)
      )
    );

    return {
      metadata: {
        schemaVersion: MODEL_TRANSFER_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        exportedBy,
        aiInstructions: {
          purpose:
            "This payload is intended for AI-assisted threat-model analysis and safe round-trip import.",
          editRules: [
            "Preserve top-level sections and object shapes.",
            "Do not add unknown fields.",
            "Keep enum values unchanged unless intentionally editing semantics.",
            "Keep references consistent: mitigations.threatId/controlId must point to existing threats/controls.",
            "Keep component/dataFlow IDs valid UUID strings.",
            "You may edit semantic fields such as titles, descriptions, severity, flow summaries, and review note.",
          ],
        },
      },
      model: {
        id: model.id!,
        systemId: model.systemId,
        version: model.version,
        isTemplate: model.isTemplate,
        shouldReviewActionItems: model.shouldReviewActionItems,
      },
      modelData: model.data,
      threats: threats.map((threat) => ({
        id: threat.id!,
        title: threat.title,
        description: threat.description,
        componentId: threat.componentId,
        isActionItem: threat.isActionItem,
        severity: threat.severity,
        suggestionId: undefined,
      })),
      controls: controls.map((control) => ({
        id: control.id!,
        title: control.title,
        description: control.description,
        inPlace: control.inPlace,
        componentId: control.componentId,
        suggestionId: undefined,
      })),
      mitigations: mitigations.map((mitigation) => ({
        threatId: mitigation.threatId,
        controlId: mitigation.controlId,
      })),
      suggestions: {
        threats: [],
        controls: [],
      },
      links: links.map((link) => ({
        objectType: link.objectType,
        objectId: link.objectId,
        label: link.label,
        url: link.url,
        icon: link.icon,
      })),
      flows: flowGroups.flat().map((flow) => ({
        dataFlowId: flow.dataFlowId,
        originComponentId: flow.originComponentId,
        summary: flow.summary,
        attributes: flow.attributes,
      })),
      resourceMatchings: resourceMatchings.map((matching) => ({
        resourceId: matching.resourceId,
        componentId: matching.componentId,
      })),
      review: review
        ? {
            status: review.status,
            note: review.note,
            requestedBy: review.requestedBy,
            reviewedBy: review.reviewedBy,
            extras: review.extras,
          }
        : null,
    };
  }

  async importModel(
    payload: ModelExportPayload,
    options: ModelImportOptions
  ): Promise<ModelImportResult> {
    this.validatePayload(payload, options.mode);

    const result = await this.dal.pool.runTransaction(async (client) => {
      let targetModelId: string;
      let targetSystemId: string | null = payload.model.systemId;
      let targetVersion = payload.model.version;
      let targetIsTemplate = payload.model.isTemplate || false;
      let targetShouldReviewActionItems =
        payload.model.shouldReviewActionItems || false;
      if (options.mode === "in-place") {
        const targetModel = await this.prepareInPlaceImport(
          client,
          payload,
          options
        );
        targetModelId = targetModel.id;
        targetSystemId = targetModel.systemId;
        targetVersion = targetModel.version;
        targetIsTemplate = targetModel.isTemplate;
        targetShouldReviewActionItems = targetModel.shouldReviewActionItems;
      } else {
        targetModelId = await this.createTargetModel(
          client,
          payload,
          options.importedBy
        );
      }

      const componentMap = new Map<string, string>();
      payload.modelData.components.forEach((component) => {
        componentMap.set(component.id, randomUUID());
      });

      const dataFlowMap = new Map<string, string>();
      payload.modelData.dataFlows.forEach((dataFlow) => {
        dataFlowMap.set(dataFlow.id, randomUUID());
      });

      // Threats/controls can be attached to either components or data-flows.
      // Keep both attachment target types addressable during remap.
      const elementMap = new Map(componentMap);
      dataFlowMap.forEach((newId, oldId) => {
        elementMap.set(oldId, newId);
      });

      const remappedModelData = {
        components: payload.modelData.components.map((component) => ({
          ...component,
          id: componentMap.get(component.id)!,
        })),
        dataFlows: payload.modelData.dataFlows.map((dataFlow) => ({
          ...dataFlow,
          bidirectional: dataFlow.bidirectional ?? false,
          id: dataFlowMap.get(dataFlow.id)!,
          startComponent: {
            id: componentMap.get(dataFlow.startComponent.id)!,
          },
          endComponent: {
            id: componentMap.get(dataFlow.endComponent.id)!,
          },
        })),
      };

      await this.updateTargetModel(
        client,
        targetModelId,
        targetSystemId,
        targetVersion,
        targetIsTemplate,
        targetShouldReviewActionItems,
        remappedModelData
      );

      const suggestionMap = await this.insertSuggestions(
        client,
        targetModelId,
        payload,
        componentMap
      );
      const threatMap = await this.insertThreats(
        client,
        targetModelId,
        payload,
        elementMap,
        suggestionMap,
        options.importedBy
      );
      const controlMap = await this.insertControls(
        client,
        targetModelId,
        payload,
        elementMap,
        suggestionMap,
        options.importedBy
      );

      await this.insertMitigations(
        client,
        payload,
        threatMap,
        controlMap,
        options
      );
      await this.insertLinks(
        client,
        targetModelId,
        payload,
        threatMap,
        controlMap,
        options.importedBy
      );
      await this.insertFlows(
        client,
        targetModelId,
        payload,
        dataFlowMap,
        componentMap,
        options.importedBy
      );
      await this.insertResourceMatchings(
        client,
        targetModelId,
        payload,
        componentMap,
        options.importedBy
      );
      if (options.mode !== "in-place") {
        await this.upsertReview(client, targetModelId, payload);
      }

      return targetModelId;
    });

    this.dal.modelService.emit("updated-for", { modelId: result });
    return { modelId: result };
  }

  private validatePayload(
    payload: ModelExportPayload,
    mode: "create-new" | "in-place"
  ) {
    if (payload.metadata.schemaVersion !== MODEL_TRANSFER_SCHEMA_VERSION) {
      throw new InvalidInputError(
        `Unsupported schemaVersion ${payload.metadata.schemaVersion}.`
      );
    }

    if (!payload.model.version || payload.model.version.trim() === "") {
      throw new InvalidInputError("Model version is required.");
    }

    const componentIds = new Set(payload.modelData.components.map((c) => c.id));
    if (componentIds.size !== payload.modelData.components.length) {
      throw new InvalidInputError(
        "Duplicate component IDs in modelData.components."
      );
    }

    const dataFlowIds = new Set(payload.modelData.dataFlows.map((df) => df.id));
    const attachableIds = new Set<string>([...componentIds, ...dataFlowIds]);
    if (dataFlowIds.size !== payload.modelData.dataFlows.length) {
      throw new InvalidInputError(
        "Duplicate data flow IDs in modelData.dataFlows."
      );
    }

    payload.modelData.dataFlows.forEach((dataFlow) => {
      if (
        !componentIds.has(dataFlow.startComponent.id) ||
        !componentIds.has(dataFlow.endComponent.id)
      ) {
        throw new InvalidInputError(
          `Data flow ${dataFlow.id} references an unknown component.`
        );
      }
    });

    const threatIds = new Set(payload.threats.map((threat) => threat.id));
    if (threatIds.size !== payload.threats.length) {
      throw new InvalidInputError("Duplicate threat IDs.");
    }

    const controlIds = new Set(payload.controls.map((control) => control.id));
    if (controlIds.size !== payload.controls.length) {
      throw new InvalidInputError("Duplicate control IDs.");
    }

    payload.threats.forEach((threat) => {
      if (!attachableIds.has(threat.componentId)) {
        throw new InvalidInputError(
          `Threat ${threat.id} references unknown component/data-flow ${threat.componentId}.`
        );
      }
    });

    payload.controls.forEach((control) => {
      if (!attachableIds.has(control.componentId)) {
        throw new InvalidInputError(
          `Control ${control.id} references unknown component/data-flow ${control.componentId}.`
        );
      }
    });

    payload.mitigations.forEach((mitigation) => {
      if (
        !threatIds.has(mitigation.threatId) ||
        !controlIds.has(mitigation.controlId)
      ) {
        throw new InvalidInputError(
          "Mitigations must reference existing threats and controls."
        );
      }
    });

    const suggestedThreatIds = new Set(
      payload.suggestions.threats.map((s) => s.id)
    );
    const suggestedControlIds = new Set(
      payload.suggestions.controls.map((s) => s.id)
    );
    if (suggestedThreatIds.size !== payload.suggestions.threats.length) {
      throw new InvalidInputError("Duplicate suggested threat IDs.");
    }
    if (suggestedControlIds.size !== payload.suggestions.controls.length) {
      throw new InvalidInputError("Duplicate suggested control IDs.");
    }

    payload.suggestions.threats.forEach((suggestion) => {
      this.mustParseSuggestionId(suggestion.id);
    });

    payload.suggestions.controls.forEach((suggestion) => {
      this.mustParseSuggestionId(suggestion.id);
    });

    payload.threats.forEach((threat) => {
      if (threat.suggestionId && !suggestedThreatIds.has(threat.suggestionId)) {
        this.log.warn(
          `Threat ${threat.id} references unknown suggestion ${threat.suggestionId}; importing without suggestion binding`
        );
      }
    });

    payload.controls.forEach((control) => {
      if (
        control.suggestionId &&
        !suggestedControlIds.has(control.suggestionId)
      ) {
        this.log.warn(
          `Control ${control.id} references unknown suggestion ${control.suggestionId}; importing without suggestion binding`
        );
      }
    });

    payload.links.forEach((link) => {
      if (
        link.objectType === LinkObjectType.Model &&
        link.objectId !== payload.model.id
      ) {
        throw new InvalidInputError(
          "Model links must reference payload.model.id."
        );
      }
      if (
        link.objectType === LinkObjectType.Threat &&
        !threatIds.has(link.objectId)
      ) {
        throw new InvalidInputError(
          `Link references unknown threat ${link.objectId}.`
        );
      }
      if (
        link.objectType === LinkObjectType.Control &&
        !controlIds.has(link.objectId)
      ) {
        throw new InvalidInputError(
          `Link references unknown control ${link.objectId}.`
        );
      }
    });

    payload.flows.forEach((flow) => {
      if (!dataFlowIds.has(flow.dataFlowId)) {
        throw new InvalidInputError(
          `Flow references unknown data flow ${flow.dataFlowId}.`
        );
      }
      if (!componentIds.has(flow.originComponentId)) {
        throw new InvalidInputError(
          `Flow references unknown component ${flow.originComponentId}.`
        );
      }
    });

    payload.resourceMatchings.forEach((matching) => {
      if (matching.componentId && !componentIds.has(matching.componentId)) {
        throw new InvalidInputError(
          `Resource matching references unknown component ${matching.componentId}.`
        );
      }
    });

    if (mode === "in-place" && !payload.model.id) {
      throw new InvalidInputError("In-place import requires payload model id.");
    }
  }

  private mustParseSuggestionId(suggestionId: string): SuggestionID {
    try {
      return new SuggestionID(suggestionId);
    } catch {
      throw new InvalidInputError(`Invalid suggestion id: ${suggestionId}`);
    }
  }

  private async prepareInPlaceImport(
    client: pg.PoolClient,
    payload: ModelExportPayload,
    options: ModelImportOptions
  ) {
    const targetModelId = options.targetModelId || payload.model.id;
    const existing = await client.query(
      "SELECT id, system_id, version, is_template, should_review_action_items FROM models WHERE id = $1::uuid AND deleted_at IS NULL",
      [targetModelId]
    );
    if (existing.rows.length === 0) {
      throw new NotFoundError();
    }

    await client.query(
      "DELETE FROM suggested_threats WHERE model_id = $1::uuid",
      [targetModelId]
    );
    await client.query(
      "DELETE FROM suggested_controls WHERE model_id = $1::uuid",
      [targetModelId]
    );
    await client.query("DELETE FROM flows WHERE model_id = $1::uuid", [
      targetModelId,
    ]);
    await client.query(
      "DELETE FROM links WHERE object_type = $1 AND object_id = $2",
      [LinkObjectType.Model, targetModelId]
    );
    await client.query(
      "DELETE FROM links WHERE object_type = $1 AND object_id IN (SELECT id::varchar FROM threats WHERE model_id = $2::uuid)",
      [LinkObjectType.Threat, targetModelId]
    );
    await client.query(
      "DELETE FROM links WHERE object_type = $1 AND object_id IN (SELECT id::varchar FROM controls WHERE model_id = $2::uuid)",
      [LinkObjectType.Control, targetModelId]
    );
    await client.query(
      "UPDATE mitigations SET deleted_at = NOW() WHERE threat_id IN (SELECT id FROM threats WHERE model_id = $1::uuid)",
      [targetModelId]
    );
    await client.query(
      "UPDATE mitigations SET deleted_at = NOW() WHERE control_id IN (SELECT id FROM controls WHERE model_id = $1::uuid)",
      [targetModelId]
    );
    await client.query(
      "UPDATE threats SET deleted_at = NOW() WHERE model_id = $1::uuid AND deleted_at IS NULL",
      [targetModelId]
    );
    await client.query(
      "UPDATE controls SET deleted_at = NOW() WHERE model_id = $1::uuid AND deleted_at IS NULL",
      [targetModelId]
    );
    await client.query(
      "UPDATE resource_matchings SET deleted_at = NOW(), updated_by = $2::varchar WHERE model_id = $1::uuid AND deleted_at IS NULL",
      [targetModelId, options.importedBy]
    );

    return {
      id: targetModelId,
      systemId: existing.rows[0].systemId ?? existing.rows[0].system_id ?? null,
      version: existing.rows[0].version,
      isTemplate: existing.rows[0].is_template,
      shouldReviewActionItems: existing.rows[0].should_review_action_items,
    };
  }

  private async createTargetModel(
    client: pg.PoolClient,
    payload: ModelExportPayload,
    importedBy: string
  ) {
    const modelId = randomUUID();
    await client.query(
      `INSERT INTO models
      (id, system_id, version, data, created_by, is_template, should_review_action_items)
      VALUES ($1::uuid, $2::varchar, $3::varchar, $4::jsonb, $5::varchar, $6::boolean, $7::boolean)`,
      [
        modelId,
        payload.model.systemId,
        payload.model.version,
        JSON.stringify({ components: [], dataFlows: [] }),
        importedBy,
        payload.model.isTemplate || false,
        payload.model.shouldReviewActionItems || false,
      ]
    );
    return modelId;
  }

  private async updateTargetModel(
    client: pg.PoolClient,
    targetModelId: string,
    systemId: string | null,
    version: string,
    isTemplate: boolean,
    shouldReviewActionItems: boolean | null,
    modelData: object
  ) {
    await client.query(
      `UPDATE models
      SET system_id = $2::varchar,
          version = $3::varchar,
          data = $4::jsonb,
          is_template = $5::boolean,
          should_review_action_items = $6::boolean,
          updated_at = NOW()
      WHERE id = $1::uuid`,
      [
        targetModelId,
        systemId,
        version,
        JSON.stringify(modelData),
        isTemplate,
        shouldReviewActionItems,
      ]
    );
  }

  private async insertSuggestions(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload,
    componentMap: Map<string, string>
  ): Promise<ImportedSuggestion> {
    const suggestionMap: ImportedSuggestion = {
      threats: new Map(),
      controls: new Map(),
    };

    for (const suggestion of payload.suggestions.threats) {
      const mappedComponentId = componentMap.get(suggestion.componentId);
      if (!mappedComponentId) {
        this.log.warn(
          `Skipping suggested threat ${suggestion.id} because component ${suggestion.componentId} is not present in modelData.components`
        );
        continue;
      }
      const parsed = this.mustParseSuggestionId(suggestion.id);
      const newSuggestionId = `${mappedComponentId}/${parsed.partialId}`;
      suggestionMap.threats.set(suggestion.id, newSuggestionId);
      await client.query(
        `INSERT INTO suggested_threats
        (id, model_id, status, component_id, title, description, reason, source)
        VALUES ($1::varchar, $2::uuid, $3::varchar, $4::uuid, $5::varchar, $6::varchar, $7::varchar, $8::varchar)`,
        [
          newSuggestionId,
          targetModelId,
          suggestion.status,
          mappedComponentId,
          suggestion.title,
          suggestion.description,
          suggestion.reason || "",
          suggestion.source,
        ]
      );
    }

    for (const suggestion of payload.suggestions.controls) {
      const mappedComponentId = componentMap.get(suggestion.componentId);
      if (!mappedComponentId) {
        this.log.warn(
          `Skipping suggested control ${suggestion.id} because component ${suggestion.componentId} is not present in modelData.components`
        );
        continue;
      }
      const parsed = this.mustParseSuggestionId(suggestion.id);
      const newSuggestionId = `${mappedComponentId}/${parsed.partialId}`;
      suggestionMap.controls.set(suggestion.id, newSuggestionId);
      await client.query(
        `INSERT INTO suggested_controls
        (id, model_id, status, component_id, title, description, reason, mitigates, source)
        VALUES ($1::varchar, $2::uuid, $3::varchar, $4::uuid, $5::varchar, $6::varchar, $7::varchar, $8::jsonb, $9::varchar)`,
        [
          newSuggestionId,
          targetModelId,
          suggestion.status,
          mappedComponentId,
          suggestion.title,
          suggestion.description,
          suggestion.reason || "",
          JSON.stringify(suggestion.mitigates),
          suggestion.source,
        ]
      );
    }

    return suggestionMap;
  }

  private async insertThreats(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload,
    attachmentMap: Map<string, string>,
    suggestionMap: ImportedSuggestion,
    importedBy: string
  ) {
    const threatMap = new Map<string, string>();
    for (const threat of payload.threats) {
      const newThreatId = randomUUID();
      threatMap.set(threat.id, newThreatId);
      await client.query(
        `INSERT INTO threats
        (id, title, description, model_id, component_id, created_by, suggestion_id, is_action_item, severity)
        VALUES ($1::uuid, $2::varchar, $3::varchar, $4::uuid, $5::uuid, $6::varchar, $7::varchar, $8::boolean, $9::varchar)`,
        [
          newThreatId,
          threat.title,
          threat.description,
          targetModelId,
          attachmentMap.get(threat.componentId),
          importedBy,
          threat.suggestionId
            ? suggestionMap.threats.get(threat.suggestionId)
            : null,
          threat.isActionItem || false,
          threat.severity || null,
        ]
      );
    }
    return threatMap;
  }

  private async insertControls(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload,
    attachmentMap: Map<string, string>,
    suggestionMap: ImportedSuggestion,
    importedBy: string
  ) {
    const controlMap = new Map<string, string>();
    for (const control of payload.controls) {
      const newControlId = randomUUID();
      controlMap.set(control.id, newControlId);
      await client.query(
        `INSERT INTO controls
        (id, title, description, in_place, model_id, component_id, created_by, suggestion_id)
        VALUES ($1::uuid, $2::varchar, $3::varchar, $4::boolean, $5::uuid, $6::uuid, $7::varchar, $8::varchar)`,
        [
          newControlId,
          control.title,
          control.description,
          control.inPlace,
          targetModelId,
          attachmentMap.get(control.componentId),
          importedBy,
          control.suggestionId
            ? suggestionMap.controls.get(control.suggestionId)
            : null,
        ]
      );
    }
    return controlMap;
  }

  private async insertMitigations(
    client: pg.PoolClient,
    payload: ModelExportPayload,
    threatMap: Map<string, string>,
    controlMap: Map<string, string>,
    options: ModelImportOptions
  ) {
    for (const mitigation of payload.mitigations) {
      const mappedThreatId = threatMap.get(mitigation.threatId);
      const mappedControlId = controlMap.get(mitigation.controlId);
      if (!mappedThreatId || !mappedControlId) {
        throw new InvalidInputError(
          "Mitigation references could not be remapped."
        );
      }
      await client.query(
        `INSERT INTO mitigations (threat_id, control_id, created_by)
        VALUES ($1::uuid, $2::uuid, $3::varchar)`,
        [mappedThreatId, mappedControlId, options.importedBy]
      );
    }
  }

  private async insertLinks(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload,
    threatMap: Map<string, string>,
    controlMap: Map<string, string>,
    importedBy: string
  ) {
    for (const link of payload.links) {
      let mappedObjectId: string | undefined = link.objectId;
      if (link.objectType === LinkObjectType.Model) {
        mappedObjectId = targetModelId;
      } else if (link.objectType === LinkObjectType.Threat) {
        mappedObjectId = threatMap.get(link.objectId);
      } else if (link.objectType === LinkObjectType.Control) {
        mappedObjectId = controlMap.get(link.objectId);
      }

      if (!mappedObjectId) {
        throw new InvalidInputError("Link object could not be remapped.");
      }

      await client.query(
        `INSERT INTO links
        (object_type, object_id, label, icon, url, created_by)
        VALUES ($1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar)`,
        [
          link.objectType,
          mappedObjectId,
          link.label,
          link.icon,
          link.url,
          importedBy,
        ]
      );
    }
  }

  private async insertFlows(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload,
    dataFlowMap: Map<string, string>,
    componentMap: Map<string, string>,
    importedBy: string
  ) {
    for (const flow of payload.flows) {
      const dataFlowId = dataFlowMap.get(flow.dataFlowId);
      const originComponentId = componentMap.get(flow.originComponentId);

      if (!dataFlowId || !originComponentId) {
        throw new InvalidInputError("Flow references could not be remapped.");
      }

      await client.query(
        `INSERT INTO flows
        (model_id, data_flow_id, summary, origin_component_id, attributes, created_by)
        VALUES ($1::uuid, $2::uuid, $3::varchar, $4::uuid, $5::jsonb, $6::varchar)`,
        [
          targetModelId,
          dataFlowId,
          flow.summary,
          originComponentId,
          JSON.stringify(flow.attributes || {}),
          importedBy,
        ]
      );
    }
  }

  private async insertResourceMatchings(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload,
    componentMap: Map<string, string>,
    importedBy: string
  ) {
    for (const matching of payload.resourceMatchings) {
      const componentId = matching.componentId
        ? componentMap.get(matching.componentId)
        : null;
      await client.query(
        `INSERT INTO resource_matchings
        (model_id, resource_id, component_id, created_by, updated_by, deleted_at)
        VALUES ($1::uuid, $2::varchar, $3::uuid, $4::varchar, $4::varchar, NULL)
        ON CONFLICT (model_id, resource_id) DO UPDATE
          SET component_id = EXCLUDED.component_id,
              updated_by = EXCLUDED.updated_by,
              deleted_at = NULL`,
        [targetModelId, matching.resourceId, componentId, importedBy]
      );
    }
  }

  private async upsertReview(
    client: pg.PoolClient,
    targetModelId: string,
    payload: ModelExportPayload
  ) {
    if (!payload.review) {
      await client.query(
        "UPDATE reviews SET deleted_at = NOW() WHERE model_id = $1::uuid",
        [targetModelId]
      );
      return;
    }

    await client.query(
      `INSERT INTO reviews
      (model_id, requested_by, reviewed_by, status, note, extras, deleted_at)
      VALUES ($1::uuid, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::jsonb, NULL)
      ON CONFLICT (model_id) DO UPDATE
        SET requested_by = EXCLUDED.requested_by,
            reviewed_by = EXCLUDED.reviewed_by,
            status = EXCLUDED.status,
            note = EXCLUDED.note,
            extras = EXCLUDED.extras,
            deleted_at = NULL,
            updated_at = NOW()`,
      [
        targetModelId,
        payload.review.requestedBy,
        payload.review.reviewedBy,
        payload.review.status,
        payload.review.note,
        JSON.stringify(payload.review.extras || {}),
      ]
    );
  }
}
