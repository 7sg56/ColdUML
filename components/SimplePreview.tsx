"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SimplePreviewProps {
  content: string;
  theme: "light" | "dark";
  onError: (error: string) => void;
  onSuccess: () => void;
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
}: SimplePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

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
            // Initialize with optimized config for better font rendering
            mermaid.default.initialize({
              theme: theme === "dark" ? "dark" : "default",
              startOnLoad: false,
              securityLevel: "loose",
              fontFamily: "Arial, sans-serif",
              fontSize: 10,
              themeVariables: {
                fontFamily: "Arial, sans-serif",
                fontSize: "10px"
              }
            });

            setIsInitialized(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          onError("Failed to initialize diagram renderer");
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
        mermaid.default.initialize({
          theme: theme === "dark" ? "dark" : "default",
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "Arial, sans-serif",
          fontSize: 10,
          themeVariables: {
            fontFamily: "Arial, sans-serif",
            fontSize: "10px"
          }
        });
      });
    }
  }, [theme, isInitialized]);

  // Define renderDiagram function with useCallback for proper dependency management
  const renderDiagram = useCallback(async () => {
    if (!containerRef.current || !isInitialized) {
      return;
    }

    const diagramContent = content.trim() || DEFAULT_UML_CONTENT;

    setIsRendering(true);

    try {
      // Clear previous content
      containerRef.current.innerHTML = "";

      // Dynamic import to ensure Mermaid is available
      const mermaid = await import("mermaid");

      // Generate unique ID for this render
      const diagramId = `mermaid-diagram-${Date.now()}`;

      // Render the diagram
      const renderResult = await mermaid.default.render(
        diagramId,
        diagramContent
      );

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

        onSuccess();
      } else {
        throw new Error("Mermaid render returned empty result");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to render diagram";
      onError(errorMessage);

      // Show simple error message in container
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full p-6">
            <div class="text-center text-red-600">
              <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <p class="text-sm font-medium">Diagram Error</p>
              <p class="text-xs mt-1 text-gray-600">${errorMessage}</p>
              <p class="text-xs mt-2 text-gray-500">Check your Mermaid syntax and try again.</p>
            </div>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  }, [content, isInitialized, onError, onSuccess]);

  // Render diagram with simple debounced rendering (300ms delay)
  useEffect(() => {
    if (!isInitialized || !containerRef.current) {
      return;
    }

    // Simple debounce for content changes - no complex performance monitoring
    const debounceTimer = setTimeout(async () => {
      await renderDiagram();
    }, 300);

    // Ensure proper cleanup of timer
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [content, isInitialized, renderDiagram]);

  // Show empty state when no content
  if (!content.trim()) {
    return (
      <div className="h-full flex flex-col bg-panel-background">
        <div className="flex items-center justify-between p-3 border-b border-panel-border bg-header-background">
          <span className="text-sm font-medium text-muted-foreground">
            Preview
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {theme === "dark" ? "🌙" : "☀️"}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
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
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-panel-background">
      <div className="flex items-center justify-between p-3 border-b border-panel-border bg-header-background">
        <span className="text-sm font-medium text-muted-foreground">
          Preview
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
          {theme === "dark" ? "🌙" : "☀️"}
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
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
        <div
          ref={containerRef}
          className="w-full h-full p-4 overflow-auto bg-preview-background"
          data-testid="mermaid-preview-container"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            lineHeight: "1.4",
          }}
        />
      </div>
    </div>
  );
};

export default SimplePreview;
