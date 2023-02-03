/**
 * Removes a target role from the user's token. Useful for debugging authorization.
 * Only allows removing authorization, not adding. For security :)
 *
 *
 * Examples:
 * GET /api/v1/admin/drop_role?role=admin
 * GET /api/v1/admin/drop_role?role=admin,reviewer
 *
 * Useful to drop any special role:
 * http://localhost:8080/api/v1/admin/drop_role?role=reviewer,admin
 * @exports {function} handler
 */
import { Request, Response } from "express";
export default function dropRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dropRole.d.ts.map