// Builds the DTCG 2025.10 token trees and the resolver document from the palette.

import { FOUNDATION_FILES } from './foundation.ts';
import { DEFAULT_FLAVOR, GLASS_ROLES, PIGMENTS, STATUS, SYNTAX, WINDOW_TONES } from './palette.ts';
import type { ColorRecord, Oklch } from './color.ts';
import type { Palette, PigmentId } from './palette.ts';

/** A node of a DTCG tree: a group of other nodes, or a token when it has a `$value`. */
export interface TokenNode {
  $type?: string;
  $value?: unknown;
  $description?: string;
  [key: string]: unknown;
}

/** DTCG files by path inside tokens/, such as `flavor/lauds.tokens.json`. */
export type TokenFiles = Record<string, TokenNode>;

export interface Tokens {
  /** Foundation files keep the types of their source; the generated ones are plain token trees. */
  files: TokenFiles & typeof FOUNDATION_FILES;
  resolver: ReturnType<typeof resolverDocument>;
}

/** A dimension or duration `$value`. */
export interface Dimension {
  value: number;
  unit: string;
}

/** A typography `$value`; `fontFamily` is an alias to a font family token. */
export interface Typography {
  fontFamily: string;
  fontSize: Dimension;
  fontWeight: number;
  letterSpacing: Dimension;
  lineHeight: number;
}

/** A color `$value` as the DTCG color module writes it. */
export interface DtcgColor {
  colorSpace: 'oklch';
  components: Oklch;
  alpha?: number;
  hex: string;
}

/** Alias to a token; a bare group name points at that group's `$root` token. */
const ref = (path: string, role = '$root') => `{${path}.${role}}`;

function dtcgColor({ oklch, hex, alpha }: ColorRecord): DtcgColor {
  return { colorSpace: 'oklch', components: oklch, ...(alpha === undefined ? {} : { alpha }), hex };
}

const colorGroup = (records: Record<string, ColorRecord>) =>
  Object.fromEntries(Object.entries(records).map(([key, record]) => [key, { $value: dtcgColor(record) }]));

const roleGroup = (target: string, roles: readonly string[] = GLASS_ROLES) =>
  Object.fromEntries(roles.map((role) => [role, { $value: ref(target, role) }]));

function pigmentFile(palette: Palette) {
  const pigment: TokenNode = { $type: 'color' };
  for (const [id, ramp] of Object.entries(palette.pigments)) {
    pigment[id] = { $description: PIGMENTS[id as PigmentId].note, ...colorGroup(ramp) };
  }
  return { pigment };
}

// Terminal colors follow the convention that 0/8 recede and 7/15 carry text, in both schemes.
function ansi(scheme: string) {
  const neutrals =
    scheme === 'dark'
      ? { black: '{surface.raised-3}', white: '{text.muted}', 'bright-black': '{lead.strong}', 'bright-white': '{text.$root}' }
      : { black: '{text.muted}', white: '{lead.$root}', 'bright-black': '{text.subtle}', 'bright-white': '{lead.soft}' };
  const hues = { red: 'ruby', green: 'verdure', yellow: 'gilt', blue: 'cobalt', magenta: 'amethyst', cyan: 'viridian' };
  const tokens: Record<string, TokenNode> = {};
  for (const [name, pigment] of Object.entries(hues)) {
    tokens[name] = { $value: ref(`glass.${pigment}`) };
    tokens[`bright-${name}`] = { $value: ref(`glass.${pigment}`, 'lume') };
  }
  for (const [name, alias] of Object.entries(neutrals)) tokens[name] = { $value: alias };
  return tokens;
}

function flavorFile(flavor: Palette['flavors'][string]): TokenNode {
  const { colors, roles } = flavor;
  const glass: Record<string, TokenNode> = {};
  for (const id of Object.keys(PIGMENTS)) {
    glass[id] = Object.fromEntries(
      GLASS_ROLES.map((role) => [role, { $value: `{pigment.${id}.${roles[role]}}` }]),
    );
  }
  return {
    $description: `${flavor.name} (${flavor.hour}). ${flavor.blurb}`,
    $extensions: { 'dev.sanctuary': { scheme: flavor.scheme, defaultAccent: flavor.accent } },
    surface: { $type: 'color', ...colorGroup(colors.surface) },
    text: { $type: 'color', ...colorGroup(colors.text) },
    lead: { $type: 'color', ...colorGroup(colors.lead) },
    umbra: { $type: 'color', ...colorGroup(colors.umbra) },
    scrim: { $type: 'color', $value: dtcgColor(colors.scrim) },
    glass: { $type: 'color', ...glass },
    accent: { $type: 'color', ...roleGroup(`glass.${flavor.accent}`) },
    ansi: { $type: 'color', ...ansi(flavor.scheme) },
  };
}

function semanticFile(palette: Palette): TokenNode {
  const status = Object.fromEntries(
    Object.entries(STATUS).map(([name, pigment]) => [name, { $type: 'color', ...roleGroup(`glass.${pigment}`) }]),
  );
  const syntax: TokenNode = { $type: 'color' };
  for (const [name, target] of Object.entries(SYNTAX)) syntax[name] = { $value: `{${target}}` };
  const window: TokenNode = { $type: 'gradient' };
  for (const [id, { stops, note }] of Object.entries(palette.windows)) {
    window[id] = {
      $description: note,
      $value: stops.map((pigment, i) => ({ color: `{pigment.${pigment}.${WINDOW_TONES[i]}}`, position: i / (stops.length - 1) })),
    };
  }
  return { ...status, syntax, window };
}

function resolverDocument(files: TokenFiles) {
  const sources = (prefix: string) =>
    Object.keys(files).filter((file) => file.startsWith(prefix)).map((file) => ({ $ref: file }));
  const contexts = (prefix: string): Record<string, { $ref: string }[]> =>
    Object.fromEntries(sources(prefix).map((source) => [source.$ref.slice(prefix.length).split('.')[0], [source]]));
  return {
    $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
    name: 'Sanctuary',
    // The DTCG revision this document follows, not a release of Sanctuary (Resolver module, 4.1.2).
    version: '2025.10',
    description: 'Resolves Sanctuary tokens for one flavor and one accent.',
    sets: {
      foundation: { sources: sources('foundation/') },
      pigment: { sources: sources('pigment.') },
      semantic: { sources: sources('semantic.') },
    },
    modifiers: {
      flavor: { description: 'The hour of the day.', contexts: contexts('flavor/'), default: DEFAULT_FLAVOR },
      accent: {
        description: 'The pigment that plays the accent. `flavor` keeps the default of the active flavor.',
        contexts: { flavor: [], ...contexts('accent/') },
        default: 'flavor',
      },
    },
    resolutionOrder: [
      { $ref: '#/sets/foundation' },
      { $ref: '#/sets/pigment' },
      { $ref: '#/modifiers/flavor' },
      { $ref: '#/sets/semantic' },
      { $ref: '#/modifiers/accent' },
    ],
  };
}

export function buildTokens(palette: Palette): Tokens {
  const files: Tokens['files'] = { ...FOUNDATION_FILES, 'pigment.tokens.json': pigmentFile(palette) };
  for (const [id, flavor] of Object.entries(palette.flavors)) files[`flavor/${id}.tokens.json`] = flavorFile(flavor);
  for (const id of Object.keys(PIGMENTS)) {
    files[`accent/${id}.tokens.json`] = { accent: { $type: 'color', ...roleGroup(`glass.${id}`) } };
  }
  files['semantic.tokens.json'] = semanticFile(palette);
  return { files, resolver: resolverDocument(files) };
}

export interface FlatToken {
  path: string[];
  token: TokenNode;
  type: string | undefined;
}

/** Every token in a tree, with its path and its own or inherited `$type`. */
export function flatten(tree: TokenNode, path: string[] = [], inherited?: string): FlatToken[] {
  const type = tree.$type ?? inherited;
  if ('$value' in tree) return [{ path, token: tree, type }];
  return Object.entries(tree)
    .filter(([key, value]) => (key === '$root' || !key.startsWith('$')) && typeof value === 'object')
    .flatMap(([key, value]) => flatten(value as TokenNode, [...path, key], type));
}

/** The tokens of a DTCG group: its `$root` token and named ones, without properties such as `$type`. */
export function groupTokens<T>(group: { [key: string]: string | T }): [name: string, token: T][] {
  return Object.entries(group).filter((entry): entry is [string, T] => entry[0] === '$root' || !entry[0].startsWith('$'));
}

/** Custom property name for a token path. `$root` names the group itself. */
// Custom properties the stylesheet needs but consumers must not read take the private `--_san-` prefix,
// so they stay out of the public API. Pigments are the primitive tier: a component that reads one
// bypasses the flavor and its contrast guarantees. Harmony stops are plumbing for the harmonic window,
// which consumers read as `--san-window-a` to `-c`.
const PRIVATE_TIERS = new Set(['pigment', 'harmony']);
export const cssName = (path: string[]): string =>
  `--${PRIVATE_TIERS.has(path[0]) ? '_' : ''}san-${path.filter((segment) => segment !== '$root').join('-')}`;

export const aliasPath = (value: unknown): string[] | null =>
  typeof value === 'string' && value.startsWith('{') ? value.slice(1, -1).split('.') : null;

function find(tree: TokenNode | undefined, path: string[]): TokenNode | undefined {
  let node = tree;
  for (const segment of path) node = node?.[segment] as TokenNode | undefined;
  if (node && !('$value' in node) && node.$root) node = node.$root as TokenNode;
  return node && '$value' in node ? node : undefined;
}

/** Resolves a token (given as a dotted path) to its token object within one flavor. */
export function resolveToken(tokens: Pick<Tokens, 'files'>, flavor: string, path: string | string[]): TokenNode {
  const segments = Array.isArray(path) ? path : path.split('.');
  const trees = ['pigment.tokens.json', `flavor/${flavor}.tokens.json`, 'semantic.tokens.json'];
  const token = trees.map((file) => find(tokens.files[file], segments)).find(Boolean);
  if (!token) throw new Error(`Unknown token ${segments.join('.')} in flavor ${flavor}`);
  const alias = aliasPath(token.$value);
  return alias ? resolveToken(tokens, flavor, alias) : token;
}

export const resolveHex = (tokens: Pick<Tokens, 'files'>, flavor: string, path: string | string[]): string =>
  (resolveToken(tokens, flavor, path).$value as DtcgColor).hex;
