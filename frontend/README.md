# Frontend

Vite + React + TypeScript + Tailwind CSS frontend for Task Manager App.

## Requirements
- Node.js 18+
- npm 9+

## Setup
```bash
cd frontend
npm ci
cp .env.example .env
# Default backend in this repo runs at http://localhost:3001
# Update VITE_API_URL in .env if your backend runs elsewhere
```

## Development
```bash
npm run dev
```
Dev server: http://localhost:5173

## Build
```bash
npm run typecheck
npm run build
```

## Configuration
Set the backend API URL:
```
VITE_API_URL=http://localhost:3001
```

## Implemented (Phase 2)
- Add Task form: title (required), description (optional), priority (optional; default medium)
- Client-side validation via react-hook-form + zod
- API integration to POST /api/tasks with success/error handling
- Clean minimal UI with Tailwind

## Notes
- Backend API is in ../backend (port 3001 by default).
- Validation mirrors rules in the root README.
