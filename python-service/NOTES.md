# System Architecture

The service follows a **layered architecture** separating concerns between API handling, business logic, persistence, and rendering.

```
Client
   │
   ▼
FastAPI Routes (API Layer)
   │
   ▼
Service Layer (Business Logic)
   │
   ▼
ORM Models / Database
   │
   ▼
Template Rendering Layer (HTML Report)
```

### Responsibilities

**API Layer**

* Handles HTTP requests
* Validates inputs via Pydantic
* Delegates logic to services
* Formats responses

**Service Layer**

* Core business logic
* Database interactions
* Report generation orchestration

**Models**

* SQLAlchemy ORM entities
* Database schema representation

**Schemas**

* Request / response validation
* Serialization for API output

**Templates**

* HTML rendering using Jinja
* Presentation layer separated from business logic

---

# Request Lifecycle

Example flow for generating a report.

### 1️⃣ Create Briefing

```
POST /briefings
```

Flow:

```
Request JSON
   ↓
Pydantic validation
   ↓
BriefingService.create_briefing()
   ↓
Database persistence
   ↓
Return briefing ID
```

---

### 2️⃣ Generate HTML Report

```
POST /briefings/{id}/generate
```

Flow:

```
Route
   ↓
BriefingService.generate_report()
   ↓
Fetch briefing + relations
   ↓
Build template-safe view object
   ↓
Render Jinja template
   ↓
Store generated HTML
```

---

### 3️⃣ Retrieve HTML

```
GET /briefings/{id}/html
```

Flow:

```
Database lookup
   ↓
Return stored HTML response
```

---

# Data Model Overview

The system stores briefing information across three tables.

```
Briefings
   │
   ├── BriefingPoints
   │      (key points + risks)
   │
   └── BriefingMetrics
```

### Why this design?

**Normalization**

Points and metrics are stored separately to avoid:

* large JSON blobs
* repeated structures

**Flexibility**

Future enhancements may include:

* tagging points
* adding categories
* supporting additional metric types

---

# Performance Considerations

Although the system is small, the architecture supports scaling.

### HTML caching

Generated reports are stored in the database to avoid regenerating them on every request.

```
generate → store HTML → serve HTML
```

This avoids expensive template rendering.

---

### Database efficiency

Queries fetch related entities via relationships rather than multiple manual queries.

Example:

```
briefing
   ├ points
   └ metrics
```

This avoids N+1 query problems.

---

# Error Handling Strategy

The application uses **global exception handlers** to ensure consistent error responses.

Handled error types:

* `HTTPException`
* validation errors
* database errors
* unexpected runtime errors

Example response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Briefing not found",
    "code": 404
  }
}
```

Benefits:

* predictable API responses
* cleaner route handlers
* centralized logging

---

# Security Considerations

If deployed in production, the following would be added:

### Authentication

Analyst authentication via:

```
JWT
OAuth
```

---

### Input validation

Pydantic already validates:

* required fields
* type safety
* schema structure

---

### SQL injection protection

Using SQLAlchemy ORM ensures queries are parameterized.

---

# Testing Strategy

The test suite uses **pytest with FastAPI TestClient**.

Tests cover:

* briefing creation
* briefing retrieval
* report generation
* HTML rendering
* error scenarios

Example test flow:

```
Create briefing
   ↓
Generate report
   ↓
Retrieve HTML
   ↓
Validate output
```

This ensures **end-to-end functionality** works as expected.

---

# Observability (Future Improvement)

For production readiness, the following would be added:

### Structured logging

Using:

```
structlog
```

---

### Metrics

Expose metrics for:

* request latency
* error rates
* report generation time

---

### Tracing

Distributed tracing via:

```
OpenTelemetry
```

---

# Potential Future Extensions

The architecture allows easy extension for additional features.

### Export reports as PDF

```
HTML → PDF generation
```

Libraries:

```
WeasyPrint
wkhtmltopdf
```

---

### AI-assisted summaries

Automatically generate analyst summaries using an LLM.

---

### Briefing version history

Track revisions of analyst reports.

---

### Report sharing

Secure report URLs for external stakeholders.

---

# Final Notes

This project emphasizes:

* clear separation of concerns
* maintainable architecture
* predictable API responses
* strong test coverage
* extensibility for future features