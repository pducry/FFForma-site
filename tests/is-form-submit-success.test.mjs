import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const match = html.match(/function isFormSubmitSuccess\(res, result\) \{\n[\s\S]*?\n  \}/);
if (!match) {
  console.error('FAIL: isFormSubmitSuccess helper not found in index.html');
  process.exit(1);
}

const isFormSubmitSuccess = new Function(`${match[0]}; return isFormSubmitSuccess;`)();

const cases = [
  [{ ok: true }, { success: 'true' }, true],
  [{ ok: true }, { success: true }, true],
  [{ ok: true }, { success: 'false', message: 'rejected' }, false],
  [{ ok: false }, { success: 'true' }, false],
  [{ ok: true }, null, false],
  [null, { success: 'true' }, false],
];

let failed = 0;
for (const [res, result, expected] of cases) {
  const actual = isFormSubmitSuccess(res, result);
  if (actual !== expected) {
    console.error('FAIL', { res, result, expected, actual });
    failed += 1;
  }
}

if (!html.includes('showFormError') || !html.includes('Show success only after a confirmed FormSubmit acceptance')) {
  console.error('FAIL: success path must be gated behind confirmed FormSubmit acceptance');
  failed += 1;
}

// Ensure success UI is not shown from the catch path
const submitHandler = html.slice(html.indexOf("projectForm.addEventListener('submit'"));
const catchBlock = submitHandler.slice(submitHandler.indexOf('} catch (err)'));
if (catchBlock.includes("formSuccess.classList.add('is-visible')")) {
  console.error('FAIL: success UI is still shown from the catch path');
  failed += 1;
}

if (failed) process.exit(1);
console.log('ok — isFormSubmitSuccess + submit error gating');
