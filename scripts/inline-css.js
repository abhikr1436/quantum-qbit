import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const htmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found at:', htmlPath);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Match stylesheet link tag (handles variations in order of attributes)
const cssLinkRegex = /<link\s+[^>]*rel="stylesheet"[^>]*href="\/assets\/index-([^"]+)\.css"[^>]*\/?>|<link\s+[^>]*href="\/assets\/index-([^"]+)\.css"[^>]*rel="stylesheet"[^>]*\/?>/i;
const match = html.match(cssLinkRegex);

if (match) {
  const hash = match[1] || match[2];
  const cssFilename = `index-${hash}.css`;
  const cssPath = path.join(distDir, 'assets', cssFilename);
  
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Replace the link tag with inline style tag
    html = html.replace(cssLinkRegex, `<style>${cssContent}</style>`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✓ Successfully inlined CSS from ${cssFilename}`);
  } else {
    console.error('ERROR: CSS file not found at:', cssPath);
  }
} else {
  console.log('No matching external CSS link found to inline.');
}
