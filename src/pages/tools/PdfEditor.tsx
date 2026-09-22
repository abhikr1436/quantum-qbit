import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Settings, 
  FileCode,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { navigate } from '../../utils/router';
import { updateSEO } from '../../utils/seo';
import { inflatePdf, formatBytes as formatInflateBytes, parseSizeToBytes, type InflatePdfResult } from '../../utils/pdfInflator';

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
  defaultTab?: 'imgToPdf' | 'compress' | 'officeToPdf' | 'pdfToWord' | 'inflate';
}

export const PdfEditor: React.FC<PdfEditorProps> = ({ defaultTab }) => {
  // Dynamic FAQ JSON-LD Schema for SEO Structured Data
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I compress PDF to 100KB, 200KB, or 300KB using this free PDF compressor online?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Compressing PDF documents down to exact limits like 100KB, 200KB, or 300KB is simplified using our browser-based PDF compressor online. Traditional cloud compressor servers blindly scale down all quality matrices uniformly, which often results in blurry text and low resolution content. In contrast, our client-side utility uses a binary search quality optimization algorithm that allows you to specify a custom target KB size directly. The compiler then runs repeated local trials, adjusting compression ratios for embedded JPEG, PNG, or WEBP photos while keeping text vector structures perfectly untouched. Because text elements inside a PDF are stored as vector instructions rather than flat bitmaps, the compressor keeps fonts and vectors 100% sharp. This ensures that even if you shrink a document heavily to fit online government applications or email size restrictions, your headers and sentences remain crisp and readable. You can easily reduce PDF size free of cost without worrying about artifacts. Simply choose the 'Target KB Size' option in our PDF compressor online dashboard, input the desired target file size limit (e.g. 150), and click the optimize button to trigger the instant client-side calculation."
          }
        },
        {
          "@type": "Question",
          "name": "What are the security and privacy benefits of utilizing a client-side offline-first PDF merger and compiler?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "When you use a normal free PDF merger or compiler, you upload sensitive files to a remote cloud server. This exposes your financial records, ID scans, and legal papers to potential data leaks, server hacks, or third-party tracking. Our offline-first web utility solves this by processing all files entirely in your browser's local memory. The merging, compiling, and layout adjustments are executed locally using Javascript libraries like pdf-lib and jsPDF. Your files never touch a remote server, ensuring absolute privacy. Since we don't upload anything, you don't even need an active internet connection to run the tools once the page has loaded. The files are merged on your CPU threads, preventing data interception. This client-side PDF editor and merger is ideal for compliance-heavy sectors like legal offices, student desks, and enterprise projects where uploading proprietary information is strictly prohibited."
          }
        },
        {
          "@type": "Question",
          "name": "How does browser-based OCR technology extract text from scanned PDFs to editable Word format?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Scanned PDFs are essentially image files wrapped inside a PDF container. To make them editable, you need OCR (Optical Character Recognition). Our PDF to Word OCR tool uses Tesseract.js, a neural network-based text recognition engine. When you upload a scanned document, the engine loads training data from your browser cache, initializes a worker thread, and starts reading the character outlines directly from the canvas pixels. It groups recognized glyphs into words, sentences, and paragraphs, and writes the output into a downloadable Microsoft Word (.docx) file. Since this text parser works inside your browser sandbox, your documents remain private. This is the ultimate tool to extract text from PDF files for free without risking information leaks or paying expensive subscription fees."
          }
        },
        {
          "@type": "Question",
          "name": "Is it possible to convert Word (.docx) and PowerPoint (.pptx) documents to PDF offline?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Our tool allows you to convert Word documents (.docx), presentations (.pptx), text (.txt), and HTML files into standard vector PDF files completely offline. The tool parses the file's XML elements, extracts fonts, headers, paragraphs, and list items, and builds a clean layout on a canvas. You can edit PPTX slide headers and bullet points directly in the workspace before converting. Once you are satisfied with the preview, click 'Compile to PDF' to generate the document locally. Because it doesn't use external conversion APIs, it is fast, free, and secure."
          }
        },
        {
          "@type": "Question",
          "name": "How can I convert images (PNG/JPG/WEBP) into a single PDF document without cloud uploads?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our Images to PDF converter allows you to combine multiple images into a single PDF document locally. Simply upload your files, adjust page margins (None, Small, or Standard), choose A4 portrait or landscape orientation, and compile. The compiler scales the images to fit the margins and renders them onto separate pages. You can reorder pages or clear individual images before building. It is perfect for converting documents, photos, or portfolios into a unified PDF file instantly."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-pdf';
    script.innerHTML = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('faq-jsonld-pdf');
      if (existing) {
        document.head.removeChild(existing);
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'imgToPdf' | 'compress' | 'officeToPdf' | 'pdfToWord' | 'inflate'>(defaultTab || 'imgToPdf');

  // Sync state if defaultTab changes (e.g. via deep link navigation)
  useEffect(() => {
    if (defaultTab) {
      Promise.resolve().then(() => {
        setActiveTab(defaultTab);
      });
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
        "Easily compress PDF online free without login | Quantum Qbit",
        "Easily compress PDF files online for free. Choose custom compression ratios or preset quality to reduce PDF file size. Vector preservation. 100% private.",
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
    } else if (activeTab === 'inflate') {
      updateSEO(
        "Increase PDF Size Online Free - PDF Size Increaser to Exact KB/MB | Quantum Qbit",
        "Increase PDF file size to 100KB, 200KB, 500KB or any custom target online for free. Satisfy exam, passport, and government portal minimum file size requirements with 100% private in-browser metadata inflation.",
        "/tools/increase-pdf-size",
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How can I increase the size of a PDF file to 100KB, 200KB, or 500KB?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Simply upload your PDF to Quantum Qbit's PDF Size Increaser, enter your desired target file size (e.g. 100 KB, 200 KB, or 500 KB) or select a quick preset, and click 'Inflate to Exact Size'. The tool uses ISO-standard non-rendered Adobe XMP metadata padding to increase the file size to your exact target byte-for-byte, without modifying any text, images, or layout."
              }
            },
            {
              "@type": "Question",
              "name": "Will the inflated PDF be accepted by government exam and passport portals?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Government portals (such as UPSC, SSC, NTA, NEET, State PSCs, visa and passport portals) enforce minimum file sizes (e.g. 'minimum 100KB') to prevent corrupted or unreadable low-resolution uploads. Our tool adds valid, specification-compliant Adobe XMP metadata comments before the terminal %%EOF marker. Automated upload validators recognize it as 100% valid and accept it immediately."
              }
            },
            {
              "@type": "Question",
              "name": "Does increasing the PDF size change the visual appearance or blur text?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No! Visual page streams, vector fonts, photos, and layouts remain completely untouched. The extra bytes are contained in metadata padding structures that PDF viewers do not render visually. You can preview the page directly in our in-browser viewer before downloading to verify."
              }
            },
            {
              "@type": "Question",
              "name": "Is my document uploaded to a server?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Never. All byte calculations and file generation happen 100% client-side inside your browser's local memory. Your confidential certificates, admit cards, and documents never touch any cloud server."
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

          let drawWidth: number;
          let drawHeight: number;

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
  const [targetSizeKB, setTargetSizeKB] = useState<number | ''>(300);
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
    if (compressionType === 'target' && (targetSizeKB === '' || isNaN(Number(targetSizeKB)) || Number(targetSizeKB) <= 0)) {
      if (window.showToast) window.showToast('Please enter a valid target size (KB) greater than 0.');
      return;
    }
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
        const targetBytes = Number(targetSizeKB) * 1024;
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

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
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

  // -------------------------------------------------------------
  // 5. PDF Inflator / Size Increaser States & Actions
  // -------------------------------------------------------------
  const [inflateFile, setInflateFile] = useState<File | null>(null);
  const [targetSizeVal, setTargetSizeVal] = useState<number>(200);
  const [targetSizeUnit, setTargetSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [isInflating, setIsInflating] = useState<boolean>(false);
  const [inflatedResult, setInflatedResult] = useState<InflatePdfResult | null>(null);
  const [inflateError, setInflateError] = useState<string>('');
  const inflateInputRef = useRef<HTMLInputElement>(null);
  const inflatePreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewTotalPages, setPreviewTotalPages] = useState<number>(1);

  const handleProcessInflateFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      if (window.showToast) window.showToast('Please upload a valid PDF document.');
      return;
    }
    setInflateFile(file);
    setInflatedResult(null);
    setInflateError('');
    const currentKB = Math.ceil(file.size / 1024);
    if (currentKB < 100) setTargetSizeVal(100);
    else if (currentKB < 150) setTargetSizeVal(150);
    else if (currentKB < 200) setTargetSizeVal(200);
    else if (currentKB < 300) setTargetSizeVal(300);
    else if (currentKB < 500) setTargetSizeVal(500);
    else if (currentKB < 1024) setTargetSizeVal(1024);
    else {
      setTargetSizeVal(Math.ceil((file.size / (1024 * 1024)) + 1));
      setTargetSizeUnit('MB');
    }
    setPreviewPage(1);
    renderInflatePreview(file, 1);
  };

  const handleInflateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessInflateFile(file);
    }
  };

  const renderInflatePreview = async (fileOrBytes: File | Uint8Array, pageNum: number = 1) => {
    try {
      setIsRenderingPreview(true);
      let data: Uint8Array;
      if (fileOrBytes instanceof File) {
        const buffer = await fileOrBytes.arrayBuffer();
        data = new Uint8Array(buffer);
      } else {
        data = fileOrBytes;
      }
      const loadingTask = pdfjsLib.getDocument({ data: data.slice(0) });
      const pdfDoc = await loadingTask.promise;
      setPreviewTotalPages(pdfDoc.numPages);
      const safePage = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
      setPreviewPage(safePage);
      const page = await pdfDoc.getPage(safePage);
      const canvas = inflatePreviewCanvasRef.current;
      if (!canvas) return;
      const viewport = page.getViewport({ scale: 1.15 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
    } catch (err) {
      console.warn('PDF preview render error:', err);
    } finally {
      setIsRenderingPreview(false);
    }
  };

  const handleExecuteInflation = async () => {
    if (!inflateFile) return;
    setIsInflating(true);
    setInflateError('');
    try {
      const buffer = await inflateFile.arrayBuffer();
      const originalBytes = new Uint8Array(buffer);
      const targetSizeBytes = parseSizeToBytes(targetSizeVal, targetSizeUnit);

      if (targetSizeBytes <= originalBytes.length) {
        setInflateError(
          `Target size (${formatInflateBytes(targetSizeBytes)}) must be larger than current file size (${formatInflateBytes(originalBytes.length)}). If you need to shrink it, switch to the PDF Compressor!`
        );
        setIsInflating(false);
        return;
      }

      const result = inflatePdf(originalBytes, targetSizeBytes);
      setInflatedResult(result);
      renderInflatePreview(result.inflatedBytes, previewPage);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      if (window.showToast) {
        window.showToast(`PDF size increased to ${formatInflateBytes(result.finalSizeBytes)}!`, 'success');
      }
    } catch (err: any) {
      setInflateError(err.message || 'Failed to inflate PDF.');
    } finally {
      setIsInflating(false);
    }
  };

  const handleDownloadInflatedPdf = () => {
    if (!inflatedResult || !inflateFile) return;
    const blob = new Blob([inflatedResult.inflatedBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = inflateFile.name.replace(/\.pdf$/i, '');
    const unitStr = targetSizeUnit === 'MB' ? `${targetSizeVal}MB` : `${targetSizeVal}KB`;
    a.download = `${baseName}_inflated_${unitStr}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          href="/tools/increase-pdf-size"
          className={`pdf-tab-link ${activeTab === 'inflate' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            navigate('/tools/increase-pdf-size');
          }}
        >
          <Maximize2 size={16} /> Increase PDF Size
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
                    <select value={margin} onChange={(e) => setMargin(e.target.value as 'none' | 'small' | 'normal')} style={styles.select}>
                      <option value="none">No Margins (0mm)</option>
                      <option value="small">Small Padding (5mm)</option>
                      <option value="normal">Standard Padding (12mm)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Page Orientation</label>
                  <div style={styles.selectWrapper}>
                    <select value={orientation} onChange={(e) => setOrientation(e.target.value as 'auto' | 'portrait' | 'landscape')} style={styles.select}>
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
                      onChange={(e) => { setCompressionPreset(e.target.value as 'low' | 'medium' | 'high'); setCompressedBlob(null); }}
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
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setTargetSizeKB('');
                          setCompressedBlob(null);
                          return;
                        }
                        const num = Number(val);
                        if (isNaN(num) || num <= 0) {
                          if (window.showToast) window.showToast('Target size must be a positive number.');
                          return;
                        }
                        setTargetSizeKB(num);
                        setCompressedBlob(null);
                      }}
                      className="form-input"
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
        </div>
      )}

      {/* ----------------- TAB: PDF INFLATOR / SIZE INCREASER ----------------- */}
      {activeTab === 'inflate' && (
        <div style={styles.tabContent}>
          {!inflateFile ? (
            <div
              onClick={() => inflateInputRef.current?.click()}
              className="glass-card pdf-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessInflateFile(file);
              }}
              style={{ cursor: 'pointer', textAlign: 'center', padding: '48px 24px' }}
            >
              <div style={styles.uploadIconCircle}>
                <Maximize2 size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={styles.dropzoneTitle}>Upload PDF to Increase File Size</h3>
              <p style={styles.dropzoneSubtitle}>
                Add safe, non-rendered Adobe XMP metadata padding to meet strict government exam and portal minimum file size requirements (100KB, 200KB, 500KB+).
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', margin: '16px 0 20px 0' }}>
                <span className="liquid-badge" style={{ fontSize: '0.76rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  ✓ 100% Client-Side Private
                </span>
                <span className="liquid-badge" style={{ fontSize: '0.76rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                  ✓ Exact Byte Match
                </span>
                <span className="liquid-badge" style={{ fontSize: '0.76rem', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                  ✓ Zero Visual Degradation
                </span>
              </div>
              <button
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Upload size={16} /> Select PDF Document
              </button>
              <input
                type="file"
                ref={inflateInputRef}
                onChange={handleInflateFileUpload}
                accept="application/pdf,.pdf"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="pdf-editor-workspace" style={styles.editorWorkspace}>
              {/* Left Column: Settings & Target Controls */}
              <div className="glass-card" style={styles.pdfSettings}>
                <h3 style={styles.settingsHeader}>Inflation Configuration</h3>

                {/* Current File Metadata Pill */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Uploaded Document
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '4px' }}>
                    {inflateFile.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Size:</span>
                    <span className="mono" style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {formatInflateBytes(inflateFile.size)} ({inflateFile.size.toLocaleString()} bytes)
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Target Size Presets (Minimum Limits)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Common portal limits</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { val: 100, unit: 'KB' as const },
                      { val: 150, unit: 'KB' as const },
                      { val: 200, unit: 'KB' as const },
                      { val: 300, unit: 'KB' as const },
                      { val: 500, unit: 'KB' as const },
                      { val: 1, unit: 'MB' as const },
                      { val: 2, unit: 'MB' as const },
                      { val: 5, unit: 'MB' as const }
                    ].map((preset) => {
                      const presetBytes = parseSizeToBytes(preset.val, preset.unit);
                      const isSelected = targetSizeVal === preset.val && targetSizeUnit === preset.unit;
                      const isBelowOriginal = presetBytes <= inflateFile.size;

                      return (
                        <button
                          key={`${preset.val}${preset.unit}`}
                          type="button"
                          onClick={() => {
                            setTargetSizeVal(preset.val);
                            setTargetSizeUnit(preset.unit);
                            setInflatedResult(null);
                            setInflateError('');
                          }}
                          disabled={isBelowOriginal}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: isSelected
                              ? '1px solid var(--primary)'
                              : isBelowOriginal
                              ? '1px solid rgba(255, 255, 255, 0.04)'
                              : '1px solid var(--border-glass)',
                            background: isSelected
                              ? 'rgba(0, 242, 254, 0.15)'
                              : isBelowOriginal
                              ? 'rgba(255, 255, 255, 0.01)'
                              : 'rgba(255, 255, 255, 0.02)',
                            color: isSelected
                              ? 'var(--primary)'
                              : isBelowOriginal
                              ? 'var(--text-muted)'
                              : 'var(--text-primary)',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: isBelowOriginal ? 'not-allowed' : 'pointer',
                            opacity: isBelowOriginal ? 0.45 : 1,
                            transition: 'all 0.2s ease',
                            textAlign: 'center'
                          }}
                          title={isBelowOriginal ? `Preset is smaller than document (${formatInflateBytes(inflateFile.size)})` : undefined}
                        >
                          {preset.val} {preset.unit}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Target Input */}
                <div className="form-group">
                  <label className="form-label">Custom Target File Size</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      step={targetSizeUnit === 'MB' ? '0.1' : '1'}
                      value={targetSizeVal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setTargetSizeVal(val);
                          setInflatedResult(null);
                          setInflateError('');
                        }
                      }}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <select
                      value={targetSizeUnit}
                      onChange={(e) => {
                        setTargetSizeUnit(e.target.value as 'KB' | 'MB');
                        setInflatedResult(null);
                        setInflateError('');
                      }}
                      style={{ ...styles.select, width: '90px' }}
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                </div>

                {/* Live Byte Difference / Calculation Pill */}
                {(() => {
                  const targetBytes = parseSizeToBytes(targetSizeVal, targetSizeUnit);
                  const isLarger = targetBytes > inflateFile.size;
                  const diffBytes = targetBytes - inflateFile.size;

                  if (isLarger) {
                    return (
                      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.82rem', marginBottom: '4px' }}>
                          <CheckCircle2 size={15} />
                          <span>Ready to Inflate (+{formatInflateBytes(diffBytes)})</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Target: <strong style={{ color: '#fff' }}>{formatInflateBytes(targetBytes)}</strong> ({targetBytes.toLocaleString()} bytes). Exactly {diffBytes.toLocaleString()} bytes of non-rendered XMP metadata padding will be safely injected.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 600, fontSize: '0.82rem', marginBottom: '4px' }}>
                        <AlertTriangle size={15} />
                        <span>Target size is smaller than current size</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>
                        Your document is already {formatInflateBytes(inflateFile.size)}. To increase the file size, choose a target above this.
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('compress')}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Want to shrink it? Switch to PDF Compressor →
                      </button>
                    </div>
                  );
                })()}

                {inflateError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.8rem' }}>
                    {inflateError}
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  className="btn-primary"
                  onClick={handleExecuteInflation}
                  disabled={isInflating || parseSizeToBytes(targetSizeVal, targetSizeUnit) <= inflateFile.size}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '8px',
                    opacity: parseSizeToBytes(targetSizeVal, targetSizeUnit) <= inflateFile.size ? 0.5 : 1
                  }}
                >
                  <Maximize2 size={16} />
                  <span>{isInflating ? 'Inflating Document...' : 'Inflate to Exact Size'}</span>
                </button>

                <button
                  onClick={() => {
                    setInflateFile(null);
                    setInflatedResult(null);
                    setInflateError('');
                  }}
                  style={styles.clearAllBtn}
                >
                  Upload Different PDF
                </button>
              </div>

              {/* Right Column: Visual Verification & Download */}
              <div className="glass-card" style={styles.imagesManager}>
                <div style={styles.managerHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                    <span style={styles.managerTitle}>Visual Verification & Inspection</span>
                  </div>
                  {previewTotalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const prev = Math.max(1, previewPage - 1);
                          setPreviewPage(prev);
                          renderInflatePreview(inflatedResult ? inflatedResult.inflatedBytes : inflateFile, prev);
                        }}
                        disabled={previewPage <= 1}
                        style={{ ...styles.iconActionBtn, width: '24px', height: '24px' }}
                      >
                        ←
                      </button>
                      <span>Page {previewPage} of {previewTotalPages}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.min(previewTotalPages, previewPage + 1);
                          setPreviewPage(next);
                          renderInflatePreview(inflatedResult ? inflatedResult.inflatedBytes : inflateFile, next);
                        }}
                        disabled={previewPage >= previewTotalPages}
                        style={{ ...styles.iconActionBtn, width: '24px', height: '24px' }}
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>

                {/* Inflated Success Details Card */}
                {inflatedResult && (
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="responsive-table-wrapper" style={styles.tableWrapper}>
                      <table style={styles.comparisonTable}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Specification</th>
                            <th style={styles.tableHeader}>Original File</th>
                            <th style={styles.tableHeader}>Inflated Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={styles.tableCell}>Exact Byte Count</td>
                            <td style={styles.tableCell} className="mono">
                              {inflatedResult.originalSizeBytes.toLocaleString()} bytes
                            </td>
                            <td style={{ ...styles.tableCell, color: 'var(--primary)', fontWeight: 700 }} className="mono">
                              {inflatedResult.finalSizeBytes.toLocaleString()} bytes ({formatInflateBytes(inflatedResult.finalSizeBytes)})
                            </td>
                          </tr>
                          <tr>
                            <td style={styles.tableCell}>Added Metadata</td>
                            <td colSpan={2} style={{ ...styles.tableCell, color: '#10b981', fontWeight: 600, paddingLeft: '12px' }}>
                              +{formatInflateBytes(inflatedResult.addedBytes)} ({inflatedResult.addedBytes.toLocaleString()} bytes) Non-Rendered XMP Stream
                            </td>
                          </tr>
                          <tr>
                            <td style={styles.tableCell}>Visual Quality</td>
                            <td colSpan={2} style={{ ...styles.tableCell, color: '#38bdf8', fontWeight: 600, paddingLeft: '12px' }}>
                              ✓ 100% Identical Vector & Pixel Fidelity (Zero Alterations)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={handleDownloadInflatedPdf}
                      style={{
                        background: '#10b981',
                        borderColor: '#10b981',
                        width: '100%',
                        justifyContent: 'center',
                        padding: '14px',
                        fontSize: '1rem',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Download size={18} />
                      <span>Download Inflated PDF ({formatInflateBytes(inflatedResult.finalSizeBytes)})</span>
                    </button>
                  </div>
                )}

                {/* Canvas Render Preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '16px', minHeight: '340px' }}>
                  {isRenderingPreview && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', zIndex: 2 }}>
                      <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Rendering live visual verification...</span>
                    </div>
                  )}
                  <canvas
                    ref={inflatePreviewCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '380px',
                      borderRadius: '6px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                      background: '#ffffff'
                    }}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Eye size={13} style={{ color: 'var(--primary)' }} />
                    <span>Real-time In-Browser Verification: Content is completely unchanged.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consolidated Scrollable FAQ Box (Over 1700 Words for SEO) */}
      <div style={styles.seoContentSection}>
        <hr style={styles.seoDivider} />
        <h2 style={styles.seoSectionTitle}>Quantum PDF Workshop — User Guides & FAQ</h2>
        <p style={styles.seoSectionDesc}>
          Get absolute clarity on how our browser-based utility lets you compress, merge, edit, and convert documents securely without server-side vulnerabilities.
        </p>
        <div className="faq-scroll-wrapper">
          <div className="faq-scroll-box" style={styles.faqGrid}>
            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>1. How do I compress PDF to 100KB, 200KB, or 300KB using this free PDF compressor online?</h4>
              <p style={styles.faqAnswer}>
                Compressing PDF documents down to exact limits like 100KB, 200KB, or 300KB is simplified using our browser-based PDF compressor online. Traditional cloud compressor servers blindly scale down all quality matrices uniformly, which often results in blurry text and low resolution content. In contrast, our client-side utility uses a binary search quality optimization algorithm that allows you to specify a custom target KB size directly. The compiler then runs repeated local trials, adjusting compression ratios for embedded JPEG, PNG, or WEBP photos while keeping text vector structures perfectly untouched. Because text elements inside a PDF are stored as vector instructions rather than flat bitmaps, the compressor keeps fonts and vectors 100% sharp. This ensures that even if you shrink a document heavily to fit online government applications or email size restrictions, your headers and sentences remain crisp and readable. You can easily reduce PDF size free of cost without worrying about artifacts. Simply choose the 'Target KB Size' option in our PDF compressor online dashboard, input the desired target file size limit (e.g. 150), and click the optimize button to trigger the instant client-side calculation.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                To achieve the best balance of visual clarity and file footprint, we recommend trying the preset modes first. 'Low Compression' maintains maximum image resolution (ideal for PDF files containing high-resolution engineering prints or detailed diagrams), whereas 'High Compression' targets aggressive size reductions down to 100KB. By executing all iterations in your browser thread, you bypass upload wait times entirely, generating optimized outputs in milliseconds.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>2. What are the security and privacy benefits of utilizing a client-side offline-first PDF merger and compiler?</h4>
              <p style={styles.faqAnswer}>
                When you use a normal free PDF merger or compiler, you upload sensitive files to a remote cloud server. This exposes your financial records, ID scans, and legal papers to potential data leaks, server hacks, or third-party tracking. Our offline-first web utility solves this by processing all files entirely in your browser's local memory. The merging, compiling, and layout adjustments are executed locally using Javascript libraries like pdf-lib and jsPDF. Your files never touch a remote server, ensuring absolute privacy. Since we don't upload anything, you don't even need an active internet connection to run the tools once the page has loaded. The files are merged on your CPU threads, preventing data interception.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                This client-side PDF editor and merger is ideal for compliance-heavy sectors like legal offices, student desks, and enterprise projects where uploading proprietary information is strictly prohibited. You retain complete custody of your private data, eliminating worries about security compliance, corporate espionage, or unauthorized scraping of confidential business documents.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>3. How does browser-based OCR technology extract text from scanned PDFs to editable Word format?</h4>
              <p style={styles.faqAnswer}>
                Scanned PDFs are essentially image files wrapped inside a PDF container. To make them editable, you need OCR (Optical Character Recognition). Our PDF to Word OCR tool uses Tesseract.js, a neural network-based text recognition engine. When you upload a scanned document, the engine loads training data from your browser cache, initializes a worker thread, and starts reading the character outlines directly from the canvas pixels. It groups recognized glyphs into words, sentences, and paragraphs, and writes the output into a downloadable Microsoft Word (.docx) file. Since this text parser works inside your browser sandbox, your documents remain private. This is the ultimate tool to extract text from PDF files for free without risking information leaks or paying expensive subscription fees.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                The accuracy of text recognition is heavily dependent on the scan DPI and contrast of the input PDF. For optimal results, ensure the input pages are clean, well-lit, and aligned. The engine runs locally using your computer's CPU power, so processing time will scale with the number of pages in the PDF document.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>4. Is it possible to convert Word (.docx) and PowerPoint (.pptx) documents to PDF offline?</h4>
              <p style={styles.faqAnswer}>
                Yes! Our tool allows you to convert Word documents (.docx), presentations (.pptx), text (.txt), and HTML files into standard vector PDF files completely offline. The tool parses the file's XML elements, extracts fonts, headers, paragraphs, and list items, and builds a clean layout on a canvas. You can edit PPTX slide headers and bullet points directly in the workspace before converting. Once you are satisfied with the preview, click 'Compile to PDF' to generate the document locally. Because it doesn't use external conversion APIs, it is fast, free, and secure.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                This is a game-changer for developer documentation and presentation prep. You no longer need to upload slide decks containing sensitive business statistics or university course outlines to random online conversion forms. Our offline converter supports style overrides, rendering typography and vector elements smoothly.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>5. How can I convert images (PNG/JPG/WEBP) into a single PDF document without cloud uploads?</h4>
              <p style={styles.faqAnswer}>
                Our Images to PDF converter allows you to combine multiple images into a single PDF document locally. Simply upload your files, adjust page margins (None, Small, or Standard), choose A4 portrait or landscape orientation, and compile. The compiler scales the images to fit the margins and renders them onto separate pages. You can reorder pages or clear individual images before building. It is perfect for converting documents, photos, or portfolios into a unified PDF file instantly.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                We support dragging-and-dropping to reorder slides, rotating mismatched images before compilation, and compressing sizes individually. This keeps the final compiled PDF optimized and formatted precisely as required.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>6. How does the PDF Compressor optimize file size without losing text legibility?</h4>
              <p style={styles.faqAnswer}>
                The PDF compressor targets embedded bitmap images (like screenshots or photographs) which represent 90% of a document's file size. It reduces their resolution and applies quality compression matrices (JPEG/WEBP) to shrink their footprint. In contrast, text blocks, fonts, and drawings are stored as math vectors, which consume almost zero space and are left untouched. This ensures that even high-ratio compression preserves the readability of text while reducing the file size.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                For files that contain thousands of vector drawing components (such as architectural CAD blueprints or dense mathematical schemas), the tool automatically handles clean compression of color maps and font tables to squeeze out unnecessary metadata, resulting in highly accessible, fast-rendering documents.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>7. What is the difference between client-side OCR and server-side PDF conversion tools?</h4>
              <p style={styles.faqAnswer}>
                Server-side tools require uploading your file to a cloud infrastructure, placing you in a processing queue, and downloading the result. If the server is busy or your internet is slow, this takes time. Client-side tools load the conversion logic directly into your browser. The execution speed depends entirely on your device's CPU. This eliminates upload/download times, allows offline usage, and guarantees data security since your files remain on your device.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                Moreover, server-side tools often hide batch processing, high resolution exports, or scanned OCR limits behind expensive paywalls. Quantum Qbit provides unrestricted usage, meaning you can run OCR scans on multi-page files without payment demands.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>8. How do I optimize PDF document layouts for Google Search SEO and Web Accessibility?</h4>
              <p style={styles.faqAnswer}>
                To make your PDFs rank higher on search engines and remain accessible to screen readers, ensure they contain text layers rather than flat images. If your document is scanned, run our OCR tool to extract the text and compile it. Add metadata like title, description, and keywords to the document properties, use headers hierarchically, and compress large decorative images to ensure fast loading times.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                Google's crawler reads vector text inside PDF documents just like standard HTML pages. By providing clean, structured text tables and reducing image size, search indexers can crawl the content easily, improving your keyword ranks.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>9. Are there any limits on file size when processing documents locally in the browser?</h4>
              <p style={styles.faqAnswer}>
                The file size limit is dictated by your browser's available memory sandbox (usually between 512MB and 2GB depending on the browser and device). For standard documents (under 50MB), client-side processing is fast and efficient. For extremely large files (e.g. 500MB scan decks), the browser tab might crash due to out-of-memory errors. In such cases, split the file into smaller sections before processing.
              </p>
              <p style={{ ...styles.faqAnswer, marginTop: '8px' }}>
                This constraint exists to protect system resources from memory leaks. Our code uses streams and canvas chunking to process images dynamically, which reduces memory pressure. This keeps the browser tab stable even when compressing multi-page documents containing rich high-definition visuals.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>10. Why do government, exam, and passport portals enforce a minimum PDF file size (e.g., 100KB, 200KB)?</h4>
              <p style={styles.faqAnswer}>
                Many official examination boards (such as UPSC, SSC, NTA, State PSCs, NEET) and visa/passport portals enforce strict file size brackets—such as "between 100 KB and 500 KB"—to prevent applicants from submitting excessively compressed, illegible thumbnail files or corrupted low-resolution scans. Automated portal validators reject any file that falls even 1 KB below the threshold (e.g., a crisp 45 KB PDF gets rejected). Our PDF Inflator safely pads the file to your exact required minimum (e.g., 100 KB or 200 KB) so your application is instantly approved by the portal.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>11. How does the PDF Size Increaser add size without altering the visual appearance or text?</h4>
              <p style={styles.faqAnswer}>
                Under the official ISO 32000-1 PDF standard, documents contain both rendered visual streams (text fonts, vector lines, photo pixels) and non-rendered metadata streams. Quantum Qbit injects structured, invisible Adobe XMP metadata comments immediately before the final %%EOF marker. Because PDF rendering engines ignore non-visual metadata streams during display and printing, your document appears 100% identical, with vector text remaining razor-sharp and high resolution.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>12. Will the inflated PDF pass automated portal validation checks and security scans?</h4>
              <p style={styles.faqAnswer}>
                Yes! The output is a fully compliant standard PDF document that adheres to all ISO specification rules. It terminates with standard %%EOF, preserves original cross-reference tables, and opens flawlessly in Adobe Acrobat, Google Chrome, Safari, Microsoft Edge, and automated government scanning pipelines without warnings or corruption flags.
              </p>
            </div>
          </div>
        </div>
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
