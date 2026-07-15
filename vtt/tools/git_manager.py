import subprocess
import os
from pathlib import Path

# Prevent massive diffs from blowing up the context window
MAX_OUTPUT_CHARS = 15_000

def run_git_command(command: str, base_dir: str = ".") -> str:
    """
    Securely executes a Git command within the workspace.
    """
    command = command.strip()
    if not command.startswith("git "):
        return "Error: Security violation. This tool can only execute 'git' commands."

    base_path = Path(base_dir).resolve()
    
    # Block interactive/blocking commands that might hang
    if "rebase -i" in command or "commit --amend" in command and "-m" not in command:
        return "Error: Interactive git commands are blocked to prevent terminal hangs. Use non-interactive flags."

    try:
        result = subprocess.run(
            command,
            cwd=base_path,
            shell=True,
            capture_output=True,
            text=True,
            timeout=15,
            stdin=subprocess.DEVNULL
        )
        
        output = result.stdout + "\n" + result.stderr
        output = output.strip()
        
        if not output:
            return f"System Action Complete: '{command}' executed successfully with no output."
            
        if len(output) > MAX_OUTPUT_CHARS:
            output = "...[SYSTEM OVERRIDE: Git output truncated due to massive length. Showing tail-end of logs]...\n" + output[-MAX_OUTPUT_CHARS:]
            
        return output
        
    except subprocess.TimeoutExpired:
        return "Error: Git command timed out. Ensure you are not running commands that wait for user input."
    except Exception as e:
        return f"System error executing git command: {str(e)}"