import fitz  # PyMuPDF
import os
import uuid
import time
import base64
from io import BytesIO
from .pdf_compressor import cleanup_all_temp_files

class PDFOrganizer:
    def __init__(self):
        pass
    
    def get_pdf_pages_for_organization(self, pdf_bytes):
        """Extract page previews with metadata for organization"""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages_data = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Create a matrix for scaling the page to thumbnail size
                mat = fitz.Matrix(0.6, 0.6)  # Scale to 60% for better preview quality
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PNG bytes
                img_data = pix.tobytes("png")
                
                # Convert to base64 for frontend display
                img_base64 = base64.b64encode(img_data).decode('utf-8')
                
                # Get page dimensions and text preview
                page_rect = page.rect
                text_preview = page.get_text()[:100] + "..." if len(page.get_text()) > 100 else page.get_text()
                
                pages_data.append({
                    'id': f"page_{page_num}_{uuid.uuid4().hex[:8]}",  # Unique ID for drag-drop
                    'page_number': page_num + 1,  # 1-indexed for user display
                    'original_index': page_num,   # 0-indexed original position
                    'preview_image': f"data:image/png;base64,{img_base64}",
                    'width': int(page_rect.width),
                    'height': int(page_rect.height),
                    'text_preview': text_preview.strip(),
                    'is_deleted': False
                })
            
            doc.close()
            return pages_data
            
        except Exception as e:
            raise Exception(f"Failed to generate page previews: {str(e)}")
    
    def organize_pdf_pages(self, pdf_bytes, page_order, deleted_pages=None):
        """Create a new PDF with pages in the specified order, excluding deleted pages.

        Accepts flexible inputs:
        - page_order: list of dicts with 'original_index' and optional 'id', or list of ints (1-indexed page numbers)
        - deleted_pages: list of ids OR list of ints (1-indexed page numbers)
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            new_doc = fitz.open()  # Create new empty PDF

            deleted_pages = deleted_pages or []

            # Normalize deleted pages to a set of comparable tokens
            deleted_id_set = set()
            deleted_num_set = set()
            for d in deleted_pages:
                if isinstance(d, int):
                    deleted_num_set.add(d)
                elif isinstance(d, str) and d.isdigit():
                    deleted_num_set.add(int(d))
                else:
                    deleted_id_set.add(d)

            # Process pages in the specified order
            for item in page_order:
                # Derive original index (0-indexed) and a stable id
                if isinstance(item, dict):
                    original_index = item.get('original_index')
                    page_number = item.get('page_number')
                    page_id = item.get('id') or (f"page_{page_number}" if page_number else None)
                    is_deleted_flag = bool(item.get('is_deleted', False))
                    if original_index is None and page_number is not None:
                        original_index = max(0, int(page_number) - 1)
                else:
                    # Treat as 1-indexed page number
                    page_number = int(item)
                    original_index = max(0, page_number - 1)
                    page_id = f"page_{page_number}"
                    is_deleted_flag = False

                # Skip deleted pages
                if is_deleted_flag:
                    continue
                if page_id and page_id in deleted_id_set:
                    continue
                if (page_number is not None) and (page_number in deleted_num_set):
                    continue

                # Validate page index
                if isinstance(original_index, int) and 0 <= original_index < len(doc):
                    new_doc.insert_pdf(doc, from_page=original_index, to_page=original_index)

            # Get the PDF bytes
            output_bytes = new_doc.write()

            doc.close()
            new_doc.close()

            return output_bytes

        except Exception as e:
            raise Exception(f"Failed to organize PDF: {str(e)}")

async def get_pdf_organization_preview(uploaded_file):
    """Get PDF page previews for organization"""
    try:
        pdf_bytes = await uploaded_file.read()
        organizer = PDFOrganizer()
        pages_data = organizer.get_pdf_pages_for_organization(pdf_bytes)
        
        return {
            'total_pages': len(pages_data),
            'pages': pages_data,
            'file_size': round(len(pdf_bytes) / 1024, 2),
            'filename': uploaded_file.filename
        }
        
    except Exception as e:
        raise Exception(f"Failed to process PDF for organization: {str(e)}")

async def organize_pdf_pages(uploaded_file, page_order_data, deleted_pages_data=None, output_folder="app/organized_pdfs"):
    """Organize PDF pages according to new order and deletions"""
    
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Auto-cleanup old files
    cleanup_all_temp_files()
    cleanup_old_files(output_folder, max_age_minutes=5)

    file_id = str(uuid.uuid4())
    output_filename = f"organized_{file_id}.pdf"
    output_path = os.path.join(output_folder, output_filename)
    
    try:
        pdf_bytes = await uploaded_file.read()
        original_size = len(pdf_bytes)  # bytes

        print(f"PDF size: {round(original_size/1024,2)}KB")  # Debug log

        # Initialize PDF organizer
        organizer = PDFOrganizer()

        # Parse page order and deleted pages
        import json
        print(f"Raw page_order_data: {page_order_data}")  # Debug log
        print(f"Raw deleted_pages_data: {deleted_pages_data}")  # Debug log

        # Parse inputs with robust fallbacks (JSON or CSV)
        try:
            # Parse page_order
            if isinstance(page_order_data, str):
                try:
                    print(f"Parsing page_order_data as JSON string: {page_order_data[:200]}...")
                    parsed_page_order = json.loads(page_order_data)
                except json.JSONDecodeError:
                    print("page_order_data is not valid JSON. Trying CSV fallback...")
                    parsed_page_order = [int(p.strip()) for p in page_order_data.split(',') if p.strip()]
            else:
                parsed_page_order = page_order_data

            # Parse deleted_pages
            if isinstance(deleted_pages_data, str) and deleted_pages_data:
                try:
                    print(f"Parsing deleted_pages_data as JSON string: {deleted_pages_data}")
                    parsed_deleted_pages = json.loads(deleted_pages_data)
                except json.JSONDecodeError:
                    print("deleted_pages_data is not valid JSON. Trying CSV fallback...")
                    parsed_deleted_pages = [int(p.strip()) for p in deleted_pages_data.split(',') if p.strip()]
            else:
                parsed_deleted_pages = deleted_pages_data if deleted_pages_data else []

        except Exception as e:
            print(f"Error parsing inputs: {e}")
            raise Exception(f"Invalid organize parameters: {e}")

        print(f"Parsed page_order length: {len(parsed_page_order) if parsed_page_order else 0}")
        print(f"Parsed deleted_pages: {parsed_deleted_pages}")

        # Normalize page_order into list of dicts with original_index
        if not isinstance(parsed_page_order, list) or len(parsed_page_order) == 0:
            raise Exception("page_order must be a non-empty list")

        normalized_page_order = []
        if isinstance(parsed_page_order[0], dict):
            # Assume already in expected structure
            normalized_page_order = parsed_page_order
        else:
            # Assume it's a list of page numbers (1-indexed)
            try:
                for num in parsed_page_order:
                    page_number = int(num)
                    normalized_page_order.append({
                        'id': f"page_{page_number}",
                        'page_number': page_number,
                        'original_index': max(0, page_number - 1),
                        'is_deleted': False
                    })
            except Exception as e:
                raise Exception(f"page_order conversion failed: {e}")

        # Normalize deleted pages to a list (ids or ints acceptable downstream)
        normalized_deleted = []
        if isinstance(parsed_deleted_pages, list):
            normalized_deleted = parsed_deleted_pages
        elif parsed_deleted_pages in (None, "", []):
            normalized_deleted = []
        else:
            # Single value
            try:
                normalized_deleted = [int(parsed_deleted_pages)]
            except Exception:
                normalized_deleted = [str(parsed_deleted_pages)]

        # Organize PDF
        organized_bytes = organizer.organize_pdf_pages(pdf_bytes, normalized_page_order, normalized_deleted)
        organized_size = len(organized_bytes)  # bytes
        
        # Count remaining pages
        # Build deletion sets (ids and numbers)
        deleted_id_set = set()
        deleted_num_set = set()
        for d in normalized_deleted:
            if isinstance(d, int):
                deleted_num_set.add(d)
            elif isinstance(d, str) and d.isdigit():
                deleted_num_set.add(int(d))
            else:
                deleted_id_set.add(d)

        remaining_pages = 0
        for p in normalized_page_order:
            pid = p.get('id')
            pnum = p.get('page_number')
            if pnum is None:
                oi = p.get('original_index', 0)
                pnum = int(oi) + 1
            if p.get('is_deleted', False):
                continue
            if (pid and pid in deleted_id_set) or (pnum in deleted_num_set):
                continue
            remaining_pages += 1
        deleted_count = len(normalized_page_order) - remaining_pages
        
        # Write the organized PDF to disk
        with open(output_path, "wb") as f:
            f.write(organized_bytes)
        
        print(f"PDF Organization: {round(original_size/1024,2)}KB -> {round(organized_size/1024,2)}KB, {remaining_pages} pages kept, {deleted_count} pages deleted")

        return {
            "originalSize": original_size,
            "organizedSize": organized_size,
            "path": output_path,
            "filename": output_filename,
            "totalOriginalPages": len(normalized_page_order),
            "remainingPages": remaining_pages,
            "deletedPages": deleted_count,
            "pagesReordered": True,
            "url": f"/download/organized/{output_filename}"
        }

    except Exception as e:
        error_msg = str(e)
        print(f"PDF Organization Error: {error_msg}")
        raise Exception(f"PDF organization failed: {error_msg}")

def cleanup_old_files(folder_path, max_age_minutes=5):
    """Remove files older than max_age_minutes from the specified folder"""
    try:
        if not os.path.exists(folder_path):
            return
        
        current_time = time.time()
        max_age_seconds = max_age_minutes * 60
        
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        print(f"Deleted old organized file: {filename}")
                    except Exception as e:
                        print(f"Could not delete {filename}: {e}")
    except Exception as e:
        print(f"Cleanup error: {e}")
