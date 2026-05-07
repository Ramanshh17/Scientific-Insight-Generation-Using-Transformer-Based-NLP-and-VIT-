"""
InsightGenerator - Generates insights from multimodal analysis results
"""

import numpy as np
import pandas as pd
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import re

logger = logging.getLogger(__name__)


class InsightGenerator:
    """Generates insights from multimodal analysis results."""
    
    def __init__(self):
        self.similar_papers_cache = {}
        self.insights_cache = {}
        
    def generate_insights(self, context: str, categories: List[Dict]) -> Dict[str, Any]:
        """Generate insights from context and categories."""
        try:
            # Generate category insights
            top_category = categories[0] if categories else None
            category_insights = self._analyze_categories(categories)
            
            # Generate method insights
            method_insights = self._analyze_methods(context)
            
            # Generate dataset insights
            dataset_insights = self._analyze_datasets(context)
            
            # Generate metric insights
            metric_insights = self._analyze_metrics(context)
            
            # Generate summary
            summary = self._generate_summary(context, categories)
            
            return {
                'predicted_categories': categories,
                'category_analysis': category_insights,
                'methods': method_insights,
                'datasets': dataset_insights,
                'metrics': metric_insights,
                'summary': summary,
                'related_papers': []
            }
            
        except Exception as e:
            logger.error(f"Insight generation error: {e}")
            return {
                'predicted_categories': categories,
                'summary': f"Analysis completed with {len(categories)} categories",
                'related_papers': []
            }
    
    def _analyze_categories(self, categories: List[Dict]) -> Dict[str, Any]:
        """Analyze category predictions."""
        if not categories:
            return {}
        
        top_cat = categories[0]
        insights = {
            'primary_category': top_cat['category'],
            'confidence': top_cat['confidence'],
            'interpretation': self._interpret_category(top_cat['category'], top_cat['confidence'])
        }
        
        if len(categories) > 1:
            second_cat = categories[1]
            insights['secondary_category'] = second_cat['category']
            insights['gap'] = top_cat['confidence'] - second_cat['confidence']
            
        return insights
    
    def _interpret_category(self, category: str, confidence: float) -> str:
        """Interpret what a category means."""
        interpretations = {
            'Artificial Intelligence': 'General AI research including algorithms, theory, and applications',
            'Machine Learning': 'Statistical learning methods, neural networks, and predictive modeling',
            'Computer Vision': 'Image processing, object detection, and visual understanding',
            'Computational Physics': 'Physics simulations, numerical methods, and scientific computing',
            'Bioinformatics': 'Biological data analysis, genomics, and computational biology',
            'Statistical ML': 'Statistical methods, probabilistic models, and inference',
            'Mathematical Statistics': 'Theoretical statistics, probability theory, and mathematical foundations'
        }
        
        base_interp = interpretations.get(category, 'Scientific research in this domain')
        
        if confidence > 0.8:
            return f"High confidence in {base_interp.lower()}"
        elif confidence > 0.6:
            return f"Moderate confidence in {base_interp.lower()}"
        else:
            return f"Preliminary indication of {base_interp.lower()}"
    
    def _analyze_methods(self, context: str) -> List[str]:
        """Extract and analyze methods mentioned in context."""
        methods = []
        method_patterns = [
            r'\b(CNN|RNN|LSTM|GRU|Transformer|BERT|GPT|ResNet|VGG|GAN|VAE|ViT)\b',
            r'\b(attention|deep learning|reinforcement learning|supervised learning|unsupervised learning)\b',
            r'\b(SVM|Random Forest|XGBoost|Logistic Regression|K-means)\b'
        ]
        
        import re
        for pattern in method_patterns:
            found = re.findall(pattern, context, re.IGNORECASE)
            methods.extend(found)
        
        return list(set(methods))
    
    def _analyze_datasets(self, context: str) -> List[str]:
        """Extract datasets mentioned in context."""
        datasets = []
        dataset_patterns = [
            r'\b(ImageNet|MNIST|CIFAR|COCO|WikiText|SQuAD|GLUE|SuperGLUE|Pascal VOC)\b',
            r'\b(ArXiv|PubMed|Kaggle|UCI)\b'
        ]
        
        import re
        for pattern in dataset_patterns:
            found = re.findall(pattern, context, re.IGNORECASE)
            datasets.extend(found)
        
        return list(set(datasets))
    
    def _analyze_metrics(self, context: str) -> List[str]:
        """Extract metrics mentioned in context."""
        metrics = []
        metric_patterns = [
            r'\b(accuracy|precision|recall|F1|AUC|RMSE|MAE|BLEU|ROUGE)\b',
            r'\b(\d+\.?\d*\s*%)\b'
        ]
        
        import re
        for pattern in metric_patterns:
            found = re.findall(pattern, context, re.IGNORECASE)
            metrics.extend(found)
        
        return list(set(metrics))
    
    def _generate_summary(self, context: str, categories: List[Dict]) -> str:
        """Generate a summary of the analysis."""
        if not context:
            return "Empty context provided for analysis."
        
        # Get key information
        top_category = categories[0]['category'] if categories else "Unknown"
        methods = self._analyze_methods(context)
        datasets = self._analyze_datasets(context)
        metrics = self._analyze_metrics(context)
        
        # Generate summary
        summary_parts = []
        summary_parts.append(f"Analysis suggests research in {top_category}")
        
        if methods:
            top_methods = methods[:3]
            summary_parts.append(f"Methods: {', '.join(top_methods)}")
        
        if datasets:
            top_datasets = datasets[:3]
            summary_parts.append(f"Datasets: {', '.join(top_datasets)}")
        
        if metrics:
            top_metrics = metrics[:3]
            summary_parts.append(f"Metrics: {', '.join(top_metrics)}")
        
        result_summary = ". ".join(summary_parts) + "."
        return result_summary
    
    def find_similar(self, embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """Find similar papers based on embedding."""
        try:
            # Try to load embeddings and papers
            papers_path = Path('data/processed/papers_metadata.csv')
            embeddings_path = Path('data/embeddings/text_embeddings.npy')
            
            if not papers_path.exists() or not embeddings_path.exists():
                return []
            
            # Load data
            papers_df = pd.read_csv(papers_path)
            embeddings = np.load(embeddings_path)
            
            if len(embeddings) != len(papers_df):
                return []
            
            # Compute similarities
            similarities = np.dot(embeddings, embedding) / (
                np.linalg.norm(embeddings, axis=1) * np.linalg.norm(embedding)
            )
            
            # Get top k
            top_indices = np.argsort(similarities)[::-1][:k]
            
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.1:  # Threshold
                    paper = papers_df.iloc[idx]
                    results.append({
                        'title': paper.get('title', ''),
                        'category': paper.get('categories', ''),
                        'similarity_score': float(similarities[idx])
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Similarity search error: {e}")
            return []