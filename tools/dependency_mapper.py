import os
import re
from pathlib import Path

def map_component_dependencies(target_component: str, directory: str = "src") -> str:
    """
    Scans the defined directory structure to identify every file that imports a specific 
    component, acting as a blast-radius warning system prior to prop modification.
    """
    base_path = Path(".").resolve()
    target_path = (base_path / directory).resolve()
    
    if not target_path.exists() or not target_path.is_dir():
        return f"System Error: Target directory '{directory}' does not exist in the workspace."
        
    dependents = []
    
    try:
        for root, _, files in os.walk(target_path):
            for file in files:
                if file.endswith(('.tsx', '.jsx', '.ts', '.js')):
                    file_path = Path(root) / file
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Search for import statements capturing the target component
                        if re.search(fr'import\s+{{?[^}}]*\b{target_component}\b[^}}]*}}?\s+from', content):
                            rel_path = file_path.relative_to(base_path)
                            dependents.append(str(rel_path))
        
        if not dependents:
            return f"Dependency Graph Clear: '{target_component}' has 0 active imports. It is safe to modify or delete without causing cascading architectural failure."
        
        formatted_list = "\n".join([f"- {d}" for d in dependents])
        return (
            f"DEPENDENCY WARNING: Modifying the interface or props of '{target_component}' will directly affect the following files:\n"
            f"{formatted_list}\n"
            f"SYSTEM DIRECTIVE: If you alter the props, you must immediately patch the files listed above."
        )
        
    except Exception as e:
        return f"System Error generating dependency map: {str(e)}"