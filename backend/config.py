import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "sciinsight2024")
    DEBUG = os.getenv("DEBUG", "True") == "True"
    
    # Models
    SCIBERT_MODEL = "allenai/scibert_scivocab_uncased"
    VIT_MODEL = "google/vit-base-patch16-224"
    FLAN_T5_MODEL = "google/flan-t5-base"
    SENTENCE_MODEL = "all-MiniLM-L6-v2"
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "..", "data")
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    FAISS_INDEX_PATH = os.path.join(DATA_DIR, "processed", "arxiv_faiss.index")
    ARXIV_METADATA_PATH = os.path.join(DATA_DIR, "processed", "arxiv_metadata.pkl")
    PROCESSED_DATA_PATH = os.path.join(DATA_DIR, "processed")
    EMBEDDINGS_PATH = os.path.join(DATA_DIR, "embeddings")
    
    # Sample Datasets
    SAMPLE_DIR = os.path.join(DATA_DIR, "sample")
    WORLD_BANK_SAMPLE = os.path.join(SAMPLE_DIR, "worldbank_sample.csv")
    IMAGE_SAMPLE_DIR = os.path.join(DATA_DIR, "images")

    # Framework data (from multimodal_scientific_framework)
    PAPERS_CSV = os.path.join(DATA_DIR, "processed", "papers_metadata.csv")
    IMAGE_MAPPINGS_CSV = os.path.join(DATA_DIR, "processed", "image_mappings.csv")
    ENTITIES_JSON = os.path.join(DATA_DIR, "processed", "extracted_entities.json")
    
    # arXiv Categories
    ARXIV_CATEGORIES = {
        "AI": "cs.AI",
        "Machine Learning": "cs.LG", 
        "Quantum Physics": "quant-ph",
        "Bioinformatics": "q-bio",
        "Computer Vision": "cs.CV",
        "NLP": "cs.CL",
        "Physics": "physics",
        "Mathematics": "math"
    }
    
    # Upload settings
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'csv', 'txt'}
    
    # FAISS
    FAISS_DIMENSION = 384
    TOP_K_RESULTS = 10

config = Config()