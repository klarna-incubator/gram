# Gram Core

This contains most of the serverside logic of the Gram application.

## Postgres Datastore

To setup postgres for local development, the repository comes with a premade docker-compose file.
Simply run the following command to start the test and development databases.

```
docker-compose up -d
```

Tables can be created by running the **migrate-database** command:

```
NODE_ENV=test npm run migrate-database
NODE_ENV=development npm run migrate-database
```

To access the postgres shell for your local development database:

```
docker exec -e PGPASSWORD=somethingsecret -it gram-postgres psql gram -U gram
```

To access the staging and production databases, you can use the `scripts/staging-psql.sh` and `scripts/prod-psql.sh` scripts. On MacOS please install coreutils before running the scripts above:

```
brew install coreutils
```

### Migrations

You should already be familiar with the **migrate-database** command from above. So here are some more details.

Migrations exist in the `src/data/migrations/` directory. These are run sequentially and transactionally, and should
roll back in case of failure. They must follow the naming convention of `<sequential number>_<snake-case-descriptive-name>.<sql|js>`.

For staging and production, these should run automatically upon application start.

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
