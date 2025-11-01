"use client";

import { useRef, useState, useEffect } from "react";
import Header from "../components/Header";
import SimpleEditor, { SimpleEditorRef } from "../components/SimpleEditor";
import UMLTemplates from "../components/UMLTemplates";
import SimplePreview from "../components/SimplePreview";
import { exportAsPNG, exportAsSVG, copyMermaidCode } from "../lib/export-utils";
import { toast } from "../lib/toast-utils";

// Default UML content for initialization
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

// Get initial theme synchronously to prevent flash
function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    return savedTheme;
  }
  
  // Check system preference if no saved theme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function MermaidUMLEditor() {
  const editorRef = useRef<SimpleEditorRef>(null);
  
  // Simple state management with useState hooks
  const [content, setContent] = useState(DEFAULT_UML_CONTENT);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply initial theme immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.className = theme;
      setIsThemeReady(true);
    }
  }, [theme]);

  // Apply theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.className = theme;
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const handleCopyCode = async () => {
    const result = await copyMermaidCode(content);
    if (result.success) {
      toast.success("Code copied to clipboard");
    } else {
      toast.error(result.error || "Failed to copy code");
    }
  };

  const handleDownloadPNG = async () => {
    const result = await exportAsPNG(content);
    if (result.success) {
      toast.success("PNG exported successfully");
    } else {
      toast.error(result.error || "Failed to export PNG");
    }
  };

  const handleDownloadSVG = async () => {
    const result = await exportAsSVG(content);
    if (result.success) {
      toast.success("SVG exported successfully");
    } else {
      toast.error(result.error || "Failed to export SVG");
    }
  };

  const handleResetEditor = () => {
    setContent(DEFAULT_UML_CONTENT);
    toast.success("Editor reset to default content");
  };

  const handleEditorContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleInsertTemplate = (template: string) => {
    // Simple template insertion using the editor's built-in method
    if (editorRef.current) {
      editorRef.current.insertTemplate(template);
    }
  };

  const handleRenderError = (error: string) => {
    // Set error message for editor display
    setErrorMessage(error);
    console.warn('Render error:', error);
  };

  const handleRenderSuccess = () => {
    // Clear error message on successful render
    setErrorMessage(null);
    console.log('Render success');
  };

  // Show loading screen until theme is ready
  if (!isThemeReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header theme={theme} onThemeChange={setTheme} />

      {/* Main content area - Full width layout with center divider */}
      <main
        id="main-content"
        className="flex-1 flex flex-col lg:flex-row overflow-hidden"
        role="main"
        aria-label="UML diagram editor workspace"
      >
        {/* Left Column: HelperPanel + EditorPanel (stacked) */}
        <section className="left flex-1">
          {/* HelperPanel - Top of left column */}
          <aside
            className="panel"
            role="complementary"
            aria-label="UML template library"
          >
            <UMLTemplates onInsertTemplate={handleInsertTemplate} />
          </aside>

          {/* EditorPanel - Bottom of left column (takes remaining space) */}
          <section
            className="panel grow"
            role="region"
            aria-label="Mermaid code editor"
          >
            <SimpleEditor
              ref={editorRef}
              content={content}
              onChange={handleEditorContentChange}
              theme={theme}
              errorMessage={errorMessage || undefined}
            />
          </section>
        </section>

        {/* Right Column: PreviewPanel (full height) */}
        <section
          className="right flex-1"
          role="region"
          aria-label="Diagram preview"
        >
          <div className="panel">
            <SimplePreview
              content={content}
              theme={theme}
              onError={handleRenderError}
              onSuccess={handleRenderSuccess}
              onDownloadPNG={handleDownloadPNG}
              onDownloadSVG={handleDownloadSVG}
              hasError={!!errorMessage}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return <MermaidUMLEditor />;
}
