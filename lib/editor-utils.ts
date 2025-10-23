/**
 * Insert text at a specific position in the Monaco editor
 */
export function insertTextAtPosition(
  editor: Record<string, unknown>, // monaco.editor.IStandaloneCodeEditor
  text: string,
  position?: Record<string, unknown> // monaco.Position
): void {
  const monaco = (window as unknown as { monaco?: Record<string, unknown> })
    .monaco;
  if (!monaco || typeof monaco !== "object") return;

  if (typeof editor.getModel !== "function") return;
  const model = (editor.getModel as () => Record<string, unknown> | null)();
  if (!model) return;

  if (typeof editor.getPosition !== "function") return;
  const insertPosition =
    position || (editor.getPosition as () => Record<string, unknown> | null)();
  if (!insertPosition) return;

  if (typeof monaco.Range !== "function") return;
  const Range = monaco.Range as new (...args: unknown[]) => Record<
    string,
    unknown
  >;
  const range = new Range(
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

  if (typeof editor.executeEdits === "function") {
    (editor.executeEdits as (source: string, operations: unknown[]) => void)(
      "insert-template",
      [operation]
    );
  }

  // Move cursor to end of inserted text
  const lines = text.split("\n");
  const lastLine = lines[lines.length - 1];

  if (typeof monaco.Position === "function") {
    const Position = monaco.Position as new (...args: unknown[]) => Record<
      string,
      unknown
    >;
    const newPosition = new Position(
      (insertPosition.lineNumber as number) + lines.length - 1,
      lines.length === 1
        ? (insertPosition.column as number) + lastLine.length
        : lastLine.length + 1
    );

    if (typeof editor.setPosition === "function") {
      (editor.setPosition as (position: Record<string, unknown>) => void)(
        newPosition
      );
    }
  }

  if (typeof editor.focus === "function") {
    (editor.focus as () => void)();
  }
}

/**
 * Get the current cursor position as an offset from the beginning of the document
 */
export function getCursorOffset(editor: Record<string, unknown>): number {
  if (
    typeof editor.getModel !== "function" ||
    typeof editor.getPosition !== "function"
  )
    return 0;

  const model = (editor.getModel as () => Record<string, unknown> | null)();
  const position = (
    editor.getPosition as () => Record<string, unknown> | null
  )();

  if (!model || !position || typeof model.getOffsetAt !== "function") return 0;

  return (model.getOffsetAt as (position: Record<string, unknown>) => number)(
    position
  );
}

/**
 * Convert an offset to a Monaco Position
 */
export function offsetToPosition(
  model: Record<string, unknown>,
  offset: number
): Record<string, unknown> | null {
  if (typeof model.getPositionAt !== "function") return null;
  return (model.getPositionAt as (offset: number) => Record<string, unknown>)(
    offset
  );
}

/**
 * Insert text at a specific offset in the editor content
 */
export function insertTextAtOffset(
  editor: Record<string, unknown>,
  text: string,
  offset: number
): void {
  if (typeof editor.getModel !== "function") return;
  const model = (editor.getModel as () => Record<string, unknown> | null)();
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
  editorRef: React.RefObject<Record<string, unknown>>
): Record<string, unknown> | null {
  return editorRef.current;
}

/**
 * Configure editor for optimal UML editing experience
 */
export function configureEditorForUML(editor: Record<string, unknown>): void {
  const monaco = (window as unknown as { monaco?: Record<string, unknown> })
    .monaco;
  if (!monaco || typeof monaco !== "object") return;
  if (
    typeof editor.addCommand !== "function" ||
    typeof editor.trigger !== "function"
  )
    return;

  const KeyMod = monaco.KeyMod as Record<string, unknown>;
  const KeyCode = monaco.KeyCode as Record<string, unknown>;

  if (!KeyMod || !KeyCode) return;

  // Add custom commands for UML editing
  (editor.addCommand as (key: unknown, handler: () => void) => void)(
    (KeyMod.CtrlCmd as number) | (KeyCode.KeyD as number),
    () => {
      // Duplicate line
      (
        editor.trigger as (
          source: string,
          action: string,
          args: Record<string, unknown>
        ) => void
      )("keyboard", "editor.action.copyLinesDownAction", {});
    }
  );

  (editor.addCommand as (key: unknown, handler: () => void) => void)(
    (KeyMod.CtrlCmd as number) | (KeyCode.Slash as number),
    () => {
      // Toggle line comment
      (
        editor.trigger as (
          source: string,
          action: string,
          args: Record<string, unknown>
        ) => void
      )("keyboard", "editor.action.commentLine", {});
    }
  );

  (editor.addCommand as (key: unknown, handler: () => void) => void)(
    (KeyMod.CtrlCmd as number) |
      (KeyMod.Shift as number) |
      (KeyCode.KeyK as number),
    () => {
      // Delete line
      (
        editor.trigger as (
          source: string,
          action: string,
          args: Record<string, unknown>
        ) => void
      )("keyboard", "editor.action.deleteLines", {});
    }
  );
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
  editor: Record<string, unknown>,
  template: string
): void {
  if (
    typeof editor.getModel !== "function" ||
    typeof editor.getPosition !== "function"
  )
    return;

  const model = (editor.getModel as () => Record<string, unknown> | null)();
  const position = (
    editor.getPosition as () => Record<string, unknown> | null
  )();

  if (!model || !position) return;
  if (typeof model.getLineContent !== "function") return;

  // Get current line content to determine if we need a new line
  const currentLine = (model.getLineContent as (lineNumber: number) => string)(
    position.lineNumber as number
  );
  const isLineEmpty = currentLine.trim() === "";
  const isAtEndOfLine = (position.column as number) > currentLine.length;

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
export function canInsertTemplate(editor: Record<string, unknown>): boolean {
  if (
    typeof editor.getModel !== "function" ||
    typeof editor.getPosition !== "function"
  )
    return false;

  const model = (editor.getModel as () => Record<string, unknown> | null)();
  const position = (
    editor.getPosition as () => Record<string, unknown> | null
  )();

  if (!model || !position) return false;

  // Always allow insertion - the smart positioning will handle formatting
  return true;
}

/**
 * Get context information about the cursor position for smart template insertion
 */
export function getCursorContext(editor: Record<string, unknown>): {
  isInClass: boolean;
  isAtLineStart: boolean;
  isAtLineEnd: boolean;
  currentIndentation: number;
} {
  if (
    typeof editor.getModel !== "function" ||
    typeof editor.getPosition !== "function"
  ) {
    return {
      isInClass: false,
      isAtLineStart: true,
      isAtLineEnd: true,
      currentIndentation: 0,
    };
  }

  const model = (editor.getModel as () => Record<string, unknown> | null)();
  const position = (
    editor.getPosition as () => Record<string, unknown> | null
  )();

  if (!model || !position || typeof model.getLineContent !== "function") {
    return {
      isInClass: false,
      isAtLineStart: true,
      isAtLineEnd: true,
      currentIndentation: 0,
    };
  }

  const currentLine = (model.getLineContent as (lineNumber: number) => string)(
    position.lineNumber as number
  );
  const textBeforeCursor = currentLine.substring(
    0,
    (position.column as number) - 1
  );

  // Check if we're inside a class definition by looking at previous lines
  let isInClass = false;
  for (let i = (position.lineNumber as number) - 1; i >= 1; i--) {
    const line = (model.getLineContent as (lineNumber: number) => string)(
      i
    ).trim();
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
    isAtLineEnd: (position.column as number) > currentLine.length,
    currentIndentation:
      textBeforeCursor.length - textBeforeCursor.trimStart().length,
  };
}
