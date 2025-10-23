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
import { LoadingOverlay } from "../components/LoadingIndicator";
import { withErrorHandling } from "../lib/error-handling";
import { useInitializationStatus } from "../components/AppStateProvider";

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
  }
}

function MermaidUMLEditor() {
  const editorRef = useRef<EditorPanelRef>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const { content, setCursorPosition, insertTemplate } = useEditorState();
  const { theme, toggleTheme } = useThemeState();
  const { setRenderError, setIsLoading } = usePreviewState();
  const { actions } = useAppState();
  const { isFirstTimeUser, isUsingDefaultContent } = useInitializationStatus();

  // Handle application initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate minimum loading time for better UX (prevent flash)
        const minLoadTime = new Promise((resolve) => setTimeout(resolve, 800));

        // Wait for any async initialization
        await Promise.all([
          minLoadTime,
          // Add any other initialization promises here
        ]);

        setIsInitializing(false);

        // Show welcome message for first-time users
        if (isFirstTimeUser && isUsingDefaultContent) {
          setTimeout(() => setShowWelcome(true), 1000);
        }
      } catch (error) {
        console.error("Failed to initialize application:", error);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [isFirstTimeUser, isUsingDefaultContent]);

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
      <LoadingOverlay
        show={isInitializing}
        message="Initializing application..."
      />

      {/* Welcome overlay for first-time users */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 welcome-overlay">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg welcome-content">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Welcome to Mermaid UML Editor! 🎉
              </h2>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                This editor helps you create UML diagrams using Mermaid syntax.
                We&apos;ve loaded a sample class diagram to get you started.
              </p>
              <div className="text-left bg-muted p-3 rounded-md mb-4 text-xs">
                <p className="font-medium mb-2">Quick tips:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • Use the template buttons on the left to insert UML
                    elements
                  </li>
                  <li>• Your diagram updates in real-time as you type</li>
                  <li>• Use Cmd+1-5 for quick template insertion</li>
                  <li>• Export your diagrams as PNG or SVG</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  // Mark welcome as shown
                  try {
                    localStorage.setItem(
                      "mermaid-editor-welcome-shown",
                      "true"
                    );
                  } catch (error) {
                    console.warn("Failed to save welcome state:", error);
                  }
                }}
                className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Skip link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

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
