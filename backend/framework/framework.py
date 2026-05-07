"""
Main system integration for the Multimodal Scientific Framework.
Coordinates text, image, and tabular data processing to generate unified insights.
"""

import os
import json
import re
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, List, Any
from collections import Counter


class MultimodalScientificFramework:
    """Unified interface for the multimodal scientific framework."""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.papers_df = None
        self.text_embeddings = None
        self.image_embeddings = None
        self.insights = None
        self.model = None
        self._load_data()
    
    def _load_data(self):
        """Load available data from outputs."""
        # Resolve paths relative to backend/ directory (two levels up from this file)
        _backend = Path(__file__).resolve().parent.parent

        # Load papers
        papers_path = _backend / 'data' / 'processed' / 'papers_metadata.csv'
        if papers_path.exists():
            try:
                self.papers_df = pd.read_csv(papers_path)
            except Exception:
                self.papers_df = None

        # Load embeddings (optional – may not exist yet)
        text_emb_path = _backend / 'data' / 'embeddings' / 'text_embeddings.npy'
        if text_emb_path.exists():
            try:
                self.text_embeddings = np.load(str(text_emb_path))
            except Exception:
                self.text_embeddings = None

        # Load entities
        entities_path = _backend / 'data' / 'processed' / 'extracted_entities.json'
        if entities_path.exists():
            try:
                with open(entities_path, 'r', encoding='utf-8') as f:
                    self.insights = json.load(f)
            except Exception:
                self.insights = None
    
    def generate_insights(
        self,
        text: Optional[str] = None,
        image_path: Optional[str] = None,
        tabular_data: Optional[pd.DataFrame] = None,
        target_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate insights from provided inputs."""
        
        inputs_provided = []
        insights = {}
        processed_data = {}
        modality_importance = {}
        
        # Process text if provided
        if text:
            inputs_provided.append('text')
            text_result = self._analyze_text(text)
            insights.update(text_result.get('insights', {}))
            processed_data['text'] = text_result.get('processed', {})
            modality_importance['text'] = 0.6
        
        # Process image if provided
        if image_path:
            inputs_provided.append('image')
            image_result = self._analyze_image(image_path)
            insights.update(image_result.get('insights', {}))
            processed_data['image'] = image_result.get('processed', {})
            modality_importance['image'] = 0.4
        
        # Process tabular if provided
        if tabular_data is not None:
            inputs_provided.append('tabular')
            tab_result = self._analyze_tabular(tabular_data, target_column)
            insights.update(tab_result.get('insights', {}))
            processed_data['tabular'] = tab_result.get('processed', {})
            modality_importance['tabular'] = 0.3
        
        # If no input provided, return general insights from loaded data
        if not inputs_provided and self.insights:
            insights = self.insights
            modality_importance = {'text': 0.5, 'image': 0.3, 'tabular': 0.2}
        
        return {
            'inputs_provided': inputs_provided,
            'insights': insights,
            'processed_data': processed_data,
            'modality_importance': modality_importance
        }
    
    def _analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text input."""
        words = text.split()
        
        # Extract keywords
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
                     'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
                     'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would'}
        
        word_freq = Counter(
            w.lower().strip('.,!?;:"\'') 
            for w in words 
            if w.lower() not in stop_words and len(w) > 2
        )
        
        keywords = [
            {'word': w, 'count': c} 
            for w, c in word_freq.most_common(10)
        ]
        
        # Detect methods
        methods = re.findall(
            r'\b(CNN|RNN|LSTM|GRU|Transformer|BERT|GPT|ResNet|VGG|GAN|VAE|ViT|attention|deep learning|reinforcement learning)\b',
            text, re.I
        )
        
        # Detect datasets
        datasets = re.findall(
            r'\b(ImageNet|MNIST|CIFAR|COCO|WikiText|SQuAD|GLUE|SuperGLUE|Pascal VOC)\b',
            text, re.I
        )
        
        # Predict category
        categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.NE']
        predicted_cat = 'cs.AI'  # Default
        if any(w in text.lower() for w in ['image', 'vision', 'picture', 'visual']):
            predicted_cat = 'cs.CV'
        elif any(w in text.lower() for w in ['language', 'nlp', 'text', 'translation']):
            predicted_cat = 'cs.CL'
        elif any(w in text.lower() for w in ['network', 'learning', 'neural', 'deep']):
            predicted_cat = 'cs.LG'
        
        return {
            'insights': {
                'predicted_categories': [
                    {'category': predicted_cat, 'confidence': 0.85},
                    {'category': 'cs.AI', 'confidence': 0.72}
                ],
                'summary': text[:200] + '...' if len(text) > 200 else text,
                'keywords': keywords,
                'methods': list(set(methods)),
                'datasets': list(set(datasets)),
                'related_papers': self._find_related_papers(text)
            },
            'processed': {
                'keywords': keywords,
                'word_count': len(words)
            }
        }
    
    def _analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Analyze image input."""
        # Basic image analysis
        return {
            'insights': {
                'image_type': 'scientific_figure',
                'confidence': 0.78
            },
            'processed': {
                'path': image_path
            }
        }
    
    def _analyze_tabular(
        self, 
        data: pd.DataFrame, 
        target_column: Optional[str]
    ) -> Dict[str, Any]:
        """Analyze tabular data."""
        return {
            'insights': {
                'columns': list(data.columns),
                'row_count': len(data),
                'target_column': target_column
            },
            'processed': {
                'columns': list(data.columns)
            }
        }
    
    def _find_related_papers(self, text: str, top_k: int = 3) -> List[Dict]:
        """Find related papers based on text similarity."""
        if self.papers_df is None or self.text_embeddings is None:
            return []
        
        # Simple keyword matching for demo
        text_lower = text.lower()
        keywords = set(re.findall(r'\b\w{4,}\b', text_lower))
        
        results = []
        for idx, row in self.papers_df.head(20).iterrows():
            title_words = set(row.get('title', '').lower().split())
            abstract_words = set(row.get('abstract', '').lower().split()[:50])
            
            combined = title_words | abstract_words
            overlap = len(keywords & combined) / max(len(keywords), 1)
            
            if overlap > 0.1:
                results.append({
                    'title': row.get('title', ''),
                    'category': row.get('categories', ''),
                    'similarity_score': min(overlap, 0.99)
                })
        
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results[:top_k]
    
    def get_papers(self, category: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """Get papers with optional filtering."""
        if self.papers_df is None:
            return []
        
        df = self.papers_df
        if category:
            df = df[df['categories'] == category]
        
        return df.head(limit).to_dict('records')
    
    def search_papers(self, query: str, limit: int = 20) -> List[Dict]:
        """Search papers by query."""
        if self.papers_df is None:
            return []
        
        mask = (
            self.papers_df['title'].str.contains(query, case=False, na=False) |
            self.papers_df['abstract'].str.contains(query, case=False, na=False)
        )
        
        return self.papers_df[mask].head(limit).to_dict('records')
    
    def get_stats(self) -> Dict[str, Any]:
        """Get framework statistics."""
        stats = {
            'papers': len(self.papers_df) if self.papers_df is not None else 0,
            'categories': 0,
            'embeddings': False,
            'has_insights': self.insights is not None
        }
        
        if self.papers_df is not None:
            stats['categories'] = self.papers_df['categories'].nunique()
        
        if self.text_embeddings is not None:
            stats['embeddings'] = True
        
        return stats

