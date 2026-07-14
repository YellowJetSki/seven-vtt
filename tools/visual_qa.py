import urllib.request
import urllib.error
from html.parser import HTMLParser

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
            if name in ('id', 'class'): # Only keep structural/styling attributes
                attr_str += f' {name}="{value}"'

        self.output.append("  " * self.indent + f"<{tag}{attr_str}>")
        if tag not in ('img', 'br', 'hr', 'input'): # Void elements don't indent
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

def scan_local_dom(port: int = 5173, path: str = "/") -> str:
    """
    Silently pings the local dev server and returns a stripped-down structural map 
    of the DOM so the AI can 'see' the Tailwind CSS layout.
    """
    url = f"http://localhost:{port}{path}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Baldeepicius-QA-Bot'})
        with urllib.request.urlopen(req, timeout=5) as response:
            html_content = response.read().decode('utf-8')
            
        parser = DOMStripper()
        parser.feed(html_content)
        
        dom_tree = "\n".join(parser.output)
        
        if len(dom_tree) > MAX_DOM_CHARS:
            return f"Success: DOM retrieved (Truncated due to massive size):\n\n" + dom_tree[:MAX_DOM_CHARS] + "\n...[TRUNCATED]"
            
        return f"Success: Live structural layout from {url}:\n\n" + dom_tree

    except urllib.error.URLError as e:
        return f"System Error: Could not connect to localhost:{port}. Ensure your Vite dev server ('npm run dev') is actively running before using Visual QA. Details: {str(e)}"
    except Exception as e:
        return f"System Error processing DOM layout: {str(e)}"