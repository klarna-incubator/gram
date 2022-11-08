import { Application, Request, Response } from "express";
import request from "supertest";
import { createTestApp } from "../test-util/app";
import { csrfTokenRequired } from "./csrf";
import { sampleUser } from "../test-util/sampleUser";
import * as jwt from "../auth/jwt";
import { randomUUID } from "crypto";
import getCsrfToken from "../resources/gram/v1/token/csrf";
import jsonwebtoken, { SignOptions, VerifyOptions } from "jsonwebtoken";

describe("csrf middleware", () => {
  let app: Application;
  const validate = jest.spyOn(jwt, "validateToken");

  beforeAll(async () => {
    validate.mockImplementation(async () => sampleUser);

    ({ app } = await createTestApp());
    app.get("/get", getCsrfToken);
    app.post(
      "/post-protected",
      csrfTokenRequired,
      (req: Request, res: Response) => res.status(200).end()
    );
  });

  it("should return a csrf token in the body", async () => {
    const res = await request(app).get("/get");

    expect(res.status).toBe(200);
    expect(res.text).toBeDefined();
  });

  it("should return 401 on invalid csrf token", async () => {
    const res = await request(app).get("/get");
    const realToken = res.body.token;

    const res2 = await request(app)
      .post("/post-protected")
      .set("Cookie", `csrf=${realToken}`)
      .set("x-csrf-token", "something else");
    expect(res2.status).toBe(401);
  });

  it("should return 401 on invalid csrf secret", async () => {
    const res = await request(app).get("/get");
    const realToken = res.body.token;

    const token = await jwt.generateToken({ hello: "world" });
    const res2 = await request(app)
      .post("/post-protected")
      .set("Cookie", `csrf=${realToken}`)
      .set("x-csrf-token", token);
    expect(res2.status).toBe(401);
  });

  it("should return 200 on non-cookie based request", async () => {
    const res = await request(app).post("/post-protected");
    expect(res.status).toBe(200);
  });

  it("should return 401 on cookie based auth request", async () => {
    const res = await request(app)
      .post("/post-protected")
      .set("Cookie", `bearerToken=whatever`);
    expect(res.status).toBe(401);
  });

  it("should return 200 on successful csrf exchange", async () => {
    const res = await request(app).get("/get");
    const token = res.body.token;

    const res2 = await request(app)
      .post("/post-protected")
      .set("Cookie", `csrf=${token}`)
      .set("x-csrf-token", token);
    expect(res2.status).toBe(200);
  });

  afterAll(() => validate.mockRestore());
});
