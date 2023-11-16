# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.7.1](https://github.com/klarna/gram/compare/v4.7.0...v4.7.1) (2023-11-16)

**Note:** Version bump only for package @gram/core

# [4.7.0](https://github.com/klarna/gram/compare/v4.6.1...v4.7.0) (2023-11-15)

### Bug Fixes

- suggestions should now clear correctly if the source no longer suggests them ([8d6c988](https://github.com/klarna/gram/commit/8d6c98898c8fe8a6fa5fc86c160bf9f04a019a55))

## [4.6.1](https://github.com/klarna/gram/compare/v4.6.0...v4.6.1) (2023-11-14)

### Bug Fixes

- importing models with deleted components should no longer crash ([f5a2681](https://github.com/klarna/gram/commit/f5a2681ea30797b4f123e4a0fbf9765f7e53c4aa))
- stop SeveritySlider from crashing if severity is null. ([25f7654](https://github.com/klarna/gram/commit/25f7654c051c17ef34c38e76b4a2dc04d4336541))

# [4.6.0](https://github.com/klarna/gram/compare/v4.5.1...v4.6.0) (2023-11-14)

### Bug Fixes

- move all DataServices to use GramConnectionPool and transaction instead of the pg.Pool ([1f07179](https://github.com/klarna/gram/commit/1f071799bc42b6fc707957ad2f6876fcb4b9c5a7))

### Features

- enable contact details to be set through configuration ([4516e98](https://github.com/klarna/gram/commit/4516e98099225187060210adbb3d43a7a84b1d43)), closes [#23](https://github.com/klarna/gram/issues/23) [#49](https://github.com/klarna/gram/issues/49)

## [4.5.1](https://github.com/klarna/gram/compare/v4.5.0...v4.5.1) (2023-11-01)

**Note:** Version bump only for package @gram/core

# [4.5.0](https://github.com/klarna/gram/compare/v4.4.1...v4.5.0) (2023-11-01)

### Bug Fixes

- ensure suggestion status is copied during import to avoid duplicate suggestions ([380e616](https://github.com/klarna/gram/commit/380e6160f67ab38ec78bd55f94efd569504ee1a3))
- threats/controls order being rearranged on imported models. ([fa0d30e](https://github.com/klarna/gram/commit/fa0d30e1f6aacdd7da218f36cf0af6971aa9e19a))

## [4.4.1](https://github.com/klarna/gram/compare/v4.4.0...v4.4.1) (2023-10-18)

**Note:** Version bump only for package @gram/core

# [4.4.0](https://github.com/klarna/gram/compare/v4.3.0...v4.4.0) (2023-10-16)

### Bug Fixes

- correctly copy threat action item marking and suggestion link when copying a threat model ([e9c48a1](https://github.com/klarna/gram/commit/e9c48a1d9124a30dd3ad2551e867a5040c852fb3)), closes [#29](https://github.com/klarna/gram/issues/29)

# [4.3.0](https://github.com/klarna/gram/compare/v4.2.1...v4.3.0) (2023-10-09)

**Note:** Version bump only for package @gram/core

## [4.2.1](https://github.com/klarna/gram/compare/v4.2.0...v4.2.1) (2023-10-09)

### Bug Fixes

- make defaultauthz more permissive: Allow reviewers to write and standalone models are write-all ([1d2752e](https://github.com/klarna/gram/commit/1d2752ec08335f778a67d100b6b034e1dbf0f02a))

# [4.2.0](https://github.com/klarna/gram/compare/v4.1.0...v4.2.0) (2023-10-05)

### Bug Fixes

- cache.has should not return true when an item has expired ([174ab4f](https://github.com/klarna/gram/commit/174ab4f5d39007bdffdd144babfab86c6b86b42c))
- correctly hide login buttons for identity providers when form is not set ([cacc7e7](https://github.com/klarna/gram/commit/cacc7e7f2167e195d306ade0d72a57f741445119))

# [4.1.0](https://github.com/klarna/gram/compare/v4.0.3...v4.1.0) (2023-09-28)

### Bug Fixes

- fix fallback reviewer assignment crashing in case it's not listed as a reviewer by the provider ([15f4a7a](https://github.com/klarna/gram/commit/15f4a7addf593e688382914bc18691f0ca4df1c9))
- requested_at should be set on review row when created ([58a9474](https://github.com/klarna/gram/commit/58a9474216b88db3a30bb6575c9c848f8b14e486))
- single lookup by id can use fallbackreviewer ([5ead17e](https://github.com/klarna/gram/commit/5ead17e87c1d70b84a46c27ce5477c206de7d956))

## [4.0.2](https://github.com/klarna/gram/compare/v4.0.1...v4.0.2) (2023-08-16)

**Note:** Version bump only for package @gram/core

## [4.0.1](https://github.com/klarna/gram/compare/v4.0.0...v4.0.1) (2023-08-15)

### Bug Fixes

- plugin migrations should now work again ([247ae63](https://github.com/klarna/gram/commit/247ae6304bdf997cc6f79ee4621934804679e987))

### Features

- add OIDC authentication provider ([d45d68e](https://github.com/klarna/gram/commit/d45d68e42210cd81ed4c9622d74b002fae0c096e))

# [4.0.0](https://github.com/klarna/gram/compare/v3.1.2...v4.0.0) (2023-08-04)

### Features

- add magiclink auth provider. Some refactor of existing auth to allow for a email form ([d1441eb](https://github.com/klarna/gram/commit/d1441ebccb664eb54e08a44c25fec68e20da1738))

## [3.1.2](https://github.com/klarna/gram/compare/v3.1.1...v3.1.2) (2023-05-09)

### Bug Fixes

- emailjs leaking password on authorization failure ([0f83912](https://github.com/klarna/gram/commit/0f83912ab9d76a8930b5318d3c4778bbf989676a))
