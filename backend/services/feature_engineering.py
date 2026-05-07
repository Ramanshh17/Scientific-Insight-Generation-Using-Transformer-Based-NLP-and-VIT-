import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
import re
import logging

logger = logging.getLogger(__name__)

import torch
from models.text_analyzer import TextAnalyzer

class TextFeatureEngineer:
    def __init__(self):
        self.analyzer = TextAnalyzer()
        
    def get_scibert_embeddings(self, texts, batch_size=32):
        """Generate SciBERT embeddings in batches"""
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            
            # Use the underlying model and tokenizer for batch processing
            inputs = self.analyzer.tokenizer(
                batch,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            inputs = {k: v.to(self.analyzer.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.analyzer.model(**inputs)
            
            # CLS token embeddings
            embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()
            all_embeddings.append(embeddings)
            
        return np.vstack(all_embeddings)

class FeatureEngineer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.tfidf = TfidfVectorizer(max_features=500, stop_words='english')
        self.pca = PCA(n_components=0.95)
    
    # ========== TEXT FEATURES ==========
    def engineer_text_features(self, text: str) -> dict:
        """Extract handcrafted + statistical features from text"""
        if not text or not isinstance(text, str):
            return {}
        
        features = {}
        
        # Basic stats
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        features['word_count'] = len(words)
        features['sentence_count'] = len([s for s in sentences if s.strip()])
        features['avg_word_length'] = np.mean([len(w) for w in words]) if words else 0
        features['avg_sentence_length'] = len(words) / max(len(sentences), 1)
        features['unique_word_ratio'] = len(set(words)) / max(len(words), 1)
        
        # Scientific terminology density
        sci_keywords = [
            'neural', 'quantum', 'protein', 'genome', 'algorithm',
            'hypothesis', 'experiment', 'analysis', 'model', 'data',
            'learning', 'network', 'molecular', 'statistical', 'optimization',
            'transformer', 'attention', 'embedding', 'classification', 'regression'
        ]
        text_lower = text.lower()
        features['sci_term_density'] = sum(
            1 for kw in sci_keywords if kw in text_lower
        ) / len(sci_keywords)
        
        # Structural features
        features['has_numbers'] = int(bool(re.search(r'\d', text)))
        features['number_density'] = len(re.findall(r'\d+\.?\d*', text)) / max(len(words), 1)
        features['has_equations'] = int(bool(re.search(r'[=<>≤≥±∑∫]', text)))
        features['citation_count'] = len(re.findall(r'\[\d+\]|\(\w+,\s*\d{4}\)', text))
        features['has_methodology'] = int(any(
            kw in text_lower for kw in ['method', 'approach', 'propose', 'framework']
        ))
        features['has_results'] = int(any(
            kw in text_lower for kw in ['result', 'achieve', 'performance', 'accuracy', 'show']
        ))
        features['has_conclusion'] = int(any(
            kw in text_lower for kw in ['conclude', 'future', 'limitation', 'contribute']
        ))
        
        # Readability (Flesch approximation)
        syllables = sum(max(1, len(re.findall(r'[aeiou]', w.lower()))) for w in words)
        features['readability_score'] = (
            206.835 - 1.015 * features['avg_sentence_length'] 
            - 84.6 * (syllables / max(len(words), 1))
        )
        
        return features
    
    # ========== IMAGE FEATURES ==========
    def engineer_image_features(self, image_array: np.ndarray) -> dict:
        """Extract statistical features from image arrays"""
        features = {}
        
        if image_array is None:
            return features
        
        # Convert to grayscale if needed
        if len(image_array.shape) == 3:
            gray = np.mean(image_array, axis=2)
            
            # Color channel stats
            for i, channel in enumerate(['red', 'green', 'blue']):
                ch = image_array[:, :, i]
                features[f'{channel}_mean'] = float(np.mean(ch))
                features[f'{channel}_std'] = float(np.std(ch))
                features[f'{channel}_skew'] = float(self._skewness(ch.flatten()))
        else:
            gray = image_array
        
        # Grayscale statistics
        features['brightness_mean'] = float(np.mean(gray))
        features['brightness_std'] = float(np.std(gray))
        features['contrast'] = float(np.max(gray) - np.min(gray))
        features['entropy'] = float(self._image_entropy(gray))
        
        # Texture features (simplified Haralick)
        features['texture_energy'] = float(np.sum(gray ** 2))
        features['texture_homogeneity'] = float(np.mean(
            1 / (1 + np.abs(np.diff(gray, axis=0)))
        ))
        
        # Edge density
        sobel_x = np.abs(np.diff(gray, axis=1))
        sobel_y = np.abs(np.diff(gray, axis=0))
        features['edge_density_x'] = float(np.mean(sobel_x))
        features['edge_density_y'] = float(np.mean(sobel_y))
        
        # Spatial features
        features['image_height'] = gray.shape[0]
        features['image_width'] = gray.shape[1]
        features['aspect_ratio'] = gray.shape[1] / max(gray.shape[0], 1)
        
        # Quadrant analysis
        h, w = gray.shape
        for qi, (r1, r2, c1, c2) in enumerate([
            (0, h//2, 0, w//2), (0, h//2, w//2, w),
            (h//2, h, 0, w//2), (h//2, h, w//2, w)
        ]):
            features[f'quadrant_{qi+1}_mean'] = float(np.mean(gray[r1:r2, c1:c2]))
        
        return features
    
    # ========== TABULAR FEATURES ==========
    def engineer_tabular_features(self, df: pd.DataFrame) -> dict:
        """Clean and engineer features from CSV data"""
        if df is None or df.empty:
            return {'cleaned_df': pd.DataFrame(), 'features': {}}
        
        # ---- Data Cleaning ----
        df_cleaned = df.copy()
        
        # Remove duplicates
        df_cleaned = df_cleaned.drop_duplicates()
        
        # Handle missing values
        numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
        categorical_cols = df_cleaned.select_dtypes(include=['object']).columns
        
        for col in numeric_cols:
            missing_pct = df_cleaned[col].isna().mean()
            if missing_pct > 0.5:
                df_cleaned = df_cleaned.drop(columns=[col])
            elif missing_pct > 0:
                df_cleaned[col].fillna(df_cleaned[col].median(), inplace=True)
        
        for col in categorical_cols:
            missing_pct = df_cleaned[col].isna().mean()
            if missing_pct > 0.5:
                df_cleaned = df_cleaned.drop(columns=[col])
            elif missing_pct > 0:
                df_cleaned[col].fillna(df_cleaned[col].mode()[0], inplace=True)
        
        # Remove outliers (IQR method)
        numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            Q1 = df_cleaned[col].quantile(0.25)
            Q3 = df_cleaned[col].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            df_cleaned[col] = df_cleaned[col].clip(lower, upper)
        
        # Encode categoricals
        for col in categorical_cols:
            if col in df_cleaned.columns:
                if df_cleaned[col].nunique() <= 10:
                    le = LabelEncoder()
                    df_cleaned[f'{col}_encoded'] = le.fit_transform(
                        df_cleaned[col].astype(str)
                    )
                    self.label_encoders[col] = le
        
        # ---- Feature Engineering ----
        features = {}
        numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            series = df_cleaned[col]
            features[f'{col}_mean'] = float(series.mean())
            features[f'{col}_std'] = float(series.std())
            features[f'{col}_min'] = float(series.min())
            features[f'{col}_max'] = float(series.max())
            features[f'{col}_skew'] = float(series.skew())
            features[f'{col}_kurt'] = float(series.kurtosis())
            features[f'{col}_q25'] = float(series.quantile(0.25))
            features[f'{col}_q75'] = float(series.quantile(0.75))
            features[f'{col}_cv'] = float(series.std() / series.mean()) if series.mean() != 0 else 0
        
        # Correlation features
        if len(numeric_cols) > 1:
            corr_matrix = df_cleaned[numeric_cols].corr()
            high_corr_pairs = []
            for i in range(len(numeric_cols)):
                for j in range(i+1, len(numeric_cols)):
                    corr_val = corr_matrix.iloc[i, j]
                    if abs(corr_val) > 0.7:
                        high_corr_pairs.append({
                            'col1': numeric_cols[i],
                            'col2': numeric_cols[j],
                            'correlation': round(float(corr_val), 3)
                        })
            features['high_correlation_pairs'] = high_corr_pairs
            features['avg_correlation'] = float(
                corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)].mean()
            )
        
        # Dataset-level features
        features['row_count'] = len(df_cleaned)
        features['col_count'] = len(df_cleaned.columns)
        features['missing_pct_original'] = float(df.isna().mean().mean())
        features['numeric_col_count'] = int(len(numeric_cols))
        features['data_quality_score'] = float(
            1 - df.isna().mean().mean()
        ) * 100
        
        return {
            'cleaned_df': df_cleaned,
            'features': features,
            'numeric_columns': list(numeric_cols),
            'categorical_columns': list(categorical_cols)
        }
    
    # ========== HELPERS ==========
    def _skewness(self, arr):
        n = len(arr)
        if n < 3:
            return 0
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return 0
        return (n / ((n-1) * (n-2))) * np.sum(((arr - mean) / std) ** 3)
    
    def _image_entropy(self, gray):
        hist, _ = np.histogram(gray.flatten(), bins=256, range=(0, 256))
        hist = hist / hist.sum()
        hist = hist[hist > 0]
        return -np.sum(hist * np.log2(hist))

feature_engineer = FeatureEngineer()