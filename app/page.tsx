'use client';

import { useRef } from 'react';
import Header from '../components/Header';
import EditorPanel, { EditorPanelRef } from '../components/EditorPanel';
import HelperPanel from '../components/HelperPanel';
import PreviewPanel from '../components/PreviewPanel';
import { AppStateProvider, useEditorState, useThemeState, usePreviewState, useAppState } from '../components/AppStateProvider';
import { exportAsPNG, exportAsSVG, copyMermaidCode } from '../lib/export-utils';
import { toast } from '../lib/toast-utils';

// Import test utilities for development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  import('../lib/state-test-utils').then(({ StateTestUtils }) => {
    // Make test utilities available in development
    (window as unknown as { StateTestUtils?: typeof StateTestUtils }).StateTestUtils = StateTestUtils;
  });
}

function MermaidUMLEditor() {
  const editorRef = useRef<EditorPanelRef>(null);
  
  const { content, setCursorPosition, insertTemplate } = useEditorState();
  const { theme, toggleTheme } = useThemeState();
  const { setRenderError, setIsLoading } = usePreviewState();
  const { actions } = useAppState();

  const handleCopyCode = async () => {
    try {
      setIsLoading(true);
      const result = await copyMermaidCode(content);
      if (!result.success) {
        console.error('Failed to copy code:', result.error);
        toast.error(result.error || 'Failed to copy code to clipboard');
      } else {
        toast.success('Mermaid code copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code to clipboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      setIsLoading(true);
      const result = await exportAsPNG({
        quality: 1,
        scale: 2
      });
      if (!result.success) {
        console.error('Failed to export PNG:', result.error);
        toast.error(result.error || 'Failed to export PNG');
      } else {
        toast.success(`PNG exported successfully: ${result.filename}`);
      }
    } catch (error) {
      console.error('Failed to export PNG:', error);
      toast.error('Failed to export PNG');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSVG = async () => {
    try {
      setIsLoading(true);
      const result = await exportAsSVG();
      if (!result.success) {
        console.error('Failed to export SVG:', result.error);
        toast.error(result.error || 'Failed to export SVG');
      } else {
        toast.success(`SVG exported successfully: ${result.filename}`);
      }
    } catch (error) {
      console.error('Failed to export SVG:', error);
      toast.error('Failed to export SVG');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetEditor = () => {
    // Reset through state management system
    actions.resetToDefaults();
    toast.success('Editor reset to default content');
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
    <div className="h-screen flex flex-col bg-background text-foreground font-sans">
      <Header
        onCopyCode={handleCopyCode}
        onDownloadPNG={handleDownloadPNG}
        onDownloadSVG={handleDownloadSVG}
        onResetEditor={handleResetEditor}
        onThemeToggle={toggleTheme}
        currentTheme={theme}
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
            <EditorPanel
              ref={editorRef}
              content={content}
              onChange={handleEditorContentChange}
              onCursorPositionChange={handleCursorPositionChange}
              theme={theme}
            />
          </div>

          {/* Preview Panel - Right side on desktop, bottom on mobile */}
          <div className="flex-1 bg-preview-background flex flex-col">
            <PreviewPanel
              mermaidCode={content}
              theme={theme}
              onRenderError={handleRenderError}
              onRenderSuccess={handleRenderSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppStateProvider>
      <MermaidUMLEditor />
    </AppStateProvider>
  );
}
