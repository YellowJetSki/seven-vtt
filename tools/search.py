from ddgs import DDGS

def perform_web_search(query: str, max_results: int = 3) -> str:
    """
    Searches the web for up-to-date D&D rules, news, or general questions.
    """
    try:
        results = DDGS().text(query, max_results=max_results)
        if not results:
            return "No results found."
        
        formatted_results = []
        for i, res in enumerate(results):
            # Extract the title, snippet, and URL for the LLM to read
            formatted_results.append(f"{i+1}. {res.get('title')}\n{res.get('body')}\nURL: {res.get('href')}")
            
        return "\n\n".join(formatted_results)
    except Exception as e:
        return f"Search failed: {str(e)}"