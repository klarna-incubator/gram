/**
 * Pulls secrets from config module - ideally for dev environment
 * @module secrets/config
 */
import { SecretProvider } from "../SecretProvider";
export declare class ConfigSecretProvider implements SecretProvider {
    key: string;
    get(key: string): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map