/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';

// Polyfill DOMMatrix for JSDOM environments where it is not defined
if (typeof window !== 'undefined') {
  if (!(window as any).DOMMatrix) {
    class DOMMatrixMock {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor() {}
    }
    (window as any).DOMMatrix = DOMMatrixMock;
  }

  // Also mock URL.createObjectURL if it doesn't exist
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => '';
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }
}
