import { Role } from "@gram/core/dist/auth/models/Role.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { InvalidInputError } from "@gram/core/dist/util/errors.js";
import { Request, Response } from "express";
import { z } from "zod";

const SetSystemIdSchema = z.object({
  systemId: z.string().max(255).nullable(),
});

/**
 * PATCH /api/v1/models/{id}/set-system-id
 * @exports {function} handler
 */
export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    req.authz.is(Role.Admin);

    const id = req.params.id;
    const { systemId } = SetSystemIdSchema.parse(req.body);

    if (
      systemId !== null && // Setting to null is allowed - it just removes the system connection
      dal.systemProvider.getSystem({ currentRequest: req }, systemId) === null
    ) {
      throw new InvalidInputError("System not found");
    }

    const result = await dal.modelService.setSystemId(id, systemId);
    return res.json({ result });
  };
