import { Provider } from "../providers/Provider";
import System from "./System";
import { SystemListInput, SystemListResult } from "./systems";
import { RequestContext } from "../providers/RequestContext";
export interface SystemProvider extends Provider {
    getSystem(ctx: RequestContext, systemId: string): Promise<System | null>;
    listSystems(ctx: RequestContext, input: SystemListInput, pagination: {
        page: number;
        pageSize: number;
    }): Promise<SystemListResult>;
}
//# sourceMappingURL=SystemProvider.d.ts.map