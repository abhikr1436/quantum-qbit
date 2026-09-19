/**
 * High-performance, client-side ICO (Windows Icon / Favicon) binary encoder.
 * Packs multi-resolution PNG-encoded bitmaps into a standard RFC/Microsoft ICONDIR container.
 */

export interface IcoEncodeOptions {
  sizes?: number[]; // e.g. [16, 32, 48, 64, 128, 256] or [32]
  multiSize?: boolean;
  singleSize?: number;
}

/**
 * Creates an ICO Blob from an HTMLCanvasElement or ImageBitmap
 */
export async function createIcoBlob(
  sourceCanvas: HTMLCanvasElement,
  options: IcoEncodeOptions = {}
): Promise<Blob> {
  const sizes = options.sizes && options.sizes.length > 0
    ? options.sizes
    : (options.multiSize === false && options.singleSize)
      ? [options.singleSize]
      : [16, 32, 48, 64, 128, 256];

  // Generate PNG ArrayBuffers for each requested resolution
  const pngEntries: { size: number; buffer: ArrayBuffer }[] = [];

  for (const size of sizes) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = size;
    resizedCanvas.height = size;
    const ctx = resizedCanvas.getContext('2d');
    if (!ctx) continue;

    // High quality bicubic scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, size, size);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      resizedCanvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (pngBlob) {
      const buffer = await pngBlob.arrayBuffer();
      pngEntries.push({ size, buffer });
    }
  }

  if (pngEntries.length === 0) {
    throw new Error('Failed to generate any PNG frames for ICO encoding.');
  }

  const numImages = pngEntries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + (numImages * dirEntrySize);

  let totalDataSize = 0;
  for (const entry of pngEntries) {
    totalDataSize += entry.buffer.byteLength;
  }

  const totalFileSize = totalDirSize + totalDataSize;
  const outputBuffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(outputBuffer);

  // 1. ICONDIR Header (6 bytes)
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Image type: 1 = ICO
  view.setUint16(4, numImages, true); // Number of images

  // 2. ICONDIRENTRY Table & Data Writing
  let currentOffset = totalDirSize;
  const uint8View = new Uint8Array(outputBuffer);

  for (let i = 0; i < numImages; i++) {
    const entry = pngEntries[i];
    const entryOffset = headerSize + (i * dirEntrySize);
    const dataSize = entry.buffer.byteLength;

    // Width (0 represents 256)
    view.setUint8(entryOffset + 0, entry.size >= 256 ? 0 : entry.size);
    // Height (0 represents 256)
    view.setUint8(entryOffset + 1, entry.size >= 256 ? 0 : entry.size);
    // Color Count (0 if >= 8bpp)
    view.setUint8(entryOffset + 2, 0);
    // Reserved (0)
    view.setUint8(entryOffset + 3, 0);
    // Color Planes (1)
    view.setUint16(entryOffset + 4, 1, true);
    // Bits per pixel (32-bit RGBA)
    view.setUint16(entryOffset + 6, 32, true);
    // Size of bitmap data
    view.setUint32(entryOffset + 8, dataSize, true);
    // Offset of bitmap data from beginning of file
    view.setUint32(entryOffset + 12, currentOffset, true);

    // Copy PNG data bytes into file buffer
    uint8View.set(new Uint8Array(entry.buffer), currentOffset);
    currentOffset += dataSize;
  }

  return new Blob([outputBuffer], { type: 'image/x-icon' });
}
