import { App, Octokit } from "octokit";
import { User } from "../../auth/models/User";
import { UserProvider } from "../../auth/UserProvider";
import { createPostgresPool } from "../../data/postgres";
import { RequestContext } from "../../data/providers/RequestContext";
import { getDatabaseName } from "./data";

export class GithubUserProvider implements UserProvider {
  constructor(private app: App) {}

  async getClient() {
    const database = await getDatabaseName();
    const pool = await createPostgresPool({ database });
    return pool;
  }

  async lookup(ctx: RequestContext, userIds: string[]): Promise<User[]> {
    // Could be batched smarter...
    return (await Promise.all(userIds.map((uid) => this.getUser(uid)))).filter(
      (r) => !!r
    ) as User[];
  }

  async insert(user: User) {
    const client = await this.getClient();
    return await client.query(
      "INSERT INTO github_users (login, email) VALUES ($1, $2) ON CONFLICT (login) DO UPDATE SET email = $2;",
      [user.sub, user.mail]
    );
  }

  async getUser(userId: string): Promise<User | null> {
    const client = await this.getClient();
    const res = await client.query(
      "SELECT * FROM github_users WHERE login = $1",
      [userId]
    );
    // console.log(res.rows);
    if (res.rowCount === 0) {
      return null;
    }

    const auth: any = await this.app.octokit.auth({ type: "app" });
    const octo = new Octokit({ token: auth.token });
    try {
      const resp = await octo.request(`GET /users/{userId}`, { userId });
      return {
        sub: resp.data.login,
        name: resp.data.name,
        teams: [],
        mail: res.rows[0].email,
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
