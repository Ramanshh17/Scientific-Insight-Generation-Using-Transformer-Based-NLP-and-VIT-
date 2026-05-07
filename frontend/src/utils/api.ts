/**
 * API Utility for Scientific Insight Platform
 * Bridges the React frontend with the Flask Python backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

export interface BackendAnalysisResponse {
  success: boolean;
  hypotheses: any[];
  insights: any[];
  summary: string;
  domain: string;
  key_concepts: string[];
  error?: string;
}

export interface SearchResponse {
  success: boolean;
  results: any[];
  total: number;
  query: string;
  error?: string;
}

export const api = {
  /**
   * Analyze scientific text using the Python backend
   */
  async analyzeText(text: string, domain: string = 'Science'): Promise<BackendAnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-hypothesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, domain }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        hypotheses: [],
        insights: [],
        summary: 'Error connecting to backend.',
        domain: 'Unknown',
        key_concepts: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Search the ArXiv FAISS index
   */
  async searchArxiv(query: string, category?: string, top_k: number = 10): Promise<SearchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, category, top_k }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        results: [],
        total: 0,
        query,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get framework stats
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/framework/stats`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  },

  async getEDAStats(dataset: 'worldbank' | 'rvlcdip') {
    try {
      const response = await fetch(`${API_BASE_URL}/eda/stats?dataset=${dataset}`);
      return await response.json();
    } catch (error) {
      console.error('Fetch EDA stats error:', error);
      return { success: false, error: 'Failed to connect to server' };
    }
  },

  getEDAImageUrl(filename: string) {
    return `${API_BASE_URL}/eda/image/${filename}`;
  }
};
