/**
 * GET /api/v1/systems
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ReviewSystemCompliance } from "@gram/core/dist/data/reviews/ReviewSystemCompliance.js";
import {
  SystemListFilter,
  SystemListResult,
  systemProvider,
} from "@gram/core/dist/data/systems/systems.js";
import z from "zod";

const ListQuerySchema = z.object({
  filter: z.enum([SystemListFilter.Batch, SystemListFilter.Team]),
  page: z.string().optional(), // Marked as string due to coming from query
  pagesize: z.string().optional(),
  teamId: z.string().optional(),
  ids: z.string().optional(),
});

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const { filter, page, pagesize, ...opts } = ListQuerySchema.parse(
      req.query
    );

    if (
      !filter ||
      !Object.values<string>(SystemListFilter).includes(filter.toString())
    ) {
      return res.status(400).json("Invalid filter type.");
    }

    const validatedOpts: any = {};
    if (opts.teamId) {
      validatedOpts.teamId = opts.teamId.toString();
    }
    if (opts.ids) {
      validatedOpts.ids = opts.ids.toString().split(","); // Sanitized by list function
    }

    let pagination = { page: 0, pageSize: 10 };
    if (page || pagesize) {
      pagination = {
        page: page ? parseInt(page.toString()) : 0,
        pageSize: pagesize ? Math.min(parseInt(pagesize.toString()), 100) : 10,
      };
    }

    const result = await systemProvider.listSystems(
      { currentRequest: req },
      {
        filter: filter?.toString() as SystemListFilter,
        opts: validatedOpts,
      },
      pagination
    );

    // Find reviews and map latest approved one to the system.
    const complianceMap = await getComplianceStuff(result, dal);

    return res.json({
      systems: result.systems.map((system) => ({
        ...system.toJSON(),
        compliance: complianceMap.get(system.id)?.toJSON(),
      })),
      total: result.total,
      ...pagination,
    });
  };

async function getComplianceStuff(
  result: SystemListResult,
  dal: DataAccessLayer
) {
  const systemIds = result.systems.map((s) => s.id);
  const compliances = await dal.reviewService.getComplianceForSystems(
    systemIds
  );
  const resultMap = new Map<string, ReviewSystemCompliance>();
  compliances.forEach((c) => resultMap.set(c.SystemID, c));

  return resultMap;
}
