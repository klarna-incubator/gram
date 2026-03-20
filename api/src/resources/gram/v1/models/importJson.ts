import { Permission } from "@gram/core/dist/auth/authorization.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ModelExportPayload } from "@gram/core/dist/data/models/ModelTransfer.js";
import { Request, Response } from "express";
import { ImportJsonRequestSchema } from "./jsonTransferSchema.js";

const MAX_IMPORT_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { targetModelId, payload } = ImportJsonRequestSchema.parse(req.body);
    const normalizedPayload: ModelExportPayload = {
      ...payload,
      modelData: {
        ...payload.modelData,
        components: payload.modelData.components.map((component) => ({
          ...component,
          systems: Array.isArray(component.systems)
            ? component.systems.filter(
                (system): system is string => typeof system === "string"
              )
            : component.systems,
        })),
      },
    };
    if (
      Buffer.byteLength(JSON.stringify(normalizedPayload), "utf8") >
      MAX_IMPORT_PAYLOAD_BYTES
    ) {
      res.status(413).json({ error: "Import payload is too large." });
      return;
    }

    await req.authz.hasPermissionsForModelId(targetModelId, Permission.Write);

    const result = await dal.modelTransferService.importModel(
      normalizedPayload,
      {
        mode: "in-place",
        targetModelId,
        importedBy: req.user.sub,
      }
    );

    await dal.modelService.logAction(
      req.user.sub,
      result.modelId,
      "import-json"
    );
    res.json(result);
  };
