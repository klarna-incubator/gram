/// <reference types="node" />
import { Server } from "http";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { ModelWebsocketServer } from "./model";
export declare function attachWebsocketServer(server: Server, dal: DataAccessLayer): {
    wssRegistry: Map<string, ModelWebsocketServer>;
    cleanupInterval: NodeJS.Timeout;
};
//# sourceMappingURL=index.d.ts.map