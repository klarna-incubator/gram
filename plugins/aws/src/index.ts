import { AssetFolder } from "@gram/core/dist/config/AssetFolder.js";
import { isComponentClass } from "@gram/core/dist/data/component-classes/index.js";
import { join } from "node:path";
import * as url from "url";
import classes from "./classes.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const AWSComponentClasses = (classes as any[]).filter(isComponentClass);
export const AWSAssets: AssetFolder = {
  name: "aws",
  folderPath: join(__dirname, "assets"),
};
