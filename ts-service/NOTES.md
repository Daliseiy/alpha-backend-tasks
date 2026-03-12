# TalentFlow Candidate Intake + Summary Service

This service implements the **Candidate Document Intake + Summary Workflow** for the TalentFlow backend assessment.

It allows recruiters to:

1. Upload candidate documents (resume, cover letter, etc.)
2. Request an AI-generated candidate summary
3. Process summarization asynchronously via a queue/worker
4. Retrieve generated summaries through the API

The implementation focuses on **clean architecture, modular design, async processing, and testability**.

---

# Architecture Overview

The service follows a layered NestJS architecture.

```
API Layer
│
├── CandidateDocumentsController
├── CandidateSummariesController
└── InternalQueueController
      │
      ▼
Service Layer
│
├── CandidateDocumentsService
├── CandidateSummariesService
└── CandidateSummaryQueueRunnerService
      │
      ▼
Worker Layer
│
└── CandidateSummariesWorker
      │
      ▼
Provider Abstraction
│
└── SummarizationProvider
        ├── GeminiSummarizationProvider
        └── FakeSummarizationProvider (tests)
```

Key design principles:

* **Asynchronous processing** for LLM calls
* **Provider abstraction** for AI services
* **Workspace-scoped access control**
* **Clean modular architecture**
* **Deterministic automated tests**

---

# Technology Stack

* **NestJS**
* **TypeORM**
* **PostgreSQL**
* **Docker**
* **Google Gemini API**
* **Swagger / OpenAPI**
* **Jest**

---

# Async Queue Workflow

Summary generation happens asynchronously.

```
Client
   │
   │ POST /summaries/generate
   ▼
Create pending summary record
   │
   ▼
Enqueue job
   │
   ▼
Worker processes job
   │
   ▼
LLM generates summary
   │
   ▼
Summary updated (completed / failed)
```

This ensures the API remains responsive even when LLM calls are slow.

---

# Prerequisites

* Node.js **22+**
* npm
* Docker

Start PostgreSQL from the repository root:

```bash
docker compose up -d postgres
```

---

# Installation

```bash
cd ts-service
npm install
cp .env.example .env
```

---

# Environment Variables

Required variables:

```
PORT
DATABASE_URL
NODE_ENV
GEMINI_API_KEY
```

Example:

```
PORT=3000
DATABASE_URL=postgres://assessment_user:assessment_pass@localhost:5432/assessment_db
NODE_ENV=development
GEMINI_API_KEY=your_gemini_key_here
```

A Gemini API key can be created through **Google AI Studio**.

Secrets should never be committed.

---

# Run Migrations

```bash
npm run migration:run
```

---

# Seed Demo Data

A seed script is included to create demo records for quick testing.

Run:

```bash
npm run seed
```

This creates:

```
workspaceId: ws_demo_1
candidateId: cand_demo_1
```

These records allow the reviewer to immediately test the API without creating new data.

---

# Run the Service

```bash
npm run start:dev
```

---

# Swagger API Documentation

Swagger UI is available at:

```
http://localhost:3000/docs
```

All endpoints require these headers:

```
x-user-id: user_demo_1
x-workspace-id: ws_demo_1
```

These simulate authentication via the provided **FakeAuthGuard**.

---

# Quick Demo Flow

After running migrations and the seed script:

```
npm run migration:run
npm run seed
npm run start:dev
```

Open Swagger:

```
http://localhost:3000/docs
```

Test the system in this order:

### 1 Upload Candidate Document

```
POST /candidates/{candidateId}/documents
```

Example payload:

```json
{
  "documentType": "resume",
  "fileName": "john-doe-resume.txt",
  "rawText": "John Doe is a senior backend engineer with experience in NestJS, PostgreSQL, and distributed systems."
}
```

---

### 2 Request Summary Generation

```
POST /candidates/{candidateId}/summaries/generate
```

Payload:

```json
{
  "promptVersion": "v1"
}
```

Response:

```
status = pending
```

---

### 3 Run Queue Worker

```
POST /internal/queue/run
```

Example response:

```json
{
  "processedCount": 1
}
```

---

### 4 List Candidate Summaries

```
GET /candidates/{candidateId}/summaries
```

Example response:

```json
[
  {
    "status": "completed",
    "score": 78,
    "strengths": ["Strong backend engineering experience"],
    "concerns": ["Limited leadership examples"],
    "recommendedDecision": "advance"
  }
]
```

---

### 5 Retrieve a Single Summary

```
GET /candidates/{candidateId}/summaries/{summaryId}
```

---

# LLM Provider

The application interacts with LLMs through a provider interface.

```
SummarizationProvider
```

Implementations:

* **GeminiSummarizationProvider** – real LLM integration
* **FakeSummarizationProvider** – deterministic provider used for tests

Expected structured output:

```
score
strengths
concerns
summary
recommendedDecision
```

Possible decisions:

```
advance
hold
reject
```

---

# Testing Strategy

Automated tests verify:

* document ingestion
* summary request orchestration
* worker processing
* full API pipeline

External LLM calls are **not used in tests**.

Instead the test suite overrides the provider with:

```
FakeSummarizationProvider
```

This ensures tests are deterministic and independent of external APIs.

Run tests:

```bash
npm test
npm run test:e2e
```

The test suite includes:

* document service tests
* summary orchestration tests
* worker processing tests
* full pipeline end-to-end test

---

# Project Structure

```
src
│
├── auth
│
├── common
│   ├── enums
│   └── swagger
│
├── entities
│
├── candidate-documents
│
├── candidate-summaries
│   ├── controllers
│   ├── services
│   └── workers
│
├── queue
│
├── llm
│
├── internal
│
└── migrations
```

---

# Design Decisions

### Asynchronous processing

LLM summarization is computationally expensive and external, so it runs in a worker instead of the request lifecycle.

### Provider abstraction

The `SummarizationProvider` interface decouples the application from a specific LLM vendor.

### Workspace isolation

All candidate access is scoped by workspace to enforce multi-tenant boundaries.

### Storage abstraction

`LocalDocumentStorageService` separates file storage from business logic and allows easy replacement with cloud storage later.

---

# Notes

The queue implementation is intentionally simple and **in-memory** for this assessment.

In production this could be replaced with:

* Redis + BullMQ
* RabbitMQ
* Kafka

---

# Result

This implementation demonstrates:

* modular NestJS architecture
* database migrations
* async job processing
* worker-based AI integration
* structured LLM output validation
* workspace-scoped access control
* deterministic automated tests
