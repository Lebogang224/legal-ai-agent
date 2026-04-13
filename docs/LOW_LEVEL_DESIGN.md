# Legal AI Agent — Low-Level Design Document

**Project:** Legal Document Q&A Agent
**Author:** Lebogang Mphaga
**Date:** 2026-04-13
**Version:** 1.0

---

## 1. Project Structure

```
legal-ai-agent/
├── docs/
│   ├── HIGH_LEVEL_DESIGN.md
│   ├── LOW_LEVEL_DESIGN.md
│   └── MOCKUPS.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Environment config (pydantic-settings)
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py             # User ORM model
│   │   │   └── document.py         # Document ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Auth request/response schemas
│   │   │   ├── document.py         # Document schemas
│   │   │   └── qa.py               # Q&A schemas
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # /api/auth/* endpoints
│   │   │   ├── documents.py        # /api/documents/* endpoints
│   │   │   ├── qa.py               # /api/qa/* endpoints
│   │   │   └── health.py           # /api/health endpoint
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py     # JWT creation, password hashing
│   │   │   ├── s3_service.py       # AWS S3 upload/download
│   │   │   ├── ingestion_service.py# PDF loading, chunking, embedding
│   │   │   ├── vector_service.py   # FAISS index management
│   │   │   ├── qa_service.py       # LangChain RetrievalQA chain
│   │   │   └── cache_service.py    # Redis get/set operations
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   └── auth_middleware.py  # JWT dependency injection
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── exceptions.py       # Custom HTTP exceptions
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_documents.py
│   │   └── test_qa.py
│   ├── alembic/                    # Database migrations
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js                  # API client with token refresh
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Documents.jsx
│       │   └── Chat.jsx
│       └── components/
│           ├── Sidebar.jsx
│           ├── FileUpload.jsx
│           ├── ChatMessage.jsx
│           └── SourceCard.jsx
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions pipeline
├── render.yaml                     # Render deployment blueprint
├── .gitignore
└── README.md
```

---

## 2. Database Schema

### 2.1 Users Table

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login credential |
| name | VARCHAR(255) | NOT NULL | Display name |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| role | VARCHAR(20) | CHECK (user/admin) | Access control |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete |
| created_at | TIMESTAMP | DEFAULT NOW() | Audit |
| updated_at | TIMESTAMP | DEFAULT NOW() | Audit |

### 2.2 Documents Table

```sql
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        VARCHAR(500) NOT NULL,
    s3_key          VARCHAR(1000) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    page_count      INTEGER,
    chunk_count     INTEGER,
    faiss_index_path VARCHAR(1000),
    status          VARCHAR(20) DEFAULT 'processing'
                    CHECK (status IN ('processing', 'ready', 'failed')),
    error_message   TEXT,
    uploaded_at     TIMESTAMP DEFAULT NOW(),
    processed_at    TIMESTAMP
);
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK | Unique document identifier |
| user_id | UUID | FK → users | Document owner |
| filename | VARCHAR(500) | NOT NULL | Original filename |
| s3_key | VARCHAR(1000) | NOT NULL | AWS S3 object key |
| file_size_bytes | INTEGER | NOT NULL | File size for validation |
| page_count | INTEGER | Nullable | Extracted after processing |
| chunk_count | INTEGER | Nullable | Number of text chunks created |
| faiss_index_path | VARCHAR(1000) | Nullable | Path to persisted FAISS index |
| status | VARCHAR(20) | CHECK constraint | Processing pipeline state |
| error_message | TEXT | Nullable | Failure reason if status=failed |
| uploaded_at | TIMESTAMP | DEFAULT NOW() | Upload time |
| processed_at | TIMESTAMP | Nullable | Processing completion time |

### 2.3 Query History Table

```sql
CREATE TABLE query_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    sources         JSONB,
    response_time_ms INTEGER,
    from_cache      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Unique query identifier |
| user_id | UUID | Who asked |
| document_id | UUID | Which document was queried |
| question | TEXT | The user's question |
| answer | TEXT | The LLM's response |
| sources | JSONB | Array of source chunks with page numbers |
| response_time_ms | INTEGER | Performance tracking |
| from_cache | BOOLEAN | Whether answer came from Redis cache |
| created_at | TIMESTAMP | When the query was made |

---

## 3. API Endpoint Specifications

### 3.1 Health Check

```
GET /api/health
```

**Auth:** None

**Response 200:**
```json
{
    "status": "healthy",
    "version": "1.0.0",
    "services": {
        "database": "connected",
        "redis": "connected",
        "s3": "connected"
    }
}
```

---

### 3.2 Authentication Endpoints

#### POST /api/auth/register

**Auth:** None (open registration) or Admin-only (configurable)

**Request Body:**
```json
{
    "email": "user@example.com",
    "name": "Lebogang Mphaga",
    "password": "securePassword123"
}
```

**Validation:**
- email: valid email format, unique
- name: 2-100 characters
- password: minimum 8 characters

**Response 201:**
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "name": "Lebogang Mphaga",
    "role": "user",
    "created_at": "2026-04-13T00:00:00Z"
}
```

**Errors:**
- 409: Email already registered
- 422: Validation error

---

#### POST /api/auth/login

**Auth:** None

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securePassword123"
}
```

**Response 200:**
```json
{
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Lebogang Mphaga",
        "role": "user"
    }
}
```

**Errors:**
- 401: Invalid credentials
- 403: Account deactivated
- 429: Too many failed attempts (5 per 5 minutes)

---

#### POST /api/auth/refresh

**Auth:** Refresh token in Authorization header

**Response 200:**
```json
{
    "access_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800
}
```

**Errors:**
- 401: Invalid or expired refresh token

---

#### GET /api/auth/me

**Auth:** Access token required

**Response 200:**
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "name": "Lebogang Mphaga",
    "role": "user",
    "created_at": "2026-04-13T00:00:00Z"
}
```

---

### 3.3 Document Endpoints

#### POST /api/documents/upload

**Auth:** Access token required

**Request:** `multipart/form-data`
- `file`: PDF file (max 50MB)

**Processing Pipeline (async):**
1. Validate file type (application/pdf) and size
2. Upload to S3 → get s3_key
3. Create document record (status: "processing")
4. Return 202 immediately
5. Background task:
   - Load PDF via LangChain PyPDFLoader
   - Split into chunks (1000 chars, 200 overlap)
   - Generate embeddings
   - Create FAISS index, persist to disk
   - Update document record (status: "ready", chunk_count, page_count)

**Response 202:**
```json
{
    "id": "uuid",
    "filename": "contract.pdf",
    "status": "processing",
    "message": "Document is being processed. Poll GET /api/documents/{id} for status."
}
```

**Errors:**
- 400: Invalid file type (not PDF)
- 413: File too large (> 50MB)
- 422: Empty file

---

#### GET /api/documents

**Auth:** Access token required

**Query Params:**
- `status` (optional): filter by processing status
- `page` (optional, default 1): pagination
- `limit` (optional, default 20, max 100): items per page

**Response 200:**
```json
{
    "documents": [
        {
            "id": "uuid",
            "filename": "contract.pdf",
            "file_size_bytes": 2048576,
            "page_count": 24,
            "chunk_count": 87,
            "status": "ready",
            "uploaded_at": "2026-04-13T10:00:00Z"
        }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
}
```

---

#### GET /api/documents/{document_id}

**Auth:** Access token required (owner or admin)

**Response 200:**
```json
{
    "id": "uuid",
    "filename": "contract.pdf",
    "file_size_bytes": 2048576,
    "page_count": 24,
    "chunk_count": 87,
    "status": "ready",
    "uploaded_at": "2026-04-13T10:00:00Z",
    "processed_at": "2026-04-13T10:00:15Z"
}
```

**Errors:**
- 404: Document not found
- 403: Not the owner and not admin

---

#### DELETE /api/documents/{document_id}

**Auth:** Access token required (owner or admin)

**Side effects:**
- Delete from S3
- Delete FAISS index from disk
- Delete query history for this document
- Invalidate Redis cache entries for this document

**Response 204:** No content

**Errors:**
- 404: Document not found
- 403: Not the owner and not admin

---

### 3.4 Q&A Endpoints

#### POST /api/qa/ask

**Auth:** Access token required

**Request Body:**
```json
{
    "document_id": "uuid",
    "question": "What are the termination clauses in this contract?"
}
```

**Validation:**
- document_id: must exist, status must be "ready", user must be owner or admin
- question: 5-1000 characters

**Processing Flow:**
1. Check Redis cache: `hash(document_id + question)`
2. If cache HIT → return cached answer (from_cache: true)
3. If cache MISS:
   a. Load FAISS index for document
   b. Similarity search → top 5 relevant chunks
   c. Build LangChain RetrievalQA prompt with chunks as context
   d. Call LLM (Claude API)
   e. Parse response + extract source references
   f. Cache result in Redis (TTL: 1 hour)
   g. Save to query_history table

**Response 200:**
```json
{
    "answer": "The contract contains three termination clauses: (1) Termination for convenience with 30 days written notice (Section 8.1), (2) Termination for cause upon material breach with 15-day cure period (Section 8.2), and (3) Immediate termination upon insolvency (Section 8.3).",
    "sources": [
        {
            "page": 12,
            "content": "Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice...",
            "relevance_score": 0.94
        },
        {
            "page": 13,
            "content": "In the event of a material breach by either party, the non-breaching party may terminate...",
            "relevance_score": 0.91
        },
        {
            "page": 14,
            "content": "This Agreement shall terminate immediately upon the insolvency...",
            "relevance_score": 0.87
        }
    ],
    "response_time_ms": 2340,
    "from_cache": false
}
```

**Errors:**
- 404: Document not found
- 400: Document still processing (status != "ready")
- 422: Question too short/long
- 503: LLM service unavailable

---

#### GET /api/qa/history/{document_id}

**Auth:** Access token required (owner or admin)

**Query Params:**
- `page` (optional, default 1)
- `limit` (optional, default 20, max 100)

**Response 200:**
```json
{
    "queries": [
        {
            "id": "uuid",
            "question": "What are the termination clauses?",
            "answer": "The contract contains three termination clauses...",
            "sources": [...],
            "response_time_ms": 2340,
            "from_cache": false,
            "created_at": "2026-04-13T10:05:00Z"
        }
    ],
    "total": 12,
    "page": 1,
    "limit": 20
}
```

---

## 4. Service Layer Details

### 4.1 Ingestion Service

```python
class IngestionService:
    """Handles PDF → chunks → embeddings → FAISS index pipeline"""

    def process_document(document_id: UUID) -> None:
        """
        Background task triggered after upload.

        Steps:
        1. Download PDF from S3 to temp file
        2. Load with PyPDFLoader → list of Document objects (one per page)
        3. Split with RecursiveCharacterTextSplitter:
           - chunk_size: 1000 characters
           - chunk_overlap: 200 characters
           - separators: ["\n\n", "\n", ". ", " ", ""]
        4. Generate embeddings via embedding model
        5. Create FAISS index from embeddings
        6. Persist FAISS index to disk: ./data/faiss/{document_id}/
        7. Update document record: status="ready", chunk_count, page_count
        8. Clean up temp file

        On failure:
        - Update document record: status="failed", error_message
        - Log full traceback
        """
```

**Chunking Strategy:**
- **chunk_size=1000:** Balances context richness with retrieval precision
- **chunk_overlap=200:** Prevents information loss at chunk boundaries
- **Metadata preserved:** Each chunk retains source page number

### 4.2 Vector Service

```python
class VectorService:
    """Manages FAISS index operations"""

    def create_index(chunks: list[Document]) -> FAISS:
        """Create new FAISS index from document chunks"""

    def load_index(document_id: UUID) -> FAISS:
        """Load persisted FAISS index from disk"""

    def similarity_search(index: FAISS, query: str, k: int = 5) -> list[Document]:
        """Return top-k most relevant chunks for a query"""

    def delete_index(document_id: UUID) -> None:
        """Remove persisted FAISS index from disk"""
```

**Index Storage:**
- Path pattern: `./data/faiss/{document_id}/index.faiss` + `index.pkl`
- One index per document (isolation, easy deletion)

### 4.3 QA Service

```python
class QAService:
    """Orchestrates the question-answering pipeline"""

    def ask(document_id: UUID, question: str) -> QAResponse:
        """
        Full Q&A pipeline:
        1. Check cache → return if hit
        2. Load FAISS index for document
        3. Build RetrievalQA chain:
           - retriever: FAISS with k=5
           - chain_type: "stuff" (all chunks into single prompt)
           - llm: Claude (via langchain-anthropic)
           - prompt: Custom legal QA prompt template
        4. Invoke chain with question
        5. Parse response into answer + sources
        6. Cache result
        7. Log to query_history
        """
```

**LangChain Prompt Template:**
```
You are a legal document analyst. Answer the question based ONLY on the
provided context. If the context does not contain enough information to
answer the question, say "I cannot find sufficient information in this
document to answer that question."

Always cite the specific section or page where you found the information.

Context:
{context}

Question: {question}

Answer:
```

### 4.4 Cache Service

```python
class CacheService:
    """Redis caching for Q&A responses"""

    KEY_PREFIX = "legal_qa:"
    DEFAULT_TTL = 3600  # 1 hour

    def _make_key(document_id: UUID, question: str) -> str:
        """Generate cache key: legal_qa:{hash(doc_id + normalized_question)}"""

    def get(document_id: UUID, question: str) -> Optional[dict]:
        """Check cache for existing answer"""

    def set(document_id: UUID, question: str, response: dict) -> None:
        """Cache answer with TTL"""

    def invalidate_document(document_id: UUID) -> None:
        """Delete all cached answers for a document (on document delete)"""
```

**Cache Key Strategy:**
- Normalize question: lowercase, strip whitespace
- Hash: SHA256(document_id + normalized_question)
- Prefix: `legal_qa:` for namespace isolation

### 4.5 S3 Service

```python
class S3Service:
    """AWS S3 operations for PDF storage"""

    def upload(file: UploadFile, user_id: UUID) -> str:
        """
        Upload PDF to S3.
        Key pattern: documents/{user_id}/{uuid}_{filename}
        Returns: s3_key
        """

    def download_to_temp(s3_key: str) -> str:
        """Download file to temp directory, return temp file path"""

    def delete(s3_key: str) -> None:
        """Delete file from S3"""

    def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
        """Generate temporary download URL"""
```

### 4.6 Auth Service

```python
class AuthService:
    """JWT token management and password operations"""

    ACCESS_TOKEN_EXPIRE = timedelta(minutes=30)
    REFRESH_TOKEN_EXPIRE = timedelta(days=7)

    def hash_password(password: str) -> str:
        """bcrypt hash with salt"""

    def verify_password(plain: str, hashed: str) -> bool:
        """Verify password against hash"""

    def create_access_token(user_id: UUID, role: str) -> str:
        """JWT with sub=user_id, role=role, exp=30min"""

    def create_refresh_token(user_id: UUID) -> str:
        """JWT with sub=user_id, exp=7days, type=refresh"""

    def decode_token(token: str) -> dict:
        """Decode and validate JWT, raise 401 if invalid/expired"""
```

---

## 5. Middleware & Dependencies

### 5.1 Auth Dependency (FastAPI Depends)

```python
async def get_current_user(
    authorization: str = Header(...)
) -> User:
    """
    Extract and validate JWT from Authorization header.
    Returns User ORM object.
    Raises 401 if token invalid/expired.
    Raises 403 if user deactivated.
    """

async def require_admin(
    user: User = Depends(get_current_user)
) -> User:
    """Raises 403 if user.role != 'admin'"""
```

### 5.2 Rate Limiting

```python
# In-memory rate limiter (login endpoint only)
# Keyed by IP + email
# Max 5 attempts per 5-minute window
# Returns 429 with Retry-After header
```

---

## 6. Error Response Format

All errors follow a consistent structure:

```json
{
    "detail": {
        "code": "DOCUMENT_NOT_FOUND",
        "message": "No document found with the given ID.",
        "field": null
    }
}
```

**Error Codes:**

| Code | HTTP Status | When |
|------|-------------|------|
| VALIDATION_ERROR | 422 | Pydantic validation failure |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| TOKEN_EXPIRED | 401 | JWT expired |
| TOKEN_INVALID | 401 | Malformed JWT |
| ACCOUNT_DEACTIVATED | 403 | User is_active = false |
| FORBIDDEN | 403 | Insufficient role |
| NOT_FOUND | 404 | Resource doesn't exist |
| DUPLICATE_EMAIL | 409 | Email already registered |
| FILE_TOO_LARGE | 413 | PDF > 50MB |
| INVALID_FILE_TYPE | 400 | Not a PDF |
| DOCUMENT_PROCESSING | 400 | Document not ready for Q&A |
| RATE_LIMITED | 429 | Too many login attempts |
| LLM_UNAVAILABLE | 503 | LLM API down or timeout |
| S3_ERROR | 502 | S3 upload/download failure |

---

## 7. Sequence Diagrams

### 7.1 Document Upload Sequence

```
User        Frontend       FastAPI        S3         Ingestion      FAISS       DB
 |              |              |           |             |             |          |
 |--upload PDF->|              |           |             |             |          |
 |              |--POST /api/--|           |             |             |          |
 |              |  documents/  |           |             |             |          |
 |              |  upload      |           |             |             |          |
 |              |              |--upload-->|             |             |          |
 |              |              |<--s3_key--|             |             |          |
 |              |              |--INSERT doc (status:processing)----->|          |
 |              |              |--start background task->|             |          |
 |              |<--202--------|           |             |             |          |
 |<--"processing"|             |           |             |             |          |
 |              |              |           |<--download--|             |          |
 |              |              |           |--pdf------->|             |          |
 |              |              |           |             |--load PDF   |          |
 |              |              |           |             |--split chunks          |
 |              |              |           |             |--embed------>          |
 |              |              |           |             |--create index>         |
 |              |              |           |             |--persist---->          |
 |              |              |           |             |--UPDATE doc (status:ready)-->|
 |              |              |           |             |             |          |
 |--poll status>|              |           |             |             |          |
 |              |--GET /api/---|           |             |             |          |
 |              |  documents/id|           |             |             |          |
 |              |<--200 ready--|           |             |             |          |
 |<--"ready"----|              |           |             |             |          |
```

### 7.2 Question-Answer Sequence

```
User        Frontend       FastAPI       Redis        FAISS         LLM        DB
 |              |              |            |            |            |          |
 |--ask-------->|              |            |            |            |          |
 |              |--POST /api/--|            |            |            |          |
 |              |  qa/ask      |            |            |            |          |
 |              |              |--check---->|            |            |          |
 |              |              |<--MISS-----|            |            |          |
 |              |              |--search---------------->|            |          |
 |              |              |<--top 5 chunks----------|            |          |
 |              |              |--prompt + chunks------------------->|          |
 |              |              |<--answer-----------------------------|          |
 |              |              |--cache---->|            |            |          |
 |              |              |--INSERT query_history--------------->|          |
 |              |<--200 answer-|            |            |            |          |
 |<--display----|              |            |            |            |          |
```

### 7.3 Authentication Sequence

```
User        Frontend       FastAPI       DB
 |              |              |           |
 |--login------>|              |           |
 |              |--POST /api/--|           |
 |              |  auth/login  |           |
 |              |              |--SELECT-->|
 |              |              |<--user----|
 |              |              |--verify password
 |              |              |--create access_token (30 min)
 |              |              |--create refresh_token (7 days)
 |              |<--200 tokens-|           |
 |<--store------|              |           |
 |              |              |           |
 |  ... 30 min later ...       |           |
 |              |              |           |
 |--request---->|              |           |
 |              |--GET /api/*--|           |
 |              |  (expired)   |           |
 |              |<--401--------|           |
 |              |--POST /api/--|           |
 |              |  auth/refresh|           |
 |              |<--new token--|           |
 |              |--retry GET---|           |
 |              |<--200--------|           |
 |<--data-------|              |           |
```

---

## 8. Configuration

### 8.1 Environment Variables

```env
# Application
APP_ENV=development                    # development | staging | production
APP_PORT=8000
APP_HOST=0.0.0.0
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/legal_ai

# JWT
JWT_SECRET_KEY=your-secret-key-here    # 48+ bytes, auto-generated in production
JWT_ALGORITHM=HS256

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=af-south-1
S3_BUCKET_NAME=legal-ai-documents

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM
ANTHROPIC_API_KEY=your-api-key
LLM_MODEL=claude-sonnet-4-6
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.1                   # Low temperature for factual legal answers

# Ingestion
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
FAISS_INDEX_DIR=./data/faiss

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOGIN_WINDOW_SECONDS=300
```

### 8.2 Pydantic Settings Class

```python
class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "af-south-1"
    s3_bucket_name: str
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str
    llm_model: str = "claude-sonnet-4-6"
    llm_max_tokens: int = 2048
    llm_temperature: float = 0.1
    chunk_size: int = 1000
    chunk_overlap: int = 200
    faiss_index_dir: str = "./data/faiss"

    class Config:
        env_file = ".env"
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (pytest)

| Test File | What it covers |
|-----------|---------------|
| test_auth.py | Registration, login, token refresh, invalid credentials, rate limiting |
| test_documents.py | Upload validation (type, size), document CRUD, status transitions |
| test_qa.py | Question validation, cache hit/miss, source extraction, error handling |

### 9.2 Test Dependencies

- **Database:** SQLite in-memory for test isolation
- **S3:** Mocked via `moto` library
- **Redis:** `fakeredis` library
- **LLM:** Mocked responses (deterministic)

### 9.3 Test Commands

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific module
pytest tests/test_qa.py -v
```

---

## 10. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/tests/ -v --cov=app

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## 11. Dependencies (requirements.txt)

```
# Web Framework
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9

# Database
sqlalchemy==2.0.35
alembic==1.13.0
psycopg2-binary==2.9.9

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# AI / LangChain
langchain==0.3.0
langchain-anthropic==0.3.0
langchain-community==0.3.0
faiss-cpu==1.8.0

# AWS
boto3==1.35.0

# Redis
redis==5.1.0

# PDF Processing
pypdf==4.3.0

# Utilities
pydantic-settings==2.5.0
python-dotenv==1.0.1

# Testing
pytest==8.3.0
pytest-cov==5.0.0
pytest-asyncio==0.24.0
httpx==0.27.0
moto[s3]==5.0.0
fakeredis==2.25.0
```

---

*Next document: [Mockup Document](./MOCKUPS.md)*
