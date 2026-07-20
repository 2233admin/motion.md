import { createHash } from 'node:crypto';
import { normalizeMotion, stableValue } from '../../motion-ir/src/index.mjs';
import { parseYaml, YamlLiteError } from './yaml-lite.mjs';
import { validateMotion } from './validate.mjs';

function parseSections(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const sections = [];
  const seen = new Set();
  let current = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (match) {
      const heading = match[1].trim();
      if (seen.has(heading)) {
        const error = new Error(`Duplicate Markdown section: ${heading}`);
        error.rule = 'duplicate-section';
        error.path = `/sections/${heading}`;
        throw error;
      }
      seen.add(heading);
      current = { heading, content: '' };
      sections.push(current);
      continue;
    }
    if (current) current.content += `${line}\n`;
  }

  return sections.map((section) => ({ ...section, content: section.content.trim() }));
}

function splitDocument(source) {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0] !== '---') return { yaml: null, markdown: normalized };
  const closing = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closing < 0) throw new YamlLiteError('Front matter is missing a closing --- delimiter', 1);
  return {
    yaml: lines.slice(1, closing).join('\n'),
    markdown: lines.slice(closing + 1).join('\n').replace(/^\n/, ''),
  };
}

export function parseMotion(source) {
  const findings = [];
  let frontmatter = null;
  let sections = [];

  try {
    const split = splitDocument(source);
    frontmatter = split.yaml === null ? null : parseYaml(split.yaml);
    sections = parseSections(split.markdown);
    findings.push(...validateMotion(frontmatter, sections));
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
  const ir = errors === 0 && frontmatter ? normalizeMotion(frontmatter, sections) : null;

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

export function lintMotion(source) {
  const parsed = parseMotion(source);
  return stableValue({
    format: parsed.format,
    specVersion: parsed.specVersion,
    sourceHash: parsed.sourceHash,
    findings: parsed.findings,
    summary: parsed.summary,
  });
}

export { parseYaml, YamlLiteError } from './yaml-lite.mjs';
