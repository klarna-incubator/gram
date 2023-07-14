import { join } from "node:path";
import classes from "./classes.json";
import { isComponentClass } from "@gram/core/dist/data/component-classes";
import { AssetFolder } from "@gram/core/dist/config/AssetFolder";

export const AWSComponentClasses = (classes as any[]).filter(isComponentClass);
export const AWSAssets: AssetFolder = {
  name: "aws",
  folderPath: join(__dirname, "assets"),
};
