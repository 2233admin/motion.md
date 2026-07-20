---
version: "0.1"
name: Seeded Signal Field
description: A deterministic ambient signal that becomes calmer during direct interaction.
posture: procedural
defaults:
  durationMs: 2400
  delayMs: 0
  curve: breathing-field
states:
  ambient:
    description: The signal field communicates background system activity.
    invariants: ["data remains readable", "motion carries no exclusive meaning"]
  focused:
    description: Direct interaction has authority and ambient energy is reduced.
    invariants: ["data remains readable", "focus target remains stable"]
events:
  focus-enter:
    description: The user begins direct interaction with the field.
    source: user
  focus-leave:
    description: Direct interaction ends.
    source: user
curves:
  breathing-field:
    type: procedural
    expression: 0.5 + 0.5 * sin(6.283185 * progress)
    parameters:
      amplitude: 0.5
    seed: 2048
    sample:
      rateHz: 60
      durationMs: 2400
  settle:
    type: cubic-bezier
    value: [0.2, 0, 0, 1]
timelines:
  ambient-cycle:
    description: Sample a bounded phase signal without moving content or changing task state.
    driver:
      type: clock
    durationMs: 2400
    tracks:
      - target: signal-field
        property: visual.emphasis
        curve: breathing-field
        keyframes:
          - at: 0
            value: 0.18
          - at: 1
            value: 0.3
  focus-settle:
    description: Reduce ambient emphasis when direct input takes authority.
    driver:
      type: clock
    durationMs: 160
    tracks:
      - target: signal-field
        property: visual.emphasis
        curve: settle
        keyframes:
          - at: 0
            value: 0.24
          - at: 1
            value: 0.08
  ambient-resume:
    description: Return to the deterministic ambient phase after focus leaves.
    driver:
      type: clock
    durationMs: 200
    tracks:
      - target: signal-field
        property: visual.emphasis
        curve: settle
        keyframes:
          - at: 0
            value: 0.08
          - at: 1
            value: 0.18
transitions:
  gain-focus:
    from: ambient
    to: focused
    on: focus-enter
    timeline: focus-settle
    interruption:
      policy: replace
    cancellation:
      policy: target
  lose-focus:
    from: focused
    to: ambient
    on: focus-leave
    timeline: ambient-resume
    interruption:
      policy: replace
    cancellation:
      policy: target
reducedMotion:
  strategy: substitute
  substitutions:
    gain-focus:
      mode: instant
      preserves: ["state", "content", "focus", "input"]
    lose-focus:
      mode: instant
      preserves: ["state", "content", "focus", "input"]
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 2
  maxConcurrentTracks: 2
  inputReadyMs: 0
  allowedProperties: ["opacity", "compositor-scalar"]
  forbiddenProperties: ["layout", "large-filter"]
  deterministic: true
provenance:
  - id: procedural-direction
    kind: authored
    description: Original deterministic signal behavior for the example.
  - id: deterministic-evidence
    kind: derived
    description: Sampling and seed requirements are derived from the need for matched-clock evidence.
    source: motion.md v0.1 deterministic playback policy
---

## Motion Thesis

The field behaves like a quiet instrument trace: alive enough to indicate ongoing activity, bounded enough to disappear behind direct work. It never resembles confetti, particles, or decorative noise.

## Motion Principles

- Procedural output is reproducible from declared inputs.
- The amplitude is subordinate to text and direct manipulation.
- Focus immediately reduces ambient energy.
- The signal never carries status that is unavailable in text.

## Hierarchy and Choreography

Only one ambient scalar is sampled. Consumers may map it to a supported property, but may not invent extra particles, random paths, or independent phases.

## Interruption

Focus events replace ambient authority immediately. The ambient clock may continue internally, but no delayed sample can overwrite the focused state.

## Reduced Motion

The ambient cycle is disabled by the consumer. Focus state changes remain instant and all status information remains visible without the signal.

## Performance

Sampling is capped at 60 Hz and two concurrent scalar tracks. Evidence uses the declared seed, duration, and sample clock.

## Provenance

The behavior and expression are original. The deterministic contract is derived from verification requirements, not copied from a rendering recipe.
