from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename
import traceback
from datetime import datetime
import io
from PIL import Image

from config import Config
from services.feature_engineering import TextFeatureEngineer, ImageFeatureEngineer, TabularFeatureEngineer
from services.search_service import ArXivSearchService
from services.pdf_processor import PDFProcessor
from models.hypothesis_generator import HypothesisGenerator
from models.fusion_model import MultimodalFusionModel
import torch


app = Flask(__name__, static_folder='../frontend')
app.config.from_object(Config)
CORS(app)

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Initialize all services
print("Initializing services...")
text_engineer = TextFeatureEngineer()
image_engineer = ImageFeatureEngineer()
tabular_engineer = TabularFeatureEngineer()
search_service = ArXivSearchService()
pdf_processor = PDFProcessor()
hypothesis_gen = HypothesisGenerator()

# Load pre-built FAISS index if it exists
if os.path.exists(Config.FAISS_INDEX_PATH):
    search_service.load(
        Config.FAISS_INDEX_PATH,
        os.path.join(Config.PROCESSED_DATA_PATH, 'arxiv_processed.parquet')
    )
    print("FAISS index loaded successfully")
else:
    print("FAISS index not found - run build_index.py first")

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'csv', 'json'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify all services are running."""
    return jsonify({
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'text_model': 'loaded',
            'image_model': 'loaded',
            'faiss_index': 'loaded' if search_service.index else 'not loaded',
            'hypothesis_generator': 'loaded',
            'arxiv_papers': search_service.index.ntotal if search_service.index else 0
        }
    })


@app.route('/api/analyze', methods=['POST'])
def analyze_multimodal():
    """
    Main analysis endpoint.
    
    Accepts: multipart/form-data with optional fields:
    - abstract: text string
    - image: image file (PNG, JPG)
    - csv_file: tabular data file
    - pdf_file: PDF research paper
    - domain: ArXiv category code
    
    Returns: JSON with summary, hypotheses, research gaps, related papers
    
    Why multipart/form-data over JSON:
    Binary files (images, PDFs) cannot be serialized to JSON efficiently.
    Multipart allows mixed text and binary data in a single request.
    """
    try:
        # Extract text input
        abstract = request.form.get('abstract', '')
        domain = request.form.get('domain', 'cs.AI')
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'domain': domain,
            'modalities_processed': []
        }
        
        text_features = None
        image_features = None
        tabular_features = None
        pdf_data = None
        
        # Process abstract/text
        if abstract and len(abstract.strip()) > 50:
            print("Processing text...")
            text_feat_matrix, feat_info = text_engineer.engineer_all_features(
                [abstract], fit=False
            )
            text_features = text_feat_matrix[0]
            results['modalities_processed'].append('text')
            results['text_features_dim'] = feat_info['total_dim']
        
        # Process uploaded image
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and allowed_file(image_file.filename):
                print("Processing image...")
                img = Image.open(image_file.stream)
                image_features = image_engineer.process_image(img)
                results['modalities_processed'].append('image')
                results['image_size'] = img.size
                results['image_mode'] = img.mode
        
        # Process CSV data
        if 'csv_file' in request.files:
            csv_file = request.files['csv_file']
            if csv_file and allowed_file(csv_file.filename):
                print("Processing CSV...")
                df = pd.read_csv(csv_file.stream)
                if len(df) > 0:
                    feat_matrix, feat_names = tabular_engineer.engineer_features(df)
                    tabular_features = feat_matrix.mean(axis=0)  # Aggregate rows
                    results['modalities_processed'].append('tabular')
                    results['csv_shape'] = list(df.shape)
                    results['engineered_features'] = feat_names[:20]
                    results['csv_statistics'] = {
                        col: {
                            'mean': float(df[col].mean()) if pd.api.types.is_numeric_dtype(df[col]) else None,
                            'std': float(df[col].std()) if pd.api.types.is_numeric_dtype(df[col]) else None,
                            'missing': int(df[col].isna().sum())
                        }
                        for col in df.columns[:10]  # First 10 columns
                    }
        
        # Process PDF file
        if 'pdf_file' in request.files:
            pdf_file = request.files['pdf_file']
            if pdf_file and allowed_file(pdf_file.filename):
                print("Processing PDF...")
                filename = secure_filename(pdf_file.filename)
                pdf_path = os.path.join(Config.UPLOAD_FOLDER, filename)
                pdf_file.save(pdf_path)
                
                pdf_data = pdf_processor.extract_all(pdf_path)
                results['modalities_processed'].append('pdf')
                results['pdf_statistics'] = pdf_data['statistics']
                results['pdf_sections'] = list(pdf_data['sections'].keys())
                
                # Use abstract from PDF if no text provided
                if not abstract and 'abstract' in pdf_data['sections']:
                    abstract = pdf_data['sections']['abstract']
                    text_feat_matrix, feat_info = text_engineer.engineer_all_features(
                        [abstract], fit=False
                    )
                    text_features = text_feat_matrix[0]
                
                os.remove(pdf_path)  # Clean up uploaded file
        
        # Require at least text input for meaningful analysis
        if not abstract:
            return jsonify({'error': 'At least an abstract or PDF is required for analysis'}), 400
        
        # Generate semantic embedding for search
        print("Generating semantic embedding for search...")
        search_embedding = text_engineer.get_scibert_embeddings([abstract])[0]
        
        # Search related papers
        related_papers = []
        if search_service.index:
            related_papers = search_service.search(
                search_embedding.astype(np.float32),
                k=Config.TOP_K_RESULTS,
                category_filter=[domain] if domain else None
            )
        
        # Generate insights
        print("Generating summary...")
        image_desc = f"Scientific image with {results.get('image_size', 'unknown')} dimensions" if 'image' in results.get('modalities_processed', []) else None
        csv_summary = f"Dataset with {results.get('csv_shape', ['?', '?'])[0]} rows and {results.get('csv_shape', ['?', '?'])[1]} columns" if 'tabular' in results.get('modalities_processed', []) else None
        
        summary = hypothesis_gen.generate_summary(abstract, image_desc, csv_summary)
        
        print("Generating hypotheses...")
        hypotheses = hypothesis_gen.generate_hypotheses(abstract, related_papers, domain)
        
        print("Identifying research gaps...")
        gaps = hypothesis_gen.identify_research_gaps(abstract, related_papers)
        
        # Compile final results
        results.update({
            'summary': summary,
            'hypotheses': hypotheses,
            'research_gaps': gaps,
            'related_papers': related_papers[:8],
            'abstract_analyzed': abstract[:300] + '...' if len(abstract) > 300 else abstract
        })
        
        return jsonify(results)
    
    except Exception as e:
        print(f"Analysis error: {traceback.format_exc()}")
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@app.route('/api/search', methods=['POST'])
def semantic_search():
    """
    Semantic search endpoint for the arXiv corpus.
    Accepts a text query and returns the most similar papers.
    """
    data = request.get_json()
    query = data.get('query', '')
    category = data.get('category', None)
    k = data.get('k', 10)
    
    if not query:
        return jsonify({'error': 'Query text is required'}), 400
    
    if not search_service.index:
        return jsonify({'error': 'Search index not initialized'}), 503
    
    try:
        # Generate embedding for the query
        query_embedding = text_engineer.get_scibert_embeddings([query])[0]
        
        # Search
        category_filter = [category] if category else None
        results = search_service.search(
            query_embedding.astype(np.float32),
            k=k,
            category_filter=category_filter
        )
        
        return jsonify({
            'query': query,
            'category': category,
            'results': results,
            'total_found': len(results)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/trends', methods=['GET'])
def get_trends():
    """
    Get publication trend data for a specific ArXiv category.
    Used for the Discovery page trend visualization.
    """
    category = request.args.get('category', 'cs.AI')
    start_year = int(request.args.get('start_year', 2018))
    end_year = int(request.args.get('end_year', 2024))
    
    if not search_service.paper_metadata is not None:
        return jsonify({'error': 'ArXiv data not loaded'}), 503
    
    try:
        trends = search_service.detect_trends(category, start_year, end_year)
        return jsonify(trends)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Return available ArXiv categories with paper counts."""
    if search_service.paper_metadata is None:
        return jsonify({'error': 'Data not loaded'}), 503
    
    category_counts = {}
    for code, name in Config.ARXIV_CATEGORIES.items():
        count = int(search_service.paper_metadata['categories'].str.contains(
            code, na=False
        ).sum())
        category_counts[code] = {
            'name': name,
            'count': count,
            'code': code
        }
    
    return jsonify({'categories': category_counts})


@app.route('/api/architecture', methods=['GET'])
def get_architecture_info():
    """
    Return model architecture information for the explainability view.
    This endpoint supports the Architecture page in the frontend.
    """
    return jsonify({
        'components': [
            {
                'name': 'SciBERT Text Encoder',
                'type': 'Transformer',
                'parameters': '110M',
                'input': 'Scientific text (max 512 tokens)',
                'output': '768-dimensional embedding',
                'training_data': '1.14M scientific papers from Semantic Scholar',
                'why': 'Domain-specific vocabulary from biology, physics, and CS domains'
            },
            {
                'name': 'ResNet-50 Image Encoder',
                'type': 'Convolutional Neural Network',
                'parameters': '25M',
                'input': '224x224 RGB image',
                'output': '2048-dimensional feature vector',
                'training_data': 'ImageNet (1.2M images, 1000 classes)',
                'why': 'Hierarchical feature extraction from edges to complex shapes'
            },
            {
                'name': 'Gated Residual Network',
                'type': 'Feedforward with gating',
                'parameters': '~500K',
                'input': 'Engineered tabular features',
                'output': '256-dimensional representation',
                'training_data': 'Trained on experimental data patterns',
                'why': 'Learned feature selection for irrelevant column suppression'
            },
            {
                'name': 'Cross-Modal Attention',
                'type': 'Multi-Head Attention',
                'parameters': '~2M',
                'input': 'Text and image encodings',
                'output': '512-dimensional fused representation',
                'training_data': 'End-to-end trained with fusion model',
                'why': 'Enables text context to guide image feature interpretation'
            },
            {
                'name': 'FLAN-T5 Large',
                'type': 'Seq2Seq Transformer',
                'parameters': '780M',
                'input': 'Structured scientific context prompt',
                'output': 'Natural language hypotheses and summaries',
                'training_data': 'Instruction-tuned on 1836 NLP tasks',
                'why': 'Reliable instruction-following for structured scientific output'
            },
            {
                'name': 'FAISS IVFFlat Index',
                'type': 'Approximate Nearest Neighbor',
                'parameters': 'N/A (index structure)',
                'input': 'Query embedding (768-dim)',
                'output': 'Top-k similar paper IDs with distances',
                'training_data': 'K-means clustering of arXiv embeddings',
                'why': 'Sub-linear search time over millions of vectors'
            }
        ]
    })


if __name__ == '__main__':
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )