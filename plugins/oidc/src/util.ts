// Taken from https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
import crypto from "crypto";

export const aes256gcm = (key: string) => {
  const ALGO = "aes-256-gcm";
  const keyBytes = Buffer.from(key, "base64");

  // encrypt returns base64-encoded ciphertext
  const encrypt = (str: string) => {
    // The `iv` for a given key must be globally unique to prevent
    // against forgery attacks. `randomBytes` is convenient for
    // demonstration but a poor way to achieve this in practice.
    //
    // See: e.g. https://csrc.nist.gov/publications/detail/sp/800-38d/final
    const iv = Buffer.from(crypto.randomBytes(12));
    const cipher = crypto.createCipheriv(ALGO, keyBytes, iv);

    // Hint: Larger inputs (it's GCM, after all!) should use the stream API
    let enc = cipher.update(str, "utf8", "base64");
    enc += cipher.final("base64");
    return [enc, iv.toString("base64"), cipher.getAuthTag().toString("base64")];
  };

  // decrypt decodes base64-encoded ciphertext into a utf8-encoded string
  const decrypt = (enc: string, iv: string, authTag: string) => {
    const decipher = crypto.createDecipheriv(
      ALGO,
      keyBytes,
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    let str = decipher.update(enc, "base64", "utf8");
    str += decipher.final("utf8");
    return str;
  };

  return {
    encrypt,
    decrypt,
  };
};

const publicKeyString = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApiA0/Hd2wsRNQ4hJ3MWB
nLuEGXjUdkqLPKAulSWUGhB/DqBgLal5UP3CXA6SzOzIHiuBAFNTXyfCyZNAMEV5
E6X07mSC78HSgshFcNN5PiAF6XrZig1UaC4YBYGn71Iu/LfCoD9fh5Iot/OubrOO
F8YFupYgDXNQyZHmSzmHbnRp1N+GMO0fkXoW4StOUbJLpiW8tgd4g3Sf/Pw+0N5E
7wNnPgJi8ABbqImuA0qKKAZnF2df3JaSWV+uFKZhZAqDxxcWkCr9DePh0jfpY8rY
ULQKvZSQx9rfKy0qP1DMRH/FwqLQPgbN3QJfJcp9Az1lCDczr1X4fxbVuZkLZ/wv
QwIDAQAB
-----END PUBLIC KEY-----`;

// Function to encrypt the message with AES-GCM and then encrypt the AES key with RSA public key
export function encryptWithPublicKeyString(message: string) {
  const aesKey = crypto.randomBytes(32); // AES-256 requires a 32-byte key
  const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  let encryptedMessage = cipher.update(message, "utf8", "base64");
  encryptedMessage += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  // Encrypt the AES key with the RSA public key
  const encryptedAESKey = crypto
    .publicEncrypt(publicKeyString, aesKey)
    .toString("base64");

  // Bundle encrypted message, IV, and authTag
  const bundle = {
    encryptedMessage,
    iv: iv.toString("base64"),
    authTag,
    encryptedAESKey,
  };

  return JSON.stringify(bundle);
}
