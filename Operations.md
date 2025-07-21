# Operations

This doc compiles how to do some common actions and information around operating Gram @ Klarna.

## Logging

Logs go to ChaosSearch

- [Production](<https://klarna-eu.chaossearch.io/#/analytics?pathname=%252Fkibana%252Fapp%252Fdiscover&kibana=%2523%252F%253F_g%253D(filters%253A!()%252CrefreshInterval%253A(pause%253A!t%252Cvalue%253A0)%252Ctime%253A(from%253Anow-15m%252Cto%253Anow))%2526_a%253D(columns%253A!(_source)%252Cfilters%253A!((%252527%2524state%252527%253A(store%253AappState)%252Cmeta%253A(alias%253A!n%252Cdisabled%253A!f%252Cindex%253Asystemid-logs_gram_90-days%252Ckey%253AKlarnaStage%252Cnegate%253A!f%252Cparams%253A(query%253Aproduction)%252Ctype%253Aphrase)%252Cquery%253A(match_phrase%253A(KlarnaStage%253Aproduction))))%252Cindex%253Asystemid-logs_gram_90-days%252Cinterval%253Aauto%252Cquery%253A(language%253Akuery%252Cquery%253A%252527%252527)%252Csort%253A!())>)
- [Staging](<https://klarna-eu.chaossearch.io/#/analytics?pathname=%252Fkibana%252Fapp%252Fdiscover&kibana=%2523%252F%253F_g%253D(filters%253A!()%252CrefreshInterval%253A(pause%253A!t%252Cvalue%253A0)%252Ctime%253A(from%253Anow-15m%252Cto%253Anow))%2526_a%253D(columns%253A!(_source)%252Cfilters%253A!((%252527%2524state%252527%253A(store%253AappState)%252Cmeta%253A(alias%253A!n%252Cdisabled%253A!f%252Cindex%253Asystemid-logs_gram_90-days%252Ckey%253AKlarnaStage%252Cnegate%253A!f%252Cparams%253A(query%253Astaging)%252Ctype%253Aphrase)%252Cquery%253A(match_phrase%253A(KlarnaStage%253Astaging))))%252Cindex%253Asystemid-logs_gram_90-days%252Cinterval%253Aauto%252Cquery%253A(language%253Akuery%252Cquery%253A%252527%252527)%252Csort%253A!())>)

## Monitoring

[Datadog provides monitoring](https://klarna.datadoghq.eu/event/stream?tags_execution=and&show_private=true&per_page=30&query=tags%3Ac2cservice%3Agram%20status%3Aall%20priority%3Aall&aggregate_up=true&use_date_happened=false&display_timeline=true&from_ts=1598533440000&priority=normal&is_zoomed=false&status=all&to_ts=1598537040000&is_auto=false&incident=true&only_discussed=false&no_user=false&page=0&live=true&bucket_size=60000).

[Datadog also has Metrics](https://klarna.datadoghq.eu/dashboard/ev2-r6g-xe2/c2c---overview?tpl_var_ServiceName=gram&from_ts=1646214910665&to_ts=1646819710665&live=true).

Extra datadog monitors:

- [Gram container crashed (docker error)](https://klarna.datadoghq.eu/monitors/4650162?live=2d)

Monitors:

- [Production Crash](https://klarna.datadoghq.eu/monitors/4650162)
- [Staging Crash](https://klarna.datadoghq.eu/monitors/4790755)

[C2C Healthcheck Dashboard](https://klarna.datadoghq.eu/dashboard/t9w-vpr-b6u/c2c---deep-healthcheck?tpl_var_partition=eu&tpl_var_service=gram&tpl_var_stage=%2A&from_ts=1630580698010&to_ts=1630582498010&live=true)

We collect errors via Sentry:

- [Sentry project for backend API](https://sentry.io/organizations/klarna-1/issues/?project=6023867)
- [Sentry project for frontend APP](https://sentry.io/organizations/klarna-1/projects/gram_app/?project=6236788)

To get access, check [this page](https://devs.klarna.net/docs/sentry/how_to_guides/getting_access/)

## CI - Jenkins

This will take you to the pipeline used for CI/CD:
https://secdev.jenkins.tools.klarna.net/blue/organizations/jenkins/gram/activity

## C2C

Gram runs as a single docker container on C2C. So you'll need `grond` and access
to our production AWS account to access it.

Ensure you are authenticated via `aws-login-tool`.

```sh
# Login to production (it's how we access C2C)
# eval $(aws-login-tool login -d 14400 -r iam-sync/gram/gram.IdP_admin -a 715798949107 -o)
# To get the secrets from staging, you can use the following command:
kep c2c secret list --service-name gram --partition eu --stage staging
```

### Redeploying or rolling back

A previously deployed version can be rolled back to. This is helpful if a broken version was deployed.

Fetch the versions via the following command

```
grond service describe --name gram
```

Then use the deployment run command to start a redeployment of that version.

```
grond deployment run -w --name gram -p eu -s <stage> --tag <version>
```

### Manually Deploying

⚠️ _You should not need to manually deploy in a normal case, use the Jenkins pipeline for deploying and only use this in emergency cases_

The application runs as a docker container via the C2C orchestration system.
To deploy, you'll need to build the docker container, push it to artifactory, then create and run the deployment on C2C.

Building and pushing the image to artifactory:

```
ARTIFACTORY=<l-docker-secure-development-staging.artifactory.klarna.net | l-docker-secure-development-production.artifactory.klarna.net>
docker login $ARTIFACTORY
VERSION=$(node --eval=\"process.stdout.write(require('./api/package.json').version)\")-$(git log --format="%H" -n 1)
docker build -t $ARTIFACTORY/secdev/gram:$VERSION .
docker push $ARTIFACTORY/secdev/gram:$VERSION
```

To deploy your new image, first login to the appsec AWS account via `aws-login-tool`, then run the following commands.

```
grond deployment prepare-image -w -n gram -m service-metadata.json -d $ARTIFACTORY/secdev/gram:$VERSION -t $VERSION
grond deployment run -w --name gram -p eu -s staging --tag $VERSION
```

## Terraform

To provision the databases and other cloud resources outside of C2C we use terraform. Please refer to the `infra/` folder.

## Testing docker locally

If you need to test the docker container locally, you can use the following commands to build
and run the container with your development config. The API should be able to start up, but currently
the login will fail due to the localhost domain not being whitelisted.

```
docker build -t gram .
docker run -p 127.0.0.1:8080:8080 -v $(pwd)/api/config:/home/klarna/config -e C2C_SERVICE_STAGE=development -it gram
```

## Backups

See [docs/Backups.md](docs/Backups.md).

## Handling failed Action Item Exports

Failed Action Item Exports should result in a failed healthcheck. This could happen if the jira integration fails for whatever reason.

Check the `action_item_failed_exports` table for more details on what failed:

```sql
SELECT * FROM action_item_failed_exports;
```

To retry the export that happens automatically on review approval, you can try the following admin endpoint. Change `<your token>` and pass the threat model ID as `$1`

```sh
curl 'https://gram.klarna.net/api/v1/admin/retry_review_approval' \
  -H 'authority: gram.klarna.net' \
  -H 'accept: */*' \
  -H 'accept-language: en-GB,en;q=0.9,sv-SE;q=0.8,sv;q=0.7,en-US;q=0.6' \
  -H 'authorization: bearer <your token>' \
  -H 'if-none-match: W/"e71-qk0vEuWOsdb/a7NSNS137u9JERo"' \
  -H 'sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' \
  -H 'Content-Type: application/json' \
  -d "{\"modelId\": \"$1\"}"
```

When fixed, you can delete from the `action_item_failed_exports` table to make
the healthcheck green again.
