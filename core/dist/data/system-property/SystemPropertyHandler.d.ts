import { RequestContext } from "../providers/RequestContext";
import { SystemProperty, SystemPropertyValue } from "./types";
import { SystemPropertyProvider } from "./SystemPropertyProvider";
export declare class SystemPropertyHandler {
    constructor();
    log: any;
    providers: SystemPropertyProvider[];
    properties: Map<string, SystemProperty>;
    providedBy: Map<string, SystemPropertyProvider>;
    /**
     * Register a SystemPropertyProvider to be used for fetching Context on a threat model
     * @param provider
     */
    registerSystemPropertyProvider(provider: SystemPropertyProvider): void;
    getProperties(): SystemProperty[];
    /**
     * Fetch all System Properties to do with a given model
     * @param model
     * @returns
     */
    contextualize(ctx: RequestContext, systemId: string, quick?: boolean): Promise<SystemPropertyValue[]>;
    /**
     * List systems based on Properties and their values. To avoid expensive lookups, this will only
     * work with system properties that are marked "batchFilterable"
     */
    listSystemsByFilters(ctx: RequestContext, filters: {
        propertyId: string;
        value: any;
    }[]): Promise<string[]>;
}
//# sourceMappingURL=SystemPropertyHandler.d.ts.map