import { join } from "path";
import { Plugin, PluginRegistrator } from "gram-api/src/plugin";
import classes from "./classes.json";
import { isComponentClass } from "gram-api/src/data/component-classes";

export default class AWSPlugin implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    reg.registerAssets("aws", join(__dirname, "assets"));
    reg.registerComponentClasses((classes as any[]).filter(isComponentClass));
  }
}
