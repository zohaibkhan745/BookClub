# Book Club

A full-stack web app for sharing and borrowing books, built with FastAPI (backend) and React + Vite (frontend).

---

## Prerequisites

- Node.js (v18+ recommended)
- Python 3.10+
- PostgreSQL database (Supabase recommended)

---

## 1. Backend Setup (FastAPI)

1. **Create and activate a virtual environment:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
# or
source venv/bin/activate  # On macOS/Linux
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**

- Copy `.env.example` to `.env` and fill in your Supabase/Postgres credentials.

```bash
cp .env.example .env
# Edit .env with your database and Supabase info
```

4. **Run the backend server:**

```bash
uvicorn app.main:app --reload --port 8000
```

## 2. Frontend Setup (React + Vite)

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

- The app will be available at http://localhost:5173

---

## 3. Usage

- Open http://localhost:5173 in your browser for the frontend.
- The backend runs at http://localhost:8000
- Make sure both servers are running for full functionality.

---

## 4. API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 5. Project Structure

```
Book Club/
├── backend/      # FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── frontend/     # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md     # This file
```

---

## 6. Environment Variables

- See `backend/.env.example` for required backend variables.
- Frontend does not require special env vars for local dev.

---

## 7. Deployment

- Deploy backend (FastAPI) to services like Render, Railway, or Azure.
- Deploy frontend (Vite) to Vercel, Netlify, or similar.
- Set environment variables/secrets as needed for production.

---

## 8. License

MIT
