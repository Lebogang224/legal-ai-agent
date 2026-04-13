import os
import shutil
from pathlib import Path

from app.config import settings


def _index_dir(document_id: str) -> Path:
    return Path(settings.faiss_index_dir) / document_id


def create_index(document_id: str, chunks: list, embeddings) -> str:
    """
    Create a FAISS index from document chunks and persist to disk.

    Args:
        document_id: Unique document identifier
        chunks: List of LangChain Document objects
        embeddings: Embedding model instance

    Returns:
        Path to the persisted index directory
    """
    from langchain_community.vectorstores import FAISS

    vectorstore = FAISS.from_documents(chunks, embeddings)

    index_path = _index_dir(document_id)
    index_path.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(index_path))

    return str(index_path)


def load_index(document_id: str, embeddings):
    """
    Load a persisted FAISS index from disk.

    Returns:
        FAISS vectorstore instance
    """
    from langchain_community.vectorstores import FAISS

    index_path = _index_dir(document_id)
    if not index_path.exists():
        raise FileNotFoundError(f"No FAISS index found for document {document_id}")

    return FAISS.load_local(
        str(index_path), embeddings, allow_dangerous_deserialization=True
    )


def similarity_search(index, query: str, k: int = 5) -> list:
    """Return top-k most relevant document chunks for a query."""
    return index.similarity_search_with_score(query, k=k)


def delete_index(document_id: str) -> None:
    """Remove persisted FAISS index from disk."""
    index_path = _index_dir(document_id)
    if index_path.exists():
        shutil.rmtree(index_path)
