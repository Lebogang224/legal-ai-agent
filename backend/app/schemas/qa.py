from datetime import datetime

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    document_id: str
    question: str = Field(min_length=5, max_length=1000)


class SourceChunk(BaseModel):
    page: int
    content: str
    relevance_score: float


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    response_time_ms: int
    from_cache: bool


class QueryHistoryItem(BaseModel):
    id: str
    question: str
    answer: str
    sources: list | None = None
    response_time_ms: int | None
    from_cache: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QueryHistoryResponse(BaseModel):
    queries: list[QueryHistoryItem]
    total: int
    page: int
    limit: int
