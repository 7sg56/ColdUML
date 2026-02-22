import { exportAsSVG } from './export-utils';

const mockInitialize = jest.fn();
const mockRender = jest.fn().mockResolvedValue({ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>' });

jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: mockInitialize,
    render: mockRender,
  },
}));

describe('Export Utils Security', () => {
  beforeAll(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    Object.defineProperty(global.URL, 'createObjectURL', { value: jest.fn(() => 'mock-url') });
    Object.defineProperty(global.URL, 'revokeObjectURL', { value: jest.fn() });

    // Mock XMLSerializer
    global.XMLSerializer = class {
      serializeToString = jest.fn(() => '<svg>mock serialized</svg>');
    } as unknown as typeof XMLSerializer;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize mermaid with strict security level', async () => {
    const result = await exportAsSVG('graph TD; A-->B');

    // We expect success because we mocked everything
    expect(result.success).toBe(true);

    // Check if initialize was called with securityLevel: 'strict'
    // This confirms the vulnerability is fixed
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({
        securityLevel: 'strict',
      })
    );
  });
});
