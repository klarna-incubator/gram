import config from "config";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Role } from "./models/Role";
import * as jwt from "./jwt";
import { UserToken } from "./models/UserToken";

const payload: UserToken = {
  name: "user name",
  sub: "gram",
  roles: [Role.User],
  teams: [{ name: "some-product-team", id: "42" }],
};

describe("JWT wrapper for authentication", () => {
  describe("token generation", () => {
    it("should generate a valid token", async () => {
      const token = await jwt.generateToken(payload);
      const parts = token.split(".");
      const algStr = Buffer.from(parts[0], "base64");
      const payloadStr = Buffer.from(parts[1], "base64");
      expect(typeof JSON.parse(algStr.toString())).toBe("object");
      expect(typeof JSON.parse(payloadStr.toString())).toBe("object");
      expect(parts.length).toBe(3);
    });

    it("should match original payload sub", async () => {
      const token = await jwt.generateToken(payload);
      const parts = token.split(".");
      const payloadStr = Buffer.from(parts[1], "base64");
      const tokenPayload = JSON.parse(payloadStr.toString());
      expect(payload.sub).toEqual(tokenPayload.sub);
    });

    it("should contain valid expiration", async () => {
      const token = await jwt.generateToken(payload);
      const now = Math.floor(Date.now() / 1000);
      const parts = token.split(".");
      const payloadStr = Buffer.from(parts[1], "base64");
      const tokenPayload = JSON.parse(payloadStr.toString());

      expect(now - tokenPayload.exp).toBeLessThanOrEqual(config.get("jwt.ttl"));
    });
  });

  describe("token validation", () => {
    it("should verify valid token", async () => {
      const token = await jwt.generateToken(payload);
      const tokenPayload = await jwt.validateToken(token);
      expect(payload.sub).toEqual(tokenPayload.sub);
    });

    it("should verify valid token with purpose", async () => {
      const token = await jwt.generateToken(
        payload,
        5000,
        "sample-other-purpose"
      );
      const tokenPayload = await jwt.validateToken(
        token,
        "sample-other-purpose"
      );
      expect(payload.sub).toEqual(tokenPayload.sub);
    });

    it("should reject invalid token", async () => {
      expect(() => jwt.validateToken("invalid_token")).rejects.toThrow(
        JsonWebTokenError
      );
    });

    it("should detect expired token", async () => {
      const token = await jwt.generateToken(payload, -1);
      expect(() => jwt.validateToken(token)).rejects.toThrow(TokenExpiredError);
    });

    it("should reject unsecure JWT", async () => {
      const token = "eyJhbGciOiJub25lIn0.eyJzb21lIjoidGVzdCJ9.";
      expect(() => jwt.validateToken(token)).rejects.toThrow(JsonWebTokenError);
    });

    it("should reject JWT for different purpose", async () => {
      const token = await jwt.generateToken(payload, 5000, "auth");
      expect(() =>
        jwt.validateToken(token, "sample-other-purpose")
      ).rejects.toThrow(JsonWebTokenError);
    });
  });
});
