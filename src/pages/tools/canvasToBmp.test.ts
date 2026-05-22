import { describe, it, expect } from 'vitest';
import { canvasToBmpBlob, formatBytes } from './ImageEditor';

describe('formatBytes helper', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('canvasToBmpBlob converter', () => {
  it('correctly constructs a BMP binary blob with valid headers', async () => {
    // 2x2 mock canvas
    const mockCanvas = {
      width: 2,
      height: 2,
      getContext: (type: string) => {
        if (type === '2d') {
          return {
            getImageData: () => {
              return {
                // 4 pixels: Red, Green, Blue, White
                data: new Uint8ClampedArray([
                  255, 0, 0, 255,     0, 255, 0, 255,
                  0, 0, 255, 255,     255, 255, 255, 255
                ])
              };
            }
          };
        }
        return null;
      }
    } as unknown as HTMLCanvasElement;

    const blob = canvasToBmpBlob(mockCanvas);
    expect(blob.type).toBe('image/bmp');
    
    // Convert blob to ArrayBuffer to inspect bytes
    const arrayBuffer = await blob.arrayBuffer();
    const u8 = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    // Verify BMP Signature 'BM'
    expect(u8[0]).toBe(0x42); // 'B'
    expect(u8[1]).toBe(0x4D); // 'M'

    // File size header (54 bytes header + pixel data)
    // 24 bits * 2 width = 48 bits = 6 bytes + 2 bytes padding per row = 8 bytes per row.
    // 2 rows * 8 bytes = 16 bytes pixel data.
    // Total size = 54 + 16 = 70 bytes.
    expect(view.getUint32(2, true)).toBe(70);

    // Pixel data offset = 54
    expect(view.getUint32(10, true)).toBe(54);

    // DIB Header size (40)
    expect(view.getUint32(14, true)).toBe(40);
    // Width (2)
    expect(view.getInt32(18, true)).toBe(2);
    // Height (2)
    expect(view.getInt32(22, true)).toBe(2);
    // Color planes (1)
    expect(view.getUint16(26, true)).toBe(1);
    // Bits per pixel (24)
    expect(view.getUint16(28, true)).toBe(24);
    // Compression (0 = BI_RGB)
    expect(view.getUint32(30, true)).toBe(0);
  });
});
