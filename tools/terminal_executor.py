import subprocess
import os
import sys
import signal
from pathlib import Path

# Only these base commands are allowed to run
ALLOWED_PREFIXES = {"npm", "npx", "node", "tsc", "git", "ls", "dir", "echo", "pwd"}

# Symbols used to chain multiple commands (highly dangerous)
BANNED_SYMBOLS = {"&&", ";", "|", ">", "<", "`", "$("}

# Keywords that indicate the AI is trying to use the terminal to bypass file writing protocols
BANNED_KEYWORDS = {"-e", "--eval", "fs.", "writeFileSync", "writeFile", "appendFile", ".cjs", ".mjs"}

# Maximum characters to return to the AI (prevents token explosions on massive build logs)
MAX_OUTPUT_CHARS = 10_000

def execute_terminal_command(command: str, base_dir: str = ".") -> str:
    """
    Securely executes a terminal command with a strict whitelist, anti-chaining guards, and an auto-'yes' pipeline.
    This is for quick, terminating commands (like builds or linters).
    """
    command = command.strip()
    if not command:
        return "Error: Empty command."
        
    # Guard 1: Anti-Chaining
    for symbol in BANNED_SYMBOLS:
        if symbol in command:
            return f"Error: Security violation. Command chaining or redirection ('{symbol}') is strictly forbidden. Execute one command at a time."

    # Guard 2: Anti-Bypass
    for keyword in BANNED_KEYWORDS:
        if keyword in command:
            return f"Error: Security violation. You are attempting to write or evaluate code via the terminal. Use the 'write_workspace_file' tool instead."

    # Guard 3: Prefix Whitelist
    first_word = command.split()[0]
    if first_word not in ALLOWED_PREFIXES:
        return f"Error: The command '{first_word}' is not whitelisted. Allowed prefixes: {', '.join(ALLOWED_PREFIXES)}"

    # Guard 4: Persistent Server Check
    for server in {"run dev", "vite", "serve", "nodemon", "start", "emulators:start"}:
        if server in command:
            return f"SYSTEM DIRECTIVE: You are trying to start a persistent server using the standard executor. This will hang the system. You MUST use the 'start_persistent_terminal' tool for this command instead."

    base_path = Path(base_dir).resolve()
    
    # Force CI mode to prevent tools from waiting for interactive prompts
    secure_env = os.environ.copy()
    secure_env["CI"] = "true"

    try:
        result = subprocess.run(
            command,
            cwd=base_path,
            shell=True, 
            capture_output=True,
            text=True,
            timeout=30,
            env=secure_env,
            # THE AUTO-YES PIPELINE: Feeds "y" + Enter up to 100 times to any blocking prompt
            input="y\n" * 100  
        )
        
        output = result.stdout + "\n" + result.stderr
        output = output.strip()
        
        if not output:
            return "System Action Complete: Command executed successfully with no terminal output."
            
        if len(output) > MAX_OUTPUT_CHARS:
            output = "...[SYSTEM OVERRIDE: Output truncated due to massive length. Showing tail-end of logs]...\n" + output[-MAX_OUTPUT_CHARS:]
            
        return output
        
    except subprocess.TimeoutExpired:
        return (
            f"SYSTEM DIRECTIVE: The command '{command}' timed out after 30 seconds. "
            f"It was forcefully terminated to prevent the system from hanging. "
            f"If this is a server, use the 'start_persistent_terminal' tool. Otherwise, ask the user for manual assistance."
        )
    except Exception as e:
        return f"System error executing terminal command: {str(e)}"

def start_persistent_terminal(command: str, base_dir: str = ".") -> str:
    """
    Spawns a physically separate, persistent terminal window for long-running servers.
    This prevents blocking the main AI thread.
    """
    base_path = Path(base_dir).resolve()
    try:
        if sys.platform == "win32":
            # Physically open a new command prompt window that stays open (/k)
            full_cmd = f'start cmd.exe /k "{command}"'
            subprocess.Popen(full_cmd, cwd=base_path, shell=True)
        elif sys.platform == "darwin":
            # Mac fallback via AppleScript
            full_cmd = f"""osascript -e 'tell app "Terminal" to do script "cd {base_path} && {command}"'"""
            subprocess.Popen(full_cmd, shell=True)
        else:
            # Linux fallback
            subprocess.Popen(f"x-terminal-emulator -e '{command}'", cwd=base_path, shell=True)
            
        return f"System Action Complete: Successfully spawned a new, persistent terminal window running '{command}'. It is running safely in the background."
    except Exception as e:
        return f"System Error starting persistent terminal: {str(e)}"

def stop_persistent_terminal(command_signature: str) -> str:
    """
    Finds and terminates background server processes matching a specific command signature string.
    Useful for freeing up specific ports (like 3000 or 8080) when tasks change.
    """
    try:
        if sys.platform == "win32":
            # Windows command line task killing pattern matching the signature string
            cmd = f'wmic process where "commandline like \'%%{command_signature}%%\'" get processid'
            output = subprocess.check_output(cmd, shell=True, text=True)
            pids = [line.strip() for line in output.split('\n') if line.strip() and line.strip().isdigit()]
            killed_count = 0
            for pid in pids:
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                killed_count += 1
            return f"System Action Complete: Terminated {killed_count} active Windows processes matching '{command_signature}'."
        else:
            # Unix-based terminal task termination string pattern scanning
            pids = subprocess.check_output(["pgrep", "-f", command_signature]).decode().split()
            killed_count = 0
            for pid in pids:
                os.kill(int(pid), signal.SIGKILL)
                killed_count += 1
            return f"System Action Complete: Terminated {killed_count} persistent processes matching '{command_signature}'."
    except Exception:
        return f"System Note: Clean shutdown sequence complete. No matching background active processes found for '{command_signature}'."