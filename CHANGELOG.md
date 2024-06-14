# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.12.0](https://github.com/klarna-incubator/gram/compare/v4.11.0...v4.12.0) (2024-06-14)

### Bug Fixes

- pass readonly to MultipleSystemsDropdown via props. Make it disabled if readonly. ([e58381c](https://github.com/klarna-incubator/gram/commit/e58381c9bcc93dc7d1c3a874fc046c662567b1cf))

### Features

- Component now has a System dropdown for selecting multiple systems. ([80ad59b](https://github.com/klarna-incubator/gram/commit/80ad59b67765d62149dc92b11519bbb2621df025)), closes [#103](https://github.com/klarna-incubator/gram/issues/103)
- handle cases where the reviewer's name is null ([8cdd9c2](https://github.com/klarna-incubator/gram/commit/8cdd9c2bb164a84e492b5a6863df827c1397d360))
- handle null reviewer name in all cases in the Review page ([bbd98ba](https://github.com/klarna-incubator/gram/commit/bbd98ba828ffd73eff9d2398d4ff79c75375c00e))

# [4.11.0](https://github.com/klarna-incubator/gram/compare/v4.10.0...v4.11.0) (2024-05-22)

### Bug Fixes

- toggle panel buttons now visible again ([72060f6](https://github.com/klarna-incubator/gram/commit/72060f6e8d57fbe21c10391b72dd7196c24332ca))
- try to fix automatic centering to be more accurate and scale properly ([b242383](https://github.com/klarna-incubator/gram/commit/b2423832c30911ae0a71c16503bb47bc0b289ef9))

### Features

- allow/enforce setting CSP frame-ancestors via config ([518ad0d](https://github.com/klarna-incubator/gram/commit/518ad0dbce2090567fa8216a67fa0d91da00504c))
- Diagrams can now be iframed. Preview when creating model and importing. Diagram should now center and scale automatically to try to fit everything on initial load. New url for quickly accessing the latest threat model for a system: /system/<system-id>/latest (also works with iframes!) ([f90fbad](https://github.com/klarna-incubator/gram/commit/f90fbada1897de979c016cf8c60da6515b52d138))

# [4.10.0](https://github.com/klarna-incubator/gram/compare/v4.9.4...v4.10.0) (2024-04-15)

### Bug Fixes

- deadlock on transaction inserting suggestions in parallel ([62e9099](https://github.com/klarna-incubator/gram/commit/62e9099777284d4e1d31c182b599f0c4041dff46))
- faulty user lookup by id ([adc9841](https://github.com/klarna-incubator/gram/commit/adc9841afeed5f072698af69cd3280d68fff881c))
- Importing/Copying a threat model should no longer crash on indiviual threats/controls failing to copy ([d9e8871](https://github.com/klarna-incubator/gram/commit/d9e88711c3d24f3fa638b95b7a26d33e1400d01c))
- JiraActionItemExporter should not error if the transition fails - this happens if the object is already in the right status ([d4cb4f7](https://github.com/klarna-incubator/gram/commit/d4cb4f7a1393e21b0523259ba5ee7fb4c204371c))
- small css fix on team name on system page ([d164b0a](https://github.com/klarna-incubator/gram/commit/d164b0a967d70d233eed12be1f93c0af8d50bfb1))
- tidy up the Home page and model lists ([6a0b8fd](https://github.com/klarna-incubator/gram/commit/6a0b8fde040841bdbf28168767c4c10d39dbd6ef))

### Features

- add ability for admins to change system-id on threat model. Creator of the threat model is now also displayed as the owner in case the threat model is not connected to a system. ([f91bd80](https://github.com/klarna-incubator/gram/commit/f91bd80aa3e381bdcf7d4f09c5b813646cab1494))
- add toggle to switch direction of dataflow. Fixes [#97](https://github.com/klarna-incubator/gram/issues/97) ([db5db24](https://github.com/klarna-incubator/gram/commit/db5db24c6db95b65533b39a667751b868e781ac6))
- show popup after importing a threat model to remind users to review the action items marked in a previous threat model. ([327935a](https://github.com/klarna-incubator/gram/commit/327935a7b024caa08dd0a7b93fa793113e708194))

## [4.9.4](https://github.com/klarna-incubator/gram/compare/v4.9.3...v4.9.4) (2024-03-21)

### Bug Fixes

- component tab should no longer disappear if another tab is selected. instead it should stick around so long as a component is selected. ([2c01c8c](https://github.com/klarna-incubator/gram/commit/2c01c8c67fcfc8a44f76939c6bada880ba420f7e))
- reload action items if threat is deleted. Fixes [#95](https://github.com/klarna-incubator/gram/issues/95) ([0273603](https://github.com/klarna-incubator/gram/commit/0273603452610ed6c5084cde2f6785902cca1830))
- set longer timeout for oidc requests ([ae186b6](https://github.com/klarna-incubator/gram/commit/ae186b67e5747f6bea653fd5f02098d2471f940c))
- update jira issues if they already exist with new values ([60c5505](https://github.com/klarna-incubator/gram/commit/60c5505b3aa7f8ee7970602cee379cee556bbd3b))

## [4.9.3](https://github.com/klarna-incubator/gram/compare/v4.9.2...v4.9.3) (2024-03-19)

### Bug Fixes

- add tooltip to the add link button ([4bc94c1](https://github.com/klarna-incubator/gram/commit/4bc94c1e9abf14d38768785cf2b8d3abb3daa1a8))

## [4.9.2](https://github.com/klarna-incubator/gram/compare/v4.9.1...v4.9.2) (2024-03-06)

### Bug Fixes

- hide dataflow magnets if diagram is in readonly [#88](https://github.com/klarna-incubator/gram/issues/88) ([3e7b91c](https://github.com/klarna-incubator/gram/commit/3e7b91c57577b43b754207d244f3d34304225eb6))
- hide note button if review has not started yet ([48ace6a](https://github.com/klarna-incubator/gram/commit/48ace6afe28d7549f22fcab3288b374537a9195e))

## [4.9.1](https://github.com/klarna-incubator/gram/compare/v4.9.0...v4.9.1) (2024-02-01)

### Bug Fixes

- correctly check reporter is set ([20d4688](https://github.com/klarna-incubator/gram/commit/20d4688e3ffc89593cdd28b7a3bb02c9a6a5f28f))
- hide exporter button if no exporters are configured ([a1c5556](https://github.com/klarna-incubator/gram/commit/a1c55566cc760005b82ae3b62c154a8311d3c7f5))
- make JiraActionItemExporter fallback on the token account as reporter if the reviewer cannot be found (e.g. due to offboarding) ([be90c6f](https://github.com/klarna-incubator/gram/commit/be90c6f503489e91d6694fdb2f9401e1c4e13874))
- missing await ([01a1d10](https://github.com/klarna-incubator/gram/commit/01a1d1087ca2ba11632e274dbabb53a923173c0f))

# [4.9.0](https://github.com/klarna-incubator/gram/compare/v4.8.1...v4.9.0) (2024-01-29)

### Bug Fixes

- control/ops api not correctly routing healthchecks and metadata. Also fix healthchecks with faulty logic. Adds new healthcheck for faulty action item exports. ([9d01102](https://github.com/klarna-incubator/gram/commit/9d01102e028fb4936cb71712f8b678773e1bf899))
- control/ops api not correctly routing healthchecks and metadata. Also fix healthchecks with faulty logic. Adds new healthcheck for faulty action item exports. ([964a27e](https://github.com/klarna-incubator/gram/commit/964a27e1f489b0c2d777044f6a46ea21c3870245))
- improve rendering of validation when creating links and fix javascript url check ([4ff6cab](https://github.com/klarna-incubator/gram/commit/4ff6cabd4ae1763f692d8f1a5e36f4ab7b15fe71))
- improve rendering of validation when creating links and fix javascript url check ([a4e45a3](https://github.com/klarna-incubator/gram/commit/a4e45a39c74ab9f29f4d52299f24f7147bab6e56))
- jira export can happen before reviewer exists on model - quick fix by falling back on token user as reviewer. ([c015a4e](https://github.com/klarna-incubator/gram/commit/c015a4eddae8c0f4ea8d71cac51205109e5f1152))
- make severity slider / assessment on threat less bulky by removing the collapsible part ([eeaf6cf](https://github.com/klarna-incubator/gram/commit/eeaf6cfca457df5583911c5d4d895b8571ee1fd1))
- make severity slider / assessment on threat less bulky by removing the collapsible part ([99fac7c](https://github.com/klarna-incubator/gram/commit/99fac7c7e3737a43872fe4b693d9045de0eb180a))
- zod errors should now return why they failed in the API response. Add some tests for /api/links ([9ea9a1d](https://github.com/klarna-incubator/gram/commit/9ea9a1de98007bb0319c35611fc51ab12e62848e))

### Features

- Ability to add custom links to threats/controls ([b237532](https://github.com/klarna-incubator/gram/commit/b237532dbdbfffc2c476fc0f6c45d332a9fcb817))
- add new ActionItemExporter functionality ([dc5f6d5](https://github.com/klarna-incubator/gram/commit/dc5f6d5fa9439b6c354f0dc8602086f7722e13da)), closes [#61](https://github.com/klarna-incubator/gram/issues/61)
- add proxying to jira plugin ([fe87616](https://github.com/klarna-incubator/gram/commit/fe8761653a718d0ed3d2004bd2435f5963b03ea1))
- add the ability to export action items outside of the review flow. Also make the feature to automatically exporter action items on review approve a boolean config option. ([9943fff](https://github.com/klarna-incubator/gram/commit/9943fff9f23876e38aa86ff072a76f3b4243d2d5))
- exported action items are also copied on imported models ([6f549e8](https://github.com/klarna-incubator/gram/commit/6f549e8a639f10a6dc103c84fb1b8128c73468f4))
- new Jira Action Item exporter ([7c127e4](https://github.com/klarna-incubator/gram/commit/7c127e4d8e711289077254aec23c134917fcafef))

## [4.8.1](https://github.com/klarna-incubator/gram/compare/v4.8.0...v4.8.1) (2024-01-02)

**Note:** Version bump only for package gram

# [4.8.0](https://github.com/klarna-incubator/gram/compare/v4.7.3...v4.8.0) (2024-01-02)

### Bug Fixes

- correct system step content ([ae20a75](https://github.com/klarna-incubator/gram/commit/ae20a75e90e3bbf26138c08c7d5d2004ef8b85bb))
- fix linting ([a334d46](https://github.com/klarna-incubator/gram/commit/a334d467d85d23ca95b4a28b07208ee350955a4f))
- fix react error ([8422b68](https://github.com/klarna-incubator/gram/commit/8422b684a12cf3ab6de286abcc507774ecaef67a))

### Features

- reorganise tutorial steps and add actions ([2fe23e5](https://github.com/klarna-incubator/gram/commit/2fe23e5552b31d589ac79cb05c550d39ea7cb744))

## [4.7.3](https://github.com/klarna-incubator/gram/compare/v4.7.2...v4.7.3) (2023-12-06)

### Bug Fixes

- broken ActiveUsers import and snapshot test ([b06a360](https://github.com/klarna-incubator/gram/commit/b06a360fce29021555780d5e3b4e7eab6f29b51a))
- Make Active Users widget visible again ([4c9b072](https://github.com/klarna-incubator/gram/commit/4c9b072b7e467cdff5a63009545c39894625040c)), closes [#70](https://github.com/klarna-incubator/gram/issues/70)

## [4.7.2](https://github.com/klarna-incubator/gram/compare/v4.7.1...v4.7.2) (2023-11-20)

### Bug Fixes

- should no longer crash if importing a model with mitigations on deleted threats/controls ([7856989](https://github.com/klarna-incubator/gram/commit/7856989d6db1467dee3c109bab22ae978fe28484))

## [4.7.1](https://github.com/klarna-incubator/gram/compare/v4.7.0...v4.7.1) (2023-11-16)

### Bug Fixes

- Schedule meeting button not working correctly ([3e9495c](https://github.com/klarna-incubator/gram/commit/3e9495c8df01d477c0c7f3628f3c6801f65e5cb5)), closes [#68](https://github.com/klarna-incubator/gram/issues/68)

# [4.7.0](https://github.com/klarna-incubator/gram/compare/v4.6.1...v4.7.0) (2023-11-15)

### Bug Fixes

- suggestions should now clear correctly if the source no longer suggests them ([8d6c988](https://github.com/klarna-incubator/gram/commit/8d6c98898c8fe8a6fa5fc86c160bf9f04a019a55))
- ui crash if copying component with no controls/threats ([38e80f6](https://github.com/klarna-incubator/gram/commit/38e80f69ab122f9d9b49b9833723e2ed6c92e6f5))

### Features

- add button to toolbar for adding new component ([9fcad2e](https://github.com/klarna-incubator/gram/commit/9fcad2eb912ccb672c4fa4a576fa046b6572f603)), closes [#28](https://github.com/klarna-incubator/gram/issues/28)
- add quick and dirty screenshot feature 🖼️ ([1218589](https://github.com/klarna-incubator/gram/commit/1218589709bc3630281df39d8513b49e243b2ef7))

## [4.6.1](https://github.com/klarna-incubator/gram/compare/v4.6.0...v4.6.1) (2023-11-14)

### Bug Fixes

- importing models with deleted components should no longer crash ([f5a2681](https://github.com/klarna-incubator/gram/commit/f5a2681ea30797b4f123e4a0fbf9765f7e53c4aa))
- stop SeveritySlider from crashing if severity is null. ([25f7654](https://github.com/klarna-incubator/gram/commit/25f7654c051c17ef34c38e76b4a2dc04d4336541))

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
