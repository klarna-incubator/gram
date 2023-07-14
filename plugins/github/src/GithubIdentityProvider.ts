import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider";
import { Role } from "@gram/core/dist/auth/models/Role";
import { User } from "@gram/core/dist/auth/models/User";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { randomUUID } from "crypto";
import { App } from "octokit";
import { GithubUserProvider } from "./GithubUserProvider";
import { config } from "@gram/core/dist/config";

export class GithubIdentityProvider implements IdentityProvider {
  admins: string[] = [];

  constructor(private app: App, private userProvider: GithubUserProvider) {
    this.admins = [];
  }

  async params(ctx: RequestContext): Promise<IdentityProviderParams> {
    const { url } = this.app!.oauth.getWebFlowAuthorizationUrl({
      state: randomUUID(),
      redirectUrl: `${config.origin}/login/callback/github`,
    });
    return {
      key: "github",
      form: {
        type: "redirect",
        httpMethod: "GET",
        redirectUrl: url,
        icon: "/assets/github/github-icon.svg",
      },
    };
  }

  async getIdentity(ctx: RequestContext): Promise<LoginResult> {
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
      status: "ok",
      identity: {
        sub: login,
        // roles: this.admins.includes(login)
        //   ? [Role.User, Role.Admin]
        //   : [Role.User],
        // provider: this.key,
        // picture: avatarUrl,
        // providerToken: token,
        // ...user,
      },
    };
  }
  key: string = "github";
}
