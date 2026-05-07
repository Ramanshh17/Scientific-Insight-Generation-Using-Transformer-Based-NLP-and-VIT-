import type { TextAnalysisResult } from '../utils/textAnalysis';
import type { ImageAnalysisResult } from '../utils/imageAnalysis';
import type { Hypothesis, Insight } from '../utils/hypothesisEngine';
import ProgressBar from '../components/ProgressBar';

interface Props {
  textResults: TextAnalysisResult[];
  imageResults: ImageAnalysisResult[];
  pdfCount: number;
  allHypotheses: Hypothesis[];
  allInsights: Insight[];
  onNavigate: (page: string) => void;
}

const DashboardPage: React.FC<Props> = ({ textResults, imageResults, pdfCount, allHypotheses, allInsights, onNavigate }) => {
  const totalAnalyses = textResults.length + imageResults.length + pdfCount;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">🏠 Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Overview of your multi-modal scientific data analysis</p>
      </div>

      {/* Hero */}
      <div className="gradient-border rounded-2xl">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl">
              🔬
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">SciMultiAnalyzer Platform</h3>
              <p className="text-slate-400 text-sm max-w-xl">
                Analyze scientific text, images, and PDF documents. Generate hypotheses, extract insights,
                and discover cross-modal patterns across multiple data formats.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Analyses', value: totalAnalyses, icon: '📊', color: 'from-indigo-500 to-blue-500' },
          { label: 'Hypotheses', value: allHypotheses.length, icon: '🧪', color: 'from-purple-500 to-pink-500' },
          { label: 'Insights', value: allInsights.length, icon: '💡', color: 'from-cyan-500 to-teal-500' },
          { label: 'Data Modalities', value: `${(textResults.length > 0 ? 1 : 0) + (imageResults.length > 0 ? 1 : 0) + (pdfCount > 0 ? 1 : 0)}/3`, icon: '🔗', color: 'from-orange-500 to-red-500' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${s.color} flex items-center justify-center text-xl mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'text', title: 'Analyze Text', desc: 'Paste scientific text for NLP analysis', icon: '📝', count: textResults.length },
          { id: 'image', title: 'Analyze Image', desc: 'Upload scientific figures and images', icon: '🖼️', count: imageResults.length },
          { id: 'pdf', title: 'Analyze Document', desc: 'Upload PDF/TXT for document analysis', icon: '📄', count: pdfCount },
        ].map(a => (
          <button
            key={a.id}
            onClick={() => onNavigate(a.id)}
            className="glass rounded-xl p-5 text-left hover:bg-slate-800/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">{a.icon}</span>
              {a.count > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300">{a.count} done</span>
              )}
            </div>
            <h4 className="text-white font-medium mb-1">{a.title}</h4>
            <p className="text-xs text-slate-400">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* Problem Statement */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">🎯 Problem Statement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Multi-Format Data', desc: 'Scientific data exists in multiple formats that are difficult to analyze jointly', status: 'Addressed', color: 'text-green-400' },
            { title: 'Manual Integration', desc: 'Manual integration of research papers, images, and experimental data is time-consuming', status: 'Addressed', color: 'text-green-400' },
            { title: 'Single Modality AI', desc: 'Existing AI tools focus on single modalities or narrow domains', status: 'Addressed', color: 'text-green-400' },
            { title: 'Limited Explainability', desc: 'Limited explainability in AI-driven scientific analysis', status: 'Addressed', color: 'text-green-400' },
          ].map((p, i) => (
            <div key={i} className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-white font-medium text-sm">{p.title}</h5>
                <span className={`text-xs font-medium ${p.color}`}>✓ {p.status}</span>
              </div>
              <p className="text-xs text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Datasets */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📦 Datasets Used</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'arXiv Papers', source: 'kaggle.com/Cornell-University/arxiv', records: '2.3M+ papers', type: 'Text / Metadata' },
            { name: 'World Bank Data', source: 'databank.worldbank.org', records: '1,400+ indicators', type: 'Structured / Tabular' },
            { name: 'RVL-CDIP', source: 'cs.cmu.edu/~aharley/rvl-cdip', records: '400K images', type: 'Document Images' },
          ].map((d, i) => (
            <div key={i} className="bg-slate-800/30 rounded-lg p-4">
              <h5 className="text-white font-medium text-sm mb-2">{d.name}</h5>
              <p className="text-[10px] text-slate-500 mb-2">{d.source}</p>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{d.records}</span>
                <span className="text-indigo-400">{d.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {(allHypotheses.length > 0 || allInsights.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allHypotheses.length > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-300">Recent Hypotheses</h4>
                <button onClick={() => onNavigate('hypothesis')} className="text-xs text-indigo-400 hover:text-indigo-300">View All →</button>
              </div>
              <div className="space-y-3">
                {allHypotheses.slice(0, 3).map(h => (
                  <div key={h.id} className="bg-slate-800/50 rounded-lg p-3">
                    <h5 className="text-white text-sm font-medium line-clamp-1">{h.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        h.type === 'correlation' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>{h.type}</span>
                      <ProgressBar value={h.confidence * 100} showValue={false} size="sm" color="bg-indigo-500" />
                      <span className="text-[10px] text-slate-400">{(h.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allInsights.length > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-300">Recent Insights</h4>
                <button onClick={() => onNavigate('insights')} className="text-xs text-indigo-400 hover:text-indigo-300">View All →</button>
              </div>
              <div className="space-y-3">
                {allInsights.slice(0, 3).map(ins => (
                  <div key={ins.id} className={`bg-slate-800/50 rounded-lg p-3 border-l-3 ${
                    ins.importance === 'high' ? 'border-l-red-500' : ins.importance === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span>{ins.icon}</span>
                      <div>
                        <h5 className="text-white text-sm font-medium line-clamp-1">{ins.title}</h5>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{ins.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
