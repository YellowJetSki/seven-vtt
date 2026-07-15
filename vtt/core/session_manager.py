import json
from pathlib import Path

class SessionManager:
    def __init__(self, sessions_dir: str = "sessions"):
        """
        Initializes the session manager and ensures the sessions directory exists.
        """
        self.sessions_dir = Path(sessions_dir)
        self.sessions_dir.mkdir(exist_ok=True)
        
    def load_session(self, session_name: str) -> list:
        """
        Loads a chat history array from a JSON file. Returns an empty list if none exists.
        """
        file_path = self.sessions_dir / f"{session_name}.json"
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []
        
    def save_session(self, session_name: str, messages: list):
        """
        Saves the current chat history array to a JSON file.
        """
        file_path = self.sessions_dir / f"{session_name}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(messages, f, indent=4)