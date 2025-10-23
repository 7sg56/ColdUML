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

// User preferences interface
export interface UserPreferences {
  autoSave: boolean;
  debounceDelay: number;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  defaultTemplate: string;
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
  debounceDelay: 300,
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  defaultTemplate: DEFAULT_MERMAID_CONTENT
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
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
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
}

// State validation utilities
export class StateValidator {
  static validateEditorContent(content: string): boolean {
    return typeof content === 'string' && content.length <= 100000; // 100KB limit
  }

  static validateTheme(theme: string): theme is 'light' | 'dark' {
    return theme === 'light' || theme === 'dark';
  }

  static validatePreferences(preferences: unknown): preferences is UserPreferences {
    if (!preferences || typeof preferences !== 'object') return false;
    
    const prefs = preferences as Record<string, unknown>;
    return (
      typeof prefs.autoSave === 'boolean' &&
      typeof prefs.debounceDelay === 'number' &&
      typeof prefs.fontSize === 'number' &&
      typeof prefs.wordWrap === 'boolean' &&
      typeof prefs.minimap === 'boolean' &&
      typeof prefs.lineNumbers === 'boolean' &&
      typeof prefs.defaultTemplate === 'string'
    );
  }

  static sanitizeState(state: Partial<AppState>): Partial<AppState> {
    const sanitized: Partial<AppState> = {};

    if (state.editorContent && StateValidator.validateEditorContent(state.editorContent)) {
      sanitized.editorContent = state.editorContent;
    }

    if (state.theme && StateValidator.validateTheme(state.theme)) {
      sanitized.theme = state.theme;
    }

    if (state.preferences && StateValidator.validatePreferences(state.preferences)) {
      sanitized.preferences = state.preferences;
    }

    if (typeof state.cursorPosition === 'number' && state.cursorPosition >= 0) {
      sanitized.cursorPosition = state.cursorPosition;
    }

    if (state.lastSaved instanceof Date) {
      sanitized.lastSaved = state.lastSaved;
    }

    return sanitized;
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

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startTimer(operation: string): void {
    this.metrics.set(operation, performance.now());
  }

  static endTimer(operation: string): number {
    const startTime = this.metrics.get(operation);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.metrics.delete(operation);
    return duration;
  }

  static logPerformance(operation: string, duration: number): void {
    if (duration > 100) { // Log operations taking more than 100ms
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }
}