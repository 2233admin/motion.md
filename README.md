# MOTION.md

A format specification for describing motion graphics and frontend animation intent, timing, and behavior to coding agents. `MOTION.md` gives agents a persistent, structured understanding of how a product interface moves.

用于向编程 Agent 描述运动图形（motion graphics）与前端动画（animation）意图、时序和行为的格式规范。`MOTION.md` 让 Agent 持续、结构化地理解产品界面中的动画应该如何呈现、响应和降级。

**English** · [简体中文](README.zh-CN.md)

[Specification](docs/spec.md) · [JSON Schema](schemas/motion.schema.json) · [Examples](examples) · [v0.2 release notes](docs/releases/v0.2.0.md)

## The Format

A `MOTION.md` file combines machine-readable motion semantics in YAML (front matter, or ` ```yaml ` blocks interleaved into the sections they belong to) with human-readable design intent in Markdown prose.

The YAML defines exact states, events, transitions, timelines, curves, interruption rules, accessibility substitutions, and performance budgets. The prose explains why those rules exist, what the motion should communicate, and where restraint matters.

<details>
<summary>View a minimal <code>MOTION.md</code> example</summary>

```md
---
version: "0.2"
name: Quiet Feedback
posture: minimal
states:
  idle: { "description": "The control is ready." }
  active: { "description": "The control is selected." }
events:
  activate: { "description": "The user activates the control.", "source": "user" }
transitions:
  become-active:
    from: idle
    to: active
    on: activate
    mode: instant
    interruption: { "policy": "replace" }
    cancellation: { "policy": "target" }
reducedMotion:
  strategy: instant
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 3
  maxConcurrentTracks: 1
  inputReadyMs: 0
  deterministic: true
provenance:
  - id: product-intent
    kind: authored
    description: Original motion direction.
---

## Motion Thesis

Feedback begins with the user's input and never delays the result.

## Motion Principles

- State commits before confirmation finishes.

## Hierarchy and Choreography

Only the activated control responds.

## Interruption

The newest input is authoritative.

## Reduced Motion

State and content remain readable without interpolation.

## Performance

Input remains available at time zero.

## Provenance

This motion direction is authored for the product.

```

</details>

An agent reading this file knows which state owns the result, which event causes the change, how interruption is resolved, what reduced motion preserves, and which performance limits must survive runtime selection.

See the [minimal](examples/minimal/MOTION.md), [expressive](examples/expressive/MOTION.md), [procedural](examples/procedural/MOTION.md), [reduced-motion](examples/reduced-motion/MOTION.md), and [design-bound](examples/design-bound/MOTION.md) examples for complete motion systems. The design-bound example takes its timing from a sibling `DESIGN.md`.

## Getting Started

The reference implementation requires Node.js 20 or newer and has no runtime dependencies.

```bash
npm link
motionmd lint examples/minimal/MOTION.md
```

The CLI emits structured findings that coding agents can act on:

```json
{
  "findings": [],
  "format": "motion.md",
  "specVersion": "0.2",
  "summary": {
    "errors": 0,
    "warnings": 0,
    "info": 0
  }
}
```

Compare two motion systems to detect changes in normalized Motion IR and authored rationale:

```bash
motionmd diff before/MOTION.md after/MOTION.md
```

## The Specification

The full `MOTION.md` specification lives at [`docs/spec.md`](docs/spec.md). What follows is a condensed reference.

### File Structure

A `MOTION.md` file has two layers:

1. **YAML** — exact motion semantics, either as front matter delimited by `---` fences or as ` ```yaml ` blocks inside the relevant section (for example `reducedMotion` under `## Reduced Motion`). All blocks merge into one tree; each top-level key may appear once;
2. **Markdown body** — design intent and rationale organized into `##` sections. Prose may point to other files with `` `@path#fragment` ``, resolved from the `MOTION.md` directory.

YAML is normative for exact values and graph relationships. Markdown is normative for intent, priorities, prohibitions, and decision rationale. A conforming consumer reports conflicts instead of silently choosing one layer.

### Motion Schema

| Field | Purpose |
| --- | --- |
| `version` | Specification version |
| `name` | Human-readable motion system name |
| `posture` | `static`, `minimal`, `expressive`, or `procedural` |
| `design` | Relative path to a `DESIGN.md` whose `motion` tokens may be referenced |
| `omitted` | Prose sections deliberately left out, with optional reasons |
| `defaults` | Default timing: a `timing` token reference, or duration, delay, and curve |
| `states` | Semantic product states |
| `events` | User, system, data, time, viewport, media, or sensor inputs |
| `curves` | Linear, Bézier, steps, spring, or procedural curves |
| `timelines` | Runtime-neutral drivers, tracks, and keyframes; tracks may use `timing: "{motion.<token>}"` |
| `transitions` | State changes, interruption, and cancellation policy |
| `reducedMotion` | Accessibility strategy and semantic substitutions |
| `performance` | Frame, input, concurrency, and determinism budgets |
| `provenance` | Authored, measured, derived, or research sources |

The normative JSON Schema is [`schemas/motion.schema.json`](schemas/motion.schema.json).

### Section Order

Markdown sections may be omitted, but those present should follow this order:

1. Motion Thesis
2. Motion Principles
3. Hierarchy and Choreography
4. Interruption
5. Reduced Motion
6. Performance
7. Provenance

Unknown sections are preserved. Duplicate second-level headings are invalid because they make stable section addressing ambiguous. Sections left out on purpose are declared in `omitted`, which suppresses the `missing-section` warning.

## CLI Reference

All commands accept file paths; `lint` and `parse` also accept `-` for standard input. Output defaults to JSON.

| Command | Description |
| --- | --- |
| `motionmd lint <file\|->` | Validate a document and emit structured findings |
| `motionmd parse <file\|->` | Emit the normalized document and Motion IR |
| `motionmd diff <before> <after>` | Compare Motion IR and prose sections |
| `motionmd spec` | Output the Markdown specification |
| `motionmd spec --format json` | Output the JSON Schema |

`design` and `@` references resolve from each input file's directory (the working directory for standard input). `lint`, `parse`, and `diff` exit with code `1` when invalid or breaking results are found. CLI misuse and unreadable input exit with code `2`.

## Relationship to DESIGN.md

In November 2026 Google Labs' [`design.md`](https://github.com/google-labs-code/design.md) added a `## Motion & Micro-interaction` section and `motion` tokens (`duration`, `delay`, `timingFunction`). The split between the two files is:

| Concern | Owner |
| --- | --- |
| Brand motion tone and timing vocabulary (`state-change`, `surface-enter`, …) | `DESIGN.md` |
| State graph, events, choreography, interruption, reduced motion, budgets | `MOTION.md` |
| Springs, scroll and pointer drivers, procedural curves | `MOTION.md` (no `DESIGN.md` equivalent) |

`MOTION.md` binds with `design: DESIGN.md` and references tokens with `timing: "{motion.surface-enter}"` instead of restating 250ms and a Bézier curve. References resolve to concrete values in Motion IR together with the `DESIGN.md` hash, so a token change shows up in `motionmd diff`. A literal that happens to equal a token gets a `prefer-design-token` hint.

Both formats share the same document conventions: front matter or interleaved YAML blocks, `##` sections, `omitted`, `{…}` token references, and `` `@path#fragment` `` external references. See [`examples/design-bound`](examples/design-bound).

See [`docs/interoperability.md`](docs/interoperability.md) for the consumer boundary.

## Runtime Interoperability

CSS, WAAPI, GSAP, Anime.js, Canvas, SVG, WebGL, and native UI frameworks are runtime adapters. None is privileged by the core format.

The stable handoff is:

```text
MOTION.md → parser → Motion IR
Motion IR → consumer policy → runtime adapter
Runtime adapter → evidence and QA
```

## Status

The `MOTION.md` format is at version `0.2` and remains a draft. The specification, JSON Schema, Motion IR, and CLI are ready for evaluation. Incompatible changes may occur before v1.0.

The repository is open source under the MIT License. The package remains marked `private` only to prevent accidental npm publication while the distribution contract is still evolving.

## License

MIT. See [`LICENSE`](LICENSE).
