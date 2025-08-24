# Dark Mode Support

> Add an appearance toggle so users can switch between light and dark themes.

## Problem Statement
Users working at night or in low-light environments report eye strain and prefer a darker UI option.

## Goals
- Improve session duration for night users
- Increase user satisfaction (CSAT +10%)

## Non-Goals
- Theming for third-party embeds

## Target Users & Personas
- Power users who work late
- Accessibility-focused users

## Assumptions
- System prefers-color-scheme is available in most modern browsers

## Success Metrics
- Adoption rate of dark mode > 40% in 30 days
- CSAT for UI theme settings > 4.2/5

## Requirements
- As a user, I can toggle dark mode from the header
- As a user, my preference persists across sessions and devices

## Risks & Mitigations
- Risk: Color contrast issues → Mitigation: WCAG AA checks in design QA