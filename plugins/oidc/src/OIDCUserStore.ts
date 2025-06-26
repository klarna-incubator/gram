import log4js from "log4js";
import pg from "pg";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

const log = log4js.getLogger("OIDCUserStore");

export interface OIDCUserInfo {
  sub: string;
  email?: string;
  name?: string;
  groups?: string[];
}

/**
 * Simplified database store for OIDC users and their group memberships.
 * Replaces the complex claims storage with a focus on authorization needs.
 */
export class OIDCUserStore {
  private static instance: OIDCUserStore;
  private dal: DataAccessLayer;
  private pool: pg.Pool | null = null;

  private constructor(dal: DataAccessLayer) {
    this.dal = dal;
  }

  static getInstance(dal: DataAccessLayer): OIDCUserStore {
    if (!OIDCUserStore.instance) {
      OIDCUserStore.instance = new OIDCUserStore(dal);
    }
    return OIDCUserStore.instance;
  }

  private async getPool(): Promise<pg.Pool> {
    if (!this.pool) {
      this.pool = await this.dal.pluginPool("oidc");
    }
    return this.pool;
  }

  /**
   * Store user information and group memberships
   */
  async storeUser(userInfo: OIDCUserInfo): Promise<void> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      log.debug(`Storing user ${userInfo.sub}`);
      await client.query("BEGIN");

      // Upsert user
      await client.query(
        `INSERT INTO oidc_users (sub, email, name) 
         VALUES ($1, $2, $3)
         ON CONFLICT (sub) 
         DO UPDATE SET 
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           updated_at = CURRENT_TIMESTAMP`,
        [userInfo.sub, userInfo.email || null, userInfo.name || null]
      );

      // Clear existing groups for this user
      await client.query("DELETE FROM oidc_user_groups WHERE sub = $1", [
        userInfo.sub,
      ]);

      // Insert new groups if they exist
      if (userInfo.groups && userInfo.groups.length > 0) {
        // Deduplicate group names
        const uniqueGroups = Array.from(new Set(userInfo.groups));
        const groupInsertPromises = uniqueGroups.map((group) =>
          client.query(
            "INSERT INTO oidc_user_groups (sub, group_name) VALUES ($1, $2)",
            [userInfo.sub, group]
          )
        );
        await Promise.all(groupInsertPromises);
      }

      await client.query("COMMIT");
      log.debug(
        `Successfully stored user ${userInfo.sub} with ${
          userInfo.groups?.length || 0
        } groups`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      log.error(`Error storing user ${userInfo.sub}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve user information including groups by sub or email
   */
  async getUser(identifier: string): Promise<OIDCUserInfo | null> {
    try {
      const pool = await this.getPool();

      // Try to get user info by sub first
      let userResult = await pool.query(
        "SELECT * FROM oidc_users WHERE sub = $1",
        [identifier]
      );

      // If not found by sub, try by email
      if (userResult.rowCount === 0) {
        userResult = await pool.query(
          "SELECT * FROM oidc_users WHERE email = $1",
          [identifier]
        );

        if (userResult.rowCount === 0) {
          log.debug(`No user found with identifier ${identifier}`);
          return null;
        }

        log.debug(`User found by email for identifier ${identifier}`);
      } else {
        log.debug(`User found by sub for identifier ${identifier}`);
      }

      const userRow = userResult.rows[0];

      // Get user groups
      const groupsResult = await pool.query(
        "SELECT group_name FROM oidc_user_groups WHERE sub = $1 ORDER BY group_name",
        [userRow.sub]
      );

      const groups = groupsResult.rows.map((row) => row.group_name);

      const userInfo: OIDCUserInfo = {
        sub: userRow.sub,
        email: userRow.email,
        name: userRow.name,
        groups,
      };

      log.debug(
        `Retrieved user ${identifier} (sub: ${userRow.sub}) with ${groups.length} groups`
      );
      return userInfo;
    } catch (error) {
      log.error(`Error retrieving user ${identifier}:`, error);
      return null;
    }
  }

  /**
   * Remove user and all their group memberships
   */
  async removeUser(sub: string): Promise<void> {
    try {
      log.debug(`Removing user ${sub}`);
      const pool = await this.getPool();

      // Delete user (groups will be deleted automatically due to foreign key cascade)
      const result = await pool.query("DELETE FROM oidc_users WHERE sub = $1", [
        sub,
      ]);

      if (result.rowCount && result.rowCount > 0) {
        log.debug(`Successfully removed user ${sub}`);
      } else {
        log.debug(`No user found to remove with sub ${sub}`);
      }
    } catch (error) {
      log.error(`Error removing user ${sub}:`, error);
      throw error;
    }
  }

  /**
   * Get groups for a user
   */
  async getGroupsForUser(sub: string): Promise<string[]> {
    try {
      const pool = await this.getPool();

      const result = await pool.query(
        "SELECT group_name FROM oidc_user_groups WHERE sub = $1 ORDER BY group_name",
        [sub]
      );

      const groups = result.rows.map((row) => row.group_name);
      log.debug(`Retrieved ${groups.length} groups for user ${sub}`);
      return groups;
    } catch (error) {
      log.error(`Error retrieving groups for user ${sub}:`, error);
      return [];
    }
  }

  /**
   * Get all users in a specific group
   */
  async getUsersInGroup(groupName: string): Promise<string[]> {
    try {
      const pool = await this.getPool();

      const result = await pool.query(
        "SELECT sub FROM oidc_user_groups WHERE group_name = $1 ORDER BY sub",
        [groupName]
      );

      const users = result.rows.map((row) => row.sub);
      log.debug(`Retrieved ${users.length} users in group ${groupName}`);
      return users;
    } catch (error) {
      log.error(`Error retrieving users in group ${groupName}:`, error);
      return [];
    }
  }

  /**
   * Get all unique group names
   */
  async getAllUniqueGroups(): Promise<string[]> {
    try {
      const pool = await this.getPool();

      const result = await pool.query(
        "SELECT DISTINCT group_name FROM oidc_user_groups ORDER BY group_name"
      );

      const groups = result.rows.map((row) => row.group_name);
      log.debug(`Retrieved ${groups.length} unique groups`);
      return groups;
    } catch (error) {
      log.error(`Error retrieving unique groups:`, error);
      return [];
    }
  }

  /**
   * Clean up old users (optional method for maintenance)
   */
  async cleanupOldUsers(olderThanDays: number = 90): Promise<number> {
    try {
      log.debug(`Cleaning up users older than ${olderThanDays} days`);
      const pool = await this.getPool();

      const result = await pool.query(
        "DELETE FROM oidc_users WHERE updated_at < NOW() - ($1 || ' days')::INTERVAL",
        [olderThanDays]
      );

      const deletedCount = result.rowCount || 0;
      log.info(`Cleaned up ${deletedCount} old OIDC users`);
      return deletedCount;
    } catch (error) {
      log.error(`Error cleaning up old users:`, error);
      return 0;
    }
  }
}
