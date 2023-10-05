import { RequestContext } from "../providers/RequestContext.js";
import { SystemProperty, SystemPropertyValue } from "./types.js";

export interface SystemPropertyProvider {
  /**
   * A unique id to identify this provider. A slug is recommended
   */
  id: string;

  /**
   * Set definitions of System Properties
   */
  definitions: SystemProperty[];

  /**
   * Provide a list of System Property values for a given system
   */
  provideSystemProperties(
    ctx: RequestContext,
    systemObjectId: string,
    quick: boolean
  ): Promise<SystemPropertyValue[]>;

  /**
   * Used for filtering lists of systems.
   *
   * Should return a list of SystemIDs.
   */
  listSystemByPropertyValue(
    ctx: RequestContext,
    propertyId: string,
    value: any
  ): Promise<string[]>;
}
