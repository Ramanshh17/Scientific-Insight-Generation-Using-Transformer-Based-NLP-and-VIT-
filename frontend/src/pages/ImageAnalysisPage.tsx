import { useState, useRef, useCallback } from 'react';
import { analyzeImage, type ImageAnalysisResult } from '../utils/imageAnalysis';
import { generateImageHypotheses, generateImageInsights, type Hypothesis, type Insight } from '../utils/hypothesisEngine';
import ProgressBar from '../components/ProgressBar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];
void COLORS;

interface Props {
  onAnalysisComplete: (result: ImageAnalysisResult, hypotheses: Hypothesis[], insights: Insight[]) => void;
}

const ImageAnalysisPage: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'colors'|'features'|'hypotheses'|'insights'>('overview');
  const [dragActive, setDragActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsAnalyzing(true);
    setPreview(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        setTimeout(() => {
          const analysisResult = analyzeImage(file, imageData, canvas);
          const hyps = generateImageHypotheses(analysisResult);
          const ins = generateImageInsights(analysisResult);
          setResult(analysisResult);
          setHypotheses(hyps);
          setInsights(ins);
          setIsAnalyzing(false);
          onAnalysisComplete(analysisResult, hyps, ins);
        }, 600);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) processImage(e.dataTransfer.files[0]);
  }, [processImage]);

  return (
    <div className="space-y-6 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />

      <div>
        <h2 className="text-2xl font-bold text-white">🖼️ Image Analysis</h2>
        <p className="text-slate-400 text-sm mt-1">Analyze scientific images, figures, charts, and documents for features, quality, and insights</p>
      </div>

      {/* Upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'hover:bg-slate-800/30'
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-300">Analyzing image...</p>
          </div>
        ) : (
          <>
            <p className="text-4xl mb-3">📸</p>
            <p className="text-slate-300 mb-1">Drop an image here or click to upload</p>
            <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, GIF</p>
          </>
        )}
      </div>

      {result && preview && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
            {(['overview','colors','features','hypotheses','insights'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm rounded-md transition-all ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-slate-400 hover:text-white'}`}>
                {tab === 'overview' ? '📊 Overview' : tab === 'colors' ? '🎨 Colors' : tab === 'features' ? '🔍 Features' : tab === 'hypotheses' ? '🧪 Hypotheses' : '💡 Insights'}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass rounded-xl p-3 flex items-center justify-center">
                  <img src={preview} alt="Uploaded" className="max-h-60 rounded-lg object-contain" />
                </div>
                <div className="glass rounded-xl p-5 md:col-span-2">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Image Properties</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(result.metadata).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-slate-500 uppercase">{k}</p>
                        <p className="text-sm text-white font-medium">{v}</p>
                      </div>
                    ))}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Image Type</p>
                      <p className="text-sm text-indigo-400 font-medium">{result.imageType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Quality</p>
                      <p className={`text-sm font-medium ${result.qualityScore > 70 ? 'text-green-400' : result.qualityScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {result.qualityLabel} ({result.qualityScore}/100)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Brightness', value: result.brightness, sub: result.brightnessLabel, color: 'bg-yellow-500' },
                  { label: 'Contrast', value: result.contrast, sub: result.contrastLabel, color: 'bg-blue-500' },
                  { label: 'Saturation', value: result.saturation, sub: result.saturationLabel, color: 'bg-pink-500' },
                  { label: 'Sharpness', value: result.sharpness, sub: result.sharpnessLabel, color: 'bg-green-500' },
                ].map((m, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-2">{m.label}</p>
                    <ProgressBar value={m.value} color={m.color} showValue={false} />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-500">{m.sub}</span>
                      <span className="text-xs text-white font-medium">{m.value}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Edge Intensity', value: result.edgeIntensity },
                  { label: 'Entropy', value: result.entropy },
                  { label: 'Noise Level', value: result.noiseLevel },
                  { label: 'Complexity', value: result.spatialComplexity },
                ].map((m, i) => (
                  <div key={i} className="glass rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{m.value}{typeof m.value === 'number' && m.label !== 'Entropy' ? '%' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Dominant Colors</h4>
                <div className="flex gap-3 flex-wrap">
                  {result.dominantColors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 bg-slate-800/50 rounded-lg p-3">
                      <div className="w-16 h-16 rounded-lg border border-slate-600" style={{ backgroundColor: c.hex }} />
                      <span className="text-xs text-white font-medium">{c.color}</span>
                      <span className="text-[10px] text-slate-400">{c.hex}</span>
                      <span className="text-[10px] text-indigo-400">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Color Distribution</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.dominantColors.map(c => ({ name: c.color, value: c.percentage }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                          {result.dominantColors.map((c, i) => <Cell key={i} fill={c.hex} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">RGB Histogram</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.colorHistogram}>
                        <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                        <Bar dataKey="r" fill="#ef4444" opacity={0.7} />
                        <Bar dataKey="g" fill="#22c55e" opacity={0.7} />
                        <Bar dataKey="b" fill="#3b82f6" opacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-4 animate-fade-in">
              {result.detectedFeatures.length === 0 ? (
                <div className="glass rounded-xl p-10 text-center">
                  <p className="text-slate-400">No distinct features detected.</p>
                </div>
              ) : result.detectedFeatures.map((f, i) => (
                <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{f.feature}</h4>
                    <p className="text-slate-400 text-xs">{f.description}</p>
                  </div>
                  <div className="w-24">
                    <ProgressBar value={f.confidence * 100} showValue={false} size="sm" color="bg-indigo-500" />
                    <span className="text-[10px] text-slate-500">{(f.confidence * 100).toFixed(0)}% conf</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hypotheses Tab */}
          {activeTab === 'hypotheses' && (
            <div className="space-y-4 animate-fade-in">
              {hypotheses.map(h => (
                <div key={h.id} className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      h.type === 'correlation' ? 'bg-blue-500/20 text-blue-300' :
                      h.type === 'causal' ? 'bg-orange-500/20 text-orange-300' :
                      h.type === 'predictive' ? 'bg-green-500/20 text-green-300' :
                      'bg-purple-500/20 text-purple-300'}`}>{h.type}</span>
                    <span className="text-xs text-indigo-400">{(h.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                  <h4 className="text-white font-medium mb-2">{h.title}</h4>
                  <p className="text-slate-400 text-sm mb-3">{h.description}</p>
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                    {h.evidence.map((e, i) => <p key={i} className="text-xs text-slate-300">• {e}</p>)}
                  </div>
                  <div className="bg-indigo-500/10 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1">💡 Test Suggestion</p>
                    <p className="text-xs text-indigo-300">{h.testSuggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4 animate-fade-in">
              {insights.map(ins => (
                <div key={ins.id} className={`glass rounded-xl p-5 border-l-4 ${
                  ins.importance === 'high' ? 'border-l-red-500' : ins.importance === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ins.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium">{ins.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ins.category === 'pattern' ? 'bg-blue-500/20 text-blue-300' :
                          ins.category === 'anomaly' ? 'bg-red-500/20 text-red-300' :
                          ins.category === 'recommendation' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-yellow-500/20 text-yellow-300'}`}>{ins.category}</span>
                      </div>
                      <p className="text-slate-400 text-sm">{ins.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageAnalysisPage;
