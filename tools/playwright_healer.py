import subprocess
import json

def auto_fix_test_suite() -> str:
    """
    Executes the Playwright suite using a JSON reporter, parsing failures to feed 
    directly into the agent's context for autonomous code patching.
    """
    try:
        result = subprocess.run(
            ["npx", "playwright", "test", "--reporter=json"], 
            capture_output=True, 
            text=True
        )
        
        if result.returncode == 0:
            return "QA System Report: All Playwright end-to-end tests passed successfully. No healing required."
        
        try:
            report = json.loads(result.stdout)
            errors = []
            
            for suite in report.get("suites", []):
                for spec in suite.get("specs", []):
                    for test in spec.get("tests", []):
                        for res in test.get("results", []):
                            if res.get("status") == "failed":
                                err_msg = res.get('error', {}).get('message', 'Unknown error trace')
                                errors.append(f"FAILED TEST: '{spec['title']}'\nTRACE: {err_msg}")
                                
            formatted_errors = "\n\n".join(errors)
            return (
                f"QA System Report: Test failures detected.\n\n"
                f"{formatted_errors}\n\n"
                f"SYSTEM DIRECTIVE: Analyze the trace above and execute 'edit_workspace_file' to patch the failing component."
            )
        except Exception:
            return f"QA System Report: Tests failed, but the JSON reporter could not be parsed. Raw standard error output:\n{result.stderr[-1500:]}"
            
    except Exception as e:
        return f"System Error executing the Playwright auto-healer tool: {str(e)}"