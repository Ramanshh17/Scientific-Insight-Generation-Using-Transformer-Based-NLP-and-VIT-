import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend, AreaChart, Area, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// Training data over epochs
const trainingData = Array.from({ length: 50 }, (_, i) => ({
  epoch: i + 1,
  trainLoss: 2.5 * Math.exp(-0.06 * i) + 0.15 + Math.random() * 0.05,
  valLoss: 2.5 * Math.exp(-0.055 * i) + 0.22 + Math.random() * 0.08,
  trainAcc: Math.min(98, 45 + 50 * (1 - Math.exp(-0.08 * i)) + Math.random() * 2),
  valAcc: Math.min(95, 40 + 48 * (1 - Math.exp(-0.07 * i)) + Math.random() * 3),
  lr: 0.001 * Math.pow(0.95, Math.floor(i / 5)),
}));

// Model comparison
const models = [
  { name: 'BERT-Base', accuracy: 87.3, f1: 86.1, precision: 88.2, recall: 84.1, params: '110M', time: '2.4h', type: 'Text' },
  { name: 'ViT-B/16', accuracy: 84.7, f1: 83.5, precision: 85.9, recall: 81.2, params: '86M', time: '3.1h', type: 'Image' },
  { name: 'ResNet-50+BERT', accuracy: 89.1, f1: 88.4, precision: 90.0, recall: 86.9, params: '135M', time: '4.5h', type: 'Fusion' },
  { name: 'TabNet', accuracy: 82.5, f1: 81.0, precision: 83.7, recall: 78.4, params: '12M', time: '0.8h', type: 'Tabular' },
  { name: 'Full Fusion', accuracy: 92.4, f1: 91.8, precision: 93.1, recall: 90.5, params: '243M', time: '6.2h', type: 'Multi-Modal' },
];

// Confusion matrix
const confusionMatrix = [
  [892, 23, 15, 8, 12],
  [18, 845, 32, 20, 15],
  [12, 28, 878, 22, 10],
  [5, 15, 18, 901, 11],
  [10, 12, 8, 14, 906],
];
const classLabels = ['Scientific', 'Technical', 'Medical', 'Engineering', 'General'];

// Per-class metrics
const perClassMetrics = classLabels.map((label, i) => {
  const tp = confusionMatrix[i][i];
  const rowSum = confusionMatrix[i].reduce((a, b) => a + b, 0);
  const colSum = confusionMatrix.reduce((a, row) => a + row[i], 0);
  const precision = tp / colSum;
  const recall = tp / rowSum;
  const f1 = 2 * (precision * recall) / (precision + recall);
  return {
    class: label,
    precision: Math.round(precision * 1000) / 10,
    recall: Math.round(recall * 1000) / 10,
    f1: Math.round(f1 * 1000) / 10,
    support: rowSum,
  };
});

// Ablation study
const ablationData = [
  { config: 'Text Only', accuracy: 87.3, f1: 86.1 },
  { config: 'Image Only', accuracy: 84.7, f1: 83.5 },
  { config: 'Tabular Only', accuracy: 82.5, f1: 81.0 },
  { config: 'Text + Image', accuracy: 89.1, f1: 88.4 },
  { config: 'Text + Tabular', accuracy: 88.2, f1: 87.0 },
  { config: 'Image + Tabular', accuracy: 86.3, f1: 85.1 },
  { config: 'All (Fusion)', accuracy: 92.4, f1: 91.8 },
];

type TabId = 'overview' | 'training' | 'metrics' | 'comparison' | 'architecture' | 'ablation';

export default function ModelPerformancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [epochRange, setEpochRange] = useState(50);

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'overview', icon: '📋', label: 'Overview' },
    { id: 'training', icon: '📈', label: 'Training' },
    { id: 'metrics', icon: '🎯', label: 'Metrics' },
    { id: 'comparison', icon: '⚖️', label: 'Comparison' },
    { id: 'architecture', icon: '🏗️', label: 'Architecture' },
    { id: 'ablation', icon: '🧬', label: 'Ablation' },
  ];

  const tooltipStyle = { background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">📊 Model Performance</h2>
        <p className="text-slate-400 text-sm mt-1">Training metrics, model comparison, and ablation studies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: '🎯', label: 'Best Accuracy', value: '92.4%', color: 'text-green-400' },
          { icon: '📊', label: 'Best F1', value: '91.8%', color: 'text-blue-400' },
          { icon: '⏱️', label: 'Training Time', value: '6.2h', color: 'text-yellow-400' },
          { icon: '🔢', label: 'Parameters', value: '243M', color: 'text-purple-400' },
          { icon: '📦', label: 'Models', value: '5', color: 'text-cyan-400' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{s.icon}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
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
                ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">🏆 Best Model: Full Fusion (Multi-Modal)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Accuracy', value: '92.4%', bar: 92.4 },
                { label: 'F1 Score', value: '91.8%', bar: 91.8 },
                { label: 'Precision', value: '93.1%', bar: 93.1 },
                { label: 'Recall', value: '90.5%', bar: 90.5 },
              ].map((m, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                  <p className="text-2xl font-bold text-white mb-2">{m.value}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${m.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-4">📈 Quick Training Summary</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData}>
                    <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="trainAcc" stroke="#6366f1" dot={false} name="Train Acc" strokeWidth={2} />
                    <Line type="monotone" dataKey="valAcc" stroke="#10b981" dot={false} name="Val Acc" strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass rounded-xl p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-4">⚖️ Model Accuracy Comparison</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={models}>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis domain={[75, 95]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} name="Accuracy">
                      {models.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRAINING */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-slate-300">📉 Loss Curves</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Epochs:</span>
                <input type="range" min={10} max={50} value={epochRange} onChange={e => setEpochRange(Number(e.target.value))}
                  className="w-32 accent-indigo-500" />
                <span className="text-xs text-indigo-400 font-medium w-6">{epochRange}</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trainingData.slice(0, epochRange)}>
                  <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="trainLoss" stroke="#6366f1" dot={false} name="Train Loss" strokeWidth={2} />
                  <Line type="monotone" dataKey="valLoss" stroke="#ef4444" dot={false} name="Val Loss" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📈 Accuracy Curves</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trainingData.slice(0, epochRange)}>
                  <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis domain={[30, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="trainAcc" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Train Acc" strokeWidth={2} />
                  <Area type="monotone" dataKey="valAcc" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Val Acc" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Learning Rate Schedule</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trainingData.slice(0, epochRange)}>
                  <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(4)} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="stepAfter" dataKey="lr" stroke="#f59e0b" dot={false} name="Learning Rate" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📋 Training Configuration</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Optimizer', value: 'AdamW' },
                { label: 'Initial LR', value: '0.001' },
                { label: 'Batch Size', value: '32' },
                { label: 'Weight Decay', value: '0.01' },
                { label: 'Epochs', value: '50' },
                { label: 'Scheduler', value: 'StepLR (γ=0.95)' },
                { label: 'Dropout', value: '0.3' },
                { label: 'GPU', value: 'NVIDIA A100' },
              ].map((c, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{c.label}</p>
                  <p className="text-sm text-white font-medium mt-0.5">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* METRICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">🎯 Per-Class Metrics</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perClassMetrics} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" domain={[75, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="class" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="precision" fill="#6366f1" name="Precision" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="recall" fill="#10b981" name="Recall" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="f1" fill="#f59e0b" name="F1" radius={[0, 2, 2, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">🔢 Confusion Matrix</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-xs text-slate-500 p-2 text-left">Actual \ Predicted</th>
                    {classLabels.map(l => (
                      <th key={l} className="text-xs text-slate-400 p-2 text-center">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confusionMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="text-xs text-slate-300 p-2 font-medium">{classLabels[i]}</td>
                      {row.map((val, j) => {
                        const maxVal = Math.max(...row);
                        const intensity = val / maxVal;
                        const isDiagonal = i === j;
                        return (
                          <td key={j} className="p-1 text-center">
                            <div
                              className={`rounded-lg py-2 px-3 text-sm font-mono font-medium ${
                                isDiagonal
                                  ? 'text-white'
                                  : 'text-slate-300'
                              }`}
                              style={{
                                backgroundColor: isDiagonal
                                  ? `rgba(99, 102, 241, ${0.2 + intensity * 0.6})`
                                  : `rgba(239, 68, 68, ${intensity * 0.3})`,
                              }}
                            >
                              {val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Metrics Summary Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 p-3">Class</th>
                    <th className="text-center text-slate-400 p-3">Precision</th>
                    <th className="text-center text-slate-400 p-3">Recall</th>
                    <th className="text-center text-slate-400 p-3">F1 Score</th>
                    <th className="text-center text-slate-400 p-3">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {perClassMetrics.map((m, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="p-3 text-white font-medium">{m.class}</td>
                      <td className="p-3 text-center text-blue-400">{m.precision}%</td>
                      <td className="p-3 text-center text-green-400">{m.recall}%</td>
                      <td className="p-3 text-center text-yellow-400">{m.f1}%</td>
                      <td className="p-3 text-center text-slate-300">{m.support}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-800/30 font-medium">
                    <td className="p-3 text-indigo-300">Weighted Avg</td>
                    <td className="p-3 text-center text-blue-300">
                      {(perClassMetrics.reduce((a, m) => a + m.precision * m.support, 0) / perClassMetrics.reduce((a, m) => a + m.support, 0)).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-green-300">
                      {(perClassMetrics.reduce((a, m) => a + m.recall * m.support, 0) / perClassMetrics.reduce((a, m) => a + m.support, 0)).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-yellow-300">
                      {(perClassMetrics.reduce((a, m) => a + m.f1 * m.support, 0) / perClassMetrics.reduce((a, m) => a + m.support, 0)).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-slate-300">
                      {perClassMetrics.reduce((a, m) => a + m.support, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">🕸️ Model Capability Radar</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: 'Accuracy', ...Object.fromEntries(models.map(m => [m.name, m.accuracy])) },
                  { metric: 'F1 Score', ...Object.fromEntries(models.map(m => [m.name, m.f1])) },
                  { metric: 'Precision', ...Object.fromEntries(models.map(m => [m.name, m.precision])) },
                  { metric: 'Recall', ...Object.fromEntries(models.map(m => [m.name, m.recall])) },
                ]}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[70, 95]} tick={{ fill: '#64748b', fontSize: 9 }} />
                  {models.map((m, i) => (
                    <Radar key={m.name} name={m.name} dataKey={m.name}
                      stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.05} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Full Comparison Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 p-3">Model</th>
                    <th className="text-center text-slate-400 p-3">Type</th>
                    <th className="text-center text-slate-400 p-3">Accuracy</th>
                    <th className="text-center text-slate-400 p-3">F1</th>
                    <th className="text-center text-slate-400 p-3">Precision</th>
                    <th className="text-center text-slate-400 p-3">Recall</th>
                    <th className="text-center text-slate-400 p-3">Params</th>
                    <th className="text-center text-slate-400 p-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={i} className={`border-b border-slate-800 hover:bg-slate-800/30 ${m.name === 'Full Fusion' ? 'bg-indigo-500/5' : ''}`}>
                      <td className="p-3 text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        {m.name}
                        {m.name === 'Full Fusion' && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">BEST</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          m.type === 'Multi-Modal' ? 'bg-purple-500/20 text-purple-300' :
                          m.type === 'Text' ? 'bg-blue-500/20 text-blue-300' :
                          m.type === 'Image' ? 'bg-green-500/20 text-green-300' :
                          m.type === 'Fusion' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-cyan-500/20 text-cyan-300'
                        }`}>{m.type}</span>
                      </td>
                      <td className="p-3 text-center text-green-400">{m.accuracy}%</td>
                      <td className="p-3 text-center text-blue-400">{m.f1}%</td>
                      <td className="p-3 text-center text-purple-400">{m.precision}%</td>
                      <td className="p-3 text-center text-orange-400">{m.recall}%</td>
                      <td className="p-3 text-center text-slate-300">{m.params}</td>
                      <td className="p-3 text-center text-slate-300">{m.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📈 Accuracy vs F1 Comparison</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={models}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis domain={[75, 95]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="accuracy" fill="#6366f1" name="Accuracy" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="f1" fill="#10b981" name="F1 Score" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-300 mb-6">🏗️ Multi-Modal Fusion Architecture</h4>
            <div className="flex flex-col items-center gap-6">
              {/* Input Layer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                {[
                  { name: 'Text Input', desc: 'Research papers, abstracts', color: 'from-blue-500 to-blue-600', icon: '📝' },
                  { name: 'Image Input', desc: 'Figures, charts, diagrams', color: 'from-green-500 to-green-600', icon: '🖼️' },
                  { name: 'Tabular Input', desc: 'Metadata, statistics', color: 'from-orange-500 to-orange-600', icon: '📊' },
                ].map((input, i) => (
                  <div key={i} className={`bg-gradient-to-br ${input.color} rounded-xl p-4 text-center text-white`}>
                    <span className="text-2xl">{input.icon}</span>
                    <p className="font-medium text-sm mt-1">{input.name}</p>
                    <p className="text-[10px] opacity-80">{input.desc}</p>
                  </div>
                ))}
              </div>

              <div className="text-slate-500 text-2xl">↓ ↓ ↓</div>

              {/* Encoder Layer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                {[
                  { name: 'BERT Encoder', params: '110M params', dim: '768-dim', color: 'border-blue-500/50 bg-blue-500/10' },
                  { name: 'ViT Encoder', params: '86M params', dim: '768-dim', color: 'border-green-500/50 bg-green-500/10' },
                  { name: 'TabNet Encoder', params: '12M params', dim: '256-dim', color: 'border-orange-500/50 bg-orange-500/10' },
                ].map((enc, i) => (
                  <div key={i} className={`border rounded-xl p-4 text-center ${enc.color}`}>
                    <p className="text-white font-medium text-sm">{enc.name}</p>
                    <p className="text-[10px] text-slate-400">{enc.params}</p>
                    <p className="text-[10px] text-slate-500">{enc.dim}</p>
                  </div>
                ))}
              </div>

              <div className="text-slate-500 text-2xl">↓ ↓ ↓</div>

              {/* Fusion Layer */}
              <div className="border-2 border-purple-500/50 bg-purple-500/10 rounded-xl p-5 text-center max-w-md w-full">
                <p className="text-purple-300 font-bold text-lg">🔮 Multi-Modal Fusion</p>
                <p className="text-xs text-slate-400 mt-1">Attention-based cross-modal alignment</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-purple-500/20 rounded-lg p-2">
                    <p className="text-[9px] text-purple-300">Cross-Attention</p>
                  </div>
                  <div className="bg-purple-500/20 rounded-lg p-2">
                    <p className="text-[9px] text-purple-300">Feature Concat</p>
                  </div>
                  <div className="bg-purple-500/20 rounded-lg p-2">
                    <p className="text-[9px] text-purple-300">Gated Fusion</p>
                  </div>
                </div>
              </div>

              <div className="text-slate-500 text-2xl">↓</div>

              {/* Classification Head */}
              <div className="border-2 border-indigo-500/50 bg-indigo-500/10 rounded-xl p-5 text-center max-w-sm w-full">
                <p className="text-indigo-300 font-bold">🎯 Classification Head</p>
                <p className="text-xs text-slate-400 mt-1">MLP → Softmax → 5 classes</p>
                <p className="text-[10px] text-slate-500 mt-1">Dropout: 0.3 | Hidden: 512</p>
              </div>

              <div className="text-slate-500 text-2xl">↓</div>

              {/* Output */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-center max-w-xs w-full">
                <p className="text-white font-bold">📋 Output Predictions</p>
                <p className="text-[10px] text-white/80">+ Explainability maps</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABLATION */}
      {activeTab === 'ablation' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">🧬 Ablation Study Results</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ablationData} layout="vertical" margin={{ left: 100 }}>
                  <XAxis type="number" domain={[75, 95]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="config" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="accuracy" fill="#6366f1" name="Accuracy" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="f1" fill="#10b981" name="F1 Score" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">📊 Modality Contribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { modality: 'Text', alone: 87.3, contribution: '+5.1%', icon: '📝', color: 'blue' },
                { modality: 'Image', alone: 84.7, contribution: '+3.3%', icon: '🖼️', color: 'green' },
                { modality: 'Tabular', alone: 82.5, contribution: '+2.2%', icon: '📊', color: 'orange' },
              ].map((m, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="text-white font-medium">{m.modality}</p>
                      <p className="text-xs text-slate-500">Standalone: {m.alone}%</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-white">{m.alone}%</p>
                    <p className={`text-sm font-medium mb-1 ${
                      m.color === 'blue' ? 'text-blue-400' :
                      m.color === 'green' ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {m.contribution} to fusion
                    </p>
                  </div>
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        m.color === 'blue' ? 'bg-blue-500' :
                        m.color === 'green' ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${m.alone}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">💡 Key Findings</h4>
            <div className="space-y-3">
              {[
                { icon: '🏆', text: 'Full multi-modal fusion achieves 92.4% accuracy — 5.1% better than best single modality', color: 'text-green-400' },
                { icon: '📝', text: 'Text is the strongest single modality at 87.3%, confirming the importance of NLP in scientific analysis', color: 'text-blue-400' },
                { icon: '🔗', text: 'Text + Image fusion (89.1%) outperforms any dual combination, suggesting strong cross-modal complementarity', color: 'text-purple-400' },
                { icon: '📊', text: 'Adding tabular data provides +2.2% improvement — smaller but consistent across all configurations', color: 'text-orange-400' },
                { icon: '⚡', text: 'Diminishing returns observed: each additional modality contributes less individually but the combined effect is super-additive', color: 'text-yellow-400' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-4">
                  <span className="text-lg">{f.icon}</span>
                  <p className={`text-sm ${f.color}`}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
