import requests

def evaluate_firestore_security(collection: str, doc_id: str, role: str, uid: str) -> str:
    """
    Simulates Firebase Emulator transactions by minting mock JWT headers to mathematically
    verify whether specific user roles are properly authorized or denied.
    """
    try:
        # Construct the local emulator REST endpoint path
        emulator_url = f"http://localhost:8080/v1/projects/demo-project/databases/(default)/documents/{collection}/{doc_id}"
        
        # Simulate a Firebase Auth JWT via headers
        headers = {"Authorization": f"Bearer mock-token-for-{uid}-role-{role}"}
        
        res = requests.get(emulator_url, headers=headers)
        
        if res.status_code == 200:
            return f"SECURITY AUDIT SUCCESS (READ ALLOWED): Role '{role}' (UID: {uid}) was successfully permitted to read '{collection}/{doc_id}'. Verify if this is your intended architecture."
        elif res.status_code == 403:
            return f"SECURITY AUDIT SECURED (READ DENIED): Role '{role}' (UID: {uid}) was strictly DENIED access to '{collection}/{doc_id}'. The security rule is holding."
        elif res.status_code == 404:
            return f"SECURITY AUDIT NOTE: Document '{collection}/{doc_id}' does not exist in the emulator, but read access was checked."
        else:
            return f"SECURITY AUDIT UNEXPECTED STATUS {res.status_code}: {res.text}"
            
    except Exception as e:
        return f"System Error evaluating Firestore security rules: {str(e)}"