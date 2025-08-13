from PIL import Image
import os
from io import BytesIO
import uuid

def compress_image(image_file, output_folder="app/compressed_images", compression_level="medium"):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Read the uploaded file content
    image_file.file.seek(0)
    image_content = image_file.file.read()
    image_file.file.seek(0)  # Reset for potential reuse
    
    # Open image from bytes
    image = Image.open(BytesIO(image_content))
    original_format = image.format
    
    # Convert to RGB for better compression
    if image.mode in ('RGBA', 'LA'):
        # Create a white background for transparent images
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'RGBA':
            background.paste(image, mask=image.split()[-1])
        else:
            background.paste(image, mask=image.split()[-1])
        image = background
    elif image.mode != 'RGB':
        image = image.convert("RGB")
    
    # Resize image for better compression if it's too large
    max_dimensions = {
        "light": (2048, 2048),
        "medium": (1600, 1600), 
        "heavy": (1200, 1200)
    }
    
    max_width, max_height = max_dimensions.get(compression_level, max_dimensions["medium"])
    
    # Only resize if image is larger than max dimensions
    if image.width > max_width or image.height > max_height:
        image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

    # Define compression settings based on level
    compression_settings = {
        "light": {
            "quality": 75,
            "optimize": True,
            "description": "Light compression - High quality, moderate size reduction"
        },
        "medium": {
            "quality": 60,
            "optimize": True,
            "description": "Medium compression - Balanced quality and size"
        },
        "heavy": {
            "quality": 40,
            "optimize": True,
            "description": "Heavy compression - Maximum size reduction"
        }
    }
    
    settings = compression_settings.get(compression_level, compression_settings["medium"])

    buffer = BytesIO()
    image.save(
        buffer, 
        format="JPEG", 
        optimize=settings["optimize"], 
        quality=settings["quality"]
    )
    buffer.seek(0)

    # Build user-friendly name: chhotipdf-{Original Name}.jpg
    original_name = os.path.splitext(image_file.filename or f"image-{uuid.uuid4()}")[0]
    safe_original = os.path.basename(original_name).replace(' ', '_')
    display_filename = f"chhotipdf-{safe_original}.jpg"

    # Keep stored filename unique on disk
    compressed_filename = f"{uuid.uuid4()}.jpg"
    compressed_path = os.path.join(output_folder, compressed_filename)

    # Calculate original size from the content we read
    original_size_bytes = len(image_content)
    compressed_size_bytes = len(buffer.getvalue())
    
    # If compressed size is not significantly smaller, try with lower quality
    if compressed_size_bytes >= original_size_bytes * 0.9:  # Less than 10% reduction
        buffer = BytesIO()
        # Reduce quality further
        fallback_quality = max(settings["quality"] - 20, 20)
        image.save(
            buffer, 
            format="JPEG", 
            optimize=True, 
            quality=fallback_quality
        )
        buffer.seek(0)
        compressed_size_bytes = len(buffer.getvalue())

    with open(compressed_path, "wb") as f:
        f.write(buffer.getvalue())

    original_size = round(original_size_bytes / 1024, 2)
    compressed_size = round(compressed_size_bytes / 1024, 2)

    return {
        "originalSize": original_size,
        "compressedSize": compressed_size,
        "path": compressed_path,
        "filename": compressed_filename,
        "display_filename": display_filename,
        "compressionLevel": compression_level,
        "compressionDescription": settings["description"]
    }
