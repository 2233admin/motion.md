# motion.md

**An open specification for motion design intent — readable by people, structured for agents, independent of animation runtimes.**

English · [简体中文](README.zh-CN.md)

[![Specification](https://img.shields.io/badge/spec-v0.1_draft-5b5bd6)](docs/spec.md)
[![Tests](https://img.shields.io/badge/tests-17_passing-2f855a)](tests)
[![License](https://img.shields.io/badge/license-MIT-1f2937)](LICENSE)

Motion is more than duration and easing. It is the authored relationship between state, event, time, interruption, accessibility, and product intent.

`motion.md` defines a portable `MOTION.md` document that carries both:

- **Machine-readable YAML** for states, events, transitions, timelines, curves, reduced-motion substitutions, performance budgets, deterministic playback, and provenance.
- **Human-readable Markdown** for the motion thesis, hierarchy, emotional intent, restraint, and the reasons behind each rule.

Values make behavior reproducible. Prose explains why that behavior belongs in the product.

## Why motion.md

Animation libraries describe how to render movement. They do not describe why something moves, which state owns the result, what happens when input interrupts it, or what meaning must survive when motion is reduced.

`motion.md` preserves that design intent before a runtime is selected:

```text
MOTION.md -> parser -> Motion IR -> consumer policy -> runtime adapter -> evidence and QA
```

CSS, WAAPI, GSAP, Anime.js, Canvas, SVG, WebGL, and native UI frameworks are adapter concerns. None is privileged by the core format.

## Status

The specification is at **v0.1 draft**. The document contract, JSON Schema, Motion IR, and reference CLI are ready for evaluation, but may change incompatibly before v1.0.

The project is open source under the MIT License. The npm package remains marked `private` until the CLI distribution contract is ready; GitHub releases are the distribution channel for the draft.

## What this repository provides

- The `MOTION.md` document contract and version policy.
- JSON Schema Draft 2020-12 for YAML front matter.
- Stable, runtime-neutral Motion IR.
- Dependency-free parsing and linting.
- Formatter-neutral semantic diffing.
- Agent-readable `lint`, `parse`, `diff`, and `spec` commands.
- Minimal, expressive, procedural, and reduced-motion reference documents.
- Valid and invalid conformance fixtures.
- Provenance rules for authored, measured, derived, and research-informed motion.

It does not ship an animation engine, runtime adapter, effect gallery, component library, or template marketplace.

## Quick start

Requirements: Node.js 20 or newer. The reference implementation has no runtime dependencies.

```sh
npm test
node packages/cli/bin/motionmd.mjs lint examples/minimal/MOTION.md
node packages/cli/bin/motionmd.mjs parse examples/expressive/MOTION.md
node packages/cli/bin/motionmd.mjs diff examples/minimal/MOTION.md examples/expressive/MOTION.md
node packages/cli/bin/motionmd.mjs spec
```

After `npm link`, the commands are available through `motionmd`:

```sh
motionmd lint MOTION.md
```

All commands emit JSON except `spec`, which defaults to Markdown. Diagnostics go to standard error; structured results go to standard output.

## Repository map

```text
PHILOSOPHY.md                 Product philosophy and non-goals
docs/spec.md                  Normative MOTION.md v0.1 specification
docs/terminology.md           Shared vocabulary for authors and consumers
docs/motion-ir.md             Normalized Motion IR contract
docs/interoperability.md      DESIGN.md, Pipeline, and adapter boundaries
docs/versioning.md            Compatibility and version policy
schemas/motion.schema.json    JSON Schema for YAML front matter
packages/parser               MOTION.md parser and linter
packages/motion-ir            Stable normalization and semantic diff
packages/cli                  lint / parse / diff / spec CLI
examples                      Four reference motion systems
fixtures                      Valid and invalid conformance inputs
tests                         Reference implementation tests
```

## Relationship to DESIGN.md

The product shape is inspired by Google Labs' [`design.md`](https://github.com/google-labs-code/design.md): a portable Markdown document with optional structured front matter, a schema, examples, and agent-friendly tooling.

`motion.md` carries forward one central idea: precise values provide context, but clearly stated intent and rationale determine whether generated work belongs to the product.

The specification remains independent. It does not fork `DESIGN.md`, redefine visual tokens, or require a particular design-system tool. See [docs/interoperability.md](docs/interoperability.md).

## License

MIT. See [LICENSE](LICENSE).
