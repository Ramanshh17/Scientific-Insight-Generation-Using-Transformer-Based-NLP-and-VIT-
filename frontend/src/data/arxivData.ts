// Simulated EDA data from arXiv dataset (Cornell University / Kaggle)
// https://www.kaggle.com/datasets/Cornell-University/arxiv
// Categories matching the actual arXiv dataset schema

export interface ArxivPaper {
  id: string;
  title: string;
  abstract: string;
  categories: string[];
  authors: string[];
  year: number;
  journal_ref: string;
  doi: string;
  update_date: string;
}

export const ARXIV_CATEGORIES: Record<string, { label: string; group: string; color: string; description: string }> = {
  'cs.AI': { label: 'Artificial Intelligence', group: 'Computer Science', color: '#6366f1', description: 'Covers all areas of AI except Vision, Robotics, Machine Learning, Multiagent Systems, and Computation and Language' },
  'cs.LG': { label: 'Machine Learning', group: 'Computer Science', color: '#8b5cf6', description: 'Papers on all aspects of machine learning research' },
  'cs.CV': { label: 'Computer Vision', group: 'Computer Science', color: '#06b6d4', description: 'Covers image processing, computer vision, pattern recognition, and scene understanding' },
  'cs.CL': { label: 'Computation & Language', group: 'Computer Science', color: '#10b981', description: 'Covers natural language processing, computational linguistics and speech' },
  'cs.NE': { label: 'Neural & Evolutionary Computing', group: 'Computer Science', color: '#f59e0b', description: 'Covers neural networks, connectionism, genetic algorithms, artificial life' },
  'cs.IR': { label: 'Information Retrieval', group: 'Computer Science', color: '#ef4444', description: 'Covers indexing, dictionaries, retrieval, content and analysis' },
  'cs.RO': { label: 'Robotics', group: 'Computer Science', color: '#ec4899', description: 'Roughly includes material in ACM Subject Class I.2.9' },
  'cs.CR': { label: 'Cryptography & Security', group: 'Computer Science', color: '#14b8a6', description: 'Covers all areas of cryptography and security' },
  'cs.DS': { label: 'Data Structures & Algorithms', group: 'Computer Science', color: '#a855f7', description: 'Covers data structures and analysis of algorithms' },
  'cs.SE': { label: 'Software Engineering', group: 'Computer Science', color: '#f97316', description: 'Covers design tools, software metrics, testing and debugging' },
  'stat.ML': { label: 'Machine Learning (Stats)', group: 'Statistics', color: '#0ea5e9', description: 'Covers machine learning papers with a statistical or methodological focus' },
  'stat.AP': { label: 'Applications (Stats)', group: 'Statistics', color: '#84cc16', description: 'Biology, Education, Epidemiology, Engineering, Environmental Sciences' },
  'math.OC': { label: 'Optimization & Control', group: 'Mathematics', color: '#e879f9', description: 'Operations research, linear programming, control theory' },
  'math.ST': { label: 'Statistics Theory', group: 'Mathematics', color: '#fb923c', description: 'Applied, Coverage Coverage Processes, Estimation, Nonparametrics, Regression' },
  'physics.comp-ph': { label: 'Computational Physics', group: 'Physics', color: '#38bdf8', description: 'Computational methods and simulations in physics' },
  'physics.data-an': { label: 'Data Analysis (Physics)', group: 'Physics', color: '#4ade80', description: 'Methods for data analysis in physics experiments' },
  'q-bio.QM': { label: 'Quantitative Methods (Bio)', group: 'Quantitative Biology', color: '#c084fc', description: 'Research involving quantitative approaches to biology' },
  'q-bio.GN': { label: 'Genomics', group: 'Quantitative Biology', color: '#2dd4bf', description: 'DNA, RNA, Genomics, Proteomics' },
  'eess.SP': { label: 'Signal Processing', group: 'Electrical Engineering', color: '#fbbf24', description: 'Theory, algorithms, performance analysis and applications of signal processing' },
  'eess.IV': { label: 'Image & Video Processing', group: 'Electrical Engineering', color: '#f472b6', description: 'Theory, algorithms and architectures for image/video processing' },
};

export const arxivCategoryDistribution = [
  { category: 'cs.AI', count: 48523, label: 'Artificial Intelligence' },
  { category: 'cs.LG', count: 72341, label: 'Machine Learning' },
  { category: 'cs.CV', count: 61205, label: 'Computer Vision' },
  { category: 'cs.CL', count: 35812, label: 'Computation & Language' },
  { category: 'cs.NE', count: 12456, label: 'Neural & Evolutionary' },
  { category: 'stat.ML', count: 28934, label: 'Statistics - ML' },
  { category: 'physics.comp-ph', count: 18743, label: 'Computational Physics' },
  { category: 'math.OC', count: 15632, label: 'Optimization & Control' },
  { category: 'q-bio.QM', count: 9821, label: 'Quantitative Biology' },
  { category: 'eess.SP', count: 14523, label: 'Signal Processing' },
  { category: 'cs.IR', count: 11234, label: 'Information Retrieval' },
  { category: 'cs.RO', count: 13876, label: 'Robotics' },
];

export const arxivYearlyGrowth = [
  { year: 2010, papers: 12450, aiPapers: 1230 },
  { year: 2011, papers: 14320, aiPapers: 1580 },
  { year: 2012, papers: 16890, aiPapers: 2340 },
  { year: 2013, papers: 19540, aiPapers: 3120 },
  { year: 2014, papers: 23100, aiPapers: 4560 },
  { year: 2015, papers: 28760, aiPapers: 7230 },
  { year: 2016, papers: 35420, aiPapers: 11450 },
  { year: 2017, papers: 44890, aiPapers: 18230 },
  { year: 2018, papers: 56340, aiPapers: 27560 },
  { year: 2019, papers: 71230, aiPapers: 38940 },
  { year: 2020, papers: 89450, aiPapers: 52130 },
  { year: 2021, papers: 105670, aiPapers: 64520 },
  { year: 2022, papers: 124890, aiPapers: 79340 },
  { year: 2023, papers: 148230, aiPapers: 98760 },
  { year: 2024, papers: 162450, aiPapers: 112340 },
];

export const arxivAbstractLengthDist = [
  { range: '50-100', count: 2340 },
  { range: '100-150', count: 18920 },
  { range: '150-200', count: 45670 },
  { range: '200-250', count: 62340 },
  { range: '250-300', count: 48920 },
  { range: '300-350', count: 28450 },
  { range: '350-400', count: 12340 },
  { range: '400-450', count: 5670 },
  { range: '450-500', count: 2340 },
  { range: '500+', count: 1230 },
];

export const arxivMultiModalStats = {
  totalPapers: 2_200_000,
  withImages: 892_000,
  withTables: 1_340_000,
  withCode: 456_000,
  withEquations: 1_890_000,
  multiCategory: 678_000,
  avgAuthors: 3.4,
  avgReferences: 32.7,
  missingAbstracts: 0.02,
  avgWordsPerAbstract: 218,
};

export const arxivAuthorCollaboration = [
  { authors: '1', count: 28450 },
  { authors: '2', count: 45230 },
  { authors: '3', count: 52340 },
  { authors: '4', count: 38920 },
  { authors: '5', count: 24560 },
  { authors: '6', count: 15670 },
  { authors: '7+', count: 22340 },
];

export const arxivTopKeywords = [
  { word: 'deep learning', freq: 42350 },
  { word: 'neural network', freq: 38920 },
  { word: 'transformer', freq: 31240 },
  { word: 'reinforcement', freq: 24560 },
  { word: 'generative', freq: 22340 },
  { word: 'classification', freq: 19870 },
  { word: 'optimization', freq: 18430 },
  { word: 'representation', freq: 16890 },
  { word: 'attention', freq: 15670 },
  { word: 'pre-trained', freq: 14230 },
  { word: 'multi-modal', freq: 12890 },
  { word: 'self-supervised', freq: 11450 },
];

// Sample papers for each category (simulating kaggle dataset rows)
export const SAMPLE_PAPERS: Record<string, ArxivPaper[]> = {
  'cs.AI': [
    { id: '2301.00001', title: 'A Survey of Large Language Models', abstract: 'Language is essentially a complex, intricate system of human expressions governed by grammatical rules. Large language models (LLMs) have demonstrated remarkable capabilities in natural language processing tasks.', categories: ['cs.AI', 'cs.CL'], authors: ['Wayne Xin Zhao', 'Kun Zhou'], year: 2023, journal_ref: 'ACM Computing Surveys', doi: '10.1145/3641289', update_date: '2023-11-24' },
    { id: '2302.00045', title: 'Chain-of-Thought Prompting Elicits Reasoning in LLMs', abstract: 'We explore how generating a chain of thought — a series of intermediate reasoning steps — significantly improves the ability of large language models to perform complex reasoning.', categories: ['cs.AI'], authors: ['Jason Wei', 'Xuezhi Wang'], year: 2023, journal_ref: 'NeurIPS 2022', doi: '10.48550/arXiv.2201.11903', update_date: '2023-01-10' },
    { id: '2303.00123', title: 'Multimodal Foundation Models: From Specialists to General-Purpose', abstract: 'This survey provides a comprehensive review of multimodal foundation models that can process and generate content across multiple modalities including text, images, audio, and video.', categories: ['cs.AI', 'cs.CV', 'cs.LG'], authors: ['Chunyuan Li', 'Zhe Gan'], year: 2023, journal_ref: '', doi: '', update_date: '2023-09-15' },
  ],
  'cs.LG': [
    { id: '2304.00201', title: 'Attention Is All You Need: Revisited', abstract: 'The transformer architecture has revolutionized machine learning across domains. We revisit the original attention mechanism and propose efficiency improvements.', categories: ['cs.LG', 'cs.AI'], authors: ['Alexander Rush', 'Yann LeCun'], year: 2023, journal_ref: 'ICML 2023', doi: '', update_date: '2023-07-20' },
    { id: '2305.00302', title: 'Self-Supervised Learning: A Comprehensive Survey', abstract: 'Self-supervised learning has emerged as a powerful paradigm for learning representations from unlabeled data. This paper provides a comprehensive survey of methods.', categories: ['cs.LG'], authors: ['Linus Ericsson', 'Henry Gouk'], year: 2023, journal_ref: '', doi: '', update_date: '2023-05-12' },
    { id: '2306.00403', title: 'Scaling Laws for Neural Language Models', abstract: 'We study empirical scaling laws for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and compute.', categories: ['cs.LG', 'cs.CL'], authors: ['Jared Kaplan', 'Sam McCandlish'], year: 2023, journal_ref: '', doi: '', update_date: '2023-06-08' },
  ],
  'cs.CV': [
    { id: '2307.00504', title: 'Vision Transformers for Dense Prediction', abstract: 'We introduce dense vision transformers that can be used for semantic segmentation, depth estimation, and other dense prediction tasks with state-of-the-art results.', categories: ['cs.CV'], authors: ['René Ranftl', 'Alexey Bochkovskiy'], year: 2023, journal_ref: 'ICCV 2023', doi: '', update_date: '2023-10-05' },
    { id: '2308.00605', title: 'Segment Anything Model', abstract: 'We introduce the Segment Anything project: a new task, model, and dataset for image segmentation. We built the largest segmentation dataset to date.', categories: ['cs.CV', 'cs.AI'], authors: ['Alexander Kirillov', 'Eric Mintun'], year: 2023, journal_ref: 'ICCV 2023', doi: '', update_date: '2023-04-05' },
  ],
  'cs.CL': [
    { id: '2309.00706', title: 'BERT: Pre-training of Deep Bidirectional Transformers', abstract: 'We introduce a new language representation model called BERT which obtains state-of-the-art results on eleven natural language processing benchmarks.', categories: ['cs.CL'], authors: ['Jacob Devlin', 'Ming-Wei Chang'], year: 2023, journal_ref: 'NAACL 2019', doi: '', update_date: '2023-02-14' },
  ],
  'stat.ML': [
    { id: '2310.00807', title: 'Bayesian Deep Learning: A Unified Framework', abstract: 'We present a unified framework for Bayesian deep learning that combines the representational power of deep networks with the uncertainty quantification of Bayesian methods.', categories: ['stat.ML', 'cs.LG'], authors: ['Andrew Gordon Wilson', 'Pavel Izmailov'], year: 2023, journal_ref: '', doi: '', update_date: '2023-03-20' },
  ],
};

// Per-category statistics for the analyzer
export const CATEGORY_STATS: Record<string, {
  papers: number;
  growth: number;
  avgCitations: number;
  avgAuthors: number;
  multiModal: number;
  openAccess: number;
  crossDomain: number;
  avgAbstractLen: number;
  topKeywords: string[];
  yearlyPapers: { year: number; count: number }[];
}> = {
  'cs.AI': {
    papers: 48523, growth: 34.2, avgCitations: 18.4, avgAuthors: 3.8,
    multiModal: 42, openAccess: 89, crossDomain: 38, avgAbstractLen: 225,
    topKeywords: ['reasoning', 'knowledge', 'planning', 'agent', 'representation', 'learning', 'language model', 'inference'],
    yearlyPapers: [{ year: 2018, count: 4200 }, { year: 2019, count: 5800 }, { year: 2020, count: 7900 }, { year: 2021, count: 9400 }, { year: 2022, count: 11200 }, { year: 2023, count: 14500 }, { year: 2024, count: 18200 }],
  },
  'cs.LG': {
    papers: 72341, growth: 41.5, avgCitations: 22.1, avgAuthors: 3.5,
    multiModal: 35, openAccess: 92, crossDomain: 45, avgAbstractLen: 210,
    topKeywords: ['optimization', 'generalization', 'neural network', 'gradient', 'convergence', 'regularization', 'training', 'loss'],
    yearlyPapers: [{ year: 2018, count: 6100 }, { year: 2019, count: 8900 }, { year: 2020, count: 12400 }, { year: 2021, count: 15200 }, { year: 2022, count: 18900 }, { year: 2023, count: 22400 }, { year: 2024, count: 28100 }],
  },
  'cs.CV': {
    papers: 61205, growth: 38.7, avgCitations: 25.3, avgAuthors: 4.1,
    multiModal: 58, openAccess: 91, crossDomain: 32, avgAbstractLen: 198,
    topKeywords: ['image', 'segmentation', 'detection', 'recognition', 'visual', 'convolution', 'feature', 'transformer'],
    yearlyPapers: [{ year: 2018, count: 5800 }, { year: 2019, count: 7600 }, { year: 2020, count: 10200 }, { year: 2021, count: 12800 }, { year: 2022, count: 15400 }, { year: 2023, count: 19200 }, { year: 2024, count: 24800 }],
  },
  'cs.CL': {
    papers: 35812, growth: 45.2, avgCitations: 20.8, avgAuthors: 3.6,
    multiModal: 38, openAccess: 93, crossDomain: 41, avgAbstractLen: 232,
    topKeywords: ['language', 'translation', 'sentiment', 'text', 'pre-trained', 'embedding', 'semantic', 'corpus'],
    yearlyPapers: [{ year: 2018, count: 2800 }, { year: 2019, count: 4200 }, { year: 2020, count: 6100 }, { year: 2021, count: 7800 }, { year: 2022, count: 9200 }, { year: 2023, count: 12400 }, { year: 2024, count: 16800 }],
  },
  'cs.NE': {
    papers: 12456, growth: 18.3, avgCitations: 14.2, avgAuthors: 3.2,
    multiModal: 25, openAccess: 85, crossDomain: 35, avgAbstractLen: 205,
    topKeywords: ['evolutionary', 'genetic', 'neuroevolution', 'spiking', 'neural', 'population', 'fitness', 'architecture'],
    yearlyPapers: [{ year: 2018, count: 1200 }, { year: 2019, count: 1450 }, { year: 2020, count: 1680 }, { year: 2021, count: 1920 }, { year: 2022, count: 2100 }, { year: 2023, count: 2450 }, { year: 2024, count: 2800 }],
  },
  'stat.ML': {
    papers: 28934, growth: 28.6, avgCitations: 19.5, avgAuthors: 3.1,
    multiModal: 22, openAccess: 87, crossDomain: 52, avgAbstractLen: 240,
    topKeywords: ['bayesian', 'estimation', 'inference', 'posterior', 'distribution', 'sampling', 'variational', 'kernel'],
    yearlyPapers: [{ year: 2018, count: 2800 }, { year: 2019, count: 3400 }, { year: 2020, count: 4200 }, { year: 2021, count: 5100 }, { year: 2022, count: 5800 }, { year: 2023, count: 6500 }, { year: 2024, count: 7200 }],
  },
  'physics.comp-ph': {
    papers: 18743, growth: 15.4, avgCitations: 12.8, avgAuthors: 3.9,
    multiModal: 48, openAccess: 78, crossDomain: 28, avgAbstractLen: 215,
    topKeywords: ['simulation', 'molecular', 'dynamics', 'density', 'functional', 'lattice', 'monte carlo', 'numerical'],
    yearlyPapers: [{ year: 2018, count: 2100 }, { year: 2019, count: 2350 }, { year: 2020, count: 2600 }, { year: 2021, count: 2850 }, { year: 2022, count: 3100 }, { year: 2023, count: 3450 }, { year: 2024, count: 3800 }],
  },
  'math.OC': {
    papers: 15632, growth: 12.8, avgCitations: 11.4, avgAuthors: 2.8,
    multiModal: 15, openAccess: 82, crossDomain: 42, avgAbstractLen: 195,
    topKeywords: ['convex', 'optimization', 'constraint', 'linear', 'programming', 'control', 'stochastic', 'convergence'],
    yearlyPapers: [{ year: 2018, count: 1800 }, { year: 2019, count: 1980 }, { year: 2020, count: 2150 }, { year: 2021, count: 2320 }, { year: 2022, count: 2500 }, { year: 2023, count: 2700 }, { year: 2024, count: 2900 }],
  },
  'q-bio.QM': {
    papers: 9821, growth: 22.1, avgCitations: 16.3, avgAuthors: 4.5,
    multiModal: 55, openAccess: 84, crossDomain: 58, avgAbstractLen: 248,
    topKeywords: ['biological', 'network', 'dynamical', 'modeling', 'cell', 'stochastic', 'population', 'genomic'],
    yearlyPapers: [{ year: 2018, count: 980 }, { year: 2019, count: 1150 }, { year: 2020, count: 1380 }, { year: 2021, count: 1520 }, { year: 2022, count: 1700 }, { year: 2023, count: 1950 }, { year: 2024, count: 2200 }],
  },
  'eess.SP': {
    papers: 14523, growth: 16.9, avgCitations: 13.7, avgAuthors: 3.4,
    multiModal: 40, openAccess: 80, crossDomain: 34, avgAbstractLen: 202,
    topKeywords: ['signal', 'frequency', 'filter', 'spectrum', 'antenna', 'wireless', 'modulation', 'beamforming'],
    yearlyPapers: [{ year: 2018, count: 1600 }, { year: 2019, count: 1850 }, { year: 2020, count: 2050 }, { year: 2021, count: 2250 }, { year: 2022, count: 2450 }, { year: 2023, count: 2700 }, { year: 2024, count: 2950 }],
  },
  'cs.IR': {
    papers: 11234, growth: 20.4, avgCitations: 15.9, avgAuthors: 3.3,
    multiModal: 30, openAccess: 88, crossDomain: 40, avgAbstractLen: 210,
    topKeywords: ['retrieval', 'recommendation', 'ranking', 'query', 'indexing', 'search', 'embedding', 'collaborative'],
    yearlyPapers: [{ year: 2018, count: 1100 }, { year: 2019, count: 1320 }, { year: 2020, count: 1540 }, { year: 2021, count: 1720 }, { year: 2022, count: 1900 }, { year: 2023, count: 2150 }, { year: 2024, count: 2400 }],
  },
  'cs.RO': {
    papers: 13876, growth: 24.8, avgCitations: 14.6, avgAuthors: 4.2,
    multiModal: 62, openAccess: 86, crossDomain: 45, avgAbstractLen: 208,
    topKeywords: ['robot', 'manipulation', 'navigation', 'planning', 'control', 'autonomous', 'perception', 'grasping'],
    yearlyPapers: [{ year: 2018, count: 1350 }, { year: 2019, count: 1620 }, { year: 2020, count: 1900 }, { year: 2021, count: 2150 }, { year: 2022, count: 2400 }, { year: 2023, count: 2750 }, { year: 2024, count: 3200 }],
  },
};
