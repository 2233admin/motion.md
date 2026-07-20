---
version: "0.1"
name: Quiet Control Surface
description: Immediate operational feedback with short distance and no decorative entrance motion.
posture: minimal
defaults:
  durationMs: 140
  delayMs: 0
  curve: standard
states:
  idle:
    description: The control is available and not selected.
    invariants: ["label remains readable", "focus remains stable"]
  active:
    description: The control is selected and its result is committed.
    invariants: ["label remains readable", "focus remains stable"]
events:
  activate:
    description: The user activates the control.
    source: user
  deactivate:
    description: The user activates the selected control again.
    source: user
curves:
  standard:
    type: cubic-bezier
    value: [0.2, 0, 0, 1]
timelines:
  engage:
    description: Confirm selection without delaying the result.
    driver:
      type: clock
    durationMs: 140
    tracks:
      - target: control
        property: visual.opacity
        curve: standard
        keyframes:
          - at: 0
            value: 0.72
          - at: 1
            value: 1
      - target: control
        property: spatial.translate-y
        curve: standard
        keyframes:
          - at: 0
            value: 2
          - at: 1
            value: 0
  disengage:
    description: Return to the available state with the same quiet weight.
    driver:
      type: clock
    durationMs: 110
    tracks:
      - target: control
        property: visual.opacity
        curve: standard
        keyframes:
          - at: 0
            value: 1
          - at: 1
            value: 0.72
transitions:
  become-active:
    description: Commit selection immediately and confirm it visually.
    from: idle
    to: active
    on: activate
    timeline: engage
    interruption:
      policy: reverse
    cancellation:
      policy: nearest
  become-idle:
    description: Remove selection without queuing old input.
    from: active
    to: idle
    on: deactivate
    timeline: disengage
    interruption:
      policy: reverse
    cancellation:
      policy: nearest
reducedMotion:
  strategy: substitute
  substitutions:
    become-active:
      mode: instant
      preserves: ["state", "content", "focus", "input"]
    become-idle:
      mode: instant
      preserves: ["state", "content", "focus", "input"]
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 3
  maxConcurrentTracks: 4
  inputReadyMs: 0
  allowedProperties: ["transform", "opacity"]
  forbiddenProperties: ["layout"]
  deterministic: true
provenance:
  - id: product-intent
    kind: authored
    description: Original motion direction for a repeated operational control.
---

## Motion Thesis

State changes feel like a quiet instrument panel. Feedback begins with the user's input, travels no farther than needed to confirm the new state, and never competes with repeated work.

## Motion Principles

- The state commits before the confirmation finishes.
- Selection is readable without motion.
- No control waits for another control's animation.
- Opacity supports hierarchy; it never hides the active label.

## Hierarchy and Choreography

Only the activated control moves. There is no page entrance, list stagger, or decorative ambient layer.

## Interruption

The newest activation is authoritative. A reversal continues from the current sampled value and settles toward the latest state.

## Reduced Motion

Selection commits instantly. Label, focus, input authority, and result content remain identical.

## Performance

The motion is bounded to two short tracks. Content and input are available at time zero.

## Provenance

This system is authored for the example. It is not copied from a runtime library or reference implementation.
