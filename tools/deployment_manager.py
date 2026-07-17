import subprocess
import re
from tools.vision_analyzer import capture_and_analyze_screenshot

def execute_production_deployment() -> str:
    """
    Synchronously pushes code to Git, deploys to Vercel, waits for the build to finish, 
    extracts the URL, and immediately runs visual QA.
    """
    try:
        # 1. Secure the repository state
        subprocess.run("git add .", shell=True, check=True, cwd=".")
        # We use a broad commit message here; the sprint checkpoint handles granular history
        subprocess.run('git commit -m "chore: autonomous production deployment"', shell=True, cwd=".")
        subprocess.run("git push origin main", shell=True, check=True, cwd=".")
        
        # 2. Execute Vercel Production Build (This blocks the thread until Vercel finishes)
        deploy_res = subprocess.run("npx vercel --prod", shell=True, capture_output=True, text=True, cwd=".")
        output = deploy_res.stdout + "\n" + deploy_res.stderr
        
        # 3. Extract the generated live URL
        match = re.search(r'(https://[a-zA-Z0-9-]+\.vercel\.app)', output)
        if not match:
            return f"SYSTEM ERROR: Deployment finished, but the live URL could not be extracted.\nTerminal Output:\n{output}"
            
        live_url = match.group(1)
        
        # 4. Await deployment stabilization and run Visual QA
        qa_result = capture_and_analyze_screenshot(live_url)
        
        return f"System Action Complete: Production Deployment Successful.\nLive URL: {live_url}\n\n=== VISUAL QA REPORT ===\n{qa_result}"
        
    except subprocess.CalledProcessError as e:
        return f"SYSTEM ERROR: Terminal command failed during the deployment pipeline. Details: {str(e)}"
    except Exception as e:
        return f"SYSTEM ERROR: Critical failure during deployment pipeline: {str(e)}"