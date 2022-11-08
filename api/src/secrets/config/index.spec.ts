import { InvalidSecretError } from "../errors";
import { ConfigSecretProvider } from "./index";

const secrets = new ConfigSecretProvider();

describe("Secrets from config module", () => {
  it("should throw error on unset config tag", async () => {
    expect(secrets.get("unknown.config.tag")).rejects.toThrow(
      InvalidSecretError
    );
  });

  it("should return valid set config value", async () => {
    const secret = await secrets.get("__sample");
    expect(secret).toBe("test");
  });
});
