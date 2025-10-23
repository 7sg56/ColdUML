'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { usePreviewState } from './AppStateProvider';
import { handleError, validateMermaidSyntax, withErrorHandling } from '@/lib/error-handling';
import ErrorDisplay from './ErrorDisplay';
import LoadingIndicator from './LoadingIndicator';

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
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ReturnType<typeof handleError> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  // Use centralized state management for loading state
  const { isLoading, setIsLoading } = usePreviewState();

  // Initialize Mermaid with theme configuration
  const initializeMermaid = useCallback(() => {
    // Import ThemeManager for centralized theme configuration
    import('@/lib/app-state').then(({ ThemeManager }) => {
      // Ensure fonts are loaded before initializing Mermaid
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          // Fonts are loaded, safe to initialize
        });
      }
      
      // Use centralized theme configuration
      const mermaidConfig = ThemeManager.getMermaidThemeConfig(theme);
      // Initialize with proper type handling
      mermaid.initialize(mermaidConfig as Parameters<typeof mermaid.initialize>[0]);
      
      setIsInitialized(true);
    });
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
    setErrorDetails(null);

    // Validate syntax before rendering
    const validation = validateMermaidSyntax(mermaidCode);
    setValidationWarnings(validation.warnings);

    if (!validation.isValid) {
      const syntaxError = handleError(validation.errors.join('; '), {
        content: mermaidCode,
        operation: 'syntax-validation'
      });
      setErrorDetails(syntaxError);
      setError(syntaxError.message);
      setIsLoading(false);
      onRenderError?.(syntaxError.message);
      return;
    }

    const result = await withErrorHandling(async () => {
        // Clear previous content
        containerRef.current!.innerHTML = '';

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
        containerRef.current!.innerHTML = svg;
      
        // Apply theme-specific styling and fix text truncation issues
        const svgElement = containerRef.current!.querySelector('svg');
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
    }, {
      content: mermaidCode,
      operation: 'mermaid-render',
      diagramType: 'class'
    });

    if (result.success) {
      setIsLoading(false);
    } else {
      const errorDetails = result.error!;
      setErrorDetails(errorDetails);
      setError(errorDetails.message);
      onRenderError?.(errorDetails.message);
      setIsLoading(false);
    }
  }, [mermaidCode, isInitialized, onRenderError, onRenderSuccess, setIsLoading]);

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
    <div className="h-full flex flex-col panel-container mobile-panel-height">
      {/* Header */}
      <div className="panel-header">
        <h2 className="text-sm font-medium text-muted-foreground">
          <span className="hidden sm:inline">Diagram Preview</span>
          <span className="sm:hidden">Preview</span>
        </h2>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center text-xs text-muted-foreground">
              <svg className="loading-spinner -ml-1 mr-1 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Rendering...</span>
              <span className="sm:hidden">...</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </div>
      </div>

      {/* Preview Content */}
      <div className="panel-content">
        {errorDetails ? (
          <div className="p-4">
            <ErrorDisplay
              error={errorDetails}
              onRetry={() => renderDiagram()}
              compact={false}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingIndicator 
              size="md" 
              message="Rendering diagram..." 
              delay={100}
            />
          </div>
        ) : (
          <div 
            ref={containerRef}
            data-testid="preview-container"
            className="min-h-full p-2 sm:p-4"
            style={{
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? '14px' : '16px', // Responsive font size
              lineHeight: '1.5'
            }}
          />
        )}
        
        {/* Validation Warnings */}
        {validationWarnings.length > 0 && !errorDetails && (
          <div className="p-2 border-t border-panel-border">
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              <div className="flex items-center gap-1 mb-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">Warnings:</span>
              </div>
              {validationWarnings.slice(0, 2).map((warning, index) => (
                <div key={index} className="text-xs ml-4">• {warning}</div>
              ))}
              {validationWarnings.length > 2 && (
                <div className="text-xs ml-4">• ... and {validationWarnings.length - 2} more</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {(error || isLoading) && (
        <div className="flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 border-t border-panel-border bg-panel-background">
          <div className="flex items-center text-xs">
            {isLoading && (
              <span className="text-blue-600 dark:text-blue-400">
                <span className="hidden sm:inline">Rendering diagram...</span>
                <span className="sm:hidden">Rendering...</span>
              </span>
            )}
            {error && (
              <span className="text-red-600 dark:text-red-400">
                <span className="hidden sm:inline">Syntax error detected</span>
                <span className="sm:hidden">Error</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;