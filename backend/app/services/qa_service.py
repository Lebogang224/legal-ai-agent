import time
import logging

from app.config import settings
from app.services import vector_service, cache_service

logger = logging.getLogger(__name__)

# Legal QA prompt template — instructs the LLM to only answer from provided context
QA_PROMPT_TEMPLATE = """You are a legal document analyst. Answer the question based ONLY on the provided context from the legal document.

Rules:
1. Only use information explicitly stated in the context below.
2. If the context does not contain enough information to answer the question, say "I cannot find sufficient information in this document to answer that question."
3. Always cite the specific page number where you found the information.
4. Be precise and factual — this is legal analysis, not creative writing.
5. Structure your answer clearly with numbered points if there are multiple findings.

Context:
{context}

Question: {question}

Answer:"""


def _get_embeddings():
    """Get the same embedding model used during ingestion."""
    from langchain_community.embeddings import FastEmbedEmbeddings

    return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")


def _get_llm():
    """Get LLM via Groq (free tier — Llama 3 70B)."""
    from langchain_groq import ChatGroq

    return ChatGroq(
        model=settings.llm_model,
        groq_api_key=settings.groq_api_key,
        max_tokens=settings.llm_max_tokens,
        temperature=settings.llm_temperature,
    )


def ask(document_id: str, question: str) -> dict:
    """
    Full Q&A pipeline:
    1. Check cache
    2. Load FAISS index
    3. Similarity search for relevant chunks
    4. Build prompt with context
    5. Call LLM (Claude)
    6. Parse response into answer + sources
    7. Cache result
    """
    start_time = time.time()

    # Step 1: Check cache
    cached = cache_service.get(document_id, question)
    if cached:
        elapsed_ms = int((time.time() - start_time) * 1000)
        cached["response_time_ms"] = elapsed_ms
        cached["from_cache"] = True
        return cached

    # Step 2: Load FAISS index
    embeddings = _get_embeddings()
    index = vector_service.load_index(document_id, embeddings)

    # Step 3: Similarity search — get top 5 relevant chunks
    results = vector_service.similarity_search(index, question, k=5)

    # Build context from chunks
    sources = []
    context_parts = []

    for doc, score in results:
        page_num = doc.metadata.get("page", 0) + 1  # PyPDF uses 0-indexed pages
        relevance = max(0.0, min(1.0, 1.0 - (score / 10.0)))  # Normalize score

        context_parts.append(f"[Page {page_num}]: {doc.page_content}")
        sources.append({
            "page": page_num,
            "content": doc.page_content[:300],  # Truncate for response
            "relevance_score": round(relevance, 2),
        })

    context = "\n\n---\n\n".join(context_parts)

    # Step 4 & 5: Build prompt and call LLM (Groq — Llama 3 70B)
    llm = _get_llm()
    prompt = QA_PROMPT_TEMPLATE.format(context=context, question=question)

    response = llm.invoke(prompt)
    answer = response.content

    elapsed_ms = int((time.time() - start_time) * 1000)

    result = {
        "answer": answer,
        "sources": sources,
        "response_time_ms": elapsed_ms,
        "from_cache": False,
    }

    # Step 6: Cache result
    cache_service.set(document_id, question, result)

    return result
