import { UserToken } from "../models/UserToken";
import { AuthProvider } from "../AuthProvider";
import { RequestContext } from "../../data/providers/RequestContext";
export default class MockAuthProvider implements AuthProvider {
    key: string;
    params(ctx: RequestContext): Promise<{}>;
    getIdentity(ctx: RequestContext): Promise<UserToken>;
}
//# sourceMappingURL=index.d.ts.map