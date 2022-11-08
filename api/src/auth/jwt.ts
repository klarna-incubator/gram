import config from "config";
import jsonwebtoken, {
  JsonWebTokenError,
  SignOptions,
  VerifyOptions,
} from "jsonwebtoken";
import secrets from "../secrets";
import { UserToken } from "./models/UserToken";

const globalOpts: VerifyOptions & SignOptions = {
  algorithm: "HS512",
};

const secretMap = new Map<string, string>();
async function getSecret(purpose: string): Promise<string> {
  let secret = secretMap.get(purpose);
  if (!secret) {
    secret = await secrets.get(`jwt.secret.${purpose}`);
    if (!secret || secret.length < 64) {
      // byte == 2 chars
      throw new Error(
        `Secret length should not be less than 256 bits of security (32 bytes => expecting a 64 character long hexadecimal string, but was ${secret.length} long)`
      );
    }
    secretMap.set(purpose, secret);
  }
  return secret;
}

export async function generateAuthToken(payload: UserToken) {
  return generateToken(payload, config.get("jwt.ttl"), "auth");
}
export async function validateAuthToken(token: string) {
  return validateToken(token, "auth");
}

export async function generateToken(
  payload: object,
  ttl: number = config.get("jwt.ttl") as number,
  purpose = "auth"
) {
  const requiredClaims = {
    iss: "gram",
  };

  const finalClaims = { ...payload, ...requiredClaims };
  const secret = await getSecret(purpose);
  const token = jsonwebtoken.sign(finalClaims, secret, {
    expiresIn: ttl,
    ...globalOpts,
  });
  return token;
}

export async function validateToken(
  token: string,
  purpose = "auth"
): Promise<UserToken> {
  const secret = await getSecret(purpose);
  const result = jsonwebtoken.verify(token, secret, globalOpts);
  if (typeof result === "string") {
    // For some reason jsonwebtoken can return a string when verifying, which we dont want.
    throw new JsonWebTokenError(
      "invalid token, verify returned a string not object"
    );
  }
  return <UserToken>result;
}
