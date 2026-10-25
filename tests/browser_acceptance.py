#!/usr/bin/env python3
"""Browser integration tests. No HTTP, no account, no filesystem scans by the app.

Because the build environment blocks local navigation in Chromium, test source is
loaded in-memory using Playwright.set_content + add_script_tag. This confirms
runtime DOM behavior but does not prove direct file:// or localhost navigation.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent.parent
ARTIFACTS = BASE / 'evidence'
ARTIFACTS.mkdir(exist_ok=True)
results = []

def check(name, action):
    try:
        action()
        results.append({'name': name, 'result': 'PASS'})
        print('PASS', name)
    except Exception as exc:
        results.append({'name': name, 'result': 'FAIL', 'reason': str(exc)})
        print('FAIL', name, str(exc))

def assert_eq(actual, expected):
    assert actual == expected, f'{actual!r} != {expected!r}'

def bootstrap(page):
    page.set_content((BASE / 'index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(BASE / 'assets/style.css').read_text(encoding='utf-8'))
    page.add_script_tag(content=(BASE / 'src/checker.js').read_text(encoding='utf-8'))
    page.add_script_tag(content=(BASE / 'src/app.js').read_text(encoding='utf-8'))

def inputs(page, file_path=None, expected='DELIVERABLE READY', claim='Release notes are finished.', kind='contains'):
    page.locator('#claim').fill(claim)
    page.locator('#checkType').select_option(kind)
    page.locator('#expected').fill(expected)
    if file_path is not None:
        page.locator('#evidenceFile').set_input_files(str(BASE / 'fixtures' / file_path))
    else:
        page.locator('#evidenceFile').set_input_files([])
    page.locator('#runCheck').click()
    page.wait_for_function('document.querySelector("#runCheck").disabled === false')
    return page.locator('#resultTitle').inner_text()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-gpu'])
    context = browser.new_context(accept_downloads=True, viewport={'width': 1400, 'height': 900})
    context.set_offline(True)
    page = context.new_page()
    bootstrap(page)
    page.screenshot(path=str(ARTIFACTS / 'app-initial.png'), full_page=True)

    check('No file fails closed', lambda: assert_eq(inputs(page), 'NOT VERIFIED'))
    check('No file never implies completion', lambda: assert_eq(page.locator('#reviewValue').inner_text(), 'REVIEW REQUIRED'))
    check('Wrong text reports FAILED', lambda: assert_eq(inputs(page, 'wrong-deliverable.txt'), 'FAILED'))
    page.screenshot(path=str(ARTIFACTS / 'app-failed.png'), full_page=True)
    check('Correct text reports check passed', lambda: assert_eq(inputs(page, 'correct-deliverable.txt'), 'CHECK PASSED'))
    check('Passed criterion does not approve job', lambda: assert_eq(page.locator('#reviewValue').inner_text(), 'REVIEW REQUIRED'))
    page.screenshot(path=str(ARTIFACTS / 'app-passed.png'), full_page=True)

    def export_json():
        with page.expect_download() as download_info: page.locator('#exportJson').click()
        download = download_info.value
        path = ARTIFACTS / 'demo-pass-receipt.json'
        download.save_as(str(path))
        receipt = json.loads(path.read_text(encoding='utf-8'))
        assert_eq(receipt['summary']['check_state'], 'CHECK PASSED')
        assert_eq(receipt['summary']['overall'], 'REVIEW REQUIRED')
        assert_eq(receipt['criterion']['expected'], 'DELIVERABLE READY')
        assert_eq(receipt['file']['name'], 'correct-deliverable.txt')
        assert_eq(receipt['human_review']['decision'], 'PENDING')
        # The browser is sandboxed in an opaque, insecure about:blank origin.
        # A SHA-256 result is consequently not promised in this browser test.
        assert receipt['fingerprint']['status'] in ('CHECKED', 'NOT CHECKED')
    check('JSON receipt downloads and reopens offline, matching UI', export_json)

    def export_markdown():
        with page.expect_download() as download_info: page.locator('#exportMarkdown').click()
        path = ARTIFACTS / 'demo-pass-receipt.md'
        download_info.value.save_as(str(path))
        txt = path.read_text(encoding='utf-8')
        assert 'CHECK PASSED' in txt and 'REVIEW REQUIRED' in txt
        assert 'DELIVERABLE READY' in txt
    check('Markdown receipt downloads and reopens offline', export_markdown)

    def change_invalidates():
        page.locator('#expected').fill('NOT THE TEXT')
        assert_eq(page.locator('#resultTitle').inner_text(), 'No check run')
        assert page.locator('#exportJson').is_disabled()
    check('Changing input invalidates old receipt', change_invalidates)
    check('Unsupported HTML file fails closed', lambda: assert_eq(inputs(page, 'unsupported.html', expected='script'), 'NOT VERIFIED'))
    check('Exact filename match passes', lambda: assert_eq(inputs(page, 'correct-deliverable.txt', kind='filename', expected='correct-deliverable.txt'), 'CHECK PASSED'))
    check('Filename case mismatch fails', lambda: assert_eq(inputs(page, 'correct-deliverable.txt', kind='filename', expected='Correct-deliverable.txt'), 'FAILED'))

    def unsafe_plaintext():
        page.evaluate('window.__unsafe_script_executed = false; window.__unsafe_image_executed = false')
        assert_eq(inputs(page, 'unsafe-shaped-text.txt', expected='<script>'), 'CHECK PASSED')
        assert page.evaluate('window.__unsafe_script_executed === false && window.__unsafe_image_executed === false')
        assert '<script>' not in page.locator('#resultDesc').inner_html()
    check('Script-shaped content treated as inert text', unsafe_plaintext)

    def reset():
        page.locator('#resetForm').click()
        assert_eq(page.locator('#claim').input_value(), '')
        assert_eq(page.locator('#resultTitle').inner_text(), 'No check run')
        assert page.locator('#exportMarkdown').is_disabled()
    check('Clear resets all inputs and receipts', reset)

    def reopen_offline():
        bootstrap(page)
        assert_eq(page.locator('#resultTitle').inner_text(), 'No check run')
        assert page.locator('#exportJson').is_disabled()
        assert 'Proof Before Done' in page.title()
    check('Reinitialize app fully offline without dependencies', reopen_offline)
    browser.close()

report = {'generated_utc': datetime.now(timezone.utc).isoformat(), 'method': 'Chromium Playwright; about:blank in-memory page; offline context', 'navigation_limitation': 'file:// and localhost navigation blocked by administrator; not tested', 'results': results, 'passed': sum(r['result'] == 'PASS' for r in results), 'total': len(results)}
(ARTIFACTS / 'browser-tests.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('TOTAL', report['passed'], '/', report['total'])
if report['passed'] != report['total']:
    raise SystemExit(1)
