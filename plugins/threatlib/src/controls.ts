import Model, { Component } from "gram-api/src/data/models/Model";
import { SourceSuggestedControl } from "gram-api/src/suggestions/models";
import { ThreatLibControlSuggestion } from "./types";

const clientsideEncryption: ThreatLibControlSuggestion = {
  slug: "s3-clientside-encryption",
  title: "Enable Clientside Encryption",
  description: `Enable clientside encryption on the S3 bucket to add an additional layer of encryption to
    any items stored in the S3 bucket.`,
  mitigates: [],
  condition: (model: Model, component: Component) => {
    return !!component.classes?.find((c) => c.name.includes("AWS S3"));
  },
};

const sqlParameterization: ThreatLibControlSuggestion = {
  slug: "sql-paramerization",
  title: "Use SQL Parameterization",
  description: `Ensure any input data is supplied to the SQL query using parameterization.`,
  mitigates: ["sql-injection"],

  condition: (model: Model, component: Component) => {
    const neighbours = model.data.dataFlows
      .filter(
        (df) =>
          df.endComponent.id === component.id ||
          df.startComponent.id === component.id
      )
      .map((df) => [df.endComponent.id, df.startComponent.id])
      .reduce((p, c) => [...p, ...c], [])
      .filter((cid) => cid !== component.id);
    const neighbourTechStacks = model.data.components
      .filter((c) => neighbours.includes(c.id))
      .map((c) => c.classes || [])
      .reduce((p, c) => [...p, ...c], []);
    return !!neighbourTechStacks.find((c) =>
      c.name.toLowerCase().includes("sql")
    );
  },
};

const cspHeaders: ThreatLibControlSuggestion = {
  slug: "csp-headers",
  title: "Content Security Policy Headers",
  description: `Configure Content Security Policy headers on your webbapplication to harden against XSS.`,
  mitigates: ["xss"],

  condition: (model: Model, component: Component) => {
    return !!component.classes?.find((c) =>
      ["react", "jquery", "angular"].find((t) =>
        c.name.toLowerCase().includes(t)
      )
    );
  },
};

const controls = [clientsideEncryption, sqlParameterization, cspHeaders];

export function mapControls(
  model: Model,
  component: Component
): SourceSuggestedControl[] {
  return controls
    .filter((c) => c.condition(model, component))
    .map((c) => ({
      ...c,
      mitigates: c.mitigates.map((m) => ({ partialThreatId: m })),
      componentId: component.id,
    }));
}
