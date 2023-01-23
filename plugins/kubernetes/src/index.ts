import { join } from "path";
import { Plugin, PluginRegistrator } from "gram-api/src/plugin";
import { isComponentClass } from "gram-api/src/data/component-classes";
import classes from "./classes.json";

export default class KubernetesPack implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    reg.registerAssets("kubernetes", join(__dirname, "assets"));
    reg.registerComponentClasses((classes as any[]).filter(isComponentClass));
  }
}
