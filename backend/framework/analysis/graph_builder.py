# src/analysis/graph_builder.py

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import json
from pathlib import Path

class ScientificGraphBuilder:
    """
    Build various types of graphs from scientific data:
    1. Citation network
    2. Co-authorship network
    3. Topic similarity network
    4. Paper-concept knowledge graph
    5. Cross-modal (text-image) graph
    """
    
    def __init__(self):
        self.graphs = {}
    
    def build_citation_network(self, papers_df):
        """
        Build citation network from papers
        
        Nodes: Papers
        Edges: Citations (Paper A cites Paper B)
        """
        G = nx.DiGraph()
        
        # Add nodes (papers)
        for idx, row in papers_df.iterrows():
            paper_id = row.get('id', f'paper_{idx}')
            G.add_node(paper_id, 
                      title=row.get('title', ''),
                      year=row.get('year', 0),
                      categories=row.get('categories', ''))
        
        # Add edges (citations)
        # Note: Real citation data would come from paper metadata
        # Here we simulate based on similarity and temporal order
        
        if 'references' in papers_df.columns:
            # If citation data available
            for idx, row in papers_df.iterrows():
                paper_id = row.get('id', f'paper_{idx}')
                refs = row.get('references', [])
                
                if isinstance(refs, list):
                    for ref in refs:
                        if ref in G.nodes():
                            G.add_edge(paper_id, ref)
        
        self.graphs['citation'] = G
        return G
    
    def build_similarity_network(self, papers_df, embeddings, threshold=0.7):
        """
        Build similarity network based on text embeddings
        
        Nodes: Papers
        Edges: High similarity (cosine similarity > threshold)
        
        Args:
            papers_df: Papers metadata
            embeddings: Text embeddings array (n_papers, embedding_dim)
            threshold: Similarity threshold for creating edge
        """
        G = nx.Graph()
        
        # Compute similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Add nodes
        for idx, row in papers_df.iterrows():
            paper_id = row.get('id', f'paper_{idx}')
            G.add_node(paper_id,
                      title=row.get('title', ''),
                      categories=row.get('categories', ''),
                      year=row.get('year', 0))
        
        # Add edges based on similarity
        n_papers = len(papers_df)
        for i in range(n_papers):
            for j in range(i + 1, n_papers):
                if similarity_matrix[i, j] > threshold:
                    paper_i = papers_df.iloc[i].get('id', f'paper_{i}')
                    paper_j = papers_df.iloc[j].get('id', f'paper_{j}')
                    
                    G.add_edge(paper_i, paper_j, 
                             weight=float(similarity_matrix[i, j]))
        
        self.graphs['similarity'] = G
        return G
    
    def build_coauthorship_network(self, papers_df):
        """
        Build co-authorship network
        
        Nodes: Authors
        Edges: Co-authored papers
        """
        G = nx.Graph()
        
        for idx, row in papers_df.iterrows():
            authors = row.get('authors', [])
            
            if isinstance(authors, str):
                # Parse author string
                authors = [a.strip() for a in authors.split(',')]
            
            # Add edges between all author pairs
            for i, author1 in enumerate(authors):
                if not G.has_node(author1):
                    G.add_node(author1, papers=1)
                else:
                    G.nodes[author1]['papers'] += 1
                
                for author2 in authors[i+1:]:
                    if G.has_edge(author1, author2):
                        G[author1][author2]['weight'] += 1
                    else:
                        G.add_edge(author1, author2, weight=1)
        
        self.graphs['coauthorship'] = G
        return G
    
    def build_knowledge_graph(self, papers_df, entities_dict):
        """
        Build knowledge graph from papers and extracted entities
        
        Nodes: Papers, Methods, Datasets, Metrics
        Edges: Paper-uses-Method, Paper-evaluates-on-Dataset, etc.
        
        Args:
            papers_df: Papers metadata
            entities_dict: Dict mapping paper_id to extracted entities
        """
        G = nx.MultiDiGraph()
        
        # Add paper nodes
        for idx, row in papers_df.iterrows():
            paper_id = row.get('id', f'paper_{idx}')
            G.add_node(paper_id, 
                      node_type='paper',
                      title=row.get('title', ''))
        
        # Add entity nodes and relationships
        for paper_id, entities in entities_dict.items():
            if paper_id not in G:
                continue
            
            # Methods
            for method in entities.get('methods', []):
                if not G.has_node(method):
                    G.add_node(method, node_type='method')
                G.add_edge(paper_id, method, relation='uses_method')
            
            # Datasets
            for dataset in entities.get('datasets', []):
                if not G.has_node(dataset):
                    G.add_node(dataset, node_type='dataset')
                G.add_edge(paper_id, dataset, relation='evaluates_on')
            
            # Metrics
            for metric in entities.get('metrics', []):
                if not G.has_node(metric):
                    G.add_node(metric, node_type='metric')
                G.add_edge(paper_id, metric, relation='reports_metric')
        
        self.graphs['knowledge'] = G
        return G
    
    def build_multimodal_graph(self, papers_df, image_mappings_df, 
                               text_embeddings, image_embeddings):
        """
        Build graph connecting papers, images, and concepts
        
        Nodes: Papers, Images, Concepts
        Edges: Paper-has-Image, Image-depicts-Concept, etc.
        """
        G = nx.Graph()
        
        # Add paper nodes
        for idx, row in papers_df.iterrows():
            paper_id = row.get('id', f'paper_{idx}')
            G.add_node(paper_id, 
                      node_type='paper',
                      title=row.get('title', ''))
        
        # Add image nodes and connect to papers
        for idx, row in image_mappings_df.iterrows():
            image_id = row.get('image_id', f'img_{idx}')
            paper_id = row.get('paper_id')
            
            G.add_node(image_id, 
                      node_type='image',
                      path=row.get('image_path', ''))
            
            if paper_id in G:
                G.add_edge(paper_id, image_id, relation='contains_image')
        
        # Add concept nodes based on clustering
        # (concepts derived from text embeddings)
        from sklearn.cluster import KMeans
        
        n_concepts = min(50, len(text_embeddings) // 10)
        kmeans = KMeans(n_clusters=n_concepts, random_state=42)
        concept_labels = kmeans.fit_predict(text_embeddings)
        
        for concept_id in range(n_concepts):
            concept_node = f'concept_{concept_id}'
            G.add_node(concept_node, node_type='concept')
        
        # Connect papers to concepts
        for idx, concept_id in enumerate(concept_labels):
            paper_id = papers_df.iloc[idx].get('id', f'paper_{idx}')
            concept_node = f'concept_{concept_id}'
            
            if paper_id in G and concept_node in G:
                G.add_edge(paper_id, concept_node, relation='discusses_concept')
        
        self.graphs['multimodal'] = G
        return G
    
    def build_temporal_graph(self, papers_df):
        """
        Build temporal evolution graph
        
        Nodes: Papers
        Edges: Temporal relationships (influence, evolution)
        """
        G = nx.DiGraph()
        
        # Sort by year
        papers_sorted = papers_df.sort_values('year') if 'year' in papers_df else papers_df
        
        # Add nodes with temporal attributes
        for idx, row in papers_sorted.iterrows():
            paper_id = row.get('id', f'paper_{idx}')
            G.add_node(paper_id,
                      title=row.get('title', ''),
                      year=row.get('year', 0),
                      categories=row.get('categories', ''))
        
        # Add temporal edges (papers in same category, sequential years)
        for idx, row1 in papers_sorted.iterrows():
            paper1 = row1.get('id', f'paper_{idx}')
            year1 = row1.get('year', 0)
            cat1 = row1.get('categories', '')
            
            for jdx, row2 in papers_sorted.iterrows():
                if idx >= jdx:
                    continue
                
                paper2 = row2.get('id', f'paper_{jdx}')
                year2 = row2.get('year', 0)
                cat2 = row2.get('categories', '')
                
                # Connect if same category and sequential years
                if cat1 == cat2 and 0 < (year2 - year1) <= 2:
                    G.add_edge(paper1, paper2, 
                             temporal_gap=year2 - year1)
        
        self.graphs['temporal'] = G
        return G
    
    def compute_graph_metrics(self, graph_type='similarity'):
        """
        Compute various graph metrics
        
        Returns:
            Dict of metrics
        """
        if graph_type not in self.graphs:
            return {}
        
        G = self.graphs[graph_type]
        
        metrics = {
            'num_nodes': G.number_of_nodes(),
            'num_edges': G.number_of_edges(),
            'density': nx.density(G),
            'is_connected': nx.is_connected(G) if not G.is_directed() else nx.is_weakly_connected(G)
        }
        
        # Centrality measures (if graph not too large)
        if G.number_of_nodes() < 1000:
            if not G.is_directed():
                metrics['avg_clustering'] = nx.average_clustering(G)
                metrics['degree_centrality'] = nx.degree_centrality(G)
                metrics['betweenness_centrality'] = nx.betweenness_centrality(G)
                metrics['closeness_centrality'] = nx.closeness_centrality(G)
            else:
                metrics['in_degree_centrality'] = nx.in_degree_centrality(G)
                metrics['out_degree_centrality'] = nx.out_degree_centrality(G)
        
        # Community detection
        if not G.is_directed() and nx.is_connected(G):
            communities = nx.community.greedy_modularity_communities(G)
            metrics['num_communities'] = len(communities)
            metrics['modularity'] = nx.community.modularity(G, communities)
        
        return metrics
    
    def find_influential_nodes(self, graph_type='similarity', top_k=10):
        """
        Find most influential nodes using various centrality measures
        """
        if graph_type not in self.graphs:
            return {}
        
        G = self.graphs[graph_type]
        
        influential = {}
        
        # Degree centrality
        degree_cent = nx.degree_centrality(G)
        influential['by_degree'] = sorted(degree_cent.items(), 
                                         key=lambda x: x[1], 
                                         reverse=True)[:top_k]
        
        # Betweenness centrality (bridges between communities)
        if G.number_of_nodes() < 1000:
            between_cent = nx.betweenness_centrality(G)
            influential['by_betweenness'] = sorted(between_cent.items(),
                                                   key=lambda x: x[1],
                                                   reverse=True)[:top_k]
        
        # PageRank
        pagerank = nx.pagerank(G)
        influential['by_pagerank'] = sorted(pagerank.items(),
                                           key=lambda x: x[1],
                                           reverse=True)[:top_k]
        
        return influential
    
    def detect_communities(self, graph_type='similarity'):
        """
        Detect communities/clusters in graph
        """
        if graph_type not in self.graphs:
            return []
        
        G = self.graphs[graph_type]
        
        # Convert to undirected if needed
        if G.is_directed():
            G = G.to_undirected()
        
        # Find connected components first
        if not nx.is_connected(G):
            # Get largest component
            largest_cc = max(nx.connected_components(G), key=len)
            G = G.subgraph(largest_cc).copy()
        
        # Detect communities using modularity
        communities = list(nx.community.greedy_modularity_communities(G))
        
        # Create community info
        community_info = []
        for i, community in enumerate(communities):
            community_info.append({
                'id': i,
                'size': len(community),
                'nodes': list(community),
                'density': nx.density(G.subgraph(community))
            })
        
        return community_info
    
    def export_graph(self, graph_type, output_path, format='graphml'):
        """
        Export graph to file
        
        Formats: graphml, gexf, json, edgelist
        """
        if graph_type not in self.graphs:
            print(f"Graph '{graph_type}' not found")
            return
        
        G = self.graphs[graph_type]
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if format == 'graphml':
            nx.write_graphml(G, output_path)
        elif format == 'gexf':
            nx.write_gexf(G, output_path)
        elif format == 'json':
            from networkx.readwrite import json_graph
            data = json_graph.node_link_data(G)
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2)
        elif format == 'edgelist':
            nx.write_edgelist(G, output_path)
        
        print(f"✓ Graph exported to {output_path}")


def main():
    """Test graph builder"""
    # Create sample data
    papers_df = pd.DataFrame({
        'id': [f'paper_{i}' for i in range(50)],
        'title': [f'Paper {i}: Deep Learning Research' for i in range(50)],
        'categories': np.random.choice(['cs.AI', 'cs.LG', 'cs.CV'], 50),
        'year': np.random.choice([2020, 2021, 2022, 2023], 50),
        'authors': [f'Author {i}, Author {i+1}' for i in range(50)]
    })
    
    # Random embeddings
    embeddings = np.random.randn(50, 768)
    
    # Build graphs
    builder = ScientificGraphBuilder()
    
    print("Building graphs...")
    
    # Similarity network
    G_sim = builder.build_similarity_network(papers_df, embeddings, threshold=0.8)
    print(f"✓ Similarity network: {G_sim.number_of_nodes()} nodes, {G_sim.number_of_edges()} edges")
    
    # Co-authorship network
    G_coauth = builder.build_coauthorship_network(papers_df)
    print(f"✓ Co-authorship network: {G_coauth.number_of_nodes()} nodes, {G_coauth.number_of_edges()} edges")
    
    # Temporal network
    G_temp = builder.build_temporal_graph(papers_df)
    print(f"✓ Temporal network: {G_temp.number_of_nodes()} nodes, {G_temp.number_of_edges()} edges")
    
    # Compute metrics
    print("\nGraph metrics:")
    metrics = builder.compute_graph_metrics('similarity')
    for key, value in metrics.items():
        if not isinstance(value, dict):
            print(f"  {key}: {value}")
    
    # Find influential papers
    print("\nInfluential papers:")
    influential = builder.find_influential_nodes('similarity', top_k=5)
    for method, papers in influential.items():
        print(f"\n  {method}:")
        for paper, score in papers[:3]:
            print(f"    {paper}: {score:.4f}")
    
    # Detect communities
    print("\nCommunities:")
    communities = builder.detect_communities('similarity')
    for comm in communities[:5]:
        print(f"  Community {comm['id']}: {comm['size']} papers")


if __name__ == "__main__":
    main()