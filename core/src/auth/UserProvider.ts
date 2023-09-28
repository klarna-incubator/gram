import { RequestContext } from "../data/providers/RequestContext.js";
import { Provider } from "../data/providers/Provider.js";
import { User } from "./models/User.js";

export interface UserProvider extends Provider {
  lookup(ctx: RequestContext, userIds: string[]): Promise<User[]>;
}
