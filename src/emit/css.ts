// Emits the token stylesheet: custom properties only, no element or component rules.

import { archPolygon } from '../foundation.ts';
import { DEFAULT_FLAVOR, DEFAULT_GLAZING, DEFAULT_WINDOW, PIGMENTS, STATUS, WINDOW_TONES, harmony } from '../palette.ts';
import { aliasPath, cssName, flatten } from '../tokens.ts';
import type { Palette, PigmentId } from '../palette.ts';
import type { Dimension, DtcgColor, FlatToken, TokenNode, Tokens, Typography } from '../tokens.ts';

/** A custom property and its value. */
type Declaration = [name: string, value: string];

interface ShadowLayer {
  color: unknown;
  offsetX: Dimension;
  offsetY: Dimension;
  blur: Dimension;
  spread: Dimension;
}

const THEMING = ['data-san-flavor', 'data-san-accent', 'data-san-glazing', 'data-san-window'];
const ANY_SCOPE = `:root, ${THEMING.map((attr) => `[${attr}]`).join(', ')}`;
/** The interaction states that get a state layer; each needs an opacity token of the same name. */
const STATE_LAYERS = ['hover', 'focus', 'pressed'];
// Groups that stay DTCG tokens only. A media query cannot read a custom property, so a breakpoint
// declared as one would never take effect; tools and preprocessors read it from the DTCG file.
const DTCG_ONLY = new Set(['breakpoint']);

// Custom properties are substituted where they are declared, so a value that reads another
// theming axis must be declared again on every nested theming element to pick up its context.
function scoped(attr: string, value: string): string {
  const self = `[${attr}="${value}"]`;
  return `${self},\n${self} :is(${THEMING.map((a) => `[${a}]`).join(', ')}):not([${attr}])`;
}

const unit = ({ value, unit: u }: Dimension): string => (value === 0 ? '0' : `${value}${u}`);
const mix = (name: string, percent: number): string => `color-mix(in oklab, var(--san-${name}) ${percent}%, transparent)`;

function colorValue(value: unknown): string {
  const alias = aliasPath(value);
  if (alias) return `var(${cssName(alias)})`;
  const { components: [l, c, h], alpha } = value as DtcgColor;
  return `oklch(${l} ${c} ${h}${alpha === undefined ? '' : ` / ${alpha}`})`;
}

function declarations({ path, token, type }: FlatToken): Declaration[] {
  const name = cssName(path);
  const value = token.$value;
  switch (type) {
    case 'color':
      return [[name, colorValue(value)]];
    case 'dimension':
    case 'duration':
      return [[name, unit(value as Dimension)]];
    case 'cubicBezier':
      return [[name, `cubic-bezier(${(value as number[]).join(', ')})`]];
    case 'fontFamily':
      return [[name, (value as string[]).map((family) => (/\s/.test(family) ? `"${family}"` : family)).join(', ')]];
    case 'typography': {
      const { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight } = value as Typography;
      const family = `var(${cssName(aliasPath(fontFamily)!)})`;
      const size = unit(fontSize);
      return [
        [name, `${fontWeight} ${size}/${lineHeight} ${family}`],
        [`${name}-family`, family],
        [`${name}-size`, size],
        [`${name}-line-height`, String(lineHeight)],
        [`${name}-weight`, String(fontWeight)],
        [`${name}-tracking`, unit(letterSpacing)],
      ];
    }
    case 'shadow':
      return [[name, (value as ShadowLayer[]).map((s) => `${unit(s.offsetX)} ${unit(s.offsetY)} ${unit(s.blur)} ${unit(s.spread)} ${colorValue(s.color)}`).join(', ')]];
    default:
      return [[name, String(value)]];
  }
}

const block = (selector: string, entries: Declaration[]): string =>
  `${selector} {\n${entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`;

const tokenEntries = (tree: TokenNode, keep: (entry: FlatToken) => boolean = () => true): Declaration[] => flatten(tree).filter(keep).flatMap(declarations);

const transparentShadow = '0 0 0 0 transparent';

const windowGradient = ([a, b, c]: string[]): string => `linear-gradient(160deg in oklch, ${a}, ${b} 55%, ${c})`;

// The default window: one pigment, from its pane through to its lume.
const monoStops: Declaration[] = [
  ['--san-window-a', 'var(--san-accent-pane)'],
  ['--san-window-b', 'var(--san-accent)'],
  ['--san-window-c', 'var(--san-accent-lume)'],
];

// Window modes: where the three window stops come from.
const windowModeStops: Record<string, Declaration[]> = {
  mono: monoStops,
  harmonic: [...'abc'].map((stop): Declaration => [`--san-window-${stop}`, `var(${cssName(['harmony', stop])})`]),
};

const cast = (source: string, prefix = ''): Declaration[] => [
  [`--san-${prefix}cast-sm`, `0 0 12px -2px ${mix(source, 45)}`],
  [`--san-${prefix}cast-md`, `0 0 28px -4px ${mix(source, 50)}`],
  [`--san-${prefix}cast-lg`, `0 0 18px -2px ${mix(`${source}-lume`, 40)}, 0 0 72px -8px ${mix(source, 55)}`],
];

// Glazing: how an accent or status is rendered on a filled element.
const glazeModes: Record<string, (source: string, prefix: string) => Declaration[]> = {
  'pot-metal': (source, prefix) => [
    [`--san-${prefix}glaze-bg`, `var(--san-${source})`],
    [
      `--san-${prefix}glaze-bg-hover`,
      `color-mix(in oklab, var(--san-${source}), light-dark(var(--san-${source}-ink), var(--san-${source}-lume)) 55%)`,
    ],
    [`--san-${prefix}glaze-fg`, `var(--san-${source}-on)`],
    [`--san-${prefix}glaze-border`, 'transparent'],
    [`--san-${prefix}glaze-sheen`, `linear-gradient(180deg, ${mix('light', 20)}, transparent 55%)`],
    [`--san-${prefix}glaze-glow`, transparentShadow],
    [`--san-${prefix}glaze-blur`, 'none'],
  ],
  flashed: (source, prefix) => [
    [`--san-${prefix}glaze-bg`, mix(source, 20)],
    [`--san-${prefix}glaze-bg-hover`, mix(source, 32)],
    [`--san-${prefix}glaze-fg`, `var(--san-${source}-on-pane)`],
    [`--san-${prefix}glaze-border`, mix(source, 60)],
    [`--san-${prefix}glaze-sheen`, `linear-gradient(135deg, ${mix(`${source}-lume`, 30)}, transparent 45%, ${mix(source, 14)})`],
    [`--san-${prefix}glaze-glow`, `var(--san-${prefix}cast-sm)`],
    [`--san-${prefix}glaze-blur`, 'blur(var(--san-blur-md)) saturate(1.5)'],
  ],
  grisaille: (source, prefix) => [
    [`--san-${prefix}glaze-bg`, 'var(--san-surface-raised-2)'],
    [`--san-${prefix}glaze-bg-hover`, 'var(--san-surface-raised-4)'],
    [`--san-${prefix}glaze-fg`, 'var(--san-text)'],
    [`--san-${prefix}glaze-border`, `color-mix(in oklab, var(--san-${source}) 75%, var(--san-lead-strong))`],
    [`--san-${prefix}glaze-sheen`, 'none'],
    [`--san-${prefix}glaze-glow`, transparentShadow],
    [`--san-${prefix}glaze-blur`, 'none'],
  ],
};

const glazeAll = (mode: string): Declaration[] => [
  ...glazeModes[mode]('accent', ''),
  ...Object.keys(STATUS).flatMap((status) => glazeModes[mode](status, `${status}-`)),
];

/** A state layer: the content color at the opacity token of its state, so retuning the opacity retunes the layer. */
const stateLayer = (state: string): Declaration => [
  `--san-state-layer-${state}`,
  `color-mix(in oklab, currentColor calc(var(--san-opacity-${state}) * 100%), transparent)`,
];

function derived(opacity: TokenNode): Declaration[] {
  for (const state of [...STATE_LAYERS, 'disabled-content', 'disabled-container']) {
    if (!(state in opacity)) throw new Error(`No opacity token "${state}" for its derived layer; add it to opacity in src/foundation.ts.`);
  }
  return [
    ...cast('accent'),
    ...Object.keys(STATUS).flatMap((status) => cast(status, `${status}-`)),
    ['--san-focus-ring-color', 'var(--san-accent)'],
    ['--san-focus-ring', 'var(--san-focus-ring-width) solid var(--san-focus-ring-color)'],
    ['--san-surface-disabled', 'color-mix(in oklab, var(--san-text) calc(var(--san-opacity-disabled-container) * 100%), transparent)'],
    ['--san-border-disabled', 'color-mix(in oklab, var(--san-lead-strong) calc(var(--san-opacity-disabled-content) * 100%), transparent)'],
    ['--san-selection-bg', 'var(--san-accent-pane)'],
    ['--san-selection-fg', 'var(--san-accent-on-pane)'],
    ...STATE_LAYERS.map(stateLayer),
    ...windowModeStops[DEFAULT_WINDOW],
    ['--san-window', windowGradient(['a', 'b', 'c'].map((stop) => `var(--san-window-${stop})`))],
    ...glazeAll(DEFAULT_GLAZING),
  ];
}

const windowTones = (pigments: PigmentId[]): string[] => pigments.map((pigment, i) => `var(${cssName(['pigment', pigment, String(WINDOW_TONES[i])])})`);

// Declared wherever the accent is, so the harmonic window can follow it.
const harmonyStops = (accent: PigmentId): Declaration[] => windowTones(harmony(accent)).map((value, i): Declaration => [cssName(['harmony', 'abc'[i]]), value]);

export function emitCss(palette: Palette, tokens: Tokens): string {
  const { files } = tokens;
  const foundation = Object.keys(files).filter((file) => file.startsWith('foundation/'));
  // Elevation reads the flavor's umbra, so it is declared with the flavor, not on :root.
  const isElevation = ({ path }: FlatToken) => path[0] === 'elevation';
  const semantic = tokenEntries(files['semantic.tokens.json'], ({ path, type }) => type === 'color' && path[0] !== 'selection');
  const elevation = tokenEntries(files['foundation/elevation.tokens.json'], isElevation);

  const banner = '/* Sanctuary design tokens. Generated by scripts/build.ts; do not edit by hand. */\n';
  const out: string[] = [
    block(':root', [
      ...foundation.flatMap((file) => tokenEntries(files[file], (entry) => !isElevation(entry) && !DTCG_ONLY.has(entry.path[0]))),
      // White light, as it passes through clear glass: sheens, suns and highlights are drawn with it.
      ['--san-light', 'oklch(1 0 0)'],
      ['--san-shape-lancet', archPolygon(38)],
      ['--san-shape-ogive', archPolygon(100)],
      ...tokenEntries(files['pigment.tokens.json']),
      // Named windows are fixed gradients to place by hand; they do not follow the accent.
      ...Object.entries(palette.windows).map(([id, { stops }]): Declaration => [`--san-window-${id}`, windowGradient(windowTones(stops))]),
    ]),
  ];

  // The default flavor shares :root's specificity with every flavor attribute, so it must come first.
  const byDefaultFirst = ([a]: [string, unknown], [b]: [string, unknown]) => Number(b === DEFAULT_FLAVOR) - Number(a === DEFAULT_FLAVOR);
  for (const [id, flavor] of Object.entries(palette.flavors).sort(byDefaultFirst)) {
    const selector = `${id === DEFAULT_FLAVOR ? ':root,\n' : ''}[data-san-flavor="${id}"]`;
    out.push(`/* ${flavor.name}: ${flavor.hour} */`);
    out.push(block(selector, [['color-scheme', flavor.scheme], ...tokenEntries(files[`flavor/${id}.tokens.json`]), ...semantic, ...harmonyStops(flavor.accent), ...elevation]));
  }

  out.push('/* Accents */');
  for (const id of Object.keys(PIGMENTS)) {
    out.push(block(scoped('data-san-accent', id), [...tokenEntries(files[`accent/${id}.tokens.json`]), ...harmonyStops(id as PigmentId)]));
  }

  out.push(`/* Light derived from the active flavor and accent. ${palette.glazings[DEFAULT_GLAZING].name} is the default glazing. */`);
  out.push(block(ANY_SCOPE, derived(files['foundation/effect.tokens.json'].opacity as TokenNode)));
  for (const id of Object.keys(palette.glazings)) {
    if (!glazeModes[id]) throw new Error(`No CSS is defined for glazing "${id}"; add it to the glaze table in src/emit/css.ts.`);
    out.push(block(scoped('data-san-glazing', id), glazeAll(id)));
  }

  out.push('/* Window: the cast light is one pigment (mono, the default) or the accent with its neighbours. */');
  for (const id of Object.keys(palette.windowModes)) {
    if (!windowModeStops[id]) throw new Error(`No CSS is defined for window mode "${id}"; add it to the window mode table in src/emit/css.ts.`);
    out.push(block(scoped('data-san-window', id), windowModeStops[id]));
  }
  // Motion is decoration: under reduced motion every duration collapses, so whatever the tokens time stops moving.
  const durations = flatten(files['foundation/motion.tokens.json']).filter(({ type }) => type === 'duration');
  out.push('/* Reduced motion */');
  out.push(`@media (prefers-reduced-motion: reduce) {\n${block(':root', durations.map(({ path }): Declaration => [cssName(path), '0ms']))
    .trimEnd()
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n')}\n}`);
  return `${banner}\n@layer sanctuary.tokens {\n${out.join('\n').trimEnd()}\n}\n`;
}
