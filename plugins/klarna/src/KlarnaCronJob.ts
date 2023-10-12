import log4js from "log4js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { convertToReview } from "@gram/core/dist/data/reviews/ReviewDataService.js";
import {
  KlarnaReviewerProvider,
  fallbackReviewer,
} from "./KlarnaReviewerProvider.js";
import * as Sentry from "@sentry/node";
import cron from "node-cron";
import { OctaneSystemProvider } from "./index.js";
import { LDAPCache } from "@gram/ldap/dist/index.js";

const MEETING_REQUESTED_REMIND_FOR_EVERY_X_DAYS = 60;
const REQUESTED_REMIND_AFTER_X_DAYS = 14;
const REASSIGN_REVIEW_AFTER_X_DAYS = 28;

function differenceInDays(dateToCompare: Date) {
  const date2 = new Date().getTime();
  const diffTime = Math.abs(date2 - dateToCompare.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

const log = log4js.getLogger("klarnaCronJob");

export class KlarnaCronJob {
  constructor(private dal: DataAccessLayer) {}

  async scheduleJob(
    monitorSlug: string,
    crontab: string,
    jobFunction: Function
  ) {
    cron.schedule(crontab, async () => {
      const checkInId = Sentry.captureCheckIn(
        {
          monitorSlug,
          status: "in_progress",
        },
        {
          schedule: {
            // Specify your schedule options here
            type: "crontab",
            value: crontab,
          },
          /* Number of minutes before a check-in is considered missed. */
          checkinMargin: 2,
          /* Number of a minutes before an in-progress check-in is marked timed out. */
          maxRuntime: 5,
        }
      );
      try {
        await jobFunction();
        Sentry.captureCheckIn({
          checkInId,
          monitorSlug,
          status: "ok",
        });
      } catch (err) {
        Sentry.captureCheckIn({
          checkInId,
          monitorSlug,
          status: "error",
        });
        Sentry.captureException(err);
        log.error(err);
      }
    });
    log.info(`${monitorSlug} cronjob schedule for ${crontab}`);
  }

  async sendRemindersForMeetingRequested() {
    const query = `SELECT * from reviews 
                  WHERE status = $1 
                  AND meeting_requested_at < current_date - $2::integer`;

    const reviews = (
      await this.dal.pool.query(query, [
        ReviewStatus.MeetingRequested,
        MEETING_REQUESTED_REMIND_FOR_EVERY_X_DAYS,
      ])
    ).rows;

    for (const reviewRow of reviews) {
      const review = convertToReview(reviewRow);
      if (!review.meetingRequestedAt) {
        continue;
      }
      if (review.meetingRequestedReminderSentCount > 0) {
        const daysFromLastReminder = differenceInDays(
          review.meetingRequestedAt
        );
        const nextReminderDays =
          MEETING_REQUESTED_REMIND_FOR_EVERY_X_DAYS *
          (review.meetingRequestedReminderSentCount + 1);
        if (daysFromLastReminder != nextReminderDays) {
          continue;
        }
      }

      // As a precaution, update the review before sending the email,
      // in case the email fails somehow and does not get saved as reminded (to avoid spam)
      const updateQuery = `UPDATE reviews 
      SET meeting_requested_reminder_sent_count=$1 
      WHERE model_id=$2`;
      await this.dal.pool.query(updateQuery, [
        review.meetingRequestedReminderSentCount + 1,
        review.modelId,
      ]);

      await this.dal.notificationService.queue({
        templateKey: "review-meeting-requested-reminder",
        params: {
          review,
        },
      });
    }
  }

  async sendRemindersForRequested() {
    const query = `SELECT * from reviews 
                  WHERE status = $1 
                  AND requested_at IS NOT NULL AND requested_at < current_date - $2::integer
                  AND requested_reminder_sent_count = 0`;

    const reviews = (
      await this.dal.pool.query(query, [
        ReviewStatus.Requested,
        REQUESTED_REMIND_AFTER_X_DAYS,
      ])
    ).rows;

    log.info(`Found ${reviews.length} reviews that need a requested reminder.`);

    const nids: number[] = [];
    for (const reviewRow of reviews) {
      const review = convertToReview(reviewRow);

      // As a precaution, update the review before sending the email,
      // in case the email fails somehow and does not get saved as reminded (to avoid spam)
      const updateQuery = `UPDATE reviews await
      SET requested_reminder_sent_count=$1 
      WHERE model_id=$2`;
      await this.dal.pool.query(updateQuery, [
        review.requestedReminderSentCount + 1,
        review.modelId,
      ]);

      const nid = await this.dal.notificationService.queue({
        templateKey: "review-requested-reminder",
        params: {
          review,
        },
      });

      nids.push(nid);
    }
    log.info(`Sent reminders with notification ids [${nids}]`);
  }

  async reassignOverdueReviews() {
    // Check updated_at as well to avoid constant reassignment back to secdev
    // once already reassigned.
    const query = `SELECT * from reviews 
                  WHERE status = $1 
                  AND requested_at IS NOT NULL 
                  AND requested_at < current_date - $2::integer
                  AND updated_at < current_date - $2::integer 
                  AND reviewed_by != $3`;

    const reviews = (
      await this.dal.pool.query(query, [
        ReviewStatus.Requested,
        REASSIGN_REVIEW_AFTER_X_DAYS,
        fallbackReviewer.sub,
      ])
    ).rows;

    log.info(`Found ${reviews.length} reviews that need reassignment.`);

    for (const reviewRow of reviews) {
      const review = convertToReview(reviewRow);

      await this.dal.reviewService.changeReviewer(
        review.modelId,
        fallbackReviewer.sub
      );
    }

    log.info(
      `Reassigned ${reviews.length} reviews to ${fallbackReviewer.name}`
    );
  }

  async bootstrap(
    reviewerProvider: KlarnaReviewerProvider,
    systemProvider: OctaneSystemProvider
  ) {
    // runs every day at 06:00 AM
    this.scheduleJob("reminder-meeting-requested", "0 6 * * *", async () =>
      this.sendRemindersForMeetingRequested()
    );
    this.scheduleJob("reminder-review-requested", "0 6 * * *", async () =>
      this.sendRemindersForRequested()
    );
    this.scheduleJob("overdue-review-reassignment", "0 6 * * *", async () =>
      this.reassignOverdueReviews()
    );

    // runs every 30 minutes
    this.scheduleJob(
      "preload-reviewers",
      "*/30 * * * *",
      async () => await reviewerProvider.preloadReviewers()
    );

    // runs every 10 minutes
    this.scheduleJob(
      "load-systems",
      "*/10 * * * *",
      async () => await systemProvider.loadSystems()
    );

    // runs every 30 minutes
    this.scheduleJob("ldapcache-expire", "*/30 * * * *", async () =>
      LDAPCache.expire()
    );
  }
}
