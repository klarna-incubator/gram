import { App } from "octokit";
import { join } from "path";
import { Pack, PackRegistrator } from "..";
import { AllPermissions, Permission } from "../../auth/authorization";
import { AuthzProvider } from "../../auth/AuthzProvider";
import { Reviewer } from "../../auth/models/Reviewer";
import { User } from "../../auth/models/User";
import { UserToken } from "../../auth/models/UserToken";
import { UserProvider } from "../../auth/UserProvider";
import Model from "../../data/models/Model";
import { ReviewerProvider } from "../../data/reviews/ReviewerProvider";
import secrets from "../../secrets";
import { GithubAuthProvider } from "./GithubAuthProvider";
import { GithubSystemProvider } from "./GithubSystemProvider";

class PassthroughAuthzProvider implements AuthzProvider {
  async getPermissionsForSystem(
    systemId: string,
    user: UserToken
  ): Promise<Permission[]> {
    return AllPermissions;
  }
  async getPermissionsForModel(
    model: Model,
    user: UserToken
  ): Promise<Permission[]> {
    return AllPermissions;
  }
  key: string = "passthrough";
}

const reviewers: Reviewer[] = [
  {
    name: "Joakim Uddholm",
    recommended: false,
    sub: "Tethik", // Must be the same as sub provided by AuthProvider for authz to work
    mail: "tethik@gmail.com",
    teams: [],
  },
  {
    name: "Security Team",
    recommended: true,
    sub: "tethik+securityteam@gmail.com",
    mail: "tethik+securityteam@gmail.com",
    teams: [],
  },
];

class StaticReviewerProvider implements ReviewerProvider {
  async lookup(userIds: string[]): Promise<Reviewer[]> {
    return userIds
      .map((uid) => reviewers.find((r) => r.sub === uid))
      .filter((r) => !!r) as Reviewer[];
  }
  async getReviewersForModel(model: Model): Promise<Reviewer[]> {
    return reviewers;
  }
  async getReviewers(): Promise<Reviewer[]> {
    return reviewers;
  }
  async getFallbackReviewer(): Promise<Reviewer> {
    return reviewers[1];
  }
  key: string = "static";
}

class StaticUserProvider implements UserProvider {
  async lookup(userIds: string[]): Promise<User[]> {
    return userIds
      .map((uid) => reviewers.find((r) => r.sub === uid))
      .filter((r) => !!r) as User[];
  }
  key: string = "static";
}

export default class DemoPack implements Pack {
  async bootstrap(reg: PackRegistrator): Promise<void> {
    const appId = await secrets.get("auth.providerOpts.github.appId");
    const clientId = await secrets.get("auth.providerOpts.github.clientId");
    const clientSecret = await secrets.get(
      "auth.providerOpts.github.clientSecret"
    );
    const privateKey = await secrets.get("auth.providerOpts.github.privateKey");

    const app = new App({
      appId,
      privateKey,
      oauth: { clientId, clientSecret },
    });

    reg.registerAuthProvider(new GithubAuthProvider(app));
    reg.setSystemProvider(new GithubSystemProvider(app));
    reg.setAuthzProvider(new PassthroughAuthzProvider());
    reg.setReviewerProvider(new StaticReviewerProvider());
    reg.setUserProvider(new StaticUserProvider());
    reg.registerAssets("github", join(__dirname, "assets"));
  }
}
