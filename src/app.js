/* Browser UI adapter. Keeps selected files in browser memory only. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const claim = $('claim');
  const file = $('evidenceFile');
  const type = $('checkType');
  const expected = $('expected');
  const checkButton = $('runCheck');
  const resetButton = $('resetForm');
  const result = $('result');
  const resultTitle = $('resultTitle');
  const resultDesc = $('resultDesc');
  const fileValue = $('fileValue');
  const fingerprintValue = $('fingerprintValue');
  const claimValue = $('claimValue');
  const criterionValue = $('criterionValue');
  const observedValue = $('observedValue');
  const reviewValue = $('reviewValue');
  const jsonButton = $('exportJson');
  const markdownButton = $('exportMarkdown');
  const expectedLabel = $('expectedLabel');
  const inlineHelp = $('inlineHelp');
  const fileHint = $('fileHint');
  let currentReceipt = null;

  function showEmpty() {
    currentReceipt = null;
    result.dataset.state = 'idle';
    resultTitle.textContent = 'No check run';
    resultDesc.textContent = 'Choose a file and an exact criterion to inspect one observable fact.';
    fileValue.textContent = 'No file inspected';
    fingerprintValue.textContent = 'NOT CHECKED';
    claimValue.textContent = 'UNVERIFIED';
    criterionValue.textContent = 'NOT CHECKED';
    observedValue.textContent = 'No observed result';
    reviewValue.textContent = 'REVIEW REQUIRED';
    jsonButton.disabled = true;
    markdownButton.disabled = true;
  }
  function updateCriterionUI() {
    if (type.value === 'filename') {
      expectedLabel.textContent = 'Expected exact filename';
      expected.placeholder = 'delivery.txt';
      inlineHelp.textContent = 'Case-sensitive, including the file extension.';
    } else {
      expectedLabel.textContent = 'Text that must appear in the file';
      expected.placeholder = 'DELIVERABLE READY';
      inlineHelp.textContent = 'Exact, case-sensitive text. UTF-8 .txt, .md, .csv, .json or .log; up to 2 MiB.';
    }
  }
  function updateFileHint() {
    const f = file.files && file.files[0];
    fileHint.textContent = f ? f.name + ' · ' + f.size.toLocaleString() + ' bytes' : 'Nothing leaves this browser. One selected file only.';
  }
  function displayReceipt(r) {
    currentReceipt = r;
    result.dataset.state = r.summary.check_state === 'CHECK PASSED' ? 'passed' : r.summary.check_state === 'FAILED' ? 'failed' : 'unverified';
    resultTitle.textContent = r.summary.check_state;
    resultDesc.textContent = r.criterion.explanation;
    fileValue.textContent = r.file ? r.file.name + ' · ' + r.file.size_bytes.toLocaleString() + ' bytes' : 'No file selected';
    fingerprintValue.textContent = r.fingerprint.value || r.fingerprint.status + (r.fingerprint.reason ? ': ' + r.fingerprint.reason : '');
    claimValue.textContent = r.summary.claim_state;
    criterionValue.textContent = r.criterion.name + ' · ' + r.summary.check_state;
    observedValue.textContent = r.criterion.observed === null ? 'NOT CHECKED' : r.criterion.observed;
    reviewValue.textContent = r.summary.overall;
    jsonButton.disabled = false;
    markdownButton.disabled = false;
  }
  function download(data, mime, name) {
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
  for (const elem of [claim, expected, file, type]) elem.addEventListener('change', showEmpty);
  claim.addEventListener('input', showEmpty);
  expected.addEventListener('input', showEmpty);
  type.addEventListener('change', updateCriterionUI);
  file.addEventListener('change', updateFileHint);
  checkButton.addEventListener('click', async () => {
    checkButton.disabled = true;
    checkButton.textContent = 'CHECKING…';
    const snapshot = { claim: claim.value, file: file.files && file.files[0], checkType: type.value, expected: expected.value };
    try { displayReceipt(await ProofLogic.verifyFile(snapshot)); }
    catch (_) {
      displayReceipt({
        receipt_version: '1.0', application: 'Proof Before Done', checked_at: new Date().toISOString(),
        claim: snapshot.claim, summary: { claim_state: snapshot.claim.trim() ? 'CLAIMED' : 'UNVERIFIED', check_state: 'NOT VERIFIED', overall: 'REVIEW REQUIRED' },
        file: null, criterion: { name: 'Error', explanation: 'The check could not be completed.', observed: null, expected: snapshot.expected, passed: null },
        fingerprint: { algorithm: 'SHA-256', status: 'NOT CHECKED', value: null, reason: 'Check failed unexpectedly.' },
        limitations: ['The check could not be completed; no completion claim was verified.'], human_review: { required: true, decision: 'PENDING' }
      });
    } finally {
      checkButton.disabled = false;
      checkButton.textContent = 'RUN EVIDENCE CHECK';
    }
  });
  resetButton.addEventListener('click', () => {
    claim.value = '';
    file.value = '';
    type.value = 'contains';
    expected.value = '';
    updateCriterionUI(); updateFileHint(); showEmpty();
  });
  jsonButton.addEventListener('click', () => { if (currentReceipt) download(JSON.stringify(currentReceipt, null, 2) + '\n', 'application/json', 'proof-before-done-receipt.json'); });
  markdownButton.addEventListener('click', () => { if (currentReceipt) download(ProofLogic.toMarkdown(currentReceipt), 'text/markdown', 'proof-before-done-receipt.md'); });
  updateCriterionUI(); updateFileHint(); showEmpty();
})();
