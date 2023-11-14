# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.6.0](https://github.com/klarna-incubator/gram/compare/v4.5.1...v4.6.0) (2023-11-14)

### Bug Fixes

- Action Item Tab should no longer crash when component no longer exists. ([1b94298](https://github.com/klarna-incubator/gram/commit/1b94298e4b8a092ec69a9aad0e80cde704005953)), closes [#66](https://github.com/klarna-incubator/gram/issues/66)
- mark snyk zod finding as fp ([f687faf](https://github.com/klarna-incubator/gram/commit/f687faf3e53d41aaa72b0359e4f46d054308c3bc))
- more nitpicky normalisation to make lists the same width and use more mui components ([1dca954](https://github.com/klarna-incubator/gram/commit/1dca954dbbca2eb83949902f306b3cf72f77305a))
- move all DataServices to use GramConnectionPool and transaction instead of the pg.Pool ([1f07179](https://github.com/klarna-incubator/gram/commit/1f071799bc42b6fc707957ad2f6876fcb4b9c5a7))
- threat severity, title and description should now update correctly between multiple component instances ([549a9cc](https://github.com/klarna-incubator/gram/commit/549a9cc471d79d1b3ac86033b20df15b594eba3d)), closes [#65](https://github.com/klarna-incubator/gram/issues/65)

### Features

- enable contact details to be set through configuration ([4516e98](https://github.com/klarna-incubator/gram/commit/4516e98099225187060210adbb3d43a7a84b1d43)), closes [#23](https://github.com/klarna-incubator/gram/issues/23) [#49](https://github.com/klarna-incubator/gram/issues/49)

## [4.5.1](https://github.com/klarna-incubator/gram/compare/v4.5.0...v4.5.1) (2023-11-01)

### Bug Fixes

- hide mitigate label on suggested controls if there are no mitigated threats to display ([e23eda1](https://github.com/klarna-incubator/gram/commit/e23eda1f713a4987636a0c737446eec8e8d5d70e))

# [4.5.0](https://github.com/klarna-incubator/gram/compare/v4.4.1...v4.5.0) (2023-11-01)

### Bug Fixes

- better 404 handling for model and system (should no longer crash the frontend) ([5b2b77d](https://github.com/klarna-incubator/gram/commit/5b2b77d8067a1a1b97ea216d8f6a0d92ff99e740))
- compact review widget by combining multiple buttons into a dropdown ([f4c6127](https://github.com/klarna-incubator/gram/commit/f4c612798e277ea8c3f477d5dadfa074bffbc917))
- display text if no new suggestions are available ([14be477](https://github.com/klarna-incubator/gram/commit/14be477d5e2d20928e3c62deb4e17aec0da7ed9f))
- ensure suggestion status is copied during import to avoid duplicate suggestions ([380e616](https://github.com/klarna-incubator/gram/commit/380e6160f67ab38ec78bd55f94efd569504ee1a3))
- hide mitigation chip for control suggestions if relevant threat suggestion does not exist ([e438fec](https://github.com/klarna-incubator/gram/commit/e438fec162bfc5ae35fdc7e84335ae5671d88697))
- list control suggestions on threats ([e3098a5](https://github.com/klarna-incubator/gram/commit/e3098a5f2b4dc30d820db2445da4ed9f6f6fb969))
- rendering of Threat if no component is selected, e.g. in the Action Items modal ([be2ad22](https://github.com/klarna-incubator/gram/commit/be2ad223e8e92eb6a772261414710d0d2b5de1d6))
- show action item toggle for non-reviewer users ([b8e443e](https://github.com/klarna-incubator/gram/commit/b8e443e98a905663bdec1dc43dd93c7dba7174a6))
- temporarily hide stride suggestions from the list view to avoid repetitveness ([c051eec](https://github.com/klarna-incubator/gram/commit/c051eececa8461748fc0a302af02d14f0ae07eec))
- threats/controls order being rearranged on imported models. ([fa0d30e](https://github.com/klarna-incubator/gram/commit/fa0d30e1f6aacdd7da218f36cf0af6971aa9e19a))

## [4.4.1](https://github.com/klarna-incubator/gram/compare/v4.4.0...v4.4.1) (2023-10-18)

### Bug Fixes

- clean up Team system lists on Home and Team page. ([6ac2e32](https://github.com/klarna-incubator/gram/commit/6ac2e32ee13a97fc71d2abac45f508f6486305f5))
- get docker-compose demo working again - improve docs and setup ([ea95a5d](https://github.com/klarna-incubator/gram/commit/ea95a5d050e1ffa0194b441d6d6712a8d5688695))
- hide system property box if there are no properties ([18dbbdf](https://github.com/klarna-incubator/gram/commit/18dbbdf0f89e093c9c81fa6882a156cea501a831))
- pagination of static system provider ([83d709d](https://github.com/klarna-incubator/gram/commit/83d709dfca1fb9e6cd9d4f24fd0b6befbc697949))

# [4.4.0](https://github.com/klarna-incubator/gram/compare/v4.3.0...v4.4.0) (2023-10-16)

### Bug Fixes

- change from localhost -> 127.0.0.1 as a potential fix for mac users ([c0152fa](https://github.com/klarna-incubator/gram/commit/c0152fa9e21c83420110ed180c02950c59d8b084))
- clientside error when clicking the mitigationchip inside the action items view ([548e91b](https://github.com/klarna-incubator/gram/commit/548e91b10f6183422fdae8193c76e6dc9adf50e3))
- correctly copy threat action item marking and suggestion link when copying a threat model ([e9c48a1](https://github.com/klarna-incubator/gram/commit/e9c48a1d9124a30dd3ad2551e867a5040c852fb3)), closes [#29](https://github.com/klarna-incubator/gram/issues/29)
- hide reviews page from non-reviewer users ([9e71ebe](https://github.com/klarna-incubator/gram/commit/9e71ebe5734aeef79d7416afaef2371629f57e5d))

### Features

- add basic modal to view action items as a list ([9c3a9d0](https://github.com/klarna-incubator/gram/commit/9c3a9d021ced565a7faaf99910b9a4409ed086a9))
- add StaticTeamProvider to default config with some sample teams ([93839d8](https://github.com/klarna-incubator/gram/commit/93839d82c43857ae0b19186b2baa353a97c70714))

# [4.3.0](https://github.com/klarna-incubator/gram/compare/v4.2.1...v4.3.0) (2023-10-09)

### Features

- add azure, cncf, kubernetes plugins ([df0b907](https://github.com/klarna-incubator/gram/commit/df0b907a4782fdfcd833c00a4ea82504ee446626))
- add azure,cncf and kubernetes plugin to default config ([cbba98c](https://github.com/klarna-incubator/gram/commit/cbba98caad336d6ac7845789eaabf74980af837b))

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
