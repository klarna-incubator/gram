import { IncomingMessage } from "http";
import { UserToken } from "../auth/models/UserToken";

export interface AuthenticatedIncomingMessage extends IncomingMessage {
  user: UserToken;
}
