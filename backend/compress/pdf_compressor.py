import fitz  # PyMuPDF
import os
import uuid
import io
import time
from PIL import Image

# Resolve backend base directory (this file is in backend/compress)
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(THIS_DIR)

def cleanup_old_files(folder_path, max_age_minutes=5):
    """Remove files older than max_age_minutes from the specified folder"""
    try:
        if not os.path.exists(folder_path):
            return

        current_time = time.time()
        max_age_seconds = max_age_minutes * 60  # Convert minutes to seconds

        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        print(f"Deleted old file: {filename}")
                    except Exception as e:
                        print(f"Could not delete {filename}: {e}")
    except Exception as e:
        print(f"Cleanup error: {e}")

def cleanup_all_temp_files():
    """Clean up all temporary files from PDF, image, and merged PDF folders"""
    try:
        # Use absolute paths under backend/app
        cleanup_old_files(os.path.join(BACKEND_DIR, "app", "compressed_pdfs"), max_age_minutes=5)
        cleanup_old_files(os.path.join(BACKEND_DIR, "app", "compressed_images"), max_age_minutes=5)
        cleanup_old_files(os.path.join(BACKEND_DIR, "app", "merged_pdfs"), max_age_minutes=5)

        print("Temporary file cleanup completed")
    except Exception as e:
        print(f"Cleanup error: {e}")

async def compress_pdf(uploaded_file, output_folder=None, compression_level="medium"):
    """Compress PDF files. Simple, safe defaults with robust fallbacks for image-heavy PDFs."""
    # Compute absolute output folder under backend/app/compressed_pdfs
    if output_folder is None:
        output_folder = os.path.join(BACKEND_DIR, "app", "compressed_pdfs")
    os.makedirs(output_folder, exist_ok=True)

    # Cleanup temp files opportunistically
    cleanup_all_temp_files()

    file_id = str(uuid.uuid4())
    output_filename = f"compressed_{file_id}.pdf"
    output_path = os.path.join(output_folder, output_filename)

    doc = None
    try:
        pdf_bytes = await uploaded_file.read()
        if not pdf_bytes:
            raise Exception("Uploaded file is empty or unreadable")
        original_size = len(pdf_bytes)

        # Settings description for UI
        level_desc = {
            "light": "Light compression - Basic optimization",
            "medium": "Medium compression - Balanced size/quality",
            "heavy": "Heavy compression - Smallest size",
        }

        # Open source PDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        has_update_image = hasattr(doc, "update_image")

        # Helpers
        def is_valid_pdf(data: bytes) -> bool:
            try:
                if not data:
                    return False
                return (data[:4] == b"%PDF") or (data.lstrip()[:4] == b"%PDF")
            except Exception:
                return False

        def render_ok(data: bytes) -> bool:
            try:
                tdoc = fitz.open(stream=data, filetype="pdf")
                if tdoc.page_count == 0:
                    return False
                for i in range(tdoc.page_count):
                    _ = tdoc[i].get_pixmap(matrix=fitz.Matrix(0.5, 0.5))
                tdoc.close()
                return True
            except Exception:
                return False

        def rasterize_pdf(src_doc: fitz.Document, dpi: int, jpeg_q: int) -> bytes:
            try:
                scale = dpi / 72.0
                mat = fitz.Matrix(scale, scale)
                out = fitz.open()
                for p in src_doc:
                    r = p.rect
                    pix = p.get_pixmap(matrix=mat, alpha=False)
                    mode = "RGB" if pix.n >= 3 else "L"
                    img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
                    b = io.BytesIO()
                    img.save(b, format="JPEG", quality=jpeg_q, subsampling=2, optimize=False)
                    jpeg_bytes = b.getvalue()
                    np = out.new_page(width=r.width, height=r.height)
                    np.insert_image(np.rect, stream=jpeg_bytes)
                data = out.tobytes(garbage=4, deflate=True, clean=True, deflate_images=False, deflate_fonts=True)
                out.close()
                return data
            except Exception:
                return b""

        # Strategy
        output_bytes = b""
        if has_update_image:
            # Safe in-place JPEG recompression; skip risky conversions; light content clean
            for page in doc:
                imgs = page.get_images(full=True)
                for img in imgs:
                    xref = img[0]
                    smask = img[1] if len(img) > 1 else 0
                    if smask:
                        continue
                    try:
                        info = doc.extract_image(xref)
                        data = info.get("image")
                        if not data:
                            continue
                        ext = (info.get("ext") or "").lower()
                        if ext not in ("jpg", "jpeg", "jpe", "jfif"):
                            continue
                        im = Image.open(io.BytesIO(data))
                        if im.mode not in ("RGB", "L"):
                            try:
                                im = im.convert("RGB")
                            except Exception:
                                continue
                        if compression_level == "light":
                            q, sub = 80, 1
                        elif compression_level == "medium":
                            q, sub = 60, 2
                        else:
                            q, sub = 40, 2
                        buf = io.BytesIO()
                        im.save(buf, format="JPEG", quality=q, subsampling=sub, optimize=False)
                        new_data = buf.getvalue()
                        if len(new_data) < len(data) * 0.98:
                            try:
                                doc.update_image(xref, stream=new_data, ext="jpeg")
                            except TypeError:
                                doc.update_image(xref, new_data)
                    except Exception:
                        continue
                if compression_level in ("medium", "heavy"):
                    try:
                        page.clean_contents()
                    except Exception:
                        pass

            output_bytes = doc.tobytes(
                garbage=4 if compression_level == "heavy" else 3,
                deflate=True,
                clean=True,
                deflate_images=False,
                deflate_fonts=True if compression_level in ("medium", "heavy") else False,
            )
        else:
            # Conventional, robust path when image object updates aren't supported
            if compression_level == "light":
                output_bytes = doc.tobytes(garbage=3, deflate=True, clean=True, deflate_images=False, deflate_fonts=False)
            else:
                dpi = 120 if compression_level == "medium" else 96
                q = 60 if compression_level == "medium" else 45
                output_bytes = rasterize_pdf(doc, dpi=dpi, jpeg_q=q)
                if not output_bytes:
                    output_bytes = doc.tobytes(garbage=3, deflate=True, clean=True, deflate_images=False, deflate_fonts=True)

        # Validate and possibly fallback
        if not is_valid_pdf(output_bytes) or not render_ok(output_bytes):
            # Last-resort rebuild from original
            try:
                src = fitz.open(stream=pdf_bytes, filetype="pdf")
                rebuilt = fitz.open()
                rebuilt.insert_pdf(src)
                output_bytes = rebuilt.tobytes()
                rebuilt.close()
                src.close()
            except Exception:
                output_bytes = pdf_bytes

        # If compression resulted in a larger file, keep the original instead
        used_original = False
        if len(output_bytes) >= original_size:
            print("Compressed PDF is not smaller than original — keeping original file bytes")
            output_bytes = pdf_bytes
            used_original = True

        # Persist to disk (log sizes for debugging)
        print(f"[DEBUG] original_size={original_size} bytes; intended_output_size={len(output_bytes)} bytes")
        with open(output_path, "wb") as f:
            f.write(output_bytes)

        # Post-write safety: ensure on-disk file is not larger than original
        try:
            written_size = os.path.getsize(output_path)
            print(f"[DEBUG] written_size_after_first_write={written_size} bytes")
            if written_size > original_size:
                print("[DEBUG] written file larger than original — overwriting with original bytes")
                # overwrite with original bytes
                with open(output_path, "wb") as f:
                    f.write(pdf_bytes)
                output_bytes = pdf_bytes
                used_original = True
                print(f"[DEBUG] overwritten_with_original; final_size={len(output_bytes)} bytes")
        except Exception as e:
            # If we can't stat or overwrite, keep the current output_bytes as-is
            print(f"[DEBUG] post-write safety check failed: {e}")

        # Verify written file
        try:
            with open(output_path, "rb") as f:
                head = f.read(8)
                if not (head.startswith(b"%PDF") or head.lstrip()[:4] == b"%PDF"):
                    raise Exception("Invalid PDF header after write")
        except Exception:
            with open(output_path, "wb") as f:
                f.write(pdf_bytes)
            output_bytes = pdf_bytes

        print(f"PDF pages: {doc.page_count}")
        print(f"PDF Compression: {round(original_size/1024,2)}KB -> {round(len(output_bytes)/1024,2)}KB ({compression_level} level)")

        # Final sizes (reflect what's on disk)
        final_compressed_size = len(output_bytes)
        return {
            "originalSize": original_size,
            "compressedSize": final_compressed_size,
            "path": output_path,
            "filename": output_filename,
            "compressionLevel": compression_level,
            "compressionDescription": level_desc.get(compression_level, "Compression"),
            "usedOriginal": used_original,
        }

    except Exception as e:
        print(f"PDF Compression Error: {e}")
        raise
    finally:
        try:
            if doc:
                doc.close()
        except Exception:
            pass