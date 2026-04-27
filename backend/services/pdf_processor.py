import fitz  # PyMuPDF
import pdfplumber
import numpy as np
from PIL import Image
import io
import re


class PDFProcessor:
    """
    Extracts text, images, and tables from uploaded PDF research papers.
    
    Why PyMuPDF for images and pdfplumber for text/tables:
    PyMuPDF provides fast binary-level access to embedded images with their
    original resolution. pdfplumber excels at detecting tabular structures
    in PDFs using geometric analysis of text positions. Using both libraries
    gives us the best capabilities for each content type.
    """
    
    def __init__(self):
        self.min_image_size = (50, 50)  # Ignore thumbnails and icons
    
    def extract_all(self, pdf_path):
        """
        Complete extraction pipeline for a PDF file.
        Returns dict with text, images, tables, and metadata.
        """
        result = {
            'text': '',
            'sections': {},
            'images': [],
            'tables': [],
            'metadata': {},
            'statistics': {}
        }
        
        # Extract text and images with PyMuPDF
        result.update(self._extract_with_pymupdf(pdf_path))
        
        # Extract tables with pdfplumber
        result['tables'] = self._extract_tables_with_pdfplumber(pdf_path)
        
        # Compute document statistics
        result['statistics'] = self._compute_statistics(result)
        
        return result
    
    def _extract_with_pymupdf(self, pdf_path):
        """
        Extract text and images from PDF.
        
        Text extraction uses PyMuPDF's layout-aware text blocks,
        which preserves paragraph boundaries better than raw character
        extraction, resulting in more natural text for NLP processing.
        """
        doc = fitz.open(pdf_path)
        
        full_text = []
        sections = {}
        images = []
        
        # Metadata
        metadata = {
            'page_count': len(doc),
            'title': doc.metadata.get('title', ''),
            'author': doc.metadata.get('author', ''),
            'creation_date': doc.metadata.get('creationDate', '')
        }
        
        for page_num, page in enumerate(doc):
            # Extract text blocks (preserves spatial layout)
            blocks = page.get_text("blocks")
            page_text = ""
            
            for block in blocks:
                if block[6] == 0:  # Text block (type 0)
                    text = block[4].strip()
                    if text:
                        page_text += text + "\n"
            
            full_text.append(page_text)
            
            # Detect section headers using font size analysis
            for block in blocks:
                if block[6] == 0:
                    # Heuristic: section headers are typically SHORT and UPPERCASE
                    text = block[4].strip()
                    if (len(text) < 80 and 
                        (text.isupper() or text.istitle()) and
                        len(text.split()) < 8):
                        sections[text] = ""
            
            # Extract embedded images
            image_list = page.get_images(full=True)
            for img_idx, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                
                if base_image:
                    img_bytes = base_image['image']
                    img = Image.open(io.BytesIO(img_bytes))
                    
                    # Filter out tiny images (logos, bullets)
                    if (img.size[0] >= self.min_image_size[0] and 
                        img.size[1] >= self.min_image_size[1]):
                        images.append({
                            'page': page_num + 1,
                            'index': img_idx,
                            'size': img.size,
                            'mode': img.mode,
                            'pil_image': img,
                            'bytes': img_bytes
                        })
        
        doc.close()
        
        combined_text = '\n'.join(full_text)
        
        return {
            'text': combined_text,
            'sections': self._identify_sections(combined_text),
            'images': images,
            'metadata': metadata
        }
    
    def _identify_sections(self, text):
        """
        Identify standard scientific paper sections.
        
        Standard sections in research papers: Abstract, Introduction,
        Related Work, Methods, Results, Discussion, Conclusion.
        Identifying these helps the system analyze method descriptions
        and results sections separately for more precise insight generation.
        """
        sections = {}
        section_patterns = {
            'abstract': r'abstract(.*?)(?:introduction|background|1\.)',
            'introduction': r'(?:introduction|1\.)(.*?)(?:method|approach|related|2\.)',
            'methods': r'(?:method|methodology|approach)(.*?)(?:result|experiment|3\.)',
            'results': r'(?:result|experiment)(.*?)(?:discussion|conclusion|4\.)',
            'discussion': r'(?:discussion|analysis)(.*?)(?:conclusion|5\.)',
            'conclusion': r'(?:conclusion|summary)(.*?)(?:reference|bibliography|$)'
        }
        
        text_lower = text.lower()
        
        for section_name, pattern in section_patterns.items():
            match = re.search(pattern, text_lower, re.DOTALL)
            if match:
                section_text = match.group(1).strip()
                # Limit to 2000 chars per section
                sections[section_name] = text[
                    match.start(1):match.start(1) + 2000
                ].strip()
        
        return sections
    
    def _extract_tables_with_pdfplumber(self, pdf_path):
        """
        Extract tabular data from PDF using geometric text analysis.
        
        pdfplumber detects tables by analyzing the bounding boxes of text
        elements and identifying grid-like spatial arrangements. It is more
        reliable than regex-based table detection for scientific PDFs because
        tables rarely have consistent text formatting.
        """
        tables = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    extracted = page.extract_tables()
                    
                    for table_idx, table in enumerate(extracted):
                        if table and len(table) > 1:  # At least header + one row
                            # Clean table cells
                            cleaned_table = []
                            for row in table:
                                cleaned_row = [
                                    str(cell).strip() if cell else '' 
                                    for cell in row
                                ]
                                cleaned_table.append(cleaned_row)
                            
                            tables.append({
                                'page': page_num + 1,
                                'index': table_idx,
                                'rows': len(cleaned_table),
                                'cols': max(len(r) for r in cleaned_table),
                                'data': cleaned_table,
                                'header': cleaned_table[0] if cleaned_table else []
                            })
        except Exception as e:
            print(f"Table extraction error: {e}")
        
        return tables
    
    def _compute_statistics(self, result):
        """Compute document-level statistics for the analysis report."""
        text = result['text']
        words = text.split()
        
        return {
            'total_words': len(words),
            'total_pages': result['metadata'].get('page_count', 0),
            'num_images': len(result['images']),
            'num_tables': len(result['tables']),
            'num_sections': len(result['sections']),
            'avg_words_per_page': len(words) // max(result['metadata'].get('page_count', 1), 1),
            'has_methods': 'methods' in result['sections'],
            'has_results': 'results' in result['sections']
        }