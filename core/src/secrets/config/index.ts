/**
 * Pulls secrets from config module - ideally for dev environment
 * @module secrets/config
 */

import config from "config";
import { InvalidSecretError } from "../errors";
import { SecretProvider } from "../SecretProvider";

export class ConfigSecretProvider implements SecretProvider {
  key = "config";

  async get(key: string) {
    if (config.has(key)) return config.get<string>(key);
    throw new InvalidSecretError(`Found no such secret with key ${key}`);
  }
}
