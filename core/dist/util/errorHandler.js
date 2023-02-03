"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
const AuthzError_1 = require("../auth/AuthzError");
const errors_1 = require("./errors");
const log = (0, logger_1.getLogger)("app");
function errorHandler(err, req, res, next) {
    if (err instanceof errors_1.NotAuthenticatedError) {
        res.status(401);
        log.warn(err);
    }
    else if (err instanceof AuthzError_1.AuthzError) {
        res.status(403);
        log.warn(err); // Might be due to expired session, so not error worthy.
    }
    else if (err instanceof errors_1.NotFoundError) {
        res.status(404);
        log.info(err); // Happens on model not found etc, not necessarily an error.
    }
    else if (err instanceof errors_1.InvalidInputError) {
        res.status(400);
        log.error(err, { errorHandled: true });
    }
    else {
        res.status(500);
        log.error(err, { errorHandled: true });
    }
    if (["test", "development"].includes(process.env.NODE_ENV)) {
        res.send(JSON.stringify(err));
    }
    else {
        res.send("Something went wrong.");
    }
}
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map