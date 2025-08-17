from PIL import Image
import os
from io import BytesIO
import uuid


def compress_image(image_file, output_folder="app/compressed_images", compression_level="medium"):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Read the uploaded file content (raw bytes)
    image_file.file.seek(0)
    image_content = image_file.file.read()
    image_file.file.seek(0)  # Reset for potential reuse

    # Open image from bytes
    image = Image.open(BytesIO(image_content))
    original_format = image.format

    # Convert to RGB for better compression
    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        alpha = image.split()[-1]
        background.paste(image, mask=alpha)
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")

    # Resize image for better compression if it's too large
    max_dimensions = {
        "light": (2048, 2048),
        "medium": (1600, 1600),
        "heavy": (1200, 1200),
    }

    max_width, max_height = max_dimensions.get(compression_level, max_dimensions["medium"])
    if image.width > max_width or image.height > max_height:
        image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

    # Define compression settings based on level
    compression_settings = {
        "light": {"quality": 75, "optimize": True, "description": "Light compression - High quality, moderate size reduction"},
        "medium": {"quality": 60, "optimize": True, "description": "Medium compression - Balanced quality and size"},
        "heavy": {"quality": 40, "optimize": True, "description": "Heavy compression - Maximum size reduction"},
    }

    settings = compression_settings.get(compression_level, compression_settings["medium"])

    # Create initial JPEG buffer
    buffer = BytesIO()
    image.save(buffer, format="JPEG", optimize=settings["optimize"], quality=settings["quality"])
    buffer.seek(0)

    # Build user-friendly name
    original_name = os.path.splitext(image_file.filename or f"image-{uuid.uuid4()}")[0]
    safe_original = os.path.basename(original_name).replace(" ", "_")
    display_filename = f"chhotipdf-{safe_original}.jpg"

    # Keep stored filename unique on disk
    compressed_filename = f"{uuid.uuid4()}.jpg"
    compressed_path = os.path.join(output_folder, compressed_filename)

    original_size_bytes = len(image_content)
    compressed_size_bytes = len(buffer.getvalue())

    # If compressed size is not smaller, try one fallback with lower quality
    if compressed_size_bytes >= original_size_bytes:
        try:
            fallback_buf = BytesIO()
            fallback_quality = max(settings["quality"] - 20, 20)
            image.save(fallback_buf, format="JPEG", optimize=True, quality=fallback_quality)
            fallback_buf.seek(0)
            fallback_size = len(fallback_buf.getvalue())
            if fallback_size < compressed_size_bytes:
                buffer = fallback_buf
                compressed_size_bytes = fallback_size
        except Exception:
            pass

    # Final check: if compression didn't reduce size, store original bytes instead
    used_original = False
    print(f"[DEBUG] image original_size={original_size_bytes} bytes; initial_compressed_size={compressed_size_bytes} bytes")
    if compressed_size_bytes >= original_size_bytes:
        used_original = True
        print("[DEBUG] compressed buffer not smaller than original — writing original bytes instead")
        # Preserve original extension if possible
        try:
            orig_ext = (original_format or "JPEG").lower()
            if orig_ext == "jpeg":
                orig_ext = "jpg"
            orig_filename = f"{uuid.uuid4()}.{orig_ext}"
            compressed_path = os.path.join(output_folder, orig_filename)
            with open(compressed_path, "wb") as f:
                f.write(image_content)
            compressed_filename = orig_filename
            compressed_size_bytes = len(image_content)
        except Exception as e:
            print(f"[DEBUG] writing original bytes failed: {e}; falling back to compressed buffer")
            # Last resort: write the compressed buffer
            with open(compressed_path, "wb") as f:
                f.write(buffer.getvalue())
            compressed_size_bytes = len(buffer.getvalue())
    else:
        with open(compressed_path, "wb") as f:
            f.write(buffer.getvalue())

    # Post-write safety: ensure the written file isn't larger than original
    try:
        written_size = os.path.getsize(compressed_path)
        print(f"[DEBUG] written_size_after_first_write={written_size} bytes")
        if written_size > original_size_bytes:
            print("[DEBUG] written file larger than original — overwriting with original bytes")
            with open(compressed_path, "wb") as f:
                f.write(image_content)
            compressed_size_bytes = len(image_content)
            used_original = True
            print(f"[DEBUG] overwritten_with_original; final_size={compressed_size_bytes} bytes")
    except Exception as e:
        print(f"[DEBUG] post-write safety check failed: {e}")

    return {
        "originalSize": original_size_bytes,
        "compressedSize": compressed_size_bytes,
        "path": compressed_path,
        "filename": compressed_filename,
        "display_filename": display_filename,
        "compressionLevel": compression_level,
        "compressionDescription": settings["description"],
        "usedOriginal": used_original,
    }
