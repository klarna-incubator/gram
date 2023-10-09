# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.2.1](https://github.com/klarna-incubator/gram/compare/v4.2.0...v4.2.1) (2023-10-09)

### Bug Fixes

- make defaultauthz more permissive: Allow reviewers to write and standalone models are write-all ([1d2752e](https://github.com/klarna-incubator/gram/commit/1d2752ec08335f778a67d100b6b034e1dbf0f02a))

# [4.2.0](https://github.com/klarna-incubator/gram/compare/v4.1.0...v4.2.0) (2023-10-05)

### Bug Fixes

- cache.has should not return true when an item has expired ([174ab4f](https://github.com/klarna-incubator/gram/commit/174ab4f5d39007bdffdd144babfab86c6b86b42c))
- correctly hide login buttons for identity providers when form is not set ([cacc7e7](https://github.com/klarna-incubator/gram/commit/cacc7e7f2167e195d306ade0d72a57f741445119))
- LDAPTeamProvider return empty array if no teams on the user ([ce75437](https://github.com/klarna-incubator/gram/commit/ce75437dac1ef382c6ec1805d18328ad07d54b23))
- oidc should throw more specific error when cookie is not set ([3415160](https://github.com/klarna-incubator/gram/commit/3415160959ce5186697d7b9e4ea63d677178d19b))
- version should now be correctly set during runtime ([e1e9fe0](https://github.com/klarna-incubator/gram/commit/e1e9fe01a6350ac7aa4e16c098540005f6c56ef9))

### Features

- add optional function for LDAPBasicAuthIdentityProvider to provide different userid in case it differs from dn ([b94bb7f](https://github.com/klarna-incubator/gram/commit/b94bb7f7abf73b57372625516e3c08cd49b4ea2a))
- allow specifying custom key for OIDCIdentityProvider ([38d8c3c](https://github.com/klarna-incubator/gram/commit/38d8c3ca5da8bc9cb3e40ab6658243fff34df1b4))

# [4.1.0](https://github.com/klarna-incubator/gram/compare/v4.0.3...v4.1.0) (2023-09-28)

### Bug Fixes

- add back cache being set ([3d09c1f](https://github.com/klarna-incubator/gram/commit/3d09c1ff21155a2d843872d29b3bd97d654d3d2e))
- add escaping to teamIds ([24e4be4](https://github.com/klarna-incubator/gram/commit/24e4be400a6728123ba1ba796aefb2c2fe3ac7ff))
- docker-start migrate script no longer exists, migration runs automatically ([cc7141c](https://github.com/klarna-incubator/gram/commit/cc7141c24527f10fb4d8fc45a3701abec820a93e))
- dont perform unbind inside ldap query function ([f45689f](https://github.com/klarna-incubator/gram/commit/f45689f2bace6f9ce2e8b264c6462d154fd386a6))
- fix fallback reviewer assignment crashing in case it's not listed as a reviewer by the provider ([15f4a7a](https://github.com/klarna-incubator/gram/commit/15f4a7addf593e688382914bc18691f0ca4df1c9))
- remove teams attribute from sampleUsers in default config ([f49af4d](https://github.com/klarna-incubator/gram/commit/f49af4dcbac75a71af4b933f93e1d15fb4ee0035))
- requested_at should be set on review row when created ([58a9474](https://github.com/klarna-incubator/gram/commit/58a9474216b88db3a30bb6575c9c848f8b14e486))
- single lookup by id can use fallbackreviewer ([5ead17e](https://github.com/klarna-incubator/gram/commit/5ead17e87c1d70b84a46c27ce5477c206de7d956))

### Features

- add LDAPGroupBasedReviewerProvider ([014140b](https://github.com/klarna-incubator/gram/commit/014140b5b3dd78dce207801d47bf318654e82949))

## [4.0.3](https://github.com/klarna-incubator/gram/compare/v4.0.2...v4.0.3) (2023-08-18)

### Bug Fixes

- Component vulnerable/secure indicators should now work in firefox. ([8f6d441](https://github.com/klarna-incubator/gram/commit/8f6d441bfdc85fa78ca11815805f3da65f88ad03)), closes [#5](https://github.com/klarna-incubator/gram/issues/5)
- hide SystemProperties when viewing a model without system ([d638488](https://github.com/klarna-incubator/gram/commit/d63848810d8ed4e46b9646e95c2004bbd1614dcf))
- small ux fix to hint at selecting components in the diagram view ([472cb4f](https://github.com/klarna-incubator/gram/commit/472cb4f0e5354b07584ca5100aee0c859b708d88))
- very nitpicky adjustment on the height and colours of the panel buttons ([1355e09](https://github.com/klarna-incubator/gram/commit/1355e09ebcadaff6c3bb0d0d6d9d456550d7d54b))

## [4.0.2](https://github.com/klarna-incubator/gram/compare/v4.0.1...v4.0.2) (2023-08-16)

**Note:** Version bump only for package gram

## [4.0.1](https://github.com/klarna-incubator/gram/compare/v4.0.0...v4.0.1) (2023-08-15)

### Bug Fixes

- config not building due to package.json misconfiguration ([db83410](https://github.com/klarna-incubator/gram/commit/db83410ecfc2b7290a942edb532483082295de5d))
- plugin migrations should now work again ([247ae63](https://github.com/klarna-incubator/gram/commit/247ae6304bdf997cc6f79ee4621934804679e987))
- prevent frontend crash if identity provider doesn't supply form ([42f1414](https://github.com/klarna-incubator/gram/commit/42f1414bc8a0a2cf2f0aa0e599377c761e0d13ba))

### Features

- add LDAP plugin ([349ca43](https://github.com/klarna-incubator/gram/commit/349ca4322b1009588c8584ee96951b32884d936e))
- add OIDC authentication provider ([d45d68e](https://github.com/klarna-incubator/gram/commit/d45d68e42210cd81ed4c9622d74b002fae0c096e))

# [4.0.0](https://github.com/klarna-incubator/gram/compare/v3.1.2...v4.0.0) (2023-08-04)

### Breaking

The way plugins and configuration received a major rewrite.

### Bug Fixes

- badge for review count no longer shows after logout ([9ef88aa](https://github.com/klarna-incubator/gram/commit/9ef88aa2c46ecd622ec9f64eb994339935e50a09))
- EmailForm button also needs to be submit ([26820b2](https://github.com/klarna-incubator/gram/commit/26820b229185650358014f52fd8d2630951ff408))
- hide logged in user's team functionality if no team is attached ([408433d](https://github.com/klarna-incubator/gram/commit/408433d8ec8f7c22324ad29ca7721e1ed3d56995))
- prevent default form submission (causes page reload) ([00a76d8](https://github.com/klarna-incubator/gram/commit/00a76d808ea948382b389fb091c83cd1e437680f))
- return more informative error message when login succeeds but user lookup returns empty ([e0f36f7](https://github.com/klarna-incubator/gram/commit/e0f36f7a1ba7bd0e0e0d51f44ccfe703bb139d2c))
- should no longer crash the ChangeReviewer widget if reviewer no longer exists ([263531f](https://github.com/klarna-incubator/gram/commit/263531f1082b251f7fce0b2cab94082d51505bf8))

### Features

- add magiclink auth provider. Some refactor of existing auth to allow for a email form ([d1441eb](https://github.com/klarna-incubator/gram/commit/d1441ebccb664eb54e08a44c25fec68e20da1738))
- submit email form on enter ([d82b757](https://github.com/klarna-incubator/gram/commit/d82b757642b7d7f75afc393c0c1126b00846b5ca))

## [3.1.2](https://github.com/klarna-incubator/gram/compare/v3.1.1...v3.1.2) (2023-05-09)

### Bug Fixes

- emailjs leaking password on authorization failure ([0f83912](https://github.com/klarna-incubator/gram/commit/0f83912ab9d76a8930b5318d3c4778bbf989676a))

# [](https://github.com/klarna-incubator/gram/compare/v3.1.1...v) (2023-05-09)

### Bug Fixes

- emailjs leaking password on authorization failure ([0f83912](https://github.com/klarna-incubator/gram/commit/0f83912ab9d76a8930b5318d3c4778bbf989676a))

## [3.1.1](https://github.com/klarna-incubator/gram/compare/v3.1.0...v3.1.1) (2023-04-20)

# 3.1.0 (2023-03-22)
