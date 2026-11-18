import { createHash } from 'node:crypto';
import { normalizeMotion, stableStringify, stableValue } from '../../motion-ir/src/index.mjs';
import { isSafeRelativePath, loadDesignMotion } from './design.mjs';
import {
  extractYamlBlocks, findReferences, htmlAnchors, markdownAnchors, parseSections, splitFrontmatter,
} from './document.mjs';
import { parseYaml, YamlLiteError } from './yaml-lite.mjs';
import { validateMotion } from './validate.mjs';

function add(findings, rule, severity, path, message) {
  findings.push({ rule, severity, path, message });
}

// Front matter and fenced ```yaml blocks merge into one tree; each top-level key may be
// defined once across the whole document (same rule as DESIGN.md).
function collectMachineData(split, findings) {
  const sources = [];
  if (split.yaml !== null) sources.push({ label: 'front matter', yaml: split.yaml, line: 2 });
  for (const block of extractYamlBlocks(split.markdown)) {
    sources.push({ label: `yaml block in "${block.heading ?? 'preamble'}"`, yaml: block.yaml, line: split.bodyLine + block.startIndex + 1 });
  }
  if (sources.length === 0) return null;
  const merged = {};
  for (const source of sources) {
    let data;
    try {
      data = parseYaml(source.yaml);
    } catch (error) {
      if (!(error instanceof YamlLiteError)) throw error;
      const line = error.line ? source.line + error.line - 1 : source.line;
      add(findings, 'yaml-syntax', 'error', '/', `${error.message.replace(/ at line \d+$/, '')} at line ${line} (${source.label})`);
      continue;
    }
    for (const [key, value] of Object.entries(data)) {
      if (Object.hasOwn(merged, key)) {
        add(findings, 'duplicate-key', 'error', `/${key}`, `Top-level key ${key} is defined more than once (${source.label}).`);
        continue;
      }
      merged[key] = value;
    }
  }
  return merged;
}

function timingRefs(frontmatter) {
  const refs = [];
  if (typeof frontmatter.defaults?.timing === 'string') refs.push({ ref: frontmatter.defaults.timing, path: '/defaults/timing' });
  for (const [id, timeline] of Object.entries(frontmatter.timelines ?? {})) {
    (timeline?.tracks ?? []).forEach((track, index) => {
      if (typeof track?.timing === 'string') refs.push({ ref: track.timing, path: `/timelines/${id}/tracks/${index}/timing` });
    });
  }
  return refs;
}

function bindDesign(frontmatter, resolveFile, findings) {
  const refs = timingRefs(frontmatter);
  if (frontmatter.design === undefined) {
    for (const { path } of refs) add(findings, 'broken-ref', 'error', path, 'Timing token references require a design file.');
    return null;
  }
  if (!resolveFile) {
    add(findings, 'unresolved-design', 'error', '/design', 'The design file cannot be resolved without a base directory.');
    return null;
  }
  const source = resolveFile(frontmatter.design);
  if (source == null) {
    add(findings, 'broken-ref', 'error', '/design', `Design file ${frontmatter.design} does not exist.`);
    return null;
  }
  const loaded = loadDesignMotion(source, frontmatter.design);
  findings.push(...loaded.findings);
  for (const { ref, path } of refs) {
    if (!loaded.tokens.has(ref.slice(1, -1))) add(findings, 'broken-ref', 'error', path, `Motion token ${ref} does not exist in ${frontmatter.design}.`);
  }

  // A literal duration and curve that already equal a design token is a second source of truth.
  for (const [id, timeline] of Object.entries(frontmatter.timelines ?? {})) {
    (timeline?.tracks ?? []).forEach((track, index) => {
      if (track?.timing !== undefined || track?.durationMs === undefined || !track?.curve) return;
      const curve = frontmatter.curves?.[track.curve];
      if (!curve) return;
      for (const [tokenPath, token] of loaded.tokens) {
        // A delayed token would move the track's start, so only an exact equivalent is suggested.
        if (token.delayMs === 0 && token.durationMs === track.durationMs && stableStringify(token.curve) === stableStringify(curve)) {
          add(findings, 'prefer-design-token', 'info', `/timelines/${id}/tracks/${index}`, `Duration and curve equal {${tokenPath}}; reference it with timing instead.`);
          break;
        }
      }
    });
  }
  return { path: frontmatter.design, sourceHash: loaded.sourceHash, tokens: loaded.tokens };
}

function checkReferences(markdown, resolveFile, findings) {
  for (const ref of findReferences(markdown)) {
    const path = `/sections/${ref.heading ?? 'preamble'}/references/${ref.raw}`;
    if (ref.absolute || !isSafeRelativePath(ref.path)) {
      add(findings, 'broken-ref', 'error', path, 'External references resolve from the MOTION.md directory and must stay inside it.');
      continue;
    }
    if (!resolveFile) continue;
    const target = resolveFile(ref.path);
    if (target == null) {
      add(findings, 'broken-ref', 'warning', path, `Referenced file ${ref.path} does not exist.`);
      continue;
    }
    if (!ref.fragment) continue;
    const extension = ref.path.split('.').pop().toLowerCase();
    const anchors = ['md', 'markdown'].includes(extension) ? markdownAnchors(target)
      : ['html', 'htm'].includes(extension) ? htmlAnchors(target) : null;
    if (!anchors) add(findings, 'broken-ref', 'info', path, `Fragment #${ref.fragment} on a .${extension} file is not checked.`);
    else if (!anchors.has(ref.fragment)) add(findings, 'broken-ref', 'warning', path, `Fragment #${ref.fragment} does not exist in ${ref.path}.`);
  }
}

/**
 * @param {string} source MOTION.md text
 * @param {{ resolveFile?: (relativePath: string) => string | null }} [options]
 *   resolveFile reads a path relative to the MOTION.md directory, returning null when absent.
 */
export function parseMotion(source, options = {}) {
  const { resolveFile } = options;
  const findings = [];
  let frontmatter = null;
  let sections = [];
  let design = null;

  try {
    const split = splitFrontmatter(source);
    sections = parseSections(split.markdown);
    frontmatter = collectMachineData(split, findings);
    findings.push(...validateMotion(frontmatter, sections));
    checkReferences(split.markdown, resolveFile, findings);
    if (frontmatter && !findings.some((finding) => finding.severity === 'error')) {
      design = bindDesign(frontmatter, resolveFile, findings);
    }
  } catch (error) {
    findings.push({
      rule: error.rule ?? (error instanceof YamlLiteError ? 'yaml-syntax' : 'markdown-structure'),
      severity: 'error',
      path: error.path ?? '/',
      message: error.message,
    });
  }

  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.filter((finding) => finding.severity === 'warning').length;
  const info = findings.filter((finding) => finding.severity === 'info').length;
  const ir = errors === 0 && frontmatter ? normalizeMotion(frontmatter, sections, design) : null;

  return stableValue({
    format: 'motion.md',
    specVersion: frontmatter?.version ?? null,
    sourceHash: createHash('sha256').update(source).digest('hex'),
    document: frontmatter,
    sections,
    ir,
    findings,
    summary: { errors, warnings, info },
  });
}

export function lintMotion(source, options = {}) {
  const parsed = parseMotion(source, options);
  return stableValue({
    format: parsed.format,
    specVersion: parsed.specVersion,
    sourceHash: parsed.sourceHash,
    findings: parsed.findings,
    summary: parsed.summary,
  });
}

export { parseTimingFunction } from './design.mjs';
export { parseYaml, YamlLiteError } from './yaml-lite.mjs';
