import { generateToken } from "@gram/core/dist/auth/jwt.js";
import {
  sampleAdmin,
  sampleOtherUser,
  sampleReviewer,
  sampleUser,
} from "./sampleUser.js";

export const sampleUserToken = async () =>
  "bearer " + (await generateToken(sampleUser));

export const sampleOtherUserToken = async () =>
  "bearer " + (await generateToken(sampleOtherUser));

export const sampleReviewerToken = async () =>
  "bearer " + (await generateToken(sampleReviewer));

export const sampleAdminToken = async () =>
  "bearer " + (await generateToken(sampleAdmin));
