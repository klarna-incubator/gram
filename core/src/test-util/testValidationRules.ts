import { ValidationRule } from "../validation/models.js";

export const testValidationRules: ValidationRule[] = [
  {
    type: "component",
    name: "should have a name",
    affectedType: ["proc", "ee", "ds", "tb"],
    test: async ({ component }) => component.name.trim() !== "",
    messageTrue: "Component has a name",
    messageFalse: "Component does not have a name",
  },
];
