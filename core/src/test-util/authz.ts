import { UserToken } from "../auth/models/UserToken.js";
import { sampleUser } from "./sampleUser.js";

export const genUser = (user?: Partial<UserToken>): UserToken => ({
  ...sampleUser,
  ...user,
});
