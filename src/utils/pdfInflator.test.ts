import { describe, it, expect } from 'vitest';
import { inflatePdf, findLastPdfEof, formatBytes, parseSizeToBytes } from './pdfInflator';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

describe('PDF Inflator Utility', () => {
  function createSamplePdf(text: string): Uint8Array {
    const doc = new jsPDF();
    doc.text(text, 20, 20);
    return new Uint8Array(doc.output('arraybuffer'));
  }

  it('correctly finds the terminal %%EOF marker', () => {
    const pdfBytes = createSamplePdf('Test Document');
    const eofIndex = findLastPdfEof(pdfBytes);
    expect(eofIndex).toBeGreaterThan(0);
    expect(pdfBytes[eofIndex]).toBe(0x25); // %
    expect(pdfBytes[eofIndex + 1]).toBe(0x25); // %
    expect(pdfBytes[eofIndex + 2]).toBe(0x45); // E
    expect(pdfBytes[eofIndex + 3]).toBe(0x4F); // O
    expect(pdfBytes[eofIndex + 4]).toBe(0x46); // F
  });

  it('inflates PDF to an exact byte size matching target', async () => {
    const original = createSamplePdf('Government Job Application Document');
    const targetSize = 150 * 1024; // 150 KB = 153,600 bytes
    expect(original.length).toBeLessThan(targetSize);

    const result = inflatePdf(original, targetSize);
    expect(result.finalSizeBytes).toBe(targetSize);
    expect(result.inflatedBytes.length).toBe(targetSize);
    expect(result.exactMatch).toBe(true);
    expect(result.addedBytes).toBe(targetSize - original.length);

    // Verify output ends with %%EOF
    const eofIdx = findLastPdfEof(result.inflatedBytes);
    expect(eofIdx).toBeGreaterThan(0);

    // Verify it is a 100% valid PDF that parses in pdfjs
    const parsed = await pdfjsLib.getDocument({ data: result.inflatedBytes.slice(0) }).promise;
    expect(parsed.numPages).toBe(1);
    const page = await parsed.getPage(1);
    const content = await page.getTextContent();
    expect(content.items.length).toBeGreaterThan(0);
  });

  it('supports small padding increments', async () => {
    const original = createSamplePdf('Short text');
    const targetSize = original.length + 50; // Add just 50 bytes

    const result = inflatePdf(original, targetSize);
    expect(result.finalSizeBytes).toBe(targetSize);
    expect(result.exactMatch).toBe(true);

    const parsed = await pdfjsLib.getDocument({ data: result.inflatedBytes.slice(0) }).promise;
    expect(parsed.numPages).toBe(1);
  });

  it('throws an error if target size is smaller than or equal to current size', () => {
    const original = createSamplePdf('Document');
    expect(() => {
      inflatePdf(original, original.length - 100);
    }).toThrow(/must be larger than current file size/i);

    expect(() => {
      inflatePdf(original, original.length);
    }).toThrow(/must be larger than current file size/i);
  });

  it('properly formats byte sizes and parses units', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(153600)).toBe('150 KB');
    expect(formatBytes(1048576)).toBe('1 MB');

    expect(parseSizeToBytes(100, 'KB')).toBe(102400);
    expect(parseSizeToBytes(2, 'MB')).toBe(2097152);
  });
});
