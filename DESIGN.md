# Internship Committee Portal — Design Direction

## Visual direction

Use a warm cream canvas, deep navy typography, and restrained blue accents. Oversized Acthirey serif headlines bring a literary editorial character; Manrope and Space Mono keep interface labels and dense information easy to scan. Keep the page rhythm bold but calm, with fine navy rules and clear colored states. The design can draw on editorial patterns without using another brand's identity, wordmark, or content.

## Purpose

Help IIM Rohtak IPM students find opportunities and learning resources quickly. The site should feel like a distinctive student publication and a useful portal at the same time: bold at entry, clear when browsing, and current when opportunities change.

## Visual system

- Canvas: warm cream `#F5F1E8`; use near-white cream `#FFFCF6` for raised surfaces.
- Accent: deep navy `#183B66`; reserve lighter navy shades for hover and metadata emphasis.
- Text: ink navy headlines, muted blue-gray body copy, and mid-blue metadata.
- Typography: Acthirey for display headings; Manrope for body and interface text; Space Mono for timestamps, section labels, and compact metadata.
- Use square or lightly rounded form controls, and reserve larger rounded corners for image tiles and feature cards. Prefer hairline borders over shadows and glass effects.
- Keep color contrast accessible. Status colors may communicate real states, but labels must carry the meaning too.

## Layout direction

- Use a compact top navigation on desktop and the existing mobile drawer on narrow screens.
- Use editorial scale and asymmetry to create hierarchy, then keep dense resource content orderly and scannable.
- Avoid giving every page the same three-column card grid. Let the task determine the page layout.
- Use images as real content with clean crops and simple frames. The homepage will receive genuine IIM Rohtak, committee, campus, or student-work photos; until then, existing photos are temporary placeholders.
- The circular gallery can remain the homepage signature while it supports clear navigation and does not block access to the rest of the site.

## Page patterns

- **Home:** Oversized publication-style introduction, strong authentic photography when supplied, and clear entry points to the portal's useful sections.
- **Case competitions:** Deadline calendar is primary. Keep date-range and institute filters separate and data-driven. Selecting a date reveals all deadlines for that day. Make IC Top Picks unmistakable with a distinctive solid accent block and load the picks from sheet data.
- **Courses:** Prioritize comparison of domain, price, rating, and duration; use a compact comparison layout when it is easier to scan than cards.
- **Live projects:** Make company, role, status, deadline, and application action easy to compare. Let entries vary with the amount of useful detail.
- **Case studies, repositories, and student resources:** Use compact editorial lists or a restrained asymmetric grid with clear descriptions and destination links.

## Interaction and accessibility

- Keep hover, pressed, and keyboard-focus feedback visible.
- Respect reduced-motion preferences. Motion should add character without delaying access to content.
- Support mouse, keyboard, and touch. Never rely on color alone for deadlines or application status.
- Use plain language for loading, empty, and error states.

## Avoid

- Frosted glass, decorative glow, and gradients as default surface treatments.
- Three equal cards repeated across every page.
- Generic stock photography once the real committee photos are available.
- New colors with no defined role, or decorative indicators that do not communicate real state.
- Invented statistics, student quotes, awards, or opportunity details.

## Implementation guardrails

- Keep the existing plain HTML, CSS, and JavaScript stack and preserve spreadsheet-driven content.
- Preserve the calendar filters, day detail view, dynamic institute names, and IC Top Picks data behavior.
- Keep changes reviewable and retain responsive behavior, semantic markup, and keyboard access.

Acthirey is the requested display face. The font asset must be supplied with a web embedding license before it can be bundled in the public site; until then, the CSS uses an elegant serif fallback.
