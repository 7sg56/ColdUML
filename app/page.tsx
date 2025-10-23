"use client";

import { useRef, useState, useEffect } from "react";
import Header from "../components/Header";
import EditorPanel, { EditorPanelRef } from "../components/EditorPanel";
import HelperPanel from "../components/HelperPanel";
import PreviewPanel from "../components/PreviewPanel";

import {
  AppStateProvider,
  useEditorState,
  useThemeState,
  usePreviewState,
  useAppState,
} from "../components/AppStateProvider";
import { exportAsPNG, exportAsSVG, copyMermaidCode } from "../lib/export-utils";
import { toast } from "../lib/toast-utils";
import ErrorBoundary from "../components/ErrorBoundary";
import { withErrorHandling } from "../lib/error-handling";

// Import test utilities for development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  import("../lib/state-test-utils").then(({ StateTestUtils }) => {
    // Make test utilities available in development
    (
      window as unknown as { StateTestUtils?: typeof StateTestUtils }
    ).StateTestUtils = StateTestUtils;
  });
}

// Performance monitoring for development
if (process.env.NODE_ENV === "development") {
  // Monitor performance metrics
  if (typeof window !== "undefined" && "performance" in window) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.log("App Performance Metrics:", {
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          });
        }
      }, 0);
    });

    // Add global error handlers to catch unhandled errors
    window.addEventListener('error', (event) => {
      // Only log if there's meaningful error information
      if (event.message || event.error) {
        console.error('Global error caught:', {
          message: event.message || 'No message',
          filename: event.filename || 'Unknown file',
          lineno: event.lineno || 0,
          colno: event.colno || 0,
          error: event.error ? {
            name: event.error.name,
            message: event.error.message,
            stack: event.error.stack
          } : 'No error object'
        });
      } else {
        console.warn('Global error event with no meaningful information:', event);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      // Handle empty or undefined rejection reasons
      const reason = event.reason;
      if (reason !== null && reason !== undefined) {
        // Check for empty objects specifically
        if (typeof reason === 'object' && Object.keys(reason).length === 0) {
          console.warn('Unhandled promise rejection with empty object - this may indicate a library error');
        } else {
          console.error('Unhandled promise rejection:', {
            reason: typeof reason === 'object' ? {
              name: reason.name || 'Unknown',
              message: reason.message || 'No message',
              stack: reason.stack || 'No stack trace'
            } : reason,
            reasonType: typeof reason
          });
        }
      } else {
        console.warn('Unhandled promise rejection with empty reason');
      }
      // Prevent the default behavior (logging to console)
      event.preventDefault();
    });
  }
}

function MermaidUMLEditor() {
  const editorRef = useRef<EditorPanelRef>(null);
  const { content, setCursorPosition, insertTemplate } = useEditorState();
  const { theme, toggleTheme } = useThemeState();
  const { setRenderError, setIsLoading } = usePreviewState();
  const { actions } = useAppState();


  const handleCopyCode = async () => {
    const result = await withErrorHandling(
      async () => {
        setIsLoading(true);
        const copyResult = await copyMermaidCode(content);
        if (!copyResult.success) {
          throw new Error(
            copyResult.error || "Failed to copy code to clipboard"
          );
        }
        return copyResult;
      },
      {
        operation: "copy-code",
        content: content.substring(0, 100),
      }
    );

    setIsLoading(false);

    if (result.success) {
      toast.success("Mermaid code copied to clipboard");
    } else {
      const errorDetails = result.error!;
      console.error("Failed to copy code:", errorDetails);
      toast.error(errorDetails.message);
    }
  };

  const handleDownloadPNG = async () => {
    const result = await withErrorHandling(
      async () => {
        setIsLoading(true);
        const exportResult = await exportAsPNG({
          quality: 1,
          scale: 2,
        });
        if (!exportResult.success) {
          throw new Error(exportResult.error || "Failed to export PNG");
        }
        return exportResult;
      },
      {
        operation: "export-png",
        format: "png",
      }
    );

    setIsLoading(false);

    if (result.success) {
      toast.success(`PNG exported successfully: ${result.data!.filename}`);
    } else {
      const errorDetails = result.error!;
      console.error("Failed to export PNG:", errorDetails);
      toast.error(errorDetails.message);
    }
  };

  const handleDownloadSVG = async () => {
    const result = await withErrorHandling(
      async () => {
        setIsLoading(true);
        const exportResult = await exportAsSVG();
        if (!exportResult.success) {
          throw new Error(exportResult.error || "Failed to export SVG");
        }
        return exportResult;
      },
      {
        operation: "export-svg",
        format: "svg",
      }
    );

    setIsLoading(false);

    if (result.success) {
      toast.success(`SVG exported successfully: ${result.data!.filename}`);
    } else {
      const errorDetails = result.error!;
      console.error("Failed to export SVG:", errorDetails);
      toast.error(errorDetails.message);
    }
  };

  const handleResetEditor = () => {
    // Reset through state management system
    actions.resetToDefaults();
    toast.success("Editor reset to default content");
  };

  const handleEditorContentChange = () => {
    // Content changes are now handled through the centralized state
    // The EditorPanel will call the state management directly
  };

  const handleCursorPositionChange = (position: number) => {
    setCursorPosition(position);
  };

  const handleInsertTemplate = (template: string) => {
    // Use centralized template insertion
    insertTemplate(template);

    // Also update the editor directly for immediate feedback
    if (editorRef.current) {
      editorRef.current.insertTemplate(template);
    }
  };

  const handleRenderError = (error: string) => {
    setRenderError(error);
  };

  const handleRenderSuccess = () => {
    setRenderError(null);
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-background text-foreground font-sans">

        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error(
              "Application error boundary triggered:",
              error,
              errorInfo
            );
            // In production, report to error tracking service
          }}
        >
          <Header
            onCopyCode={handleCopyCode}
            onDownloadPNG={handleDownloadPNG}
            onDownloadSVG={handleDownloadSVG}
            onResetEditor={handleResetEditor}
            onThemeToggle={toggleTheme}
            currentTheme={theme}
          />

          {/* Main content area with enhanced responsive three-panel layout */}
          <main
            id="main-content"
            className="flex-1 flex flex-col lg:flex-row overflow-hidden"
            role="main"
            aria-label="UML diagram editor workspace"
          >
            {/* Helper Panel - Responsive positioning */}
            <aside
              className="helper-panel-mobile lg:desktop-sidebar order-first lg:order-none"
              role="complementary"
              aria-label="UML template helpers"
            >
              <ErrorBoundary
                fallback={
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Helper panel unavailable</p>
                  </div>
                }
              >
                <HelperPanel onInsertTemplate={handleInsertTemplate} />
              </ErrorBoundary>
            </aside>

            {/* Editor and Preview panels container */}
            <div
              className="desktop-main-content flex flex-col sm:flex-row overflow-hidden mobile-stack"
              role="region"
              aria-label="Editor and preview panels"
            >
              {/* Editor Panel - Responsive sizing */}
              <section
                className="flex-1 panel-container border-b sm:border-b-0 sm:border-r border-panel-border flex flex-col editor-panel-mobile"
                role="region"
                aria-label="Mermaid code editor"
              >
                <ErrorBoundary
                  fallback={
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <div>
                        <p className="text-muted-foreground mb-2">
                          Editor unavailable
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="text-sm text-primary hover:underline"
                        >
                          Reload page
                        </button>
                      </div>
                    </div>
                  }
                >
                  <EditorPanel
                    ref={editorRef}
                    content={content}
                    onChange={handleEditorContentChange}
                    onCursorPositionChange={handleCursorPositionChange}
                    theme={theme}
                  />
                </ErrorBoundary>
              </section>

              {/* Preview Panel - Responsive sizing */}
              <section
                className="flex-1 panel-container flex flex-col preview-panel-mobile"
                role="region"
                aria-label="Diagram preview"
              >
                <ErrorBoundary
                  fallback={
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <div>
                        <p className="text-muted-foreground mb-2">
                          Preview unavailable
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="text-sm text-primary hover:underline"
                        >
                          Reload page
                        </button>
                      </div>
                    </div>
                  }
                >
                  <PreviewPanel
                    mermaidCode={content}
                    theme={theme}
                    onRenderError={handleRenderError}
                    onRenderSuccess={handleRenderSuccess}
                  />
                </ErrorBoundary>
              </section>
            </div>
          </main>
        </ErrorBoundary>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <MermaidUMLEditor />
      </AppStateProvider>
    </ErrorBoundary>
  );
}
