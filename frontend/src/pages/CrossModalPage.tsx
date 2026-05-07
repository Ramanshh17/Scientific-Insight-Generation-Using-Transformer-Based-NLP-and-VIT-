// CrossModalPage
import type { TextAnalysisResult } from '../utils/textAnalysis';
import type { ImageAnalysisResult } from '../utils/imageAnalysis';
import type { Hypothesis, Insight } from '../utils/hypothesisEngine';
import { generateCrossModalHypotheses } from '../utils/hypothesisEngine';
import ProgressBar from '../components/ProgressBar';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Props {
  textResults: TextAnalysisResult[];
  imageResults: ImageAnalysisResult[];
  allHypotheses: Hypothesis[];
  allInsights: Insight[];
  onNavigate: (page: string) => void;
}

const CrossModalPage: React.FC<Props> = ({ textResults, imageResults, allHypotheses, allInsights, onNavigate }) => {
  const latestText = textResults[textResults.length - 1] || null;
  const latestImage = imageResults[imageResults.length - 1] || null;
  const crossHypotheses = generateCrossModalHypotheses(latestText, latestImage);

  const hasData = textResults.length > 0 || imageResults.length > 0;

  const comparisonData = latestText && latestImage ? [
    { metric: 'Complexity', text: latestText.complexity, image: latestImage.spatialComplexity },
    { metric: 'Quality', text: latestText.readabilityScore, image: latestImage.qualityScore },
    { metric: 'Richness', text: latestText.languageMetrics.vocabularyRichness * 100, image: latestImage.entropy * 20 },
    { metric: 'Detail', text: Math.min(100, latestText.entities.length * 15), image: latestImage.sharpness },
    { metric: 'Sentiment/Tone', text: (latestText.sentimentScore + 1) * 50, image: latestImage.brightness },
    { metric: 'Features', text: Math.min(100, latestText.topKeywords.length * 8), image: Math.min(100, latestImage.detectedFeatures.length * 15) },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">🔗 Cross-Modal Analysis</h2>
        <p className="text-slate-400 text-sm mt-1">Discover connections between text, image, and document analyses</p>
      </div>

      {!hasData ? (
        <div className="glass rounded-xl p-16 text-center">
          <p className="text-6xl mb-4">🔗</p>
          <h3 className="text-xl font-bold text-white mb-2">No Cross-Modal Data Yet</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Analyze at least one text and one image to enable cross-modal analysis.
            The system will identify connections between different data modalities.
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => onNavigate('text')} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm hover:bg-indigo-500/30">
              📝 Analyze Text
            </button>
            <button onClick={() => onNavigate('image')} className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30">
              🖼️ Analyze Image
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Modality Coverage */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Modality Coverage</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Text', count: textResults.length, icon: '📝', active: textResults.length > 0 },
                { name: 'Image', count: imageResults.length, icon: '🖼️', active: imageResults.length > 0 },
                { name: 'Combined', count: crossHypotheses.length, icon: '🔗', active: crossHypotheses.length > 0 },
              ].map(m => (
                <div key={m.name} className={`rounded-xl p-4 text-center transition-all ${
                  m.active ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-slate-800/30 border border-slate-700/30'
                }`}>
                  <span className="text-3xl">{m.icon}</span>
                  <p className="text-white font-medium mt-2">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.count} {m.count === 1 ? 'analysis' : 'analyses'}</p>
                  <p className={`text-xs mt-1 ${m.active ? 'text-green-400' : 'text-slate-500'}`}>
                    {m.active ? '✓ Active' : '○ Pending'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Radar */}
          {comparisonData.length > 0 && (
            <div className="glass rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Text vs Image Feature Comparison</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={comparisonData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} domain={[0, 100]} />
                    <Radar name="Text" dataKey="text" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    <Radar name="Image" dataKey="image" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-500" /><span className="text-xs text-slate-400">Text</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500" /><span className="text-xs text-slate-400">Image</span></div>
              </div>
            </div>
          )}

          {/* Cross-Modal Hypotheses */}
          {crossHypotheses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">🧪 Cross-Modal Hypotheses</h3>
              {crossHypotheses.map(h => (
                <div key={h.id} className="glass rounded-xl p-5 gradient-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/20 text-cyan-300">{h.type}</span>
                    <span className="text-xs text-indigo-400">{(h.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                  <h4 className="text-white font-medium mb-2">{h.title}</h4>
                  <p className="text-slate-400 text-sm mb-3">{h.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                      {h.evidence.map((e, i) => <p key={i} className="text-xs text-slate-300">• {e}</p>)}
                    </div>
                    <div className="bg-indigo-500/10 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1">💡 Test</p>
                      <p className="text-xs text-indigo-300">{h.testSuggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Integration Summary */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Integration Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Latest Text Analysis</h4>
                {latestText ? (
                  <div className="space-y-2">
                    <ProgressBar label="Complexity" value={latestText.complexity} color="bg-indigo-500" />
                    <ProgressBar label="Readability" value={latestText.readabilityScore} color="bg-green-500" />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Topics:</span>
                      {latestText.topics.map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{t.topic}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Sentiment:</span>
                      <span className={`text-xs ${latestText.sentimentLabel === 'Positive' ? 'text-green-400' : latestText.sentimentLabel === 'Negative' ? 'text-red-400' : 'text-slate-300'}`}>
                        {latestText.sentimentLabel}
                      </span>
                    </div>
                  </div>
                ) : <p className="text-xs text-slate-500">No text analyzed yet</p>}
              </div>

              <div>
                <h4 className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Latest Image Analysis</h4>
                {latestImage ? (
                  <div className="space-y-2">
                    <ProgressBar label="Quality" value={latestImage.qualityScore} color="bg-purple-500" />
                    <ProgressBar label="Complexity" value={latestImage.spatialComplexity} color="bg-cyan-500" />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Type:</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{latestImage.imageType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Colors:</span>
                      {latestImage.dominantColors.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: c.hex }} title={c.color} />
                      ))}
                    </div>
                  </div>
                ) : <p className="text-xs text-slate-500">No image analyzed yet</p>}
              </div>
            </div>
          </div>

          {/* Aggregated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Total Hypotheses</p>
              <p className="text-2xl font-bold text-white">{allHypotheses.length}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Total Insights</p>
              <p className="text-2xl font-bold text-indigo-400">{allInsights.length}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Cross-Modal Links</p>
              <p className="text-2xl font-bold text-purple-400">{crossHypotheses.length}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Coverage</p>
              <p className="text-2xl font-bold text-cyan-400">
                {Math.round(((textResults.length > 0 ? 1 : 0) + (imageResults.length > 0 ? 1 : 0)) / 3 * 100)}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CrossModalPage;
