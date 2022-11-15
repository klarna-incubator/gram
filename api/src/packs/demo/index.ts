import { App } from "octokit";
import { join } from "path";
import { Pack, PackRegistrator } from "..";
import secrets from "../../secrets";
import { GithubAuthProvider } from "./GithubAuthProvider";
import { GithubSystemProvider } from "./GithubSystemProvider";
import { GithubAuthzProvider } from "./GithubAuthzProvider";
import { StaticReviewerProvider } from "./StaticReviewerProvider";
import { GithubUserProvider } from "./GithubUserProvider";
import { createAppAuth } from "@octokit/auth-app";

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
    reg.setAuthzProvider(new GithubAuthzProvider(app));
    reg.setReviewerProvider(new StaticReviewerProvider());
    reg.setUserProvider(new GithubUserProvider(app));
    reg.registerAssets("github", join(__dirname, "assets"));
  }
}
