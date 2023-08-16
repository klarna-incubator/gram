# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.2](https://github.com/klarna-incubator/gram/compare/v4.0.1...v4.0.2) (2023-08-16)

**Note:** Version bump only for package gram





## [4.0.1](https://github.com/klarna-incubator/gram/compare/v4.0.0...v4.0.1) (2023-08-15)


### Bug Fixes

* config not building due to package.json misconfiguration ([db83410](https://github.com/klarna-incubator/gram/commit/db83410ecfc2b7290a942edb532483082295de5d))
* plugin migrations should now work again ([247ae63](https://github.com/klarna-incubator/gram/commit/247ae6304bdf997cc6f79ee4621934804679e987))
* prevent frontend crash if identity provider doesn't supply form ([42f1414](https://github.com/klarna-incubator/gram/commit/42f1414bc8a0a2cf2f0aa0e599377c761e0d13ba))


### Features

* add LDAP plugin ([349ca43](https://github.com/klarna-incubator/gram/commit/349ca4322b1009588c8584ee96951b32884d936e))
* add OIDC authentication provider ([d45d68e](https://github.com/klarna-incubator/gram/commit/d45d68e42210cd81ed4c9622d74b002fae0c096e))





# [4.0.0](https://github.com/klarna-incubator/gram/compare/v3.1.2...v4.0.0) (2023-08-04)

### Breaking
The way plugins and configuration received a major rewrite.

### Bug Fixes

* badge for review count no longer shows after logout ([9ef88aa](https://github.com/klarna-incubator/gram/commit/9ef88aa2c46ecd622ec9f64eb994339935e50a09))
* EmailForm button also needs to be submit ([26820b2](https://github.com/klarna-incubator/gram/commit/26820b229185650358014f52fd8d2630951ff408))
* hide logged in user's team functionality if no team is attached ([408433d](https://github.com/klarna-incubator/gram/commit/408433d8ec8f7c22324ad29ca7721e1ed3d56995))
* prevent default form submission (causes page reload) ([00a76d8](https://github.com/klarna-incubator/gram/commit/00a76d808ea948382b389fb091c83cd1e437680f))
* return more informative error message when login succeeds but user lookup returns empty ([e0f36f7](https://github.com/klarna-incubator/gram/commit/e0f36f7a1ba7bd0e0e0d51f44ccfe703bb139d2c))
* should no longer crash the ChangeReviewer widget if reviewer no longer exists ([263531f](https://github.com/klarna-incubator/gram/commit/263531f1082b251f7fce0b2cab94082d51505bf8))


### Features

* add magiclink auth provider. Some refactor of existing auth to allow for a email form ([d1441eb](https://github.com/klarna-incubator/gram/commit/d1441ebccb664eb54e08a44c25fec68e20da1738))
* submit email form on enter ([d82b757](https://github.com/klarna-incubator/gram/commit/d82b757642b7d7f75afc393c0c1126b00846b5ca))





## [3.1.2](https://github.com/klarna-incubator/gram/compare/v3.1.1...v3.1.2) (2023-05-09)


### Bug Fixes

* emailjs leaking password on authorization failure ([0f83912](https://github.com/klarna-incubator/gram/commit/0f83912ab9d76a8930b5318d3c4778bbf989676a))





# [](https://github.com/klarna-incubator/gram/compare/v3.1.1...v) (2023-05-09)


### Bug Fixes

* emailjs leaking password on authorization failure ([0f83912](https://github.com/klarna-incubator/gram/commit/0f83912ab9d76a8930b5318d3c4778bbf989676a))



## [3.1.1](https://github.com/klarna-incubator/gram/compare/v3.1.0...v3.1.1) (2023-04-20)



# 3.1.0 (2023-03-22)
