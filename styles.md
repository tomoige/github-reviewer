# GitHub Profile Analyzer — Design Spec v3 (Warm + Compact)

---

## 1. Visual Identity & Concept

**The Vibe:** A warm, dense developer dashboard. We keep the warm parchment palette, but the layout is tight and information-rich — closer to a compact analytics tool than a luxury magazine. Every screen should earn its space; no oversized hero, no luxurious whitespace.

**Distinct from Claude:** The warmth stays, but we deliberately drop the big-serif editorial styling that reads as "Anthropic/Claude". Headings are **sans-serif (DM Sans, bold)**, type is smaller, and cards are compact. Serif is avoided entirely.

**Personality:** Opinionated, a little cheeky, but credible. The summary card should feel like something a sharp senior engineer would say at a code review — not a chatbot error message.

**One Unforgettable Thing:** A compact deep-teal score gauge with a clean, bold sans/mono number — a precise instrument readout, not a vintage speedometer.

---

## 2. Color Palette — "Vintage Atlas" (Light / Warm)

Warm and editorial, but **deliberately not Claude's terracotta-on-parchment**. The neutrals are a cooler warm *sand* (less peachy), and the hero accent is a **deep teal** jewel tone instead of clay orange — the feel is a vintage atlas / science journal rather than a magazine.

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#EBE7DD` | Main background — warm sand |
| `--bg-card` | `#F6F3EC` | Card surfaces — light sand |
| `--bg-card-alt` | `#E2DCCD` | Inset/tinted cards, input backgrounds |
| `--accent-primary` | `#136F63` | Deep teal — primary CTAs, score ring, highlights, links (Tailwind token: `primary`) |
| `--accent-positive` | `#4A7A2C` | Olive green — positive metrics, "strength" indicators |
| `--accent-negative` | `#9A3324` | Oxblood — critical weaknesses, summary card border |
| `--text-primary` | `#1C1410` | Near-black with a warm undertone |
| `--text-secondary` | `#6B5E52` | Muted warm brown for labels and meta |
| `--text-on-accent` | `#F7F4EC` | Off-white text on colored backgrounds |
| `--border` | `#CEC8B6` | Subtle warm dividers |
| `--summary-bg` | `#14211F` | Dark petrol — summary card background |
| `--summary-text` | `#D9E0D5` | Pale sage — text on the summary card |

**Avoid entirely:** Terracotta/clay orange (too Claude), cold grays, electric indigo/purple, neon greens, pure black `#000`, pure white `#fff`.

---

## 3. Typography

**Headings & Display:** `"DM Sans"` — bold, humanist sans-serif. No serif anywhere. Headings are confident but compact, never oversized.

**Body / Labels:** `"DM Sans"` for body copy too. Keep it small and readable.

**Code / Numbers / Monospace:** `"JetBrains Mono"` for repo names, stats, the score number, and uppercase labels — this carries the "technical instrument" feel.

**Type Scale (compact):**
- Score number: `2.25–2.5rem` (`text-4xl`), DM Sans or mono, `font-weight: 700`
- Page hero headline: `1.5–1.875rem` (`text-2xl/3xl`), sans-serif bold
- Section headings: `1rem` (`text-base`), sans-serif bold
- Card labels: `0.7rem`, JetBrains Mono, `letter-spacing: 0.08em`, uppercase
- Body text: `0.875rem` (`text-sm`) / `1.5` line-height

---

## 4. Layout & Components

**Density rules (apply everywhere):**
- Card padding `16px` (`p-4`), `border-radius: 8–10px` (`rounded-lg`)
- Gaps between sections/cards `12–16px` (`gap-3`/`gap-4`, `space-y-4`)
- Page vertical padding modest (`py-10`), content width up to `~64rem`
- Prefer multi-column grids that use horizontal space over tall stacked cards

### Input Screen
- Centered but compact (modest vertical padding, not full-height/airy)
- A **sans-serif** headline (`text-2xl/3xl`, bold): *"Let's see what your GitHub says about you."*
- A single wide input field with a warm `2px solid var(--border)` border, `border-radius: 8px`, and a teal shadow on focus (`box-shadow: 0 0 0 3px rgba(19,111,99,0.22)`)
- CTA button: teal fill, off-white text, subtle hover darkening. Label: **"Analyze Profile"**

### Loading State
- A **vertical progress rail** — a thin teal line that fills downward — with three small sans-serif steps appearing sequentially:
  1. *Fetching GitHub data…*
  2. *Reading your repositories…*
  3. *Consulting the AI career counselor…*
- Calm and understated. No spinners, no bouncing dots, no skeletons.

### Report Dashboard

**Hero Header (compact):**
- Banner in `--bg-card-alt`, tight padding
- Developer's GitHub avatar in a small (`~56–64px`) warm sepia-tinted circle
- Username in mono, a one-line sans-serif bold "headline" (`text-xl/2xl`), and small mono stat chips (followers, repos)
- The **Overall Score** in a **compact** circular gauge (`~120px`) — SVG arc in teal, background arc in `--border`, with a bold sans/mono number

**Metric Cards Grid (4-up on wide screens):**
- Cards in `--bg-card`, `1px solid var(--border)`, `rounded-lg`, `p-4`
- Each card has:
  - A small UPPERCASE mono label (e.g., `DOCUMENTATION`)
  - A bold sans/mono score number in teal (`text-2xl/3xl`)
  - A thin teal bar showing score out of 100
  - Compact strengths (forest) / weaknesses (sienna) lists in `text-sm`

**The Summary Card:**
- Spans full width at the bottom
- Background: `#2A1208` (very dark warm brown — like aged leather)
- Left border: `4px solid var(--accent-summary)`
- Small wax-seal SVG mark in the top-right corner
- Headline in off-white **sans-serif** bold: *"The Honest Assessment"*
- Summary text in `#EDD5C0` — warm cream, readable against the dark background
- Authoritative and slightly savage, but compact

---

## 5. Texture & Atmosphere

- Apply a very subtle **paper noise texture** to `--bg-base` (SVG `feTurbulence` filter or a PNG overlay at `3–5%` opacity). This makes the whole page feel tactile and non-digital.
- Use **warm drop shadows** — never cold gray. Example: `box-shadow: 0 4px 24px rgba(100, 60, 20, 0.12)`
- Decorative micro-details: thin horizontal rules between sections using `border-top: 1px solid var(--border)`, slight indentation on blockquote-style callouts
- Avoid gradients unless they're warm (parchment to cream). No rainbow gradients, no blue-to-purple.

---

## 6. Interaction & Motion

- Page transitions: a simple `opacity` fade-in at `300ms ease` — not slide or bounce
- Card hover: a gentle `transform: translateY(-2px)` with shadow deepening. Subtle.
- Score ring: SVG `stroke-dashoffset` animation on mount, drawing the arc over `1.2s ease-out`
- No parallax. No scroll-triggered fireworks. Restraint is the personality here.

---

## 7. What to Avoid

| ❌ Don't | ✅ Do instead |
|---|---|
| Cold dark backgrounds (`#0B0F19`) | Warm parchment (`#F5F0E8`) |
| Electric indigo / neon accents | Deep teal + olive green |
| Big serif headings (the "Claude" look) | Bold sans-serif (DM Sans) headings |
| Luxurious whitespace / oversized hero | Compact, information-dense layout |
| Skeleton loaders with purple shimmer | Quiet teal progress rail |
| Glassmorphism / blur effects | Clean card surfaces with paper texture |
| Large emoji or icon-heavy UI | Restrained icons, mostly typographic |
| "AI-generated" gradient blobs | Solid warm surfaces with grain overlay |

---

## 8. Reference & Inspiration

- **Linear / Vercel dashboards** — compact, information-dense, confident spacing
- **GitHub's own UI** — familiar developer surfaces, tight cards, mono accents
- **Stripe docs** — clean sans typography + mono pairing, technical credibility
- Keep the **warm palette** of editorial tools, but the **density of a dev dashboard**
