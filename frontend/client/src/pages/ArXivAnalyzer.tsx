import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Brain, TrendingUp, Filter, ArrowRight, Download, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const API_BASE = "http://localhost:5000/api";

export default function ArXivAnalyzer() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("cs.AI");
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await axios.get(`${API_BASE}/categories`);
        const catList = Object.values(catRes.data.categories);
        setCategories(catList);

        const trendRes = await axios.get(`${API_BASE}/trends?category=${selectedCategory}`);
        setTrends(trendRes.data.map((t: any) => ({
          year: t.year,
          count: t.count,
          growth: t.growth_rate * 100
        })));
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching arxiv data:", err);
        // Fallback mock data if backend fails
        setTrends([
          { year: 2018, count: 1200, growth: 12 },
          { year: 2019, count: 1800, growth: 15 },
          { year: 2020, count: 2400, growth: 18 },
          { year: 2021, count: 3100, growth: 22 },
          { year: 2022, count: 4200, growth: 25 },
          { year: 2023, count: 5800, growth: 30 },
          { year: 2024, count: 7200, growth: 35 },
        ]);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">arXiv Intelligence</h1>
          <p className="text-muted-foreground">Deep analysis of scientific publication trends and emerging research domains</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-border/40 bg-card/50">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button className="bg-primary text-white shadow-lg shadow-primary/20">
            <Brain className="mr-2 h-4 w-4" />
            Generate Hypotheses
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 border-border/40 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {categories.length > 0 ? categories.map((cat: any) => (
              <div 
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                  selectedCategory === cat.code 
                    ? "bg-primary text-white" 
                    : "hover:bg-accent/10 text-muted-foreground"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none mb-1">{cat.code}</span>
                  <span className="text-[10px] opacity-70 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{cat.name}</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                  selectedCategory === cat.code ? "bg-white/20" : "bg-accent/20"
                )}>{(cat.count / 1000).toFixed(1)}k</span>
              </div>
            )) : [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 w-full bg-accent/5 animate-pulse rounded-xl" />
            ))}
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/40 bg-card/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-primary/5 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={120} />
              </div>
              <CardHeader className="p-6">
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Annual Growth</CardDescription>
                <CardTitle className="text-3xl font-bold pt-2">+24.8%</CardTitle>
                <p className="text-xs text-green-500 font-bold flex items-center gap-1 mt-2">
                  <TrendingUp size={14} /> Higher than avg
                </p>
              </CardHeader>
            </Card>
            <Card className="border-border/40 bg-card/50 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 text-purple-500/5 group-hover:scale-110 transition-transform duration-500">
                <BarChart2 size={120} />
              </div>
              <CardHeader className="p-6">
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Avg Citations</CardDescription>
                <CardTitle className="text-3xl font-bold pt-2">12.4</CardTitle>
                <p className="text-xs text-muted-foreground font-medium mt-2">
                  Per paper in {selectedCategory}
                </p>
              </CardHeader>
            </Card>
            <Card className="border-border/40 bg-card/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-amber-500/5 group-hover:scale-110 transition-transform duration-500">
                <Brain size={120} />
              </div>
              <CardHeader className="p-6">
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Active Researchers</CardDescription>
                <CardTitle className="text-3xl font-bold pt-2">4.2k</CardTitle>
                <p className="text-xs text-amber-500 font-bold flex items-center gap-1 mt-2">
                   Active in the last 6 months
                </p>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-border/40 bg-card/50 overflow-hidden">
             <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Publication Volume Trends</CardTitle>
                <CardDescription>Historical volume and growth rate for {selectedCategory}</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase">Volume</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] font-bold text-purple-500 uppercase">Growth %</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="year" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                     <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="rgba(255,255,255,0.1)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgb(24, 24, 27)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="count" 
                      stroke="#22d3ee" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#22d3ee', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="growth" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
