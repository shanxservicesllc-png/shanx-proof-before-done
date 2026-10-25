# Evidence artifacts

- `app-initial.png`: initial UI screenshot from Chromium in-memory page.
- `app-failed.png`: selected synthetic file failed named check.
- `app-passed.png`: passed named check still requires overall human review.
- `demo-pass-receipt.json`, `demo-pass-receipt.md`: browser-generated exports from synthetic example.
- `browser-tests.json`: individual browser test results.

**Browser caveat:** in-memory page was used because Chromium in this container blocks local URL navigation. Hashing was not performed in that opaque page; tests in Node independently verify correct SHA-256 when Web Crypto is available.
