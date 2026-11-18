# Motion IR v0.2

Motion IR is the stable, runtime-neutral output of parsing a `MOTION.md`. It is an interchange boundary, not an executable timeline.

## Goals

- Remove YAML and Markdown parsing differences from downstream consumers.
- Resolve named maps into deterministically ordered records without discarding names.
- Preserve semantic targets, properties, intent sections, policies, provenance, and extensions.
- Make meaningful diffs independent of formatting and key order.
- Let adapters report unsupported capabilities before implementation.

## Shape

```json
{
  "irVersion": "0.2",
  "specification": "motion.md/0.2",
  "document": {
    "name": "Example",
    "description": "...",
    "posture": "minimal"
  },
  "design": { "path": "DESIGN.md", "sourceHash": "sha256…" },
  "defaults": {},
  "graph": {
    "states": [{ "id": "closed", "description": "..." }],
    "events": [{ "id": "activate", "description": "...", "source": "user" }],
    "transitions": [{ "id": "open", "from": "closed", "to": "open", "on": "activate" }]
  },
  "curves": [
    { "id": "motion.surface-enter", "origin": "design", "type": "cubic-bezier", "value": [0.2, 0, 0, 1] },
    { "id": "standard", "type": "cubic-bezier", "value": [0.2, 0, 0, 1] }
  ],
  "timelines": [{
    "id": "reveal",
    "driver": { "type": "clock" },
    "tracks": [{ "target": "panel", "property": "visual.opacity", "timing": "motion.surface-enter", "curve": "motion.surface-enter", "durationMs": 250, "startMs": 0, "keyframes": [] }]
  }],
  "policies": {
    "reducedMotion": {},
    "performance": {}
  },
  "provenance": [],
  "intent": {
    "omitted": [{ "section": "hierarchy-and-choreography", "reason": "..." }],
    "sections": [{ "heading": "Motion Thesis", "content": "..." }]
  },
  "extensions": {}
}
```

Named mappings are converted to arrays sorted by `id`.

`timing` references are resolved before emission, so adapters never read `DESIGN.md`. A resolved track carries concrete `durationMs` and `startMs`, keeps the token path in `timing`, and names its curve by that same path. Each referenced token contributes one curve record with `origin: "design"`; its dotted id cannot collide with a local kebab-case curve id. `design.sourceHash` pins the exact `DESIGN.md` bytes, so a token change shows up in the semantic diff both as changed values and as a changed hash. Track and keyframe arrays preserve authored order because order is semantic. Extension keys are collected without interpretation.

## Capability negotiation

An adapter evaluates IR features, not source YAML. A capability report should identify supported curve types, driver types, semantic property families, interruption policies, and budgets. Unsupported capabilities are explicit failures or consumer-approved degradations; they are never silently rewritten.

## Semantic diff

The reference diff compares normalized IR plus Markdown sections.

Breaking changes include:

- removing a state, event, transition, timeline, or curve;
- changing a transition's source, destination, event, interruption, or cancellation contract;
- weakening reduced-motion preservation;
- removing a provenance entry;
- changing the declared specification version.

Other value changes are reported as modifications but are not automatically classified as breaking. Consumers may apply stricter release policy.
