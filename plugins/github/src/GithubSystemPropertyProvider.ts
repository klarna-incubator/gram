import { getLogger } from "gram-api/src/logger";
import { App } from "octokit";
import {
  SystemProperty,
  SystemPropertyValue,
} from "gram-api/src/data/system-property/types";
import { RequestContext } from "gram-api/src/data/providers/RequestContext";
import { GithubSystemProvider } from "./GithubSystemProvider";
import { SystemPropertyProvider } from "gram-api/src/data/system-property/SystemPropertyProvider";

const log = getLogger("GithubSystemProvider");

export class GithubSystemPropertyProvider implements SystemPropertyProvider {
  constructor(private app: App, private sysProvider: GithubSystemProvider) {}

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

  async provideSystemProperties(
    ctx: RequestContext,
    systemId: string,
    quick: boolean
  ): Promise<SystemPropertyValue[]> {
    const repo = await this.sysProvider.getRepo(ctx, systemId);
    const repoName = Buffer.from(systemId, "base64").toString("ascii");

    return [
      {
        id: "url",
        label: "URL",
        description: "Github repository url",
        value: "https://github.com/" + repoName,
        displayInList: false,
        batchFilterable: false,
      },
      {
        id: "language",
        label: "Language",
        value: repo.language || "unknown",
        displayInList: false,
        batchFilterable: false,
      },
      {
        id: "private",
        label: "Private",
        value: repo.private.toString(),
        displayInList: true,
        batchFilterable: true,
      },
      {
        id: "fork",
        label: "Fork",
        value: repo.fork.toString(),
        displayInList: true,
        batchFilterable: true,
      },
      {
        id: "stars",
        label: "Stars",
        value: repo.stargazers_count,
        displayInList: false,
        batchFilterable: false,
      },
    ];
  }

  async listSystemByPropertyValue(
    ctx: RequestContext,
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

    const installations = await this.sysProvider.getInstallations(ctx);
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

  async getOcto(ctx: RequestContext) {
    const token = ctx.currentRequest?.user.providerToken;
    return this.app.oauth.getUserOctokit({ token });
  }

  key: string = "github";
}
