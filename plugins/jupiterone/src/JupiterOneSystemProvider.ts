import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import System from "@gram/core/dist/data/systems/System.js";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider.js";
import {
  SystemListFilter,
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems.js";
import {
  SearchFilter,
  SearchProvider,
  SearchProviderResult,
  SearchType,
} from "@gram/core/dist/search/SearchHandler.js";
import { JupiterOneClientFactory } from "./client.js";
import { sanitizeJ1QueryParam } from "./util.js";
import log4js from "log4js";

const log = log4js.getLogger("JupiterOneSystemProvider");

export class JupiterOneSystemProvider
  implements SystemProvider, SearchProvider
{
  id: string = "jupiterone";
  key: string = "jupiterone";

  integrationInstance: any;

  constructor(private j1ClientFactory: JupiterOneClientFactory) {}

  searchType: SearchType = {
    key: "system",
    label: "System",
  };

  async search(filter: SearchFilter): Promise<SearchProviderResult> {
    const text = sanitizeJ1QueryParam(filter.searchText);
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client!.queryV1(
      `FIND KSystem WITH lifecycleState = ('Development' OR 'Live' OR 'Sunset') AND systemId ~= '${text}' OR displayName ~= '${text}' as system
       THAT relates to Team as team
       Return system, team`
    );

    const pagedResult = result.slice(
      filter.page * filter.pageSize,
      (filter.page + 1) * filter.pageSize
    );

    return {
      count: result.length,
      items: pagedResult.map((row: any) => {
        return {
          id: row.system.properties.systemId,
          label: row.system.entity.displayName,
          url: `/system/${row.system.properties.systemId}`,
          description: row.system.properties.description,
        };
      }),
    };
  }

  async getJ1System(systemId: string): Promise<any> {
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client.queryV1(
      `FIND KSystem with systemId = '${sanitizeJ1QueryParam(
        systemId
      )}' as system
        THAT relates to Team as team                
        Return system, team`,
      {}
    );

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  async getSystemDomain(systemId: string): Promise<any | null> {
    const row = await this.getJ1System(systemId);

    if (!row) {
      return null;
    }

    const j1Client = await this.j1ClientFactory();
    const domainName = row.team.properties["tag.Domain"];

    if (!domainName) {
      return null;
    }

    const result = await j1Client.queryV1(
      `FIND domain with displayName = '${sanitizeJ1QueryParam(domainName)}'`
    );

    if (result.length === 0) {
      return null;
    }

    if (result.length > 1) {
      log.warn("Multiple domains found for system", systemId, domainName);
    }

    return result[0];
  }

  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
    const row = await this.getJ1System(systemId);

    if (!row) {
      return null;
    }

    return new System(
      row.system.properties.systemId,
      row.system.properties.systemId,
      row.system.properties.systemId,
      [
        {
          id: row.team.properties.accountabilityCode,
          name: row.team.entity.displayName,
        },
      ],
      row.system.properties.description
    );
  }

  async listTeamSystems(
    teamId: string,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client.queryV1(
      `FIND Team with accountabilityCode = '${sanitizeJ1QueryParam(
        teamId
      )}' as team 
      THAT OWNS KSystem with lifecycleState = ('Development' OR 'Live' OR 'Sunset') as system
      Return system, team`
    );

    const pagedResult = result.slice(
      pagination.page * pagination.pageSize,
      (pagination.page + 1) * pagination.pageSize
    );

    return {
      total: result.length,

      systems: pagedResult.map((row: any) => {
        return new System(
          row.system.properties.systemId,
          row.system.properties.systemId,
          row.system.entity.displayName,
          [
            {
              id: row.team.properties.accountabilityCode,
              name: row.team.entity.displayName,
            },
          ],
          row.system.properties.description
        );
      }),
    };
  }

  async listSystemByIds(
    systemIds: string[],
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client.queryV1(
      `FIND KSystem with systemId = (${systemIds
        .map((id) => `'${sanitizeJ1QueryParam(id)}'`)
        .join(" OR ")}) as system
        THAT relates to Team as team
        Return system, team
        `,
      {}
    );

    const pagedResult = result.slice(
      pagination.page * pagination.pageSize,
      (pagination.page + 1) * pagination.pageSize
    );

    return {
      total: result.length,
      systems: pagedResult.map((row: any) => {
        return new System(
          row.system.properties.systemId,
          row.system.properties.systemId,
          row.system.entity.displayName,
          [
            {
              id: row.team.properties.accountabilityCode,
              name: row.team.entity.displayName,
            },
          ],
          row.system.properties.description
        );
      }),
    };
  }

  async listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    if (input.filter === SystemListFilter.Batch) {
      return this.listSystemByIds(input.opts.ids, pagination);
    } else if (input.filter === SystemListFilter.Team) {
      return this.listTeamSystems(input.opts.teamId, pagination);
    }

    return {
      total: 0,
      systems: [],
    };
  }
}
