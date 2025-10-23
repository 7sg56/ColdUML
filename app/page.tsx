'use client';

import { useRef } from 'react';
import Header from '../components/Header';
import EditorPanel, { EditorPanelRef } from '../components/EditorPanel';
import HelperPanel from '../components/HelperPanel';
import PreviewPanel from '../components/PreviewPanel';
import { AppStateProvider, useEditorState, useThemeState, usePreviewState, useAppState } from '../components/AppStateProvider';
import { copyToClipboard } from '../lib/clipboard';

// Import test utilities for development
if (process.env.NODE_ENV === 'development') {
  import('../lib/state-test-utils').then(({ StateTestUtils }) => {
    // Make test utilities available in development
    (window as unknown as { StateTestUtils?: typeof StateTestUtils }).StateTestUtils = StateTestUtils;
  });
}

// Main application component with state management
function MermaidUMLEditor() {
  const editorRef = useRef<EditorPanelRef>(null);
  
  // Use centralized state management hooks
  const { content, setCursorPosition, insertTemplate } = useEditorState();
  const { theme, toggleTheme } = useThemeState();
  const { setRenderError, setIsLoading } = usePreviewState();
  const { actions } = useAppState();

  const handleCopyCode = async () => {
    try {
      setIsLoading(true);
      await copyToClipboard(content);
      // TODO: Add toast notification for successful copy
    } catch (error) {
      console.error('Failed to copy code:', error);
      // TODO: Add toast notification for failed copy
    } finally {
      setIsLoading(false);
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
    // Reset through state management system
    actions.resetToDefaults();
    // TODO: Add toast notification for successful reset
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

// Main component wrapped with state provider
export default function Home() {
  return (
    <AppStateProvider>
      <MermaidUMLEditor />
    </AppStateProvider>
  );
}
