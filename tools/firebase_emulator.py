import json
import urllib.request
import urllib.error

def run_firebase_emulator_query(collection: str, document_id: str = "", method: str = "GET", payload: dict = None, port: int = 8080, project_id: str = "demo-vtt") -> str:
    """
    Executes a direct REST transaction against the local Firestore Emulator.
    This allows the AI to autonomously test backend logic, read mock D&D characters, 
    or verify database schemas without touching production.
    """
    base_url = f"http://localhost:{port}/v1/projects/{project_id}/databases/(default)/documents/{collection}"
    url = f"{base_url}/{document_id}" if document_id else base_url

    try:
        data = None
        headers = {'Content-Type': 'application/json'}
        
        # Format payload for Firestore REST format if writing data
        if payload and method in ["POST", "PATCH", "PUT"]:
            firestore_payload = {"fields": payload}
            data = json.dumps(firestore_payload).encode('utf-8')

        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            return f"System Action Complete: Database transaction successful.\n{json.dumps(response_data, indent=2)}"
            
    except urllib.error.URLError as e:
        return f"System Error: Could not connect to Firestore Emulator on port {port}. Ensure your emulator suite is actively running ('firebase emulators:start') before querying the backend. Details: {str(e)}"
    except Exception as e:
        return f"System Error processing database transaction: {str(e)}"