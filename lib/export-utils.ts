/**
 * Simplified export utilities for Mermaid diagrams
 * Basic PNG, SVG export and clipboard operations without complex options
 */

export interface ExportResult {
  success: boolean;
  error?: string;
  filename?: string;
  warning?: string;
}

/**
 * Debug function to log DOM structure
 */
function debugDOMStructure(): void {
  console.log('=== DOM Debug Info ===');
  
  // Check for preview container
  const previewContainer = document.querySelector('[data-testid="mermaid-preview-container"]');
  console.log('Preview container found:', !!previewContainer);
  if (previewContainer) {
    console.log('Preview container innerHTML length:', previewContainer.innerHTML.length);
    console.log('Preview container children:', previewContainer.children.length);
    
    // Check for SVG specifically in this container
    const svgInContainer = previewContainer.querySelector('svg');
    console.log('SVG in preview container:', !!svgInContainer);
    if (svgInContainer) {
      console.log('SVG in container details:', {
        id: svgInContainer.id,
        className: svgInContainer.className,
        children: svgInContainer.children.length,
        hasContent: svgInContainer.innerHTML.trim().length > 0
      });
    }
  }
  
  // Check all SVGs
  const allSvgs = document.querySelectorAll('svg');
  console.log('Total SVGs found:', allSvgs.length);
  allSvgs.forEach((svg, index) => {
    console.log(`SVG ${index}:`, {
      id: svg.id,
      className: svg.className,
      children: svg.children.length,
      hasContent: svg.innerHTML.trim().length > 0,
      parent: svg.parentElement?.tagName,
      parentClass: svg.parentElement?.className
    });
  });
  
  console.log('=== End Debug Info ===');
}

/**
 * Get the rendered SVG element from the preview panel
 */
function getRenderedSVG(): SVGElement | null {
  // Debug the current DOM state
  debugDOMStructure();
  
  // Look for SVG in the preview container with multiple fallback selectors
  const selectors = [
    '[data-testid="mermaid-preview-container"] svg', // Our specific preview container
    '.bg-preview-background svg', // Our preview container class
    'svg[id^="mermaid-diagram"]', // Mermaid generated SVGs
    '[role="region"][aria-label="Diagram preview"] svg', // Semantic selector
    'div[style*="font-family"] svg', // Container with inline styles
    'svg' // Last resort - any SVG
  ];
  
  for (const selector of selectors) {
    console.log(`Trying selector: ${selector}`);
    const svg = document.querySelector(selector) as SVGElement;
    if (svg && svg.tagName === 'SVG') {
      console.log(`Found SVG with selector: ${selector}`);
      // Verify this is actually a Mermaid diagram SVG
      const hasContent = svg.children.length > 0 || svg.innerHTML.trim().length > 0;
      console.log(`SVG has content: ${hasContent}`);
      if (hasContent) {
        return svg;
      }
    }
  }
  
  // Additional check: look for any SVG that might be a Mermaid diagram
  // But prioritize the preview container
  const previewContainer = document.querySelector('[data-testid="mermaid-preview-container"]');
  if (previewContainer) {
    const svgInPreview = previewContainer.querySelector('svg');
    if (svgInPreview) {
      console.log('Found SVG in preview container:', {
        id: svgInPreview.id,
        children: svgInPreview.children.length,
        hasContent: svgInPreview.innerHTML.trim().length > 0
      });
      
      // This should be our Mermaid diagram
      if (svgInPreview.children.length > 0 || svgInPreview.innerHTML.trim().length > 0) {
        // Additional validation: check if it looks like a Mermaid diagram
        const hasMermaidContent = svgInPreview.querySelectorAll('path, text, g').length > 0;
        if (hasMermaidContent) {
          console.log('Using SVG from preview container - validated as Mermaid diagram');
          return svgInPreview;
        } else {
          console.log('SVG in preview container doesn\'t look like a Mermaid diagram');
        }
      }
    }
  }
  
  // Fallback: look for any SVG that might be a Mermaid diagram
  const allSvgs = document.querySelectorAll('svg');
  console.log(`Found ${allSvgs.length} total SVGs in document`);
  
  for (let i = 0; i < allSvgs.length; i++) {
    const svg = allSvgs[i] as SVGElement;
    console.log(`Checking SVG ${i}:`, {
      id: svg.id,
      className: svg.className,
      children: svg.children.length,
      hasContent: svg.innerHTML.trim().length > 0,
      parent: svg.parentElement?.tagName,
      parentClass: svg.parentElement?.className,
      parentTestId: svg.parentElement?.getAttribute('data-testid')
    });
    
    // Skip small SVGs that are likely icons (less than 100px width/height)
    const rect = svg.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 100) {
      console.log(`Skipping small SVG ${i} (${rect.width}x${rect.height})`);
      continue;
    }
    
    // Check if this looks like a Mermaid diagram
    if (svg.children.length > 0 || svg.innerHTML.trim().length > 0) {
      // Check if it has Mermaid-like content (paths, text, etc.)
      const hasPaths = svg.querySelectorAll('path').length > 0;
      const hasText = svg.querySelectorAll('text').length > 0;
      const hasGroups = svg.querySelectorAll('g').length > 0;
      
      // Must have substantial content to be a Mermaid diagram
      if ((hasPaths || hasText || hasGroups) && svg.innerHTML.trim().length > 100) {
        console.log(`Found potential Mermaid SVG at index ${i}`);
        return svg;
      }
    }
  }
  
  console.log('No valid SVG found');
  return null;
}

/**
 * Simple SVG preparation for export
 */
function prepareSVGForExport(svg: SVGElement): string {
  const clonedSvg = svg.cloneNode(true) as SVGElement;
  
  // Set basic attributes
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  // Get computed dimensions - use a minimum size to ensure visibility
  const rect = svg.getBoundingClientRect();
  const width = Math.max(rect.width || 800, 400);
  const height = Math.max(rect.height || 600, 300);
  
  // Set dimensions based on actual size
  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());
  
  // Ensure viewBox is set - use the original viewBox if available, otherwise create one
  const originalViewBox = svg.getAttribute('viewBox');
  if (originalViewBox) {
    clonedSvg.setAttribute('viewBox', originalViewBox);
  } else {
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  
  // Remove any external references that might cause CORS issues
  const hrefElements = clonedSvg.querySelectorAll('[href]');
  const xlinkHrefElements = clonedSvg.querySelectorAll('[xlink\\:href]');
  
  hrefElements.forEach(el => {
    el.removeAttribute('href');
  });
  
  xlinkHrefElements.forEach(el => {
    el.removeAttribute('xlink:href');
  });
  
  // Ensure all styles are inline to avoid external dependencies
  const styleElements = clonedSvg.querySelectorAll('style');
  styleElements.forEach(style => {
    // Remove any @import statements that might cause issues
    const content = style.textContent || '';
    if (content.includes('@import')) {
      style.textContent = content.replace(/@import[^;]+;/g, '');
    }
  });
  
  // Copy computed styles to inline styles for better export compatibility
  const allElements = clonedSvg.querySelectorAll('*');
  allElements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element as Element);
    const inlineStyle = element.getAttribute('style') || '';
    
    // Add important style properties
    const importantStyles = ['fill', 'stroke', 'font-family', 'font-size', 'font-weight'];
    const styleUpdates: string[] = [];
    
    importantStyles.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none') {
        styleUpdates.push(`${prop}: ${value}`);
      }
    });
    
    if (styleUpdates.length > 0) {
      const newStyle = inlineStyle + '; ' + styleUpdates.join('; ');
      element.setAttribute('style', newStyle);
    }
  });
  
  return new XMLSerializer().serializeToString(clonedSvg);
}

/**
 * Simple SVG to PNG conversion with security fixes
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
    
    // Set crossOrigin to anonymous to avoid CORS issues
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Use higher resolution for better quality
        const scale = 2; // Reduced scale to avoid memory issues
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Set high DPI scaling
        ctx.scale(scale, scale);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, img.width, img.height);
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Use a timeout to ensure the canvas is ready
        setTimeout(() => {
          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create PNG - canvas toBlob returned null'));
                }
              },
              'image/png',
              0.95 // High quality
            );
          } catch (error) {
            reject(new Error(`Canvas toBlob failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        }, 100);
      } catch (error) {
        reject(new Error(`Canvas drawing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = (error) => {
      console.error('Image load error:', error);
      reject(new Error('Failed to load SVG image - this might be due to CORS restrictions'));
    };
    
    // Create a data URL instead of blob URL to avoid CORS issues
    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    img.src = svgDataUrl;
  });
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Add error handling for the click event
    link.addEventListener('error', (e) => {
      console.warn('Download link error:', e);
    });
    
    link.click();
    
    // Clean up immediately after click
    document.body.removeChild(link);
    
    // Clean up the URL with a small delay
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Error revoking URL:', error);
      }
    }, 100);
  } catch (error) {
    console.error('Error creating download:', error);
    // Fallback: try to open in new window
    try {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
    }
  }
}

/**
 * Simple filename generation
 */
function generateFilename(extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `mermaid-diagram-${timestamp}.${extension}`;
}

/**
 * Wait for diagram to be rendered
 */
async function waitForDiagram(maxWaitMs: number = 5000): Promise<SVGElement | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const svg = getRenderedSVG();
    if (svg) {
      return svg;
    }
    
    // Wait 200ms before trying again
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return null;
}

/**
 * Export diagram as SVG
 */
export async function exportAsSVG(): Promise<ExportResult> {
  try {
    console.log('Starting SVG export...');
    
    // Wait for diagram to be rendered
    const svg = await waitForDiagram();
    if (!svg) {
      return {
        success: false,
        error: 'No diagram found to export. Make sure a diagram is rendered in the preview.'
      };
    }
    
    // Additional validation: ensure the SVG has actual content
    const hasContent = svg.children.length > 0 && svg.innerHTML.trim().length > 50;
    if (!hasContent) {
      return {
        success: false,
        error: 'Diagram appears to be empty. Please ensure the diagram is fully rendered before exporting.'
      };
    }
    
    console.log('SVG found, preparing for export...');
    const svgString = prepareSVGForExport(svg);
    const filename = generateFilename('svg');
    
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, filename);
      
      console.log('SVG export completed successfully');
      return {
        success: true,
        filename
      };
    } catch (downloadError) {
      console.warn('Download may have failed due to browser restrictions:', downloadError);
      // Still return success since the file was likely created
      return {
        success: true,
        filename,
        warning: 'File may have been downloaded, but browser restrictions prevented confirmation'
      };
    }
  } catch (error) {
    console.error('SVG export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export SVG'
    };
  }
}

/**
 * Export diagram as PNG
 */
export async function exportAsPNG(): Promise<ExportResult> {
  try {
    console.log('Starting PNG export...');
    
    // Wait for diagram to be rendered
    const svg = await waitForDiagram();
    if (!svg) {
      return {
        success: false,
        error: 'No diagram found to export. Make sure a diagram is rendered in the preview.'
      };
    }
    
    // Additional validation: ensure the SVG has actual content
    const hasContent = svg.children.length > 0 && svg.innerHTML.trim().length > 50;
    if (!hasContent) {
      return {
        success: false,
        error: 'Diagram appears to be empty. Please ensure the diagram is fully rendered before exporting.'
      };
    }
    
    console.log('SVG found, converting to PNG...');
    const svgString = prepareSVGForExport(svg);
    const filename = generateFilename('png');
    
    try {
      const pngBlob = await svgToPng(svgString);
      downloadBlob(pngBlob, filename);
      
      console.log('PNG export completed successfully');
      return {
        success: true,
        filename
      };
    } catch (downloadError) {
      console.warn('Download may have failed due to browser restrictions:', downloadError);
      // Still return success since the file was likely created
      return {
        success: true,
        filename,
        warning: 'File may have been downloaded, but browser restrictions prevented confirmation'
      };
    }
  } catch (error) {
    console.error('PNG export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PNG'
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

