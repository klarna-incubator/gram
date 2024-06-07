import { config } from "./config/index.js";
import { DataAccessLayer } from "./data/dal.js";
import { createPostgresPool } from "./data/postgres.js";
import { Bootstrapper } from "./Bootstrapper.js";
import { migrate } from "./data/Migration.js";

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
  providers.actionItemExporters?.forEach((exporter) =>
    dal.actionItemHandler.attachExporter(exporter)
  );

  bt.registerComponentClasses(providers.componentClasses || []);
  bt.registerNotificationTemplates(providers.notificationTemplates || []);

  providers.suggestionSources?.forEach((ssp) =>
    bt.registerSuggestionSource(ssp)
  );
  providers.systemPropertyProviders?.forEach((spp) =>
    bt.registerSystemPropertyProvider(spp)
  );
  providers.searchProviders?.forEach((sp) => bt.registerSearchProvider(sp));

  if (providers.teamProvider) {
    bt.setTeamProvider(providers.teamProvider);
  }
  providers.assetFolders?.forEach((af) =>
    bt.registerAssets(af.name, af.folderPath)
  );
  bt.compileAssets();

  return dal;
}
