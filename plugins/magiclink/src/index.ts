import { Plugin, PluginRegistrator } from "@gram/core/dist/plugin";
import { MagicLinkIdentityProvider } from "./MagicLinkIdentityProvider";
import path from "node:path";
import { EmailMagicLink } from "./notifications/magic-link";

const pluginName = "magic-link";

export default class MagicLinkPlugin implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    reg.migrate(pluginName, path.join(__dirname, "..", "migrations"));
    reg.registerNotificationTemplates([EmailMagicLink()]);
    const pool = await reg.getPluginDbPool(pluginName);
    reg.registerIdentityProvider(new MagicLinkIdentityProvider(reg.dal, pool));
  }
}
