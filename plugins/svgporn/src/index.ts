import { AssetFolder } from "@gram/core/dist/config/AssetFolder.js";
import { ComponentClass } from "@gram/core/dist/data/component-classes/index.js";
import { join } from "node:path";
import classes from "./classes.js";
import * as url from "url";

const toComponentClass = (c: any): ComponentClass => {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    componentType: c.componentType,
  };
};

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const SVGPornAssets: AssetFolder = {
  name: "svgporn",
  folderPath: join(__dirname, "logos"),
};

export const SVGPornComponentClasses = classes.map((c) => toComponentClass(c));
