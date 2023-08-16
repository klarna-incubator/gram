# README

This package contains the configuration for the Gram application.

## Environments

The main entry point for the configuration is the [index.ts](index.ts) file.
This is where the different environment configurations are registered.

```ts
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
- **ExposedSecret** - Should not be used in a real deployment environment.
  - Example: `password: new ExposedSecret("somethingsecret")`
