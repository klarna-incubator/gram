# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.20.1](https://github.com/klarna/gram/compare/v4.20.0...v4.20.1) (2024-11-25)

**Note:** Version bump only for package @gram/api

# [4.20.0](https://github.com/klarna/gram/compare/v4.19.0...v4.20.0) (2024-11-25)

**Note:** Version bump only for package @gram/api

# [4.19.0](https://github.com/klarna/gram/compare/v4.18.0...v4.19.0) (2024-11-20)

### Bug Fixes

- can't import via require, move back to import (which unfortunately still starts the bundled sentry binary) ([7fcdd07](https://github.com/klarna/gram/commit/7fcdd07928030c9aec49156e54377768d951c72c))
- migrations should now use the same pg client as the rest of the application ([5126e4e](https://github.com/klarna/gram/commit/5126e4ed6bf00a0cc646ecdc9d6813f49b83c2c8))
- sentry should not load if sentryDSN is not set ([b13228b](https://github.com/klarna/gram/commit/b13228b558516c080ce5e1af86485fc4f1d33a26))

# [4.18.0](https://github.com/klarna/gram/compare/v4.17.6...v4.18.0) (2024-11-18)

**Note:** Version bump only for package @gram/api

## [4.17.6](https://github.com/klarna/gram/compare/v4.17.5...v4.17.6) (2024-10-28)

**Note:** Version bump only for package @gram/api

## [4.17.5](https://github.com/klarna/gram/compare/v4.17.4...v4.17.5) (2024-10-28)

**Note:** Version bump only for package @gram/api

## [4.17.4](https://github.com/klarna/gram/compare/v4.17.3...v4.17.4) (2024-10-28)

**Note:** Version bump only for package @gram/api

## [4.17.3](https://github.com/klarna/gram/compare/v4.17.2...v4.17.3) (2024-10-23)

**Note:** Version bump only for package @gram/api

## [4.17.2](https://github.com/klarna/gram/compare/v4.17.1...v4.17.2) (2024-10-23)

**Note:** Version bump only for package @gram/api

## [4.17.1](https://github.com/klarna/gram/compare/v4.17.0...v4.17.1) (2024-10-23)

### Bug Fixes

- bump vulnerable packages ([061a346](https://github.com/klarna/gram/commit/061a34660021db509c9eb1618a19d654b11e702b))
- remove accidental core package ([4626cb8](https://github.com/klarna/gram/commit/4626cb896b02d44c7361d92e4bfbea67b59cff20))
- remove some unused sentry packages ([d4fb5bc](https://github.com/klarna/gram/commit/d4fb5bc2d0a2cb6945e539cc9b96162c2666bebc))

# [4.17.0](https://github.com/klarna/gram/compare/v4.16.0...v4.17.0) (2024-10-23)

### Features

- :art: add bottom panel for validation result ([a19ab9c](https://github.com/klarna/gram/commit/a19ab9cd10cee6929ddb2a86a11b2ead74fea6f6))
- Dataflows now have a label, threats/controls and flows with attributes ([0fe31be](https://github.com/klarna/gram/commit/0fe31be4f51f4ea7d61ca87535faad954f4349db))

# [4.16.0](https://github.com/klarna/gram/compare/v4.15.2...v4.16.0) (2024-09-09)

### Features

- :tada: add basic validator ([47522a1](https://github.com/klarna/gram/commit/47522a1dcbc0827c10b48d56a94468a699d32cf2))

## [4.15.2](https://github.com/klarna/gram/compare/v4.15.1...v4.15.2) (2024-08-19)

**Note:** Version bump only for package @gram/api

## [4.15.1](https://github.com/klarna/gram/compare/v4.15.0...v4.15.1) (2024-08-16)

**Note:** Version bump only for package @gram/api

# [4.15.0](https://github.com/klarna/gram/compare/v4.14.1...v4.15.0) (2024-08-14)

**Note:** Version bump only for package @gram/api

## [4.14.1](https://github.com/klarna/gram/compare/v4.14.0...v4.14.1) (2024-07-23)

**Note:** Version bump only for package @gram/api

# [4.14.0](https://github.com/klarna/gram/compare/v4.13.0...v4.14.0) (2024-07-18)

**Note:** Version bump only for package @gram/api

# [4.13.0](https://github.com/klarna/gram/compare/v4.12.2...v4.13.0) (2024-07-04)

**Note:** Version bump only for package @gram/api

## [4.12.2](https://github.com/klarna/gram/compare/v4.12.1...v4.12.2) (2024-06-25)

### Bug Fixes

- bump ws to fix a security vulnerability. bump and rearrange snyk/jest dependencies. ([6f5df6f](https://github.com/klarna/gram/commit/6f5df6fd0f487db3ffecc7507ea4afb77e2a6bae))

## [4.12.1](https://github.com/klarna/gram/compare/v4.12.0...v4.12.1) (2024-06-14)

**Note:** Version bump only for package @gram/api

# [4.12.0](https://github.com/klarna/gram/compare/v4.11.0...v4.12.0) (2024-06-14)

### Features

- Component now has a System dropdown for selecting multiple systems. ([80ad59b](https://github.com/klarna/gram/commit/80ad59b67765d62149dc92b11519bbb2621df025)), closes [#103](https://github.com/klarna/gram/issues/103)

# [4.11.0](https://github.com/klarna/gram/compare/v4.10.0...v4.11.0) (2024-05-22)

### Features

- allow/enforce setting CSP frame-ancestors via config ([518ad0d](https://github.com/klarna/gram/commit/518ad0dbce2090567fa8216a67fa0d91da00504c))

# [4.10.0](https://github.com/klarna/gram/compare/v4.9.4...v4.10.0) (2024-04-15)

### Bug Fixes

- faulty user lookup by id ([adc9841](https://github.com/klarna/gram/commit/adc9841afeed5f072698af69cd3280d68fff881c))

### Features

- add ability for admins to change system-id on threat model. Creator of the threat model is now also displayed as the owner in case the threat model is not connected to a system. ([f91bd80](https://github.com/klarna/gram/commit/f91bd80aa3e381bdcf7d4f09c5b813646cab1494))
- show popup after importing a threat model to remind users to review the action items marked in a previous threat model. ([327935a](https://github.com/klarna/gram/commit/327935a7b024caa08dd0a7b93fa793113e708194))

## [4.9.4](https://github.com/klarna/gram/compare/v4.9.3...v4.9.4) (2024-03-21)

**Note:** Version bump only for package @gram/api

## [4.9.3](https://github.com/klarna/gram/compare/v4.9.2...v4.9.3) (2024-03-19)

**Note:** Version bump only for package @gram/api

## [4.9.2](https://github.com/klarna/gram/compare/v4.9.1...v4.9.2) (2024-03-06)

### Bug Fixes

- hide note button if review has not started yet ([48ace6a](https://github.com/klarna/gram/commit/48ace6afe28d7549f22fcab3288b374537a9195e))

## [4.9.1](https://github.com/klarna/gram/compare/v4.9.0...v4.9.1) (2024-02-01)

**Note:** Version bump only for package @gram/api

# [4.9.0](https://github.com/klarna/gram/compare/v4.8.1...v4.9.0) (2024-01-29)

### Bug Fixes

- control/ops api not correctly routing healthchecks and metadata. Also fix healthchecks with faulty logic. Adds new healthcheck for faulty action item exports. ([9d01102](https://github.com/klarna/gram/commit/9d01102e028fb4936cb71712f8b678773e1bf899))
- improve rendering of validation when creating links and fix javascript url check ([4ff6cab](https://github.com/klarna/gram/commit/4ff6cabd4ae1763f692d8f1a5e36f4ab7b15fe71))
- zod errors should now return why they failed in the API response. Add some tests for /api/links ([9ea9a1d](https://github.com/klarna/gram/commit/9ea9a1de98007bb0319c35611fc51ab12e62848e))

### Features

- Ability to add custom links to threats/controls ([b237532](https://github.com/klarna/gram/commit/b237532dbdbfffc2c476fc0f6c45d332a9fcb817))
- add the ability to export action items outside of the review flow. Also make the feature to automatically exporter action items on review approve a boolean config option. ([9943fff](https://github.com/klarna/gram/commit/9943fff9f23876e38aa86ff072a76f3b4243d2d5))

## [4.8.1](https://github.com/klarna/gram/compare/v4.8.0...v4.8.1) (2024-01-02)

**Note:** Version bump only for package @gram/api

# [4.8.0](https://github.com/klarna/gram/compare/v4.7.3...v4.8.0) (2024-01-02)

**Note:** Version bump only for package @gram/api

## [4.7.3](https://github.com/klarna/gram/compare/v4.7.2...v4.7.3) (2023-12-06)

**Note:** Version bump only for package @gram/api

## [4.7.2](https://github.com/klarna/gram/compare/v4.7.1...v4.7.2) (2023-11-20)

**Note:** Version bump only for package @gram/api

## [4.7.1](https://github.com/klarna/gram/compare/v4.7.0...v4.7.1) (2023-11-16)

**Note:** Version bump only for package @gram/api

# [4.7.0](https://github.com/klarna/gram/compare/v4.6.1...v4.7.0) (2023-11-15)

**Note:** Version bump only for package @gram/api

## [4.6.1](https://github.com/klarna/gram/compare/v4.6.0...v4.6.1) (2023-11-14)

**Note:** Version bump only for package @gram/api

# [4.6.0](https://github.com/klarna/gram/compare/v4.5.1...v4.6.0) (2023-11-14)

### Bug Fixes

- mark snyk zod finding as fp ([f687faf](https://github.com/klarna/gram/commit/f687faf3e53d41aaa72b0359e4f46d054308c3bc))
- move all DataServices to use GramConnectionPool and transaction instead of the pg.Pool ([1f07179](https://github.com/klarna/gram/commit/1f071799bc42b6fc707957ad2f6876fcb4b9c5a7))

### Features

- enable contact details to be set through configuration ([4516e98](https://github.com/klarna/gram/commit/4516e98099225187060210adbb3d43a7a84b1d43)), closes [#23](https://github.com/klarna/gram/issues/23) [#49](https://github.com/klarna/gram/issues/49)

## [4.5.1](https://github.com/klarna/gram/compare/v4.5.0...v4.5.1) (2023-11-01)

**Note:** Version bump only for package @gram/api

# [4.5.0](https://github.com/klarna/gram/compare/v4.4.1...v4.5.0) (2023-11-01)

**Note:** Version bump only for package @gram/api

## [4.4.1](https://github.com/klarna/gram/compare/v4.4.0...v4.4.1) (2023-10-18)

### Bug Fixes

- get docker-compose demo working again - improve docs and setup ([ea95a5d](https://github.com/klarna/gram/commit/ea95a5d050e1ffa0194b441d6d6712a8d5688695))

# [4.4.0](https://github.com/klarna/gram/compare/v4.3.0...v4.4.0) (2023-10-16)

### Bug Fixes

- correctly copy threat action item marking and suggestion link when copying a threat model ([e9c48a1](https://github.com/klarna/gram/commit/e9c48a1d9124a30dd3ad2551e867a5040c852fb3)), closes [#29](https://github.com/klarna/gram/issues/29)

### Features

- add StaticTeamProvider to default config with some sample teams ([93839d8](https://github.com/klarna/gram/commit/93839d82c43857ae0b19186b2baa353a97c70714))

# [4.3.0](https://github.com/klarna/gram/compare/v4.2.1...v4.3.0) (2023-10-09)

**Note:** Version bump only for package @gram/api

## [4.2.1](https://github.com/klarna/gram/compare/v4.2.0...v4.2.1) (2023-10-09)

**Note:** Version bump only for package @gram/api

# [4.2.0](https://github.com/klarna/gram/compare/v4.1.0...v4.2.0) (2023-10-05)

### Bug Fixes

- version should now be correctly set during runtime ([e1e9fe0](https://github.com/klarna/gram/commit/e1e9fe01a6350ac7aa4e16c098540005f6c56ef9))

# [4.1.0](https://github.com/klarna/gram/compare/v4.0.3...v4.1.0) (2023-09-28)

### Bug Fixes

- fix fallback reviewer assignment crashing in case it's not listed as a reviewer by the provider ([15f4a7a](https://github.com/klarna/gram/commit/15f4a7addf593e688382914bc18691f0ca4df1c9))

## [4.0.3](https://github.com/klarna/gram/compare/v4.0.2...v4.0.3) (2023-08-18)

### Bug Fixes

- Component vulnerable/secure indicators should now work in firefox. ([8f6d441](https://github.com/klarna/gram/commit/8f6d441bfdc85fa78ca11815805f3da65f88ad03)), closes [#5](https://github.com/klarna/gram/issues/5)

## [4.0.2](https://github.com/klarna/gram/compare/v4.0.1...v4.0.2) (2023-08-16)

**Note:** Version bump only for package @gram/api

## [4.0.1](https://github.com/klarna/gram/compare/v4.0.0...v4.0.1) (2023-08-15)

### Features

- add OIDC authentication provider ([d45d68e](https://github.com/klarna/gram/commit/d45d68e42210cd81ed4c9622d74b002fae0c096e))

# [4.0.0](https://github.com/klarna/gram/compare/v3.1.2...v4.0.0) (2023-08-04)

### Bug Fixes

- return more informative error message when login succeeds but user lookup returns empty ([e0f36f7](https://github.com/klarna/gram/commit/e0f36f7a1ba7bd0e0e0d51f44ccfe703bb139d2c))

### Features

- add magiclink auth provider. Some refactor of existing auth to allow for a email form ([d1441eb](https://github.com/klarna/gram/commit/d1441ebccb664eb54e08a44c25fec68e20da1738))

## [3.1.2](https://github.com/klarna/gram/compare/v3.1.1...v3.1.2) (2023-05-09)

**Note:** Version bump only for package @gram/api
