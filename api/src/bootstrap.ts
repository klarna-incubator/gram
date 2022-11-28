import { Application } from "express";
import { DataAccessLayer } from "./data/dal";
import { PackCompiler } from "./packs";
import AWSPack from "./packs/aws";
import GithubPack from "./packs/github";
import StaticPack from "./packs/static";
import SVGPornPack from "./packs/svgporn";

export async function bootstrapPacks(app: Application, dal: DataAccessLayer) {
  // TODO: load these dynamically via config (i.e. install as npm package, or some config defines packages to load and bootstrap)
  const compiler = new PackCompiler(dal, app);
  await Promise.all([
    new AWSPack().bootstrap(compiler),
    new SVGPornPack().bootstrap(compiler),
    new GithubPack().bootstrap(compiler),
    new StaticPack().bootstrap(compiler),
  ]);
  compiler.compileAssets();
}
