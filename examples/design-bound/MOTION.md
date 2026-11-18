---
version: "0.2"
name: Harbor Ledger Detail Sheet
description: A transaction detail sheet whose timing vocabulary comes from DESIGN.md.
posture: minimal
design: DESIGN.md
states:
  closed:
    description: The ledger table owns the screen; no detail is shown.
    invariants: ["table scroll position is stable"]
  open:
    description: The detail sheet shows one transaction beside the table.
    invariants: ["selected row remains visible", "focus is inside the sheet"]
events:
  open-detail:
    description: The user selects a transaction row.
    source: user
  close-detail:
    description: The user dismisses the sheet or presses Escape.
    source: user
timelines:
  sheet-enter:
    description: The sheet arrives from the edge it is anchored to, then its figures settle.
    driver:
      type: clock
    tracks:
      - target: detail-sheet
        property: spatial.translate-x
        timing: "{motion.surface-enter}"
        keyframes:
          - at: 0
            value: 24
          - at: 1
            value: 0
      - target: detail-sheet
        property: visual.opacity
        timing: "{motion.surface-enter}"
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
      - target: detail-figures
        property: visual.opacity
        timing: "{motion.state-change}"
        startMs: 120
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 1
  sheet-exit:
    description: The sheet leaves as one surface; figures do not get their own beat.
    driver:
      type: clock
    tracks:
      - target: detail-sheet
        property: spatial.translate-x
        timing: "{motion.surface-exit}"
        keyframes:
          - at: 0
            value: 0
          - at: 1
            value: 24
      - target: detail-sheet
        property: visual.opacity
        timing: "{motion.surface-exit}"
        keyframes:
          - at: 0
            value: 1
          - at: 1
            value: 0
transitions:
  open-sheet:
    from: closed
    to: open
    on: open-detail
    timeline: sheet-enter
    interruption:
      policy: reverse
    cancellation:
      policy: nearest
  close-sheet:
    from: open
    to: closed
    on: close-detail
    timeline: sheet-exit
    interruption:
      policy: replace
    cancellation:
      policy: target
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 3
  maxConcurrentTracks: 3
  inputReadyMs: 0
  allowedProperties: ["transform", "opacity"]
  forbiddenProperties: ["layout"]
  deterministic: true
provenance:
  - id: ledger-sheet
    kind: authored
    description: Original choreography for the detail sheet.
  - id: design-timing
    kind: derived
    source: DESIGN.md
    description: Durations and easing come from the DESIGN.md motion tokens.
---

## Motion Thesis

The sheet is a reading surface, not an event. It arrives fast enough that selecting a row feels like opening it, and leaves faster than it came.

## Motion Principles

- Timing values belong to the brand: `@DESIGN.md#motion--micro-interaction` owns them, this file only decides who uses which.
- The selected row never moves.
- Figures fade in after the sheet edge has mostly landed so the eye reads position first, numbers second.

## Hierarchy and Choreography

The sheet travels and fades as one surface using `surface-enter`. Figures are a second, smaller beat using `state-change`, offset by 120 milliseconds. Exit is a single beat with `surface-exit`.

## Interruption

Closing while the sheet is arriving reverses from current progress. Selecting a different row while open does not animate the sheet; only the content swaps.

## Reduced Motion

Spatial travel is removed. The sheet opens with a crossfade and closes instantly; focus moves the same way in both modes.

```yaml
reducedMotion:
  strategy: substitute
  substitutions:
    open-sheet:
      mode: crossfade
      preserves: ["state", "content", "focus"]
    close-sheet:
      mode: instant
      preserves: ["state", "focus", "input"]
```

## Performance

Only transform and opacity animate. The sheet's layout is committed before the first frame.

## Provenance

Choreography is authored here. Every duration and curve is derived from DESIGN.md.
