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

const DEFAULT_UML_CONTENT = `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }
    
    class Dog {
        +String breed
        +bark()
        +wagTail()
    }
    
    class Cat {
        +String color
        +meow()
        +purr()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`;

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
                primaryBorderColor: theme === "dark" ? "#2a2a2a" : "#d0d7de",
                lineColor: theme === "dark" ? "#888888" : "#6a737d",
                secondaryColor: theme === "dark" ? "#1a1a1a" : "#f6f8fa",
                tertiaryColor: theme === "dark" ? "#0a0a0a" : "#ffffff"
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
            primaryBorderColor: theme === "dark" ? "#333333" : "#eaeaea",
            lineColor: theme === "dark" ? "#666666" : "#666666",
            secondaryColor: theme === "dark" ? "#111111" : "#fafafa",
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
        <div className="preview">
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <svg
                  className="animate-spin w-8 h-8 mx-auto mb-2 text-primary"
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
                <p className="text-sm text-muted-foreground">
                  Rendering diagram...
                </p>
              </div>
            </div>
          )}
          {/* Empty state overlay */}
          {!content.trim() && (
            <div className="absolute inset-0 flex items-center justify-center bg-preview-background z-20">
              <div className="text-center text-muted-foreground">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
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
                <p className="text-sm">
                  Start typing Mermaid syntax to see your diagram
                </p>
              </div>
            </div>
          )}
          {/* Error state overlay */}
          {hasError && content.trim() && (
            <div className="absolute inset-0 flex items-center justify-center bg-preview-background z-20">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-red-500"
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
                <p className="text-sm text-red-600 font-medium">Syntax error in diagram</p>
                <p className="text-xs text-red-500 mt-1">Check your Mermaid syntax</p>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            className="w-full h-full p-4 overflow-auto"
            data-testid="mermaid-preview-container"
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SimplePreview;
