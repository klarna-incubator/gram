import { AssetFolder } from "@gram/core/dist/config/AssetFolder";
import { ComponentClass } from "@gram/core/dist/data/component-classes";
import { join } from "node:path";
import classes from "./classes.json";

const toComponentClass = (c: any): ComponentClass => {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    componentType: c.componentType,
  };
};

export const SVGPornAssets: AssetFolder = {
  name: "svgporn",
  folderPath: join(__dirname, "logos"),
};

export const SVGPornComponentClasses = classes.map((c) => toComponentClass(c));
