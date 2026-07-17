import subprocess

def validate_code_hygiene() -> str:
    """Runs strict TypeScript compilation and ESLint layout checks to prevent hacky solutions."""
    failures = []
    
    # 1. Force strict type-checking and emit validation
    # This catches implicit 'any' assignments, missing interfaces, and improper prop mapping
    tsc_res = subprocess.run("npx tsc --noEmit", shell=True, capture_output=True, text=True, cwd=".")
    if tsc_res.returncode != 0:
        failures.append(f"CRITICAL TYPESCRIPT VIOLATIONS:\n{tsc_res.stdout or tsc_res.stderr}")
        
    # 2. Force ESLint evaluation to prevent dead code, console logs, or anti-patterns
    eslint_res = subprocess.run("npx eslint . --ext .ts,.tsx --max-warnings 0", shell=True, capture_output=True, text=True, cwd=".")
    if eslint_res.returncode != 0:
        failures.append(f"ESLINT QUALITY AND BEST-PRACTICE STANDARDS VIOLATION:\n{eslint_res.stdout or eslint_res.stderr}")
        
    if not failures:
        return "Hygiene Check Complete: The codebase strictly adheres to architectural standards. No hacks detected."
        
    return "\n\n=== ARCHITECTURAL HYGIENE FAILURE ===\n" + "\n".join(failures) + "\n===================================="