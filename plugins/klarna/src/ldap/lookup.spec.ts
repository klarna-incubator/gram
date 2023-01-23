import { getLDAPUserGroups, listLDAPGroupMembers, LDAPCache } from "./lookup";

describe("ldap lookup (integration tests)", () => {
  let cacheGet: any;
  beforeAll(async () => {
    cacheGet = jest.spyOn(LDAPCache, "get");
    cacheGet.mockImplementation(() => {
      // console.log("Mocked cacheGet called");
      return null;
    });
  });

  it.skip("should be ok with concurrent lookups", async () => {
    const user = "joakim.uddholm@klarna.com";
    const lookups = [
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
      getLDAPUserGroups(user),
    ];

    const result = await Promise.all(lookups);

    result.forEach((row) => expect(row).toEqual(result[0]));
  });

  it.skip("should be able to lookup all secdev members simultaneously", async () => {
    const members = await listLDAPGroupMembers("access.secure-development");
    const secdevMembers = members.map((u) => u.sub);
    const lookups = secdevMembers.map(getLDAPUserGroups);
    const result = await Promise.all(lookups);
    result.forEach((row) => expect(row).toBeTruthy());
  });

  afterAll(() => {
    cacheGet.mockRestore();
  });
});
