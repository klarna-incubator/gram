import { IncomingMessage } from "http";
import { UserToken } from "@gram/core/dist/auth/models/UserToken.js";

export interface AuthenticatedIncomingMessage extends IncomingMessage {
  user: UserToken;
}
