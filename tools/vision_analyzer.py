import os
import base64
from playwright.sync_api import sync_playwright

def capture_and_analyze_screenshot(url: str) -> str:
    """
    Captures a headless browser screenshot of the target URL and encodes it 
    for visual UI/CSS validation against a multi-modal vision model.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Navigate and wait for DOM to fully render
            page.goto(url, wait_until="networkidle")
            screenshot_bytes = page.screenshot(full_page=True)
            browser.close()
            
            encoded = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            # In a live environment, this base64 string is passed into the Vision API payload
            return f"System Action Complete: Viewport snapshot captured successfully. Base64 encoding ready for Vision API validation. (Preview: {encoded[:100]}...)"
    except Exception as e:
        return f"System Error capturing screenshot: {str(e)}"