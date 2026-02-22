'use client';

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { FiCopy, FiRotateCcw } from 'react-icons/fi';
import { MERMAID_LIGHT_THEME, MERMAID_DARK_THEME } from '@/lib/monaco-themes';
import { toast } from "../lib/toast-utils";

interface SimpleEditorProps {
  content: string;
  onChange: (content: string) => void;
  theme?: 'light' | 'dark';
}

export interface SimpleEditorRef {
  insertTemplate: (template: string) => void;
  focus: () => void;
}

// Memoized editor options to prevent unnecessary re-renders
const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  lineNumbers: 'on',
  roundedSelection: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'off',
  selectOnLineNumbers: true,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  renderWhitespace: 'selection',
  contextmenu: true,
  smoothScrolling: true,
  overviewRulerBorder: false,
  readOnly: false,
  domReadOnly: false,
  cursorSmoothCaretAnimation: 'on',
  // Disable ALL suggestions and autocomplete
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  acceptSuggestionOnEnter: 'off',
  wordBasedSuggestions: 'off',
  suggest: {
    showWords: false,
    showSnippets: false
  },
  parameterHints: {
    enabled: false
  },
  hover: {
    enabled: false
  },
  folding: false,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto',
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false
  },
  find: {
    addExtraSpaceOnTop: false,
    autoFindInSelection: 'never',
    seedSearchStringFromSelection: 'always'
  }
};

const SimpleEditor = forwardRef<SimpleEditorRef, SimpleEditorProps>(({ 
  content, 
  onChange, 
  theme = 'light'
}, ref) => {
  const editorRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    insertTemplate: (template: string) => {
      if (editorRef.current) {
        const editor = editorRef.current;
        const model = editor.getModel();
        if (model) {
          // Replace all content with the template
          const fullRange = {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: model.getLineCount(),
            endColumn: model.getLineMaxColumn(model.getLineCount())
          };
          
          editor.executeEdits('replace-all-content', [{
            range: fullRange,
            text: template,
            forceMoveMarkers: true
          }]);
          
          editor.focus();
        }
      }
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  }), []);

  // Handle editor mount with essential Mermaid configuration
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register Mermaid language
    monaco.languages.register({ id: 'mermaid' });
    
    // Define essential Mermaid syntax highlighting
    monaco.languages.setMonarchTokensProvider('mermaid', {
      tokenizer: {
        root: [
          // Comments
          [/%%.*$/, 'comment'],
          
          // Diagram types
          [/\b(classDiagram|graph|flowchart|sequenceDiagram|stateDiagram)\b/, 'keyword'],
          
          // Direction keywords
          [/\b(TD|TB|BT|RL|LR)\b/, 'keyword'],
          
          // Class diagram keywords
          [/\b(class|interface|enum)\b/, 'keyword'],
          
          // Relationship operators
          [/(<\|--|--\||<--|\-\->|\*--|\-\-\*|o--|\-\-o)/, 'operator'],
          
          // Class names and identifiers
          [/\b[A-Za-z_][A-Za-z0-9_]*\b/, 'identifier'],
          
          // Strings
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*'/, 'string'],
          
          // Numbers
          [/\d+/, 'number'],
          
          // Brackets and braces
          [/[{}()\[\]]/, 'bracket'],
          
          // Special characters
          [/[;,.]/, 'delimiter'],
          [/[+\-*/]/, 'operator'],
        ]
      }
    });

    // Define Vercel themes
    monaco.editor.defineTheme('mermaid-light', MERMAID_LIGHT_THEME);
    monaco.editor.defineTheme('mermaid-dark', MERMAID_DARK_THEME);

    // Apply theme immediately
    monaco.editor.setTheme(theme === 'dark' ? 'mermaid-dark' : 'mermaid-light');

    // Focus the editor
    editor.focus();
  }, [theme]);

  // Handle content changes
  const handleEditorChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  }, [content]);

  // Reset editor to default content
  const handleResetEditor = useCallback(() => {
    const defaultContent = `classDiagram
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
    
    onChange(defaultContent);
  }, [onChange]);

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current && typeof window !== 'undefined') {
      const monaco = (window as any).monaco; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (monaco && monaco.editor) {
        // Themes are already defined in handleEditorDidMount
        monaco.editor.setTheme(theme === 'dark' ? 'mermaid-dark' : 'mermaid-light');
      }
    }
  }, [theme]);

  // Remove error decoration logic - errors are only shown in preview now
  // This prevents interference with editor focus and cursor behavior

  // Handle clicks on editor wrapper to restore focus
  const handleEditorWrapperClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editorRef.current) {
      // Force focus on click
      editorRef.current.focus();
      
      // Also trigger layout update to ensure editor is responsive
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.layout();
        }
      }, 10);
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header editor-header">
        <div className="panel-title">Editor</div>
        <div className="panel-actions">
          <button className="icon-btn" title="Copy Code" aria-label="Copy Code" onClick={handleCopyCode}>
            <FiCopy size={18} />
          </button>
          <button className="icon-btn" title="Reset Editor" aria-label="Reset Editor" onClick={handleResetEditor}>
            <FiRotateCcw size={18} />
          </button>
        </div>
      </div>
      <div className="panel-body">
        <div 
          className="monaco-editor-wrapper"
          onClick={handleEditorWrapperClick}
          onMouseDown={handleEditorWrapperClick}
        >
          <Editor
            height="100%"
            language="mermaid"
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme === 'dark' ? 'mermaid-dark' : 'mermaid-light'}
            options={EDITOR_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
});

SimpleEditor.displayName = 'SimpleEditor';

export default SimpleEditor;