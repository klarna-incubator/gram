import { Provider } from "./Provider.js";

export type ProviderRegistry<T extends Provider> = Map<string, T>;
