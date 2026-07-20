# Terminology

- **Author**: a person or system that writes design intent into `MOTION.md`.
- **Consumer**: a tool that parses, validates, compares, or acts on the document.
- **Adapter**: consumer-owned implementation that translates Motion IR to a runtime.
- **State**: a product-meaningful condition that can be observed independently of an animation frame.
- **Event**: a semantic input or observed change that may authorize a transition.
- **Transition**: the directed contract from one state to another in response to an event.
- **Guard**: a declarative condition that determines whether a transition is eligible.
- **Timeline**: an ordered collection of tracks under one time or progress driver.
- **Track**: sampled values for one semantic target and property.
- **Curve**: the rule that maps normalized input progress to sampled output progress.
- **Spring**: a parameterized physical-response curve with an explicit settle contract.
- **Procedural curve**: a bounded, declarative generator sampled under declared clock and seed inputs.
- **Interruption**: a new authoritative event received while a transition is active.
- **Cancellation**: termination of an active transition without its planned completion.
- **Substitution**: an alternate motion response that preserves the same semantic state change.
- **Motion IR**: the stable runtime-neutral representation produced by a conforming parser.
- **Posture**: the system-level use of motion: `static`, `minimal`, `expressive`, or `procedural`.
- **Provenance**: the declared origin and evidence classification of a motion decision.
