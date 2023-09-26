import { readFileSync, writeFileSync } from "fs";
import fetch from "node-fetch";
import System from "@gram/core/dist/data/systems/System";
import {
  SystemListFilter,
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems";
import { getLogger } from "log4js";
import { isDevelopment } from "@gram/core/dist/util/env";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";

const log = getLogger("OktaneSystemProvider");

export interface OctaneSystem {
  key: string;
  name: string;
  system_id: string;
  system_description: string;

  team: Partial<{
    key: string;
    team_name: string;
    type: string;
    domain: Partial<{
      key: string;
      team_name: string;
      type: string;
      manager: Partial<{
        key: string;
        name: string;
        email: string;
        username: string;
        jira_user: string;
      }>;
      accountability_code: string;
      parent: string;
      communication_channels: Partial<{
        team_slack: string;
        billing_slack: string;
        operations_slack: string;
      }>;
      domain_name: string;
    }>;
    manager: Partial<{
      key: string;
      name: string;
      email: string;
      username: string;
      jira_user: string;
    }>;
    accountability_code: string;
    parent: Partial<{
      key: string;
      team_name: string;
      type: string;
      domain: string;
      manager: Partial<{
        key: string;
        name: string;
        email: string;
        username: string;
        jira_user: string;
      }>;
      accountability_code: string;
      parent: string;
      communication_channels: Partial<{
        team_slack: string;
        billing_slack: string;
        operations_slack: string;
      }>;
    }>;
    is_inactive: string;
    aws_accounts: string[];
    communication_channels: Partial<{
      team_email: string;
      team_slack: string;
      billing_email: string;
      security_email: string;
      operations_email: string;
      billing_slack: string;
      security_slack: string;
      operations_slack: string;
      opsgenie_schedule: string;
    }>;
    domain_name: string;
  }>;
  business_critical: string;
  system_type: string;
  type_of_processed_or_stored_data: string;
  availability_class: string;
  sla: string;
  rto: string;
  audience_class: string;
  confidentiality_class: string;
  integrity_class: string;
  enduser_auth_method: string;
  enduser_mf_auth_method: string;
  environment: string;
  created: string;
  decommissioned: string;
}

export interface SystemResponse {
  // metadata: any;
  systems: OctaneSystem[];
}

const DevelopmentLocalFileCache = ".octane-systems.json";

export class OctaneSystemProvider implements SystemProvider {
  key = "oktane";
  systems: OctaneSystem[] = [];

  systemsByTeam: Map<string, OctaneSystem[]> = new Map();
  systemsById: Map<string, OctaneSystem> = new Map();

  constructor() {
    this.loadSystems();
  }

  async loadSystems() {
    let result: SystemResponse | null = null;
    try {
      if (isDevelopment()) {
        try {
          const json = readFileSync(DevelopmentLocalFileCache, {
            encoding: "utf-8",
          });
          result = JSON.parse(json);
          log.info(
            `Loaded cached octane systems from ${DevelopmentLocalFileCache} to save you some time. If you want to refresh your local cache, delete the file`
          );
        } catch (err) {
          log.info(
            `Could not cached systems from ${DevelopmentLocalFileCache}`
          );
        }
      }

      if (!result) {
        const resp = await fetch("https://octane.klarna.net/api/systems");
        result = await resp.json();
        if (isDevelopment()) {
          writeFileSync(DevelopmentLocalFileCache, JSON.stringify(result));
        }
      }
    } catch (err: unknown) {
      log.error("Error while fetching systems", err);
      return;
    }

    if (!result) return;

    this.systems = result.systems.filter(
      (s) => s.name && typeof s.name === "string"
    );

    this.systems
      .filter((s) => s.decommissioned === "true")
      .forEach((s) => (s.name = `(Decommissioned) ${s.name}`));

    log.info(`Loaded ${this.systems.length} systems`);

    const newSystemByTeam = new Map<string, OctaneSystem[]>();
    const newSystemsById = new Map<string, OctaneSystem>();

    this.systems.forEach((system) => {
      if (
        system.team?.accountability_code &&
        !newSystemByTeam.has(system.team?.accountability_code)
      ) {
        newSystemByTeam.set(system.team?.accountability_code, []);
      }
      newSystemByTeam
        .get(system.team.accountability_code as string)
        ?.push(system);

      // Set ID Lookup
      newSystemsById.set(system.system_id, system);
    });

    // New copies are used here to prevents a memory leak over time if systems
    // are decommisioned.
    this.systemsById = newSystemsById;
    this.systemsByTeam = newSystemByTeam;
  }

  /**
   * Gets slimmed down Gram system (just id and name)
   * @param systemId
   * @returns System
   */
  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
    const system = this.systems.find((s) => s.system_id === systemId.trim());

    if (!system) {
      return null;
    }

    return new System(
      system.system_id,
      system.system_id,
      system.name,
      [
        {
          id: system.team?.accountability_code as string,
          name: system.team?.team_name as string,
        },
      ],
      system.system_description
    );
  }

  async getOctaneSystem(
    systemId: string
  ): Promise<Partial<OctaneSystem> | null> {
    const system = this.systems.find((s) => s.system_id === systemId.trim());

    if (!system) {
      return null;
    }

    return system;
  }

  async listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number } = { page: 0, pageSize: 10 }
  ): Promise<SystemListResult> {
    // console.log(input);
    let systems: OctaneSystem[] = [];
    switch (input.filter) {
      case SystemListFilter.Search:
        systems = this.systems.filter((s) =>
          s.name.toLowerCase().includes(input.opts.search.toLowerCase())
        );
        break;
      case SystemListFilter.Batch:
        systems = input.opts.ids
          .map((id) => this.systemsById.get(id))
          .filter((s) => s !== undefined) as OctaneSystem[];
        break;
      case SystemListFilter.Team:
        systems = this.systemsByTeam.get(input.opts.teamId.toString()) || [];
        systems = systems.filter((s) => s.decommissioned !== "true");
        break;
    }

    const index = pagination.page * pagination.pageSize;
    const endIndex = index + pagination.pageSize;

    return {
      systems: systems.slice(index, endIndex).map(
        (system) =>
          new System(
            system.system_id,
            system.system_id,
            system.name,
            [
              {
                id: system.team?.accountability_code as string,
                name: system.team?.team_name as string,
              },
            ],
            system.system_description
          )
      ),
      total: systems.length,
    };
  }
}
