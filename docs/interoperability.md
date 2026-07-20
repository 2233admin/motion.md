# Interoperability and Ownership Boundaries

## DESIGN.md

`DESIGN.md` describes visual identity and design rationale. `MOTION.md` describes behavior in time. A product may use either or both.

`MOTION.md` MAY refer to semantic concepts established by `DESIGN.md` in prose or namespaced extensions. It MUST NOT duplicate color, typography, spacing, component, or other visual-token systems as a competing source of truth. The v0.1 core defines no cross-file reference syntax; consumers own resolution and conflict reporting.

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
  "motionSpec": "0.1",
  "schema": "schemas/motion.schema.json",
  "requiredIr": "0.1"
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
