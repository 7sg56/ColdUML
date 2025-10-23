'use client';

import { useState, useEffect } from 'react';
import { useAppMetadata } from './AppStateProvider';

interface HeaderProps {
  onCopyCode: () => void;
  onDownloadPNG: () => void;
  onDownloadSVG: () => void;
  onResetEditor: () => void;
  onThemeToggle: () => void;
  currentTheme: 'light' | 'dark';
}

export default function Header({
  onCopyCode,
  onDownloadPNG,
  onDownloadSVG,
  onResetEditor,
  onThemeToggle,
  currentTheme
}: HeaderProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { lastSaved, hasUnsavedChanges, storageAvailable } = useAppMetadata();

  // Ensure we only show client-specific content after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    onResetEditor();
    setShowResetConfirm(false);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleCopyCode = () => {
    try {
      onCopyCode();
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <>
      <header className="h-14 bg-header-background border-b border-header-border flex items-center justify-between px-4 flex-shrink-0 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">Mermaid UML Editor</h1>
          {/* Status indicators - only show after client hydration */}
          {isClient && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {hasUnsavedChanges && storageAvailable && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  Unsaved changes
                </span>
              )}
              {lastSaved && !hasUnsavedChanges && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              {!storageAvailable && (
                <span className="flex items-center gap-1 text-orange-500">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Storage unavailable
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Copy Mermaid Code Button */}
          <button 
            onClick={handleCopyCode}
            className="px-3 py-1.5 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Copy Mermaid code to clipboard"
          >
            Copy Code
          </button>
          
          {/* Download PNG Button */}
          <button 
            onClick={onDownloadPNG}
            className="px-3 py-1.5 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Download diagram as PNG"
          >
            Download PNG
          </button>
          
          {/* Download SVG Button */}
          <button 
            onClick={onDownloadSVG}
            className="px-3 py-1.5 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Download diagram as SVG"
          >
            Download SVG
          </button>
          
          {/* Reset Editor Button */}
          <button 
            onClick={handleResetClick}
            className="px-3 py-1.5 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Reset editor to default content"
          >
            Reset
          </button>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={onThemeToggle}
            className="px-3 py-1.5 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
          >
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Reset Editor</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to reset the editor? This will replace your current content with the default example and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelReset}
                className="px-4 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}