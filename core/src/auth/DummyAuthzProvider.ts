import Model from "../data/models/Model";
import { RequestContext } from "../data/providers/RequestContext";
import { AuthzProvider } from "./AuthzProvider";
import { Role } from "./models/Role";
import { UserToken } from "./models/UserToken";
import { Permission } from "./authorization";

// /**
//  * Default authorization provider, for now just throws errors.
//  * Implementing orgs should add their own rules here.
//  */
export class DummyAuthzProvider implements AuthzProvider {
  key = "default";
  err = "Method not implemented.";

  getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    throw new Error(this.err);
  }
  getPermissionsForStandaloneModel(
    ctx: RequestContext,
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    throw new Error(this.err);
  }
  getRolesForUser(sub: string): Promise<Role[]> {
    throw new Error(this.err);
  }
}
