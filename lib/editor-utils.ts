import type * as Monaco from "monaco-editor";
import type { RefObject } from "react";

// Helper to get typed monaco instance from window
function getMonaco(): typeof Monaco | undefined {
  return (window as any).monaco;
}

/**
 * Insert text at a specific position in the Monaco editor
 */
export function insertTextAtPosition(
  editor: Monaco.editor.IStandaloneCodeEditor,
  text: string,
  position?: Monaco.Position
): void {
  const monaco = getMonaco();
  if (!monaco) return;

  const model = editor.getModel();
  if (!model) return;

  const insertPosition = position || editor.getPosition();
  if (!insertPosition) return;

  const range = new monaco.Range(
    insertPosition.lineNumber,
    insertPosition.column,
    insertPosition.lineNumber,
    insertPosition.column
  );

  const operation = {
    range,
    text,
    forceMoveMarkers: true,
  };

  editor.executeEdits("insert-template", [operation]);

  // Move cursor to end of inserted text
  const lines = text.split("\n");
  const lastLine = lines[lines.length - 1];

  const newPosition = new monaco.Position(
    insertPosition.lineNumber + lines.length - 1,
    lines.length === 1
      ? insertPosition.column + lastLine.length
      : lastLine.length + 1
  );

  editor.setPosition(newPosition);
  editor.focus();
}

/**
 * Get the current cursor position as an offset from the beginning of the document
 */
export function getCursorOffset(
  editor: Monaco.editor.IStandaloneCodeEditor
): number {
  const model = editor.getModel();
  const position = editor.getPosition();

  if (!model || !position) return 0;

  return model.getOffsetAt(position);
}

/**
 * Convert an offset to a Monaco Position
 */
export function offsetToPosition(
  model: Monaco.editor.ITextModel,
  offset: number
): Monaco.Position | null {
  return model.getPositionAt(offset);
}

/**
 * Insert text at a specific offset in the editor content
 */
export function insertTextAtOffset(
  editor: Monaco.editor.IStandaloneCodeEditor,
  text: string,
  offset: number
): void {
  const model = editor.getModel();
  if (!model) return;

  const position = offsetToPosition(model, offset);
  if (position) {
    insertTextAtPosition(editor, text, position);
  }
}

/**
 * Get the editor reference for external use
 */
export function getEditorInstance(
  editorRef: RefObject<Monaco.editor.IStandaloneCodeEditor>
): Monaco.editor.IStandaloneCodeEditor | null {
  return editorRef.current;
}

/**
 * Configure editor for optimal UML editing experience
 */
export function configureEditorForUML(
  editor: Monaco.editor.IStandaloneCodeEditor
): void {
  const monaco = getMonaco();
  if (!monaco) return;

  const KeyMod = monaco.KeyMod;
  const KeyCode = monaco.KeyCode;

  // Add custom commands for UML editing
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyD, () => {
    // Duplicate line
    editor.trigger("keyboard", "editor.action.copyLinesDownAction", {});
  });

  editor.addCommand(KeyMod.CtrlCmd | KeyCode.Slash, () => {
    // Toggle line comment
    editor.trigger("keyboard", "editor.action.commentLine", {});
  });

  editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyK, () => {
    // Delete line
    editor.trigger("keyboard", "editor.action.deleteLines", {});
  });
}

/**
 * Format Mermaid code with proper indentation
 */
export function formatMermaidCode(code: string): string {
  const lines = code.split("\n");
  let indentLevel = 0;
  const indentSize = 2;

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Decrease indent for closing braces
      if (trimmed === "}" || trimmed.startsWith("}")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formatted = " ".repeat(indentLevel * indentSize) + trimmed;

      // Increase indent for opening braces and class definitions
      if (trimmed.endsWith("{") || trimmed.startsWith("class ")) {
        indentLevel++;
      }

      return formatted;
    })
    .join("\n");
}

/**
 * Insert template with smart positioning and formatting
 */
export function insertTemplateAtCursor(
  editor: Monaco.editor.IStandaloneCodeEditor,
  template: string
): void {
  const model = editor.getModel();
  const position = editor.getPosition();

  if (!model || !position) return;

  // Get current line content to determine if we need a new line
  const currentLine = model.getLineContent(position.lineNumber);
  const isLineEmpty = currentLine.trim() === "";
  const isAtEndOfLine = position.column > currentLine.length;

  // Prepare the template text with appropriate spacing
  let textToInsert = template;

  // Add newlines for proper spacing if needed
  if (!isLineEmpty && !isAtEndOfLine) {
    textToInsert = "\n" + template;
  }

  // If inserting a multi-line template, ensure proper spacing after
  if (template.includes("\n")) {
    textToInsert += "\n";
  }

  insertTextAtPosition(editor, textToInsert, position);
}

/**
 * Check if the current cursor position is appropriate for template insertion
 */
export function canInsertTemplate(
  editor: Monaco.editor.IStandaloneCodeEditor
): boolean {
  const model = editor.getModel();
  const position = editor.getPosition();

  if (!model || !position) return false;

  // Always allow insertion - the smart positioning will handle formatting
  return true;
}

/**
 * Get context information about the cursor position for smart template insertion
 */
export function getCursorContext(
  editor: Monaco.editor.IStandaloneCodeEditor
): {
  isInClass: boolean;
  isAtLineStart: boolean;
  isAtLineEnd: boolean;
  currentIndentation: number;
} {
  const model = editor.getModel();
  const position = editor.getPosition();

  if (!model || !position) {
    return {
      isInClass: false,
      isAtLineStart: true,
      isAtLineEnd: true,
      currentIndentation: 0,
    };
  }

  const currentLine = model.getLineContent(position.lineNumber);
  const textBeforeCursor = currentLine.substring(0, position.column - 1);

  // Check if we're inside a class definition by looking at previous lines
  let isInClass = false;
  for (let i = position.lineNumber - 1; i >= 1; i--) {
    const line = model.getLineContent(i).trim();
    if (line.startsWith("class ") && line.includes("{")) {
      isInClass = true;
      break;
    }
    if (line === "}") {
      break;
    }
  }

  return {
    isInClass,
    isAtLineStart: textBeforeCursor.trim() === "",
    isAtLineEnd: position.column > currentLine.length,
    currentIndentation:
      textBeforeCursor.length - textBeforeCursor.trimStart().length,
  };
}
