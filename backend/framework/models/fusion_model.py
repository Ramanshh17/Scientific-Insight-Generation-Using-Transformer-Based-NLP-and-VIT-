# src/models/fusion_model.py
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional


class GatedFusion(nn.Module):
    def __init__(self, fusion_dim: int = 512, num_modalities: int = 3):
        super().__init__()
        self.gate = nn.Sequential(
            nn.Linear(fusion_dim * num_modalities, 256),
            nn.ReLU(),
            nn.Linear(256, num_modalities),
            nn.Softmax(dim=-1)
        )
        self.output = nn.Sequential(
            nn.Linear(fusion_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.1)
        )

    def forward(self, modalities: List[torch.Tensor]):
        concat = torch.cat(modalities, dim=-1)
        gates = self.gate(concat)
        fused = sum(gates[:, i:i+1] * modalities[i]
                    for i in range(len(modalities)))
        return self.output(fused), gates


class FusionModel(nn.Module):
    def __init__(self, text_dim=384, image_dim=512,
                 tabular_dim=256, fusion_dim=512, num_classes=7):
        super().__init__()

        self.text_proj = nn.Sequential(
            nn.Linear(text_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.ReLU()
        )
        self.image_proj = nn.Sequential(
            nn.Linear(image_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.ReLU()
        )
        self.tabular_proj = nn.Sequential(
            nn.Linear(tabular_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.ReLU()
        )

        self.attention = nn.MultiheadAttention(
            embed_dim=fusion_dim, num_heads=8,
            dropout=0.1, batch_first=True
        )
        self.layer_norm = nn.LayerNorm(fusion_dim)

        self.gated_fusion = GatedFusion(fusion_dim, 3)

        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, text_emb=None, image_emb=None, tabular_emb=None):
        available = []
        names = []

        if text_emb is not None:
            available.append(self.text_proj(text_emb))
            names.append('text')
        if image_emb is not None:
            available.append(self.image_proj(image_emb))
            names.append('image')
        if tabular_emb is not None:
            available.append(self.tabular_proj(tabular_emb))
            names.append('tabular')

        if not available:
            raise ValueError("At least one modality required!")

        if len(available) > 1:
            enhanced = []
            for i, mod in enumerate(available):
                others = torch.stack(
                    [m for j, m in enumerate(available) if j != i]
                ).mean(0)
                q = mod.unsqueeze(1)
                kv = others.unsqueeze(1)
                attn_out, _ = self.attention(q, kv, kv)
                enhanced.append(
                    self.layer_norm(q + attn_out).squeeze(1)
                )
        else:
            enhanced = available

        while len(enhanced) < 3:
            enhanced.append(torch.zeros_like(enhanced[0]))

        fused, gates = self.gated_fusion(enhanced)
        logits = self.classifier(fused)
        probs = F.softmax(logits, dim=-1)

        return {
            'fused': fused,
            'logits': logits,
            'probs': probs,
            'gates': gates,
            'modality_names': names
        }


class SimpleTabularEncoder(nn.Module):
    def __init__(self, input_dim: int, output_dim: int = 256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Linear(256, output_dim)
        )
        self.skip = nn.Linear(input_dim, output_dim)

    def forward(self, x):
        return self.net(x) + self.skip(x)

    def encode(self, x: np.ndarray) -> np.ndarray:
        self.eval()
        with torch.no_grad():
            t = torch.FloatTensor(x)
            if t.dim() == 1:
                t = t.unsqueeze(0)
            return self.forward(t).numpy()