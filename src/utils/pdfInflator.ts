/**
 * PDF Size Increaser / Inflator Engine
 * 
 * Safely increases the byte size of a PDF document to an exact user-defined target
 * (e.g. 100 KB, 200 KB, 500 KB, 1 MB, 2 MB) without modifying or corrupting the visible
 * visual page content, text, vectors, or layout.
 * 
 * Designed specifically for government portals, exam portals (UPSC, NTA, SSC),
 * passport/visa applications, and university submission forms with strict MINIMUM file size limits.
 * 
 * Complies with ISO 32000-1 (PDF Standard).
 */

export interface InflatePdfResult {
  inflatedBytes: Uint8Array;
  originalSizeBytes: number;
  finalSizeBytes: number;
  addedBytes: number;
  exactMatch: boolean;
}

/**
 * Searches for the final `%%EOF` marker in the PDF byte stream.
 */
export function findLastPdfEof(bytes: Uint8Array): number {
  const eofSig = [0x25, 0x25, 0x45, 0x4F, 0x46]; // %%EOF
  for (let i = bytes.length - 5; i >= 0; i--) {
    if (
      bytes[i] === eofSig[0] &&
      bytes[i + 1] === eofSig[1] &&
      bytes[i + 2] === eofSig[2] &&
      bytes[i + 3] === eofSig[3] &&
      bytes[i + 4] === eofSig[4]
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Formats byte size into human-readable string (KB or MB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Converts value and unit ('KB' | 'MB') to bytes.
 */
export function parseSizeToBytes(value: number, unit: 'KB' | 'MB'): number {
  if (unit === 'MB') {
    return Math.round(value * 1024 * 1024);
  }
  return Math.round(value * 1024);
}

/**
 * Inflates a PDF to an EXACT byte size using structured Adobe XMP metadata comment padding.
 * 
 * Injects non-rendered metadata padding immediately before the terminal `%%EOF` marker,
 * ensuring:
 * 1. The file terminates cleanly with `%%EOF`.
 * 2. Visual layout, vectors, raster photos, and form fields remain 100% untouched.
 * 3. The file byte count matches `targetSizeBytes` down to the exact single byte.
 * 4. Strict portal validators recognize the document as a valid PDF.
 */
export function inflatePdf(
  originalBytes: Uint8Array,
  targetSizeBytes: number
): InflatePdfResult {
  const originalLen = originalBytes.length;

  if (targetSizeBytes <= originalLen) {
    throw new Error(
      `Target size (${formatBytes(targetSizeBytes)}) must be larger than current file size (${formatBytes(originalLen)}).`
    );
  }

  const lastEofIndex = findLastPdfEof(originalBytes);
  if (lastEofIndex === -1) {
    throw new Error('Invalid PDF: Missing terminal %%EOF marker.');
  }

  // Slice original bytes before and starting from %%EOF
  const beforeEof = originalBytes.slice(0, lastEofIndex);
  const eofAndAfter = originalBytes.slice(lastEofIndex);

  // Exact padding needed between beforeEof and eofAndAfter
  const exactPadLen = targetSizeBytes - (beforeEof.length + eofAndAfter.length);
  if (exactPadLen <= 0) {
    throw new Error('Target size calculation error: computed padding is non-positive.');
  }

  // Structured Adobe XMP metadata header and footer
  const header = '\n% <x:xmpmeta xmlns:x="adobe:ns:meta/">\n%   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n%     <rdf:Description rdf:about="" xmlns:pdfx="http://ns.adobe.com/pdfx/1.3/">\n%       <pdfx:QuantumQbitPaddingData>\n';
  const footer = '%       </pdfx:QuantumQbitPaddingData>\n%     </rdf:Description>\n%   </rdf:RDF>\n% </x:xmpmeta>\n';

  const headerBytes = new TextEncoder().encode(header);
  const footerBytes = new TextEncoder().encode(footer);

  let paddingBlock: Uint8Array;

  // If the required padding is smaller than the full XMP envelope, use a simple clean comment line
  if (exactPadLen < headerBytes.length + footerBytes.length + 10) {
    paddingBlock = new Uint8Array(exactPadLen);
    paddingBlock[0] = 0x0A; // \n
    paddingBlock[1] = 0x25; // %
    paddingBlock[2] = 0x20; // space
    for (let i = 3; i < exactPadLen - 1; i++) {
      paddingBlock[i] = 0x41 + (i % 26); // A-Z
    }
    paddingBlock[exactPadLen - 1] = 0x0A; // \n
  } else {
    // Full XMP envelope
    const middleLen = exactPadLen - headerBytes.length - footerBytes.length;
    const middleBytes = new Uint8Array(middleLen);

    // Format middle bytes with newlines every 72 chars (% ... \n) for clean formatting
    for (let i = 0; i < middleLen; i++) {
      const pos = i % 72;
      if (pos === 70) {
        middleBytes[i] = 0x0A; // \n
      } else if (pos === 71) {
        middleBytes[i] = 0x25; // %
      } else {
        middleBytes[i] = 0x30 + (i % 10); // 0-9
      }
    }
    if (middleLen > 0) {
      middleBytes[middleLen - 1] = 0x0A;
    }

    paddingBlock = new Uint8Array(exactPadLen);
    paddingBlock.set(headerBytes, 0);
    paddingBlock.set(middleBytes, headerBytes.length);
    paddingBlock.set(footerBytes, headerBytes.length + middleBytes.length);
  }

  // Assemble full output buffer
  const inflatedBytes = new Uint8Array(targetSizeBytes);
  inflatedBytes.set(beforeEof, 0);
  inflatedBytes.set(paddingBlock, beforeEof.length);
  inflatedBytes.set(eofAndAfter, beforeEof.length + paddingBlock.length);

  return {
    inflatedBytes,
    originalSizeBytes: originalLen,
    finalSizeBytes: inflatedBytes.length,
    addedBytes: inflatedBytes.length - originalLen,
    exactMatch: inflatedBytes.length === targetSizeBytes
  };
}
