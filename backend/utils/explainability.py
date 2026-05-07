import numpy as np
import torch
import shap
from lime import lime_text
from config import Config

class MultimodalExplainer:
    """Unified explainability: SHAP (tabular), LIME (text), gate inspection (fusion)"""
    
    def __init__(self, model_pipeline, feature_names: list = None):
        self.pipeline = model_pipeline
        self.feature_names = feature_names or []
    
    def explain_tabular(self, tabular_input: np.ndarray, 
                       baseline: np.ndarray = None,
                       nsamples: int = Config.SHAP_NSAMPLES) -> dict:
        """SHAP attribution for tabular features"""
        if baseline is None:
            baseline = np.zeros_like(tabular_input)
        
        # SHAP Kernel explainer (model-agnostic)
        def model_predict(x):
            # Convert to tensor and run through pipeline's tabular encoder + classifier
            with torch.no_grad():
                tab_emb, _ = self.pipeline.tabular_encoder(torch.tensor(x, dtype=torch.float32))
                # For classification: need full pipeline
                # Simplified: return probability of predicted class
                return self.pipeline.classifier.predict_proba(tab_emb).cpu().numpy()
        
        explainer = shap.KernelExplainer(model_predict, baseline)
        shap_values = explainer.shap_values(tabular_input, nsamples=nsamples)
        
        # Format as feature -> attribution
        attributions = {}
        if self.feature_names:
            for name, value in zip(self.feature_names, shap_values[0]):
                attributions[name] = float(value)
        else:
            for i, value in enumerate(shap_values[0]):
                attributions[f'feature_{i}'] = float(value)
        
        return attributions
    
    def explain_text(self, text: str, target_class: int, 
                    nsamples: int = Config.LIME_NSAMPLES) -> list:
        """LIME token-level attribution for text"""
        # LIME text explainer
        def predict_proba(texts):
            probs = []
            for t in texts:
                with torch.no_grad():
                    emb = self.pipeline.text_encoder.encode(t)
                    logits = self.pipeline.classifier(emb)
                    prob = torch.softmax(logits, dim=-1).cpu().numpy()[0]
                    probs.append(prob)
            return np.array(probs)
        
        explainer = lime_text.LimeTextExplainer(class_names=Config.ARXIV_CATEGORIES)
        
        exp = explainer.explain_instance(
            text, predict_proba, 
            num_features=Config.LIME_N_FEATURES,
            labels=[target_class],
            num_samples=nsamples
        )
        
        # Return sorted by importance
        return exp.as_list(label=target_class)
    
    def get_gate_weights(self, gate_tensor: torch.Tensor) -> dict:
        """Extract modality contribution from fusion gates"""
        if gate_tensor.dim() == 2:
            gate_tensor = gate_tensor[0]  # Take first batch item
        
        weights = gate_tensor.cpu().numpy()
        modalities = ['text', 'image', 'tabular']
        
        return {mod: float(w * 100) for mod, w in zip(modalities, weights)}