import { showToast, clearAllToasts } from './toast-utils';

describe('Toast Utils Security', () => {
  beforeEach(() => {
    // Clean up
    document.body.innerHTML = '';
    // If clearAllToasts relies on existing global variable, we might need to reset it.
    // The implementation uses a module-level variable `toastContainer`.
    // clearAllToasts clears innerHTML of container but doesn't remove container or reset counter.
    clearAllToasts();
  });

  test('should not render HTML in toast message (XSS prevention)', () => {
    const maliciousMessage = '<img id="malicious-img" src="x" onerror="alert(1)">';
    showToast(maliciousMessage);

    // If vulnerable, the img tag will be present in the DOM
    const imgTag = document.getElementById('malicious-img');

    // We expect the img tag NOT to be present (it should be treated as text)
    // This expectation should FAIL if the code is vulnerable.
    expect(imgTag).toBeNull();
  });
});
