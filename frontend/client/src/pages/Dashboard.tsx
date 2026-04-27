import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { Brain, Zap, Clock, Layers, Filter } from "lucide-react";

const trainingData = [
  { epoch: 0, accuracy: 45, valAccuracy: 42 },
  { epoch: 5, accuracy: 58, valAccuracy: 52 },
  { epoch: 10, accuracy: 68, valAccuracy: 61 },
  { epoch: 15, accuracy: 75, valAccuracy: 68 },
  { epoch: 20, accuracy: 82, valAccuracy: 74 },
  { epoch: 25, accuracy: 88, valAccuracy: 79 },
  { epoch: 30, accuracy: 91, valAccuracy: 84 },
  { epoch: 35, accuracy: 94, valAccuracy: 88 },
  { epoch: 40, accuracy: 96, valAccuracy: 91 },
  { epoch: 45, accuracy: 97, valAccuracy: 93 },
  { epoch: 50, accuracy: 98, valAccuracy: 94 },
];

const modelComparison = [
  { name: "BERT-Base", accuracy: 87.2, color: "#6366f1" },
  { name: "ViT-B/16", accuracy: 84.5, color: "#a855f7" },
  { name: "ResNet-50+BERT", accuracy: 89.1, color: "#22d3ee" },
  { name: "TabNet", accuracy: 82.8, color: "#10b981" },
  { name: "Full Fusion", accuracy: 92.4, color: "#f97316" },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Model Performance</h1>
          <p className="text-muted-foreground">Training metrics, model comparison, and ablation studies</p>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border/40 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <Filter className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Metric Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { title: "Best Accuracy", value: "92.4%", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Best F1", value: "91.8%", icon: Filter, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Training Time", value: "6.2h", icon: Clock, color: "text-pink-500", bg: "bg-pink-500/10" },
          { title: "Parameters", value: "243M", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Models", value: "5", icon: Brain, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((item, i) => (
          <Card key={i} className="border-border/40 bg-card/50 shadow-sm overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-3 ${item.bg} rounded-bl-3xl`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <CardHeader className="p-6 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-widest">{item.title}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Stats */}
      <Card className="border-border/40 bg-card/50 shadow-sm">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <CardTitle className="text-lg">Best Model: Full Fusion (Multi-Modal)</CardTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
            {[
              { label: "Accuracy", value: "92.4%", color: "bg-orange-500" },
              { label: "F1 Score", value: "91.8%", color: "bg-purple-500" },
              { label: "Precision", value: "93.1%", color: "bg-blue-500" },
              { label: "Recall", value: "90.5%", color: "bg-pink-500" },
            ].map((stat, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{stat.label}</span>
                  <span className="font-bold">{stat.value}</span>
                </div>
                <div className="h-1.5 w-full bg-accent/10 rounded-full overflow-hidden">
                  <div className={`h-full ${stat.color} rounded-full`} style={{ width: stat.value }} />
                </div>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Training Summary */}
        <Card className="border-border/40 bg-card/50 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base font-bold">Quick Training Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trainingData}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(24, 24, 27)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  name="Train Acc" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAcc)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="valAccuracy" 
                  name="Val Acc" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Accuracy Comparison */}
        <Card className="border-border/40 bg-card/50 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-base font-bold">Model Accuracy Comparison</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelComparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[75, 95]}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgb(24, 24, 27)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} barSize={40}>
                  {modelComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Architecture Section */}
      <Card className="border-border/40 bg-card/50 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-500" />
            <CardTitle className="text-lg font-bold">System Workflow Architecture</CardTitle>
          </div>
          <CardDescription>Multi-modal orchestration pipeline from raw data to scientific insight</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-video w-full overflow-hidden bg-black/20">
            <img 
              src="/architecture.png" 
              alt="Scientific Intelligence Architecture" 
              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            
            {/* Visual Markers */}
            <div className="absolute top-1/2 left-[15%] -translate-y-1/2 group cursor-help">
              <div className="h-4 w-4 rounded-full bg-blue-500 animate-ping absolute" />
              <div className="h-4 w-4 rounded-full bg-blue-500 relative z-10" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 rounded-lg bg-popover border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none">
                <p className="text-xs font-bold text-primary mb-1">User Ingestion</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Multimodal data entry (PDF, Image, Bio-Signals)</p>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-help">
              <div className="h-4 w-4 rounded-full bg-purple-500 animate-ping absolute" />
              <div className="h-4 w-4 rounded-full bg-purple-500 relative z-10" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 rounded-lg bg-popover border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none">
                <p className="text-xs font-bold text-primary mb-1">Intelligence Hub</p>
                <p className="text-[10px] text-muted-foreground leading-tight">SciBERT & ResNet Fusion with Gated Attention</p>
              </div>
            </div>

            <div className="absolute top-1/2 right-[15%] -translate-y-1/2 group cursor-help">
              <div className="h-4 w-4 rounded-full bg-orange-500 animate-ping absolute" />
              <div className="h-4 w-4 rounded-full bg-orange-500 relative z-10" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 rounded-lg bg-popover border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none">
                <p className="text-xs font-bold text-primary mb-1">Synthesis Engine</p>
                <p className="text-[10px] text-muted-foreground leading-tight">FLAN-T5 Hypothesis Generation & Reporting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
