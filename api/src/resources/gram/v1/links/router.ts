import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import express from "express";
import { getLinks } from "./get.js";
import { errorWrap } from "../../../../util/errorHandler.js";
import { insertLink } from "./post.js";
import { deleteLink } from "./delete.js";

export function linksRouter(dal: DataAccessLayer): express.Router {
  const router = express.Router();
  router.get("/", errorWrap(getLinks(dal)));
  router.post("/", errorWrap(insertLink(dal)));
  router.delete("/:linkId", errorWrap(deleteLink(dal)));
  return router;
}
