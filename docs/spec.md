# MOTION.md Format Specification v0.1

Status: draft. Normative terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as requirement levels.

## 1. Purpose

`MOTION.md` is a self-contained, plain-text description of a product's motion design intent and temporal behavior. It is intended to remain understandable in source control, portable between tools, and precise enough to normalize into a runtime-neutral Motion IR.

The lowercase name `motion.md` refers to this specification and repository. The uppercase filename `MOTION.md` refers to a conforming project-local document.

## 2. Document structure

A document contains:

1. Optional YAML 1.2 front matter delimited by lines containing exactly `---`.
2. A Markdown body containing human-readable intent and rationale.

When front matter is present, it is normative for exact values and graph relationships. Markdown prose is normative for design intent, priorities, prohibitions, and decision rationale. When they conflict, a conforming consumer MUST report the conflict rather than silently choosing one layer.

JSON text is valid YAML 1.2 and MAY be used inside the front-matter delimiters. The reference parser implements the portable YAML subset described in section 11.

## 3. Required Markdown sections

A fully authored document SHOULD include these `##` sections in this order:

1. `Motion Thesis`
2. `Motion Principles`
3. `Hierarchy and Choreography`
4. `Interruption`
5. `Reduced Motion`
6. `Performance`
7. `Provenance`

Unknown sections MUST be preserved. Duplicate second-level headings are invalid because they make stable section addressing ambiguous. A prose-only document is valid but produces a `missing-frontmatter` warning and cannot yield a complete Motion IR.

## 4. Front-matter root

The normative schema is [../schemas/motion.schema.json](../schemas/motion.schema.json).

| Field | Requirement | Meaning |
| --- | --- | --- |
| `version` | required | Specification version. v0.1 documents use `"0.1"`. |
| `name` | required | Human-readable motion system name. |
| `description` | optional | Short machine-readable summary. |
| `posture` | required | `static`, `minimal`, `expressive`, or `procedural`. |
| `defaults` | optional | Default duration, delay, and curve references. |
| `states` | conditional | Named semantic product states. Required for non-static postures. |
| `events` | conditional | Named semantic inputs or observed changes. Required for non-static postures. |
| `curves` | optional | Named easing, spring, step, or procedural curve definitions. |
| `timelines` | conditional | Named track collections. Required when a transition references one. |
| `transitions` | conditional | Directed state changes. Required for non-static postures. |
| `reducedMotion` | required | Global strategy and semantic substitutions. |
| `performance` | required | Runtime-neutral performance and determinism budget. |
| `provenance` | required | Sources and authorship classification. |
| `x-*` | optional | Namespaced extensions. Unknown unprefixed fields are invalid. |

Names used as mapping keys MUST match `^[a-z][a-z0-9-]*$`. References use those names directly; the format does not use implicit object paths or runtime selectors.

## 5. State and event graph

### 5.1 States

A state describes product meaning, not a rendered frame. Each state MUST have a `description`. Optional `invariants` identify content, focus, selection, geometry, or other facts that remain true while the state is active.

### 5.2 Events

An event has a `description` and a `source`:

- `user`: direct input such as activation, dragging, or keyboard movement;
- `system`: application or platform state;
- `data`: remote or local data change;
- `time`: elapsed or scheduled time;
- `viewport`: size or visibility change;
- `media`: playback or media-query change;
- `sensor`: device or environmental input.

Events describe meaning and ownership. They MUST NOT embed executable handlers.

### 5.3 Transitions

A transition contains `from`, `to`, `on`, and either `timeline` or `mode: instant`. It MAY declare a declarative `guard` expression.

Every non-instant transition MUST define:

- `interruption.policy`: `reverse`, `replace`, `complete`, `queue`, or `ignore`;
- `cancellation.policy`: `source`, `target`, `nearest`, or `hold`.

`ignore` SHOULD NOT be used for direct user input because it can conceal current intent. Consumers MUST report dangling state, event, timeline, and curve references.

## 6. Time, curves, and procedures

All clock durations and offsets are integer milliseconds. Unitless progress is normalized to the closed interval `[0, 1]`.

Curve types:

- `linear`: constant rate.
- `cubic-bezier`: four finite numbers; x control points MUST be within `[0, 1]`.
- `steps`: positive step count and a jump position.
- `spring`: positive mass and stiffness, non-negative damping, optional initial velocity, and explicit settle thresholds.
- `procedural`: a named generator or restricted expression plus parameters and a sampling contract.

A procedural curve MUST declare `sample.rateHz` and `sample.durationMs`. If it uses randomness it MUST declare an integer `seed`. Expressions are data, not code: function calls, property access, assignment, imports, statements, and host-language callbacks are forbidden. The v0.1 expression vocabulary is arithmetic over `t`, `progress`, declared parameters, numeric constants, parentheses, and the pure functions `sin`, `cos`, `tan`, `abs`, `min`, `max`, `clamp`, `pow`, `sqrt`, `exp`, and `log`.

## 7. Timelines and tracks

A timeline owns a `driver` and an ordered array of tracks.

Drivers:

- `clock`: progresses by elapsed milliseconds;
- `scroll`, `pointer`, `media`, or `custom`: progresses from a normalized external scalar.

A track declares:

- `target`: semantic target name, not a selector;
- `property`: runtime-neutral property path such as `visual.opacity`, `spatial.translate-y`, or `content.reveal-progress`;
- `keyframes`: two or more `{ at, value }` entries ordered by non-decreasing progress;
- optional `curve`, `startMs`, and `durationMs` overrides.

Track order is authored order. Overlap is represented by `startMs` and duration, not by runtime-specific timeline syntax. Consumers MUST preserve semantic target/property names through normalization even when an adapter cannot implement them.

## 8. Reduced motion

`reducedMotion.strategy` is one of:

- `instant`: transitions commit their destination state without interpolation;
- `substitute`: named transition substitutions define `instant`, `crossfade`, or another timeline;
- `preserve`: authored motion remains because the document explicitly establishes that it is essential and non-vestibular.

Every substitution MUST declare the meanings it preserves. Common values are `state`, `content`, `focus`, `selection`, `input`, and `continuity`. A consumer MUST NOT infer that reduced motion permits hiding content or delaying task completion.

## 9. Performance and deterministic playback

The performance object defines budgets, not implementation choices. It includes target frame rate, maximum main-thread milliseconds per frame, maximum concurrent tracks, input-ready time, property classes, and deterministic playback.

When `deterministic` is true, the same Motion IR, event sequence, viewport inputs, time samples, and declared seeds MUST produce the same semantic samples. Adapters MUST report unsupported budgets or nondeterministic behavior instead of silently changing the design.

## 10. Provenance

Each provenance entry has a stable `id`, `kind`, and `description`.

Kinds:

- `authored`: original product intent;
- `measured`: observed from an authorized reference;
- `derived`: calculated or normalized from another declared rule;
- `research`: informed by an attributed external source.

Non-authored entries MUST include `source`. An optional `license` records relevant reuse terms. Provenance describes evidence and influence; it does not transfer permission to copy implementations.

## 11. Portable YAML subset

The reference parser intentionally has no runtime dependencies. It accepts the interoperable subset needed by the schema:

- indentation-based mappings and sequences using spaces;
- plain, single-quoted, and double-quoted scalars;
- null, booleans, finite decimal numbers, and JSON-style inline arrays/objects;
- comments beginning with `#` outside quotes.

Tabs, anchors, aliases, tags, directives, merge keys, block scalars, multi-document streams, and implicit timestamps are rejected. Tooling that supports full YAML 1.2 MAY accept a wider syntax, but MUST normalize to the same data model and MUST reject values outside the JSON-compatible schema.

## 12. Extensions and forward compatibility

Core objects accept keys prefixed with `x-`. The value MUST be JSON-compatible. Consumers MUST preserve unknown `x-*` fields and MUST NOT treat them as core conformance requirements unless they explicitly support that extension.

Unknown unprefixed YAML keys are errors. Unknown Markdown sections are preserved without error. This makes the machine contract strict while allowing the human design language to grow through use.

## 13. Stable parse output

`parse` emits:

- `format`: `motion.md`;
- `specVersion`;
- `sourceHash` using SHA-256 over the original bytes;
- normalized `document` data;
- ordered Markdown `sections`;
- normalized `ir` as defined in [motion-ir.md](motion-ir.md);
- parser `findings`.

Object keys in emitted JSON are sorted lexicographically. Authored arrays retain their order.

## 14. CLI conformance

The reference CLI provides:

- `lint <file|->`: parse and validate; exit `1` when errors exist, `0` otherwise, and `2` for unreadable input or CLI misuse.
- `parse <file|->`: emit stable parsed JSON; exit `1` for invalid input.
- `diff <before> <after>`: emit semantic IR and prose-section changes; exit `1` when breaking changes are detected.
- `spec [--format markdown|json]`: emit this specification or the front-matter JSON Schema.

All diagnostic records contain `rule`, `severity`, `path`, and `message`. Severity is `error`, `warning`, or `info`.
