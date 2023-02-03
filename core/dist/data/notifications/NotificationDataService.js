"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDataService = void 0;
const Notification_1 = require("./Notification");
const logger_1 = require("../../logger");
function convertToNotification(row) {
    const model = new Notification_1.Notification(row.template_key, row.variables || {});
    model.id = row.id;
    model.type = row.type;
    model.status = row.status;
    model.createdAt = row.created_at * 1000;
    model.updatedAt = row.updated_at * 1000;
    model.sentAt = row.sent_at * 1000;
    return model;
}
class NotificationDataService {
    constructor(pool, dal) {
        this.pool = pool;
        this.dal = dal;
        this.log = (0, logger_1.getLogger)("NotificationDataService");
    }
    /**
     * Queue a new notification to be sent out
     *
     * @param {NotificationInput} input - Type of filter to use
     * @returns {number} the id of the new notification
     */
    queue(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = this.dal.templateHandler.get(input.templateKey);
            if (!template) {
                this.log.warn(`Notification skipped, no such template: ${input.templateKey}`);
                return -1;
            }
            const variables = yield template.fetchVariables(this.dal, input.params);
            const query = `
    INSERT INTO notifications (type, status, template_key, variables)
    VALUES ('email', 'new', $1::varchar, $2::json)
    RETURNING id;
   `;
            const res = yield this.pool.query(query, [
                input.templateKey,
                JSON.stringify(variables),
            ]);
            this.log.debug(`Queued new mail ${input.templateKey} - ${JSON.stringify(input)}`);
            return parseInt(res.rows[0].id);
        });
    }
    /**
     * Count number of notifications current marked as failed.
     */
    countFailures() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE status = 'failed'`;
            const res = yield this.pool.query(query);
            return parseInt(res.rows[0].count);
        });
    }
    /**
     * Count number of notifications that seem to have stalled (stuck in pending for longer than 24h)
     */
    countStalled() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
          SELECT COUNT(*) as count FROM notifications 
          WHERE status = 'pending' and updated_at < (current_timestamp + interval '24 hour')`;
            const res = yield this.pool.query(query);
            return parseInt(res.rows[0].count);
        });
    }
    /**
     * Polls and updates for 25 notifications to be sent.
     * @returns {Notification[]}
     */
    pollNewNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
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
            const res = yield this.pool.query(query);
            return res.rows.map(convertToNotification);
        });
    }
    /**
     * Update many notifications at once to a specific status.
     * @param {number[]} ids
     * @param {NotificationStatus} status
     * @returns {boolean}
     */
    updateStatus(ids, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // parameterization for an array would not work. so we coerce everything into ints.
            const safeInString = ids.map((i) => parseInt(i)).join(",");
            const query = `UPDATE notifications 
    SET status = $1, 
    updated_at = current_timestamp
    ${status === "sent" ? ", sent_at = current_timestamp" : ""} 
    WHERE id IN (${safeInString})`;
            const res = yield this.pool.query(query, [status]);
            return res.rowCount > 0;
        });
    }
    /**
     * Fetch a single notification by its id.
     * @param {number} id
     * @returns {Notification}
     */
    getNotification(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT * FROM notifications WHERE id = $1`;
            const res = yield this.pool.query(query, [id]);
            return convertToNotification(res.rows[0]);
        });
    }
    /**
     * Truncates (aka deletes) all rows in then otification table.
     * ONLY USE IN TESTS
     */
    _truncate() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query("TRUNCATE notifications;");
        });
    }
}
exports.NotificationDataService = NotificationDataService;
//# sourceMappingURL=NotificationDataService.js.map