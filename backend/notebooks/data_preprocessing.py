import json
import pandas as pd
import numpy as np
import re
import os
from tqdm import tqdm
from datetime import datetime

class ArXivPreprocessor:
    """
    Processes the raw ArXiv JSON dataset from Kaggle.
    Dataset: https://www.kaggle.com/datasets/Cornell-University/arxiv
    
    The dataset is a JSON lines file where each line is one paper record.
    Fields include: id, submitter, authors, title, categories, abstract, 
    update_date, versions
    
    Why we preprocess: Raw abstracts contain LaTeX markup, special characters,
    and formatting artifacts that degrade embedding quality. Clean text 
    produces better vector representations.
    """
    
    def __init__(self, data_path, output_path):
        self.data_path = data_path
        self.output_path = output_path
        self.target_categories = [
            "cs.AI", "cs.LG", "cs.CV", "quant-ph", 
            "q-bio", "eess.SP", "cs.CL", "stat.ML"
        ]
        
    def load_and_filter(self, max_records=500000):
        """
        Load ArXiv JSON and filter to target categories.
        We use 500K records as a balance between coverage and compute.
        """
        records = []
        print("Loading ArXiv dataset...")
        
        if not os.path.exists(self.data_path):
            print(f"Error: Dataset not found at {self.data_path}")
            return pd.DataFrame()
            
        with open(self.data_path, 'r') as f:
            for i, line in enumerate(tqdm(f)):
                if i >= max_records:
                    break
                try:
                    paper = json.loads(line)
                    
                    # Check if paper belongs to our target categories
                    paper_categories = paper.get('categories', '').split()
                    
                    if any(cat in paper_categories for cat in self.target_categories):
                        records.append({
                            'id': paper.get('id', ''),
                            'title': paper.get('title', ''),
                            'abstract': paper.get('abstract', ''),
                            'categories': paper.get('categories', ''),
                            'authors': paper.get('authors', ''),
                            'update_date': paper.get('update_date', ''),
                            'journal_ref': paper.get('journal-ref', ''),
                            'doi': paper.get('doi', '')
                        })
                except json.JSONDecodeError:
                    continue
        
        df = pd.DataFrame(records)
        print(f"Filtered {len(df)} papers from target categories")
        return df
    
    def clean_text(self, text):
        """
        Remove LaTeX markup, special characters, and normalize whitespace.
        
        Why: LaTeX commands like \\mathbf{}, \\cite{}, \\begin{equation}
        add noise to embeddings without adding semantic meaning.
        SciBERT's tokenizer will split these into meaningless subwords.
        """
        if not isinstance(text, str):
            return ""
        
        # Remove LaTeX math environments
        text = re.sub(r'\\$\\$.*?\\$\\$', ' MATH_BLOCK ', text, flags=re.DOTALL)
        text = re.sub(r'\\$.*?\\$', ' MATH_EXPR ', text)
        
        # Remove LaTeX commands with arguments
        text = re.sub(r'\\\\+[a-zA-Z]+\\{[^}]*\\}', ' ', text)
        
        # Remove remaining LaTeX commands
        text = re.sub(r'\\\\+[a-zA-Z]+', ' ', text)
        
        # Remove special characters but keep scientific notation
        text = re.sub(r'[^\\w\\s\\.\\,\\;\\:\\-\\%\\(\\)\\[\\]]', ' ', text)
        
        # Normalize whitespace
        text = re.sub(r'\\s+', ' ', text).strip()
        
        # Remove very short words that are likely artifacts
        words = text.split()
        text = ' '.join(w for w in words if len(w) > 1)
        
        return text
    
    def extract_year(self, date_str):
        """Extract year from update_date field for temporal analysis."""
        try:
            return int(date_str[:4])
        except:
            return None
    
    def identify_primary_category(self, categories_str):
        """
        ArXiv papers can have multiple categories.
        We assign the first listed as primary for classification.
        """
        if not isinstance(categories_str, str):
            return 'unknown'
        cats = categories_str.split()
        return cats[0] if cats else 'unknown'
    
    def preprocess(self):
        df = self.load_and_filter()
        if df.empty:
            return df
            
        print("Cleaning text fields...")
        df['title_clean'] = df['title'].apply(self.clean_text)
        df['abstract_clean'] = df['abstract'].apply(self.clean_text)
        
        # Combine title and abstract for richer representation
        df['full_text'] = df['title_clean'] + ' [SEP] ' + df['abstract_clean']
        
        print("Extracting temporal features...")
        df['year'] = df['update_date'].apply(self.extract_year)
        df['primary_category'] = df['categories'].apply(self.identify_primary_category)
        
        # Remove papers with missing essential fields
        df = df.dropna(subset=['abstract_clean', 'year'])
        df = df[df['abstract_clean'].str.len() > 100]  # Minimum content threshold
        
        print("Computing text statistics...")
        df['abstract_word_count'] = df['abstract_clean'].apply(lambda x: len(x.split()))
        df['abstract_sentence_count'] = df['abstract_clean'].apply(
            lambda x: len(re.split(r'[.!?]+', x))
        )
        
        # Save processed data
        os.makedirs(self.output_path, exist_ok=True)
        output_file = os.path.join(self.output_path, 'arxiv_processed.parquet')
        df.to_parquet(output_file, index=False)
        print(f"Saved {len(df)} processed papers to {output_file}")
        
        return df


if __name__ == "__main__":
    # Adjust paths to match project structure from backend/
    # The notebook assumes data is in data/raw relative to it.
    # From backend/, it might be ../data/raw/ or just data/raw/ if it exists in backend.
    data_file = "data/raw/arxiv-metadata-oai-snapshot.json"
    if not os.path.exists(data_file):
        # Try one level up
        data_file = "../data/raw/arxiv-metadata-oai-snapshot.json"
        
    preprocessor = ArXivPreprocessor(
        data_path=data_file,
        output_path="data/processed/"
    )
    df = preprocessor.preprocess()
    if not df.empty:
        print(df[['title_clean', 'year', 'primary_category', 'abstract_word_count']].head())
        print(df['primary_category'].value_counts().head(10))
