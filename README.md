# SSB C4 · Interview & Offer flows — interactive prototype

Clickable prototype of the **SSB Interview & Offer Flow + Dashboard Build Scope (v2)**: the lead (applicant) dashboard, the interviewer platform and the admissions CRM, all driven by one shared state so actions in one view show up in the others.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3100.

## Views

| Route | What it is |
|---|---|
| `/` | Flow map — Flow A (interview) and Flow B (offer → acceptance). Every box opens that state. |
| `/screens` | All screens — every screen / edge case as a card, searchable and filterable. |
| `/lead` | Applicant dashboard (booking, prep, reschedule, rounds, waitlist, reject, offer, payment, onboarding). |
| `/interviewer` | Interviewer platform (onboarding + contract, slots, interviews, feedback, payouts). |
| `/admin` | Admissions CRM (pipeline & pools, lead card, booking control, scholarship, letters, offer tracking, settings). |

## Getting around

- **‹ ›** in the top bar steps through all 44 screens in order.
- **Web / Mobile** toggle in the top bar: Mobile shows the same app inside a 390×844 phone frame with the mobile-web layout (hamburger menu, numbered step strip, full-width sticky CTA). The walkthrough, edge cases, stats, clock and reset all drive the phone.
- **Deep links:** `/lead?screen=A6` (reschedule), `A15` (waitlist), `L3` (payment), `L7` (onboarding) — see `/screens` for every ID.
- **Edge cases & stats** toggle: searchable list of every case plus cohort metrics (non-bookers, reschedules, no-shows, rounds, offer → accepted, gateway failures, payouts).
- **Clock menu:** jump simulated time (e.g. 20 h before the interview, past the offer deadline) to test time-based rules.
- **Reset** (↺) clears the demo state.

## Structure

```
app/            routes (flow map, screens gallery, lead, interviewer, admin) + globals.css
components/     shell, top bar, edge-case/stats panel, UI primitives
lib/model.ts    domain model + every action (booking, reschedule, verdicts, scholarship, offer, payment…)
lib/scenarios.ts  the 44 edge-case scenarios
lib/store.tsx   shared client state (persisted to localStorage)
public/         SSB mark + illustrations
```

## Notes

- Values not specified in the scope doc are illustrative: fee amounts, rubric metric names, tier → % table, interviewer names, onboarding form fields.
- Placeholder photos are from Unsplash; icons are Phosphor.
