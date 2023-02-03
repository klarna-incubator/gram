import System from "@gram/core/dist/data/systems/System";
import { SystemListInput, SystemListResult } from "@gram/core/dist/data/systems/systems";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider";
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