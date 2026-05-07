import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#84cc16','#a855f7','#22d3ee'];
const tooltipStyle = { background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' };
const tooltipItemStyle = { color: '#e2e8f0' };

const arxivGrowth = [
  { year: '2015', papers: 105000, aiml: 8200 }, { year: '2016', papers: 119000, aiml: 12400 },
  { year: '2017', papers: 131000, aiml: 19600 }, { year: '2018', papers: 148000, aiml: 31200 },
  { year: '2019', papers: 170000, aiml: 45800 }, { year: '2020', papers: 195000, aiml: 62400 },
  { year: '2021', papers: 218000, aiml: 78900 }, { year: '2022', papers: 240000, aiml: 98500 },
  { year: '2023', papers: 265000, aiml: 125000 },
];

const arxivCategories = [
  { name: 'cs.AI', count: 89000 }, { name: 'cs.LG', count: 125000 }, { name: 'cs.CV', count: 78000 },
  { name: 'physics', count: 210000 }, { name: 'math', count: 185000 }, { name: 'stat', count: 45000 },
  { name: 'q-bio', count: 28000 }, { name: 'cs.CL', count: 42000 }, { name: 'astro-ph', count: 95000 },
];

const docComplexityMock = [
  { metric: 'Text Density', value: 72 }, { metric: 'Layout Complexity', value: 58 },
  { metric: 'Visual Elements', value: 45 }, { metric: 'Table Presence', value: 38 },
  { metric: 'Multi-Column', value: 52 }, { metric: 'Image Inclusion', value: 35 },
];

const EDAPage: React.FC = () => {
  const [activeDataset, setActiveDataset] = useState<'arxiv' | 'worldbank' | 'rvlcdip'>('arxiv');
  const [wbData, setWbData] = useState<any>(null);
  const [rvlData, setRvlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeDataset === 'worldbank' && !wbData) {
      fetchWbData();
    } else if (activeDataset === 'rvlcdip' && !rvlData) {
      fetchRvlData();
    }
  }, [activeDataset]);

  const fetchWbData = async () => {
    setIsLoading(true);
    const res = await api.getEDAStats('worldbank');
    if (res.success) setWbData(res);
    setIsLoading(false);
  };

  const fetchRvlData = async () => {
    setIsLoading(true);
    const res = await api.getEDAStats('rvlcdip');
    if (res.success) setRvlData(res);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">📊 EDA Explorer</h2>
        <p className="text-slate-400 text-sm mt-1">Exploratory Data Analysis across arXiv, World Bank, and RVL-CDIP datasets</p>
      </div>

      {/* Dataset Selector */}
      <div className="flex gap-2 bg-slate-800/50 rounded-lg p-1">
        {([
          { id: 'arxiv' as const, label: '📚 arXiv Papers', sub: '2.3M+ papers' },
          { id: 'worldbank' as const, label: '🌍 World Bank', sub: '1,400+ indicators' },
          { id: 'rvlcdip' as const, label: '📄 RVL-CDIP', sub: '400K images' },
        ]).map(ds => (
          <button key={ds.id} onClick={() => setActiveDataset(ds.id)}
            className={`flex-1 py-3 text-sm rounded-lg transition-all ${
              activeDataset === ds.id ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-slate-400 hover:text-white'
            }`}>
            <div>{ds.label}</div>
            <div className="text-[10px] text-slate-500">{ds.sub}</div>
          </button>
        ))}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="py-20 text-center animate-pulse">
          <div className="text-indigo-400 text-lg">Loading dataset patterns...</div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* arXiv EDA */}
          {activeDataset === 'arxiv' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Papers', value: '2.3M+', icon: '📄' },
                  { label: 'Categories', value: '170+', icon: '📂' },
                  { label: 'Authors', value: '1.5M+', icon: '👥' },
                  { label: 'Year Range', value: '1991-2024', icon: '📅' },
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

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Paper Growth Over Time</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={arxivGrowth}>
                      <XAxis dataKey="year" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Area type="monotone" dataKey="papers" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="Total Papers" />
                      <Area type="monotone" dataKey="aiml" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="AI/ML Papers" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Category Distribution (Top 12)</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={arxivCategories} layout="vertical" margin={{ left: 60 }}>
                      <XAxis type="number" stroke="#64748b" tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* World Bank EDA */}
          {activeDataset === 'worldbank' && wbData && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Countries Analyzed', value: wbData.summary.countries, icon: '🌍' },
                  { label: 'Key Indicators', value: wbData.summary.indicators, icon: '📊' },
                  { label: 'Year Range', value: wbData.summary.year_range, icon: '📅' },
                  { label: 'Data Points', value: wbData.summary.data_points, icon: '💾' },
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

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Average Indicators Over Time</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wbData.trends}>
                      <XAxis dataKey="year" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Line type="monotone" dataKey="gdp_growth" stroke="#6366f1" strokeWidth={2} name="Avg GDP Growth %" dot />
                      <Line type="monotone" dataKey="unemployment_rate" stroke="#ef4444" strokeWidth={2} name="Avg Unemployment %" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Indicator Comparison by Country (Latest Year)</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wbData.countries} layout="vertical" margin={{ left: 70 }}>
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis type="category" dataKey="country" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Bar dataKey="life_expectancy" fill="#10b981" radius={[0, 4, 4, 0]} name="Life Expectancy" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* RVL-CDIP EDA */}
          {activeDataset === 'rvlcdip' && rvlData && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sample Images', value: rvlData.total_images.toLocaleString(), icon: '🖼️' },
                  { label: 'Visual Classes', value: rvlData.categories.length, icon: '📂' },
                  { label: 'Dataset Size', value: '100 GB+', icon: '💾' },
                  { label: 'Resolution', value: 'Varies', icon: '📐' },
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

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Sample Documents Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {rvlData.categories.map((cat: any, i: number) => (
                    <div key={i} className="group relative aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                      <img 
                        src={api.getEDAImageUrl(cat.file)} 
                        alt={cat.name}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 to-transparent">
                        <p className="text-xs font-bold text-white">{cat.name}</p>
                        <p className="text-[10px] text-slate-400">Class: {cat.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Visual Complexity Distribution</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={docComplexityMock}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis tick={false} domain={[0, 100]} />
                      <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cross-Dataset Comparison */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📋 Cross-Dataset Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-left py-3 px-4 text-indigo-400 font-medium">arXiv</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-medium">World Bank</th>
                <th className="text-left py-3 px-4 text-purple-400 font-medium">RVL-CDIP</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ['Data Type', 'Text + Metadata', 'Structured/Tabular', 'Document Images'],
                ['Size', '2.3M+ papers', '500K+ data points', '400K images'],
                ['Format', 'JSON/LaTeX', 'CSV/Excel', 'TIFF/PNG'],
                ['Modality', 'Text', 'Numerical', 'Visual'],
                ['Missing Data', '~5% abstracts', '~30% indicators', '<1%'],
                ['Balance', 'Skewed by category', 'Varies by country', 'Uniform (25K/class)'],
                ['Update Freq', 'Daily', 'Annually', 'Static'],
                ['Primary Use', 'NLP / Scientometrics', 'Policy / Economics', 'Document Classification'],
              ].map(([feature, arxiv, wb, rvl], i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 text-slate-300 font-medium">{feature}</td>
                  <td className="py-2.5 px-4 text-slate-400">{arxiv}</td>
                  <td className="py-2.5 px-4 text-slate-400">{wb}</td>
                  <td className="py-2.5 px-4 text-slate-400">{rvl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EDAPage;
