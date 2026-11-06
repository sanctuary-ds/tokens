# Token reference

Every token is a custom property prefixed `--san-`. The name is the DTCG token path joined with hyphens; a group's `$root` token takes the group's own name (`accent.$root` is `--san-accent`).

## Quick path

```css
@import "@sanctuary-ds/tokens/css"; /* resolved by a bundler; or link dist/css/sanctuary.css directly */

.button {
  background: var(--san-glaze-sheen), var(--san-glaze-bg);
  color: var(--san-glaze-fg);
  border: var(--san-border-width-hairline) solid var(--san-glaze-border);
  border-radius: var(--san-radius-sm);
  box-shadow: var(--san-glaze-glow), var(--san-elevation-1);
  backdrop-filter: var(--san-glaze-blur);
  font: var(--san-type-label-lg);
  letter-spacing: var(--san-type-label-lg-tracking);
}
.button:focus-visible { box-shadow: var(--san-halo); }
```

## Color

### Stone, ink and lead (per flavor)

| Property | Use |
|----------|-----|
| `--san-surface-sunken` | Wells, inputs, the page behind panels |
| `--san-surface` | The base surface |
| `--san-surface-raised-1` … `-4` | Lumen levels 1 to 4; level 5 reuses `raised-4` |
| `--san-surface-inverse`, `--san-text-inverse` | Tooltips, toasts |
| `--san-text`, `-muted`, `-subtle`, `-disabled` | Text, in falling emphasis |
| `--san-lead-soft`, `--san-lead`, `--san-lead-strong` | Dividers, borders, emphasized borders |
| `--san-lead-came` | The near-black line between panes |
| `--san-umbra-key`, `--san-umbra-ambient` | Shadow colors used by `elevation-*` |
| `--san-scrim` | Overlay behind modals |

### Glass (per flavor, per pigment)

`<p>` is any pigment name.

| Property | Use |
|----------|-----|
| `--san-glass-<p>` | The pigment in this flavor |
| `--san-glass-<p>-lume` | Brighter light: glow, hover, gradients. Not for text |
| `--san-glass-<p>-ink` | Accent text: links, text on panes and on sunken stone |
| `--san-glass-<p>-pane` | Tinted container |
| `--san-glass-<p>-on` | Content on the pigment |
| `--san-glass-<p>-on-pane` | Content on the pane |
| `--san-pigment-<p>-50` … `-950` | Raw ramp. For illustration and data only |

### Accent, status, syntax, terminal

| Group | Properties |
|-------|-----------|
| Accent | `--san-accent`, `-lume`, `-ink`, `-pane`, `-on`, `-on-pane` |
| Status | `--san-danger` (ruby), `--san-warning` (amber), `--san-success` (verdure), `--san-info` (azure), each with the same six suffixes |
| Syntax | `--san-syntax-keyword`, `-string`, `-number`, `-constant`, `-function`, `-type`, `-property`, `-tag`, `-operator`, `-regex`, `-variable`, `-punctuation`, `-comment` |
| ANSI | `--san-ansi-black` … `-white` and `--san-ansi-bright-black` … `-bright-white` |

## Light (CSS only)

These are computed from the active flavor, accent, glazing and window setting.

| Property | Type | Use |
|----------|------|-----|
| `--san-glaze-bg`, `-bg-hover`, `-fg`, `-border` | color | A glazed (accent-filled) element |
| `--san-light` | color | White light as it passes clear glass; draw sheens, suns and highlights with it, mixed toward `transparent` for strength |
| `--san-glaze-sheen` | image | Highlight layered over `-bg` |
| `--san-glaze-glow` | shadow | Glow of the glazing |
| `--san-glaze-blur` | filter | `backdrop-filter` value |
| `--san-cast-sm`, `-md`, `-lg` | shadow | Colored light around glass |
| `--san-halo` | shadow | Focus ring |
| `--san-state-layer-hover`, `-focus`, `-pressed` | color | State layer: `currentColor` at `--san-opacity-<state>`, so it follows the content color and the opacity token |
| `--san-window` | gradient | The cast-light gradient |
| `--san-window-a`, `-b`, `-c` | color | Its three stops |
| `--san-harmony-a`, `-b`, `-c` | color | The accent and its two hue-wheel neighbors; read by `data-san-window="harmonic"` |
| `--san-window-rosace`, `-jesse`, `-lancet`, `-aureole`, `-vesperal` | gradient | Named windows: fixed, independent of the accent, for one specific place |
| `--san-elevation-0` … `-5` | shadow | Lumen shadows (pair with `surface-raised-n`) |

## Foundations

| Group | Properties | Notes |
|-------|-----------|-------|
| Space | `--san-space-0`, `-px`, `-half`, `-1`, `-2`, `-3`, `-4`, `-5`, `-6`, `-8`, `-10`, `-12`, `-16`, `-20`, `-24`, `-32` | 4px grid: `space-4` is 16px |
| Size | `--san-size-control-sm/md/lg` (32/40/48px), `--san-size-icon-sm/md/lg`, `--san-size-measure` | |
| Breakpoint | `--san-breakpoint-sm/md/lg/xl/2xl` | Reference values; custom properties cannot be used in media queries |
| Radius | `--san-radius-none/xs/sm/md/lg/xl/full` | 0, 2, 4, 8, 12, 20px, pill |
| Border | `--san-border-width-hairline/came/heavy` | 1, 2, 3px |
| Shape | `--san-shape-lancet`, `--san-shape-ogive` | `clip-path` values, CSS only |
| Font | `--san-font-family-display/text/mono/inscription`, `--san-font-weight-regular/medium/semibold/bold` | |
| Type | `--san-type-<role>` and `--san-type-<role>-tracking` | `font` shorthand plus letter spacing |
| Duration | `--san-duration-instant/fast/base/slow/slower/procession` | 80 to 900ms; all `0ms` under `prefers-reduced-motion: reduce` |
| Easing | `--san-ease-standard/enter/exit/linear` | |
| Blur | `--san-blur-sm/md/lg` | For glass surfaces |
| Opacity | `--san-opacity-hover/focus/pressed/disabled-content/disabled-container` | 0.08, 0.12, 0.16, 0.38, 0.12; numbers from 0 to 1 |
| Layer | `--san-layer-base/raised/sticky/overlay/modal/toast/tooltip` | `z-index` |

Type roles: `display-lg/md/sm`, `headline-lg/md/sm`, `title-lg/md/sm`, `body-lg/md/sm`, `label-lg/md/sm`, `inscription`, `code-md/sm`.

### Reduced motion

When the visitor asks for reduced motion (`prefers-reduced-motion: reduce`), the stylesheet sets every `--san-duration-*` token to `0ms`, so anything timed with the tokens changes instantly. A zero-length transition does not start, so it fires no `transitionend` event; code that waits for one should check the duration first. Animations or durations written without the tokens are not covered.

## Using the DTCG files

`tokens/sanctuary.resolver.json` declares the sets and two modifiers a DTCG resolver needs:

| Modifier | Contexts | Default |
|----------|----------|---------|
| `flavor` | `lauds`, `vespers`, `compline`, `matins` | `compline` |
| `accent` | `flavor` (keep the flavor's default) or any pigment | `flavor` |

Glazing, cast, halo, state layers and the arch shapes are not in the token files: the format has no color functions or string type. They are defined in `src/emit/css.ts`.

## Using the plain palette

The palette holds resolved values for tools that do not want a token pipeline. It comes in two forms, with the same data:

| Entry point | For | How to read it |
|-------------|-----|----------------|
| `@sanctuary-ds/tokens/palette` | JavaScript and TypeScript, with types such as `FlavorId` and `PigmentId` | `import { flavors } from '@sanctuary-ds/tokens/palette';` |
| `@sanctuary-ds/tokens/palette.json` | Tools in any other language | Read `dist/palette.json` from the package |

Each top-level key below is a named export of the module:

```json
{ "flavors": { "compline": { "scheme": "dark", "accent": "cobalt",
    "colors": { "surface": { "hex": "#0d111b", "oklch": [0.18, 0.022, 265] } } } },
  "pigments": { "cobalt": { "hue": 259, "tones": { "300": "#9bc1fb" } } } }
```

It also lists the named windows (`windows`), the values of `data-san-window` (`windowModes`) and the glazings (`glazings`), each with a display name and a note, so a tool can offer the same choices as the stylesheet. `defaultFlavor`, `defaultGlazing` and `defaultWindow` name what the stylesheet shows before anyone chooses.

`fonts` lists each font family with its fallbacks, its generic family, and the weights the type scale uses, so a site loads exactly those. `styles` is `["normal"]` for every family today, because no type role sets an italic:

```json
"fonts": { "text": { "family": "Hanken Grotesk", "fallbacks": ["Inter", "system-ui"],
    "generic": "sans-serif", "weights": [400, 500, 600], "styles": ["normal"] } }
```

## Fonts

Sanctuary names its fonts but does not load them. Each key of `fonts` in `palette.json` is a font role, and the stylesheet exposes the same role as a custom property:

| Role | Custom property | Used by |
|------|-----------------|---------|
| `display` | `--san-font-family-display` | Display and headline type |
| `text` | `--san-font-family-text` | Titles, body and labels |
| `mono` | `--san-font-family-mono` | Code |
| `inscription` | `--san-font-family-inscription` | Carved overlines |

The match between a `fonts` key and its custom property is part of the contract, and a test keeps it true. Renaming a role is a breaking change.

### Hosting your own fonts

Load the families and weights listed in `fonts` with whatever your site uses (Google Fonts, Fontsource, self-hosted files). If your font is published under a different family name, for example `Cormorant Garamond Variable`, override the role on the root element:

```css
:root {
  --san-font-family-display: "Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif;
}
```

Override on `:root` (or `html`), not on a descendant. The type roles (`--san-type-*`) are declared on `:root` and resolve the family there, so an override on a nested element changes `font-family` declarations that read the role directly, but not the type roles.
