import subprocess
import os
from pathlib import Path

# Only these base commands are allowed to run
ALLOWED_PREFIXES = {"npm", "npx", "node", "tsc", "git", "ls", "dir", "echo", "pwd"}

# Symbols used to chain multiple commands (highly dangerous)
BANNED_SYMBOLS = {"&&", ";", "|", ">", "<", "`", "$("}

# Keywords that indicate the AI is trying to use the terminal to bypass file writing protocols
BANNED_KEYWORDS = {"-e", "--eval", "fs.", "writeFileSync", "writeFile", "appendFile", ".cjs", ".mjs"}

# Persistent server commands that will hang the subprocess indefinitely
BANNED_SERVERS = {"run dev", "vite", "serve", "nodemon", "start"}

# Maximum characters to return to the AI (prevents token explosions on massive build logs)
MAX_OUTPUT_CHARS = 10_000

def execute_terminal_command(command: str, base_dir: str = ".") -> str:
    """
    Securely executes a terminal command with a strict whitelist, anti-chaining guards, and an auto-'yes' pipeline.
    """
    command = command.strip()
    if not command:
        return "Error: Empty command."
        
    # Guard 1: Anti-Chaining
    for symbol in BANNED_SYMBOLS:
        if symbol in command:
            return f"Error: Security violation. Command chaining or redirection ('{symbol}') is strictly prohibited."
            
    # Guard 2: The Backdoor Block
    for keyword in BANNED_KEYWORDS:
        if keyword in command:
            return (
                f"Error: SECURITY OVERRIDE. You attempted to use the terminal to manipulate files using '{keyword}'. "
                f"You are strictly forbidden from executing custom JS scripts or editing files via the terminal. "
                f"You MUST use the 'write_workspace_file' tool."
            )

    # Guard 3: The Anti-Daemon Block (Prevents hanging on persistent servers)
    cmd_lower = command.lower()
    for server_cmd in BANNED_SERVERS:
        # Allow 'build' commands that might contain these words, but block actual server starts
        if server_cmd in cmd_lower and "build" not in cmd_lower:
            return (
                f"SYSTEM DIRECTIVE: SECURITY OVERRIDE. You attempted to start a persistent server ('{command}'). "
                f"This terminal tool is strictly for short-lived commands (build, test, lint, deploy). "
                f"Starting a dev server here will cause the system to hang indefinitely. "
                f"Please ask the user to manually run their dev server in a separate terminal window."
            )
            
    # Guard 4: Whitelist check
    base_cmd = command.split()[0].lower()
    if base_cmd not in ALLOWED_PREFIXES:
        return f"Error: Security violation. Command '{base_cmd}' is not permitted. Allowed commands: {', '.join(ALLOWED_PREFIXES)}"
        
    base_path = Path(base_dir).resolve()
    
    # --- THE BOT PROTOCOL ---
    secure_env = os.environ.copy()
    secure_env["CI"] = "true"                  
    secure_env["NPM_CONFIG_YES"] = "true"      
    secure_env["NPM_CONFIG_FUND"] = "false"    
    secure_env["NPM_CONFIG_AUDIT"] = "false"   
    
    try:
        # Execute the command with a 30-second killswitch, bot environment, and the Auto-Yes Pipeline
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
        # THE FALLBACK DIRECTIVE
        return (
            f"SYSTEM DIRECTIVE: The command '{command}' timed out after 30 seconds. "
            f"It was forcefully terminated to prevent the system from hanging. "
            f"This usually means the command is waiting for manual interactive input that cannot be bypassed, "
            f"or it started an unrecognized persistent process. Do NOT try this exact command again. "
            f"Attempt an alternative approach, use a different flag, or ask the user for manual assistance."
        )
    except Exception as e:
        return f"System error executing terminal command: {str(e)}"