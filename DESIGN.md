# freestack design

The reference screens live in `design/fresh/*.dc.html`. They are mockups: match their structure, copy and tokens, but build with the real components in `src/components/`.

## The idea

Every tool costs $0, so a label never leads with price. Each tool gets a **shelf label** whose big number is the one limit its aisle cares about. Under it: the exact limits, who can claim it, whether you can sell with it, whether signup asks for a card, the catch, and when someone last checked it.

## Tokens

| Name | Hex | Use |
|---|---|---|
| Ink | `#1C2340` | Text, header, primary buttons, filled scale steps |
| Shelf | `#E7E9EC` | Page background, empty scale steps |
| Label | `#FFFFFF` | Labels, fields, panels |
| Promo | `#FFD23F` | The Suggested tag and one main action per screen. Nothing else. |
| Recheck | `#FFB27A` | Only for labels overdue a check (over 90 days) |
| Muted | `#545B73` | Secondary text and unknowns |
| Focus | `#2F45E0` | Keyboard focus ring on light areas. Yellow (`#FFD23F`) inside navy areas. |

Type is one family, **Archivo**, in three widths:
- Extra Condensed Black (`font-stretch: 62%; font-weight: 900`) for limits and page titles. Line height 1 or more, never tighter (tight settings made descenders collide).
- Expanded Black (`font-stretch: 125%`) for the wordmark and group headers.
- Regular and Bold for everything people read.

No second typeface. No monospace for data labels.

## The label

Top to bottom:
1. Name and a short kind ("Serverless Postgres").
2. **Two columns.** Left: the exact headline number in the aisle's unit (`0.5 GB`). Right: a word plus a **5-step scale** comparing it with the biggest in the aisle. Words: Small (1), Fair (2), Medium (3), Big (4), Biggest (5). Each step is a fifth of the aisle maximum. Odd cases: "?" with "Not listed", or "No limit" with "Your own disk".
3. Fine print: the other exact limits, one per line.
4. One line of three items: **Open to all**, **Can sell** (check or cross), and the **card** item (credit-card icon: crossed out = "No card", plain = "Card needed", dashed gray = "Card unknown"). A check is always good news. Screen readers get one full sentence per item ("No credit card needed.").
5. The catch, if any, with the wrench icon. A few words, one line.
6. The status strip (see states).
7. A full-width "+ Compare" toggle.

### Label states

| State | Strip | Rule |
|---|---|---|
| Not checked | Plain white strip, muted "Not checked yet", and a "Check it" link | Default for imported catalog data. Quiet on purpose: at launch most labels are in this state. |
| Checked | Navy strip, yellow check, "Checked 3 days ago by Karlo" | Checked within 90 days. **Only this state can earn the Suggested tag.** |
| Overdue | Orange, "Checked 24 Jul. Due for a recheck", and "Recheck it" | Last check over 90 days old. Shown, never suggested. |
| Change waiting for review | Light gray with a wrench, "A change is waiting for review" | Someone marked a line "Changed". Lasts until a maintainer applies or rejects it. |
| Vendor changed | Navy with a yellow wrench, plus a "Recheck this label" link | The weekly scan saw the pricing page change |
| From an awesome list | Gray "?" number, "From free-for-dev. No numbers yet" | Imported, unlabeled. Search only, no filters. |

Every strip is at least 44px tall, because most of them hold a link.

## Aisles

- Each aisle has **one headline metric**, defined in data, in one unit. Databases: free storage in GB. Cache and queues: commands a day. Hosting: requests a day. If a tool doesn't have the aisle's metric, it belongs in another aisle.
- Groups: **Build**, **AI**, **Free and Open Data**, **Claim Once** (title case for group headers only).
- Programs in Claim Once use their own label: the big number is how long it lasts ("2 yrs", "Enrolled"), plus what you need to claim it.

## Pages

`docs/SCREENS.md` has every route, its boards, and the states and edge cases each one must handle. The canvas groups boards the same way.

| Tier | Page | Desktop board | Phone board |
|---|---|---|---|
| Main | Home | `Home.dc.html` | `PhoneHome.dc.html` |
| Main | Aisle | `Aisle.dc.html` | `Phone.dc.html`, `PhoneSheet.dc.html` |
| Main | Tool | `Tool.dc.html` | `PhoneTool.dc.html` |
| Main | Compare | `Compare.dc.html` | `PhoneCompare.dc.html` |
| Main | Build a stack | `Builder.dc.html` | `PhoneBuilder.dc.html` |
| Main | Search | `Search.dc.html` | `PhoneSearch.dc.html` |
| Main | Aisles menu | `AislesMenu.dc.html` | `PhoneMenu.dc.html` |
| Side | Check my stack | `CheckStack.dc.html` | reflows |
| Side | Catch page | `Trap.dc.html` | reflows |
| Side | Claim Once aisle | `Programs.dc.html` | reflows |
| Side | For coding agents | `Agents.dc.html` | reflows |
| Side | Copy this stack (dialog) | `CopyStack.dc.html` | reflows |
| Supplemental | Check a label | `Verify.dc.html` | `PhoneVerify.dc.html` |
| Supplemental | Add a tool | `AddTool.dc.html` | reflows |
| Supplemental | Add a tool: sent | `AddToolSent.dc.html` | reflows |
| Supplemental | Label and page states | `States.dc.html` | |
| Misc | Not found | `NotFound.dc.html` | reflows |
| Misc | Edge cases | `Edges.dc.html` | |
| Misc | Brand | `Brand.dc.html` | |

"Reflows" means the desktop board is a fluid page: build it once and check it at 390px.

## Navigation

The header has the wordmark on the left, a centered search trigger with a Ctrl K hint, and on the right an "Aisles" menu plus "Add a tool". There's no separate Compare or Home link in the nav. The wordmark goes home, and compare is reached from the aisles.

The Aisles menu lists every aisle by group, then Build a stack, Check my stack and For coding agents. On a phone, the menu button opens the same list full screen. The footer repeats Check my stack and For coding agents.

## Copy rules

- Never explain the design to the user. Show it.
- One idea per line. Everyday words. No jargon (egress, JSONB) unless the reader needs it.
- Numbers come before adjectives, and the number is always the exact vendor figure. Never an estimate presented as fact.
- Lead with the catch. Admit unknowns and invite people to check them.
- Sentence case everywhere except group headers.
- Never say "generous free tier", and never say "verified" when nobody checked.

## Accessibility floor

- Touch targets are at least 44px.
- Every icon has a text equivalent.
- Shaded "differs" rows are also marked in text.
- Focus is always visible.
- Phone screens never scroll horizontally.
