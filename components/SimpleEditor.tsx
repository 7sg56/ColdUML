'use client';

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { FiCopy, FiRotateCcw } from 'react-icons/fi';

interface SimpleEditorProps {
  content: string;
  onChange: (content: string) => void;
  theme?: 'light' | 'dark';
}

export interface SimpleEditorRef {
  insertTemplate: (template: string) => void;
  focus: () => void;
}

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

    // Define simple themes
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
        'editor.foreground': '#24292e'
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
        'editor.foreground': '#f0f6fc'
      }
    });

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
      // You can add a toast notification here if needed
      console.log('Code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
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
        monaco.editor.setTheme(theme === 'dark' ? 'mermaid-dark' : 'mermaid-light');
      }
    }
  }, [theme]);

  return (
    <div className="h-full flex flex-col bg-panel-background">
      <div className="panel-header">
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
      <div className="flex-1 min-h-0 monaco-editor-wrapper">
        <Editor
          height="100%"
          language="mermaid"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'mermaid-dark' : 'mermaid-light'}
          options={{
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
          }}
        />
      </div>
    </div>
  );
});

SimpleEditor.displayName = 'SimpleEditor';

export default SimpleEditor;