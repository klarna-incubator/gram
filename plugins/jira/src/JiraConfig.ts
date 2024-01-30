import { Secret } from "@gram/core/dist/config/Secret.js";

export interface JiraConfig {
  host: string;
  auth: {
    user: Secret;
    apiToken: Secret;
  };
}
