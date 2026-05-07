export interface ImageAnalysisResult {
  dimensions: { width: number; height: number };
  aspectRatio: string;
  fileSize: string;
  dominantColors: { color: string; hex: string; percentage: number }[];
  brightness: number;
  brightnessLabel: string;
  contrast: number;
  contrastLabel: string;
  saturation: number;
  saturationLabel: string;
  sharpness: number;
  sharpnessLabel: string;
  colorHistogram: { range: string; r: number; g: number; b: number }[];
  detectedFeatures: { feature: string; confidence: number; description: string }[];
  imageType: string;
  qualityScore: number;
  qualityLabel: string;
  metadata: Record<string, string>;
  edgeIntensity: number;
  entropy: number;
  noiseLevel: number;
  spatialComplexity: number;
}

export function analyzeImage(file: File, imageData: ImageData, _canvas: HTMLCanvasElement): ImageAnalysisResult {
  const { width, height, data } = imageData;
  const pixels = width * height;

  // Dominant colors
  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
  const step = Math.max(1, Math.floor(pixels / 5000));

  let totalBrightness = 0;
  let totalSaturation = 0;
  const rHist = new Array(8).fill(0);
  const gHist = new Array(8).fill(0);
  const bHist = new Array(8).fill(0);
  let prevR = 0, prevG = 0, prevB = 0;
  let edgeSum = 0;
  let varianceSum = 0;
  const meanR = data.reduce((s, _, i) => i % 4 === 0 ? s + data[i] : s, 0) / pixels;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i], g = data[i + 1], b = data[i + 2];

    // Color bucketing (quantize to 32 levels)
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    if (!colorBuckets[key]) colorBuckets[key] = { r: qr, g: qg, b: qb, count: 0 };
    colorBuckets[key].count++;

    // Brightness
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    totalBrightness += brightness;

    // Saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    totalSaturation += max > 0 ? (max - min) / max : 0;

    // Histogram
    rHist[Math.min(7, Math.floor(r / 32))]++;
    gHist[Math.min(7, Math.floor(g / 32))]++;
    bHist[Math.min(7, Math.floor(b / 32))]++;

    // Edge detection (simple gradient)
    if (i > 4) {
      edgeSum += Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
    }
    prevR = r; prevG = g; prevB = b;

    // Variance for noise estimation
    varianceSum += (r - meanR) ** 2;
  }

  const sampleCount = Math.ceil(pixels / step);
  const avgBrightness = totalBrightness / sampleCount;
  const avgSaturation = totalSaturation / sampleCount;
  const avgEdge = edgeSum / (sampleCount * 3 * 255);
  const variance = varianceSum / sampleCount;
  const noise = Math.min(100, Math.sqrt(variance) / 2.55);

  // Sort colors by frequency
  const sortedColors = Object.values(colorBuckets).sort((a, b) => b.count - a.count);
  const totalSampled = sortedColors.reduce((s, c) => s + c.count, 0);

  // Color name lookup (used in getColorName)

  function getColorName(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    if (brightness < 40) return 'dark';
    if (brightness > 220) return 'white';
    if (Math.max(r, g, b) - Math.min(r, g, b) < 30) return brightness > 128 ? 'gray' : 'dark';
    if (r > g && r > b) return r > 200 && g > 150 ? 'orange' : g < 100 ? 'red' : 'brown';
    if (g > r && g > b) return g > 200 && r > 150 ? 'lime' : 'green';
    if (b > r && b > g) return b > 200 && r > 100 ? 'purple' : r < 50 ? 'navy' : 'blue';
    if (r > 200 && g > 200) return 'yellow';
    if (r > 150 && b > 150) return 'pink';
    if (g > 150 && b > 150) return 'cyan';
    return 'teal';
  }

  const dominantColors = sortedColors.slice(0, 6).map(c => {
    const name = getColorName(c.r, c.g, c.b);
    return {
      color: name,
      hex: `#${c.r.toString(16).padStart(2,'0')}${c.g.toString(16).padStart(2,'0')}${c.b.toString(16).padStart(2,'0')}`,
      percentage: Math.round((c.count / totalSampled) * 100)
    };
  });

  // Contrast
  const brightValues: number[] = [];
  for (let i = 0; i < data.length; i += 4 * step * 10) {
    brightValues.push((data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) / 255);
  }
  brightValues.sort((a, b) => a - b);
  const low = brightValues[Math.floor(brightValues.length * 0.05)] || 0;
  const high = brightValues[Math.floor(brightValues.length * 0.95)] || 1;
  const contrast = (high - low) * 100;

  // Histogram
  const histMax = Math.max(...rHist, ...gHist, ...bHist, 1);
  const ranges = ['0-31','32-63','64-95','96-127','128-159','160-191','192-223','224-255'];
  const colorHistogram = ranges.map((range, i) => ({
    range,
    r: Math.round((rHist[i] / histMax) * 100),
    g: Math.round((gHist[i] / histMax) * 100),
    b: Math.round((bHist[i] / histMax) * 100),
  }));

  // Sharpness based on edge intensity
  const sharpness = Math.min(100, avgEdge * 500);

  // Spatial complexity (entropy-like)
  const entropy = sortedColors.length > 0
    ? -sortedColors.slice(0, 50).reduce((s, c) => {
        const p = c.count / totalSampled;
        return s + (p > 0 ? p * Math.log2(p) : 0);
      }, 0)
    : 0;
  const spatialComplexity = Math.min(100, entropy * 15);

  // Feature detection (simulated based on image properties)
  const detectedFeatures: { feature: string; confidence: number; description: string }[] = [];

  if (avgEdge > 0.05) detectedFeatures.push({ feature: 'Strong Edges', confidence: Math.min(0.95, avgEdge * 5), description: 'Image contains well-defined edges and boundaries' });
  if (avgBrightness > 0.7) detectedFeatures.push({ feature: 'High Brightness', confidence: 0.9, description: 'Image is predominantly bright, suitable for document analysis' });
  if (avgBrightness < 0.3) detectedFeatures.push({ feature: 'Low Light', confidence: 0.85, description: 'Dark image, may require brightness adjustment' });
  if (contrast > 70) detectedFeatures.push({ feature: 'High Contrast', confidence: 0.88, description: 'Good contrast ratio for feature extraction' });
  if (avgSaturation > 0.5) detectedFeatures.push({ feature: 'Colorful', confidence: 0.82, description: 'Rich color information, suitable for color-based analysis' });
  if (avgSaturation < 0.1) detectedFeatures.push({ feature: 'Grayscale/Low Saturation', confidence: 0.9, description: 'Minimal color variation, possibly a document or diagram' });
  if (spatialComplexity > 60) detectedFeatures.push({ feature: 'High Complexity', confidence: 0.78, description: 'Complex scene with many details' });
  if (spatialComplexity < 20) detectedFeatures.push({ feature: 'Simple Composition', confidence: 0.85, description: 'Simple image, likely a chart, diagram, or document' });
  if (width > height * 1.5) detectedFeatures.push({ feature: 'Panoramic/Wide', confidence: 0.95, description: 'Wide aspect ratio, possibly a chart or timeline' });
  if (height > width * 1.5) detectedFeatures.push({ feature: 'Portrait/Tall', confidence: 0.95, description: 'Tall aspect ratio, possibly a document page' });
  if (noise < 15) detectedFeatures.push({ feature: 'Low Noise', confidence: 0.87, description: 'Clean image with minimal noise artifacts' });

  // Image type classification
  let imageType = 'Natural Image';
  if (avgSaturation < 0.15 && contrast > 50) imageType = 'Document/Text';
  else if (avgSaturation < 0.1) imageType = 'Grayscale/Medical';
  else if (sortedColors.length < 20 && contrast > 60) imageType = 'Chart/Diagram';
  else if (spatialComplexity > 70) imageType = 'Complex Scene/Photograph';
  else if (avgEdge > 0.1 && spatialComplexity < 40) imageType = 'Scientific Figure';

  // Quality
  const qualityScore = Math.round(
    Math.min(100, sharpness * 0.3 + contrast * 0.3 + (100 - noise) * 0.2 + Math.min(100, pixels / 10000) * 0.2)
  );
  const qualityLabel = qualityScore > 80 ? 'Excellent' : qualityScore > 60 ? 'Good' : qualityScore > 40 ? 'Fair' : 'Poor';

  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const d = gcd(width, height);

  return {
    dimensions: { width, height },
    aspectRatio: `${width/d}:${height/d}`,
    fileSize: formatFileSize(file.size),
    dominantColors,
    brightness: Math.round(avgBrightness * 100),
    brightnessLabel: avgBrightness > 0.7 ? 'Bright' : avgBrightness > 0.4 ? 'Normal' : 'Dark',
    contrast: Math.round(contrast),
    contrastLabel: contrast > 70 ? 'High' : contrast > 40 ? 'Medium' : 'Low',
    saturation: Math.round(avgSaturation * 100),
    saturationLabel: avgSaturation > 0.5 ? 'Vivid' : avgSaturation > 0.2 ? 'Normal' : 'Muted',
    sharpness: Math.round(sharpness),
    sharpnessLabel: sharpness > 60 ? 'Sharp' : sharpness > 30 ? 'Normal' : 'Soft',
    colorHistogram,
    detectedFeatures,
    imageType,
    qualityScore,
    qualityLabel,
    metadata: {
      'File Name': file.name,
      'File Type': file.type,
      'File Size': formatFileSize(file.size),
      'Dimensions': `${width} × ${height}`,
      'Total Pixels': pixels.toLocaleString(),
      'Aspect Ratio': `${width/d}:${height/d}`,
    },
    edgeIntensity: Math.round(avgEdge * 100),
    entropy: Math.round(entropy * 100) / 100,
    noiseLevel: Math.round(noise),
    spatialComplexity: Math.round(spatialComplexity),
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
