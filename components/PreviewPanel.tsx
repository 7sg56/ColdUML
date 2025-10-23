"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as mermaid from "mermaid";
import { usePreviewState } from "./AppStateProvider";
import {
  handleError,
  validateMermaidSyntax,
  withErrorHandling,
} from "@/lib/error-handling";
import ErrorDisplay from "./ErrorDisplay";

interface PreviewPanelProps {
  mermaidCode: string;
  theme: "light" | "dark";
  onRenderError?: (error: string) => void;
  onRenderSuccess?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  mermaidCode,
  theme,
  onRenderError,
  onRenderSuccess,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ReturnType<
    typeof handleError
  > | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Use centralized state management for loading state
  const { isLoading, setIsLoading } = usePreviewState();

  // Initialize Mermaid with theme configuration
  const initializeMermaid = useCallback(() => {
    console.log("Starting Mermaid initialization...");
    console.log("Mermaid object:", mermaid);
    console.log("Mermaid.default:", mermaid.default);
    
    // Just set as initialized immediately - let the render function handle the actual initialization
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
    setErrorDetails(null);

    // Validate syntax before rendering
    const validation = validateMermaidSyntax(mermaidCode);
    setValidationWarnings(validation.warnings);

    if (!validation.isValid) {
      const syntaxError = handleError(validation.errors.join("; "), {
        content: mermaidCode,
        operation: "syntax-validation",
      });
      setErrorDetails(syntaxError);
      setError(syntaxError.message);
      setIsLoading(false);
      onRenderError?.(syntaxError.message);
      return;
    }

    const result = await withErrorHandling(
      async () => {
        // Clear previous content
        containerRef.current!.innerHTML = "";

        // Generate unique ID for this render
        const diagramId = `mermaid-diagram-${Date.now()}`;

        // Create a temporary container for proper font measurement
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.visibility = "hidden";
        tempContainer.style.fontFamily =
          '"Helvetica Neue", Helvetica, Arial, sans-serif';
        tempContainer.style.fontSize = "16px";
        document.body.appendChild(tempContainer);

        try {
          // Ensure Mermaid is properly initialized before rendering
          if (!mermaid || !mermaid.default || typeof mermaid.default.render !== "function") {
            throw new Error("Mermaid is not properly initialized");
          }

          // Validate and render the diagram with additional error handling
          let renderResult;
          try {
            renderResult = await mermaid.default.render(diagramId, mermaidCode);
          } catch (mermaidError) {
            // Handle specific Mermaid errors that might be empty objects
            if (
              !mermaidError ||
              (typeof mermaidError === "object" &&
                Object.keys(mermaidError).length === 0) ||
              (mermaidError instanceof Error && !mermaidError.message)
            ) {
              throw new Error(
                "Mermaid syntax error detected. Please check your diagram syntax and ensure all class names, relationships, and brackets are properly formatted."
              );
            }
            
            // Handle error objects with no meaningful message
            if (mermaidError instanceof Error && mermaidError.message === "") {
              throw new Error(
                "Mermaid rendering failed - likely due to syntax error. Please verify your diagram structure."
              );
            }
            
            // Re-throw the original error if it has content
            throw mermaidError;
          }

          // Check if render result is valid
          if (!renderResult || !renderResult.svg) {
            throw new Error("Mermaid render returned empty result");
          }

          // Insert the rendered SVG
          containerRef.current!.innerHTML = renderResult.svg;
        } catch (renderError) {
          // Remove temporary container on error
          if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
          }

          // Handle empty error objects from Mermaid gracefully
          let errorMessage: string;
          let errorStack: string | undefined;

          if (renderError instanceof Error) {
            errorMessage = renderError.message || "Unknown error";
            errorStack = renderError.stack;
          } else if (typeof renderError === "string") {
            errorMessage = renderError;
          } else if (renderError && typeof renderError === "object") {
            // Handle error-like objects
            const errorObj = renderError as Record<string, unknown>;
            errorMessage = (typeof errorObj.message === "string" ? errorObj.message : String(errorObj)) || "Unknown error object";
            errorStack = typeof errorObj.stack === "string" ? errorObj.stack : undefined;
          } else {
            errorMessage = String(renderError) || "Unknown error";
          }

          // Only log meaningful error information to avoid console pollution
          if (errorMessage && errorMessage !== "undefined" && errorMessage !== "null" && errorMessage !== "" && errorMessage !== "[object Object]") {
            console.error("Mermaid render error:", {
              message: errorMessage,
              type: typeof renderError,
              stack: errorStack ? errorStack.split("\n").slice(0, 3).join("\n") : "No stack trace",
              codePreview: mermaidCode.substring(0, 100) + "...",
              diagramId: diagramId,
            });
          } else {
            // For empty error objects, just log a simple warning without the object
            console.warn("Mermaid render failed with empty error object - likely syntax issue");
          }

          // Re-throw with more context
          const renderErrorMessage =
            renderError instanceof Error
              ? renderError.message
              : "Unknown rendering error";
          throw new Error(`Diagram rendering failed: ${renderErrorMessage}`);
        }

        // Remove temporary container on success
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }

        // Apply theme-specific styling and fix text truncation issues
        const svgElement = containerRef.current!.querySelector("svg");
        if (svgElement) {
          svgElement.style.maxWidth = "100%";
          svgElement.style.height = "auto";
          svgElement.style.display = "block";
          svgElement.style.margin = "0 auto";
          svgElement.style.fontFamily =
            '"Helvetica Neue", Helvetica, Arial, sans-serif';

          // Fix text elements to prevent truncation
          const textElements = svgElement.querySelectorAll("text, tspan");
          textElements.forEach((textEl) => {
            const element = textEl as SVGTextElement;
            element.style.fontFamily =
              '"Helvetica Neue", Helvetica, Arial, sans-serif';
            element.style.fontSize = "14px";

            // Ensure text is properly sized and not truncated
            if (element.textContent && element.textContent.length > 0) {
              try {
                // Add some padding to prevent truncation
                const bbox = element.getBBox();
                if (bbox.width > 0 && bbox.width < 1000) {
                  // Sanity check
                  // Don't force textLength as it can cause issues, just ensure proper styling
                  element.removeAttribute("textLength");
                  element.removeAttribute("lengthAdjust");
                }
              } catch (e) {
                // getBBox might fail in some cases, ignore and continue
                console.warn("Could not get text bounding box:", e);
              }
            }
          });

          // Ensure rectangles have minimum width for text
          const rectElements = svgElement.querySelectorAll("rect");
          rectElements.forEach((rectEl) => {
            const rect = rectEl as SVGRectElement;
            const currentWidth = parseFloat(rect.getAttribute("width") || "0");
            if (currentWidth > 0 && currentWidth < 100) {
              // Ensure minimum width for class boxes
              rect.setAttribute(
                "width",
                Math.max(currentWidth, 120).toString()
              );
            }
          });

          // Ensure proper background for the diagram
          svgElement.style.backgroundColor = "transparent";

          // Force a reflow to ensure proper rendering
          svgElement.style.display = "none";
          // Trigger reflow
          void svgElement.getBoundingClientRect();
          svgElement.style.display = "block";
        }

        onRenderSuccess?.();
      },
      {
        content: mermaidCode,
        operation: "mermaid-render",
        diagramType: "class",
      }
    );

    if (result.success) {
      setIsLoading(false);
    } else {
      const errorDetails = result.error!;

      // Ensure we have a meaningful error message
      const errorMessage =
        errorDetails.message || "Unknown rendering error occurred";

      setErrorDetails(errorDetails);
      setError(errorMessage);
      onRenderError?.(errorMessage);
      setIsLoading(false);

      // Log the error for debugging but avoid empty objects
      if (errorDetails.originalError && errorDetails.originalError.message) {
        console.warn("Preview rendering error:", {
          type: errorDetails.type,
          message: errorMessage,
          originalMessage: errorDetails.originalError.message,
        });
      }
    }
  }, [
    mermaidCode,
    isInitialized,
    onRenderError,
    onRenderSuccess,
    setIsLoading,
  ]);

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

    // Don't render if Mermaid is not initialized yet
    if (!isInitialized) {
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
  }, [mermaidCode, renderDiagram, isInitialized]);

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
              <svg
                className="loading-spinner -ml-1 mr-1 h-3 w-3 sm:h-4 sm:w-4"
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
              <span className="hidden sm:inline">Rendering...</span>
              <span className="sm:hidden">...</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {theme === "dark" ? "🌙" : "☀️"}
          </span>
        </div>
      </div>

      {/* Preview Content */}
      <div className="panel-content">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="animate-spin w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-muted-foreground">Initializing Mermaid...</p>
            </div>
          </div>
        ) : errorDetails ? (
          <div className="p-4">
            <ErrorDisplay
              error={errorDetails}
              onRetry={() => renderDiagram()}
              compact={false}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="animate-spin w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-muted-foreground">Rendering diagram...</p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            data-testid="preview-container"
            className="min-h-full p-2 sm:p-4"
            style={{
              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "14px"
                  : "16px", // Responsive font size
              lineHeight: "1.5",
            }}
          />
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && !errorDetails && (
          <div className="p-2 border-t border-panel-border">
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              <div className="flex items-center gap-1 mb-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="font-medium">Warnings:</span>
              </div>
              {validationWarnings.slice(0, 2).map((warning, index) => (
                <div key={index} className="text-xs ml-4">
                  • {warning}
                </div>
              ))}
              {validationWarnings.length > 2 && (
                <div className="text-xs ml-4">
                  • ... and {validationWarnings.length - 2} more
                </div>
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
