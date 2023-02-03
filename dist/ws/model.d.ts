import WebSocket from "ws";
import { Permission } from "@gram/core/dist/auth/authorization";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import Model from "@gram/core/dist/data/models/Model";
export declare class ModelWebsocketServer {
    constructor(model: Model, dal: DataAccessLayer);
    id: string;
    model: Model;
    dal: DataAccessLayer;
    server: WebSocket.Server;
    log: any;
    VALID_TYPES: string[];
    /**
     * Determines in milliseconds the amount of time the server will wait
     * for a ping from the client before timing it out.
     */
    pingTimeoutMS: number;
    pingIntervalMS: number;
    wsUserMap: {
        ws: WebSocket;
        user: UserToken;
        permissions: Permission[];
    }[];
    get activeUsers(): {
        sub: string;
        name: string | undefined;
        picture: string | undefined;
    }[];
    tellClientsToRefetch(what: string, args: any): void;
    broadcast(sender: WebSocket | null, msg: any): void;
    sendPing(ws: WebSocket): void;
    publishUserList(): void;
    bind(): void;
    authenticate: (ws: WebSocket) => (data: any) => Promise<false | undefined>;
    validate: (sender: WebSocket, msg: any) => boolean;
    checkPermission: (sender: WebSocket, perm: Permission) => boolean;
    onTimeout: (timedoutWs: WebSocket) => void;
    onClose: (sender: WebSocket, skipPublish?: boolean) => void;
    onMessage: (sender: WebSocket, user: UserToken) => (data: any) => void;
}
//# sourceMappingURL=model.d.ts.map