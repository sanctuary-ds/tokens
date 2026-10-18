# Ecosystem

This repository is the seed of the [`sanctuary-ds`](https://github.com/sanctuary-ds) GitHub organization; packages will publish under the `@sanctuary-ds` npm scope. It holds the one thing every other module depends on: the palette and tokens. This page maps how the rest is split and records the decisions that cross repositories.

## Repositories

| Repository | Contents | Depends on | Status |
|------------|----------|-----------|--------|
| [`tokens`](https://github.com/sanctuary-ds/tokens) (this one, formerly `sanctuary`) | Token engine, DTCG tokens, stylesheet, palette and their technical docs; for now also the design language and the first ports | Nothing | Active, not yet on npm |
| [`sanctuary-ds.github.io`](https://github.com/sanctuary-ds/sanctuary-ds.github.io) | Public site: home, playground, documentation; see its [roadmap](https://github.com/sanctuary-ds/sanctuary-ds.github.io/blob/main/ROADMAP.md) | `tokens`, later `web-components` | In progress |
| [`.github`](https://github.com/sanctuary-ds/.github) | Organization profile, contributing guide, security policy, brand mark | Nothing | Active |
| `web-components` | Sanctuary Web Components: the Lit library (`<san-button>`, ...), published as `@sanctuary-ds/web-components` | `tokens` | Planned |
| One repository per port | A theme for one application, with its templates | `palette.json` | Planned |

Repositories are named after what they ship, and a platform-specific library carries its platform in its name, so a future Flutter library would live in its own `flutter` repository and generate its theme from `palette.json`. This repository was renamed from `sanctuary` to `tokens`, to match `@sanctuary-ds/tokens`, once the showcase had moved to the site; GitHub redirects the old name. There is no separate umbrella repository: the organization profile and the site play that role, joined by organization discussions once they are enabled.

Each repository has a `ROADMAP.md` with its scope, phases and its contract with this one. Decisions that cross repositories are taken here first and recorded on this page; the other repositories then update their roadmap and their pinned version of the tokens.

## What leaves this repository

The core ends as a small, stable package: tokens, stylesheet, palette and the docs that define them. Everything else moves to the repository that consumes it.

| Today here | Moves to | When |
|------------|----------|------|
| `showcase/` | The [playground](https://sanctuary-ds.github.io/playground/) of `sanctuary-ds.github.io` | Done: the playground replaced it and the showcase was deleted here |
| `docs/design-language.md` | The site's [philosophy](https://sanctuary-ds.github.io/docs/philosophy) and [foundations](https://sanctuary-ds.github.io/docs/foundations/color) | Done: this repository keeps a page of links |
| `ports/` and `src/emit/ports.js` | One repository per application, as Catppuccin does, with the template generator in its own repository | The ports milestone, not yet planned |

Until then, changes to these parts still land here.

## Web components with Lit

The stylesheet is already shaped for Shadow DOM: custom properties inherit through shadow boundaries, so components need no theme provider.

| Rule | Reason |
|------|--------|
| Components read semantic and light tokens only (`--san-accent`, `--san-glaze-*`, `--san-surface-*`) | A pigment read directly ignores the flavor |
| Each component exposes its own tier-5 tokens (`--san-button-radius`) that default to system tokens | Local overrides without forking |
| Theming attributes go on the host or any ancestor (`data-san-accent="ruby"`) | The same switch works for pages and for single components |
| Glazing is a system axis, not a per-component `variant` | One attribute restyles every filled control consistently |
| Ship `:focus-visible` with `--san-halo` and honor `prefers-reduced-motion` | Accessibility is part of the contract |

Suggested first components, in dependency order: button, icon button, chip, text field, checkbox, radio, switch, tabs, menu, dialog, tooltip, card.

## Ports for Linux ricing

Generated today, one file per flavor:

| App | Path | How to use |
|-----|------|-----------|
| kitty | `ports/kitty/sanctuary-<flavor>.conf` | `include` it from `kitty.conf` |
| Ghostty | `ports/ghostty/sanctuary-<flavor>` | Copy to the themes directory and set `theme` |
| Alacritty | `ports/alacritty/sanctuary-<flavor>.toml` | Add to `import` in `alacritty.toml` |
| base16 | `ports/base16/sanctuary-<flavor>.yaml` | Feed to any base16 builder |
| GTK CSS | `ports/gtk/sanctuary-<flavor>.css` | `@import` in a Waybar or GTK stylesheet, then use `@san-accent` |
| Hyprland | `ports/hyprland/sanctuary-<flavor>.conf` | `source` it, then use `$san-accent` in borders |

Each port uses the flavor's default accent. The GTK and Hyprland files also expose all twelve pigments, so an accent can be chosen in the user's own config.

These files are generated from templates and have not been loaded in each application; treat them as a first draft to validate on a real desktop.

### Adding a port

1. Add a template function to `src/emit/ports.js` with the signature `(flavor, hex, pigments)`: the flavor, a `hex(path)` resolver for its tokens, and the list of pigment ids, for ports that expose every pigment.
2. Register it in `PORTS` with its file extension.
3. Run `pnpm run build` and `pnpm test`.

Candidates: foot, WezTerm, tmux, Zellij, Neovim, Rofi, Dunst, Starship, btop, Firefox, VS Code.

### Rendering the idea outside the browser

| Concept | On the desktop |
|---------|----------------|
| Stone | Terminal and bar backgrounds |
| Lead | Inactive window borders, gaps |
| Accent | Active window border, cursor, focused workspace |
| Flashed glazing | Blur and transparency of the compositor, tinted by the accent |
| Cast | Colored window shadow or glow on the active window |
| Window | Wallpaper and lock-screen gradients |

## Versioning

- Token names are the public API. Renaming or removing one is a breaking change; adding one is not.
- Changing a color value is a minor change if contrast guarantees still hold.
- Publish from one version number across tokens, stylesheet and ports, so a port can state which palette it matches.

## Fonts

The core names its fonts and publishes them in `palette.json` (`fonts`), but does not load them: each consumer loads them its own way, from Google Fonts, Fontsource or its own files, and can override the family roles. See [Fonts](tokens.md#fonts) for the contract.

## Open decisions

| Decision | Options | Note |
|----------|---------|------|
| Wide gamut | Add Display P3 pigments | The engine clamps to sRGB today |
