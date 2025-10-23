'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import EditorPanel, { EditorPanelRef } from '../components/EditorPanel';
import HelperPanel from '../components/HelperPanel';
import PreviewPanel from '../components/PreviewPanel';
import { copyToClipboard } from '../lib/clipboard';

// Default Mermaid content as specified in requirements
const DEFAULT_MERMAID_CONTENT = `classDiagram
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

export default function Home() {
  const [editorContent, setEditorContent] = useState(DEFAULT_MERMAID_CONTENT);
  const [, setCursorPosition] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null); // Start with null to prevent hydration mismatch
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const editorRef = useRef<EditorPanelRef>(null);

  // Initialize theme from system preference or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    setIsThemeLoaded(true);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const handleCopyCode = async () => {
    try {
      await copyToClipboard(editorContent);
      // TODO: Add toast notification for successful copy
    } catch (error) {
      console.error('Failed to copy code:', error);
      // TODO: Add toast notification for failed copy
    }
  };

  const handleDownloadPNG = () => {
    // Placeholder functionality - will be implemented in task 8
    console.log('Download PNG functionality will be implemented in task 8');
  };

  const handleDownloadSVG = () => {
    // Placeholder functionality - will be implemented in task 8
    console.log('Download SVG functionality will be implemented in task 8');
  };

  const handleResetEditor = () => {
    setEditorContent(DEFAULT_MERMAID_CONTENT);
    // TODO: Add toast notification for successful reset
  };

  const handleEditorContentChange = (content: string) => {
    setEditorContent(content);
    // Save to localStorage for persistence
    localStorage.setItem('mermaid-editor-content', content);
  };

  const handleCursorPositionChange = (position: number) => {
    setCursorPosition(position);
  };

  // Load saved content from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('mermaid-editor-content');
    if (savedContent) {
      setEditorContent(savedContent);
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleInsertTemplate = (template: string) => {
    if (editorRef.current) {
      editorRef.current.insertTemplate(template);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-sans">
      <Header
        onCopyCode={handleCopyCode}
        onDownloadPNG={handleDownloadPNG}
        onDownloadSVG={handleDownloadSVG}
        onResetEditor={handleResetEditor}
        onThemeToggle={handleThemeToggle}
        currentTheme={theme || 'light'}
      />

      {/* Main content area with three-panel layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Helper Panel - Top on mobile/tablet, sidebar on desktop */}
        <HelperPanel
          onInsertTemplate={handleInsertTemplate}
        />

        {/* Editor and Preview panels */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Editor Panel - Left side on desktop, top on mobile */}
          <div className="flex-1 bg-editor-background border-b md:border-b-0 md:border-r border-panel-border flex flex-col">
            {isThemeLoaded && theme ? (
              <EditorPanel
                ref={editorRef}
                content={editorContent}
                onChange={handleEditorContentChange}
                onCursorPositionChange={handleCursorPositionChange}
                theme={theme}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading editor...
              </div>
            )}
          </div>

          {/* Preview Panel - Right side on desktop, bottom on mobile */}
          <div className="flex-1 bg-preview-background flex flex-col">
            {isThemeLoaded && theme ? (
              <PreviewPanel
                mermaidCode={editorContent}
                theme={theme}
                onRenderError={(error) => {
                  console.error('Mermaid render error:', error);
                  // TODO: Add toast notification for render errors
                }}
                onRenderSuccess={() => {
                  // TODO: Add success feedback if needed
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
