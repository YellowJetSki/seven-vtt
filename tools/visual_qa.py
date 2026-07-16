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
    """Singleton to keep the Playwright browser alive, manage multiple tabs, and track diagnostics."""
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
        # The Diagnostic Matrix
        self.recent_logs = []
        self.recent_network_errors = []
        
        self._boot_browser()
        atexit.register(self.cleanup)

    def _boot_browser(self):
        """Initializes the browser, core context, and diagnostic listeners."""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        self._attach_diagnostic_listeners(self.page)

    def _attach_diagnostic_listeners(self, page):
        """Wires the active tab directly into the AI's diagnostic feed."""
        def handle_console(msg):
            if msg.type in ['error', 'warning']:
                self.recent_logs.append(f"[{msg.type.upper()}] {msg.text}")
                
        def handle_response(response):
            if not response.ok and response.status >= 400:
                self.recent_network_errors.append(f"[HTTP {response.status}] {response.url}")

        page.on("console", handle_console)
        page.on("response", handle_response)

    def ensure_alive(self):
        """THE BRUTAL HEARTBEAT: Proactively hunts for dead sockets and closed windows."""
        try:
            if self.browser is None or not self.browser.is_connected():
                raise Exception("Fatal: Browser socket disconnected.")
            
            if self.page.is_closed():
                pages = self.context.pages
                if len(pages) == 0:
                    self.page = self.context.new_page()
                    self._attach_diagnostic_listeners(self.page)
                else:
                    self.page = pages[-1]
            
            self.page.evaluate("1 + 1")
            
        except Exception:
            self.cleanup()
            self._boot_browser()

    def cleanup(self):
        try: 
            if self.browser: self.browser.close()
        except: pass
        try: 
            if self.playwright: self.playwright.stop()
        except: pass
        
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None


def _extract_current_dom(page) -> str:
    """Reads the DOM and injects any tracked Diagnostic Matrix errors."""
    page.wait_for_timeout(200)
    html_content = page.content()
    
    parser = DOMStripper()
    parser.feed(html_content)
    dom_tree = "\n".join(parser.output)
    
    manager = BrowserManager.get_instance()
    try:
        active_index = manager.context.pages.index(page)
    except ValueError:
        active_index = 0
        
    status_header = f"Success: Live structural layout from {page.url} [Active Tab: {active_index}]:\n"
    
    # Inject the Diagnostic Matrix if anything triggered
    if manager.recent_logs or manager.recent_network_errors:
        status_header += "\n=== DIAGNOSTIC MATRIX ALERT ===\n"
        for log in manager.recent_logs[-5:]:
            status_header += f"CONSOLE: {log}\n"
        for err in manager.recent_network_errors[-5:]:
            status_header += f"NETWORK: {err}\n"
        status_header += "===============================\n\n"
        
        # Flush the buffer after reading
        manager.recent_logs.clear()
        manager.recent_network_errors.clear()
    else:
        status_header += "\n(Diagnostic Matrix: All Systems Nominal)\n\n"
    
    if len(dom_tree) > MAX_DOM_CHARS:
        return status_header + dom_tree[:MAX_DOM_CHARS] + "\n...[TRUNCATED]"
        
    return status_header + dom_tree

def _highlight_target(locator):
    """THE LASER POINTER: Injects JS to draw a glowing red box around the target before interaction."""
    try:
        script = """
        el => {
            const oldOutline = el.style.outline;
            const oldBoxShadow = el.style.boxShadow;
            el.style.outline = '4px solid red';
            el.style.boxShadow = '0 0 15px red';
            setTimeout(() => {
                el.style.outline = oldOutline;
                el.style.boxShadow = oldBoxShadow;
            }, 1000);
        }
        """
        locator.evaluate(script)
    except Exception:
        pass # Ignore if the element is strictly un-stylable (like SVGs in some contexts)

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
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        new_page = manager.context.new_page()
        manager.page = new_page
        manager._attach_diagnostic_listeners(new_page)
        
        try: new_page.goto(url, wait_until="networkidle", timeout=5000)
        except PlaywrightTimeoutError: pass
            
        return _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error opening new tab: {str(e)}"

def switch_to_tab(index: int) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    
    pages = manager.context.pages
    if index < 0 or index >= len(pages):
        return f"System Error: Tab index {index} does not exist."
        
    try:
        manager.page = pages[index]
        manager.page.bring_to_front()
        return _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error switching tabs: {str(e)}"

def set_viewport(width: int, height: int) -> str:
    """Dynamically shifts the browser resolution to test mobile/desktop breakpoints."""
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        manager.page.set_viewport_size({"width": width, "height": height})
        manager.page.wait_for_timeout(500) # Wait for CSS media queries to trigger
        return f"System Action Complete: Viewport resized to {width}x{height}.\n\nNew UI State:\n" + _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error resizing viewport: {str(e)}"

def click_ui_element(selector: str) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        locator = manager.page.locator(selector).first
        locator.wait_for(state="visible", timeout=3000)
        
        _highlight_target(locator)
        locator.hover()
        manager.page.wait_for_timeout(150) 
        locator.click(delay=100) 
        
        manager.page.wait_for_timeout(600) 
        try: manager.page.wait_for_load_state("networkidle", timeout=2000)
        except PlaywrightTimeoutError: pass
        
        return f"System Action Complete: Clicked CSS Selector '{selector}'.\n\nNew UI State:\n" + _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error: Could not click '{selector}'. Details: {str(e)}"

def click_text(text: str, exact: bool = False) -> str:
    """Semantic Tool: Clicks an element based entirely on the text it contains."""
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        locator = manager.page.get_by_text(text, exact=exact).first
        locator.wait_for(state="visible", timeout=3000)
        
        _highlight_target(locator)
        locator.hover()
        manager.page.wait_for_timeout(150)
        locator.click(delay=100)
        
        manager.page.wait_for_timeout(600)
        try: manager.page.wait_for_load_state("networkidle", timeout=2000)
        except PlaywrightTimeoutError: pass
        
        return f"System Action Complete: Clicked text '{text}'.\n\nNew UI State:\n" + _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error: Could not find or click text '{text}'. Details: {str(e)}"

def click_test_id(test_id: str) -> str:
    """Semantic Tool: Clicks an element based on its data-testid attribute."""
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        locator = manager.page.get_by_test_id(test_id).first
        locator.wait_for(state="visible", timeout=3000)
        
        _highlight_target(locator)
        locator.hover()
        manager.page.wait_for_timeout(150)
        locator.click(delay=100)
        
        manager.page.wait_for_timeout(600)
        try: manager.page.wait_for_load_state("networkidle", timeout=2000)
        except PlaywrightTimeoutError: pass
        
        return f"System Action Complete: Clicked test ID '{test_id}'.\n\nNew UI State:\n" + _extract_current_dom(manager.page)
    except Exception as e:
        return f"System Error: Could not find or click test ID '{test_id}'. Details: {str(e)}"

def fill_input_field(selector: str, text: str) -> str:
    manager = BrowserManager.get_instance()
    manager.ensure_alive()
    try:
        locator = manager.page.locator(selector).first
        locator.wait_for(state="visible", timeout=3000)
        
        _highlight_target(locator)
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