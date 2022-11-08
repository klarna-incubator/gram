# Gram API

This package runs the API backend of the Gram application.

## Setup

Runs on the current stable version of node (v14.7.0).

Install dependencies with:

```
npm i
```

Create a new file `config/development.json`, using the following as a template.

```json
{
  "data": {
    "_providers": {
      "postgres": {
        "host": "localhost",
        "user": "gram",
        "password": "somethingsecret",
        "database": "gram",
        "port": 5432
      }
    }
  },

  "jwt": {
    "ttl": 86400,
    "secret": {
      "auth": "6bc84cf7f80d675d3cefb81bb69247a5feb7a4ed8471bfdf8163753fac5197ea8d088bc88ad98b938375213576e7b06859b036e27cffccf700773e4ec66d243f",
      "csrf": "9c05a2fc393078b75a5819ad06cab73ce17ec262909c1be475bbb0cdcfac9b42"
    }
  },

  "auth": {
    "providerOpts": {}
  },

  "log": {
    "layout": "coloured",
    "level": "debug",
    "auditHttp": {
      "simplified": true
    }
  },

  "notifications": {
    "providers": {
      "email": {
        "user": "",
        "host": "",
        "port": 25,
        "sender-name": "[Development] Gram - Secure Development"
      }
    }
  },

  "secrets": {
    "provider": "config"
  }
}
```

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

## Running / Debugging

Start the application with:

```
npm start
```

To debug the application with the chrome inspector:

```
npm run debug
```

## Testing

Run all tests, including dependency vulnerability check:

```
docker-compose up -d
NODE_ENV=test npm run migrate-database
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
