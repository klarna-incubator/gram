# Integration ⚡

Want to use data from Gram?

## Method 1: From QlikSense

If you want to create pretty dashboards to impress your manager,
we already publish data to Qliksense. Look under the `[lib://ks_data_manual/secdev/]` folder.

## Method 2: Using Gram's API

You can also get programmatic read-only access to Gram's API via LDAP+JWT Authentication.
Here's how:

1. [Create a unique system user](https://jira.int.klarna.net/jira/plugins/servlet/desk/portal/98/create/1664) to be used for the integration (e.g. sys.fooapp.gram). We recommend you create separate credential per deployment environment (e.g staging/production).

2. Using the [Access Request service desk form](https://jira.int.klarna.net/jira/plugins/servlet/desk/portal/146/create/1797), request the unique system user to be added to the Gram system-user LDAP groups. You'll want to request the **system-api-access access (prod)** and **system-api-access access (staging)** respectively.

3. While you wait for approval, maybe consult with us your use-case so we can tell you which routes to use, since there is no documentation of the routes (yet?)

Once your system has access, here is how you authenticate to the API:

1. Use basic authentication of your system user ldap credentials to get a session JWT.
   - GET http://localhost:8080/api/v1/auth/token?provider=ldap
2. Use JWT for the rest of your requests (for that session)

⚠️ Keep in mind Gram was not built to be a scalable API and has bottlenecks. Promise that you don't abuse it <3
