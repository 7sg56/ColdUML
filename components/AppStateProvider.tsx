"use client";

import React, {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import {
  AppState,
  AppStateActions,
  AppContextValue,
  AppStateContext,
  DEFAULT_STATE,
  DEFAULT_PREFERENCES,
  AppStorage,
  ThemeManager,
  StateValidator,
  TemplateManager,
  PerformanceMonitor,
  AppInitializer,
} from "@/lib/app-state";

// State action types
type StateAction =
  | { type: "SET_EDITOR_CONTENT"; payload: string }
  | { type: "SET_CURSOR_POSITION"; payload: number }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_RENDER_ERROR"; payload: string | null }
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<AppState["preferences"]> }
  | { type: "RESET_TO_DEFAULTS" }
  | { type: "INSERT_TEMPLATE"; payload: string }
  | { type: "INITIALIZE_STATE"; payload: Partial<AppState> }
  | { type: "SET_LAST_SAVED"; payload: Date | null };

// State reducer
function appStateReducer(state: AppState, action: StateAction): AppState {
  switch (action.type) {
    case "SET_EDITOR_CONTENT":
      if (!StateValidator.validateEditorContent(action.payload)) {
        console.warn("Invalid editor content provided");
        return state;
      }
      return {
        ...state,
        editorContent: action.payload,
        lastSaved: new Date(),
      };

    case "SET_CURSOR_POSITION":
      return {
        ...state,
        cursorPosition: Math.max(0, action.payload),
      };

    case "SET_THEME":
      if (!StateValidator.validateTheme(action.payload)) {
        console.warn("Invalid theme provided");
        return state;
      }
      return {
        ...state,
        theme: action.payload,
      };

    case "SET_RENDER_ERROR":
      return {
        ...state,
        renderError: action.payload,
      };

    case "SET_IS_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "UPDATE_PREFERENCES":
      const newPreferences = { ...state.preferences, ...action.payload };
      if (!StateValidator.validatePreferences(newPreferences)) {
        console.warn("Invalid preferences provided");
        return state;
      }
      return {
        ...state,
        preferences: newPreferences,
      };

    case "RESET_TO_DEFAULTS":
      return {
        ...DEFAULT_STATE,
        theme: state.theme, // Preserve theme
        preferences: { ...DEFAULT_PREFERENCES },
      };

    case "INSERT_TEMPLATE":
      const { newContent, newCursorPosition } = TemplateManager.insertAtCursor(
        state.editorContent,
        action.payload,
        state.cursorPosition
      );
      return {
        ...state,
        editorContent: newContent,
        cursorPosition: newCursorPosition,
        lastSaved: new Date(),
      };

    case "INITIALIZE_STATE":
      const sanitizedState = StateValidator.sanitizeState(action.payload);
      return {
        ...state,
        ...sanitizedState,
      };

    case "SET_LAST_SAVED":
      return {
        ...state,
        lastSaved: action.payload,
      };

    default:
      return state;
  }
}

interface AppStateProviderProps {
  children: React.ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appStateReducer, DEFAULT_STATE);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize state from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const initializeState = async () => {
      PerformanceMonitor.startTimer("state-initialization");

      try {
        // Preload resources for faster startup
        await AppInitializer.preloadResources();

        // Get initialization status
        const initStatus = AppInitializer.getInitializationStatus();
        
        // Initialize theme first
        const initialTheme = ThemeManager.initializeTheme();

        // Load saved data
        const savedContent = AppStorage.loadEditorContent();
        const savedPreferences = AppStorage.loadPreferences();
        const lastSaved = AppStorage.getLastSaved();

        // Initialize state with saved data
        const initialState: Partial<AppState> = {
          theme: initialTheme,
          lastSaved,
        };

        // Use saved content if available, otherwise use default
        if (savedContent && StateValidator.validateEditorContent(savedContent)) {
          initialState.editorContent = savedContent;
        } else {
          // Ensure we're using the default content for new users
          initialState.editorContent = DEFAULT_STATE.editorContent;
        }

        if (savedPreferences && StateValidator.validatePreferences(savedPreferences)) {
          initialState.preferences = {
            ...DEFAULT_PREFERENCES,
            ...savedPreferences,
          };
        } else {
          // Use default preferences for new users
          initialState.preferences = DEFAULT_PREFERENCES;
        }

        dispatch({ type: "INITIALIZE_STATE", payload: initialState });

        const duration = PerformanceMonitor.endTimer("state-initialization");
        PerformanceMonitor.logPerformance("state-initialization", duration);

        // Log initialization status for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('App initialization status:', initStatus);
        }

        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize app state:", error);
        // Fallback to default state
        dispatch({ type: "INITIALIZE_STATE", payload: DEFAULT_STATE });
        isInitializedRef.current = true;
      }
    };

    initializeState();
  }, []);

  // Debounced save to localStorage
  const debouncedSave = useCallback(
    (content: string, preferences: AppState["preferences"]) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        PerformanceMonitor.startTimer("localStorage-save");

        try {
          if (preferences.autoSave) {
            AppStorage.saveEditorContent(content);
            AppStorage.savePreferences(preferences);
          }

          const duration = PerformanceMonitor.endTimer("localStorage-save");
          PerformanceMonitor.logPerformance("localStorage-save", duration);
        } catch (error) {
          console.error("Failed to save to localStorage:", error);
        }
      }, preferences.debounceDelay);
    },
    []
  );

  // Auto-save effect
  useEffect(() => {
    if (!isInitializedRef.current) return;

    debouncedSave(state.editorContent, state.preferences);
  }, [state.editorContent, state.preferences, debouncedSave]);

  // Theme change effect
  useEffect(() => {
    if (!isInitializedRef.current) return;

    ThemeManager.applyTheme(state.theme);
    AppStorage.saveTheme(state.theme);
  }, [state.theme]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Action creators
  const actions: AppStateActions = {
    setEditorContent: useCallback((content: string) => {
      dispatch({ type: "SET_EDITOR_CONTENT", payload: content });
    }, []),

    setCursorPosition: useCallback((position: number) => {
      dispatch({ type: "SET_CURSOR_POSITION", payload: position });
    }, []),

    setTheme: useCallback((theme: "light" | "dark") => {
      dispatch({ type: "SET_THEME", payload: theme });
    }, []),

    setRenderError: useCallback((error: string | null) => {
      dispatch({ type: "SET_RENDER_ERROR", payload: error });
    }, []),

    setIsLoading: useCallback((loading: boolean) => {
      dispatch({ type: "SET_IS_LOADING", payload: loading });
    }, []),

    updatePreferences: useCallback(
      (preferences: Partial<AppState["preferences"]>) => {
        dispatch({ type: "UPDATE_PREFERENCES", payload: preferences });
      },
      []
    ),

    resetToDefaults: useCallback(() => {
      dispatch({ type: "RESET_TO_DEFAULTS" });
    }, []),

    insertTemplate: useCallback((template: string) => {
      dispatch({ type: "INSERT_TEMPLATE", payload: template });
    }, []),
  };

  const contextValue: AppContextValue = {
    state,
    actions,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook for accessing editor-specific state and actions
export function useEditorState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useEditorState must be used within an AppStateProvider");
  }
  const { state, actions } = context;

  return {
    content: state.editorContent,
    cursorPosition: state.cursorPosition,
    preferences: state.preferences,
    isLoading: state.isLoading,
    setContent: actions.setEditorContent,
    setCursorPosition: actions.setCursorPosition,
    insertTemplate: actions.insertTemplate,
    updatePreferences: actions.updatePreferences,
  };
}

// Hook for accessing theme state and actions
export function useThemeState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useThemeState must be used within an AppStateProvider");
  }
  const { state, actions } = context;

  return {
    theme: state.theme,
    setTheme: actions.setTheme,
    toggleTheme: useCallback(() => {
      const newTheme = ThemeManager.toggleTheme(state.theme);
      actions.setTheme(newTheme);
    }, [state.theme, actions]),
  };
}

// Hook for accessing preview state and actions
export function usePreviewState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("usePreviewState must be used within an AppStateProvider");
  }
  const { state, actions } = context;

  return {
    content: state.editorContent,
    theme: state.theme,
    renderError: state.renderError,
    isLoading: state.isLoading,
    setRenderError: actions.setRenderError,
    setIsLoading: actions.setIsLoading,
  };
}

// Hook for accessing application metadata
export function useAppMetadata() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppMetadata must be used within an AppStateProvider");
  }
  const { state } = context;

  return {
    lastSaved: state.lastSaved,
    hasUnsavedChanges: state.lastSaved
      ? Date.now() - state.lastSaved.getTime() > 1000
      : false,
    storageAvailable: AppStorage.isStorageAvailable(),
  };
}

// Hook for checking initialization status
export function useInitializationStatus() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useInitializationStatus must be used within an AppStateProvider");
  }
  const { state } = context;

  return {
    isUsingDefaultContent: AppInitializer.isUsingDefaultContent(state.editorContent),
    isFirstTimeUser: AppInitializer.isFirstTimeUser(),
    hasUnsavedChanges: state.lastSaved 
      ? Date.now() - state.lastSaved.getTime() > 5000 // 5 seconds threshold
      : false,
    initializationStatus: AppInitializer.getInitializationStatus(),
  };
}

// Main hook for accessing the full app state context
export function useAppState(): AppContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
