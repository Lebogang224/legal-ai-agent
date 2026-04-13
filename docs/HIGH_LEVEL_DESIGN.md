# Legal AI Agent — High-Level Design Document

**Project:** Legal Document Q&A Agent
**Author:** Lebogang Mphaga
**Date:** 2026-04-13
**Version:** 1.0

---

## 1. Executive Summary

A legal AI agentic platform that enables users to upload legal documents (PDFs) and interact with them through natural language questions. The system ingests documents, creates searchable vector embeddings, and uses an LLM-powered retrieval agent to deliver accurate, context-grounded answers.

This project demonstrates production-grade engineering across:
- Python microservices (FastAPI)
- AI agent orchestration (LangChain)
- Cloud storage (AWS S3)
- Search and retrieval (FAISS vector store)
- Caching layer (Redis)
- JWT authentication
- CI/CD pipeline (GitHub Actions → Render)

---

## 2. Problem Statement

Legal professionals spend hours manually searching through contracts, case law, and regulatory documents to find specific clauses, obligations, or precedents. Current keyword search is brittle — it misses semantic meaning and requires exact phrasing.

**This platform solves that by:**
- Accepting any legal PDF and making it instantly queryable
- Understanding the *meaning* behind questions, not just keywords
- Returning grounded answers with source references (page/section)
- Providing a fast, secure, multi-user API

---

## 3. System Architecture

```
+-------------------+       +-------------------+       +------------------+
|                   |       |                   |       |                  |
|   React Frontend  | ----> |   FastAPI Backend  | ----> |   AWS S3         |
|   (Upload + Chat) |       |   (REST API)      |       |   (PDF Storage)  |
|                   |       |                   |       |                  |
+-------------------+       +--------+----------+       +------------------+
                                     |
                          +----------+----------+
                          |                     |
                 +--------v--------+   +--------v--------+
                 |                 |   |                  |
                 |  LangChain      |   |  Redis           |
                 |  Agent Layer    |   |  (Query Cache)   |
                 |                 |   |                  |
                 +--------+--------+   +------------------+
                          |
               +----------+----------+
               |                     |
      +--------v--------+  +--------v--------+
      |                 |  |                  |
      |  FAISS Vector   |  |  LLM Provider   |
      |  Store          |  |  (Claude/OpenAI) |
      |  (Embeddings)   |  |                  |
      +-----------------+  +------------------+
```

---

## 4. Component Breakdown

### 4.1 Frontend (React + Vite)
- **Purpose:** User interface for document upload and Q&A interaction
- **Key screens:** Login, Document Upload, Chat/Q&A, Document Library
- **Communication:** REST API calls to FastAPI backend via fetch

### 4.2 API Layer (FastAPI)
- **Purpose:** Central REST API handling all business logic
- **Why FastAPI:** Async support, automatic OpenAPI docs, type validation via Pydantic, high performance
- **Endpoints:** Auth, document management, Q&A queries, health checks
- **Auth:** JWT access + refresh tokens (flask-jwt-extended pattern, adapted for FastAPI)

### 4.3 Document Ingestion Pipeline (LangChain)
- **Purpose:** Transform raw PDFs into queryable knowledge
- **Flow:**
  1. PDF uploaded → stored in AWS S3
  2. LangChain `PyPDFLoader` extracts text
  3. `RecursiveCharacterTextSplitter` chunks the text (1000 chars, 200 overlap)
  4. Embedding model converts chunks to vectors
  5. Vectors stored in FAISS index (persisted to disk)

### 4.4 Retrieval Agent (LangChain RetrievalQA)
- **Purpose:** Answer user questions using document context
- **How it works:**
  1. User question → embedded into vector
  2. FAISS similarity search → top-k relevant chunks retrieved
  3. Chunks + question passed to LLM as context
  4. LLM generates grounded answer with source references
- **Agent framework:** LangChain `RetrievalQA` chain with `stuff` strategy
- **Guardrails:** Answer only from provided context, refuse if no relevant context found

### 4.5 Vector Store (FAISS)
- **Purpose:** Fast similarity search over document embeddings
- **Why FAISS:** Free, local, no external service needed, battle-tested (Meta)
- **Relation to Lucene:** Same category as Elasticsearch/Solr — search and retrieval — but optimized for vector/semantic search rather than keyword/inverted-index search

### 4.6 Cloud Storage (AWS S3)
- **Purpose:** Persistent storage for uploaded PDF files
- **Why S3:** Industry standard, cheap, scalable, integrates with everything
- **Access:** Via `boto3` SDK, presigned URLs for secure access

### 4.7 Cache Layer (Redis)
- **Purpose:** Cache repeated queries to avoid redundant LLM calls
- **Strategy:** Hash(document_id + question) → cached answer
- **TTL:** 1 hour default (configurable)
- **Why Redis:** Fast, simple, widely used in production microservices

### 4.8 Authentication (JWT)
- **Purpose:** Secure API access, multi-user support
- **Flow:** Login → access token (30 min) + refresh token (7 days)
- **Storage:** Frontend stores in localStorage
- **Role support:** Basic (user/admin) — extensible

---

## 5. Technology Stack

| Layer | Technology | JD Requirement |
|-------|-----------|----------------|
| Backend Framework | FastAPI (Python 3.11) | *"micro-services applications with FastAPI"* |
| AI Orchestration | LangChain | *"LLM clients libraries as LangChain"* |
| AI Agents | LangChain Agents, RetrievalQA | *"Generative AI, AI agents frameworks"* |
| LLM Provider | Claude API (Anthropic) | *"multi-model approach"* |
| Vector Search | FAISS | *"Lucene based search engines"* (semantic equivalent) |
| Cloud Storage | AWS S3 (boto3) | *"AWS Cloud (services: S3...)"* |
| Caching | Redis | *"NoSQL databases (Redis...)"* |
| Authentication | JWT (python-jose + passlib) | Production-grade security |
| Frontend | React 18 + Vite | Full-stack capability |
| CI/CD | GitHub Actions | *"CI/CD"* |
| Deployment | Render | *"deployment infrastructures"* |
| API Documentation | Auto-generated OpenAPI/Swagger | Best practice |

---

## 6. Data Flow

### 6.1 Document Upload Flow
```
User uploads PDF
  → Frontend sends multipart POST to /api/documents/upload
    → FastAPI validates file (type, size)
      → PDF stored in AWS S3 (returns S3 key)
        → LangChain loads PDF, splits into chunks
          → Chunks embedded via embedding model
            → FAISS index updated and persisted
              → Document metadata saved to database
                → 201 response with document_id
```

### 6.2 Question-Answer Flow
```
User asks question about a document
  → Frontend sends POST to /api/qa/ask
    → FastAPI validates JWT + request body
      → Check Redis cache (hash of doc_id + question)
        → HIT: return cached answer
        → MISS:
          → FAISS similarity search (top-5 chunks)
            → LangChain RetrievalQA chain invoked
              → LLM generates answer from chunks
                → Answer + sources cached in Redis
                  → 200 response with answer + source references
```

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time (cached) | < 200ms |
| Response time (uncached) | < 5s (LLM dependent) |
| Max PDF size | 50MB |
| Supported formats | PDF (extensible to DOCX, TXT) |
| Concurrent users | 50+ (async FastAPI) |
| Uptime | 99.5% (Render SLA) |
| Security | JWT auth, HTTPS, input validation, no PII logging |

---

## 8. Deployment Architecture

```
GitHub Repository
  → Push to main
    → GitHub Actions CI/CD
      → Run tests (pytest)
      → Build frontend (npm run build)
      → Deploy to Render
        → Render Web Service (FastAPI + static frontend)
        → Render Redis (managed)
        → AWS S3 (external, configured via env vars)
```

---

## 9. Future Extensibility

These are **not in scope** for v1 but demonstrate architectural thinking:

- **Multi-model support:** Swap LLM providers (Claude ↔ GPT ↔ Mistral) via LiteLLM — maps to JD's *"multi-model approach"*
- **Agent2Agent protocol:** Expose agent capabilities via A2A for cross-system orchestration
- **MCP integration:** Model Context Protocol for standardized tool/resource access
- **Elasticsearch migration:** Replace FAISS with Elasticsearch for production-scale search
- **AWS Lambda:** Serverless document processing pipeline
- **WebSocket:** Real-time streaming answers instead of request/response

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination | Wrong legal advice | Strict retrieval grounding — only answer from provided context |
| Large PDF processing time | Slow uploads | Async processing with status polling |
| API cost (LLM calls) | Budget overrun | Redis caching, rate limiting |
| S3 access from Render | Latency | Use same AWS region, presigned URLs |

---

*Next document: [Low-Level Design](./LOW_LEVEL_DESIGN.md)*
