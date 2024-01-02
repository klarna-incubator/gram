# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
