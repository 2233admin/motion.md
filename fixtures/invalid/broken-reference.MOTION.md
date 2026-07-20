---
version: "0.1"
name: Broken Reference
posture: minimal
states:
  idle:
    description: Idle.
events:
  activate:
    description: Activate.
    source: user
transitions:
  open:
    from: idle
    to: missing
    on: activate
    timeline: missing-timeline
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
  deterministic: true
provenance:
  - id: invalid-fixture
    kind: authored
    description: Intentionally invalid.
---

## Motion Thesis

Invalid fixture.
