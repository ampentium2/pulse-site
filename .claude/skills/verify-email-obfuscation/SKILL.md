---
name: verify-email-obfuscation
description: Use before committing or deploying any change that touches index.html, support.html, privacy.html, or app.js. Runs the email-obfuscation acceptance checks from CLAUDE.md §Email — guards the Cloudflare catch-all on bearcave.my.
---

# Verify email obfuscation contract

Background: `pulse.support@bearcave.my` sits behind a Cloudflare Email Routing catch-all. A scraped address invites probing of other local-parts on the same domain. The obfuscation in `app.js` is the only thing keeping the catch-all quiet — this skill enforces the contract.

## Hard checks (must all pass — exit 0)

Run from the repo root. Any non-zero match means the contract is broken; **do not ship**.

```bash
echo "=== check 1: joined address must not appear in any source file ==="
! grep -rn "pulse\.support@bearcave\.my" --include="*.html" --include="*.js" --include="*.css" . \
  && echo "OK" || echo "FAIL: joined address found in source"

echo "=== check 2: bearcave.my must not appear inside any href attribute ==="
! grep -rEn 'href="[^"]*bearcave\.my' --include="*.html" . \
  && echo "OK" || echo "FAIL: bearcave.my found in an href"

echo "=== check 3: app.js must not contain the user@domain literal in any form ==="
! grep -En '"pulse\.support".*"@".*"bearcave\.my"|`pulse\.support@\$\{' app.js 2>/dev/null \
  && echo "OK" || echo "FAIL: app.js joins the address as a string literal"

echo "=== check 4: every page with .support-email must have data-user and data-domain ==="
for f in index.html support.html privacy.html; do
  [ -f "$f" ] || continue
  if grep -q 'class="support-email"' "$f"; then
    grep -q 'data-user="pulse.support"' "$f" && grep -q 'data-domain="bearcave.my"' "$f" \
      && echo "$f: OK" || echo "$f: FAIL: .support-email missing data-user / data-domain"
  fi
done

echo "=== check 5: <noscript> fallback uses the [at] form ==="
for f in index.html support.html privacy.html; do
  [ -f "$f" ] || continue
  if grep -q 'class="support-email"' "$f"; then
    grep -q 'pulse\.support \[at\] bearcave\.my' "$f" \
      && echo "$f: OK" || echo "$f: FAIL: missing or wrong <noscript> fallback"
  fi
done
```

## Runtime check (do once per release)

In a browser, after `DOMContentLoaded`:

```js
// open devtools on the deployed page, paste:
document.querySelectorAll('.support-email').forEach(a => {
  console.assert(a.href.startsWith('mailto:pulse.support@bearcave.my'), 'href not assembled');
  console.assert(!a.dataset.user && !a.dataset.domain, 'data- attrs not removed after render');
});
```

The contract requires the `data-` attributes to be **removed after rendering** so the assembled form isn't trivially scrapable from the live DOM. If they remain, fix `app.js`.

## Report

Print one line per check, then a final PASS / FAIL. On FAIL, name the file and the specific contract clause from CLAUDE.md §Email being violated — don't try to "fix" the obfuscation by inventing a new scheme; the doc explicitly forbids alternatives like SVG-text obfuscation. One implementation, applied identically across all three pages.
