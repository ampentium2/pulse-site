---
name: predeploy-check
description: Use before shipping a milestone PR or pushing to main (which auto-deploys via GitHub Pages). Runs the acceptance checks from CLAUDE.md — email obfuscation, asset budgets, no third-party origins, required files — and walks the user through the manual Lighthouse / viewport pass.
---

# Pre-deploy acceptance check for pulse-site

Run from the repo root. This is the gate before pushing to `main` (Pages deploys from `main → /`).

## Automated checks

### 1. Email obfuscation contract

Run the `verify-email-obfuscation` skill checks first. **Hard block** if anything fails — the catch-all on `bearcave.my` depends on this.

### 2. No third-party origins at runtime (acceptance §8.6)

```bash
echo "=== no cross-origin URLs in HTML/CSS/JS ==="
grep -rEn 'https?://' --include="*.html" --include="*.css" --include="*.js" . \
  | grep -vE '://(www\.)?w3\.org|://schema\.org|://pulse\.bearcave\.my|://apps\.apple\.com' \
  && echo "FAIL: cross-origin reference found — review above" \
  || echo "OK"
```

Allowed references: the canonical/OG URLs on `pulse.bearcave.my` (the custom domain, decided in M8), and the App Store listing link (`apps.apple.com`, live since the listing shipped). Everything else is forbidden at runtime — no Google Fonts, no analytics, no CDN libs, no remote images.

### 3. Asset budgets (acceptance §8.5)

```bash
echo "=== per-screenshot budget: each ≤ 150 KB ==="
find assets/screenshots -type f \( -name "*.png" -o -name "*.webp" \) -size +150k -print \
  | sed 's/^/FAIL: over budget: /'

echo "=== above-the-fold landing total ≤ 300 KB ==="
# Edit this list to match the actual above-the-fold assets on index.html.
du -k assets/icon-180.png assets/screenshots/*.webp 2>/dev/null \
  | awk '{s+=$1} END {if (s > 300) print "FAIL: above-the-fold = "s" KB"; else print "OK ("s" KB)"}'
```

### 4. Required files exist

```bash
for f in index.html support.html privacy.html 404.html styles.css app.js robots.txt sitemap.xml LICENSE.md README.md; do
  [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"
done
```

### 5. CNAME must be committed and point to the custom domain

Per the M8 decision (CLAUDE.md §Repo and merge rules), the site is served at `pulse.bearcave.my` and a `CNAME` file containing exactly that host **is committed**.

```bash
[ -f CNAME ] && [ "$(cat CNAME)" = "pulse.bearcave.my" ] \
  && echo "OK: CNAME = pulse.bearcave.my" \
  || echo "FAIL: CNAME missing or not 'pulse.bearcave.my' — custom domain wiring per CLAUDE.md §Repo and merge rules"
```

### 6. Theme-flash guard in `<head>`

The inline pre-paint script that sets `<html data-theme="…">` must exist in every page or users on dark mode get a white flash:

```bash
for f in index.html support.html privacy.html; do
  grep -q 'data-theme' "$f" && echo "$f: OK" || echo "$f: FAIL: no pre-paint data-theme script"
done
```

### 7. Reduced-motion guard on hero waveform

```bash
grep -q 'prefers-reduced-motion' styles.css \
  && echo "OK: prefers-reduced-motion handled" \
  || echo "FAIL: hero animation must disable under prefers-reduced-motion"
```

### 8. App Store link must be live

The listing now exists, so `index.html` must link to it with a real `<a href>` — not a disabled "Coming soon" badge or a dead URL.

```bash
grep -q 'apps\.apple\.com/.*id6766077332' index.html \
  && echo "OK: App Store link present" \
  || echo "FAIL: App Store link missing from index.html"

echo "=== no leftover disabled 'Coming soon' badge ==="
grep -in 'coming soon' index.html \
  && echo "FAIL: stale Coming soon badge — listing is live, link it" \
  || echo "OK: no stale badge"
```

## Manual checks (walk the user through)

Print this checklist and **wait for confirmation** before declaring pass:

1. **Local preview running?**
   ```bash
   python3 -m http.server 8000
   # http://localhost:8000
   ```
2. **Visual check at three viewports** — 360 / 768 / 1280 (Chrome devtools device toolbar). Confirm no horizontal scroll, hero readable, screenshots scaled cleanly.
3. **Lighthouse mobile run** in Chrome DevTools. Target ≥ 95 on **all four** categories (Performance, Accessibility, Best Practices, SEO). Anything under 95 is a fail — capture the failing audit and fix before shipping.
4. **Theme toggle** — cycle System / Light / Dark on each page; verify persistence via `localStorage.pulse.theme`; refresh and confirm no theme flash.
5. **Email link** — click on each page, confirm `mailto:pulse.support@bearcave.my` opens correctly. View-source after JS runs and confirm `data-user` / `data-domain` are removed from the DOM.

## Report

Summarise: PASS / FAIL per automated check, then the manual checklist with user confirmation. If anything fails, **do not advise the user to push** — list the failing items and stop.
