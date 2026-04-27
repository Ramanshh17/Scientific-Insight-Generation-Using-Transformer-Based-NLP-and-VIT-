# backend/services/search_service.py

import faiss
import numpy as np
import pandas as pd
import pickle
import os
from tqdm import tqdm


class ArXivSearchService:
    """
    Semantic search over the ArXiv corpus using FAISS.
    
    Why FAISS over keyword search:
    A paper on "neural networks for drug discovery" and a paper on
    "deep learning in pharmaceutical development" address the same topic
    but share few keywords. FAISS compares embedding vectors, finding
    conceptually similar papers regardless of vocabulary differences.
    
    Why IndexIVFFlat over exact search:
    With 500K+ vectors of 768 dimensions, exact search takes seconds per
    query. IndexIVFFlat partitions the space into Voronoi cells using
    k-means clustering. At query time, only nearby cells are searched,
    reducing search time from O(n) to O(sqrt(n)) with minimal accuracy loss.
    """
    
    def __init__(self, embedding_dim=768):
        self.embedding_dim = embedding_dim
        self.index = None
        self.paper_metadata = None
        self.id_to_metadata = {}
        
    def build_index(self, embeddings, metadata_df):
        """
        Build FAISS index from paper embeddings.
        
        Process:
        1. Normalize embeddings to unit sphere (enables cosine similarity)
        2. Train IVF index with k-means clustering
        3. Add all vectors
        4. Save index and metadata
        
        IVF parameters:
        - nlist=1000: 1000 Voronoi cells. Rule of thumb: sqrt(n_vectors)
        - nprobe=50: Search 50 cells at query time. Higher = more accurate but slower
        """
        n_vectors = embeddings.shape[0]
        print(f"Building FAISS index for {n_vectors} vectors...")
        
        # Normalize to unit vectors for cosine similarity
        # After normalization, L2 distance equals (2 - 2*cosine_similarity)
        faiss.normalize_L2(embeddings)
        
        # IVF index with flat (exact) cell search
        nlist = min(1000, int(np.sqrt(n_vectors)))
        quantizer = faiss.IndexFlatL2(self.embedding_dim)
        self.index = faiss.IndexIVFFlat(quantizer, self.embedding_dim, nlist)
        
        # Train the index (runs k-means clustering)
        print("Training FAISS index (k-means clustering)...")
        self.index.train(embeddings)
        
        # Add all vectors
        self.index.add(embeddings)
        
        # Set search precision
        self.index.nprobe = 50
        
        # Store metadata for result retrieval
        self.paper_metadata = metadata_df.reset_index(drop=True)
        
        print(f"Index built with {self.index.ntotal} vectors")
        
    def save(self, index_path, metadata_path):
        """Persist index and metadata to disk."""
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        faiss.write_index(self.index, index_path)
        self.paper_metadata.to_parquet(metadata_path)
        print(f"Index saved to {index_path}")
        
    def load(self, index_path, metadata_path):
        """Load pre-built index from disk."""
        self.index = faiss.read_index(index_path)
        self.index.nprobe = 50
        self.paper_metadata = pd.read_parquet(metadata_path)
        print(f"Loaded index with {self.index.ntotal} vectors")
        
    def search(self, query_embedding, k=10, category_filter=None):
        """
        Find k most semantically similar papers to query embedding.
        
        Returns list of dicts with paper metadata and similarity scores.
        Similarity is converted from L2 distance to cosine similarity score.
        """
        # Normalize query vector
        query = query_embedding.reshape(1, -1).astype(np.float32)
        faiss.normalize_L2(query)
        
        # Search index
        distances, indices = self.index.search(query, k * 3)  # Get more for filtering
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:  # Invalid index
                continue
                
            paper = self.paper_metadata.iloc[idx]
            
            # Optional category filter
            if category_filter:
                if not any(cat in str(paper.get('categories', '')) 
                          for cat in category_filter):
                    continue
            
            # Convert L2 distance to similarity score (0 to 1)
            # For normalized vectors: similarity = 1 - dist/2
            similarity = float(1 - dist / 2)
            
            results.append({
                'id': str(paper.get('id', '')),
                'title': str(paper.get('title_clean', paper.get('title', ''))),
                'abstract': str(paper.get('abstract_clean', ''))[:500],
                'year': int(paper.get('year', 0)),
                'categories': str(paper.get('categories', '')),
                'similarity': round(similarity, 4),
                'arxiv_url': f"https://arxiv.org/abs/{paper.get('id', '')}"
            })
            
            if len(results) >= k:
                break
        
        return sorted(results, key=lambda x: x['similarity'], reverse=True)
    
    def detect_trends(self, category, start_year=2018, end_year=2024):
        """
        Analyze publication volume trends for a specific ArXiv category.
        
        Returns year-by-year paper counts and identifies growth rate,
        which indicates emerging vs. mature research areas.
        """
        if self.paper_metadata is None:
            return {}
        
        cat_papers = self.paper_metadata[
            self.paper_metadata['categories'].str.contains(category, na=False)
        ]
        
        yearly_counts = (
            cat_papers[
                (cat_papers['year'] >= start_year) & 
                (cat_papers['year'] <= end_year)
            ]
            .groupby('year')
            .size()
            .to_dict()
        )
        
        # Calculate year-over-year growth rate
        years = sorted(yearly_counts.keys())
        growth_rates = {}
        for i in range(1, len(years)):
            prev = yearly_counts.get(years[i-1], 1)
            curr = yearly_counts.get(years[i], 0)
            growth_rates[years[i]] = round((curr - prev) / prev * 100, 1)
        
        return {
            'category': category,
            'yearly_counts': yearly_counts,
            'growth_rates': growth_rates,
            'total_papers': len(cat_papers),
            'peak_year': max(yearly_counts, key=yearly_counts.get) if yearly_counts else None
        }