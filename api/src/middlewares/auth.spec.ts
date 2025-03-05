import * as jwt from "@gram/core/dist/auth/jwt.js";
import express from "express";
import request from "supertest";
import { sampleUserToken } from "../test-util/sampleTokens.js";
import { sampleUser } from "../test-util/sampleUser.js";
import { authRequiredMiddleware, validateTokenMiddleware } from "./auth.js";

const app = express();
app.use(validateTokenMiddleware);
app.get("/unprotected", (req, res) => {
  res.end();
});
app.get("/protected", authRequiredMiddleware, (req, res) => {
  res.end();
});

const token = await sampleUserToken();

describe("auth middleware", () => {
  it("should return 200 on unprotected path", async () => {
    const res = await request(app).get("/unprotected");
    expect(res.status).toBe(200);
  });

  it("should return 401 on protected path", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  it("should return 401 on protected path with invalid token (header)", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "bearer invalid_token");
    expect(res.status).toBe(401);
  });

  it("should return 401 on protected path with invalid token (cookie)", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Cookie", "bearerToken=invalid_token");
    expect(res.status).toBe(401);
  });

  it("should return 401 on protected path with expired token (header)", async () => {
    const expiredToken = await jwt.generateToken({ sub: sampleUser.sub }, 0);
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "bearer " + expiredToken);
    expect(res.status).toBe(401);
  });

  it("should return 401 on protected path with expired token (cookie)", async () => {
    const expiredToken = await jwt.generateToken({ sub: sampleUser.sub }, 0);
    const res = await request(app)
      .get("/protected")
      .set("Cookie", "bearerToken=" + expiredToken);
    expect(res.status).toBe(401);
  });

  it("should return 200 on protected path with valid token (header)", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", token);
    expect(res.status).toBe(200);
  });
});
