# Book Club Backend (FastAPI)

FastAPI-powered REST API backend for the **BookClub** community platform.

---

## Features

- **Book Catalog & Discovery**: Cursor-based pagination, category filtering, search, and homepage section curation with in-memory caching.
- **Transactional Borrow System**: Borrow request, owner approval, book returns, due date tracking, and collateral-based anti-cheat checks.
- **Credit & Reputation System**: Automatic credit minting upon book uploads, frozen credit accounting for active loans, and dynamic community badge rankings.
- **Community Forum**: Thread creation, threaded replies, and automated cache invalidation.
- **Media Uploads**: Presigned PUT upload URLs with thumbnail generation and Cloudflare R2 object storage.
- **Resilient Database Connectivity**: Serverless-aware connection pooling (`NullPool` for serverless, `QueuePool` for containers/VMs).

---

## Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **ORM & Database**: SQLAlchemy 2.x with PostgreSQL (Supabase-hosted) / SQLite (testing)
- **Validation**: Pydantic v2 & Pydantic Settings
- **Authentication**: Supabase JWT verification (supports ES256 via JWKS and HS256)
- **Storage**: Cloudflare R2 via `boto3`
- **Testing**: `pytest`, `pytest-cov`, `httpx`

---

## Setup & Local Development

### 1. Virtual Environment

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Configure your `.env` with your PostgreSQL database URL, Supabase keys, and optional R2 credentials:

```ini
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_ANON_KEY=your-anon-key
ADMIN_SECRET_KEY=your-secret-admin-key
```

### 4. Run the API Server

```bash
uvicorn app.main:app --reload --port 8000
```

- API Base: http://localhost:8000
- Swagger UI Documentation: http://localhost:8000/docs
- ReDoc Documentation: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

### 5. Run Automated Tests

```bash
python -m pytest -v
```

---

## Key API Endpoints

| Category | Method | Endpoint | Description | Auth |
| :--- | :---: | :--- | :--- | :---: |
| **System** | `GET` | `/health` | Service health status | Public |
| **System** | `GET` | `/cache/stats` | In-memory cache hit rate and capacity | Public |
| **Books** | `GET` | `/api/v1/books` | Homepage curated sections | Public |
| **Books** | `GET` | `/api/v1/books/all` | Paginated catalog (`cursor`, `limit`) | Public |
| **Books** | `GET` | `/api/v1/books/{id}` | Book details with borrow status | Public |
| **Books** | `POST` | `/api/v1/books` | Create a new book listing | Required |
| **Books** | `DELETE` | `/api/v1/books/{id}` | Delete book with collateral check | Owner |
| **Library**| `GET` | `/api/v1/user/library` | User's uploaded & borrowed books | Required |
| **Borrow** | `POST` | `/api/v1/borrow/request` | Submit borrow request | Required |
| **Borrow** | `POST` | `/api/v1/borrow/approve/{id}`| Owner approves borrow request | Owner |
| **Borrow** | `POST` | `/api/v1/borrow/return` | Return borrowed book | Required |
| **Users** | `GET` | `/api/v1/users/me` | Current authenticated profile | Required |
| **Users** | `GET` | `/api/v1/users/me/stats` | User activity, credits & badges | Required |
| **Users** | `GET` | `/api/v1/users/leaderboard` | Top users by credits | Public |
| **Forum** | `GET` | `/api/v1/forum/threads` | List discussion topics | Public |
| **Forum** | `POST` | `/api/v1/forum/threads` | Create discussion thread | Required |
| **Storage**| `POST` | `/api/v1/storage/upload-url` | Generate presigned R2 upload URLs | Required |
