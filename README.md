# 📚 BookClub

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> A full-stack community platform for sharing, borrowing, and discovering books — built with FastAPI and React + Vite.

BookClub started at GIKI, where students had great books sitting on shelves while others were searching for the same titles. The goal: connect readers simply, without fees or complexity.

**Live demo:** [book-club.social](https://book-club.social) · [book-club-giki.vercel.app](https://book-club-giki.vercel.app)

---

## ✨ Features

- 📖 **Browse & Search** — Discover books by title, author, or genre
- 🔄 **Borrow / Lend / Sell** — List your books or request ones you need
- 🏠 **Home Feed** — Trending, new arrivals, and popular sections
- 🧑‍🤝‍🧑 **Community Forum** — Discuss books and topics with other readers
- 🏆 **Leaderboard** — See the most active members
- 👤 **User Profiles** — Manage your listings and activity
- 🌙 **Dark Mode** — Full light/dark theme support
- 📱 **Mobile-Friendly** — Responsive design with a dedicated mobile bottom nav
- ⚡ **Fast API** — Caching, GZip compression, and Supabase-backed auth

---

## 🛠 Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS v4             |
| Backend    | FastAPI (Python 3.10+), SQLAlchemy, Pydantic            |
| Database   | PostgreSQL (Supabase-hosted)                            |
| Auth       | Supabase JWT                                            |
| Deployment | Frontend → Vercel · Backend → Render                    |
| Other      | SWR (data fetching), Lucide React icons, Radix UI       |

---

## 🗂 Project Structure

```
BookClub/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # Route handlers (books, borrow, users, forum, subscribers)
│   │   ├── auth/          # Supabase JWT authentication
│   │   ├── db/            # Database setup & seed data
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic layer
│   │   ├── cache.py       # In-memory caching
│   │   ├── config.py      # App configuration
│   │   └── main.py        # FastAPI app entry point
│   ├── alembic/           # Database migrations
│   ├── .env.example       # Environment variable template
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # Backend-specific docs
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── services/      # API client functions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── types/         # TypeScript type definitions
│   │   └── lib/           # Utility functions
│   ├── .env.example       # Frontend environment template
│   └── package.json       # Node dependencies & scripts
├── docs/
│   └── api.md             # Full API contract documentation
└── README.md              # This file
```

---

## 🚀 Local Development

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **PostgreSQL** database — [Supabase](https://supabase.com/) (free tier works great)

---

### 1 · Backend Setup (FastAPI)

```bash
# 1. Move into the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Open .env and fill in your Supabase credentials (see below)

# 5. Run the development server
uvicorn app.main:app --reload --port 8000
```

Backend is now running at **http://localhost:8000**

*(Optional)* Seed the database with sample data:

```bash
python -m app.db.seed
```

---

### 2 · Frontend Setup (React + Vite)

```bash
# From the repo root
cd frontend

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Frontend is now running at **http://localhost:5173**

> Make sure the backend is also running for full functionality.

---

### 3 · Frontend npm scripts

| Script          | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`   | Start the Vite dev server           |
| `npm run build` | Build the production bundle         |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable            | Description                                     | Required |
| ------------------- | ----------------------------------------------- | -------- |
| `DATABASE_URL`      | Supabase PostgreSQL connection string           | ✅        |
| `SUPABASE_URL`      | Your Supabase project URL                       | ✅        |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase → Settings → API     | ✅        |
| `ENV`               | `development` or `production`                   | ✅        |
| `FRONTEND_URL`      | Production frontend URL (added to CORS origins) | optional |

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-here
ENV=development
```

### Frontend

The frontend reads its API base URL from Vite's built-in env handling. For local development no additional configuration is needed; the default backend URL (`http://localhost:8000`) is used automatically.

---

## 📡 API Documentation

Once the backend is running, interactive docs are available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Full API contract:** [`docs/api.md`](./docs/api.md)

Key endpoints:

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/health`              | Health check                 |
| GET    | `/api/v1/books`        | Get books (by section)       |
| GET    | `/api/v1/books/{id}`   | Get a single book            |
| POST   | `/api/v1/books`        | Create a book listing        |
| POST   | `/api/v1/borrow`       | Submit a borrow request      |

---

## ☁️ Deployment

| Service     | Platform  | Notes                                              |
| ----------- | --------- | -------------------------------------------------- |
| Frontend    | Vercel    | Auto-deploys on push to `main`                    |
| Backend     | Render    | Uses `render.yaml` in `backend/`                  |

Set the required environment variables in each platform's dashboard before deploying.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

---

## 🏷️ Recommended Repository Topics

Add these topics to the repository via **GitHub → Settings → Topics** to improve discoverability:

`react` `fastapi` `python` `typescript` `full-stack` `book-club` `supabase` `postgresql` `vite` `tailwindcss` `community` `student-project`

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
