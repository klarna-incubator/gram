import { Notification, NotificationStatus } from "./Notification";
import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
import { NotificationInput } from "./NotificationInput";
export declare class NotificationDataService {
    private pool;
    private dal;
    constructor(pool: Pool, dal: DataAccessLayer);
    log: import("log4js").Logger;
    /**
     * Queue a new notification to be sent out
     *
     * @param {NotificationInput} input - Type of filter to use
     * @returns {number} the id of the new notification
     */
    queue(input: NotificationInput): Promise<number>;
    /**
     * Count number of notifications current marked as failed.
     */
    countFailures(): Promise<number>;
    /**
     * Count number of notifications that seem to have stalled (stuck in pending for longer than 24h)
     */
    countStalled(): Promise<number>;
    /**
     * Polls and updates for 25 notifications to be sent.
     * @returns {Notification[]}
     */
    pollNewNotifications(): Promise<Notification[]>;
    /**
     * Update many notifications at once to a specific status.
     * @param {number[]} ids
     * @param {NotificationStatus} status
     * @returns {boolean}
     */
    updateStatus(ids: number[], status: NotificationStatus): Promise<boolean>;
    /**
     * Fetch a single notification by its id.
     * @param {number} id
     * @returns {Notification}
     */
    getNotification(id: number): Promise<Notification>;
    /**
     * Truncates (aka deletes) all rows in then otification table.
     * ONLY USE IN TESTS
     */
    _truncate(): Promise<void>;
}
//# sourceMappingURL=NotificationDataService.d.ts.map