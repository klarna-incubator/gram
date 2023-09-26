import { ProviderRegistry } from "../data/providers/ProviderRegistry";
import { IdentityProvider } from "./IdentityProvider";

const IdentityProviderRegistry: ProviderRegistry<IdentityProvider> = new Map<
  string,
  IdentityProvider
>();
export default IdentityProviderRegistry;
