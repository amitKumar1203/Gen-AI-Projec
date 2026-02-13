# Gen-AI-Project

A full-stack **Generative AI** application — multi-model AI chat and resume analyzer with authentication.

- **Frontend:** Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend:** Node.js (Express.js, REST API)

---

## Features

- **Multi-model AI chat** — Llama, Mixtral, Gemma (Groq), GPT-4 / GPT-3.5 (OpenAI)
- **Resume analyzer** — Upload PDF/DOC/TXT, get AI feedback for a target job role
- **Auth** — Register, login, forgot/reset password, JWT
- **Conversations** — Save, list, and switch between chat threads
- **Admin panel** — User list and resume feedback overview

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, React Markdown |
| Backend  | **Node.js**, Express.js, Sequelize, JWT, bcrypt, Multer, Groq SDK, OpenAI SDK |

---

## Prerequisites

- Node.js (v18+)
- npm or yarn
- MySQL (optional; falls back to in-memory storage if not configured)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/amitKumar1203/Gen-AI-Projec.git
cd Gen-AI-Projec
npm install
cd backend && npm install && cd ..
```

### 2. Environment variables

Copy `.env.example` to `.env` in the project root and in `backend/`. Set:

**Root (frontend):**  
No required vars if the backend runs at `http://localhost:5000`.

**Backend (`backend/.env`):**

- `PORT=5000`
- `JWT_SECRET` — secret for JWT signing
- `GROQ_API_KEY` — [Groq](https://console.groq.com/) (for Llama, Mixtral, Gemma)
- `OPENAI_API_KEY` — [OpenAI](https://platform.openai.com/) (for GPT-4, GPT-3.5)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL (optional)
- Email (e.g. Nodemailer) for welcome/reset emails (optional)

### 3. Run

**Terminal 1 — Backend (Node.js):**

```bash
cd backend
npm run dev
```

API: `http://localhost:5000`

**Terminal 2 — Frontend:**

```bash
npm run dev
```

App: `http://localhost:3000`

---

## API (Node.js backend)

| Route prefix | Description |
|--------------|-------------|
| `POST /api/auth/register` | Register |
| `POST /api/auth/login` | Login |
| `GET /api/chat/models` | List AI models |
| `POST /api/chat` | Send message, get AI response |
| `GET /api/chat/conversations` | List conversations |
| `POST /api/resume/analyze` | Upload resume, get AI feedback |
| `GET /api/admin/*` | Admin-only routes |

---

## License

MIT
