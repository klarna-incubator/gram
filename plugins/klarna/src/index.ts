import { AssetFolder } from "@gram/core/dist/config/AssetFolder";
import { ComponentClass } from "@gram/core/dist/data/component-classes";
import { join } from "path";

export { OctaneSystemProvider } from "./system/OctaneSystemProvider";
export { NGOVSystemContextProvider } from "./system/NGOVSystemContextProvider";
export { KlarnaReviewerProvider } from "./KlarnaReviewerProvider";
export { HSFContextProvider } from "./HSFContextProvider";
export { KlarnaCronJob } from "./KlarnaCronJob";
export { hookIntoReviewApproval } from "./RiskManagement";
import classes from "./classes.json";

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
