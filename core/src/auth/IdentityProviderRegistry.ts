import { ProviderRegistry } from "../data/providers/ProviderRegistry.js";
import { IdentityProvider } from "./IdentityProvider.js";

const IdentityProviderRegistry: ProviderRegistry<IdentityProvider> = new Map<
  string,
  IdentityProvider
>();
export default IdentityProviderRegistry;
