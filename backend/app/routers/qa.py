import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.query_history import QueryHistory
from app.schemas.qa import (
    AskRequest,
    AskResponse,
    SourceChunk,
    QueryHistoryItem,
    QueryHistoryResponse,
)
from app.services import qa_service
from app.middleware.auth_middleware import get_current_user
from app.utils.exceptions import NotFound, Forbidden, DocumentProcessing, LLMUnavailable

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/qa", tags=["Q&A"])


@router.post("/ask", response_model=AskResponse)
def ask_question(
    body: AskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ask a question about a document.
    The system retrieves relevant chunks from the document and uses an LLM to generate an answer.
    Responses are cached — repeated questions return instantly.
    """
    # Validate document exists and is ready
    doc = db.query(Document).filter(Document.id == body.document_id).first()
    if not doc:
        raise NotFound("Document")

    if doc.user_id != current_user.id and current_user.role != "admin":
        raise Forbidden("You do not have access to this document.")

    if doc.status != "ready":
        raise DocumentProcessing()

    # Run the Q&A pipeline
    try:
        result = qa_service.ask(body.document_id, body.question)
    except FileNotFoundError:
        raise NotFound("Document index")
    except Exception as e:
        logger.error(f"Q&A failed for document {body.document_id}: {e}")
        raise LLMUnavailable()

    # Save to query history
    history_entry = QueryHistory(
        user_id=current_user.id,
        document_id=body.document_id,
        question=body.question,
        answer=result["answer"],
        sources=result["sources"],
        response_time_ms=result["response_time_ms"],
        from_cache=result["from_cache"],
    )
    db.add(history_entry)
    db.commit()

    return AskResponse(
        answer=result["answer"],
        sources=[SourceChunk(**s) for s in result["sources"]],
        response_time_ms=result["response_time_ms"],
        from_cache=result["from_cache"],
    )


@router.get("/history/{document_id}", response_model=QueryHistoryResponse)
def get_query_history(
    document_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get query history for a specific document."""
    # Validate document access
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFound("Document")

    if doc.user_id != current_user.id and current_user.role != "admin":
        raise Forbidden("You do not have access to this document.")

    query = (
        db.query(QueryHistory)
        .filter(QueryHistory.document_id == document_id)
        .filter(QueryHistory.user_id == current_user.id)
    )

    total = query.count()
    queries = (
        query.order_by(QueryHistory.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return QueryHistoryResponse(
        queries=[QueryHistoryItem.model_validate(q) for q in queries],
        total=total,
        page=page,
        limit=limit,
    )
