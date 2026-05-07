#!/usr/bin/env python3
"""Helper script to download and prepare datasets"""

import os
import requests
import zipfile
from pathlib import Path
from config import Config

def download_arxiv_metadata(output_path: str):
    """Download arXiv metadata from Kaggle (manual step - provide instructions)"""
    print("📦 arXiv Dataset Setup")
    print("=" * 50)
    print("The arXiv dataset is hosted on Kaggle and requires authentication.")
    print("\nSteps to download:")
    print("1. Install Kaggle CLI: pip install kaggle")
    print("2. Get API token from https://www.kaggle.com/settings")
    print("3. Save kaggle.json to ~/.kaggle/kaggle.json")
    print("4. Run: kaggle datasets download -d Cornell-University/arxiv")
    print("5. Extract to: backend/data/arxiv-metadata-oai-snapshot.jsonl")
    print(f"\nExpected output: {output_path}")
    
    # Check if file exists
    if os.path.exists(output_path):
        print("✓ arXiv metadata already exists")
        return True
    else:
        print("⚠️  Please download the dataset manually")
        return False

def download_rvl_cdip(output_dir: str):
    """Download RVL-CDIP document image dataset"""
    print("\n🖼️  RVL-CDIP Dataset Setup")
    print("=" * 50)
    
    # RVL-CDIP is available via direct download
    url = "http://www.datascienceassn.org/sites/default/files/rvl-cdip.tar.gz"
    output_file = os.path.join(output_dir, 'rvl-cdip.tar.gz')
    
    if os.path.exists(output_file) or os.path.exists(os.path.join(output_dir, 'rvl-cdip')):
        print("✓ RVL-CDIP already downloaded/extracted")
        return True
    
    print(f"Downloading from {url}...")
    print("⚠️  Large file (~15GB) - this may take a while")
    
    # Note: Actual download would use requests with streaming
    # For now, provide instructions
    print("\nManual download instructions:")
    print("1. Visit: http://www.datascienceassn.org/sites/default/files/rvl-cdip.tar.gz")
    print(f"2. Extract to: {os.path.join(output_dir, 'rvl-cdip')}")
    print("3. Dataset contains 400K grayscale document images in 16 categories")
    
    return False

def prepare_sample_data(output_dir: str):
    """Create small sample dataset for testing without full download"""
    print("\n🧪 Creating Sample Data for Testing")
    print("=" * 50)
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Sample arXiv metadata (50 papers for testing)
    sample_papers = []
    categories = Config.ARXIV_CATEGORIES
    
    for i, cat in enumerate(categories * 7):  # ~7 per category
        sample_papers.append({
            'id': f'2605.{i:05d}',
            'title': f'Sample Research Paper {i+1} in {cat}',
            'abstract': f'This is a sample abstract for testing the multimodal framework. '
                       f'It discusses research in the {cat} category with hypothetical findings.',
            'authors': [f'Author {j}' for j in range(1, 4)],
            'categories': [cat],
            'updated': '2026-05-01'
        })
    
    metadata_path = os.path.join(output_dir, 'arxiv_metadata_sample.jsonl')
    with open(metadata_path, 'w') as f:
        for paper in sample_papers:
            import json
            f.write(json.dumps(paper) + '\n')
    
    print(f"✓ Created sample metadata: {metadata_path} ({len(sample_papers)} papers)")
    
    # Create dummy FAISS index for sample data
    try:
        from sentence_transformers import SentenceTransformer
        import faiss
        import numpy as np
        
        print("Building sample FAISS index...")
        encoder = SentenceTransformer(Config.TEXT_ENCODER)
        
        texts = [f"{p['title']}. {p['abstract']}" for p in sample_papers]
        embeddings = encoder.encode(texts, normalize_embeddings=True).astype('float32')
        
        # Small IVF index for sample
        dimension = embeddings.shape[1]
        quantizer = faiss.IndexFlatL2(dimension)
        index = faiss.IndexIVFFlat(quantizer, dimension, 10, faiss.METRIC_L2)
        index.train(embeddings)
        index.add(embeddings)
        
        index_path = os.path.join(output_dir, 'arxiv_sample.index')
        faiss.write_index(index, index_path)
        print(f"Created sample index: {index_path}")
        
    except Exception as e:
        print(f"  Could not build sample index: {e}")
        print("   The sample metadata file is still usable for testing other components")
    
    return True

if __name__ == '__main__':
    data_dir = Config.DATA_DIR
    os.makedirs(data_dir, exist_ok=True)
    
    print(" Dataset Setup Helper")
    print(f"Target directory: {data_dir}\n")
    
    # Option 1: Use sample data (fastest for development)
    if prepare_sample_data(os.path.join(data_dir, 'sample')):
        print("\n Sample data ready! You can start development immediately.")
        print("   To use full arXiv data later, run the full download process.")
    
    # Option 2: Full dataset (commented - user can enable)
    # download_arxiv_metadata(os.path.join(data_dir, 'arxiv-metadata-oai-snapshot.jsonl'))
    # download_rvl_cdip(data_dir)