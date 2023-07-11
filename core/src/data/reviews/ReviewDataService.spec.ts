import { Pool } from "pg";
import { randomUUID } from "crypto";
import { DataAccessLayer } from "../dal";
import { createPostgresPool } from "../postgres";
import { _deleteAllTheThings } from "../utils";
import { Review, ReviewStatus } from "./Review";
import { ReviewDataService } from "./ReviewDataService";
import { createSampleModel } from "../../test-util/model";
import { testReviewerProvider } from "../../test-util/sampleReviewer";

describe("ReviewDataService implementation", () => {
  let pool: Pool;
  let dal: DataAccessLayer;
  let data: ReviewDataService;
  let modelId: string;
  let notificationQueue: jest.SpyInstance;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = new ReviewDataService(pool, dal);
    notificationQueue = jest.spyOn(dal.notificationService, "queue");
    await _deleteAllTheThings(pool);
    dal.reviewerHandler.setReviewerProvider(testReviewerProvider);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(pool);

    /** Set up test model needed for review **/
    modelId = await createSampleModel(dal);
  });

  afterEach(() => {
    notificationQueue.mockReset();
  });

  afterAll(async () => {
    notificationQueue.mockRestore();
    await pool.end();
  });

  describe("getByModelId", () => {
    it("should return a valid review", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      review.note = "Good review";
      await data.create(review);

      const fetched = await data.getByModelId(modelId);
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.modelId).toBe(modelId);
      expect(fetched?.note).toEqual("Good review");
      expect(fetched?.status).toEqual(ReviewStatus.Requested);
      expect(fetched?.reviewedBy).toEqual("");

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.createdAt.getTime()).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt.getTime()).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt.getTime()).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt.getTime()).toBeGreaterThan(yesterday.getTime());
      expect(notificationQueue.mock.calls.length).toBe(1);
    });

    it("should return null value by default", async () => {
      const review = await data.getByModelId(randomUUID());
      expect(review).toBe(null);
    });
  });

  describe("getByModelId", () => {
    it("should return valid review associated to a model", async () => {
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      review.note = "Good review";
      await data.create(review);

      const fetched = await data.getByModelId(modelId);

      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.modelId).toBe(modelId);
      expect(fetched?.note).toEqual("Good review");
      expect(fetched?.status).toEqual(ReviewStatus.Requested);
      expect(fetched?.reviewedBy).toEqual("");

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.createdAt.getTime()).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt.getTime()).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt.getTime()).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt.getTime()).toBeGreaterThan(yesterday.getTime());
    });

    it("should returns empty when no reviews exist for model", async () => {
      const review = await data.getByModelId(modelId);
      expect(review).toEqual(null);
    });
  });

  describe("list", () => {
    it("should return valid reviews by reviewer", async () => {
      const review = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      review.note = "Good review";
      await data.create(review);

      const review2 = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      review2.note = "Another good review";
      await data.create(review2);

      const review3 = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "another-reviewer"
      );
      review3.note = "Another review";
      await data.create(review3);

      const result = await data.list(
        {},
        {
          reviewedBy: "some-reviewer",
        }
      );

      expect(
        result.items.some((r) => r.modelId === review.modelId)
      ).toBeTruthy();
      expect(
        result.items.some((r) => r.modelId === review2.modelId)
      ).toBeTruthy();
      expect(
        result.items.some((r) => r.modelId === review3.modelId)
      ).toBeFalsy();
      expect(result.items.length).toEqual(2);

      const fetched = result.items[0];
      expect(fetched?.modelId).toBe(review.modelId);
      expect(fetched?.note).toEqual("Good review");
      expect(fetched?.status).toEqual(ReviewStatus.Requested);
      expect(fetched?.reviewedBy).toEqual("some-reviewer");

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.createdAt?.getTime()).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt?.getTime()).toBeGreaterThan(
        yesterday.getTime()
      );
      expect(fetched?.updatedAt?.getTime()).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt?.getTime()).toBeGreaterThan(
        yesterday.getTime()
      );
    });

    it("should return valid reviews by requester", async () => {
      const review = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      review.note = "Good review";
      await data.create(review);

      const review2 = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      review2.note = "Another good review";
      await data.create(review2);

      const review3 = new Review(
        await createSampleModel(dal),
        "another-user",
        ReviewStatus.Requested,
        "another-reviewer"
      );
      review3.note = "Another review";
      await data.create(review3);

      const result = await data.list(
        {},
        {
          requestedBy: "some-user",
        }
      );

      expect(
        result.items.some((r) => r.modelId === review.modelId)
      ).toBeTruthy();
      expect(
        result.items.some((r) => r.modelId === review2.modelId)
      ).toBeTruthy();
      expect(
        result.items.some((r) => r.modelId === review3.modelId)
      ).toBeFalsy();
      expect(result.items.length).toEqual(2);
    });

    it("should return valid reviews by statuses", async () => {
      const review = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      review.note = "Good review";
      await data.create(review);

      const review2 = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Canceled,
        "some-reviewer"
      );
      review2.note = "Another good review";
      await data.create(review2);

      const review3 = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Approved,
        "another-reviewer"
      );
      review3.note = "Another review";
      await data.create(review3);

      const statuses = [ReviewStatus.Requested, ReviewStatus.Canceled];
      const result = await data.list(
        {},
        {
          statuses,
        }
      );

      expect(
        result.items.some((r) => r.modelId === review.modelId)
      ).toBeTruthy();
      expect(
        result.items.some((r) => r.modelId === review.modelId)
      ).toBeTruthy();
      expect(result.items.length).toEqual(2);
    });

    it("should combine multiple filters", async () => {
      const review = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      review.note = "Good review";
      await data.create(review);

      const review2 = new Review(
        await createSampleModel(dal),
        "some-user",
        ReviewStatus.Canceled,
        "some-reviewer"
      );
      review2.note = "Another good review";
      await data.create(review2);

      const review3 = new Review(
        await createSampleModel(dal),
        "another-user",
        ReviewStatus.Approved,
        "another-reviewer"
      );
      review3.note = "Another review";
      await data.create(review3);

      const statuses = [ReviewStatus.Approved, ReviewStatus.Canceled];
      const result = await data.list(
        {},
        {
          statuses,
          reviewedBy: "another-reviewer",
          requestedBy: "another-user",
        }
      );

      expect(
        result.items.some((r) => r.modelId === review3.modelId)
      ).toBeTruthy();
      expect(result.items.length).toEqual(1);
    });

    it("should support pagination", async () => {
      for (let i = 0; i < 11; i++) {
        const review = new Review(
          await createSampleModel(dal),
          "some-user",
          ReviewStatus.Requested,
          "some-reviewer"
        );
        review.note = "Good review";
        await data.create(review);
      }

      let result = await data.list({}, {});
      expect(result.items.length).toEqual(10); // Should not be hardcoded ideally == pagesize
      expect(result.total).toEqual(11);

      result = await data.list({}, {}, 2);
      expect(result.items.length).toEqual(1);
      expect(result.total).toEqual(11);
    });

    it("should returns empty when no reviews exist for model", async () => {
      const result = await data.list(
        {},
        { reviewedBy: "some-unknown-reviewer" }
      );
      expect(result.total).toEqual(0);
      expect(result.items).toEqual([]);
    });
  });

  describe("cancel", () => {
    it("should update status to Canceled", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      review.requestedAt = new Date(2000, 1, 1);
      await data.create(review);
      expect(notificationQueue.mock.calls.length).toBe(1);
      const res = await data.cancel(modelId);
      expect(notificationQueue.mock.calls.length).toBe(2);
      expect(res).toBeTruthy();

      const updatedReview = await data.getByModelId(modelId);
      expect(updatedReview?.status).toEqual(ReviewStatus.Canceled);
      expect(updatedReview?.requestedAt?.getFullYear()).toEqual(
        new Date(Date.now()).getFullYear()
      );
    });

    it("should return false on no matching review", async () => {
      const fakeId = randomUUID();
      const res = await data.cancel(fakeId);
      expect(res).toBeFalsy();
    });
  });

  describe("decline", () => {
    it("should update status to Requested", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      await data.create(review);
      expect(notificationQueue.mock.calls.length).toBe(1);
      const res = await data.decline({}, review.modelId);
      expect(notificationQueue.mock.calls.length).toBe(2);
      expect(res).toBeTruthy();

      const updatedReview = await data.getByModelId(review.modelId);
      expect(updatedReview!.status).toEqual(ReviewStatus.Requested);
    });

    it("should return false on no matching review", async () => {
      const fakeId = randomUUID();
      const res = await data.decline({}, fakeId);
      expect(res).toBeFalsy();
    });
  });

  describe("approve", () => {
    it("should update status to Approved", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      await data.create(review);
      expect(notificationQueue.mock.calls.length).toBe(1);
      const res = await data.approve(review.modelId);
      expect(notificationQueue.mock.calls.length).toBe(2);
      expect(res).toBeTruthy();

      const updatedReview = await data.getByModelId(review.modelId);
      expect(updatedReview!.status).toEqual(ReviewStatus.Approved);
    });

    it("should return false on no matching review", async () => {
      const fakeId = randomUUID();
      const res = await data.approve(fakeId);
      expect(res).toBeFalsy();
    });
  });

  describe("requestMeeting", () => {
    it("should update status to meeting-requested", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      await data.create(review);
      expect(notificationQueue.mock.calls.length).toBe(1);
      const res = await data.requestMeeting(review.modelId);
      expect(notificationQueue.mock.calls.length).toBe(2);
      expect(res).toBeTruthy();

      const updatedReview = await data.getByModelId(review.modelId);
      expect(updatedReview!.status).toEqual(ReviewStatus.MeetingRequested);
    });

    it("should return false on no matching review", async () => {
      const fakeId = randomUUID();
      const res = await data.requestMeeting(fakeId);
      expect(res).toBeFalsy();
    });
  });

  describe("changeReviewer", () => {
    it("should change reviewer", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(
        modelId,
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      await data.create(review);
      expect(notificationQueue.mock.calls.length).toBe(1);
      const res = await data.changeReviewer(review.modelId, "someone-else");
      expect(notificationQueue.mock.calls.length).toBe(2);
      expect(res).toBeTruthy();

      const updatedReview = await data.getByModelId(review.modelId);
      expect(updatedReview!.status).toEqual(ReviewStatus.Requested);
      expect(updatedReview!.reviewedBy).toEqual("someone-else");
    });

    it("should not send notification if the same reviewer", async () => {
      notificationQueue.mockImplementation(async () => 123);
      const review = new Review(
        modelId,
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      await data.create(review);
      expect(notificationQueue.mock.calls.length).toBe(1);
      const res = await data.changeReviewer(review.modelId, "some-reviewer");
      expect(notificationQueue.mock.calls.length).toBe(1); // Note: same number of notifications sent
      expect(res).toBeTruthy();

      const updatedReview = await data.getByModelId(review.modelId);
      expect(updatedReview!.status).toEqual(ReviewStatus.Requested);
      expect(updatedReview!.reviewedBy).toEqual("some-reviewer");
    });

    it("should return null on no matching review", async () => {
      const fakeId = randomUUID();
      const res = await data.changeReviewer(fakeId, "whoever");
      expect(res).toBeFalsy();
    });
  });

  describe("update", () => {
    it("should update note content", async () => {
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      await data.create(review);
      const res = await data.update(review.modelId, {
        note: "Some good new note content",
      });
      expect(res).toBeTruthy();

      const newNote = await data.getByModelId(review.modelId);
      expect(newNote!.note).toEqual("Some good new note content");
    });

    it("should be able to update existing review", async () => {
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      await data.create(review);
      const res = await data.update(modelId, {
        reviewedBy: "awesome-reviewer",
      });
      expect(res).toBeTruthy();

      const updated = await data.getByModelId(review.modelId);
      expect(updated!.reviewedBy).toEqual("awesome-reviewer");
    });

    it("should be able to update existing review", async () => {
      const review = new Review(modelId, "some-user", ReviewStatus.Requested);
      await data.create(review);
      const res = await data.update(review.modelId, {
        status: ReviewStatus.Approved,
      });
      expect(res).toBeTruthy();
    });

    it("should return false on no matching review", async () => {
      const res = await data.update(modelId, { status: ReviewStatus.Approved });
      expect(res).toBeFalsy();
    });
  });
});
