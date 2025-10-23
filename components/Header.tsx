'use client';

import { useState, useEffect } from 'react';

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMobileMenu) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMobileMenu]);

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

  return (
    <>
      <header className="h-12 sm:h-14 lg:h-16 bg-header-background border-b border-header-border flex items-center justify-between px-2 sm:px-4 flex-shrink-0 relative">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
            <span className="hidden sm:inline">ColdUML</span>
            <span className="sm:hidden">UML Editor</span>
          </h1>

        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Copy Mermaid Code Button */}
          <button 
            onClick={onCopyCode}
            className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors"
            title="Copy Mermaid code to clipboard"
            aria-label="Copy Mermaid code to clipboard"
          >
            <span className="hidden sm:inline">Copy Code</span>
            <span className="sm:hidden">Copy</span>
          </button>
          
          {/* Download PNG Button */}
          <button 
            onClick={onDownloadPNG}
            className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors hidden sm:inline-flex"
            title="Download diagram as PNG"
            aria-label="Download diagram as PNG file"
          >
            <span className="hidden md:inline">Download PNG</span>
            <span className="md:hidden">PNG</span>
          </button>
          
          {/* Download SVG Button */}
          <button 
            onClick={onDownloadSVG}
            className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors hidden sm:inline-flex"
            title="Download diagram as SVG"
            aria-label="Download diagram as SVG file"
          >
            <span className="hidden md:inline">Download SVG</span>
            <span className="md:hidden">SVG</span>
          </button>
          
          {/* Mobile Download Menu Button - shown only on small screens */}
          <div className="relative sm:hidden">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 py-1.5 text-xs rounded-md transition-colors"
              title="Download options"
              aria-label="Open download options menu"
              aria-expanded={showMobileMenu}
              aria-haspopup="menu"
            >
              ⬇️
            </button>
            {showMobileMenu && (
              <div 
                className="absolute right-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg z-50 min-w-[120px]"
                role="menu"
                aria-label="Download options"
              >
                <button
                  onClick={() => {
                    onDownloadPNG();
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  aria-label="Download diagram as PNG"
                >
                  PNG
                </button>
                <button
                  onClick={() => {
                    onDownloadSVG();
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  aria-label="Download diagram as SVG"
                >
                  SVG
                </button>
              </div>
            )}
          </div>
          
          {/* Reset Editor Button */}
          <button 
            onClick={handleResetClick}
            className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors"
            title="Reset editor to default content"
            aria-label="Reset editor to default content"
          >
            <span className="hidden sm:inline">Reset</span>
            <span className="sm:hidden">↻</span>
          </button>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={onThemeToggle}
            className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors"
            title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
            aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
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