import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area
} from "recharts";
import { FileText, TrendingUp, Users, Hash, BookOpen, Layers } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { SectionHeader } from "../components/SectionHeader";
import {
  arxivCategoryDistribution, arxivYearlyGrowth, arxivAbstractLengthDist,
  arxivMultiModalStats, arxivAuthorCollaboration, arxivTopKeywords
} from "@/data/arxivData";

export function ArxivEDA() {
  return (
    <section>
      <SectionHeader
        icon={<FileText size={20} />}
        title="arXiv Dataset"
        subtitle="Cornell University — 2.2M+ research papers metadata"
        badge="Dataset 1"
        badgeColor="bg-violet-100 text-violet-700"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Papers"
          value="2.2M+"
          subtitle="All categories"
          icon={<FileText size={18} />}
          color="from-violet-500 to-purple-600"
        />
        <StatCard
          title="With Images"
          value="892K"
          subtitle="40.5% of papers"
          icon={<Layers size={18} />}
          color="from-pink-500 to-rose-600"
        />
        <StatCard
          title="With Code"
          value="456K"
          subtitle="20.7% of papers"
          icon={<Hash size={18} />}
          color="from-amber-500 to-orange-600"
        />
        <StatCard
          title="Avg Authors"
          value={arxivMultiModalStats.avgAuthors}
          subtitle="Per paper"
          icon={<Users size={18} />}
          color="from-emerald-500 to-green-600"
        />
        <StatCard
          title="Avg References"
          value={arxivMultiModalStats.avgReferences}
          subtitle="Per paper"
          icon={<BookOpen size={18} />}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Multi-Category"
          value="678K"
          subtitle="30.8% cross-domain"
          icon={<TrendingUp size={18} />}
          color="from-indigo-500 to-blue-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="📈 Papers Published Per Year"
          description="Exponential growth in AI/ML papers vs. total submissions"
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={arxivYearlyGrowth}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                formatter={(value: unknown) => [Number(value).toLocaleString(), ""]}
              />
              <Legend />
              <Area type="monotone" dataKey="papers" name="Total Papers" stroke="#8b5cf6" fill="url(#colorTotal)" strokeWidth={2} />
              <Area type="monotone" dataKey="aiPapers" name="AI/ML Papers" stroke="#ec4899" fill="url(#colorAI)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="📊 Category Distribution (Top 12)"
          description="Paper count across primary arXiv categories"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={arxivCategoryDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                formatter={(value: unknown) => [Number(value).toLocaleString(), "Papers"]}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ChartCard
          title="📝 Abstract Length Distribution"
          description="Word count distribution of paper abstracts"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={arxivAbstractLengthDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#94a3b8" angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="👥 Author Collaboration"
          description="Distribution of number of co-authors"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={arxivAuthorCollaboration}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="authors" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="count" fill="#c084fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="🔑 Top Keywords Frequency"
          description="Most frequent keywords in abstracts"
        >
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-2">
            {arxivTopKeywords.map((kw, i) => (
              <div key={kw.word} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-5 text-right font-mono">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{kw.word}</span>
                    <span className="text-xs text-slate-400">{(kw.freq / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                      style={{ width: `${(kw.freq / arxivTopKeywords[0].freq) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Data Quality */}
      <ChartCard title="⚠️ Data Quality Summary" description="Key observations from arXiv dataset EDA" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Missing Abstracts", value: "0.02%", status: "good", note: "Nearly complete coverage" },
            { label: "Multi-Modal Content", value: "40.5%", status: "warn", note: "Papers with embedded images" },
            { label: "Cross-Category Papers", value: "30.8%", status: "info", note: "Interdisciplinary research" },
            { label: "Avg Words/Abstract", value: "218", status: "good", note: "Sufficient for NLP analysis" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 border ${
              item.status === "good" ? "bg-emerald-50 border-emerald-200" :
              item.status === "warn" ? "bg-amber-50 border-amber-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{item.value}</p>
              <p className="text-xs text-slate-500 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </section>
  );
}
