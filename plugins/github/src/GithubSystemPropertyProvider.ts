import log4js from "log4js";
import { App } from "octokit";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { GithubSystemProvider } from "./GithubSystemProvider.js";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider.js";

const log = log4js.getLogger("GithubSystemProvider");

export class GithubSystemPropertyProvider implements SystemPropertyProvider {
  constructor(private app: App, private sysProvider: GithubSystemProvider) {}

  id: string = "github";

  definitions: SystemProperty[] = [
    {
      type: "readonly",
      id: "url",
      label: "URL",
      description: "Github repository url",
    },
    {
      id: "language",
      type: "readonly",
      label: "language",
      description: "Programming language detected",
    },
    {
      id: "private",
      type: "readonly",
      label: "Private",
      description: "Is the repo private?",
    },
    {
      id: "fork",
      type: "readonly",
      label: "Fork",
      description: "Is the repo a fork?",
    },
    {
      id: "stars",
      type: "readonly",
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
      },
      {
        id: "language",
        label: "Language",
        value: repo.language || "unknown",
        displayInList: false,
      },
      {
        id: "private",
        label: "Private",
        value: repo.private.toString(),
        displayInList: true,
      },
      {
        id: "fork",
        label: "Fork",
        value: repo.fork.toString(),
        displayInList: true,
      },
      {
        id: "stars",
        label: "Stars",
        value: repo.stargazers_count,
        displayInList: false,
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
    q += installations.map((inst) => `user:${inst.account?.name}`).join(" ");

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
    if (!token) {
      throw new Error("no github token found in user session");
    }
    return this.app.oauth.getUserOctokit({ token });
  }

  key: string = "github";
}
