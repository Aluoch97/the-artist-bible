# Project: The Artist Bible

## 1. Product Vision & Non-Negotiables
**The Artist Bible** is a completely free, ad-free, open-access Progressive Web App (PWA) designed to empower independent recording artists in the modern music economy. It bridges the gap between **music industry education** and **real-world execution** by pairing plain-English guides with interactive, browser-based studio utilities.

* **Zero Friction / No Auth:** No user accounts, logins, paywalls, or email gates. Users land on the app and immediately use every tool.
* **Zero Burn Rate ($0/mo):** 100% static client-side architecture deployed on **Cloudflare Pages** (`dist/` output only). Never introduce paid backends, databases, or server-side dependencies that require ongoing hosting costs.
* **Local-First Persistence:** All checklists, release timelines, and draft split sheets persist automatically in `localStorage` under a single versioned key (`artist_bible_v1`), paired with one-click `.json` Export/Import for cross-device backup.
* **Studio-Ready Offline PWA:** Configured with `vite-plugin-pwa` so artists can install it on iOS/Android/Desktop and use it offline in recording studios or venues.

---

## 2. Tech Stack & Conventions
* **Framework:** React 18+ with Vite and strict TypeScript
* **Styling & UI:** Tailwind CSS + `shadcn/ui` primitives + `lucide-react` icons
* **Design Aesthetic:** Clean, high-contrast, modern dark-mode studio aesthetic (think Ableton / Linear / Teenage Engineering utility). Fast keyboard/touch interactions, mobile-first responsiveness.
* **Content Engine:** MDX (`@mdx-js/rollup`) for educational chapters so interactive React widgets can be embedded directly inside prose guides. Include `/// <reference types="vite/client" />` and a `*.mdx` module declaration in `src/vite-env.d.ts` so TypeScript builds cleanly.
* **Client-Side Exports:** `jsPDF` (and clean `@media print` CSS) for downloadable split sheets and release plans.
* **Offline / PWA:** `vite-plugin-pwa` with service worker asset precaching.

---

## 3. Directory Architecture
```text
the-artist-bible/
├── CLAUDE.md                        # Master project specification (this file)
├── .github/
│   └── workflows/
│       └── weekly-audit.yml         # Automated weekly link & policy freshness check
├── public/
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # App icons (192x192, 512x512)
├── src/
│   ├── data/
│   │   └── industry-data.json       # Centralized volatile data (fees, timelines, URLs)
│   ├── content/                     # Evergreen MDX chapters with frontmatter metadata
│   │   ├── 01-creation-rights.mdx
│   │   ├── 02-distribution-metadata.mdx
│   │   ├── 03-royalties-collection.mdx
│   │   ├── 04-marketing-rollout.mdx
│   │   └── 05-red-flag-glossary.mdx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Navigation, PWA install prompt, Backup/Restore trigger
│   │   │   └── BackupModal.tsx      # Export/Import JSON progress modal
│   │   ├── triage/
│   │   │   └── HomeTriageHero.tsx   # 30-second intent router on landing screen
│   │   ├── tools/
│   │   │   ├── RoyaltyAudit.tsx     # Interactive "Get Paid Everything You're Owed" audit
│   │   │   ├── ReleaseCalculator.tsx # Backward release date planner + URL hash sharing
│   │   │   ├── SplitSheetBuilder.tsx # 200% song split calculator + PDF & SMS summary export
│   │   │   └── RedFlagDecoder.tsx   # Searchable predatory contract & scam glossary
│   │   └── ui/                      # Reusable UI primitives
│   ├── hooks/
│   │   └── useLocalProgress.ts      # Unified localStorage hook + JSON backup/restore
│   ├── types/
│   │   └── bible.ts                 # Strict TypeScript interfaces
│   ├── vite-env.d.ts                # Vite + MDX module type declarations
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

---

## 4. Data & Freshness Architecture

### A. Separation of Volatile Data (`src/data/industry-data.json`)
Never hardcode changeable industry numbers, pricing, or external URLs inside React components or MDX prose. Read them from `src/data/industry-data.json` so automated audits can update one file cleanly:

```json
{
  "lastVerified": "2026-11",
  "royaltyEntities": [
    {
      "id": "pro_ascap_bmi",
      "name": "PRO Registration (ASCAP or BMI)",
      "category": "Performance Royalties",
      "cost": "$0 (BMI Writer) / $50 (ASCAP Writer)",
      "officialUrl": "https://www.bmi.com",
      "secondaryUrl": "https://www.ascap.com",
      "whyItMatters": "Collects songwriter and publisher performance royalties when your music is streamed, broadcast, or performed live.",
      "steps": [
        "Choose one PRO (ASCAP or BMI—never register the same songs with both).",
        "Register as a Songwriter first; set up a Publisher entity when ready to claim the full 200%.",
        "Save your IPI/CAE number—you will need it for split sheets and The MLC."
      ]
    },
    {
      "id": "the_mlc",
      "name": "The MLC (Mechanical Licensing Collective)",
      "category": "Digital Mechanical Royalties",
      "cost": "$0 (100% Free)",
      "officialUrl": "https://www.themlc.com",
      "whyItMatters": "Collects U.S. digital audio mechanical royalties from Spotify, Apple Music, and DSPs that your distributor does NOT collect.",
      "steps": [
        "Create a free Member account at themlc.com.",
        "Connect your PRO IPI number and claim your catalog using your ISRC/ISWC codes."
      ]
    },
    {
      "id": "soundexchange",
      "name": "SoundExchange",
      "category": "Digital Radio Performance",
      "cost": "$0 (100% Free)",
      "officialUrl": "https://www.soundexchange.com",
      "whyItMatters": "Collects neighboring rights / digital performance royalties from Pandora, SiriusXM, and webcasters.",
      "steps": [
        "Register as both Featured Artist and Sound Recording Copyright Owner (if independent).",
        "Submit your ISRCs to claim historical and ongoing royalties."
      ]
    },
    {
      "id": "artist_profiles",
      "name": "DSP Artist Profiles (Spotify & Apple Music)",
      "category": "Analytics & Pitching",
      "cost": "$0 (100% Free)",
      "officialUrl": "https://artists.spotify.com",
      "secondaryUrl": "https://artists.apple.com",
      "whyItMatters": "Required to pitch unreleased music to editorial playlists and customize your artist profile.",
      "steps": [
        "Claim your profile immediately after uploading your first release to your distributor.",
        "Pitch unreleased tracks at least 21 days before release day."
      ]
    }
  ],
  "releaseMilestones": [
    { "id": "masters_art", "weeksOut": 6, "label": "Finalize 24-bit WAV masters, 3000x3000px cover art, and lyrics" },
    { "id": "distributor_upload", "weeksOut": 4, "label": "Upload to distributor & lock in ISRC/UPC codes" },
    { "id": "editorial_pitch", "weeksOut": 3, "label": "Submit Spotify for Artists & Amazon Music editorial pitch (hard deadline)" },
    { "id": "pro_mlc_reg", "weeksOut": 2, "label": "Register song splits with PRO (ASCAP/BMI) and The MLC" },
    { "id": "presave_epk", "weeksOut": 1, "label": "Launch pre-save link, finalize EPK, and schedule teaser clips" },
    { "id": "release_day", "weeksOut": 0, "label": "Release Day: Submit ISRCs to SoundExchange & push primary CTA" }
  ]
}
```

### B. Automated Freshness & Verification
* **Verification Badge:** Every MDX chapter frontmatter must include `lastVerified: "YYYY-MM"` and render a subtle `Verified: Nov 2026` badge at the top of the page.
* **Crowdsourced Flagging:** Every guide footer includes a `"Spot outdated info?"` link opening a pre-filled GitHub Issue URL for that specific chapter.
* **Weekly Audit Workflow (`.github/workflows/weekly-audit.yml`):** Include a scheduled Sunday cron workflow using Node.js/curl to verify all URLs in `src/data/industry-data.json` return HTTP `200` and fail the check (opening an issue/alert) if any official portal URL breaks or redirects unexpectedly.

---

## 5. Core Feature Specifications

### 1. Home Screen: "30-Second Triage" (`HomeTriageHero.tsx`)
Greet users immediately with three clear workflow cards instead of a dense table of contents:
* **"I'm about to drop a song"** $\rightarrow$ Navigates to **Release Timeline Calculator**.
* **"I have music out—am I missing money?"** $\rightarrow$ Navigates to **Royalty Setup Audit**.
* **"I'm in the studio with collaborators"** $\rightarrow$ Navigates to **Split Sheet Builder**.
* Below the triage cards, display overall user progress (e.g., *"Royalty Infrastructure: 2/4 Complete"*) and quick access to the **Lifecycle Chapters** and **Red Flag Glossary**.

### 2. Royalty Setup Audit (`RoyaltyAudit.tsx`)
* Renders interactive checklist cards from `industry-data.json`.
* Each card displays completion status, cost badge (highlighting `$0 Free`), expandable step-by-step instructions, and direct official external links (`target="_blank" rel="noopener noreferrer"`).
* Checking items immediately updates `useLocalProgress` and recalculates the user's "Royalty Readiness %" progress bar.

### 3. Backward Release Timeline Calculator (`ReleaseCalculator.tsx`)
* **Inputs:** Release Title, Release Type (`Single`, `EP`, `Album`), and Target Release Date (`<input type="date">`).
* **Calculation:** Subtracts `weeksOut` from the target release date to display exact calendar dates and interactive checkboxes for each milestone.
* **URL Hash / Query Sharing (Zero-Backend Viral Loop):** Encode release state into URL search params (`?title=...&type=...&date=YYYY-MM-DD`). Provide a **"Copy Shareable Link"** button so artists can text the pre-populated schedule to managers, engineers, or videographers. Loading a URL with these params automatically hydrates the calculator.

### 4. Interactive Split Sheet & "200% Song" Builder (`SplitSheetBuilder.tsx`)
* **Visual Breakdown:** Clearly illustrates the **200% of a song** (100% Master Recording + 100% Musical Composition/Publishing).
* **Collaborator Rows:** Dynamic add/remove rows with Name/Stage Name, Role (`Producer`, `Songwriter`, `Vocalist/Artist`, `Engineer`), Optional PRO/IPI #, Master %, and Publishing %.
* **Validation:** Real-time sum indicators that turn green at `100%` and warn if Master or Publishing totals do not equal `100%`.
* **Dual Export:**
  1. **Download PDF (`jsPDF`):** Clean, formal split sheet agreement with signature lines and date stamp.
  2. **Copy Text Summary:** Copies a clean, formatted plain-text breakdown formatted for iMessage/WhatsApp group chats, ending with `"Generated via The Artist Bible"`.

### 5. Lifecycle Chapters & Red Flag Decoder (`RedFlagDecoder.tsx`)
* **MDX Chapters:** Concise, jargon-free guides covering Creation & Rights, Distribution & Metadata, Royalties & Publishing, and Marketing & Rollout.
* **Red Flag Glossary:** Filterable/searchable cards decoding predatory industry traps into plain English—covering things like *360 deals*, *perpetual master ownership*, *pay-for-play playlisting bots*, and *hidden distributor renewal fees*.

---

## 6. State Management Contract (`src/hooks/useLocalProgress.ts`)
Persist all user state under `localStorage` key `artist_bible_v1`:

```ts
export interface Collaborator {
  id: string;
  name: string;
  role: string;
  ipi?: string;
  masterPct: number;
  publishingPct: number;
}

export interface SavedRelease {
  id: string;
  title: string;
  type: 'single' | 'ep' | 'album';
  releaseDate: string; // YYYY-MM-DD
  completedMilestoneIds: string[];
}

export interface ArtistBibleState {
  version: 1;
  completedAuditIds: string[];
  activeRelease: SavedRelease | null;
  splitSheetDraft: {
    songTitle: string;
    sessionDate: string;
    collaborators: Collaborator[];
  };
}
```

Expose helper methods: `toggleAuditItem`, `saveRelease`, `toggleReleaseMilestone`, `updateSplitSheet`, `exportBackupJson()`, and `importBackupJson(file)`.

---

## 7. Build & Verification Checklist for Claude Code
When executing this spec:
1. Scaffold Vite + React + TypeScript + Tailwind CSS and install `lucide-react`, `jspdf`, `vite-plugin-pwa`, and MDX support (`@mdx-js/rollup`).
2. Create `src/data/industry-data.json` and `src/hooks/useLocalProgress.ts` first so all components share a single source of truth.
3. Build all four interactive tools (`RoyaltyAudit`, `ReleaseCalculator`, `SplitSheetBuilder`, `RedFlagDecoder`) and the `HomeTriageHero` landing flow.
4. Write the 5 concise, high-signal MDX chapters with `lastVerified` metadata and the `"Spot outdated info?"` footer link.
5. Add `.github/workflows/weekly-audit.yml` to check external URLs in `industry-data.json`.
6. Run `npm run build` and verify zero TypeScript errors, zero broken imports, and clean static output in `dist/` ready for Cloudflare Pages.

---

## 8. Documented exception: optional Contract Check (added after v1)
The spec's "100% static, no backend" rule has **one deliberate, optional exception**: `functions/api/review-contract.ts`, a Cloudflare Pages Function that calls Workers AI for the AI contract review. Everything else (including the instant on-device contract scan) stays static and local-first.

Guardrails that keep it consistent with the non-negotiables:
* **$0 / fail-closed:** it does nothing unless both bindings exist: `AI` (Workers AI) and `BUDGET` (a KV namespace holding only counters). Daily budget is capped well under Workers AI's free 10,000 neurons/day; each person is limited to 3 reviews/day.
* **Privacy:** nothing is stored except a daily neuron total and a hashed per-person counter that expires. The UI requires explicit consent, offers redaction, and shows exactly what will be sent. The app must keep working fully with the function absent.
* **Setup (Cloudflare dashboard, Pages project > Settings > Bindings):** add Workers AI as `AI`; create a KV namespace and bind it as `BUDGET`.
* Tests: `functions/api/review-contract.ts` exports its handlers so they can be exercised with a fake `AI` and `BUDGET`.
* **Second optional function: `functions/api/admin.ts`** (added Nov 25, 2026, owner request: "an admin page like my other apps"). It only switches on when the Cloudflare secret `ADMIN_PASSWORD` (10+ characters) exists; otherwise `/admin` says sign-in is not set up. It stores nothing about visitors; the only thing it keeps is a wrong-password counter (scrambled address, expires in 15 minutes) in the existing `BUDGET` KV. It reports yes/no facts about bindings and today's AI budget use. Setup in `docs/admin-setup.md`; tests exercise the handlers with a fake `BUDGET`.

---

## 9. Pinned decisions (open, not started)
* **AI review capacity / accounts (pinned 2026-11-25).** The AI contract review runs on Workers AI's shared free pool (~10,000 neurons/day account-wide). The function caps itself at 6,000/day and 3 reviews per person, which is roughly 10-20 large reviews/day. **Accounts would not add capacity**; they would only change who gets the slots. Options discussed, none chosen:
  1. *More capacity, no accounts:* use a smaller model (Llama 3.1 8B uses ~6x fewer neurons, ~60-90 free reviews/day) and cache repeat contracts. Stays $0 and login-free; lower quality.
  2. *Pay per use, no accounts:* Cloudflare Workers Paid, ~$0.004 per review on the 70B model (~$13/month at 100/day) with a hard monthly cap built in. No longer $0.
  3. *Optional accounts:* reuse the NuRenaissance login (`nrnszn-app` has an accounts system) for per-person limits and cross-device sync. Tools stay usable signed out. Large build; requires updating the privacy policy and the "nothing leaves your device" promise.
  4. *Option 1 now, accounts later* if people ask to sync across devices.
  Recommendation was option 1 (or 4). Revisit when the owner decides.
* **Not yet done:** a real end-to-end AI review has not been run on the live site (only the safety limits and screens were tested with a stand-in). First live review should be checked for quality, and prompts tuned if needed.

---

## 10. Theming (added after v1)
Two themes, both warm and built around the logo: **dark** (warm brown, the original studio feel) and **light** (lighter, peachier). The device setting decides by default; a header sun/moon button and About > Appearance override it.
* Tokens live in `src/index.css` (`:root` = dark, `:root[data-theme='light']`, plus a no-JS fallback that follows the device). Never hardcode colors in components; use the tokens (`bg-bg`, `text-fg`, `text-accent`, ...).
* `public/theme-init.js` runs before first paint (kept external because the CSP forbids inline scripts) so there is no flash of the wrong theme. Preference is stored in `artist_bible_ui_v1` (UI only), never in `artist_bible_v1`.
* Orange is the brand accent; **green means success** and must not be replaced by the accent. Check contrast in both themes (axe) after any palette change.

---

## 11. UI direction (added after v1)
Glass-and-gradient look inspired by modern course apps, in the logo's colors: a soft ambient glow behind every screen, translucent frosted cards (`--surface` is a translucent token; use `--surface-solid` where something must be opaque), a floating glass pill tab bar with a raised Home button, colorful pastel gradient cards with dark text for the three main starting points, and a hero where the logo artwork breaks out of its card. Headings use **Manrope** (a modern sans); body text uses Inter. The Release page has a "week strip" of circles, one per plan step, that jumps to each step.
* Floating bars use mostly-opaque `--glass` so they stay readable where `backdrop-filter` is unsupported.
* Visually hidden helper text inside scrolling rows must sit inside a `relative` ancestor, or it can widen the whole page on phones.

---

## 12. Tools tab and streaming estimate (added after v1)
* The fourth tab is **Tools** (`/tools`, `src/pages/ToolsPage.tsx`). It lists every interactive helper; add new tools to the `TOOLS` array there and give their page a `<BackToTools />` link. The tab also stays highlighted on `/split-sheet` and `/streams` (see `also:` in `AppShell.tsx`).
* **Streaming earnings estimate** (`/streams`) uses per-stream ranges from `streamingRates` in `src/data/industry-data.json`. Platforms don't publish these, so they are third-party estimates: keep them as ranges, keep the "range, not a promise" wording, and re-check them with the human-checked claim `streaming_rate_ranges`.

---

## 13. Songs, shows, press kit, budget, calendar, motion (added after v1)
* New tools (all on the Tools tab, all local-first): **My songs** (`/songs`, per-song registration tracker), **Live show log** (`/shows`, setlist text for BMI Live / ASCAP OnStage), **Press kit and pitch** (`/epk`, one-page PDF + pitch text), **Release budget** (`/budget`). The Release page also has **Add to calendar** (`src/lib/ics.ts`, downloads a `.ics`).
* Their data lives in the same `artist_bible_v1` key as new, additive fields: `catalog`, `shows`, `epk`, `budget`. `sanitizeState` fills defaults, so older backups still load. Never rename or remove these; only add.
* **Motion** lives at the bottom of `src/index.css` (`.page-enter`, `.stagger`, `.pop`, `.float`, `.lift`, dialog open). It is all inside `prefers-reduced-motion: no-preference` and is disabled in print. Keep new animation short (about 0.3s), CSS-only, and in that block. Test accessibility with reduced motion on so axe reads final colors.

---

## 14. Tap to update, versions and /admin (added after v1)
* **Tap to update** (same as the other NuRenaissance apps): `public/update-banner.js` (loaded from `index.html`) remembers `/version.json` at load and shows "A new version is ready. Tap to update." when a later check differs (on return to the app, when back online, every 5 minutes). Tapping clears saved app files and reloads; saved work in `artist_bible_v1` is untouched. Never shown on `/admin` or in a frame. `npm run build` runs `scripts/stamp-version.mjs` after `vite build`, which writes `dist/version.json` (fingerprint + release). `version.json` is excluded from the precache (`globIgnores`) and served `no-store`.
* **Versions:** short numbers (1.1, 1.2 ...) from the newest `## x.y` heading in `CHANGELOG.md`. Every change visitors can see adds a block at the top of `CHANGELOG.md` and bumps the number by one step (a redesign starts a new first number).
* **/admin** (`src/pages/AdminPage.tsx`, `noindex`, left out of the sitemap, linked small in the footer): password sign-in via `functions/api/admin.ts`, then Status (bindings, yes/no), AI contract review (today's budget use), Content freshness (human-checked claims and their dates, audit links) and Account (version, Refresh, Sign out). The 30-day token is kept in `localStorage` under `artist_bible_admin`, never in `artist_bible_v1`. When you add something owner-only, add it there; never show visitor data (there is none).

---

## 15. One place for everything, and lazy pages (added Nov 26, 2026, after the redundancy check)
* **Redundancy rule (part of a "full check"):** a feature, text or idea lives in ONE place; everywhere else links to it. Do not embed a whole tool inside a guide, and do not repeat the same status or explanation on the same screen. Current homes: Red flags = the Red flags page (Learn); Get Paid checklist = `/audit`; release timeline = the Release planner; **Contract check = Tools** (`/contract`, highlights the Tools tab); U.S.-only explanation = Get Paid, About and the Outside the U.S. guide (other places may only carry a short label or pointer).
* Learn has three tabs (Guides, Red flags, Words). Home shows the three starting cards and a short "More to explore" row (Guides, Red flags, All tools); there is no separate progress list.
* **Pages load on demand:** every page except Home is `React.lazy` in `src/App.tsx`, and guide bodies load per chapter (`src/content/index.ts` uses `?frontmatter`, handled by the small plugin in `vite.config.ts`, so lists read only the front matter). All chunks are still precached for offline use. Keep new pages lazy.
* **CSP:** `style-src 'self'` (no inline styles). Style through Tailwind classes or the DOM `style` property; never write `style="..."` in markup or set it with `setAttribute('style', ...)`.
