import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { Globe, DollarSign, Microscope, BookOpen, Database, BarChart3 } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { SectionHeader } from "../components/SectionHeader";
import {
  rdExpenditureByCountry, globalIndicatorsTrend, regionDistribution,
  worldBankStats, scienceOutputByIncome
} from "../data/worldBankData";

export function WorldBankEDA() {
  return (
    <section>
      <SectionHeader
        icon={<Globe size={20} />}
        title="World Bank DataBank"
        subtitle="Global R&D indicators, economic & scientific metrics"
        badge="Dataset 2"
        badgeColor="bg-emerald-100 text-emerald-700"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard title="Countries" value={worldBankStats.totalCountries} subtitle="Worldwide coverage" icon={<Globe size={18} />} color="from-emerald-500 to-green-600" />
        <StatCard title="With R&D Data" value={worldBankStats.countriesWithRD} subtitle="68.2% coverage" icon={<Microscope size={18} />} color="from-teal-500 to-emerald-600" />
        <StatCard title="Years of Data" value={worldBankStats.yearsOfData} subtitle="1960 - 2023" icon={<BarChart3 size={18} />} color="from-cyan-500 to-teal-600" />
        <StatCard title="Indicators" value="1,443" subtitle="Across domains" icon={<Database size={18} />} color="from-blue-500 to-cyan-600" />
        <StatCard title="Global R&D %" value={`${worldBankStats.avgGlobalRD}%`} subtitle="Avg GDP share" icon={<DollarSign size={18} />} color="from-amber-500 to-orange-600" />
        <StatCard title="Missing Data" value={`${worldBankStats.missingDataPercent}%`} subtitle="Sparsity challenge" icon={<BookOpen size={18} />} color="from-red-500 to-rose-600" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="🌍 R&D Expenditure (% of GDP) by Country"
          description="Top countries by research & development investment"
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={rdExpenditureByCountry} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="expenditure" name="R&D % of GDP" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="📈 Global Science & Innovation Trends"
          description="Key indicators over time (indexed values)"
        >
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={globalIndicatorsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Legend />
              <Line type="monotone" dataKey="sciPublications" name="Publications (K)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="patents" name="Patents (K)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="researchers" name="Researchers (K)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="🌐 Regional Comparison"
          description="R&D investment, papers %, and researcher % by world region"
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={regionDistribution}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="region" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Legend />
              <Radar name="Papers %" dataKey="papers" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Radar name="Researchers %" dataKey="researchers" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="💰 Science Output by Income Group"
          description="Percentage share of global output by World Bank income classification"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scienceOutputByIncome}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="group" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Legend />
              <Bar dataKey="publications" name="Publications %" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="patents" name="Patents %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rdSpending" name="R&D Spending %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Data Quality */}
      <ChartCard title="⚠️ Data Quality Summary" description="Key observations from World Bank dataset EDA" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Missing Values", value: "34.2%", status: "warn", note: "Significant sparsity in R&D indicators" },
            { label: "Temporal Coverage", value: "63 Years", status: "good", note: "1960-2023, extensive time series" },
            { label: "Format Variety", value: "4 Formats", status: "info", note: "CSV, Excel, JSON, XML available" },
            { label: "Country Coverage", value: "68.2%", status: "warn", note: "148/217 countries have R&D data" },
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
