import Model, { Component } from "@gram/core/dist/data/models/Model";
import { SourceSuggestedThreat } from "@gram/core/dist/suggestions/models";
import { ThreatLibThreatSuggestion } from "./types";

const sqlInjection: ThreatLibThreatSuggestion = {
  slug: "sql-injection",
  title: "SQL Injection",
  description: `Systems that connect to SQL databases are potentially vulnerable to SQL Injection if input data is not properly handled and passed into an SQL query.`,

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

const xss: ThreatLibThreatSuggestion = {
  slug: "xss",
  title: "Cross-site Scripting",
  description: `Cross-Site Scripting (XSS) attacks are a type of injection, in which malicious scripts are injected into otherwise benign and trusted websites. XSS attacks occur when an attacker uses a web application to send malicious code, generally in the form of a browser side script, to a different end user. Flaws that allow these attacks to succeed are quite widespread and occur anywhere a web application uses input from a user within the output it generates without validating or encoding it.`,

  condition: (model: Model, component: Component) => {
    return !!component.classes?.find((c) =>
      ["react", "jquery", "angular"].find((t) =>
        c.name.toLowerCase().includes(t)
      )
    );
  },
};

const threats = [sqlInjection, xss];

export function mapThreats(
  model: Model,
  component: Component
): SourceSuggestedThreat[] {
  return threats
    .filter((t) => t.condition(model, component))
    .map((c) => ({
      ...c,
      componentId: component.id,
    }));
}
