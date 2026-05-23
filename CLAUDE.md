# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Marketing + support site for **Pulse**, a native iOS / Apple Watch app that turns HealthKit heart-rate data into widgets. Three static pages hosted on GitHub Pages: `index.html` (landing), `support.html`, `privacy.html`.

The repo is intentionally **separate from the app repo** and **public**. There are no secrets in it and there must not be — the email obfuscation contract (§Email below) is the only thing standing between `bearcave.my` and a scraped catch-all.

## Source-of-truth specs live in Obsidian, not this repo

The execution plan, page-by-page content spec, acceptance criteria, and locked decisions live in the user's iCloud Obsidian vault at:

```
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/BearlyMadStudios/Pulse/
```

Three docs matter for site work — read them before non-trivial changes:

- `Landing and Support Page.md` — original requirement (sketch only; superseded where it disagrees).
- `Landing and Support Page - Weaknesses and Workarounds.md` — strategic review (W1–W12).
- `Landing and Support Page - Implementation Plan.md` — **the execution plan; this is the one to follow.** Where the docs disagree, the workarounds doc wins, and the implementation plan reflects that.

Screenshots and the app icon source files live in `…/Pulse/Attachments/`. **Do not** copy uncompressed simulator PNGs into the repo — compress first (see §Asset pipeline).

The Cloudflare Email Routing setup is documented at `…/Pulse/Cloudflare Email Routing - Setup Steps.md`.

## Locked tech-stack constraints (do not relax)

These are decisions in the implementation plan §1 and §11. If a task tempts you to add tooling, stop.

- **No build step.** No bundler, no SSG (no Jekyll, Astro, Eleventy), no preprocessor, no `npm install`, no `bundle install`.
- **No JS framework.** No React, Vue, Svelte. Vanilla ES modules only.
- **No backend.** No Cloudflare Worker, no serverless function, no captcha service.
- **No web fonts.** System font stack only.
- **No third-party origins at runtime.** No Google Fonts, no analytics, no CDN-hosted libs. Acceptance criterion §8.6 forbids any cross-origin HTTP request.
- **No analytics in v1.** If/when added (GoatCounter or Plausible), `privacy.html` must be updated **in the same commit/PR**.
- **No App Store hyperlink** until the listing exists — render a disabled "Coming soon" badge, not an `<a>` to a dead URL.
- **Banner PNGs are design references, not hero images.** Recreate the hero in markup; embedding the banner raster letterboxes on mobile, bloats payload, and makes the headline non-selectable / non-accessible.

If the user asks for something that would break one of these, surface the conflict and reference the section that locks it — don't quietly add the tooling.

## File layout (target)

```
pulse-site/
├── index.html               # Landing
├── support.html             # Support / FAQ / contact
├── privacy.html             # Privacy policy (required by App Store)
├── 404.html
├── styles.css               # All site styles, one file
├── app.js                   # Theme toggle + email reveal, < 2 KB
├── assets/
│   ├── icon-180.png         # + @2x
│   ├── og-image.png         # 1200×630
│   ├── screenshots/         # .webp + .png fallback per image
│   └── waveform.svg
├── robots.txt
├── sitemap.xml
└── README.md
```

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

No package manager, no test runner. Before shipping any milestone, run the `predeploy-check` skill.

## Theming

- Default behavior is `prefers-color-scheme` (zero JS path works).
- Header has a three-state toggle: System / Light / Dark, persisted to `localStorage` key `pulse.theme` (`system | light | dark`).
- A tiny inline script in `<head>` sets `<html data-theme="…">` **before first paint** to avoid theme flash. This is the only JS that runs pre-body.
- Theme-dependent CSS cascades from `[data-theme="light"]` / `[data-theme="dark"]`; `prefers-color-scheme` is the fallback when no `data-theme` is set.

Tokens (CSS custom properties at `:root`, overridden under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`) are listed in implementation plan §4. Accent is Apple system red (`#FF3B30` light / `#FF453A` dark).

## Email obfuscation contract (load-bearing — §7.2 of the plan)

The published address `pulse.support@bearcave.my` is a Cloudflare Email Routing forwarder with a **catch-all** behind it. That means a harvested address invites scrapers to probe other local-parts on the same domain. The obfuscation is what keeps the catch-all quiet.

**The contract:**

1. In HTML, split user and domain across `data-` attributes — never joined in source:
   ```html
   <a class="support-email"
      data-user="pulse.support"
      data-domain="bearcave.my"
      href="#">
     <noscript>Email: pulse.support [at] bearcave.my</noscript>
     contact support
   </a>
   ```
2. In `app.js`, on `DOMContentLoaded`, for every `.support-email`:
   - Assemble the address at runtime via `document.createTextNode(user + "@" + domain)` — **do not store the joined string as a literal anywhere in source.**
   - Set `href = "mailto:" + user + "@" + domain` (optional `?subject=` prefix).
   - Replace the link's text with the new text node.
   - Remove the `data-` attributes after rendering so the assembled form isn't trivially scrapable from the live DOM.
3. `<noscript>` fallback uses the `[at]` form.
4. One implementation, one class, used identically on all three pages.

**Acceptance check:** run the `verify-email-obfuscation` skill before every commit that touches HTML or `app.js`. SVG-text obfuscation is explicitly **not** used — one technique, applied consistently.

## Asset pipeline

Screenshot sources live in the Obsidian `Attachments/` folder. Compress before every commit — run the `compress-screenshots` skill. Budgets: each screenshot ≤ 150 KB; above-the-fold total ≤ 300 KB (acceptance §8.5). `alt` text describes **what the widget shows**, not "screenshot of widget". The hero waveform is inline `<svg>` < 3 KB, animated with CSS, and **respects `prefers-reduced-motion: reduce`**.

## Locked content (plan §11 — do not paraphrase without asking)

- **Repo name:** `pulse-site`, owner `ampentium2`. Live URL: **`https://pulse.bearcave.my/`** (custom subdomain, decided in M8 — see §Repo and merge rules). The default `https://ampentium2.github.io/pulse-site/` stops serving once the custom domain takes over.
- **Headline (`<h1>`):** *See the rhythm of your day.*
- **Subhead (`<p>`):** *A native iPhone and Apple Watch app for your HealthKit heart-rate data — glanceable widgets, complications, and stats. Every beat kept private, 100% on-device.*
- **Wordmark:** plain text "Pulse" in the system font stack, weight `700`, color `var(--fg)`. **No SVG logotype in v1** — defer to a future brand polish pass.

These are locked because earlier drafts kept reopening them. If the user asks to change one, treat it as a decision change worth confirming (and update plan §11 / §5.1 in the vault too).

## Repo and merge rules

- **Public repo, free GitHub account.** Pages source: `Deploy from a branch → main → /`.
- **Squash-merge only.** Repo Settings → General → Pull Requests must have "Allow merge commits" and "Allow rebase merging" disabled. Keeps the public `main` history limited to polished commits.
- **License is a custom proprietary notice in `LICENSE.md`** (verbatim text in plan §11). Not SPDX. No `NOTICE.md`. GitHub will display "No license detected" — that's accurate; leave it.
- README must include a "Contributing" section stating PRs are not accepted (verbatim text in plan §11).
- **Custom domain (decided in M8, supersedes the original "deferred" stance):** the site is served at the Cloudflare-managed subdomain **`pulse.bearcave.my`**. A `CNAME` file containing `pulse.bearcave.my` **is committed**. All absolute URLs (canonical, `og:url`, `og:image`, `sitemap.xml`, `robots.txt` Sitemap line) use `https://pulse.bearcave.my/`. DNS + GitHub Pages wiring steps live in the vault: `…/Pulse/GitHub Pages - Custom Domain Setup.md`. Note: the `verify-email-obfuscation` skill's check #2 (`bearcave.my` in any href) now false-positives on the canonical `<link>`s — the email contract still holds as long as the *joined address* / `@bearcave.my` never appears in source or an href.

## Milestones

The plan (§10) breaks work into M1–M11. Each milestone lands as a single PR / commit group, and Claude Code should **pause after each milestone and report status** rather than barreling through. All pre-flight questions are resolved (plan §12 — "Ready to execute"), so M1 — Repo scaffold can start without further input. If something *not* covered by §11 surfaces mid-execution (App Store badge URL, ambiguous screenshot crop, etc.), pause and ask rather than guessing.

## Out of scope for v1 (plan §9)

Tempting and deferred — don't start any of these without an explicit ask: auto-filing GitHub issues from support, web form, captcha, Cloudflare Worker, web fonts, cookie banner, analytics, multi-language, blog/changelog, App Store smart link. (Custom domain was on this list but is now **in scope** — shipped as `pulse.bearcave.my` in M8; see §Repo and merge rules.)
