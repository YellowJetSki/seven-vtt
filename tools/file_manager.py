import os
import sys
import time
import uuid
import shutil
from pathlib import Path
from datetime import datetime

# Directories and lockfiles the AI should never waste tokens scanning
IGNORE_DIRS = {".git", "node_modules", "dist", ".next", "__pycache__", "venv", "env", "package-lock.json", "yarn.lock"}

# The Ultimate Guardrail: Never return more than this many characters to the AI in a single tool call
MAX_OUTPUT_CHARS = 30_000 

def flush_node_processes() -> str:
    """Silently executes a system-level wipe of any hanging Node processes holding file locks."""
    try:
        if sys.platform == "win32":
            os.system("taskkill /f /im node.exe >nul 2>&1")
        else:
            os.system("killall node >/dev/null 2>&1")
        return "System Action Complete: Successfully flushed all background Node processes and released local file locks."
    except Exception as e:
        return f"System Error executing flush: {str(e)}"

def read_workspace_file(file_path: str, base_dir: str = ".", start_line: int = None, end_line: int = None, start_char: int = None, end_char: int = None) -> str:
    """
    Securely reads a file. Includes cloud-sync anti-lock retries, ghost-flushing, and pagination.
    """
    if not file_path or str(file_path).strip() == "":
        return "SYSTEM DIRECTIVE: Critical Validation Error. You provided an empty 'file_path'. You MUST specify the exact relative path to the file you want to read."

    base_path = Path(base_dir).resolve()
    target_path = (base_path / file_path).resolve()
    
    if not target_path.is_relative_to(base_path):
        return "Error: Security violation. Access to files outside the workspace is strictly denied."
        
    if not target_path.exists() or not target_path.is_file():
        return f"Error: File '{file_path}' does not exist."
        
    max_retries = 8
    wait_time = 0.5
    content = ""
    
    for attempt in range(max_retries):
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                content = f.read()
            break
        except PermissionError as e:
            if attempt < max_retries - 1:
                time.sleep(wait_time)
                wait_time *= 1.5 
            else:
                flush_node_processes()
                time.sleep(1.0)
                try:
                    with open(target_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as final_e:
                    return f"SYSTEM DIRECTIVE: The file '{file_path}' is currently locked by the local Vite/TS server for compilation. DO NOT run terminal workarounds. Either wait a moment and invoke this read tool again, or execute the 'flush_node_processes' tool to forcefully clear the lock. ({str(final_e)})"
        except Exception as e:
            return f"Error reading file: {str(e)}"

    file_size = len(content)

    if start_char is not None or end_char is not None:
        s_char = start_char if start_char is not None else 0
        e_char = end_char if end_char is not None else file_size
        sliced_content = content[s_char:e_char]
        output_header = f"--- Displaying characters {s_char} to {e_char} of {target_path.name} ---\n"
        
    elif start_line is not None or end_line is not None:
        lines = content.splitlines(True)
        s_line = max(0, start_line - 1) if start_line is not None else 0
        e_line = min(len(lines), end_line) if end_line is not None else len(lines)
        sliced_content = "".join(lines[s_line:e_line])
        output_header = f"--- Displaying lines {s_line + 1} to {e_line} of {target_path.name} ---\n"
        
    else:
        if file_size > MAX_OUTPUT_CHARS:
            return (
                f"Error: File '{file_path}' is massive ({file_size} characters). "
                f"You MUST use the 'start_char' and 'end_char' parameters to read it in chunks. "
                f"Try requesting start_char=0, end_char={MAX_OUTPUT_CHARS}."
            )
        sliced_content = content
        output_header = f"--- Displaying entire contents of {target_path.name} ---\n"
        
    if len(sliced_content) > MAX_OUTPUT_CHARS:
        sliced_content = sliced_content[:MAX_OUTPUT_CHARS]
        
        if start_char is not None or end_char is not None:
            next_start = s_char + MAX_OUTPUT_CHARS
            output_header += f"\n[SYSTEM OVERRIDE: Data exceeded safety limits and was truncated. To continue reading, execute this tool again with start_char={next_start}]\n\n"
        else:
            output_header += f"\n[SYSTEM OVERRIDE: Data exceeded safety limits and was truncated. This is likely a minified file on a single line. Switch to using 'start_char' and 'end_char' to continue reading.]\n\n"
            
    return output_header + sliced_content

def write_workspace_file(file_path: str, content: str, base_dir: str = ".") -> str:
    """
    Securely writes code using an Atomic Swap strategy. 
    ALWAYS performs a complete file overwrite.
    """
    if not file_path or str(file_path).strip() == "":
        return "SYSTEM DIRECTIVE: Critical Validation Error. You provided an empty 'file_path'. You MUST specify the exact relative path and valid file name before attempting to write code."

    base_path = Path(base_dir).resolve()
    target_path = (base_path / file_path).resolve()
    
    if not target_path.is_relative_to(base_path):
        return "Error: Security violation. Cannot write files outside the workspace."

    try:
        os.makedirs(target_path.parent, exist_ok=True)
        temp_path = target_path.with_name(f"{target_path.name}.{uuid.uuid4().hex[:8]}.tmp")
        
        max_retries = 8
        wait_time = 0.5
        
        for attempt in range(max_retries):
            try:
                with open(temp_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                os.replace(temp_path, target_path)
                return f"Success: Wrote entire content to {file_path}"
                
            except PermissionError as e:
                if temp_path.exists():
                    try: temp_path.unlink()
                    except: pass
                    
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
                    wait_time *= 1.5 
                else:
                    flush_node_processes()
                    time.sleep(1.0)
                    try:
                        with open(temp_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        os.replace(temp_path, target_path)
                        return f"Success: Wrote entire content to {file_path} (Recovered after aggressive backoff and flush)."
                    except Exception as final_e:
                        if temp_path.exists():
                            try: temp_path.unlink()
                            except: pass
                        return f"SYSTEM DIRECTIVE: The file '{file_path}' is currently locked by the local Vite/TS server for compilation. DO NOT attempt to run scripts or terminal workarounds. You may explicitly execute the 'flush_node_processes' tool to forcefully clear the lock, and then retry your write command. ({str(final_e)})"
                        
    except Exception as e:
        return f"Error writing file: {str(e)}"

def delete_workspace_file(file_path: str, base_dir: str = ".") -> str:
    """Securely deletes a specified file or directory from the workspace."""
    if not file_path or str(file_path).strip() == "":
        return "Error: Validation Error. You provided an empty 'file_path'."

    base_path = Path(base_dir).resolve()
    target_path = (base_path / file_path).resolve()
    
    if not target_path.is_relative_to(base_path):
        return "Error: Security violation. Cannot delete files outside the workspace."
        
    if not target_path.exists():
        return f"Error: The target '{file_path}' does not exist."
        
    try:
        if target_path.is_file():
            target_path.unlink()
            return f"Success: Deleted file '{file_path}'."
        elif target_path.is_dir():
            shutil.rmtree(target_path)
            return f"Success: Deleted directory and all its contents at '{file_path}'."
    except Exception as e:
        return f"Error deleting target: {str(e)}"

def list_workspace_files(directory: str = ".", base_dir: str = ".") -> str:
    """Securely lists all files and folders in a given directory within the workspace."""
    base_path = Path(base_dir).resolve()
    target_path = (base_path / directory).resolve()
    
    if not target_path.is_relative_to(base_path):
        return "Error: Security violation. Cannot list directories outside the workspace."
        
    if not target_path.exists() or not target_path.is_dir():
        return f"Error: Directory '{directory}' does not exist."
        
    try:
        items = []
        for item in target_path.iterdir():
            if item.name in IGNORE_DIRS:
                continue
                
            suffix = "/" if item.is_dir() else ""
            items.append(f"- {item.name}{suffix}")
            
        if not items:
            return f"The directory '{directory}' is empty."
            
        return "\n".join(items)
    except Exception as e:
        return f"Error listing directory: {str(e)}"

def update_architecture_ledger(section: str, content: str, base_dir: str = ".") -> str:
    """Appends structural knowledge to the centralized vtt-architecture.md file."""
    base_path = Path(base_dir).resolve()
    ledger_path = base_path / "vtt_architecture.md"
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    formatted_entry = f"\n## {section} (Updated: {timestamp})\n{content}\n---\n"
    
    try:
        with open(ledger_path, "a", encoding="utf-8") as f:
            f.write(formatted_entry)
        return "System Action Complete: Architecture Ledger successfully updated. You may now recall this schema in future sessions."
    except Exception as e:
        return f"Error updating architecture ledger: {str(e)}"