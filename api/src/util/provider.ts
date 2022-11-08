export interface Provider {
  key: string;
}

export type ProviderRegistry<T extends Provider> = Map<string, T>;
