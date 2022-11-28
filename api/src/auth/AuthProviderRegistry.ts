import { ProviderRegistry } from "../data/providers/ProviderRegistry";
import { AuthProvider } from "./AuthProvider";

const AuthProviderRegistry: ProviderRegistry<AuthProvider> = new Map<
  string,
  AuthProvider
>();
export default AuthProviderRegistry;
