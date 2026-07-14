import os
from pathlib import Path

def search_session_notes(keyword: str, notes_dir: str = "notes") -> str:
    """
    Scans the local notes directory for a specific keyword and returns relevant snippets.
    """
    base_path = Path(notes_dir).resolve()
    if not base_path.exists():
        return f"Error: The notes directory does not exist at {base_path}"
        
    results = []
    files_scanned = 0
    
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith((".txt", ".md")):
                files_scanned += 1
                file_path = Path(root) / file
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if keyword.lower() in line.lower():
                                # Grab a small context window around the match
                                start = max(0, i - 2)
                                end = min(len(lines), i + 3)
                                snippet = "".join(lines[start:end]).strip()
                                results.append(f"--- Found in {file_path.name} ---\n{snippet}\n")
                except Exception as e:
                    # If Windows Notepad saved the file in a weird encoding, this will catch it
                    return f"Error reading {file}: {str(e)}"
                    
    if not results:
        return f"Scanned {files_scanned} files. No mentions of '{keyword}' found in the session notes at {base_path}."
        
    return "\n".join(results)