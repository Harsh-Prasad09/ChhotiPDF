# ChhotiPDF - Comprehensive PDF Management Tool

A comprehensive PDF management web application with compression, merging, splitting, and organizing capabilities.

## Features

- **PDF Compression**: Reduce PDF file size while maintaining quality
- **PDF Merging**: Combine multiple PDF files into one
- **PDF Splitting**: Extract specific pages from PDFs
- **PDF Organization**: Reorder and delete pages with drag-and-drop interface

## Project Structure

```
ChhotiPDF/
├── frontend/          # React + Vite frontend
├── backend/           # FastAPI backend
├── README.md
└── docker-compose.yml # For easy deployment
```

## Quick Start

### Development (Docker Compose)

```bash
# In project root
docker compose up
```

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:8000
- Frontend uses VITE_API_BASE_URL from `.env.development` (http://localhost:8000)

Alternatively run manually without Docker:

1) Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2) Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### Production (Docker Compose with Nginx)

Build and run the backend behind Nginx, and serve the built frontend:

```bash
# Build frontend image (multi-stage)
docker build -t chhotipdf-frontend:prod -f frontend/Dockerfile.prod ./frontend

# Start backend and Nginx reverse proxy (profile)
docker compose --profile production up -d --build
```

- Nginx serves the frontend at http://localhost
- API is proxied at http://localhost/api -> backend:8000
- Frontend `.env.production` uses `VITE_API_BASE_URL=/api`

## Technology Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **HTML5 Drag & Drop API** - For page reordering

### Backend
- **FastAPI** - Web framework
- **PyMuPDF (fitz)** - PDF processing
- **Python-multipart** - File upload handling
- **Uvicorn** - ASGI server

## API Endpoints

### PDF Compression
- `POST /compress/pdf` - Compress PDF file
- `GET /download/pdf/{filename}` - Download compressed PDF

### PDF Merging
- `POST /merge/pdf` - Merge multiple PDF files
- `GET /download/merged/{filename}` - Download merged PDF

### PDF Splitting
- `POST /split/pdf/preview` - Get PDF page previews
- `POST /split/pdf/pages` - Split PDF by selected pages
- `GET /download/split/{filename}` - Download split PDF

### PDF Organization
- `POST /organize/pdf/preview` - Get PDF pages for organization
- `POST /organize/pdf/pages` - Organize PDF pages
- `GET /download/organized/{filename}` - Download organized PDF

Notes:
- In production behind Nginx, all endpoints are also available under `/api/*` (e.g., `/api/compress/pdf`).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
