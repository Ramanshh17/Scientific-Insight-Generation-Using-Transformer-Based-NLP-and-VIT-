import { useState } from 'react';
import type { Insight } from '../utils/hypothesisEngine';

interface Props {
  insights: Insight[];
}

const InsightsPage: React.FC<Props> = ({ insights }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');

  const categories = ['all', ...new Set(insights.map(i => i.category))];
  const importances = ['all', 'high', 'medium', 'low'];

  const filtered = insights
    .filter(i => categoryFilter === 'all' || i.category === categoryFilter)
    .filter(i => importanceFilter === 'all' || i.importance === importanceFilter);

  const categoryStats = insights.reduce((acc, ins) => {
    acc[ins.category] = (acc[ins.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const importanceStats = insights.reduce((acc, ins) => {
    acc[ins.importance] = (acc[ins.importance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">💡 Insights Hub</h2>
        <p className="text-slate-400 text-sm mt-1">Aggregated insights from all your analyses — patterns, anomalies, trends, and recommendations</p>
      </div>

      {insights.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <p className="text-6xl mb-4">💡</p>
          <h3 className="text-xl font-bold text-white mb-2">No Insights Yet</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Start analyzing text, images, or documents to generate insights. The system will automatically
            identify patterns, anomalies, and provide recommendations.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-slate-400">Total Insights</p>
              <p className="text-2xl font-bold text-white">{insights.length}</p>
            </div>
            {Object.entries(categoryStats).slice(0, 4).map(([cat, count]) => (
              <div key={cat} className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 capitalize">{cat}s</p>
                <p className="text-2xl font-bold text-indigo-400">{count}</p>
              </div>
            ))}
          </div>

          {/* Importance Distribution */}
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Priority Distribution</h4>
            <div className="flex gap-4">
              {(['high', 'medium', 'low'] as const).map(imp => (
                <div key={imp} className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={imp === 'high' ? 'text-red-400' : imp === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
                      {imp.charAt(0).toUpperCase() + imp.slice(1)}
                    </span>
                    <span className="text-slate-400">{importanceStats[imp] || 0}</span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${imp === 'high' ? 'bg-red-500' : imp === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${((importanceStats[imp] || 0) / insights.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Category:</span>
              <div className="flex gap-1">
                {categories.map(c => (
                  <button key={c} onClick={() => setCategoryFilter(c)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors capitalize ${
                      categoryFilter === c ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/50 text-slate-400 hover:text-white'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Priority:</span>
              <div className="flex gap-1">
                {importances.map(i => (
                  <button key={i} onClick={() => setImportanceFilter(i)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors capitalize ${
                      importanceFilter === i ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/50 text-slate-400 hover:text-white'
                    }`}>{i}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Insight Cards */}
          <div className="space-y-3">
            {filtered.map(ins => (
              <div key={ins.id} className={`glass rounded-xl p-5 border-l-4 transition-all hover:bg-slate-800/30 ${
                ins.importance === 'high' ? 'border-l-red-500' :
                ins.importance === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{ins.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-medium">{ins.title}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        ins.category === 'pattern' ? 'bg-blue-500/20 text-blue-300' :
                        ins.category === 'anomaly' ? 'bg-red-500/20 text-red-300' :
                        ins.category === 'trend' ? 'bg-green-500/20 text-green-300' :
                        ins.category === 'recommendation' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>{ins.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        ins.importance === 'high' ? 'bg-red-500/10 text-red-400' :
                        ins.importance === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                      }`}>{ins.importance}</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{ins.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="glass rounded-xl p-10 text-center">
              <p className="text-slate-400">No insights match the current filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InsightsPage;
