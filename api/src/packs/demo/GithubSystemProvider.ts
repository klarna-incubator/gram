import { getLogger } from "log4js";
import { App } from "octokit";
import { SystemProperty } from "../../data/system-property";
import System from "../../data/systems/System";
import {
  AppContext,
  SystemListFilter,
  SystemListInput,
  SystemListResult,
  SystemProvider,
} from "../../data/systems/SystemProvider";

const log = getLogger("GithubSystemProvider");

export class GithubSystemProvider implements SystemProvider {
  constructor(private app: App) {}

  id: string = "github";

  definitions: SystemProperty[] = [
    {
      id: "url",
      batchFilterable: false,
      label: "URL",
      description: "Github repository url",
    },
    {
      id: "language",
      batchFilterable: false,
      label: "language",
      description: "Programming language detected",
    },
    {
      id: "private",
      batchFilterable: true,
      label: "Private",
      description: "Is the repo private?",
    },
    {
      id: "fork",
      batchFilterable: true,
      label: "Fork",
      description: "Is the repo a fork?",
    },
    {
      id: "stars",
      batchFilterable: false,
      label: "Stars",
      description: "How many stars the repo has",
    },
  ];

  async listSystemByPropertyValue(
    ctx: AppContext,
    propertyId: string,
    value: any
  ): Promise<string[]> {
    const octo = await this.getOcto(ctx);

    let q = ``;
    if (propertyId === "fork") {
      q = `fork:only `;
    } else if (propertyId === "private") {
      q = `is:private `;
    } else {
      return [];
    }

    const installations = await this.getInstallations(ctx);
    q += installations.map((inst) => `user:${inst.account?.login}`).join(" ");

    // This will struggle when there are many repos..
    let page = 0;
    let searchResp = await octo.request(
      "GET /search/repositories{?q,sort,order,per_page,page}",
      {
        q,
        per_page: 100,
        page,
      }
    );

    const systemIds = searchResp.data.items.map((r: any) =>
      Buffer.from(r.full_name).toString("base64")
    );

    while (searchResp.data.incomplete_results === true) {
      page += 1;
      searchResp = await octo.request(
        "GET /search/repositories{?q,sort,order,per_page,page}",
        {
          q,
          per_page: 100,
          page,
        }
      );

      systemIds.push(
        ...searchResp.data.items.map((r: any) =>
          Buffer.from(r.full_name).toString("base64")
        )
      );

      if (page > 10) {
        log.warn(
          `Fetched a lot of pages from github search ${page}. Breaking as a safety precaution (do you really have 1000+ repos?)`
        );
        break;
      }
    }

    return systemIds;
  }

  async getOcto(ctx: AppContext) {
    const token = ctx.currentRequest?.user.providerToken;
    return this.app.oauth.getUserOctokit({ token });
  }

  repoToSystem(r: any) {
    return new System(
      Buffer.from(r.full_name).toString("base64"),
      r.name,
      r.name,
      [{ id: r.owner.login, name: r.owner.login }],
      r.description
    );
  }

  async getRepo(ctx: AppContext, systemId: string) {
    const octo = await this.getOcto(ctx);
    const decoded = Buffer.from(systemId, "base64").toString("ascii");
    const parts = decoded.split("/");

    try {
      const resp = await octo.request(`GET /repos/{account}/{repo}`, {
        account: parts[0],
        repo: parts[1],
      });
      if (!resp.data) {
        return null;
      }
      return resp.data;
    } catch (err: any) {
      if (err?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getSystem(ctx: AppContext, systemId: string): Promise<System | null> {
    const repo = await this.getRepo(ctx, systemId);
    return this.repoToSystem(repo);
  }

  async getInstallations(ctx: AppContext) {
    const octo = await this.getOcto(ctx);
    const { data } = await octo.request("GET /user/installations", {});
    return data.installations;
  }

  async listSystems(
    ctx: AppContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    const octo = await this.getOcto(ctx);

    if (input.filter === SystemListFilter.Team) {
      const installations = await this.getInstallations(ctx);
      const installationId = installations.find(
        (i: any) => i.account.login === input.opts.teamId
      )?.id;
      if (!installationId) {
        return {
          systems: [],
          total: 0,
        };
      }
      // This makes it so only orgs connected to the user will show up.
      // could add a fallback here if installationId is undefined to look for public repos.
      const resp = await octo.request(
        `GET /user/installations/{installationId}/repositories{?per_page,page}`,
        {
          installationId,
          per_page: pagination.pageSize,
          page: pagination.page,
        }
      );
      const systems = resp.data.repositories.map((r: any) =>
        this.repoToSystem(r)
      );
      return { systems, total: resp.data.total_count };
    } else if (input.filter === SystemListFilter.Batch) {
      //TODO: make this query a bit smarter
      const systems = (
        await Promise.all(input.opts.ids.map((id) => this.getSystem(ctx, id)))
      ).filter((s) => !!s) as System[];
      return { systems, total: systems.length };
    } else if (input.filter === SystemListFilter.Search) {
      const installations = await this.getInstallations(ctx);
      const q =
        input.opts.search +
        " in:name fork:true " +
        installations.map((inst) => `user:${inst.account?.login}`).join(" ");
      const searchResp = await octo.request(
        "GET /search/repositories{?q,sort,order,per_page,page}",
        {
          q,
          per_page: pagination.pageSize,
          page: pagination.page,
        }
      );

      const systems = searchResp.data.items.map((i: any) =>
        this.repoToSystem(i)
      );
      return { systems, total: searchResp.data.total_count };
    }

    throw new Error(`Filter not yet implemented: ${input}`);
  }
  key: string = "github";
}
