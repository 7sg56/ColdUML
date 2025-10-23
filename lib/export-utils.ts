/**
 * Export utilities for Mermaid diagrams
 * Handles PNG, SVG export and clipboard operations
 */

export interface ExportOptions {
  format: 'png' | 'svg' | 'code';
  filename?: string;
  quality?: number; // for PNG exports (0-1)
  scale?: number; // for PNG exports (1-4)
}

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
 * Clean and prepare SVG for export
 */
function prepareSVGForExport(svg: SVGElement): string {
  // Clone the SVG to avoid modifying the original
  const clonedSvg = svg.cloneNode(true) as SVGElement;
  
  // Ensure proper namespace and attributes
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  // Get computed styles and apply them inline for proper export
  const originalElements = svg.querySelectorAll('*');
  const clonedElements = clonedSvg.querySelectorAll('*');
  
  originalElements.forEach((originalEl, index) => {
    const clonedEl = clonedElements[index];
    if (clonedEl && originalEl instanceof Element) {
      const computedStyle = window.getComputedStyle(originalEl);
      
      // Apply critical styles inline
      const criticalStyles = [
        'fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 
        'font-weight', 'text-anchor', 'dominant-baseline', 'color'
      ];
      
      criticalStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'initial' && value !== 'inherit') {
          (clonedEl as HTMLElement).style.setProperty(prop, value);
        }
      });
    }
  });
  
  // Ensure proper viewBox and dimensions
  try {
    const bbox = (svg as SVGGraphicsElement).getBBox();
    if (!clonedSvg.getAttribute('viewBox') && bbox && bbox.width > 0 && bbox.height > 0) {
      clonedSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }
    
    // Set explicit width and height if not present
    if (!clonedSvg.getAttribute('width') && bbox && bbox.width > 0) {
      clonedSvg.setAttribute('width', bbox.width.toString());
    }
    if (!clonedSvg.getAttribute('height') && bbox && bbox.height > 0) {
      clonedSvg.setAttribute('height', bbox.height.toString());
    }
  } catch (error) {
    // getBBox might fail in some cases, use fallback dimensions
    console.warn('Could not get SVG bounding box, using fallback dimensions:', error);
    if (!clonedSvg.getAttribute('viewBox')) {
      clonedSvg.setAttribute('viewBox', '0 0 800 600');
    }
    if (!clonedSvg.getAttribute('width')) {
      clonedSvg.setAttribute('width', '800');
    }
    if (!clonedSvg.getAttribute('height')) {
      clonedSvg.setAttribute('height', '600');
    }
  }
  
  return new XMLSerializer().serializeToString(clonedSvg);
}

/**
 * Convert SVG to PNG using canvas
 */
async function svgToPng(svgString: string, options: { quality?: number; scale?: number } = {}): Promise<Blob> {
  const { quality = 1, scale = 2 } = options;
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      try {
        // Set canvas size with scaling for better quality
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Set white background for PNG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create PNG blob'));
            }
          },
          'image/png',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load SVG image'));
    };
    
    // Create data URL from SVG string
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
    
    // Clean up URL after image loads or fails
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
 * Generate a filename with timestamp
 */
function generateFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Export diagram as SVG
 */
export async function exportAsSVG(options: Partial<ExportOptions> = {}): Promise<ExportResult> {
  try {
    // Validate export options
    const validationErrors = validateExportOptions(options);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Invalid export options: ${validationErrors.join(', ')}`
      };
    }

    // Check if export is supported
    const support = isExportSupported();
    if (!support.svg) {
      return {
        success: false,
        error: 'SVG export is not supported in this browser. Please try a different browser.'
      };
    }

    const svg = getRenderedSVG();
    if (!svg) {
      return {
        success: false,
        error: 'No diagram found to export. Please ensure a diagram is rendered in the preview panel.'
      };
    }
    
    const svgString = prepareSVGForExport(svg);
    const filename = options.filename || generateFilename('mermaid-diagram', 'svg');
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, filename);
    
    return {
      success: true,
      filename
    };
  } catch (error) {
    console.error('SVG export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during SVG export'
    };
  }
}

/**
 * Export diagram as PNG
 */
export async function exportAsPNG(options: Partial<ExportOptions> = {}): Promise<ExportResult> {
  try {
    // Validate export options
    const validationErrors = validateExportOptions(options);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Invalid export options: ${validationErrors.join(', ')}`
      };
    }

    // Check if export is supported
    const support = isExportSupported();
    if (!support.png) {
      return {
        success: false,
        error: 'PNG export is not supported in this browser. Please try SVG export instead.'
      };
    }

    const svg = getRenderedSVG();
    if (!svg) {
      return {
        success: false,
        error: 'No diagram found to export. Please ensure a diagram is rendered in the preview panel.'
      };
    }
    
    const svgString = prepareSVGForExport(svg);
    const filename = options.filename || generateFilename('mermaid-diagram', 'png');
    
    const pngBlob = await svgToPng(svgString, {
      quality: options.quality || 1,
      scale: options.scale || 2
    });
    
    downloadBlob(pngBlob, filename);
    
    return {
      success: true,
      filename
    };
  } catch (error) {
    console.error('PNG export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during PNG export'
    };
  }
}

/**
 * Copy Mermaid code to clipboard
 */
export async function copyMermaidCode(code: string): Promise<ExportResult> {
  try {
    // Validate input
    if (!code || typeof code !== 'string') {
      return {
        success: false,
        error: 'No content to copy. Please ensure there is content in the editor.'
      };
    }

    if (code.trim().length === 0) {
      return {
        success: false,
        error: 'Cannot copy empty content. Please add some content to the editor first.'
      };
    }

    // Check if clipboard is supported
    const support = isExportSupported();
    if (!support.clipboard) {
      return {
        success: false,
        error: 'Clipboard access is not supported in this browser or context.'
      };
    }

    // Use the existing clipboard utility
    const { copyToClipboard } = await import('./clipboard');
    await copyToClipboard(code);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy code to clipboard'
    };
  }
}

/**
 * Check if export functionality is supported
 */
export function isExportSupported(): {
  svg: boolean;
  png: boolean;
  clipboard: boolean;
} {
  const canvas = document.createElement('canvas');
  const canvasSupported = !!(canvas.getContext && canvas.getContext('2d'));
  
  return {
    svg: typeof XMLSerializer !== 'undefined' && typeof Blob !== 'undefined',
    png: canvasSupported && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
    clipboard: !!(navigator.clipboard || document.execCommand)
  };
}

/**
 * Validate export options
 */
export function validateExportOptions(options: Partial<ExportOptions>): string[] {
  const errors: string[] = [];
  
  if (options.quality !== undefined) {
    if (typeof options.quality !== 'number' || options.quality < 0 || options.quality > 1) {
      errors.push('Quality must be a number between 0 and 1');
    }
  }
  
  if (options.scale !== undefined) {
    if (typeof options.scale !== 'number' || options.scale < 1 || options.scale > 4) {
      errors.push('Scale must be a number between 1 and 4');
    }
  }
  
  if (options.filename !== undefined) {
    if (typeof options.filename !== 'string' || options.filename.trim().length === 0) {
      errors.push('Filename must be a non-empty string');
    }
  }
  
  return errors;
}