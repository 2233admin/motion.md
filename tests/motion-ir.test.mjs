import assert from 'node:assert/strict';
import test from 'node:test';
import { diffMotion, normalizeMotion, stableStringify } from '../packages/motion-ir/src/index.mjs';

function document(overrides = {}) {
  return {
    version: '0.1',
    name: 'Example',
    posture: 'minimal',
    states: {
      idle: { description: 'Idle.' },
      active: { description: 'Active.' },
    },
    events: { activate: { description: 'Activate.', source: 'user' } },
    curves: { standard: { type: 'linear' } },
    timelines: {
      engage: {
        description: 'Engage.',
        driver: { type: 'clock' },
        tracks: [{
          target: 'control',
          property: 'visual.opacity',
          curve: 'standard',
          keyframes: [{ at: 0, value: 0 }, { at: 1, value: 1 }],
        }],
      },
    },
    transitions: {
      engage: {
        from: 'idle', to: 'active', on: 'activate', timeline: 'engage',
        interruption: { policy: 'replace' },
        cancellation: { policy: 'target' },
      },
    },
    reducedMotion: { strategy: 'instant' },
    performance: {
      targetFps: 60,
      maxMainThreadMsPerFrame: 4,
      maxConcurrentTracks: 2,
      inputReadyMs: 0,
      deterministic: true,
    },
    provenance: [{ id: 'authored', kind: 'authored', description: 'Original.' }],
    ...overrides,
  };
}

test('normalization sorts named maps while preserving authored track order', () => {
  const ir = normalizeMotion(document(), [{ heading: 'Motion Thesis', content: 'Immediate.' }]);
  assert.deepEqual(ir.graph.states.map((state) => state.id), ['active', 'idle']);
  assert.equal(ir.timelines[0].tracks[0].target, 'control');
  assert.equal(stableStringify(ir), stableStringify(normalizeMotion(document(), [{ heading: 'Motion Thesis', content: 'Immediate.' }])));
});

test('transition contract changes are breaking', () => {
  const before = normalizeMotion(document());
  const changed = document();
  changed.transitions.engage.to = 'idle';
  const result = diffMotion(before, normalizeMotion(changed));
  assert.equal(result.breaking, true);
  assert.ok(result.breakingChanges.some((change) => change.path === '/graph/transitions/engage/to'));
});

test('adding an extension is visible but not automatically breaking', () => {
  const before = normalizeMotion(document());
  const result = diffMotion(before, normalizeMotion(document({ 'x-example': { note: 'consumer-owned' } })));
  assert.equal(result.breaking, false);
  assert.equal(result.summary.added, 1);
});
