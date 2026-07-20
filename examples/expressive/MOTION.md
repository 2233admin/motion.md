---
version: "0.1"
name: Editorial Reveal
description: A confident editorial expansion with one hero beat and restrained supporting motion.
posture: expressive
defaults:
  durationMs: 420
  delayMs: 0
  curve: enter
states:
  collapsed:
    description: The story summary is readable and the detail region is closed.
    invariants: ["headline remains readable", "trigger retains focus"]
  expanded:
    description: The full story is visible and ready to read.
    invariants: ["headline remains readable", "trigger retains focus", "body is selectable"]
events:
  open-story:
    description: The user requests the full story.
    source: user
  close-story:
    description: The user returns to the summary.
    source: user
curves:
  enter:
    type: spring
    mass: 1
    stiffness: 230
    damping: 28
    initialVelocity: 0
    settle:
      positionEpsilon: 0.001
      velocityEpsilon: 0.001
      maxDurationMs: 700
  exit:
    type: cubic-bezier
    value: [0.4, 0, 1, 1]
timelines:
  expand-story:
    description: Establish the story panel first, then let metadata follow as a supporting beat.
    driver:
      type: clock
    durationMs: 520
    tracks:
      - target: story-panel
        property: spatial.translate-y
        curve: enter
        durationMs: 520
        keyframes:
          - at: 0
            value: 28
          - at: 1
            value: 0
      - target: story-panel
        property: visual.opacity
        curve: enter
        durationMs: 360
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
      - target: story-metadata
        property: visual.opacity
        curve: enter
        startMs: 90
        durationMs: 280
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
  collapse-story:
    description: Remove supporting detail first and settle the panel without rebound.
    driver:
      type: clock
    durationMs: 260
    tracks:
      - target: story-panel
        property: spatial.translate-y
        curve: exit
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 16
      - target: story-panel
        property: visual.opacity
        curve: exit
        keyframes:
          - at: 0
            value: 1
          - at: 1
            value: 0
transitions:
  expand:
    from: collapsed
    to: expanded
    on: open-story
    timeline: expand-story
    interruption:
      policy: reverse
    cancellation:
      policy: nearest
  collapse:
    from: expanded
    to: collapsed
    on: close-story
    timeline: collapse-story
    interruption:
      policy: replace
    cancellation:
      policy: target
reducedMotion:
  strategy: substitute
  substitutions:
    expand:
      mode: crossfade
      preserves: ["state", "content", "focus", "continuity"]
      reason: Preserve the editorial handoff while removing spatial travel and spring response.
    collapse:
      mode: instant
      preserves: ["state", "content", "focus", "input"]
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 4
  maxConcurrentTracks: 6
  inputReadyMs: 0
  allowedProperties: ["transform", "opacity"]
  forbiddenProperties: ["layout", "large-filter"]
  deterministic: true
provenance:
  - id: editorial-direction
    kind: authored
    description: Original hierarchy and choreography for the reference example.
---

## Motion Thesis

Opening a story should feel like unfolding a well-made editorial insert: one confident spatial beat establishes the reading surface, then small metadata appears in support. The movement is expressive because the content deserves ceremony, not because every element needs animation.

## Motion Principles

- The story panel is the hero; metadata is support.
- Content becomes readable before the spring reaches its settle threshold.
- Exit is shorter and does not rebound.
- No unrelated page region participates.

## Hierarchy and Choreography

Panel position and opacity begin together. Metadata waits 90 milliseconds so it cannot compete with the panel edge. There is no per-word or per-line stagger.

## Interruption

Closing during expansion reverses from the current semantic progress. A later close replaces any older completion callback and returns focus ownership to the trigger.

## Reduced Motion

Expansion becomes a brief non-spatial crossfade; collapse commits instantly. The reading state and focus relationship do not change.

## Performance

At most three transform/opacity tracks overlap. The panel's layout is committed before interpolation and is not animated as a layout property.

## Provenance

The example is original and demonstrates the expressive posture without prescribing a runtime implementation.
