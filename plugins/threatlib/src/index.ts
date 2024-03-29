import Model from "@gram/core/dist/data/models/Model.js";
import {
  SuggestionResult,
  SuggestionSource,
} from "@gram/core/dist/suggestions/models.js";
import { mapControls } from "./controls.js";
import { mapThreats } from "./threats.js";

export class ThreatLibSuggestionProvider implements SuggestionSource {
  slug: string = "threatlib";
  name: string = "threatlib";
  async suggest(model: Model): Promise<SuggestionResult> {
    const result: SuggestionResult = {
      threats: model.data.components
        .map((c) => mapThreats(model, c))
        .reduce((p, c) => [...p, ...c], []),
      controls: model.data.components
        .map((c) => mapControls(model, c))
        .reduce((p, c) => [...p, ...c], []),
    };

    return result;
  }
}
