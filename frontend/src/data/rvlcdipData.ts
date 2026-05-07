// Simulated EDA data from RVL-CDIP (Document Image Classification)
// https://www.cs.cmu.edu/~aharley/rvl-cdip/

export const documentTypeDistribution = [
  { type: "Letter", count: 25000, percentage: 6.25 },
  { type: "Form", count: 25000, percentage: 6.25 },
  { type: "Email", count: 25000, percentage: 6.25 },
  { type: "Handwritten", count: 25000, percentage: 6.25 },
  { type: "Advertisement", count: 25000, percentage: 6.25 },
  { type: "Scientific Report", count: 25000, percentage: 6.25 },
  { type: "Scientific Publication", count: 25000, percentage: 6.25 },
  { type: "Specification", count: 25000, percentage: 6.25 },
  { type: "File Folder", count: 25000, percentage: 6.25 },
  { type: "News Article", count: 25000, percentage: 6.25 },
  { type: "Budget", count: 25000, percentage: 6.25 },
  { type: "Invoice", count: 25000, percentage: 6.25 },
  { type: "Presentation", count: 25000, percentage: 6.25 },
  { type: "Questionnaire", count: 25000, percentage: 6.25 },
  { type: "Resume", count: 25000, percentage: 6.25 },
  { type: "Memo", count: 25000, percentage: 6.25 },
];

export const datasetSplitInfo = [
  { split: "Training", count: 320000, percentage: 80.0 },
  { split: "Validation", count: 40000, percentage: 10.0 },
  { split: "Test", count: 40000, percentage: 10.0 },
];

export const imageResolutionDist = [
  { resolution: "< 500px", count: 12340 },
  { resolution: "500-750px", count: 45670 },
  { resolution: "750-1000px", count: 98430 },
  { resolution: "1000-1500px", count: 112340 },
  { resolution: "1500-2000px", count: 89230 },
  { resolution: "2000-2500px", count: 32450 },
  { resolution: "> 2500px", count: 9540 },
];

export const imageQualityMetrics = [
  { metric: "High Contrast", value: 62.3 },
  { metric: "Medium Contrast", value: 28.4 },
  { metric: "Low Contrast", value: 9.3 },
  { metric: "Has Noise/Artifacts", value: 18.7 },
  { metric: "Skewed/Rotated", value: 12.4 },
  { metric: "Partially Occluded", value: 5.2 },
];

export const classificationAccuracyBaseline = [
  { model: "AlexNet", accuracy: 89.2 },
  { model: "VGG-16", accuracy: 90.7 },
  { model: "GoogLeNet", accuracy: 89.8 },
  { model: "ResNet-50", accuracy: 91.3 },
  { model: "EfficientNet", accuracy: 92.1 },
  { model: "ViT-Base", accuracy: 93.4 },
  { model: "DiT", accuracy: 94.2 },
  { model: "LayoutLMv3", accuracy: 95.1 },
];

export const rvlcdipStats = {
  totalImages: 400000,
  numClasses: 16,
  avgImageSize: "1.2 MB",
  totalSize: "38 GB",
  imageFormat: "TIFF (grayscale)",
  avgWidth: 1024,
  avgHeight: 1400,
  bitDepth: 8,
  balancedClasses: true,
  sourceCollection: "IIT-CDIP (Legacy Tobacco Documents)",
};

export const documentComplexity = [
  { type: "Letter", textDensity: 72, layoutComplexity: 25, visualElements: 8 },
  { type: "Form", textDensity: 45, layoutComplexity: 82, visualElements: 35 },
  { type: "Scientific Report", textDensity: 85, layoutComplexity: 65, visualElements: 42 },
  { type: "Scientific Pub.", textDensity: 88, layoutComplexity: 72, visualElements: 55 },
  { type: "Advertisement", textDensity: 32, layoutComplexity: 78, visualElements: 85 },
  { type: "Invoice", textDensity: 55, layoutComplexity: 68, visualElements: 22 },
  { type: "Presentation", textDensity: 38, layoutComplexity: 55, visualElements: 72 },
  { type: "Resume", textDensity: 68, layoutComplexity: 58, visualElements: 15 },
];
