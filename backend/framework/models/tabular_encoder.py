# src/models/tabular_encoder.py
# ============================================================
# NEURAL NETWORK ENCODER FOR TABULAR/EXPERIMENTAL DATA
#
# WHY NEURAL NETWORK FOR TABULAR:
# - Traditional ML (XGBoost, Random Forest) can't produce embeddings
# - We need fixed-size vectors for fusion with text/image
# - MLP with attention learns which features are important
# - Same embedding space enables fusion
#
# ARCHITECTURE:
# Input Features 
#   → Feature Attention (learn importance weights)
#   → MLP Layer 1: Linear + BatchNorm + ReLU + Dropout
#   → MLP Layer 2: Linear + BatchNorm + ReLU + Dropout  
#   → MLP Layer 3: Linear + BatchNorm + ReLU
#   + Skip Connection (from input, projected)
#   → Output Embedding (256-dim)
# ============================================================

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent.parent))
from config import TABULAR_EMBED_DIM, DROPOUT_RATE

class TabularEncoder(nn.Module):
    """
    Neural network that encodes tabular data to embeddings.
    
    KEY COMPONENTS:
    
    1. Feature Attention:
       - Learns which features matter most
       - Output: weights summing to 1 per feature
       - Example: "temperature" more important than "batch_id"
       - WHY: Not all experimental features are equally useful
    
    2. BatchNorm (Batch Normalization):
       - Normalizes activations within each batch
       - Speeds up training (allows higher learning rates)
       - Reduces internal covariate shift
       - WHY: Essential for stable training with mixed feature scales
    
    3. Dropout:
       - Randomly zeros out neurons during training
       - Prevents overfitting
       - Small experimental datasets overfit easily
       - WHY: Scientific datasets are often small (100s not millions)
    
    4. Skip Connection (Residual):
       - Direct path from input to output
       - Helps gradient flow during backpropagation
       - Prevents vanishing gradient problem
       - WHY: Deeper networks train better with skip connections
    """
    
    def __init__(self, 
                 input_dim: int,
                 embedding_dim: int = TABULAR_EMBED_DIM,
                 dropout_rate: float = DROPOUT_RATE):
        
        super(TabularEncoder, self).__init__()
        
        self.input_dim = input_dim
        self.embedding_dim = embedding_dim
        
        # ── Feature Attention ────────────────────────────────
        # Learns importance weight for each input feature
        self.feature_attention = nn.Sequential(
            nn.Linear(input_dim, input_dim),
            nn.Softmax(dim=-1)  # Weights sum to 1
        )
        
        # ── Encoder Layers ───────────────────────────────────
        # Layer 1: input_dim → 512
        self.layer1 = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(dropout_rate)
        )
        
        # Layer 2: 512 → 256
        self.layer2 = nn.Sequential(
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout_rate)
        )
        
        # Layer 3: 256 → embedding_dim
        self.layer3 = nn.Sequential(
            nn.Linear(256, embedding_dim),
            nn.BatchNorm1d(embedding_dim),
            nn.ReLU()
        )
        
        # ── Skip Connection ──────────────────────────────────
        # Projects input directly to embedding_dim
        # Added to layer3 output (residual connection)
        self.skip_projection = nn.Linear(input_dim, embedding_dim)
        
        # ── Output Normalization ─────────────────────────────
        self.output_norm = nn.LayerNorm(embedding_dim)
        
        print(f"✅ TabularEncoder initialized")
        print(f"   Input dim: {input_dim}")
        print(f"   Embedding dim: {embedding_dim}")
        print(f"   Parameters: {sum(p.numel() for p in self.parameters()):,}")
    
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        
        ARGS:
            x: Input features [batch_size, input_dim]
        
        RETURNS:
            embedding: [batch_size, embedding_dim]
            attention_weights: [batch_size, input_dim] (for explainability)
        """
        # Step 1: Feature attention
        attention_weights = self.feature_attention(x)
        x_attended = x * attention_weights  # Element-wise multiplication
        
        # Step 2: Through encoder layers
        h1 = self.layer1(x_attended)
        h2 = self.layer2(h1)
        h3 = self.layer3(h2)
        
        # Step 3: Skip connection
        skip = self.skip_projection(x_attended)
        
        # Step 4: Combine main path + skip
        output = h3 + skip
        
        # Step 5: Layer norm
        output = self.output_norm(output)
        
        return output, attention_weights
    
    def encode(self, features: np.ndarray) -> np.ndarray:
        """
        Encode numpy array to embeddings.
        
        Handles both single samples and batches.
        Used during inference (not training).
        """
        self.eval()
        
        with torch.no_grad():
            x = torch.FloatTensor(features)
            
            # Add batch dimension if single sample
            is_single = len(x.shape) == 1
            if is_single:
                x = x.unsqueeze(0)
            
            embedding, attention = self.forward(x)
        
        result = embedding.numpy()
        
        if is_single:
            result = result[0]  # Remove batch dim
        
        return result
    
    def get_feature_importance(self, 
                               features: np.ndarray,
                               feature_names: List[str] = None) -> Dict:
        """
        Get feature importance scores.
        Used by explainability module!
        
        RETURNS: dict mapping feature names to importance scores
        """
        self.eval()
        
        with torch.no_grad():
            x = torch.FloatTensor(features)
            if len(x.shape) == 1:
                x = x.unsqueeze(0)
            
            attention_weights = self.feature_attention(x)
            avg_weights = attention_weights.mean(0).numpy()
        
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(len(avg_weights))]
        
        importance = dict(zip(feature_names, avg_weights.tolist()))
        
        # Sort by importance
        importance = dict(
            sorted(importance.items(), key=lambda x: x[1], reverse=True)
        )
        
        return importance
    
    def save(self, path: str):
        """Save model weights."""
        torch.save({
            'model_state_dict': self.state_dict(),
            'input_dim': self.input_dim,
            'embedding_dim': self.embedding_dim
        }, path)
        print(f"✅ TabularEncoder saved to: {path}")
    
    @classmethod
    def load(cls, path: str) -> 'TabularEncoder':
        """Load model from saved weights."""
        checkpoint = torch.load(path, map_location='cpu')
        
        model = cls(
            input_dim=checkpoint['input_dim'],
            embedding_dim=checkpoint['embedding_dim']
        )
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()
        
        print(f"✅ TabularEncoder loaded from: {path}")
        return model


def create_tabular_encoder(input_dim: int) -> TabularEncoder:
    """Helper function to create encoder for given input size."""
    return TabularEncoder(input_dim=input_dim)


class SimpleTabularEncoder:
    """
    Simple PCA-based encoder for tabular data.
    Doesn't require knowing input_dim upfront - fits on first encode call.
    """
    
    def __init__(self, embedding_dim: int = 256):
        from sklearn.decomposition import PCA
        from sklearn.preprocessing import StandardScaler
        
        self.embedding_dim = embedding_dim
        self.pca = None
        self.scaler = StandardScaler()
        self._fitted = False
    
    def encode(self, features: np.ndarray) -> np.ndarray:
        """
        Encode numpy array to embeddings using PCA.
        Fits PCA on first call if not already fitted.
        """
        # Handle single sample
        is_single = len(features.shape) == 1
        if is_single:
            features = features.reshape(1, -1)
        
        # Fit on first call
        if not self._fitted:
            from sklearn.decomposition import PCA
            # Scale features
            features_scaled = self.scaler.fit_transform(features)
            # Fit PCA
            n_components = min(self.embedding_dim, features.shape[1], features.shape[0])
            self.pca = PCA(n_components=n_components)
            self.pca.fit(features_scaled)
            self._fitted = True
        
        # Transform
        features_scaled = self.scaler.transform(features)
        embeddings = self.pca.transform(features_scaled)
        
        # Pad or truncate to exact embedding_dim if needed
        if embeddings.shape[1] < self.embedding_dim:
            padding = np.zeros((embeddings.shape[0], self.embedding_dim - embeddings.shape[1]))
            embeddings = np.hstack([embeddings, padding])
        elif embeddings.shape[1] > self.embedding_dim:
            embeddings = embeddings[:, :self.embedding_dim]
        
        if is_single:
            embeddings = embeddings[0]
        
        return embeddings


# ── Test ────────────────────────────────────────────────────────────────────

def test_tabular_encoder():
    """Test tabular encoder."""
    
    print("Testing Tabular Encoder...")
    
    # Create synthetic data
    np.random.seed(42)
    batch_size = 32
    input_dim = 20  # 20 experimental features
    
    # Simulate experimental features
    features = np.random.randn(batch_size, input_dim).astype(np.float32)
    
    # Create encoder
    encoder = TabularEncoder(input_dim=input_dim, embedding_dim=256)
    
    # Test forward pass
    x = torch.FloatTensor(features)
    
    embedding, attention = encoder(x)
    
    print(f"\nInput shape: {x.shape}")
    print(f"Output embedding shape: {embedding.shape}")
    print(f"Attention weights shape: {attention.shape}")
    
    # Verify attention sums to 1
    attn_sum = attention.sum(dim=-1).mean().item()
    print(f"Attention sum (should be 1.0): {attn_sum:.4f}")
    assert abs(attn_sum - 1.0) < 0.01, "Attention should sum to 1!"
    
    # Test numpy encoding
    single_sample = np.random.randn(input_dim).astype(np.float32)
    single_emb = encoder.encode(single_sample)
    print(f"\nSingle sample embedding shape: {single_emb.shape}")
    
    batch_emb = encoder.encode(features)
    print(f"Batch embedding shape: {batch_emb.shape}")
    
    # Test feature importance
    feature_names = [f"param_{i}" for i in range(input_dim)]
    importance = encoder.get_feature_importance(features[:5], feature_names)
    
    print("\nTop 5 most important features:")
    for feat, imp in list(importance.items())[:5]:
        bar = "█" * int(imp * 200)
        print(f"  {feat}: {bar} {imp:.4f}")
    
    # Test save/load
    save_path = "outputs/test_tabular_encoder.pt"
    Path("outputs").mkdir(exist_ok=True)
    encoder.save(save_path)
    
    loaded_encoder = TabularEncoder.load(save_path)
    loaded_emb = loaded_encoder.encode(features)
    print(f"\nLoaded encoder output: {loaded_emb.shape}")
    assert np.allclose(batch_emb, loaded_emb, atol=1e-5), "Saved/loaded should match!"
    
    print("\n✅ Tabular encoder test PASSED!")


if __name__ == "__main__":
    test_tabular_encoder()