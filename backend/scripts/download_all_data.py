#!/usr/bin/env python3
"""
Comprehensive dataset download script for Scientific Insight Generation project.
Downloads arXiv, World Bank, and RVL-CDIP datasets.
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config

def print_header(text):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")

def print_step(step, text):
    print(f"\n[{step}] {text}")
    print("-" * 40)

def check_disk_space(required_gb, path):
    """Check if there's enough disk space."""
    try:
        import shutil
        total, used, free = shutil.disk_usage(path)
        free_gb = free / (1024**3)
        if free_gb < required_gb:
            print(f"WARNING: Only {free_gb:.1f}GB free, need {required_gb}GB")
            return False
        return True
    except:
        return True  # Cannot check, proceed anyway

def download_arxiv_sample(output_dir):
    """Download a sample of arXiv papers for testing."""
    print_step("1", "Downloading arXiv Sample Data")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Sample papers for testing
    sample_papers = []
    categories = list(Config.ARXIV_CATEGORIES.values())
    
    sample_titles = [
        "Attention Is All You Need",
        "BERT: Pre-training of Deep Bidirectional Transformers",
        "Deep Residual Learning for Image Recognition",
        "ImageNet Classification with Deep Convolutional Neural Networks",
        "Generative Adversarial Nets",
        "Playing Atari with Deep Reinforcement Learning",
        "A Comprehensive Survey on Graph Neural Networks",
        "Quantum Computing: An Applied Approach",
        "Deep Learning in Drug Discovery",
        "AlphaGo Zero: Starting from Scratch",
    ]
    
    sample_abstracts = [
        "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        "We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations.",
        "Residual networks leverage skip connections to train very deep neural networks. We demonstrate that residual connections enable training of networks with hundreds of layers.",
        "We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 dataset into the 1000 different classes.",
        "We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G and a discriminative model D.",
        "We present a method for learning control policies directly from high-dimensional sensory input using reinforcement learning.",
        "Graph neural networks are a type of neural network that operates on graph-structured data. We provide a comprehensive overview of GNNs.",
        "This book provides a practical introduction to quantum computing, covering both theoretical foundations and practical implementations.",
        "Deep learning has revolutionized drug discovery by enabling the prediction of molecular properties and drug-target interactions.",
        "AlphaGo Zero learns tabula rasa, achieving superhuman performance in the game of Go through pure reinforcement learning.",
    ]
    
    for i in range(len(sample_titles)):
        sample_papers.append({
            'id': f'sample_{i:04d}',
            'title': sample_titles[i],
            'abstract': sample_abstracts[i],
            'authors': [f'Author {j}' for j in range(1, 4)],
            'categories': [categories[i % len(categories)]],
            'published': f'202{i // 10}-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}',
            'url': f'https://arxiv.org/abs/sample_{i:04d}'
        })
    
    # Save as JSONL
    output_path = os.path.join(output_dir, 'arxiv_sample.jsonl')
    with open(output_path, 'w') as f:
        for paper in sample_papers:
            f.write(json.dumps(paper) + '\n')
    
    print(f"Created sample arXiv data: {output_path}")
    print(f"Total papers: {len(sample_papers)}")
    
    return output_path

def download_worldbank_sample(output_dir):
    """Download World Bank indicators sample data."""
    print_step("2", "Downloading World Bank Sample Data")
    
    os.makedirs(output_dir, exist_ok=True)
    
    import pandas as pd
    import numpy as np
    
    # Create sample World Bank-style data
    countries = ['United States', 'China', 'India', 'Germany', 'Japan', 'Brazil', 'UK', 'France']
    years = list(range(2000, 2024))
    
    data = []
    for country in countries:
        for year in years:
            data.append({
                'country': country,
                'year': year,
                'gdp_growth': round(np.random.uniform(-2, 8), 2),
                'population': round(np.random.uniform(10, 1400), 1),
                'life_expectancy': round(np.random.uniform(60, 85), 1),
                'education_index': round(np.random.uniform(0.3, 0.99), 3),
                'co2_emissions': round(np.random.uniform(1, 20), 2),
                'internet_users_pct': round(np.random.uniform(10, 95), 1),
                'unemployment_rate': round(np.random.uniform(2, 15), 1),
                'health_expenditure_pct': round(np.random.uniform(3, 18), 1),
            })
    
    df = pd.DataFrame(data)
    output_path = os.path.join(output_dir, 'worldbank_sample.csv')
    df.to_csv(output_path, index=False)
    
    print(f"Created sample World Bank data: {output_path}")
    print(f"Total records: {len(df)}")
    
    return output_path

def create_sample_images(output_dir):
    """Create sample scientific images for testing."""
    print_step("3", "Creating Sample Scientific Images")
    
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        import numpy as np
        from PIL import Image
        
        image_types = [
            ('microscopy', 'Microscopy Image'),
            ('chart', 'Scientific Chart'),
            ('graph', 'Data Graph'),
            ('heatmap', 'Heatmap Visualization'),
        ]
        
        for img_type, desc in image_types:
            if img_type == 'microscopy':
                # Create grayscale microscopy-like image
                img_array = np.random.randint(0, 256, (512, 512), dtype=np.uint8)
                # Add some structure
                for _ in range(50):
                    x, y = np.random.randint(30, 482, 2)  # Avoid edges
                    r = np.random.randint(5, 30)
                    img_array[y-r:y+r, x-r:x+r] = np.random.randint(100, 255, (2*r, 2*r))
                
            elif img_type == 'chart':
                # Create chart-like image
                img_array = np.ones((400, 600, 3), dtype=np.uint8) * 255
                # Draw bars
                for i in range(8):
                    h = np.random.randint(50, 300)
                    img_array[350-h:350, i*70+10:i*70+60] = [np.random.randint(50, 200), 100, 150]
                
            elif img_type == 'graph':
                # Create line graph
                img_array = np.ones((400, 600, 3), dtype=np.uint8) * 255
                points = sorted(np.random.randint(50, 350, 10))
                for i in range(9):
                    x1, y1 = i * 60 + 20, points[i]
                    x2, y2 = (i + 1) * 60 + 20, points[i + 1]
                    img_array = Image.fromarray(img_array)
                    draw = ImageDraw.Draw(img_array)
                    draw.line([(x1, y1), (x2, y2)], fill=(0, 100, 200), width=2)
                    img_array = np.array(img_array)
                
            else:  # heatmap
                img_array = np.random.randint(0, 256, (300, 400, 3), dtype=np.uint8)
                # Create gradient
                for i in range(300):
                    img_array[i, :, 0] = int(255 * i / 300)
                    img_array[i, :, 2] = 255 - int(255 * i / 300)
            
            img = Image.fromarray(img_array)
            output_path = os.path.join(output_dir, f'sample_{img_type}.png')
            img.save(output_path)
            print(f"Created {desc}: {output_path}")
    
    except ImportError as e:
        print(f"Could not create images (missing dependency: {e})")
        print("Install with: pip install Pillow numpy")
    
    return output_dir

def setup_faiss_index(output_dir, sample_papers_path):
    """Build FAISS index from sample papers."""
    print_step("4", "Building FAISS Index")
    
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        from sentence_transformers import SentenceTransformer
        import faiss
        import numpy as np
        import pickle
        
        # Load sample papers
        papers = []
        with open(sample_papers_path, 'r') as f:
            for line in f:
                papers.append(json.loads(line))
        
        print(f"Loading papers for indexing: {len(papers)}")
        
        # Load encoder
        print("Loading sentence encoder...")
        encoder = SentenceTransformer(Config.SENTENCE_MODEL)
        
        # Create embeddings
        texts = [f"{p['title']}. {p['abstract']}" for p in papers]
        print("Generating embeddings...")
        embeddings = encoder.encode(texts, show_progress_bar=True).astype('float32')
        
        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Create index
        dimension = embeddings.shape[1]
        print(f"Creating FAISS index (dim={dimension})...")
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        # Save index
        index_path = os.path.join(output_dir, 'arxiv_faiss.index')
        faiss.write_index(index, index_path)
        print(f"Saved FAISS index: {index_path}")
        
        # Save metadata
        metadata_path = os.path.join(output_dir, 'arxiv_metadata.pkl')
        with open(metadata_path, 'wb') as f:
            pickle.dump(papers, f)
        print(f"Saved metadata: {metadata_path}")
        
        return index_path, metadata_path
        
    except ImportError as e:
        print(f"Could not build FAISS index (missing dependency: {e})")
        print("Install with: pip install faiss-cpu sentence-transformers")
        return None, None

def main():
    print_header("Scientific Insight Generation - Dataset Setup")
    
    # Create data directory
    data_dir = Config.DATA_DIR
    processed_dir = Config.PROCESSED_DATA_PATH
    
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)
    
    print(f"Data directory: {data_dir}")
    print(f"Processed directory: {processed_dir}")
    
    # Step 1: Download arXiv sample
    sample_dir = os.path.join(data_dir, 'sample')
    sample_papers_path = download_arxiv_sample(sample_dir)
    
    # Step 2: Download World Bank sample
    worldbank_path = download_worldbank_sample(sample_dir)
    
    # Step 3: Create sample images
    images_dir = os.path.join(data_dir, 'images')
    create_sample_images(images_dir)
    
    # Step 4: Build FAISS index
    index_path, metadata_path = setup_faiss_index(processed_dir, sample_papers_path)
    
    # Summary
    print_header("Setup Complete")
    print("Sample data has been created for testing.")
    print("\nFor full datasets, use these commands:")
    print("\n1. arXiv (requires Kaggle API):")
    print("   kaggle datasets download -d Cornell-University/arxiv")
    print("\n2. World Bank:")
    print("   Visit: https://databank.worldbank.org")
    print("\n3. RVL-CDIP:")
    print("   Visit: http://www.datascienceassn.org/sites/default/files/rvl-cdip.tar.gz")
    
    print("\nFiles created:")
    print(f"  - {sample_papers_path}")
    print(f"  - {worldbank_path}")
    if index_path:
        print(f"  - {index_path}")
    if metadata_path:
        print(f"  - {metadata_path}")
    
    print("\nYou can now run the application:")
    print("  cd backend && python app.py")

if __name__ == '__main__':
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        ImageDraw = None
    
    main()