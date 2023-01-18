import { Application } from "express";
import { DataAccessLayer } from "./data/dal";
import { PluginCompiler } from "./plugin";

import AWSPlugin from "gram-plugin-aws";
import SVGPornPlugin from "gram-plugin-svgporn";
import StaticPlugin from "gram-plugin-static";
import ThreatLibPlugin from "gram-plugin-threatlib";
import GithubPlugin from "gram-plugin-github";

export async function bootstrapPlugins(app: Application, dal: DataAccessLayer) {
  const compiler = new PluginCompiler(dal, app);
  await Promise.all([
    new AWSPlugin().bootstrap(compiler),
    new SVGPornPlugin().bootstrap(compiler),
    new GithubPlugin().bootstrap(compiler),
    new StaticPlugin().bootstrap(compiler),
    new ThreatLibPlugin().bootstrap(compiler),
  ]);
  compiler.compileAssets();
}
