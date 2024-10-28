import { ValidationRule } from "@gram/core/dist/validation/models.js";

export const basicValidationRules: ValidationRule[] = [
  {
    type: "component",
    name: "should have a name",
    affectedType: ["proc", "ee", "ds", "tb"],
    test: async ({ component }) => component.name.trim() !== "",
    messageTrue: "Component has a name",
    messageFalse: "Component does not have a name",
  },
  {
    type: "component",
    name: "should have a long enough description",
    affectedType: ["proc", "ee", "ds", "tb"],
    conditionalRules: [["should have a description", true]],
    test: async ({ component }) =>
      component.description ? component.description.length > 50 : false,
    messageTrue: "Component has a long enough description",
    messageFalse:
      "Component's description should be at least 50, to be descriptive enough",
  },
  {
    type: "component",
    name: "should have at least one tech stack",
    affectedType: ["proc", "ds", "tb"],
    test: async ({ component }) =>
      component.classes ? component.classes.length > 0 : false,
    messageTrue: "Component has at least one tech stack",
    messageFalse: "Component does not have any tech stack",
  },
  {
    type: "component",
    name: "should have at least one dataflow",
    affectedType: ["proc", "ds", "ee"],
    test: async ({ component, dataflows }) => {
      if (!dataflows) {
        return false;
      }
      if (dataflows.length === 0) {
        return false;
      }
      return dataflows.some(
        (dataflow) =>
          dataflow.endComponent.id === component.id ||
          dataflow.startComponent.id === component.id
      );
    },
    messageTrue: "Component has at least one dataflow",
    messageFalse: "Component does not have any dataflow",
  },
  {
    type: "component",
    name: "should have at least one threat",
    affectedType: ["proc", "ds", "tb"],
    test: async ({ component, threats }) =>
      threats
        ? threats.some((threat) => threat.componentId === component.id)
        : false,
    messageTrue: "Component has at least one threat",
    messageFalse: "Component does not have any threats",
  },
  {
    type: "component",
    name: "should have at least one control",
    affectedType: ["proc", "ds", "tb"],
    test: async ({ component, controls }) =>
      controls
        ? controls.some((control) => control.componentId === component.id)
        : false,
    messageTrue: "Component has at least one threat",
    messageFalse: "Component does not have any threats",
  },
  {
    type: "model",
    name: "should have at least one component",
    affectedType: [],
    test: async ({ model }) => model.data.components.length > 0,
    messageTrue: "Model has at least one component",
    messageFalse: "Model is empty",
  },
];
