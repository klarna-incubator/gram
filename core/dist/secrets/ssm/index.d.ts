/**
 * Pulls secrets from AWS SSM
 * @module secrets/config
 * @deprecated
 */
import { SecretProvider } from "../SecretProvider";
export declare class SSMSecretProvider implements SecretProvider {
    key: string;
    get(key: string): Promise<string | undefined>;
}
//# sourceMappingURL=index.d.ts.map