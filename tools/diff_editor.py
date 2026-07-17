import os
import subprocess

def apply_unified_diff(file_path: str, diff_text: str) -> str:
    """Applies a unified patch/diff to a workspace file for surgical accuracy."""
    try:
        patch_path = file_path + ".patch"
        with open(patch_path, 'w', encoding='utf-8') as f:
            f.write(diff_text)
            
        result = subprocess.run(f"git apply {patch_path}", shell=True, capture_output=True, text=True)
        
        if os.path.exists(patch_path):
            os.remove(patch_path)
        
        if result.returncode == 0:
            return f"System Action Complete: Diff patch applied successfully to {file_path}."
        else:
            return f"System Error applying diff: {result.stderr}\nFallback Recommendation: Use edit_workspace_file for direct string replacements."
    except Exception as e:
        return f"System Error handling diff: {str(e)}"