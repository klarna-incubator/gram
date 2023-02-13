# Gram

[![Build Status][ci-image]][ci-url]
[![License][license-image]][license-url]
[![Developed at Klarna][klarna-image]][klarna-url]

Gram is Klarna's own threat model diagramming tool. It's pretty cool.

## Usage example

TODO :)

<!-- A few motivating and useful examples of how your project can be used. Spice this up with code blocks and potentially more screenshots.

_For more examples and usage, please refer to the [Docs](TODO)._ -->

## Repository Layout 🗺️

- `app/` contains the frontend react application
- `core/` contains the nodejs backend library; most data related logic lies here
- `api/` contains the nodejs backend API
- `plugins/` contains backend plugins, which when installed into api allows for customization

## Development setup 💻

1. Install the dependencies with `npm i`

2. `npm run build` to build the api and any installed plugins

3. Create a new file `config/development.json`, using the following as a template.

```json
{
  "data": {
    "_providers": {
      "postgres": {
        "host": "127.0.0.1",
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
      "auth": "6bc84cf7f80d675d3cefb81bb69247a5feb7a4ed8471bfdf8163753fac5197ea8d088bc88ad98b938375213576e7b06859b036e27cffccf700773e4ec66d243f"
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

4. Start the test and development databases via docker compose `docker compose up -d`

5. Run the database migrations via `NODE_ENV=development npm run migrate-database`

   - (For running the tests you'll want to also migrate the test environment `NODE_ENV=test npm run migrate-database`)

6. `npm run start-backend` to start the backend API

7. `npm run start-frontend` to start the react app frontend.

## How to contribute

See our guide on [contributing](CONTRIBUTING.md).

## Release History

See our [changelog](CHANGELOG.md).

## License

Copyright © 2022 Klarna Bank AB

For license details, see the [LICENSE](LICENSE) file in the root of this project.

<!-- Markdown link & img dfn's -->

[ci-image]: https://img.shields.io/badge/build-passing-brightgreen?style=flat-square
[ci-url]: https://github.com/klarna-incubator/TODO
[license-image]: https://img.shields.io/badge/license-Apache%202-blue?style=flat-square
[license-url]: http://www.apache.org/licenses/LICENSE-2.0
[klarna-image]: https://img.shields.io/badge/%20-Developed%20at%20Klarna-black?style=flat-square&labelColor=ffb3c7&logo=klarna&logoColor=black
[klarna-url]: https://klarna.github.io
