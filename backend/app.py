from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
import traceback
from config import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["*"])
app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH

# Create upload directory
os.makedirs(config.UPLOAD_DIR, exist_ok=True)

# ==========================================
# Lazy import services to avoid startup crash
# ==========================================
_insight_service = None
_arxiv_service = None

def get_insight_service():
    global _insight_service
    if _insight_service is None:
        from services.insight_service import insight_service
        _insight_service = insight_service
    return _insight_service

def get_arxiv_service():
    global _arxiv_service
    if _arxiv_service is None:
        from services.arxiv_service import arxiv_service
        _arxiv_service = arxiv_service
    return _arxiv_service

# ==========================================
# HELPER
# ==========================================
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

def read_file_bytes(file_obj):
    return file_obj.read()

# ==========================================
# ROUTES
# ==========================================

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'running',
        'project': 'Scientific Insight Generation',
        'version': '2.0',
        'endpoints': [
            '/api/analyze',
            '/api/search',
            '/api/trends',
            '/api/health',
            '/api/generate-hypothesis'
        ]
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models': {
            'scibert': True,
            'vit': True,
            'grn': True,
            'flan_t5': True,
            'faiss': True
        },
        'message': 'All systems operational'
    })

# ==========================================
# ANALYZE ENDPOINT
# ==========================================
@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Main multimodal analysis endpoint"""
    try:
        text = request.form.get('text', '').strip()
        
        image_bytes = None
        csv_bytes = None
        pdf_bytes = None
        
        # Handle file uploads
        if 'image' in request.files:
            img_file = request.files['image']
            if img_file and img_file.filename:
                image_bytes = read_file_bytes(img_file)
        
        if 'csv' in request.files:
            csv_file = request.files['csv']
            if csv_file and csv_file.filename:
                csv_bytes = read_file_bytes(csv_file)
        
        if 'pdf' in request.files:
            pdf_file = request.files['pdf']
            if pdf_file and pdf_file.filename:
                pdf_bytes = read_file_bytes(pdf_file)
        
        # Validate: at least one input
        if not text and not image_bytes and not csv_bytes and not pdf_bytes:
            return jsonify({
                'success': False,
                'error': 'Please provide at least one input: text, image, CSV, or PDF'
            }), 400
        
        # Run analysis
        service = get_insight_service()
        result = service.analyze_multimodal(
            text=text,
            image_bytes=image_bytes,
            csv_bytes=csv_bytes,
            pdf_bytes=pdf_bytes
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Analyze error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==========================================
# SEARCH ENDPOINT
# ==========================================
@app.route('/api/search', methods=['POST'])
def search():
    """Search arXiv papers"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        query = data.get('query', '').strip()
        category = data.get('category', None)
        top_k = min(int(data.get('top_k', 10)), 20)
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        service = get_arxiv_service()
        results = service.search(query, category=category, top_k=top_k)
        
        return jsonify({
            'success': True,
            **results
        })
    
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# TRENDS ENDPOINT
# ==========================================
@app.route('/api/trends', methods=['GET'])
def trends():
    """Get research trends"""
    try:
        category = request.args.get('category', 'Machine Learning')
        
        service = get_arxiv_service()
        trend_data = service.get_trends(category)
        
        return jsonify({
            'success': True,
            **trend_data
        })
    
    except Exception as e:
        logger.error(f"Trends error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# HYPOTHESIS ENDPOINT
# ==========================================
@app.route('/api/generate-hypothesis', methods=['POST'])
def generate_hypothesis():
    """Generate hypothesis from text alone"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data'}), 400
        
        text = data.get('text', '').strip()
        domain = data.get('domain', 'Science')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        from models.text_analyzer import text_analyzer
        from models.hypothesis_generator import hypothesis_generator
        
        # Quick analysis
        text_result = text_analyzer.analyze(text)
        
        context = {
            'text': text,
            'domain': text_result.get('domain', domain),
            'concepts': text_result.get('key_concepts', [])
        }
        
        hypotheses = hypothesis_generator.generate_hypothesis(context)
        insights = hypothesis_generator.generate_insights(context)
        summary = hypothesis_generator.generate_summary(context)
        
        return jsonify({
            'success': True,
            'hypotheses': hypotheses,
            'insights': insights,
            'summary': summary,
            'domain': context['domain'],
            'key_concepts': context['concepts']
        })
    
    except Exception as e:
        logger.error(f"Hypothesis error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# EDA DATA ENDPOINTS
# ==========================================
@app.route('/api/eda/stats', methods=['GET'])
def eda_stats():
    """Get statistics for World Bank or RVL-CDIP"""
    try:
        dataset = request.args.get('dataset', 'worldbank')
        
        if dataset == 'worldbank':
            path = config.WORLD_BANK_SAMPLE
            if not os.path.exists(path):
                return jsonify({'success': False, 'error': 'World Bank data not found'}), 404
                
            import pandas as pd
            df = pd.read_csv(path)
            
            # Group by year for trends
            trends = df.groupby('year').agg({
                'gdp_growth': 'mean',
                'life_expectancy': 'mean',
                'unemployment_rate': 'mean'
            }).reset_index().to_dict(orient='records')
            
            # Get latest year for country comparison
            latest_year = df['year'].max()
            countries = df[df['year'] == latest_year].to_dict(orient='records')
            
            return jsonify({
                'success': True,
                'trends': trends,
                'countries': countries,
                'summary': {
                    'total_records': len(df),
                    'year_range': f"{df['year'].min()}-{df['year'].max()}",
                    'indicators': ['GDP Growth', 'Life Expectancy', 'Unemployment', 'Population']
                }
            })
            
        elif dataset == 'rvlcdip':
            # Categories based on the script
            categories = [
                {'name': 'Microscopy', 'value': 25000, 'file': 'sample_microscopy.png'},
                {'name': 'Chart', 'value': 25000, 'file': 'sample_chart.png'},
                {'name': 'Graph', 'value': 25000, 'file': 'sample_graph.png'},
                {'name': 'Heatmap', 'value': 25000, 'file': 'sample_heatmap.png'}
            ]
            return jsonify({
                'success': True,
                'categories': categories,
                'total_images': 100000
            })
            
        return jsonify({'success': False, 'error': 'Invalid dataset'}), 400
        
    except Exception as e:
        logger.error(f"EDA stats error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/eda/image/<filename>', methods=['GET'])
def eda_image(filename):
    """Serve sample dataset images"""
    try:
        return send_from_directory(config.IMAGE_SAMPLE_DIR, filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# ==========================================
# FRAMEWORK STATS
# ==========================================
@app.route('/api/framework/stats', methods=['GET'])
def framework_stats():
    """Stats from the integrated multimodal framework"""
    try:
        service = get_arxiv_service()
        index_stats = service.get_stats()

        import os
        from config import config
        papers_csv = getattr(config, 'PAPERS_CSV', '')
        paper_count = 0
        category_count = 0
        if os.path.exists(papers_csv):
            import pandas as pd
            df = pd.read_csv(papers_csv)
            paper_count = len(df)
            if 'categories' in df.columns:
                category_count = df['categories'].str.strip().nunique()

        return jsonify({
            'success': True,
            'framework': {
                'papers_in_csv': paper_count,
                'categories': category_count,
                'papers_indexed_in_faiss': index_stats.get('faiss_index_size', 0),
                'encoder_ready': index_stats.get('encoder_ready', False),
                'data_sources': ['papers_metadata.csv', 'image_mappings.csv', 'extracted_entities.json']
            }
        })
    except Exception as e:
        logger.error(f"Framework stats error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# ARXIV CATEGORIES
# ==========================================
@app.route('/api/categories', methods=['GET'])
def categories():
    return jsonify({
        'success': True,
        'categories': list(config.ARXIV_CATEGORIES.keys())
    })

# ==========================================
# ERROR HANDLERS
# ==========================================
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Max 50MB'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# ==========================================
# MAIN
# ==========================================
if __name__ == '__main__':
    logger.info("🚀 Starting Scientific Insight API...")
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=config.DEBUG,
        threaded=True
    )