// Taken from https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
import crypto from "crypto";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { OIDCUserStore, OIDCUserInfo } from "./OIDCUserStore.js";

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
      Buffer.from(iv, "base64"),
      { authTagLength: 16 }
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

// Shared utility functions for OIDC providers

/**
 * Extract groups from OIDC claims/user info data
 * @param data The data object containing group information
 * @param claimName The name of the claim/field containing groups
 * @returns Array of group names
 */
export function extractGroups(data: any, claimName: string): string[] {
  const groups = data[claimName];
  if (!groups) {
    return [];
  }

  if (Array.isArray(groups)) {
    return groups.map((g) => g.toString());
  }

  if (typeof groups === "string") {
    return [groups];
  }

  return [];
}

/**
 * Retrieve user info from the OIDC user store with standard validation and logging
 * @param dal Data access layer instance
 * @param userId User identifier (sub or email)
 * @param log Logger instance
 * @returns User info or null if not found/invalid
 */
export async function getUserInfo(
  dal: DataAccessLayer,
  userId: string,
  log: any
): Promise<OIDCUserInfo | null> {
  try {
    const userStore = OIDCUserStore.getInstance(dal);
    const userInfo = await userStore.getUser(userId);

    if (!userInfo) {
      log.debug(`No stored user info found for user ${userId}`);
      return null;
    }

    // Validate that stored user info matches requested user
    if (userInfo.sub !== userId && userInfo.email !== userId) {
      log.debug(`Stored user info doesn't match requested userId ${userId}`);
      return null;
    }

    log.debug(`Found stored user info for user ${userId}`, {
      groupCount: userInfo.groups?.length || 0,
    });

    return userInfo;
  } catch (error) {
    log.error(`Error fetching user info for ${userId}:`, error);
    return null;
  }
}
