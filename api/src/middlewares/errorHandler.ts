import log4js from "log4js";
import { AuthzError } from "@gram/core/dist/auth/AuthzError.js";
import {
  InvalidInputError,
  NotAuthenticatedError,
  NotFoundError,
} from "@gram/core/dist/util/errors.js";
import { ZodError } from "zod";

const log = log4js.getLogger("app");

export default function errorHandler(err: any, req: any, res: any, next: any) {
  if (err instanceof NotAuthenticatedError) {
    res.status(401);
    log.warn(err);
  } else if (err instanceof AuthzError) {
    res.status(403);
    log.warn(err); // Might be due to expired session, so not error worthy.
  } else if (err instanceof NotFoundError) {
    res.status(404);
    log.info(err); // Happens on model not found etc, not necessarily an error.
  } else if (err instanceof InvalidInputError || err instanceof ZodError) {
    res.status(400);
    log.error(err, { errorHandled: true });
  } else {
    res.status(500);
    log.error(err, { errorHandled: true });
  }
  if (["test", "development"].includes(process.env.NODE_ENV!)) {
    res.send(JSON.stringify(err));
  } else {
    res.send("Something went wrong.");
  }
}
