import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { diffMotion } from '../packages/motion-ir/src/index.mjs';
import { lintMotion, parseMotion, parseTimingFunction } from '../packages/parser/src/index.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const DESIGN = `---
version: alpha
name: Test
colors:
  primary: "#000000"
motion:
  surface-enter:
    duration: 250ms
    delay: 40ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  sm:
    tap:
      duration: 80ms
---

## Motion & Micro-interaction

Quick.
`;

const SECTIONS = ['Motion Thesis', 'Motion Principles', 'Hierarchy and Choreography', 'Interruption', 'Reduced Motion', 'Performance', 'Provenance'];

function files(extra = {}) {
  const map = { 'DESIGN.md': DESIGN, ...extra };
  return { resolveFile: (path) => map[path] ?? null };
}

function doc({ track = { timing: '{motion.surface-enter}' }, root: rootFields = {}, body = '', sections = SECTIONS } = {}) {
  const frontmatter = {
    version: '0.2',
    name: 'Test',
    posture: 'minimal',
    design: 'DESIGN.md',
    states: { closed: { description: 'Closed.' }, open: { description: 'Open.' } },
    events: { toggle: { description: 'Toggle.', source: 'user' } },
    curves: { standard: { type: 'cubic-bezier', value: [0.2, 0, 0, 1] } },
    timelines: {
      reveal: {
        description: 'Reveal.',
        driver: { type: 'clock' },
        tracks: [{ target: 'panel', property: 'visual.opacity', keyframes: [{ at: 0, value: 0 }, { at: 1, value: 1 }], ...track }],
      },
    },
    transitions: {
      open: { from: 'closed', to: 'open', on: 'toggle', timeline: 'reveal', interruption: { policy: 'reverse' }, cancellation: { policy: 'nearest' } },
    },
    reducedMotion: { strategy: 'instant' },
    performance: { targetFps: 60, maxMainThreadMsPerFrame: 3, maxConcurrentTracks: 1, inputReadyMs: 0, deterministic: true },
    provenance: [{ id: 'test', kind: 'authored', description: 'Test.' }],
    ...rootFields,
  };
  for (const [key, value] of Object.entries(frontmatter)) if (value === undefined) delete frontmatter[key];
  const prose = sections.map((heading) => `## ${heading}\n\nText.\n`).join('\n');
  return `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${prose}\n${body}`;
}

const rules = (result) => result.findings.map((finding) => `${finding.severity}:${finding.rule}`);

test('the design-bound example resolves DESIGN.md motion tokens into Motion IR', () => {
  const result = parseMotion(read('examples/design-bound/MOTION.md'), {
    resolveFile: (path) => read(`examples/design-bound/${path}`),
  });
  assert.deepEqual(result.summary, { errors: 0, info: 0, warnings: 0 });
  assert.equal(result.ir.design.path, 'DESIGN.md');
  const figures = result.ir.timelines.find((t) => t.id === 'sheet-enter').tracks[2];
  assert.deepEqual([figures.timing, figures.durationMs, figures.startMs, figures.curve], ['motion.state-change', 100, 120, 'motion.state-change']);
  assert.deepEqual(result.ir.curves.find((c) => c.id === 'motion.state-change'), { id: 'motion.state-change', origin: 'design', type: 'cubic-bezier', value: [0, 0, 0.58, 1] });
  assert.equal(result.ir.policies.reducedMotion.strategy, 'substitute', 'interleaved yaml block is machine data');
  assert.doesNotMatch(result.ir.intent.sections.find((s) => s.heading === 'Reduced Motion').content, /strategy/);
});

test('token delay is added to the authored choreography offset; grouped tokens use dot paths', () => {
  const offset = parseMotion(doc({ track: { timing: '{motion.surface-enter}', startMs: 60 } }), files());
  const track = offset.ir.timelines[0].tracks[0];
  assert.deepEqual([track.durationMs, track.startMs], [250, 100]);

  const grouped = parseMotion(doc({ track: { timing: '{motion.sm.tap}' } }), files());
  assert.equal(grouped.summary.errors, 0);
  assert.deepEqual(grouped.ir.curves.find((c) => c.id === 'motion.sm.tap').value, [0.25, 0.1, 0.25, 1], 'CSS default timing function is ease');
});

test('timing references fail when the token, the design file, or the binding is missing', () => {
  assert.ok(rules(lintMotion(doc({ track: { timing: '{motion.nope}' } }), files())).includes('error:broken-ref'));
  assert.ok(rules(lintMotion(doc(), { resolveFile: () => null })).includes('error:broken-ref'));
  assert.ok(rules(lintMotion(doc({ root: { design: undefined } }), files())).includes('error:broken-ref'));
  assert.ok(rules(lintMotion(doc())).includes('error:unresolved-design'));
  assert.ok(rules(lintMotion(doc({ track: { timing: 'surface-enter' } }), files())).includes('error:timing-ref'));
});

test('timing and literal timing fields together are two sources of truth', () => {
  const result = lintMotion(doc({ track: { timing: '{motion.surface-enter}', durationMs: 250, curve: 'standard' } }), files());
  assert.deepEqual(result.findings.filter((f) => f.rule === 'timing-conflict').map((f) => f.path), [
    '/timelines/reveal/tracks/0/durationMs',
    '/timelines/reveal/tracks/0/curve',
  ]);
});

test('literal values equal to a design token produce an info finding', () => {
  const result = lintMotion(doc({ track: { durationMs: 250, curve: 'standard' } }), files({ 'DESIGN.md': DESIGN.replace('delay: 40ms', 'delay: 0ms') }));
  assert.deepEqual(rules(result), ['info:prefer-design-token']);
});

test('design path must stay inside the MOTION.md directory', () => {
  for (const design of ['../DESIGN.md', '/DESIGN.md', 'design.json']) {
    assert.ok(rules(lintMotion(doc({ root: { design } }), files())).includes('error:design-path'), design);
  }
});

test('unsupported DESIGN.md timing functions are reported, not approximated', () => {
  const design = DESIGN.replace('cubic-bezier(0.2, 0, 0, 1)', 'linear(0, 0.5 50%, 1)');
  assert.ok(rules(lintMotion(doc(), files({ 'DESIGN.md': design }))).includes('error:unsupported-timing-function'));
});

test('CSS easing keywords map to the curve model', () => {
  assert.deepEqual(parseTimingFunction('linear'), { type: 'linear' });
  assert.deepEqual(parseTimingFunction('ease-in-out'), { type: 'cubic-bezier', value: [0.42, 0, 0.58, 1] });
  assert.deepEqual(parseTimingFunction('steps(4, jump-both)'), { type: 'steps', count: 4, jump: 'both' });
  assert.deepEqual(parseTimingFunction('step-start'), { type: 'steps', count: 1, jump: 'start' });
  assert.equal(parseTimingFunction('cubic-bezier(1.2, 0, 0, 1)'), null);
  assert.equal(parseTimingFunction('steps(1, jump-none)'), null);
});

test('a DESIGN.md token change shows up in the semantic diff', () => {
  const before = parseMotion(doc(), files()).ir;
  const after = parseMotion(doc(), files({ 'DESIGN.md': DESIGN.replace('250ms', '300ms') })).ir;
  const paths = diffMotion(before, after).changes.modified.map((change) => change.path);
  assert.ok(paths.includes('/timelines/reveal/tracks/0/durationMs'));
  assert.ok(paths.includes('/design/sourceHash'));
});

test('a top-level key may be defined once across front matter and yaml blocks', () => {
  const body = '## Extra\n\n```yaml\nreducedMotion:\n  strategy: instant\n```\n';
  assert.ok(rules(lintMotion(doc({ body }), files())).includes('error:duplicate-key'));
});

test('headings inside fenced code are not sections', () => {
  const body = '## Notes\n\n```md\n## Motion Thesis\n```\n';
  const result = parseMotion(doc({ body }), files());
  assert.equal(result.summary.errors, 0);
  assert.equal(result.sections.filter((s) => s.heading === 'Motion Thesis').length, 1);
});

test('external @-references follow DESIGN.md resolution and severity rules', () => {
  const body = [
    '## References',
    '',
    'Good `@DESIGN.md#motion--micro-interaction`, missing `@clips/open.mp4`, bad anchor `@DESIGN.md#nope`,',
    'html `@kit/sheet.html#detail-sheet`, source `@src/sheet.tsx#Sheet`, absolute `@/etc/x.md`, escaping `@../x.md`,',
    'not references: `@media`, `@scope/package`, @DESIGN.md.',
    '',
    '```text',
    '`@inside/fence.md`',
    '```',
    '',
  ].join('\n');
  const result = lintMotion(doc({ body }), files({
    'kit/sheet.html': '<!-- COMPONENT: detail-sheet --><div></div>',
    'src/sheet.tsx': 'export function Sheet() {}',
  }));
  const refs = result.findings.filter((f) => f.rule === 'broken-ref').map((f) => `${f.severity}:${f.path.split('/references/')[1]}`);
  assert.deepEqual(refs.sort(), [
    'error:@../x.md',
    'error:@/etc/x.md',
    'info:@src/sheet.tsx#Sheet',
    'warning:@DESIGN.md#nope',
    'warning:@clips/open.mp4',
  ]);
});

test('omitted sections suppress missing-section warnings and are themselves checked', () => {
  const without = SECTIONS.filter((heading) => heading !== 'Hierarchy and Choreography');
  assert.ok(rules(lintMotion(doc({ sections: without }), files())).includes('warning:missing-section'));

  const omitted = [{ section: 'hierarchy-and-choreography', reason: 'Single-element surface.' }];
  assert.deepEqual(rules(lintMotion(doc({ sections: without, root: { omitted } }), files())), []);

  const noisy = lintMotion(doc({ root: { omitted: ['performance', 'choreography'] } }), files());
  assert.deepEqual(rules(noisy).sort(), ['warning:redundant-omission', 'warning:unknown-omission']);
});

test('fences with info strings or up to three spaces of indentation are code, not structure', () => {
  const body = '## Notes\n\n```js title="demo"\n## Motion Thesis\n```\n\n   ~~~\n## Motion Principles\n   ~~~\n';
  const result = parseMotion(doc({ body }), files());
  assert.equal(result.summary.errors, 0, JSON.stringify(result.findings));
});

test('inline and JSON motion tokens in DESIGN.md are read', () => {
  const inline = '---\nname: Inline\nmotion: {"surface-enter": {"duration": "250ms"}}\n---\n';
  assert.equal(lintMotion(doc(), files({ 'DESIGN.md': inline })).summary.errors, 0);
  const json = '---\n{"name": "Json", "motion": {"surface-enter": {"duration": "250ms"}}}\n---\n';
  assert.equal(lintMotion(doc(), files({ 'DESIGN.md': json })).summary.errors, 0);
  const nonPortable = '---\nname: Odd\ndescription: >\n  folded text\nmotion:\n  surface-enter:\n    duration: 250ms\n---\n';
  assert.equal(lintMotion(doc(), files({ 'DESIGN.md': nonPortable })).summary.errors, 0, 'other DESIGN.md YAML may be non-portable');
});

test('review hardening: delayed tokens are not suggested, malformed easing and omissions are rejected', () => {
  assert.deepEqual(rules(lintMotion(doc({ track: { durationMs: 250, curve: 'standard' } }), files())), [], 'token delay 40ms would move the start');
  for (const value of ['constructor', 'cubic-bezier(, 0, , 1)', 'steps(2, constructor)']) assert.equal(parseTimingFunction(value), null, value);
  assert.ok(rules(lintMotion(doc({ root: { omitted: [null] } }), files())).includes('error:type'));
});

test('trailing-dot numbers and repeated motion keys in one block are rejected', () => {
  assert.equal(parseTimingFunction('cubic-bezier(0, 1., 0, 1)'), null);
  const repeated = '---\nname: Twice\nmotion:\n  surface-enter:\n    duration: 250ms\nmotion:\n  other:\n    duration: 1ms\n---\n';
  assert.ok(rules(lintMotion(doc(), files({ 'DESIGN.md': repeated }))).includes('error:design-motion'));
});
