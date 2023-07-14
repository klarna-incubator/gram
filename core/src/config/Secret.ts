export interface Secret {
  getValue(): Promise<string | undefined>;
}
