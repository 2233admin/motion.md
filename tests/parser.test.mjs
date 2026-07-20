import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { lintMotion, parseMotion, parseYaml } from '../packages/parser/src/index.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('all four reference documents parse into Motion IR without findings', () => {
  for (const path of [
    'examples/minimal/MOTION.md',
    'examples/expressive/MOTION.md',
    'examples/procedural/MOTION.md',
    'examples/reduced-motion/MOTION.md',
  ]) {
    const result = parseMotion(read(path));
    assert.deepEqual(result.summary, { errors: 0, info: 0, warnings: 0 }, path);
    assert.equal(result.ir.irVersion, '0.1');
    assert.equal(result.ir.specification, 'motion.md/0.1');
  }
});

test('static posture is an authored and conforming policy', () => {
  const result = lintMotion(read('fixtures/valid/static.MOTION.md'));
  assert.equal(result.summary.errors, 0);
  assert.equal(result.summary.warnings, 0);
});

test('broken references are reported with stable paths', () => {
  const result = lintMotion(read('fixtures/invalid/broken-reference.MOTION.md'));
  assert.equal(result.summary.errors, 2);
  assert.ok(result.findings.some((finding) => finding.rule === 'broken-ref' && finding.path === '/transitions/open/to'));
  assert.ok(result.findings.some((finding) => finding.rule === 'broken-ref' && finding.path === '/transitions/open/timeline'));
});

test('procedural expressions reject executable host-language content', () => {
  const result = lintMotion(read('fixtures/invalid/executable-procedure.MOTION.md'));
  assert.ok(result.findings.some((finding) => finding.rule === 'executable-content'));
  assert.equal(result.ir, undefined);
});

test('portable YAML parser supports nested mappings, sequences, comments, and JSON collections', () => {
  const parsed = parseYaml(`
name: Example # comment
enabled: true
values: [1, 2, 3]
items:
  - id: first
    amount: 2
  - id: second
    amount: 3
`);
  assert.deepEqual(parsed, {
    name: 'Example',
    enabled: true,
    values: [1, 2, 3],
    items: [
      { id: 'first', amount: 2 },
      { id: 'second', amount: 3 },
    ],
  });
});

test('portable YAML parser rejects anchors and duplicate keys', () => {
  assert.throws(() => parseYaml('value: &shared 1'));
  assert.throws(() => parseYaml('name: first\nname: second'));
});

test('URL scalars in sequences are not misread as mappings', () => {
  assert.deepEqual(parseYaml('sources:\n  - https://example.com/reference'), {
    sources: ['https://example.com/reference'],
  });
});

test('prose-only documents remain readable but warn about incomplete machine semantics', () => {
  const result = lintMotion('## Motion Thesis\n\nStillness is deliberate.\n');
  assert.equal(result.summary.errors, 0);
  assert.ok(result.findings.some((finding) => finding.rule === 'missing-frontmatter'));
});
