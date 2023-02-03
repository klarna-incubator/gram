/// <reference types="node" />
import { IncomingMessage } from "http";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
export interface AuthenticatedIncomingMessage extends IncomingMessage {
    user: UserToken;
}
//# sourceMappingURL=types.d.ts.map