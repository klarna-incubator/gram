# Config

This package contains the configuration of the Gram application.

The default setup comes with three preconfigured environments:

- [development.ts](development.ts)
- [staging.ts](staging.ts) (_Not enabled_)
- [production.ts](production.ts) (_Not enabled_)

To reduce repetition, configuration shared between the environments is defined here in
the [default.ts](default.ts) file.

## Adding a new environment

The main entry point for the configuration is the [index.ts](index.ts) file.
This is where the different environment configurations are registered. To add a new environment,
include it here via `registerConfiguration`.

```ts
import { developmentConfig } from "./development.js";

export function initConfig() {
  registerConfiguration("development", developmentConfig);
  //   registerConfiguration("staging", stagingConfig);
  //   registerConfiguration("production", productionConfig);
  loadConfig();
}
```

On runtime, these environments are loaded based on the `NODE_ENV` environment variable.
Meaning for the above configuration, `NODE_ENV=development` will load the config defined in `developmentConfig`.

## Plugins

See [Plugins.md](../Plugins.md)

## Secrets

Some configuration values are defined as secrets to protect them from accidental exposure. These
need to be supplied via a special **Secret** interface.

There are two built-in classes for constructing secrets:

- **EnvSecret** - Grabs a Secret value from a specified environment variable. **Recommended**
  - Example: `password: new EnvSecret("POSTGRES_PASSWORD")`
- **ExposedSecret** - Takes a raw string value as the secret value. Should not be used in a real deployment environment.
  - Example: `password: new ExposedSecret("somethingsecret")`
