import System from "./System";
import { SystemProvider } from "./SystemProvider";
export declare enum SystemListFilter {
    Batch = "batch",
    Search = "search",
    Team = "team"
}
export type SystemListInput = {
    filter: SystemListFilter.Search;
    opts: {
        search: string;
    };
} | {
    filter: SystemListFilter.Batch;
    opts: {
        ids: string[];
    };
} | {
    filter: SystemListFilter.Team;
    opts: {
        teamId: string;
    };
};
export type SystemListResult = {
    systems: System[];
    total: number;
};
export interface SystemOwner {
    id: string;
    name: string;
}
export declare let systemProvider: SystemProvider;
export declare function setSystemProvider(newSystemProvider: SystemProvider): void;
//# sourceMappingURL=systems.d.ts.map