import config from "config";
import GoogleAuthProvider, { getRoles } from ".";
import { Role } from "@gram/core/dist/auth/models/Role";
import * as user from "@gram/core/dist/auth/user";

describe("auth.provider.google", () => {
  const lookupUser = jest.spyOn(user, "lookupUser");

  // const google = new GoogleAuthProvider();

  describe("getRoles", () => {
    it("should return admin for admin group users", () => {
      const roles = getRoles(
        new Set(config.get<string[]>("auth.providerOpts.ldap.roleMap.admin"))
      );

      expect(roles).toStrictEqual([Role.Admin, Role.User]);
    });

    it("should return reviewer for reviewer group users", () => {
      const roles = getRoles(
        new Set(config.get<string[]>("auth.providerOpts.ldap.roleMap.reviewer"))
      );

      expect(roles).toStrictEqual([Role.Reviewer, Role.User]);
    });

    it("should return user for user group users", () => {
      const roles = getRoles(
        new Set(config.get<string[]>("auth.providerOpts.ldap.roleMap.user"))
      );

      expect(roles).toStrictEqual([Role.User]);
    });

    it("should return no roles if no matching group", () => {
      const roles = getRoles(new Set(["other-group"]));
      expect(roles).toStrictEqual([Role.User]);
    });
  });

  // describe("getIdentity", () => {
  //   const getLDAPUserGroups = jest.spyOn(ldap, "getLDAPUserGroups");

  //   beforeEach(() => {
  //     verifyIdToken.mockImplementation(async () => ({
  //       getPayload() {
  //         return {
  //           email: "test@klarna.com",
  //           name: "Test Name",
  //         };
  //       },
  //     }));
  //     getLDAPUserGroups.mockImplementation(async () => []);
  //   });

  //   it("should throw missing error on missing header key", async () => {
  //     expect.assertions(1);
  //     expect(google.getIdentity({})).rejects.toThrow(/missing.*/);
  //   });

  //   it("should throw error on no teams", async () => {
  //     lookupUser.mockImplementation(async () => ({
  //       sub: "",
  //       name: "",
  //       teams: [],
  //       slackId: "",
  //     }));

  //     expect.assertions(1);
  //     expect(
  //       google.getIdentity({
  //         currentRequest: {
  //           headers: {
  //             "x-google-id-token": "something",
  //           } as IncomingHttpHeaders,
  //         } as Request,
  //       })
  //     ).rejects.toThrow(/no such user found for .*/);
  //   });

  //   it("should throw forbidden error on any verifyIdToken error", async () => {
  //     verifyIdToken.mockImplementation(async () => {
  //       throw new Error("something random");
  //     });

  //     expect.assertions(1);

  //     expect(
  //       google.getIdentity({
  //         currentRequest: {
  //           headers: {
  //             "x-google-id-token": "something",
  //           } as IncomingHttpHeaders,
  //         } as Request,
  //       })
  //     ).rejects.toThrow(/verification/);
  //   });

  //   it("should return proper payload on successful verification", async () => {
  //     lookupUser.mockImplementation(async () => ({
  //       sub: "employee@mail",
  //       name: "employee",
  //       teams: [{ name: "mocked team", id: "43" }],
  //       slackId: "unknown",
  //     }));
  //     const identity = await google.getIdentity({
  //       currentRequest: {
  //         headers: {
  //           "x-google-id-token": "something",
  //         } as IncomingHttpHeaders,
  //       } as Request,
  //     });
  //     expect(identity.sub).toBe("test@klarna.com");
  //     expect(identity.name).toBe("Test Name");
  //     expect(identity.slackId).toBe("unknown");
  //   });

  //   afterAll(() => {
  //     verifyIdToken.mockRestore();
  //     lookupUser.mockRestore();
  //     getLDAPUserGroups.mockRestore();
  //   });
  // });
});
