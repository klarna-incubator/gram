import { App, Octokit } from "octokit";
import { User } from "../../auth/models/User";
import { UserProvider } from "../../auth/UserProvider";

export class GithubUserProvider implements UserProvider {
  constructor(private app: App) {}

  async lookup(userIds: string[]): Promise<User[]> {
    // Could be batched smarter...
    return (await Promise.all(userIds.map((uid) => this.getUser(uid)))).filter(
      (r) => !!r
    ) as User[];
  }

  async getUser(userId: string): Promise<User | null> {
    const auth: any = await this.app.octokit.auth({ type: "app" });
    const octo = new Octokit({ token: auth.token });
    try {
      const resp = await octo.request(`GET /users/{userId}`, { userId });      
      return {
        sub: resp.data.login,
        name: resp.data.name,
        teams: [],
        mail: resp.data.email,
      };
    } catch (err: any) {      
      if (err?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  key: string = "github";
}
