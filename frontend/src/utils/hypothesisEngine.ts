import type { TextAnalysisResult } from './textAnalysis';
import type { ImageAnalysisResult } from './imageAnalysis';

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  type: 'correlation' | 'causal' | 'descriptive' | 'predictive';
  evidence: string[];
  testSuggestion: string;
  domain: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'pattern' | 'anomaly' | 'trend' | 'recommendation' | 'warning';
  importance: 'high' | 'medium' | 'low';
  icon: string;
}

export function generateTextHypotheses(result: TextAnalysisResult): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  let id = 0;

  if (result.topics.length > 1) {
    hypotheses.push({
      id: `th-${id++}`,
      title: `Cross-domain relationship between ${result.topics[0]?.topic} and ${result.topics[1]?.topic}`,
      description: `The text discusses both ${result.topics[0]?.topic} and ${result.topics[1]?.topic}, suggesting a potential interdisciplinary connection that may yield novel insights when studied jointly.`,
      confidence: Math.min(0.9, (result.topics[0]?.confidence || 0) * (result.topics[1]?.confidence || 0) + 0.3),
      type: 'correlation',
      evidence: [
        `${result.topics[0]?.topic} mentioned with ${(result.topics[0]?.confidence || 0 * 100).toFixed(0)}% confidence`,
        `${result.topics[1]?.topic} mentioned with ${(result.topics[1]?.confidence || 0 * 100).toFixed(0)}% confidence`,
        `${result.entities.length} scientific entities detected`
      ],
      testSuggestion: `Conduct a systematic literature review on papers that bridge ${result.topics[0]?.topic} and ${result.topics[1]?.topic} to validate this cross-domain connection.`,
      domain: result.topics[0]?.topic || 'General'
    });
  }

  if (result.complexity > 60) {
    hypotheses.push({
      id: `th-${id++}`,
      title: 'Text complexity correlates with research depth',
      description: `The high complexity score (${result.complexity}/100) suggests this text contains specialized vocabulary and complex sentence structures typical of advanced research papers.`,
      confidence: 0.75,
      type: 'descriptive',
      evidence: [
        `Complexity score: ${result.complexity}/100`,
        `Average word length: ${result.languageMetrics.avgWordLength} characters`,
        `Vocabulary richness: ${(result.languageMetrics.vocabularyRichness * 100).toFixed(1)}%`,
        `Readability: ${result.readabilityLevel}`
      ],
      testSuggestion: 'Compare complexity scores across different journal tiers to validate correlation between text complexity and research depth.',
      domain: 'Research Methodology'
    });
  }

  if (result.sentimentLabel !== 'Neutral') {
    hypotheses.push({
      id: `th-${id++}`,
      title: `${result.sentimentLabel} sentiment may indicate ${result.sentimentLabel === 'Positive' ? 'promising results' : 'identified challenges'}`,
      description: `The ${result.sentimentLabel.toLowerCase()} sentiment (score: ${result.sentimentScore}) in this text suggests the research ${result.sentimentLabel === 'Positive' ? 'presents favorable findings or breakthroughs' : 'identifies significant problems or limitations'}.`,
      confidence: 0.65,
      type: 'descriptive',
      evidence: [
        `Sentiment score: ${result.sentimentScore}`,
        `Label: ${result.sentimentLabel}`,
        `Word count analyzed: ${result.wordCount}`
      ],
      testSuggestion: 'Analyze sentiment across a corpus of papers in the same domain and correlate with citation counts to validate whether sentiment predicts impact.',
      domain: 'Scientometrics'
    });
  }

  if (result.topKeywords.length >= 5) {
    const topWords = result.topKeywords.slice(0, 5).map(k => k.word);
    hypotheses.push({
      id: `th-${id++}`,
      title: `Key terminology cluster suggests focused research area`,
      description: `The concentration of terms [${topWords.join(', ')}] indicates a tightly focused research area. This keyword cluster may represent an emerging or established research front.`,
      confidence: 0.7,
      type: 'predictive',
      evidence: topWords.map(w => {
        const kw = result.topKeywords.find(k => k.word === w);
        return `"${w}" appears ${kw?.count} times (relevance: ${(kw?.relevance || 0 * 100).toFixed(0)}%)`;
      }),
      testSuggestion: 'Use co-occurrence analysis on the arXiv dataset to map this keyword cluster against emerging research trends.',
      domain: result.topics[0]?.topic || 'General'
    });
  }

  if (result.avgWordsPerSentence > 25) {
    hypotheses.push({
      id: `th-${id++}`,
      title: 'Long sentence structures may reduce accessibility',
      description: `With an average of ${result.avgWordsPerSentence} words per sentence, this text may be less accessible to interdisciplinary researchers, potentially limiting its cross-domain impact.`,
      confidence: 0.6,
      type: 'causal',
      evidence: [
        `Average words per sentence: ${result.avgWordsPerSentence}`,
        `Readability score: ${result.readabilityScore} (${result.readabilityLevel})`,
      ],
      testSuggestion: 'Correlate readability metrics with citation counts across disciplines to test whether simpler writing increases cross-domain citations.',
      domain: 'Science Communication'
    });
  }

  if (result.entities.length > 3) {
    const domains = [...new Set(result.entities.map(e => e.type))];
    if (domains.length > 1) {
      hypotheses.push({
        id: `th-${id++}`,
        title: `Multi-domain entity coverage suggests integrative research`,
        description: `Entities from ${domains.length} different domains (${domains.join(', ')}) were detected, suggesting this text takes an integrative, multi-modal approach to its subject matter.`,
        confidence: 0.72,
        type: 'descriptive',
        evidence: domains.map(d => `${d}: ${result.entities.filter(e => e.type === d).length} entities`),
        testSuggestion: 'Map entity co-occurrence networks to identify which domain combinations produce the most impactful research.',
        domain: 'Interdisciplinary Research'
      });
    }
  }

  return hypotheses;
}

export function generateImageHypotheses(result: ImageAnalysisResult): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  let id = 0;

  hypotheses.push({
    id: `ih-${id++}`,
    title: `Image classified as "${result.imageType}" — suitable for ${getAnalysisType(result.imageType)}`,
    description: `Based on color, contrast, and complexity analysis, this image is classified as "${result.imageType}". This classification suggests specific analysis pipelines would be most effective.`,
    confidence: 0.8,
    type: 'descriptive',
    evidence: [
      `Quality: ${result.qualityLabel} (${result.qualityScore}/100)`,
      `Brightness: ${result.brightnessLabel} (${result.brightness}%)`,
      `Contrast: ${result.contrastLabel} (${result.contrast}%)`,
      `Spatial complexity: ${result.spatialComplexity}/100`
    ],
    testSuggestion: `Apply ${getAnalysisType(result.imageType)} algorithms to validate the classification and extract structured data.`,
    domain: 'Computer Vision'
  });

  if (result.spatialComplexity > 50) {
    hypotheses.push({
      id: `ih-${id++}`,
      title: 'High spatial complexity indicates rich information content',
      description: `The image's spatial complexity (${result.spatialComplexity}/100) and entropy (${result.entropy}) suggest it contains dense information that may require multi-scale analysis.`,
      confidence: 0.7,
      type: 'descriptive',
      evidence: [
        `Spatial complexity: ${result.spatialComplexity}/100`,
        `Entropy: ${result.entropy}`,
        `Edge intensity: ${result.edgeIntensity}%`,
        `${result.detectedFeatures.length} features detected`
      ],
      testSuggestion: 'Apply multi-resolution analysis (wavelet decomposition) to extract information at different scales.',
      domain: 'Image Analysis'
    });
  }

  if (result.dominantColors.length > 3 && result.saturation > 30) {
    hypotheses.push({
      id: `ih-${id++}`,
      title: 'Color distribution may encode categorical data',
      description: `The presence of ${result.dominantColors.length} distinct color clusters with ${result.saturationLabel.toLowerCase()} saturation suggests colors may represent different categories or data dimensions.`,
      confidence: 0.65,
      type: 'correlation',
      evidence: result.dominantColors.slice(0, 4).map(c => `${c.color} (${c.hex}): ${c.percentage}%`),
      testSuggestion: 'Apply color segmentation to isolate regions and test whether color boundaries correspond to meaningful data boundaries.',
      domain: 'Data Visualization'
    });
  }

  if (result.qualityScore < 50) {
    hypotheses.push({
      id: `ih-${id++}`,
      title: 'Image quality may limit analysis accuracy',
      description: `The quality score of ${result.qualityScore}/100 with noise level ${result.noiseLevel}% may introduce errors in automated analysis. Pre-processing steps are recommended.`,
      confidence: 0.8,
      type: 'causal',
      evidence: [
        `Quality: ${result.qualityScore}/100`,
        `Noise: ${result.noiseLevel}%`,
        `Sharpness: ${result.sharpness}/100`
      ],
      testSuggestion: 'Apply denoising and enhancement algorithms, then compare analysis results before and after to quantify quality impact.',
      domain: 'Image Processing'
    });
  }

  return hypotheses;
}

export function generateTextInsights(result: TextAnalysisResult): Insight[] {
  const insights: Insight[] = [];
  let id = 0;

  insights.push({
    id: `ti-${id++}`,
    title: 'Document Structure Analysis',
    description: `This text contains ${result.paragraphCount} paragraph(s), ${result.sentenceCount} sentences, and ${result.wordCount} words. The structure suggests a ${result.paragraphCount > 5 ? 'comprehensive' : result.paragraphCount > 2 ? 'moderate' : 'brief'} document.`,
    category: 'pattern',
    importance: 'medium',
    icon: '📄'
  });

  if (result.readabilityScore < 40) {
    insights.push({
      id: `ti-${id++}`,
      title: 'Complex Language Detected',
      description: `Readability score of ${result.readabilityScore} (${result.readabilityLevel}) indicates highly technical or academic writing. Consider simplifying for broader audience reach.`,
      category: 'warning',
      importance: 'high',
      icon: '⚠️'
    });
  }

  if (result.languageMetrics.vocabularyRichness > 0.7) {
    insights.push({
      id: `ti-${id++}`,
      title: 'High Vocabulary Diversity',
      description: `Vocabulary richness of ${(result.languageMetrics.vocabularyRichness * 100).toFixed(1)}% indicates diverse word usage. This is typical of well-written academic text with broad coverage.`,
      category: 'pattern',
      importance: 'medium',
      icon: '📊'
    });
  }

  if (result.topKeywords.length > 0) {
    const topWord = result.topKeywords[0];
    insights.push({
      id: `ti-${id++}`,
      title: `Primary Focus: "${topWord.word}"`,
      description: `The most frequent meaningful term "${topWord.word}" appears ${topWord.count} times, indicating it's the central concept of this text.`,
      category: 'pattern',
      importance: 'high',
      icon: '🎯'
    });
  }

  if (result.entities.length > 0) {
    const domains = [...new Set(result.entities.map(e => e.type))];
    insights.push({
      id: `ti-${id++}`,
      title: `${result.entities.length} Scientific Entities Detected`,
      description: `Found entities across ${domains.length} domain(s): ${domains.join(', ')}. These can be used for knowledge graph construction and cross-referencing.`,
      category: 'pattern',
      importance: 'high',
      icon: '🔬'
    });
  }

  if (result.sentimentLabel === 'Positive') {
    insights.push({
      id: `ti-${id++}`,
      title: 'Positive Research Tone',
      description: `The text exhibits positive sentiment (${result.sentimentScore}), suggesting the content reports favorable findings or breakthroughs.`,
      category: 'trend',
      importance: 'medium',
      icon: '📈'
    });
  } else if (result.sentimentLabel === 'Negative') {
    insights.push({
      id: `ti-${id++}`,
      title: 'Critical Research Tone',
      description: `The text shows negative sentiment (${result.sentimentScore}), indicating discussion of problems, limitations, or challenges.`,
      category: 'anomaly',
      importance: 'medium',
      icon: '📉'
    });
  }

  insights.push({
    id: `ti-${id++}`,
    title: 'Multi-Modal Integration Recommendation',
    description: `This text analysis should be combined with related images and datasets for comprehensive understanding. ${result.topics.length > 0 ? `Primary topic "${result.topics[0].topic}" can be cross-referenced with World Bank indicators and arXiv papers.` : ''}`,
    category: 'recommendation',
    importance: 'high',
    icon: '💡'
  });

  return insights;
}

export function generateImageInsights(result: ImageAnalysisResult): Insight[] {
  const insights: Insight[] = [];
  let id = 0;

  insights.push({
    id: `ii-${id++}`,
    title: `Classified as: ${result.imageType}`,
    description: `Based on color distribution, contrast, and complexity metrics, this image is most likely a ${result.imageType.toLowerCase()}. Quality: ${result.qualityLabel}.`,
    category: 'pattern',
    importance: 'high',
    icon: '🏷️'
  });

  if (result.qualityScore > 70) {
    insights.push({
      id: `ii-${id++}`,
      title: 'High Quality Image',
      description: `Quality score of ${result.qualityScore}/100 with sharp details (${result.sharpness}%) and low noise (${result.noiseLevel}%). Suitable for detailed automated analysis.`,
      category: 'pattern',
      importance: 'medium',
      icon: '✅'
    });
  } else if (result.qualityScore < 40) {
    insights.push({
      id: `ii-${id++}`,
      title: 'Quality Enhancement Recommended',
      description: `Quality score of ${result.qualityScore}/100 suggests pre-processing (denoising, contrast enhancement) before analysis.`,
      category: 'warning',
      importance: 'high',
      icon: '⚠️'
    });
  }

  insights.push({
    id: `ii-${id++}`,
    title: `${result.dominantColors.length} Dominant Color Regions`,
    description: `Primary: ${result.dominantColors[0]?.color || 'unknown'} (${result.dominantColors[0]?.percentage || 0}%). Color analysis can aid in segmentation and classification tasks.`,
    category: 'pattern',
    importance: 'medium',
    icon: '🎨'
  });

  if (result.detectedFeatures.length > 3) {
    insights.push({
      id: `ii-${id++}`,
      title: 'Feature-Rich Image',
      description: `${result.detectedFeatures.length} distinct features detected. This image contains rich visual information suitable for multi-modal analysis.`,
      category: 'trend',
      importance: 'medium',
      icon: '🔍'
    });
  }

  insights.push({
    id: `ii-${id++}`,
    title: 'Cross-Modal Linking Potential',
    description: `This ${result.imageType.toLowerCase()} (${result.dimensions.width}×${result.dimensions.height}) can be linked to text analysis results and experimental data for integrated scientific understanding.`,
    category: 'recommendation',
    importance: 'high',
    icon: '🔗'
  });

  return insights;
}

function getAnalysisType(imageType: string): string {
  switch (imageType) {
    case 'Document/Text': return 'OCR and text extraction';
    case 'Grayscale/Medical': return 'medical image segmentation';
    case 'Chart/Diagram': return 'chart data extraction';
    case 'Scientific Figure': return 'figure element detection';
    default: return 'object detection and classification';
  }
}

export function generateCrossModalHypotheses(
  textResult: TextAnalysisResult | null,
  imageResult: ImageAnalysisResult | null
): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  if (!textResult || !imageResult) return hypotheses;

  hypotheses.push({
    id: 'cm-0',
    title: 'Text-Image Alignment Analysis',
    description: `The text discusses ${textResult.topics[0]?.topic || 'scientific concepts'} while the image is classified as "${imageResult.imageType}". ${imageResult.imageType.includes('Chart') || imageResult.imageType.includes('Scientific') ? 'The image likely visualizes the concepts discussed in the text.' : 'Further analysis needed to establish text-image alignment.'}`,
    confidence: 0.7,
    type: 'correlation',
    evidence: [
      `Text topic: ${textResult.topics[0]?.topic || 'General'}`,
      `Image type: ${imageResult.imageType}`,
      `Text complexity: ${textResult.complexity}/100`,
      `Image complexity: ${imageResult.spatialComplexity}/100`
    ],
    testSuggestion: 'Use CLIP or similar vision-language models to compute text-image similarity scores.',
    domain: 'Multi-Modal Analysis'
  });

  hypotheses.push({
    id: 'cm-1',
    title: 'Complementary Information Hypothesis',
    description: `Text provides ${textResult.wordCount} words of context while image provides ${imageResult.dimensions.width}×${imageResult.dimensions.height} pixels of visual data. Together, they may convey more complete information than either alone.`,
    confidence: 0.75,
    type: 'predictive',
    evidence: [
      `Text entities: ${textResult.entities.length}`,
      `Image features: ${imageResult.detectedFeatures.length}`,
      `Combined modalities may reveal hidden patterns`
    ],
    testSuggestion: 'Extract features from both modalities and test whether combined features improve downstream task performance.',
    domain: 'Multi-Modal Learning'
  });

  return hypotheses;
}
