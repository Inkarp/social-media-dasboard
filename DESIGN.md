# Redesign — three directions

Branch: `redesign`. No color or font constraint carried over from the current
build (confirmed with the client — full open palette).

Grounding fact used below: Inkarp distributes scientific/lab-instrument brand
principals (Bruker, Heidolph, Waters, Polyscience...) and this tool tracks
their social/trade-show campaign compliance against a yearly quota, brand by
brand. Each direction pulls from a different real part of that world rather
than a generic "clean SaaS dashboard" look.

Previews: `/design/option-1`, `/design/option-2`, `/design/option-3`.

---

## Option 1 — Calibration

**Concept.** The subject of this dashboard is instrumentation — literally,
the brands it tracks are lab-instrument manufacturers. Borrow the visual
language of the equipment itself: a calibration console, not an admin panel.
Dark graphite chassis, tick-marked dials in place of plain bars, an amber
signal color the way instrument panels use amber for "attention" and cyan
for "nominal."

**Palette**

| Token | Hex | Role |
|---|---|---|
| `graphite-950` | `#12161B` | page background (dark) |
| `graphite-900` | `#1B2129` | surface |
| `graphite-800` | `#232B34` | raised / hover |
| `signal-amber` | `#E8A33D` | primary accent, CTA, focus |
| `signal-cyan` | `#4FC1E0` | on-track / positive |
| `signal-red` | `#E0524F` | alert / behind |
| `mist` | `#8A96A3` | muted text |

Neutral ramp (dark default): `#12161B · #1B2129 · #232B34 · #2C3540 · #445162 · #6B7887 · #8A96A3 · #C5CBD2 · #EDEFF1`
Light variant: `#F4F6F8 · #FFFFFF · #FFFFFF (bordered) · #E8ECEF · #C7CED4 · #93A0AB · #5B6670 · #2B333B · #14181C`

**Type.** Space Grotesk for UI and headings — a geometric grotesque with a
slightly technical, drafting-table feel. Space Mono for every figure, dial
label, and table number.

**Signature element.** The calibration dial: a semicircular tick-marked
gauge with a filled arc and a target notch, replacing the plain progress
bar for the completion metric. It's the one place personality concentrates;
everything else stays quiet plate metal.

**What it trades away.** Colder and less "office-friendly" than a
conventional light dashboard — this is a console, not a form. Dark-by-default
asks more of an 8-hour daytime user than a light UI would. The dial is
genuinely harder to keep legible at small sizes than a bar, so it needs a
minimum footprint wherever it's used.

---

## Option 2 — Ledger

**Concept.** Strip away the "dashboard" framing and look at what the app
actually is: a compliance ledger — quota vs. actual, brand by brand, quarter
by quarter. Build it like an accounting register, not a terminal: a running
balance treatment for "against plan," black ink for on-plan, red ink for
behind — the literal, centuries-old meaning of "in the red" applied to a
posting quota instead of a P&L.

*(Self-check: my first pass at this direction was a generic dark ops
terminal with four rotating data-hues — the kind of look that would show up
in an inventory tracker or a DevOps dashboard with zero changes. That's a
default, not a choice for this app. Rewritten to lean on the literal
bookkeeping metaphor instead, which only makes sense for a quota/compliance
tool.)*

**Palette**

| Token | Hex | Role |
|---|---|---|
| `ledger-paper` | `#0D1117` | page background (dark) |
| `ledger-page` | `#151B23` | surface |
| `ledger-raised` | `#1D2530` | raised / hover |
| `ink-black` | `#E6E9EE` | on-plan figures, primary text |
| `ink-red` | `#D9636B` | behind-plan figures, deficit |
| `balance-teal` | `#2FB897` | ahead-of-plan / surplus |
| `rule` | `rgba(255,255,255,.09)` | column rules |

Neutral ramp (dark default): `#0D1117 · #151B23 · #1D2530 · #262F3B · #3A4553 · #565F6C · #7C8797 · #B7BFC9 · #E6E9EE`
Light variant: `#F7F8FA · #FFFFFF · #FFFFFF (ruled) · #E9EBEE · #CBD0D6 · #98A0A9 · #6B7480 · #33393F · #10151C`

**Type.** Public Sans for UI. Roboto Mono for every ledger figure — a
plainer, more "printed register" mono than a code-editor font.

**Signature element.** The allocation strip: one contiguous ruled bar per
brand, split into planned / implemented / pending segments with a running
total posted at the end, styled like a ledger line rather than a progress
bar. Same three states the schema already tracks — nothing invented.

**What it trades away.** Leans on red/black meaning something specific
(surplus/deficit), which is a stronger semantic commitment than a neutral
palette — it has to stay disciplined everywhere or the metaphor breaks.
Dense ruled rows read as "spreadsheet" faster than the other two directions
if spacing isn't held generous.

---

## Option 3 — Trade Ledger (print/catalog)

**Concept.** The posts this tool tracks are literally catalog and trade-show
material for the principals it lists. Frame the app like the distributor's
own print production system — a spec-sheet, purchase-order register world —
rather than software chrome: ruled tables, a masthead serif for section
titles, registration-mark corner ticks borrowed from print production.

**Palette** (cool paper, not the warm-cream/terracotta cliché)

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F1F3EF` | page background (light) |
| `sheet` | `#FFFFFF` | surface / card |
| `ink-navy` | `#1F2A3A` | headings, primary text |
| `rule` | `#D6D9CF` | table/card rules |
| `forest` | `#2E6B4F` | primary accent, CTA |
| `ochre` | `#B98A2E` | status / secondary accent |
| `slate` | `#3B5875` | links, tertiary |

Neutral ramp (light default): `#F1F3EF · #FFFFFF · #FFFFFF (ruled) · #E4E6DE · #C9CDBF · #9BA096 · #6B7267 · #3C4139 · #1F2A3A`
Dark variant: `#14181A · #1D2320 · #242B26 · #333A33 · #565F54 · #838C7C · #B7BEAE · #DEE1D6 · #F2F3ED`

**Type.** Source Serif 4 for headlines and section masts. Inter for UI and
body. IBM Plex Mono for figures, set with old-style ruled columns rather
than a code-editor grid.

**Signature element.** The spec block: a ruled card with a printer's
registration-mark tick at one corner and a thin rule under its label row,
used for every stat tile and post card — styled like a spec sheet pulled
from an actual product catalog, not a rounded SaaS card.

**What it trades away.** The serif masthead reads more "publication" than
"live tool," which risks making the app feel more static than it is if
overused — reserved for section titles only, never body copy or numbers.
Rule-heavy tables need generous row height or they collapse into a plain
spreadsheet look, losing the catalog feel entirely.

---

## Self-critique summary

Applied the "would this show up in an unrelated app" test to all three:

- **Calibration** passes — the dial and the amber/cyan signal-color logic
  only make sense because the tracked brands are literal instruments.
- **Ledger** did not pass on the first draft (generic dark ops-terminal with
  rotating accent hues); rewritten around the literal red-ink/black-ink
  bookkeeping convention, which only makes sense for a quota/deficit
  tracker.
- **Trade Ledger** passes — grounded in the fact that the posts being
  tracked are real catalog/trade-show material, and the registration-mark
  motif is a genuine print-production reference, not a decorative flourish.
