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
import { SecretProvider } from "./SecretProvider";
declare class Secrets {
    impl: SecretProvider;
    providers: Map<string, SecretProvider>;
    constructor();
    addProvider(provider: SecretProvider): void;
    /**
     * Retrieves secret from the specified tag / namespace
     * @param key
     * @throws {InvalidSecretError}
     * @returns {Promise}
     */
    get(key: string): Promise<string>;
    /**
     * Retrieves secret from the specified tag, if it does not exist then it returns _default.
     * @param key
     * @param _default
     * @returns
     */
    getOrDefault<T>(key: string, _default: T): Promise<string | T>;
}
declare const secrets: Secrets;
export default secrets;
//# sourceMappingURL=index.d.ts.map