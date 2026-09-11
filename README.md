# BookClub — Modern Peer-to-Peer Book Sharing Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.109%2B-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance full-stack web application for discovering, borrowing, and lending physical books within communities, powered by **FastAPI**, **React 18**, **Supabase Auth**, and **Cloudflare R2**.

---

## Key Highlights & Architecture

- **Peer-to-Peer Book Lending**: Comprehensive borrowing workflow with borrow requests, owner approvals, return tracking, and due date management.
- **Fair Credit System**: Users earn credits by uploading books to the community library. Credits serve as collateral for active loans, preventing abuse with automated collateral bankruptcy guards.
- **High Performance & Zero N+1 Queries**: Batched data access patterns across user libraries and leaderboards; GZip compression; thread-safe bounded in-memory LRU cache (`SimpleCache`) with automatic background eviction.
- **Instant Search & Discovery**: Trigram-indexed category and keyword searches, cursor-based pagination, and responsive genre grids.
- **Direct Cloudflare R2 Uploads**: Presigned PUT URLs enable client-direct image uploads with client-side WebP compression and automated thumbnail generation.
- **Community Forum**: Threaded discussions for book discussions, reviews, and reading lists with automated cache invalidation.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS v4, SWR, Lucide Icons, Radix UI |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy 2.x, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL (Supabase-hosted) / SQLite (in-memory test suite) |
| **Authentication** | Supabase Auth (supports ES256 via JWKS and HS256 JWTs) |
| **Media Storage** | Cloudflare R2 object storage via presigned S3 URLs |
| **Testing** | Pytest, Pytest-Cov, Fast-API TestClient |

---

## Quickstart & Local Development

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- PostgreSQL database (Supabase recommended)

---

### 1. Backend Setup (FastAPI)

1. Navigate to `backend` and create a Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1
   
   # macOS / Linux
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your database URL, Supabase API credentials, and secret keys.*

4. Run the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - Swagger Documentation: http://localhost:8000/docs
   - ReDoc Documentation: http://localhost:8000/redoc
   - API Health Check: http://localhost:8000/health

5. Run automated backend tests:
   ```bash
   python -m pytest -v
   ```

---

### 2. Frontend Setup (React + Vite)

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   ```bash
   cp .env.example .env
   ```
   *Set `VITE_API_URL=http://localhost:8000` and configure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.*

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at http://localhost:3000 (or http://localhost:5173).

5. Test production build:
   ```bash
   npm run build
   ```

---

## Project Structure

```
Book Club/
├── backend/
│   ├── alembic/              # Database migration revisions
│   ├── app/
│   │   ├── api/              # API routers (books, borrow, users, forum, storage)
│   │   ├── auth/             # Supabase JWT verification & admin guards
│   │   ├── db/               # Database engine, session, and seeders
│   │   ├── models/           # SQLAlchemy models (Book, User, BorrowRecord, Forum)
│   │   ├── schemas/          # Pydantic v2 schemas and validation models
│   │   ├── services/         # Core business logic and database queries
│   │   ├── utils/            # Cloudflare R2 storage helpers & image processing
│   │   ├── cache.py          # Bounded in-memory LRU cache with TTL
│   │   ├── config.py         # Application settings via Pydantic Settings
│   │   └── main.py           # FastAPI entrypoint, lifespan, and CORS middleware
│   ├── tests/                # Automated pytest test suites (23+ tests)
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI elements, Navbar, Footer, Modals
│   │   ├── context/          # React contexts (AuthContext, ThemeContext)
│   │   ├── hooks/            # SWR hooks (useBooks, useLibrary, useBook)
│   │   ├── pages/            # Views (Home, BookDetail, Library, Community, etc.)
│   │   ├── services/         # API clients (api, bookService, userSyncService)
│   │   ├── types/            # TypeScript interfaces and response models
│   │   └── App.tsx           # Route layout and lazy component routing
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.ts        # Vite configuration and bundle code splitting
└── README.md                 # Project documentation
```

---

## Deployment

- **Backend**: Can be deployed to Render, Railway, Azure App Services, or AWS using the included `Procfile` and `render.yaml`.
- **Frontend**: Can be deployed to Vercel, Netlify, or Cloudflare Pages with zero configuration using the included `vercel.json`.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
