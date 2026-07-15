import atexit
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# Maximum characters to prevent context window explosion
MAX_DOM_CHARS = 15_000

class DOMStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output = []
        self.indent = 0
        self.ignore_tags = {'script', 'style', 'noscript', 'meta', 'link', 'svg', 'path'}
        self.in_ignored_tag = False

    def handle_starttag(self, tag, attrs):
        if tag in self.ignore_tags:
            self.in_ignored_tag = True
            return
        if self.in_ignored_tag:
            return

        attr_str = ""
        for name, value in attrs:
            # Added data-testid to help the AI target specific React components
            if name in ('id', 'class', 'data-testid', 'placeholder', 'type', 'value'): 
                attr_str += f' {name}="{value}"'

        self.output.append("  " * self.indent + f"<{tag}{attr_str}>")
        if tag not in ('img', 'br', 'hr', 'input'): 
            self.indent += 1

    def handle_endtag(self, tag):
        if tag in self.ignore_tags:
            self.in_ignored_tag = False
            return
        if self.in_ignored_tag:
            return
            
        if tag not in ('img', 'br', 'hr', 'input'):
            self.indent = max(0, self.indent - 1)
            self.output.append("  " * self.indent + f"</{tag}>")

    def handle_data(self, data):
        if self.in_ignored_tag:
            return
        text = data.strip()
        if text:
            self.output.append("  " * self.indent + f"TEXT: {text}")


class BrowserManager:
    """Singleton to keep the Playwright browser alive across multiple tool calls."""
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.playwright = sync_playwright().start()
        
        # --- THE HEADLESS TOGGLE ---
        # headless=False means you can physically watch the AI interact with the UI on your screen.
        self.browser = self.playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        
        # Ensure the browser closes cleanly when the CLI exits
        atexit.register(self.cleanup)

    def cleanup(self):
        self.browser.close()
        self.playwright.stop()


# --- THE INTERACTIVE ACTION TOOLS ---

def scan_local_dom(port: int = 5173, path: str = "/") -> str:
    """Navigates to the page if needed, waits for React to hydrate, and returns the DOM."""
    manager = BrowserManager.get_instance()
    url = f"http://localhost:{port}{path}"
    
    try:
        # Only navigate if we aren't already on the right page
        if manager.page.url != url:
            try:
                manager.page.goto(url, wait_until="networkidle", timeout=5000)
            except PlaywrightTimeoutError:
                pass 
                
        html_content = manager.page.content()
        
        parser = DOMStripper()
        parser.feed(html_content)
        dom_tree = "\n".join(parser.output)
        
        if len(dom_tree) > MAX_DOM_CHARS:
            return f"Success: Live DOM state (Truncated):\n\n" + dom_tree[:MAX_DOM_CHARS] + "\n...[TRUNCATED]"
            
        return f"Success: Live structural layout from {url}:\n\n" + dom_tree

    except Exception as e:
        return f"System Error processing DOM layout: {str(e)}"

def click_ui_element(selector: str) -> str:
    """Clicks an element using a CSS selector and returns the newly updated DOM."""
    manager = BrowserManager.get_instance()
    try:
        manager.page.locator(selector).first.click(timeout=3000)
        # Wait a brief moment for React state to update the UI
        manager.page.wait_for_timeout(500) 
        
        # FEEDBACK LOOP: Immediately return what the UI looks like after the click
        new_dom = scan_local_dom()
        return f"System Action Complete: Clicked '{selector}'.\n\nNew UI State:\n{new_dom}"
    except Exception as e:
        return f"System Error: Could not click element '{selector}'. Ensure the selector is correct and visible. Details: {str(e)}"

def fill_input_field(selector: str, text: str) -> str:
    """Types text into an input field and returns the updated DOM."""
    manager = BrowserManager.get_instance()
    try:
        manager.page.locator(selector).first.fill(text, timeout=3000)
        manager.page.wait_for_timeout(500)
        
        new_dom = scan_local_dom()
        return f"System Action Complete: Filled '{selector}' with '{text}'.\n\nNew UI State:\n{new_dom}"
    except Exception as e:
        return f"System Error: Could not fill element '{selector}'. Details: {str(e)}"

def evaluate_javascript(script: str) -> str:
    """Executes raw JavaScript in the browser console."""
    manager = BrowserManager.get_instance()
    try:
        result = manager.page.evaluate(script)
        return f"System Action Complete: Script executed successfully. Return value:\n{result}"
    except Exception as e:
        return f"System Error executing script: {str(e)}"