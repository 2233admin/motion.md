# Interoperability and Ownership Boundaries

## DESIGN.md

Since November 2026, `DESIGN.md` has its own `## Motion & Micro-interaction` section and `motion` tokens (`duration`, `delay`, `timingFunction`). The split is:

| Concern | Owner |
| --- | --- |
| Brand motion tone ("quick and understated", "nothing loops") | `DESIGN.md` prose |
| Timing vocabulary: purpose-named durations, delays, easing | `DESIGN.md` `motion` tokens |
| Which states change, and on which event | `MOTION.md` |
| Which targets and properties move, and in what order | `MOTION.md` timelines |
| Interruption and cancellation | `MOTION.md` |
| Reduced-motion substitutions and what they preserve | `MOTION.md` |
| Performance budgets and deterministic playback | `MOTION.md` |
| Springs, scroll/pointer drivers, procedural curves | `MOTION.md` (no `DESIGN.md` equivalent) |

`MOTION.md` binds to a `DESIGN.md` with `design` and references its tokens with `timing: "{motion.<token>}"` (spec section 7). It MUST NOT restate token values, and it MUST NOT duplicate color, typography, spacing, component, or other visual tokens. A project with only `DESIGN.md` motion tokens has a vocabulary but no behavior contract; a project with only `MOTION.md` declares its own curves locally.

The two files use the same document conventions so one toolchain can read both: YAML front matter or interleaved ` ```yaml ` blocks, `##` sections, `omitted`, `{…}` token references, and `` `@path#fragment` `` external references resolved from the file's own directory.

## Designer Pipeline

Designer Pipeline is a consumer and orchestration layer. It owns:

- obtaining, generating, or completing `DESIGN.md` and `MOTION.md`;
- interviewing users when intent is missing or contradictory;
- pinning a compatible `motion.md` specification version;
- selecting adapters from declared project capabilities;
- browser evidence, matched-clock comparison, visual validation, and feedback routing.

The Pipeline MUST consume parsed Motion IR rather than maintaining a divergent private motion schema. Migration of existing Pipeline behavior is intentionally outside the motion.md v0.1 repository milestone.

### Suggested consumer pin

```json
{
  "motionSpec": "0.2",
  "schema": "schemas/motion.schema.json",
  "requiredIr": "0.2"
}
```

A consumer MUST reject unsupported major versions and SHOULD report unsupported fields or capabilities before selecting a runtime.

## Runtime adapters

Adapters translate Motion IR to a target such as CSS, WAAPI, GSAP, Anime.js, SVG, Canvas, WebGL, a native UI toolkit, or a future runtime.

Adapters own selectors, lifecycle hooks, generated code, library configuration, cleanup, clock integration, and platform-specific optimization. They MUST preserve semantic state and accessibility policy, and MUST report capability gaps instead of silently substituting unrelated behavior.

No adapter is part of the core specification and no runtime name appears as a privileged schema value.

## Evidence systems

Temporal capture, frame sampling, matched-event comparison, perceptual scoring, and browser automation consume implementation output. They may use deterministic fields from Motion IR, but they do not change the authored contract.

## Research and examples

External projects, including motion skill collections, are research inputs and examples of craft. Their taxonomy or verification ideas may inform original normalized rules with attribution. Their templates, recipes, and runtime-specific architecture do not become the specification.
