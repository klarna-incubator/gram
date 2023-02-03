import System from "../data/systems/System";
import { SystemListInput, SystemListResult } from "../data/systems/systems";
import { RequestContext } from "../data/providers/RequestContext";
import { SystemProvider } from "../data/systems/SystemProvider";
export declare function getMockedSystemById(systemId: string): Promise<System | null>;
declare class TestSystemProvider implements SystemProvider {
    getSystem(ctx: RequestContext, systemId: string): Promise<System | null>;
    listSystems(ctx: RequestContext, input: SystemListInput, pagination: {
        page: number;
        pageSize: number;
    }): Promise<SystemListResult>;
    key: string;
}
export declare const testSystemProvider: TestSystemProvider;
export {};
//# sourceMappingURL=system.d.ts.map