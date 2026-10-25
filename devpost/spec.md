---
project: Proof Before Done
status: draft
basis: "Owner-confirmed scope; implementation choices selected to fit the stated offline proof-of-concept"
review_note: "No distinct learner-led technical spec approval documented."
---

# Technical Specification: Proof Before Done

## Where It Runs and How Someone Tries It
Modern browser from extracted `index.html`, offline; optional local-only `python -m http.server 8000` fallback if local file navigation is restricted. No build process, dependencies, account, keys, or server state. Node >=18 used only for running unit tests, not for end-user operation.

## Components
1. `index.html`: static semantic markup and accessible labels for claim input, file chooser, criterion, results and receipt downloads.
2. `assets/style.css`: responsive dark UI without remote resources.
3. `src/checker.js`: pure verification service usable in browsers and Node, async file reads, UTF-8 decoding with fatal validation, SHA-256 where supported, receipt and Markdown serializer.
4. `src/app.js`: local state handling, invalidation on edits, UI rendering via `textContent` only, Blob URL exports.
5. `tests/`: Node unit tests and Chromium integration tests (when permitted in the environment).

## File Structure
```
index.html
assets/style.css
src/checker.js
src/app.js
fixtures/{correct-deliverable,wrong-deliverable,unsafe-shaped-text}.txt
fixtures/unsupported.html
tests/checker.test.cjs
tests/browser_acceptance.py
devpost/{scope,prd,spec,checklist}.md
devpost/app-map.html
README.md
ACCEPTANCE_REPORT.md
SUBMISSION_READINESS.md
LICENSE
```

## Data Model
One transient receipt per check:
- `application`, `receipt_version`, `checked_at`
- `summary`: `claim_state` = CLAIMED|UNVERIFIED; `check_state` = CHECK PASSED|FAILED|NOT VERIFIED; `overall` = REVIEW REQUIRED
- `claim`: untrusted input, not verified truth
- `file`: selected file's basename, byte size, MIME hint and last-modified timestamp
- `criterion`: type, name, expected value, observed condition, boolean-or-null passed, explanation
- `fingerprint`: SHA-256 algorithm, CHECKED|NOT CHECKED status, actual digest if computed, explicit failure reason
- `limitations` and `human_review` required flag and pending decision

## Check Execution
Validate claim, selected file, nonempty expectation and supported check type; do not mark pass if any is missing. Compute fingerprint independently of the pass condition and only up to 10 MiB (if `crypto.subtle` available). For exact filename use strict string equality. For substring checks validate extension, enforce <=2 MiB, read `arrayBuffer`, strict-decode UTF-8, apply `includes()` without case folding. File-size limit and no-crypto contexts fall back truthfully. All rendering uses text-only DOM assignment.

## External Services
None. No HTTP requests or third-party dependencies. The only input is an explicit browser file selection.

## Failure Modes
Missing/invalid/unsupported inputs return NOT VERIFIED. Wrong actual result returns FAILED. Web Crypto absence returns NOT CHECKED for fingerprint but does not invalidate a correctly performed named check. Exports are generated only after running a check; input changes clear old receipt. HTML-shaped input is never injected as HTML and is escaped for Markdown output.

## Test Plan
Node unit suite for result states, both criteria, invalid inputs, large files, SHA-256 consistency and HTML escaping. Browser integration for form behavior, downloads, edits invalidating old results, safe markup and offline reloading. Log what ran versus what was blocked.

## Tradeoffs
File SHA-256 reads bytes into memory; 10 MiB limit avoids heavy memory usage in proof of concept. Text size is capped at 2 MiB. Not cryptographically signed, and cannot establish who produced a file. Browser support for Web Crypto on local pages differs; fallback remains explicit.

## Owner Review
Technical choices are submitted for later review with the working implementation. They are not represented as prior owner-selected decisions.
