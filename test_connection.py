import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)
key = os.getenv("DEEPSEEK_API_KEY")

print(f"Key loaded: {'Yes' if key else 'No'}")
print(f"Key starts with: {key[:5] if key else 'N/A'}")

try:
    response = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": "deepseek-chat", "messages": [{"role": "user", "content": "hi"}]},
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Full Connection Error: {str(e)}")