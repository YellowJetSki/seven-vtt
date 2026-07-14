import os
import re
from pathlib import Path

# Maximum characters to return to prevent API token explosion
MAX_OUTPUT_CHARS = 20_000

def search_workspace_code(keyword: str, directory: str = ".", base_dir: str = ".") -> str:
    """
    Scans for a keyword within a specific folder using Semantic Structural Parsing.
    It identifies definitions (functions, classes, interfaces) and returns the surrounding context.
    """
    base_path = Path(base_dir).resolve()
    target_path = (base_path / directory).resolve()

    if not target_path.is_relative_to(base_path):
        return "Error: Security violation. Cannot search outside the workspace."

    if not target_path.exists() or not target_path.is_dir():
        return f"Error: Directory '{directory}' does not exist."

    # Structural Regex: Looks for exact matches AND structural definitions
    structural_pattern = re.compile(rf"(function\s+{keyword}\b|const\s+{keyword}\s*=|class\s+{keyword}\b|interface\s+{keyword}\b|type\s+{keyword}\b)")

    results = []
    
    for root, dirs, files in os.walk(target_path):
        # Ignore heavy dependency folders
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "dist", ".next", "__pycache__"}]
        
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss')):
                continue

            file_path = Path(root) / file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()

                matches_in_file = []
                for i, line in enumerate(lines):
                    if keyword in line or structural_pattern.search(line):
                        # Grab 2 lines above and 3 lines below for architectural context
                        start = max(0, i - 2)
                        end = min(len(lines), i + 4)
                        context = "".join(lines[start:end]).strip()
                        matches_in_file.append(f"--- Line {i+1} ---\n{context}\n")

                if matches_in_file:
                    rel_path = file_path.relative_to(base_path)
                    results.append(f"\n[FILE: {rel_path}]\n" + "\n".join(matches_in_file))
            except Exception:
                pass

    if not results:
        return f"No matches found for '{keyword}' in '{directory}'."

    final_output = "".join(results)
    
    if len(final_output) > MAX_OUTPUT_CHARS:
        return f"System Alert: Massive result set found. Truncating output to maintain stability.\n\n{final_output[:MAX_OUTPUT_CHARS]}\n...[TRUNCATED]"
        
    return f"Semantic Search Results for '{keyword}':\n" + final_output