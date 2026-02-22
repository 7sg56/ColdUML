"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { FiDownload, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import PreviewOverlay from "./PreviewOverlay";
import LoadingSpinner from "./LoadingSpinner";

interface SimplePreviewProps {
  content: string;
  theme: "light" | "dark";
  onError: (error: string) => void;
  onSuccess: () => void;
  onDownloadPNG?: () => void;
  onDownloadSVG?: () => void;
  errorMessage?: string | null;
}

const SimplePreview = ({
  content,
  theme,
  onError,
  onSuccess,
  onDownloadPNG,
  onDownloadSVG,
  errorMessage = null,
}: SimplePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [systemError, setSystemError] = useState(false);

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
    setSystemError(false);

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
        setSystemError(true);
      }
    } catch {
      // If everything fails, show a simple placeholder
      setSystemError(true);
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
      } catch {
        // Suppress initialization errors completely
        if (isMounted) {
          // Silently fail - don't call onError
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
             <LoadingSpinner className="w-4 h-4" />
          )}
          {onDownloadPNG && !errorMessage && (
            <button className="icon-btn" title="Download PNG" aria-label="Download PNG" onClick={onDownloadPNG}>
              <div className="flex items-center gap-1">
                <FiDownload size={16} />
                <span className="text-xs">PNG</span>
              </div>
            </button>
          )}
          {onDownloadSVG && !errorMessage && (
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
        <div className="preview relative">
          {isRendering && (
            <PreviewOverlay className="opacity-95 z-10">
              <div className="text-center">
                <LoadingSpinner className="w-8 h-8 mx-auto mb-2 text-[var(--accent)]" />
                <p className="text-sm text-[var(--muted)]">
                  Rendering diagram...
                </p>
              </div>
            </PreviewOverlay>
          )}
          {/* Empty state overlay - Only shows inside preview panel */}
          {!content.trim() && (
            <PreviewOverlay className="z-20">
              <div className="text-center text-[var(--muted)]">
                <FiFileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Start typing Mermaid syntax to see your diagram
                </p>
              </div>
            </PreviewOverlay>
          )}
          {/* System Error overlay */}
          {systemError && (
             <PreviewOverlay className="z-20">
               <div className="text-center text-[var(--muted)]">
                 <FiFileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                 <p className="text-sm">Diagram preview</p>
               </div>
             </PreviewOverlay>
          )}
          {/* Error state overlay - Only shows inside preview panel */}
          {errorMessage && content.trim() && (
            <PreviewOverlay className="z-20">
              <div className="text-center max-w-[80%] px-5">
                <FiAlertTriangle className="w-16 h-16 mx-auto mb-4 text-[#ff4444]" />
                <p className="text-sm font-medium text-[#ff4444]">Syntax error in diagram</p>
                <p className="text-xs text-[#ff6666] mt-1">{errorMessage}</p>
              </div>
            </PreviewOverlay>
          )}
          <div
            ref={containerRef}
            className="w-full h-full p-4 overflow-auto font-sans text-xs leading-[1.4]"
            data-testid="mermaid-preview-container"
          />
        </div>
      </div>
    </div>
  );
};

export default SimplePreview;
