"use client";

import React, {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useContext,
  useState,
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
      return {
        ...state,
        ...action.payload,
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
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  // Simple initialization - just load content from localStorage
  useEffect(() => {
    if (isInitializedRef.current) return;

    try {
      const savedContent = AppStorage.loadEditorContent();
      const initialTheme = ThemeManager.initializeTheme();
      
      if (savedContent && StateValidator.validateEditorContent(savedContent)) {
        dispatch({ type: "SET_EDITOR_CONTENT", payload: savedContent });
      }
      
      if (initialTheme !== state.theme) {
        dispatch({ type: "SET_THEME", payload: initialTheme });
      }

      isInitializedRef.current = true;
      setIsAppInitialized(true);
    } catch (error) {
      console.error("Failed to initialize:", error);
      isInitializedRef.current = true;
      setIsAppInitialized(true);
    }
  }, []);

  // Simple auto-save
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const timeoutId = setTimeout(() => {
      try {
        AppStorage.saveEditorContent(state.editorContent);
      } catch (error) {
        console.error("Failed to save:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.editorContent]);

  // Simple theme change
  useEffect(() => {
    if (!isInitializedRef.current) return;
    ThemeManager.applyTheme(state.theme);
    AppStorage.saveTheme(state.theme);
  }, [state.theme]);

  // Simple action creators
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
    isInitialized: isAppInitialized,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// Simple editor hook
export function useEditorState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useEditorState must be used within an AppStateProvider");
  const { state, actions } = context;

  return {
    content: state.editorContent,
    cursorPosition: state.cursorPosition,
    preferences: state.preferences,
    setContent: actions.setEditorContent,
    setCursorPosition: actions.setCursorPosition,
    insertTemplate: actions.insertTemplate,
  };
}

// Simple theme hook
export function useThemeState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useThemeState must be used within an AppStateProvider");
  const { state, actions } = context;

  return {
    theme: state.theme,
    toggleTheme: () => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      actions.setTheme(newTheme);
    },
  };
}

// Simple preview hook
export function usePreviewState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("usePreviewState must be used within an AppStateProvider");
  const { state, actions } = context;

  return {
    renderError: state.renderError,
    isLoading: state.isLoading,
    setRenderError: actions.setRenderError,
    setIsLoading: actions.setIsLoading,
  };
}

// Simple metadata hook
export function useAppMetadata() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppMetadata must be used within an AppStateProvider");
  const { state } = context;

  return {
    lastSaved: state.lastSaved,
    hasUnsavedChanges: state.lastSaved
      ? Date.now() - state.lastSaved.getTime() > 1000
      : false,
    storageAvailable: AppStorage.isStorageAvailable(),
  };
}

// Main hook for accessing the full app state context
export function useAppState(): AppContextValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within an AppStateProvider");
  return context;
}
