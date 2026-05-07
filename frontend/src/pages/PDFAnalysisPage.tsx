import { useState, useRef, useCallback } from 'react';
import { analyzeText, type TextAnalysisResult } from '../utils/textAnalysis';
import { generateTextHypotheses, generateTextInsights, type Hypothesis, type Insight } from '../utils/hypothesisEngine';
import { parsePDF, type ParsedPDF } from '../utils/pdfParser';
import ProgressBar from '../components/ProgressBar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area,
} from 'recharts';
import { api } from '../utils/api';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

interface Props {
  onAnalysisComplete: (result: TextAnalysisResult, hypotheses: Hypothesis[], insights: Insight[]) => void;
}

type TabId = 'overview' | 'pages' | 'text' | 'images' | 'graphs' | 'structure' | 'analysis' | 'hypotheses' | 'insights';

const PDFAnalysisPage: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [parsedPDF, setParsedPDF] = useState<ParsedPDF | null>(null);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [dragActive, setDragActive] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [previewPage, setPreviewPage] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processPDF = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      setError('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProgressMsg('Starting...');
    setParsedPDF(null);
    setResult(null);
    setHypotheses([]);
    setInsights([]);
    setActiveTab('overview');

    try {
      const parsed = await parsePDF(file, (p, msg) => {
        setProgress(p * 0.8); // 80% for parsing
        setProgressMsg(msg);
      });

      setParsedPDF(parsed);
      setProgress(85);
      setProgressMsg('Connecting to AI backend...');

      // 1. Perform local analysis for metrics
      const localResult = analyzeText(parsed.fullText);
      
      // 2. Perform backend analysis for insights/hypotheses
      const backendResponse = await api.analyzeText(parsed.fullText, 'Scientific Paper');
      
      if (backendResponse.success) {
        const hyps: Hypothesis[] = backendResponse.hypotheses.map((h, i) => ({
          id: `pdf-h-${i}`,
          type: h.type || 'predictive',
          title: h.title,
          description: h.description,
          confidence: h.confidence || 0.88,
          evidence: h.evidence || [],
          testSuggestion: h.test_suggestion || 'Verify with experimental data.',
          domain: backendResponse.domain
        }));

        const ins: Insight[] = backendResponse.insights.map((ins, i) => ({
          id: `pdf-i-${i}`,
          title: ins.title,
          icon: ins.icon || '💡',
          description: ins.description,
          category: ins.category || 'pattern',
          importance: ins.importance || 'high'
        }));

        const finalResult = {
          ...localResult,
          summary: backendResponse.summary || localResult.summary
        };

        setResult(finalResult);
        setHypotheses(hyps);
        setInsights(ins);
        onAnalysisComplete(finalResult, hyps, ins);
      } else {
        // Fallback
        const hyps = generateTextHypotheses(localResult);
        const ins = generateTextInsights(localResult);
        setResult(localResult);
        setHypotheses(hyps);
        setInsights(ins);
        onAnalysisComplete(localResult, hyps, ins);
      }

      setProgress(100);
      setProgressMsg('Complete!');
    } catch (err) {
      console.error('PDF processing error:', err);
      setError(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}. Please try another file.`);
    } finally {
      setIsProcessing(false);
    }
  }, [onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) processPDF(e.dataTransfer.files[0]);
  }, [processPDF]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processPDF(e.target.files[0]);
  }, [processPDF]);

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'overview', icon: '📋', label: 'Overview' },
    { id: 'pages', icon: '📖', label: `Pages${parsedPDF ? ` (${parsedPDF.totalPages})` : ''}` },
    { id: 'text', icon: '📝', label: 'Text Content' },
    { id: 'images', icon: '🖼️', label: `Images${parsedPDF ? ` (${parsedPDF.images.length})` : ''}` },
    { id: 'graphs', icon: '📊', label: `Figures${parsedPDF ? ` (${parsedPDF.graphs.length})` : ''}` },
    { id: 'structure', icon: '🏗️', label: 'Structure' },
    { id: 'analysis', icon: '🔬', label: 'Analysis' },
    { id: 'hypotheses', icon: '🧪', label: 'Hypotheses' },
    { id: 'insights', icon: '💡', label: 'Insights' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">📄 PDF Document Analysis</h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload PDF research papers to extract and separately analyze text, images, and figures/graphs
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass rounded-xl p-10 text-center cursor-pointer transition-all border-2 border-dashed ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-300 font-medium">{progressMsg}</p>
            <div className="w-64 mx-auto"><ProgressBar value={progress} color="bg-indigo-500" /></div>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-4">📑</div>
            <p className="text-slate-200 font-medium mb-1">Drop a PDF here or click to upload</p>
            <p className="text-xs text-slate-500">Supports PDF research papers, reports, and documents</p>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span>📝 Text Extraction</span>
              <span>🖼️ Image Detection</span>
              <span>📊 Figure/Graph Detection</span>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-red-300 font-medium">Error</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-black/90 z-10"
            >×</button>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {parsedPDF && result && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { icon: '📁', label: 'File', value: parsedPDF.fileName, small: true },
              { icon: '📃', label: 'Pages', value: parsedPDF.totalPages },
              { icon: '📝', label: 'Words', value: parsedPDF.totalWords.toLocaleString() },
              { icon: '📋', label: 'Sections', value: parsedPDF.sections.length },
              { icon: '🖼️', label: 'Images', value: parsedPDF.images.length },
              { icon: '📊', label: 'Figures', value: parsedPDF.graphs.length },
            ].map((s, i) => (
              <div key={i} className="glass rounded-xl p-3 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</span>
                </div>
                <p className={`font-semibold text-white ${s.small ? 'text-xs truncate' : 'text-lg'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1.5 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-300 font-medium shadow-lg shadow-indigo-500/5'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ======== OVERVIEW TAB ======== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metadata */}
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">📋 Document Metadata</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(parsedPDF.metadata).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{key}</p>
                      <p className="text-sm text-white mt-0.5 truncate" title={value}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-5 cursor-pointer hover:bg-slate-800/40 transition-colors border-2 border-transparent hover:border-blue-500/30" onClick={() => setActiveTab('text')}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">📝</div>
                    <div>
                      <h5 className="text-white font-medium">Text Content</h5>
                      <p className="text-xs text-slate-500">{parsedPDF.totalWords.toLocaleString()} words extracted</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">{parsedPDF.fullText.substring(0, 200)}...</p>
                  <p className="text-xs text-blue-400 mt-2">Click to view full text →</p>
                </div>

                <div className="glass rounded-xl p-5 cursor-pointer hover:bg-slate-800/40 transition-colors border-2 border-transparent hover:border-green-500/30" onClick={() => setActiveTab('images')}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">🖼️</div>
                    <div>
                      <h5 className="text-white font-medium">Images</h5>
                      <p className="text-xs text-slate-500">{parsedPDF.images.length} images detected</p>
                    </div>
                  </div>
                  {parsedPDF.images.length > 0 ? (
                    <div className="flex gap-2 overflow-hidden">
                      {parsedPDF.images.slice(0, 3).map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                          <img src={img.dataUrl} alt={img.label} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No standalone images found</p>
                  )}
                  <p className="text-xs text-green-400 mt-2">Click to view images →</p>
                </div>

                <div className="glass rounded-xl p-5 cursor-pointer hover:bg-slate-800/40 transition-colors border-2 border-transparent hover:border-purple-500/30" onClick={() => setActiveTab('graphs')}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-lg">📊</div>
                    <div>
                      <h5 className="text-white font-medium">Figures & Graphs</h5>
                      <p className="text-xs text-slate-500">{parsedPDF.graphs.length} figures detected</p>
                    </div>
                  </div>
                  {parsedPDF.graphs.length > 0 ? (
                    <div className="flex gap-2 overflow-hidden">
                      {parsedPDF.graphs.slice(0, 3).map((g, i) => (
                        <div key={i} className="w-16 h-16 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                          <img src={g.dataUrl} alt={g.description} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No figures/charts detected</p>
                  )}
                  <p className="text-xs text-purple-400 mt-2">Click to view figures →</p>
                </div>
              </div>

              {/* Extraction Quality */}
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Extraction Summary</h4>
                <div className="space-y-3">
                  <ProgressBar label="Text Extraction" value={parsedPDF.totalWords > 100 ? 95 : parsedPDF.totalWords > 10 ? 60 : 20} color="bg-blue-500" />
                  <ProgressBar label="Image Detection" value={parsedPDF.images.length > 0 ? 85 : 30} color="bg-green-500" />
                  <ProgressBar label="Figure/Graph Detection" value={parsedPDF.graphs.length > 0 ? 80 : 25} color="bg-purple-500" />
                  <ProgressBar label="Structure Analysis" value={parsedPDF.sections.length > 3 ? 90 : parsedPDF.sections.length > 1 ? 60 : 30} color="bg-orange-500" />
                </div>
              </div>
            </div>
          )}

          {/* ======== PAGES TAB (Visual Preview) ======== */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">📖 Page Visual Preview</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Page:</span>
                    <select
                      value={previewPage}
                      onChange={e => setPreviewPage(Number(e.target.value))}
                      className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:border-indigo-500 outline-none"
                    >
                      <option value={0}>All Pages</option>
                      {parsedPDF.pageImages.map((_, i) => (
                        <option key={i} value={i + 1}>Page {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {previewPage === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {parsedPDF.pageImages.map((img, i) => (
                      <div
                        key={i}
                        className="group relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer"
                        onClick={() => img && setZoomedImage(img)}
                      >
                        {img ? (
                          <img src={img} alt={`Page ${i + 1}`} className="w-full object-contain" />
                        ) : (
                          <div className="h-64 flex items-center justify-center text-slate-500">
                            <span>Page render unavailable</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">Page {i + 1}</span>
                            <span className="text-xs text-slate-300">
                              {parsedPDF.pageTexts[i]?.split(/\s+/).filter(w => w.length > 0).length || 0} words
                            </span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm bg-black/50 px-3 py-1 rounded-full transition-opacity">🔍 Click to zoom</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {parsedPDF.pageImages[previewPage - 1] ? (
                      <>
                        <div
                          className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700/50 cursor-pointer max-w-2xl"
                          onClick={() => setZoomedImage(parsedPDF.pageImages[previewPage - 1])}
                        >
                          <img
                            src={parsedPDF.pageImages[previewPage - 1]}
                            alt={`Page ${previewPage}`}
                            className="w-full object-contain"
                          />
                          <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            Page {previewPage} of {parsedPDF.totalPages}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            disabled={previewPage <= 1}
                            onClick={() => setPreviewPage(p => p - 1)}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-colors text-sm"
                          >← Previous</button>
                          <span className="text-sm text-slate-400">Page {previewPage} / {parsedPDF.totalPages}</span>
                          <button
                            disabled={previewPage >= parsedPDF.totalPages}
                            onClick={() => setPreviewPage(p => p + 1)}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-colors text-sm"
                          >Next →</button>
                        </div>
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-500">
                        Page render unavailable
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Page Stats */}
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Content Distribution Across Pages</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={parsedPDF.pageTexts.map((t, i) => ({
                      page: `P${i + 1}`,
                      words: t.split(/\s+/).filter(w => w.length > 0).length,
                      images: parsedPDF.images.filter(img => img.page === i + 1).length +
                              parsedPDF.graphs.filter(g => g.page === i + 1).length,
                    }))}>
                      <XAxis dataKey="page" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      <Bar dataKey="words" fill="#6366f1" name="Words" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="images" fill="#10b981" name="Visual Elements" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ======== TEXT TAB ======== */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-300">📄 Extracted Text by Page</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Page:</span>
                    <select
                      value={selectedPage}
                      onChange={e => setSelectedPage(Number(e.target.value))}
                      className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:border-indigo-500 outline-none"
                    >
                      <option value={0}>All Pages</option>
                      {parsedPDF.pageTexts.map((_, i) => (
                        <option key={i} value={i + 1}>Page {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedPage === 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {parsedPDF.pageTexts.map((pageText, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-indigo-400">Page {i + 1}</span>
                          <span className="text-[10px] text-slate-500">
                            {pageText.split(/\s+/).filter(w => w.length > 0).length} words
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                          {pageText || '(No text on this page)'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 rounded-lg p-4 max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                      {parsedPDF.pageTexts[selectedPage - 1] || '(No text on this page)'}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Words', value: parsedPDF.totalWords.toLocaleString(), icon: '📝' },
                  { label: 'Total Pages', value: parsedPDF.totalPages, icon: '📃' },
                  { label: 'Avg Words/Page', value: Math.round(parsedPDF.totalWords / parsedPDF.totalPages).toLocaleString(), icon: '📊' },
                  { label: 'Characters', value: parsedPDF.fullText.length.toLocaleString(), icon: '🔤' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Words per Page Distribution</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={parsedPDF.pageTexts.map((t, i) => ({
                      page: `P${i + 1}`,
                      words: t.split(/\s+/).filter(w => w.length > 0).length,
                    }))}>
                      <XAxis dataKey="page" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      <Bar dataKey="words" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ======== IMAGES TAB ======== */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              {parsedPDF.images.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <div className="text-5xl mb-4">🖼️</div>
                  <h4 className="text-white font-medium text-lg mb-2">No Standalone Images Found</h4>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    This PDF doesn't contain extractable standalone images. Check the Pages tab for visual page renders
                    or the Figures tab for detected charts.
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <button onClick={() => setActiveTab('pages')} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                      View Pages →
                    </button>
                    <button onClick={() => setActiveTab('graphs')} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm">
                      View Figures →
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium text-slate-300">
                    🖼️ {parsedPDF.images.length} Image{parsedPDF.images.length > 1 ? 's' : ''} Extracted
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parsedPDF.images.map((img, i) => (
                      <div
                        key={i}
                        className={`glass rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                          selectedImage === i ? 'ring-2 ring-indigo-500' : ''
                        }`}
                        onClick={() => setSelectedImage(selectedImage === i ? null : i)}
                      >
                        <div className="relative bg-slate-900/50 p-2">
                          <img src={img.dataUrl} alt={img.label} className="w-full h-48 object-contain rounded cursor-zoom-in" onClick={e => { e.stopPropagation(); setZoomedImage(img.dataUrl); }} />
                          <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">Page {img.page}</div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm text-white font-medium">{img.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{img.width} × {img.height}px</p>
                        </div>
                        {selectedImage === i && (
                          <div className="border-t border-slate-700 p-3 bg-slate-800/30">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-slate-500">Width</span><p className="text-white">{img.width}px</p></div>
                              <div><span className="text-slate-500">Height</span><p className="text-white">{img.height}px</p></div>
                              <div><span className="text-slate-500">Aspect</span><p className="text-white">{(img.width / img.height).toFixed(2)}</p></div>
                              <div><span className="text-slate-500">Page</span><p className="text-white">{img.page}</p></div>
                            </div>
                            <a href={img.dataUrl} download={`image_p${img.page}_${img.index}.png`} onClick={e => e.stopPropagation()} className="mt-2 block w-full text-center bg-indigo-500/20 text-indigo-300 text-xs py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors">
                              ⬇ Download Image
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-medium text-slate-300 mb-4">Image Size Distribution</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={parsedPDF.images.map((img, i) => ({ name: `Img ${i + 1}`, width: img.width, height: img.height }))}>
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                          <Bar dataKey="width" fill="#10b981" name="Width" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="height" fill="#6366f1" name="Height" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ======== GRAPHS TAB ======== */}
          {activeTab === 'graphs' && (
            <div className="space-y-6">
              {parsedPDF.graphs.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <h4 className="text-white font-medium text-lg mb-2">No Figures / Charts Detected</h4>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    No charts, graphs, or scientific figures were detected. They may be vector-based or embedded as page content.
                  </p>
                  <button onClick={() => setActiveTab('pages')} className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                    View Page Renders →
                  </button>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium text-slate-300">
                    📊 {parsedPDF.graphs.length} Figure{parsedPDF.graphs.length > 1 ? 's' : ''} Detected
                  </h4>
                  <div className="space-y-6">
                    {parsedPDF.graphs.map((graph, i) => (
                      <div key={i} className="glass rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/50">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">📊</div>
                          <div>
                            <h5 className="text-white font-medium text-sm">Figure {i + 1} — {graph.type}</h5>
                            <p className="text-xs text-slate-400">{graph.description}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Page {graph.page}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{graph.width}×{graph.height}</span>
                          </div>
                        </div>
                        <div className="p-5 bg-slate-900/30 cursor-pointer" onClick={() => setZoomedImage(graph.dataUrl)}>
                          <img src={graph.dataUrl} alt={graph.description} className="max-w-full max-h-96 mx-auto object-contain rounded-lg" />
                        </div>
                        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Size: {graph.width}×{graph.height}px</span>
                          <a href={graph.dataUrl} download={`figure_p${graph.page}_${graph.index}.png`} className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors">
                            ⬇ Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ======== STRUCTURE TAB ======== */}
          {activeTab === 'structure' && (
            <div className="space-y-6">
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">🏗️ Document Structure Map</h4>
                <div className="space-y-2">
                  {parsedPDF.sections.map((s, i) => (
                    <div
                      key={i}
                      className={`bg-slate-800/50 rounded-lg overflow-hidden transition-all cursor-pointer ${
                        expandedSection === i ? 'ring-1 ring-indigo-500/50' : 'hover:bg-slate-800/70'
                      }`}
                      onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              s.type === 'title' ? 'bg-yellow-500' :
                              s.type === 'abstract' ? 'bg-indigo-500' :
                              s.type === 'references' ? 'bg-red-500' :
                              s.type === 'section' ? 'bg-green-500' :
                              s.type === 'heading' ? 'bg-cyan-500' : 'bg-slate-500'
                            }`} />
                            <h5 className="text-white font-medium text-sm">{s.title}</h5>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{s.type}</span>
                            <span className="text-[10px] text-slate-500">Page {s.page}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{s.wordCount} words</span>
                            <span className="text-slate-500">{expandedSection === i ? '▼' : '▶'}</span>
                          </div>
                        </div>
                        <div className="mt-2 ml-6">
                          <ProgressBar value={s.wordCount} max={parsedPDF.totalWords} showValue={false} size="sm" color={
                            s.type === 'abstract' ? 'bg-indigo-500' :
                            s.type === 'references' ? 'bg-red-500' :
                            s.type === 'title' ? 'bg-yellow-500' : 'bg-green-500'
                          } />
                        </div>
                      </div>
                      {expandedSection === i && (
                        <div className="px-4 pb-4 ml-6 border-t border-slate-700/50 pt-3">
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                            {s.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Section Sizes</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={parsedPDF.sections.map(s => ({ name: s.title.substring(0, 25), value: s.wordCount }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                          {parsedPDF.sections.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Section Types</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={(() => {
                          const tc: Record<string, number> = {};
                          parsedPDF.sections.forEach(s => { tc[s.type] = (tc[s.type] || 0) + 1; });
                          return Object.entries(tc).map(([name, value]) => ({ name, value }));
                        })()} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                          {Object.keys(parsedPDF.sections.reduce((a, s) => { a[s.type] = true; return a; }, {} as Record<string, boolean>)).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======== ANALYSIS TAB ======== */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Words', value: result.wordCount.toLocaleString(), icon: '📝' },
                  { label: 'Sentences', value: result.sentenceCount, icon: '📋' },
                  { label: 'Complexity', value: `${result.complexity}/100`, icon: '🧠' },
                  { label: 'Readability', value: result.readabilityLevel, icon: '👁️' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{s.icon}</span><span className="text-xs text-slate-400">{s.label}</span>
                    </div>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Language Metrics</h4>
                  <div className="space-y-3">
                    <ProgressBar label="Readability" value={result.readabilityScore} color="bg-green-500" />
                    <ProgressBar label="Complexity" value={result.complexity} color="bg-orange-500" />
                    <ProgressBar label="Vocabulary Richness" value={result.languageMetrics.vocabularyRichness * 100} color="bg-indigo-500" />
                    <ProgressBar label="Lexical Density" value={result.languageMetrics.lexicalDensity * 100} color="bg-purple-500" />
                  </div>
                </div>
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">🏷️ Topic Distribution</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.topics.map(t => ({ name: t.topic, value: Math.round(t.confidence * 100) }))} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                          {result.topics.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">🔑 Top Keywords</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.topKeywords.slice(0, 12)} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis type="category" dataKey="word" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {result.entities.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">🔬 Scientific Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.entities.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-white">{e.text}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{e.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">📈 Document Profile</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { metric: 'Readability', value: result.readabilityScore },
                      { metric: 'Complexity', value: result.complexity },
                      { metric: 'Vocabulary', value: result.languageMetrics.vocabularyRichness * 100 },
                      { metric: 'Density', value: result.languageMetrics.lexicalDensity * 100 },
                      { metric: 'Sentiment', value: (result.sentimentScore + 1) * 50 },
                      { metric: 'Entities', value: Math.min(100, result.entities.length * 10) },
                    ]}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                      <Radar name="Document" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {parsedPDF.pageTexts.length > 1 && (
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">📈 Content Density Across Pages</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={parsedPDF.pageTexts.map((t, i) => {
                        const words = t.split(/\s+/).filter(w => w.length > 0);
                        return { page: `Page ${i + 1}`, words: words.length, unique: new Set(words.map(w => w.toLowerCase())).size };
                      })}>
                        <XAxis dataKey="page" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                        <Area type="monotone" dataKey="words" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Total Words" />
                        <Area type="monotone" dataKey="unique" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Unique Words" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======== HYPOTHESES TAB ======== */}
          {activeTab === 'hypotheses' && (
            <div className="space-y-4">
              {hypotheses.length === 0 ? (
                <div className="glass rounded-xl p-10 text-center">
                  <p className="text-4xl mb-3">🧪</p>
                  <p className="text-slate-400">No hypotheses generated from this document.</p>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium text-slate-300">🧪 {hypotheses.length} Hypothes{hypotheses.length === 1 ? 'is' : 'es'} Generated</h4>
                  {hypotheses.map(h => (
                    <div key={h.id} className="glass rounded-xl p-5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          h.type === 'correlation' ? 'bg-blue-500/20 text-blue-300' :
                          h.type === 'causal' ? 'bg-orange-500/20 text-orange-300' :
                          h.type === 'predictive' ? 'bg-green-500/20 text-green-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>{h.type}</span>
                        <span className="text-xs text-indigo-400">{(h.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                      <h4 className="text-white font-medium mb-2">{h.title}</h4>
                      <p className="text-slate-400 text-sm mb-3">{h.description}</p>
                      <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                        {h.evidence.map((ev, i) => <p key={i} className="text-xs text-slate-300">• {ev}</p>)}
                      </div>
                      <div className="bg-indigo-500/10 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1">💡 Test Suggestion</p>
                        <p className="text-xs text-indigo-300">{h.testSuggestion}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ======== INSIGHTS TAB ======== */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="glass rounded-xl p-10 text-center">
                  <p className="text-4xl mb-3">💡</p>
                  <p className="text-slate-400">No insights generated from this document.</p>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium text-slate-300">💡 {insights.length} Insight{insights.length > 1 ? 's' : ''}</h4>
                  {insights.map(ins => (
                    <div
                      key={ins.id}
                      className={`glass rounded-xl p-5 border-l-4 hover:bg-slate-800/30 transition-colors ${
                        ins.importance === 'high' ? 'border-l-red-500' :
                        ins.importance === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{ins.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-white font-medium">{ins.title}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              ins.category === 'pattern' ? 'bg-blue-500/20 text-blue-300' :
                              ins.category === 'recommendation' ? 'bg-purple-500/20 text-purple-300' :
                              ins.category === 'warning' ? 'bg-red-500/20 text-red-300' :
                              ins.category === 'anomaly' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>{ins.category}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              ins.importance === 'high' ? 'bg-red-500/20 text-red-300' :
                              ins.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>{ins.importance} priority</span>
                          </div>
                          <p className="text-slate-400 text-sm">{ins.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PDFAnalysisPage;
