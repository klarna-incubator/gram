import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { getLinks } from "./get.js";

import { insertLink } from "./post.js";
import { deleteLink } from "./delete.js";

export function linksRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", getLinks(dal));
  router.post("/", insertLink(dal));
  router.delete("/:linkId", deleteLink(dal));
  return router;
}
