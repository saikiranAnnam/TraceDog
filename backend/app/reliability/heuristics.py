def grounding_from_docs(response: str, doc_contents: list[str]) -> float:
    """
    v0:
    Returns the grounding score for a given response and retrieved documents.
    The grounding score is a measure of how well the response is grounded in the retrieved documents.
    The grounding score is a value between 0 and 1.
    A grounding score of 0 means that the response is not grounded in the retrieved documents.
    A grounding score of 1 means that the response is fully grounded in the retrieved documents.
    The grounding score is calculated as the fraction of response tokens that appear in any retrieved document.
    
    So: higher grounding ==> more overlap between response and retrieved documents.
    """

    if not response.strip():
        return 0.0
    if not doc_contents:
        return 0.35

    response_words = set(w.lower() for w in response.split() if len(w) > 2)
    if not response_words:
        return 0.5

    doc_blob = " ".join(doc_contents).lower()
    supported = sum(1 for w in response_words if w in doc_blob)
    return min(1.0, supported / len(response_words))
