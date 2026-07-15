import os
from pathlib import Path
from datetime import datetime

def log_system_note(topic: str, content: str, base_dir: str = ".") -> str:
    """
    Creates or appends a timestamped note to a .txt file in the dedicated notes directory.
    """
    base_path = Path(base_dir).resolve()
    notes_dir = (base_path / "notes").resolve()
    
    try:
        # Ensure the notes directory exists
        os.makedirs(notes_dir, exist_ok=True)
        
        # Sanitize the topic into a safe filename (e.g., "The Tudul Family" -> "the_tudul_family.txt")
        safe_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '_', '-')).strip()
        filename = safe_topic.replace(" ", "_").lower() + ".txt"
        target_path = notes_dir / filename
        
        # Format the log entry with a JARVIS-style timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        is_new_file = not target_path.exists()
        
        header = f"# Subject: {topic}\nSystem Log Initialized: {timestamp}\n\n" if is_new_file else f"\n\n--- Appendix Log: {timestamp} ---\n"
        
        with open(target_path, 'a', encoding='utf-8') as f:
            f.write(header + content + "\n")
            
        action = "Created new databank" if is_new_file else "Appended to existing databank"
        return f"Success: {action} at notes/{filename}."
        
    except Exception as e:
        return f"System error logging note: {str(e)}"