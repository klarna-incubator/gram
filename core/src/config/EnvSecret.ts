import type { Secret } from "./Secret";

export class EnvSecret implements Secret {
  constructor(public key: string) {}

  async getValue(): Promise<string | undefined> {
    return process.env[this.key];
  }
}
