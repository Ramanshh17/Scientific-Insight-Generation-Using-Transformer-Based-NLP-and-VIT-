# backend/build_index.py
# Run this script once after preprocessing to build the search index

import numpy as np
import pandas as pd
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from services.feature_engineering import TextFeatureEngineer
from services.search_service import ArXivSearchService
from tqdm import tqdm


def build_arxiv_index():
    """
    Build the FAISS search index from processed ArXiv data.
    
    Process:
    1. Load preprocessed ArXiv data
    2. Generate SciBERT embeddings for all papers in batches
    3. Build FAISS IVFFlat index
    4. Save index and metadata to disk
    
    This is a one-time operation. After building, the index
    is loaded from disk on each server startup, taking seconds
    instead of hours.
    
    Expected runtime: 2-6 hours on CPU, 30-60 minutes on GPU
    Expected storage: ~1.5GB for 200K papers
    """
    print("Loading processed ArXiv data...")
    df = pd.read_parquet(
        os.path.join(Config.PROCESSED_DATA_PATH, 'arxiv_processed.parquet')
    )
    
    print(f"Total papers: {len(df)}")
    print(f"Category distribution:\n{df['primary_category'].value_counts().head(10)}")
    
    # Use combined text for richer embeddings
    texts = df['full_text'].fillna(df['title_clean']).tolist()
    
    # Initialize text engineer
    engineer = TextFeatureEngineer()
    
    # Generate embeddings in batches
    print("Generating SciBERT embeddings...")
    all_embeddings = []
    batch_size = 64
    
    for i in tqdm(range(0, len(texts), batch_size)):
        batch = texts[i:i+batch_size]
        embeddings = engineer.get_scibert_embeddings(batch, batch_size=batch_size)
        all_embeddings.append(embeddings)
    
    embeddings_matrix = np.vstack(all_embeddings).astype(np.float32)
    print(f"Embeddings shape: {embeddings_matrix.shape}")
    
    # Save embeddings for reuse
    os.makedirs(Config.EMBEDDINGS_PATH, exist_ok=True)
    np.save(
        os.path.join(Config.EMBEDDINGS_PATH, 'arxiv_embeddings.npy'),
        embeddings_matrix
    )
    
    # Build FAISS index
    search_service = ArXivSearchService(embedding_dim=768)
    search_service.build_index(embeddings_matrix, df)
    
    # Save index
    os.makedirs(os.path.dirname(Config.FAISS_INDEX_PATH), exist_ok=True)
    search_service.save(
        Config.FAISS_INDEX_PATH,
        os.path.join(Config.PROCESSED_DATA_PATH, 'arxiv_processed.parquet')
    )
    
    print("Index building complete.")
    print(f"Index location: {Config.FAISS_INDEX_PATH}")
    print(f"Embeddings location: {Config.EMBEDDINGS_PATH}")


if __name__ == "__main__":
    build_arxiv_index()