#!/usr/bin/env python3
"""
PDF text and image extraction utilities.

This module provides functionality to extract text and images from PDF files,
handling various PDF formats and structures.
"""

import io
import re
from pathlib import Path
from typing import Optional

from PIL import Image


def extract_text_from_pdf(pdf_path: str, pages: Optional[list[int]] = None) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        pages: Optional list of page numbers to extract (0-indexed)
    
    Returns:
        Extracted text content
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        text_parts = []
        
        page_range = pages if pages is not None else range(len(doc))
        
        for page_num in page_range:
            if page_num < len(doc):
                page = doc[page_num]
                text = page.get_text()
                text_parts.append(f"--- Page {page_num + 1} ---\n{text}")
        
        doc.close()
        return "\n\n".join(text_parts)
    
    except ImportError:
        # Fallback to pypdf
        from pypdf import PdfReader
        
        reader = PdfReader(pdf_path)
        text_parts = []
        
        page_range = pages if pages is not None else range(len(reader.pages))
        
        for page_num in page_range:
            if page_num < len(reader.pages):
                page = reader.pages[page_num]
                text = page.extract_text()
                text_parts.append(f"--- Page {page_num + 1} ---\n{text}")
        
        return "\n\n".join(text_parts)


def extract_images_from_pdf(
    pdf_path: str,
    output_dir: Optional[str] = None,
    min_size: tuple[int, int] = (50, 50),
) -> list[dict]:
    """
    Extract images from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        output_dir: Directory to save extracted images (if None, images are not saved)
        min_size: Minimum image dimensions (width, height) to include
    
    Returns:
        List of dicts containing image metadata and paths
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        images = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            
            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["extent"]
                    
                    # Load image to check size
                    img = Image.open(io.BytesIO(image_bytes))
                    
                    if img.size[0] < min_size[0] or img.size[1] < min_size[1]:
                        continue
                    
                    image_info = {
                        "page": page_num + 1,
                        "index": img_index,
                        "width": img.size[0],
                        "height": img.size[1],
                        "format": img.format,
                        "xref": xref,
                    }
                    
                    if output_dir:
                        output_path = Path(output_dir)
                        output_path.mkdir(parents=True, exist_ok=True)
                        
                        filename = f"page_{page_num + 1}_img_{img_index}.{image_ext}"
                        filepath = output_path / filename
                        img.save(filepath)
                        image_info["path"] = str(filepath)
                    
                    images.append(image_info)
                    
                except Exception as e:
                    print(f"Warning: Could not extract image {img_index} from page {page_num}: {e}")
        
        doc.close()
        return images
    
    except ImportError:
        print("PyMuPDF not available. Install it with: pip install PyMuPDF")
        return []


def extract_tables_from_pdf(pdf_path: str) -> list[dict]:
    """
    Extract tables from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
    
    Returns:
        List of dicts containing table data and metadata
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        tables = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Try to extract tables using fitz
            tabs = page.find_tables()
            
            for tab_idx, table in enumerate(tabs):
                table_data = table.extract()
                
                tables.append({
                    "page": page_num + 1,
                    "table_index": tab_idx,
                    "data": table_data,
                    "num_rows": len(table_data) if table_data else 0,
                    "num_cols": len(table_data[0]) if table_data and table_data[0] else 0,
                })
        
        doc.close()
        return tables
    
    except ImportError:
        print("PyMuPDF not available. Install it with: pip install PyMuPDF")
        return []


def get_pdf_metadata(pdf_path: str) -> dict:
    """
    Get metadata from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
    
    Returns:
        Dictionary containing PDF metadata
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        metadata = doc.metadata.copy()
        metadata["page_count"] = len(doc)
        doc.close()
        
        return metadata
    
    except ImportError:
        from pypdf import PdfReader
        
        reader = PdfReader(pdf_path)
        metadata = reader.metadata
        
        return {
            "title": metadata.title if metadata else None,
            "author": metadata.author if metadata else None,
            "subject": metadata.subject if metadata else None,
            "creator": metadata.creator if metadata else None,
            "page_count": len(reader.pages),
        }


def process_pdf(
    pdf_path: str,
    extract_text: bool = True,
    extract_images: bool = True,
    extract_tables: bool = False,
    output_dir: Optional[str] = None,
) -> dict:
    """
    Comprehensive PDF processing function.
    
    Args:
        pdf_path: Path to the PDF file
        extract_text: Whether to extract text
        extract_images: Whether to extract images
        extract_tables: Whether to extract tables
        output_dir: Directory to save extracted content
    
    Returns:
        Dictionary containing all extracted content
    """
    result = {
        "source": pdf_path,
        "metadata": get_pdf_metadata(pdf_path),
    }
    
    if extract_text:
        result["text"] = extract_text_from_pdf(pdf_path)
    
    if extract_images:
        img_dir = None
        if output_dir:
            img_dir = Path(output_dir) / "images"
        result["images"] = extract_images_from_pdf(pdf_path, img_dir)
    
    if extract_tables:
        result["tables"] = extract_tables_from_pdf(pdf_path)
    
    return result