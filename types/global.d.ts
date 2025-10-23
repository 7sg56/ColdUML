// Global type declarations for Mermaid UML Editor
// Note: Mermaid v10+ provides its own type definitions

// Monaco Editor types are already provided by monaco-editor package
// but we can extend them if needed for our specific use case
declare module '@monaco-editor/react' {
  import { editor } from 'monaco-editor';
  
  export interface EditorProps {
    height?: string | number;
    width?: string | number;
    language?: string;
    value?: string;
    theme?: string;
    options?: editor.IStandaloneEditorConstructionOptions;
    onChange?: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    onMount?: (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void;
  }

  export const Editor: React.ComponentType<EditorProps>;
  export default Editor;
}

// UML Template types for our application
export interface UMLTemplate {
  id: string;
  label: string;
  template: string;
  description: string;
}

export interface AppState {
  editorContent: string;
  cursorPosition: number;
  theme: 'light' | 'dark';
  lastSaved: Date | null;
  renderError: string | null;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'code';
  filename: string;
  quality?: number;
}