import { Application } from "express";
import { DataAccessLayer } from "./data/dal";
import { PackCompiler } from "./packs";
import AWSPack from "./packs/aws";
import DemoPack from "./packs/demo";
import SVGPornPack from "./packs/svgporn";

export async function bootstrapPacks(app: Application, dal: DataAccessLayer) {
  // TODO: load these dynamically via config (i.e. install as npm package, or some config defines packages to load and bootstrap)
  const compiler = new PackCompiler(dal, app);
  await Promise.all([
    new AWSPack().bootstrap(compiler),
    new SVGPornPack().bootstrap(compiler),
    new DemoPack().bootstrap(compiler),
  ]);
  compiler.compileAssets();
}
