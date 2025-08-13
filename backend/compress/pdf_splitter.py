import fitz  # PyMuPDF
import os
import uuid
import time
import base64
from io import BytesIO
from .pdf_compressor import cleanup_all_temp_files

class PDFSplitter:
    def __init__(self):
        pass
    
    def get_pdf_pages_preview(self, pdf_bytes):
        """Extract page previews as base64 images"""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages_data = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Create a matrix for scaling the page to thumbnail size
                mat = fitz.Matrix(0.5, 0.5)  # Scale down to 50% for preview
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PNG bytes
                img_data = pix.tobytes("png")
                
                # Convert to base64 for frontend display
                img_base64 = base64.b64encode(img_data).decode('utf-8')
                
                # Get page dimensions
                page_rect = page.rect
                
                pages_data.append({
                    'page_number': page_num + 1,  # 1-indexed for user display
                    'page_index': page_num,       # 0-indexed for processing
                    'preview_image': f"data:image/png;base64,{img_base64}",
                    'width': int(page_rect.width),
                    'height': int(page_rect.height)
                })
            
            doc.close()
            return pages_data
            
        except Exception as e:
            raise Exception(f"Failed to generate page previews: {str(e)}")
    
    def split_pdf_by_pages(self, pdf_bytes, selected_pages):
        """Create a new PDF with only the selected pages"""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            new_doc = fitz.open()  # Create new empty PDF
            
            # Sort selected pages to maintain order
            selected_pages_sorted = sorted(selected_pages)
            
            for page_index in selected_pages_sorted:
                if 0 <= page_index < len(doc):
                    # Insert the page into the new document
                    new_doc.insert_pdf(doc, from_page=page_index, to_page=page_index)
            
            # Get the PDF bytes
            output_bytes = new_doc.write()
            
            doc.close()
            new_doc.close()
            
            return output_bytes
            
        except Exception as e:
            raise Exception(f"Failed to split PDF: {str(e)}")

async def get_pdf_pages(uploaded_file):
    """Get PDF page previews for selection"""
    try:
        pdf_bytes = await uploaded_file.read()
        splitter = PDFSplitter()
        pages_data = splitter.get_pdf_pages_preview(pdf_bytes)
        
        return {
            'total_pages': len(pages_data),
            'pages': pages_data,
            'file_size': round(len(pdf_bytes) / 1024, 2)
        }
        
    except Exception as e:
        raise Exception(f"Failed to process PDF: {str(e)}")

async def split_pdf_pages(uploaded_file, selected_pages, output_folder="app/split_pdfs"):
    """Split PDF and return new file with selected pages"""

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Auto-cleanup old files
    cleanup_all_temp_files()
    cleanup_old_files(output_folder, max_age_minutes=5)

    file_id = str(uuid.uuid4())
    output_filename = f"split_{file_id}.pdf"
    output_path = os.path.join(output_folder, output_filename)

    try:
        pdf_bytes = await uploaded_file.read()
        original_size = len(pdf_bytes)  # bytes

        # Initialize PDF splitter
        splitter = PDFSplitter()

        # Convert selected pages from 1-indexed to 0-indexed
        selected_indices = [page - 1 for page in selected_pages]

        # Split PDF
        split_bytes = splitter.split_pdf_by_pages(pdf_bytes, selected_indices)
        split_size = len(split_bytes)  # bytes

        # Write the split PDF to disk
        with open(output_path, "wb") as f:
            f.write(split_bytes)

        print(
            f"PDF Split: {round(original_size/1024,2)}KB -> {round(split_size/1024,2)}KB, {len(selected_pages)} pages selected"
        )

        return {
            "originalSize": original_size,
            "splitSize": split_size,
            "path": output_path,
            "filename": output_filename,
            "selectedPages": len(selected_pages),
            "totalPages": len(selected_pages),  # For consistency with other operations
            "pageNumbers": selected_pages,
            "url": f"/download/split/{output_filename}"
        }

    except Exception as e:
        error_msg = str(e)
        print(f"PDF Split Error: {error_msg}")
        raise Exception(f"PDF splitting failed: {error_msg}")

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
                        print(f"Deleted old split file: {filename}")
                    except Exception as e:
                        print(f"Could not delete {filename}: {e}")
    except Exception as e:
        print(f"Cleanup error: {e}")
