import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import TextAnalysisPage from './pages/TextAnalysisPage';
import ImageAnalysisPage from './pages/ImageAnalysisPage';
import PDFAnalysisPage from './pages/PDFAnalysisPage';
import ArxivAnalyzerPage from './pages/ArxivAnalyzerPage';
import HypothesisPage from './pages/HypothesisPage';
import InsightsPage from './pages/InsightsPage';
import EDAPage from './pages/EDAPage';
import CrossModalPage from './pages/CrossModalPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import DocumentHistoryPage from './pages/DocumentHistoryPage';
import { saveDocument } from './utils/documentStore';
import type { TextAnalysisResult } from './utils/textAnalysis';
import type { ImageAnalysisResult } from './utils/imageAnalysis';
import type { Hypothesis, Insight } from './utils/hypothesisEngine';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [textResults, setTextResults] = useState<TextAnalysisResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageAnalysisResult[]>([]);
  const [pdfCount, setPdfCount] = useState(0);
  const [arxivCount, setArxivCount] = useState(0);
  const [allHypotheses, setAllHypotheses] = useState<Hypothesis[]>([]);
  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTextComplete = useCallback((result: TextAnalysisResult, hypotheses: Hypothesis[], insights: Insight[]) => {
    setTextResults(prev => [...prev, result]);
    setAllHypotheses(prev => [...prev, ...hypotheses]);
    setAllInsights(prev => [...prev, ...insights]);
    saveDocument({
      name: `Text Analysis - ${new Date().toLocaleTimeString()}`,
      type: 'text',
      size: `${result.wordCount} words`,
      preview: result.topKeywords.slice(0, 5).map(k => k.word).join(', '),
      stats: { words: result.wordCount, sentences: result.sentenceCount, complexity: result.complexity, readability: result.readabilityLevel },
    });
  }, []);

  const handleImageComplete = useCallback((result: ImageAnalysisResult, hypotheses: Hypothesis[], insights: Insight[]) => {
    setImageResults(prev => [...prev, result]);
    setAllHypotheses(prev => [...prev, ...hypotheses]);
    setAllInsights(prev => [...prev, ...insights]);
    saveDocument({
      name: `Image Analysis - ${result.dimensions.width}×${result.dimensions.height}`,
      type: 'image',
      size: `${result.dimensions.width}×${result.dimensions.height}`,
      preview: `Quality: ${result.qualityScore}/100, Colors: ${result.dominantColors.length}`,
      stats: { width: result.dimensions.width, height: result.dimensions.height, quality: result.qualityScore, colors: result.dominantColors.length },
    });
  }, []);

  const handlePdfComplete = useCallback((_result: TextAnalysisResult, hypotheses: Hypothesis[], insights: Insight[]) => {
    setPdfCount(prev => prev + 1);
    setAllHypotheses(prev => [...prev, ...hypotheses]);
    setAllInsights(prev => [...prev, ...insights]);
    saveDocument({
      name: `PDF Analysis - ${new Date().toLocaleTimeString()}`,
      type: 'pdf',
      size: `${_result.wordCount} words`,
      preview: _result.topKeywords.slice(0, 5).map(k => k.word).join(', '),
      stats: { words: _result.wordCount, sentences: _result.sentenceCount, complexity: _result.complexity, readability: _result.readabilityLevel },
    });
  }, []);

  const handleArxivHypotheses = useCallback((hypotheses: Hypothesis[], insights: Insight[]) => {
    setArxivCount(prev => prev + 1);
    setAllHypotheses(prev => [...prev, ...hypotheses]);
    setAllInsights(prev => [...prev, ...insights]);
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  }, []);

  const analysisCount = {
    text: textResults.length,
    image: imageResults.length,
    pdf: pdfCount,
    arxiv: arxivCount,
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage textResults={textResults} imageResults={imageResults} pdfCount={pdfCount} allHypotheses={allHypotheses} allInsights={allInsights} onNavigate={handleNavigate} />;
      case 'text':
        return <TextAnalysisPage onAnalysisComplete={handleTextComplete} />;
      case 'image':
        return <ImageAnalysisPage onAnalysisComplete={handleImageComplete} />;
      case 'pdf':
        return <PDFAnalysisPage onAnalysisComplete={handlePdfComplete} />;
      case 'models':
        return <ModelPerformancePage />;
      case 'history':
        return <DocumentHistoryPage onNavigate={handleNavigate} />;
      case 'arxiv':
        return <ArxivAnalyzerPage onHypothesesGenerated={handleArxivHypotheses} />;
      case 'hypothesis':
        return <HypothesisPage hypotheses={allHypotheses} />;
      case 'insights':
        return <InsightsPage insights={allInsights} />;
      case 'eda':
        return <EDAPage />;
      case 'crossmodal':
        return <CrossModalPage textResults={textResults} imageResults={imageResults} allHypotheses={allHypotheses} allInsights={allInsights} onNavigate={handleNavigate} />;
      default:
        return <DashboardPage textResults={textResults} imageResults={imageResults} pdfCount={pdfCount} allHypotheses={allHypotheses} allInsights={allInsights} onNavigate={handleNavigate} />;
    }
  };

  const pageTitle = () => {
    switch (activePage) {
      case 'crossmodal': return 'Cross-Modal Analysis';
      case 'eda': return 'EDA Explorer';
      case 'arxiv': return 'arXiv Category Analyzer';
      case 'models': return 'Model Performance';
      case 'history': return 'Recent Files';
      default: return activePage.charAt(0).toUpperCase() + activePage.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0c1222] border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SciMultiAnalyzer</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full" onClick={e => e.stopPropagation()}>
            <Sidebar active={activePage} onNavigate={handleNavigate} analysisCount={analysisCount} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar active={activePage} onNavigate={handleNavigate} analysisCount={analysisCount} />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        {/* Top Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">{pageTitle()}</h1>
            <div className="h-4 w-px bg-slate-700" />
            <span className="text-xs text-slate-500">Multi-Modal Scientific Data Analysis Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400">System Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50">
              <span className="text-xs text-slate-400">
                {textResults.length + imageResults.length + pdfCount + arxivCount} analyses
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {renderPage()}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-700/30 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔬</span>
              <span className="text-xs text-slate-500">SciMultiAnalyzer — Multimodal Scientific Data Analysis Framework</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-600">
              <span>arXiv Dataset (Cornell)</span>
              <span>•</span>
              <span>World Bank DataBank</span>
              <span>•</span>
              <span>RVL-CDIP (CMU)</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
