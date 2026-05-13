# FranquiYA

Operational management dashboard for a local franchise-style business, built as a practical full-stack product experiment.

## Overview

FranquiYA is a business operations tool focused on organizing day-to-day store workflows such as stock control, invoices, shifts, employees, tasks, cash movements and internal audits.

The project was built with AI-assisted development and manual review, with the goal of turning real operational problems into a usable internal dashboard.

## Main features

- Dashboard with operational KPIs
- Stock alerts and inventory views
- Invoice upload and processing flow
- Mobile-first stock audit interface
- Employee, role and shift management
- Holiday and task tracking
- Cash register and sales-related modules
- Authentication flow with user roles
- Backend API with modular routers and schemas
- Frontend tests for utility behavior

## Tech stack

| Area | Tools |
|---|---|
| Frontend | Next.js 14, React, TypeScript |
| UI | Tailwind CSS, Radix UI, shadcn-style components, Lucide icons |
| Charts | Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite for local development |
| File processing | pdfplumber, xlsx |
| AI integration | Groq API for assisted parsing/chat flows |
| Testing | Jest, Testing Library, pytest |
| Deploy | Vercel-ready frontend, Render-ready backend config |

## Repository structure

```text
FranquiYA/
├── README.md
├── franquiYA/
│   ├── backend/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── requirements.txt
│   └── frontend/
│       ├── src/app/
│       ├── src/components/
│       ├── src/lib/
│       ├── __tests__/
│       └── package.json
└── .gitignore
```

## Local development

### Backend

```bash
cd franquiYA/backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd franquiYA/frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

Backend URL:

```text
http://localhost:8000
```

## Environment variables

Backend integrations are optional for local testing:

```bash
GROQ_API_KEY=
OPENWEATHERMAP_API_KEY=
CORS_ORIGINS=http://localhost:3000
```

## What this project demonstrates

- Translating business operations into software modules
- Building a multi-page dashboard with Next.js App Router
- Structuring a FastAPI backend with routers, schemas and models
- Working with inventory, invoices, shifts, employees and audit flows
- Using AI tools responsibly as part of the development workflow
- Iterating from a real-world operational context into a usable prototype

## AI-assisted development note

This project was built with AI assistance for planning, code generation, refactoring and documentation. I reviewed the structure, adapted the flows to the use case, tested behavior and made product decisions around the operational needs.

## Status

Portfolio project / internal operations prototype.

Some files in this repository are reference materials used during development. They are not required to run the application.