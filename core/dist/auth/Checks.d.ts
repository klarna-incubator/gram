import { Role } from "../auth/models/Role";
import { UserToken } from "../auth/models/UserToken";
export declare class Checks {
    user: UserToken;
    constructor(user: UserToken);
    any(...roles: Role[]): boolean;
    all(...roles: Role[]): boolean;
    is(role: Role): boolean;
}
//# sourceMappingURL=Checks.d.ts.map