# MOTION.md

A format specification for describing motion design intent and temporal behavior to coding agents. `MOTION.md` gives agents a persistent, structured understanding of how a product moves.

用于向编程 Agent 描述运动设计意图与时序行为的格式规范。`MOTION.md` 让 Agent 持续、结构化地理解一个产品应该如何运动。

**English** · [简体中文](README.zh-CN.md)

## The Format

A `MOTION.md` file combines machine-readable motion semantics in YAML front matter with human-readable design intent in Markdown prose.

The YAML defines exact states, events, transitions, timelines, curves, interruption rules, accessibility substitutions, and performance budgets. The prose explains why those rules exist, what the motion should communicate, and where restraint matters.

```md
---
version: "0.1"
name: Quiet Feedback
posture: minimal
states:
  idle:
    description: The control is ready.
  active:
    description: The control is selected.
events:
  activate:
    description: The user activates the control.
    source: user
transitions:
  become-active:
    from: idle
    to: active
    on: activate
    mode: instant
    interruption:
      policy: replace
    cancellation:
      policy: target
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

An agent reading this file knows which state owns the result, which event causes the change, how interruption is resolved, what reduced motion preserves, and which performance limits must survive runtime selection.

See the [minimal](examples/minimal/MOTION.md), [expressive](examples/expressive/MOTION.md), [procedural](examples/procedural/MOTION.md), and [reduced-motion](examples/reduced-motion/MOTION.md) examples for complete motion systems.

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
  "specVersion": "0.1",
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

1. **YAML front matter** — exact motion semantics, delimited by `---` fences at the top of the file;
2. **Markdown body** — design intent and rationale organized into `##` sections.

YAML is normative for exact values and graph relationships. Markdown is normative for intent, priorities, prohibitions, and decision rationale. A conforming consumer reports conflicts instead of silently choosing one layer.

### Motion Schema

| Field | Purpose |
| --- | --- |
| `version` | Specification version |
| `name` | Human-readable motion system name |
| `posture` | `static`, `minimal`, `expressive`, or `procedural` |
| `states` | Semantic product states |
| `events` | User, system, data, time, viewport, media, or sensor inputs |
| `curves` | Linear, Bézier, steps, spring, or procedural curves |
| `timelines` | Runtime-neutral drivers, tracks, and keyframes |
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

Unknown sections are preserved. Duplicate second-level headings are invalid because they make stable section addressing ambiguous.

## CLI Reference

All commands accept file paths; `lint` and `parse` also accept `-` for standard input. Output defaults to JSON.

| Command | Description |
| --- | --- |
| `motionmd lint <file\|->` | Validate a document and emit structured findings |
| `motionmd parse <file\|->` | Emit the normalized document and Motion IR |
| `motionmd diff <before> <after>` | Compare Motion IR and prose sections |
| `motionmd spec` | Output the Markdown specification |
| `motionmd spec --format json` | Output the JSON Schema |

`lint`, `parse`, and `diff` exit with code `1` when invalid or breaking results are found. CLI misuse and unreadable input exit with code `2`.

## Relationship to DESIGN.md

The project shape deliberately aligns with Google Labs' [`design.md`](https://github.com/google-labs-code/design.md):

| Shared convention | `DESIGN.md` | `MOTION.md` |
| --- | --- | --- |
| Portable project document | Visual identity | Motion intent and temporal behavior |
| YAML front matter | Exact design tokens | Exact states, events, timelines, and budgets |
| Markdown prose | Visual rationale | Motion rationale, hierarchy, and restraint |
| Machine contract | Schema and linting | Schema, linting, and Motion IR |
| Agent workflow | Read, validate, export | Read, validate, normalize, compare |

The formats are complementary, not nested. `DESIGN.md` owns visual identity and design-system values. `MOTION.md` owns state change, time, interruption, reduced motion, and performance. Tooling may consume both without either specification redefining the other.

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

The `MOTION.md` format is at version `0.1` and remains a draft. The specification, JSON Schema, Motion IR, and CLI are ready for evaluation. Incompatible changes may occur before v1.0.

The repository is open source under the MIT License. The package remains marked `private` only to prevent accidental npm publication while the distribution contract is still evolving.

## License

MIT. See [`LICENSE`](LICENSE).
