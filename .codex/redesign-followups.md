# Redesign completion context

Status: all currently listed redesign items have been implemented (2026-10-08).

## Earlier homepage and color work

- Keep the homepage's internship committee background/scroll-over treatment and beige logo framing intact.
- Live Project detail panels use the coordinated cream, navy, and blue palette in `css/lp-detail.css`.

## Shared header

- Use the same sticky masthead across pages, with email and LinkedIn as icon links at the right.
- Keep a clear current-page indicator, including the compact mobile header and accessible `aria-current` state.

## Repository and link lists

- Remove the GitHub Repositories section, navigation and gallery entries, renderer, data, config, and feature documentation.
- Use editorial rows with vertical rules and no HTML tables for course, case study, resource, and live project lists; keep the homepage directory rows ruled too.
- Use accessible icon-only outbound links for courses, case studies, resources, and competition details. The live project row remains one accessible link.

## Course Repository

- Show columns in this order: S.no, Course name, Rating, Duration, link icon.
- Add “hours” to numeric durations, keep already unitized text, and omit the repeated domain label in a filtered domain view.

## Typography and calendar

- Use the homepage Internship Committee display font for headings across pages.
- Make the Case Competitions calendar translucent and keep its colors within the cream/navy palette.

## References

- Image 1 is a row-and-column list reference with thin vertical separators; it is not a table or a copy source.
- Image 2 is the oversized navy serif heading reference; use the site's Internship Committee display font.
