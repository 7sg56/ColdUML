from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000")

            # Wait for the editor to load
            print("Waiting for editor to load...")
            # The editor content is inside a Monaco editor, which is hard to inspect directly for text content easily
            # without diving into the DOM structure of Monaco.
            # However, we can check if the 'classDiagram' text is present in the DOM, as Monaco renders text in lines.

            page.wait_for_selector(".monaco-editor", timeout=30000)

            # Wait a bit for the content to be fully rendered
            page.wait_for_timeout(5000)

            # Check for "classDiagram" text which is part of the default content
            # Monaco renders lines in separate divs.

            content = page.content()
            if "classDiagram" in content:
                print("SUCCESS: 'classDiagram' found in the page content.")
            else:
                print("FAILURE: 'classDiagram' NOT found in the page content.")

            if "Animal" in content:
                print("SUCCESS: 'Animal' found in the page content.")
            else:
                print("FAILURE: 'Animal' NOT found in the page content.")

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification.png", full_page=True)
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
