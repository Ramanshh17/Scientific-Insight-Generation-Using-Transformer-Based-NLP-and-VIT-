# backend/config.py

import os

class Config:
    # Dataset paths - ArXiv from Kaggle
    ARXIV_DATA_PATH = "data/raw/arxiv-metadata-oai-snapshot.json"
    PROCESSED_DATA_PATH = "data/processed/"
    EMBEDDINGS_PATH = "data/embeddings/"
    FAISS_INDEX_PATH = "data/index/arxiv_faiss.index"
    
    # Model configurations
    SCIBERT_MODEL = "allenai/scibert_scivocab_uncased"
    FLAN_T5_MODEL = "google/flan-t5-large"
    VISION_MODEL = "microsoft/resnet-50"
    
    # ArXiv categories we analyze
    # These map to the actual category codes in the ArXiv dataset
    ARXIV_CATEGORIES = {
        "cs.AI": "Artificial Intelligence",
        "cs.LG": "Machine Learning", 
        "cs.CV": "Computer Vision",
        "quant-ph": "Quantum Physics",
        "q-bio": "Quantitative Biology",
        "eess.SP": "Signal Processing",
        "physics.med-ph": "Medical Physics",
        "cs.CL": "Computational Linguistics",
        "stat.ML": "Statistical Machine Learning",
        "math.ST": "Statistics Theory"
    }
    
    # Feature engineering parameters
    MAX_TEXT_LENGTH = 512
    IMAGE_SIZE = (224, 224)
    EMBEDDING_DIM = 768
    BATCH_SIZE = 32
    
    # Search parameters
    TOP_K_RESULTS = 10
    SIMILARITY_THRESHOLD = 0.75
    
    # API settings
    HOST = "0.0.0.0"
    PORT = 5000
    DEBUG = False
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB upload limit
    UPLOAD_FOLDER = "data/uploads/"
    
    SECRET_KEY = os.environ.get("SECRET_KEY", "scientific-platform-key-2024")