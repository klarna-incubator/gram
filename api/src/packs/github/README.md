# README

To run this GitHub integration, you'll need to set up your own Github App.

Permissions needed:

- `repo: metadata` permission. This allows it to search/view repository metadata on the logged in user's behalf.
- `user: email` (read-only). This is needed to send notification emails.

Pass the following environment variables to the docker container.

```yaml
GITHUB_APPID:
GITHUB_CLIENTID:
GITHUB_CLIENTSECRET:
GITHUB_PRIVATEKEY:
```

Configure who is an administrator with the toplevel "admins" setting.

```
    "admins": ["Tethik"]
```
