# Legal AI Agent

AI-powered legal document Q&A platform. Upload legal PDFs and ask natural language questions — the system retrieves relevant sections and generates grounded answers with source citations.

Built with **FastAPI**, **LangChain**, **FAISS**, **AWS S3**, **Redis**, and **React 18**.

## Architecture

```
React Frontend  →  FastAPI Backend  →  AWS S3 (PDF Storage)
                        │
                   LangChain Agent
                     │         │
              FAISS Vector    Claude LLM
              Store           (Anthropic)
                        │
                   Redis Cache
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| AI / Agents | LangChain, Claude (Anthropic), RetrievalQA |
| Vector Search | FAISS (semantic similarity search) |
| Cloud Storage | AWS S3 (boto3) |
| Caching | Redis |
| Auth | JWT (access + refresh tokens), bcrypt |
| Frontend | React 18, Vite, React Router |
| Database | PostgreSQL (prod) / SQLite (dev) |
| CI/CD | GitHub Actions |
| Deployment | Render |

## Features

- **Document ingestion pipeline** — PDF upload → text extraction → chunking → vector embeddings → FAISS index
- **Semantic Q&A** — ask questions in natural language, get answers grounded in document context
- **Source citations** — every answer includes page references with relevance scores
- **Response caching** — Redis caches repeated queries for instant responses
- **JWT authentication** — access + refresh tokens, role-based access (user/admin)
- **Rate limiting** — in-memory login attempt throttling
- **Background processing** — async document ingestion with status polling
- **15 API endpoints** — full REST API with auto-generated OpenAPI docs at `/docs`
- **Dark-theme UI** — responsive React frontend with drag-and-drop upload, chat interface, typing indicators

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get access + refresh tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user profile |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PDF (background processing) |
| GET | `/api/documents` | List documents (filterable, paginated) |
| GET | `/api/documents/{id}` | Get document details + status |
| DELETE | `/api/documents/{id}` | Delete document + cleanup |

### Q&A
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qa/ask` | Ask a question about a document |
| GET | `/api/qa/history/{id}` | Query history for a document |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (DB, Redis, S3 status) |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Redis (optional — falls back to in-memory cache)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API requests proxy to the backend automatically.

### API Docs
With the backend running, visit http://localhost:8000/docs for interactive Swagger documentation.

## Deployment

### Render (one-click)
1. Fork this repo
2. Create a new **Blueprint** on Render
3. Connect your repo — Render reads `render.yaml`
4. Set the `ANTHROPIC_API_KEY` environment variable
5. Deploy

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | Secret for JWT signing (auto-generated on Render) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `AWS_ACCESS_KEY_ID` | No | S3 access (falls back to local storage) |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret |
| `S3_BUCKET_NAME` | No | S3 bucket name |
| `REDIS_URL` | No | Redis connection (falls back to in-memory) |

## Project Structure

```
legal-ai-agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + SPA serving
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # SQLAlchemy engine
│   │   ├── models/              # User, Document, QueryHistory
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── routers/             # API endpoint handlers
│   │   ├── services/            # Business logic (S3, FAISS, QA, cache)
│   │   ├── middleware/          # JWT auth dependencies
│   │   └── utils/               # Custom exceptions
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routing + global styles
│   │   ├── api.js               # API client with token refresh
│   │   ├── pages/               # Login, Documents, Chat
│   │   └── components/          # Sidebar
│   └── package.json
├── docs/
│   ├── HIGH_LEVEL_DESIGN.md     # Architecture + component breakdown
│   ├── LOW_LEVEL_DESIGN.md      # API contracts, DB schema, sequences
│   └── MOCKUPS.md               # UI wireframes + design system
├── .github/workflows/ci.yml     # CI/CD pipeline
├── render.yaml                  # Render deployment blueprint
└── README.md
```

## License

MIT
