import { ldapQueryOne } from "@gram/ldap";
import { Client, Entry } from "ldapts";

const LDAPTeamSearchBase = "ou=Klarna,dc=internal,dc=machines";

export type LDAPDomain = {
  cn: string;
  name: string;
  memberCns: string[];
};

export async function getDomainMembers(
  client: Client,
  klarnaProjectCode: string
): Promise<string[]> {
  const domain = await ldapQueryOne(client, LDAPTeamSearchBase, {
    scope: "sub",
    filter: `&(klarnaProjectCode=${klarnaProjectCode})`,
    attributes: ["uniqueMember"],
  });

  if (!domain || !domain["uniqueMember"]) {
    return [];
  }

  // Quanah said this was ok. Blame him.
  const users = await Promise.all(
    (domain["uniqueMember"] as string[]).map((m) =>
      ldapQueryOne(client, m, {
        scope: "sub",
        filter: "(kreditorEnabledUser=TRUE)",
        attributes: ["mail"],
      })
    )
  );

  return users
    .filter((u) => u !== null)
    .map((u) => (u as Entry)["mail"] as string);
}
