import request from "supertest";
import express from "express";

import cache from "./cache";

describe("auth middleware", () => {
  let counter = 0;
  const app = express();
  app.get("/cacheable", cache(), (req, res) =>
    res.json({ success: ++counter })
  );

  it("should return 200 on cacheable endpoint", async () => {
    const res = await request(app).get("/cacheable");
    expect(res.status).toBe(200);
  });

  it("should increment counter count to 2 on cacheable endpoint", async () => {
    const res = await request(app).get("/cacheable");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(2);
  });

  it("should return 200 on active cacheable endpoint and not increment counter count", async () => {
    const res = await request(app)
      .get("/cacheable")
      .set({ "x-data-cached": 1 });
    expect(res.status).toBe(200);
    expect(res.get("x-data-cached")).toBeTruthy();
    expect(res.body.success).toBe(2);
  });

  it("should still not increment counter count on active cacheable endpoint", async () => {
    const res = await request(app)
      .get("/cacheable")
      .set({ "x-data-cached": 1 });
    expect(res.status).toBe(200);
    expect(res.get("x-data-cached")).toBeTruthy();
    expect(res.body.success).toBe(2);
  });

  it("should reset cache on inactive cacheable endpoint and increment counter to 3", async () => {
    const res = await request(app).get("/cacheable");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(3);
  });

  it("should not increment counter count on active cacheable endpoint and return 3 again", async () => {
    const res = await request(app)
      .get("/cacheable")
      .set({ "x-data-cached": 1 });
    expect(res.status).toBe(200);
    expect(res.get("x-data-cached")).toBeTruthy();
    expect(res.body.success).toBe(3);
  });
});
