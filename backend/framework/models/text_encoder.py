# src/models/text_encoder.py
import numpy as np
from typing import List
import logging

logger = logging.getLogger(__name__)


class TextEncoder:
    """
    Text encoder using Sentence Transformers.
    Falls back to TF-IDF if transformers not available.
    """

    def __init__(self):
        self.model = None
        self.embedding_dim = 384
        self.model_name = None
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.model_name = 'Sentence Transformer (all-MiniLM-L6-v2)'
            self.embedding_dim = 384
            logger.info("Sentence Transformer loaded!")
        except Exception as e:
            logger.warning(f"Sentence Transformer failed: {e}")
            self._load_fallback()

    def _load_fallback(self):
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.model = TfidfVectorizer(max_features=384)
            self.model_name = 'TF-IDF Vectorizer (fallback)'
            self.embedding_dim = 384
            self._tfidf_fitted = False
            logger.info("TF-IDF fallback loaded!")
        except Exception as e:
            logger.error(f"All encoders failed: {e}")
            self.model = None
            self.model_name = 'No encoder (zeros)'

    def encode_single(self, text: str) -> np.ndarray:
        if not text:
            return np.zeros(self.embedding_dim)

        try:
            from sentence_transformers import SentenceTransformer
            if isinstance(self.model, SentenceTransformer):
                emb = self.model.encode(
                    text,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                return emb
        except:
            pass

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            if isinstance(self.model, TfidfVectorizer):
                if not getattr(self, '_tfidf_fitted', False):
                    self.model.fit([text])
                    self._tfidf_fitted = True
                emb = self.model.transform([text]).toarray()[0]
                norm = np.linalg.norm(emb)
                if norm > 0:
                    emb = emb / norm
                return emb
        except:
            pass

        return np.zeros(self.embedding_dim)

    def encode_batch(self, texts: List[str],
                     batch_size: int = 32) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.embedding_dim))

        try:
            from sentence_transformers import SentenceTransformer
            if isinstance(self.model, SentenceTransformer):
                clean = [t if t else "empty" for t in texts]
                return self.model.encode(
                    clean,
                    batch_size=batch_size,
                    normalize_embeddings=True,
                    show_progress_bar=True
                )
        except:
            pass

        return np.array([self.encode_single(t) for t in texts])