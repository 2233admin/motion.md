# motion.md Philosophy

Motion is a change in meaning over time. The document must explain that meaning before it enumerates durations and curves.

## Intent is the source; values are evidence

A timing value cannot explain whether an interface should feel immediate, ceremonial, calm, physical, playful, or deliberately still. A curve cannot explain which state change deserves attention, what must remain available during the transition, or when movement would violate trust.

The prose is therefore the center of a `MOTION.md`. Structured values support the prose by removing avoidable ambiguity and making conformance testable.

Good motion direction is specific:

> State changes feel like a well-damped instrument panel: the response begins immediately, distance stays short, and nothing rebounds after the new value is readable.

Weak motion direction is adjective soup:

> Smooth, modern, delightful, premium motion.

The first statement carries hierarchy, timing, spatial restraint, and negative constraints. The second asks every consumer to invent them.

This emphasis follows the product philosophy of Google Labs' `design.md`, whose public philosophy states that prose is the vital part of the format and that clearly described intent has more influence than merely precise values. `motion.md` applies that lesson to behavior in time while defining its own independent contract.

## Motion is a state contract

Animation is an implementation technique. Motion design is the authored relationship between:

- a state that exists now;
- an event or driver that changes it;
- the destination state and invariant content;
- the temporal path between them;
- what happens when the path is interrupted, cancelled, repeated, or reduced.

If those relationships are missing, a list of keyframes is not a motion system.

## Stillness is authored

No-motion and reduced-motion outcomes are not validation exceptions. They are explicit semantic choices.

A static product still declares a posture. A reduced-motion substitution must preserve the destination state, information, focus, input authority, and task completion. Removing every duration is sometimes correct, but it is not the only possible accessible result.

## Interruption is normal

Users repeat actions, reverse direction, navigate away, resize, lose connectivity, and change preferences while motion is active. A transition that only works from frame zero to its planned final frame is incomplete.

Every state-changing transition declares an interruption and cancellation policy. The latest authoritative input must never be hidden behind decorative choreography.

## Determinism is a design property

Evidence, debugging, diffing, and accessibility depend on reproducible behavior. Procedural motion declares its inputs, sampling contract, and seed when randomness is present. A consumer that cannot reproduce a declared result must report that limitation.

## Performance is part of intent

Frame rate alone is not the performance contract. `MOTION.md` can budget input latency, main-thread work, concurrency, animated property classes, and the time before content becomes usable.

A runtime may use any technology that satisfies the semantics and budget. The specification never promotes a library name into a design truth.

## The core stays smaller than its adapters

The format standardizes concepts that must survive implementation changes: states, events, transitions, tracks, curves, timing, interruption, accessibility, performance, determinism, and provenance.

It does not standardize DOM selectors, JavaScript callbacks, GSAP timelines, Anime.js parameters, CSS declarations, shader code, canvas loops, or framework lifecycles. Those belong to capability-declared adapters and consumer-owned integration.

## Provenance without imitation

Motion may be authored, measured from an authorized reference, derived from product rules, or informed by external research. The document records which is true.

Provenance does not grant permission to copy an implementation. It makes design decisions inspectable, preserves uncertainty, and helps consumers distinguish observed behavior from newly invented behavior.

## Non-goals

`motion.md` is not:

- an animation runtime or compiler;
- an effects preset collection;
- a skill-pack architecture;
- a replacement for design critique or user research;
- a browser evidence system;
- a library selection rubric;
- the Designer Pipeline itself.

Those systems may consume the contract. They do not define it.
