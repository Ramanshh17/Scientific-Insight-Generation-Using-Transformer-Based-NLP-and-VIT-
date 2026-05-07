# src/preprocessing/image_processor.py
import numpy as np
from PIL import Image
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


class ImageProcessor:
    def __init__(self):
        self.target_size = (224, 224)

    def load_image(self, image_path: str) -> Image.Image:
        try:
            img = Image.open(image_path).convert('RGB')
            return img
        except Exception as e:
            print(f"Image load error: {e}")
            return None

    def resize_image(self, image: Image.Image) -> Image.Image:
        return image.resize(self.target_size, Image.LANCZOS)

    def get_image_stats(self, image: Image.Image) -> dict:
        img_array = np.array(image)
        return {
            'width': image.width,
            'height': image.height,
            'mean_brightness': float(img_array.mean()),
            'std_brightness': float(img_array.std()),
            'aspect_ratio': round(image.width / image.height, 2)
        }

    def image_to_base64(self, image: Image.Image) -> str:
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')

    def create_sample_chart(self) -> Image.Image:
        fig, axes = plt.subplots(1, 2, figsize=(10, 4))
        fig.patch.set_facecolor('#f8f9fa')

        categories = ['CNN', 'RNN', 'Transformer', 'MLP', 'GNN']
        values = [82.3, 78.9, 91.4, 75.2, 85.7]
        colors = ['#4A90E2', '#7ED321', '#F5A623', '#E74C3C', '#9B59B6']

        axes[0].bar(categories, values, color=colors, edgecolor='white')
        axes[0].set_title('Model Accuracy Comparison', fontweight='bold')
        axes[0].set_ylabel('Accuracy (%)')
        axes[0].set_ylim(60, 100)

        epochs = list(range(1, 21))
        np.random.seed(42)
        train_loss = [1.5 * np.exp(-0.15 * e) + 0.1 for e in epochs]
        val_loss = [1.6 * np.exp(-0.12 * e) + 0.15 for e in epochs]

        axes[1].plot(epochs, train_loss, 'b-o', label='Train', markersize=4)
        axes[1].plot(epochs, val_loss, 'r-s', label='Val', markersize=4)
        axes[1].set_title('Training Curves', fontweight='bold')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Loss')
        axes[1].legend()

        plt.tight_layout()

        buffer = io.BytesIO()
        plt.savefig(buffer, format='PNG', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        plt.close()

        return Image.open(buffer).convert('RGB')