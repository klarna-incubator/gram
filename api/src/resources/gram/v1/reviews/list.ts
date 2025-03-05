/**
 * GET /api/v1/reviews
 * @exports {function} handler
 */
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { validStatus } from "@gram/core/dist/data/reviews/ReviewDataService.js";
import { SystemPropertyFilter } from "@gram/core/dist/data/system-property/types.js";
import { Request, Response } from "express";
import _ from "lodash";

export default (dal: DataAccessLayer) =>
  async (req: Request, res: Response) => {
    const filters = {
      statuses: req.query["statuses"]
        ? req.query["statuses"]
            .toString()
            .split(",")
            .filter(validStatus)
            .map((s) => s as ReviewStatus)
        : [],
      properties: req.query["properties"]
        ? decodeURIComponent(req.query["properties"].toString())
            .split(",")
            .map((filter) => filter.split(":"))
            .filter((parts) => parts.length === 2)
            .map((parts) => {
              const filter: SystemPropertyFilter = {
                propertyId: parts[0],
                value: parts[1],
              };
              return filter;
            })
        : [],
      requestedBy: req.query["requestedBy"]
        ? req.query["requestedBy"].toString()
        : undefined,
      reviewedBy: req.query["reviewedBy"]
        ? req.query["reviewedBy"].toString()
        : undefined,
    };

    const dateOrder = req.query["date-order"] === "DESC" ? "DESC" : "ASC";
    const page = req.query["page"] ? parseInt(req.query["page"].toString()) : 0;

    const reviews = await dal.reviewService.list(
      { currentRequest: req },
      filters,
      page,
      dateOrder
    );

    const reslookupUsers = await dal.userHandler.lookup(
      { currentRequest: req },
      reviews.items
        .filter((review) => review.requestedBy)
        .map((review) => review.requestedBy as string)
    );
    const employees = reslookupUsers.map((employee) => ({
      requester: employee,
    }));

    const result = {
      total: reviews.total,
      items: _.merge(reviews.items, employees), // This might not merge correctly if the list of users !=
    };

    res.json(result);
    return;
  };
