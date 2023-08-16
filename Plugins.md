# Plugins

To create a new plugin:

1. Add a new package folder under the `plugins/` folder (or copy an existing plugin folder)
2. Run `npm init -w plugins/<pluginname>` to add the package to the NPM workspace.
3. Install dependencies of the plugin package via `npm -w plugins/pluginname> i <package>`

## Adding plugins to your Gram configuration

To add a plugin you install it into the config workspace:

```
npm -w config i @gram/<pluginname>
```

After which you should be able to import it and add it to the configuration object.
