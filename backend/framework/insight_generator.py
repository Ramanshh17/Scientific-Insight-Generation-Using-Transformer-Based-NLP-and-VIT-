# src/models/insight_generator.py
import numpy as np
import torch
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class InsightGenerator:
    def __init__(self):
        self.t5_model = None
        self.t5_tokenizer = None
        self.faiss_index = None
        self.paper_db = []
        self.embedding_dim = 256
        self._load_t5()
        self._init_faiss()

    def _load_t5(self):
        try:
            from transformers import T5ForConditionalGeneration, T5Tokenizer
            self.t5_tokenizer = T5Tokenizer.from_pretrained(
                'google/flan-t5-base'
            )
            self.t5_model = T5ForConditionalGeneration.from_pretrained(
                'google/flan-t5-base'
            )
            self.t5_model.eval()
            logger.info("FLAN-T5 loaded!")
        except Exception as e:
            logger.warning(f"T5 failed: {e}. Using rule-based generation.")

    def _init_faiss(self):
        try:
            import faiss
            self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)
            logger.info("FAISS initialized!")
        except Exception as e:
            logger.warning(f"FAISS failed: {e}")

    def generate_text(self, prompt: str, max_tokens: int = 120) -> str:
        if self.t5_model is not None:
            try:
                inputs = self.t5_tokenizer(
                    prompt, return_tensors='pt',
                    max_length=512, truncation=True
                )
                with torch.no_grad():
                    out = self.t5_model.generate(
                        inputs['input_ids'],
                        max_new_tokens=max_tokens,
                        num_beams=4,
                        no_repeat_ngram_size=3,
                        early_stopping=True
                    )
                return self.t5_tokenizer.decode(
                    out[0], skip_special_tokens=True
                ).strip()
            except Exception as e:
                logger.warning(f"T5 generation failed: {e}")

        return self._rule_based_generation(prompt)

    def _rule_based_generation(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if 'summarize' in prompt_lower or 'summary' in prompt_lower:
            return (
                "This research presents novel computational methods "
                "for scientific analysis, combining multiple data "
                "modalities to improve understanding and prediction "
                "accuracy in the studied domain."
            )
        elif 'gap' in prompt_lower or 'limitation' in prompt_lower:
            return (
                "Current approaches lack comprehensive evaluation "
                "across diverse datasets. Integration of additional "
                "modalities and improved explainability mechanisms "
                "represent significant research opportunities."
            )
        elif 'hypothesis' in prompt_lower:
            return (
                "Combining domain-specific pretrained models with "
                "adaptive fusion mechanisms may further improve "
                "performance, particularly for cross-domain "
                "scientific applications."
            )
        return (
            "The analysis reveals important patterns in the "
            "scientific data that warrant further investigation."
        )

    def generate_insights(self, context: str,
                          categories: List[Dict]) -> Dict:
        results = {}
        summary_prompt = f"Summarize the key findings: {context[:400]}"
        results['summary'] = self.generate_text(summary_prompt)

        gap_prompt = f"What are the research gaps and limitations: {context[:400]}"
        results['research_gap'] = self.generate_text(gap_prompt)

        hyp_prompt = f"Propose a new scientific hypothesis based on: {context[:400]}"
        results['hypothesis'] = self.generate_text(hyp_prompt)

        results['predicted_categories'] = categories
        return results

    def build_index(self, embeddings: np.ndarray,
                    papers: List[Dict]):
        if self.faiss_index is None:
            return

        try:
            embs = embeddings.copy().astype(np.float32)
            if embs.shape[1] != self.embedding_dim:
                from sklearn.decomposition import PCA
                pca = PCA(n_components=self.embedding_dim)
                embs = pca.fit_transform(embs).astype(np.float32)
                self.pca = pca
            norms = np.linalg.norm(embs, axis=1, keepdims=True)
            embs = embs / (norms + 1e-9)
            self.faiss_index.add(embs)
            self.paper_db = papers
            logger.info(f"FAISS index: {self.faiss_index.ntotal} papers")
        except Exception as e:
            logger.error(f"Index build failed: {e}")

    def find_similar(self, query_emb: np.ndarray,
                     k: int = 5) -> List[Dict]:
        if self.faiss_index is None or self.faiss_index.ntotal == 0:
            return []
        try:
            import faiss
            q = query_emb.copy().astype(np.float32)
            if len(q) != self.embedding_dim:
                q = q[:self.embedding_dim]
            q = q / (np.linalg.norm(q) + 1e-9)
            q = q.reshape(1, -1)
            k_actual = min(k, self.faiss_index.ntotal)
            scores, indices = self.faiss_index.search(q, k_actual)
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if 0 <= idx < len(self.paper_db):
                    paper = self.paper_db[idx].copy()
                    paper['similarity'] = round(float(score), 3)
                    results.append(paper)
            return results
        except Exception as e:
            logger.error(f"FAISS search failed: {e}")
            return []