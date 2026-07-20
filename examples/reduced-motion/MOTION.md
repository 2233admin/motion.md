---
version: "0.1"
name: Semantic Detail Navigation
description: Spatial continuity in the default mode and a non-spatial state-preserving substitution when motion is reduced.
posture: expressive
defaults:
  durationMs: 360
  delayMs: 0
  curve: spatial
states:
  collection:
    description: A collection and its current selection are visible.
    invariants: ["selection is identified", "keyboard focus is visible"]
  detail:
    description: The selected item detail is visible and owns reading focus.
    invariants: ["selection is identified", "back action is available", "keyboard focus is visible"]
events:
  open-detail:
    description: The user opens the selected item.
    source: user
  close-detail:
    description: The user returns to the collection.
    source: user
curves:
  spatial:
    type: cubic-bezier
    value: [0.16, 1, 0.3, 1]
  crossfade:
    type: linear
timelines:
  travel-to-detail:
    description: Preserve spatial continuity between the selected item and its detail surface.
    driver:
      type: clock
    durationMs: 360
    tracks:
      - target: detail-surface
        property: spatial.scale
        curve: spatial
        keyframes:
          - at: 0
            value: 0.94
          - at: 1
            value: 1
      - target: detail-surface
        property: visual.opacity
        curve: spatial
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
  travel-to-collection:
    description: Return to the collection while preserving the selected item's location.
    driver:
      type: clock
    durationMs: 260
    tracks:
      - target: detail-surface
        property: spatial.scale
        curve: spatial
        keyframes:
          - at: 0
            value: 1
          - at: 1
            value: 0.96
      - target: detail-surface
        property: visual.opacity
        curve: spatial
        keyframes:
          - at: 0
            value: 1
          - at: 1
            value: 0
  detail-crossfade:
    description: Remove spatial travel while retaining a short continuity cue.
    driver:
      type: clock
    durationMs: 100
    tracks:
      - target: detail-surface
        property: visual.opacity
        curve: crossfade
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
  collection-crossfade:
    description: Return without spatial scaling.
    driver:
      type: clock
    durationMs: 80
    tracks:
      - target: detail-surface
        property: visual.opacity
        curve: crossfade
        keyframes:
          - at: 0
            value: 1
          - at: 1
            value: 0
transitions:
  enter-detail:
    from: collection
    to: detail
    on: open-detail
    timeline: travel-to-detail
    interruption:
      policy: reverse
    cancellation:
      policy: nearest
  exit-detail:
    from: detail
    to: collection
    on: close-detail
    timeline: travel-to-collection
    interruption:
      policy: reverse
    cancellation:
      policy: nearest
reducedMotion:
  strategy: substitute
  substitutions:
    enter-detail:
      mode: timeline
      timeline: detail-crossfade
      preserves: ["state", "content", "focus", "selection", "continuity", "input"]
      reason: A brief opacity handoff preserves context without spatial travel or scale.
    exit-detail:
      mode: timeline
      timeline: collection-crossfade
      preserves: ["state", "content", "focus", "selection", "continuity", "input"]
      reason: The collection is restored without spatial motion.
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 3
  maxConcurrentTracks: 3
  inputReadyMs: 0
  allowedProperties: ["transform", "opacity"]
  forbiddenProperties: ["layout", "large-filter"]
  deterministic: true
provenance:
  - id: accessibility-direction
    kind: authored
    description: Original semantic substitution example for reduced motion.
---

## Motion Thesis

Default navigation uses a small amount of spatial continuity to connect a selected item with its detail. Reduced motion keeps the same relationship through a short opacity handoff, proving that accessibility is a semantic substitution rather than a blanket deletion afterthought.

## Motion Principles

- The selected item remains identifiable before, during, and after navigation.
- Focus moves according to state, never according to animation completion.
- Spatial scale is optional; state continuity is required.
- No meaning depends on movement.

## Hierarchy and Choreography

The detail surface is the only moving layer. Collection content does not scatter, parallax, or wait in a stagger.

## Interruption

Open and close reverse from current progress. The newest navigation event decides the destination and focus target.

## Reduced Motion

Spatial scale is removed. Two short opacity-only timelines preserve state, content, selection, focus, input authority, and continuity.

## Performance

Default and reduced modes remain within three compositor-friendly tracks, with input available immediately.

## Provenance

This is an original conformance example centered on semantic reduced-motion substitution.
