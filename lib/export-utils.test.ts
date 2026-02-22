
import { exportAsSVG } from './export-utils';
import mermaid from 'mermaid';

// Mock mermaid
jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn().mockImplementation((id) => {
      // Return a simple SVG string
      return Promise.resolve({ svg: `<svg id="${id}" viewBox="0 0 100 100"></svg>` });
    }),
  },
}));

describe('exportAsSVG', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
    } else {
        jest.spyOn(global.URL, 'createObjectURL').mockReturnValue('blob:url');
    }

    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = jest.fn();
    } else {
        jest.spyOn(global.URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    // Allow console.error to see what's wrong
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should verify the ID format', async () => {
    const result = await exportAsSVG('graph TD; A-->B;');

    if (!result.success) {
      console.log('Export failed with error:', result.error);
    }

    expect(result.success).toBe(true);

    expect(mermaid.render).toHaveBeenCalled();
    const [id] = (mermaid.render as jest.Mock).mock.calls[0];

    const parts = id.split('-');

    expect(parts[0]).toBe('mermaid');
    expect(parts[1]).toBe('export');

    // Extract the random part(s)
    // UUID has hyphens, so random part is split into multiple parts
    // mermaid-export-TIMESTAMP-UUID
    // UUID itself is part1-part2-part3-part4-part5

    const randomPart = parts.slice(3).join('-');

    // Check if it looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(randomPart);

    if (!isUUID) {
       throw new Error('ID is NOT using UUID format: ' + id);
    }
    expect(isUUID).toBe(true);
  });
});
