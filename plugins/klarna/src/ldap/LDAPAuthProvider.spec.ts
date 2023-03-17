import { Role } from "@gram/core/dist/auth/models/Role";
import LDAPAuthProvider from "./LDAPAuthProvider";
import * as lookup from "./lookup";
import { GramRequest } from "@gram/core/dist/data/providers/RequestContext";

jest.mock("./lookup");

describe("auth.provider.ldap", () => {
  const ldap = new LDAPAuthProvider();

  let initLdapClient: any;
  let getLDAPUserGroupsByDN: any;

  beforeAll(() => {
    initLdapClient = jest.spyOn(lookup, "initLdapClient");
    getLDAPUserGroupsByDN = jest.spyOn(lookup, "getLDAPUserGroupsByDN");
  });

  describe("params", () => {
    it("should return almost no params", async () => {
      expect(await ldap.params()).toStrictEqual({ hideOnFrontend: true });
    });
  });

  describe("getIdentity", () => {
    it("should throw missing error on missing header key", async () => {
      await expect(ldap.getIdentity({})).rejects.toThrow(
        /Invalid Authorization.*/
      );
    });

    it("should throw error if bad basic auth format", async () => {
      await expect(
        ldap.getIdentity({
          currentRequest: {
            headers: { authorization: "something" },            
          } as GramRequest,
        })
      ).rejects.toThrow(/Invalid.*/);
    });

    it("should throw error if username not in system user format", async () => {
      initLdapClient.mockImplementation(() => ({
        bind: (user: any, pass: any, cb: any) =>
          cb(new Error("bad credentials or smth"), null),
        unbind: () => null,
      }));

      await expect(
        ldap.getIdentity({
          currentRequest: {
            headers: {
              authorization: `Basic ${Buffer.from(
                "username:badpasssword"
              ).toString("base64")}`,
            },
          } as GramRequest,
        })
      ).rejects.toThrow(/Invalid system user .*/);
    });

    it("should throw error if wrong credentials", async () => {
      initLdapClient.mockImplementation(() => ({
        bind: (user: any, pass: any, cb: any) =>
          cb(new Error("bad credentials or smth"), null),
        unbind: () => null,
      }));

      await expect(
        ldap.getIdentity({
          currentRequest: {
            headers: {
              authorization: `Basic ${Buffer.from(
                "sys.example:badpasssword"
              ).toString("base64")}`,
            },
          } as GramRequest,
        })
      ).rejects.toThrow(/authentication failed .*/);
    });

    it("should throw error if not in the correct group", async () => {
      initLdapClient.mockImplementation(() => ({
        bind: (user: any, pass: any, cb: any) =>
          cb(null, {
            dn: "uid=sys.gram.mail,ou=People,dc=internal,dc=machines",
            uid: "some number",
          }),
        unbind: () => null,
      }));

      getLDAPUserGroupsByDN.mockImplementation(() => [
        "sys.active.system.users",
      ]);

      await expect(
        ldap.getIdentity({
          currentRequest: {
            headers: {
              authorization: `Basic ${Buffer.from(
                "sys.gram.mail:passsword"
              ).toString("base64")}`,
            },
          } as GramRequest,
        })
      ).rejects.toThrow(/not member/);
    });

    it("should return proper payload on successful verification", async () => {
      initLdapClient.mockImplementation(() => ({
        bind: (user: any, pass: any, cb: any) =>
          cb(null, {
            dn: "uid=sys.gram.mail,ou=People,dc=internal,dc=machines",
            displayName: "sys.gram.mail System User",
            uid: "sys.gram.mail",
          }),
        unbind: () => null,
      }));

      getLDAPUserGroupsByDN.mockImplementation(() => [
        "sys.active.system.users",
        "access.1288598.stag.sso-prod",
        "access.1288598.stag.system-api-access",
      ]);

      const identity = await ldap.getIdentity({
        currentRequest: {
          headers: {
            authorization: `Basic ${Buffer.from(
              "sys.gram.mail:password"
            ).toString("base64")}`,
          },
        } as GramRequest,
      });

      expect(identity.sub).toBe("sys.gram.mail");
      expect(identity.name).toBe("sys.gram.mail System User");
      expect(identity.roles).toStrictEqual([Role.User]);
    });

    afterAll(() => {
      initLdapClient.mockRestore();
      getLDAPUserGroupsByDN.mockRestore();
    });
  });
});
