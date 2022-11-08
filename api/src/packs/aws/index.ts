import { join } from "path";
import { Pack, PackRegistrator } from "..";
import { isComponentClass } from "../../data/component-classes";
import classes from "./classes.json";

export default class AWSPack implements Pack {
  async bootstrap(reg: PackRegistrator): Promise<void> {
    reg.registerAssets("aws", join(__dirname, "assets"));
    reg.registerComponentClasses((classes as any[]).filter(isComponentClass));
  }
}
