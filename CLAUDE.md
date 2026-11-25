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
