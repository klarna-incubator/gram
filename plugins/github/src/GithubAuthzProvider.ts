import { getLogger } from "@gram/core/dist/logger";
import { App } from "octokit";
import { AllPermissions, Permission } from "@gram/core/dist/auth/authorization";
import { AuthzProvider } from "@gram/core/dist/auth/AuthzProvider";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { NotFoundError } from "@gram/core/dist/util/errors";

const log = getLogger("GithubAuthzProvider");

export class GithubAuthzProvider implements AuthzProvider {
  constructor(private app: App) {}

  async getPermissionsForSystem(
    ctx: RequestContext,
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    const token = user.providerToken;

    if (!token) {
      return [];
    }

    const decoded = Buffer.from(systemId, "base64").toString("ascii");
    const parts = decoded.split("/");

    if (parts.length !== 2) {
      log.warn(`got invalid systemID: ${decoded}`);
      return [];
    }

    // TODO: use permission object instead.
    // permissions: { admin: true, maintain: true, push: true, triage: true, pull: true },
    const octo = await this.app.oauth.getUserOctokit({ token });
    try {
      const resp = await octo.request(
        "GET /repos/{owner}/{repo}/collaborators/{username}",
        {
          username: user.sub,
          owner: parts[0],
          repo: parts[1],
        }
      );

      if (resp.status === 204) {
        return AllPermissions;
      }
      return [];
    } catch (err: any) {
      if (err?.status === 404) {
        // 404 means the repo "doesn't exist" from the users perspective. could be a private repo.
        throw new NotFoundError();
      }
      if (err?.status === 403) {
        // 403 means the repo is public but user is not a collaborator. So we give read.
        return [Permission.Read];
      }
      throw err;
    }
  }

  async getPermissionsForStandaloneModel(
    ctx: RequestContext,
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    if (model.createdBy === user.sub) {
      return AllPermissions;
    } else {
      return [Permission.Read];
    }
  }
  key: string = "passthrough";
}
