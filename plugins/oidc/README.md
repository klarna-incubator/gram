# README

Pack with OIDC provider, i.e. SSO login via a third party OIDC compatible provider (such as Okta).

## Configuration

## At your OIDC provider

Gram uses the `/login/callback/oidc` for the Sign-in redirect URIs. Most likely you will need to allow this at your OIDC provider.

Set allowed redirect_url to the equivalent of the domain name you are hosting the application at
`https://<your gram domain>/login/callback/oidc`

For your local development environment you can enable:
`http://localhost:4726/login/callback/oidc`
