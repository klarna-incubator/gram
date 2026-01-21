import { GeneralConfig } from "wikibase-edit";

export const generalConfig: GeneralConfig = {
  // A Wikibase instance is required
  instance: "https://knowledgegraph.nonprod.klarna.net",

  // The instance script path, used to find the API endpoint
  // Default: /w
  wgScriptPath: "/w",

  // Optional
  // See https://meta.wikimedia.org/wiki/Help:Edit_summary
  // Default: empty
  summary:
    "Testing the export of action items from poc-gram-action-item-exporter",

  // See https://www.mediawiki.org/wiki/Manual:Tags
  // Default: on Wikidata [ 'WikibaseJS-edit' ], empty for other Wikibase instances
  //tags: ["Test change for poc-gram-action-item-exporter"],

  // Default: `wikidata-edit/${pkg.version} (https://github.com/maxlath/wikidata-edit)`
  userAgent: "poc-gram-action-item-exporter/v 1.0.0",

  // See https://www.mediawiki.org/wiki/Manual:Bots
  // Default: false
  bot: false,

  // See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
  // Default: 5
  maxlag: 2,
};

export const productionConfig: GeneralConfig = {
  ...generalConfig,
  instance: "https://knowledgegraph.klarna.net",
  credentials: {
    username: "Pauline.didier@threat-task-bulk-upload", // Change to production user if needed
    password: "p260k1o6k0cdnq0b1o4u9npdt3pb9beq",
  },
};

export const stagingConfig: GeneralConfig = {
  ...generalConfig,
  instance: "https://knowledgegraph.nonprod.klarna.net",
  credentials: {
    username: "Pauline.didier@threat-task-bulk-upload", // Change to staging user if needed
    password: "p260k1o6k0cdnq0b1o4u9npdt3pb9beq",
  },
};
