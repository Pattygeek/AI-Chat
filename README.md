# AI Chat Monorepo

AI chat application built with Node.js/Express backend and Next.js frontend.

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Install all dependencies (root + workspaces)
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Development
```bash
# Run both backend and frontend
npm run dev

# Backend will start on http://localhost:3001
# Frontend will start on http://localhost:3000
```

### Project Structure
```
├── backend/          # Express API server
│   ├── src/
│   │   └── index.js  # Main server
│   └── package.json
├── frontend/         # Next.js app
│   ├── app/          # App Router
│   └── package.json
└── package.json      # Root workspace config
```

## Available Scripts

From the root directory:
- `npm run dev` - Start both servers in development mode
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend
- `npm run build` - Build both workspaces

## API Endpoints

### Backend (port 3001)
- `GET /api/health` - Health check
- `POST /api/chat` - Send chat message

## Environment Variables

### Backend (.env)
```
PORT=3001
# Add AI API keys as needed
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
