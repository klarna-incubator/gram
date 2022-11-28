/**
 * GET /api/v1/systems
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { DataAccessLayer } from "../../../../data/dal";
import { ReviewSystemCompliance } from "../../../../data/reviews/ReviewSystemCompliance";
import {
  SystemListFilter,
  SystemListResult,
  systemProvider,
} from "../../../../data/systems/systems";

export default (dal: DataAccessLayer) => async (req: Request, res: Response) => {
  const { filter, page, pagesize, ...opts } = req.query;

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
  if (opts.search) {
    validatedOpts.search = opts.search.toString(); // Sanitized by list function
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
