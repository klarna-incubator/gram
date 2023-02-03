import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types";
import { getLogger } from "@gram/core/dist/logger";
import { OctaneSystemProvider } from "./OctaneSystemProvider";

const log = getLogger("system-context-provider");

export class SystemContextProvider implements SystemPropertyProvider {
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

    this.attachItem(
      items,
      system.team?.domain_name,
      "domain",
      "Domain",
      true,
      true
    );
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
  listSystemByPropertyValue(
    ctx: RequestContext,
    propertyId: string,
    value: any
  ): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  definitions: SystemProperty[] = [
    {
      id: "domain",
      label: "Domain",
      batchFilterable: false,
    },
    {
      id: "ngov-audience",
      label: "Audience Classification",
      batchFilterable: false,
    },
    {
      id: "ngov-confidentiality",
      label: "Confidentiality Classification",
      batchFilterable: false,
    },
    {
      id: "ngov-integrity",
      label: "Integrity Classification",
      batchFilterable: false,
    },
    {
      id: "ngov-availability",
      label: "Availability Class",
      batchFilterable: false,
    },
    {
      id: "ngov-business-critical",
      label: "Business Critical",
      batchFilterable: false,
    },
    {
      id: "ngov-type-data-processed",
      label: "Type of Processed Data",
      batchFilterable: false,
    },
  ];

  private attachItem(
    items: SystemPropertyValue[],
    property: any,
    id: string,
    label: string,
    batchFilterable = false,
    displayInList = false
  ) {
    if (property === undefined) return;

    const item: SystemPropertyValue = {
      id,
      label,
      value: property,
      batchFilterable,
      displayInList,
    };

    items.push(item);
  }
}
