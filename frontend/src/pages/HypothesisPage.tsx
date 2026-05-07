import { useState } from 'react';
import type { Hypothesis } from '../utils/hypothesisEngine';
import ProgressBar from '../components/ProgressBar';

interface Props {
  hypotheses: Hypothesis[];
}

const HypothesisPage: React.FC<Props> = ({ hypotheses }) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'type'>('confidence');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const types = ['all', ...new Set(hypotheses.map(h => h.type))];
  const domains = ['all', ...new Set(hypotheses.map(h => h.domain))];
  const [domainFilter, setDomainFilter] = useState('all');

  const filtered = hypotheses
    .filter(h => filter === 'all' || h.type === filter)
    .filter(h => domainFilter === 'all' || h.domain === domainFilter)
    .sort((a, b) => sortBy === 'confidence' ? b.confidence - a.confidence : a.type.localeCompare(b.type));

  const avgConfidence = hypotheses.length > 0
    ? hypotheses.reduce((s, h) => s + h.confidence, 0) / hypotheses.length : 0;

  const typeCounts = hypotheses.reduce((acc, h) => {
    acc[h.type] = (acc[h.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">🧪 Hypothesis Generator</h2>
        <p className="text-slate-400 text-sm mt-1">AI-generated hypotheses from your analyzed data with evidence and test suggestions</p>
      </div>

      {hypotheses.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <p className="text-6xl mb-4">🧪</p>
          <h3 className="text-xl font-bold text-white mb-2">No Hypotheses Yet</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Analyze some text, images, or documents first. The hypothesis engine will automatically generate
            testable hypotheses based on detected patterns, entities, and cross-modal connections.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Total Hypotheses</p>
              <p className="text-2xl font-bold text-white">{hypotheses.length}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Avg Confidence</p>
              <p className="text-2xl font-bold text-indigo-400">{(avgConfidence * 100).toFixed(0)}%</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Types</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <span key={type} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{type}: {count}</span>
                ))}
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Domains</p>
              <p className="text-2xl font-bold text-purple-400">{new Set(hypotheses.map(h => h.domain)).size}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Type:</span>
              <div className="flex gap-1">
                {types.map(t => (
                  <button key={t} onClick={() => setFilter(t)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${filter === t ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/50 text-slate-400 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Domain:</span>
              <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
                className="bg-slate-800/50 text-slate-300 text-xs rounded-lg px-2 py-1 border border-slate-600/30">
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sort:</span>
              <button onClick={() => setSortBy(sortBy === 'confidence' ? 'type' : 'confidence')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/50 text-slate-300 hover:text-white">
                {sortBy === 'confidence' ? '↓ Confidence' : '↓ Type'}
              </button>
            </div>
          </div>

          {/* Hypothesis Cards */}
          <div className="space-y-4">
            {filtered.map(h => (
              <div
                key={h.id}
                className={`glass rounded-xl overflow-hidden transition-all cursor-pointer ${expandedId === h.id ? 'ring-1 ring-indigo-500/50' : ''}`}
                onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        h.type === 'correlation' ? 'bg-blue-500/20 text-blue-300' :
                        h.type === 'causal' ? 'bg-orange-500/20 text-orange-300' :
                        h.type === 'predictive' ? 'bg-green-500/20 text-green-300' :
                        'bg-purple-500/20 text-purple-300'}`}>{h.type}</span>
                      <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">{h.domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <ProgressBar value={h.confidence * 100} showValue={false} size="sm" color={
                          h.confidence > 0.7 ? 'bg-green-500' : h.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        } />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{(h.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <h4 className="text-white font-medium mb-2">{h.title}</h4>
                  <p className="text-slate-400 text-sm">{h.description}</p>
                </div>

                {expandedId === h.id && (
                  <div className="border-t border-slate-700/50 p-5 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3 font-medium">📋 Evidence</p>
                        <ul className="space-y-2">
                          {h.evidence.map((e, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5 font-bold">•</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-indigo-500/10 rounded-lg p-4">
                        <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-3 font-medium">💡 How to Test This Hypothesis</p>
                        <p className="text-sm text-indigo-300 leading-relaxed">{h.testSuggestion}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="glass rounded-xl p-10 text-center">
              <p className="text-slate-400">No hypotheses match the current filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HypothesisPage;
