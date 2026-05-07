# src/models/image_encoder.py
import numpy as np
from PIL import Image
from typing import Union, List, Dict
import logging

logger = logging.getLogger(__name__)


class ImageEncoder:
    """
    Image encoder using CLIP.
    Falls back to basic features if CLIP not available.
    """

    def __init__(self):
        self.model = None
        self.processor = None
        self.embedding_dim = 512
        self.model_name = None
        self._load_model()

    def _load_model(self):
        try:
            from transformers import CLIPProcessor, CLIPModel
            self.processor = CLIPProcessor.from_pretrained(
                'openai/clip-vit-base-patch32'
            )
            self.model = CLIPModel.from_pretrained(
                'openai/clip-vit-base-patch32'
            )
            self.model.eval()
            self.model_name = 'CLIP ViT-B/32'
            self.embedding_dim = 512
            logger.info("CLIP loaded!")
        except Exception as e:
            logger.warning(f"CLIP failed: {e}")
            self._load_fallback()

    def _load_fallback(self):
        self.model = None
        self.model_name = 'Color Histogram (fallback)'
        self.embedding_dim = 512
        logger.info("Using color histogram fallback.")

    def _clip_encode(self, image: Image.Image) -> np.ndarray:
        import torch
        inputs = self.processor(images=image, return_tensors='pt')
        with torch.no_grad():
            features = self.model.get_image_features(**inputs)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy()[0]

    def _histogram_encode(self, image: Image.Image) -> np.ndarray:
        img = image.resize((64, 64))
        img_array = np.array(img).astype(np.float32)
        features = []
        for channel in range(3):
            hist, _ = np.histogram(img_array[:, :, channel], bins=170, range=(0, 256))
            hist = hist / (hist.sum() + 1e-9)
            features.extend(hist.tolist())
        features = features[:512]
        while len(features) < 512:
            features.append(0.0)
        features = np.array(features, dtype=np.float32)
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm
        return features

    def encode_image(self, image: Union[str, Image.Image]) -> np.ndarray:
        if isinstance(image, str):
            image = Image.open(image).convert('RGB')

        if self.model is not None:
            try:
                return self._clip_encode(image)
            except Exception as e:
                logger.warning(f"CLIP encode failed: {e}")

        return self._histogram_encode(image)

    def classify_image(self, image: Image.Image) -> Dict[str, float]:
        labels = [
            'bar chart', 'line chart', 'scatter plot',
            'microscopy image', 'neural network diagram',
            'heatmap', 'flowchart', 'molecular structure'
        ]

        if self.model is not None:
            try:
                import torch
                prompts = [f"a scientific figure showing {l}" for l in labels]
                img_emb = self._clip_encode(image)
                scores = {}
                for label, prompt in zip(labels, prompts):
                    txt_inputs = self.processor(
                        text=prompt, return_tensors='pt',
                        padding=True, truncation=True, max_length=77
                    )
                    with torch.no_grad():
                        txt_feat = self.model.get_text_features(**txt_inputs)
                        txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)
                    scores[label] = float(
                        np.dot(img_emb, txt_feat.cpu().numpy()[0])
                    )
                vals = np.array(list(scores.values()))
                exp_vals = np.exp(vals - vals.max())
                softmax = exp_vals / exp_vals.sum()
                return dict(zip(labels, softmax.tolist()))
            except Exception as e:
                logger.warning(f"CLIP classify failed: {e}")

        img_array = np.array(image)
        gray = img_array.mean(axis=2)
        edge_density = float((np.abs(np.diff(gray)).mean()) / 255)
        probs = np.ones(len(labels)) / len(labels)
        return dict(zip(labels, probs.tolist()))