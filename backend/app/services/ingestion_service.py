import os
import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models.document import Document
from app.services import s3_service, vector_service

logger = logging.getLogger(__name__)


def _get_embeddings():
    """Get embedding model — uses HuggingFace (free, local) for embeddings."""
    from langchain_community.embeddings import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )


def process_document(document_id: str, db_session_factory) -> None:
    """
    Background task: process an uploaded PDF into a searchable FAISS index.

    Steps:
    1. Download PDF from S3/local storage to temp file
    2. Load with PyPDFLoader → list of pages
    3. Split into chunks (RecursiveCharacterTextSplitter)
    4. Generate embeddings (HuggingFace — free, no API key needed)
    5. Create FAISS index and persist to disk
    6. Update document record: status="ready"

    On failure: status="failed" with error_message
    """
    db = db_session_factory()
    temp_path = None

    try:
        # Get document record
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found")
            return

        # Step 1: Download PDF to temp file
        logger.info(f"Downloading PDF for document {document_id}")
        temp_path = s3_service.download_to_temp(doc.s3_key)

        # Step 2: Load PDF
        logger.info(f"Loading PDF: {doc.filename}")
        from langchain_community.document_loaders import PyPDFLoader

        loader = PyPDFLoader(temp_path)
        pages = loader.load()
        page_count = len(pages)

        if page_count == 0:
            raise ValueError("PDF contains no extractable text")

        # Step 3: Split into chunks
        logger.info(f"Splitting {page_count} pages into chunks")
        from langchain.text_splitter import RecursiveCharacterTextSplitter

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_documents(pages)
        chunk_count = len(chunks)

        if chunk_count == 0:
            raise ValueError("No text chunks could be extracted from PDF")

        # Step 4 & 5: Embed and create FAISS index
        logger.info(f"Creating FAISS index from {chunk_count} chunks")
        embeddings = _get_embeddings()
        index_path = vector_service.create_index(document_id, chunks, embeddings)

        # Step 6: Update document record
        doc.status = "ready"
        doc.page_count = page_count
        doc.chunk_count = chunk_count
        doc.faiss_index_path = index_path
        doc.processed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            f"Document {document_id} processed: {page_count} pages, {chunk_count} chunks"
        )

    except Exception as e:
        logger.error(f"Failed to process document {document_id}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)[:500]
                db.commit()
        except Exception:
            logger.error(f"Failed to update document status for {document_id}")

    finally:
        # Clean up temp file
        if temp_path and Path(temp_path).exists():
            os.unlink(temp_path)
        db.close()
