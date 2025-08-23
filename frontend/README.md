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

## Testing
```bash
npm run test       # run tests in watch mode
npm run test:ci    # run tests once with coverage
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

## Implemented (Phase 3)
- Task List view fetching from `GET /api/tasks` with loading/empty/error states
- Toast notifications for success/error using existing toaster
- Detailed validation error messages surfaced from backend
- Frontend unit and integration tests (Vitest + React Testing Library)
- Frontend CI workflow on push/PR to run tests

## Notes
- Backend API is in ../backend (port 3001 by default).
- Ensure `VITE_API_URL` points to your backend.
- Validation mirrors rules in the root README.
