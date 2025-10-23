/**
 * Tests for export utilities
 * Note: These are basic tests that can run in Node.js environment
 * Full browser testing would require a more complex setup
 */

import { validateExportOptions, isExportSupported } from '../export-utils';

describe('Export Utils', () => {
  describe('validateExportOptions', () => {
    it('should return no errors for valid options', () => {
      const options = {
        quality: 0.8,
        scale: 2,
        filename: 'test-diagram'
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid quality', () => {
      const options = {
        quality: 1.5 // Invalid: > 1
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toContain('Quality must be a number between 0 and 1');
    });

    it('should return error for invalid scale', () => {
      const options = {
        scale: 5 // Invalid: > 4
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toContain('Scale must be a number between 1 and 4');
    });

    it('should return error for empty filename', () => {
      const options = {
        filename: '' // Invalid: empty string
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toContain('Filename must be a non-empty string');
    });

    it('should return multiple errors for multiple invalid options', () => {
      const options = {
        quality: -0.5,
        scale: 10,
        filename: ''
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toHaveLength(3);
    });
  });

  describe('isExportSupported', () => {
    // Mock browser APIs for testing
    beforeEach(() => {
      // Mock XMLSerializer
      global.XMLSerializer = jest.fn().mockImplementation(() => ({
        serializeToString: jest.fn().mockReturnValue('<svg></svg>')
      }));

      // Mock Blob
      global.Blob = jest.fn().mockImplementation(() => ({}));

      // Mock URL
      global.URL = {
        createObjectURL: jest.fn(),
        revokeObjectURL: jest.fn()
      } as typeof URL;

      // Mock canvas
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({})
      };
      global.document = {
        createElement: jest.fn().mockReturnValue(mockCanvas)
      } as typeof document;

      // Mock navigator
      global.navigator = {
        clipboard: {
          writeText: jest.fn()
        }
      } as typeof navigator;
    });

    it('should detect SVG export support', () => {
      const support = isExportSupported();
      expect(support.svg).toBe(true);
    });

    it('should detect PNG export support', () => {
      const support = isExportSupported();
      expect(support.png).toBe(true);
    });

    it('should detect clipboard support', () => {
      const support = isExportSupported();
      expect(support.clipboard).toBe(true);
    });
  });
});