# Larga web design

## Purpose

Help commuters find a jeepney and understand its route and fare quickly. The
front page should feel like a local transport service: welcoming, clear, and
recognizably Larga.

## Brand

- Keep the original Larga wordmark and orange `#f57c1f` prominent.
- Use warm ivory `#fffaf4` for the route board and dark brown `#291608` for text.
- Use Baloo 2 for the main brand headline; use the system sans-serif for controls,
  fares, and supporting text.
- Give orange buttons dark text. Reserve white text for dark backgrounds.

## Front page

- Preserve the two-part layout: orange introduction and a practical route board.
- Keep one main action, **Open live map**, visible before the route list on phones.
- Let commuters choose a destination town. Show only routes with that town as a
  defined endpoint; do not imply support for intermediate stops.
- A destination-specific route link opens the map in the matching direction.
  Without a destination, show both directions.
- Read route names, towns, and fares from `src/constants/routes.js`.
- Align fares in a consistent column and explain that they are end-to-end,
  per-person, one-way fares.
- Use simple separators and whitespace. Keep content in the normal document flow
  so narrow screens can wrap and scroll without overlap.

## Restraint

Avoid decorative gradients, floating badges, wave shapes, promotional stat cards,
repeated feature tiles, generated hero illustrations, and attention-grabbing
animations. Add visual detail when it clarifies a destination, fare, or action.

Do not advertise notifications, traffic-aware arrival times, or live availability
unless the current implementation supports them. Route availability and live
driver availability are different things.

## Components and navigation

Use the installed shadcn/ui components for buttons and shared controls. Keep
native selects when they provide a simpler keyboard and mobile experience.

Pass static class strings to router links inside Radix `asChild` wrappers.
Do not pass `NavLink` class callbacks through those wrappers; Radix can serialize
the callback and break the navigation layout.

## Review

- Check the front page at narrow mobile, tablet, and desktop widths when browser
  capture is available. Do not claim visual verification from a build alone.
- Verify that destination filtering, clearing the destination, route links,
  driver sign-in, and keyboard focus still work.
- Run the production build after UI changes. Use `npm run test:navigation` when
  changing the commuter shell or navigation behavior.
- Include a suggested commit message when handing off code changes.
