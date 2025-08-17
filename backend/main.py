from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from compress.pdf_compressor import compress_pdf
from compress.image_compressor import compress_image
from compress.pdf_merger import merge_pdfs
from compress.pdf_splitter import get_pdf_pages, split_pdf_pages
from compress.pdf_organizer import get_pdf_organization_preview, organize_pdf_pages
from typing import List
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "File Compressor API",
        "available_endpoints": {
            "compress_pdf": "/compress/pdf",
            "compress_image": "/compress/image",
            "merge_pdfs": "/merge/pdf",
            "split_pdf_preview": "/split/pdf/preview",
            "split_pdf_pages": "/split/pdf/pages",
            "organize_pdf_preview": "/organize/pdf/preview",
            "organize_pdf_pages": "/organize/pdf/pages",
            "download_pdf": "/download/pdf/{filename}",
            "download_image": "/download/image/{filename}",
            "download_merged": "/download/merged/{filename}",
            "download_split": "/download/split/{filename}",
            "download_organized": "/download/organized/{filename}"
        },
        "compression_levels": ["light", "medium", "heavy"]
    }

# PDF Compression Endpoint
@app.post("/compress/pdf")
async def compress_pdf_endpoint(file: UploadFile = File(...), compression_level: str = Form("medium")):
    valid_levels = ["light", "medium", "heavy"]
    if compression_level not in valid_levels:
        return JSONResponse(status_code=400, content={"error": f"Invalid compression level. Must be one of: {', '.join(valid_levels)}"})
    try:
        result = await compress_pdf(file, compression_level=compression_level)
        try:
            original_base = os.path.splitext(file.filename or "file")[0]
            display_name = f"chhotipdf-{os.path.basename(original_base).replace(' ', '_')}.pdf"
        except Exception:
            display_name = result["filename"]

        # Defensive clamp: if the written file on disk is larger than original, report original size and mark usedOriginal
        try:
            file_path = os.path.join(BASE_DIR, "app", "compressed_pdfs", result["filename"])
            if os.path.exists(file_path):
                on_disk = os.path.getsize(file_path)
                if on_disk > result["originalSize"]:
                    # Don't mutate stored file here (compressor may be updated later) but ensure API reports no negative reduction
                    result["compressedSize"] = result["originalSize"]
                    result["usedOriginal"] = True
        except Exception:
            pass

        return {
            "originalSize": result["originalSize"],
            "compressedSize": result["compressedSize"],
            "usedOriginal": result.get("usedOriginal", False),
            "url": f"/download/pdf/{result['filename']}",
            "fileName": display_name,
            "compressionLevel": result["compressionLevel"],
            "compressionDescription": result["compressionDescription"]
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# PDF Merge Endpoint
@app.post("/merge/pdf")
async def merge_pdf_endpoint(files: List[UploadFile] = File(...)):
    if len(files) < 2:
        return JSONResponse(status_code=400, content={"error": "At least 2 PDF files are required for merging"})
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(status_code=400, content={"error": f"File '{file.filename}' is not a PDF. Only PDF files can be merged."})
    try:
        result = await merge_pdfs(files)
        return {
            "originalSize": result["originalSize"],
            "mergedSize": result["mergedSize"],
            "url": f"/download/merged/{result['filename']}",
            "fileCount": result["fileCount"]
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Image Compression Endpoint
@app.post("/compress/image")
async def compress_image_endpoint(file: UploadFile = File(...), compression_level: str = Form("medium")):
    valid_levels = ["light", "medium", "heavy"]
    if compression_level not in valid_levels:
        return JSONResponse(status_code=400, content={"error": f"Invalid compression level. Must be one of: {', '.join(valid_levels)}"})
    try:
        result = compress_image(file, compression_level=compression_level)

        # Defensive clamp for images as well
        try:
            file_path = os.path.join(BASE_DIR, "app", "compressed_images", result["filename"])
            if os.path.exists(file_path):
                on_disk = os.path.getsize(file_path)
                if on_disk > result["originalSize"]:
                    result["compressedSize"] = result["originalSize"]
                    result["usedOriginal"] = True
        except Exception:
            pass

        return {
            "originalSize": result["originalSize"],
            "compressedSize": result["compressedSize"],
            "usedOriginal": result.get("usedOriginal", False),
            "url": f"/download/image/{result['filename']}",
            "fileName": result.get("display_filename", result["filename"]),
            "compressionLevel": result["compressionLevel"],
            "compressionDescription": result["compressionDescription"]
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/download/pdf/{filename}")
async def download_pdf(filename: str):
    path = os.path.join(BASE_DIR, "app", "compressed_pdfs", filename)
    if os.path.exists(path):
        return FileResponse(path=path, filename=filename, media_type="application/pdf")
    return JSONResponse(status_code=404, content={"error": "File not found"})

@app.get("/download/image/{filename}")
async def download_image(filename: str):
    path = os.path.join(BASE_DIR, "app", "compressed_images", filename)
    if os.path.exists(path):
        return FileResponse(path=path, filename=filename, media_type="image/jpeg")
    return JSONResponse(status_code=404, content={"error": "File not found"})

@app.get("/download/merged/{filename}")
async def download_merged_pdf(filename: str):
    path = os.path.join(BASE_DIR, "app", "merged_pdfs", filename)
    if os.path.exists(path):
        return FileResponse(path=path, filename=filename, media_type="application/pdf")
    return JSONResponse(status_code=404, content={"error": "File not found"})

# PDF Splitting endpoints
@app.post("/split/pdf/preview")
async def preview_pdf_pages(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(status_code=400, content={"error": "Please upload a PDF file"})
        result = await get_pdf_pages(file)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/split/pdf/pages")
async def split_pdf_by_pages(file: UploadFile = File(...), selected_pages: str = Form(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(status_code=400, content={"error": "Please upload a PDF file"})
        try:
            page_numbers = [int(page.strip()) for page in selected_pages.split(',') if page.strip()]
        except ValueError:
            return JSONResponse(status_code=400, content={"error": "Invalid page numbers format"})
        if not page_numbers:
            return JSONResponse(status_code=400, content={"error": "Please select at least one page"})
        result = await split_pdf_pages(file, page_numbers)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/download/split/{filename}")
async def download_split_pdf(filename: str):
    file_path = os.path.join(BASE_DIR, "app", "split_pdfs", filename)
    if os.path.exists(file_path):
        return FileResponse(path=file_path, filename=filename, media_type='application/pdf')
    return JSONResponse(status_code=404, content={"error": "File not found"})

# PDF Organization endpoints
@app.post("/organize/pdf/preview")
async def preview_pdf_for_organization(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(status_code=400, content={"error": "Please upload a PDF file"})
        result = await get_pdf_organization_preview(file)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/organize/pdf/pages")
async def organize_pdf_by_pages(
    file: UploadFile = File(..., description="PDF file to organize"),
    page_order: str = Form(..., description="JSON string of page order"),
    deleted_pages: str = Form(default="[]", description="JSON string of deleted pages")
):
    try:
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(status_code=400, content={"error": "Please upload a PDF file"})
        result = await organize_pdf_pages(file, page_order, deleted_pages)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Organization failed: {str(e)}"})

@app.get("/download/organized/{filename}")
async def download_organized_pdf(filename: str):
    file_path = os.path.join(BASE_DIR, "app", "organized_pdfs", filename)
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=f"organized_{filename}",
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename=organized_{filename}"}
        )
    return JSONResponse(status_code=404, content={"error": "File not found"})

# CORS Middleware
# Restrict CORS to known frontend origins (Vercel deployment and localhost for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chhotipdf.vercel.app", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Also expose the same endpoints under /api/* for reverse proxies
app.add_api_route("/api/", root, methods=["GET"])
app.add_api_route("/api/compress/pdf", compress_pdf_endpoint, methods=["POST"])
app.add_api_route("/api/compress/image", compress_image_endpoint, methods=["POST"])
app.add_api_route("/api/merge/pdf", merge_pdf_endpoint, methods=["POST"])
app.add_api_route("/api/split/pdf/preview", preview_pdf_pages, methods=["POST"])
app.add_api_route("/api/split/pdf/pages", split_pdf_by_pages, methods=["POST"])
app.add_api_route("/api/organize/pdf/preview", preview_pdf_for_organization, methods=["POST"])
app.add_api_route("/api/organize/pdf/pages", organize_pdf_by_pages, methods=["POST"])
app.add_api_route("/api/download/pdf/{filename}", download_pdf, methods=["GET"])
app.add_api_route("/api/download/image/{filename}", download_image, methods=["GET"])
app.add_api_route("/api/download/merged/{filename}", download_merged_pdf, methods=["GET"])
app.add_api_route("/api/download/split/{filename}", download_split_pdf, methods=["GET"])
app.add_api_route("/api/download/organized/{filename}", download_organized_pdf, methods=["GET"])