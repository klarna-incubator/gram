import { AssetFolder } from "@gram/core/dist/config/AssetFolder.js";
import { ComponentClass } from "@gram/core/dist/data/component-classes";
import { join } from "path";

export { OctaneSystemProvider } from "./system/OctaneSystemProvider.js";
export { NGOVSystemContextProvider } from "./system/NGOVSystemContextProvider.js";
export { KlarnaReviewerProvider } from "./KlarnaReviewerProvider.js";
export { HSFContextProvider } from "./HSFContextProvider.js";
export { KlarnaCronJob } from "./KlarnaCronJob.js";
export { hookIntoReviewApproval } from "./RiskManagement.js";
import classes from "./classes.js";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const KlarnaAssets: AssetFolder = {
  name: "klarna",
  folderPath: join(__dirname, "assets"),
};

const toComponentClass = (c: any): ComponentClass => {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    componentType: c.componentType,
  };
};

export const KlarnaComponentClasses = classes.map((c) => toComponentClass(c));
