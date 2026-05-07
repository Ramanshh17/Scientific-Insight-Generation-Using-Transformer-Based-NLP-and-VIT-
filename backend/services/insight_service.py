import logging
import numpy as np
from models.text_analyzer import text_analyzer
from models.image_analyzer import image_analyzer
from models.tabular_analyzer import tabular_analyzer
from models.fusion import fusion_analyzer
from models.hypothesis_generator import hypothesis_generator
from services.feature_engineering import feature_engineer
from services.pdf_processor import pdf_service
import pandas as pd
import io

logger = logging.getLogger(__name__)

class InsightService:
    
    def analyze_multimodal(
        self,
        text: str = None,
        image_bytes: bytes = None,
        csv_bytes: bytes = None,
        pdf_bytes: bytes = None
    ) -> dict:
        """Main multimodal analysis pipeline"""
        
        result = {
            'text_analysis': {},
            'image_analysis': {},
            'tabular_analysis': {},
            'fusion': {},
            'summary': '',
            'insights': [],
            'hypotheses': [],
            'feature_engineering': {},
            'pipeline_steps': []
        }
        
        try:
            # ====== STEP 1: PDF Processing ======
            if pdf_bytes:
                result['pipeline_steps'].append('PDF Extraction')
                pdf_result = pdf_service.extract(pdf_bytes)
                text = text or pdf_result.get('text', '')
                result['pdf_data'] = {
                    'page_count': pdf_result.get('page_count', 0),
                    'word_count': pdf_result.get('word_count', 0),
                    'abstract': pdf_result.get('abstract', ''),
                    'sections': pdf_result.get('sections', []),
                    'table_count': len(pdf_result.get('tables', [])),
                    'image_count': len(pdf_result.get('images', []))
                }
                
                # Use first PDF image if no image provided
                if not image_bytes and pdf_result.get('images'):
                    image_bytes = pdf_result['images'][0]['bytes']
            
            # ====== STEP 2: Text Analysis ======
            if text:
                result['pipeline_steps'].append('Text Analysis (SciBERT)')
                text_result = text_analyzer.analyze(text)
                
                # Feature engineering for text
                text_features = feature_engineer.engineer_text_features(text)
                
                result['text_analysis'] = {
                    **text_result,
                    'engineered_features': text_features
                }
                result['feature_engineering']['text_features'] = text_features
            
            # ====== STEP 3: Image Analysis ======
            if image_bytes:
                result['pipeline_steps'].append('Image Analysis (ViT)')
                image_result = image_analyzer.analyze(image_bytes)
                
                # Feature engineering for image
                from PIL import Image
                import numpy as np
                import io
                pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
                img_array = np.array(pil_img)
                img_features = feature_engineer.engineer_image_features(img_array)
                
                result['image_analysis'] = {
                    **image_result,
                    'engineered_features': img_features
                }
                result['feature_engineering']['image_features'] = img_features
            
            # ====== STEP 4: Tabular Analysis ======
            if csv_bytes:
                result['pipeline_steps'].append('Tabular Analysis (GRN)')
                try:
                    df = pd.read_csv(io.BytesIO(csv_bytes))
                    
                    # Feature engineering first
                    fe_result = feature_engineer.engineer_tabular_features(df)
                    cleaned_df = fe_result.get('cleaned_df', df)
                    
                    tabular_result = tabular_analyzer.analyze(cleaned_df)
                    
                    result['tabular_analysis'] = {
                        **tabular_result,
                        'original_shape': {'rows': len(df), 'cols': len(df.columns)},
                        'cleaned_shape': {
                            'rows': len(cleaned_df), 
                            'cols': len(cleaned_df.columns)
                        },
                        'data_quality_score': fe_result['features'].get('data_quality_score', 100),
                        'engineered_features': fe_result['features']
                    }
                    result['feature_engineering']['tabular_features'] = fe_result['features']
                except Exception as e:
                    result['tabular_analysis'] = {'error': str(e)}
            
            # ====== STEP 5: Multimodal Fusion ======
            result['pipeline_steps'].append('Cross-Modal Fusion (Attention)')
            
            text_emb = result['text_analysis'].get('embedding', [0]*768)
            image_emb = result['image_analysis'].get('embedding', [0]*768)
            tab_emb = result['tabular_analysis'].get('embedding', [0]*64)
            
            fusion_result = fusion_analyzer.fuse(text_emb, image_emb, tab_emb)
            result['fusion'] = fusion_result
            
            # ====== STEP 6: Summary + Insights + Hypotheses ======
            result['pipeline_steps'].append('Hypothesis Generation (FLAN-T5)')
            
            context = {
                'text': text or '',
                'domain': result['text_analysis'].get('domain', 'Science'),
                'concepts': result['text_analysis'].get('key_concepts', []),
                'image_type': result['image_analysis'].get('image_type', ''),
                'tabular_stats': result['tabular_analysis'].get('statistics', {})
            }
            
            result['summary'] = hypothesis_generator.generate_summary(context)
            result['insights'] = hypothesis_generator.generate_insights(context)
            result['hypotheses'] = hypothesis_generator.generate_hypothesis(context)
            
            # ====== STEP 7: Performance Metrics ======
            result['performance_metrics'] = self._compute_performance_metrics(result)
            
            result['success'] = True
            
        except Exception as e:
            logger.error(f"Analysis pipeline error: {e}")
            result['error'] = str(e)
            result['success'] = False
        
        return result
    
    def _compute_performance_metrics(self, result: dict) -> dict:
        metrics = {
            'modalities_processed': len(result['pipeline_steps']),
            'text_confidence': 0.0,
            'image_confidence': 0.0,
            'fusion_quality': 0.0,
            'overall_confidence': 0.0
        }
        
        if result['text_analysis'].get('embedding'):
            emb = np.array(result['text_analysis']['embedding'])
            metrics['text_confidence'] = min(1.0, float(np.linalg.norm(emb)) / 30)
        
        if result['image_analysis'].get('complexity_score'):
            metrics['image_confidence'] = min(1.0, result['image_analysis']['complexity_score'] / 100)
        
        metrics['fusion_quality'] = result['fusion'].get('fusion_quality', 0) / 100
        
        confidences = [v for k, v in metrics.items() if k.endswith('_confidence') and v > 0]
        metrics['overall_confidence'] = round(
            np.mean(confidences) if confidences else 0.75, 4
        )
        
        return metrics

insight_service = InsightService()