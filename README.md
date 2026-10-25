# Proof Before Done

**Offline, dependency-free evidence checks for AI completion claims.**

A worker can say a task is finished. This small web app lets a human select one evidence file, specify one objective criterion, run the actual check, and download a truthful JSON or Markdown receipt. The result never declares the entire job complete: the overall decision always remains **REVIEW REQUIRED**.

## Open the app

1. Download and extract the project ZIP.
2. Open **`index.html`** in a modern desktop browser (Chrome, Edge, Firefox or Safari). No account, API keys, installation, internet connection or server is needed.
3. Enter the claim, select **one** local file, choose `File includes specific text` or `Filename matches exactly`, enter the exact expected value and click **RUN EVIDENCE CHECK**.
4. Review **CHECK PASSED**, **FAILED** or **NOT VERIFIED**, plus the SHA-256 fingerprint when the browser supports it. Download either receipt format.

If your browser restricts local file pages, serve this extracted directory locally with `python -m http.server 8000`, then open `http://localhost:8000/`. This serves from your own machine; no public deployment is needed. In unsupported/insecure browser contexts the fingerprint is honestly labeled **NOT CHECKED**.

## Fast 3-case demonstration

Use the selected criterion **File includes specific text** and the expected text `DELIVERABLE READY`:

1. Leave the file picker empty. Result: **NOT VERIFIED**.
2. Pick `fixtures/wrong-deliverable.txt`. Result: **FAILED**.
3. Pick `fixtures/correct-deliverable.txt`. Result: **CHECK PASSED**, but overall **REVIEW REQUIRED**. Download the JSON receipt.

Try the filename criterion with `correct-deliverable.txt` for a second measurable check. The matching is **case sensitive**. Try `fixtures/unsafe-shaped-text.txt` with expected `<script>`: the file's contents are treated as inert text, not run as code. Choosing an `.html` file for text search is unsupported and returns **NOT VERIFIED**.

## Details and explicit limits

- File reads are performed client-side after an explicit file selection. There is no telemetry, upload, third-party script, or network API.
- **Checks:** exact case-sensitive filename or exact case-sensitive substring in UTF-8 `.txt`, `.md`, `.csv`, `.json` or `.log` files up to 2 MiB.
- **Hashing:** SHA-256 through the browser Web Crypto API for selected files up to 10 MiB; otherwise **NOT CHECKED** with a reason. Hashing identifies bytes, not correctness.
- **Fail closed:** missing claim, missing file, missing requirement, unsupported check/file, unreadable or invalid UTF-8 never count as passes.
- **Receipts:** timestamp, claim, actual selected file metadata, expected criterion, observed result, fingerprint or reason it was not checked, limitations and required human review.
- **Not implemented:** arbitrary file system scanning, command execution, automatic code builds, model inference, cloud integrations, universal truth detection, autonomous acceptance, publication.
- **Change resets the result:** editing claim/criterion or replacing the file invalidates the last visible receipt to prevent stale proof.

## Tests

Run the dependency-free Node test suite with `npm test` (Node >=18), or `node --test tests/checker.test.cjs`.

`tests/browser_acceptance.py` runs the optional local browser checks using Python Playwright and Chromium if those are installed. It reconstructs the page in memory because this constrained build environment blocks Chromium local URL navigation. Tests and environmental limitations are recorded in `ACCEPTANCE_REPORT.md`.

## File map

- `index.html` UI markup, entry point
- `assets/style.css` responsive styles, no remote fonts/assets
- `src/checker.js` portable, deterministic verification + receipt logic
- `src/app.js` browser UI events, safe text-only result rendering, download handlers
- `fixtures/` invented safe test documents
- `tests/` executable tests
- `devpost/` documented scope, PRD, spec, build checklist and code map
- `evidence/` local test output and screenshot evidence
- `ACCEPTANCE_REPORT.md` observed tests and outstanding validation
- `SUBMISSION_READINESS.md` remaining owner-led publication steps

## License and origin

New code was authored within the ChatGPT-local workspace in October 2026 for ShanX Services L.L.C. A **draft MIT `LICENSE`** is included for owner evaluation; the owner has not authorized publication or public relicensing. No private X13 code or existing competitor application was incorporated.
