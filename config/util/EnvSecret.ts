import type { Secret } from "@gram/core/dist/config/Secret";

export class EnvSecret implements Secret {
  constructor(public key: string) {}

  async getValue(): Promise<string | undefined> {
    return process.env[this.key];
  }
}
