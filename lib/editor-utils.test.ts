import { insertTextAtPosition, getCursorOffset, offsetToPosition } from './editor-utils';

// Mock Monaco and Editor interfaces
const mockEditor = {
  getModel: jest.fn(),
  getPosition: jest.fn(),
  executeEdits: jest.fn(),
  setPosition: jest.fn(),
  focus: jest.fn(),
};

const mockModel = {
  getLineContent: jest.fn(),
  getOffsetAt: jest.fn(),
  getPositionAt: jest.fn(),
};

// Mock global monaco object
const mockMonaco = {
  Range: class MockRange {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
  Position: class MockPosition {
    constructor(public lineNumber: number, public column: number) {}
  },
};

describe('editor-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).monaco = mockMonaco;
    mockEditor.getModel.mockReturnValue(mockModel);
  });

  afterEach(() => {
    delete (window as any).monaco;
  });

  describe('insertTextAtPosition', () => {
    it('should insert text at current cursor position if no position provided', () => {
      const currentPos = new mockMonaco.Position(1, 1);
      mockEditor.getPosition.mockReturnValue(currentPos);

      insertTextAtPosition(mockEditor as any, 'hello');

      expect(mockEditor.executeEdits).toHaveBeenCalledWith('insert-template', [
        expect.objectContaining({
          text: 'hello',
          range: expect.any(mockMonaco.Range),
          forceMoveMarkers: true,
        }),
      ]);

      // Verify Range arguments
      const call = mockEditor.executeEdits.mock.calls[0];
      const op = call[1][0];
      expect(op.range.startLineNumber).toBe(1);
      expect(op.range.startColumn).toBe(1);
      expect(op.range.endLineNumber).toBe(1);
      expect(op.range.endColumn).toBe(1);

      expect(mockEditor.setPosition).toHaveBeenCalled();
      expect(mockEditor.focus).toHaveBeenCalled();
    });

    it('should insert text at specific position', () => {
      const targetPos = new mockMonaco.Position(2, 5);

      insertTextAtPosition(mockEditor as any, 'world', targetPos as any);

      const call = mockEditor.executeEdits.mock.calls[0];
      const op = call[1][0];
      expect(op.range.startLineNumber).toBe(2);
      expect(op.range.startColumn).toBe(5);
      expect(op.range.endLineNumber).toBe(2);
      expect(op.range.endColumn).toBe(5);
    });

    it('should handle multiline text insertion correctly', () => {
      const currentPos = new mockMonaco.Position(1, 1);
      mockEditor.getPosition.mockReturnValue(currentPos);
      const text = 'line1\nline2';

      insertTextAtPosition(mockEditor as any, text);

      expect(mockEditor.setPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          lineNumber: 2,
          column: 6 // length of 'line2' (5) + 1
        })
      );
    });

    it('should do nothing if monaco is not defined', () => {
      delete (window as any).monaco;
      insertTextAtPosition(mockEditor as any, 'test');
      expect(mockEditor.executeEdits).not.toHaveBeenCalled();
    });
  });

  describe('getCursorOffset', () => {
    it('should return offset from model', () => {
      const pos = { lineNumber: 1, column: 5 };
      mockEditor.getPosition.mockReturnValue(pos);
      mockModel.getOffsetAt.mockReturnValue(10);

      const offset = getCursorOffset(mockEditor as any);
      expect(offset).toBe(10);
      expect(mockModel.getOffsetAt).toHaveBeenCalledWith(pos);
    });

    it('should return 0 if no model or position', () => {
      mockEditor.getModel.mockReturnValue(null);
      expect(getCursorOffset(mockEditor as any)).toBe(0);
    });
  });

  describe('offsetToPosition', () => {
    it('should return position from model', () => {
      const pos = { lineNumber: 1, column: 5 };
      mockModel.getPositionAt.mockReturnValue(pos);

      const result = offsetToPosition(mockModel as any, 10);
      expect(result).toBe(pos);
      expect(mockModel.getPositionAt).toHaveBeenCalledWith(10);
    });
  });
});
