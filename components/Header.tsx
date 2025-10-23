'use client';

import { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiGithub } from 'react-icons/fi';

interface HeaderProps {
  onThemeToggle: () => void;
  currentTheme: 'light' | 'dark';
}

export default function Header({
  onThemeToggle,
  currentTheme
}: HeaderProps) {

  return (
    <header className="h-12 sm:h-14 lg:h-16 bg-header-background border-b border-header-border flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
          <span className="hidden sm:inline">ColdUML</span>
          <span className="sm:hidden">UML Editor</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <button 
          onClick={onThemeToggle}
          className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-3 py-2 text-sm rounded-md transition-colors"
          title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
          aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
        >
          {currentTheme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>
        
        {/* GitHub Link */}
        <a
          href="https://github.com/7sg56/colduml"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-3 py-2 text-sm rounded-md transition-colors"
          title="View on GitHub"
          aria-label="View ColdUML source code on GitHub"
        >
          <FiGithub size={18} />
        </a>
      </div>
    </header>
  );
}