from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    page_count: int | None
    chunk_count: int | None
    status: str
    error_message: str | None = None
    uploaded_at: datetime
    processed_at: datetime | None = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
    page: int
    limit: int
