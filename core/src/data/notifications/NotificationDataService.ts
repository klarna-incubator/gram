import log4js from "log4js";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import { Notification, NotificationStatus } from "./Notification.js";
import { NotificationInput } from "./NotificationInput.js";

function convertToNotification(row: any) {
  const model = new Notification(
    row.template_key,
    row.variables || {},
    row.type
  );
  model.id = row.id;
  model.status = row.status;
  model.createdAt = row.created_at * 1000;
  model.updatedAt = row.updated_at * 1000;
  model.sentAt = row.sent_at * 1000;
  return model;
}

export class NotificationDataService {
  constructor(private dal: DataAccessLayer) {
    this.pool = dal.pool;
  }

  private pool: GramConnectionPool;

  log = log4js.getLogger("NotificationDataService");

  /**
   * Queue a new notification event to be sent out. Fans out at queue time: creates
   * one row per currently-registered NotificationProvider, with each row's `type`
   * set to that provider's `key`. If zero providers are registered, creates no
   * rows at all - a channel added later never retroactively receives a backlog of
   * past events, since there was never a row created for it.
   *
   * The caller is responsible for resolving `input.variables` beforehand (e.g. via
   * ReviewDataService) - this just persists it verbatim, once, into every row it
   * creates.
   *
   * @param {NotificationInput} input - the event to queue
   * @returns {number[]} the ids of the rows created, one per registered provider (empty if none)
   */
  async queue(input: NotificationInput): Promise<number[]> {
    const providers = [...this.dal.notificationProviders.values()];

    if (providers.length === 0) {
      this.log.debug(
        `Notification skipped, no providers registered: ${input.templateKey}`
      );
      return [];
    }

    const variablesJson = JSON.stringify(input.variables);

    const ids = await this.pool.runTransaction(async (client) => {
      const insertedIds: number[] = [];
      for (const provider of providers) {
        const res = await client.query(
          `INSERT INTO notifications (type, status, template_key, variables)
           VALUES ($1::varchar, 'new', $2::varchar, $3::json)
           RETURNING id;`,
          [provider.key, input.templateKey, variablesJson]
        );
        insertedIds.push(parseInt(res.rows[0].id));
      }
      return insertedIds;
    });

    this.log.debug(
      `Queued new notification ${input.templateKey} for ${
        providers.length
      } provider(s) - ${JSON.stringify(input)}`
    );

    return ids;
  }

  /**
   * Count number of notifications current marked as failed.
   */
  async countFailures() {
    const query = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE status = 'failed'`;
    const res = await this.pool.query(query);
    return parseInt(res.rows[0].count);
  }

  /**
   * Count number of notifications that seem to have stalled (stuck in pending for longer than 24h)
   */
  async countStalled() {
    const query = `
          SELECT COUNT(*) as count FROM notifications 
          WHERE status = 'pending' and updated_at < (current_timestamp + interval '24 hour')`;
    const res = await this.pool.query(query);
    return parseInt(res.rows[0].count);
  }

  /**
   * Claims up to 25 rows in the given status (oldest first), moving them to
   * `pending` so they aren't picked up twice, and returns them for processing.
   */
  private async pollNotificationsByStatus(
    status: "new" | "failed"
  ): Promise<Notification[]> {
    const query = `
    UPDATE notifications
    SET status = 'pending', updated_at = current_timestamp
    WHERE id in (
        SELECT id FROM notifications
        WHERE status = $1
        ORDER BY updated_at ASC
        LIMIT 25
    )
    RETURNING *`;
    const res = await this.pool.query(query, [status]);
    return res.rows.map(convertToNotification);
  }

  /**
   * Polls and updates for 25 notifications to be sent.
   * @returns {Notification[]}
   */
  async pollNewNotifications(): Promise<Notification[]> {
    return this.pollNotificationsByStatus("new");
  }

  /**
   * Polls and claims up to 25 previously-failed notifications for a retry
   * attempt. Claiming moves them to `pending` first, same as
   * pollNewNotifications() - the caller processes them exactly like any other
   * row (route by `type`, attempt delivery, resolve to sent/failed/dropped).
   * @returns {Notification[]}
   */
  async pollFailedNotifications(): Promise<Notification[]> {
    return this.pollNotificationsByStatus("failed");
  }

  /**
   * Update many notifications at once to a specific status.
   * @param {number[]} ids
   * @param {NotificationStatus} status
   * @returns {boolean}
   */
  async updateStatus(ids: number[], status: NotificationStatus) {
    // parameterization for an array would not work. so we coerce everything into ints.
    const safeInString = ids.map((i: any) => parseInt(i)).join(",");
    const query = `UPDATE notifications 
    SET status = $1, 
    updated_at = current_timestamp
    ${status === "sent" ? ", sent_at = current_timestamp" : ""} 
    WHERE id IN (${safeInString})`;

    const res = await this.pool.query(query, [status]);
    return res.rowCount != null && res.rowCount > 0;
  }

  /**
   * Fetch a single notification by its id.
   * @param {number} id
   * @returns {Notification}
   */
  async getNotification(id: number) {
    const query = `SELECT * FROM notifications WHERE id = $1`;
    const res = await this.pool.query(query, [id]);
    return convertToNotification(res.rows[0]);
  }

  /**
   * Deletes every notification row created before the given cutoff, regardless of
   * its status - `sent`, `failed`, `dropped`, and even still-unresolved
   * `new`/`pending` rows are all in scope. This is a retention backstop, not a
   * substitute for countFailures()/countStalled(): those should catch problems
   * well before a row is old enough to be swept up here.
   * @param {Date} cutoff
   * @returns {number} the number of rows deleted
   */
  async deleteOlderThan(cutoff: Date): Promise<number> {
    const res = await this.pool.query(
      `DELETE FROM notifications WHERE created_at < $1`,
      [cutoff]
    );
    return res.rowCount ?? 0;
  }

  /**
   * Truncates (aka deletes) all rows in then otification table.
   * ONLY USE IN TESTS
   */
  async _truncate() {
    await this.pool.query("TRUNCATE notifications;");
  }
}
