# Contributing to BookClub

Thank you for taking the time to contribute! 🎉  
All types of contributions are welcome — bug reports, feature requests, documentation improvements, and code changes.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting a Pull Request](#submitting-a-pull-request)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Message Guidelines](#commit-message-guidelines)

---

## Code of Conduct

By participating in this project you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please be respectful and constructive.

---

## Getting Started

1. **Fork** the repository and **clone** your fork.
2. Follow the [local development instructions](./README.md#-local-development) in the main README to get the project running.
3. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

---

## How to Contribute

### Reporting Bugs

If you find a bug, please [open an issue](https://github.com/zohaibkhan745/BookClub/issues/new?template=bug_report.md) and include:

- A clear, descriptive title
- Steps to reproduce the problem
- Expected vs. actual behavior
- Screenshots or error messages if applicable
- Your environment (OS, browser, Node/Python version)

### Suggesting Features

Have an idea? [Open a feature request issue](https://github.com/zohaibkhan745/BookClub/issues/new?template=feature_request.md) with:

- A clear description of the feature and the problem it solves
- Any relevant mockups, designs, or examples

### Submitting a Pull Request

1. Make sure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Keep your changes focused — one feature or fix per PR.
3. Write clear, descriptive commit messages (see below).
4. Make sure the frontend builds without errors:
   ```bash
   cd frontend && npm run build
   ```
5. Open a pull request against `main` using the provided PR template, filling in all relevant sections.
6. Be responsive to review feedback.

---

## Development Setup

Refer to the [README](./README.md#-local-development) for the full setup guide.

**Quick reference:**

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in Supabase credentials
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Code Style

### Frontend (TypeScript / React)

- Use **TypeScript** for all new files.
- Follow the existing component conventions (functional components, Tailwind CSS utility classes).
- Keep components small and single-responsibility.
- Run the Vite build (`npm run build`) to catch type errors before committing.

### Backend (Python / FastAPI)

- Follow [PEP 8](https://pep8.org/) style guidelines.
- Use type hints and Pydantic schemas for all new endpoints.
- Keep route handlers thin — move business logic into `app/services/`.
- Add docstrings to new functions and endpoints.

---

## Commit Message Guidelines

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**

```
feat(frontend): add genre filter to library page
fix(backend): handle missing book ID in borrow endpoint
docs: update environment variable table in README
```

---

Thank you for helping make BookClub better! 📚
