# Changelog

## [0.8.8](https://github.com/CourtHive/pdf-factory/compare/v0.8.7...v0.8.8) (2026-06-30)


### Bug Fixes

* **build:** point package types and exports at emitted dist paths ([db10537](https://github.com/CourtHive/pdf-factory/commit/db10537d7bd188a00a4d3b8fa41c9a6bb2b91939))

## [0.8.7](https://github.com/CourtHive/pdf-factory/compare/v0.8.6...v0.8.7) (2026-06-30)


### Bug Fixes

* **deps:** pin tods-competition-factory to 5.9.0 for publish ([247bb3b](https://github.com/CourtHive/pdf-factory/commit/247bb3bd1e26e0b422fd19dcd4e7cf028117aff9))

## [0.8.6](https://github.com/CourtHive/pdf-factory/compare/v0.8.5...v0.8.6) (2026-06-30)


### Bug Fixes

* **deps:** pin tods-competition-factory to 5.6.0 for publish (overrides workspace link) ([3872780](https://github.com/CourtHive/pdf-factory/commit/3872780e2d04e8f05d7fb6e9837dcad6b8fd6ace))
* **deps:** update tods-competition-factory to 5.6.0 ([f5ad4c4](https://github.com/CourtHive/pdf-factory/commit/f5ad4c441cc71ffff6de204d27c049f3961ceaf8))

## [0.8.5](https://github.com/CourtHive/pdf-factory/compare/v0.8.4...v0.8.5) (2026-06-08)


### Bug Fixes

* **deps:** update tods-competition-factory to 5.3.0 ([a67ed93](https://github.com/CourtHive/pdf-factory/commit/a67ed93fa84589c429211378f7dd3cf7fca8070c))
* **deps:** update tods-competition-factory to 5.4.0 ([bb473db](https://github.com/CourtHive/pdf-factory/commit/bb473db6d26d1ff2738c0e2ad1765df89677a986))

## [0.8.4](https://github.com/CourtHive/pdf-factory/compare/v0.8.3...v0.8.4) (2026-06-03)


### Bug Fixes

* **deps:** update tods-competition-factory to v5.2.2 ([7599df5](https://github.com/CourtHive/pdf-factory/commit/7599df52b4f4d49bd667e56c425cb861e5c12219))


### Documentation

* **readme:** lead with pnpm and qualify the npm install path ([8056e3f](https://github.com/CourtHive/pdf-factory/commit/8056e3f5fc827ffb375909bf03cc9c77c1c7527f))

## [0.8.3](https://github.com/CourtHive/pdf-factory/compare/v0.8.2...v0.8.3) (2026-06-02)


### Bug Fixes

* **deps:** require tods-competition-factory 5.2.1 ([bf543f1](https://github.com/CourtHive/pdf-factory/commit/bf543f171ea5e9d6a075f5315d3923fd72122d63))

## [0.8.2](https://github.com/CourtHive/pdf-factory/compare/v0.8.1...v0.8.2) (2026-05-31)


### Documentation

* **changelog:** backfill v5 deps entry in 0.8.1 section ([5db9f2a](https://github.com/CourtHive/pdf-factory/commit/5db9f2a26a1d700e928135a87f11c9345898256a))

## [0.8.1](https://github.com/CourtHive/pdf-factory/compare/v0.8.0...v0.8.1) (2026-05-31)

### Bug Fixes

- **deps:** update tods-competition-factory to v5 ([dafe384](https://github.com/CourtHive/pdf-factory/commit/dafe384c0972e564ca7f024bf29321c537b01a4c))
- **types:** null-safety on tournamentEngine.getEvents() test usages ([9928e07](https://github.com/CourtHive/pdf-factory/commit/9928e07c60f44e2a39dcaa0a640bbe1ddf38665d))

## [0.8.0](https://github.com/CourtHive/pdf-factory/compare/v0.7.0...v0.8.0) (2026-05-25)

### Features

- **fonts:** embeddable custom font for Latin-2 / Central-European PDFs ([#73](https://github.com/CourtHive/pdf-factory/issues/73)) ([5af6116](https://github.com/CourtHive/pdf-factory/commit/5af6116761c153bd777b5215430b936d1583295e))

### Bug Fixes

- **deps:** update tods-competition-factory to v4.2.0 ([158c1c8](https://github.com/CourtHive/pdf-factory/commit/158c1c85df582961e00c49579456eca8a6c4e9ac))

## [0.7.0](https://github.com/CourtHive/pdf-factory/compare/v0.6.2...v0.7.0) (2026-05-21)

### Features

- 16 new reference pdfs, fix uri decoding in parser, expanded extraction report ([3fb5c3e](https://github.com/CourtHive/pdf-factory/commit/3fb5c3e9275ed77733a704a4c5a221321be1e7a0))
- add pdf parser and improve draw fidelity ([d19f28b](https://github.com/CourtHive/pdf-factory/commit/d19f28b76ed4807709f40c88f26990b7411f2a8e))
- add Preview in New Tab button to all PDF stories ([0113b23](https://github.com/CourtHive/pdf-factory/commit/0113b23b5cb73ab3e66acb87a25ee8b63df87612))
- add qualifying draw PDF support with proper round limits ([8ea25ef](https://github.com/CourtHive/pdf-factory/commit/8ea25ef490b7bc36a1d603c6137ab4bea34f7ac0))
- add stories for all missing draw renderers ([8de1e07](https://github.com/CourtHive/pdf-factory/commit/8de1e07d8063ceee91ee20515a1d50354018c333))
- add storybook stories for traditional draw and round robin ([a2f5b0e](https://github.com/CourtHive/pdf-factory/commit/a2f5b0eaeeffbb0fe5bc41b4ff5b22eb60dba9a9))
- backdraw (USTA playback) layout renderer ([6aad8be](https://github.com/CourtHive/pdf-factory/commit/6aad8befed4f26548cf84bcd3a46143f2d1e4ed6))
- compass draw renderer with multi-structure layout ([2a9da75](https://github.com/CourtHive/pdf-factory/commit/2a9da75177609c1399e71b3f054553f234d77167))
- composable draw PDF generators and drawsData pipeline ([7678ec9](https://github.com/CourtHive/pdf-factory/commit/7678ec914a4628e42f4dd060ac87f6d065498228))
- composition catalog, headers/footers, mirrored bracket ([3451429](https://github.com/CourtHive/pdf-factory/commit/3451429bda4b829767f0abf07b3902d9625a83ed))
- composition editor types, print modal types, print dispatcher, schedule v2 ([628ed98](https://github.com/CourtHive/pdf-factory/commit/628ed98dee5b334324ce56e27a395cd730a35dd4))
- **composition:** courtCards + matchCard dispatcher branches ([b5f983e](https://github.com/CourtHive/pdf-factory/commit/b5f983eef83f7c9a20889a11c435c7332c94b0a5))
- **composition:** draw dispatcher branch ([a9391c3](https://github.com/CourtHive/pdf-factory/commit/a9391c31e07e7b925b9ae9524db47b40bb343433))
- **composition:** implement executePrint('schedule') branch ([03dac01](https://github.com/CourtHive/pdf-factory/commit/03dac0115fd8070a1b8624cf758e2c5a9f9e0e66))
- **composition:** playerList + signInSheet dispatcher branches ([c9d60d9](https://github.com/CourtHive/pdf-factory/commit/c9d60d9d223e2df902f5f1ceabcbcadbd5f50b61))
- **composition:** resolveCompositionConfig helper ([32556c4](https://github.com/CourtHive/pdf-factory/commit/32556c42f22ea72021e76ed3afba91ae93a1f075))
- comprehensive showcase suite, fidelity check, pdf-to-img conversion ([7eddd20](https://github.com/CourtHive/pdf-factory/commit/7eddd205531ce66c9d1c8a024bf984f0e2c42f64))
- consolation draw renderer, round header underlines, export updates ([64fa9c2](https://github.com/CourtHive/pdf-factory/commit/64fa9c2aed03287287e849a79f16096d1d17d3f9))
- dense 64-draw on single page, adaptive font sizing ([44f5387](https://github.com/CourtHive/pdf-factory/commit/44f53877abc36da3fa7c09546e28381e071f3e7e))
- double elimination renderer with winner/loser brackets and championship ([0551469](https://github.com/CourtHive/pdf-factory/commit/05514698ebab107b051fb48dabd1a6a7bf872843))
- draw extractor for pdf-to-tods pipeline with extraction report ([eed7cba](https://github.com/CourtHive/pdf-factory/commit/eed7cba5afb71c19cf9d975524e7f8f2539e9f4a))
- entry status badges (WC, Q, LL, SE, ALT, PR) ([8371129](https://github.com/CourtHive/pdf-factory/commit/83711293d1173f98dd1a9bfd9f532877ce51a19b))
- fact sheet generator, tournament bridge, and template catalog ([4cef07d](https://github.com/CourtHive/pdf-factory/commit/4cef07da3e40a0d632e847fd40bd2fd64fa00a70))
- generic report PDF generator for unified report definitions ([b1dcd44](https://github.com/CourtHive/pdf-factory/commit/b1dcd4484212df345b06ee204bb627aced6ccf9f))
- header/footer showcase stories ([5c4658d](https://github.com/CourtHive/pdf-factory/commit/5c4658d98cda4f12c1c7f9d34d865695fc9c1580))
- improved parser for ao/wta formats, quantitative fidelity report, double elim references ([3ac76d1](https://github.com/CourtHive/pdf-factory/commit/3ac76d1ca0515c3d2ffc2b40cd8ee64371ff9499))
- initial pdf-factory with draw sheets, schedules, player lists, court cards ([7f0e1a9](https://github.com/CourtHive/pdf-factory/commit/7f0e1a9fb25104c7851d0c19b7ac8181b7e2ae2f))
- page composition, format presets, and new renderers ([3bd9829](https://github.com/CourtHive/pdf-factory/commit/3bd982924249b8edf231f674a7c2b6935c46a1e0))
- **presets:** add atp + atpFinals format presets ([3edb97a](https://github.com/CourtHive/pdf-factory/commit/3edb97afd986efce5e457d1b8c8045678aaecbcc))
- **presets:** add wta + lta format presets ([3a48149](https://github.com/CourtHive/pdf-factory/commit/3a48149f96445d8a0c4593f4e642e8621a83d96f))
- **presets:** close type-system gaps for tour-style scores and seeds ([22e1a27](https://github.com/CourtHive/pdf-factory/commit/22e1a273ab119fc7d252bb0e91519894df7d457c))
- professional schedule/oop renderer with populated cells, alert banner, officials ([f06adb9](https://github.com/CourtHive/pdf-factory/commit/f06adb956d557ed606a8804ae2f318ea9f62666e))
- quantitative fidelity report with accuracy percentages ([a301fb5](https://github.com/CourtHive/pdf-factory/commit/a301fb57821067a2478f60dcccfed219ab9ee7b2))
- schedule cell centering, per-match time info ([3e7fa56](https://github.com/CourtHive/pdf-factory/commit/3e7fa56ed7ebccc95d8bfc2c0070e246dab86a5c))
- schedule v2 storybook story, oop extraction tests, j300 oop reference ([3aecfec](https://github.com/CourtHive/pdf-factory/commit/3aecfecd2951dab09192d4cc1793cf6ff103a3bb))
- sequential oop renderer (wta/grand slam style), 38 oop reference pdfs ([63e7388](https://github.com/CourtHive/pdf-factory/commit/63e73880e1b748d1872ffbe199d9206fd0e1b916))
- sign-in sheet and match card generators ([256075f](https://github.com/CourtHive/pdf-factory/commit/256075fe64c74ac6925e7cdf0a60e3a7ac9edd48))
- sign-in sheet, match card, sequential OOP stories ([2f47c10](https://github.com/CourtHive/pdf-factory/commit/2f47c10ebfbfe66f396a801f47779bb565e15f5d))
- split browser and Node entry points ([1b0c4fd](https://github.com/CourtHive/pdf-factory/commit/1b0c4fd61ffd7d2a5dc3e1116c69c22a413679a1))
- storybook branding and introduction overview ([134f242](https://github.com/CourtHive/pdf-factory/commit/134f242da2ad7056813e47378b17547814e171e0))
- text merger for fragmented pdf text, wta extraction improvements ([f7c0116](https://github.com/CourtHive/pdf-factory/commit/f7c0116e63cda59d9f030c04b20a4a07c7e41a7e))
- visual comparison system and wta-density portrait 64-draw with seedings footer ([26c30fb](https://github.com/CourtHive/pdf-factory/commit/26c30fb631d114a3d5317b81bc486b93ee33bd8a))
- visual comparison system with pixelmatch snapshots and cross-preset diffs ([575dfbb](https://github.com/CourtHive/pdf-factory/commit/575dfbb19e3f757a1e97c570f238d414c8520e23))

### Bug Fixes

- abbreviateName handles Firstname Lastname format ([2c2acc0](https://github.com/CourtHive/pdf-factory/commit/2c2acc0e014bfa218cf22fbef730ce379ab37a64))
- australian open extraction 38% to 99%, combined entry parser, avg accuracy 93% ([37c12fd](https://github.com/CourtHive/pdf-factory/commit/37c12fd658f9c097a6bd4a960f559c7cb5884b21))
- backdraw wider center column, proper side allocation ([8d2cae5](https://github.com/CourtHive/pdf-factory/commit/8d2cae5ca6b88a3bd251634b097727516befe641))
- **ci:** skip fixture-dependent tests when fixtures/ is absent ([8d44cd7](https://github.com/CourtHive/pdf-factory/commit/8d44cd7dbf298b56e0a70c6a87a6419e493a2fae))
- compass, consolation, double elimination renderers ([f6c2255](https://github.com/CourtHive/pdf-factory/commit/f6c2255649e72375d82cd6e3f04144e98ab322ef))
- correct types paths in package.json exports ([4cfcaa6](https://github.com/CourtHive/pdf-factory/commit/4cfcaa6ab42a1eed6342d6426fd441e08f6e39a7))
- cross-platform addVersion for macOS and Linux ([1582fb9](https://github.com/CourtHive/pdf-factory/commit/1582fb9bd6870b0421110de21fc760896ead75f0))
- **deps:** sync release-please manifest to 0.6.0 + trigger 3.9.0 release ([7362fc0](https://github.com/CourtHive/pdf-factory/commit/7362fc095e4774f953dd149e9ece66121fdee312))
- **deps:** update dependency tods-competition-factory to v4.0.0 ([2994123](https://github.com/CourtHive/pdf-factory/commit/2994123ea75ac3710cc6881eb9d1119880f3d9cb))
- **deps:** update tods-competition-factory to v4.1.0 ([2be6e1b](https://github.com/CourtHive/pdf-factory/commit/2be6e1b509cda132e2cc09a8e473b064dd901580))
- deterministic visual regression snapshots ([78d0c7a](https://github.com/CourtHive/pdf-factory/commit/78d0c7a62ab6b2d9ec04a493dfd491741e7378f9))
- extract duplicate date string to constant in tournamentBridge test ([d3d83b6](https://github.com/CourtHive/pdf-factory/commit/d3d83b6d05d9393f1fb76b793da10dfe8eb72cfc))
- **generators/report:** early-return for empty columns to avoid autotable overflow ([f5f9233](https://github.com/CourtHive/pdf-factory/commit/f5f9233c0c0890c989b3a29880cf17dd2642de1a))
- include mdx stories in storybook config ([37d194e](https://github.com/CourtHive/pdf-factory/commit/37d194ed27f86e9740d2a703c20c97477171e330))
- install factory from npm for Storybook CI builds ([5a3ddfa](https://github.com/CourtHive/pdf-factory/commit/5a3ddfa075b201e821f84c03a077dd5d63676f7e))
- lucky draw pyramid layout with dynamic box height ([8237586](https://github.com/CourtHive/pdf-factory/commit/82375869bb6bde26cb7c53389a6b51ac0d4a0e2f))
- mirrored bracket narrower R1, wider later rounds ([b2843d4](https://github.com/CourtHive/pdf-factory/commit/b2843d4b726627607a43858eed46592e2b0d8506))
- mirrored bracket roundPosition renumbering, name abbreviation ([c492117](https://github.com/CourtHive/pdf-factory/commit/c492117ba122c6eb6bda0b04eb91504b4cbf0f33))
- mirrored bracket uses full landscape width ([42c2de4](https://github.com/CourtHive/pdf-factory/commit/42c2de4a2051b725fabc974d90a3af967fcf1f93))
- mirrored right half extends to page right edge ([c03d4fc](https://github.com/CourtHive/pdf-factory/commit/c03d4fceffedc68ec997a59a3e3a8d43e6c0d9d1))
- move types before import/require in package.json exports ([c885406](https://github.com/CourtHive/pdf-factory/commit/c885406f9ef1084a3b780b3305727d6480d0e274))
- normalize entryStatus, prefer side-level when available ([da4c2f0](https://github.com/CourtHive/pdf-factory/commit/da4c2f0d356b670744821c461d726077fc7020e9))
- **player-list,storybook:** populate Rank/Seed/Entry/Events columns + real schedule grid ([0b7761e](https://github.com/CourtHive/pdf-factory/commit/0b7761e5fd11c7e7ec2451e61f2467bd91aabefa))
- pnpm 11 install — kebab-case .npmrc + ignoredBuiltDependencies ([8cf3398](https://github.com/CourtHive/pdf-factory/commit/8cf3398755fc5b52a6d56ebe2e1df08c862b03de))
- replace mdx intro with html story, revert main.ts ([4688e99](https://github.com/CourtHive/pdf-factory/commit/4688e991a69fc9d7a1711f38facc0a2b22055d30))
- resolve lint warnings and TypeScript build errors ([a71ce9a](https://github.com/CourtHive/pdf-factory/commit/a71ce9ac3193792bfb9d2cd32a25b347d63471d2))
- sequential OOP padding below header and court name ([88bb7c0](https://github.com/CourtHive/pdf-factory/commit/88bb7c04037b7a3f931f8e96701928e80a838a64))
- show completed matchUps on court cards when no upcoming ([8264806](https://github.com/CourtHive/pdf-factory/commit/826480600b04a19e6e80a7832e163d419431f5cb))
- sign-in sheet column widths prevent text wrapping ([eea88d1](https://github.com/CourtHive/pdf-factory/commit/eea88d1d759d8bb422fe86d14931680f62d9d49d))
- standard footer spacing — no overlapping lines ([ae2cad9](https://github.com/CourtHive/pdf-factory/commit/ae2cad959d5cf6987bed4d5a0f4c1291955db5f8))
- traditional draw centering, feed rounds, scores ([01d9a5f](https://github.com/CourtHive/pdf-factory/commit/01d9a5f6ac85ad4170c17a4f4b2353f5d452521b))
- traditional draw rendering — winner column on-page, scores beneath names ([44db2cb](https://github.com/CourtHive/pdf-factory/commit/44db2cb02c959b74237a12892a3243b07d589049))
- use npx semver in release scripts (semver not globally installed) ([74b55fc](https://github.com/CourtHive/pdf-factory/commit/74b55fcc81d0ea49122672b1bf3f11c034621207))
- wta text merger - separate country codes, strip wc/ll entry codes ([e6a273d](https://github.com/CourtHive/pdf-factory/commit/e6a273d4df7df4827b01fd04c27a719692cdb19e))

### Documentation

- :memo: update docs ([dc9eb23](https://github.com/CourtHive/pdf-factory/commit/dc9eb23af2ca23c974136d1ec5ce6261b74a34cc))
- :memo: update roadmap ([2b06853](https://github.com/CourtHive/pdf-factory/commit/2b0685315effe49a17f240f4a2d515506abf0509))
- add Mentat orchestration section to CLAUDE.md ([bc11154](https://github.com/CourtHive/pdf-factory/commit/bc11154c7bc23a1136c62634e0f9147e6b319d48))
- add PDF factory roadmap — missing stories, fidelity section, cell config ([196c6c2](https://github.com/CourtHive/pdf-factory/commit/196c6c22a7ba41511cc23b9959d464979adf68a6))
- add player list, court cards, OOP to introduction ([f8c601e](https://github.com/CourtHive/pdf-factory/commit/f8c601edcfee0b93e01414f13e2d2e056601baba))
- add README with Storybook link and project overview ([1a7227c](https://github.com/CourtHive/pdf-factory/commit/1a7227ca55b86225494bea16cbd11ff26c70af7a))
- rewrite README with full API reference and usage examples ([a67447e](https://github.com/CourtHive/pdf-factory/commit/a67447e5d18c7599513bc871384a462892ac947d))
- **storybook:** add Print Policy explainer page ([2e1c366](https://github.com/CourtHive/pdf-factory/commit/2e1c366cf06cba20d16a1bb71f6eb66d32c0ad1d))
- **storybook:** add PrintDispatcher.stories — end-to-end pipeline ([3af2488](https://github.com/CourtHive/pdf-factory/commit/3af248856e526d054da6875f3476335e07a5f30d))
- **storybook:** enrich seed for PrintDispatcher stories ([cbc3e9b](https://github.com/CourtHive/pdf-factory/commit/cbc3e9b7255a4b0a501b038b61e132ff4124fdb0))

## [0.6.2](https://github.com/CourtHive/pdf-factory/compare/v0.6.1...v0.6.2) (2026-05-21)

### Bug Fixes

- **deps:** update dependency tods-competition-factory to v4.0.0 ([2994123](https://github.com/CourtHive/pdf-factory/commit/2994123ea75ac3710cc6881eb9d1119880f3d9cb))

## [0.6.1](https://github.com/CourtHive/pdf-factory/compare/v0.6.0...v0.6.1) (2026-05-19)

### Bug Fixes

- **deps:** sync release-please manifest to 0.6.0 + trigger 3.9.0 release ([7362fc0](https://github.com/CourtHive/pdf-factory/commit/7362fc095e4774f953dd149e9ece66121fdee312))

## [0.5.1](https://github.com/CourtHive/pdf-factory/compare/v0.5.0...v0.5.1) (2026-05-10)

### Bug Fixes

- pnpm 11 install — kebab-case .npmrc + ignoredBuiltDependencies ([8cf3398](https://github.com/CourtHive/pdf-factory/commit/8cf3398755fc5b52a6d56ebe2e1df08c862b03de))

## [0.5.0](https://github.com/CourtHive/pdf-factory/compare/v0.4.3...v0.5.0) (2026-05-01)

### Features

- **composition:** courtCards + matchCard dispatcher branches ([b5f983e](https://github.com/CourtHive/pdf-factory/commit/b5f983eef83f7c9a20889a11c435c7332c94b0a5))
- **composition:** draw dispatcher branch ([a9391c3](https://github.com/CourtHive/pdf-factory/commit/a9391c31e07e7b925b9ae9524db47b40bb343433))
- **composition:** implement executePrint('schedule') branch ([03dac01](https://github.com/CourtHive/pdf-factory/commit/03dac0115fd8070a1b8624cf758e2c5a9f9e0e66))
- **composition:** playerList + signInSheet dispatcher branches ([c9d60d9](https://github.com/CourtHive/pdf-factory/commit/c9d60d9d223e2df902f5f1ceabcbcadbd5f50b61))
- **composition:** resolveCompositionConfig helper ([32556c4](https://github.com/CourtHive/pdf-factory/commit/32556c42f22ea72021e76ed3afba91ae93a1f075))
- **presets:** add atp + atpFinals format presets ([3edb97a](https://github.com/CourtHive/pdf-factory/commit/3edb97afd986efce5e457d1b8c8045678aaecbcc))
- **presets:** add wta + lta format presets ([3a48149](https://github.com/CourtHive/pdf-factory/commit/3a48149f96445d8a0c4593f4e642e8621a83d96f))
- **presets:** close type-system gaps for tour-style scores and seeds ([22e1a27](https://github.com/CourtHive/pdf-factory/commit/22e1a273ab119fc7d252bb0e91519894df7d457c))

### Bug Fixes

- **player-list,storybook:** populate Rank/Seed/Entry/Events columns + real schedule grid ([0b7761e](https://github.com/CourtHive/pdf-factory/commit/0b7761e5fd11c7e7ec2451e61f2467bd91aabefa))

### Documentation

- :memo: update docs ([dc9eb23](https://github.com/CourtHive/pdf-factory/commit/dc9eb23af2ca23c974136d1ec5ce6261b74a34cc))
- **storybook:** add Print Policy explainer page ([2e1c366](https://github.com/CourtHive/pdf-factory/commit/2e1c366cf06cba20d16a1bb71f6eb66d32c0ad1d))
- **storybook:** add PrintDispatcher.stories — end-to-end pipeline ([3af2488](https://github.com/CourtHive/pdf-factory/commit/3af248856e526d054da6875f3476335e07a5f30d))
- **storybook:** enrich seed for PrintDispatcher stories ([cbc3e9b](https://github.com/CourtHive/pdf-factory/commit/cbc3e9b7255a4b0a501b038b61e132ff4124fdb0))

## [0.4.3](https://github.com/CourtHive/pdf-factory/compare/v0.4.2...v0.4.3) (2026-04-29)

### Bug Fixes

- **generators/report:** early-return for empty columns to avoid autotable overflow ([f5f9233](https://github.com/CourtHive/pdf-factory/commit/f5f9233c0c0890c989b3a29880cf17dd2642de1a))
