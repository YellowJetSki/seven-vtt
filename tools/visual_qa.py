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
    """Singleton to keep the Playwright browser alive and manage multiple tabs."""
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._boot_browser()
        atexit.register(self.cleanup)

    def _boot_browser(self):
        """Initializes the browser and core context."""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

    def ensure_alive(self):
        """THE HEARTBEAT: Checks if the browser crashed or was closed, and revives it if necessary."""
        try:
            if not self.browser.is_connected():
                raise Exception("Browser disconnected")
            # This will throw an error if the context or all pages were closed
            _ = self.context.pages
            
            # If all tabs were closed but browser is alive, spawn a default tab
            if len(self.context.pages) == 0:
                self.page = self.context.new_page()
                
        except Exception:
            self.cleanup()
            self._boot_browser()

    def cleanup(self):
        try: self.browser.close()
        except: pass
        try: self.playwright.stop()
        except: pass


def _extract_current_dom(page) -> str:
    """Reads the DOM exactly as it is right now."""
    page.wait_for_timeout(200)
    html_content = page.content()
    
    parser = DOMStripper()
    parser.feed(html_content)
    dom_tree = "\n".join(parser.output)
    
    # Get active tab index context
    manager = BrowserManager.get_instance()
    try:
        active_index = manager.context.pages.index(page)
    except ValueError:
        active_index = 0
        
    status_header = f"Success: Live structural layout from {page.url} [Active Tab: {active_index}]:\n\n"
    
    if len(dom_tree) > MAX_DOM_CHARS:
        return status_header + dom_tree[:MAX_DOM_CHARS] + "\n...[TRUNCATED]"
        
    return status_header + dom_tree


# --- THE INTERACTIVE ACTION TOOLS ---

def scan_dom(url: str) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    
    try:
        if manager.page.url != url:
            try:
                manager.page.goto(url, wait_until="networkidle", timeout=5000)
            except PlaywrightTimeoutError:
                pass 
                
        return _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error processing DOM layout: {str(e)}"


def open_new_tab(url: str) -> str:
    """Spawns a new tab and navigates to the URL."""
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    
    try:
        new_page = manager.context.new_page()
        manager.page = new_page # Set active
        
        try:
            new_page.goto(url, wait_until="networkidle", timeout=5000)
        except PlaywrightTimeoutError:
            pass
            
        return _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error opening new tab: {str(e)}"


def switch_to_tab(index: int) -> str:
    """Switches the active AI focus to a different open tab."""
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    
    pages = manager.context.pages
    if index < 0 or index >= len(pages):
        return f"System Error: Tab index {index} does not exist. There are currently {len(pages)} open tabs (0 to {len(pages)-1})."
        
    try:
        manager.page = pages[index]
        manager.page.bring_to_front()
        return _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error switching tabs: {str(e)}"


def click_ui_element(selector: str) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        locator = manager.page.locator(selector).first
        locator.wait_for(state="visible", timeout=3000)
        
        locator.hover()
        manager.page.wait_for_timeout(150) 
        locator.click(delay=100) 
        
        manager.page.wait_for_timeout(600) 
        try: manager.page.wait_for_load_state("networkidle", timeout=2000)
        except PlaywrightTimeoutError: pass
        
        return f"System Action Complete: Clicked '{selector}'.\n\nNew UI State:\n" + _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error: Could not click '{selector}'. Details: {str(e)}"


def fill_input_field(selector: str, text: str) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        locator = manager.page.locator(selector).first
        locator.wait_for(state="visible", timeout=3000)
        
        locator.click()
        manager.page.wait_for_timeout(100)
        manager.page.keyboard.press("Control+A")
        manager.page.keyboard.press("Backspace")
        
        locator.press_sequentially(text, delay=75)
        manager.page.wait_for_timeout(500)
        
        return f"System Action Complete: Typed '{text}' into '{selector}'.\n\nNew UI State:\n" + _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error: Could not fill element '{selector}'. Details: {str(e)}"


def evaluate_javascript(script: str) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        result = manager.page.evaluate(script)
        manager.page.wait_for_timeout(500)
        return f"System Action Complete: Script executed successfully. Return value:\n{result}"
    except Exception as e:
        return f"System Error executing script: {str(e)}"