import { join } from "path";
import { Pack, PackRegistrator } from "..";
import { ComponentClass } from "../../data/component-classes";
import classes from "./classes.json";

const toComponentClass = (c: any): ComponentClass => {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    componentType: c.componentType,
  };
};

export default class SVGPornPack implements Pack {
  async bootstrap(reg: PackRegistrator): Promise<void> {
    reg.registerAssets("svgporn", join(__dirname, "logos"));
    reg.registerComponentClasses(classes.map((c) => toComponentClass(c)));
  }
}
