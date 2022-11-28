import { randomUUID } from "crypto";
import { Request } from "express";
import { App } from "octokit";
import { AuthProvider } from "../../auth/AuthProvider";
import { Role } from "../../auth/models/Role";
import { UserToken } from "../../auth/models/UserToken";
import config from "config";
import { GithubUserProvider } from "./GithubUserProvider";
import { User } from "../../auth/models/User";
import { RequestContext } from "../../data/providers/RequestContext";

export class GithubAuthProvider implements AuthProvider {
  constructor(private app: App, private userProvider: GithubUserProvider) {}

  async params(ctx: RequestContext) {
    const origin = config.get("origin");
    const { url } = this.app!.oauth.getWebFlowAuthorizationUrl({
      state: randomUUID(),
      redirectUrl: `${origin}/login/callback/github`,
    });
    return { redirectUrl: url, icon: "/assets/github/github-icon.svg" };
  }

  async getIdentity(ctx: RequestContext): Promise<UserToken> {
    const code = ctx.currentRequest?.query.code?.toString();
    const state = ctx.currentRequest?.query.state?.toString();

    if (!code) {
      throw new Error("Invalid code-param in Github OAuth callback");
    }

    const {
      authentication: { token },
    } = await this.app.oauth.createToken({ code, state });

    // console.log(token);
    const octo = await this.app.oauth.getUserOctokit({ token });

    // Helpful: https://docs.github.com/en/graphql/overview/explorer
    const {
      viewer: { login, name, avatarUrl },
    } = (await octo.graphql(`{ 
      viewer { 
        login      
        name
        avatarUrl
      }
    }`)) as any; // hack as I didnt find types for gql

    // Fetch email, needed for email notifications (public one can also be used, but not reliable enough)
    const { data: emails } = await octo.request(
      "GET /user/emails{?per_page,page}",
      {}
    );
    let email =
      emails.find((e: any) => e.primary && e.verified).email ||
      emails.length > 0
        ? emails[0].email
        : null;

    const { data: installations } = await octo.request(
      "GET /user/installations",
      {}
    );

    const user: User = {
      name: name || login,
      mail: email,
      sub: login,
      teams: installations.installations.map((inst) => ({
        id: inst.account?.login || inst.id.toString(),
        name: inst.account?.login || inst.id.toString(),
      })),
    };

    await this.userProvider.insert(user);

    return {
      roles: [Role.User],
      provider: this.key,
      picture: avatarUrl,
      providerToken: token,
      ...user,
    };
  }
  key: string = "github";
}
