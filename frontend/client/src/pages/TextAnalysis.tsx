import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Search, Sparkles, Send, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function TextAnalysis() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text || text.length < 50) {
      setError("Please enter at least 50 characters of scientific text.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("abstract", text);
      formData.append("domain", "cs.AI");

      const res = await axios.post(`${API_BASE}/analyze`, formData);
      setResults(res.data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.response?.data?.error || "Failed to analyze text. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Scientific Text Intelligence</h1>
        <p className="text-muted-foreground">Autonomous analysis of research abstracts, methodology, and scientific discourse</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input area */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Input Abstract</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea 
                placeholder="Paste your scientific abstract or research summary here (min 50 chars)..."
                className="min-h-[300px] bg-background/50 border-border/40 focus:ring-primary/20 transition-all font-medium text-sm leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-accent/10 rounded-md border border-border/40 text-muted-foreground">SciBERT v2</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-accent/10 rounded-md border border-border/40 text-muted-foreground">NLP-Transformer</span>
                </div>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={loading || text.length < 50}
                  className="bg-primary text-white shadow-lg shadow-primary/20 px-8"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Analyzing..." : "Run Analysis"}
                </Button>
              </div>
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results area */}
        <div className="space-y-6">
          {!results && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/60 bg-accent/5 opacity-60">
              <Brain className="h-16 w-16 text-muted-foreground/30 mb-6" strokeWidth={1} />
              <h3 className="text-xl font-bold mb-2">Awaiting Intelligence</h3>
              <p className="max-w-xs text-sm text-muted-foreground">Paste a scientific summary and click "Run Analysis" to generate autonomous insights.</p>
            </div>
          )}

          {loading && (
            <div className="space-y-8 animate-in fade-in duration-300">
               {[1, 2, 3].map(i => (
                  <Card key={i} className="border-border/40 bg-card/50 overflow-hidden shadow-sm">
                    <div className="h-2 w-full bg-primary/20 animate-pulse" />
                    <CardHeader className="p-6">
                      <div className="h-4 w-32 bg-accent/10 animate-pulse rounded-md mb-2" />
                      <div className="h-8 w-full bg-accent/10 animate-pulse rounded-md" />
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-2">
                      <div className="h-3 w-full bg-accent/5 animate-pulse rounded-md" />
                      <div className="h-3 w-4/5 bg-accent/5 animate-pulse rounded-md" />
                      <div className="h-3 w-5/6 bg-accent/5 animate-pulse rounded-md" />
                    </CardContent>
                  </Card>
               ))}
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Summary */}
              <Card className="border-border/40 bg-card/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-3xl">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardHeader className="p-6">
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary">Generated Summary</CardDescription>
                  <CardTitle className="text-xl font-bold mt-2 leading-snug">{results.summary}</CardTitle>
                </CardHeader>
              </Card>

              {/* Hypotheses */}
              <Card className="border-border/40 bg-card/50 shadow-sm">
                <CardHeader className="p-6 border-b border-border/40">
                   <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg font-bold">Generated Hypotheses</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {results.hypotheses.map((h: string, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/40 bg-background/50 group hover:border-purple-500/50 transition-all">
                      <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-bold border border-purple-500/20">
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{h}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Research Gaps */}
              <Card className="border-border/40 bg-card/50 shadow-sm">
                <CardHeader className="p-6 border-b border-border/40">
                   <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg font-bold">Identified Research Gaps</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {results.research_gaps.map((g: string, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/40 bg-background/50 group hover:border-amber-500/50 transition-all">
                      <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                        <ArrowRight size={12} />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{g}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
