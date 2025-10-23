/**
 * Application State Management
 * Centralized state management for the Mermaid UML Editor
 */

import { createContext, useContext } from 'react';

// Application state interface
export interface AppState {
  editorContent: string;
  cursorPosition: number;
  theme: 'light' | 'dark';
  lastSaved: Date | null;
  renderError: string | null;
  isLoading: boolean;
  preferences: UserPreferences;
}

// User preferences
export interface UserPreferences {
  autoSave: boolean;
  fontSize: number;
  debounceDelay: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

// State actions interface
export interface AppStateActions {
  setEditorContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setRenderError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetToDefaults: () => void;
  insertTemplate: (template: string) => void;
}

// Combined context interface
export interface AppContextValue {
  state: AppState;
  actions: AppStateActions;
  isInitialized?: boolean;
}

// Default state values
export const DEFAULT_MERMAID_CONTENT = `classDiagram
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

export const DEFAULT_PREFERENCES: UserPreferences = {
  autoSave: true,
  fontSize: 14,
  debounceDelay: 300,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
};

export const DEFAULT_STATE: AppState = {
  editorContent: DEFAULT_MERMAID_CONTENT,
  cursorPosition: 0,
  theme: 'light',
  lastSaved: null,
  renderError: null,
  isLoading: false,
  preferences: DEFAULT_PREFERENCES
};

// Create context
export const AppStateContext = createContext<AppContextValue | null>(null);

// Custom hook to use app state
export function useAppState(): AppContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Simple utility functions
export class AppInitializer {
  static isFirstTimeUser(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return !AppStorage.loadEditorContent();
    } catch {
      return true;
    }
  }

  static isUsingDefaultContent(content: string): boolean {
    return content === DEFAULT_MERMAID_CONTENT;
  }
}

// Storage keys for localStorage
export const STORAGE_KEYS = {
  EDITOR_CONTENT: 'mermaid-editor-content',
  THEME: 'mermaid-editor-theme',
  PREFERENCES: 'mermaid-editor-preferences',
  LAST_SAVED: 'mermaid-editor-last-saved'
} as const;

// Local storage utilities
export class AppStorage {
  static saveEditorContent(content: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, content);
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to save editor content to localStorage:', error);
    }
  }

  static loadEditorContent(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.EDITOR_CONTENT);
    } catch (error) {
      console.warn('Failed to load editor content from localStorage:', error);
      return null;
    }
  }

  static saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  static loadTheme(): 'light' | 'dark' | null {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      return theme === 'light' || theme === 'dark' ? theme : null;
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return null;
    }
  }

  static savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }

  static loadPreferences(): UserPreferences | null {
    try {
      const preferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
      return null;
    }
  }

  static getLastSaved(): Date | null {
    try {
      const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
      return lastSaved ? new Date(lastSaved) : null;
    } catch (error) {
      console.warn('Failed to load last saved date from localStorage:', error);
      return null;
    }
  }

  static clearEditorContent(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.EDITOR_CONTENT);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
    } catch (error) {
      console.warn('Failed to clear editor content from localStorage:', error);
    }
  }

  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Theme utilities
export class ThemeManager {
  static applyTheme(theme: 'light' | 'dark'): void {
    // Add theme transitioning class to prevent flash
    document.documentElement.classList.add('theme-transitioning');
    
    // Apply theme attributes
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Update body class for additional styling
    document.body.classList.toggle('dark', theme === 'dark');
    
    // Remove transitioning class after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 100);
  }

  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  static initializeTheme(): 'light' | 'dark' {
    const savedTheme = AppStorage.loadTheme();
    const systemTheme = ThemeManager.getSystemTheme();
    const initialTheme = savedTheme || systemTheme;
    
    ThemeManager.applyTheme(initialTheme);
    return initialTheme;
  }

  static toggleTheme(currentTheme: 'light' | 'dark'): 'light' | 'dark' {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    ThemeManager.applyTheme(newTheme);
    AppStorage.saveTheme(newTheme);
    return newTheme;
  }

  static getMermaidThemeConfig(theme: 'light' | 'dark') {
    const baseConfig = {
      startOnLoad: false,
      theme: (theme === 'dark' ? 'dark' : 'default') as 'dark' | 'default',
      classDiagram: {
        htmlLabels: false,
        curve: 'basis' as const
      },
      flowchart: {
        htmlLabels: false,
        curve: 'basis' as const
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: 16,
      logLevel: 'error' as const,
      securityLevel: 'loose' as const,
      deterministicIds: true,
      deterministicIDSeed: 'mermaid-uml-editor',
      wrap: true,
      maxTextSize: 90000,
      htmlLabels: false
    };

    // Theme-specific variables
    if (theme === 'light') {
      return {
        ...baseConfig,
        themeVariables: {
          primaryColor: '#2563eb',
          primaryTextColor: '#0f172a',
          primaryBorderColor: '#e2e8f0',
          lineColor: '#94a3b8',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#f8fafc',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f8fafc',
          tertiaryBkg: '#f1f5f9',
          secondaryBorderColor: '#cbd5e1',
          tertiaryBorderColor: '#94a3b8',
          secondaryTextColor: '#475569',
          tertiaryTextColor: '#64748b',
          textColor: '#0f172a'
        }
      };
    } else {
      return {
        ...baseConfig,
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#334155',
          lineColor: '#64748b',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          background: '#0a0a0a',
          mainBkg: '#0f172a',
          secondBkg: '#1e293b',
          tertiaryBkg: '#334155',
          secondaryBorderColor: '#475569',
          tertiaryBorderColor: '#64748b',
          secondaryTextColor: '#cbd5e1',
          tertiaryTextColor: '#94a3b8',
          textColor: '#f8fafc'
        }
      };
    }
  }
}

// Simple validation
export class StateValidator {
  static validateEditorContent(content: string): boolean {
    return typeof content === 'string' && content.length < 100000;
  }

  static validateTheme(theme: string): boolean {
    return theme === 'light' || theme === 'dark';
  }

  static validatePreferences(preferences: UserPreferences): boolean {
    return preferences && 
           typeof preferences.autoSave === 'boolean' && 
           typeof preferences.fontSize === 'number' &&
           typeof preferences.debounceDelay === 'number' &&
           typeof preferences.wordWrap === 'boolean' &&
           typeof preferences.minimap === 'boolean' &&
           typeof preferences.lineNumbers === 'boolean';
  }
}

// Template insertion utilities
export class TemplateManager {
  static insertAtCursor(
    content: string,
    template: string,
    cursorPosition: number
  ): { newContent: string; newCursorPosition: number } {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    
    // Add appropriate spacing
    let templateToInsert = template;
    const needsNewlineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n');
    const needsNewlineAfter = afterCursor.length > 0 && !afterCursor.startsWith('\n');
    
    if (needsNewlineBefore) {
      templateToInsert = '\n' + templateToInsert;
    }
    
    if (needsNewlineAfter && template.includes('\n')) {
      templateToInsert = templateToInsert + '\n';
    }
    
    const newContent = beforeCursor + templateToInsert + afterCursor;
    const newCursorPosition = cursorPosition + templateToInsert.length;
    
    return { newContent, newCursorPosition };
  }

  static formatTemplate(template: string, context?: Record<string, string>): string {
    if (!context) return template;
    
    let formatted = template;
    Object.entries(context).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    
    return formatted;
  }
}
