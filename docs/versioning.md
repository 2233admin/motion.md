# Versioning Policy

## Document version

`version` identifies the motion.md specification understood by a `MOTION.md`. v0.1 uses the exact string `"0.1"`.

Before v1.0, minor versions may contain breaking changes. Each release must publish migration notes and conformance fixtures.

At v1.0 and later:

- a major version may change or remove normative fields or semantics;
- a minor version may add optional core fields and lint rules;
- a patch version may clarify prose or fix tooling without changing accepted documents.

## IR version

Motion IR has its own `irVersion`. A parser may understand multiple document versions while producing a single normalized IR version. Consumers pin both when exact reproducibility is required.

## Extension stability

An `x-*` extension is versioned by its owner. Promotion into the core requires a specification release and a migration rule. Extension presence never changes the meaning of an existing core field.
