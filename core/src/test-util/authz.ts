import { UserToken } from "../auth/models/UserToken";
import { sampleUser } from "./sampleUser";

export const genUser = (user?: Partial<UserToken>): UserToken => ({
  ...sampleUser,
  ...user,
});
