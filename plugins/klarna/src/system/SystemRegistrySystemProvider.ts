import { Secret } from "@gram/core/dist/config/Secret.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import System from "@gram/core/dist/data/systems/System.js";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider.js";
import {
  SystemListInput,
  SystemListResult
} from "@gram/core/dist/data/systems/systems.js";
import { isDevelopment } from "@gram/core/dist/util/env.js";
import log4js from "log4js";
import fetch from "node-fetch";

const log = log4js.getLogger("SystemRegistrySystemProvider");


export interface SystemRegistrySystem {
  /**
   * {
  "key": "NGOV-12345",
  "name": "System Registry API",
  "system_id": "system-registry-api",
  "system_description": "Provides access to System Registry",
  "klarna_team_name": "Cloud Inventory",
  "klarna_team_key": "KO-123456",
  "klarna_team_ac": "201234",
  "system_type": "Klarna System",
  "business_critical": false,
  "lifecycle_state": "Live",
  "lifecycle_transition_date": "2025-03-01T12:00:00.000Z",
  "rto": "2",
  "rpo": 24,
  "availability_class": "4",
  "audience_class": "Klarna Internal",
  "confidentiality_class": "Internal",
  "integrity_class": "Low",
  "supplier_mfiles": "https://klarna-dms.cloudvault.m-files.com/Default.aspx?#XYZ/latest",
  "requirements_scope": [
    "ISAE 3000",
    "ISAE 3402"
  ],
  "system_documentation": "https://wiki.klarna.net/wiki/Some_Page",
  "user_documentation": "https://wiki.klarna.net/wiki/Some_Page",
  "created": "2022-03-01T12:00:00.000Z",
  "updated": "2023-03-01T12:00:00.000Z",
  "klarna_domain_name": "Klarna Engeneering Platform",
  "klarna_domain_ac": "900138"
}
   */
  key: string;
  name: string;
  system_id: string;
  system_description: string;
  klarna_team_name: string;
  klarna_team_key: string;
  klarna_team_ac: string;
  system_type: string;
  business_critical: boolean;
  lifecycle_state: "Purged" | "Archived" | "Live" | "Sunset" | "Development";
  lifecycle_transition_date: string;
  // Can add more fields here if needed
}

export class SystemRegistrySystemProvider implements SystemProvider {
  key = "oktane";
  systems: SystemRegistrySystem[] = [];

  systemsByTeam: Map<string, SystemRegistrySystem[]> = new Map();
  systemsById: Map<string, SystemRegistrySystem> = new Map();

  constructor(private systemRegistryUser?: Secret, private systemRegistryPassword?: Secret) {}

  listSystems(ctx: RequestContext, input: SystemListInput, pagination: { page: number; pageSize: number; }): Promise<SystemListResult> {
    throw new Error("Method not implemented.");
  }

  /**
   * Fetches a system from the System Registry
   * @param systemId
   * @returns System
   */
  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
    const url = isDevelopment() ? `https://systems.klarna.net/api/v1/systems/${systemId}` : `http://systems.klarna.net/api/v1/systems/${systemId}`; // Bouncer should upgrade to HTTPS
    const headers: any = {
      Accept: "application/json",      
    };
    if (isDevelopment() && this.systemRegistryUser && this.systemRegistryPassword) {
      const user = await this.systemRegistryUser.getValue();
      const pass = await this.systemRegistryPassword.getValue();
      const auth = Buffer.from(`${user}:${pass}`).toString("base64");
      log.debug(`Using basic auth for system registry: ${user}`);
      headers["Authorization"] = `Basic ${auth}`;
    }
    log.debug(`Fetching system ${systemId} from System Registry`);    
    const resp = await fetch(url, { headers });

    if (!resp.ok) {
      log.error(`Failed to fetch system ${systemId} from System Registry: ${resp.status} ${resp.statusText} ${await resp.text()}`);
      return null;
    }

    const system = await resp.json() as SystemRegistrySystem;    

    return new System(
      system.system_id,
      system.system_id,
      system.name,
      [
        {
          id: system.klarna_team_ac,
          name: system.klarna_team_name,
        },
      ],
      system.system_description
    );
  }
}
