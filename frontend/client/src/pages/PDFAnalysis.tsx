import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Sparkles, Upload, CheckCircle2, AlertCircle, Loader2, ArrowRight, X, FileMinus } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function PDFAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError("Please upload a PDF file.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a PDF to analyze.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("abstract", "Analysis of scientific publication / technical document");
      formData.append("domain", "cs.LG");

      const res = await axios.post(`${API_BASE}/analyze`, formData);
      setResults(res.data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.response?.data?.error || "Failed to analyze PDF. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Deep PDF Intelligence</h1>
        <p className="text-muted-foreground">Automated extraction and synthesis of knowledge from scientific publications and whitepapers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload area */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Document Ingestion</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-[400px] flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-border/60 bg-accent/5 hover:bg-accent/10 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Scientific Paper</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">Select a PDF file to extract methodology, key results, and generate hypotheses</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf" 
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="h-[400px] rounded-3xl overflow-hidden border border-border/60 bg-accent/5 flex flex-col items-center justify-center p-12 text-center relative group">
                      <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <FileText className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-1 truncate max-w-full px-4">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis</p>
                      
                      <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" onClick={clearFile} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                   </div>
                   <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-accent/10 rounded-md border border-border/40 text-muted-foreground">PDF-Parser v4</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-accent/10 rounded-md border border-border/40 text-muted-foreground">Latent Space</span>
                    </div>
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={loading}
                      className="bg-primary text-white shadow-lg shadow-primary/20 px-8"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {loading ? "Parsing PDF..." : "Run Analysis"}
                    </Button>
                  </div>
                </div>
              )}
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
              <h3 className="text-xl font-bold mb-2">Awaiting Document</h3>
              <p className="max-w-xs text-sm text-muted-foreground">Upload a scientific publication to start the deep semantic analysis pipeline.</p>
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
               <Card className="border-border/40 bg-card/50 shadow-sm relative overflow-hidden">
                <CardHeader className="p-6">
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary">Document Properties</CardDescription>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-accent/5 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Metadata Found</span>
                      <p className="text-lg font-bold">{results.metadata_found ? "Yes" : "No"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/5 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Confidence</span>
                      <p className="text-lg font-bold">{(results.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Summary */}
              <Card className="border-border/40 bg-card/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-3xl">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardHeader className="p-6">
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary">Document Executive Summary</CardDescription>
                  <CardTitle className="text-xl font-bold mt-2 leading-snug">{results.summary}</CardTitle>
                </CardHeader>
              </Card>

              {/* Hypotheses */}
              <Card className="border-border/40 bg-card/50 shadow-sm">
                <CardHeader className="p-6 border-b border-border/40">
                   <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg font-bold">Scientific Hypotheses</CardTitle>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
