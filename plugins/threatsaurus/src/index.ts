import { ComponentClass } from "@gram/core/dist//data/component-classes";
import Model from "@gram/core/dist/data/models/Model";
import {
  SourceSuggestedControl,
  SourceSuggestedThreat,
  SuggestionResult,
  SuggestionSource,
} from "@gram/core/dist/suggestions/models";
import { fetchIndex, fetchTech, ThreatsaurusSuggestions } from "./client";

/**
 * Example implementation, will be replaced later with one that fetches from external data
 */
export class ThreatsaurusSuggestionSource implements SuggestionSource {
  slug = "threatsaurus";
  name = "Threatsaurus";

  constructor(private baseUrl: string) {}

  async suggest(model: Model): Promise<SuggestionResult> {
    const index = await fetchIndex(this.baseUrl);
    const supported = new Set(Object.keys(index).map((s) => s.toLowerCase()));

    // Extract all techs from the model, filter out to those supported by
    // threatsaurus
    const allTechs = model.data.components
      .filter((c) => c.classes)
      .map((c) => c.classes as ComponentClass[])
      .map((classes) =>
        classes.map((c) => c.name.toLowerCase()).filter((n) => supported.has(n))
      )
      .reduce((p, classes) => {
        classes.forEach((c) => p.add(index[c]));
        return p;
      }, new Set<string>());

    // Fetch all suggestions for the relevant techs. We try to be
    // bit more clever here by only fetching the techs once.
    const suggestionMap = new Map<string, ThreatsaurusSuggestions>();
    (
      await Promise.all(
        Array.from(allTechs.keys()).map(async (t) => [
          t,
          await fetchTech(this.baseUrl, t),
        ])
      )
    )
      .filter(([_, b]) => !!b)
      .forEach(([a, b]) =>
        suggestionMap.set(a as string, b as ThreatsaurusSuggestions)
      );

    const suggestedThreats: SourceSuggestedThreat[] = [];
    const suggestedControls: SourceSuggestedControl[] = [];

    // Map back fetched suggestions to components that use these techs
    for (const component of model.data.components) {
      component.classes?.forEach((c) => {
        const suggestions = suggestionMap.get(index[c.name.toLowerCase()]);
        if (!suggestions) return;

        if (suggestions.threats) {
          suggestedThreats.push(
            ...suggestions.threats.map((t) => ({
              ...t,
              componentId: component.id,
            }))
          );
        }
        if (suggestions.controls) {
          suggestedControls.push(
            ...suggestions.controls.map((t) => ({
              ...t,
              componentId: component.id,
              mitigates: t.mitigates.map((m) => ({
                partialThreatId: m,
              })),
            }))
          );
        }
      });
    }

    return { controls: suggestedControls, threats: suggestedThreats };
  }
}
