# Initial setup

Fork/clone the repository via git. Add your own SCM/or the original repository as an origin.

```
git clone <your own repo / fork>
git remote add github git@github.com:klarna-incubator/gram.git
```

## Configuring plugins

```
"@gram/plugin-aws": "^1.0.0",
"@gram/plugin-github": "^1.0.0",
"@gram/plugin-static": "^1.0.0",
"@gram/plugin-svgporn": "^1.0.0",
"@gram/plugin-threatlib": "^1.0.0",
```

Modify the `api/bootstrap.ts` file to load your custom plugins.
It will look something like this.

```ts
import { Application } from "express";
import { DataAccessLayer } from "./data/dal.js";
import { PluginCompiler } from "./plugin.js";

import AWSPlugin from "@gram/plugin-aws";
import SVGPornPlugin from "@gram/plugin-svgporn";
import StaticPlugin from "@gram/plugin-static";
import ThreatLibPlugin from "@gram/plugin-threatlib";
import GithubPlugin from "@gram/plugin-github";

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
```

Plugins can be created in the `plugins/` directory. Add them to the top-level `package.json` `workspaces` list
in order to be able to load them.

## Setting configuration

Configuration (but not **secrets**) reside in the `api/config/` directory as JSON files.

These will load based on the `NODE_ENV` or `SERVICE_STAGE` environment variables when the project is started.
i.e. `NODE_ENV=development` will load `development.json` file, if it exists. `default.json` applies to all environments.

Avoid putting secrets here, instead pass these via environment variables during the runtime of your container.
The `config/custom-environment-variables.json` file defines how environment variables are mapped to config at runtime and can be used to safely pass secrets into the application.

## Updating

Update the base version of Gram by rebasing your repository to
`git rebase origin@<version>`
