# Quick Start

This short guide should help you get set up maintaining your own Gram deployment.

## Setting up the repository

The ideal setup is currently to clone the repository locally and push it to your own source control management system.

Create a bare clone of the repository and mirror-push to the new repository.

```sh
git clone --bare git@github.com:klarna-incubator/gram.git
cd gram.git
git push --mirror <your private repo>
```

Remove the temporary local repository you created earlier.

```sh
cd ..
rm -rf gram.git
```

Clone your own private repository and add Klarna upstream to pull updates from (more details later).

```sh
git clone <your private repo>
git remote add github https://github.com/klarna-incubator/gram.git
```

## First local run

With the repository cloned, run `npm install` to install dependencies and to set up
the workspace.

```sh
npm install
```

Next you can try running the project a first time:

```sh
docker compose up -d
```

Then build and try to run the project

```sh
npm run build
npm run dev # note: you'll need to run build before every dev
```

## First Login
With the default configuration, Gram will be configured to use login via email. 

For your first login, use the email address `admin@localhost`. 

Since SMTP is not configured yet, you will need to get the actual link from your application logs:
```
[2023-11-07T14:29:12.229] [DEBUG] MagicLinkIdentityProvider - Sending magic link to <REDACTED> with link http://localhost:4726/login/callback/magic-link?token=<REDACTED>
```

For the default configuration, the login is limited to three hardcoded users: `user@localhost`, `reviewer@localhost` and `admin@localhost`.
You will need to change the configuration to change this.


## Modify the configuration

The `config/` package contains the configuration of your Gram application. This is where
you add custom plugins and functionality.

Check the `config/default.ts` for the base configuration. `config/[development|staging|production].ts` contains configuration for the different deployment environments which overload the default config. The `NODE_ENV` environment variable determines which of these is loaded at runtime.

The default setup comes with a minimal configuration which you'll likely want to change for a real deployment.
It uses static providers to feed sample data into Gram, regarding things like Systems, Teams, Users and Roles.

### Plugins

To install a new plugin into your config:

```
npm -w config i @gram/<pluginname>
```

Then adjust the configuration code as needed to load the new functionality.

## Deploying

Gram is designed to run as a single docker container with a Postgres database provided beside it. Typically the postgres database would be hosted on something like AWS RDS.

### Docker Compose Example

The [docker-compose.demo.yml](docker-compose.demo.yml) is a simple way you could run this application
in a production environment using just docker compose.

Ensure you set your environment variables before deployment.

```yml
environment:
  ORIGIN: http://localhost:4726 # (or your domain)
  POSTGRES_HOST: database
  POSTGRES_USER: gram
  POSTGRES_PASSWORD: somethingsecret
  POSTGRES_DATABASE: gram
  POSTGRES_DISABLE_SSL: "true"
  POSTGRES_PORT: 5432
  NODE_ENV: staging # i.e. prod/staging for non-demo purposes
  AUTH_SECRET: <some long secret used to sign auth tokens>
  EMAIL_HOST: ""
  EMAIL_PORT: ""
  EMAIL_PASSWORD: ""
  EMAIL_USER: ""
```

Run the demo via

```sh
docker-compose -f docker-compose.demo.yml up --build
```

To run this on a server, you can either build the image on the server or use a CI/CD pipeline to build the image.

### Warnings ⚠️

- There are some scalability issues to be aware of - currently we only run this as a single container as the websocket server used for the
  realtime diagram sharing only runs on the same express server. For Klarna's setup this has worked fine since we don't have that many concurrent users,
  but it will eventually hit a bottleneck and means the application can't be scaled horizontally. This is solveable but it's not anything we're prioritizing until it actually becomes a problem.

- This webapp was built with the premise that it would run on an internal-only, closed network and be accessible to all engineers. It will not withstand DoS or necessarily guarantee confidentiality if exposed
  directly on the internet.

## Pulling updates

The main Gram codebase runs on a single `main` branch as a "trunk" and
uses tag releases. The main branch should not necessarily be seen as stable, instead
we recommend pulling in the versioned tags:

```sh
git pull github v4.4.0 # recommended
# git pull github main # not recommended
```

After pulling new updates, you may need to re-run `npm install` to get the latest packages.
