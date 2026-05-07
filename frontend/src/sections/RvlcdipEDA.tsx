import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { Image, Layout, Layers, FileImage, Cpu, HardDrive } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { SectionHeader } from "../components/SectionHeader";
import {
  documentTypeDistribution, datasetSplitInfo, imageResolutionDist,
  imageQualityMetrics, classificationAccuracyBaseline, rvlcdipStats,
  documentComplexity
} from "../data/rvlcdipData";

const COLORS = [
  "#f97316", "#ef4444", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6",
  "#6366f1", "#a855f7", "#d946ef", "#0ea5e9", "#84cc16", "#fb923c"
];

const SPLIT_COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];

export function RvlcdipEDA() {
  return (
    <section>
      <SectionHeader
        icon={<Image size={20} />}
        title="RVL-CDIP Dataset"
        subtitle="CMU — 400K document images for classification"
        badge="Dataset 3"
        badgeColor="bg-orange-100 text-orange-700"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Images" value="400K" subtitle="Document scans" icon={<FileImage size={18} />} color="from-orange-500 to-amber-600" />
        <StatCard title="Classes" value={rvlcdipStats.numClasses} subtitle="Document types" icon={<Layout size={18} />} color="from-red-500 to-rose-600" />
        <StatCard title="Avg Size" value={rvlcdipStats.avgImageSize} subtitle="Per image" icon={<HardDrive size={18} />} color="from-yellow-500 to-amber-600" />
        <StatCard title="Total Size" value={rvlcdipStats.totalSize} subtitle="Full dataset" icon={<Layers size={18} />} color="from-pink-500 to-rose-600" />
        <StatCard title="Format" value="TIFF" subtitle="8-bit grayscale" icon={<Image size={18} />} color="from-violet-500 to-purple-600" />
        <StatCard title="Balanced" value="Yes" subtitle="Equal per class" icon={<Cpu size={18} />} color="from-emerald-500 to-green-600" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="📂 Document Type Distribution"
          description="16 balanced classes with 25,000 images each"
        >
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={documentTypeDistribution}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={130}
                innerRadius={60}
                paddingAngle={2}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`}
                labelLine={{ strokeWidth: 1 }}
                fontSize={10}
              >
                {documentTypeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="📏 Image Resolution Distribution"
          description="Width distribution of document images (pixels)"
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={imageResolutionDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="resolution" tick={{ fontSize: 10 }} stroke="#94a3b8" angle={-25} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ChartCard
          title="📊 Train/Val/Test Split"
          description="Dataset partition ratio"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={datasetSplitInfo}
                dataKey="count"
                nameKey="split"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                fontSize={12}
              >
                {datasetSplitInfo.map((_, index) => (
                  <Cell key={`split-${index}`} fill={SPLIT_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="🔍 Image Quality Metrics"
          description="Percentage of images with each characteristic"
        >
          <div className="space-y-3 mt-2">
            {imageQualityMetrics.map((m) => (
              <div key={m.metric}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-700">{m.metric}</span>
                  <span className="text-sm font-semibold text-slate-800">{m.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="🤖 Classification Baselines"
          description="Accuracy of different models on RVL-CDIP"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classificationAccuracyBaseline} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[85, 96]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="model" tick={{ fontSize: 10 }} stroke="#94a3b8" width={85} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="accuracy" name="Accuracy %" fill="#fb923c" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Document Complexity Radar */}
      <ChartCard
        title="🧩 Document Complexity Analysis"
        description="Text density, layout complexity, and visual elements across document types"
        className="mb-6"
      >
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={documentComplexity}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
            <Legend />
            <Radar name="Text Density" dataKey="textDensity" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
            <Radar name="Layout Complexity" dataKey="layoutComplexity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
            <Radar name="Visual Elements" dataKey="visualElements" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Data Quality */}
      <ChartCard title="⚠️ Data Quality Summary" description="Key observations from RVL-CDIP dataset EDA" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Class Balance", value: "Perfect", status: "good", note: "25K images per class, 16 classes" },
            { label: "Noise/Artifacts", value: "18.7%", status: "warn", note: "Scanned document degradation" },
            { label: "Skew/Rotation", value: "12.4%", status: "warn", note: "Misaligned scans present" },
            { label: "Grayscale Only", value: "100%", status: "info", note: "No color information available" },
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
