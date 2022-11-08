import { ProviderRegistry } from "../util/provider";
import { AuthProvider } from "./AuthProvider";

const AuthProviderRegistry: ProviderRegistry<AuthProvider> = new Map<
  string,
  AuthProvider
>();
export default AuthProviderRegistry;
