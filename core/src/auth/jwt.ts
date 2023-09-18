import jsonwebtoken, {
  JsonWebTokenError,
  SignOptions,
  VerifyOptions,
} from "jsonwebtoken";
import { UserToken } from "./models/UserToken";
import { config } from "../config";

const globalOpts: VerifyOptions & SignOptions = {
  algorithm: "HS512",
};

let cachedSecret: string | undefined = "";
async function getSecret(): Promise<string> {
  if (!cachedSecret) {
    cachedSecret = await config.jwt.secret.auth.getValue();
    if (!cachedSecret || cachedSecret.length < 64) {
      // byte == 2 chars
      throw new Error(
        `Secret length should not be less than 256 bits of security (32 bytes => expecting a 64 character long hexadecimal string, but was ${
          (cachedSecret || "").length
        } long)`
      );
    }
  }
  return cachedSecret;
}

export async function generateToken(
  payload: object,
  ttl: number = config.jwt.ttl
) {
  const requiredClaims = {
    iss: "gram",
  };

  const finalClaims = { ...payload, ...requiredClaims };
  const secret = await getSecret();
  const token = jsonwebtoken.sign(finalClaims, secret, {
    expiresIn: ttl,
    ...globalOpts,
  });
  return token;
}

export async function validateToken(token: string): Promise<UserToken> {
  const secret = await getSecret();
  const result = jsonwebtoken.verify(token, secret, globalOpts);
  if (typeof result === "string") {
    // For some reason jsonwebtoken can return a string when verifying, which we dont want.
    throw new JsonWebTokenError(
      "invalid token, verify returned a string not object"
    );
  }
  return <UserToken>result;
}
