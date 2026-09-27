---
name: Freestack
description: A project-first decision catalog for free and low-cost developer tools.
colors:
  background: "#0d0c0b"
  surface: "#141312"
  surface-raised: "#1d1c1a"
  border: "#252320"
  border-strong: "#363430"
  text: "#f0ede6"
  text-secondary: "#a09b94"
  text-muted: "#888480"
  accent-sand: "#c4a882"
  status-ok: "#6b9e6b"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(3.2rem, 9vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "15px"
    lineHeight: 1.7
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.68rem"
    fontWeight: 400
  meta:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
  navigation:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
  detail:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
  lead:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
  control:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
rounded:
  sm: "4px"
  default: "6px"
spacing:
  page-gutter: "clamp(1.25rem, 4vw, 4.5rem)"
  content-max: "1360px"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.background}"
    rounded: "{rounded.default}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.default}"
    padding: "8px 16px"
---

## Overview

Freestack is a technical decision desk. It helps founders check MVP limits and commercial terms, students publish reviewable demos, and hobbyists choose how much to operate themselves. The interface should feel precise and calm, with catalog facts doing the persuasive work.

## Colors

The canvas is near-black. Raised surfaces use two restrained steps. Warm sand marks active choices and important links. Green is reserved for positive status. Muted text maintains at least 4.5:1 contrast against the dark surfaces. Avoid adding accent colors without a clear data meaning.

## Typography

**Display and body:** IBM Plex Sans with a system sans fallback. **Labels and data:** JetBrains Mono with a system mono fallback.

Large sans headings establish the task. Body copy explains choices in short paragraphs. Mono labels, limits, counts, and filter state support scanning; do not use mono as decoration.

## Layout

Use a centered content width capped at 1360px, with responsive page gutters. The homepage gives three audience paths and one direct directory entry point. Each path leads to a practical guide and relevant filters. The directory uses compact rows and separators. Tables may scroll horizontally on small screens when preserving comparison data requires it.

The design source of truth is this file. Runtime tokens live in [`src/design-system/tokens.css`](src/design-system/tokens.css); shared primitives live in [`src/design-system/components.css`](src/design-system/components.css). Use Tailwind utilities for page composition, and add shared components when a visual pattern repeats. Update this document and the token/component implementation together when the visual system changes.

## Elevation & Depth

The interface is mostly flat. Separate regions with tonal surfaces and one-pixel hairlines. Use shadows only for floating controls such as the filter popover.

## Shapes

Use tight 4px and 6px corners for controls and surfaces. Avoid pill-shaped cards. Buttons and chips remain compact and readable.

## Components

- **Buttons:** Filled buttons use the primary text color over the dark background. Outline buttons use a raised surface and stronger border.
- **Catalog tabs and filter chips:** Use mono labels, visible active state, and `aria-pressed` state on buttons.
- **Directory rows:** Keep names, concise decision copy, and key fields together. Use hairlines instead of card containers.
- **Audience paths:** State the user’s goal and the next action in each link. Cards navigate to complete guide pages; guide actions open existing catalog filters.
- **Navigation:** Keep primary navigation to Paths, Catalog, and API. Reach specialist guides through the matching audience path.
- **Inputs:** Use raised dark fill, readable placeholder text, and a clear keyboard focus indicator.
- **Active constraints:** Display selected category and field filters near the result count.

## Usability and accessibility

- Every whole audience tile is one keyboard-accessible link with a visible focus outline.
- Keep text contrast strong enough to read on the dark surfaces; muted copy must not carry essential terms alone.
- Use plain goal labels such as “Publish a portfolio project” and explain the next step in the supporting line.
- Provide a direct browse-catalog route for visitors whose task does not fit an audience path.
- Keep hover styling supplemental. Navigation and selected states must remain clear on touch screens.

## Do's and Don'ts

- Put the visitor's decision task before catalog breadth.
- Keep hard limits, eligibility, commercial permission, and uncertainty visible.
- Preserve URLs for shareable filter state.
- Keep the row-based catalog scannable.
- Do not invent rankings, scores, benchmarks, or verification claims.
- Avoid purple gradients, neon, decorative dashboard cards, and ornamental mono text.
