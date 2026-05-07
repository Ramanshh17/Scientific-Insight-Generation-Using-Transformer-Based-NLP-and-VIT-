# src/models/multimodal_fusion.py

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np

class MultimodalFusionModel(nn.Module):
    """
    Multimodal fusion model combining text and image features
    """
    
    def __init__(self, text_dim=768, image_dim=2048, hidden_dim=512, num_classes=10):
        super().__init__()
        
        self.text_encoder = nn.Sequential(
            nn.Linear(text_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        self.image_encoder = nn.Sequential(
            nn.Linear(image_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        self.fusion = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes)
        )
    
    def forward(self, text_features, image_features):
        text_encoded = self.text_encoder(text_features)
        image_encoded = self.image_encoder(image_features)
        
        combined = torch.cat([text_encoded, image_encoded], dim=1)
        output = self.fusion(combined)
        
        return output


def train_multimodal_model(model, train_loader, val_loader, epochs=10, lr=1e-4):
    """Train the multimodal fusion model"""
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()
    
    print(f"\nTraining on {device}")
    
    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0.0
        
        for batch_idx, batch in enumerate(train_loader):
            # Dummy training (replace with actual data)
            text_features = torch.randn(len(batch['text']), 768).to(device)
            image_features = torch.randn(len(batch['text']), 2048).to(device)
            labels = torch.randint(0, 10, (len(batch['text']),)).to(device)
            
            optimizer.zero_grad()
            outputs = model(text_features, image_features)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
        
        avg_train_loss = train_loss / len(train_loader)
        print(f"Epoch {epoch+1}/{epochs} - Loss: {avg_train_loss:.4f}")
    
    return model