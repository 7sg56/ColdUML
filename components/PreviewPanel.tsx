'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

interface PreviewPanelProps {
  mermaidCode: string;
  theme: 'light' | 'dark';
  onRenderError?: (error: string) => void;
  onRenderSuccess?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  mermaidCode,
  theme,
  onRenderError,
  onRenderSuccess
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Mermaid with theme configuration
  const initializeMermaid = useCallback(() => {
    const mermaidTheme = theme === 'dark' ? 'dark' : 'default';
    
    // Ensure fonts are loaded before initializing Mermaid
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Fonts are loaded, safe to initialize
      });
    }
    
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      themeVariables: {
        // Light theme variables
        ...(theme === 'light' && {
          primaryColor: '#2563eb',
          primaryTextColor: '#0f172a',
          primaryBorderColor: '#e2e8f0',
          lineColor: '#94a3b8',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#f8fafc',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f8fafc',
          tertiaryBkg: '#f1f5f9',
          secondaryBorderColor: '#cbd5e1',
          tertiaryBorderColor: '#94a3b8',
          secondaryTextColor: '#475569',
          tertiaryTextColor: '#64748b',
          textColor: '#0f172a'
        }),
        // Dark theme variables
        ...(theme === 'dark' && {
          primaryColor: '#3b82f6',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#334155',
          lineColor: '#64748b',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          background: '#0a0a0a',
          mainBkg: '#0f172a',
          secondBkg: '#1e293b',
          tertiaryBkg: '#334155',
          secondaryBorderColor: '#475569',
          tertiaryBorderColor: '#64748b',
          secondaryTextColor: '#cbd5e1',
          tertiaryTextColor: '#94a3b8',
          textColor: '#f8fafc'
        })
      },
      classDiagram: {
        htmlLabels: false,
        curve: 'basis'
      },
      flowchart: {
        htmlLabels: false,
        curve: 'basis'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: 16,
      logLevel: 'error',
      securityLevel: 'loose',
      deterministicIds: true,
      deterministicIDSeed: 'mermaid-uml-editor',
      // Force Mermaid to use proper text measurement
      wrap: true,
      maxTextSize: 90000,
      // Ensure proper SVG rendering
      htmlLabels: false
    });
    
    setIsInitialized(true);
  }, [theme]);

  // Initialize Mermaid on mount and theme change
  useEffect(() => {
    initializeMermaid();
  }, [initializeMermaid]);

  // Render Mermaid diagram
  const renderDiagram = useCallback(async () => {
    if (!containerRef.current || !isInitialized || !mermaidCode.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';

      // Generate unique ID for this render
      const diagramId = `mermaid-diagram-${Date.now()}`;
      
      // Create a temporary container for proper font measurement
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
      tempContainer.style.fontSize = '16px';
      document.body.appendChild(tempContainer);
      
      // Validate and render the diagram
      const { svg } = await mermaid.render(diagramId, mermaidCode);
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Insert the rendered SVG
      containerRef.current.innerHTML = svg;
      
      // Apply theme-specific styling and fix text truncation issues
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.display = 'block';
        svgElement.style.margin = '0 auto';
        svgElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        
        // Fix text elements to prevent truncation
        const textElements = svgElement.querySelectorAll('text, tspan');
        textElements.forEach((textEl) => {
          const element = textEl as SVGTextElement;
          element.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
          element.style.fontSize = '14px';
          
          // Ensure text is properly sized and not truncated
          if (element.textContent && element.textContent.length > 0) {
            try {
              // Add some padding to prevent truncation
              const bbox = element.getBBox();
              if (bbox.width > 0 && bbox.width < 1000) { // Sanity check
                // Don't force textLength as it can cause issues, just ensure proper styling
                element.removeAttribute('textLength');
                element.removeAttribute('lengthAdjust');
              }
            } catch (e) {
              // getBBox might fail in some cases, ignore and continue
              console.warn('Could not get text bounding box:', e);
            }
          }
        });
        
        // Ensure rectangles have minimum width for text
        const rectElements = svgElement.querySelectorAll('rect');
        rectElements.forEach((rectEl) => {
          const rect = rectEl as SVGRectElement;
          const currentWidth = parseFloat(rect.getAttribute('width') || '0');
          if (currentWidth > 0 && currentWidth < 100) {
            // Ensure minimum width for class boxes
            rect.setAttribute('width', Math.max(currentWidth, 120).toString());
          }
        });
        
        // Ensure proper background for the diagram
        svgElement.style.backgroundColor = 'transparent';
        
        // Force a reflow to ensure proper rendering
        svgElement.style.display = 'none';
        // Trigger reflow
        void svgElement.getBoundingClientRect();
        svgElement.style.display = 'block';
      }

      onRenderSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown rendering error';
      setError(errorMessage);
      onRenderError?.(errorMessage);
      
      // Display user-friendly error message
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full text-center p-6">
            <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Diagram Syntax Error
              </h3>
              <p class="text-sm text-red-600 dark:text-red-300 mb-2">
                There's an issue with your Mermaid syntax:
              </p>
              <code class="text-xs text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                ${errorMessage}
              </code>
            </div>
            <p class="text-sm text-muted-foreground">
              Please check your diagram syntax and try again.
            </p>
          </div>
        `;
      }
    } finally {
      setIsLoading(false);
    }
  }, [mermaidCode, isInitialized, theme, onRenderError, onRenderSuccess]);

  // Debounced rendering effect
  useEffect(() => {
    if (!mermaidCode.trim()) {
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full text-center p-6">
            <div class="text-muted-foreground">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p class="text-sm">Start typing Mermaid syntax to see your diagram</p>
            </div>
          </div>
        `;
      }
      return;
    }

    // Clear existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Set new timeout for debounced rendering
    renderTimeoutRef.current = setTimeout(() => {
      renderDiagram();
    }, 500); // 500ms debounce for rendering

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [mermaidCode, renderDiagram]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-preview-background">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-panel-border bg-panel-background">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Diagram Preview</h2>
          {isLoading && (
            <div className="flex items-center text-xs text-muted-foreground">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Rendering...
            </div>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto">
        <div 
          ref={containerRef}
          className="min-h-full p-4"
          style={{
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '16px',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* Status Bar */}
      {(error || isLoading) && (
        <div className="flex-shrink-0 px-3 py-2 border-t border-panel-border bg-panel-background">
          <div className="flex items-center text-xs">
            {isLoading && (
              <span className="text-blue-600 dark:text-blue-400">
                Rendering diagram...
              </span>
            )}
            {error && (
              <span className="text-red-600 dark:text-red-400">
                Syntax error detected
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;