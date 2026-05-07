import pdfplumber
import fitz  # PyMuPDF
from PIL import Image
import io
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self):
        self.supported_formats = ['pdf']
    
    def extract(self, pdf_bytes: bytes) -> dict:
        """Full PDF extraction: text + images + metadata"""
        result = {
            'text': '',
            'pages': [],
            'images': [],
            'metadata': {},
            'tables': [],
            'word_count': 0,
            'page_count': 0
        }
        
        try:
            # Extract with pdfplumber (text + tables)
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                result['metadata'] = pdf.metadata or {}
                result['page_count'] = len(pdf.pages)
                
                full_text = []
                
                for i, page in enumerate(pdf.pages):
                    page_data = {
                        'page_num': i + 1,
                        'text': '',
                        'tables': []
                    }
                    
                    # Extract text
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            page_data['text'] = page_text
                            full_text.append(page_text)
                    except Exception:
                        pass
                    
                    # Extract tables
                    try:
                        tables = page.extract_tables()
                        if tables:
                            for table in tables:
                                if table and len(table) > 1:
                                    page_data['tables'].append(table)
                                    result['tables'].append({
                                        'page': i + 1,
                                        'data': table
                                    })
                    except Exception:
                        pass
                    
                    result['pages'].append(page_data)
                
                result['text'] = '\n'.join(full_text)
                result['word_count'] = len(result['text'].split())
            
            # Extract images with PyMuPDF
            try:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                for page_num in range(min(len(doc), 5)):  # Limit to 5 pages
                    page = doc[page_num]
                    image_list = page.get_images()
                    
                    for img_index, img in enumerate(image_list[:3]):  # Max 3 per page
                        try:
                            xref = img[0]
                            base_image = doc.extract_image(xref)
                            img_bytes = base_image["image"]
                            img_ext = base_image["ext"]
                            
                            pil_img = Image.open(io.BytesIO(img_bytes))
                            if pil_img.width > 50 and pil_img.height > 50:  # Filter tiny images
                                result['images'].append({
                                    'page': page_num + 1,
                                    'index': img_index,
                                    'width': pil_img.width,
                                    'height': pil_img.height,
                                    'format': img_ext,
                                    'bytes': img_bytes
                                })
                        except Exception:
                            continue
                doc.close()
            except Exception as e:
                logger.warning(f"Image extraction warning: {e}")
            
            # Extract abstract and sections
            result['abstract'] = self._extract_abstract(result['text'])
            result['sections'] = self._extract_sections(result['text'])
            
            return result
        
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return {'error': str(e), 'text': '', 'images': [], 'metadata': {}}
    
    def _extract_abstract(self, text: str) -> str:
        import re
        patterns = [
            r'(?:abstract|ABSTRACT)[:\s]+(.*?)(?:\n\n|\nintroduction|\n1\.)',
            r'Abstract[.\s]+(.*?)(?:\n\n|Introduction)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                abstract = match.group(1).strip()
                return abstract[:1000]
        
        # Fallback: first 500 chars
        return text[:500] if text else ''
    
    def _extract_sections(self, text: str) -> list:
        import re
        sections = []
        section_pattern = r'\n(\d+\.?\s+[A-Z][^\n]+)\n'
        matches = re.findall(section_pattern, text)
        for match in matches[:10]:
            sections.append(match.strip())
        return sections

pdf_service = PDFService()