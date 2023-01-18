import { Plugin, PluginRegistrator } from "gram-api/src/plugin";
import Model from "gram-api/src/data/models/Model";
import {
  SuggestionResult,
  SuggestionSource,
} from "gram-api/src/suggestions/models";
import { mapControls } from "./controls";
import { mapThreats } from "./threats";

class ThreatLibSuggestionProvider implements SuggestionSource {
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

export default class ThreatLibPlugin implements Plugin {
  async bootstrap(reg: PluginRegistrator) {
    reg.registerSuggestionSource(new ThreatLibSuggestionProvider());
  }
}
