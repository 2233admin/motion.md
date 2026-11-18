import { YamlLiteError } from './yaml-lite.mjs';

// CommonMark fences: up to three spaces of indentation; the info string's first word is the language.
const FENCE_OPEN = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})\s*(.*)$/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;

export function splitFrontmatter(source) {
  const normalized = source.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0] !== '---') return { yaml: null, markdown: normalized, bodyLine: 1 };
  const closing = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closing < 0) throw new YamlLiteError('Front matter is missing a closing --- delimiter', 1);
  return {
    yaml: lines.slice(1, closing).join('\n'),
    markdown: lines.slice(closing + 1).join('\n'),
    bodyLine: closing + 2,
  };
}

// Walk Markdown lines, tracking fenced code blocks so headings and references inside
// code are never interpreted as structure.
function scan(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let fence = null;
  for (const [index, line] of lines.entries()) {
    if (fence) {
      const close = line.match(FENCE_CLOSE);
      if (close && close[1][0] === fence.marker[0] && close[1].length >= fence.marker.length) {
        out.push({ index, line, kind: 'fence-close', fence });
        fence = null;
      } else {
        fence.lines.push(line);
        out.push({ index, line, kind: 'code', fence });
      }
      continue;
    }
    const open = line.match(FENCE_OPEN);
    if (open) {
      fence = { marker: open[1], info: (open[2].trim().split(/\s+/)[0] ?? '').toLowerCase(), lines: [], startIndex: index };
      out.push({ index, line, kind: 'fence-open', fence });
      continue;
    }
    out.push({ index, line, kind: 'text' });
  }
  if (fence) throw Object.assign(new Error('Unterminated fenced code block'), { rule: 'markdown-structure', path: '/' });
  return out;
}

/** Fenced ```yaml blocks are machine data, matching DESIGN.md interleaved token blocks. */
export function extractYamlBlocks(markdown) {
  const blocks = [];
  let heading = null;
  for (const item of scan(markdown)) {
    if (item.kind === 'text') {
      const match = item.line.match(/^##\s+(.+?)\s*#*\s*$/);
      if (match) heading = match[1].trim();
    }
    if (item.kind === 'fence-close' && ['yaml', 'yml'].includes(item.fence.info)) {
      blocks.push({ heading, yaml: item.fence.lines.join('\n'), startIndex: item.fence.startIndex });
    }
  }
  return blocks;
}

/** Second-level sections; prose excludes machine YAML blocks so intent and data never double count. */
export function parseSections(markdown) {
  const sections = [];
  const seen = new Set();
  let current = null;
  for (const item of scan(markdown)) {
    if (item.kind === 'text') {
      const match = item.line.match(/^##\s+(.+?)\s*#*\s*$/);
      if (match) {
        const heading = match[1].trim();
        if (seen.has(heading)) {
          throw Object.assign(new Error(`Duplicate Markdown section: ${heading}`), { rule: 'duplicate-section', path: `/sections/${heading}` });
        }
        seen.add(heading);
        current = { heading, lines: [] };
        sections.push(current);
        continue;
      }
    }
    if (!current) continue;
    if (['yaml', 'yml'].includes(item.fence?.info)) continue;
    current.lines.push(item.line);
  }
  return sections.map(({ heading, lines }) => ({ heading, content: lines.join('\n').trim() }));
}

const REFERENCE = /^@((?:[^\s#/`]+\/)*[^\s#/`]+\.[A-Za-z0-9]+)(?:#([^\s`]+))?$/;

/** Inline code spans whose whole content is `@path[#fragment]`, outside fenced code. */
export function findReferences(markdown) {
  const refs = [];
  let heading = null;
  for (const item of scan(markdown)) {
    if (item.kind !== 'text') continue;
    const match = item.line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (match) heading = match[1].trim();
    for (const span of item.line.matchAll(/(`+)([^`]+?)\1(?!`)/g)) {
      const content = span[2].trim();
      if (content.startsWith('@/')) {
        refs.push({ heading, raw: content, path: content.slice(1).split('#')[0], fragment: null, absolute: true });
        continue;
      }
      const ref = content.match(REFERENCE);
      if (ref) refs.push({ heading, raw: content, path: ref[1], fragment: ref[2] ?? null, absolute: false });
    }
  }
  return refs;
}

export function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

export function markdownAnchors(markdown) {
  const anchors = new Set();
  for (const item of scan(splitFrontmatter(markdown).markdown)) {
    if (item.kind !== 'text') continue;
    const match = item.line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match) anchors.add(slugify(match[1]));
  }
  return anchors;
}

export function htmlAnchors(html) {
  const anchors = new Set();
  for (const match of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) anchors.add(match[1]);
  for (const match of html.matchAll(/<!--\s*COMPONENT:\s*([^\s>]+)\s*-->/g)) anchors.add(match[1]);
  return anchors;
}
