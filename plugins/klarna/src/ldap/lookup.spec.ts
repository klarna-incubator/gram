import {
  getLDAPUserGroups,
  listLDAPGroupMembers,
  LDAPCache,
  initLdapClient,
  getUser,
  connectLdapClient,
} from "./lookup";

describe.skip("ldap lookup (integration tests)", () => {
  let cacheGet: any;
  beforeAll(async () => {
    cacheGet = jest.spyOn(LDAPCache, "get");
    cacheGet.mockImplementation(() => {
      console.log("Mocked cacheGet called");
      return null;
    });
  });

  it("should be ok with concurrent lookups", async () => {
    const user = "joakim.uddholm@klarna.com";
    const lookups = [
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
      async () => getLDAPUserGroups(user),
    ];

    const result = await Promise.all(lookups.map((l) => l()));

    console.log(result);

    result.forEach((row) => expect(row).toEqual(result[0]));
  });

  it("should be able to lookup all secdev members simultaneously", async () => {
    const members = await listLDAPGroupMembers("access.secure-development");
    const secdevMembers = members.map((u) => u.sub);
    const lookups = secdevMembers.map(getLDAPUserGroups);
    const result = await Promise.all(lookups);
    result.forEach((row) => expect(row).toBeTruthy());
  });

  it("should be able to connect", async () => {
    await connectLdapClient();
  });

  it("should be ok with lookups of non-existent users", async () => {
    const user = "does.not.exist@klarna.com";
    const lookups = [async () => getLDAPUserGroups(user)];

    const result = await Promise.all(lookups.map((l) => l()));
    result.forEach((row) => expect(row).toEqual(result[0]));
  });

  it("should be ok with punit.gupta", async () => {
    const user = "punit.gupta@klarna.com";
    await getUser(user);
  });

  afterAll(() => {
    cacheGet.mockRestore();
  });
});
