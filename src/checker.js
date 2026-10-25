/* Proof Before Done: deterministic, dependency-free checking core. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ProofLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_TEXT_BYTES = 2 * 1024 * 1024;
  const MAX_HASH_BYTES = 10 * 1024 * 1024;
  const TEXT_EXTENSIONS = /\.(txt|md|csv|json|log)$/i;
  const LIMITATIONS = [
    'Only one user-selected local file and one named criterion were checked.',
    'A passing criterion does not establish the truth of the completion claim or overall project completeness.',
    'No code was executed, no network requests were made, and no unrelated files were searched.',
    'A human reviewer must decide whether the whole deliverable is acceptable.'
  ];

  function isoTime(value) {
    const d = value ? new Date(value) : new Date();
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  function getLastModified(file) {
    const ms = file && Number(file.lastModified);
    return Number.isFinite(ms) && ms > 0 ? isoTime(ms) : null;
  }
  function hexDigest(bytes) {
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  }
  function defaultHash(reason) {
    return { algorithm: 'SHA-256', status: 'NOT CHECKED', value: null, reason };
  }
  function checkName(checkType) {
    return checkType === 'filename' ? 'Exact filename' : checkType === 'contains' ? 'Exact UTF-8 text substring' : 'Unsupported check';
  }
  function baseReceipt({ claim, file, checkType, expected, timestamp }) {
    const claimed = typeof claim === 'string' && claim.trim().length > 0;
    return {
      receipt_version: '1.0',
      application: 'Proof Before Done',
      checked_at: isoTime(timestamp),
      summary: { claim_state: claimed ? 'CLAIMED' : 'UNVERIFIED', check_state: 'NOT VERIFIED', overall: 'REVIEW REQUIRED' },
      claim: claimed ? claim.trim() : '',
      file: file ? {
        name: String(file.name || ''),
        size_bytes: Number.isFinite(file.size) ? file.size : null,
        mime_type: String(file.type || 'not supplied'),
        last_modified: getLastModified(file)
      } : null,
      criterion: { type: checkType, name: checkName(checkType), expected: String(expected || ''), observed: null, passed: null, explanation: '' },
      fingerprint: defaultHash('No fingerprint check has been performed.'),
      limitations: LIMITATIONS.slice(),
      human_review: { required: true, decision: 'PENDING', reviewer: 'Owner or designated human reviewer' }
    };
  }
  function finalize(receipt, state, explanation, observed, passed) {
    receipt.summary.check_state = state;
    receipt.criterion.explanation = explanation;
    receipt.criterion.observed = observed;
    receipt.criterion.passed = passed;
    return receipt;
  }
  async function fingerprint(file, cryptoImpl) {
    if (!file) return defaultHash('No file selected.');
    if (file.size > MAX_HASH_BYTES) return defaultHash('File exceeds 10 MiB fingerprint limit.');
    const cryptoObject = cryptoImpl === undefined ? (typeof globalThis !== 'undefined' ? globalThis.crypto : null) : cryptoImpl;
    if (!cryptoObject || !cryptoObject.subtle || typeof cryptoObject.subtle.digest !== 'function') return defaultHash('SHA-256 is not supported in this browser context.');
    try {
      const bytes = await file.arrayBuffer();
      return { algorithm: 'SHA-256', status: 'CHECKED', value: hexDigest(await cryptoObject.subtle.digest('SHA-256', bytes)), reason: null };
    } catch (_) {
      return defaultHash('Browser could not read or fingerprint the selected file.');
    }
  }
  async function verifyFile({ claim, file, checkType, expected, timestamp, cryptoImpl } = {}) {
    const receipt = baseReceipt({ claim, file, checkType, expected, timestamp });
    const value = String(expected || '');
    if (!receipt.claim) return finalize(receipt, 'NOT VERIFIED', 'Enter the worker’s completion claim before running a check.', null, null);
    if (!file) return finalize(receipt, 'NOT VERIFIED', 'No evidence file was selected; nothing was checked.', 'Missing evidence file', null);
    if (!value.trim()) return finalize(receipt, 'NOT VERIFIED', 'Enter an exact criterion before running a check.', 'Missing criterion', null);
    if (!['filename', 'contains'].includes(checkType)) return finalize(receipt, 'NOT VERIFIED', 'Unsupported check type.', 'Unsupported criterion', null);
    receipt.fingerprint = await fingerprint(file, cryptoImpl);
    if (checkType === 'filename') {
      const passed = file.name === value;
      return finalize(receipt, passed ? 'CHECK PASSED' : 'FAILED', passed
        ? 'The selected file name exactly matches the expected filename (case-sensitive).'
        : 'The selected file name does not exactly match the expected filename (case-sensitive).',
      String(file.name), passed);
    }
    if (!TEXT_EXTENSIONS.test(file.name || '')) return finalize(receipt, 'NOT VERIFIED', 'Text check supports only .txt, .md, .csv, .json and .log files; this file was not parsed.', 'Unsupported file type', null);
    if (file.size > MAX_TEXT_BYTES) return finalize(receipt, 'NOT VERIFIED', 'Text file exceeds the 2 MiB inspection limit.', 'File too large to inspect', null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const passed = text.includes(value);
      return finalize(receipt, passed ? 'CHECK PASSED' : 'FAILED', passed
        ? 'The required exact, case-sensitive text occurs in the selected UTF-8 file.'
        : 'The required exact, case-sensitive text does not occur in the selected UTF-8 file.',
      passed ? 'Required text present' : 'Required text absent', passed);
    } catch (_) {
      return finalize(receipt, 'NOT VERIFIED', 'This file could not be read as valid UTF-8 text.', 'Unreadable or invalid UTF-8', null);
    }
  }
  function escapeMarkdown(value) {
    // Prevent raw HTML in a receipt from being interpreted by Markdown renderers.
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\r?\n/g, ' ');
  }
  function toMarkdown(receipt) {
    const safe = escapeMarkdown;
    const lines = [
      '# Proof Before Done | Check receipt', '',
      '- **Checked at:** ' + receipt.checked_at,
      '- **Claim state:** ' + receipt.summary.claim_state,
      '- **Criterion result:** ' + receipt.summary.check_state,
      '- **Overall acceptance:** ' + receipt.summary.overall, '',
      '## Worker claim', '', safe(receipt.claim) || '(none)', '',
      '## Selected evidence file', '',
      '- **Name:** ' + (receipt.file ? safe(receipt.file.name) : '(none)'),
      '- **Size:** ' + (receipt.file ? receipt.file.size_bytes : '(none)') + ' bytes',
      '- **Type:** ' + (receipt.file ? safe(receipt.file.mime_type) : '(none)'),
      '- **Last modified:** ' + (receipt.file && receipt.file.last_modified ? receipt.file.last_modified : 'not supplied'), '',
      '## Named check', '',
      '- **Criterion:** ' + safe(receipt.criterion.name),
      '- **Expected:** ' + safe(receipt.criterion.expected),
      '- **Observed:** ' + (receipt.criterion.observed === null ? 'NOT CHECKED' : receipt.criterion.observed),
      '- **Passed:** ' + (receipt.criterion.passed === null ? 'NOT CHECKED' : receipt.criterion.passed),
      '- **Explanation:** ' + safe(receipt.criterion.explanation), '',
      '## File fingerprint', '',
      '- **Algorithm:** ' + receipt.fingerprint.algorithm,
      '- **Status:** ' + receipt.fingerprint.status,
      '- **SHA-256:** ' + (receipt.fingerprint.value || 'NOT CHECKED'),
      '- **Reason:** ' + (receipt.fingerprint.reason || 'none'), '',
      '## Limitations and human review', '',
      ...receipt.limitations.map(s => '- ' + s), '',
      '**Human review required:** YES; decision remains PENDING.', ''
    ];
    return lines.join('\n');
  }
  return { MAX_TEXT_BYTES, MAX_HASH_BYTES, verifyFile, fingerprint, toMarkdown };
});
