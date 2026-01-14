# Book Club Backend

FastAPI backend for the Book Club community platform.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database (Supabase-hosted)
- **Pydantic** - Data validation

## Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your Supabase credentials
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

### 4. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Seed database (optional)

```bash
python -m app.db.seed
```

## API Endpoints

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/health`            | Health check              |
| GET    | `/api/v1/books`      | Get all books by sections |
| GET    | `/api/v1/books/{id}` | Get book by ID            |
| POST   | `/api/v1/books`      | Create new book           |
| POST   | `/api/v1/borrow`     | Submit borrow request     |

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
