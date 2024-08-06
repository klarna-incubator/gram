import { config } from "../config/index.js";

export type DynamicTextAttribute = {
  key: string;
  type: "text";
  label: string;
  defaultValue: string;
  multiline: boolean;
};

export type DynamicSelectAttribute = {
  key: string;
  type: "select";
  label: string;
  defaultValue: string[];
  options: string[];
  /**
   * If true, the user can enter a custom value that is not in the options list.
   */
  allowCustomValue: boolean;
  /**
   * If true, the user can select multiple values.
   */
  allowMultiple: boolean;
};

export type DynamicAttribute = DynamicTextAttribute | DynamicSelectAttribute;

export function getAttributesForFlow(): DynamicAttribute[] {
  return config.attributes.flow;
}

// export type DynamicNumberAttribute = {
//   key: string;
//   type: "number";
//   defaultValue: number;
// };

// export type DynamicBooleanAttribute = {
//   key: string;
//   type: "boolean";
//   defaultValue: boolean;
// };
