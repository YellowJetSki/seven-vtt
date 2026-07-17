import os
import subprocess
from pathlib import Path

def create_sprint_checkpoint(sprint_number: int) -> str:
    """Commits current state as a safe restore point before a sprint begins."""
    try:
        subprocess.run("git add .", shell=True, check=True, cwd=".")
        subprocess.run(f'git commit -m "chore: Auto-Savepoint for Sprint {sprint_number}"', shell=True, capture_output=True, cwd=".")
        return f"System Action Complete: Git savepoint created for Sprint {sprint_number}."
    except subprocess.CalledProcessError as e:
        return f"System Note: Could not create savepoint (working tree might already be clean). Details: {str(e)}"

def rollback_sprint() -> str:
    """Reverts all uncommitted changes back to the last savepoint."""
    try:
        subprocess.run("git reset --hard", shell=True, check=True, cwd=".")
        subprocess.run("git clean -fd", shell=True, check=True, cwd=".")
        return "System Action Complete: Working directory has been forcefully reverted to the last safe commit."
    except subprocess.CalledProcessError as e:
        return f"System Error executing rollback: {str(e)}"

def analyze_monolith_risk(directory: str = "src") -> str:
    """Scans a directory for giant files that violate the modularity protocol."""
    base_path = Path(directory).resolve()
    warnings = []
    try:
        for root, _, files in os.walk(base_path):
            if "node_modules" in root or "dist" in root or ".git" in root:
                continue
            for file in files:
                if file.endswith((".tsx", ".ts", ".jsx", ".js")):
                    filepath = Path(root) / file
                    with open(filepath, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        if len(lines) > 150:
                            warnings.append(f"CRITICAL WARNING: {filepath.name} is {len(lines)} lines long. It must be refactored into smaller individual components immediately.")
        
        if not warnings:
            return "Architecture Nominal: No monolithic component files detected."
        return "\n".join(warnings)
    except Exception as e:
        return f"System Error scanning architecture: {str(e)}"