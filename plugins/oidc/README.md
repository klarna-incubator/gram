# README

Pack with OIDC provider, i.e. SSO login via a third party OIDC compatible provider (such as Okta).

## Configuration

Add the @gram/oidc package to your config.

```sh
npm -w config i @gram/oidc
```

Then modify your configuration by adding the OIDCIdentityProvider.

```ts
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import { OIDCIdentityProvider } from "@gram/oidc";


// ...
bootstrapProviders: async function () {
    const oidc = new OIDCIdentityProvider(
    "https://<discover url>/",
    new EnvSecret("OIDC_CLIENT_ID"),
    new EnvSecret("OIDC_CLIENT_SECRET"),
    new EnvSecret("OIDC_SESSION_SECRET"),
    "email"
    );

    return {
        // ...
        identityProviders: [oidc],
    }
}
```

### At your OIDC provider

Gram uses the `/login/callback/oidc` for the Sign-in redirect URIs. Most likely you will need to allow this at your OIDC provider.

Set allowed redirect_url to the equivalent of the domain name you are hosting the application at
`https://<your gram domain>/login/callback/oidc`

For your local development environment you can enable:
`http://localhost:4726/login/callback/oidc`
