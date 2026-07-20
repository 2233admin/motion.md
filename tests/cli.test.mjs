import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const cli = resolve(root, 'packages/cli/bin/motionmd.mjs');

function run(...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
}

test('lint emits agent-readable JSON and success status', () => {
  const result = run('lint', 'examples/minimal/MOTION.md');
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.summary.errors, 0);
});

test('lint returns one for invalid documents', () => {
  const result = run('lint', 'fixtures/invalid/broken-reference.MOTION.md');
  assert.equal(result.status, 1);
  assert.ok(JSON.parse(result.stdout).summary.errors > 0);
});

test('parse emits normalized Motion IR', () => {
  const result = run('parse', 'examples/procedural/MOTION.md');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).ir.document.posture, 'procedural');
});

test('diff is formatting-neutral and reports no changes for identical documents', () => {
  const result = run('diff', 'examples/minimal/MOTION.md', 'examples/minimal/MOTION.md');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).summary, { added: 0, breaking: 0, modified: 0, removed: 0 });
});

test('spec emits Markdown and JSON Schema', () => {
  const markdown = run('spec');
  assert.equal(markdown.status, 0, markdown.stderr);
  assert.match(markdown.stdout, /MOTION\.md Format Specification v0\.1/);

  const schema = run('spec', '--format', 'json');
  assert.equal(schema.status, 0, schema.stderr);
  assert.equal(JSON.parse(schema.stdout).$schema, 'https://json-schema.org/draft/2020-12/schema');
});

test('schema source is valid JSON', () => {
  const schema = JSON.parse(readFileSync(resolve(root, 'schemas/motion.schema.json'), 'utf8'));
  assert.equal(schema.$id, 'https://motion.md/schemas/motion.schema.json');
});
