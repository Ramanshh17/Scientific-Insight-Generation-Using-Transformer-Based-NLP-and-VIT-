#!/usr/bin/env python3
"""Build FAISS index from arXiv dataset for semantic retrieval"""

import json
import os
import sys
import numpy as np
import faiss
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from config import Config

def load_arxiv_metadata(filepath: str, limit: int = None) -> list:
    """Load arXiv metadata from JSONL file"""
    papers = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if limit and i >= limit:
                break
            try:
                paper = json.loads(line)
                # Filter: must have abstract and category
                if paper.get('abstract') and paper.get('categories'):
                    papers.append(paper)
            except json.JSONDecodeError:
                continue
    return papers

def build_index(papers: list, output_dir: str, batch_size: int = 128):
    """Build FAISS IVF index from paper embeddings"""
    
    print(f"Loading encoder: {Config.TEXT_ENCODER}")
    encoder = SentenceTransformer(Config.TEXT_ENCODER)
    encoder = encoder.to(Config.DEVICE)
    
    print(f"Encoding {len(papers)} papers...")
    embeddings = []
    metadata = []
    
    for i in tqdm(range(0, len(papers), batch_size), desc="Encoding"):
        batch = papers[i:i+batch_size]
        # Create search text: title + abstract
        texts = [f"{p['title']}. {p['abstract']}" for p in batch]
        
        # Encode and normalize
        embs = encoder.encode(
            texts, 
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True  # L2 normalize for cosine similarity
        )
        embeddings.append(embs.astype('float32'))
        
        # Store metadata for retrieval results
        for p in batch:
            metadata.append({
                'id': p.get('id', ''),
                'title': p.get('title', ''),
                'abstract': p.get('abstract', ''),
                'authors': p.get('authors', []),
                'categories': p.get('categories', []),
                'updated': p.get('updated', '')
            })
    
    # Concatenate all embeddings
    all_embeddings = np.vstack(embeddings)
    print(f"Final embedding shape: {all_embeddings.shape}")
    
    # Build FAISS IVF index
    print("Building FAISS IVF index...")
    dimension = all_embeddings.shape[1]  # 384 for all-MiniLM-L6-v2
    
    # Quantizer for coarse quantization
    quantizer = faiss.IndexFlatL2(dimension)
    
    # IVF index with configurable centroids
    index = faiss.IndexIVFFlat(quantizer, dimension, Config.FAISS_N_CENTROIDS, faiss.METRIC_L2)
    
    # Train the index (k-means clustering for Voronoi cells)
    index.train(all_embeddings)
    
    # Add vectors to index
    index.add(all_embeddings)
    
    # Set nprobe for query-time accuracy/speed tradeoff
    index.nprobe = Config.FAISS_NPROBE
    
    # Save index
    os.makedirs(output_dir, exist_ok=True)
    index_path = os.path.join(output_dir, 'arxiv.index')
    faiss.write_index(index, index_path)
    print(f"✓ Index saved to {index_path}")
    
    # Save metadata
    metadata_path = os.path.join(output_dir, 'arxiv_metadata.jsonl')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        for paper in metadata:
            f.write(json.dumps(paper) + '\n')
    print(f"✓ Metadata saved to {metadata_path}")
    
    # Report stats
    print(f"\n📊 Index Statistics:")
    print(f"  • Total papers: {len(metadata):,}")
    print(f"  • Embedding dimension: {dimension}")
    print(f"  • IVF centroids: {Config.FAISS_N_CENTROIDS}")
    print(f"  • Index size: {os.path.getsize(index_path) / 1024 / 1024:.1f} MB")
    
    # Quick validation
    print("\n🔍 Testing retrieval...")
    test_query = "machine learning neural networks"
    query_emb = encoder.encode([test_query], normalize_embeddings=True).astype('float32')
    distances, indices = index.search(query_emb, 3)
    
    print(f"Top results for '{test_query}':")
    for i, (idx, dist) in enumerate(zip(indices[0], distances[0]), 1):
        if idx != -1:
            paper = metadata[idx]
            similarity = 1 / (1 + dist)
            print(f"  {i}. [{similarity:.3f}] {paper['title'][:80]}...")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Build FAISS index for arXiv papers')
    parser.add_argument('--input', type=str, required=True, 
                       help='Path to arxiv-metadata-oai-snapshot.jsonl')
    parser.add_argument('--output', type=str, default=Config.DATA_DIR,
                       help='Output directory for index files')
    parser.add_argument('--limit', type=int, default=None,
                       help='Limit number of papers to process (for testing)')
    
    args = parser.parse_args()
    
    print(f"Loading papers from {args.input}...")
    papers = load_arxiv_metadata(args.input, limit=args.limit)
    print(f"Loaded {len(papers)} valid papers")
    
    build_index(papers, args.output)