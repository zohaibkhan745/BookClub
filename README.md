# 📚 Book Club

A full-stack community platform for book lovers — discover books, share your collection, borrow from others, and discuss reads in a community forum.

Built with **FastAPI** (backend) and **React + Vite + TypeScript** (frontend), backed by **PostgreSQL via Supabase**.

---

## ✨ Features

- **Book Library** — Browse, search, and filter books by genre; view detailed book pages.
- **Upload & Share** — List your own books and make them available for the community to borrow.
- **Borrowing System** — Request to borrow books and track active borrow records.
- **Community Forum** — Create threads, reply to discussions, and engage with other readers.
- **User Profiles & Leaderboard** — Public profiles, reading stats, and a community leaderboard.
- **Authentication** — Secure JWT-based sign-up, login, and session management via Supabase.
- **Search** — Full-text search across books and community content.
- **Newsletter Subscribers** — Email subscription for community updates.
- **Response Caching** — In-memory cache with periodic cleanup for fast API responses.
- **Interactive API Docs** — Auto-generated Swagger UI and ReDoc documentation.

---

## 🛠 Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS, React Router, SWR   |
| Backend    | FastAPI, SQLAlchemy, Alembic, Pydantic, Passlib, python-jose  |
| Database   | PostgreSQL (Supabase)                                         |
| Storage    | Supabase Storage (book cover images)                          |
| Auth       | Supabase JWT / python-jose                                    |
| Deployment | Vercel (frontend) · Render / Railway (backend)                |

---

## 📁 Project Structure

```
BookClub/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/            # Route handlers (books, borrow, users, forum, subscribers)
│   │   ├── auth/           # JWT authentication helpers
│   │   ├── db/             # SQLAlchemy engine & session
│   │   ├── models/         # ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic layer
│   │   ├── cache.py        # In-memory response cache
│   │   ├── config.py       # Settings (env vars)
│   │   └── main.py         # App entry point, middleware, routers
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API client functions
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v18 or higher
- **Python** 3.10 or higher
- **PostgreSQL** database (a free [Supabase](https://supabase.com) project works great)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/zohaibkhan745/BookClub.git
cd BookClub
```

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase / PostgreSQL credentials
```

**Required environment variables** (see `backend/.env.example`):

| Variable              | Description                                 |
| --------------------- | ------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                |
| `SUPABASE_URL`        | Your Supabase project URL                   |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase project settings   |
| `ENV`                 | `development` or `production`               |

```bash
# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at **http://localhost:5173**.  
The backend API runs at **http://localhost:8000**.

---

## 📜 Available Scripts

### Frontend (`frontend/`)

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Vite development server    |
| `npm run build` | Build for production                 |

### Backend (`backend/`)

| Command                                      | Description                          |
| -------------------------------------------- | ------------------------------------ |
| `uvicorn app.main:app --reload --port 8000`  | Start the FastAPI development server |
| `alembic upgrade head`                       | Apply all pending migrations         |
| `alembic revision --autogenerate -m "<msg>"` | Generate a new migration             |

---

## 📖 API Documentation

Once the backend is running, interactive API docs are available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

---

## 🌐 Deployment

| Service    | Recommended Platform              |
| ---------- | --------------------------------- |
| Frontend   | Vercel, Netlify                   |
| Backend    | Render, Railway, Azure App Service|
| Database   | Supabase (managed PostgreSQL)     |

Set all required environment variables in your hosting provider's dashboard before deploying.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request against the `main` branch.

Please keep code style consistent with the existing codebase and ensure both frontend and backend still run correctly before submitting.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
