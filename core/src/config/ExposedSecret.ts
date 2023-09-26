import type { Secret } from "./Secret";
import { getLogger } from "log4js";

const log = getLogger("ExposedSecret");

export class ExposedSecret implements Secret {
  constructor(public value: string) {
    const env = process.env.NODE_ENV || "undefined";
    if (!["development", "test"].includes(env)) {
      log.warn(
        "ExposedSecret used outside of developmet/test environment. This might mean secrets are being committed into the repository."
      );
    }
  }

  async getValue(): Promise<string | undefined> {
    return this.value;
  }
}
