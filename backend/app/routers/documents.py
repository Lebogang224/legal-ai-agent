import threading

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.document import Document
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentListResponse,
)
from app.services import s3_service, ingestion_service, vector_service
from app.middleware.auth_middleware import get_current_user
from app.utils.exceptions import NotFound, Forbidden, InvalidFileType, FileTooLarge

router = APIRouter(prefix="/api/documents", tags=["Documents"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/upload", response_model=DocumentUploadResponse, status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF document for processing.
    The document will be processed in the background (PDF → chunks → FAISS index).
    Poll GET /api/documents/{id} to check processing status.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise InvalidFileType()

    if file.content_type and file.content_type != "application/pdf":
        raise InvalidFileType()

    # Read file bytes and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise FileTooLarge()

    if len(file_bytes) == 0:
        raise InvalidFileType()

    # Upload to S3 / local storage
    s3_key = s3_service.upload_file(file_bytes, current_user.id, file.filename)

    # Create document record (status: processing)
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        s3_key=s3_key,
        file_size_bytes=len(file_bytes),
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Start background processing in a thread
    # Using threading because FAISS/embeddings are CPU-bound
    thread = threading.Thread(
        target=ingestion_service.process_document,
        args=(doc.id, SessionLocal),
        daemon=True,
    )
    thread.start()

    return DocumentUploadResponse(
        id=doc.id,
        filename=doc.filename,
        status="processing",
        message="Document is being processed. Poll GET /api/documents/{id} for status.",
    )


@router.get("", response_model=DocumentListResponse)
def list_documents(
    status: str | None = Query(None, description="Filter by status: processing, ready, failed"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all documents for the current user."""
    query = db.query(Document).filter(Document.user_id == current_user.id)

    if status:
        query = query.filter(Document.status == status)

    total = query.count()
    documents = (
        query.order_by(Document.uploaded_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single document by ID."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFound("Document")

    # Only owner or admin can view
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise Forbidden("You do not have access to this document.")

    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a document and all associated data:
    - S3/local file
    - FAISS index
    - Query history (cascaded by DB)
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFound("Document")

    if doc.user_id != current_user.id and current_user.role != "admin":
        raise Forbidden("You do not have access to this document.")

    # Clean up external resources
    s3_service.delete_file(doc.s3_key)
    vector_service.delete_index(document_id)

    # Delete from database (cascades to query_history)
    db.delete(doc)
    db.commit()

    return None
