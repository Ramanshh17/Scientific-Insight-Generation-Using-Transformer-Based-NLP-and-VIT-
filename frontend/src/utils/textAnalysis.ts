export interface TextAnalysisResult {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readabilityScore: number;
  readabilityLevel: string;
  topKeywords: { word: string; count: number; relevance: number }[];
  sentimentScore: number;
  sentimentLabel: string;
  entities: { text: string; type: string; confidence: number }[];
  topics: { topic: string; confidence: number }[];
  complexity: number;
  summary: string;
  languageMetrics: {
    vocabularyRichness: number;
    avgWordLength: number;
    uniqueWords: number;
    lexicalDensity: number;
  };
}

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','it','this','that','are','was','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may','might',
  'shall','can','need','must','not','no','nor','so','if','then','than','too',
  'very','just','about','above','after','again','all','also','am','any','as',
  'because','before','between','both','each','few','further','get','got','he',
  'her','here','him','his','how','i','into','its','let','me','more','most',
  'my','new','now','only','other','our','out','over','own','said','same','she',
  'some','such','take','their','them','these','they','through','under','up',
  'us','we','what','when','where','which','while','who','why','you','your',
  'been','there','here','where','when','how','what','which','who','whom',
]);

const SCIENCE_TERMS: Record<string, string> = {
  'neural': 'AI/ML', 'network': 'AI/ML', 'learning': 'AI/ML', 'model': 'AI/ML',
  'algorithm': 'AI/ML', 'training': 'AI/ML', 'deep': 'AI/ML', 'reinforcement': 'AI/ML',
  'transformer': 'AI/ML', 'attention': 'AI/ML', 'classification': 'AI/ML',
  'regression': 'AI/ML', 'prediction': 'AI/ML', 'optimization': 'AI/ML',
  'protein': 'Biology', 'gene': 'Biology', 'cell': 'Biology', 'dna': 'Biology',
  'rna': 'Biology', 'mutation': 'Biology', 'genome': 'Biology', 'evolution': 'Biology',
  'molecule': 'Chemistry', 'compound': 'Chemistry', 'reaction': 'Chemistry',
  'catalyst': 'Chemistry', 'synthesis': 'Chemistry', 'bond': 'Chemistry',
  'quantum': 'Physics', 'particle': 'Physics', 'energy': 'Physics', 'wave': 'Physics',
  'electron': 'Physics', 'photon': 'Physics', 'gravity': 'Physics', 'mass': 'Physics',
  'climate': 'Environment', 'emission': 'Environment', 'carbon': 'Environment',
  'temperature': 'Environment', 'ocean': 'Environment', 'ecosystem': 'Environment',
  'data': 'Data Science', 'dataset': 'Data Science', 'analysis': 'Data Science',
  'statistical': 'Data Science', 'correlation': 'Data Science', 'distribution': 'Data Science',
  'experiment': 'Research', 'hypothesis': 'Research', 'result': 'Research',
  'method': 'Research', 'study': 'Research', 'research': 'Research', 'evidence': 'Research',
  'disease': 'Medicine', 'patient': 'Medicine', 'treatment': 'Medicine',
  'clinical': 'Medicine', 'diagnosis': 'Medicine', 'therapy': 'Medicine',
};

const POSITIVE_WORDS = new Set([
  'good','great','excellent','significant','improved','better','best','novel',
  'innovative','effective','efficient','success','successful','promising',
  'remarkable','outstanding','superior','optimal','enhanced','advanced',
  'breakthrough','positive','beneficial','robust','accurate','precise',
  'reliable','valid','notable','important','major','critical','substantial',
  'demonstrated','achieved','outperformed','surpassed','exceeded','favorable',
]);

const NEGATIVE_WORDS = new Set([
  'bad','poor','worse','worst','failed','failure','negative','limited',
  'insufficient','inadequate','weak','problem','issue','challenge','difficult',
  'complex','complicated','error','bias','risk','danger','threat','decline',
  'decrease','loss','missing','lacking','gap','limitation','constraint',
  'drawback','shortcoming','deficiency','unclear','uncertain','ambiguous',
]);

export function analyzeText(text: string): TextAnalysisResult {
  if (!text.trim()) {
    return getEmptyResult();
  }

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const wordCount = words.length;
  const charCount = text.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphCount = Math.max(paragraphs.length, 1);
  const avgWordsPerSentence = wordCount / sentenceCount;

  // Readability (Flesch-like)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllables = syllableCount / Math.max(wordCount, 1);
  const readabilityScore = Math.max(0, Math.min(100,
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllables)
  ));
  const readabilityLevel = readabilityScore > 80 ? 'Easy' :
    readabilityScore > 60 ? 'Standard' :
    readabilityScore > 40 ? 'Moderate' :
    readabilityScore > 20 ? 'Difficult' : 'Very Difficult';

  // Keywords
  const wordFreq: Record<string, number> = {};
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(w => w.length > 2);
  const uniqueWordsSet = new Set(lowerWords);

  lowerWords.forEach(w => {
    if (!STOP_WORDS.has(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({
      word,
      count,
      relevance: Math.min(1, (count / wordCount) * 10 + (SCIENCE_TERMS[word] ? 0.3 : 0))
    }));

  // Sentiment
  let positiveCount = 0;
  let negativeCount = 0;
  lowerWords.forEach(w => {
    if (POSITIVE_WORDS.has(w)) positiveCount++;
    if (NEGATIVE_WORDS.has(w)) negativeCount++;
  });
  const sentimentScore = wordCount > 0 ? (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1) : 0;
  const sentimentLabel = sentimentScore > 0.2 ? 'Positive' : sentimentScore < -0.2 ? 'Negative' : 'Neutral';

  // Entities
  const entities: { text: string; type: string; confidence: number }[] = [];
  const seenEntities = new Set<string>();
  lowerWords.forEach(w => {
    if (SCIENCE_TERMS[w] && !seenEntities.has(w)) {
      seenEntities.add(w);
      entities.push({ text: w, type: SCIENCE_TERMS[w], confidence: 0.7 + Math.random() * 0.3 });
    }
  });

  // Topics
  const topicCounts: Record<string, number> = {};
  lowerWords.forEach(w => {
    if (SCIENCE_TERMS[w]) {
      topicCounts[SCIENCE_TERMS[w]] = (topicCounts[SCIENCE_TERMS[w]] || 0) + 1;
    }
  });
  const topics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic,
      confidence: Math.min(0.98, count / Math.max(Object.values(topicCounts).reduce((a, b) => a + b, 0), 1) + 0.3)
    }));

  if (topics.length === 0) {
    topics.push({ topic: 'General Science', confidence: 0.5 });
  }

  // Complexity
  const avgWordLen = lowerWords.reduce((s, w) => s + w.length, 0) / Math.max(lowerWords.length, 1);
  const complexity = Math.min(100, (avgWordLen * 8) + (avgWordsPerSentence * 1.5) + (uniqueWordsSet.size / Math.max(wordCount, 1) * 50));

  // Summary
  const topSentences = sentences
    .map(s => ({
      text: s.trim(),
      score: s.trim().split(/\s+/).filter(w =>
        topKeywords.some(k => w.toLowerCase().includes(k.word))
      ).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.text);

  const summary = topSentences.length > 0 ? topSentences.join('. ').substring(0, 500) + '.' : 'Unable to generate summary.';

  return {
    wordCount,
    charCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    readabilityScore: Math.round(readabilityScore * 10) / 10,
    readabilityLevel,
    topKeywords,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    sentimentLabel,
    entities: entities.slice(0, 10),
    topics,
    complexity: Math.round(complexity),
    summary,
    languageMetrics: {
      vocabularyRichness: Math.round((uniqueWordsSet.size / Math.max(wordCount, 1)) * 100) / 100,
      avgWordLength: Math.round(avgWordLen * 10) / 10,
      uniqueWords: uniqueWordsSet.size,
      lexicalDensity: Math.round((Object.keys(wordFreq).length / Math.max(wordCount, 1)) * 100) / 100,
    }
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getEmptyResult(): TextAnalysisResult {
  return {
    wordCount: 0, charCount: 0, sentenceCount: 0, paragraphCount: 0,
    avgWordsPerSentence: 0, readabilityScore: 0, readabilityLevel: 'N/A',
    topKeywords: [], sentimentScore: 0, sentimentLabel: 'N/A', entities: [],
    topics: [], complexity: 0, summary: '', languageMetrics: {
      vocabularyRichness: 0, avgWordLength: 0, uniqueWords: 0, lexicalDensity: 0
    }
  };
}
