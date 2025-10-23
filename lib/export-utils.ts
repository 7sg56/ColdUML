/**
 * Simplified export utilities for Mermaid diagrams
 * Basic PNG, SVG export and clipboard operations without complex options
 */

export interface ExportResult {
  success: boolean;
  error?: string;
  filename?: string;
}

/**
 * Get the rendered SVG element from the preview panel
 */
function getRenderedSVG(): SVGElement | null {
  const previewContainer = document.querySelector('[data-testid="preview-container"]') || 
                          document.querySelector('.preview-panel svg') ||
                          document.querySelector('svg[id^="mermaid-diagram"]');
  
  if (previewContainer && previewContainer.tagName === 'SVG') {
    return previewContainer as SVGElement;
  }
  
  // Look for SVG inside the container
  const svg = previewContainer?.querySelector('svg');
  return svg || null;
}

/**
 * Simple SVG preparation for export
 */
function prepareSVGForExport(svg: SVGElement): string {
  const clonedSvg = svg.cloneNode(true) as SVGElement;
  
  // Set basic attributes
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Set basic dimensions if missing
  if (!clonedSvg.getAttribute('width')) {
    clonedSvg.setAttribute('width', '800');
  }
  if (!clonedSvg.getAttribute('height')) {
    clonedSvg.setAttribute('height', '600');
  }
  
  return new XMLSerializer().serializeToString(clonedSvg);
}

/**
 * Simple SVG to PNG conversion
 */
async function svgToPng(svgString: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2; // 2x scale for quality
      canvas.height = img.height * 2;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG'));
          }
        },
        'image/png'
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
    
    img.addEventListener('load', () => URL.revokeObjectURL(url));
    img.addEventListener('error', () => URL.revokeObjectURL(url));
  });
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Simple filename generation
 */
function generateFilename(extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `mermaid-diagram-${timestamp}.${extension}`;
}

/**
 * Export diagram as SVG
 */
export async function exportAsSVG(): Promise<ExportResult> {
  try {
    const svg = getRenderedSVG();
    if (!svg) {
      return {
        success: false,
        error: 'No diagram found to export'
      };
    }
    
    const svgString = prepareSVGForExport(svg);
    const filename = generateFilename('svg');
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, filename);
    
    return {
      success: true,
      filename
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to export SVG'
    };
  }
}

/**
 * Export diagram as PNG
 */
export async function exportAsPNG(): Promise<ExportResult> {
  try {
    const svg = getRenderedSVG();
    if (!svg) {
      return {
        success: false,
        error: 'No diagram found to export'
      };
    }
    
    const svgString = prepareSVGForExport(svg);
    const filename = generateFilename('png');
    
    const pngBlob = await svgToPng(svgString);
    downloadBlob(pngBlob, filename);
    
    return {
      success: true,
      filename
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to export PNG'
    };
  }
}

/**
 * Copy Mermaid code to clipboard
 */
export async function copyMermaidCode(code: string): Promise<ExportResult> {
  try {
    if (!code || !code.trim()) {
      return {
        success: false,
        error: 'No content to copy'
      };
    }

    const { copyToClipboard } = await import('./clipboard');
    await copyToClipboard(code);
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to copy to clipboard'
    };
  }
}

