import { Application } from "express";
import request from "supertest";
import { createTestApp } from "../test-util/app.js";
import logger from "./logger.js";
import { jest } from "@jest/globals";

const logMock = {
  info: jest.fn(),
};

const loggerOpts = {
  logger: logMock,
  simplified: false,
  excludeKeys: {
    header: ["x-exclude-me"],
    body: ["excludedBody"],
    query: ["excludedQuery"],
    param: ["excludedParam"],
  },
  includeKeys: {
    header: ["x-include-me", "correlation-id"],
    body: ["includedBody"],
    query: [],
    param: [],
  },
};

describe("logger middleware", () => {
  let app: Application;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    app.post(
      "/logged-endpoint/:excludedParam/:id",
      logger(loggerOpts),
      (req: any, res: any) => res.end()
    );
  });

  it("should call log.info with logEvent arg", async () => {
    await request(app)
      .post("/logged-endpoint/1/1?sampleQuery=test&excludedQuery=1")
      .set("X-Exclude-Me", "1")
      .set("x-Include-Me", "1")
      .set("forgotten-secret-header", "1")
      .set("Correlation-Id", "123")
      .send({
        includedBody: "1",
        excludedBody: "1",
      })
      .expect(200);

    const logEvent = {
      method: "POST",
      originalUrl: "/logged-endpoint/1/1?sampleQuery=test&excludedQuery=1",
      path: "/logged-endpoint/1/1",
      srcIp: "::ffff:127.0.0.1",
      status: 200,
      latencyMs: expect.anything(),
      correlation_id: "123",
    };

    const calledEvent: any = logMock.info.mock.calls[0][0];
    expect(logMock.info).toHaveBeenCalledTimes(1);
    expect(calledEvent.meta.method).toBe(logEvent.method);
    expect(calledEvent.meta.originalUrl).toBe(logEvent.originalUrl);
    expect(calledEvent.meta.path).toBe(logEvent.path);
    expect(calledEvent.meta.srcIp).toMatch(/(127.0.0.1|^::1$)/);
    expect(calledEvent.payload.headers).toEqual(
      expect.objectContaining({ "x-include-me": "1" })
    );
    expect(calledEvent.payload.headers).toEqual(
      expect.objectContaining({ "correlation-id": "123" })
    );
    expect(calledEvent.payload.headers).toEqual(
      expect.objectContaining({ "x-include-me": "1" })
    );
    expect(calledEvent.payload.body).toMatchObject({ includedBody: "1" });
    expect(calledEvent.payload.params).toMatchObject({ id: "1" });
    expect(calledEvent.payload.query).toMatchObject({ sampleQuery: "test" });
    expect(calledEvent.meta.status).toBe(logEvent.status);
    // expect(calledEvent.correlation_id).toBe(logEvent.correlation_id);
    expect(calledEvent.payload.latencyMs).toBeLessThan(1000);

    // Exclusion assertions
    expect(calledEvent.payload.headers).not.toEqual(
      expect.objectContaining({ "x-exclude-me": "1" })
    );
    expect(calledEvent.payload.headers).not.toEqual(
      expect.objectContaining({ "forgotten-secret-header": "1" })
    );
    expect(calledEvent.payload.body).not.toMatchObject({ excludedBody: "1" });
    expect(calledEvent.payload.params).not.toMatchObject({
      excludedParam: "1",
    });
    expect(calledEvent.payload.query).not.toMatchObject({ excludedQuery: "1" });
  });
});
