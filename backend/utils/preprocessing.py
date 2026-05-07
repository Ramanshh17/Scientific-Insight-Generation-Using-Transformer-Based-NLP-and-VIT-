import re
import cv2
import numpy as np
import pandas as pd
from PIL import Image
import pdfplumber
from typing import Optional, Union, List
import torch

def preprocess_text(text: str) -> str:
    """Clean scientific text: remove LaTeX, citations, URLs"""
    if not text:
        return ""
    
    # Remove LaTeX math environments
    text = re.sub(r'\$.*?\$', '', text)  # Inline math
    text = re.sub(r'\\\[.*?\\\]', '', text, flags=re.DOTALL)  # Display math
    text = re.sub(r'\\begin\{.*?\}.*?\\end\{.*?\}', '', text, flags=re.DOTALL)
    
    # Remove citation markers
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\([^)]*?\d{4}[^)]*?\)', '', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def preprocess_image(image_input: Union[str, bytes, Image.Image], 
                     target_size: tuple = (224, 224)) -> np.ndarray:
    """Apply CLAHE preprocessing and resize for CLIP/ViT"""
    # Load image
    if isinstance(image_input, str):
        img = Image.open(image_input).convert('RGB')
    elif isinstance(image_input, bytes):
        img = Image.open(io.BytesIO(image_input)).convert('RGB')
    else:
        img = image_input.convert('RGB') if not image_input.mode == 'RGB' else image_input
    
    # Convert to numpy for OpenCV processing
    img_np = np.array(img)
    
    # Apply CLAHE on L channel of LAB color space
    lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_clahe = clahe.apply(l)
    lab_clahe = cv2.merge([l_clahe, a, b])
    img_enhanced = cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2RGB)
    
    # Resize and normalize for CLIP
    img_resized = cv2.resize(img_enhanced, target_size)
    
    # CLIP normalization
    mean = np.array([0.48145466, 0.4578275, 0.40821073])
    std = np.array([0.26862954, 0.26130258, 0.27577711])
    img_normalized = (img_resized / 255.0 - mean) / std
    
    return img_normalized.transpose(2, 0, 1)  # HWC -> CHW

def preprocess_tabular(csv_input: Union[str, bytes, pd.DataFrame],
                       fitted_scalers: Optional[dict] = None) -> tuple:
    """Process CSV: imputation, encoding, scaling"""
    # Load data
    if isinstance(csv_input, str):
        df = pd.read_csv(csv_input)
    elif isinstance(csv_input, bytes):
        df = pd.read_csv(io.StringIO(csv_input.decode('utf-8')))
    else:
        df = csv_input.copy()
    
    # Separate numeric and categorical
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # KNN imputation for numeric (k=5)
    from sklearn.impute import KNNImputer
    if numeric_cols:
        imputer = KNNImputer(n_neighbors=5)
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
    
    # Label encode categorical
    from sklearn.preprocessing import LabelEncoder
    encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    
    # Standard scaling
    from sklearn.preprocessing import StandardScaler
    scalers = {}
    for col in numeric_cols:
        if fitted_scalers and col in fitted_scalers:
            scaler = fitted_scalers[col]
        else:
            scaler = StandardScaler()
            df[[col]] = scaler.fit_transform(df[[col]])
            scalers[col] = scaler
        df[[col]] = scaler.transform(df[[col]])
    
    return df.values, {'encoders': encoders, 'scalers': scalers}

def extract_from_pdf(pdf_path: str) -> dict:
    """Extract text and images from PDF"""
    result = {'text': '', 'images': [], 'tables': []}
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # Extract text
            text = page.extract_text()
            if text:
                result['text'] += f"\n[Page {page_num+1}] {text}"
            
            # Extract images (simplified - would need more robust handling)
            for img in page.images:
                # Note: Actual image extraction requires additional libraries
                result['images'].append({
                    'page': page_num + 1,
                    'bbox': (img['x0'], img['top'], img['x1'], img['bottom'])
                })
            
            # Extract tables
            tables = page.extract_tables()
            for table in tables:
                if table:
                    result['tables'].append(pd.DataFrame(table[1:], columns=table[0]))
    
    return result