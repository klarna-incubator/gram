import { join } from "path";
import { Plugin, PluginRegistrator } from "@gram/core/dist/plugin";
import { isComponentClass } from "@gram/core/dist/data/component-classes";
import classes from "./classes.json";

export default class CNCFPack implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    reg.registerAssets("cncf", join(__dirname, "assets"));
    reg.registerComponentClasses((classes as any[]).filter(isComponentClass));
  }
}
