import React, { useState, useRef, useEffect } from 'react';
import { Sliders, RotateCw, RefreshCw, Download, Upload, Image as ImageIcon, Sparkles, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { navigate } from '../../utils/router';
import { updateSEO } from '../../utils/seo';

// -------------------------------------------------------------
// DPI Metadata Extraction & Injection Utilities (Client-Side)
// -------------------------------------------------------------

const parseDpi = (arrayBuffer: ArrayBuffer): number => {
  if (arrayBuffer.byteLength < 20) return 96;
  const view = new DataView(arrayBuffer);
  
  // Check JPEG JFIF
  if (view.getUint16(0) === 0xFFD8) {
    let offset = 2;
    while (offset < view.byteLength - 18) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFE0) { // APP0 (JFIF)
        const length = view.getUint16(offset + 2);
        // Check for 'JFIF' signature
        if (view.getUint32(offset + 4) === 0x4A464946) {
          const unit = view.getUint8(offset + 9); // 1 = DPI, 2 = DPC
          const xDensity = view.getUint16(offset + 10);
          if (unit === 1 && xDensity > 0) {
            return xDensity;
          } else if (unit === 2 && xDensity > 0) {
            return Math.round(xDensity * 2.54); // Dots per cm to DPI
          }
        }
        break;
      }
      if ((marker & 0xFF00) !== 0xFF00) break; // Invalid marker
      offset += 2 + view.getUint16(offset + 2);
    }
  }
  
  // Check PNG pHYs
  if (view.getUint32(0) === 0x89504E47 && view.getUint32(4) === 0x0D0A1A0A) {
    let offset = 8;
    while (offset < view.byteLength - 12) {
      const length = view.getUint32(offset);
      const chunkType = view.getUint32(offset + 4);
      if (chunkType === 0x70485973) { // 'pHYs'
        const xPxPerUnit = view.getUint32(offset + 8);
        const unitSpecifier = view.getUint8(offset + 16); // 1 = meter
        if (unitSpecifier === 1 && xPxPerUnit > 0) {
          return Math.round(xPxPerUnit / 39.3700787);
        }
      }
      offset += 8 + length + 4; // length + chunk type + data + CRC
    }
  }
  
  return 96; // Fallback default
};

const injectPngDpi = (blob: Blob, dpi: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);
      
      const pxPerMeter = Math.round(dpi * 39.3700787);
      
      let physOffset = -1;
      let offset = 33; // After IHDR
      while (offset < buffer.byteLength - 12) {
        const length = view.getUint32(offset);
        const type = view.getUint32(offset + 4);
        if (type === 0x70485973) {
          physOffset = offset;
          break;
        }
        offset += 8 + length + 4;
      }
      
      const crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          if (c & 1) {
            c = 0xedb88320 ^ (c >>> 1);
          } else {
            c = c >>> 1;
          }
        }
        crcTable[n] = c;
      }
      
      const calculateCrc = (dataBytes: Uint8Array): number => {
        let crc = 0xffffffff;
        for (let i = 0; i < dataBytes.length; i++) {
          crc = crcTable[(crc ^ dataBytes[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
      };

      const physChunk = new Uint8Array(17);
      const physView = new DataView(physChunk.buffer);
      physView.setUint32(0, 9); // length
      physView.setUint32(4, 0x70485973); // 'pHYs'
      physView.setUint32(8, pxPerMeter); // X density
      physView.setUint32(12, pxPerMeter); // Y density
      physChunk[16] = 1; // meter unit
      
      const crcVal = calculateCrc(physChunk.subarray(4, 17));
      const finalChunk = new Uint8Array(21);
      finalChunk.set(physChunk);
      const finalView = new DataView(finalChunk.buffer);
      finalView.setUint32(17, crcVal);
      
      let newBlob: Blob;
      if (physOffset !== -1) {
        const part1 = bytes.subarray(0, physOffset);
        const physLength = view.getUint32(physOffset);
        const part2 = bytes.subarray(physOffset + 8 + physLength + 4);
        newBlob = new Blob([part1, finalChunk, part2], { type: 'image/png' });
      } else {
        const part1 = bytes.subarray(0, 33);
        const part2 = bytes.subarray(33);
        newBlob = new Blob([part1, finalChunk, part2], { type: 'image/png' });
      }
      resolve(newBlob);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const injectJpegDpi = (blob: Blob, dpi: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      const view = new DataView(buffer);
      
      if (view.getUint16(0) !== 0xFFD8) {
        resolve(blob);
        return;
      }
      
      let offset = 2;
      while (offset < buffer.byteLength - 18) {
        const marker = view.getUint16(offset);
        if (marker === 0xFFE0) {
          const length = view.getUint16(offset + 2);
          if (view.getUint32(offset + 4) === 0x4A464946 && view.getUint8(offset + 8) === 0x00) {
            bytes[offset + 9] = 1; // inch units
            view.setUint16(offset + 10, dpi);
            view.setUint16(offset + 12, dpi);
            resolve(new Blob([bytes], { type: 'image/jpeg' }));
            return;
          }
          break;
        }
        if ((marker & 0xFF00) !== 0xFF00) break;
        offset += 2 + view.getUint16(offset + 2);
      }
      
      // Construct standard APP0 marker block if not found
      const app0 = new Uint8Array(18);
      const app0View = new DataView(app0.buffer);
      app0View.setUint16(0, 0xFFE0);
      app0View.setUint16(2, 16);
      app0.set([0x4A, 0x46, 0x49, 0x46, 0x00], 4);
      app0[9] = 0x01; // major
      app0[10] = 0x01; // minor
      app0[11] = 0x01; // units = inch
      app0View.setUint16(12, dpi);
      app0View.setUint16(14, dpi);
      app0[16] = 0;
      app0[17] = 0;
      
      const part1 = bytes.subarray(0, 2);
      const part2 = bytes.subarray(2);
      resolve(new Blob([part1, app0, part2], { type: 'image/jpeg' }));
    };
    reader.readAsArrayBuffer(blob);
  });
};

export const canvasToBmpBlob = (canvas: HTMLCanvasElement): Blob => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // File Header
  u8[0] = 0x42; // 'B'
  u8[1] = 0x4D; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true);

  // DIB Header
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true); // 24-bit RGB
  view.setUint32(30, 0, true); // BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Pixel data (BGR bottom-up)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      const px = rowOffset + x * 4;
      u8[offset++] = data[px + 2]; // B
      u8[offset++] = data[px + 1]; // G
      u8[offset++] = data[px];     // R
    }
    // padding
    for (let p = 0; p < rowSize - width * 3; p++) {
      u8[offset++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------

interface ImageEditorProps {
  defaultTab?: 'adjust' | 'crop' | 'resize' | 'dpi' | 'compress' | 'bg-remove' | 'convert';
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ defaultTab }) => {
  // Navigation tabs in sidebar
  const [activeTab, setActiveTab] = useState<'adjust' | 'crop' | 'resize' | 'dpi' | 'compress' | 'bg-remove' | 'convert'>(defaultTab || 'adjust');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Synchronize SEO tags and JSON-LD schema on tab changes
  useEffect(() => {
    const imageFaqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the client-side free image compressor on Quantum Qbit optimize JPEG, PNG, and WebP files?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our client-side free image compressor utilizes modern HTML5 Canvas APIs and client-side processing libraries to compress JPEG, PNG, and WebP images directly within your browser. When you upload an image to Quantum Qbit, it is loaded into your local memory space. For lossy formats like JPEG and WebP, the compressor applies a discrete cosine transform (DCT) algorithm to simplify color details that are less noticeable to the human eye, thereby reducing the bytes needed to store the image. If you are trying to compress jpeg images, our tool adjusts the quantization tables on the fly based on your desired quality selector. For lossless formats like PNG, the tool utilizes canvas rendering and color palette reductions (quantization) to strip out redundant metadata chunks (like EXIF data, color profiles, and software markers) that inflate the file size. By performing all these operations on your machine's CPU threads, you bypass the latency of uploading raw high-resolution files to a web server. This client-side execution makes our online photo compressor extremely fast and secure, delivering optimized, compressed images in a fraction of a second without compromising the structural integrity of your original graphics."
          }
        },
        {
          "@type": "Question",
          "name": "How can I compress image to 100kb or compress image to 200kb using the online photo compressor?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Many online web forms, government application portals, and email services enforce strict upload limit thresholds, requiring users to submit files below 100KB or 200KB. To meet these exact requirements, our online photo compressor features a smart target-size compression mode. To compress image to 100kb or compress image to 200kb, simply upload your file, select the 'Target File Size Limit' tab in the options panel, and input your desired file size in Kilobytes (e.g., 100 or 200). The compressor's internal algorithm runs an iterative binary search loop inside your browser. In each iteration, it adjusts the canvas dimensions (resolution scale) and quality compression factors, then measures the resulting blob size. If the resulting size exceeds the target, it recalibrates the variables and tries again, repeating this process up to 10 times in milliseconds until it finds the optimal combination that yields a file just under your specified KB target. This guarantees that your output image will fit the required limit perfectly, without you having to manually guess quality percentages or scale down dimensions over and over."
          }
        },
        {
          "@type": "Question",
          "name": "What is a 300 DPI converter, and how do I change DPI of image online without losing quality?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "DPI, or Dots Per Inch, is a metadata tag embedded in image headers that tells printing devices how many pixels to distribute per inch of paper. Standard web images default to 72 DPI or 96 DPI, but professional printing houses, academic journals, and passport applications usually require a 300 DPI layout. If you need a 300 dpi converter, our tool allows you to change dpi of image online easily. Unlike other online converters that re-sample and stretch the pixels of your image (which leads to blurry edges, interpolation artifacts, and loss of visual fidelity), our tool changes the DPI strictly by rewriting the metadata headers of the file. For JPEG files, we modify the JFIF APP0 marker segment bytes 10-14. For PNG files, we write or modify the physical pixel dimensions (pHYs) chunk. This means the underlying pixel grid remains untouched, preserving 100% of the original photo quality, while the print size configuration tag is updated to 300 DPI. When you print the output, the printer reads the updated header and outputs a crisp, high-density print."
          }
        },
        {
          "@type": "Question",
          "name": "How does the feature to remove background from image free work without cloud uploads?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Traditional background removal websites upload your private photos to their servers, where resource-heavy machine learning models process the files. This exposes your private content to external databases and often comes with hidden subscription costs. Quantum Qbit provides a way to remove background from image free of charge, operating entirely client-side. Our tool loads your image onto a temporary, off-screen HTML5 canvas element. When you activate the background remover and choose a color using the color picker or eye-dropper tool, the software parses the pixel array (ImageData.data) of the canvas. It evaluates the Red, Green, Blue, and Alpha (RGBA) channels of each pixel, calculating the color distance relative to your selected key color. With adjustable tolerance and feathering sliders, you can fine-tune how close a pixel's color must be to the selected target to be made transparent, and how smoothly the edges should blend. The pixels matching the criteria are instantly set to an alpha value of zero. Because this color-keying shader logic runs in your browser's Javascript runtime, your files never leave your device, ensuring maximum privacy."
          }
        },
        {
          "@type": "Question",
          "name": "Can I use the WebP converter to transform images between PNG, JPEG, WEBP, and BMP formats?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Quantum Qbit functions as an all-in-one image converter and webp converter. WebP is a modern image format developed by Google that provides superior lossless and lossy compression for web images, often rendering files 26% smaller than PNGs and 30% smaller than JPEGs. Converting your assets to WebP is highly recommended for site performance. To convert files, upload any image, navigate to the conversion section in the sidebar, choose your target format—whether it's JPEG, PNG, WEBP, BMP, or even compiling the image into a PDF page—and adjust the quality factor if applicable. When you click the convert button, the browser reads the canvas pixel grid and exports the data using the native canvas.toBlob() method configured to the target MIME type. For BMP conversion, we run a custom binary encoder that packages the raw pixel buffer into standard Microsoft BMP file structures on the fly. This client-side pipeline ensures that you can format files for any application without depending on server APIs or queue wait times."
          }
        },
        {
          "@type": "Question",
          "name": "Why is a client-side image editor and studio safer than traditional cloud-based photo editors?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most online editing platforms act as middlemen: they force you to upload your files to their cloud servers, process the edits on their hardware, and send the finished file back down. This workflow presents major security risks, especially if you are working with personal ID documents, proprietary designs, or sensitive corporate screenshots. If their servers are hacked, or if they sell user data, your personal files could be compromised. Quantum Qbit's image studio online operates under a strict privacy-first model: all calculations, filter applications, canvas clipping, and file compression take place inside your browser's sandboxed local memory. Your images are never transmitted over the internet to any external server. Since there is no database storing your files, they can never be leaked, scraped by AI training programs, or accessed by third-party tracking scripts. In fact, once the web application loads in your tab, you can completely disconnect your internet, turn on airplane mode, and continue editing, cropping, resizing, and converting images offline."
          }
        },
        {
          "@type": "Question",
          "name": "How do I crop and resize images while maintaining the aspect ratio?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Resizing and cropping are essential steps to make images fit social media headers, blog thumbnails, or print templates. In our Image Studio, cropping is handled using an interactive drag-and-drop bounding box overlay. You can drag the corners of the box to select your crop region, and click the crop button to draw only that bounding region onto a new canvas, shedding unwanted border pixels. For resizing, we offer both pixel dimension controls and percentage scaling. To resize while maintaining the original aspect ratio, simply check the 'Lock Aspect Ratio' checkbox. When locked, changing the width input will automatically calculate and update the corresponding height input based on the image's original ratio (width divided by height). This prevents the image from looking stretched or squished. The browser uses bilinear or bicubic interpolation algorithms during canvas rendering to smoothly downscale or upscale the pixels, ensuring that your resized image remains clean and readable."
          }
        },
        {
          "@type": "Question",
          "name": "What are the best practices for optimizing web images to rank higher on Google Search?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "To rank higher in Google Image Search and improve your website's overall SEO ranking, you must optimize your page speed and image metadata. First, compress all images using a free image compressor to reduce file sizes; faster page load times directly boost your mobile SEO scores. Second, convert images to modern formats like WebP or AVIF using a webp converter to maximize bytes saved. Third, always write descriptive alt text in your HTML, incorporating your primary keywords naturally. Fourth, ensure that the image filename itself is descriptive (e.g. blue-nike-running-shoes.webp instead of IMG_48291.jpg). Fifth, use clean canonical markup and schema metadata, such as JSON-LD FAQPage structures, to help indexers understand the context around your images. Finally, ensure your images are responsive, using srcset to serve smaller sizes to mobile devices, preventing unnecessary bandwidth waste. Quantum Qbit implements these optimizations out of the box, allowing you to generate search-optimized, high-performance web assets easily."
          }
        },
        {
          "@type": "Question",
          "name": "Is there any file size or resolution limit for processing images locally in my browser?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Because our image tools operate entirely in the client-side browser thread, the processing capability is bound by the hardware resources of your local device (such as CPU speed and available RAM) and the browser's memory allocation limits. Generally, modern browsers on desktop computers can comfortably process images up to 50 Megabytes in file size or 10,000 x 10,000 pixels in resolution. When handling massive digital camera raw files or ultra-high-resolution panoramas, the canvas element might reach memory limit constraints defined by the browser sandbox, which can cause the tab to crash. If you experience performance lag, we recommend downscaling the image scale percentage early in the workflow, or using a dedicated offline application for file sizes larger than 100MB. For 99% of web graphics, standard photos, and documents, Quantum Qbit offers a fluid, instant, and lag-free editing experience."
          }
        },
        {
          "@type": "Question",
          "name": "How do I apply visual filters and color adjustments to multiple images at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Applying visual filters such as brightness, contrast, saturation, gray, hue-rotate, and blur is a popular requirement for content creators who need to maintain a unified visual style across their channels. On Quantum Qbit, you can easily load an image and adjust its sliders under the 'Adjustments' panel. The tool renders these changes in real-time on your canvas using hardware-accelerated CSS filter matrices, allowing you to immediately download the results. If you need to apply the same configurations to a batch of photos, you can keep the slider settings as they are, click the upload button to select a new image file, and the application will instantly apply your active parameters (such as 120% brightness and 15% blur) to the new photo. This pseudo-batch configuration saves you from having to dial in the settings repeatedly for each file. This represents a huge productivity boost for photographers, social media managers, and developers who need to produce consistent visual elements quickly and free of charge."
          }
        }
      ]
    };

    if (activeTab === 'compress') {
      const isPhotoPath = window.location.pathname.includes('photo-compressor');
      updateSEO(
        isPhotoPath
          ? "Free Photo Compressor Online - Reduce Photo File Size | Quantum Qbit"
          : "Free Image Compressor Online - Compress Photos Free | Quantum Qbit",
        "Compress images and photos online for free. Adjust target size (KB) or quality to reduce image size instantly. Supports JPG, PNG, and WebP. 100% private.",
        isPhotoPath ? "/tools/photo-compressor" : "/tools/image-compressor",
        imageFaqSchema
      );
    } else {
      let tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      if (activeTab === 'bg-remove') tabName = 'Background Remover';
      updateSEO(
        `${tabName} - Free Client-Side Image Studio | Quantum Qbit`,
        `Crop, resize, convert, adjust DPI, remove background, and apply settings to images locally inside your browser. 100% private and fast.`,
        `/tools/image-editor`,
        imageFaqSchema
      );
    }
  }, [activeTab]);

  // Format Conversion states
  const [convertFormat, setConvertFormat] = useState<'png' | 'jpeg' | 'webp' | 'bmp' | 'pdf'>('png');
  const [convertQuality, setConvertQuality] = useState<number>(90);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSizeStr, setConvertedSizeStr] = useState<string>('');
  const [converting, setConverting] = useState<boolean>(false);

  // File metadata states
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [filename, setFilename] = useState('quantum-edit');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [originalFileType, setOriginalFileType] = useState<string>('image/png');
  const [dpi, setDpi] = useState<number>(96);
  const [originalDpi, setOriginalDpi] = useState<number>(96);

  // Crop Tool coordinates and aspect ratio states
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropWidth, setCropWidth] = useState<number>(0);
  const [cropHeight, setCropHeight] = useState<number>(0);
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '16:9' | '4:3' | '3:2'>('free');

  // Final Preview Modal states
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [modalImageSrc, setModalImageSrc] = useState<string>('');
  const [finalPreviewSize, setFinalPreviewSize] = useState<number>(0);

  // Normal Adjustments states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  
  // Transform states
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  // Resize states
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [originalRatio, setOriginalRatio] = useState(1);
  const [resizeUnit, setResizeUnit] = useState<'px' | 'cm' | 'inches'>('px');

  // File Compression states
  const [targetSizeKB, setTargetSizeKB] = useState<number>(150);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSizeStr, setCompressedSizeStr] = useState<string>('');

  // Background Removal states
  const [bgRemovalActive, setBgRemovalActive] = useState<boolean>(false);
  const [bgColorToRemove, setBgColorToRemove] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [bgTolerance, setBgTolerance] = useState<number>(15);
  const [bgFeather, setBgFeather] = useState<number>(5);
  const [eyeDropperActive, setEyeDropperActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drag states for interactive cropping
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<string>('draw');
  const [initialCrop, setInitialCrop] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  // Coordinate conversion helper: client mouse space to original image space
  const getOriginalCoords = (clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageRef.current || imageSize.width === 0) return null;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    
    // Scale client coords to canvas internal resolution
    const canvasX = (clickX / rect.width) * canvas.width;
    const canvasY = (clickY / rect.height) * canvas.height;
    
    // Translate relative to center
    let px = canvasX - canvas.width / 2;
    let py = canvasY - canvas.height / 2;
    
    // Apply inverse flip
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    px *= scaleX;
    py *= scaleY;
    
    // Apply inverse rotation
    const rad = (-rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    
    // Translate back to image space
    const imgX = rx + resizeWidth / 2;
    const imgY = ry + resizeHeight / 2;
    
    // Map to original image resolution bounds
    const originalX = Math.max(0, Math.min(imageSize.width, (imgX / resizeWidth) * imageSize.width));
    const originalY = Math.max(0, Math.min(imageSize.height, (imgY / resizeHeight) * imageSize.height));
    
    return { x: originalX, y: originalY };
  };

  // Coordinate conversion helper: original image space to client space
  const originalToCanvasCoords = (ox: number, oy: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageRef.current || imageSize.width === 0) return null;
    
    // Map to resized image space
    const imgX = (ox / imageSize.width) * resizeWidth;
    const imgY = (oy / imageSize.height) * resizeHeight;
    
    // Center relative coordinates
    const rx = imgX - resizeWidth / 2;
    const ry = imgY - resizeHeight / 2;
    
    // Apply rotation
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let px = rx * cos - ry * sin;
    let py = rx * sin + ry * cos;
    
    // Apply flip
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    px *= scaleX;
    py *= scaleY;
    
    // Translate to canvas space
    const canvasX = px + canvas.width / 2;
    const canvasY = py + canvas.height / 2;
    
    // Scale canvas coordinates to client bounding box
    const rect = canvas.getBoundingClientRect();
    const elementX = (canvasX / canvas.width) * rect.width;
    const elementY = (canvasY / canvas.height) * rect.height;
    
    return { x: elementX, y: elementY };
  };

  // Get current screen locations for crop handles
  const getCropHandles = () => {
    const nw = originalToCanvasCoords(cropX, cropY);
    const ne = originalToCanvasCoords(cropX + cropWidth, cropY);
    const sw = originalToCanvasCoords(cropX, cropY + cropHeight);
    const se = originalToCanvasCoords(cropX + cropWidth, cropY + cropHeight);
    
    if (!nw || !ne || !sw || !se) return null;
    
    return {
      nw, ne, sw, se,
      n: { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 },
      s: { x: (sw.x + se.x) / 2, y: (sw.y + se.y) / 2 },
      e: { x: (ne.x + se.x) / 2, y: (ne.y + se.y) / 2 },
      w: { x: (nw.x + sw.x) / 2, y: (nw.y + sw.y) / 2 }
    };
  };

  // Mouse down on canvas (initiates crop selection dragging)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'crop' || imageSize.width === 0 || eyeDropperActive) return;
    
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    
    const clickCoords = getOriginalCoords(e.clientX, e.clientY);
    if (!clickCoords) return;
    
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const handles = getCropHandles();
    if (!handles) return;
    
    const threshold = 15;
    let mode = 'draw';
    
    if (Math.hypot(mx - handles.nw.x, my - handles.nw.y) < threshold) {
      mode = 'nw';
    } else if (Math.hypot(mx - handles.ne.x, my - handles.ne.y) < threshold) {
      mode = 'ne';
    } else if (Math.hypot(mx - handles.sw.x, my - handles.sw.y) < threshold) {
      mode = 'sw';
    } else if (Math.hypot(mx - handles.se.x, my - handles.se.y) < threshold) {
      mode = 'se';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.n.x, my - handles.n.y) < threshold) {
      mode = 'n';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.s.x, my - handles.s.y) < threshold) {
      mode = 's';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.e.x, my - handles.e.y) < threshold) {
      mode = 'e';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.w.x, my - handles.w.y) < threshold) {
      mode = 'w';
    } else {
      const { x, y } = clickCoords;
      if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) {
        mode = 'move';
      } else {
        mode = 'draw';
      }
    }
    
    setIsDragging(true);
    setDragStart(clickCoords);
    setDragMode(mode);
    setInitialCrop({ x: cropX, y: cropY, w: cropWidth, h: cropHeight });
  };

  // Mouse move on canvas (mostly for hover cursor feedback)
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'crop' || imageSize.width === 0) {
      if (eyeDropperActive) {
        // preserve crosshair cursor for eyedropper
      } else {
        e.currentTarget.style.cursor = 'default';
      }
      return;
    }
    
    if (isDragging) return; // window-level listener takes care of dragging
    
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const handles = getCropHandles();
    if (!handles) return;
    
    const threshold = 15;
    let cursor = 'default';
    
    if (Math.hypot(mx - handles.nw.x, my - handles.nw.y) < threshold) {
      cursor = 'nwse-resize';
    } else if (Math.hypot(mx - handles.ne.x, my - handles.ne.y) < threshold) {
      cursor = 'nesw-resize';
    } else if (Math.hypot(mx - handles.sw.x, my - handles.sw.y) < threshold) {
      cursor = 'nesw-resize';
    } else if (Math.hypot(mx - handles.se.x, my - handles.se.y) < threshold) {
      cursor = 'nwse-resize';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.n.x, my - handles.n.y) < threshold) {
      cursor = 'ns-resize';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.s.x, my - handles.s.y) < threshold) {
      cursor = 'ns-resize';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.e.x, my - handles.e.y) < threshold) {
      cursor = 'ew-resize';
    } else if (cropAspect === 'free' && Math.hypot(mx - handles.w.x, my - handles.w.y) < threshold) {
      cursor = 'ew-resize';
    } else {
      const clickCoords = getOriginalCoords(e.clientX, e.clientY);
      if (clickCoords) {
        const { x, y } = clickCoords;
        if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) {
          cursor = 'move';
        } else {
          cursor = 'crosshair';
        }
      }
    }
    
    e.currentTarget.style.cursor = cursor;
  };

  // Window-level mouse interaction listeners for smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      
      const currentCoords = getOriginalCoords(e.clientX, e.clientY);
      if (!currentCoords) return;
      
      const dx = currentCoords.x - dragStart.x;
      const dy = currentCoords.y - dragStart.y;
      
      if (dragMode === 'move') {
        let newX = Math.round(initialCrop.x + dx);
        let newY = Math.round(initialCrop.y + dy);
        
        newX = Math.max(0, Math.min(imageSize.width - initialCrop.w, newX));
        newY = Math.max(0, Math.min(imageSize.height - initialCrop.h, newY));
        
        setCropX(newX);
        setCropY(newY);
      } else if (dragMode === 'draw') {
        let x1 = dragStart.x;
        let y1 = dragStart.y;
        let x2 = currentCoords.x;
        let y2 = currentCoords.y;
        
        let newX = Math.min(x1, x2);
        let newY = Math.min(y1, y2);
        let newW = Math.abs(x1 - x2);
        let newH = Math.abs(y1 - y2);
        
        if (cropAspect !== 'free') {
          let ratio = 1;
          if (cropAspect === '1:1') ratio = 1;
          else if (cropAspect === '16:9') ratio = 16 / 9;
          else if (cropAspect === '4:3') ratio = 4 / 3;
          else if (cropAspect === '3:2') ratio = 3 / 2;
          
          if (newW / ratio > newH) {
            newH = newW / ratio;
          } else {
            newW = newH * ratio;
          }
          
          if (x2 < x1) newX = x1 - newW;
          if (y2 < y1) newY = y1 - newH;
          
          // Constrain inside image boundaries
          if (newX < 0) {
            newW += newX;
            newX = 0;
            newH = newW / ratio;
            if (y2 < y1) newY = y1 - newH;
          }
          if (newY < 0) {
            newH += newY;
            newY = 0;
            newW = newH * ratio;
            if (x2 < x1) newX = x1 - newW;
          }
          if (newX + newW > imageSize.width) {
            newW = imageSize.width - newX;
            newH = newW / ratio;
            if (y2 < y1) newY = y1 - newH;
          }
          if (newY + newH > imageSize.height) {
            newH = imageSize.height - newY;
            newW = newH * ratio;
            if (x2 < x1) newX = x1 - newW;
          }
        }
        
        if (newW >= 10 && newH >= 10) {
          setCropX(Math.round(newX));
          setCropY(Math.round(newY));
          setCropWidth(Math.round(newW));
          setCropHeight(Math.round(newH));
        }
      } else {
        // Resizing from handles
        let newX = cropX;
        let newY = cropY;
        let newW = cropWidth;
        let newH = cropHeight;
        
        if (cropAspect === 'free') {
          if (dragMode === 'nw') {
            const right = initialCrop.x + initialCrop.w;
            const bottom = initialCrop.y + initialCrop.h;
            newX = Math.max(0, Math.min(right - 10, currentCoords.x));
            newY = Math.max(0, Math.min(bottom - 10, currentCoords.y));
            newW = right - newX;
            newH = bottom - newY;
          } else if (dragMode === 'ne') {
            const left = initialCrop.x;
            const bottom = initialCrop.y + initialCrop.h;
            newY = Math.max(0, Math.min(bottom - 10, currentCoords.y));
            newW = Math.max(10, Math.min(imageSize.width - left, currentCoords.x - left));
            newH = bottom - newY;
          } else if (dragMode === 'sw') {
            const right = initialCrop.x + initialCrop.w;
            const top = initialCrop.y;
            newX = Math.max(0, Math.min(right - 10, currentCoords.x));
            newW = right - newX;
            newH = Math.max(10, Math.min(imageSize.height - top, currentCoords.y - top));
          } else if (dragMode === 'se') {
            const left = initialCrop.x;
            const top = initialCrop.y;
            newW = Math.max(10, Math.min(imageSize.width - left, currentCoords.x - left));
            newH = Math.max(10, Math.min(imageSize.height - top, currentCoords.y - top));
          } else if (dragMode === 'n') {
            const bottom = initialCrop.y + initialCrop.h;
            newY = Math.max(0, Math.min(bottom - 10, currentCoords.y));
            newH = bottom - newY;
          } else if (dragMode === 's') {
            const top = initialCrop.y;
            newH = Math.max(10, Math.min(imageSize.height - top, currentCoords.y - top));
          } else if (dragMode === 'e') {
            const left = initialCrop.x;
            newW = Math.max(10, Math.min(imageSize.width - left, currentCoords.x - left));
          } else if (dragMode === 'w') {
            const right = initialCrop.x + initialCrop.w;
            newX = Math.max(0, Math.min(right - 10, currentCoords.x));
            newW = right - newX;
          }
        } else {
          // Constrained aspect ratio resizing (nw, ne, sw, se only)
          let ratio = 1;
          if (cropAspect === '1:1') ratio = 1;
          else if (cropAspect === '16:9') ratio = 16 / 9;
          else if (cropAspect === '4:3') ratio = 4 / 3;
          else if (cropAspect === '3:2') ratio = 3 / 2;
          
          if (dragMode === 'se') {
            newW = Math.max(10, currentCoords.x - initialCrop.x);
            newH = newW / ratio;
            if (initialCrop.y + newH > imageSize.height) {
              newH = imageSize.height - initialCrop.y;
              newW = newH * ratio;
            }
            if (initialCrop.x + newW > imageSize.width) {
              newW = imageSize.width - initialCrop.x;
              newH = newW / ratio;
            }
          } else if (dragMode === 'ne') {
            newW = Math.max(10, currentCoords.x - initialCrop.x);
            newH = newW / ratio;
            newY = initialCrop.y + initialCrop.h - newH;
            if (newY < 0) {
              newY = 0;
              newH = initialCrop.y + initialCrop.h;
              newW = newH * ratio;
            }
            if (initialCrop.x + newW > imageSize.width) {
              newW = imageSize.width - initialCrop.x;
              newH = newW / ratio;
              newY = initialCrop.y + initialCrop.h - newH;
            }
          } else if (dragMode === 'sw') {
            const right = initialCrop.x + initialCrop.w;
            newX = Math.max(0, Math.min(right - 10, currentCoords.x));
            newW = right - newX;
            newH = newW / ratio;
            if (initialCrop.y + newH > imageSize.height) {
              newH = imageSize.height - initialCrop.y;
              newW = newH * ratio;
              newX = right - newW;
            }
          } else if (dragMode === 'nw') {
            const right = initialCrop.x + initialCrop.w;
            newX = Math.max(0, Math.min(right - 10, currentCoords.x));
            newW = right - newX;
            newH = newW / ratio;
            newY = initialCrop.y + initialCrop.h - newH;
            if (newY < 0) {
              newY = 0;
              newH = initialCrop.y + initialCrop.h;
              newW = newH * ratio;
              newX = right - newW;
            }
          }
        }
        
        setCropX(Math.round(newX));
        setCropY(Math.round(newY));
        setCropWidth(Math.round(newW));
        setCropHeight(Math.round(newH));
      }
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, dragStart, dragMode, initialCrop, imageSize, cropAspect, cropX, cropY, cropWidth, cropHeight, rotate, flipH, flipV, resizeWidth, resizeHeight]);

  // Reset all filters
  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setBlur(0);
    setHueRotate(0);
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setResizeUnit('px');
    setDpi(originalDpi);
    setTargetSizeKB(Math.round(fileSizeBytes / 1024) > 10 ? Math.round(fileSizeBytes / 2048) : 100);
    setCompressedBlob(null);
    setCompressedSizeStr('');
    setBgRemovalActive(false);
    setBgColorToRemove({ r: 255, g: 255, b: 255 });
    setBgTolerance(15);
    setBgFeather(5);
    setEyeDropperActive(false);
    
    if (imageRef.current) {
      setResizeWidth(imageRef.current.naturalWidth);
      setResizeHeight(imageRef.current.naturalHeight);
      setCropX(0);
      setCropY(0);
      setCropWidth(imageRef.current.naturalWidth);
      setCropHeight(imageRef.current.naturalHeight);
      setCropAspect('free');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name.split('.')[0] + '-edited');
      setFileSizeBytes(file.size);
      setFileSizeStr(formatBytes(file.size));
      setOriginalFileType(file.type || 'image/png');
      setOriginalImageSize({ width: 0, height: 0 }); // Reset uncropped dimensions tracker
      
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setOriginalImage(reader.result as string); // Save original uncropped source image
      };
      reader.readAsDataURL(file);

      // Parse metadata for DPI
      const bufferReader = new FileReader();
      bufferReader.onload = () => {
        if (bufferReader.result) {
          const parsed = parseDpi(bufferReader.result as ArrayBuffer);
          setDpi(parsed);
          setOriginalDpi(parsed);
        }
      };
      bufferReader.readAsArrayBuffer(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Set original dimensions when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    
    // Only reset everything and capture original size on fresh file upload
    if (originalImageSize.width === 0) {
      setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setResizeWidth(img.naturalWidth);
      setResizeHeight(img.naturalHeight);
      setOriginalRatio(img.naturalWidth / img.naturalHeight);
      setCropX(0);
      setCropY(0);
      setCropWidth(img.naturalWidth);
      setCropHeight(img.naturalHeight);
      setCropAspect('free');
      
      // Delay resetting filters slightly to ensure states are aligned
      setTimeout(() => {
        resetFilters();
      }, 0);
    }
  };

  // Display value conversions
  const getDisplayWidth = () => {
    if (resizeUnit === 'px') return resizeWidth;
    if (resizeUnit === 'inches') return parseFloat((resizeWidth / dpi).toFixed(3));
    return parseFloat(((resizeWidth / dpi) * 2.54).toFixed(3)); // cm
  };

  const getDisplayHeight = () => {
    if (resizeUnit === 'px') return resizeHeight;
    if (resizeUnit === 'inches') return parseFloat((resizeHeight / dpi).toFixed(3));
    return parseFloat(((resizeHeight / dpi) * 2.54).toFixed(3)); // cm
  };

  const handleDisplayWidthChange = (val: number) => {
    let pxVal = val;
    if (resizeUnit === 'inches') pxVal = Math.round(val * dpi);
    if (resizeUnit === 'cm') pxVal = Math.round((val / 2.54) * dpi);
    
    pxVal = Math.max(1, pxVal);
    setResizeWidth(pxVal);
    if (maintainRatio) {
      setResizeHeight(Math.round(pxVal / originalRatio));
    }
  };

  const handleDisplayHeightChange = (val: number) => {
    let pxVal = val;
    if (resizeUnit === 'inches') pxVal = Math.round(val * dpi);
    if (resizeUnit === 'cm') pxVal = Math.round((val / 2.54) * dpi);
    
    pxVal = Math.max(1, pxVal);
    setResizeHeight(pxVal);
    if (maintainRatio) {
      setResizeWidth(Math.round(pxVal * originalRatio));
    }
  };

  // -------------------------------------------------------------
  // Render WYSIWYG Viewport
  // -------------------------------------------------------------
  const removeBackgroundByColor = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    targetColor: { r: number; g: number; b: number },
    tolerance: number,
    feather: number
  ) => {
    if (width === 0 || height === 0) return;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    const { r: tr, g: tg, b: tb } = targetColor;
    const threshold = (tolerance / 100) * 250;
    const featherWidth = (feather / 100) * 100 + 1;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      // Calculate Euclidean distance in color space
      const distance = Math.sqrt(
        (r - tr) ** 2 +
        (g - tg) ** 2 +
        (b - tb) ** 2
      );
      
      if (distance < threshold) {
        data[i + 3] = 0; // Make pixel transparent
      } else if (distance < threshold + featherWidth) {
        const ratio = (distance - threshold) / featherWidth;
        data[i + 3] = Math.min(a, Math.round(ratio * 255)); // Gradual feathering
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const drawPreview = (excludeOverlay = false) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    const isSwapped = rotate === 90 || rotate === 270;
    
    // Preview canvas width/height represents the resizing output scale
    canvas.width = isSwapped ? resizeHeight : resizeWidth;
    canvas.height = isSwapped ? resizeWidth : resizeHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    // Apply normal editor adjustments
    ctx.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
      grayscale(${grayscale}%)
      blur(${blur}px)
      hue-rotate(${hueRotate}deg)
    `;
    
    // Transform coordinates
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    ctx.scale(scaleX, scaleY);
    
    // Draw raw image centered
    ctx.drawImage(
      img, 
      -resizeWidth / 2, 
      -resizeHeight / 2, 
      resizeWidth, 
      resizeHeight
    );
    
    ctx.restore();
    
    // Apply color removal last (on the final color grid)
    if (bgRemovalActive) {
      removeBackgroundByColor(
        ctx, 
        canvas.width, 
        canvas.height, 
        bgColorToRemove, 
        bgTolerance, 
        bgFeather
      );
    }

    // Draw Crop Overlay if active and not excluded
    if (activeTab === 'crop' && !excludeOverlay && imageSize.width > 0 && imageSize.height > 0) {
      ctx.save();
      // Apply transforms again (without filter!)
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(scaleX, scaleY);
      
      const cx = -resizeWidth / 2 + (cropX / imageSize.width) * resizeWidth;
      const cy = -resizeHeight / 2 + (cropY / imageSize.height) * resizeHeight;
      const cw = (cropWidth / imageSize.width) * resizeWidth;
      const ch = (cropHeight / imageSize.height) * resizeHeight;
      
      // Draw shaded overlay outside the crop box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      
      // Top shaded box
      ctx.fillRect(-resizeWidth / 2, -resizeHeight / 2, resizeWidth, cy - (-resizeHeight / 2));
      // Bottom shaded box
      ctx.fillRect(-resizeWidth / 2, cy + ch, resizeWidth, (resizeHeight / 2) - (cy + ch));
      // Left shaded box
      ctx.fillRect(-resizeWidth / 2, cy, cx - (-resizeWidth / 2), ch);
      // Right shaded box
      ctx.fillRect(cx + cw, cy, (resizeWidth / 2) - (cx + cw), ch);
      
      // Draw dashed border around the crop box
      ctx.strokeStyle = '#00f2fe'; // Neon cyan matching theme primary
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cx, cy, cw, ch);

      // Draw handles for interactive resizing
      ctx.fillStyle = '#00f2fe';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]); // solid line for handles
      
      const handleSize = 8;
      
      const drawHandle = (hx: number, hy: number) => {
        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      };
      
      drawHandle(cx, cy); // NW
      drawHandle(cx + cw, cy); // NE
      drawHandle(cx, cy + ch); // SW
      drawHandle(cx + cw, cy + ch); // SE
      
      if (cropAspect === 'free') {
        drawHandle(cx + cw / 2, cy); // N
        drawHandle(cx + cw / 2, cy + ch); // S
        drawHandle(cx + cw, cy + ch / 2); // E
        drawHandle(cx, cy + ch / 2); // W
      }
      
      ctx.restore();
    }
  };

  // Re-render whenever viewport parameters change
  useEffect(() => {
    if (image) {
      const timer = setTimeout(() => {
        drawPreview();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [
    image,
    brightness,
    contrast,
    saturation,
    grayscale,
    blur,
    hueRotate,
    rotate,
    flipH,
    flipV,
    resizeWidth,
    resizeHeight,
    bgRemovalActive,
    bgColorToRemove,
    bgTolerance,
    bgFeather,
    activeTab,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
  ]);

  // Eye Dropper sample click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!eyeDropperActive || !previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Find click relative to drawing dimensions
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const x = Math.round((clickX / rect.width) * canvas.width);
    const y = Math.round((clickY / rect.height) * canvas.height);
    
    // Redraw preview quickly WITHOUT BG removal on a scratch canvas to get the clicked pixel's true color
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = canvas.width;
    sampleCanvas.height = canvas.height;
    const sampleCtx = sampleCanvas.getContext('2d');
    if (sampleCtx && imageRef.current) {
      const img = imageRef.current;
      sampleCtx.filter = `
        brightness(${brightness}%)
        contrast(${contrast}%)
        saturate(${saturation}%)
        grayscale(${grayscale}%)
        blur(${blur}px)
        hue-rotate(${hueRotate}deg)
      `;
      sampleCtx.translate(sampleCanvas.width / 2, sampleCanvas.height / 2);
      sampleCtx.rotate((rotate * Math.PI) / 180);
      const scaleX = flipH ? -1 : 1;
      const scaleY = flipV ? -1 : 1;
      sampleCtx.scale(scaleX, scaleY);
      sampleCtx.drawImage(img, -resizeWidth / 2, -resizeHeight / 2, resizeWidth, resizeHeight);
      
      const pixel = sampleCtx.getImageData(x, y, 1, 1).data;
      setBgColorToRemove({ r: pixel[0], g: pixel[1], b: pixel[2] });
      setBgRemovalActive(true);
    }
    setEyeDropperActive(false);
  };

  // -------------------------------------------------------------
  // File size compression (Binary Search Optimization)
  // -------------------------------------------------------------
  const getCompressedBlobHelper = async (mimeType: string): Promise<Blob | null> => {
    if (!previewCanvasRef.current) return null;
    
    // Redraw preview without crop overlay
    drawPreview(true);
    
    const canvas = previewCanvasRef.current;
    const targetBytes = targetSizeKB * 1024;
    let low = 0.01;
    let high = 1.0;
    let bestBlob: Blob | null = null;
    let closestDiff = Infinity;
    
    // 7 steps of binary search to find optimal quality factor
    for (let i = 0; i < 7; i++) {
      const mid = (low + high) / 2;
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mimeType, mid));
      if (!blob) break;
      
      const size = blob.size;
      const diff = Math.abs(size - targetBytes);
      
      if (size < targetBytes) {
        low = mid;
        if (diff < closestDiff) {
          closestDiff = diff;
          bestBlob = blob;
        }
      } else {
        high = mid;
        if (diff < closestDiff) {
          closestDiff = diff;
          bestBlob = blob;
        }
      }
    }
    
    // If the lowest quality is still too large, downscale canvas dimensions
    if (bestBlob && bestBlob.size > targetBytes) {
      let scale = 0.9;
      const isSwapped = rotate === 90 || rotate === 270;
      while (scale > 0.2 && bestBlob.size > targetBytes) {
        const sWidth = Math.round(resizeWidth * scale);
        const sHeight = Math.round(resizeHeight * scale);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = isSwapped ? sHeight : sWidth;
        tempCanvas.height = isSwapped ? sWidth : sHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          const scaleBlob: Blob | null = await new Promise((res) => tempCanvas.toBlob(res, mimeType, 0.45));
          if (scaleBlob) {
            bestBlob = scaleBlob;
            if (scaleBlob.size <= targetBytes) {
              break;
            }
          }
        }
        scale -= 0.1;
      }
    }
    
    return bestBlob;
  };

  const handleApplyCompression = async () => {
    if (!image) return;
    setCompressing(true);
    // Force format to image/jpeg for compression control (PNG is lossless and doesn't compress/adjust quality factor)
    const mime = originalFileType === 'image/png' ? 'image/jpeg' : originalFileType;
    const blob = await getCompressedBlobHelper(mime);
    if (blob) {
      setCompressedBlob(blob);
      setCompressedSizeStr(formatBytes(blob.size));
    }
    setCompressing(false);
  };

  const handleConvertFormat = async () => {
    if (!image || !previewCanvasRef.current) return;
    setConverting(true);
    setConvertedBlob(null);
    setConvertedSizeStr('');

    // Force clean draw without crop guides
    drawPreview(true);

    const canvas = previewCanvasRef.current;
    let blob: Blob | null = null;

    if (convertFormat === 'bmp') {
      try {
        blob = canvasToBmpBlob(canvas);
      } catch (err) {
        console.error('BMP Conversion failed:', err);
      }
    } else if (convertFormat === 'pdf') {
      try {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        blob = pdf.output('blob');
      } catch (err) {
        console.error('PDF Conversion failed:', err);
      }
    } else {
      const mime = `image/${convertFormat}`;
      const quality = convertQuality / 100;
      blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, quality));
    }

    if (blob) {
      let finalBlob = blob;
      if (blob.type === 'image/png') {
        finalBlob = await injectPngDpi(blob, dpi);
      } else if (blob.type === 'image/jpeg') {
        finalBlob = await injectJpegDpi(blob, dpi);
      }
      setConvertedBlob(finalBlob);
      setConvertedSizeStr(formatBytes(finalBlob.size));
    }

    drawPreview();
    setConverting(false);
  };

  const downloadConvertedFile = () => {
    if (!convertedBlob) return;
    const link = document.createElement('a');
    const ext: string = convertFormat === 'jpeg' ? 'jpg' : convertFormat;
    link.download = `${filename}_converted.${ext}`;
    link.href = URL.createObjectURL(convertedBlob);
    link.click();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#00f2fe', '#9d4edd', '#ffffff']
    });
  };

  // -------------------------------------------------------------
  // Download file (incorporating filters, bg removal, and DPI metadata)
  // -------------------------------------------------------------
  const downloadEditedImage = async () => {
    if (!image || !previewCanvasRef.current) return;
    
    setCompressing(true);
    
    // Redraw without crop overlay for clean export
    drawPreview(true);
    
    let blob: Blob | null = null;
    
    // Check if user has target compression configured and calculated
    if (compressedBlob) {
      blob = compressedBlob;
    } else {
      // Export canvas directly
      const canvas = previewCanvasRef.current;
      // If original is PNG, export as PNG. If transparent background remover is active, force PNG to preserve transparency.
      const mime = (bgRemovalActive || originalFileType === 'image/png') ? 'image/png' : 'image/jpeg';
      blob = await new Promise((res) => canvas.toBlob(res, mime, 0.95));
    }
    
    if (blob) {
      // Inject selected DPI
      let finalBlob = blob;
      const actualType = blob.type;
      
      if (actualType === 'image/png') {
        finalBlob = await injectPngDpi(blob, dpi);
      } else if (actualType === 'image/jpeg') {
        finalBlob = await injectJpegDpi(blob, dpi);
      }
      
      const link = document.createElement('a');
      const ext = actualType === 'image/png' ? 'png' : 'jpg';
      link.download = `${filename}.${ext}`;
      link.href = URL.createObjectURL(finalBlob);
      link.click();
      
      // Visual celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#00f2fe', '#9d4edd', '#ffffff']
      });
    }
    
    // Restore crop overlay rendering
    drawPreview();
    setCompressing(false);
  };

  // -------------------------------------------------------------
  // Crop Tool Handlers
  // -------------------------------------------------------------
  const applyAspectPreset = (aspect: 'free' | '1:1' | '16:9' | '4:3' | '3:2') => {
    setCropAspect(aspect);
    if (aspect === 'free') return;
    
    let ratio = 1;
    if (aspect === '1:1') ratio = 1;
    else if (aspect === '16:9') ratio = 16 / 9;
    else if (aspect === '4:3') ratio = 4 / 3;
    else if (aspect === '3:2') ratio = 3 / 2;
    
    let newWidth = imageSize.width;
    let newHeight = Math.round(newWidth / ratio);
    
    if (newHeight > imageSize.height) {
      newHeight = imageSize.height;
      newWidth = Math.round(newHeight * ratio);
    }
    
    const newX = Math.max(0, Math.round((imageSize.width - newWidth) / 2));
    const newY = Math.max(0, Math.round((imageSize.height - newHeight) / 2));
    
    setCropX(newX);
    setCropY(newY);
    setCropWidth(newWidth);
    setCropHeight(newHeight);
  };

  const handleCropXChange = (val: number) => {
    const maxVal = imageSize.width - cropWidth;
    const newX = Math.min(Math.max(0, val), maxVal);
    setCropX(newX);
  };

  const handleCropYChange = (val: number) => {
    const maxVal = imageSize.height - cropHeight;
    const newY = Math.min(Math.max(0, val), maxVal);
    setCropY(newY);
  };

  const handleCropWidthChange = (val: number) => {
    const maxWidth = imageSize.width - cropX;
    let newW = Math.min(Math.max(10, val), maxWidth);
    
    if (cropAspect !== 'free') {
      let ratio = 1;
      if (cropAspect === '1:1') ratio = 1;
      else if (cropAspect === '16:9') ratio = 16 / 9;
      else if (cropAspect === '4:3') ratio = 4 / 3;
      else if (cropAspect === '3:2') ratio = 3 / 2;
      
      let newH = Math.round(newW / ratio);
      if (newH > imageSize.height - cropY) {
        newH = imageSize.height - cropY;
        newW = Math.round(newH * ratio);
      }
      setCropWidth(newW);
      setCropHeight(newH);
    } else {
      setCropWidth(newW);
    }
  };

  const handleCropHeightChange = (val: number) => {
    const maxHeight = imageSize.height - cropY;
    let newH = Math.min(Math.max(10, val), maxHeight);
    
    if (cropAspect !== 'free') {
      let ratio = 1;
      if (cropAspect === '1:1') ratio = 1;
      else if (cropAspect === '16:9') ratio = 16 / 9;
      else if (cropAspect === '4:3') ratio = 4 / 3;
      else if (cropAspect === '3:2') ratio = 3 / 2;
      
      let newW = Math.round(newH * ratio);
      if (newW > imageSize.width - cropX) {
        newW = imageSize.width - cropX;
        newH = Math.round(newW / ratio);
      }
      setCropWidth(newW);
      setCropHeight(newH);
    } else {
      setCropHeight(newH);
    }
  };

  const applyCropSelection = () => {
    if (!image || !imageRef.current) return;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const ctx = cropCanvas.getContext('2d');
    
    if (ctx) {
      // Draw the cropped portion of the image at natural dimensions
      ctx.drawImage(
        imageRef.current,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
      
      const croppedDataUrl = cropCanvas.toDataURL(originalFileType);
      setImage(croppedDataUrl);
      
      // Update image sizes and reset crop coordinates
      setImageSize({ width: cropWidth, height: cropHeight });
      setResizeWidth(cropWidth);
      setResizeHeight(cropHeight);
      setOriginalRatio(cropWidth / cropHeight);
      
      setCropX(0);
      setCropY(0);
      setCropWidth(cropWidth);
      setCropHeight(cropHeight);
      
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#00f2fe', '#ffffff']
      });
    }
  };

  const resetToOriginalImage = () => {
    if (originalImage) {
      setImage(originalImage);
      setImageSize(originalImageSize);
      setResizeWidth(originalImageSize.width);
      setResizeHeight(originalImageSize.height);
      setOriginalRatio(originalImageSize.width / originalImageSize.height);
      
      setCropX(0);
      setCropY(0);
      setCropWidth(originalImageSize.width);
      setCropHeight(originalImageSize.height);
      setCropAspect('free');
      
      confetti({
        particleCount: 20,
        spread: 30,
        origin: { y: 0.8 },
        colors: ['#ef4444', '#ffffff']
      });
    }
  };

  // -------------------------------------------------------------
  // Final Preview Modal Utilities
  // -------------------------------------------------------------
  const openFinalPreviewModal = () => {
    if (!previewCanvasRef.current) return;
    
    // Draw canvas without the crop overlay
    drawPreview(true);
    
    const canvas = previewCanvasRef.current;
    const mime = (bgRemovalActive || originalFileType === 'image/png') ? 'image/png' : 'image/jpeg';
    
    // Create snapshot URL for preview
    const dataUrl = canvas.toDataURL(mime);
    setModalImageSrc(dataUrl);
    
    // Calculate final size asynchronously
    canvas.toBlob((blob) => {
      if (blob) {
        setFinalPreviewSize(blob.size);
      }
    }, mime, 0.95);
    
    setShowPreviewModal(true);
  };

  return (
    <div className="container" style={styles.editorContainer}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {!image ? (
        /* Upload Area */
        <div 
          onClick={triggerUpload} 
          className="glass-card image-upload-area"
        >
          <div style={styles.uploadGlow}></div>
          <div style={styles.uploadBox}>
            <div style={styles.uploadIconWrapper}>
              <Upload size={32} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 style={styles.uploadTitle}>Upload an Image</h2>
            <p style={styles.uploadSubtitle}>
              Drag and drop your image here, or browse local files.<br />
              Supports PNG, JPG, WEBP formats. Runs completely in-browser.
            </p>
            <button className="btn-primary" style={{ marginTop: '8px' }}>
              Select File
            </button>
          </div>
        </div>
      ) : (
        /* Active Workspace */
        <div className="image-editor-workspace" style={styles.workspaceGrid}>
          {/* Preview Panel */}
          <div className="glass-card image-preview-panel" style={styles.previewPanel}>
            <div style={styles.previewHeader}>
              <span style={styles.fileTitle}>
                <ImageIcon size={16} style={{ color: 'var(--primary)' }} /> 
                {filename}.{bgRemovalActive || originalFileType === 'image/png' ? 'png' : 'jpg'}
              </span>
              
              {/* Image Information Grid */}
              <div style={styles.metaInfoGrid}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Resolution</span>
                  <span style={styles.metaValue}>{imageSize.width} × {imageSize.height} px</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Original Size</span>
                  <span style={styles.metaValue}>{fileSizeStr}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Density</span>
                  <span style={styles.metaValue}>{dpi} DPI</span>
                </div>
              </div>
            </div>
            
            <div style={styles.imageViewport}>
              <img
                ref={imageRef}
                src={image}
                onLoad={handleImageLoad}
                style={{ display: 'none' }}
                alt="Source hidden loading"
              />
              
              <canvas
                ref={previewCanvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  cursor: eyeDropperActive ? 'crosshair' : 'default',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  borderRadius: '6px',
                }}
              />
            </div>
            
            <div style={styles.previewFooter}>
              <button className="btn-secondary" onClick={resetFilters} style={styles.resetBtn} title="Reset all edits">
                <RefreshCw size={14} /> Reset
              </button>
              <button 
                className="btn-secondary" 
                onClick={openFinalPreviewModal} 
                style={{ ...styles.resetBtn, color: 'var(--primary)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                disabled={compressing}
              >
                <Sparkles size={14} /> Final Preview
              </button>
              <button className="btn-primary" onClick={downloadEditedImage} disabled={compressing}>
                <Download size={14} /> Save / Download
              </button>
            </div>
          </div>

          {/* Adjustments Sidebar */}
          <div className="glass-card" style={styles.sidebar}>
            {/* Categories tab container */}
            <div className="editor-tabs-container">
              <a 
                href="/tools/image-editor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-editor'); setActiveTab('adjust'); setEyeDropperActive(false); }} 
                className={`editor-tab-btn ${activeTab === 'adjust' ? 'active' : ''}`}
              >
                Filters
              </a>
              <a 
                href="/tools/image-editor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-editor'); setActiveTab('crop'); setEyeDropperActive(false); }} 
                className={`editor-tab-btn ${activeTab === 'crop' ? 'active' : ''}`}
              >
                Crop
              </a>
              <a 
                href="/tools/image-editor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-editor'); setActiveTab('resize'); setEyeDropperActive(false); }} 
                className={`editor-tab-btn ${activeTab === 'resize' ? 'active' : ''}`}
              >
                Resize
              </a>
              <a 
                href="/tools/image-editor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-editor'); setActiveTab('dpi'); setEyeDropperActive(false); }} 
                className={`editor-tab-btn ${activeTab === 'dpi' ? 'active' : ''}`}
              >
                DPI
              </a>
              <a 
                href="/tools/image-compressor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-compressor'); setEyeDropperActive(false); }} 
                className={`editor-tab-btn ${activeTab === 'compress' ? 'active' : ''}`}
              >
                Compress
              </a>
              <a 
                href="/tools/image-editor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-editor'); setActiveTab('bg-remove'); }} 
                className={`editor-tab-btn ${activeTab === 'bg-remove' ? 'active' : ''}`}
              >
                Remove BG
              </a>
              <a 
                href="/tools/image-editor"
                onClick={(e) => { e.preventDefault(); navigate('/tools/image-editor'); setActiveTab('convert'); setEyeDropperActive(false); }} 
                className={`editor-tab-btn ${activeTab === 'convert' ? 'active' : ''}`}
              >
                Convert
              </a>
            </div>

            {/* TAB CONTENT: FILTERS */}
            {activeTab === 'adjust' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <Sliders size={15} style={{ color: 'var(--primary)' }} />
                  <span>Adjustments</span>
                </h3>
                
                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>

                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>

                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Saturation</span>
                    <span>{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>

                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Hue Rotation</span>
                    <span>{hueRotate}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hueRotate}
                    onChange={(e) => setHueRotate(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>

                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Grayscale</span>
                    <span>{grayscale}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={grayscale}
                    onChange={(e) => setGrayscale(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>

                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Blur Radius</span>
                    <span>{blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>

                <h3 style={{ ...styles.sectionHeader, marginTop: '16px' }}>
                  <RotateCw size={15} style={{ color: 'var(--secondary)' }} />
                  <span>Transforms</span>
                </h3>
                <div style={styles.transformButtons}>
                  <button
                    style={styles.actionButton}
                    onClick={() => setRotate((prev) => (prev - 90 + 360) % 360)}
                    title="Rotate Left"
                  >
                    ↺ -90°
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={() => setRotate((prev) => (prev + 90) % 360)}
                    title="Rotate Right"
                  >
                    ↻ +90°
                  </button>
                  <button
                    style={{
                      ...styles.actionButton,
                      color: flipH ? 'var(--primary)' : 'var(--text-primary)',
                      background: flipH ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.02)'
                    }}
                    onClick={() => setFlipH(!flipH)}
                    title="Flip Horizontal"
                  >
                    Flip ↔
                  </button>
                  <button
                    style={{
                      ...styles.actionButton,
                      color: flipV ? 'var(--primary)' : 'var(--text-primary)',
                      background: flipV ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.02)'
                    }}
                    onClick={() => setFlipV(!flipV)}
                    title="Flip Vertical"
                  >
                    Flip ↕
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CROP */}
            {activeTab === 'crop' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <RotateCw size={15} style={{ color: 'var(--primary)' }} />
                  <span>Interactive Cropping</span>
                </h3>
                <p style={styles.tabText}>
                  Select an aspect ratio preset or adjust the coordinate boundaries to crop your image canvas.
                </p>

                {/* Aspect Ratio Presets */}
                <div style={{ marginBottom: '10px' }}>
                  <span style={styles.inputHelp}>Aspect Ratio Presets</span>
                  <div style={styles.aspectBtnGrid}>
                    {(['free', '1:1', '16:9', '4:3', '3:2'] as const).map((aspect) => (
                      <button
                        key={aspect}
                        onClick={() => applyAspectPreset(aspect)}
                        style={{
                          ...styles.aspectBtn,
                          ...(cropAspect === aspect ? styles.aspectBtnActive : {})
                        }}
                      >
                        {aspect === 'free' ? 'Free' : aspect}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crop Coordinates */}
                <div style={styles.resizeInputs}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.inputHelp}>X (px)</span>
                    <input
                      type="number"
                      min="0"
                      max={imageSize.width - cropWidth}
                      value={cropX}
                      onChange={(e) => handleCropXChange(Number(e.target.value))}
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.inputHelp}>Y (px)</span>
                    <input
                      type="number"
                      min="0"
                      max={imageSize.height - cropHeight}
                      value={cropY}
                      onChange={(e) => handleCropYChange(Number(e.target.value))}
                      style={styles.numberInput}
                    />
                  </div>
                </div>

                <div style={styles.resizeInputs}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.inputHelp}>Width (px)</span>
                    <input
                      type="number"
                      min="10"
                      max={imageSize.width - cropX}
                      value={cropWidth}
                      onChange={(e) => handleCropWidthChange(Number(e.target.value))}
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.inputHelp}>Height (px)</span>
                    <input
                      type="number"
                      min="10"
                      max={imageSize.height - cropY}
                      value={cropHeight}
                      onChange={(e) => handleCropHeightChange(Number(e.target.value))}
                      style={styles.numberInput}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={resetToOriginalImage}
                    style={{ flex: 1, padding: '10px 0', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                  >
                    Reset Original
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={applyCropSelection}
                    style={{ flex: 1, padding: '10px 0', fontSize: '0.8rem' }}
                  >
                    Apply Crop
                  </button>
                </div>

                <div style={styles.infoCard}>
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                    💡 Cropping is non-destructive until you save. Click **Reset Original** at any time to recover the full original image.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: RESIZE */}
            {activeTab === 'resize' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                  <span>Dimensions Resizer</span>
                </h3>
                
                {/* Unit Selector */}
                <div style={{ marginBottom: '14px' }}>
                  <span style={styles.inputHelp}>Target Resizing Unit</span>
                  <div style={styles.unitButtonGroup}>
                    <button 
                      onClick={() => setResizeUnit('px')} 
                      style={{...styles.unitBtn, ...(resizeUnit === 'px' ? styles.unitBtnActive : {})}}
                    >
                      Pixels (px)
                    </button>
                    <button 
                      onClick={() => setResizeUnit('cm')} 
                      style={{...styles.unitBtn, ...(resizeUnit === 'cm' ? styles.unitBtnActive : {})}}
                    >
                      cm
                    </button>
                    <button 
                      onClick={() => setResizeUnit('inches')} 
                      style={{...styles.unitBtn, ...(resizeUnit === 'inches' ? styles.unitBtnActive : {})}}
                    >
                      Inches (in)
                    </button>
                  </div>
                </div>

                <div style={styles.resizeInputs}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.inputHelp}>Width ({resizeUnit})</span>
                    <input
                      type="number"
                      step={resizeUnit === 'px' ? '1' : '0.01'}
                      value={getDisplayWidth()}
                      onChange={(e) => handleDisplayWidthChange(Number(e.target.value))}
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.inputHelp}>Height ({resizeUnit})</span>
                    <input
                      type="number"
                      step={resizeUnit === 'px' ? '1' : '0.01'}
                      value={getDisplayHeight()}
                      onChange={(e) => handleDisplayHeightChange(Number(e.target.value))}
                      style={styles.numberInput}
                    />
                  </div>
                </div>

                <label style={{ ...styles.checkboxLabel, marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={maintainRatio}
                    onChange={(e) => {
                      setMaintainRatio(e.target.checked);
                      if (e.target.checked && imageRef.current) {
                        setResizeHeight(Math.round(resizeWidth / originalRatio));
                      }
                    }}
                    style={styles.checkbox}
                  />
                  <span>Maintain Aspect Ratio</span>
                </label>

                <div style={styles.infoCard}>
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                    💡 <strong>Physical Conversion:</strong> Scaling dimensions in inches/cm is relative to your image density setting (<strong>{dpi} DPI</strong>). Higher DPI values decrease the physical print size for the same pixel density.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DPI CONTROL */}
            {activeTab === 'dpi' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <Activity size={15} style={{ color: 'var(--secondary)' }} />
                  <span>DPI Settings</span>
                </h3>
                <p style={styles.tabText}>
                  Adjust target printing/layout density. This updates the physical dimensions metadata without resizing the pixels.
                </p>

                <div style={styles.controlGroup}>
                  <div style={styles.labelRow}>
                    <span>Current DPI Density</span>
                    <span>{originalDpi} DPI</span>
                  </div>
                  <span style={styles.inputHelp}>Target Density (Dots Per Inch)</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={dpi}
                      onChange={(e) => setDpi(Math.max(1, Math.round(Number(e.target.value))))}
                      style={styles.numberInput}
                    />
                    <button 
                      className="btn-secondary" 
                      onClick={() => setDpi(originalDpi)}
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={styles.dpiPresetsGrid}>
                  <button onClick={() => setDpi(72)} style={styles.presetBtn}>72 DPI (Web)</button>
                  <button onClick={() => setDpi(96)} style={styles.presetBtn}>96 DPI (Screen)</button>
                  <button onClick={() => setDpi(150)} style={styles.presetBtn}>150 DPI (Print)</button>
                  <button onClick={() => setDpi(300)} style={styles.presetBtn}>300 DPI (High-Res)</button>
                </div>

                <div style={styles.infoCard}>
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                    🎯 **Print Standards:** 300 DPI is the standard for high-definition physical print formats (documents, cards, posters).
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FILE COMPRESSION */}
            {activeTab === 'compress' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                  <span>Target File Size Limit</span>
                </h3>
                <p style={styles.tabText}>
                  Automatically optimize parameters to compress or inflate the image to fit your target file size constraints.
                </p>

                <div style={styles.controlGroup}>
                  <span style={styles.inputHelp}>Target File Size (KB)</span>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="number"
                      value={targetSizeKB}
                      onChange={(e) => {
                        setTargetSizeKB(Math.max(1, Number(e.target.value)));
                        setCompressedBlob(null);
                        setCompressedSizeStr('');
                      }}
                      style={styles.numberInput}
                    />
                    <button 
                      className="btn-primary" 
                      onClick={handleApplyCompression}
                      disabled={compressing}
                      style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      {compressing ? 'Calculating...' : 'Optimize Size'}
                    </button>
                  </div>

                  {compressedSizeStr ? (
                    <div style={styles.successBox}>
                      <strong>Result:</strong> Compiled to {compressedSizeStr}! Ready for download.
                    </div>
                  ) : (
                    <div style={styles.infoCard}>
                      <span style={{ fontSize: '0.8rem' }}>
                        Original File size: <strong>{fileSizeStr}</strong>. Enter target size and click <strong>Optimize Size</strong>.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: BACKGROUND REMOVAL */}
            {activeTab === 'bg-remove' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <Sliders size={15} style={{ color: 'var(--primary)' }} />
                  <span>Color-Key BG Remover</span>
                </h3>
                <p style={styles.tabText}>
                  Remove solid color backgrounds instantly. Choose a color, adjust tolerance, and key out the background.
                </p>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={bgRemovalActive}
                    onChange={(e) => setBgRemovalActive(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <strong>Enable BG Transparentizer</strong>
                </label>

                {bgRemovalActive && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Eyedropper & Color selector row */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={rgbToHex(bgColorToRemove.r, bgColorToRemove.g, bgColorToRemove.b)}
                        onChange={(e) => setBgColorToRemove(hexToRgb(e.target.value))}
                        style={styles.colorPicker}
                      />
                      
                      <button
                        onClick={() => setEyeDropperActive(!eyeDropperActive)}
                        style={{
                          ...styles.dropperBtn,
                          backgroundColor: eyeDropperActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                          borderColor: eyeDropperActive ? 'var(--primary)' : 'var(--border-glass)',
                          color: eyeDropperActive ? 'var(--primary)' : 'var(--text-primary)'
                        }}
                        title="Sample color from image"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                          <path d="m2 22 1-1c.6-.6 1.5-.6 2.1 0l.9.9c.6.6.6 1.5 0 2.1l-1 1H2v-3Z"/>
                          <path d="M6 18 18 6"/>
                          <path d="m14 2 8 8"/>
                          <path d="m18 10-6-6"/>
                        </svg>
                        {eyeDropperActive ? 'Click Image...' : 'Eye Dropper'}
                      </button>
                    </div>

                    {/* Presets */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setBgColorToRemove({ r: 255, g: 255, b: 255 })}
                        style={styles.smallPresetBtn}
                      >
                        Preset White
                      </button>
                      <button 
                        onClick={() => setBgColorToRemove({ r: 0, g: 0, b: 0 })}
                        style={styles.smallPresetBtn}
                      >
                        Preset Black
                      </button>
                    </div>

                    {/* Color display text */}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Selected Color: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        RGB({bgColorToRemove.r}, {bgColorToRemove.g}, {bgColorToRemove.b})
                      </strong>
                    </span>

                    {/* Tolerance slider */}
                    <div style={styles.controlGroup}>
                      <div style={styles.labelRow}>
                        <span>Color Tolerance</span>
                        <span>{bgTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={bgTolerance}
                        onChange={(e) => setBgTolerance(Number(e.target.value))}
                        style={styles.rangeInput}
                      />
                    </div>

                    {/* Feathering slider */}
                    <div style={styles.controlGroup}>
                      <div style={styles.labelRow}>
                        <span>Feather Edges</span>
                        <span>{bgFeather}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={bgFeather}
                        onChange={(e) => setBgFeather(Number(e.target.value))}
                        style={styles.rangeInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CONVERT FORMAT */}
            {activeTab === 'convert' && (
              <div style={styles.tabContent}>
                <h3 style={styles.sectionHeader}>
                  <RefreshCw size={15} style={{ color: 'var(--primary)' }} />
                  <span>Convert Format</span>
                </h3>
                <p style={styles.tabText}>
                  Convert this image to other formats client-side without uploading to any server.
                </p>

                <div style={styles.controlGroup}>
                  <span style={styles.inputHelp}>Target Format</span>
                  <select
                    value={convertFormat}
                    onChange={(e) => {
                      setConvertFormat(e.target.value as any);
                      setConvertedBlob(null);
                      setConvertedSizeStr('');
                    }}
                    style={styles.selectInput}
                  >
                    <option value="png">PNG (.png)</option>
                    <option value="jpeg">JPEG (.jpg)</option>
                    <option value="webp">WEBP (.webp)</option>
                    <option value="bmp">BMP (.bmp)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>

                  {(convertFormat === 'jpeg' || convertFormat === 'webp') && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={styles.inputHelp}>Quality Factor</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{convertQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={convertQuality}
                        onChange={(e) => {
                          setConvertQuality(Number(e.target.value));
                          setConvertedBlob(null);
                          setConvertedSizeStr('');
                        }}
                        style={styles.rangeInput}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button 
                      className="btn-primary" 
                      onClick={handleConvertFormat}
                      disabled={converting}
                      style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap', width: '100%' }}
                    >
                      {converting ? 'Converting...' : 'Convert Image'}
                    </button>
                  </div>

                  {convertedSizeStr ? (
                    <div style={{ marginTop: '12px' }}>
                      <div style={styles.successBox}>
                        <strong>Result:</strong> Ready as {convertFormat.toUpperCase()} ({convertedSizeStr})
                      </div>
                      <button
                        className="btn-primary"
                        onClick={downloadConvertedFile}
                        style={{ marginTop: '10px', padding: '10px 16px', width: '100%', backgroundColor: '#10b981', borderColor: '#10b981' }}
                      >
                        <Download size={14} style={{ marginRight: '6px' }} /> Download Converted File
                      </button>
                    </div>
                  ) : (
                    <div style={styles.infoCard}>
                      <span style={{ fontSize: '0.8rem' }}>
                        Click <strong>Convert Image</strong> to build the target format before download.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sidebar Section: Upload Another */}
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button 
                onClick={() => {
                  setImage(null);
                  resetFilters();
                }} 
                style={styles.newFileBtn}
              >
                Upload New Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Scrollable FAQ Box (Over 1700 Words for SEO) */}
      <div style={styles.seoContentSection}>
        <hr style={styles.seoDivider} />
        <h2 style={styles.seoSectionTitle}>Quantum Image Studio — User Guides & FAQ</h2>
        <p style={styles.seoSectionDesc}>
          Get answers to frequently asked questions about our client-side image editor, free image compressor, format converter, and DPI tag tools.
        </p>
        <div className="faq-scroll-wrapper">
          <div className="faq-scroll-box" style={styles.faqGrid}>
            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>1. How does the client-side free image compressor on Quantum Qbit optimize JPEG, PNG, and WebP files?</h4>
              <p style={styles.faqAnswer}>
                Our client-side <strong>free image compressor</strong> utilizes modern HTML5 Canvas APIs and client-side processing libraries to compress JPEG, PNG, and WebP images directly within your browser. When you upload an image to Quantum Qbit, it is loaded into your local memory space. For lossy formats like JPEG and WebP, the compressor applies a discrete cosine transform (DCT) algorithm to simplify color details that are less noticeable to the human eye, thereby reducing the bytes needed to store the image. If you are trying to <strong>compress jpeg</strong> images, our tool adjusts the quantization tables on the fly based on your desired quality selector. For lossless formats like PNG, the tool utilizes canvas rendering and color palette reductions (quantization) to strip out redundant metadata chunks (like EXIF data, color profiles, and software markers) that inflate the file size. By performing all these operations on your machine's CPU threads, you bypass the latency of uploading raw high-resolution files to a web server. This client-side execution makes our <strong>online photo compressor</strong> extremely fast and secure, delivering optimized, compressed images in a fraction of a second without compromising the structural integrity of your original graphics.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>2. How can I compress image to 100kb or compress image to 200kb using the online photo compressor?</h4>
              <p style={styles.faqAnswer}>
                Many online web forms, government application portals, and email services enforce strict upload limit thresholds, requiring users to submit files below 100KB or 200KB. To meet these exact requirements, our <strong>online photo compressor</strong> features a smart target-size compression mode. To <strong>compress image to 100kb</strong> or <strong>compress image to 200kb</strong>, simply upload your file, select the 'Target File Size Limit' tab in the options panel, and input your desired file size in Kilobytes (e.g., 100 or 200). The compressor's internal algorithm runs an iterative binary search loop inside your browser. In each iteration, it adjusts the canvas dimensions (resolution scale) and quality compression factors, then measures the resulting blob size. If the resulting size exceeds the target, it recalibrates the variables and tries again, repeating this process up to 10 times in milliseconds until it finds the optimal combination that yields a file just under your specified KB target. This guarantees that your output image will fit the required limit perfectly, without you having to manually guess quality percentages or scale down dimensions over and over.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>3. What is a 300 DPI converter, and how do I change DPI of image online without losing quality?</h4>
              <p style={styles.faqAnswer}>
                DPI, or Dots Per Inch, is a metadata tag embedded in image headers that tells printing devices how many pixels to distribute per inch of paper. Standard web images default to 72 DPI or 96 DPI, but professional printing houses, academic journals, and passport applications usually require a 300 DPI layout. If you need a <strong>300 dpi converter</strong>, our tool allows you to <strong>change dpi of image online</strong> easily. Unlike other online converters that re-sample and stretch the pixels of your image (which leads to blurry edges, interpolation artifacts, and loss of visual fidelity), our tool changes the DPI strictly by rewriting the metadata headers of the file. For JPEG files, we modify the JFIF APP0 marker segment bytes 10-14. For PNG files, we write or modify the physical pixel dimensions (<code>pHYs</code>) chunk. This means the underlying pixel grid remains untouched, preserving 100% of the original photo quality, while the print size configuration tag is updated to 300 DPI. When you print the output, the printer reads the updated header and outputs a crisp, high-density print.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>4. How does the feature to remove background from image free work without cloud uploads?</h4>
              <p style={styles.faqAnswer}>
                Traditional background removal websites upload your private photos to their servers, where resource-heavy machine learning models process the files. This exposes your private content to external databases and often comes with hidden subscription costs. Quantum Qbit provides a way to <strong>remove background from image free</strong> of charge, operating entirely client-side. Our tool loads your image onto a temporary, off-screen HTML5 canvas element. When you activate the background remover and choose a color using the color picker or eye-dropper tool, the software parses the pixel array (<code>ImageData.data</code>) of the canvas. It evaluates the Red, Green, Blue, and Alpha (RGBA) channels of each pixel, calculating the color distance relative to your selected key color. With adjustable tolerance and feathering sliders, you can fine-tune how close a pixel's color must be to the selected target to be made transparent, and how smoothly the edges should blend. The pixels matching the criteria are instantly set to an alpha value of zero. Because this color-keying shader logic runs in your browser's Javascript runtime, your files never leave your device, ensuring maximum privacy.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>5. Can I use the WebP converter to transform images between PNG, JPEG, WEBP, and BMP formats?</h4>
              <p style={styles.faqAnswer}>
                Yes, Quantum Qbit functions as an all-in-one image converter and <strong>webp converter</strong>. WebP is a modern image format developed by Google that provides superior lossless and lossy compression for web images, often rendering files 26% smaller than PNGs and 30% smaller than JPEGs. Converting your assets to WebP is highly recommended for site performance. To convert files, upload any image, navigate to the conversion section in the sidebar, choose your target format—whether it's JPEG, PNG, WEBP, BMP, or even compiling the image into a PDF page—and adjust the quality factor if applicable. When you click the convert button, the browser reads the canvas pixel grid and exports the data using the native <code>canvas.toBlob()</code> method configured to the target MIME type. For BMP conversion, we run a custom binary encoder that packages the raw pixel buffer into standard Microsoft BMP file structures on the fly. This client-side pipeline ensures that you can format files for any application without depending on server APIs or queue wait times.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>6. Why is a client-side image editor and studio safer than traditional cloud-based photo editors?</h4>
              <p style={styles.faqAnswer}>
                Most online editing platforms act as middlemen: they force you to upload your files to their cloud servers, process the edits on their hardware, and send the finished file back down. This workflow presents major security risks, especially if you are working with personal ID documents, proprietary designs, or sensitive corporate screenshots. If their servers are hacked, or if they sell user data, your personal files could be compromised. Quantum Qbit's <strong>image studio online</strong> operates under a strict privacy-first model: all calculations, filter applications, canvas clipping, and file compression take place inside your browser's sandboxed local memory. Your images are never transmitted over the internet to any external server. Since there is no database storing your files, they can never be leaked, scraped by AI training programs, or accessed by third-party tracking scripts. In fact, once the web application loads in your tab, you can completely disconnect your internet, turn on airplane mode, and continue editing, cropping, resizing, and converting images offline.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>7. How do I crop and resize images while maintaining the aspect ratio?</h4>
              <p style={styles.faqAnswer}>
                Resizing and cropping are essential steps to make images fit social media headers, blog thumbnails, or print templates. In our Image Studio, cropping is handled using an interactive drag-and-drop bounding box overlay. You can drag the corners of the box to select your crop region, and click the crop button to draw only that bounding region onto a new canvas, shedding unwanted border pixels. For resizing, we offer both pixel dimension controls and percentage scaling. To resize while maintaining the original aspect ratio, simply check the 'Lock Aspect Ratio' checkbox. When locked, changing the width input will automatically calculate and update the corresponding height input based on the image's original ratio (width divided by height). This prevents the image from looking stretched or squished. The browser uses bilinear or bicubic interpolation algorithms during canvas rendering to smoothly downscale or upscale the pixels, ensuring that your resized image remains clean and readable.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>8. What are the best practices for optimizing web images to rank higher on Google Search?</h4>
              <p style={styles.faqAnswer}>
                To rank higher in Google Image Search and improve your website's overall SEO ranking, you must optimize your page speed and image metadata. First, compress all images using a <strong>free image compressor</strong> to reduce file sizes; faster page load times directly boost your mobile SEO scores. Second, convert images to modern formats like WebP or AVIF using a <strong>webp converter</strong> to maximize bytes saved. Third, always write descriptive alt text in your HTML, incorporating your primary keywords naturally. Fourth, ensure that the image filename itself is descriptive (e.g. <code>blue-nike-running-shoes.webp</code> instead of <code>IMG_48291.jpg</code>). Fifth, use clean canonical markup and schema metadata, such as JSON-LD FAQPage structures, to help indexers understand the context around your images. Finally, ensure your images are responsive, using <code>srcset</code> to serve smaller sizes to mobile devices, preventing unnecessary bandwidth waste. Quantum Qbit implements these optimizations out of the box, allowing you to generate search-optimized, high-performance web assets easily.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>9. Is there any file size or resolution limit for processing images locally in my browser?</h4>
              <p style={styles.faqAnswer}>
                Because our image tools operate entirely in the client-side browser thread, the processing capability is bound by the hardware resources of your local device (such as CPU speed and available RAM) and the browser's memory allocation limits. Generally, modern browsers on desktop computers can comfortably process images up to 50 Megabytes in file size or 10,000 x 10,000 pixels in resolution. When handling massive digital camera raw files or ultra-high-resolution panoramas, the canvas element might reach memory limit constraints defined by the browser sandbox, which can cause the tab to crash. If you experience performance lag, we recommend downscaling the image scale percentage early in the workflow, or using a dedicated offline application for file sizes larger than 100MB. For 99% of web graphics, standard photos, and documents, Quantum Qbit offers a fluid, instant, and lag-free editing experience.
              </p>
            </div>

            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>10. How do I apply visual filters and color adjustments to multiple images at once?</h4>
              <p style={styles.faqAnswer}>
                Applying visual filters such as brightness, contrast, saturation, gray, hue-rotate, and blur is a popular requirement for content creators who need to maintain a unified visual style across their channels. On Quantum Qbit, you can easily load an image and adjust its sliders under the 'Adjustments' panel. The tool renders these changes in real-time on your canvas using hardware-accelerated CSS filter matrices, allowing you to immediately download the results. If you need to apply the same configurations to a batch of photos, you can keep the slider settings as they are, click the upload button to select a new image file, and the application will instantly apply your active parameters (such as 120% brightness and 15% blur) to the new photo. This pseudo-batch configuration saves you from having to dial in the settings repeatedly for each file. This represents a huge productivity boost for photographers, social media managers, and developers who need to produce consistent visual elements quickly and free of charge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final Preview Modal */}
      {showPreviewModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPreviewModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <Sparkles size={18} style={{ color: 'var(--primary)', marginRight: '6px' }} />
                <span>Final Processing & Preview</span>
              </h3>
              <button 
                style={styles.closeBtn} 
                onClick={() => setShowPreviewModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <div className="image-editor-modal-body" style={styles.modalBody}>
              {/* Left Panel: Processed Preview */}
              <div style={styles.modalLeftPanel}>
                <span style={styles.inputHelp}>Rendered Output Snapshot</span>
                <div style={styles.modalPreviewViewport}>
                  <img 
                    src={modalImageSrc} 
                    alt="Final Render Preview" 
                    style={styles.modalPreviewImage} 
                  />
                </div>
              </div>
              
              {/* Right Panel: Metadata & Active Changes */}
              <div style={styles.modalRightPanel}>
                <h4 style={styles.modalSubheading}>Metadata Comparison</h4>
                <div className="responsive-table-wrapper" style={styles.tableWrapper}>
                  <table style={styles.comparisonTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Property</th>
                        <th style={styles.tableHeader}>Original Input</th>
                        <th style={styles.tableHeader}>Processed Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={styles.tableCell}>Resolution</td>
                        <td style={styles.tableCell} className="mono">{originalImageSize.width} &times; {originalImageSize.height} px</td>
                        <td style={styles.tableCell} className="mono">{imageSize.width} &times; {imageSize.height} px</td>
                      </tr>
                      <tr>
                        <td style={styles.tableCell}>File Size</td>
                        <td style={styles.tableCell} className="mono">{fileSizeStr}</td>
                        <td style={{ ...styles.tableCell, color: 'var(--primary)', fontWeight: 600 }} className="mono">
                          {formatBytes(finalPreviewSize)}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.tableCell}>DPI Density</td>
                        <td style={styles.tableCell} className="mono">{originalDpi} DPI</td>
                        <td style={styles.tableCell} className="mono">{dpi} DPI</td>
                      </tr>
                      <tr>
                        <td style={styles.tableCell}>File Type</td>
                        <td style={styles.tableCell} className="mono">{originalFileType.split('/')[1]?.toUpperCase() || 'PNG'}</td>
                        <td style={styles.tableCell} className="mono">
                          {bgRemovalActive || originalFileType === 'image/png' ? 'PNG' : 'JPEG'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 style={{ ...styles.modalSubheading, marginTop: '16px' }}>Active Enhancements checklist</h4>
                <div style={styles.activeChangesList}>
                  {/* Filters */}
                  {(brightness !== 100 || contrast !== 100 || saturation !== 100 || grayscale !== 0 || blur !== 0 || hueRotate !== 0) && (
                    <div style={styles.changeTag}>
                      <span>🎨 Filters:</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {brightness !== 100 && ` Brightness(${brightness}%)`}
                        {contrast !== 100 && ` Contrast(${contrast}%)`}
                        {saturation !== 100 && ` Saturation(${saturation}%)`}
                        {grayscale !== 0 && ` Grayscale(${grayscale}%)`}
                        {blur !== 0 && ` Blur(${blur}px)`}
                        {hueRotate !== 0 && ` Hue(${hueRotate}°)`}
                      </span>
                    </div>
                  )}
                  {/* Geometry */}
                  {(rotate !== 0 || flipH || flipV) && (
                    <div style={styles.changeTag}>
                      <span>🔄 Geometry:</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rotate !== 0 && ` Rotated ${rotate}°`}
                        {flipH && ' Flipped Horizontal'}
                        {flipV && ' Flipped Vertical'}
                      </span>
                    </div>
                  )}
                  {/* Crop */}
                  {(image !== originalImage) && (
                    <div style={styles.changeTag}>
                      <span>✂️ Cropped Canvas:</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Dimensions updated to {imageSize.width}x{imageSize.height} px
                      </span>
                    </div>
                  )}
                  {/* BG Removal */}
                  {bgRemovalActive && (
                    <div style={styles.changeTag}>
                      <span>🧼 BG Transparentizer:</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tolerance {bgTolerance}%, Feather {bgFeather}px
                      </span>
                    </div>
                  )}
                  {/* DPI */}
                  {dpi !== originalDpi && (
                    <div style={styles.changeTag}>
                      <span>🎯 Print Density:</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Injected {dpi} DPI tag
                      </span>
                    </div>
                  )}
                  {/* Default tag if no modifications */}
                  {!(brightness !== 100 || contrast !== 100 || saturation !== 100 || grayscale !== 0 || blur !== 0 || hueRotate !== 0 || rotate !== 0 || flipH || flipV || image !== originalImage || bgRemovalActive || dpi !== originalDpi) && (
                    <div style={{ ...styles.changeTag, borderStyle: 'dashed', opacity: 0.7 }}>
                      <span>✔️ No manual adjustments applied</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                className="btn-secondary" 
                onClick={() => setShowPreviewModal(false)}
                style={{ padding: '10px 20px' }}
              >
                Go Back
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  downloadEditedImage();
                  setShowPreviewModal(false);
                }}
                style={{ padding: '10px 24px', backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                <Download size={14} style={{ marginRight: '6px' }} />
                Confirm & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  editorContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  uploadGlow: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(0, 242, 254, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  uploadBox: {
    position: 'relative' as const,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    maxWidth: '450px',
  },
  uploadIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(0, 242, 254, 0.04)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0, 242, 254, 0.1)',
  },
  uploadTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
  },
  uploadSubtitle: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  workspaceGrid: {
  },
  previewPanel: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '14px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  fileTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metaInfoGrid: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    padding: '4px 8px',
    minWidth: '70px',
  },
  metaLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  metaValue: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  },
  imageViewport: {
    flexGrow: 1,
    background: 'rgba(0, 0, 0, 0.25)',
    backgroundImage: `
      linear-gradient(45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.1) 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '16px',
    border: '1px solid var(--border-glass)',
  },
  previewFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '14px',
  },
  resetBtn: {
    fontSize: '0.9rem',
    padding: '10px 18px',
  },
  sidebar: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    minHeight: '630px',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  tabText: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  sectionHeader: {
    fontFamily: 'var(--font-heading)',
    fontSize: '0.9rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '6px',
    marginBottom: '4px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  rangeInput: {
    WebkitAppearance: 'none' as const,
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '3px',
    outline: 'none',
    margin: '6px 0',
  },
  transformButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
  },
  actionButton: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    padding: '8px 10px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'var(--transition-fast)',
  },
  unitButtonGroup: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '3px',
    borderRadius: '6px',
    border: '1px solid var(--border-glass)',
  },
  unitBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    padding: '6px 0',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-body)',
  },
  unitBtnActive: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-primary)',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  resizeInputs: {
    display: 'flex',
    gap: '10px',
  },
  inputHelp: {
    display: 'block',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  numberInput: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'var(--transition-smooth)',
  },
  selectInput: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-heading)',
    outline: 'none',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  checkbox: {
    accentColor: 'var(--primary)',
    cursor: 'pointer',
  },
  infoCard: {
    background: 'rgba(0, 242, 254, 0.02)',
    border: '1px solid rgba(0, 242, 254, 0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '10px',
    color: 'var(--text-secondary)',
  },
  successBox: {
    background: 'rgba(16, 185, 129, 0.04)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.82rem',
    marginTop: '10px',
  },
  dpiPresetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    marginTop: '10px',
  },
  presetBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    padding: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    textAlign: 'center' as const,
  },
  colorPicker: {
    background: 'transparent',
    border: 'none',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 0,
    overflow: 'hidden',
  },
  dropperBtn: {
    flex: 1,
    height: '38px',
    border: '1px solid',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  smallPresetBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    padding: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  newFileBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#ef4444',
    padding: '10px',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  aspectBtnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginTop: '6px',
  },
  aspectBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    padding: '6px 0',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-body)',
    textAlign: 'center' as const,
  },
  aspectBtnActive: {
    background: 'rgba(0, 242, 254, 0.06)',
    color: 'var(--primary)',
    borderColor: 'rgba(0, 242, 254, 0.3)',
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '900px',
    background: 'rgba(18, 18, 18, 0.95)',
    border: '1px solid var(--border-glass-active)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 242, 254, 0.05)',
  },
  modalHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.8rem',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    transition: 'var(--transition-fast)',
  },
  modalBody: {
  },
  modalLeftPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  modalPreviewViewport: {
    background: 'rgba(0, 0, 0, 0.3)',
    backgroundImage: `
      linear-gradient(45deg, rgba(0, 0, 0, 0.15) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(0, 0, 0, 0.15) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.15) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.15) 75%)
    `,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    height: '350px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '12px',
  },
  modalPreviewImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    borderRadius: '4px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  modalRightPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  modalSubheading: {
    margin: '0 0 4px 0',
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
  },
  tableWrapper: {
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  comparisonTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.82rem',
  },
  tableHeader: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '8px 12px',
    textAlign: 'left' as const,
    color: 'var(--text-secondary)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-glass)',
  },
  tableCell: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
  },
  activeChangesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  changeTag: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.82rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    background: 'rgba(0, 0, 0, 0.1)',
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

export default ImageEditor;
