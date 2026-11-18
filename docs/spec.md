# MOTION.md Format Specification v0.2

Status: draft. Normative terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as requirement levels.

## 1. Purpose

`MOTION.md` is a self-contained, plain-text description of the intent, timing, and behavior behind a product's motion graphics and frontend animation. It is intended to remain understandable in source control, portable between tools, and precise enough to normalize into a runtime-neutral Motion IR.

The lowercase name `motion.md` refers to this specification and repository. The uppercase filename `MOTION.md` refers to a conforming project-local document.

## 2. Document structure

A document contains human-readable Markdown prose and machine-readable YAML. Machine data may be written in two ways, matching `DESIGN.md`:

1. **YAML front matter** at the start of the file, delimited by lines containing exactly `---`.
2. **Interleaved YAML code blocks**: fenced ` ```yaml ` (or ` ```yml `) blocks placed inside the section they belong to, for example `reducedMotion` under `## Reduced Motion`.

Both may be used in one document. All blocks are parsed and merged into one tree. Each top-level key MUST be defined at most once across the whole document; a repeated top-level key is an error. Fenced YAML blocks are machine data, not prose: they are excluded from section content. Headings and references inside any fenced code block are not interpreted as document structure.

Machine data is normative for exact values and graph relationships. Markdown prose is normative for design intent, priorities, prohibitions, and decision rationale. When they conflict, a conforming consumer MUST report the conflict rather than silently choosing one layer.

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

Unknown sections MUST be preserved. Duplicate second-level headings are invalid because they make stable section addressing ambiguous. A prose-only document is valid but produces a `missing-machine-data` warning and cannot yield a complete Motion IR.

A section that is deliberately absent is declared in `omitted`, either as a section key or as `{ section, reason }`. Section keys are the lower kebab-case headings: `motion-thesis`, `motion-principles`, `hierarchy-and-choreography`, `interruption`, `reduced-motion`, `performance`, `provenance`. A declared omission suppresses the `missing-section` warning. An unknown key produces `unknown-omission` (a warning, so schema-valid); a key whose section is present produces `redundant-omission`. `omitted` covers prose only: required machine fields such as `reducedMotion` and `performance` cannot be omitted.

```yaml
omitted:
  - section: hierarchy-and-choreography
    reason: Only one element moves.
```

## 4. Machine-data root

The normative schema is [../schemas/motion.schema.json](../schemas/motion.schema.json).

| Field | Requirement | Meaning |
| --- | --- | --- |
| `version` | required | Specification version. v0.2 documents use `"0.2"`. |
| `name` | required | Human-readable motion system name. |
| `description` | optional | Short machine-readable summary. |
| `posture` | required | `static`, `minimal`, `expressive`, or `procedural`. |
| `design` | optional | Relative path to the `DESIGN.md` whose motion tokens this document references. See section 7. |
| `omitted` | optional | Prose sections that are deliberately absent. See section 3. |
| `defaults` | optional | Default timing token, or default duration, delay, and curve references. |
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

A procedural curve MUST declare `sample.rateHz` and `sample.durationMs`. If it uses randomness it MUST declare an integer `seed`. Expressions are data, not code: function calls, property access, assignment, imports, statements, and host-language callbacks are forbidden. The expression vocabulary is arithmetic over `t`, `progress`, declared parameters, numeric constants, parentheses, and the pure functions `sin`, `cos`, `tan`, `abs`, `min`, `max`, `clamp`, `pow`, `sqrt`, `exp`, and `log`.

## 7. Design motion tokens

`DESIGN.md` owns the brand's motion vocabulary: purpose-named `motion` tokens with `duration`, `delay`, and `timingFunction`, such as `state-change`, `surface-enter`, and `surface-exit`. `MOTION.md` owns behavior: which states change, what drives the change, how tracks are choreographed, how interruption resolves, what reduced motion preserves, and the performance budget. A `MOTION.md` MUST NOT restate token values; it references them.

### 7.1 Binding

`design` names the `DESIGN.md` relative to the directory containing `MOTION.md`. It MUST be a relative path ending in `.md`; a leading `/`, a drive letter, a backslash, or a path that resolves outside that directory is an error (`design-path`). A missing file is an error (`broken-ref`).

Consumers read only the `motion` key of the bound `DESIGN.md`, from its front matter or an interleaved YAML block. Other `DESIGN.md` content is outside this specification.

### 7.2 References

`defaults.timing` and a track's `timing` reference a token with the `DESIGN.md` token-reference syntax: `"{motion.<token>}"`, or `"{motion.<group>.<token>}"` for grouped tokens. A reference to a missing token is an error (`broken-ref`), as is a `timing` reference in a document with no `design`.

`timing` replaces the fields it would otherwise duplicate. A track with `timing` MUST NOT also declare `durationMs` or `curve`; `defaults` with `timing` MUST NOT also declare `durationMs`, `delayMs`, or `curve` (`timing-conflict`). A track MAY still declare `startMs`, because placement inside a timeline is choreography, which `MOTION.md` owns.

### 7.3 Resolution

A referenced token resolves as follows:

- `duration` and `delay` are integer milliseconds written with an `ms` suffix. `delay` defaults to `0ms`.
- `timingFunction` defaults to `ease`. CSS keywords map to curves exactly as CSS Easing Functions Level 1 defines them: `linear`; `ease` = `[0.25, 0.1, 0.25, 1]`; `ease-in` = `[0.42, 0, 1, 1]`; `ease-out` = `[0, 0, 0.58, 1]`; `ease-in-out` = `[0.42, 0, 0.58, 1]`; `cubic-bezier(x1, y1, x2, y2)`; `steps(n[, jump-start|jump-end|jump-none|jump-both|start|end])`; `step-start`; `step-end`. Any other value, including multi-point `linear(...)`, is an error (`unsupported-timing-function`); consumers MUST NOT approximate it.
- A track's resolved `durationMs` is the token duration, and its resolved `startMs` is the authored `startMs` (default `0`) plus the token delay.

### 7.4 Single source of truth

When a track declares a literal `durationMs` and a `curve` that together equal a bound token whose delay is zero, the linter reports `prefer-design-token` (`info`) so the literal can be replaced with a reference.

## 8. Timelines and tracks

A timeline owns a `driver` and an ordered array of tracks.

Drivers:

- `clock`: progresses by elapsed milliseconds;
- `scroll`, `pointer`, `media`, or `custom`: progresses from a normalized external scalar.

A track declares:

- `target`: semantic target name, not a selector;
- `property`: runtime-neutral property path such as `visual.opacity`, `spatial.translate-y`, or `content.reveal-progress`;
- `keyframes`: two or more `{ at, value }` entries ordered by non-decreasing progress;
- optional `timing` (section 7), or optional `curve` and `durationMs` overrides;
- optional `startMs`.

Track order is authored order. Overlap is represented by `startMs` and duration, not by runtime-specific timeline syntax. Consumers MUST preserve semantic target/property names through normalization even when an adapter cannot implement them.

## 9. Reduced motion

`reducedMotion.strategy` is one of:

- `instant`: transitions commit their destination state without interpolation;
- `substitute`: named transition substitutions define `instant`, `crossfade`, or another timeline;
- `preserve`: authored motion remains because the document explicitly establishes that it is essential and non-vestibular.

Every substitution MUST declare the meanings it preserves. Common values are `state`, `content`, `focus`, `selection`, `input`, and `continuity`. A consumer MUST NOT infer that reduced motion permits hiding content or delaying task completion.

## 10. Performance and deterministic playback

The performance object defines budgets, not implementation choices. It includes target frame rate, maximum main-thread milliseconds per frame, maximum concurrent tracks, input-ready time, property classes, and deterministic playback.

When `deterministic` is true, the same Motion IR, event sequence, viewport inputs, time samples, and declared seeds MUST produce the same semantic samples. Adapters MUST report unsupported budgets or nondeterministic behavior instead of silently changing the design.

## 11. Provenance

Each provenance entry has a stable `id`, `kind`, and `description`.

Kinds:

- `authored`: original product intent;
- `measured`: observed from an authorized reference;
- `derived`: calculated or normalized from another declared rule;
- `research`: informed by an attributed external source.

Non-authored entries MUST include `source`. Values derived from `DESIGN.md` tokens SHOULD be recorded as a `derived` entry whose `source` is the `design` path. An optional `license` records relevant reuse terms. Provenance describes evidence and influence; it does not transfer permission to copy implementations.

## 12. Portable YAML subset

The reference parser intentionally has no runtime dependencies. It accepts the interoperable subset needed by the schema:

- indentation-based mappings and sequences using spaces;
- plain, single-quoted, and double-quoted scalars;
- null, booleans, finite decimal numbers, and JSON-style inline arrays/objects;
- comments beginning with `#` outside quotes.

Tabs, anchors, aliases, tags, directives, merge keys, block scalars, multi-document streams, and implicit timestamps are rejected. Tooling that supports full YAML 1.2 MAY accept a wider syntax, but MUST normalize to the same data model and MUST reject values outside the JSON-compatible schema.

The subset applies to the bound `DESIGN.md` only for its top-level `motion` block. Other `DESIGN.md` YAML is not parsed, so it may use syntax outside the subset.

## 13. External references

Prose MAY point to other files with the `DESIGN.md` external-reference syntax: an inline code span whose entire content is `@<path>[#<fragment>]`. `<path>` uses `/` separators, contains no whitespace, and ends in a file extension. `` `@media` `` and `` `@scope/package` `` are not references; neither is text outside a code span or inside a fenced block.

Every reference resolves from the directory containing `MOTION.md`, never from the file it appears in. Fragments name a Markdown heading by slug (`` `@DESIGN.md#motion--micro-interaction` ``) or an HTML element `id` or `<!-- COMPONENT: name -->` marker. A consumer that does not understand a fragment for a file type uses the whole file.

The `broken-ref` rule reports:

- a leading `/` or a path that resolves outside the `MOTION.md` directory as an `error`;
- a missing file, or a missing Markdown or HTML fragment, as a `warning`;
- a fragment on any other file type as `info`.

## 14. Extensions and forward compatibility

Core objects accept keys prefixed with `x-`. The value MUST be JSON-compatible. Consumers MUST preserve unknown `x-*` fields and MUST NOT treat them as core conformance requirements unless they explicitly support that extension.

Unknown unprefixed YAML keys are errors. Unknown Markdown sections are preserved without error. This makes the machine contract strict while allowing the human design language to grow through use.

## 15. Stable parse output

`parse` emits:

- `format`: `motion.md`;
- `specVersion`;
- `sourceHash` using SHA-256 over the original bytes;
- normalized `document` data;
- ordered Markdown `sections`;
- normalized `ir` as defined in [motion-ir.md](motion-ir.md), with `timing` references resolved and the bound `DESIGN.md` path and SHA-256 hash recorded;
- parser `findings`.

Object keys in emitted JSON are sorted lexicographically. Authored arrays retain their order.

## 16. CLI conformance

The reference CLI provides:

- `lint <file|->`: parse and validate; exit `1` when errors exist, `0` otherwise, and `2` for unreadable input or CLI misuse.
- `parse <file|->`: emit stable parsed JSON; exit `1` for invalid input.
- `diff <before> <after>`: emit semantic IR and prose-section changes; exit `1` when breaking changes are detected.
- `spec [--format markdown|json]`: emit this specification or the machine-data JSON Schema.

`lint`, `parse`, and `diff` resolve `design` and external references from the directory of each input file, and from the working directory for standard input. A library consumer supplies the same resolution through a `resolveFile(relativePath)` callback; without one, a `design` binding is an error (`unresolved-design`) and external references are checked for syntax only.

All diagnostic records contain `rule`, `severity`, `path`, and `message`. Severity is `error`, `warning`, or `info`.
