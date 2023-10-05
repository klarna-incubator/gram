import { RequestContext } from "../providers/RequestContext.js";

export interface SystemPropertyValue extends SystemPropertyBase {
  /**
   * The value of the item
   */
  value: string | string[];
  /**
   * Whether this property should be displayed in a list or not.
   */
  displayInList: boolean;
}

export interface SystemPropertyFilter {
  propertyId: string;
  value: string;
}

interface SystemPropertyBase {
  /**
   * A unique ID for this item. A slug is recommended, i.e. aws-region
   */
  id: string;
  /**
   * A human readable label for the item
   */
  label: string;
  /**
   * Description of the item, to explain what it means.
   */
  description?: string;
}

interface ReadOnlySystemProperty extends SystemPropertyBase {
  type: "readonly";
}

interface ToggleSystemProperty extends SystemPropertyBase {
  type: "toggle";
}

interface RadioSystemProperty extends SystemPropertyBase {
  type: "radio";

  /**
   * Possible values to select from.
   */
  values: ((ctx: RequestContext) => Promise<string[]>) | string[];
}

export type SystemProperty =
  | ReadOnlySystemProperty
  | ToggleSystemProperty
  | RadioSystemProperty;
