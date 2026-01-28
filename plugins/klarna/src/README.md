# Klarna plugin

This document describes how to use **SystemRegistrySystemProvider** and how to run Gram when it depends on Klarna’s System Registry.

---

## SystemRegistrySystemProvider — overview

`SystemRegistrySystemProvider` is a [SystemProvider](https://github.com/klarna-incubator/gram/blob/main/core/src/data/systems/SystemProvider.ts) that loads system metadata from **Klarna’s System Registry** (Oktane). It is the source of truth when Gram needs to resolve a system by ID (e.g. when opening or linking to a system).

- **Provider key:** `oktane`
- **Implemented in:** `plugins/klarna/src/system/SystemRegistrySystemProvider.ts`
- **Used by:** `KlarnaSystemProvider`, which delegates `getSystem(ctx, systemId)` to this provider. The app’s `systemProvider` in config is that `KlarnaSystemProvider`, so all “get system by ID” lookups in development/staging/production go through System Registry when the Klarna config is used.

### What it does

- **`getSystem(ctx, systemId)`**  
  Calls the System Registry HTTP API, maps the response to Gram’s `System` model, and returns it.  
  - **Production:** `http://systems.klarna.net/api/v1/systems/{systemId}`  
  - **Development and staging:** `http://systems.nonprod.klarna.net/api/v1/systems/{systemId}`  
  In development, the request is sent via the **Bouncer local proxy** (see below).

- **`listSystems`**  
  Not implemented; it throws.

### Data mapping

The provider maps System Registry JSON to Gram’s `System` like this:

| System Registry field   | Gram `System` usage        |
|-------------------------|----------------------------|
| `system_id`             | `id`, `externalId`         |
| `name`                  | `name`                     |
| `system_description`    | `description`              |
| `klarna_team_ac`        | Team `id`                  |
| `klarna_team_name`      | Team `name`                |

The full registry payload is described by the `SystemRegistrySystem` interface in `SystemRegistrySystemProvider.ts` (e.g. `key`, `lifecycle_state`, `requirements_scope`, etc.).

---

## Local development: Bouncer and C2C proxy

System Registry is only reachable from inside Klarna’s network. On your laptop you must use the **Bouncer (C2C) local proxy** so that traffic to `systems.nonprod.klarna.net` is tunneled and authenticated correctly.

### 1. Bouncer config

Bouncer configuration for Gram is already defined in **`c2c-service-metadata.json`** at the repo root. You do not need to change it for normal local runs.

### 2. Start the local proxy

Start the C2C local proxy **before** running Gram:

```bash
kep c2c service local-proxy \
  --krn krn:c2c:service-environment:gram:eu-staging \
  --preview \
  --access-type dependencies
```

This typically sets **`C2C_PROXY`** (or equivalent) so that outgoing HTTP from your machine is sent through the proxy.  
`SystemRegistrySystemProvider` uses that for development: when `isDevelopment()` is true, it sends requests with `HttpProxyAgent(process.env.C2C_PROXY || "")`.

### 3. Run Gram with the proxy in use

- Leave the local proxy running in one terminal.
- In another terminal, run Gram as usual (e.g. `npm run dev` or your normal start command).
- Ensure the environment Gram runs in has **`C2C_PROXY`** set.  
  If you start the proxy via `kep` as above, it often configures this for the same shell; otherwise set it manually to the proxy URL (e.g. `http://127.0.0.1:…` as given by the `kep` output).

If the proxy is not running or `C2C_PROXY` is wrong, calls to System Registry from your local Gram will fail.

---

## Environment variables

Used when Gram is running with the Klarna/System Registry setup:

| Variable                     | Purpose |
|-----------------------------|---------|
| **`C2C_PROXY`**             | Required in **development**. URL of the Bouncer local proxy (e.g. `http://127.0.0.1:…`). Used by `SystemRegistrySystemProvider` to reach `systems.nonprod.klarna.net`. Set by `kep c2c service local-proxy` or manually. |

In staging/production, Gram runs inside the cluster and talks to System Registry without `C2C_PROXY`; the constructor secrets are still used by the config.

---

## Configuration wiring

In `config/default.ts`, the provider is built and passed into `KlarnaSystemProvider`:

```ts
const registrySystemProvider = new SystemRegistrySystemProvider();
const j1SystemProvider = new KlarnaSystemProvider(
  registrySystemProvider,
  j1ClientFactory
);
// …
return { systemProvider: j1SystemProvider, … };
```

So any “get system by ID” goes: Bootstrapper → `systemProvider` (KlarnaSystemProvider) → `SystemRegistrySystemProvider.getSystem()`.

---

## References

- **Bouncer / C2C “How to” (access from laptop, upstream services):**  
  [Bouncer/How To Guides - Access from Laptop — Scenario 2: Testing Upstream Services](https://wiki.klarna.net/wiki/Bouncer/How_To_Guides_-_Access_from_Laptop#Scenario_2:_Testing_Upstream_Services)
- **System Registry API / systems:**  
  Internal System Registry (Oktane) docs and API base URLs: `systems.klarna.net` (production), `systems.nonprod.klarna.net` (non-production).
