import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types";
import { getLogger } from "log4js";
import { OctaneSystemProvider } from "./OctaneSystemProvider";

const log = getLogger("system-context-provider");

export class NGOVSystemContextProvider implements SystemPropertyProvider {
  id = "ngov";

  constructor(private systemProvider: OctaneSystemProvider) {}

  async provideSystemProperties(
    ctx: RequestContext,
    systemObjectId: string,
    quick: boolean
  ): Promise<SystemPropertyValue[]> {
    if (quick) {
      return [];
    }

    const items: SystemPropertyValue[] = [];

    const system = await this.systemProvider.getOctaneSystem(systemObjectId);

    if (!system) {
      return [];
    }

    log.debug(`Got system: ${JSON.stringify(system, null, 4)}`);

    this.attachItem(items, system.team?.domain_name, "domain", "Domain", true);
    this.attachItem(
      items,
      system.audience_class,
      "audience",
      "Audience Classification"
    );
    this.attachItem(
      items,
      system.confidentiality_class,
      "confidentiality",
      "Confidentiality Classification"
    );
    this.attachItem(
      items,
      system.integrity_class,
      "integrity",
      "Integrity Classification"
    );
    this.attachItem(
      items,
      system.availability_class,
      "availability",
      "Availability Class"
    );
    this.attachItem(
      items,
      system.business_critical,
      "business-critical",
      "Business Critical"
    );
    this.attachItem(
      items,
      system.type_of_processed_or_stored_data,
      "type-data-processed",
      "Type of Processed Data"
    );

    return items;
  }

  async listSystemByPropertyValue(
    ctx: RequestContext,
    propertyId: string,
    value: any
  ): Promise<string[]> {
    if (propertyId !== "domain") {
      throw new Error("Method not implemented.");
    }

    return Array.from(
      new Set<string>(
        this.systemProvider.systems
          .filter((sys) => sys.team.domain_name === value)
          .map((sys) => sys.system_id)
      )
    );
  }

  definitions: SystemProperty[] = [
    {
      id: "domain",
      label: "Domain",
      type: "radio",
      values: async (ctx: RequestContext) => {
        return Array.from(
          new Set<string>(
            this.systemProvider.systems
              .map((sys) => sys.team.domain_name)
              .filter((name) => name) as string[]
          )
        );
      },
    },
    {
      id: "ngov-audience",
      label: "Audience Classification",
      type: "readonly",
    },
    {
      id: "ngov-confidentiality",
      label: "Confidentiality Classification",
      type: "readonly",
    },
    {
      id: "ngov-integrity",
      label: "Integrity Classification",
      type: "readonly",
    },
    {
      id: "ngov-availability",
      label: "Availability Class",
      type: "readonly",
    },
    {
      id: "ngov-business-critical",
      label: "Business Critical",
      type: "readonly",
    },
    {
      id: "ngov-type-data-processed",
      label: "Type of Processed Data",
      type: "readonly",
    },
  ];

  private attachItem(
    items: SystemPropertyValue[],
    property: any,
    id: string,
    label: string,
    displayInList = false
  ) {
    if (property === undefined) return;

    const item: SystemPropertyValue = {
      id,
      label,
      value: property,
      displayInList,
    };

    items.push(item);
  }
}
