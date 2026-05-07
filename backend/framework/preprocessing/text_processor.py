# src/preprocessing/text_processor.py
import re
import nltk
import numpy as np
from typing import List, Dict

try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    STOP_WORDS = set(stopwords.words('english'))
    LEMMATIZER = WordNetLemmatizer()
except:
    STOP_WORDS = set()
    LEMMATIZER = None


class TextProcessor:
    def __init__(self):
        self.stop_words = STOP_WORDS
        self.scientific_stops = {
            'et', 'al', 'fig', 'figure', 'table',
            'section', 'paper', 'work', 'also',
            'however', 'therefore', 'thus'
        }
        self.stop_words.update(self.scientific_stops)

    def remove_latex(self, text: str) -> str:
        text = re.sub(r'\$\$.*?\$\$', ' [EQ] ', text, flags=re.DOTALL)
        text = re.sub(r'\$[^$\n]+\$', ' [EQ] ', text)
        text = re.sub(r'\\[a-zA-Z]+\{[^}]*\}', '', text)
        text = re.sub(r'\\[a-zA-Z]+', '', text)
        return text

    def remove_citations(self, text: str) -> str:
        text = re.sub(r'\[\d+(?:[,\-]\s*\d+)*\]', '', text)
        text = re.sub(
            r'\([A-Z][a-z]+(?:\s+et\s+al\.?)?,?\s*\d{4}\)', '', text
        )
        return text

    def clean_text(self, text: str) -> str:
        if not text or not isinstance(text, str):
            return ""
        text = self.remove_latex(text)
        text = self.remove_citations(text)
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'[^\w\s\.\,\;\:\-\(\)\%]', ' ', text)
        text = ' '.join(text.split())
        return text.strip()

    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        if not text:
            return []
        words = text.lower().split()
        freq = {}
        for w in words:
            w = re.sub(r'[^\w]', '', w)
            if (len(w) > 3 and
                    w not in self.stop_words and
                    w.isalpha()):
                freq[w] = freq.get(w, 0) + 1
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w for w, _ in sorted_words[:top_n]]

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        entities = {}
        ml_methods = [
            'BERT', 'GPT', 'transformer', 'attention', 'LSTM',
            'CNN', 'GNN', 'CLIP', 'ViT', 'diffusion', 'GAN',
            'neural network', 'deep learning', 'machine learning',
            'gradient descent', 'backpropagation', 'dropout',
            'random forest', 'SVM', 'XGBoost', 'transfer learning',
            'contrastive learning', 'zero-shot', 'few-shot'
        ]
        found_methods = [m for m in ml_methods if m.lower() in text.lower()]
        if found_methods:
            entities['methods'] = found_methods[:5]

        percentages = re.findall(r'\b(\d+\.?\d*)\s*%', text)
        if percentages:
            entities['metrics'] = percentages[:5]

        datasets = [
            'ImageNet', 'MNIST', 'CIFAR', 'ArXiv', 'PubMed',
            'CASP14', 'UniProt', 'SQuAD', 'GLUE', 'WikiText'
        ]
        found_ds = [d for d in datasets if d.lower() in text.lower()]
        if found_ds:
            entities['datasets'] = found_ds

        return entities