import { Application } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { PluginCompiler } from "@gram/core/dist/Bootstrapper";

import AWSPlugin from "@gram/aws"; // "@gram/aws": "*" in package.json
import SVGPornPlugin from "@gram/svgporn"; // "@gram/svgpornm": "*" in package.json
import MagicLinkAuthProvider from "@gram/magiclink"; // "@gram/localauth": "*" in package.json
import StaticPlugin from "@gram/static";
// import ThreatLibPlugin from "@gram/plugin-threatlib";
// import GithubPlugin from "@gram/plugin-github";

// test
export async function bootstrapPlugins(app: Application, dal: DataAccessLayer) {
  const compiler = new PluginCompiler(dal, app);
  await Promise.all([
    new AWSPlugin().bootstrap(compiler),
    new SVGPornPlugin().bootstrap(compiler),
    new MagicLinkAuthProvider().bootstrap(compiler),
    // new GithubPlugin().bootstrap(compiler),
    new StaticPlugin().bootstrap(compiler),
    // new ThreatLibPlugin().bootstrap(compiler),
  ]);
  compiler.compileAssets();
}
