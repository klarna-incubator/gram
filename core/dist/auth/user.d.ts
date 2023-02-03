import { RequestContext } from "../data/providers/RequestContext";
import { User } from "./models/User";
import { UserProvider } from "./UserProvider";
export declare let userProvider: UserProvider;
export declare function setUserProvider(newUserProvider: UserProvider): void;
export declare function lookupUser(ctx: RequestContext, sub: string): Promise<User | null>;
export declare function lookupUsers(ctx: RequestContext, subs: Array<string>): Promise<User[]>;
//# sourceMappingURL=user.d.ts.map