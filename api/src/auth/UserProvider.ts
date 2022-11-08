import { Provider } from "../util/provider";
import { User } from "./models/User";

export interface UserProvider extends Provider {
  lookup(userIds: string[]): Promise<User[]>;
}
