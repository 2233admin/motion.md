import { createHash } from 'node:crypto';
import { parseYaml } from './yaml-lite.mjs';
import { extractYamlBlocks, splitFrontmatter } from './document.mjs';

export const TIMING_REF = /^\{motion(\.[a-z][a-z0-9-]*)+\}$/;

// CSS Easing Functions Level 1 keyword definitions.
const KEYWORDS = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};
const JUMPS = {
  'jump-start': 'start', start: 'start',
  'jump-end': 'end', end: 'end',
  'jump-none': 'none', 'jump-both': 'both',
};

export function parseTimingFunction(input) {
  const value = String(input).trim();
  if (value === 'linear') return { type: 'linear' };
  if (Object.hasOwn(KEYWORDS, value)) return { type: 'cubic-bezier', value: KEYWORDS[value] };
  if (value === 'step-start') return { type: 'steps', count: 1, jump: 'start' };
  if (value === 'step-end') return { type: 'steps', count: 1, jump: 'end' };
  let match = value.match(/^cubic-bezier\(([^)]*)\)$/);
  if (match) {
    const parts = match[1].split(',').map((part) => part.trim());
    if (parts.some((part) => !/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(part))) return null;
    const numbers = parts.map(Number);
    if (numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n))) return null;
    if (numbers[0] < 0 || numbers[0] > 1 || numbers[2] < 0 || numbers[2] > 1) return null;
    return { type: 'cubic-bezier', value: numbers };
  }
  match = value.match(/^steps\(\s*(\d+)\s*(?:,\s*([a-z-]+)\s*)?\)$/);
  if (match) {
    const count = Number(match[1]);
    const keyword = match[2] ?? 'end';
    const jump = Object.hasOwn(JUMPS, keyword) ? JUMPS[keyword] : undefined;
    if (!jump || count < 1 || (jump === 'none' && count < 2)) return null;
    return { type: 'steps', count, jump };
  }
  return null;
}

function parseDuration(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d+)ms$/);
  return match ? Number(match[1]) : null;
}

// Extract only the top-level `motion:` block from a YAML source. DESIGN.md owns the rest of
// its tree, and its other sections may use YAML outside the portable subset.
function motionBlock(yaml) {
  const lines = yaml.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line) => /^motion:/.test(line));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && (lines[end].trim() === '' || /^\s/.test(lines[end]) || /^#/.test(lines[end]))) end += 1;
  return lines.slice(start, end).join('\n');
}

function flatten(map, prefix, out) {
  for (const [key, value] of Object.entries(map ?? {})) {
    const path = `${prefix}.${key}`;
    if (value && typeof value === 'object' && !Array.isArray(value) && !('duration' in value || 'delay' in value || 'timingFunction' in value)) {
      flatten(value, path, out);
    } else {
      out.set(path, value);
    }
  }
}

/**
 * Load motion tokens from DESIGN.md source text.
 * Returns { tokens: Map<path, resolved>, findings, sourceHash }.
 */
export function loadDesignMotion(source, designPath) {
  const findings = [];
  const tokens = new Map();
  const add = (rule, severity, path, message) => findings.push({ rule, severity, path, message });
  const { yaml, markdown } = splitFrontmatter(source);
  const blocks = [yaml, ...extractYamlBlocks(markdown).map((block) => block.yaml)].filter((text) => text != null);
  // Prefer the whole block when it is portable (covers JSON front matter); otherwise read
  // only the motion key so the rest of DESIGN.md may use any YAML.
  const motionSources = blocks.map((text) => {
    try {
      const whole = parseYaml(text);
      return whole && Object.hasOwn(whole, 'motion') ? `motion: ${JSON.stringify(whole.motion)}` : null;
    } catch {
      return motionBlock(text);
    }
  }).filter(Boolean);

  const repeated = blocks.some((text) => text.replace(/\r\n?/g, '\n').split('\n').filter((line) => /^motion:/.test(line)).length > 1);
  if (motionSources.length > 1 || repeated) add('design-motion', 'error', '/design', `${designPath} defines the motion key more than once.`);
  if (motionSources.length === 1) {
    let raw;
    try {
      raw = parseYaml(motionSources[0]).motion;
    } catch (error) {
      add('design-motion', 'error', '/design', `${designPath} motion tokens are not portable YAML: ${error.message}`);
    }
    const flat = new Map();
    flatten(raw, 'motion', flat);
    for (const [path, token] of flat) {
      if (!token || typeof token !== 'object') {
        add('design-motion', 'error', '/design', `${designPath} ${path} must be a motion token object.`);
        continue;
      }
      const durationMs = parseDuration(token.duration);
      const delayMs = token.delay === undefined ? 0 : parseDuration(token.delay);
      const curve = parseTimingFunction(token.timingFunction ?? 'ease');
      if (durationMs === null) add('design-motion', 'error', '/design', `${designPath} ${path}.duration must be integer milliseconds such as "250ms".`);
      if (delayMs === null) add('design-motion', 'error', '/design', `${designPath} ${path}.delay must be integer milliseconds such as "0ms".`);
      if (!curve) add('unsupported-timing-function', 'error', '/design', `${designPath} ${path}.timingFunction is not a supported CSS easing function.`);
      if (durationMs !== null && delayMs !== null && curve) tokens.set(path, { durationMs, delayMs, curve });
    }
  }

  return { tokens, findings, sourceHash: createHash('sha256').update(source).digest('hex') };
}

export function isSafeRelativePath(path) {
  if (typeof path !== 'string' || path === '' || path.startsWith('/') || path.includes('\\') || /^[A-Za-z]:/.test(path)) return false;
  let depth = 0;
  for (const part of path.split('/')) {
    if (part === '..') depth -= 1;
    else if (part !== '.' && part !== '') depth += 1;
    if (depth < 0) return false;
  }
  return true;
}
