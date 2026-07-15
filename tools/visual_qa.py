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
            if name in ('id', 'class', 'data-testid', 'placeholder', 'type', 'value', 'aria-expanded', 'aria-hidden', 'disabled'): 
                attr_str += f' {name}="{value}"'

        self.output.append("  " * self.indent + f"<{tag}{attr_str}>")
        if tag not in ('img', 'br', 'hr', 'input', 'button'): 
            self.indent += 1

    def handle_endtag(self, tag):
        if tag in self.ignore_tags:
            self.in_ignored_tag = False
            return
        if self.in_ignored_tag:
            return
            
        if tag not in ('img', 'br', 'hr', 'input', 'button'):
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
        self.browser = self.playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        atexit.register(self.cleanup)

    def cleanup(self):
        self.browser.close()
        self.playwright.stop()


# --- HELPER FUNCTION: Read current state without navigating ---
def _extract_current_dom(page) -> str:
    """Reads the DOM exactly as it is right now, without triggering any URL checks."""
    page.wait_for_timeout(200)
    html_content = page.content()
    
    parser = DOMStripper()
    parser.feed(html_content)
    dom_tree = "\n".join(parser.output)
    
    if len(dom_tree) > MAX_DOM_CHARS:
        return f"Success: Live DOM state (Truncated):\n\n" + dom_tree[:MAX_DOM_CHARS] + "\n...[TRUNCATED]"
        
    return f"Success: Live structural layout from {page.url}:\n\n" + dom_tree


# --- THE INTERACTIVE ACTION TOOLS ---

def scan_local_dom(port: int = 5173, path: str = "/") -> str:
    """Explicitly navigates to a specific URL path, waits for hydration, and returns the DOM."""
    manager = BrowserManager.get_instance()
    url = f"http://localhost:{port}{path}"
    
    try:
        # Only navigate if the AI explicitly requested a URL change
        if manager.page.url != url:
            try:
                manager.page.goto(url, wait_until="networkidle", timeout=5000)
            except PlaywrightTimeoutError:
                pass 
                
        return _extract_current_dom(manager.page)

    except Exception as e:
        return f"System Error processing DOM layout: {str(e)}"


def click_ui_element(selector: str) -> str:
    """Clicks an element with human-like emulation and returns the newly updated DOM."""
    manager = BrowserManager.get_instance()
    try:
        locator = manager.page.locator(selector).first
        locator.wait_for(state="visible", timeout=3000)
        
        locator.hover()
        manager.page.wait_for_timeout(150) 
        locator.click(delay=100) 
        
        manager.page.wait_for_timeout(600) 
        try:
            manager.page.wait_for_load_state("networkidle", timeout=2000)
        except PlaywrightTimeoutError:
            pass
        
        # FIX: Just read the screen, don't force a navigation reload
        new_dom = _extract_current_dom(manager.page)
        return f"System Action Complete: Successfully located, hovered, and clicked '{selector}'.\n\nNew UI State:\n{new_dom}"
    except Exception as e:
        return f"System Error: Could not click element '{selector}'. Ensure it is visible on the screen and not blocked by a modal. Details: {str(e)}"


def fill_input_field(selector: str, text: str) -> str:
    """Types text into an input field using real keyboard emulation."""
    manager = BrowserManager.get_instance()
    try:
        locator = manager.page.locator(selector).first
        locator.wait_for(state="visible", timeout=3000)
        
        locator.click()
        manager.page.wait_for_timeout(100)
        
        manager.page.keyboard.press("Control+A")
        manager.page.keyboard.press("Backspace")
        
        locator.press_sequentially(text, delay=75)
        
        # FIX: Removed the automatic 'Enter' keypress that was causing React forms to hard-refresh
        manager.page.wait_for_timeout(500)
        
        # FIX: Just read the screen, don't force a navigation reload
        new_dom = _extract_current_dom(manager.page)
        return f"System Action Complete: Physically typed '{text}' into '{selector}'.\n\nNew UI State:\n{new_dom}"
    except Exception as e:
        return f"System Error: Could not fill element '{selector}'. Details: {str(e)}"


def evaluate_javascript(script: str) -> str:
    """Executes raw JavaScript in the browser console."""
    manager = BrowserManager.get_instance()
    try:
        result = manager.page.evaluate(script)
        manager.page.wait_for_timeout(500)
        return f"System Action Complete: Script executed successfully. Return value:\n{result}"
    except Exception as e:
        return f"System Error executing script: {str(e)}"