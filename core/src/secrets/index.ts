/**
 * Secrets reader module
 *
 * Could be abstracted to the Packs in the future, but would require
 * some refactoring as currently the PackCompiler relies on the DAL,
 * which itself uses secrets to init the database connection.
 *
 * @module secrets
 * @exports secrets
 */

import config from "config";
import { getLogger } from "../logger";
import { InvalidSecretError, InvalidSecretProviderError } from "./errors";
import { SecretProvider } from "./SecretProvider";
import { ConfigSecretProvider } from "./config";

const log = getLogger("secrets");

class Secrets {
  impl!: SecretProvider;

  providers: Map<string, SecretProvider> = new Map<string, SecretProvider>();

  constructor() {
    this.addProvider(new ConfigSecretProvider());
  }

  addProvider(provider: SecretProvider) {
    if (this.providers.has(provider.key)) {
      throw new InvalidSecretProviderError(
        `SecretProvider with name ${provider} already exists`
      );
    }

    this.providers.set(provider.key, provider);
  }

  /**
   * Retrieves secret from the specified tag / namespace
   * @param key
   * @throws {InvalidSecretError}
   * @returns {Promise}
   */
  async get(key: string): Promise<string> {
    const provider: string = config.get("secrets.provider");

    if (!provider) {
      throw new InvalidSecretProviderError(
        "No SecretProvider specified. Ensure secrets.provider is set in config."
      );
    }

    if (!this.providers.has(provider)) {
      throw new InvalidSecretProviderError(
        `No such secretprovider: ${provider}.`
      );
    }

    const impl = this.providers.get(provider) as SecretProvider;

    log.info(`Fetching secret ${key} from ${provider}`);
    const value = await impl.get(key);

    if (value === undefined) {
      throw new InvalidSecretError(`Secret not found ${key}`);
    }
    return value;
  }

  /**
   * Retrieves secret from the specified tag, if it does not exist then it returns _default.
   * @param key
   * @param _default
   * @returns
   */
  async getOrDefault<T>(key: string, _default: T): Promise<string | T> {
    try {
      return await this.get(key);
    } catch (error: any) {
      if (error instanceof InvalidSecretError) {
        return _default;
      }
      throw error;
    }
  }
}

const secrets = new Secrets();
export default secrets;
