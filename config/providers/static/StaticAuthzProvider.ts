import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider";
import { Permission } from "@gram/core/dist/auth/authorization";
import { Role } from "@gram/core/dist/auth/models/Role";
import { User } from "@gram/core/dist/auth/models/User";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";

export const users: User[] = [
  {
    name: "Joakim Uddholm",
    sub: "tethik@gmail.com", // Must be the same as sub provided by AuthProvider for authz to work
    mail: "tethik@gmail.com",
    teams: [],
  },
];

export class StaticAuthzProvider implements AuthzProvider {
  getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    throw new Error("Method not implemented.");
  }
  getPermissionsForStandaloneModel(
    ctx: RequestContext,
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    throw new Error("Method not implemented.");
  }
  getRolesForUser(sub: string): Promise<Role[]> {
    throw new Error("Method not implemented.");
  }
  key: string = "static";
}
