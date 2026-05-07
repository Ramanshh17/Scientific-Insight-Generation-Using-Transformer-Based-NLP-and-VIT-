import * as pdfjsLib from 'pdfjs-dist';

// Use a reliable CDN for the worker to ensure it loads correctly in all environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface PDFTextBlock {
  text: string;
  page: number;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
  isHeading: boolean;
}

export interface PDFImageInfo {
  page: number;
  index: number;
  width: number;
  height: number;
  dataUrl: string;
  label: string;
}

export interface PDFGraphInfo {
  page: number;
  index: number;
  type: string;
  description: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PDFSection {
  title: string;
  content: string;
  wordCount: number;
  type: 'title' | 'abstract' | 'body' | 'references' | 'section' | 'heading';
  page: number;
}

export interface ParsedPDF {
  fileName: string;
  fileSize: string;
  totalPages: number;
  totalWords: number;
  fullText: string;
  sections: PDFSection[];
  textBlocks: PDFTextBlock[];
  images: PDFImageInfo[];
  graphs: PDFGraphInfo[];
  pageTexts: string[];
  pageImages: string[];
  metadata: Record<string, string>;
}

function classifySectionType(title: string, index: number): PDFSection['type'] {
  const lower = title.toLowerCase();
  if (index === 0 && lower.length < 150) return 'title';
  if (/abstract/i.test(lower)) return 'abstract';
  if (/reference|bibliography/i.test(lower)) return 'references';
  if (/introduction|method|result|discussion|conclusion|experiment|related work|background|approach|evaluation|implementation|appendix|acknowledgment|supplement/i.test(lower)) return 'section';
  if (lower.length < 80) return 'heading';
  return 'body';
}

async function renderPageToCanvas(
  page: pdfjsLib.PDFPageProxy,
  scale: number = 1.5
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

export async function parsePDF(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ParsedPDF> {
  onProgress?.(5, 'Reading file...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(10, 'Initializing PDF parser...');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf: pdfjsLib.PDFDocumentProxy = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const allTextBlocks: PDFTextBlock[] = [];
  const allImages: PDFImageInfo[] = [];
  const allGraphs: PDFGraphInfo[] = [];
  const pageTexts: string[] = [];
  const pageImages: string[] = [];
  let imageIndex = 0;

  // Metadata
  const metadataObj = await pdf.getMetadata().catch(() => null);
  const metadata: Record<string, string> = {
    'File Name': file.name,
    'File Size': file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    'Pages': String(totalPages),
  };

  if (metadataObj?.info && typeof metadataObj.info === 'object') {
    const info = metadataObj.info as Record<string, unknown>;
    if (info.PDFFormatVersion) metadata['PDF Version'] = String(info.PDFFormatVersion);
    if (info.Title) metadata['Title'] = String(info.Title);
    if (info.Author) metadata['Author'] = String(info.Author);
    if (info.Subject) metadata['Subject'] = String(info.Subject);
    if (info.Creator) metadata['Creator'] = String(info.Creator);
    if (info.Producer) metadata['Producer'] = String(info.Producer);
  }

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const progress = 10 + ((pageNum / totalPages) * 60);
    onProgress?.(progress, `Processing page ${pageNum} of ${totalPages}...`);

    const page = await pdf.getPage(pageNum);

    // ========= TEXT EXTRACTION =========
    const textContent = await page.getTextContent();
    const pageTextBlocks: PDFTextBlock[] = [];

    for (const item of textContent.items) {
      if ('str' in item && (item as { str: string }).str.trim()) {
        const textItem = item as {
          str: string;
          transform?: number[];
          fontName?: string;
        };
        const fontSize = textItem.transform ? Math.abs(textItem.transform[3]) : 12;
        const fontName = textItem.fontName || 'unknown';
        const x = textItem.transform ? textItem.transform[4] : 0;
        const y = textItem.transform ? textItem.transform[5] : 0;

        const isBold = fontName.toLowerCase().includes('bold') || fontName.toLowerCase().includes('heavy') || fontName.toLowerCase().includes('black');
        const isUpperCase = textItem.str === textItem.str.toUpperCase() && textItem.str.length > 3 && /[A-Z]/.test(textItem.str);
        
        // Smarter heading detection
        const isSectionNumber = /^[0-9]+(\.[0-9]+)*\s+[A-Z]/.test(textItem.str);
        const isCommonHeading = /^(Abstract|Introduction|Methods?|Materials|Results?|Discussion|Conclusion|References|Bibliography|Acknowledgements?|Appendix)/i.test(textItem.str);
        
        const isHeading = fontSize > 13 || isSectionNumber || (textItem.str.length < 60 && (isUpperCase || isBold || isCommonHeading));

        pageTextBlocks.push({
          text: textItem.str,
          page: pageNum,
          x, y, fontSize, fontName, isHeading,
        });
      }
    }

    // Reconstruct with line breaks
    let reconstructedText = '';
    let lastY = -1;
    for (const block of pageTextBlocks) {
      if (lastY !== -1 && Math.abs(block.y - lastY) > 5) {
        reconstructedText += '\n';
      }
      reconstructedText += block.text + ' ';
      lastY = block.y;
    }
    pageTexts.push(reconstructedText.trim());
    allTextBlocks.push(...pageTextBlocks);

    // ========= PAGE RENDER =========
    try {
      const rendered = await renderPageToCanvas(page, 1.2);
      pageImages.push(rendered);
    } catch {
      pageImages.push('');
    }

    // ========= IMAGE EXTRACTION =========
    try {
      const ops = await page.getOperatorList();
      const viewport = page.getViewport({ scale: 1.0 });

      for (let i = 0; i < ops.fnArray.length; i++) {
        const op = ops.fnArray[i];
        
        // Catch more image types
        if (op === pdfjsLib.OPS.paintImageXObject || 
            op === pdfjsLib.OPS.paintXObject || 
            op === pdfjsLib.OPS.paintInlineImageXObject) {
            
          const imgName = ops.argsArray[i]?.[0];
          if (!imgName) continue;

          try {
            const imgData = await new Promise<{
              width: number; height: number; data: Uint8ClampedArray;
            }>((resolve, reject) => {
              // Try standard objects first
              page.objs.get(imgName, (obj: any) => {
                if (obj && obj.width && obj.height && obj.data) {
                  resolve(obj);
                } else {
                  // Try common objects as fallback
                  page.commonObjs.get(imgName, (commonObj: any) => {
                    if (commonObj && commonObj.width && commonObj.height && commonObj.data) {
                      resolve(commonObj);
                    } else {
                      reject(new Error('Not found'));
                    }
                  });
                }
              });
              setTimeout(() => reject(new Error('Timeout')), 2000);
            });

            if (imgData.width > 30 && imgData.height > 30 && imgData.data) {
              const canvas = document.createElement('canvas');
              canvas.width = imgData.width;
              canvas.height = imgData.height;
              const ctx = canvas.getContext('2d')!;

              let imageDataObj: ImageData | null = null;
              const px = imgData.width * imgData.height;

              if (imgData.data.length === px * 4) {
                imageDataObj = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
              } else if (imgData.data.length === px * 3) {
                const rgba = new Uint8ClampedArray(px * 4);
                for (let j = 0; j < px; j++) {
                  rgba[j * 4] = imgData.data[j * 3];
                  rgba[j * 4 + 1] = imgData.data[j * 3 + 1];
                  rgba[j * 4 + 2] = imgData.data[j * 3 + 2];
                  rgba[j * 4 + 3] = 255;
                }
                imageDataObj = new ImageData(rgba, imgData.width, imgData.height);
              } else if (imgData.data.length === px) {
                const rgba = new Uint8ClampedArray(px * 4);
                for (let j = 0; j < px; j++) {
                  rgba[j * 4] = imgData.data[j];
                  rgba[j * 4 + 1] = imgData.data[j];
                  rgba[j * 4 + 2] = imgData.data[j];
                  rgba[j * 4 + 3] = 255;
                }
                imageDataObj = new ImageData(rgba, imgData.width, imgData.height);
              }

              if (imageDataObj) {
                ctx.putImageData(imageDataObj, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');

                const widthRatio = imgData.width / viewport.width;
                const aspectRatio = imgData.width / imgData.height;
                
                // Relaxed heuristic for graphs/figures
                const isGraph = 
                  (widthRatio > 0.35) || 
                  (imgData.width > 180 && aspectRatio > 0.6 && aspectRatio < 2.5);

                if (isGraph) {
                  allGraphs.push({
                    page: pageNum, index: imageIndex, type: 'Figure/Chart',
                    description: `Detected visual element on page ${pageNum} (${imgData.width}×${imgData.height}px)`,
                    dataUrl, width: imgData.width, height: imgData.height,
                  });
                } else {
                  allImages.push({
                    page: pageNum, index: imageIndex,
                    width: imgData.width, height: imgData.height,
                    dataUrl, label: `Image (Page ${pageNum})`,
                  });
                }
                imageIndex++;
              }
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // operator list failed
    }
  }

  // ========= CAPTION-BASED FIGURE EXTRACTION (Recovery Mode) =========
  // This helps capture vector-based figures that aren't stored as Image objects
  if (allGraphs.length === 0) {
    onProgress?.(75, 'Searching for hidden figures and charts...');
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageText = pageTexts[pageNum - 1];
      const pageImg = pageImages[pageNum - 1];
      if (!pageText || !pageImg) continue;

      // Look for "Fig." or "Figure" or "Chart" labels
      const figureMatches = [...pageText.matchAll(/(?:Fig\.|Figure|Chart|Diagram)\s*([0-9]+)/gi)];
      
      if (figureMatches.length > 0) {
        // Since we have a caption but no image objects, 
        // we'll treat the page visual as a "Composite Figure" 
        // or attempt to find the largest non-text block.
        // For now, let's extract the non-text visual from the render.
        
        // Find text blocks for this page
        const pageBlocks = allTextBlocks.filter(b => b.page === pageNum);
        if (pageBlocks.length > 0) {
          allGraphs.push({
            page: pageNum,
            index: 99 + pageNum,
            type: 'Scientific Figure (Vector)',
            description: `Visual element detected via caption: "${figureMatches[0][0]}"`,
            dataUrl: pageImg, // Use the full page render as the figure source
            width: 800,
            height: 600,
          });
        }
      }
    }
  }

  onProgress?.(80, 'Analyzing document structure...');
  const fullText = pageTexts.join('\n\n');
  const sections = buildSections(allTextBlocks, fullText);

  onProgress?.(90, 'Finalizing...');
  const totalWords = fullText.split(/\s+/).filter(w => w.length > 0).length;
  onProgress?.(100, 'Complete!');

  return {
    fileName: file.name,
    fileSize: metadata['File Size'],
    totalPages, totalWords, fullText, sections,
    textBlocks: allTextBlocks, images: allImages,
    graphs: allGraphs, pageTexts, pageImages, metadata,
  };
}

function buildSections(textBlocks: PDFTextBlock[], fullText: string): PDFSection[] {
  const sections: PDFSection[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];
  let currentPage = 1;
  let sectionIndex = 0;

  const flush = () => {
    if (currentContent.length > 0 || currentTitle) {
      const content = currentContent.join(' ').trim();
      if (content.length > 0) {
        sections.push({
          title: currentTitle || `Section ${sectionIndex + 1}`,
          content,
          wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
          type: classifySectionType(currentTitle, sectionIndex),
          page: currentPage,
        });
        sectionIndex++;
      }
    }
  };

  for (const block of textBlocks) {
    if (block.isHeading && block.text.trim().length > 2 && block.text.trim().length < 100) {
      flush();
      currentTitle = block.text.trim();
      currentContent = [];
      currentPage = block.page;
    } else {
      currentContent.push(block.text);
    }
  }
  flush();

  if (sections.length === 0) {
    const lines = fullText.split('\n').filter(l => l.trim());
    let secTitle = 'Full Document';
    let secContent: string[] = [];
    let idx = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const isHeader =
        trimmed.length < 80 && trimmed.length > 2 &&
        (/^[0-9]+\.?\s/.test(trimmed) ||
         /^(Abstract|Introduction|Methods?|Results?|Discussion|Conclusion|References|Appendix)/i.test(trimmed) ||
         (trimmed === trimmed.toUpperCase() && trimmed.length < 50 && trimmed.length > 3));

      if (isHeader) {
        if (secContent.length > 0) {
          const content = secContent.join(' ').trim();
          sections.push({ title: secTitle, content, wordCount: content.split(/\s+/).length, type: classifySectionType(secTitle, idx), page: 1 });
          idx++;
        }
        secTitle = trimmed;
        secContent = [];
      } else {
        secContent.push(trimmed);
      }
    }
    if (secContent.length > 0) {
      const content = secContent.join(' ').trim();
      sections.push({ title: secTitle, content, wordCount: content.split(/\s+/).length, type: classifySectionType(secTitle, idx), page: 1 });
    }
  }

  if (sections.length === 0) {
    sections.push({ title: 'Full Document', content: fullText, wordCount: fullText.split(/\s+/).length, type: 'body', page: 1 });
  }

  return sections;
}
