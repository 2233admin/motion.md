---
version: "0.1"
name: Authored Stillness
description: A deliberately static product surface.
posture: static
reducedMotion:
  strategy: instant
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 0
  maxConcurrentTracks: 1
  inputReadyMs: 0
  allowedProperties: []
  forbiddenProperties: ["layout", "transform", "opacity"]
  deterministic: true
provenance:
  - id: stillness-policy
    kind: authored
    description: Motion is intentionally absent because immediate comparison is the product priority.
---

## Motion Thesis

The surface is deliberately still so values can be compared without temporal displacement.

## Motion Principles

No state change uses interpolation.

## Hierarchy and Choreography

Hierarchy is expressed visually, not temporally.

## Interruption

Every event commits its destination synchronously.

## Reduced Motion

The reduced and default experiences are identical.

## Performance

No animation work is scheduled.

## Provenance

The stillness policy is authored for this fixture.
