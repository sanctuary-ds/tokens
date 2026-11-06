// Flavor-independent foundations, authored directly as DTCG 2025.10 token trees.

import type { Typography } from './tokens.ts';

const rem = (value: number) => ({ value, unit: 'rem' });
const px = (value: number) => ({ value, unit: 'px' });
const ms = (value: number) => ({ value, unit: 'ms' });
/** A DTCG group of one type, whose values may be wrapped, for example as a dimension. */
const group = <V>(type: string, entries: Record<string, V>, wrap: (value: V) => unknown = (value) => value) => ({
  $type: type,
  ...Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, { $value: wrap(value) }])),
});

// A 4px grid. The key is the multiplier, so `space.4` is 16px.
const space = group(
  'dimension',
  { 0: 0, px: 0.0625, half: 0.125, 1: 0.25, 2: 0.5, 3: 0.75, 4: 1, 5: 1.25, 6: 1.5, 8: 2, 10: 2.5, 12: 3, 16: 4, 20: 5, 24: 6, 32: 8 },
  rem,
);

const size = {
  control: group('dimension', { sm: 2, md: 2.5, lg: 3 }, rem),
  icon: group('dimension', { sm: 1, md: 1.25, lg: 1.5 }, rem),
  measure: { $type: 'dimension', $description: 'Maximum line length for running text.', $value: rem(42) },
};

const breakpoint = group('dimension', { sm: 40, md: 48, lg: 64, xl: 80, '2xl': 96 }, rem);

// Cut stone: radii stay small, and arches use the shape tokens. `full` (9999px) is the exception:
// a pill or circle for small controls such as switches, chips and progress tracks.
const radius = group('dimension', { none: 0, xs: 0.125, sm: 0.25, md: 0.5, lg: 0.75, xl: 1.25, full: 624.9375 }, rem);

const border = {
  width: {
    $type: 'dimension',
    hairline: { $value: px(1) },
    came: { $value: px(2), $description: 'The lead line between two panes.' },
    heavy: { $value: px(3) },
  },
};

const font = {
  family: {
    $type: 'fontFamily',
    display: { $value: ['Cormorant Garamond', 'Cormorant', 'EB Garamond', 'Georgia', 'serif'] },
    text: { $value: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'] },
    mono: { $value: ['JetBrains Mono', 'Cascadia Code', 'ui-monospace', 'monospace'] },
    inscription: { $value: ['Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'] },
  },
  weight: group('fontWeight', { regular: 400, medium: 500, semibold: 600, bold: 700 }),
};

// [family, size rem, line-height, weight, tracking em]
const TYPE_SCALE: Record<string, [family: string, size: number, lineHeight: number, weight: number, tracking: number]> = {
  'display-lg': ['display', 4.5, 1.04, 500, -0.02],
  'display-md': ['display', 3.5, 1.08, 500, -0.018],
  'display-sm': ['display', 2.75, 1.1, 500, -0.015],
  'headline-lg': ['display', 2.25, 1.16, 500, -0.01],
  'headline-md': ['display', 1.875, 1.2, 600, -0.006],
  'headline-sm': ['display', 1.5, 1.25, 600, 0],
  'title-lg': ['text', 1.25, 1.4, 600, -0.005],
  'title-md': ['text', 1, 1.5, 600, 0],
  'title-sm': ['text', 0.875, 1.43, 600, 0.005],
  'body-lg': ['text', 1.125, 1.6, 400, 0],
  'body-md': ['text', 1, 1.55, 400, 0],
  'body-sm': ['text', 0.875, 1.5, 400, 0.003],
  'label-lg': ['text', 0.875, 1.43, 500, 0.01],
  'label-md': ['text', 0.75, 1.34, 500, 0.02],
  'label-sm': ['text', 0.6875, 1.45, 500, 0.04],
  inscription: ['inscription', 0.75, 1.34, 600, 0.18],
  'code-md': ['mono', 0.875, 1.6, 400, 0],
  'code-sm': ['mono', 0.78125, 1.6, 400, 0],
};

const typeRoles: Record<string, { $value: Typography }> = Object.fromEntries(
  Object.entries(TYPE_SCALE).map(([name, [family, fontSize, lineHeight, weight, tracking]]) => [
    name,
    {
      $value: {
        fontFamily: `{font.family.${family}}`,
        fontSize: rem(fontSize),
        fontWeight: weight,
        // DTCG dimensions only allow px and rem, so em tracking is resolved against the size.
        letterSpacing: rem(Number((fontSize * tracking).toFixed(5))),
        lineHeight,
      },
    },
  ]),
);

// Declared by hand because a spread drops the index signature, and the roles with it.
const type: { $type: string; [role: string]: string | { $value: Typography } } = { $type: 'typography', ...typeRoles };

const duration = {
  ...group('duration', { instant: 80, fast: 140, base: 220, slow: 360, slower: 560 }, ms),
  procession: { $type: 'duration', $value: ms(900), $description: 'Light moving across stone: flavor and glow changes.' },
};

const ease = group('cubicBezier', {
  standard: [0.2, 0, 0, 1],
  enter: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 0.8, 0.15],
  linear: [0, 0, 1, 1],
});

// Lumen levels. Each level pairs a key shadow with an ambient one; colors come from the flavor.
type Shadow = [offsetY: number, blur: number, spread: number];
const LUMEN: [key: Shadow, ambient: Shadow][] = [
  [[0, 0, 0], [0, 0, 0]],
  [[1, 2, 0], [1, 3, 1]],
  [[2, 4, -1], [4, 10, 0]],
  [[4, 8, -2], [10, 24, 0]],
  [[8, 16, -4], [18, 40, 0]],
  [[12, 24, -6], [32, 64, 0]],
];

const layer = (umbra: string, [offsetY, blur, spread]: Shadow) => ({
  color: `{umbra.${umbra}}`,
  offsetX: px(0),
  offsetY: px(offsetY),
  blur: px(blur),
  spread: px(spread),
});

const elevation = {
  $type: 'shadow',
  ...Object.fromEntries(LUMEN.map(([key, ambient], level) => [level, { $value: [layer('key', key), layer('ambient', ambient)] }])),
};

const blur = group('dimension', { sm: 8, md: 16, lg: 32 }, px);

// Opacities only. The state layers that mix the content color at these opacities are CSS-only
// (`--san-state-layer-*` in src/emit/css.ts): DTCG has no color functions.
const opacity = {
  $type: 'number',
  $description: 'Opacity of the content color in each interaction state, from 0 to 1.',
  hover: { $value: 0.08 },
  focus: { $value: 0.12 },
  pressed: { $value: 0.16 },
  'disabled-content': { $value: 0.38 },
  'disabled-container': { $value: 0.12 },
};

// Stacking order, read as `z-index: var(--san-z-modal)`. Named z, not layer, so it does not read as a
// state layer (a color) or a CSS cascade layer.
const z = group('number', { base: 0, raised: 10, sticky: 100, overlay: 200, modal: 300, toast: 400, tooltip: 500 });

export const FOUNDATION_FILES = {
  'foundation/space.tokens.json': { space, size, breakpoint },
  'foundation/shape.tokens.json': { radius, border },
  'foundation/typography.tokens.json': { font, type },
  'foundation/motion.tokens.json': { duration, ease },
  'foundation/elevation.tokens.json': { elevation, blur, opacity, z },
};

/** Percentage polygon for a pointed (equilateral) arch whose springing sits `spring`% down the box. */
export function archPolygon(spring: number, steps = 14): string {
  const points: [x: number, y: number][] = [];
  const apex = Math.PI / 3;
  for (let i = 0; i <= steps; i += 1) {
    const t = (apex * i) / steps;
    points.push([(1 - Math.cos(t)) * 100, spring * (1 - Math.sin(t) / Math.sin(apex))]);
  }
  const right = points.slice(0, -1).reverse().map(([x, y]): [number, number] => [100 - x, y]);
  const format = ([x, y]: [number, number]) => `${Number(x.toFixed(2))}% ${Number(y.toFixed(2))}%`;
  return `polygon(0% 100%, ${[...points, ...right].map(format).join(', ')}, 100% 100%)`;
}
