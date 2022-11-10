import { App } from "octokit";
import { SystemProperty, SystemPropertyProvider, SystemPropertyValue } from "../../data/system-property";
import System from "../../data/systems/System";
import {
  AppContext,
  SystemListFilter,
  SystemListInput,
  SystemListResult,
  SystemProvider,
} from "../../data/systems/SystemProvider";

export class GithubSystemProvider implements SystemProvider, SystemPropertyProvider {
  constructor(private app: App) {}

  id: string = "github";

  definitions: SystemProperty[] = [
    {
      id: "url",
      batchFilterable: false,
      label: "url",
      description: "Github repository url",
    },
  ];
  async provide(systemObjectId: string, quick: boolean): Promise<SystemPropertyValue[]> {
    // this.getSystem(systemObjectId)
    const repo = Buffer.from(systemObjectId, "base64").toString("ascii");
    return [
      {
        id: "url",
        label: "url",
        description: "Github repository url",
        value: "https://github.com/" + repo,
        displayInList: false,
        batchFilterable: false,
      },
    ];
  }
  async list(propertyId: string, value: any): Promise<string[]> {
    return [];
  }

  async getOcto(ctx: AppContext) {
    const token = ctx.currentRequest.user.providerToken;
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

  async getSystem(ctx: AppContext, systemId: string): Promise<System | null> {
    const octo = await this.getOcto(ctx);
    const decoded = Buffer.from(systemId, "base64").toString("ascii");
    const parts = decoded.split("/");

    const resp = await octo.request(`GET /repos/${parts[0]}/${parts[1]}`);
    if (!resp.data) {
      return null;
    }
    return this.repoToSystem(resp.data);
  }

  async listSystems(
    ctx: AppContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    const octo = await this.getOcto(ctx);

    if (input.filter === SystemListFilter.Team) {
      const resp = await octo.request(`GET /user/installations/{installationId}/repositories{?per_page,page}`, {
        installationId: input.opts.teamId,
        per_page: pagination.pageSize,
        page: pagination.page,
      });
      const systems = resp.data.repositories.map((r: any) => this.repoToSystem(r));
      return { systems, total: resp.data.total_count };
    } else if (input.filter === SystemListFilter.Batch) {
      //TODO: make this query a bit smarter
      const systems = (await Promise.all(input.opts.ids.map((id) => this.getSystem(ctx, id)))).filter(
        (s) => !!s
      ) as System[];
      return { systems, total: systems.length };
    } else if (input.filter === SystemListFilter.Search) {
      const { data: installations } = await octo.request("GET /user/installations", {});
      const q =
        input.opts.search +
        " in:name fork:true " +
        installations.installations.map((inst) => `user:${inst.account?.login}`).join(" ");
      const searchResp = await octo.request("GET /search/repositories{?q,sort,order,per_page,page}", {
        q,
        per_page: pagination.pageSize,
        page: pagination.page,
      });
      const systems = searchResp.data.items.map((i: any) => this.repoToSystem(i));
      return { systems, total: searchResp.data.total_count };
    }

    throw new Error(`Filter not yet implemented: ${input}`);
  }
  key: string = "github";
}
