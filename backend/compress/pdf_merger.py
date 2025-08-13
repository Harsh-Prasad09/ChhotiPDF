import fitz  # PyMuPDF
import os
import uuid
import time
from .pdf_compressor import cleanup_all_temp_files

async def merge_pdfs(uploaded_files, output_folder="app/merged_pdfs"):
    """Merge multiple PDF files into one"""
    
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Auto-cleanup old files (older than 5 minutes) every time function is called
    cleanup_all_temp_files()
    
    # Also cleanup merged PDFs folder
    cleanup_old_files(output_folder, max_age_minutes=5)

    file_id = str(uuid.uuid4())
    output_filename = f"merged_{file_id}.pdf"
    output_path = os.path.join(output_folder, output_filename)
    
    merged_doc = None
    temp_docs = []

    try:
        # Create a new PDF document for merging
        merged_doc = fitz.open()
        total_original_size = 0
        
        # Process each uploaded file in order
        for uploaded_file in uploaded_files:
            pdf_bytes = await uploaded_file.read()
            total_original_size += len(pdf_bytes)
            
            # Open the PDF from memory
            temp_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            temp_docs.append(temp_doc)
            
            # Insert all pages from this PDF into the merged document
            merged_doc.insert_pdf(temp_doc)
        
        # Save the merged PDF
        merged_doc.save(output_path)
        
        # Calculate file sizes
        merged_size = round(os.path.getsize(output_path) / 1024, 2)
        original_size = round(total_original_size / 1024, 2)
        
        print(f"PDF Merge: {len(uploaded_files)} files ({original_size}KB) -> {merged_size}KB")

        return {
            "originalSize": original_size,
            "mergedSize": merged_size,
            "path": output_path,
            "filename": output_filename,
            "fileCount": len(uploaded_files)
        }

    except Exception as e:
        error_msg = str(e)
        print(f"PDF Merge Error: {error_msg}")
        raise Exception(f"PDF merge failed: {error_msg}")

    finally:
        # Close all temporary documents
        for temp_doc in temp_docs:
            if temp_doc:
                temp_doc.close()
        
        # Close the merged document
        if merged_doc:
            merged_doc.close()

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
                        print(f"Deleted old merged file: {filename}")
                    except Exception as e:
                        print(f"Could not delete {filename}: {e}")
    except Exception as e:
        print(f"Cleanup error: {e}")
