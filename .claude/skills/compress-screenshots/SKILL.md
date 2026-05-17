---
name: compress-screenshots
description: Use when adding or updating screenshots in assets/screenshots/. Runs the Pulse asset pipeline (pngquant → webp + png fallback) and enforces the per-image / above-the-fold size budgets from CLAUDE.md.
---

# Asset pipeline for Pulse screenshots

Sources live in the Obsidian vault at `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/BearlyMadStudios/Pulse/Attachments/`. **Never** copy raw simulator PNGs straight into the repo.

## Required tools

```bash
brew install pngquant webp
```

If either is missing, stop and ask the user to install — do not substitute `sips`, `magick`, or other tools (different algorithms, off-spec output).

## Procedure (per screenshot)

1. **Identify source.** Confirm the exact file path in `Attachments/` with the user. Confirm whether device bezels should be cropped.
2. **Crop bezels** if requested (ask before guessing crop region).
3. **Compress PNG:**
   ```bash
   pngquant --quality=65-85 --strip --force --output assets/screenshots/<name>.png <source>.png
   ```
4. **Generate WebP at same dimensions:**
   ```bash
   cwebp -q 80 assets/screenshots/<name>.png -o assets/screenshots/<name>.webp
   ```
5. **Check per-image budget:** each file ≤ 150 KB. If over, lower pngquant quality floor (try `--quality=55-75`) or re-crop. Do not ship over-budget assets.
6. **Wire into HTML** using `<picture>` with WebP primary and PNG fallback:
   ```html
   <picture>
     <source srcset="assets/screenshots/<name>.webp" type="image/webp">
     <img src="assets/screenshots/<name>.png" alt="<what the widget shows>" width="…" height="…">
   </picture>
   ```
   Always set explicit `width`/`height` to prevent layout shift.
7. **Write alt text** that describes **what the widget shows** (e.g. "Resting heart rate trending down over the last 7 days"), not "screenshot of widget".

## Above-the-fold budget check

After updating any landing-page screenshot, sum the sizes of all assets referenced above the fold on `index.html`:

```bash
# rough check — adjust the file list to match what's actually above the fold
du -k assets/icon-180.png assets/screenshots/<hero-shots>.{webp,png} 2>/dev/null | awk '{s+=$1} END {print s" KB"}'
```

Total must be ≤ 300 KB (CLAUDE.md acceptance §8.5). WebP counts when the browser supports it; verify against the WebP variants since that is what most clients fetch.

## Report

When done, report: source file, output paths, final sizes, and the above-the-fold total. Flag any budget overrun rather than silently shipping it.
