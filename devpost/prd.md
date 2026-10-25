---
project: Proof Before Done
status: draft
basis: "Owner-confirmed HANDOFF_01_PROOF_BEFORE_DONE.md and approved scope"
review_note: "Implementation details organized by the worker; no explicit owner review of this PRD is recorded."
---

# Product Requirements: Proof Before Done

## What We're Building
A stand-alone web interface for checking a narrow assertion about one local file. The audience is an individual reviewer who wants observable evidence, not autonomous grading.

## The Core Journey
A new visitor sees a clear distinction between claims and checks. They enter the worker's statement, choose a file, select either an exact-filename criterion or a text-presence criterion, supply the expected value, click Run, read the named criterion's result, and export a receipt. Regardless of check outcome, overall acceptance is still REVIEW REQUIRED.

## Layout and Look and Feel
One responsive desktop-first screen. Left: three clearly numbered steps (claim, file, criterion). Right: immediately visible results ledger and two export controls. An explanatory row under the workflow states what the tool can and cannot prove. Dark navy, subdued borders, restrained mint highlights; amber for unknown and coral for failed. Typography uses only system fonts so it remains offline.

## Features and Behavior
### Claim entry
Free-text completion claim, labeled CLAiMED only if the visitor supplies a nonblank claim. Never infer truth from the text.

### Select evidence
Browser file picker lets user opt in to reading exactly one chosen file. Show name and byte size. Do not request a directory or upload file contents.

### Named criterion
1. Exact filename: the chosen basename exactly equals the user's expected filename, case sensitive.
2. Exact text present: for selected valid UTF-8 .txt/.md/.csv/.json/.log files, check whether the user's exact text appears case-sensitively. Not semantic interpretation.

### Results
Three outcomes: CHECK PASSED, FAILED, NOT VERIFIED. Display the named criterion and an explanation. Include file metadata, observed outcome and a fingerprint if successfully computed. Do not display 'job verified' or 'job complete'. Overall status always REVIEW REQUIRED.

### Receipt export
JSON and Markdown receipts reflecting the actual check, timestamp, specific expected and observed values, honest hash status/reason, and required human review. Export controls remain disabled before any check.

### Reset and edit behavior
Changing any input clears prior result and disables exports. A Clear button resets all inputs. The next check starts from a fresh snapshot of input values.

## Empty, Failure and Safety States
- No file, no claim, no expected value -> NOT VERIFIED; no accidental pass.
- A real run that does not meet the exact criterion -> FAILED.
- Text larger than 2 MiB, unsupported extension or invalid UTF-8 -> NOT VERIFIED, reason displayed.
- SHA-256 unavailable or file over 10 MiB -> NOT CHECKED with explanation, never fabricated.
- HTML/script-shaped text is treated as data, not interpreted as markup or executed. Raw HTML file content is not parsed for the text test.
- Errors from reading the file must not be presented as a success.

## Acceptance Criteria
A human can reproduce missing/wrong/correct test cases; same bytes produce same SHA-256 when available; different bytes produce different fingerprints; unsafe markup remains inert; JSON receipt reopens offline and agrees with the UI; filenames and content checks never imply complete-job certification.

## Now Versus Later
**Now:** one screen, one file, one criterion per check, static local app and receipts. **Later:** multiple artifacts, multiple criteria, screenshot checks, integration with build/test tools, history and audit signing. No extra features in this proof of concept.

## Outstanding Owner Review
This document is an implementation draft, not a claimed Devpost Learn-approved product interview. User has said to deliver files without another confirmation request.
