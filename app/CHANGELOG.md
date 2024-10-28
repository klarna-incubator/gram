# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.17.6](https://github.com/klarna-incubator/gram/compare/v4.17.5...v4.17.6) (2024-10-28)

### Bug Fixes

- unused imports in Left Panel ([2ab6d45](https://github.com/klarna-incubator/gram/commit/2ab6d45f359e5501726a748366a8caa023547ccc))

## [4.17.5](https://github.com/klarna-incubator/gram/compare/v4.17.4...v4.17.5) (2024-10-28)

### Bug Fixes

- restore tabs on left panel ([6ac94b4](https://github.com/klarna-incubator/gram/commit/6ac94b445bc486f917a6eaa969d3de206b93637c))

## [4.17.4](https://github.com/klarna-incubator/gram/compare/v4.17.3...v4.17.4) (2024-10-28)

### Bug Fixes

- fix New Model page layout ([b0f67fd](https://github.com/klarna-incubator/gram/commit/b0f67fd930b75331ea712bfa06a2760c34aa12b7))

## [4.17.3](https://github.com/klarna-incubator/gram/compare/v4.17.2...v4.17.3) (2024-10-23)

### Bug Fixes

- bump the rest of mui packages to v6 ([70ab5c5](https://github.com/klarna-incubator/gram/commit/70ab5c5040852a32dcba7fe12dee6c479beac1c9))

## [4.17.2](https://github.com/klarna-incubator/gram/compare/v4.17.1...v4.17.2) (2024-10-23)

**Note:** Version bump only for package @gram/app

## [4.17.1](https://github.com/klarna-incubator/gram/compare/v4.17.0...v4.17.1) (2024-10-23)

**Note:** Version bump only for package @gram/app

# [4.17.0](https://github.com/klarna-incubator/gram/compare/v4.16.0...v4.17.0) (2024-10-23)

### Features

- :art: add bottom panel for validation result ([a19ab9c](https://github.com/klarna-incubator/gram/commit/a19ab9cd10cee6929ddb2a86a11b2ead74fea6f6))
- Dataflows now have a label, threats/controls and flows with attributes ([0fe31be](https://github.com/klarna-incubator/gram/commit/0fe31be4f51f4ea7d61ca87535faad954f4349db))

# [4.16.0](https://github.com/klarna-incubator/gram/compare/v4.15.2...v4.16.0) (2024-09-09)

**Note:** Version bump only for package @gram/app

## [4.15.2](https://github.com/klarna-incubator/gram/compare/v4.15.1...v4.15.2) (2024-08-19)

### Bug Fixes

- :bug: empty description causes crash ([99e8f8d](https://github.com/klarna-incubator/gram/commit/99e8f8d8747e9f2ff7ac442844ceddb961dc81ac))

## [4.15.1](https://github.com/klarna-incubator/gram/compare/v4.15.0...v4.15.1) (2024-08-16)

### Bug Fixes

- :bug: fix component tab crash ([322bc7e](https://github.com/klarna-incubator/gram/commit/322bc7ebb3ce0f307b0a28e5a6059885e139b0f0))

# [4.15.0](https://github.com/Tyouxik/gram/compare/v4.14.1...v4.15.0) (2024-08-14)

### Bug Fixes

- make it so smaller trust boundaries can be selected while inside another. Fixes [#109](https://github.com/Tyouxik/gram/issues/109) ([27f900a](https://github.com/Tyouxik/gram/commit/27f900aadc5812ec3fb98e2e8315805fd7770b81))

### Features

- support markdown for description ([bd28400](https://github.com/Tyouxik/gram/commit/bd2840031a9ea8481afc96eaf50f53154c3f4d30))

## [4.14.1](https://github.com/klarna-incubator/gram/compare/v4.14.0...v4.14.1) (2024-07-23)

### Bug Fixes

- dataflows should no longer break when clicked after initially being added ([0ac54d3](https://github.com/klarna-incubator/gram/commit/0ac54d3d27af42d079244922459d6ac59ab13d2a))

# [4.14.0](https://github.com/klarna-incubator/gram/compare/v4.13.0...v4.14.0) (2024-07-18)

### Bug Fixes

- add loading text to reviewers dropdown instead of just displaying null ([bb221b9](https://github.com/klarna-incubator/gram/commit/bb221b925b06370f67740aca055980d8c9b65857))
- adjust center position of component label slightly ([93afd51](https://github.com/klarna-incubator/gram/commit/93afd5193b06e4eb3d76e44ad58a4da35b36f591))
- components inside trust boundaries should now be connectable again with data flows. Trust boundaries should not receive data flow click events ([70c4505](https://github.com/klarna-incubator/gram/commit/70c4505ae98197c820f9a6963a1f6da31838f978))

# [4.13.0](https://github.com/klarna-incubator/gram/compare/v4.12.2...v4.13.0) (2024-07-04)

### Bug Fixes

- console.error from MUI due to chip using a div ([9e80a65](https://github.com/klarna-incubator/gram/commit/9e80a65287487e5d53cfdbdedb338cae04c64b77))

### Features

- add tutorial box for trust boundary ([1bf4c23](https://github.com/klarna-incubator/gram/commit/1bf4c23f193725a54a1e25a0073c2caaa095e872))

## [4.12.2](https://github.com/klarna-incubator/gram/compare/v4.12.1...v4.12.2) (2024-06-25)

### Bug Fixes

- bump ws to fix a security vulnerability. bump and rearrange snyk/jest dependencies. ([6f5df6f](https://github.com/klarna-incubator/gram/commit/6f5df6fd0f487db3ffecc7507ea4afb77e2a6bae))

## [4.12.1](https://github.com/klarna-incubator/gram/compare/v4.12.0...v4.12.1) (2024-06-14)

**Note:** Version bump only for package @gram/app

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

- Diagrams can now be iframed. Preview when creating model and importing. Diagram should now center and scale automatically to try to fit everything on initial load. New url for quickly accessing the latest threat model for a system: /system/<system-id>/latest (also works with iframes!) ([f90fbad](https://github.com/klarna-incubator/gram/commit/f90fbada1897de979c016cf8c60da6515b52d138))

# [4.10.0](https://github.com/klarna-incubator/gram/compare/v4.9.4...v4.10.0) (2024-04-15)

### Bug Fixes

- faulty user lookup by id ([adc9841](https://github.com/klarna-incubator/gram/commit/adc9841afeed5f072698af69cd3280d68fff881c))
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

## [4.9.3](https://github.com/klarna-incubator/gram/compare/v4.9.2...v4.9.3) (2024-03-19)

### Bug Fixes

- add tooltip to the add link button ([4bc94c1](https://github.com/klarna-incubator/gram/commit/4bc94c1e9abf14d38768785cf2b8d3abb3daa1a8))

## [4.9.2](https://github.com/klarna-incubator/gram/compare/v4.9.1...v4.9.2) (2024-03-06)

### Bug Fixes

- hide dataflow magnets if diagram is in readonly [#88](https://github.com/klarna-incubator/gram/issues/88) ([3e7b91c](https://github.com/klarna-incubator/gram/commit/3e7b91c57577b43b754207d244f3d34304225eb6))
- hide note button if review has not started yet ([48ace6a](https://github.com/klarna-incubator/gram/commit/48ace6afe28d7549f22fcab3288b374537a9195e))

## [4.9.1](https://github.com/klarna-incubator/gram/compare/v4.9.0...v4.9.1) (2024-02-01)

### Bug Fixes

- hide exporter button if no exporters are configured ([a1c5556](https://github.com/klarna-incubator/gram/commit/a1c55566cc760005b82ae3b62c154a8311d3c7f5))

# [4.9.0](https://github.com/klarna-incubator/gram/compare/v4.8.1...v4.9.0) (2024-01-29)

### Bug Fixes

- improve rendering of validation when creating links and fix javascript url check ([4ff6cab](https://github.com/klarna-incubator/gram/commit/4ff6cabd4ae1763f692d8f1a5e36f4ab7b15fe71))
- make severity slider / assessment on threat less bulky by removing the collapsible part ([eeaf6cf](https://github.com/klarna-incubator/gram/commit/eeaf6cfca457df5583911c5d4d895b8571ee1fd1))

### Features

- Ability to add custom links to threats/controls ([b237532](https://github.com/klarna-incubator/gram/commit/b237532dbdbfffc2c476fc0f6c45d332a9fcb817))
- add the ability to export action items outside of the review flow. Also make the feature to automatically exporter action items on review approve a boolean config option. ([9943fff](https://github.com/klarna-incubator/gram/commit/9943fff9f23876e38aa86ff072a76f3b4243d2d5))

## [4.8.1](https://github.com/klarna-incubator/gram/compare/v4.8.0...v4.8.1) (2024-01-02)

**Note:** Version bump only for package @gram/app

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

**Note:** Version bump only for package @gram/app

## [4.7.1](https://github.com/klarna-incubator/gram/compare/v4.7.0...v4.7.1) (2023-11-16)

### Bug Fixes

- Schedule meeting button not working correctly ([3e9495c](https://github.com/klarna-incubator/gram/commit/3e9495c8df01d477c0c7f3628f3c6801f65e5cb5)), closes [#68](https://github.com/klarna-incubator/gram/issues/68)

# [4.7.0](https://github.com/klarna-incubator/gram/compare/v4.6.1...v4.7.0) (2023-11-15)

### Bug Fixes

- ui crash if copying component with no controls/threats ([38e80f6](https://github.com/klarna-incubator/gram/commit/38e80f69ab122f9d9b49b9833723e2ed6c92e6f5))

### Features

- add button to toolbar for adding new component ([9fcad2e](https://github.com/klarna-incubator/gram/commit/9fcad2eb912ccb672c4fa4a576fa046b6572f603)), closes [#28](https://github.com/klarna-incubator/gram/issues/28)
- add quick and dirty screenshot feature 🖼️ ([1218589](https://github.com/klarna-incubator/gram/commit/1218589709bc3630281df39d8513b49e243b2ef7))

## [4.6.1](https://github.com/klarna-incubator/gram/compare/v4.6.0...v4.6.1) (2023-11-14)

### Bug Fixes

- stop SeveritySlider from crashing if severity is null. ([25f7654](https://github.com/klarna-incubator/gram/commit/25f7654c051c17ef34c38e76b4a2dc04d4336541))

# [4.6.0](https://github.com/klarna-incubator/gram/compare/v4.5.1...v4.6.0) (2023-11-14)

### Bug Fixes

- Action Item Tab should no longer crash when component no longer exists. ([1b94298](https://github.com/klarna-incubator/gram/commit/1b94298e4b8a092ec69a9aad0e80cde704005953)), closes [#66](https://github.com/klarna-incubator/gram/issues/66)
- more nitpicky normalisation to make lists the same width and use more mui components ([1dca954](https://github.com/klarna-incubator/gram/commit/1dca954dbbca2eb83949902f306b3cf72f77305a))
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
- hide mitigation chip for control suggestions if relevant threat suggestion does not exist ([e438fec](https://github.com/klarna-incubator/gram/commit/e438fec162bfc5ae35fdc7e84335ae5671d88697))
- list control suggestions on threats ([e3098a5](https://github.com/klarna-incubator/gram/commit/e3098a5f2b4dc30d820db2445da4ed9f6f6fb969))
- rendering of Threat if no component is selected, e.g. in the Action Items modal ([be2ad22](https://github.com/klarna-incubator/gram/commit/be2ad223e8e92eb6a772261414710d0d2b5de1d6))
- show action item toggle for non-reviewer users ([b8e443e](https://github.com/klarna-incubator/gram/commit/b8e443e98a905663bdec1dc43dd93c7dba7174a6))
- temporarily hide stride suggestions from the list view to avoid repetitveness ([c051eec](https://github.com/klarna-incubator/gram/commit/c051eececa8461748fc0a302af02d14f0ae07eec))

## [4.4.1](https://github.com/klarna-incubator/gram/compare/v4.4.0...v4.4.1) (2023-10-18)

### Bug Fixes

- clean up Team system lists on Home and Team page. ([6ac2e32](https://github.com/klarna-incubator/gram/commit/6ac2e32ee13a97fc71d2abac45f508f6486305f5))
- hide system property box if there are no properties ([18dbbdf](https://github.com/klarna-incubator/gram/commit/18dbbdf0f89e093c9c81fa6882a156cea501a831))

# [4.4.0](https://github.com/klarna-incubator/gram/compare/v4.3.0...v4.4.0) (2023-10-16)

### Bug Fixes

- clientside error when clicking the mitigationchip inside the action items view ([548e91b](https://github.com/klarna-incubator/gram/commit/548e91b10f6183422fdae8193c76e6dc9adf50e3))
- hide reviews page from non-reviewer users ([9e71ebe](https://github.com/klarna-incubator/gram/commit/9e71ebe5734aeef79d7416afaef2371629f57e5d))

### Features

- add basic modal to view action items as a list ([9c3a9d0](https://github.com/klarna-incubator/gram/commit/9c3a9d021ced565a7faaf99910b9a4409ed086a9))
- add StaticTeamProvider to default config with some sample teams ([93839d8](https://github.com/klarna-incubator/gram/commit/93839d82c43857ae0b19186b2baa353a97c70714))

# [4.3.0](https://github.com/klarna-incubator/gram/compare/v4.2.1...v4.3.0) (2023-10-09)

**Note:** Version bump only for package @gram/app

# [4.2.0](https://github.com/klarna-incubator/gram/compare/v4.1.0...v4.2.0) (2023-10-05)

### Bug Fixes

- correctly hide login buttons for identity providers when form is not set ([cacc7e7](https://github.com/klarna-incubator/gram/commit/cacc7e7f2167e195d306ade0d72a57f741445119))

# [4.1.0](https://github.com/klarna-incubator/gram/compare/v4.0.3...v4.1.0) (2023-09-28)

### Bug Fixes

- fix fallback reviewer assignment crashing in case it's not listed as a reviewer by the provider ([15f4a7a](https://github.com/klarna-incubator/gram/commit/15f4a7addf593e688382914bc18691f0ca4df1c9))

## [4.0.3](https://github.com/klarna-incubator/gram/compare/v4.0.2...v4.0.3) (2023-08-18)

### Bug Fixes

- hide SystemProperties when viewing a model without system ([d638488](https://github.com/klarna-incubator/gram/commit/d63848810d8ed4e46b9646e95c2004bbd1614dcf))
- small ux fix to hint at selecting components in the diagram view ([472cb4f](https://github.com/klarna-incubator/gram/commit/472cb4f0e5354b07584ca5100aee0c859b708d88))
- very nitpicky adjustment on the height and colours of the panel buttons ([1355e09](https://github.com/klarna-incubator/gram/commit/1355e09ebcadaff6c3bb0d0d6d9d456550d7d54b))

## [4.0.2](https://github.com/klarna-incubator/gram/compare/v4.0.1...v4.0.2) (2023-08-16)

**Note:** Version bump only for package @gram/app

## [4.0.1](https://github.com/klarna-incubator/gram/compare/v4.0.0...v4.0.1) (2023-08-15)

### Bug Fixes

- prevent frontend crash if identity provider doesn't supply form ([42f1414](https://github.com/klarna-incubator/gram/commit/42f1414bc8a0a2cf2f0aa0e599377c761e0d13ba))

# [4.0.0](https://github.com/klarna-incubator/gram/compare/v3.1.2...v4.0.0) (2023-08-04)

### Bug Fixes

- badge for review count no longer shows after logout ([9ef88aa](https://github.com/klarna-incubator/gram/commit/9ef88aa2c46ecd622ec9f64eb994339935e50a09))
- EmailForm button also needs to be submit ([26820b2](https://github.com/klarna-incubator/gram/commit/26820b229185650358014f52fd8d2630951ff408))
- hide logged in user's team functionality if no team is attached ([408433d](https://github.com/klarna-incubator/gram/commit/408433d8ec8f7c22324ad29ca7721e1ed3d56995))
- prevent default form submission (causes page reload) ([00a76d8](https://github.com/klarna-incubator/gram/commit/00a76d808ea948382b389fb091c83cd1e437680f))
- should no longer crash the ChangeReviewer widget if reviewer no longer exists ([263531f](https://github.com/klarna-incubator/gram/commit/263531f1082b251f7fce0b2cab94082d51505bf8))

### Features

- add magiclink auth provider. Some refactor of existing auth to allow for a email form ([d1441eb](https://github.com/klarna-incubator/gram/commit/d1441ebccb664eb54e08a44c25fec68e20da1738))
- submit email form on enter ([d82b757](https://github.com/klarna-incubator/gram/commit/d82b757642b7d7f75afc393c0c1126b00846b5ca))
