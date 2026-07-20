<div align="center">

# motion.md

**开放、运行时无关的运动设计规范。**<br>
为人类保留设计意图，为编程 Agent 提供稳定、可解析的结构。

**An open, runtime-neutral specification for motion design.**<br>
It preserves design intent for people and provides a stable structure for coding agents.

[English](#why-motionmd) · [简体中文](README.zh-CN.md)

[![Specification](https://img.shields.io/badge/spec-v0.1_draft-5b5bd6)](docs/spec.md)
[![Tests](https://img.shields.io/badge/tests-17_passing-2f855a)](tests)
[![License](https://img.shields.io/badge/license-MIT-1f2937)](LICENSE)

</div>

---

Motion is more than duration and easing. It is the authored relationship between state, event, time, interruption, accessibility, and product intent.

`motion.md` defines a portable `MOTION.md` document with two complementary layers:

- **Machine-readable YAML** describes states, events, transitions, timelines, curves, reduced-motion substitutions, performance budgets, deterministic playback, and provenance.
- **Human-readable Markdown** explains the motion thesis, hierarchy, emotional intent, restraint, and the reasons behind each rule.

Values make behavior reproducible. Prose explains why that behavior belongs in the product.

## Why motion.md

Animation libraries describe how to render movement. They do not explain why something moves, which state owns the result, what happens when input interrupts it, or what meaning must survive when motion is reduced.

`motion.md` preserves those decisions before a runtime is selected:

```text
MOTION.md → Parser → Motion IR
Motion IR → Consumer policy → Runtime adapter
Runtime adapter → Evidence and QA
```

CSS, WAAPI, GSAP, Anime.js, Canvas, SVG, WebGL, and native UI frameworks are adapter concerns. None is privileged by the core format.

> [!IMPORTANT]
> The specification captures motion intent and behavior. It is not an animation engine, effect gallery, component library, or template marketplace.

## Status

The specification is currently a **v0.1 draft**. The document contract, JSON Schema, Motion IR, and reference CLI are ready for evaluation, but may change incompatibly before v1.0.

The project is open source under the MIT License. GitHub Releases are the distribution channel for the draft. The npm package remains marked `private` only to prevent accidental publication before its distribution contract is stable.

## What is included

- The `MOTION.md` document contract and version policy
- JSON Schema Draft 2020-12 for YAML front matter
- Stable, runtime-neutral Motion IR
- Dependency-free parsing and linting
- Formatter-neutral semantic diffing
- Agent-readable `lint`, `parse`, `diff`, and `spec` commands
- Minimal, expressive, procedural, and reduced-motion examples
- Valid and invalid conformance fixtures
- Provenance rules for authored, measured, derived, and research-informed motion

## Quick start

Requires Node.js 20 or newer. The reference implementation has no runtime dependencies.

```sh
npm test
npm run lint
npm link
motionmd spec
```

| Command | Purpose |
| --- | --- |
| `motionmd lint <file>` | Validate a `MOTION.md` document |
| `motionmd parse <file>` | Parse front matter and Markdown |
| `motionmd diff <a> <b>` | Compare two documents semantically |
| `motionmd spec` | Print the bundled specification |

All commands emit JSON except `spec`, which defaults to Markdown. Diagnostics go to standard error; structured results go to standard output.

## Explore the repository

- [`PHILOSOPHY.md`](PHILOSOPHY.md) — product philosophy and non-goals
- [`docs/spec.md`](docs/spec.md) — normative `MOTION.md` v0.1 specification
- [`docs/terminology.md`](docs/terminology.md) — shared vocabulary
- [`docs/motion-ir.md`](docs/motion-ir.md) — normalized Motion IR contract
- [`docs/interoperability.md`](docs/interoperability.md) — `DESIGN.md`, Pipeline, and adapter boundaries
- [`docs/versioning.md`](docs/versioning.md) — compatibility and version policy
- [`schemas/motion.schema.json`](schemas/motion.schema.json) — JSON Schema for YAML front matter
- [`packages/`](packages) — parser, Motion IR, and CLI reference implementations
- [`examples/`](examples) — four reference motion systems
- [`fixtures/`](fixtures) — valid and invalid conformance inputs
- [`tests/`](tests) — reference implementation tests

## Relationship to DESIGN.md

The product shape is inspired by Google Labs' [`design.md`](https://github.com/google-labs-code/design.md): a portable Markdown document with optional structured front matter, a schema, examples, and agent-friendly tooling.

`motion.md` carries forward one central idea: precise values provide context, but clearly stated intent and rationale determine whether generated work belongs to the product.

The specification remains independent. It does not fork `DESIGN.md`, redefine visual tokens, or require a particular design-system tool. See [`docs/interoperability.md`](docs/interoperability.md).

## License

MIT. See [`LICENSE`](LICENSE).
