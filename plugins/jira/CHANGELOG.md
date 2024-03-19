# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.9.3](https://github.com/klarna-incubator/gram/compare/v4.9.2...v4.9.3) (2024-03-19)

**Note:** Version bump only for package @gram/jira

## [4.9.2](https://github.com/klarna-incubator/gram/compare/v4.9.1...v4.9.2) (2024-03-06)

**Note:** Version bump only for package @gram/jira

## [4.9.1](https://github.com/klarna-incubator/gram/compare/v4.9.0...v4.9.1) (2024-02-01)

### Bug Fixes

- correctly check reporter is set ([20d4688](https://github.com/klarna-incubator/gram/commit/20d4688e3ffc89593cdd28b7a3bb02c9a6a5f28f))
- make JiraActionItemExporter fallback on the token account as reporter if the reviewer cannot be found (e.g. due to offboarding) ([be90c6f](https://github.com/klarna-incubator/gram/commit/be90c6f503489e91d6694fdb2f9401e1c4e13874))
- missing await ([01a1d10](https://github.com/klarna-incubator/gram/commit/01a1d1087ca2ba11632e274dbabb53a923173c0f))

# [4.9.0](https://github.com/klarna-incubator/gram/compare/v4.8.1...v4.9.0) (2024-01-29)

### Bug Fixes

- jira export can happen before reviewer exists on model - quick fix by falling back on token user as reviewer. ([c015a4e](https://github.com/klarna-incubator/gram/commit/c015a4eddae8c0f4ea8d71cac51205109e5f1152))
- zod errors should now return why they failed in the API response. Add some tests for /api/links ([9ea9a1d](https://github.com/klarna-incubator/gram/commit/9ea9a1de98007bb0319c35611fc51ab12e62848e))

### Features

- Ability to add custom links to threats/controls ([36b88e3](https://github.com/klarna-incubator/gram/commit/36b88e3a32db0f642fae1e70266daadfd1e4a0f6))
- add proxying to jira plugin ([fe87616](https://github.com/klarna-incubator/gram/commit/fe8761653a718d0ed3d2004bd2435f5963b03ea1))
- add the ability to export action items outside of the review flow. Also make the feature to automatically exporter action items on review approve a boolean config option. ([bb91786](https://github.com/klarna-incubator/gram/commit/bb917861a726a112ab866a6fe25df66da1e93ad6))
- new Jira Action Item exporter ([fa7db12](https://github.com/klarna-incubator/gram/commit/fa7db1298d09f1ecd401cef2ff5dda51daad781a))

## [4.8.1](https://github.com/klarna-incubator/gram/compare/v4.8.0...v4.8.1) (2024-01-02)

**Note:** Version bump only for package @gram/jira

# [4.8.0](https://github.com/klarna-incubator/gram/compare/v4.7.3...v4.8.0) (2024-01-02)

**Note:** Version bump only for package @gram/jira
