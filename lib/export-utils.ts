
export interface ExportResult {
  success: boolean;
  error?: string;
  filename?: string;
  warning?: string;
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
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {
        willReadFrequently: false,
        alpha: true
      });
      
      if (!ctx) {
        reject(new Error('Canvas not supported in this browser'));
        return;
      }
      
      const img = new Image();
      
      // Don't set crossOrigin for data URLs - it can cause issues
      // Data URLs are same-origin by definition
      
      img.onload = () => {
        try {
          // Validate image dimensions
          if (!img.width || !img.height || img.width === 0 || img.height === 0) {
            reject(new Error('Invalid image dimensions'));
            return;
          }
          
          // Use higher resolution for better quality
          const scale = 2; // Reduced scale to avoid memory issues
          const canvasWidth = img.width * scale;
          const canvasHeight = img.height * scale;
          
          // Set canvas dimensions
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
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
              // Wrap the callback to catch any errors
              const blobCallback = (blob: Blob | null) => {
                try {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to create PNG - canvas toBlob returned null. This may be due to browser security restrictions.'));
                  }
                } catch (callbackError) {
                  const errorMsg = callbackError instanceof Error ? callbackError.message : 'Unknown error';
                  reject(new Error(`PNG creation callback failed: ${errorMsg}`));
                }
              };

              try {
                canvas.toBlob(
                  blobCallback,
                  'image/png',
                  0.95 // High quality
                );
              } catch (toBlobError) {
                const errorMessage = toBlobError instanceof Error ? toBlobError.message : 'Unknown error';
                
                // Check if it's a NotAllowedError
                if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed')) {
                  reject(new Error('PNG conversion blocked by browser security settings. Please try exporting as SVG instead.'));
                } else {
                  reject(new Error(`Canvas toBlob failed: ${errorMessage}. This may be due to browser security restrictions.`));
                }
              }
            } catch (toBlobError) {
              const errorMessage = toBlobError instanceof Error ? toBlobError.message : 'Unknown error';
              reject(new Error(`Canvas toBlob failed: ${errorMessage}. This may be due to browser security restrictions.`));
            }
          }, 100);
        } catch (drawError) {
          const errorMessage = drawError instanceof Error ? drawError.message : 'Unknown error';
          reject(new Error(`Canvas drawing failed: ${errorMessage}`));
        }
      };
      
      img.onerror = (error) => {
        console.error('Image load error:', error);
        reject(new Error('Failed to load SVG image. This might be due to invalid SVG format or browser security restrictions.'));
      };
      
      // Create a data URL - for data URLs, we don't need crossOrigin
      try {
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        img.src = svgDataUrl;
      } catch {
        reject(new Error('Failed to encode SVG for conversion'));
      }
    } catch (setupError) {
      const errorMessage = setupError instanceof Error ? setupError.message : 'Unknown error';
      reject(new Error(`Failed to setup PNG conversion: ${errorMessage}`));
    }
  });
}

/**
 * Download a blob as a file
 * Returns a Promise that resolves on success or rejects on error
 */
function downloadBlob(blob: Blob, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Safely create object URL with error handling
      let url: string;
      try {
        url = URL.createObjectURL(blob);
      } catch (urlError) {
        const errorMsg = urlError instanceof Error ? urlError.message : 'Failed to create object URL';
        console.error('Failed to create object URL:', errorMsg);
        reject(new Error(`Unable to create download URL: ${errorMsg}`));
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      link.setAttribute('download', filename);
      
      // Append to body
      try {
        document.body.appendChild(link);
      } catch (appendError) {
        console.error('Failed to append link to body:', appendError);
        URL.revokeObjectURL(url);
        reject(new Error('Failed to prepare download link'));
        return;
      }

      // Cleanup function
      const cleanup = () => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Cleanup error (non-critical):', cleanupError);
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        try {
          // Trigger download using MouseEvent
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          try {
            link.dispatchEvent(clickEvent);
            
            // Clean up after a short delay
            setTimeout(() => {
              cleanup();
              resolve();
            }, 100);
          } catch {
            // Fallback: try direct click method
            try {
              link.click();
              setTimeout(() => {
                cleanup();
                resolve();
              }, 100);
            } catch {
              // Final fallback: open in new window
              try {
                const newWindow = window.open(url, '_blank');
                if (!newWindow) {
                  cleanup();
                  reject(new Error('Pop-up blocked. Please enable pop-ups for this site to download files.'));
                  return;
                }
                setTimeout(() => {
                  cleanup();
                  resolve();
                }, 2000);
              } catch (openError) {
                cleanup();
                const errorMsg = openError instanceof Error ? openError.message : 'Unknown error';
                console.error('All download methods failed:', errorMsg);
                
                // Check if it's a NotAllowedError
                if (errorMsg.includes('NotAllowedError') || errorMsg.includes('not allowed')) {
                  reject(new Error('Download blocked by browser security settings. Please check your browser permissions.'));
                } else {
                  reject(new Error(`Unable to download file: ${errorMsg}`));
                }
              }
            }
          }
        } catch (error) {
          cleanup();
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Download error:', errorMsg);
          
          if (errorMsg.includes('NotAllowedError') || errorMsg.includes('not allowed')) {
            reject(new Error('Download blocked by browser security settings. Please check your browser permissions.'));
          } else {
            reject(new Error(`Download failed: ${errorMsg}`));
          }
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating download link:', errorMsg);
      
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('not allowed')) {
        reject(new Error('Download blocked by browser security settings. Please check your browser permissions.'));
      } else {
        reject(new Error(`Unable to download file: ${errorMsg}`));
      }
    }
  });
}

/**
 * Simple filename generation
 */
function generateFilename(extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `mermaid-diagram-${timestamp}.${extension}`;
}

/**
 * Render diagram with light theme for export
 * This ensures all exports use a light/white background regardless of current theme
 */
async function renderDiagramForExport(mermaidContent: string): Promise<SVGElement | null> {
  try {
    // Create a temporary hidden container for export rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.height = '600px';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);

    try {
      // Import Mermaid
      const mermaid = await import('mermaid');
      
      // Initialize Mermaid with light theme for export
      mermaid.default.initialize({
        theme: 'default', // Always use light theme for exports
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        themeVariables: {
          // Base theme variables - consistent for all diagram types
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          background: '#ffffff', // Force white background
          primaryColor: '#0070f3',
          primaryTextColor: '#000000',
          primaryBorderColor: '#333333', // Dark border for visibility
          lineColor: '#333333', // Darker line color for better visibility on white
          secondaryColor: '#fafafa',
          tertiaryColor: '#ffffff',
          mainBkgColor: '#ffffff',
          secondBkgColor: '#fafafa',
          textColor: '#000000',
          border1: '#333333', // Dark border for visibility
          border2: '#333333', // Dark border for visibility
          secondaryBorderColor: '#333333',
          tertiaryBorderColor: '#333333',
          
          // Activity/Flowchart diagram variables
          defaultLinkColor: '#333333',
          edgeLabelBackground: '#ffffff',
          clusterBkg: '#ffffff',
          clusterBorder: '#333333',
          
          // Sequence diagram variables
          actorBorder: '#333333',
          actorBkg: '#ffffff',
          actorTextColor: '#000000',
          actorLineColor: '#333333',
          activationBorderColor: '#333333',
          activationBkgColor: '#ffffff',
          sequenceNumberColor: '#000000',
          
          // General diagram variables
          titleColor: '#000000',
          noteBkgColor: '#ffffff',
          noteBorderColor: '#333333',
          noteTextColor: '#000000'
        }
      });

      // Generate unique ID for this render
      const diagramId = `mermaid-export-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Render the diagram
      const renderResult = await mermaid.default.render(diagramId, mermaidContent.trim());

      if (renderResult && renderResult.svg) {
        // Insert the SVG into temp container
        tempContainer.innerHTML = renderResult.svg;
        
        // Get the SVG element
        const svgElement = tempContainer.querySelector('svg') as SVGElement;
        
        if (svgElement) {
          // Ensure white background is explicit in the SVG
          // Always add a white background rect at the beginning to ensure visibility
          const viewBox = svgElement.getAttribute('viewBox');
          const width = svgElement.getAttribute('width');
          const height = svgElement.getAttribute('height');
          
          if (viewBox) {
            const [x, y, w, h] = viewBox.split(' ').map(Number);
            // Remove any existing background rects
            const existingRects = svgElement.querySelectorAll('rect[fill*="white"], rect[fill="#ffffff"], rect[fill="#fff"]');
            existingRects.forEach(rect => {
              const parent = rect.parentNode;
              if (parent) {
                parent.removeChild(rect);
              }
            });
            
            // Add white background rect
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', x.toString());
            bgRect.setAttribute('y', y.toString());
            bgRect.setAttribute('width', w.toString());
            bgRect.setAttribute('height', h.toString());
            bgRect.setAttribute('fill', '#ffffff');
            bgRect.setAttribute('opacity', '1');
            bgRect.setAttribute('data-background', 'true'); // Mark as background so it's not normalized
            bgRect.style.pointerEvents = 'none';
            svgElement.insertBefore(bgRect, svgElement.firstChild);
          } else if (width && height) {
            // Fallback if no viewBox but has width/height
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', '0');
            bgRect.setAttribute('y', '0');
            bgRect.setAttribute('width', width);
            bgRect.setAttribute('height', height);
            bgRect.setAttribute('fill', '#ffffff');
            bgRect.setAttribute('opacity', '1');
            bgRect.setAttribute('data-background', 'true'); // Mark as background so it's not normalized
            bgRect.style.pointerEvents = 'none';
            svgElement.insertBefore(bgRect, svgElement.firstChild);
          }

          // Normalize all colors to be consistent across all diagram types
          // Use the same color palette from theme variables
          const lineColor = '#333333'; // Dark color for lines/borders - matches themeVariables
          const textColor = '#000000'; // Black text - matches themeVariables
          const fillColor = '#ffffff'; // White fill for shapes - matches themeVariables
          const invalidColors = ['none', 'transparent', '#ffffff', '#fff', 'white', 'context-fill', 'context-stroke'];
          
          // Normalize all paths (lines, arrows, connections) to use consistent stroke color
          const allPaths = svgElement.querySelectorAll('path');
          allPaths.forEach((path) => {
            const stroke = path.getAttribute('stroke');
            const fill = path.getAttribute('fill');
            const strokeWidth = path.getAttribute('stroke-width');
            
            // For paths that represent lines (fill is none or missing), normalize stroke
            if (fill === 'none' || !fill) {
              if (!stroke || invalidColors.includes(stroke)) {
                path.setAttribute('stroke', lineColor);
              }
              if (!strokeWidth || strokeWidth === '0') {
                path.setAttribute('stroke-width', '2');
              }
            } else {
              // For filled paths (shapes), ensure stroke is consistent if present
              if (stroke && stroke !== 'none' && invalidColors.includes(stroke)) {
                path.setAttribute('stroke', lineColor);
              }
            }
          });

          // Normalize all line elements
          const allLines = svgElement.querySelectorAll('line');
          allLines.forEach((line) => {
            const stroke = line.getAttribute('stroke');
            if (!stroke || invalidColors.includes(stroke)) {
              line.setAttribute('stroke', lineColor);
            }
            if (!line.getAttribute('stroke-width') || line.getAttribute('stroke-width') === '0') {
              line.setAttribute('stroke-width', '2');
            }
          });

          // Normalize all polylines
          const allPolylines = svgElement.querySelectorAll('polyline');
          allPolylines.forEach((polyline) => {
            const stroke = polyline.getAttribute('stroke');
            if (!stroke || invalidColors.includes(stroke)) {
              polyline.setAttribute('stroke', lineColor);
            }
            if (!polyline.getAttribute('stroke-width') || polyline.getAttribute('stroke-width') === '0') {
              polyline.setAttribute('stroke-width', '2');
            }
          });

          // Normalize polygons - ensure consistent stroke colors
          const allPolygons = svgElement.querySelectorAll('polygon');
          allPolygons.forEach((polygon) => {
            const stroke = polygon.getAttribute('stroke');
            if (stroke && stroke !== 'none' && invalidColors.includes(stroke)) {
              polygon.setAttribute('stroke', lineColor);
            }
            // Ensure filled polygons use consistent fill if not already set properly
            const fill = polygon.getAttribute('fill');
            if (fill && invalidColors.includes(fill)) {
              polygon.setAttribute('fill', fillColor);
            }
          });

          // Normalize rectangles - ensure consistent borders
          const allRects = svgElement.querySelectorAll('rect:not([data-background])');
          allRects.forEach((rect) => {
            const stroke = rect.getAttribute('stroke');
            if (stroke && stroke !== 'none' && invalidColors.includes(stroke)) {
              rect.setAttribute('stroke', lineColor);
            }
          });

          // Normalize circles and ellipses
          const allCircles = svgElement.querySelectorAll('circle, ellipse');
          allCircles.forEach((circle) => {
            const stroke = circle.getAttribute('stroke');
            if (stroke && stroke !== 'none' && invalidColors.includes(stroke)) {
              circle.setAttribute('stroke', lineColor);
            }
          });

          // Normalize edge paths (used in flowcharts/activity/class diagrams)
          const edgePaths = svgElement.querySelectorAll('.edgePath path, .flowchart-link path, .edge path, .relation path');
          edgePaths.forEach((path) => {
            const stroke = path.getAttribute('stroke');
            if (!stroke || invalidColors.includes(stroke)) {
              path.setAttribute('stroke', lineColor);
            }
            if (!path.getAttribute('stroke-width') || path.getAttribute('stroke-width') === '0') {
              path.setAttribute('stroke-width', '2');
            }
          });

          // Normalize arrow markers (arrowheads) to match line colors
          const markers = svgElement.querySelectorAll('marker');
          markers.forEach((marker) => {
            const markerPaths = marker.querySelectorAll('path');
            markerPaths.forEach((markerPath) => {
              const fill = markerPath.getAttribute('fill');
              const stroke = markerPath.getAttribute('stroke');
              
              // Arrow markers should match the line color
              if (!fill || invalidColors.includes(fill)) {
                markerPath.setAttribute('fill', lineColor);
              }
              if (stroke && stroke !== 'none' && invalidColors.includes(stroke)) {
                markerPath.setAttribute('stroke', lineColor);
              }
            });
            
            // Normalize polygon markers
            const markerPolygons = marker.querySelectorAll('polygon');
            markerPolygons.forEach((markerPolygon) => {
              const fill = markerPolygon.getAttribute('fill');
              if (!fill || invalidColors.includes(fill)) {
                markerPolygon.setAttribute('fill', lineColor);
              }
            });
          });

          // Normalize text colors for consistency
          const allText = svgElement.querySelectorAll('text, tspan');
          allText.forEach((text) => {
            const fill = text.getAttribute('fill');
            if (!fill || invalidColors.includes(fill) || fill === 'currentColor') {
              text.setAttribute('fill', textColor);
            }
          });

          // Clone the SVG before cleanup
          const clonedSvg = svgElement.cloneNode(true) as SVGElement;
          
          // Cleanup
          document.body.removeChild(tempContainer);
          
          return clonedSvg;
        }
      }

      // Cleanup on failure
      document.body.removeChild(tempContainer);
      return null;
    } catch (renderError) {
      console.error('Error rendering diagram for export:', renderError);
      // Cleanup on error
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      return null;
    }
  } catch (error) {
    console.error('Error in renderDiagramForExport:', error);
    return null;
  }
}

/**
 * Get Mermaid content from the editor
 */
function getMermaidContent(): string | null {
  // Try multiple methods to get the content
  // Method 1: Try to find Monaco editor's model content
  try {
    // Access Monaco editor instance via window (if available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithMonaco = window as any;
    const monacoEditor = windowWithMonaco.monaco?.editor;
    if (monacoEditor) {
      // Try to find the editor instance
      const editors = monacoEditor.getEditors();
      if (editors && editors.length > 0) {
        const model = editors[0]?.getModel();
        if (model) {
          return model.getValue();
        }
      }
    }
  } catch {
    // Ignore errors
  }

  // Method 2: Try to get from Monaco editor textarea (fallback)
  const editorTextarea = document.querySelector('.monaco-editor textarea[data-mprt="6"]') as HTMLTextAreaElement;
  if (!editorTextarea) {
    // Try alternative selector
    const altTextarea = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
    if (altTextarea && altTextarea.value) {
      return altTextarea.value;
    }
  } else if (editorTextarea.value) {
    return editorTextarea.value;
  }

  // Method 3: Try to get from any visible textarea in the editor container
  const editorContainer = document.querySelector('.monaco-editor-wrapper, .monaco-editor-container');
  if (editorContainer) {
    const textareas = editorContainer.querySelectorAll('textarea');
    for (const textarea of Array.from(textareas)) {
      if (textarea.value && textarea.value.trim()) {
        return textarea.value;
      }
    }
  }
  
  return null;
}

/**
 * Export diagram as SVG
 * Always exports with light theme for better visibility
 */
export async function exportAsSVG(mermaidContent?: string): Promise<ExportResult> {
  try {
    console.log('Starting SVG export with light theme...');
    
    // Get Mermaid content if not provided
    const content = mermaidContent || getMermaidContent();
    if (!content || !content.trim()) {
      return {
        success: false,
        error: 'No diagram content found to export. Please ensure the editor has valid Mermaid syntax.'
      };
    }
    
    // Render diagram with light theme for export
    const svg = await renderDiagramForExport(content.trim());
    if (!svg) {
      return {
        success: false,
        error: 'Failed to render diagram for export. Please check your Mermaid syntax and try again.'
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
    
    console.log('SVG rendered with light theme, preparing for export...');
    const svgString = prepareSVGForExport(svg);
    const filename = generateFilename('svg');
    
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      
      try {
        await downloadBlob(blob, filename);
        console.log('SVG export completed successfully');
        return {
          success: true,
          filename
        };
      } catch (downloadError) {
        // Check if it's a NotAllowedError or similar security error
        const errorMessage = downloadError instanceof Error ? downloadError.message : String(downloadError);
        console.warn('Download error:', downloadError);
        
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed')) {
          return {
            success: false,
            error: 'Download was blocked by browser security settings. Please check your browser permissions or try a different browser.'
          };
        }
        
        return {
          success: false,
          error: errorMessage || 'Download failed. Please try again.'
        };
      }
    } catch (blobError) {
      console.error('Failed to create blob:', blobError);
      return {
        success: false,
        error: 'Failed to prepare file for download. Please try again.'
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
 * Always exports with light theme for better visibility
 */
export async function exportAsPNG(mermaidContent?: string): Promise<ExportResult> {
  try {
    console.log('Starting PNG export with light theme...');
    
    // Get Mermaid content if not provided
    const content = mermaidContent || getMermaidContent();
    if (!content || !content.trim()) {
      return {
        success: false,
        error: 'No diagram content found to export. Please ensure the editor has valid Mermaid syntax.'
      };
    }
    
    // Render diagram with light theme for export
    const svg = await renderDiagramForExport(content.trim());
    if (!svg) {
      return {
        success: false,
        error: 'Failed to render diagram for export. Please check your Mermaid syntax and try again.'
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
    
    console.log('SVG rendered with light theme, converting to PNG...');
    const svgString = prepareSVGForExport(svg);
    const filename = generateFilename('png');
    
    try {
      const pngBlob = await svgToPng(svgString);
      
      try {
        await downloadBlob(pngBlob, filename);
        console.log('PNG export completed successfully');
        return {
          success: true,
          filename
        };
      } catch (downloadError) {
        // Check if it's a NotAllowedError or similar security error
        const errorMessage = downloadError instanceof Error ? downloadError.message : String(downloadError);
        console.warn('Download error:', downloadError);
        
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed')) {
          return {
            success: false,
            error: 'Download was blocked by browser security settings. Please check your browser permissions or try a different browser.'
          };
        }
        
        return {
          success: false,
          error: errorMessage || 'Download failed. Please try again.'
        };
      }
    } catch (conversionError) {
      console.error('PNG conversion error:', conversionError);
      const errorMessage = conversionError instanceof Error ? conversionError.message : String(conversionError);
      
      // Check if it's a security-related error
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed') || errorMessage.includes('security')) {
        return {
          success: false,
          error: 'PNG conversion was blocked by browser security settings. This may be due to canvas restrictions. Please try exporting as SVG instead.'
        };
      }
      
      return {
        success: false,
        error: `Failed to convert to PNG: ${errorMessage}`
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
  } catch {
    return {
      success: false,
      error: 'Failed to copy to clipboard'
    };
  }
}

