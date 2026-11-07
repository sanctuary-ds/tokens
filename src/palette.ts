// The Sanctuary palette: pigments (flavor-independent tonal ramps), flavors
// (the stone each hour of the day reveals) and windows (multi-pigment light).

import { color, maxChroma, withAlpha } from './color.ts';
import type { ColorRecord } from './color.ts';

export const TONES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Tone = (typeof TONES)[number];

/** A hue and the most chroma it may take. */
interface Tint {
  hue: number;
  chroma: number;
}

interface PigmentDef extends Tint {
  drift?: number;
  note: string;
}

/** The roles every pigment plays in a flavor's glass; the `Role` type comes from this list. */
export const GLASS_ROLES = ['$root', 'lume', 'ink', 'pane', 'on', 'on-pane'] as const;

export type Role = (typeof GLASS_ROLES)[number];

interface FlavorDef {
  name: string;
  hour: string;
  scheme: 'light' | 'dark';
  blurb: string;
  accent: PigmentId;
  roles: Record<Role, Tone>;
  stone: Tint;
  surface: Record<string, number>;
  lead: Record<string, number>;
  ink: Tint;
  text: Record<string, number>;
  umbra: { lightness: number; key: number; ambient: number };
  scrim: number;
}

interface WindowDef {
  name: string;
  stops: PigmentId[];
  note: string;
}

// Lightness is fixed per tone so that a tone number means the same contrast in every pigment.
const TONE_LIGHTNESS: Record<Tone, number> = {
  50: 0.972, 100: 0.94, 200: 0.885, 300: 0.805, 400: 0.715, 500: 0.625,
  600: 0.52, 700: 0.43, 800: 0.34, 900: 0.265, 950: 0.195,
};

// Share of the pigment's peak chroma used at each tone: pale at the edges, saturated in the body.
const TONE_CHROMA: Record<Tone, number> = {
  50: 0.16, 100: 0.3, 200: 0.52, 300: 0.78, 400: 0.95, 500: 1,
  600: 0.98, 700: 0.86, 800: 0.7, 900: 0.55, 950: 0.42,
};

// Never sit on the gamut boundary; fully saturated sRGB reads as screen color, not glass.
const GAMUT_HEADROOM = 0.94;

// `drift` rotates the hue of the dark tones so yellows deepen towards amber instead of olive.
export const PIGMENTS = {
  ruby: { hue: 24, chroma: 0.215, note: 'Copper ruby, the red of the great rose windows.' },
  ember: { hue: 47, chroma: 0.19, note: 'Red-orange, a coal seen through thick glass.' },
  amber: { hue: 70, chroma: 0.17, drift: -8, note: 'Deep silver stain, fired towards orange.' },
  gilt: { hue: 93, chroma: 0.16, drift: -16, note: 'Pale silver stain, the yellow of halos.' },
  verdure: { hue: 142, chroma: 0.17, note: 'Leaf green of foliage borders.' },
  viridian: { hue: 172, chroma: 0.13, note: 'Blue-green, cool and mineral.' },
  azure: { hue: 228, chroma: 0.14, note: 'Sky blue of clerestory grounds.' },
  cobalt: { hue: 259, chroma: 0.2, note: 'Cobalt blue, the signature of Gothic glazing.' },
  indigo: { hue: 281, chroma: 0.2, note: 'Blue-violet, glass at the last light.' },
  amethyst: { hue: 306, chroma: 0.2, note: 'Manganese purple.' },
  murrey: { hue: 342, chroma: 0.19, note: 'Murrey, the mulberry red-purple of glaziers.' },
  rose: { hue: 3, chroma: 0.16, note: 'Soft rose, flesh tones and dawn.' },
} satisfies Record<string, PigmentDef>;
export type PigmentId = keyof typeof PIGMENTS;

// Which tone of a pigment plays each glass role, by flavor mode.
const ROLE_TONES: Record<'dark' | 'abyss' | 'light', Record<Role, Tone>> = {
  dark: { $root: 300, lume: 200, ink: 200, pane: 800, on: 950, 'on-pane': 100 },
  abyss: { $root: 400, lume: 300, ink: 300, pane: 900, on: 950, 'on-pane': 200 },
  light: { $root: 600, lume: 400, ink: 700, pane: 100, on: 50, 'on-pane': 800 },
};

// Flavors are the canonical hours: the same building under four different lights.
export const FLAVORS = {
  lauds: {
    name: 'Lauds',
    hour: 'Dawn',
    scheme: 'light',
    blurb: 'First light on pale limestone. Ink on stone, color pooling on the floor.',
    accent: 'cobalt',
    roles: ROLE_TONES.light,
    stone: { hue: 85, chroma: 0.014 },
    surface: { sunken: 0.925, $root: 0.957, 'raised-1': 0.975, 'raised-2': 0.986, 'raised-3': 0.993, 'raised-4': 1 },
    lead: { soft: 0.875, $root: 0.77, strong: 0.5, came: 0.24 },
    ink: { hue: 285, chroma: 0.035 },
    text: { $root: 0.24, muted: 0.4, subtle: 0.5, disabled: 0.68 },
    umbra: { lightness: 0.25, key: 0.18, ambient: 0.1 },
    scrim: 0.4,
  },
  vespers: {
    name: 'Vespers',
    hour: 'Dusk',
    scheme: 'dark',
    blurb: 'Candles lit against plum shadow. The warmest of the dark hours.',
    accent: 'ember',
    roles: ROLE_TONES.dark,
    stone: { hue: 345, chroma: 0.025 },
    surface: { sunken: 0.175, $root: 0.205, 'raised-1': 0.237, 'raised-2': 0.268, 'raised-3': 0.3, 'raised-4': 0.335 },
    lead: { soft: 0.31, $root: 0.385, strong: 0.52, came: 0.1 },
    ink: { hue: 75, chroma: 0.03 },
    text: { $root: 0.93, muted: 0.79, subtle: 0.7, disabled: 0.48 },
    umbra: { lightness: 0.05, key: 0.55, ambient: 0.35 },
    scrim: 0.6,
  },
  compline: {
    name: 'Compline',
    hour: 'Night',
    scheme: 'dark',
    blurb: 'Blue-slate stone after the doors close. The default flavor.',
    accent: 'cobalt',
    roles: ROLE_TONES.dark,
    stone: { hue: 265, chroma: 0.022 },
    surface: { sunken: 0.15, $root: 0.18, 'raised-1': 0.212, 'raised-2': 0.243, 'raised-3': 0.275, 'raised-4': 0.31 },
    lead: { soft: 0.285, $root: 0.36, strong: 0.5, came: 0.08 },
    ink: { hue: 85, chroma: 0.02 },
    text: { $root: 0.93, muted: 0.78, subtle: 0.68, disabled: 0.47 },
    umbra: { lightness: 0.04, key: 0.6, ambient: 0.4 },
    scrim: 0.6,
  },
  matins: {
    name: 'Matins',
    hour: 'Deep night',
    scheme: 'dark',
    blurb: 'The crypt before any light. Near-black stone, jewel-deep glass.',
    accent: 'viridian',
    roles: ROLE_TONES.abyss,
    stone: { hue: 285, chroma: 0.012 },
    surface: { sunken: 0.07, $root: 0.11, 'raised-1': 0.145, 'raised-2': 0.178, 'raised-3': 0.21, 'raised-4': 0.245 },
    lead: { soft: 0.22, $root: 0.3, strong: 0.45, came: 0.04 },
    ink: { hue: 90, chroma: 0.015 },
    text: { $root: 0.9, muted: 0.75, subtle: 0.63, disabled: 0.43 },
    umbra: { lightness: 0, key: 0.7, ambient: 0.5 },
    scrim: 0.7,
  },
} satisfies Record<string, FlavorDef>;
export type FlavorId = keyof typeof FLAVORS;

export const DEFAULT_FLAVOR: FlavorId = 'compline';
// What a page shows before anyone chooses: solid glass, lit by the accent alone.
export const DEFAULT_GLAZING: GlazingId = 'pot-metal';
export const DEFAULT_WINDOW: WindowModeId = 'mono';

// Windows: three pigments leaded together, used wherever light is cast rather than applied.
// Stops use the saturated body of each pigment and brighten along the gradient, in every flavor.
export const WINDOW_TONES: Tone[] = [600, 500, 400];
export const WINDOWS = {
  rosace: { name: 'Rosace', stops: ['ruby', 'murrey', 'cobalt'], note: 'Ruby against cobalt, the rose window.' },
  jesse: { name: 'Jesse', stops: ['verdure', 'gilt', 'ruby'], note: 'Vine, gold and blood: the Jesse tree.' },
  lancet: { name: 'Lancet', stops: ['viridian', 'azure', 'indigo'], note: 'A tall cool window, all blues.' },
  aureole: { name: 'Aureole', stops: ['gilt', 'amber', 'ember'], note: 'Halo light, gold falling to coal.' },
  vesperal: { name: 'Vesperal', stops: ['indigo', 'amethyst', 'rose'], note: 'The west window at sunset.' },
} satisfies Record<string, WindowDef>;
export type WindowId = keyof typeof WINDOWS;

// Window modes: how the cast light follows the accent, set with data-san-window. Mono is the default.
export const WINDOW_MODES = {
  mono: { name: 'Mono', source: 'one pigment', note: 'Pane, glass and lume of the current accent. The default.' },
  harmonic: { name: 'Harmonic', source: 'accent and neighbours', note: 'The accent leaded with the pigments on either side of it.' },
};
export type WindowModeId = keyof typeof WINDOW_MODES;

// The harmonic window is not a fixed set of stops: it leads an accent with its two
// neighbours on the hue wheel, so the cast light always agrees with the controls.
export function harmony(accent: PigmentId): PigmentId[] {
  const wheel = (Object.keys(PIGMENTS) as PigmentId[]).sort((a, b) => PIGMENTS[a].hue - PIGMENTS[b].hue);
  const at = wheel.indexOf(accent);
  return [wheel[(at - 1 + wheel.length) % wheel.length], accent, wheel[(at + 1) % wheel.length]];
}

export const GLAZINGS = {
  'pot-metal': { name: 'Pot-metal', note: 'Glass colored through its whole body. Solid, opaque accent.' },
  flashed: { name: 'Flashed', note: 'A thin skin of color over clear glass. Translucent, glowing accent.' },
  grisaille: { name: 'Grisaille', note: 'Monochrome glass with a colored border. Accent as a line only.' },
};
export type GlazingId = keyof typeof GLAZINGS;

export const STATUS: Record<string, PigmentId> = { danger: 'ruby', warning: 'amber', success: 'verdure', info: 'azure' };

// Values are full token paths.
export const SYNTAX: Record<string, string> = {
  keyword: 'glass.amethyst.$root',
  string: 'glass.verdure.$root',
  number: 'glass.ember.$root',
  constant: 'glass.amber.$root',
  function: 'glass.azure.$root',
  type: 'glass.gilt.$root',
  property: 'glass.cobalt.$root',
  tag: 'glass.ruby.$root',
  operator: 'glass.viridian.$root',
  regex: 'glass.rose.$root',
  variable: 'text.$root',
  punctuation: 'text.muted',
  comment: 'text.subtle',
};

function ramp({ hue, chroma, drift = 0 }: PigmentDef): Record<Tone, ColorRecord> {
  const tones = {} as Record<Tone, ColorRecord>;
  for (const tone of TONES) {
    const l = TONE_LIGHTNESS[tone];
    const darkness = Math.max(0, (TONE_LIGHTNESS[500] - l) / (TONE_LIGHTNESS[500] - TONE_LIGHTNESS[950]));
    const h = hue + drift * darkness;
    const c = Math.min(chroma * TONE_CHROMA[tone], GAMUT_HEADROOM * maxChroma(l, h));
    tones[tone] = color(l, c, h);
  }
  return tones;
}

function tinted(lightness: number, { hue, chroma }: Tint): ColorRecord {
  return color(lightness, Math.min(chroma, GAMUT_HEADROOM * maxChroma(lightness, hue)), hue);
}

function stone(flavor: FlavorDef) {
  const map = (levels: Record<string, number>, tint: Tint): Record<string, ColorRecord> => Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, tinted(l, tint)]));
  const leadTint = { hue: flavor.stone.hue, chroma: flavor.stone.chroma * 1.3 };
  const surface = map(flavor.surface, flavor.stone);
  const text = map(flavor.text, flavor.ink);
  const shade = tinted(flavor.umbra.lightness, flavor.stone);
  return {
    surface: { ...surface, inverse: text.$root },
    text: { ...text, inverse: surface.$root },
    lead: map(flavor.lead, leadTint),
    umbra: { key: withAlpha(shade, flavor.umbra.key), ambient: withAlpha(shade, flavor.umbra.ambient) },
    scrim: withAlpha(color(0, 0, 0), flavor.scrim),
  };
}

export function buildPalette() {
  return {
    pigments: Object.fromEntries(Object.entries(PIGMENTS).map(([id, def]) => [id, ramp(def)])),
    flavors: Object.fromEntries(Object.entries(FLAVORS).map(([id, def]) => [id, { ...def, colors: stone(def) }])),
    windows: WINDOWS,
    windowModes: WINDOW_MODES,
    glazings: GLAZINGS,
  };
}

export type Palette = ReturnType<typeof buildPalette>;
