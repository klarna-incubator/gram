import { config } from "./config";
import { DataAccessLayer } from "./data/dal";
import { createPostgresPool } from "./data/postgres";
import { Bootstrapper } from "./Bootstrapper";
import { migrate } from "./data/Migration";

export async function bootstrap(): Promise<DataAccessLayer> {
  const pool = await createPostgresPool();
  const dal = new DataAccessLayer(pool);
  const bt = new Bootstrapper(dal);

  await migrate();

  const providers = await config.bootstrapProviders(dal);

  providers.identityProviders.forEach((idp) =>
    bt.registerIdentityProvider(idp)
  );
  bt.setAuthorizationProvider(providers.authzProvider);
  bt.setReviewerProvider(providers.reviewerProvider);
  bt.setUserProvider(providers.userProvider);
  bt.setSystemProvider(providers.systemProvider);

  bt.registerComponentClasses(providers.componentClasses || []);
  bt.registerNotificationTemplates(providers.notificationTemplates || []);

  providers.suggestionSources?.forEach((ssp) =>
    bt.registerSuggestionSource(ssp)
  );
  providers.systemPropertyProviders?.forEach((spp) =>
    bt.registerSystemPropertyProvider(spp)
  );

  if (providers.teamProvider) {
    bt.setTeamProvider(providers.teamProvider);
  }
  providers.assetFolders?.forEach((af) =>
    bt.registerAssets(af.name, af.folderPath)
  );
  bt.compileAssets();

  return dal;
}
