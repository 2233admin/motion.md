---
version: alpha
name: Harbor Ledger
description: Calm financial workspace with dense data and quiet surfaces.
colors:
  primary: "#1F3A4D"
  on-primary: "#FFFFFF"
  surface: "#F6F7F5"
  on-surface: "#1A1C1E"
---

## Overview

A ledger for operators who read numbers all day. Surfaces are flat and quiet so figures stay the loudest thing on screen.

## Colors

Deep harbor blue carries primary actions; everything else stays neutral.

## Motion & Micro-interaction

Motion is quick and understated. Feedback on a control lands within a tenth of a second. Surfaces that enter decelerate into place; surfaces that leave accelerate away and take less time than they took to arrive. Nothing loops and nothing moves for decoration. Honor `prefers-reduced-motion`.

```yaml
motion:
  state-change:
    duration: 100ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 250ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```
