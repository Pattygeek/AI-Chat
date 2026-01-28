# AI Chat Project - Copilot Instructions

## Project Overview
AI chat application built as a monorepo with Node.js/Express backend and Next.js frontend.

## Tech Stack
- **Backend** (`/backend`): Node.js, Express, CORS
- **Frontend** (`/frontend`): Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Monorepo**: npm workspaces with concurrently for parallel dev servers

## Architecture
```
AI-chat/
├── backend/          # Express API server
│   ├── src/
│   │   └── index.js  # Main server file with /api/health and /api/chat routes
│   └── package.json
├── frontend/         # Next.js app
│   ├── app/          # App Router pages and layouts
│   └── package.json
└── package.json      # Root workspace config
```

**Data Flow**: Frontend makes requests to backend API at `http://localhost:3001/api/*` → Backend processes and returns JSON responses

## Development Workflow

### Start Development
```bash
# From root - runs both servers concurrently
npm run dev

# Or individually:
npm run dev:backend   # Backend on :3001
npm run dev:frontend  # Frontend on :3000
```

### First-time Setup
```bash
npm install              # Install root dependencies
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Build
```bash
npm run build            # Build both workspaces
npm run build:backend    # No-op (Node.js runs directly)
npm run build:frontend   # Next.js production build
```

## Key Conventions
- **API Routes**: All backend routes prefixed with `/api`
- **Environment Variables**: Backend uses `.env`, frontend uses `.env.local`
- **Frontend API calls**: Use `NEXT_PUBLIC_API_URL` environment variable
- **App Router**: Frontend uses Next.js App Router (not Pages Router)
- **Workspaces**: Use `--workspace=<name>` or `-w <name>` for npm commands targeting specific packages

## Integration Points
- Backend listens on port 3001 (configurable via `PORT` env var)
- Frontend expects backend at `NEXT_PUBLIC_API_URL` (default: http://localhost:3001)
- CORS enabled on backend for frontend communication
