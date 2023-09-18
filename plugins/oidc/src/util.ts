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
