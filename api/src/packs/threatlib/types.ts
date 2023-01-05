import Model, { Component } from "../../data/models/Model";

export type ThreatLibThreatSuggestion = {
  slug: string;
  title: string;
  description: string;
  condition(model: Model, component: Component): boolean;
};

export type ThreatLibControlSuggestion = {
  slug: string;
  title: string;
  description: string;
  mitigates: string[];
  condition(model: Model, component: Component): boolean;
};
