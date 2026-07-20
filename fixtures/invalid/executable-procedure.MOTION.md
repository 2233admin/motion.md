---
version: "0.1"
name: Executable Procedure
posture: procedural
states:
  idle:
    description: Idle.
  active:
    description: Active.
events:
  activate:
    description: Activate.
    source: user
curves:
  unsafe:
    type: procedural
    expression: function(t) { return window.secret; }
    sample:
      rateHz: 60
      durationMs: 1000
timelines:
  unsafe-motion:
    description: Unsafe.
    driver:
      type: clock
    tracks:
      - target: panel
        property: visual.opacity
        curve: unsafe
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
transitions:
  activate-panel:
    from: idle
    to: active
    on: activate
    timeline: unsafe-motion
    interruption:
      policy: replace
    cancellation:
      policy: target
reducedMotion:
  strategy: instant
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 4
  maxConcurrentTracks: 2
  inputReadyMs: 0
  deterministic: false
provenance:
  - id: invalid-fixture
    kind: authored
    description: Intentionally invalid.
---

## Motion Thesis

Invalid fixture.
