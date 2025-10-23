'use client';

import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { configureEditorForUML, insertTemplateAtCursor } from '@/lib/editor-utils';
import { useEditorState } from './AppStateProvider';

interface EditorPanelProps {
  content: string;
  onChange: (content: string) => void;
  onCursorPositionChange: (position: number) => void;
  theme?: 'light' | 'dark';
}

export interface EditorPanelRef {
  insertTemplate: (template: string) => void;
  getEditor: () => unknown; // monaco.editor.IStandaloneCodeEditor | null
  focus: () => void;
}

const EditorPanel = forwardRef<EditorPanelRef, EditorPanelProps>(({ 
  content, 
  onChange, 
  onCursorPositionChange,
  theme 
}, ref) => {
  const editorRef = useRef<unknown>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use centralized state management for editor-specific functionality
  const { setContent, preferences } = useEditorState();

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    insertTemplate: (template: string) => {
      if (editorRef.current) {
        insertTemplateAtCursor(editorRef.current as unknown as Record<string, unknown>, template);
      }
    },
    getEditor: () => editorRef.current,
    focus: () => {
      const editor = editorRef.current as unknown as Record<string, unknown> | null;
      if (editor && 'focus' in editor && typeof editor.focus === 'function') {
        (editor.focus as () => void)();
      }
    }
  }), []);

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure Mermaid syntax highlighting
    monaco.languages.register({ id: 'mermaid' });
    
    // Define Mermaid language tokens
    monaco.languages.setMonarchTokensProvider('mermaid', {
      tokenizer: {
        root: [
          // Comments
          [/%%.*$/, 'comment'],
          
          // Diagram types
          [/\b(classDiagram|graph|flowchart|sequenceDiagram|stateDiagram|erDiagram|journey|gitgraph|pie|quadrantChart|requirement|mindmap|timeline|zenuml|sankey|block-beta)\b/, 'keyword'],
          
          // Direction keywords
          [/\b(TD|TB|BT|RL|LR)\b/, 'keyword'],
          
          // Class diagram keywords
          [/\b(class|interface|enum|abstract|static|public|private|protected)\b/, 'keyword'],
          
          // Relationship operators
          [/(<\|--|--\||<\|\.\.|\.\.\|>|<--|\-\->|<\.\.|\.\.\>|\*--|\-\-\*|o--|\-\-o|<\|>)/, 'operator'],
          
          // Arrows and connections
          [/(\-\-|\.\.|==|~~|\-\.\-|\-\-\>|<\-\-|\.\.\>|<\.\.)/, 'operator'],
          
          // Class names and identifiers
          [/\b[A-Za-z_][A-Za-z0-9_]*\b/, 'identifier'],
          
          // Strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          
          // Numbers
          [/\d+/, 'number'],
          
          // Brackets and braces
          [/[{}()\[\]]/, 'bracket'],
          
          // Special characters
          [/[;,.]/, 'delimiter'],
          [/[+\-*/]/, 'operator'],
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Configure theme colors for Mermaid
    monaco.editor.defineTheme('mermaid-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
        { token: 'operator', foreground: '005cc5' },
        { token: 'identifier', foreground: '24292e' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' },
        { token: 'bracket', foreground: '24292e' },
        { token: 'delimiter', foreground: '24292e' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e',
        'editorLineNumber.foreground': '#959da5',
        'editor.selectionBackground': '#c8e1ff',
        'editor.lineHighlightBackground': '#f6f8fa'
      }
    });

    monaco.editor.defineTheme('mermaid-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'operator', foreground: '79c0ff' },
        { token: 'identifier', foreground: 'f0f6fc' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'bracket', foreground: 'f0f6fc' },
        { token: 'delimiter', foreground: 'f0f6fc' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#f0f6fc',
        'editorLineNumber.foreground': '#7d8590',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#21262d'
      }
    });

    // Set the appropriate theme - use setTimeout to ensure themes are defined
    setTimeout(() => {
      monaco.editor.setTheme(theme === 'dark' ? 'mermaid-dark' : 'mermaid-light');
    }, 0);

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
      const model = editor.getModel();
      if (model) {
        const offset = model.getOffsetAt(e.position);
        onCursorPositionChange(offset);
      }
    });

    // Configure editor for UML editing with keyboard shortcuts
    configureEditorForUML(editor as unknown as Record<string, unknown>);
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Prevent default save behavior
      return null;
    });

    // Add keyboard shortcuts for UML templates
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1, () => {
      // Insert New Class template
      insertTemplateAtCursor(editor as unknown as Record<string, unknown>, `class ClassName {
    +publicMethod()
    -privateAttribute
    #protectedMethod()
}`);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2, () => {
      // Insert Inheritance template
      insertTemplateAtCursor(editor as unknown as Record<string, unknown>, 'Parent <|-- Child');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3, () => {
      // Insert Association template
      insertTemplateAtCursor(editor as unknown as Record<string, unknown>, 'ClassA --> ClassB');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit4, () => {
      // Insert Composition template
      insertTemplateAtCursor(editor as unknown as Record<string, unknown>, 'ClassA *-- ClassB');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit5, () => {
      // Insert Aggregation template
      insertTemplateAtCursor(editor as unknown as Record<string, unknown>, 'ClassA o-- ClassB');
    });

    // Focus the editor
    editor.focus();
  }, [onCursorPositionChange, theme]);

  // Handle content changes with debouncing
  const handleEditorChange: OnChange = useCallback((value) => {
    if (value === undefined) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced onChange using user preferences
    debounceTimeoutRef.current = setTimeout(() => {
      // Update centralized state
      setContent(value);
      // Also call the prop callback for backward compatibility
      onChange(value);
    }, preferences.debounceDelay);
  }, [onChange, setContent, preferences.debounceDelay]);

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      const monaco = (window as unknown as { monaco?: Record<string, unknown> }).monaco;
      if (monaco && typeof monaco === 'object' && 'editor' in monaco) {
        const monacoEditor = monaco.editor as Record<string, unknown>;
        // Ensure the theme is applied
        try {
          if (typeof monacoEditor.setTheme === 'function') {
            (monacoEditor.setTheme as (theme: string) => void)(theme === 'dark' ? 'mermaid-dark' : 'mermaid-light');
          }
        } catch (error) {
          console.warn('Failed to set Monaco theme:', error);
          // Fallback to built-in themes
          if (typeof monacoEditor.setTheme === 'function') {
            (monacoEditor.setTheme as (theme: string) => void)(theme === 'dark' ? 'vs-dark' : 'vs');
          }
        }
      }
    }
  }, [theme]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full w-full border-r border-gray-200 dark:border-gray-700">
      <div className="h-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Editor
        </span>
      </div>
      <div className="h-[calc(100%-2rem)]">
        <Editor
          height="100%"
          language="mermaid"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            fontSize: preferences.fontSize,
            lineNumbers: preferences.lineNumbers ? 'on' : 'off',
            roundedSelection: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
            },
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: preferences.wordWrap ? 'on' : 'off',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            selectOnLineNumbers: true,
            selectionHighlight: false,
            cursorStyle: 'line',
            cursorBlinking: 'blink',
            renderWhitespace: 'selection',
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on',
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'always'
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true,
              showWords: true
            }
          }}
        />
      </div>
    </div>
  );
});

EditorPanel.displayName = 'EditorPanel';

export default EditorPanel;