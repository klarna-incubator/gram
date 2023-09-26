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

export const CNCFAssets: AssetFolder = {
  name: "cncf",
  folderPath: join(__dirname, "assets"),
};

export const CNCFComponentClasses = classes.map((c) => toComponentClass(c));
