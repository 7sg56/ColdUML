from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PageError: {err}"))

        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000")

            # Wait for the editor to load (it has a loading spinner)
            print("Waiting for editor to load...")
            # 'text=ColdUML' is in the header.
            page.wait_for_selector("text=ColdUML", timeout=30000)

            # Check if editor is loaded. The "Loading..." text is likely inside the Monaco container.
            # If it's still there after a while, we have a problem.
            # Let's wait a bit more.
            page.wait_for_timeout(5000)

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification_debug.png", full_page=True)
            print("Screenshot saved to verification_debug.png")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="error_state_debug.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    run()
