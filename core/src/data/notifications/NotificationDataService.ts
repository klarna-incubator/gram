import { Notification, NotificationStatus } from "./Notification";
import { Pool } from "pg";
import { getLogger } from "../../logger";
import { DataAccessLayer } from "../dal";
import { NotificationInput } from "./NotificationInput";

function convertToNotification(row: any) {
  const model = new Notification(row.template_key, row.variables || {});
  model.id = row.id;
  model.type = row.type;
  model.status = row.status;
  model.createdAt = row.created_at * 1000;
  model.updatedAt = row.updated_at * 1000;
  model.sentAt = row.sent_at * 1000;
  return model;
}

export class NotificationDataService {
  constructor(private pool: Pool, private dal: DataAccessLayer) {}

  log = getLogger("NotificationDataService");

  /**
   * Queue a new notification to be sent out
   *
   * @param {NotificationInput} input - Type of filter to use
   * @returns {number} the id of the new notification
   */
  async queue(input: NotificationInput) {
    const template = this.dal.templateHandler.get(input.templateKey);

    if (!template) {
      this.log.warn(
        `Notification skipped, no such template: ${input.templateKey}`
      );
      return -1;
    }

    const variables = await template.fetchVariables(this.dal, input.params);

    const query = `
    INSERT INTO notifications (type, status, template_key, variables)
    VALUES ('email', 'new', $1::varchar, $2::json)
    RETURNING id;
   `;
    const res = await this.pool.query(query, [
      input.templateKey,
      JSON.stringify(variables),
    ]);

    this.log.debug(
      `Queued new mail ${input.templateKey} - ${JSON.stringify(input)}`
    );

    return parseInt(res.rows[0].id);
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
   * Polls and updates for 25 notifications to be sent.
   * @returns {Notification[]}
   */
  async pollNewNotifications() {
    const query = `
    UPDATE notifications 
    SET status = 'pending', updated_at = current_timestamp
    WHERE id in (
        SELECT id FROM notifications 
        WHERE status = 'new' 
        ORDER BY updated_at ASC
        LIMIT 25         
    )
    RETURNING *`;
    const res = await this.pool.query(query);
    return res.rows.map(convertToNotification);
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
    return res.rowCount > 0;
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
   * Truncates (aka deletes) all rows in then otification table.
   * ONLY USE IN TESTS
   */
  async _truncate() {
    await this.pool.query("TRUNCATE notifications;");
  }
}
