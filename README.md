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

 # ChhotiPDF

 Lightweight, local-first PDF utility: compression, merging, splitting, and page organization.

 This README focuses on local development (no frontend Docker). It provides clear steps for contributors and developers who fork this repository.

 ---

 ## Quick overview

 - Frontend: React + Vite (runs locally with `npm run dev`)
 - Backend: FastAPI (runs locally with Uvicorn)
 - Frontend is intentionally not run with Docker during development — use Node.js + Vite locally for fast iteration.

 ---

 ## Prerequisites

 - Node.js (v18+ recommended) and npm
 - Python 3.11+ and pip
 - Recommended (Windows PowerShell): run PowerShell as your terminal

 ---

 ## Local development (step-by-step)

 1) Clone the repo and enter the project folder

 ```powershell
 git clone https://github.com/Harsh-Prasad09/ChhotiPDF.git
 cd ChhotiPDF
 ```

 2) Backend (FastAPI)

 ```powershell
 cd backend
 python -m venv .venv    # optional but recommended
 .\.venv\Scripts\Activate.ps1
 pip install -r requirements.txt
 # Run the server (development mode)
 uvicorn main:app --reload --host 0.0.0.0 --port 8000
 ```

 - API will be available at: http://localhost:8000

 3) Frontend (React + Vite)

 ```powershell
 # Open a new terminal and run from project root
 cd frontend
 npm install
 # Start dev server
 npm run dev
 ```

 - Frontend dev server default: http://localhost:5173

 ---

 ## Frontend environment

 When running locally, ensure the frontend points to the backend via `frontend/.env.development`:

 ```text
 VITE_API_BASE_URL=http://localhost:8000
 ```

 ---

 ## API quick reference

 - POST `/compress/pdf` - compress a single PDF file
	 - form field: `file` (file), optional `compression_level` (light|medium|heavy)
	 - returns JSON: `{ originalSize, compressedSize, url, fileName, compressionLevel, compressionDescription, usedOriginal? }`
 - GET `/download/pdf/{filename}` - download compressed PDF

 - POST `/compress/image` - compress a single image file (jpg/png)
 - POST `/merge/pdf` - merge multiple PDFs (send multiple `files` fields)
 - POST `/split/pdf/preview` - preview pages
 - POST `/split/pdf/pages` - split using selected pages
 - POST `/organize/pdf/preview` - preview for organization
 - POST `/organize/pdf/pages` - apply page reorder/delete

 All endpoints are defined in `backend/main.py`.

 ---

 ## Compression behavior and safety

 - The backend includes fallbacks so compressed output will not be worse than the original. If compression would increase file size, the API returns `usedOriginal: true` and `compressedSize` will be set to the original size.
 - Server logs include debug messages for compression steps when running locally in development mode.

 ---

 ## Troubleshooting

 - 500 errors: check backend terminal logs for tracebacks.
 - CORS issues: when running frontend locally against local backend, ensure `VITE_API_BASE_URL` points to `http://localhost:8000` and backend CORS allows that origin (configured in `backend/main.py`).
 - If you see negative reductions in the UI, update both frontend and backend from this repository and restart the servers (defensive clamps are present to avoid negative reductions).

 ---

 ## Contributing

 1. Fork the repository
 2. Create a branch
 3. Make changes and run locally
 4. Open a pull request with a clear description of the change

 ---

 ## License

 MIT License — see the LICENSE file in the repository.

