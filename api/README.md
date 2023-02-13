# Gram API

This package runs the API backend of the Gram application.

## Testing

Run all tests:

```
npm test
```

This project uses `prettier` as a formatter/linter. To run it from the terminal
(though I recommend otherwise you install a plugin for your IDE), you can use
the following commands:

```sh
npm run lint # only checks what files are different
npm run lint-fix # overwrites files
```

## Updating / Fixing vulnerable dependencies

To check for any current vulnerable dependencies:

```
snyk test
```

Due to a bug, it seems `snyk wizard` can't remediate vulnerable dependencies currently.
However, `npm audit fix` works in a very similar way.

```
npm audit fix
```

If any dependencies still fail to update (e.g due to major semver change) you'll have to
manually update them.
