import React, { useState, useRef, useEffect } from 'react';
import SquareAd from '../../components/Ads';
import { FileText, Image as ImageIcon, Upload, Trash, ArrowUp, ArrowDown, Download, Check, Copy, Settings, RefreshCw, FileCode } from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { navigate } from '../../utils/router';
import { updateSEO } from '../../utils/seo';

// Configure worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: string;
}

interface SlideData {
  title: string;
  bullets: string[];
}

interface PdfEditorProps {
  defaultTab?: 'imgToPdf' | 'compress' | 'officeToPdf' | 'pdfToWord';
}

export const PdfEditor: React.FC<PdfEditorProps> = ({ defaultTab }) => {
  const [activeTab, setActiveTab] = useState<'imgToPdf' | 'compress' | 'officeToPdf' | 'pdfToWord'>(defaultTab || 'imgToPdf');

  // Sync state if defaultTab changes (e.g. via deep link navigation)
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Synchronize SEO tags and JSON-LD schema on tab changes
  useEffect(() => {
    if (activeTab === 'imgToPdf') {
      updateSEO(
        "Convert Images to PDF Online - Free Image to PDF Converter | Quantum Qbit",
        "Free, secure online tool to convert PNG, JPG, and WEBP images to PDF documents. 100% client-side compilation - your images are never sent to a server.",
        "/tools/images-to-pdf"
      );
    } else if (activeTab === 'compress') {
      updateSEO(
        "Free PDF Compressor Online - Reduce PDF File Size | Quantum Qbit",
        "Compress PDF files online for free. Choose custom compression ratios or preset quality to reduce PDF file size. Vector preservation. 100% private.",
        "/tools/pdf-compressor",
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How can I compress a PDF online for free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can use Quantum Qbit's PDF Compressor. Simply upload your PDF file, choose your compression level or specify a target file size, and download the compressed PDF instantly. It works 100% locally in your browser."
              }
            },
            {
              "@type": "Question",
              "name": "Is my data safe when using this free online PDF compressor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, absolutely! Unlike other online tools, Quantum Qbit processes your files entirely on your local machine using client-side JavaScript. Your PDF files never leave your device and are never uploaded to any server."
              }
            },
            {
              "@type": "Question",
              "name": "Can I compress a PDF to a specific size like 100KB or 200KB?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Quantum Qbit offers a 'Target KB Size' option, allowing you to specify exactly what size you want the compressed PDF to be. The compressor will adjust the scaling and quality to match that target size as closely as possible."
              }
            },
            {
              "@type": "Question",
              "name": "Will compressing a PDF degrade its quality?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Compressing a PDF resizes large images and adjusts rendering parameters. While text vectors remain sharp and clean, images may experience slight quality reductions depending on the level of compression chosen (Low, Medium, or High)."
              }
            }
          ]
        }
      );
    } else if (activeTab === 'officeToPdf') {
      updateSEO(
        "Convert Word & PowerPoint to PDF Online Free | Quantum Qbit",
        "Easily convert DOCX, PPTX, TXT, and HTML files into standard vector PDF documents in your browser. Fast, 100% secure, offline conversion tool.",
        "/tools/convert-to-pdf"
      );
    } else if (activeTab === 'pdfToWord') {
      updateSEO(
        "Free PDF to Word OCR Converter - Extract Text Online | Quantum Qbit",
        "Convert scanned PDF files to editable Word documents using advanced client-side OCR technology. Extract high-accuracy text from images and PDF drafts.",
        "/tools/pdf-to-word"
      );
    }
  }, [activeTab]);

  // Shared Helper: Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // -------------------------------------------------------------
  // 1. Image to PDF States & Actions
  // -------------------------------------------------------------
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pdfName, setPdfName] = useState('quantum-document');
  const [margin, setMargin] = useState<'none' | 'small' | 'normal'>('small');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: ImageFile[] = [];
      const promises = Array.from(files).map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            newImages.push({
              id: Math.random().toString(36).substring(2, 9),
              file,
              previewUrl: reader.result as string,
              name: file.name,
              size: formatBytes(file.size),
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(() => {
        setImages((prev) => [...prev, ...newImages]);
      });
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  };

  const generatePdfFromImages = async () => {
    if (images.length === 0) return;
    const marginSize = margin === 'none' ? 0 : margin === 'small' ? 5 : 12;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    for (let i = 0; i < images.length; i++) {
      const imgData = images[i].previewUrl;
      await new Promise<void>((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          const imgWidth = tempImg.naturalWidth;
          const imgHeight = tempImg.naturalHeight;
          let pageOrientation: 'p' | 'l' = 'p';
          if (orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight)) {
            pageOrientation = 'l';
          }
          const pWidth = pageOrientation === 'p' ? 210 : 297;
          const pHeight = pageOrientation === 'p' ? 297 : 210;

          if (i > 0) {
            doc.addPage('a4', pageOrientation);
          } else {
            doc.setPage(1);
          }

          const availWidth = pWidth - 2 * marginSize;
          const availHeight = pHeight - 2 * marginSize;
          const imgRatio = imgWidth / imgHeight;
          const pageRatio = availWidth / availHeight;

          let drawWidth = availWidth;
          let drawHeight = availHeight;

          if (imgRatio > pageRatio) {
            drawWidth = availWidth;
            drawHeight = availWidth / imgRatio;
          } else {
            drawHeight = availHeight;
            drawWidth = availHeight * imgRatio;
          }

          const xOffset = marginSize + (availWidth - drawWidth) / 2;
          const yOffset = marginSize + (availHeight - drawHeight) / 2;

          let format = 'JPEG';
          if (images[i].name.toLowerCase().endsWith('.png')) format = 'PNG';
          if (images[i].name.toLowerCase().endsWith('.webp')) format = 'WEBP';

          doc.addImage(imgData, format, xOffset, yOffset, drawWidth, drawHeight);
          resolve();
        };
        tempImg.src = imgData;
      });
    }

    doc.save(`${pdfName}.pdf`);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#6c5ce7', '#00f2fe'] });
  };

  // -------------------------------------------------------------
  // 2. PDF Compressor States & Actions
  // -------------------------------------------------------------
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [originalCompressSizeStr, setOriginalCompressSizeStr] = useState('');
  const [compressionType, setCompressionType] = useState<'preset' | 'target'>('preset');
  const [compressionPreset, setCompressionPreset] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetSizeKB, setTargetSizeKB] = useState<number>(300);
  const [compressProgress, setCompressProgress] = useState<string>('');
  const [compressPercent, setCompressPercent] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSizeStr, setCompressedSizeStr] = useState('');
  const compressInputRef = useRef<HTMLInputElement>(null);

  const handleCompressFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressFile(file);
      setOriginalCompressSizeStr(formatBytes(file.size));
      setCompressedBlob(null);
      setCompressedSizeStr('');
      setCompressProgress('');
      setCompressPercent(0);
      
      // Seed default target compression to roughly 50%
      setTargetSizeKB(Math.round((file.size / 1024) * 0.5));
    }
  };

  const handleCompressPdf = async () => {
    if (!compressFile) return;
    setIsCompressing(true);
    setCompressPercent(10);
    setCompressProgress('Reading PDF file structure...');

    try {
      const arrayBuffer = await compressFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let scale = 1.4;
      let quality = 0.65;

      if (compressionType === 'preset') {
        if (compressionPreset === 'low') {
          scale = 1.8;
          quality = 0.85;
        } else if (compressionPreset === 'medium') {
          scale = 1.3;
          quality = 0.65;
        } else {
          scale = 0.95;
          quality = 0.45;
        }
      } else {
        // Target size based optimization logic
        const targetBytes = targetSizeKB * 1024;
        const originalBytes = compressFile.size;
        const ratio = targetBytes / originalBytes;

        if (ratio >= 0.85) {
          scale = 1.8;
          quality = 0.85;
        } else if (ratio >= 0.5) {
          scale = 1.3;
          quality = 0.65;
        } else if (ratio >= 0.25) {
          scale = 1.0;
          quality = 0.5;
        } else {
          scale = 0.8;
          quality = 0.35;
        }
      }

      const firstPage = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1 });
      const firstOrientation = firstViewport.width > firstViewport.height ? 'landscape' : 'portrait';
      const doc = new jsPDF({
        orientation: firstOrientation,
        unit: 'pt',
        format: [firstViewport.width, firstViewport.height]
      });

      for (let i = 1; i <= numPages; i++) {
        setCompressPercent(Math.round(10 + (i / numPages) * 80));
        setCompressProgress(`Rendering page ${i} of ${numPages}...`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const origViewport = page.getViewport({ scale: 1 });
        const pageWidth = origViewport.width;
        const pageHeight = origViewport.height;
        const pageOrientation = pageWidth > pageHeight ? 'landscape' : 'portrait';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const imgData = canvas.toDataURL('image/jpeg', quality);

          if (i > 1) {
            doc.addPage([pageWidth, pageHeight], pageOrientation);
          } else {
            doc.setPage(1);
          }
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        }
      }

      setCompressProgress('Finalizing compilation...');
      setCompressPercent(95);

      const compressedOut = doc.output('blob');
      setCompressedBlob(compressedOut);
      setCompressedSizeStr(formatBytes(compressedOut.size));
      setCompressPercent(100);
      setCompressProgress('Compression complete!');
      
      confetti({ particleCount: 50, spread: 40, colors: ['#00f2fe', '#9d4edd'] });
    } catch (err) {
      console.error(err);
      setCompressProgress('Compression failed. Verify PDF integrity.');
      setCompressPercent(0);
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressedPdf = () => {
    if (compressedBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(compressedBlob);
      link.download = compressFile ? `${compressFile.name.split('.')[0]}-compressed.pdf` : 'compressed.pdf';
      link.click();
    }
  };

  // -------------------------------------------------------------
  // 3. Office to PDF States & Actions
  // -------------------------------------------------------------
  const [officeFile, setOfficeFile] = useState<File | null>(null);
  const [convertedPdfBlob, setConvertedPdfBlob] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState('');
  const [docxHtml, setDocxHtml] = useState('');
  const [pptxSlides, setPptxSlides] = useState<SlideData[]>([]);
  const [textPreview, setTextPreview] = useState('');
  const officeInputRef = useRef<HTMLInputElement>(null);

  const handleOfficeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOfficeFile(file);
      setConvertedPdfBlob(null);
      setConvertProgress('');
      setDocxHtml('');
      setPptxSlides([]);
      setTextPreview('');
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'docx') {
        setIsConverting(true);
        setConvertProgress('Extracting Word formatting...');
        try {
          const buffer = await file.arrayBuffer();
          const res = await mammoth.convertToHtml({ arrayBuffer: buffer });
          setDocxHtml(res.value || '<p>Empty Document</p>');
          setConvertProgress('Word document loaded. Ready to compile.');
        } catch (err) {
          console.error(err);
          setConvertProgress('Failed to parse Word Document.');
        } finally {
          setIsConverting(false);
        }
      } else if (extension === 'pptx') {
        setIsConverting(true);
        setConvertProgress('Reading presentation slide deck...');
        try {
          const buffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);
          
          // Filter slide files
          const slideFiles = Object.keys(zip.files).filter(
            name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
          );
          
          slideFiles.sort((a, b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, ''));
            const numB = parseInt(b.replace(/[^0-9]/g, ''));
            return numA - numB;
          });

          const slides: SlideData[] = [];
          const parser = new DOMParser();

          for (const path of slideFiles) {
            const xmlStr = await zip.files[path].async('string');
            const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagName('a:t');
            const slideTexts = Array.from(textNodes)
              .map(node => node.textContent || '')
              .filter(t => t.trim().length > 0);

            let title = 'Untitled Slide';
            let bullets: string[] = [];

            if (slideTexts.length > 0) {
              title = slideTexts[0];
              bullets = slideTexts.slice(1);
            }
            slides.push({ title, bullets });
          }

          setPptxSlides(slides);
          setConvertProgress(`Loaded ${slides.length} slides successfully.`);
        } catch (err) {
          console.error(err);
          setConvertProgress('Failed to unzip PowerPoint file.');
        } finally {
          setIsConverting(false);
        }
      } else if (extension === 'txt' || extension === 'html') {
        const text = await file.text();
        setTextPreview(text);
        setConvertProgress('File content parsed. Ready to compile.');
      } else {
        setConvertProgress('Unsupported format selected.');
      }
    }
  };

  const handleUpdateSlideTitle = (index: number, val: string) => {
    setPptxSlides(prev => {
      const copy = [...prev];
      copy[index].title = val;
      return copy;
    });
  };

  const handleUpdateSlideBullet = (slideIdx: number, bulletIdx: number, val: string) => {
    setPptxSlides(prev => {
      const copy = [...prev];
      copy[slideIdx].bullets[bulletIdx] = val;
      return copy;
    });
  };

  const compileOfficeToPdf = async () => {
    if (!officeFile) return;
    setIsConverting(true);
    setConvertProgress('Compiling into PDF structure...');

    try {
      const extension = officeFile.name.split('.').pop()?.toLowerCase();
      const doc = new jsPDF({
        orientation: extension === 'pptx' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      if (extension === 'docx') {
        const preview = document.getElementById('docx-preview-container');
        if (preview) {
          await doc.html(preview, {
            callback: function (pdfDoc) {
              const outBlob = pdfDoc.output('blob');
              setConvertedPdfBlob(outBlob);
              setConvertProgress('Word converted successfully!');
              confetti({ particleCount: 50, spread: 45 });
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: 750
          });
          setIsConverting(false);
          return;
        }
      } else if (extension === 'pptx') {
        for (let i = 0; i < pptxSlides.length; i++) {
          if (i > 0) doc.addPage('a4', 'landscape');

          const canvas = document.createElement('canvas');
          canvas.width = 1920;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Obsidian background
            const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
            grad.addColorStop(0, '#0a0d1a');
            grad.addColorStop(1, '#05060b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1920, 1080);

            // Tech Grid Accents
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
            ctx.lineWidth = 1;
            for (let x = 0; x < 1920; x += 80) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, 1080);
              ctx.stroke();
            }

            // Title
            ctx.fillStyle = '#00f2fe';
            ctx.font = 'bold 64px Outfit, Inter, sans-serif';
            ctx.fillText(pptxSlides[i].title, 120, 180);

            // Line Separator
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(120, 230);
            ctx.lineTo(1800, 230);
            ctx.stroke();

            // Bullets
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '40px Inter, sans-serif';
            let startY = 320;
            pptxSlides[i].bullets.forEach((bullet) => {
              ctx.fillText('• ' + bullet, 160, startY);
              startY += 75;
            });

            // Slide tag
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '28px monospace';
            ctx.fillText(`Slide ${i+1} of ${pptxSlides.length}`, 1680, 1020);

            const slideImg = canvas.toDataURL('image/jpeg', 0.9);
            doc.addImage(slideImg, 'JPEG', 0, 0, 297, 210);
          }
        }
      } else if (extension === 'txt' || extension === 'html') {
        const textLines = doc.splitTextToSize(textPreview, 180);
        let y = 20;
        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        
        textLines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage('a4', 'portrait');
            y = 20;
          }
          doc.text(line, 15, y);
          y += 6;
        });
      }

      const outBlob = doc.output('blob');
      setConvertedPdfBlob(outBlob);
      setConvertProgress('Document compiled successfully!');
      confetti({ particleCount: 50, spread: 45 });
    } catch (err) {
      console.error(err);
      setConvertProgress('Failed to finalize PDF compile.');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConvertedPdf = () => {
    if (convertedPdfBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(convertedPdfBlob);
      link.download = officeFile ? `${officeFile.name.split('.')[0]}-converted.pdf` : 'converted.pdf';
      link.click();
    }
  };

  // -------------------------------------------------------------
  // 4. PDF to Word OCR States & Actions
  // -------------------------------------------------------------
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrPagePercent, setOcrPagePercent] = useState(0);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [compiledWordBlob, setCompiledWordBlob] = useState<Blob | null>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const handleOcrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrFile(file);
      setOcrText('');
      setOcrPagePercent(0);
      setOcrProgressText('');
      setCompiledWordBlob(null);
    }
  };

  const handleRunOcrAndCompileWord = async () => {
    if (!ocrFile) return;
    setIsOcrRunning(true);
    setOcrText('');
    setOcrPagePercent(10);
    setOcrProgressText('Initializing OCR scanning engine...');

    let worker: any = null;
    try {
      const arrayBuffer = await ocrFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let extractedFullText = '';
      let currentPage = 1;

      worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrPagePercent(Math.round(((currentPage - 1) / numPages) * 100 + (m.progress / numPages) * 80));
          }
        }
      });

      for (let i = 1; i <= numPages; i++) {
        currentPage = i;
        setOcrProgressText(`Rendering PDF Page ${i} for OCR...`);
        const page = await pdf.getPage(i);
        
        // High resolution scale is vital for Tesseract accuracy
        const scale = 2.2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          setOcrProgressText(`Scanning Page ${i} text structures...`);
          const { data: { text } } = await worker.recognize(canvas);

          extractedFullText += `--- Page ${i} OCR Output ---\n\n` + text + '\n\n';
          setOcrText(extractedFullText);
        }
      }

      setOcrProgressText('Compiling text layouts into Word file...');
      setOcrPagePercent(90);

      // Create Paragraph nodes for docx
      const paragraphs = extractedFullText.split('\n').map((line) => {
        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Calibri',
              size: 24, // 12pt font size
            })
          ],
          spacing: { after: 120 }
        });
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      const wordBlobOut = await Packer.toBlob(doc);
      setCompiledWordBlob(wordBlobOut);
      setOcrPagePercent(100);
      setOcrProgressText('Word extraction complete!');
      confetti({ particleCount: 60, spread: 50, colors: ['#10b981', '#ffffff'] });
    } catch (err) {
      console.error(err);
      setOcrProgressText('OCR extraction failed.');
      setOcrPagePercent(0);
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsOcrRunning(false);
    }
  };

  const downloadWordDoc = () => {
    if (compiledWordBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(compiledWordBlob);
      link.download = ocrFile ? `${ocrFile.name.split('.')[0]}-ocr.docx` : 'extracted-ocr.docx';
      link.click();
    }
  };

  return (
    <div className="container" style={styles.workshop}>
      {/* Tab Switcher */}
      <div className="pdf-tabs-container">
        <a
          href="/tools/images-to-pdf"
          className={`pdf-tab-link ${activeTab === 'imgToPdf' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            navigate('/tools/images-to-pdf');
          }}
        >
          <ImageIcon size={16} /> Images to PDF
        </a>
        <a
          href="/tools/pdf-compressor"
          className={`pdf-tab-link ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            navigate('/tools/pdf-compressor');
          }}
        >
          <Settings size={16} /> PDF Compressor
        </a>
        <a
          href="/tools/convert-to-pdf"
          className={`pdf-tab-link ${activeTab === 'officeToPdf' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            navigate('/tools/convert-to-pdf');
          }}
        >
          <FileText size={16} /> Convert to PDF
        </a>
        <a
          href="/tools/pdf-to-word"
          className={`pdf-tab-link ${activeTab === 'pdfToWord' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            navigate('/tools/pdf-to-word');
          }}
        >
          <FileCode size={16} /> PDF to Word (OCR)
        </a>
      </div>

      {/* ----------------- TAB: IMAGE TO PDF ----------------- */}
      {activeTab === 'imgToPdf' && (
        <div style={styles.tabContent}>
          {images.length === 0 ? (
            <div onClick={() => imgInputRef.current?.click()} className="glass-card pdf-dropzone">
              <div style={styles.uploadIconCircle}>
                <Upload size={28} style={{ color: 'var(--secondary)' }} />
              </div>
              <h3 style={styles.dropzoneTitle}>Upload Images</h3>
              <p style={styles.dropzoneSubtitle}>
                Select PNG, JPG, or WEBP images. You can combine multiple images and compile them into a single PDF.
              </p>
              <button className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--accent))' }}>
                Browse Files
              </button>
              <input
                type="file"
                ref={imgInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="pdf-editor-workspace" style={styles.editorWorkspace}>
              <div className="glass-card" style={styles.pdfSettings}>
                <h3 style={styles.settingsHeader}>Document Settings</h3>
                <div className="form-group">
                  <label className="form-label">Output Filename</label>
                  <input
                    type="text"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Page Margin</label>
                  <div style={styles.selectWrapper}>
                    <select value={margin} onChange={(e) => setMargin(e.target.value as any)} style={styles.select}>
                      <option value="none">No Margins (0mm)</option>
                      <option value="small">Small Padding (5mm)</option>
                      <option value="normal">Standard Padding (12mm)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Page Orientation</label>
                  <div style={styles.selectWrapper}>
                    <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} style={styles.select}>
                      <option value="auto">Auto (Match Image Ratio)</option>
                      <option value="portrait">Always Portrait (A4)</option>
                      <option value="landscape">Always Landscape (A4)</option>
                    </select>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={generatePdfFromImages}
                  style={{
                    background: 'linear-gradient(135deg, var(--secondary), var(--accent))',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '16px'
                  }}
                >
                  <Download size={16} /> Compile & Save PDF
                </button>
                <button onClick={() => setImages([])} style={styles.clearAllBtn}>
                  Clear All Images
                </button>
              </div>

              <div className="glass-card" style={styles.imagesManager}>
                <div style={styles.managerHeader}>
                  <span style={styles.managerTitle}>Compiled Pages ({images.length})</span>
                  <button style={styles.addMoreBtn} onClick={() => imgInputRef.current?.click()}>+ Add More</button>
                </div>
                <div style={styles.imageList}>
                  {images.map((img, idx) => (
                    <div key={img.id} style={styles.imageItem}>
                      <span style={styles.pageNumber}>{idx + 1}</span>
                      <div style={styles.thumbnailWrapper}>
                        <img src={img.previewUrl} alt="Thumbnail" style={styles.thumbnail} />
                      </div>
                      <div style={styles.itemDetails}>
                        <span style={styles.itemName}>{img.name}</span>
                        <span style={styles.itemSize}>{img.size}</span>
                      </div>
                      <div style={styles.itemActions}>
                        <button disabled={idx === 0} onClick={() => moveImage(idx, 'up')} style={{ ...styles.iconActionBtn, opacity: idx === 0 ? 0.3 : 1 }}>
                          <ArrowUp size={14} />
                        </button>
                        <button disabled={idx === images.length - 1} onClick={() => moveImage(idx, 'down')} style={{ ...styles.iconActionBtn, opacity: idx === images.length - 1 ? 0.3 : 1 }}>
                          <ArrowDown size={14} />
                        </button>
                        <button onClick={() => removeImage(img.id)} style={{ ...styles.iconActionBtn, color: '#ef4444' }}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Visible SEO and FAQ Section for Images to PDF */}
          <div style={styles.seoContentSection}>
            <hr style={styles.seoDivider} />
            <h2 style={styles.seoSectionTitle}>Free Online Image to PDF Converter</h2>
            <p style={styles.seoSectionDesc}>
              Convert your JPG, PNG, or WEBP images into high-quality PDF documents quickly and securely. All processing happens 100% locally in your browser – your files are never uploaded to any server.
            </p>
            <div style={styles.faqGrid}>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>How do I convert images to PDF on Quantum Qbit?</h4>
                <p style={styles.faqAnswer}>
                  Simply click the upload area to select your images (PNG, JPG, or WEBP). You can arrange them using the up/down controls to specify page order, adjust margins and orientation, and click "Compile & Save PDF" to download the document.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Is there a limit on the number of images I can compile?</h4>
                <p style={styles.faqAnswer}>
                  No! Because the conversion is executed entirely on your client-side browser, there is no file size limit or page number restriction. You can combine as many images as your computer's memory can handle.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Are my private photos safe with this tool?</h4>
                <p style={styles.faqAnswer}>
                  Yes, 100%. All processing is executed locally via JavaScript. Your images never leave your computer and are never uploaded to any remote storage or database.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: PDF COMPRESSOR ----------------- */}
      {activeTab === 'compress' && (
        <div style={styles.tabContent}>
          {!compressFile ? (
            <div onClick={() => compressInputRef.current?.click()} className="glass-card pdf-dropzone">
              <div style={styles.uploadIconCircle}>
                <Settings size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={styles.dropzoneTitle}>Upload PDF for Compression</h3>
              <p style={styles.dropzoneSubtitle}>
                Select a PDF file from your device. Re-renders content using vector rescaling.
              </p>
              <button className="btn-primary">Browse PDF File</button>
              <input
                type="file"
                ref={compressInputRef}
                onChange={handleCompressFileUpload}
                accept="application/pdf"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="pdf-editor-workspace" style={styles.editorWorkspace}>
              <div className="glass-card" style={styles.pdfSettings}>
                <h3 style={styles.settingsHeader}>Compression Configuration</h3>
                
                <div style={styles.selectWrapper}>
                  <label className="form-label">Compression Mode</label>
                  <div className="mode-toggle-group" style={styles.modeToggleGroup}>
                    <button
                      onClick={() => { setCompressionType('preset'); setCompressedBlob(null); }}
                      style={{ ...styles.toggleBtn, ...(compressionType === 'preset' ? styles.toggleBtnActive : {}) }}
                    >
                      Presets (Low/Med/High)
                    </button>
                    <button
                      onClick={() => { setCompressionType('target'); setCompressedBlob(null); }}
                      style={{ ...styles.toggleBtn, ...(compressionType === 'target' ? styles.toggleBtnActive : {}) }}
                    >
                      Target KB Size
                    </button>
                  </div>
                </div>

                {compressionType === 'preset' ? (
                  <div className="form-group">
                    <label className="form-label">Preset Compression Quality</label>
                    <select
                      value={compressionPreset}
                      onChange={(e) => { setCompressionPreset(e.target.value as any); setCompressedBlob(null); }}
                      style={styles.select}
                    >
                      <option value="low">Low Compression (High Quality Print)</option>
                      <option value="medium">Medium Compression (Balanced Web)</option>
                      <option value="high">High Compression (Low Quality / Min Size)</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Target File Size Limit (KB)</label>
                    <input
                      type="number"
                      value={targetSizeKB}
                      onChange={(e) => { setTargetSizeKB(Math.max(10, Number(e.target.value))); setCompressedBlob(null); }}
                      className="form-input"
                      min="10"
                    />
                  </div>
                )}

                <button
                  className="btn-primary"
                  onClick={handleCompressPdf}
                  disabled={isCompressing}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '12px'
                  }}
                >
                  {isCompressing ? 'Compressing...' : 'Optimize Size'}
                </button>

                <button
                  onClick={() => {
                    setCompressFile(null);
                    setCompressedBlob(null);
                  }}
                  style={styles.clearAllBtn}
                >
                  Upload Different PDF
                </button>
              </div>

              <div className="glass-card" style={styles.imagesManager}>
                <h3 style={styles.settingsHeader}>Compression Report</h3>
                
                {isCompressing && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBarWrapper}>
                      <div style={{ ...styles.progressBar, width: `${compressPercent}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {compressProgress} ({compressPercent}%)
                    </span>
                  </div>
                )}

                {!isCompressing && !compressedBlob && (
                  <div style={styles.infoCard}>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                      ℹ️ **PDF Details:** Loaded PDF file with size **{originalCompressSizeStr}**. Adjust quality and click **Optimize Size** to trigger client-side vector resizing.
                    </p>
                  </div>
                )}

                {compressedBlob && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="responsive-table-wrapper" style={styles.tableWrapper}>
                      <table style={styles.comparisonTable}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Metric</th>
                            <th style={styles.tableHeader}>Original Size</th>
                            <th style={styles.tableHeader}>Compressed Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={styles.tableCell}>Total Filesize</td>
                            <td style={styles.tableCell} className="mono">{originalCompressSizeStr}</td>
                            <td style={{ ...styles.tableCell, color: 'var(--primary)', fontWeight: 600 }} className="mono">
                              {compressedSizeStr}
                            </td>
                          </tr>
                          <tr>
                            <td style={styles.tableCell}>Saving Ratio</td>
                            <td colSpan={2} style={{ ...styles.tableCell, color: '#10b981', fontWeight: 600, paddingLeft: '12px' }}>
                              -{Math.round(((compressFile!.size - compressedBlob.size) / compressFile!.size) * 100)}% Space Saved
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={downloadCompressedPdf}
                      style={{
                        background: '#10b981',
                        borderColor: '#10b981',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Download size={16} /> Save Compressed PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visible SEO and FAQ Section for PDF Compressor */}
          <div style={styles.seoContentSection}>
            <hr style={styles.seoDivider} />
            <h2 style={styles.seoSectionTitle}>Free PDF Compressor Online - Reduce PDF File Size</h2>
            <p style={styles.seoSectionDesc}>
              Optimize and compress your PDF files online for free. Whether you need a PDF compressor online to shrink document size for emails, or a PDF compressor free of charge with custom target size features, our client-side tool provides fast vector resizing with complete privacy.
            </p>
            <div style={styles.faqGrid}>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>How can I compress a PDF online for free?</h4>
                <p style={styles.faqAnswer}>
                  Upload your PDF file using the file selector, choose a compression preset (Low, Medium, or High) or specify a specific Target KB Size, and click "Optimize Size". The compressor will shrink your file and offer an instant download.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Is my data safe when using this free online PDF compressor?</h4>
                <p style={styles.faqAnswer}>
                  Absolutely. Unlike standard cloud-based converters, Quantum Qbit is a 100% client-side web application. Your PDF documents are compiled and rescaled directly on your device, meaning your files are never uploaded to a server or exposed to third parties.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Can I compress a PDF to a specific size like 100KB, 200KB, or 300KB?</h4>
                <p style={styles.faqAnswer}>
                  Yes! Choose the "Target KB Size" mode, enter your desired target file size limit (e.g., 200), and click "Optimize Size". The tool will dynamically recalculate the image quality and dimensions to hit your target size as closely as possible.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Will compressing a PDF degrade its layout or quality?</h4>
                <p style={styles.faqAnswer}>
                  Text and vector lines remain perfectly sharp and vector-aligned. The compressor primarily optimizes embedded images by resizing their dimensions and compressing their JPEG/PNG quality. Choose "Low Compression" if you need high print quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: OFFICE TO PDF ----------------- */}
      {activeTab === 'officeToPdf' && (
        <div style={styles.tabContent}>
          {!officeFile ? (
            <div onClick={() => officeInputRef.current?.click()} className="glass-card pdf-dropzone">
              <div style={styles.uploadIconCircle}>
                <FileText size={28} style={{ color: 'var(--secondary)' }} />
              </div>
              <h3 style={styles.dropzoneTitle}>Upload Word / PowerPoint / Text</h3>
              <p style={styles.dropzoneSubtitle}>
                Supports DOCX, PPTX, TXT, and HTML. Converts files into standard vector PDF files locally.
              </p>
              <button className="btn-primary">Select Document</button>
              <input
                type="file"
                ref={officeInputRef}
                onChange={handleOfficeFileUpload}
                accept=".docx,.pptx,.txt,.html"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="pdf-editor-workspace" style={styles.editorWorkspace}>
              <div className="glass-card" style={styles.pdfSettings}>
                <h3 style={styles.settingsHeader}>Convert Controls</h3>
                
                <div style={styles.infoCard}>
                  <span style={styles.metaLabel}>Source Filename:</span>
                  <div style={{ ...styles.metaValue, wordBreak: 'break-all', marginTop: '4px' }}>{officeFile.name}</div>
                </div>

                <button
                  className="btn-primary"
                  onClick={compileOfficeToPdf}
                  disabled={isConverting}
                  style={{
                    background: 'linear-gradient(135deg, var(--secondary), var(--accent))',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}
                >
                  {isConverting ? 'Processing...' : 'Compile to PDF'}
                </button>

                {convertedPdfBlob && (
                  <button
                    className="btn-primary"
                    onClick={downloadConvertedPdf}
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '8px'
                    }}
                  >
                    <Download size={16} /> Save Generated PDF
                  </button>
                )}

                <button
                  onClick={() => {
                    setOfficeFile(null);
                    setConvertedPdfBlob(null);
                    setDocxHtml('');
                    setPptxSlides([]);
                    setTextPreview('');
                  }}
                  style={styles.clearAllBtn}
                >
                  Convert Another File
                </button>

                {convertProgress && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px' }}>
                    {convertProgress}
                  </div>
                )}
              </div>

              {/* Right Panel: Previews and Presentation Editor */}
              <div className="glass-card" style={styles.imagesManager}>
                <h3 style={styles.settingsHeader}>Document Live Preview & Editor</h3>
                
                {/* DOCX render */}
                {docxHtml && (
                  <div style={styles.previewScrollBox}>
                    <div
                      id="docx-preview-container"
                      style={styles.docxPaper}
                      dangerouslySetInnerHTML={{ __html: docxHtml }}
                    />
                  </div>
                )}

                {/* PPTX slide deck workspace */}
                {pptxSlides.length > 0 && (
                  <div style={styles.slideEditorContainer}>
                    <span style={styles.inputHelp}>Edit Slide Cards (Editable templates)</span>
                    <div style={styles.slideListScroll}>
                      {pptxSlides.map((slide, sIdx) => (
                        <div key={sIdx} style={styles.slideEditCard}>
                          <span style={styles.slideCardNumber}>Slide {sIdx + 1}</span>
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label className="form-label">Slide Header</label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => handleUpdateSlideTitle(sIdx, e.target.value)}
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Slide Bullets Content</label>
                            {slide.bullets.map((bullet, bIdx) => (
                              <textarea
                                key={bIdx}
                                value={bullet}
                                onChange={(e) => handleUpdateSlideBullet(sIdx, bIdx, e.target.value)}
                                className="form-input"
                                style={{ height: '50px', resize: 'none', marginBottom: '6px' }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plain text preview */}
                {textPreview && (
                  <textarea
                    readOnly
                    value={textPreview}
                    style={styles.textareaOutput}
                  />
                )}
              </div>
            </div>
          )}

          {/* Visible SEO and FAQ Section for Office to PDF */}
          <div style={styles.seoContentSection}>
            <hr style={styles.seoDivider} />
            <h2 style={styles.seoSectionTitle}>Word & PowerPoint to PDF Converter Online</h2>
            <p style={styles.seoSectionDesc}>
              Convert Word (.docx), PowerPoint (.pptx), text (.txt), and HTML documents into vector PDF files locally. Instantly prepare documents for distribution with high styling preservation.
            </p>
            <div style={styles.faqGrid}>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>How do I convert DOCX or PPTX files to PDF?</h4>
                <p style={styles.faqAnswer}>
                  Select your document, edit any slides or review the document formatting in the live layout preview panel on the right, and click "Compile to PDF". Your new PDF will compile instantly for saving.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Can I edit my PowerPoint slides before compiling?</h4>
                <p style={styles.faqAnswer}>
                  Yes! When you upload a .pptx file, we extract all slide text layers into editable input cards. You can modify slide headers and bullet points directly in the workspace before converting to PDF.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Is my document layout preserved during conversion?</h4>
                <p style={styles.faqAnswer}>
                  We extract textual structures and CSS layout specifications. You can review the exact rendering output in the interactive preview container to verify formatting details before compiling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: PDF TO WORD OCR ----------------- */}
      {activeTab === 'pdfToWord' && (
        <div style={styles.tabContent}>
          {!ocrFile ? (
            <div onClick={() => ocrInputRef.current?.click()} className="glass-card pdf-dropzone">
              <div style={styles.uploadIconCircle}>
                <FileCode size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={styles.dropzoneTitle}>Upload PDF for OCR Scan</h3>
              <p style={styles.dropzoneSubtitle}>
                Perfect for scanned documents or images converted to PDF. Extracted texts are saved directly into a standard Microsoft Word `.docx` file.
              </p>
              <button className="btn-primary">Browse Scanned PDF</button>
              <input
                type="file"
                ref={ocrInputRef}
                onChange={handleOcrFileUpload}
                accept="application/pdf"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="pdf-editor-workspace" style={styles.editorWorkspace}>
              <div className="glass-card" style={styles.pdfSettings}>
                <h3 style={styles.settingsHeader}>OCR Scan Panel</h3>
                
                <div style={styles.infoCard}>
                  <span style={styles.metaLabel}>Selected PDF:</span>
                  <div style={{ ...styles.metaValue, wordBreak: 'break-all', marginTop: '4px' }}>{ocrFile.name}</div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleRunOcrAndCompileWord}
                  disabled={isOcrRunning}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}
                >
                  {isOcrRunning ? 'OCR Running...' : 'Scan & Extract to Word'}
                </button>

                {compiledWordBlob && (
                  <button
                    className="btn-primary"
                    onClick={downloadWordDoc}
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '8px'
                    }}
                  >
                    <Download size={16} /> Save Word (.docx) Document
                  </button>
                )}

                <button
                  onClick={() => {
                    setOcrFile(null);
                    setOcrText('');
                    setCompiledWordBlob(null);
                  }}
                  style={styles.clearAllBtn}
                >
                  OCR Different PDF
                </button>
              </div>

              <div className="glass-card" style={styles.imagesManager}>
                <h3 style={styles.settingsHeader}>Extracted Layout Preview</h3>
                
                {isOcrRunning && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBarWrapper}>
                      <div style={{ ...styles.progressBar, width: `${ocrPagePercent}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {ocrProgressText} ({ocrPagePercent}%)
                    </span>
                  </div>
                )}

                {ocrText ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                    <span style={styles.inputHelp}>Live Text Parser Outputs</span>
                    <textarea
                      readOnly
                      value={ocrText}
                      style={styles.textareaOutput}
                    />
                  </div>
                ) : (
                  !isOcrRunning && (
                    <div style={styles.infoCard}>
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                        💡 **OCR scanning** processes visual shapes into letter sequences using a locally-loaded neural network worker. Ensure the scan DPI is high for optimal parsing quality.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Visible SEO and FAQ Section for PDF to Word OCR */}
          <div style={styles.seoContentSection}>
            <hr style={styles.seoDivider} />
            <h2 style={styles.seoSectionTitle}>Free PDF to Word OCR Converter - Extract Text</h2>
            <p style={styles.seoSectionDesc}>
              Convert scanned PDF files, drafts, and image text into editable Microsoft Word (.docx) files using advanced browser-based OCR technology. No server queues, 100% private text extraction.
            </p>
            <div style={styles.faqGrid}>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>How does the PDF to Word OCR extractor work?</h4>
                <p style={styles.faqAnswer}>
                  Our tool loads a neural-network-based OCR engine (Tesseract.js) directly inside your web worker. It reads characters from the images or scanned layers of your PDF, parses the sentences, and writes them into a downloadable Word file.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>Do I need an internet connection to run the OCR scanner?</h4>
                <p style={styles.faqAnswer}>
                  The OCR language training files are cached in your browser. Once loaded, the text recognition runs entirely offline in your browser, keeping your documents secure and processing them at local hardware speeds.
                </p>
              </div>
              <div style={styles.faqCard}>
                <h4 style={styles.faqQuestion}>How do I download the final editable document?</h4>
                <p style={styles.faqAnswer}>
                  Click "Scan & Extract to Word" to start the extraction process. Once the progress bar reaches 100%, click "Save Word (.docx) Document" to download the fully editable file containing the parsed text.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: '40px', width: '100%' }}>
        <SquareAd id="pdf-editor-square-ad" />
      </div>
    </div>
  );
};

const styles = {
  workshop: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  tabContent: {
    marginTop: '10px',
  },
  uploadIconCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
  },
  dropzoneTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  dropzoneSubtitle: {
    color: 'var(--text-secondary)',
    maxWidth: '420px',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  editorWorkspace: {
  },
  pdfSettings: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  settingsHeader: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '10px',
    margin: 0,
  },
  selectWrapper: {
    width: '100%',
  },
  select: {
    width: '100%',
    background: 'var(--bg-darker)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  clearAllBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.88rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '6px',
    transition: 'var(--transition-fast)',
    marginTop: '6px',
  },
  imagesManager: {
    padding: '24px',
    minHeight: '480px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  managerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '14px',
    marginBottom: '16px',
  },
  managerTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  addMoreBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  imageList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '450px',
    overflowY: 'auto' as const,
    paddingRight: '6px',
  },
  imageItem: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '10px 16px',
    gap: '16px',
  },
  pageNumber: {
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: 600,
    width: '18px',
  },
  thumbnailWrapper: {
    width: '46px',
    height: '46px',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid var(--border-glass)',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  itemDetails: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: 0,
  },
  itemName: {
    fontSize: '0.9rem',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  itemSize: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  itemActions: {
    display: 'flex',
    gap: '4px',
  },
  iconActionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  },
  modeToggleGroup: {
  },
  toggleBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    padding: '8px 0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-heading)',
  },
  toggleBtnActive: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    margin: 'auto 0',
    padding: '40px 0',
  },
  progressBarWrapper: {
    width: '80%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  infoCard: {
    background: 'rgba(0, 242, 254, 0.02)',
    border: '1px solid rgba(0, 242, 254, 0.1)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: 'var(--text-secondary)',
  },
  metaLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  metaValue: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  tableWrapper: {
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  comparisonTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.85rem',
  },
  tableHeader: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '10px 14px',
    textAlign: 'left' as const,
    color: 'var(--text-secondary)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-glass)',
  },
  tableCell: {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
  },
  previewScrollBox: {
    flexGrow: 1,
    overflowY: 'auto' as const,
    maxHeight: '460px',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '16px',
    background: 'rgba(0,0,0,0.1)',
  },
  docxPaper: {
    background: '#ffffff',
    color: '#000000',
    padding: '24px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minHeight: '297mm', // Approximate A4 ratio height
    fontSize: '12px',
    lineHeight: '1.6',
  },
  slideEditorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    flexGrow: 1,
  },
  slideListScroll: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxHeight: '440px',
    overflowY: 'auto' as const,
    paddingRight: '6px',
  },
  slideEditCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '16px',
    position: 'relative' as const,
  },
  slideCardNumber: {
    position: 'absolute' as const,
    top: '12px',
    right: '16px',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  inputHelp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '2px',
  },
  textareaOutput: {
    flexGrow: 1,
    minHeight: '340px',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '16px',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    resize: 'none' as const,
    outline: 'none',
  },
  seoContentSection: {
    marginTop: '60px',
    padding: '40px 24px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  seoDivider: {
    border: '0',
    height: '1px',
    background: 'linear-gradient(to right, transparent, var(--border-glass-active), transparent)',
    margin: '10px 0 20px 0',
  },
  seoSectionTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--primary)',
    textAlign: 'center' as const,
    textShadow: '0 0 10px var(--primary-glow)',
  },
  seoSectionDesc: {
    fontSize: '1.05rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    maxWidth: '800px',
    margin: '0 auto',
  },
  faqGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginTop: '16px',
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
  },
  faqCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '16px 20px',
    transition: 'var(--transition-smooth)',
  },
  faqQuestion: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontFamily: 'var(--font-heading)',
  },
  faqAnswer: {
    fontSize: '0.95rem',
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  },
};

export default PdfEditor;
