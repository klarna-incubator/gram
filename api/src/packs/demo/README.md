# README

To run this GitHub integration, you'll need to set up your own Github App.

It needs the `repo: metadata` permission. This allows it to search/view repository metadata on the logged in user's behalf.

Pass the following environment variables to the docker container.

```yaml
GITHUB_APPID:
GITHUB_CLIENTID:
GITHUB_CLIENTSECRET:
GITHUB_PRIVATEKEY:
```
