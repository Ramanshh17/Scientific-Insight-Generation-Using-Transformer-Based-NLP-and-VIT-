import { useState, useCallback } from 'react';
import { analyzeText, type TextAnalysisResult } from '../utils/textAnalysis';
import { generateTextHypotheses, generateTextInsights, type Hypothesis, type Insight } from '../utils/hypothesisEngine';
import ProgressBar from '../components/ProgressBar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { api } from '../utils/api';

const SAMPLE_TEXTS = [
  {
    title: 'AI in Drug Discovery',
    text: `Deep learning models have revolutionized drug discovery by enabling rapid virtual screening of molecular compounds. Neural networks trained on protein structure data can predict binding affinity with remarkable accuracy, significantly reducing the time and cost of traditional experimental methods. Recent transformer-based architectures have achieved breakthrough performance in predicting protein folding, opening new avenues for understanding disease mechanisms at the molecular level. The integration of reinforcement learning with generative models has enabled de novo drug design, where AI systems can propose novel molecular structures optimized for specific therapeutic targets. Clinical trials of AI-discovered compounds have shown promising early results, with several candidates advancing to Phase II studies. However, challenges remain in ensuring the explainability of AI predictions and addressing potential biases in training datasets that may limit the diversity of discovered compounds.`
  },
  {
    title: 'Climate Change Research',
    text: `Global climate models predict significant changes in temperature and precipitation patterns over the next century. Analysis of satellite data reveals accelerating ice sheet loss in both polar regions, with Greenland losing approximately 280 billion tons of ice annually. Ocean temperature data shows unprecedented warming trends in deep ocean layers, suggesting that carbon absorption capacity may be declining. Statistical analysis of extreme weather events demonstrates a clear correlation between rising global temperatures and increased frequency of hurricanes, droughts, and flooding events. Ecosystem studies indicate that biodiversity loss is accelerating in tropical regions, with species migration patterns shifting poleward at rates faster than previously predicted. The integration of multi-modal data sources—combining satellite imagery, ocean buoy measurements, and atmospheric sensors—is critical for improving the accuracy and reliability of climate predictions.`
  },
  {
    title: 'Quantum Computing Advances',
    text: `Recent experiments in quantum computing have demonstrated quantum advantage for specific computational tasks, achieving results that would take classical supercomputers thousands of years to replicate. The development of error-correcting codes for quantum systems represents a major breakthrough, addressing one of the most significant challenges in building practical quantum computers. Researchers have successfully entangled over 100 qubits in a controlled manner, pushing the boundaries of quantum coherence. Applications in quantum simulation of molecular systems show promise for accelerating materials science research, particularly in the design of novel catalysts and energy storage materials. The quantum computing ecosystem continues to evolve rapidly, with new algorithms being developed for optimization problems relevant to logistics, finance, and scientific research. Despite these advances, significant engineering challenges remain in scaling quantum processors while maintaining the ultra-low temperatures and isolation required for stable qubit operation.`
  },
];

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

interface Props {
  onAnalysisComplete: (result: TextAnalysisResult, hypotheses: Hypothesis[], insights: Insight[]) => void;
}

const TextAnalysisPage: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'sentiment' | 'hypotheses' | 'insights'>('overview');

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    
    try {
      // 1. Perform local analysis for basic metrics/charts
      const localResult = analyzeText(text);
      
      // 2. Perform backend analysis for AI-driven hypotheses/insights
      const backendResponse = await api.analyzeText(text);
      
      if (backendResponse.success) {
        // Map backend hypotheses/insights to frontend format
        const hyps: Hypothesis[] = backendResponse.hypotheses.map((h, i) => ({
          id: `backend-h-${i}`,
          type: h.type || 'predictive',
          title: h.title,
          description: h.description,
          confidence: h.confidence || 0.85,
          evidence: h.evidence || [],
          testSuggestion: h.test_suggestion || 'Verify with experimental data.',
          domain: backendResponse.domain
        }));

        const ins: Insight[] = backendResponse.insights.map((ins, i) => ({
          id: `backend-i-${i}`,
          title: ins.title,
          icon: ins.icon || '💡',
          description: ins.description,
          category: ins.category || 'pattern',
          importance: ins.importance || 'medium'
        }));

        // Merge results
        const finalResult = {
          ...localResult,
          summary: backendResponse.summary || localResult.summary
        };

        setResult(finalResult);
        setHypotheses(hyps);
        setInsights(ins);
        onAnalysisComplete(finalResult, hyps, ins);
      } else {
        // Fallback to mock if backend fails
        const hyps = generateTextHypotheses(localResult);
        const ins = generateTextInsights(localResult);
        setResult(localResult);
        setHypotheses(hyps);
        setInsights(ins);
        onAnalysisComplete(localResult, hyps, ins);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, onAnalysisComplete]);

  const loadSample = (sample: typeof SAMPLE_TEXTS[0]) => {
    setText(sample.text);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📝 Text Analysis</h2>
          <p className="text-slate-400 text-sm mt-1">Analyze scientific text for keywords, sentiment, entities, and generate hypotheses</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Input Text</h3>
          <div className="flex gap-2">
            {SAMPLE_TEXTS.map((s, i) => (
              <button
                key={i}
                onClick={() => loadSample(s)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your scientific text, research paper abstract, or experimental data description here..."
          className="w-full h-44 bg-slate-900/50 border border-slate-600/30 rounded-lg p-4 text-slate-200 text-sm resize-none focus:border-indigo-500/50 transition-colors"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">{text.split(/\s+/).filter(w => w).length} words • {text.length} characters</span>
          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || isAnalyzing}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : '🔍 Analyze Text'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
            {(['overview', 'keywords', 'sentiment', 'hypotheses', 'insights'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm rounded-md transition-all ${
                  activeTab === tab ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'overview' ? '📊 Overview' :
                 tab === 'keywords' ? '🔑 Keywords' :
                 tab === 'sentiment' ? '😊 Sentiment' :
                 tab === 'hypotheses' ? '🧪 Hypotheses' : '💡 Insights'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Words', value: result.wordCount, icon: '📝' },
                  { label: 'Sentences', value: result.sentenceCount, icon: '📋' },
                  { label: 'Complexity', value: `${result.complexity}/100`, icon: '🧠' },
                  { label: 'Readability', value: result.readabilityLevel, icon: '👁️' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{s.icon}</span>
                      <span className="text-xs text-slate-400">{s.label}</span>
                    </div>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Language Metrics</h4>
                  <div className="space-y-3">
                    <ProgressBar label="Readability" value={result.readabilityScore} color="bg-green-500" />
                    <ProgressBar label="Complexity" value={result.complexity} color="bg-orange-500" />
                    <ProgressBar label="Vocabulary Richness" value={result.languageMetrics.vocabularyRichness * 100} color="bg-indigo-500" />
                    <ProgressBar label="Lexical Density" value={result.languageMetrics.lexicalDensity * 100} color="bg-purple-500" />
                  </div>
                </div>

                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Topic Distribution</h4>
                  {result.topics.length > 0 ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={result.topics.map(t => ({ name: t.topic, value: Math.round(t.confidence * 100) }))} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                            {result.topics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-slate-500 text-sm">No topics detected</p>}
                </div>
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">📋 Auto-Generated Summary</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Top Keywords by Frequency</h4>
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

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Keyword Relevance Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {result.topKeywords.map((kw, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">{kw.word}</span>
                        <span className="text-xs text-indigo-400">×{kw.count}</span>
                      </div>
                      <ProgressBar value={kw.relevance * 100} showValue={false} size="sm" color="bg-indigo-500" />
                      <span className="text-[10px] text-slate-500 mt-1">{(kw.relevance * 100).toFixed(0)}% relevance</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities */}
              {result.entities.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">🔬 Detected Scientific Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.entities.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-white">{e.text}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{e.type}</span>
                        <span className="text-[10px] text-slate-500">{(e.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sentiment Tab */}
          {activeTab === 'sentiment' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-400 mb-2">Sentiment Score</p>
                  <p className={`text-4xl font-bold ${result.sentimentScore > 0 ? 'text-green-400' : result.sentimentScore < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {result.sentimentScore > 0 ? '+' : ''}{result.sentimentScore}
                  </p>
                </div>
                <div className="glass rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-400 mb-2">Sentiment Label</p>
                  <p className="text-4xl">
                    {result.sentimentLabel === 'Positive' ? '😊' : result.sentimentLabel === 'Negative' ? '😟' : '😐'}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">{result.sentimentLabel}</p>
                </div>
                <div className="glass rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-400 mb-2">Confidence</p>
                  <p className="text-4xl font-bold text-indigo-400">
                    {Math.abs(result.sentimentScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Document Quality Radar</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { metric: 'Readability', value: result.readabilityScore },
                      { metric: 'Complexity', value: result.complexity },
                      { metric: 'Vocab Richness', value: result.languageMetrics.vocabularyRichness * 100 },
                      { metric: 'Sentiment', value: (result.sentimentScore + 1) * 50 },
                      { metric: 'Density', value: result.languageMetrics.lexicalDensity * 100 },
                      { metric: 'Structure', value: Math.min(100, result.paragraphCount * 20) },
                    ]}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis tick={false} domain={[0, 100]} />
                      <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Hypotheses Tab */}
          {activeTab === 'hypotheses' && (
            <div className="space-y-4 animate-fade-in">
              {hypotheses.length === 0 ? (
                <div className="glass rounded-xl p-10 text-center">
                  <p className="text-4xl mb-3">🧪</p>
                  <p className="text-slate-400">No hypotheses generated yet. Analyze more text to generate hypotheses.</p>
                </div>
              ) : hypotheses.map(h => (
                <div key={h.id} className="glass rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mr-2 ${
                        h.type === 'correlation' ? 'bg-blue-500/20 text-blue-300' :
                        h.type === 'causal' ? 'bg-orange-500/20 text-orange-300' :
                        h.type === 'predictive' ? 'bg-green-500/20 text-green-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {h.type}
                      </span>
                      <span className="text-[10px] text-slate-500">{h.domain}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Confidence:</span>
                      <span className="text-xs font-medium text-indigo-400">{(h.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <h4 className="text-white font-medium mb-2">{h.title}</h4>
                  <p className="text-slate-400 text-sm mb-3">{h.description}</p>
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                    <ul className="space-y-1">
                      {h.evidence.map((e, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">•</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-indigo-500/10 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1">💡 How to Test</p>
                    <p className="text-xs text-indigo-300">{h.testSuggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4 animate-fade-in">
              {insights.map(ins => (
                <div key={ins.id} className={`glass rounded-xl p-5 border-l-4 ${
                  ins.importance === 'high' ? 'border-l-red-500' :
                  ins.importance === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ins.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium">{ins.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ins.category === 'pattern' ? 'bg-blue-500/20 text-blue-300' :
                          ins.category === 'anomaly' ? 'bg-red-500/20 text-red-300' :
                          ins.category === 'trend' ? 'bg-green-500/20 text-green-300' :
                          ins.category === 'recommendation' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {ins.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{ins.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TextAnalysisPage;
