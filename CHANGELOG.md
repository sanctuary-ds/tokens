# Changelog

Entries for 0.1.0 and 0.1.1 were generated from the commit history after those releases, with the rules release-please applies from 0.2.0 on.

## [0.3.2](https://github.com/sanctuary-ds/tokens/compare/v0.3.1...v0.3.2) (2026-11-11)


### Features

* **palette:** lower the stone chroma of Compline and Vespers ([47d2e93](https://github.com/sanctuary-ds/tokens/commit/47d2e93e0519cf0e4a4b7bf6feb42297b7fd8f3c))

## [0.3.1](https://github.com/sanctuary-ds/tokens/compare/v0.3.0...v0.3.1) (2026-11-07)


### Features

* **palette:** add the status and syntax colors to each flavor ([4310d89](https://github.com/sanctuary-ds/tokens/commit/4310d89cfb883bac80755162e77d9b42aae0176b))

## [0.3.0](https://github.com/sanctuary-ds/tokens/compare/v0.2.1...v0.3.0) (2026-11-07)


### ⚠ BREAKING CHANGES

* **palette:** the default accent of Vespers is ember instead of amber, and of Matins viridian instead of ruby. Set data-san-accent="amber" or "ruby" to keep the previous look.
* **css:** --san-breakpoint-<size> is removed; a media query cannot read a custom property. Read breakpoint from foundation/layout.tokens.json.
* **tokens:** DTCG groups move between foundation files.
    - breakpoint moves from foundation/space.tokens.json to foundation/layout.tokens.json.
    - z moves from foundation/elevation.tokens.json to foundation/layout.tokens.json.
    - blur and opacity move from foundation/elevation.tokens.json to foundation/effect.tokens.json.
* **tokens:** --san-layer-<level> is --san-z-<level>, and the DTCG group layer is z.
* **css:** the pigment and harmony custom properties are private.
    - --san-pigment-<pigment>-<tone> is --_san-pigment-<pigment>-<tone>, and is not part of the API.
    - --san-harmony-a, -b, -c are --_san-harmony-a, -b, -c, and are not part of the API; read --san-window-a, -b, -c.
* **tokens:** the state tokens are renamed.
    - --san-state-hover, -focus, -pressed (opacity) are --san-opacity-hover, -focus, -pressed.
    - --san-state-hover, -focus, -pressed (color) are --san-state-layer-hover, -focus, -pressed.
    - --san-state-disabled-content, -disabled-container are --san-opacity-disabled-content, -disabled-container.
    - The DTCG group state in foundation/elevation.tokens.json is opacity.

### Features

* **css:** drop breakpoint custom properties ([33bf1e4](https://github.com/sanctuary-ds/tokens/commit/33bf1e48b1075782253e263a2b93639e9844fa20))
* **css:** make pigment ramps and harmony stops private ([8a6d7c7](https://github.com/sanctuary-ds/tokens/commit/8a6d7c7cd5a0a7825a61f2a7e77a13a18cc7e70f))
* **palette:** keep default accents apart from status pigments ([2a43f98](https://github.com/sanctuary-ds/tokens/commit/2a43f98a256351ed37edaa35355de5a3b563487c))
* **tokens:** group foundation files by concern ([e6e4174](https://github.com/sanctuary-ds/tokens/commit/e6e4174d2b4a6a5582045e4810ad51590408c6c6))
* **tokens:** rename the layer group to z ([bbdcf6e](https://github.com/sanctuary-ds/tokens/commit/bbdcf6e8f66a0f01fa182f9184501ae717b22c10))
* **tokens:** split state opacities from state layers ([75e3406](https://github.com/sanctuary-ds/tokens/commit/75e34061fda8be9a6ccd9f9a3c0d5d74a8f8300f))

## [0.2.1](https://github.com/sanctuary-ds/tokens/compare/v0.2.0...v0.2.1) (2026-11-06)


### Bug Fixes

* **tokens:** declare the DTCG 2025.10 version in the resolver ([deff31a](https://github.com/sanctuary-ds/tokens/commit/deff31a282fd365990364e86d6665f914412f37f))

## 0.2.0 (2026-11-02)

### ⚠ BREAKING CHANGES

* **palette:** publish the palette as a typed module ([549d036](https://github.com/sanctuary-ds/tokens/commit/549d036774f2055141b22c3cbfd4b5c3ed211bdb))

### Features

* **palette:** publish the palette as a typed module ([549d036](https://github.com/sanctuary-ds/tokens/commit/549d036774f2055141b22c3cbfd4b5c3ed211bdb))

### Bug Fixes

* pin line endings and state when a removed report line breaks ([9f02c43](https://github.com/sanctuary-ds/tokens/commit/9f02c43df876c6bf40949235614f330701e91d85))

## 0.1.1 (2026-10-16)

### Bug Fixes

* **tokens:** use American spelling in published descriptions ([bfef199](https://github.com/sanctuary-ds/tokens/commit/bfef199aabdd2e959826034d49b2581fd4ab7e75))

## 0.1.0 (2026-10-16)

### Features

* **tokens:** name white light as --san-light ([7874d53](https://github.com/sanctuary-ds/tokens/commit/7874d532f95c200c6fe5402c9fb51fa393d15b92))
* **tokens:** stop token-timed motion under reduced motion ([68bcddf](https://github.com/sanctuary-ds/tokens/commit/68bcddf07be936d37e16d0392eacfd1656d64d28))
* **tokens:** publish the theme defaults and the font families ([97244d8](https://github.com/sanctuary-ds/tokens/commit/97244d888a665955fa21f3975cf671849be98750))
* **tokens:** publish the window modes in the palette data ([b6b7a11](https://github.com/sanctuary-ds/tokens/commit/b6b7a119ac477fe7dadb9e09fc9ebc6ec3c37cb7))
* **showcase:** add the interactive showcase ([60365a8](https://github.com/sanctuary-ds/tokens/commit/60365a85bd852d6d8f268e85623937c932186f8c))
* **tokens:** add the token engine ([684f82d](https://github.com/sanctuary-ds/tokens/commit/684f82dd899359b50e2034a6b76d64ffa86bd8e1))

### Bug Fixes

* **showcase:** fit small screens and keep the section links ([eef2f03](https://github.com/sanctuary-ds/tokens/commit/eef2f038f47fa382666769dd577446799b647622))
* settle the window mode fields and the orphan scan before merging ([90a42ae](https://github.com/sanctuary-ds/tokens/commit/90a42ae8d1e992cad0a959ad7ffb5d0113fafed8))
* harden the transition timing and the orphan check ([4f40443](https://github.com/sanctuary-ds/tokens/commit/4f40443084e842d7c1cfdc9ddcc125c21b97d443))
* **tokens:** make every documented contrast pairing true and tested ([13deb8a](https://github.com/sanctuary-ds/tokens/commit/13deb8abbe2050f6d6fc510f63cb30fae201ecf9))
* **showcase:** explain why Lumen level 5 reuses the level 4 stone ([b5ddf9e](https://github.com/sanctuary-ds/tokens/commit/b5ddf9ea64a799add888edc89a7f86abdcf67a07))
* **showcase:** keep the saved theme when opening a shared link ([6cf5424](https://github.com/sanctuary-ds/tokens/commit/6cf54240dd670bdb12e6c196ba49539ac8c13300))
* **showcase:** honour reduced motion during theme changes ([58937fa](https://github.com/sanctuary-ds/tokens/commit/58937faabdab577d9a0ebf54a8e88000524e7088))
* **tokens:** emit glazing rules from the palette's glazing list ([9310a2f](https://github.com/sanctuary-ds/tokens/commit/9310a2f44665a102fb09a4c5537daa7fd879b07e))
