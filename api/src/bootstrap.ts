import { Application } from "express";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { PluginCompiler } from "@gram/core/dist/plugin";

import AWSPlugin from "@gram/aws";
import SVGPornPlugin from "@gram/svgporn";
import AzurePlugin from "@gram/azure";
import KubernetesPlugin from "@gram/kubernetes";
import KlarnaPlugin from "@gram/klarna";
import CNCFPlugin from "@gram/cncf";
import { ThreatsaurusPlugin } from "@gram/threatsaurus";
// import StaticPlugin from "@gram/plugin-static";
// import ThreatLibPlugin from "@gram/plugin-threatlib";
// import GithubPlugin from "@gram/plugin-github";

export async function bootstrapPlugins(app: Application, dal: DataAccessLayer) {
  const compiler = new PluginCompiler(dal, app);
  await Promise.all([
    new AWSPlugin().bootstrap(compiler),
    new SVGPornPlugin().bootstrap(compiler),
    new AzurePlugin().bootstrap(compiler),
    new KubernetesPlugin().bootstrap(compiler),
    new CNCFPlugin().bootstrap(compiler),
    new KlarnaPlugin().bootstrap(compiler),
    new ThreatsaurusPlugin().bootstrap(compiler),
  ]);
  compiler.compileAssets();
}
