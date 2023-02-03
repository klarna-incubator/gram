export interface SecretProvider {
  key: string;
  get(key: string): Promise<string | undefined>;
}
