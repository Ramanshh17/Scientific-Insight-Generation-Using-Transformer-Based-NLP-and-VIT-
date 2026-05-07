import requests
import xml.etree.ElementTree as ET
import numpy as np
import pickle
import os
import logging
from sentence_transformers import SentenceTransformer
import faiss
from config import config

logger = logging.getLogger(__name__)

class ArxivService:
    def __init__(self):
        self.encoder = None
        self.faiss_index = None
        self.metadata = []
        self._load_encoder()
        self._load_or_build_index()
    
    def _load_encoder(self):
        try:
            self.encoder = SentenceTransformer(config.SENTENCE_MODEL)
            logger.info("✅ Sentence encoder loaded")
        except Exception as e:
            logger.error(f"Encoder load error: {e}")
    
    def _load_or_build_index(self):
        """Load existing FAISS index or build from CSV + seed papers"""
        os.makedirs(os.path.dirname(config.FAISS_INDEX_PATH), exist_ok=True)

        if (os.path.exists(config.FAISS_INDEX_PATH) and
                os.path.exists(config.ARXIV_METADATA_PATH)):
            try:
                self.faiss_index = faiss.read_index(config.FAISS_INDEX_PATH)
                with open(config.ARXIV_METADATA_PATH, 'rb') as f:
                    self.metadata = pickle.load(f)
                logger.info(f"✅ FAISS index loaded: {len(self.metadata)} papers")
                return
            except Exception as e:
                logger.error(f"Index load error: {e}")

        # First load rich CSV data, then top up with live seed papers
        logger.info("Building FAISS index from papers_metadata.csv + seed papers...")
        self._load_papers_from_csv()
        self._build_seed_index()

    def _load_papers_from_csv(self):
        """Load papers from the processed papers_metadata.csv into FAISS."""
        papers_csv = getattr(config, 'PAPERS_CSV', None)
        if not papers_csv or not os.path.exists(papers_csv):
            logger.warning("papers_metadata.csv not found — skipping CSV load")
            return
        try:
            import pandas as pd
            df = pd.read_csv(papers_csv).fillna('')
            # Normalise column names to what the rest of the service expects
            col_map = {
                'id': 'id', 'title': 'title', 'abstract': 'abstract',
                'authors': 'authors', 'categories': 'categories',
                'published': 'published', 'update_date': 'update_date'
            }
            papers = []
            for _, row in df.iterrows():
                title = str(row.get('title', ''))
                abstract = str(row.get('abstract', ''))
                cats = str(row.get('categories', ''))
                papers.append({
                    'id': str(row.get('id', '')),
                    'title': title,
                    'abstract': abstract,
                    'authors': [str(row.get('authors', ''))[:80]],
                    'categories': cats.split()[:3],
                    'published': str(row.get('update_date', row.get('published', 'Unknown')))[:10],
                    'url': f"https://arxiv.org/abs/{row.get('id', '')}",
                    'domain': self._categorize_paper(cats.split())
                })
            if papers:
                self._add_to_index(papers)
                logger.info(f"✅ Loaded {len(papers)} papers from papers_metadata.csv")
        except Exception as e:
            logger.error(f"CSV load error: {e}")
    
    def _build_seed_index(self):
        """Build initial FAISS index with sample papers"""
        try:
            seed_papers = self._fetch_arxiv_papers("machine learning", max_results=50)
            seed_papers += self._fetch_arxiv_papers("quantum computing", max_results=30)
            seed_papers += self._fetch_arxiv_papers("bioinformatics", max_results=30)
            seed_papers += self._fetch_arxiv_papers("computer vision", max_results=30)
            
            if not seed_papers:
                logger.warning("No seed papers fetched, using fallback")
                seed_papers = self._get_fallback_papers()
            
            self._add_to_index(seed_papers)
            logger.info(f"✅ Index built with {len(seed_papers)} papers")
        except Exception as e:
            logger.error(f"Seed index error: {e}")
            self.metadata = self._get_fallback_papers()
    
    def _fetch_arxiv_papers(self, query: str, max_results: int = 20) -> list:
        """Fetch papers from arXiv API"""
        try:
            url = "https://export.arxiv.org/api/query"
            params = {
                'search_query': f'all:{query}',
                'start': 0,
                'max_results': max_results,
                'sortBy': 'submittedDate',
                'sortOrder': 'descending'
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            papers = self._parse_arxiv_xml(response.text)
            return papers
        except Exception as e:
            logger.error(f"arXiv fetch error for '{query}': {e}")
            return []
    
    def _parse_arxiv_xml(self, xml_text: str) -> list:
        """Parse arXiv API XML response"""
        papers = []
        try:
            root = ET.fromstring(xml_text)
            ns = {'atom': 'http://www.w3.org/2005/Atom',
                  'arxiv': 'http://arxiv.org/schemas/atom'}
            
            for entry in root.findall('atom:entry', ns):
                try:
                    # Extract fields
                    title_el = entry.find('atom:title', ns)
                    summary_el = entry.find('atom:summary', ns)
                    id_el = entry.find('atom:id', ns)
                    published_el = entry.find('atom:published', ns)
                    
                    # Categories
                    categories = [
                        cat.get('term', '') 
                        for cat in entry.findall('atom:category', ns)
                    ]
                    
                    # Authors
                    authors = [
                        author.find('atom:name', ns).text
                        for author in entry.findall('atom:author', ns)
                        if author.find('atom:name', ns) is not None
                    ]
                    
                    if title_el is None or summary_el is None:
                        continue
                    
                    paper = {
                        'id': id_el.text.split('/')[-1] if id_el is not None else 'unknown',
                        'title': title_el.text.strip().replace('\n', ' '),
                        'abstract': summary_el.text.strip().replace('\n', ' '),
                        'authors': authors[:5],
                        'categories': categories,
                        'published': published_el.text[:10] if published_el is not None else 'Unknown',
                        'url': id_el.text if id_el is not None else '#',
                        'domain': self._categorize_paper(categories)
                    }
                    papers.append(paper)
                except Exception:
                    continue
        except Exception as e:
            logger.error(f"XML parse error: {e}")
        
        return papers
    
    def _categorize_paper(self, categories: list) -> str:
        cat_str = ' '.join(categories).lower()
        if any(c in cat_str for c in ['cs.ai', 'cs.lg', 'cs.ne']):
            return 'Artificial Intelligence'
        elif any(c in cat_str for c in ['cs.cv']):
            return 'Computer Vision'
        elif any(c in cat_str for c in ['cs.cl']):
            return 'Natural Language Processing'
        elif any(c in cat_str for c in ['quant-ph']):
            return 'Quantum Physics'
        elif any(c in cat_str for c in ['q-bio']):
            return 'Bioinformatics'
        elif any(c in cat_str for c in ['physics']):
            return 'Physics'
        elif any(c in cat_str for c in ['math']):
            return 'Mathematics'
        else:
            return 'Computer Science'
    
    def _add_to_index(self, papers: list):
        """Add papers to FAISS index"""
        if not papers or not self.encoder:
            return
        
        texts = [f"{p['title']} {p['abstract'][:200]}" for p in papers]
        
        try:
            embeddings = self.encoder.encode(texts, show_progress_bar=False)
            embeddings = embeddings.astype(np.float32)
            
            # Normalize for cosine similarity
            faiss.normalize_L2(embeddings)
            
            if self.faiss_index is None:
                dim = embeddings.shape[1]
                self.faiss_index = faiss.IndexFlatIP(dim)
            
            self.faiss_index.add(embeddings)
            self.metadata.extend(papers)
            
            # Save index
            faiss.write_index(self.faiss_index, config.FAISS_INDEX_PATH)
            with open(config.ARXIV_METADATA_PATH, 'wb') as f:
                pickle.dump(self.metadata, f)
                
        except Exception as e:
            logger.error(f"FAISS add error: {e}")
    
    def search(self, query: str, category: str = None, top_k: int = 10) -> dict:
        """Search papers using FAISS semantic search + live arXiv"""
        results = {
            'semantic_results': [],
            'live_results': [],
            'query': query,
            'total_found': 0
        }
        
        # Semantic search in FAISS index
        if self.faiss_index and self.encoder and self.metadata:
            try:
                query_emb = self.encoder.encode([query]).astype(np.float32)
                faiss.normalize_L2(query_emb)
                
                scores, indices = self.faiss_index.search(query_emb, min(top_k, len(self.metadata)))
                
                for score, idx in zip(scores[0], indices[0]):
                    if idx >= 0 and idx < len(self.metadata):
                        paper = self.metadata[idx].copy()
                        paper['relevance_score'] = round(float(score), 4)
                        paper['search_method'] = 'Semantic (FAISS)'
                        results['semantic_results'].append(paper)
            except Exception as e:
                logger.error(f"FAISS search error: {e}")
        
        # Live arXiv search
        try:
            search_query = query
            if category and category in config.ARXIV_CATEGORIES:
                cat_code = config.ARXIV_CATEGORIES[category]
                search_query = f"cat:{cat_code} AND all:{query}"
            
            live_papers = self._fetch_arxiv_papers(search_query, max_results=5)
            
            for paper in live_papers:
                paper['relevance_score'] = 0.95
                paper['search_method'] = 'Live arXiv API'
            
            results['live_results'] = live_papers
            
            # Add to index for future searches
            if live_papers:
                self._add_to_index(live_papers)
        except Exception as e:
            logger.error(f"Live search error: {e}")
        
        results['total_found'] = len(results['semantic_results']) + len(results['live_results'])
        return results
    
    def get_trends(self, category: str) -> dict:
        """Analyze research trends in a category"""
        try:
            # Fetch recent papers
            cat_code = config.ARXIV_CATEGORIES.get(category, category)
            papers = self._fetch_arxiv_papers(f"cat:{cat_code}", max_results=50)
            
            if not papers:
                papers = [p for p in self.metadata 
                         if category.lower() in p.get('domain', '').lower()][:20]
            
            # Extract trending topics
            all_text = ' '.join([f"{p['title']} {p['abstract'][:100]}" for p in papers])
            topics = self._extract_trending_topics(all_text)
            
            # Year distribution
            year_dist = {}
            for p in papers:
                year = p.get('published', 'Unknown')[:4]
                year_dist[year] = year_dist.get(year, 0) + 1
            
            return {
                'category': category,
                'paper_count': len(papers),
                'trending_topics': topics,
                'year_distribution': year_dist,
                'recent_papers': papers[:5],
                'growth_rate': self._compute_growth_rate(year_dist)
            }
        except Exception as e:
            logger.error(f"Trend analysis error: {e}")
            return {'error': str(e)}
    
    def _extract_trending_topics(self, text: str) -> list:
        import re
        from collections import Counter
        
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        
        stop_words = {
            'this', 'that', 'with', 'from', 'have', 'been', 'their',
            'they', 'which', 'these', 'also', 'more', 'such', 'than',
            'show', 'propose', 'paper', 'method', 'using', 'based',
            'approach', 'results', 'present', 'both', 'each', 'high'
        }
        
        filtered = [w for w in words if w not in stop_words]
        
        counter = Counter(filtered)
        return [
            {'topic': topic, 'frequency': count, 'trend': 'Rising'}
            for topic, count in counter.most_common(15)
        ]
    
    def _compute_growth_rate(self, year_dist: dict) -> str:
        if len(year_dist) < 2:
            return 'Insufficient data'
        
        years = sorted(year_dist.keys())
        if len(years) >= 2:
            latest = year_dist.get(years[-1], 0)
            previous = year_dist.get(years[-2], 0)
            if previous > 0:
                rate = ((latest - previous) / previous) * 100
                return f"{rate:+.1f}%"
        return 'N/A'
    
    def _get_fallback_papers(self) -> list:
        return [
            {
                'id': 'fallback_1',
                'title': 'Attention Is All You Need',
                'abstract': 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
                'authors': ['Vaswani, A.'],
                'categories': ['cs.CL'],
                'published': '2017-06-12',
                'url': 'https://arxiv.org/abs/1706.03762',
                'domain': 'Natural Language Processing'
            },
            {
                'id': 'fallback_2', 
                'title': 'BERT: Pre-training of Deep Bidirectional Transformers',
                'abstract': 'We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers.',
                'authors': ['Devlin, J.'],
                'categories': ['cs.CL'],
                'published': '2018-10-11',
                'url': 'https://arxiv.org/abs/1810.04805',
                'domain': 'Natural Language Processing'
            }
        ]

    def get_stats(self) -> dict:
        """Return summary stats about the loaded index."""
        return {
            'papers_indexed': len(self.metadata),
            'faiss_index_size': self.faiss_index.ntotal if self.faiss_index else 0,
            'encoder_ready': self.encoder is not None,
            'csv_loaded': os.path.exists(getattr(config, 'PAPERS_CSV', ''))
        }

arxiv_service = ArxivService()