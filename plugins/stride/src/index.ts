import Model from "@gram/core/dist/data/models/Model.js";
import {
  SuggestionResult,
  SuggestionSource,
} from "@gram/core/dist/suggestions/models.js";

const STRIDE = [
  {
    title: "Spoofing",
    description:
      "Threat of an attacker impersonating an existing user in a system.",
    slug: "spoofing",
  },
  {
    title: "Tampering",
    description:
      "Modifying state or data within a system by manipulating parameters or information on-the-fly.",
    slug: "tampering",
  },
  {
    title: "Repudiation",
    description: "Ability of a malicious actor to deny actions done.",
    slug: "repudiation",
  },
  {
    title: "Information Disclosure",
    description:
      "Exfiltration of data not intended for the attacker or current consumer.",
    slug: "information-disclosure",
  },
  {
    title: "Denial of Service",
    description:
      "Threat of degrading or completely removing the availability of the system.",
    slug: "denial-of-service",
  },
  {
    title: "Elevation of Privilege",
    description:
      "Being able to abuse or bypass access controls to be able to do actions not intended for the original role.",
    slug: "elevation-of-privilege",
  },
];

export class StrideSuggestionProvider implements SuggestionSource {
  slug: string = "stride";
  name: string = "stride";
  async suggest(model: Model): Promise<SuggestionResult> {
    const componentThreats = model.data.components
      .map((c) => STRIDE.map((s) => ({ ...s, componentId: c.id })))
      .reduce((p, c) => [...p, ...c], []);
    const dataFlowThreats = model.data.dataFlows
      .map((c) => STRIDE.map((s) => ({ ...s, componentId: c.id })))
      .reduce((p, c) => [...p, ...c], []);

    const result: SuggestionResult = {
      threats: componentThreats.concat(dataFlowThreats),
      controls: [],
    };

    return result;
  }
}
