/**
 * Custom Monaco themes for Mermaid diagrams
 */

export const MERMAID_LIGHT_THEME = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
    { token: 'operator', foreground: '24292e' },
    { token: 'identifier', foreground: '24292e' },
    { token: 'string', foreground: '032f62' },
    { token: 'number', foreground: '005cc5' },
    { token: 'bracket', foreground: '24292e' },
    { token: 'delimiter', foreground: '24292e' }
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#24292e',
    'editorLineNumber.foreground': '#6a737d',
    'editorLineNumber.activeForeground': '#24292e',
    'editor.selectionBackground': '#0070f340',
    'editor.selectionForeground': '#24292e',
    'editor.inactiveSelectionBackground': '#0070f320',
    'editor.selectionHighlightBackground': '#0070f320',
    'editor.wordHighlightBackground': '#0070f315',
    'editor.wordHighlightStrongBackground': '#0070f325',
    'editor.findMatchBackground': '#0070f340',
    'editor.findMatchHighlightBackground': '#0070f320',
    'editorCursor.foreground': '#24292e',
    'editorWhitespace.foreground': '#d0d7de',
    'editorIndentGuide.background': '#d0d7de',
    'editorIndentGuide.activeBackground': '#6a737d'
  }
};

export const MERMAID_DARK_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
    { token: 'keyword', foreground: '79b8ff', fontStyle: 'bold' },
    { token: 'operator', foreground: '79b8ff' },
    { token: 'identifier', foreground: 'f0f6fc' },
    { token: 'string', foreground: '9ecbff' },
    { token: 'number', foreground: '79b8ff' },
    { token: 'bracket', foreground: 'f0f6fc' },
    { token: 'delimiter', foreground: 'f0f6fc' }
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#f0f6fc',
    'editorLineNumber.foreground': '#7d8590',
    'editorLineNumber.activeForeground': '#f0f6fc',
    'editor.selectionBackground': '#0070f350',
    'editor.selectionForeground': '#ffffff',
    'editor.inactiveSelectionBackground': '#0070f330',
    'editor.selectionHighlightBackground': '#0070f330',
    'editor.wordHighlightBackground': '#0070f320',
    'editor.wordHighlightStrongBackground': '#0070f340',
    'editor.findMatchBackground': '#0070f350',
    'editor.findMatchHighlightBackground': '#0070f330',
    'editorCursor.foreground': '#f0f6fc',
    'editorWhitespace.foreground': '#7d8590',
    'editorIndentGuide.background': '#21262d',
    'editorIndentGuide.activeBackground': '#7d8590'
  }
};
