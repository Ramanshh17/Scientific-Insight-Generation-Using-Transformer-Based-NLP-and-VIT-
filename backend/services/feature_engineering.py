# backend/services/feature_engineering.py

import pandas as pd
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import StandardScaler, RobustScaler
import re
from collections import Counter
import warnings
warnings.filterwarnings('ignore')


class TextFeatureEngineer:
    """
    Transforms scientific text into numerical features.
    
    Why we use multiple feature types:
    1. SciBERT embeddings capture semantic meaning
    2. TF-IDF captures domain-specific term importance
    3. Statistical features capture writing style and complexity
    4. Together they give the model multiple lenses on the same text
    """
    
    def __init__(self, model_name="allenai/scibert_scivocab_uncased"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
        # TF-IDF for complementary lexical features
        self.tfidf = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),  # Unigrams, bigrams, trigrams
            min_df=1,            # Allow fitting on small warmup corpora
            max_df=0.95,         # Ignore terms in more than 95% of docs
            sublinear_tf=True    # Apply log normalization to TF
        )
        self.svd = TruncatedSVD(n_components=128, random_state=42)
        self.is_fitted = False
        
        # Scientific domain keywords for domain detection
        self.domain_keywords = {
            'ml_ai': ['neural', 'deep learning', 'gradient', 'optimization', 
                      'training', 'inference', 'model', 'accuracy', 'loss'],
            'quantum': ['qubit', 'entanglement', 'superposition', 'decoherence',
                       'quantum circuit', 'hamiltonian', 'eigenvalue'],
            'biology': ['protein', 'gene', 'cell', 'dna', 'rna', 'mutation',
                       'genome', 'metabolite', 'enzyme', 'pathogen'],
            'physics': ['particle', 'field', 'energy', 'momentum', 'wave',
                       'photon', 'electron', 'magnetic', 'thermal']
        }

        # Warm-up fit to prevent "not fitted" errors
        # Why: TF-IDF needs at least one docs to establish a vocabulary
        warmup_texts = [
            "Neural networks and deep learning for scientific optimization.",
            "Quantum entanglement and superposition in Hamiltonian systems.",
            "Genetic mutations and DNA RNA protein interactions.",
            "Particle physics field theory and momentum wave equations."
        ]
        self.fit_tfidf(warmup_texts)
    
    def get_scibert_embeddings(self, texts, batch_size=16):
        """
        Generate SciBERT embeddings using mean pooling over token outputs.
        
        Why mean pooling over [CLS] token:
        Mean pooling aggregates information from all tokens, giving a more
        complete sentence representation. [CLS] token alone captures global
        context but misses token-level details that matter for technical text.
        
        Returns: numpy array of shape (n_texts, 768)
        """
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            
            encoded = self.tokenizer(
                batch,
                max_length=512,
                padding=True,
                truncation=True,
                return_tensors='pt'
            )
            encoded = {k: v.to(self.device) for k, v in encoded.items()}
            
            with torch.no_grad():
                outputs = self.model(**encoded)
                
            # Mean pooling with attention mask
            token_embeddings = outputs.last_hidden_state
            attention_mask = encoded['attention_mask']
            
            # Expand mask to match embedding dimensions
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(
                token_embeddings.size()
            ).float()
            
            # Sum embeddings for non-padding tokens
            sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
            sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            
            embeddings = (sum_embeddings / sum_mask).cpu().numpy()
            all_embeddings.append(embeddings)
        
        return np.vstack(all_embeddings)
    
    def extract_statistical_features(self, texts):
        """
        Compute handcrafted statistical features from scientific text.
        
        These features complement neural embeddings by capturing
        document structure and domain signals that transformers
        may smooth over due to their fixed context window.
        """
        features = []
        
        for text in texts:
            if not isinstance(text, str) or len(text) == 0:
                features.append(np.zeros(20))
                continue
            
            words = text.lower().split()
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
            
            feat = []
            
            # Length features
            feat.append(len(words))                          # Total word count
            feat.append(len(sentences))                      # Sentence count
            feat.append(np.mean([len(s.split()) for s in sentences]) if sentences else 0)  # Avg sentence length
            feat.append(np.std([len(s.split()) for s in sentences]) if sentences else 0)   # Sentence length variance
            
            # Vocabulary richness
            unique_words = set(words)
            feat.append(len(unique_words) / (len(words) + 1))  # Type-token ratio
            
            # Average word length (longer in technical domains)
            feat.append(np.mean([len(w) for w in words]) if words else 0)
            
            # Domain keyword counts
            text_lower = text.lower()
            for domain, keywords in self.domain_keywords.items():
                count = sum(1 for kw in keywords if kw in text_lower)
                feat.append(count / len(keywords))  # Normalized keyword density
            
            # Numerical content ratio (papers with experiments have more numbers)
            numbers = re.findall(r'\b\d+\.?\d*\b', text)
            feat.append(len(numbers) / (len(words) + 1))
            
            # Citation-like patterns
            citations = re.findall(r'\[\d+\]|\(\w+,\s*\d{4}\)', text)
            feat.append(len(citations))
            
            # Methodology indicators
            method_words = ['propose', 'present', 'introduce', 'novel', 
                           'demonstrate', 'evaluate', 'compare', 'achieve']
            feat.append(sum(1 for w in method_words if w in text_lower))
            
            # Result indicators
            result_words = ['outperform', 'improve', 'state-of-the-art', 
                           'accuracy', 'precision', 'recall', 'f1']
            feat.append(sum(1 for w in result_words if w in text_lower))
            
            # Pad or truncate to fixed size
            while len(feat) < 20:
                feat.append(0.0)
            feat = feat[:20]
            
            features.append(feat)
        
        return np.array(features)
    
    def fit_tfidf(self, texts):
        """Fit TF-IDF on corpus, then reduce to 128 dimensions with SVD."""
        tfidf_matrix = self.tfidf.fit_transform(texts)
        # Handle cases where we have fewer features than components
        n_features = tfidf_matrix.shape[1]
        actual_components = min(128, n_features - 1) if n_features > 1 else 1
        
        if actual_components != self.svd.n_components:
            self.svd = TruncatedSVD(n_components=actual_components, random_state=42)
            
        self.svd.fit(tfidf_matrix)
        self.is_fitted = True
        return self.svd.transform(tfidf_matrix)
    
    def transform_tfidf(self, texts):
        """Transform new texts using fitted TF-IDF and SVD."""
        if not self.is_fitted:
            # Return zeros if not fitted to avoid crash during cold start
            return np.zeros((len(texts), self.svd.n_components))
        tfidf_matrix = self.tfidf.transform(texts)
        return self.svd.transform(tfidf_matrix)
    
    def engineer_all_features(self, texts, fit=True):
        """
        Combine all feature types into final feature matrix.
        
        Final feature vector per document:
        - SciBERT embeddings: 768 dimensions (semantic meaning)
        - TF-IDF + SVD: 128 dimensions (lexical importance)
        - Statistical: 20 dimensions (structural signals)
        Total: 916 dimensions per document
        """
        print("Generating SciBERT embeddings...")
        bert_features = self.get_scibert_embeddings(list(texts))
        
        print("Computing TF-IDF features...")
        if fit:
            tfidf_features = self.fit_tfidf(list(texts))
        else:
            tfidf_features = self.transform_tfidf(list(texts))
        
        print("Extracting statistical features...")
        stat_features = self.extract_statistical_features(list(texts))
        
        # Normalize statistical features to same scale as embeddings
        scaler = RobustScaler()  # RobustScaler handles outliers better than StandardScaler
        stat_features_scaled = scaler.fit_transform(stat_features)
        
        # Concatenate all features
        combined = np.hstack([bert_features, tfidf_features, stat_features_scaled])
        
        return combined, {
            'bert_dim': bert_features.shape[1],
            'tfidf_dim': tfidf_features.shape[1],
            'stat_dim': stat_features_scaled.shape[1],
            'total_dim': combined.shape[1]
        }


class TabularFeatureEngineer:
    """
    Processes uploaded CSV experimental data.
    
    Why specialized tabular engineering:
    Raw CSV files from experiments contain mixed scales, missing values,
    and implicit relationships between columns. This module normalizes,
    imputes, and extracts cross-column features before feeding to
    the Gated Residual Network.
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.column_stats = {}
        
    def detect_column_types(self, df):
        """
        Classify columns as numerical measurements, categorical labels,
        or identifiers. Each type requires different treatment.
        """
        col_types = {}
        for col in df.columns:
            if df[col].dtype in ['float64', 'float32', 'int64', 'int32']:
                col_types[col] = 'numerical'
            elif df[col].nunique() / len(df) < 0.05:  # Less than 5% unique = categorical
                col_types[col] = 'categorical'
            else:
                col_types[col] = 'identifier'
        return col_types
    
    def handle_missing_values(self, df, col_types):
        """
        Domain-aware imputation strategy.
        
        Why not simple mean imputation:
        Scientific measurements missing at random vs missing due to below
        detection limit have different meanings. We use median for numerical
        (robust to outliers) and mode for categorical.
        """
        df_clean = df.copy()
        
        for col, ctype in col_types.items():
            missing_rate = df_clean[col].isna().mean()
            
            if missing_rate > 0.5:
                # More than 50% missing - drop column
                df_clean = df_clean.drop(columns=[col])
                continue
            
            if ctype == 'numerical':
                median_val = df_clean[col].median()
                df_clean[col] = df_clean[col].fillna(median_val)
                
                # Add missingness indicator
                # Why: Missingness itself is informative in experimental data
                if missing_rate > 0:
                    df_clean[f'{col}_was_missing'] = df[col].isna().astype(int)
                    
            elif ctype == 'categorical':
                mode_val = df_clean[col].mode()[0] if len(df_clean[col].mode()) > 0 else 'unknown'
                df_clean[col] = df_clean[col].fillna(mode_val)
        
        return df_clean
    
    def encode_categoricals(self, df, col_types):
        """
        Frequency encoding for categorical variables.
        
        Why frequency over one-hot:
        Scientific categories (treatment types, conditions) often have
        ordinal importance related to their frequency. One-hot encoding
        loses this signal and dramatically expands dimensionality.
        """
        df_encoded = df.copy()
        
        for col, ctype in col_types.items():
            if ctype == 'categorical' and col in df_encoded.columns:
                freq_map = df_encoded[col].value_counts(normalize=True).to_dict()
                df_encoded[col] = df_encoded[col].map(freq_map)
        
        return df_encoded
    
    def extract_interaction_features(self, df, numerical_cols):
        """
        Create pairwise ratio features between numerical columns.
        
        Why ratios: In experimental science, ratios between measurements
        (e.g., signal/noise, treatment/control) are often more meaningful
        than absolute values. The GRN will learn which ratios matter,
        but providing them explicitly accelerates learning.
        """
        df_interactions = df.copy()
        
        if len(numerical_cols) < 2:
            return df_interactions
        
        # Only create ratios for columns with positive values
        positive_cols = [c for c in numerical_cols 
                        if c in df.columns and (df[c] > 0).all()]
        
        for i, col1 in enumerate(positive_cols[:5]):   # Limit to avoid explosion
            for col2 in positive_cols[i+1:6]:
                ratio_name = f'ratio_{col1[:8]}_{col2[:8]}'
                df_interactions[ratio_name] = df[col1] / (df[col2] + 1e-10)
        
        return df_interactions
    
    def detect_outliers(self, df, numerical_cols):
        """
        Flag statistical outliers using IQR method.
        
        Why flag rather than remove:
        In scientific experiments, outliers may be the most important
        observations (unexpected results). We flag them as features
        so the model knows to pay attention, not discard them.
        """
        df_out = df.copy()
        
        for col in numerical_cols:
            if col not in df.columns:
                continue
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            
            df_out[f'{col}_is_outlier'] = (
                (df[col] < lower) | (df[col] > upper)
            ).astype(int)
        
        return df_out
    
    def engineer_features(self, df):
        """
        Complete tabular feature engineering pipeline.
        Returns feature matrix ready for GRN input.
        """
        print(f"Input shape: {df.shape}")
        
        # Step 1: Detect column types
        col_types = self.detect_column_types(df)
        numerical_cols = [c for c, t in col_types.items() if t == 'numerical']
        
        # Step 2: Handle missing values
        df_clean = self.handle_missing_values(df, col_types)
        
        # Step 3: Encode categoricals
        df_encoded = self.encode_categoricals(df_clean, col_types)
        
        # Step 4: Interaction features
        df_interact = self.extract_interaction_features(df_encoded, numerical_cols)
        
        # Step 5: Outlier flags
        df_final = self.detect_outliers(df_interact, numerical_cols)
        
        # Step 6: Keep only numeric columns for model input
        numeric_df = df_final.select_dtypes(include=[np.number])
        
        # Step 7: Scale all features
        feature_matrix = self.scaler.fit_transform(numeric_df.fillna(0))
        
        # Store column info for explainability
        self.feature_names = numeric_df.columns.tolist()
        
        print(f"Engineered feature shape: {feature_matrix.shape}")
        return feature_matrix, self.feature_names


class ImageFeatureEngineer:
    """
    Extracts features from scientific images.
    
    Why both CNN and statistical features:
    ResNet captures hierarchical visual patterns (edges, textures, shapes).
    Statistical features capture global image properties (contrast, 
    brightness distribution) that indicate image type and quality.
    Together they help the model distinguish microscopy from graphs from diagrams.
    """
    
    def __init__(self):
        import torchvision.models as models
        import torchvision.transforms as transforms
        
        # Load pretrained ResNet-50, remove final classification layer
        # Why: We want the 2048-dimensional feature vector before classification,
        # not the 1000-class ImageNet output
        resnet = models.resnet50(pretrained=True)
        self.feature_extractor = torch.nn.Sequential(*list(resnet.children())[:-1])
        self.feature_extractor.eval()
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.feature_extractor.to(self.device)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],   # ImageNet mean
                std=[0.229, 0.224, 0.225]      # ImageNet std
            )
        ])
    
    def extract_cnn_features(self, image_tensor):
        """Extract 2048-dim ResNet features from image tensor."""
        with torch.no_grad():
            image_tensor = image_tensor.unsqueeze(0).to(self.device)
            features = self.feature_extractor(image_tensor)
            features = features.squeeze().cpu().numpy()
        return features
    
    def extract_statistical_features(self, pil_image):
        """
        Compute global image statistics.
        
        These features help identify image type before deep features
        can be used for downstream scientific interpretation.
        """
        import numpy as np
        
        img_array = np.array(pil_image.convert('RGB'))
        features = []
        
        for channel in range(3):  # R, G, B channels
            channel_data = img_array[:, :, channel].flatten()
            features.extend([
                channel_data.mean(),
                channel_data.std(),
                np.percentile(channel_data, 25),
                np.percentile(channel_data, 75),
                channel_data.max() - channel_data.min()  # Dynamic range
            ])
        
        # Grayscale variance (high in microscopy, low in clean diagrams)
        gray = np.array(pil_image.convert('L'))
        features.append(gray.var())
        
        # Edge density using gradient magnitude
        gy = np.gradient(gray.astype(float), axis=0)
        gx = np.gradient(gray.astype(float), axis=1)
        gradient_magnitude = np.sqrt(gx**2 + gy**2)
        features.append(gradient_magnitude.mean())
        
        return np.array(features)
    
    def process_image(self, pil_image):
        """
        Complete image feature extraction pipeline.
        Returns concatenated CNN + statistical features.
        """
        img_tensor = self.transform(pil_image.convert('RGB'))
        cnn_features = self.extract_cnn_features(img_tensor)
        stat_features = self.extract_statistical_features(pil_image)
        
        combined = np.concatenate([cnn_features, stat_features])
        return combined