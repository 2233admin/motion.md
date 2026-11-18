# Changelog

## 0.2.0 - 2026-11-19

- Aligned with the 2026-11-17 `DESIGN.md` update: `DESIGN.md` owns motion timing tokens; `MOTION.md` binds them with `design` and references them with `timing: "{motion.<token>}"`.
- Resolved design tokens in Motion IR, including the bound `DESIGN.md` hash.
- Added interleaved YAML blocks, `omitted`, and external `@` references with `DESIGN.md` semantics.
- Added `prefer-design-token`, `timing-conflict`, `design-path`, `duplicate-key`, `unknown-omission`, and `redundant-omission` rules; renamed `missing-frontmatter` to `missing-machine-data`.
- Added the design-bound example and a CI workflow. See `docs/releases/v0.2.0.md` for migration.

## 0.1.0 - 2026-07-20

- Established the independent `motion.md` philosophy, scope, terminology, and version policy.
- Defined `MOTION.md` v0.1 front matter and JSON Schema.
- Added runtime-neutral Motion IR normalization and semantic diffing.
- Added dependency-free `lint`, `parse`, `diff`, and `spec` commands.
- Added minimal, expressive, procedural, and reduced-motion reference documents.
- Added valid and invalid conformance fixtures and automated tests.
- Documented the version-pinned Designer Pipeline consumer boundary without migrating the Pipeline.
