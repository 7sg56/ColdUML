from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000")

            # Wait for editor
            page.wait_for_selector(".monaco-editor", timeout=30000)

            # Clear editor content
            print("Clearing content...")
            page.click(".monaco-editor")
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")

            # Type something: "RACE_CONDITION"
            print("Typing 'RACE_CONDITION'...")
            reset_btn = page.locator('button[aria-label="Reset Editor"]')
            page.keyboard.type("RACE_CONDITION", delay=50) # faster typing again

            # Immediately click Reset button
            print("Clicking Reset immediately...")
            reset_btn.click()

            # Wait for any delayed updates (debounce is 300ms)
            print("Waiting for potential delayed update...")
            time.sleep(1)

            # Check content
            # The editor content is hard to read directly from Monaco DOM.
            # But we can check preview or copy button logic (but copy button logic uses localContent which we want to verify).
            # If race condition happens:
            # 1. Type "RACE_CONDITION". Timer set.
            # 2. Click Reset. Parent content="Default". SimpleEditor useEffect clears timer (FIXED).
            #    If NOT FIXED: Timer fires "RACE_CONDITION". Parent content="RACE_CONDITION". SimpleEditor useEffect updates localContent="RACE_CONDITION".

            # So if content is "Default", fix works.
            # If content is "RACE_CONDITION", fix fails.

            # Let's check preview text. "Animal" should be present (default).
            # "RACE_CONDITION" should NOT be present.

            # We can also check Monaco content via evaluate
            editor_content = page.evaluate("monaco.editor.getModels()[0].getValue()")
            print(f"Editor content starts with: {editor_content[:20]}")

            if "classDiagram" in editor_content:
                print("SUCCESS: Content was reset correctly.")
            elif "RACE_CONDITION" in editor_content:
                print("FAILURE: Content reverted to typed text.")
            else:
                print(f"UNKNOWN state: {editor_content[:50]}")

            page.screenshot(path="race_condition_check.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="race_condition_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
