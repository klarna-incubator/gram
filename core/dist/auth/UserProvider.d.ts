import { RequestContext } from "../data/providers/RequestContext";
import { Provider } from "../data/providers/Provider";
import { User } from "./models/User";
export interface UserProvider extends Provider {
    lookup(ctx: RequestContext, userIds: string[]): Promise<User[]>;
}
//# sourceMappingURL=UserProvider.d.ts.map