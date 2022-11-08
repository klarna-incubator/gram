import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import * as jwt from "../auth/jwt";
import { UserToken } from "../auth/models/UserToken";
import { sampleUser } from "../test-util/sampleUser";
import { authRequiredMiddleware, validateTokenMiddleware } from "./auth";

const app = express();
app.use(cookieParser());
app.use(validateTokenMiddleware);
app.get("/unprotected", (req, res) => res.end());
app.get("/protected", authRequiredMiddleware, (req, res) => res.end());

const validate = jest.spyOn(jwt, "validateToken");

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
    validate.mockImplementation(async (token: string): Promise<UserToken> => {
      throw new Error("expired");
    });
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "bearer expired_token");
    expect(res.status).toBe(401);
  });

  it("should return 401 on protected path with expired token (cookie)", async () => {
    validate.mockImplementation(async (token: string): Promise<UserToken> => {
      throw new Error("expired");
    });
    const res = await request(app)
      .get("/protected")
      .set("Cookie", "bearerToken=expired_token");
    expect(res.status).toBe(401);
  });

  it("should return 200 on protected path with valid token (header)", async () => {
    validate.mockImplementation(async () => sampleUser);
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "bearer expired_token");
    expect(res.status).toBe(200);
  });

  it("should return 200 on protected path with valid token (cookie)", async () => {
    validate.mockImplementation(async () => sampleUser);
    const res = await request(app)
      .get("/protected")
      .set("Cookie", "bearerToken=expired_token");
    expect(res.status).toBe(200);
  });
});

afterAll(() => {
  validate.mockRestore();
});
