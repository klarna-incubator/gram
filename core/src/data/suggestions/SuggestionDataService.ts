import { EventEmitter } from "events";
import log4js from "log4js";
import {
  EngineSuggestedResult,
  SuggestionID,
} from "../../suggestions/models.js";
import Control from "../controls/Control.js";
import { convertToControl } from "../controls/ControlDataService.js";
import { DataAccessLayer } from "../dal.js";
import Mitigation from "../mitigations/Mitigation.js";
import { GramConnectionPool } from "../postgres.js";
import Threat from "../threats/Threat.js";
import { convertToThreat } from "../threats/ThreatDataService.js";
import {
  SuggestedControl,
  SuggestedThreat,
  SuggestionStatus,
  isControl,
} from "./Suggestion.js";

function convertToSuggestionControl(row: any) {
  const control = new SuggestedControl(
    new SuggestionID(row["id"]),
    row["model_id"],
    row["component_id"],
    row["source"]
  );
  control.description = row["description"];
  control.mitigates = row["mitigates"];
  control.reason = row["reason"];
  control.status = row["status"];
  control.title = row["title"];
  return control;
}

function convertToSuggestionThreat(row: any) {
  const threat = new SuggestedThreat(
    new SuggestionID(row["id"]),
    row["model_id"],
    row["component_id"],
    row["source"]
  );
  threat.description = row["description"];
  threat.reason = row["reason"];
  threat.status = row["status"];
  threat.title = row["title"];
  return threat;
}

const log = log4js.getLogger("SuggestionDataService");

export class SuggestionDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
  }

  private pool: GramConnectionPool;

  /**
   * Copy suggestions from one model to anothger
   * @param fromModelId
   * @param toModelId
   * @param uuidMap map used to translate component ids
   * @returns
   */
  async copySuggestions(
    fromModelId: string,
    toModelId: string,
    uuidMap: Map<string, string>
  ) {
    // This will be slow for large threat models
    const threatSuggestions = await this.listThreatSuggestions(fromModelId);
    const controlSuggestions = await this.listControlSuggestions(fromModelId);

    if (controlSuggestions.length === 0 && threatSuggestions.length === 0) {
      return;
    }

    const threats = threatSuggestions
      .map((ts) => ({
        ...ts,
        id: new SuggestionID(
          uuidMap.get(ts.componentId) + "/" + ts.id.partialId
        ),
        componentId: uuidMap.get(ts.componentId) as string,
        modelId: toModelId,
        slug: ts.id.partialId,
      }))
      .filter((ts) => ts.componentId); // If componentId is null then the component this was suggested for may no longer exist

    const controls = controlSuggestions
      .map((cs) => ({
        ...cs,
        id: new SuggestionID(
          uuidMap.get(cs.componentId) + "/" + cs.id.partialId
        ),
        componentId: uuidMap.get(cs.componentId) as string,
        modelId: toModelId,
        slug: cs.id.partialId,
      }))
      .filter((cs) => cs.componentId); // If componentId is null then the component this was suggested for may no longer exist

    await this.bulkInsert(toModelId, {
      threats,
      controls,
    });
  }

  /**
   * Insert a list of Threat and Control Suggestions, intended to be used by the SuggestionEngine.
   * @param modelId
   * @param suggestions
   */
  async bulkInsert(modelId: string, suggestions: EngineSuggestedResult) {
    log.debug(
      `Got suggestions from engine: ${JSON.stringify(suggestions, null, 2)}`
    );

    const threatQuery = `
    INSERT INTO suggested_threats (id, model_id, status, component_id, title, description, reason, source)
    VALUES ($1::varchar, $2::uuid, $3::varchar, $4::uuid, $5::varchar, $6::varchar, $7::varchar, $8::varchar)
    ON CONFLICT (id) DO
       UPDATE SET title = $5::varchar, description = $6::varchar, reason = $7::varchar;
   `;

    const controlQuery = `
    INSERT INTO suggested_controls (id, model_id, status, component_id, title, description, reason, mitigates, source)
    VALUES ($1::varchar, $2::uuid, $3::varchar, $4::uuid, $5::varchar, $6::varchar, $7::varchar, $8::json, $9::varchar)
    ON CONFLICT (id) DO
      UPDATE SET title = $5::varchar, description = $6::varchar, reason = $7::varchar, mitigates = $8::json;
   `;

    const deleteThreatsQuery = `
    DELETE FROM suggested_threats WHERE source = $1::varchar and model_id = $2::uuid and status = 'new';
   `;

    const deleteControlsQuery = `
    DELETE FROM suggested_controls WHERE source = $1::varchar and model_id = $2::uuid and status = 'new';
   `;

    await this.pool.runTransaction(async (client) => {
      // Clear previous batches from this source
      if (suggestions.sourceSlugToClear) {
        await client.query(deleteControlsQuery, [
          suggestions.sourceSlugToClear,
          modelId,
        ]);
        await client.query(deleteThreatsQuery, [
          suggestions.sourceSlugToClear,
          modelId,
        ]);
      }

      for (const threat of suggestions.threats) {
        // This will get very slow for large threat models
        // ideally we should be able to batch insert these
        // Hope to revisit soon.
        await client.query(threatQuery, [
          threat.id.val,
          modelId,
          threat.status || SuggestionStatus.New,
          threat.componentId,
          threat.title,
          threat.description,
          threat.reason,
          threat.source,
        ]);
      }

      for (const control of suggestions.controls) {
        await client.query(controlQuery, [
          control.id.val,
          modelId,
          control.status || SuggestionStatus.New,
          control.componentId,
          control.title,
          control.description,
          control.reason,
          JSON.stringify(control.mitigates),
          control.source,
        ]);
      }

      log.debug(
        `inserted ${suggestions.threats.length} suggested threats, ${suggestions.controls.length} suggested controls.`
      );
      this.emit("updated-for", {
        modelId,
      });
    });
  }

  async listControlSuggestions(modelId: string) {
    const query = `
      SELECT * 
      FROM suggested_controls
      WHERE model_id = $1::uuid
    `;

    const res = await this.pool.query(query, [modelId]);
    return res.rows.map(convertToSuggestionControl);
  }

  async listThreatSuggestions(modelId: string) {
    // Add pagination here later if needed.
    const query = `
      SELECT * 
      FROM suggested_threats
      WHERE model_id = $1::uuid
    `;

    const res = await this.pool.query(query, [modelId]);
    return res.rows.map(convertToSuggestionThreat);
  }

  /**
   * Delete suggestions by model id and component id
   * @param modelId
   * @param componentIds
   * @returns
   */
  async deleteByComponentId(modelId: string, componentIds: string[]) {
    if (!componentIds || componentIds.length === 0) {
      return false;
    }

    const filter = `IN (${componentIds
      .map((_, i) => `$${2 + i}::uuid`)
      .join(",")})`;

    const threatsQuery = `
    DELETE FROM suggested_threats 
    WHERE model_id = $1::uuid AND component_id ${filter}`;

    const controlsQuery = `
    DELETE FROM suggested_controls 
    WHERE model_id = $1::uuid AND component_id ${filter}
    `;

    return (
      (
        await Promise.all([
          this.pool.query(threatsQuery, [modelId, ...componentIds]),
          this.pool.query(controlsQuery, [modelId, ...componentIds]),
        ])
      ).reduce((p, c) => p + (c.rowCount || 0), 0) > 0
    );
  }

  /**
   * Sets SuggestionStatus for a given suggestion
   * @param suggestionId either threat or control suggestionId
   * @param status the new status of the suggestion
   */
  async setSuggestionStatus(
    modelId: string,
    suggestionId: SuggestionID,
    status: SuggestionStatus
  ) {
    let query;
    if (suggestionId.isThreat) {
      query = `
      UPDATE suggested_threats
      SET status = $1::varchar
      WHERE id = $2::varchar and model_id = $3::uuid
    `;
    } else {
      query = `
      UPDATE suggested_controls 
      SET status = $1::varchar
      WHERE id = $2::varchar AND model_id = $3::uuid
    `;
    }

    const res = await this.pool.query(query, [
      status,
      suggestionId.val,
      modelId,
    ]);

    this.emit("updated-for", {
      modelId,
    });
    return res.rowCount != null && res.rowCount > 0;
  }

  async getById(modelId: string, suggestionId: SuggestionID) {
    let query;
    if (suggestionId.isThreat) {
      query = `
      SELECT * 
      FROM suggested_threats
      WHERE model_id = $1::uuid and id = $2::varchar`;
    } else {
      query = `
      SELECT * 
      FROM suggested_controls
      WHERE model_id = $1::uuid and id = $2::varchar`;
    }

    const res = await this.pool.query(query, [modelId, suggestionId.val]);

    if (res.rowCount === 0) {
      return null;
    }

    if (suggestionId.isThreat) {
      return convertToSuggestionThreat(res.rows[0]);
    } else {
      return convertToSuggestionControl(res.rows[0]);
    }
  }

  async acceptSuggestion(
    modelId: string,
    suggestionId: SuggestionID,
    user: string
  ) {
    const suggestion = await this.getById(modelId, suggestionId);

    if (suggestion === null) {
      log.debug(`suggestion ${suggestionId.val} not found`);
      return false;
    }

    if (
      !(await this.setSuggestionStatus(
        modelId,
        suggestionId,
        SuggestionStatus.Accepted
      ))
    ) {
      log.debug(
        `was not able to set suggestion ${suggestionId.val} to accepted`
      );
      return false;
    }

    if (isControl(suggestion)) {
      // isControl
      const control = new Control(
        suggestion.title,
        suggestion.description,
        false,
        suggestion.modelId,
        suggestion.componentId,
        user,
        suggestion.id
      );
      const controlId = await this.dal.controlService.create(control);

      // Insert as mitigation to any threats that match the partialId.
      const threatIds = await this.getThreatsByPartialSuggestion(
        modelId,
        suggestion.mitigates.map((m) => m.partialThreatId)
      );
      await Promise.all(
        threatIds.map(async (t) =>
          this.dal.mitigationService.create(new Mitigation(t, controlId, user))
        )
      );
    } else {
      const threat = new Threat(
        suggestion.title,
        suggestion.description,
        modelId,
        suggestion.componentId,
        user,
        suggestion.id
      );
      await this.dal.threatService.create(threat);
    }
    return true;
  }

  async getThreatsByPartialSuggestion(
    modelId: string,
    partialSuggestionIds: string[]
  ) {
    if (partialSuggestionIds.length === 0) {
      return [];
    }

    const query = `SELECT id FROM threats 
      WHERE model_id = $1::uuid AND (${partialSuggestionIds
        .map((_, i) => `suggestion_id LIKE $${i + 2}::varchar`)
        .join(" OR ")}) AND deleted_at IS NULL`;
    const sanitized = partialSuggestionIds.map(
      (psi) => `%${psi.replace("%", "").replace("'", "")}`
    );
    const res = await this.pool.query(query, [modelId, ...sanitized]);
    return res.rows.map((r) => r.id);
  }

  async _getLinkedThreatOrControl(modelId: string, suggestionId: SuggestionID) {
    if (suggestionId.isThreat) {
      const query =
        "SELECT * FROM threats WHERE model_id = $1::uuid and suggestion_id = $2::varchar";
      const res = await this.pool.query(query, [modelId, suggestionId.val]);
      return convertToThreat(res.rows[0]);
    } else {
      const query =
        "SELECT * FROM controls WHERE model_id = $1::uuid and suggestion_id = $2::varchar";
      const res = await this.pool.query(query, [modelId, suggestionId.val]);
      return convertToControl(res.rows[0]);
    }
  }
}
