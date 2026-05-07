import { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { ARXIV_CATEGORIES, CATEGORY_STATS, SAMPLE_PAPERS } from '@/data/arxivData';
import type { Hypothesis, Insight } from '../utils/hypothesisEngine';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#f97316', '#0ea5e9', '#84cc16'];

interface Props {
  onHypothesesGenerated: (hypotheses: Hypothesis[], insights: Insight[]) => void;
}

type TabId = 'overview' | 'categories' | 'compare' | 'trends' | 'papers' | 'hypotheses';

const ArxivAnalyzerPage: React.FC<Props> = ({ onHypothesesGenerated }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['cs.AI', 'cs.LG', 'cs.CV']);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [generated, setGenerated] = useState(false);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);

  const allCats = Object.keys(ARXIV_CATEGORIES);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setGenerated(false);
  };

  const selectAll = () => { setSelectedCategories(allCats); setGenerated(false); };
  const clearAll = () => { setSelectedCategories([]); setGenerated(false); };

  const generateHypotheses = useCallback(() => {
    const hyps: Hypothesis[] = [];
    const ins: Insight[] = [];
    let hId = 0;
    let iId = 0;

    if (selectedCategories.length >= 2) {
      const stats = selectedCategories.map(c => ({ cat: c, ...CATEGORY_STATS[c] }));
      const fastest = stats.reduce((a, b) => a.growth > b.growth ? a : b);
      const mostCited = stats.reduce((a, b) => a.avgCitations > b.avgCitations ? a : b);
      const mostMultiModal = stats.reduce((a, b) => a.multiModal > b.multiModal ? a : b);

      hyps.push({
        id: `ah-${hId++}`, type: 'predictive',
        title: `${ARXIV_CATEGORIES[fastest.cat].label} will dominate future research output`,
        description: `With ${fastest.growth}% growth rate, ${ARXIV_CATEGORIES[fastest.cat].label} is the fastest growing category among the selected set, suggesting it will produce the most papers in the next 2-3 years.`,
        confidence: 0.82,
        evidence: [`Growth rate: ${fastest.growth}%`, `Current papers: ${fastest.papers.toLocaleString()}`, `Compared against ${selectedCategories.length} categories`],
        testSuggestion: 'Track monthly submission rates on arXiv for the next 12 months and compare growth trajectories.',
        domain: ARXIV_CATEGORIES[fastest.cat].group,
      });

      hyps.push({
        id: `ah-${hId++}`, type: 'correlation',
        title: `${ARXIV_CATEGORIES[mostCited.cat].label} citation impact correlates with multi-modal content`,
        description: `${ARXIV_CATEGORIES[mostCited.cat].label} has the highest average citations (${mostCited.avgCitations}) and ${mostCited.multiModal}% multi-modal content, suggesting visual/data-rich papers receive more citations.`,
        confidence: 0.75,
        evidence: [`Avg citations: ${mostCited.avgCitations}`, `Multi-modal: ${mostCited.multiModal}%`, `Open access: ${mostCited.openAccess}%`],
        testSuggestion: 'Analyze citation counts vs multi-modal content percentage across a larger sample.',
        domain: 'Scientometrics',
      });

      hyps.push({
        id: `ah-${hId++}`, type: 'descriptive',
        title: `${ARXIV_CATEGORIES[mostMultiModal.cat].label} leads in multi-modal research adoption`,
        description: `With ${mostMultiModal.multiModal}% of papers containing multi-modal content, ${ARXIV_CATEGORIES[mostMultiModal.cat].label} shows the highest adoption of integrated text-image-data approaches.`,
        confidence: 0.88,
        evidence: [`Multi-modal rate: ${mostMultiModal.multiModal}%`, `Cross-domain rate: ${mostMultiModal.crossDomain}%`],
        testSuggestion: 'Extract and classify content types from paper PDFs to validate multi-modal classification.',
        domain: ARXIV_CATEGORIES[mostMultiModal.cat].group,
      });

      // Cross-domain hypothesis
      const crossDomainPairs = selectedCategories.flatMap((a, i) =>
        selectedCategories.slice(i + 1).map(b => ({
          a, b,
          score: (CATEGORY_STATS[a].crossDomain + CATEGORY_STATS[b].crossDomain) / 2
        }))
      ).sort((x, y) => y.score - x.score);

      if (crossDomainPairs.length > 0) {
        const top = crossDomainPairs[0];
        hyps.push({
          id: `ah-${hId++}`, type: 'causal',
          title: `Cross-pollination between ${ARXIV_CATEGORIES[top.a].label} and ${ARXIV_CATEGORIES[top.b].label}`,
          description: `These two categories show high cross-domain rates (${CATEGORY_STATS[top.a].crossDomain}% and ${CATEGORY_STATS[top.b].crossDomain}%), suggesting methods from one domain frequently transfer to the other.`,
          confidence: 0.71,
          evidence: [
            `${ARXIV_CATEGORIES[top.a].label} cross-domain: ${CATEGORY_STATS[top.a].crossDomain}%`,
            `${ARXIV_CATEGORIES[top.b].label} cross-domain: ${CATEGORY_STATS[top.b].crossDomain}%`,
            `Combined score: ${top.score.toFixed(1)}%`,
          ],
          testSuggestion: 'Analyze co-citation networks between these categories to map knowledge transfer pathways.',
          domain: 'Interdisciplinary Research',
        });
      }

      // Keyword overlap hypothesis
      const allKeywords = selectedCategories.flatMap(c => CATEGORY_STATS[c].topKeywords);
      const kwCounts: Record<string, number> = {};
      allKeywords.forEach(kw => { kwCounts[kw] = (kwCounts[kw] || 0) + 1; });
      const sharedKeywords = Object.entries(kwCounts).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

      if (sharedKeywords.length > 0) {
        hyps.push({
          id: `ah-${hId++}`, type: 'correlation',
          title: `Shared vocabulary indicates methodological convergence`,
          description: `${sharedKeywords.length} keywords appear across multiple selected categories, suggesting convergence in methodology and terminology.`,
          confidence: 0.68,
          evidence: sharedKeywords.slice(0, 5).map(([kw, cnt]) => `"${kw}" shared by ${cnt} categories`),
          testSuggestion: 'Build keyword co-occurrence networks and cluster analysis to identify emerging convergent sub-fields.',
          domain: 'Research Methodology',
        });
      }

      // Insights
      ins.push({
        id: `ai-${iId++}`, title: 'Fastest Growing Category', icon: '🚀',
        description: `${ARXIV_CATEGORIES[fastest.cat].label} leads with ${fastest.growth}% year-over-year growth.`,
        category: 'trend', importance: 'high',
      });
      ins.push({
        id: `ai-${iId++}`, title: 'Highest Impact', icon: '📈',
        description: `${ARXIV_CATEGORIES[mostCited.cat].label} averages ${mostCited.avgCitations} citations per paper.`,
        category: 'pattern', importance: 'high',
      });
      ins.push({
        id: `ai-${iId++}`, title: 'Multi-Modal Leader', icon: '🔗',
        description: `${ARXIV_CATEGORIES[mostMultiModal.cat].label} has ${mostMultiModal.multiModal}% multi-modal papers.`,
        category: 'pattern', importance: 'medium',
      });
      ins.push({
        id: `ai-${iId++}`, title: 'Cross-Domain Potential', icon: '🌐',
        description: `${sharedKeywords.length} shared keywords found across ${selectedCategories.length} categories — strong potential for interdisciplinary research.`,
        category: 'recommendation', importance: 'high',
      });
      ins.push({
        id: `ai-${iId++}`, title: 'Total Research Volume', icon: '📊',
        description: `Selected categories contain ${stats.reduce((s, c) => s + c.papers, 0).toLocaleString()} total papers for analysis.`,
        category: 'pattern', importance: 'medium',
      });
    }

    setHypotheses(hyps);
    setInsights(ins);
    setGenerated(true);
    onHypothesesGenerated(hyps, ins);
  }, [selectedCategories, onHypothesesGenerated]);

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'overview', icon: '📋', label: 'Overview' },
    { id: 'categories', icon: '🏷️', label: 'Categories' },
    { id: 'compare', icon: '📊', label: 'Compare' },
    { id: 'trends', icon: '📈', label: 'Trends' },
    { id: 'papers', icon: '📄', label: 'Sample Papers' },
    { id: 'hypotheses', icon: '🧪', label: 'Hypotheses' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">📚 arXiv Category Analyzer</h2>
        <p className="text-slate-400 text-sm mt-1">
          Analyze research papers across arXiv categories from the Cornell University dataset
        </p>
      </div>

      {/* Category Selector */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-300">Select Categories to Analyze</h4>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">Select All</button>
            <button onClick={clearAll} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30">Clear</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {allCats.map(cat => {
            const info = ARXIV_CATEGORIES[cat];
            const selected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                  selected
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected ? info.color : '#475569' }} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{cat}</div>
                  <div className="text-[10px] opacity-60 truncate">{info.label}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">{selectedCategories.length} categories selected</span>
          <button
            onClick={generateHypotheses}
            disabled={selectedCategories.length < 2}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            🧪 Generate Hypotheses & Insights
          </button>
        </div>
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

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '📄', label: 'Total Papers', value: selectedCategories.reduce((s, c) => s + (CATEGORY_STATS[c]?.papers || 0), 0).toLocaleString() },
              { icon: '📈', label: 'Avg Growth', value: `${(selectedCategories.reduce((s, c) => s + (CATEGORY_STATS[c]?.growth || 0), 0) / Math.max(selectedCategories.length, 1)).toFixed(1)}%` },
              { icon: '🔗', label: 'Avg Multi-Modal', value: `${(selectedCategories.reduce((s, c) => s + (CATEGORY_STATS[c]?.multiModal || 0), 0) / Math.max(selectedCategories.length, 1)).toFixed(0)}%` },
              { icon: '📊', label: 'Avg Citations', value: (selectedCategories.reduce((s, c) => s + (CATEGORY_STATS[c]?.avgCitations || 0), 0) / Math.max(selectedCategories.length, 1)).toFixed(1) },
            ].map((s, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{s.icon}</span>
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Category Distribution Bar Chart */}
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Papers per Category</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedCategories.map(c => ({
                  name: c,
                  papers: CATEGORY_STATS[c]?.papers || 0,
                  fill: ARXIV_CATEGORIES[c]?.color || '#6366f1',
                }))} layout="vertical" margin={{ left: 90 }}>
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Bar dataKey="papers" radius={[0, 4, 4, 0]}>
                    {selectedCategories.map((c, i) => (
                      <Cell key={i} fill={ARXIV_CATEGORIES[c]?.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth vs Citations Scatter */}
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Growth Rate vs Average Citations</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ bottom: 20, left: 20, right: 20, top: 10 }}>
                  <XAxis type="number" dataKey="growth" name="Growth %" stroke="#64748b" />
                  <YAxis type="number" dataKey="citations" name="Avg Citations" stroke="#64748b" />
                  <ZAxis type="number" dataKey="papers" range={[60, 400]} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Scatter data={selectedCategories.map(c => ({
                    name: c,
                    growth: CATEGORY_STATS[c]?.growth || 0,
                    citations: CATEGORY_STATS[c]?.avgCitations || 0,
                    papers: CATEGORY_STATS[c]?.papers || 0,
                  }))} fill="#6366f1">
                    {selectedCategories.map((c, i) => (
                      <Cell key={i} fill={ARXIV_CATEGORIES[c]?.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {selectedCategories.map(cat => {
            const info = ARXIV_CATEGORIES[cat];
            const stats = CATEGORY_STATS[cat];
            if (!info || !stats) return null;
            return (
              <div key={cat} className="glass rounded-xl p-5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: `${info.color}20`, color: info.color }}>
                    {cat.split('.')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-semibold">{info.label}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${info.color}20`, color: info.color }}>{cat}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{info.group}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{info.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {[
                        { label: 'Papers', value: stats.papers.toLocaleString() },
                        { label: 'Growth', value: `${stats.growth}%` },
                        { label: 'Avg Citations', value: stats.avgCitations.toFixed(1) },
                        { label: 'Avg Authors', value: stats.avgAuthors.toFixed(1) },
                        { label: 'Multi-Modal', value: `${stats.multiModal}%` },
                        { label: 'Open Access', value: `${stats.openAccess}%` },
                        { label: 'Cross-Domain', value: `${stats.crossDomain}%` },
                        { label: 'Avg Abstract', value: `${stats.avgAbstractLen} words` },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-lg p-2">
                          <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
                          <p className="text-sm font-semibold text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {stats.topKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPARE TAB */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Radar comparison */}
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Category Profile Comparison (Radar)</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: 'Growth', ...Object.fromEntries(selectedCategories.slice(0, 6).map(c => [c, CATEGORY_STATS[c]?.growth || 0])) },
                  { metric: 'Citations', ...Object.fromEntries(selectedCategories.slice(0, 6).map(c => [c, CATEGORY_STATS[c]?.avgCitations || 0])) },
                  { metric: 'Multi-Modal', ...Object.fromEntries(selectedCategories.slice(0, 6).map(c => [c, CATEGORY_STATS[c]?.multiModal || 0])) },
                  { metric: 'Open Access', ...Object.fromEntries(selectedCategories.slice(0, 6).map(c => [c, CATEGORY_STATS[c]?.openAccess || 0])) },
                  { metric: 'Cross-Domain', ...Object.fromEntries(selectedCategories.slice(0, 6).map(c => [c, CATEGORY_STATS[c]?.crossDomain || 0])) },
                  { metric: 'Collaboration', ...Object.fromEntries(selectedCategories.slice(0, 6).map(c => [c, (CATEGORY_STATS[c]?.avgAuthors || 0) * 15])) },
                ]}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  {selectedCategories.slice(0, 6).map((cat, i) => (
                    <Radar key={cat} name={cat} dataKey={cat} stroke={ARXIV_CATEGORIES[cat]?.color || COLORS[i]} fill={ARXIV_CATEGORIES[cat]?.color || COLORS[i]} fillOpacity={0.1} />
                  ))}
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {selectedCategories.slice(0, 6).map(cat => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ARXIV_CATEGORIES[cat]?.color }} />
                  <span className="text-xs text-slate-400">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="glass rounded-xl p-5 overflow-x-auto">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Detailed Comparison Table</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Category</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Papers</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Growth %</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Citations</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Authors</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Multi-Modal</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Cross-Domain</th>
                </tr>
              </thead>
              <tbody>
                {selectedCategories.map(cat => {
                  const s = CATEGORY_STATS[cat];
                  if (!s) return null;
                  return (
                    <tr key={cat} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ARXIV_CATEGORIES[cat]?.color }} />
                          <span className="text-white font-medium">{cat}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 text-slate-300">{s.papers.toLocaleString()}</td>
                      <td className="text-right py-2 px-3"><span className="text-green-400">{s.growth}%</span></td>
                      <td className="text-right py-2 px-3 text-slate-300">{s.avgCitations}</td>
                      <td className="text-right py-2 px-3 text-slate-300">{s.avgAuthors}</td>
                      <td className="text-right py-2 px-3 text-slate-300">{s.multiModal}%</td>
                      <td className="text-right py-2 px-3 text-slate-300">{s.crossDomain}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Multi-modal vs cross-domain pie charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-4">Multi-Modal Content %</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={selectedCategories.map(c => ({ name: c, value: CATEGORY_STATS[c]?.multiModal || 0 }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                      {selectedCategories.map((c, i) => <Cell key={i} fill={ARXIV_CATEGORIES[c]?.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass rounded-xl p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-4">Cross-Domain Rate %</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={selectedCategories.map(c => ({ name: c, value: CATEGORY_STATS[c]?.crossDomain || 0 }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                      {selectedCategories.map((c, i) => <Cell key={i} fill={ARXIV_CATEGORIES[c]?.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Yearly Paper Submissions by Category</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(() => {
                  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
                  return years.map(year => {
                    const point: Record<string, number | string> = { year: String(year) };
                    selectedCategories.forEach(c => {
                      const yp = CATEGORY_STATS[c]?.yearlyPapers.find(y => y.year === year);
                      point[c] = yp?.count || 0;
                    });
                    return point;
                  });
                })()}>
                  <XAxis dataKey="year" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  {selectedCategories.slice(0, 8).map((cat, i) => (
                    <Line key={cat} type="monotone" dataKey={cat} stroke={ARXIV_CATEGORIES[cat]?.color || COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {selectedCategories.slice(0, 8).map(cat => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded" style={{ backgroundColor: ARXIV_CATEGORIES[cat]?.color }} />
                  <span className="text-xs text-slate-400">{cat} — {ARXIV_CATEGORIES[cat]?.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Rate Comparison */}
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Growth Rate Comparison (%)</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedCategories.map(c => ({
                  name: c,
                  growth: CATEGORY_STATS[c]?.growth || 0,
                })).sort((a, b) => b.growth - a.growth)}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                    {selectedCategories.map((c, i) => (
                      <Cell key={i} fill={ARXIV_CATEGORIES[c]?.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Keyword Frequency across categories */}
          <div className="glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Top Keywords Across Selected Categories</h4>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const allKw: Record<string, { count: number; cats: string[] }> = {};
                selectedCategories.forEach(c => {
                  CATEGORY_STATS[c]?.topKeywords.forEach(kw => {
                    if (!allKw[kw]) allKw[kw] = { count: 0, cats: [] };
                    allKw[kw].count++;
                    allKw[kw].cats.push(c);
                  });
                });
                return Object.entries(allKw)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([kw, info]) => (
                    <div key={kw} className={`px-3 py-1.5 rounded-lg text-xs ${info.count > 1 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800/50 text-slate-400'}`}>
                      {kw}
                      {info.count > 1 && <span className="ml-1 text-[10px] opacity-60">({info.count} cats)</span>}
                    </div>
                  ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* PAPERS TAB */}
      {activeTab === 'papers' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-4">
              Sample papers from the arXiv dataset. In production, this connects to the full Kaggle arXiv dataset with 2.2M+ papers.
            </p>
          </div>
          {selectedCategories.map(cat => {
            const papers = SAMPLE_PAPERS[cat];
            if (!papers || papers.length === 0) return (
              <div key={cat} className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ARXIV_CATEGORIES[cat]?.color }} />
                  <h4 className="text-white font-medium text-sm">{cat} — {ARXIV_CATEGORIES[cat]?.label}</h4>
                </div>
                <p className="text-xs text-slate-500 italic">No sample papers loaded for this category</p>
              </div>
            );
            return (
              <div key={cat} className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ARXIV_CATEGORIES[cat]?.color }} />
                  <h4 className="text-white font-medium text-sm">{cat} — {ARXIV_CATEGORIES[cat]?.label}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{papers.length} samples</span>
                </div>
                <div className="space-y-3">
                  {papers.map(paper => (
                    <div
                      key={paper.id}
                      className={`bg-slate-800/50 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-800/70 ${expandedPaper === paper.id ? 'ring-1 ring-indigo-500/50' : ''}`}
                      onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="text-white font-medium text-sm">{paper.title}</h5>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-500">{paper.id}</span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] text-slate-500">{paper.year}</span>
                            {paper.journal_ref && (
                              <>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className="text-[10px] text-indigo-400">{paper.journal_ref}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-slate-500 text-xs">{expandedPaper === paper.id ? '▼' : '▶'}</span>
                      </div>
                      {expandedPaper === paper.id && (
                        <div className="mt-3 space-y-3 border-t border-slate-700/50 pt-3">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Abstract</p>
                            <p className="text-xs text-slate-300 leading-relaxed">{paper.abstract}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase mb-1">Authors</p>
                              <div className="flex flex-wrap gap-1">
                                {paper.authors.map((a, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">{a}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase mb-1">Categories</p>
                            <div className="flex gap-1">
                              {paper.categories.map(c => (
                                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ARXIV_CATEGORIES[c]?.color || '#6366f1'}20`, color: ARXIV_CATEGORIES[c]?.color || '#6366f1' }}>
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HYPOTHESES TAB */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-6">
          {!generated ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🧪</div>
              <h4 className="text-white font-medium text-lg mb-2">Generate Hypotheses</h4>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
                Select at least 2 categories and click "Generate Hypotheses & Insights" to create data-driven hypotheses.
              </p>
              <button
                onClick={generateHypotheses}
                disabled={selectedCategories.length < 2}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium disabled:opacity-30 transition-all"
              >
                Generate Now
              </button>
            </div>
          ) : (
            <>
              {/* Hypotheses */}
              <h4 className="text-sm font-medium text-slate-300">🧪 {hypotheses.length} Hypotheses Generated</h4>
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

              {/* Insights */}
              <h4 className="text-sm font-medium text-slate-300 mt-8">💡 {insights.length} Insights</h4>
              {insights.map(ins => (
                <div
                  key={ins.id}
                  className={`glass rounded-xl p-5 border-l-4 ${
                    ins.importance === 'high' ? 'border-l-red-500' :
                    ins.importance === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ins.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium">{ins.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ins.category === 'trend' ? 'bg-blue-500/20 text-blue-300' :
                          ins.category === 'pattern' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>{ins.category}</span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{ins.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ArxivAnalyzerPage;
