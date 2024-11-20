import {
  SuggestedControl,
  SuggestedThreat,
  SuggestionStatus,
} from "@gram/core/dist/data/suggestions/Suggestion.js";
import {
  ModelTestRuleArgs,
  ModelValidationRule,
  ValidationRule,
} from "@gram/core/dist/validation/models.js";

const _workshopValidationRules: ValidationRule[] = [
  {
    type: "model",
    affectedType: [],
    name: "should represent the cleanup service",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "proc" &&
          component.classes?.find((c) => c.name === "AWS Lambda")
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and stack",
  },
  {
    type: "model",
    affectedType: [],
    name: "should represent the smtp service",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "ee" &&
          component.name.toLowerCase().includes("smtp")
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and name",
  },
  {
    type: "model",
    affectedType: [],
    name: "should represent the authentication service",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "ee" &&
          ["authentication", "auth"].includes(component.name.toLowerCase())
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and name",
  },
  {
    type: "model",
    affectedType: [],
    name: "should represent the backend API",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "proc" &&
          component.classes?.find((c) => c.name === "Java")
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and stack",
  },
  {
    type: "model",
    affectedType: [],
    name: "should represent the frontend application",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "proc" &&
          component.classes?.find((c) => c.name === "React")
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and stack",
  },
  {
    type: "model",
    affectedType: [],
    name: "should represent the postgres database",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "ds" &&
          component.classes?.find((c) => c.name === "PostgreSQL")
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and stack",
  },
  {
    type: "model",
    affectedType: [],
    name: "should represent the S3 bucket",
    test: async ({ model }) =>
      model.data.components.some(
        (component) =>
          component.type === "ds" &&
          component.classes?.find((c) => c.name === "Amazon S3 Standard")
      ),
    messageTrue: "Component is there",
    messageFalse: "No component matches the type of component and stack",
  },
  {
    type: "model",
    affectedType: [],
    name: "should have at least one trust boundary",
    test: async ({ model }) =>
      model.data.components.some((component) => component.type === "tb"),
    messageTrue: "Component is there",
    messageFalse:
      "Group components that share some form of trust (eg. AWS account)",
  },
  // Threat rules
  {
    type: "model",
    affectedType: [],
    name: "should have at least one freeform threat, neither STRIDE nor suggested",
    test: async ({ threats }) =>
      !!threats &&
      threats?.some((threat) => {
        if (threat.deletedAt) {
          return false;
        }
        const name = threat.title.toLowerCase();
        return (
          threat.suggestionId === undefined &&
          ![
            "spoofing",
            "tampering",
            "repudiation",
            "information disclosure",
            "denial of service",
            "elevation of privilege",
          ].includes(name)
        );
      }),
    messageTrue: "Threat is there",
    messageFalse: "Brainstorm some threats on your own",
  },
  {
    type: "component",
    affectedType: ["proc", "ds", "tb"],
    name: "should have at least one STRIDE threat",
    test: async ({ threats }) =>
      !!threats &&
      threats?.some((threat) => {
        if (threat.deletedAt) {
          return false;
        }
        const name = threat.title.toLowerCase();
        return [
          "spoofing",
          "tampering",
          "repudiation",
          "information disclosure",
          "denial of service",
          "elevation of privilege",
        ].includes(name);
      }),
    messageTrue: "STRIDE threat is there",
    messageFalse: "Select at least one STRIDE threat for this component",
  },
  /*     {
    type: "component",
    affectedType: ["proc", "ds", "tb"],
    name: "should have at least one suggested threat accepted",
    test: async ({ threats }) =>
      !!threats &&
      threats?.some((threat) => {
        if (threat.deletedAt) {
          return false;
        }

        const name = threat.title.toLowerCase();

        return (
          threat.suggestionId !== undefined &&
          ![
            "spoofing",
            "tampering",
            "repudiation",
            "information disclosure",
            "denial of service",
            "elevation of privilege",
          ].includes(name)
        );
      }),
    messageTrue: "Threat is there",
    messageFalse: "Select at least one suggested threat for this component",
  }, */
  {
    type: "component",
    affectedType: ["proc", "ds", "tb"],
    name: "should have some accepted or declined at least one suggestion",
    test: async ({ component, threatSuggestions, controlSuggestions }) => {
      const hasAcceptedOrDeclined = (
        suggestion: SuggestedControl | SuggestedThreat
      ) =>
        [SuggestionStatus.Accepted, SuggestionStatus.Rejected].includes(
          suggestion.status
        );

      const isComponentSuggestion = (
        suggestion: SuggestedControl | SuggestedThreat
      ) => {
        const name = suggestion.title.toLowerCase();

        return (
          suggestion.componentId === component.id &&
          ![
            "spoofing",
            "tampering",
            "repudiation",
            "information disclosure",
            "denial of service",
            "elevation of privilege",
          ].includes(name)
        );
      };

      const filteredThreats = threatSuggestions?.filter(isComponentSuggestion);
      const filteredControls = controlSuggestions?.filter(
        isComponentSuggestion
      );

      if (filteredThreats?.length === 0 && filteredControls?.length === 0) {
        return true; // If no suggestion is present, the rule passes automatically
      }

      return Boolean(
        filteredThreats?.some(hasAcceptedOrDeclined) ||
          filteredControls?.some(hasAcceptedOrDeclined)
      );
    },
    messageTrue: "At least one suggestion has been accepted or declined",
    messageFalse:
      "No suggestion have been accepted or declined on this component",
  },
  // Controls?
  {
    type: "model",
    affectedType: [],
    name: "should have at least one freeform control, not suggested",
    test: async ({ controls }) =>
      Boolean(controls?.some((control) => control.suggestionId === undefined)),
    messageTrue: "At least one freeform control exist",
    messageFalse: "Brainstorm some threats on your own",
  },
  // Mitigation
  {
    type: "component",
    affectedType: ["proc", "ds", "tb"],
    name: "should have at least one threat mitigated with controls",
    test: async ({ component, mitigations, threats }) => {
      return Boolean(
        threats
          ?.filter((th) => component.id === th.componentId)
          .some((th) => {
            return mitigations?.some((m) => m.threatId === th.id);
          })
      );
    },
    messageTrue: "Threat is there",
    messageFalse: "Associate a threat with at least 1 control",
  },
  // Dataflows
  {
    type: "model",
    affectedType: [],
    name: "should have at least one dataflow with a label",
    test: async ({ model }) => {
      if (model.data.dataFlows?.length === 0) {
        return true;
      }
      return Boolean(model.data.dataFlows?.some((df) => df.label));
    },
    messageTrue: "Label is there",
    messageFalse: "No dataflow with label exists",
  },
];

const isWorkshopModel = async (args: ModelTestRuleArgs) => {
  return args.model.version.toLowerCase().includes("workshop");
};

const isStandaloneModel = async (args: ModelTestRuleArgs) => {
  return args.model.systemId === null;
};

const workshopValidationRules: ValidationRule[] = _workshopValidationRules.map(
  (rule: ValidationRule) => {
    return {
      ...rule,
      conditionalRules: [isWorkshopModel, isStandaloneModel],
    };
  }
);

export { workshopValidationRules };
