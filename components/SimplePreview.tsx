"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { FiDownload } from 'react-icons/fi';

interface SimplePreviewProps {
  content: string;
  theme: "light" | "dark";
  onError: (error: string) => void;
  onSuccess: () => void;
  onDownloadPNG?: () => void;
  onDownloadSVG?: () => void;
  hasError?: boolean;
}

const SimplePreview = ({
  content,
  theme,
  onError,
  onSuccess,
  onDownloadPNG,
  onDownloadSVG,
  hasError = false,
}: SimplePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Define renderDiagram function with useCallback for proper dependency management
  const renderDiagram = useCallback(async () => {
    if (!containerRef.current || !isInitialized) {
      return;
    }

    // If content is empty, clear the container and show empty state
    if (!content.trim()) {
      containerRef.current.innerHTML = "";
      return;
    }

    const diagramContent = content.trim();
    setIsRendering(true);

    try {
      // Clear previous content
      containerRef.current.innerHTML = "";

      // Dynamic import to ensure Mermaid is available
      const mermaid = await import("mermaid");

      // Generate unique ID for this render
      const diagramId = `mermaid-diagram-${Date.now()}`;

      // Try to render the user's content first
      let renderResult;
      try {
        renderResult = await mermaid.default.render(
          diagramId,
          diagramContent
        );
        onSuccess();
      } catch (renderError) {
        // Report the error to the parent component for editor error handling
        const errorMessage = renderError instanceof Error ? renderError.message : "Syntax error in diagram";
        onError(errorMessage);
        return;
      }

      if (renderResult && renderResult.svg && containerRef.current) {
        containerRef.current.innerHTML = renderResult.svg;
        
        // Apply basic styling
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.maxWidth = "100%";
          svgElement.style.height = "auto";
          svgElement.style.display = "block";
          svgElement.style.margin = "0 auto";
        }
      } else {
        // If everything fails, show a simple placeholder
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full p-6">
            <div class="text-center text-muted-foreground">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p class="text-sm">Diagram preview</p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      // If everything fails, show a simple placeholder
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full p-6">
            <div class="text-center text-muted-foreground">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p class="text-sm">Diagram preview</p>
            </div>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  }, [content, isInitialized, onSuccess, onError]);

  // Initialize Mermaid properly on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeMermaid = async () => {
      try {
        // Wait for Mermaid to be available
        if (typeof window !== "undefined") {
          // Dynamic import to ensure Mermaid is loaded
          const mermaid = await import("mermaid");

          if (isMounted) {
            // Initialize with Vercel theme config
            mermaid.default.initialize({
              theme: theme === "dark" ? "dark" : "default",
              startOnLoad: false,
              securityLevel: "loose",
              fontFamily: "Arial, sans-serif",
              fontSize: 10,
              themeVariables: {
                fontFamily: "Arial, sans-serif",
                fontSize: "10px",
                primaryColor: theme === "dark" ? "#0070f3" : "#0366d6",
                primaryTextColor: theme === "dark" ? "#ffffff" : "#24292e",
                primaryBorderColor: theme === "dark" ? "#1a1a1a" : "#d0d7de",
                lineColor: theme === "dark" ? "#666666" : "#6a737d",
                secondaryColor: theme === "dark" ? "#0a0a0a" : "#f6f8fa",
                tertiaryColor: theme === "dark" ? "#000000" : "#ffffff"
              }
            });

            setIsInitialized(true);
          }
        }
      } catch (error) {
        // Suppress initialization errors completely
        if (isMounted) {
          // Silently fail - don't call onError
          console.warn("Mermaid initialization failed, but continuing silently");
        }
      }
    };

    initializeMermaid();

    return () => {
      isMounted = false;
    };
  }, [theme, onError]);

  // Re-initialize when theme changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      import("mermaid").then((mermaid) => {
        // Clear any existing diagrams first
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        
        mermaid.default.initialize({
          theme: theme === "dark" ? "dark" : "default",
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "Arial, sans-serif",
          fontSize: 10,
          themeVariables: {
            fontFamily: "Arial, sans-serif",
            fontSize: "10px",
            primaryColor: theme === "dark" ? "#0070f3" : "#0070f3",
            primaryTextColor: theme === "dark" ? "#ffffff" : "#000000",
            primaryBorderColor: theme === "dark" ? "#1a1a1a" : "#eaeaea",
            lineColor: theme === "dark" ? "#666666" : "#666666",
            secondaryColor: theme === "dark" ? "#0a0a0a" : "#fafafa",
            tertiaryColor: theme === "dark" ? "#000000" : "#ffffff"
          }
        });
      });
    }
  }, [theme, isInitialized]);

  // Re-render diagram when theme changes
  useEffect(() => {
    if (isInitialized && content.trim()) {
      const timeoutId = setTimeout(() => {
        renderDiagram();
      }, 100); // Small delay to ensure theme is applied
      
      return () => clearTimeout(timeoutId);
    }
  }, [theme, isInitialized, content, renderDiagram]);


  // Render diagram with simple debounced rendering (300ms delay)
  useEffect(() => {
    if (!isInitialized || !containerRef.current) {
      return;
    }

    // If content is empty, clear immediately without debounce
    if (!content.trim()) {
      containerRef.current.innerHTML = "";
      return;
    }

    // Simple debounce for content changes
    const debounceTimer = setTimeout(async () => {
      await renderDiagram();
    }, 300);

    // Ensure proper cleanup of timer
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [content, isInitialized, renderDiagram]);


  return (
    <div className="h-full flex flex-col">
      <div className="panel-header preview-header">
        <div className="panel-title">Preview</div>
        <div className="panel-actions">
          {isRendering && (
            <svg
              className="animate-spin w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {onDownloadPNG && !hasError && (
            <button className="icon-btn" title="Download PNG" aria-label="Download PNG" onClick={onDownloadPNG}>
              <div className="flex items-center gap-1">
                <FiDownload size={16} />
                <span className="text-xs">PNG</span>
              </div>
            </button>
          )}
          {onDownloadSVG && !hasError && (
            <button className="icon-btn" title="Download SVG" aria-label="Download SVG" onClick={onDownloadSVG}>
              <div className="flex items-center gap-1">
                <FiDownload size={16} />
                <span className="text-xs">SVG</span>
              </div>
            </button>
          )}
        </div>
      </div>
      <div className="panel-body">
        <div className="preview" style={{ position: 'relative' }}>
          {isRendering && (
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface)',
              opacity: 0.95,
              zIndex: 10
            }}>
              <div style={{ textAlign: 'center' }}>
                <svg
                  className="animate-spin"
                  style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 auto 8px',
                    color: 'var(--accent)'
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  Rendering diagram...
                </p>
              </div>
            </div>
          )}
          {/* Empty state overlay - Only shows inside preview panel */}
          {!content.trim() && (
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface)',
              zIndex: 20
            }}>
              <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                <svg
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    opacity: 0.5
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <p style={{ fontSize: '14px' }}>
                  Start typing Mermaid syntax to see your diagram
                </p>
              </div>
            </div>
          )}
          {/* Error state overlay - Only shows inside preview panel */}
          {hasError && content.trim() && (
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface)',
              zIndex: 20
            }}>
              <div style={{ textAlign: 'center' }}>
                <svg
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    color: '#ff4444'
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
                <p style={{ fontSize: '14px', color: '#ff4444', fontWeight: 500 }}>Syntax error in diagram</p>
                <p style={{ fontSize: '12px', color: '#ff6666', marginTop: '4px' }}>Check your Mermaid syntax</p>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
              padding: '16px',
              overflow: 'auto',
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              lineHeight: "1.4"
            }}
            data-testid="mermaid-preview-container"
          />
        </div>
      </div>
    </div>
  );
};

export default SimplePreview;
