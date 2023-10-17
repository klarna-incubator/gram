# Development

## Repository Layout 🗺️

- `app/` contains the frontend react application
- `core/` contains the backend library; most data related logic lies here
- `config/` contains the configuration.
- `api/` contains the backend web API
- `plugins/` contains backend plugins, which when installed into config allows for customization

## Development Setup 💻

These are the minimal steps for starting the project locally:

1. Install the dependencies with `npm i`

2. Start the test and development databases via docker compose `docker compose up -d`

3. `npm run build` to build the api and any installed plugins

4. `npm run dev` to start the backend API and react app frontend.

5. Login using `user@localhost` as the email - check the application logs for the login link.

## Tests

`npm test`

## Connecting to the development/test database

Use the following scripts if you need to connect to your development database containers

- `scripts/local-psql.sh`
- `scripts/test-psql.sh`
