import { App } from "octokit";
import { join } from "path";
import { additionalMigrations } from "./data";
import { GithubIdentityProvider } from "./GithubIdentityProvider";
import { GithubAuthzProvider } from "./GithubAuthzProvider";
import { GithubSystemPropertyProvider } from "./GithubSystemPropertyProvider";
import { GithubSystemProvider } from "./GithubSystemProvider";
import { GithubUserProvider } from "./GithubUserProvider";

export {
  GithubAuthzProvider,
  GithubIdentityProvider,
  GithubSystemPropertyProvider,
  GithubSystemProvider,
  GithubUserProvider,
};

// export default class GithubPlugin implements Plugin {
//   async bootstrap(reg: PluginCompiler): Promise<void> {
//     const appId = await secrets.get("auth.providerOpts.github.appId");
//     const clientId = await secrets.get("auth.providerOpts.github.clientId");
//     const clientSecret = await secrets.get(
//       "auth.providerOpts.github.clientSecret"
//     );
//     const privateKey = await secrets.get("auth.providerOpts.github.privateKey");

//     const app = new App({
//       appId,
//       privateKey,
//       oauth: { clientId, clientSecret },
//     });

//     additionalMigrations(); //TODO rethink this..

//     const userProvider = new GithubUserProvider(app);
//     const systemProvider = new GithubSystemProvider(app);
//     reg.setSystemProvider(systemProvider);
//     reg.registerSystemPropertyProvider(
//       new GithubSystemPropertyProvider(app, systemProvider)
//     );
//     reg.setAuthzProvider(new GithubAuthzProvider(app));
//     reg.setUserProvider(userProvider);
//     reg.registerIdentityProvider(new GithubIdentityProvider(app, userProvider));
//     reg.registerAssets("github", join(__dirname, "assets"));
//   }
// }
