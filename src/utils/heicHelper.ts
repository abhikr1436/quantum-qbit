/**
 * Checks if a file or blob is in HEIC / HEIF format
 */
export function isHeicFile(file: File | Blob): boolean {
  if ('name' in file && file.name) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.heic') || name.endsWith('.heif')) {
      return true;
    }
  }
  if (file.type) {
    const type = file.type.toLowerCase();
    if (type.includes('heic') || type.includes('heif')) {
      return true;
    }
  }
  return false;
}

/**
 * Converts a HEIC / HEIF blob into a standard PNG Blob in browser memory
 */
export async function convertHeicToPngBlob(file: File | Blob): Promise<Blob> {
  try {
    // Dynamically import heic2any so it only loads in browser contexts on demand
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule.default || heic2anyModule) as any;

    const result = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 0.95
    });

    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (err: any) {
    console.error('Failed to convert HEIC file client-side:', err);
    throw new Error('Unable to decode HEIC/HEIF file. Please ensure the file is not corrupted.');
  }
}
