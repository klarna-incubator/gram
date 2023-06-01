# Development

- `main` is the main branch, reflecting production.
- `develop` is the staging branch where we stage our changes before release.

Branches should start with either `hotfix/`, `feature/` or `chore/` depending on the task at hand, and should always include a jira ticket ID. The only exception to this is `release/` branches, which use semantic versioning.

For smaller changes, it's generally fine to push directly to develop.

E.g. `feature/SECDEV-123-add-nightmode`. Besides hotfixes branches, all branches should be based on the develop branch.

# Setup

TODO: Describe Github/Stash relationship here with a nice diagram.

This repository is a fork of an [upstream github repository](https://github.com/klarna-incubator/gram) which contains
the base open source Gram application.

All changes in this repo are to reflect Klarna-specific configuration for Gram - i.e. how we authenticate via Okta, lookup authorization via LDAP and so on.

As such, any changes made outside of the `plugins/klarna/` folder will likely cause a conflict. If you need to make changes in `core/`,`api/` or `app/`, these need to be done in the open source repository.

## Updating this repository

To update this repository on stash with the latest changes from github, you will want to pull and merge in the changes into the develop branch.

# Versioning

The version is determined as follows:

```
<SEMANTIC_VERSION>-<COMMIT_ID>
```

`SEMANTIC_VERSION` is determined upstream by the github repository, `COMMIT_ID` is automatically set to be the latest commit. In this repository, **you should not need to touch the semantic version**.

## Deploying to staging

To release to staging, make a pull request against `develop`.
Once your PR has been reviewed and tested, you can merge it in (with squashing). Jenkins will automatically deploy the change to staging.

You can access the staging environment here:
https://gram-eu.staging.c2c.klarna.net/

## Releasing to production

There are two paths for deploying to production: **a) full release** or **b) hotfix release**.

### Full release

For the **full release**, where we want to push everything from develop to main, you should simply open a **pull request from develop into main**.

#### Merging

Pull Request into **main** with the same branch, and again **merge without squashing ("fast-forward-only")**.

### Hotfix release

You can use this path to deploy hotfix changes, typically used for urgent changes, e.g. vulnerability fixes or bug fixes, if you do not want to do a full release of all changes in `develop`. The full release is however prefered, as doing a hotfix may cause diverging histories and likely need rebasing, so avoid hotfixes when possible.

For a **hotfix release** you will need to base a new release branch of the `main` branch.

Then you can cherry pick the commits you need into your release branch.

The commands could look something like this (untested!)

```
NEW_VERSION=<NEW_VERSION>
git checkout main
git pull
git checkout -b release/$NEW_VERSION
git cherry-pick <commits you want>

git add api/package*.json
git add app/package*.json
git commit -m "Version $NEW_VERSION"

# Tag and push branch+tag
git push --set-upstream origin release/$NEW_VERSION
git push origin $NEW_VERSION
```

#### Merging

For a hotfix, you'll want to merge into `main` first. Create a pull request and **merge without squashing ("fast-forward-only")**.

Then depending on how the history has now changed, you may need to do some cleanup on the `develop` branch, so that keeps the same history as `main`. Likely these changes need to be done locally by doing a `git rebase main` on develop,
merging the histories, and pushing. Stash won't like this, so you'll likely need to force push.

Be careful.
