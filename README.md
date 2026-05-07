# Scientific Insight Generation Using Transformer-Based NLP and ViT

A multimodal scientific analysis platform that processes research papers, images, and tabular data to generate novel hypotheses and insights.

## Features

- **Multimodal Synthesis**: Combines text (SciBERT), images (ViT), and tabular data (GRN) into unified analysis
- **Insight Generation**: Uses FLAN-T5 to generate summaries, research gaps, and hypotheses
- **Semantic Search**: FAISS-powered vector search across arXiv papers
- **Explainable AI**: Visualizes attention weights and feature importance
- **Cross-Modal Attention**: Fuses information from multiple modalities

## Architecture

### Models Used

| Component | Model | Purpose |
|-----------|-------|---------|
| Text Analysis | SciBERT | Scientific text understanding |
| Image Vision | Vision Transformer (ViT) | Scientific figure analysis |
| Tabular Logic | Gated Residual Networks (GRN) | Experimental data processing |
| Data Fusion | Cross-Modal Multihead Attention | Multimodal integration |
| Reasoning | FLAN-T5 | Hypothesis generation |
| Vector Search | FAISS | Semantic paper search |

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- 8GB RAM minimum (16GB recommended)
- GPU optional (for faster inference)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ramanshh17/Scientific-Insight-Generation-Using-Transformer-Based-NLP-and-VIT-.git
   cd cp1
   ```

2. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Set up frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Download sample data**
   ```bash
   cd backend
   python scripts/download_all_data.py
   ```

5. **Run the application**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   python app.py
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## Dataset Sources

### Supported Datasets

1. **arXiv** - 2M+ scientific papers
   - Source: https://www.kaggle.com/datasets/Cornell-University/arxiv
   - Categories: AI, ML, Quantum Physics, Bioinformatics, etc.

2. **World Bank** - Global development indicators
   - Source: https://databank.worldbank.org
   - Includes GDP, population, health, education metrics

3. **RVL-CDIP** - Document image dataset
   - Source: http://www.datascienceassn.org/sites/default/files/rvl-cdip.tar.gz
   - 400K grayscale document images in 16 categories

### Download Full Datasets

```bash
# arXiv (requires Kaggle API)
kaggle datasets download -d Cornell-University/arxiv

# World Bank - manual download from website

# RVL-CDIP
wget http://www.datascienceassn.org/sites/default/files/rvl-cdip.tar.gz
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health status |
| `/api/analyze` | POST | Multimodal analysis |
| `/api/search` | POST | Search arXiv papers |
| `/api/trends` | GET | Get research trends |
| `/api/generate-hypothesis` | POST | Generate hypotheses |
| `/api/categories` | GET | List arXiv categories |

### Example API Usage

```bash
# Analyze multimodal input
curl -X POST http://localhost:5000/api/analyze \
  -F "text=Research abstract here..." \
  -F "image=@figure.png" \
  -F "csv=@data.csv"

# Search papers
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "transformer attention", "category": "Machine Learning", "top_k": 10}'

# Generate hypotheses
curl -X POST http://localhost:5000/api/generate-hypothesis \
  -H "Content-Type: application/json" \
  -d '{"text": "Research text...", "domain": "Computer Science"}'
```

## Project Structure

```
cp1/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── config.py              # Configuration
│   ├── models/
│   │   ├── text_analyzer.py   # SciBERT text analysis
│   │   ├── image_analyzer.py  # ViT image analysis
│   │   ├── tabular_analyzer.py # GRN tabular analysis
│   │   ├── fusion.py          # Cross-modal attention
│   │   └── hypothesis_generator.py # FLAN-T5 generation
│   ├── services/
│   │   ├── insight_service.py # Main analysis pipeline
│   │   ├── arxiv_service.py   # arXiv search & trends
│   │   ├── feature_engineering.py # Feature extraction
│   │   └── pdf_processor.py   # PDF extraction
│   ├── scripts/
│   │   └── download_all_data.py # Dataset setup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main application
│   │   ├── utils/
│   │   │   ├── api.ts         # API client
│   │   │   └── components/
│   │   │       ├── UploadForm.tsx
│   │   │       ├── ResultsPanel.tsx
│   │   │       ├── RetrievalView.tsx
│   │   │       └── explanationView.tsx
│   └── package.json
├── data/                      # Data directory
└── README.md
```

## Feature Engineering

The platform extracts comprehensive features from each modality:

### Text Features
- Word count, sentence count, readability score
- Scientific terminology density
- Domain classification
- Key concept extraction
- Citation and methodology detection

### Image Features
- Brightness, contrast, entropy
- Color channel statistics
- Edge density and texture features
- Quadrant analysis
- Image complexity score

### Tabular Features
- Statistical summaries (mean, std, min, max, quartiles)
- Correlation analysis
- Trend detection
- Data quality scoring
- Outlier handling (IQR method)

## Model Details

### SciBERT (Text Analysis)
- Model: `allenai/scibert_scivocab_uncased`
- Trained on 1.14M scientific papers
- Embedding dimension: 768

### Vision Transformer (Image Analysis)
- Model: `google/vit-base-patch16-224`
- Patch size: 16x16
- Embedding dimension: 768

### Gated Residual Networks (Tabular)
- 3-layer GRN stack
- Input: 128 dimensions
- Output: 64 dimensions

### Cross-Modal Attention (Fusion)
- Projects all modalities to 256 dimensions
- 8-head multi-head attention
- Output: 384-dimensional fused embedding

### FLAN-T5 (Generation)
- Model: `google/flan-t5-base`
- Max sequence length: 512 tokens
- Beam search with 4 beams

## License

MIT License

## Citation

If you use this project in your research, please cite:

```bibtex
@misc{scientific-insight-generation,
  title={Scientific Insight Generation Using Transformer-Based NLP and ViT},
  author={Raman Sharma},
  year={2024},
  url={https://github.com/Ramanshh17/Scientific-Insight-Generation-Using-Transformer-Based-NLP-and-VIT-}
}