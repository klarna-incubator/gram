import { TeamProvider } from "@gram/core/dist/auth/TeamProvider.js";
import { Team } from "@gram/core/dist/auth/models/Team.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import {
  SearchFilter,
  SearchProvider,
  SearchProviderResult,
  SearchType,
} from "@gram/core/dist/search/SearchHandler.js";
import log4js from "log4js";
import { getUserInfo } from "./util.js";
import { OIDCUserStore } from "./OIDCUserStore.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

const log = log4js.getLogger("OIDCTeamProvider");

export interface OIDCTeamProviderSettings {
  /**
   * Name of the claim that contains group/team information
   */
  groupsClaimName: string;
  /**
   * Mapping function to convert group/team names to Team objects
   */
  groupToTeam: (groupName: string) => Team;
  /**
   * Optional filter to limit which groups are treated as teams.
   * If provided, only groups in this list will be converted to teams.
   * If not provided or empty, all groups will be used as teams.
   */
  groupFilter?: string[];
}

export class OIDCTeamProvider implements TeamProvider, SearchProvider {
  constructor(
    private dal: DataAccessLayer,
    public settings: OIDCTeamProviderSettings
  ) {}

  searchType: SearchType = { key: "team", label: "Team" };

  async search(filter: SearchFilter): Promise<SearchProviderResult> {
    const result: SearchProviderResult = {
      items: [],
      count: 0,
    };

    try {
      // Get all unique groups from the database
      const userStore = OIDCUserStore.getInstance(this.dal);
      const allGroups = await userStore.getAllUniqueGroups();

      // Apply group filter if configured
      let filteredGroups = allGroups;
      if (this.settings.groupFilter && this.settings.groupFilter.length > 0) {
        filteredGroups = allGroups.filter((group) =>
          this.settings.groupFilter!.includes(group)
        );
      }

      // Filter groups based on search text
      const searchText = filter.searchText.toLowerCase();
      const matchingGroups = filteredGroups.filter((group) =>
        group.toLowerCase().includes(searchText)
      );

      // Convert groups to teams and then to search result items
      result.items = matchingGroups.map((group) => {
        const team = this.settings.groupToTeam(group);
        return {
          id: team.id,
          label: team.name,
          url: `/team/${team.id}`,
        };
      });

      result.count = result.items.length;

      // Apply pagination
      result.items = result.items.slice(
        filter.page * filter.pageSize,
        (filter.page + 1) * filter.pageSize
      );

      log.debug(`Team search completed`, {
        searchText: filter.searchText,
        totalGroups: allGroups.length,
        filteredGroups: filteredGroups.length,
        matchingTeams: result.count,
        returnedItems: result.items.length,
      });

      return result;
    } catch (error) {
      log.error("Error during team search:", error);
      return result; // Return empty result on error
    }
  }

  async lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]> {
    // Filter team IDs based on groupFilter setting if provided
    let filteredTeamIds = teamIds;
    if (this.settings.groupFilter && this.settings.groupFilter.length > 0) {
      filteredTeamIds = teamIds.filter((teamId) =>
        this.settings.groupFilter!.includes(teamId)
      );
      log.debug(`Filtered team lookup`, {
        originalCount: teamIds.length,
        filteredCount: filteredTeamIds.length,
        filter: this.settings.groupFilter,
      });
    }

    // Create team objects from the filtered team IDs using the mapping function
    return filteredTeamIds.map((teamId) => this.settings.groupToTeam(teamId));
  }

  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    const userInfo = await getUserInfo(this.dal, userId, log);

    if (!userInfo || !userInfo.groups) {
      return [];
    }

    // Filter groups based on groupFilter setting
    let filteredGroups = userInfo.groups;
    if (this.settings.groupFilter && this.settings.groupFilter.length > 0) {
      filteredGroups = userInfo.groups.filter((group: string) =>
        this.settings.groupFilter!.includes(group)
      );
      log.debug(`Filtered groups for user ${userId}`, {
        originalCount: userInfo.groups.length,
        filteredCount: filteredGroups.length,
        filter: this.settings.groupFilter,
      });
    }

    return filteredGroups.map((group: string) =>
      this.settings.groupToTeam(group)
    );
  }

  key = "oidc";
}
