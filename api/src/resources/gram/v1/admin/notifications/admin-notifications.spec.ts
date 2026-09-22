import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import request from "supertest";
import { createTestApp } from "../../../../../test-util/app.js";
import {
  sampleAdminToken,
  sampleUserToken,
} from "../../../../../test-util/sampleTokens.js";

const adminToken = await sampleAdminToken();
const userToken = await sampleUserToken();

describe("admin notifications endpoints", () => {
  let app: any;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    await dal.notificationService._truncate();
  });

  async function insertNotification({
    type = "fake",
    status = "new",
    templateKey = "review-approved",
    variables = { name: "hello" },
    createdAt,
  }: {
    type?: string;
    status?: "new" | "pending" | "sent" | "failed" | "dropped";
    templateKey?: string;
    variables?: Record<string, unknown>;
    createdAt?: string;
  } = {}): Promise<number> {
    const res = await dal.pool.query(
      `INSERT INTO notifications (type, status, template_key, variables, created_at)
       VALUES ($1, $2, $3, $4::json, COALESCE($5::timestamptz, current_timestamp))
       RETURNING id`,
      [type, status, templateKey, JSON.stringify(variables), createdAt ?? null]
    );
    return parseInt(res.rows[0].id, 10);
  }

  describe("GET /api/v1/admin/notifications", () => {
    it("401 unauthenticated", async () => {
      const res = await request(app).get("/api/v1/admin/notifications");
      expect(res.status).toBe(401);
    });

    it("403 for non-admin", async () => {
      const res = await request(app)
        .get("/api/v1/admin/notifications")
        .set("Authorization", userToken);
      expect(res.status).toBe(403);
    });

    it("200 for admin with envelope", async () => {
      const id = await insertNotification();
      const res = await request(app)
        .get("/api/v1/admin/notifications")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications).toHaveLength(1);
      expect(res.body.notifications[0]).toMatchObject({
        id,
        type: "fake",
        status: "new",
        templateKey: "review-approved",
      });
    });

    it("defaults pagination when limit and offset are omitted", async () => {
      await insertNotification();
      const res = await request(app)
        .get("/api/v1/admin/notifications")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
    });

    it("paginates with limit and offset", async () => {
      const first = await insertNotification({
        templateKey: "review-approved",
      });
      const second = await insertNotification({
        templateKey: "review-requested",
      });

      const page = await request(app)
        .get("/api/v1/admin/notifications?limit=1&offset=0")
        .set("Authorization", adminToken);
      expect(page.status).toBe(200);
      expect(page.body.notifications).toHaveLength(1);
      expect(page.body.notifications[0].id).toBe(second);

      const next = await request(app)
        .get("/api/v1/admin/notifications?limit=1&offset=1")
        .set("Authorization", adminToken);
      expect(next.status).toBe(200);
      expect(next.body.notifications).toHaveLength(1);
      expect(next.body.notifications[0].id).toBe(first);
    });

    it("filters by status", async () => {
      const failedId = await insertNotification({ status: "failed" });
      await insertNotification({ status: "sent" });

      const res = await request(app)
        .get("/api/v1/admin/notifications?status=failed")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      const ids = res.body.notifications.map((n: { id: number }) => n.id);
      expect(ids).toEqual([failedId]);
    });

    it("filters by template_key and type", async () => {
      const match = await insertNotification({
        type: "email",
        templateKey: "review-approved",
      });
      await insertNotification({
        type: "email",
        templateKey: "review-requested",
      });
      await insertNotification({
        type: "kep-notifier",
        templateKey: "review-approved",
      });

      const res = await request(app)
        .get(
          "/api/v1/admin/notifications?template_key=review-approved&type=email"
        )
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      const ids = res.body.notifications.map((n: { id: number }) => n.id);
      expect(ids).toEqual([match]);
    });

    it("filters by modelId, which lives inside the variables payload", async () => {
      const wanted = "11111111-1111-1111-1111-111111111111";
      const other = "22222222-2222-2222-2222-222222222222";
      const match = await insertNotification({
        variables: { model: { modelId: wanted, name: "wanted" } },
      });
      await insertNotification({
        variables: { model: { modelId: other, name: "other" } },
      });
      await insertNotification({ variables: {} });

      const res = await request(app)
        .get(`/api/v1/admin/notifications?modelId=${wanted}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      const ids = res.body.notifications.map((n: { id: number }) => n.id);
      expect(ids).toEqual([match]);
    });

    it("filters by createdAfter and createdBefore", async () => {
      const old = await insertNotification({
        createdAt: "2020-01-01T00:00:00Z",
      });
      const recent = await insertNotification({
        createdAt: "2030-01-01T00:00:00Z",
      });

      const after = await request(app)
        .get("/api/v1/admin/notifications?createdAfter=2025-01-01T00:00:00Z")
        .set("Authorization", adminToken);
      expect(after.status).toBe(200);
      expect(after.body.notifications.map((n: { id: number }) => n.id)).toEqual(
        [recent]
      );

      const before = await request(app)
        .get("/api/v1/admin/notifications?createdBefore=2025-01-01T00:00:00Z")
        .set("Authorization", adminToken);
      expect(before.status).toBe(200);
      expect(
        before.body.notifications.map((n: { id: number }) => n.id)
      ).toEqual([old]);
    });

    it("ANDs every filter together", async () => {
      const wanted = "33333333-3333-3333-3333-333333333333";
      const match = await insertNotification({
        type: "email",
        status: "failed",
        templateKey: "review-approved",
        variables: { model: { modelId: wanted } },
      });
      // Each of these differs from the match by exactly one filtered field.
      await insertNotification({
        type: "kep-notifier",
        status: "failed",
        templateKey: "review-approved",
        variables: { model: { modelId: wanted } },
      });
      await insertNotification({
        type: "email",
        status: "sent",
        templateKey: "review-approved",
        variables: { model: { modelId: wanted } },
      });
      await insertNotification({
        type: "email",
        status: "failed",
        templateKey: "review-requested",
        variables: { model: { modelId: wanted } },
      });
      await insertNotification({
        type: "email",
        status: "failed",
        templateKey: "review-approved",
        variables: {
          model: { modelId: "44444444-4444-4444-4444-444444444444" },
        },
      });

      const res = await request(app)
        .get(
          `/api/v1/admin/notifications?type=email&status=failed&template_key=review-approved&modelId=${wanted}`
        )
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      const ids = res.body.notifications.map((n: { id: number }) => n.id);
      expect(ids).toEqual([match]);
    });

    it("400 for an unsupported filter rather than silently ignoring it", async () => {
      const res = await request(app)
        .get("/api/v1/admin/notifications?modelID=oops")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
    });

    it("400 for invalid status", async () => {
      const res = await request(app)
        .get("/api/v1/admin/notifications?status=bogus")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("400 for invalid limit", async () => {
      const res = await request(app)
        .get("/api/v1/admin/notifications?limit=0")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
    });

    it("400 for oversized limit", async () => {
      const res = await request(app)
        .get("/api/v1/admin/notifications?limit=101")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/admin/notifications/:id", () => {
    it("401 unauthenticated", async () => {
      const res = await request(app).delete("/api/v1/admin/notifications/1");
      expect(res.status).toBe(401);
    });

    it("403 for non-admin", async () => {
      const res = await request(app)
        .delete("/api/v1/admin/notifications/1")
        .set("Authorization", userToken);
      expect(res.status).toBe(403);
    });

    it("400 for a non-numeric id", async () => {
      const res = await request(app)
        .delete("/api/v1/admin/notifications/not-an-id")
        .set("Authorization", adminToken);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("200 and deletes an existing notification", async () => {
      const id = await insertNotification();

      const res = await request(app)
        .delete(`/api/v1/admin/notifications/${id}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: 1 });

      const remaining = await dal.notificationService.listNotifications({
        limit: 10,
        offset: 0,
      });
      expect(remaining.map((n) => n.id)).not.toContain(id);
    });

    it("200 with result 0 when the notification does not exist", async () => {
      const res = await request(app)
        .delete("/api/v1/admin/notifications/999999")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ result: 0 });
    });
  });
});
