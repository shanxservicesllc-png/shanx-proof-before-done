---
project: Proof Before Done
status: approved
owner: X / ShanX Services L.L.C.
source: HANDOFF_01_PROOF_BEFORE_DONE.md
approval_note: "Owner stated 2026-10-23 that the handoff was already confirmed and directed implementation without another approval round."
---

# Scope: Proof Before Done

## The Problem and Why It Matters
An AI worker may claim that an artifact is finished even if it is absent, wrong, or only partly tested. People coordinating AI work need a modest, observable way to distinguish a worker's statement from evidence they themselves can inspect.

## Who It's For
People reviewing output from AI workers: small teams, solo developers, creators, and anyone receiving a generated file.

## The Unique Kernel
A receipt which explicitly separates **CLAIMED** (worker said it), **CHECK PASSED** or **FAILED** (a named test ran and produced an observation), and **REVIEW REQUIRED** (the overall job is not certified).

## The Core Loop
1. User opens a small offline page.
2. User enters the worker's specific completion claim.
3. User picks one local evidence file.
4. User chooses one deterministic requirement: exact filename or required exact text.
5. The application performs that check and displays what was observed.
6. The user downloads a human-readable or machine-readable receipt, including file metadata and SHA-256 if available.
7. Overall acceptance remains the user's decision.

## What Working Looks Like
No file -> NOT VERIFIED. Wrong text -> FAILED. Correct exact text -> CHECK PASSED for the named check only. Hashes match for identical bytes and differ for different bytes. Script-shaped content is inert. Offline receipts reflect the displayed check.

## The POC Boundary
One screen, one selected file, one check per run, deterministic logic, no network or AI model. Includes local JSON/Markdown receipt export, synthetic fixtures, quick setup and automated tests.

## Explicitly Cut
Universal truth detector, scanning private directories, executing arbitrary commands, running builds, reading private drives, account integrations, automatic acceptance, multi-file evaluation, public hosting and publishing.

## Product Identity
Plainspoken, confidence-building and evidence-focused. A passed criterion is a small green light, not a certificate that the entire project is complete.

## Approval Evidence and Limits
The owner confirmed the handoff was already settled and authorized creating the finished file package. Detailed design and engineering decisions recorded in `prd.md` and `spec.md` are separately marked drafts, as they were not individually reviewed.
