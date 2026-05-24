<?php
// Parse request URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Default metadata
$title = "Quantum Qbit | Premium Privacy-First Web Tools & Utilities";
$description = "Quantum Qbit is a free, modern suite of client-side web utility tools. Edit images, convert/read PDFs, perform base conversions, and solve math formulas with complete data privacy and sub-second execution speeds.";
$canonicalPath = $path;

// Routing for SEO Meta tags
if (preg_match('#^/tools/image-compressor#', $path) || preg_match('#^/tools/photo-compressor#', $path)) {
    $title = "Easily compress image online free without login | Quantum Qbit";
    $description = "Easily compress images at optimal quality in seconds. Compress JPG, PNG, SVG or GIF with the best quality and compression. Reduce the filesize of your images at once. Upload your file and transform it.";
} elseif (preg_match('#^/tools/pdf-compressor#', $path)) {
    $title = "Easily compress PDF online free without login | Quantum Qbit";
    $description = "Compress PDF files online for free. Choose custom compression ratios or preset quality to reduce PDF file size. Vector preservation. 100% private.";
} elseif (preg_match('#^/tools/image-editor#', $path)) {
    $title = "Free Online Photo Editor - Edit Images Free Without Login | Quantum Qbit";
    $description = "Crop, resize, convert, adjust brightness, rotate, and change DPI of images online. Fast, secure client-side editing. 100% private.";
} elseif (preg_match('#^/tools/images-to-pdf#', $path)) {
    $title = "Convert Images to PDF Online Free - JPG/PNG to PDF | Quantum Qbit";
    $description = "Easily convert JPG, PNG, and WebP images to a single PDF document in seconds. 100% client-side compilation - your images are never sent to a server.";
} elseif (preg_match('#^/tools/convert-to-pdf#', $path)) {
    $title = "Convert Word and PowerPoint to PDF Online Free | Quantum Qbit";
    $description = "Easily convert DOCX, PPTX, TXT, and HTML files into standard vector PDF documents in your browser. Fast, 100% secure, offline conversion tool.";
} elseif (preg_match('#^/tools/pdf-to-word#', $path)) {
    $title = "Free PDF to Word OCR Converter - Extract Text Online | Quantum Qbit";
    $description = "Convert scanned PDF files to editable Word documents using advanced client-side OCR technology. Extract high-accuracy text from images and PDF drafts.";
} elseif (preg_match('#^/tools/math-calculators#', $path)) {
    $title = "Scientific Calculator & Base Converter Online Free | Quantum Qbit";
    $description = "Interactive scientific calculator, real-time Binary/Hex/Octal base converter, and unit converter. Runs 100% locally in your browser.";
} elseif (preg_match('#^/tools#', $path)) {
    $title = "Web Applications & Tools Directory | Quantum Qbit";
    $description = "Browse our collection of free client-side utility applications. Compress images, merge/convert PDFs, and perform base math offline.";
} elseif (preg_match('#^/about#', $path)) {
    $title = "About Our Mission - Privacy-First Web Utilities | Quantum Qbit";
    $description = "Learn about Quantum Qbit's offline-first architecture. All calculation, image resizing, and PDF editing happen 100% in your browser.";
} elseif (preg_match('#^/contact#', $path)) {
    $title = "Contact Us - Quantum Qbit Support";
    $description = "Get in touch with the Quantum Qbit development team. Send suggestions, feature requests, or business inquiries.";
} elseif (preg_match('#^/privacy#', $path)) {
    $title = "Privacy Policy - 100% Client-Side Safe | Quantum Qbit";
    $description = "Read our privacy policy. Since all tools process data locally on your device, your private files never touch a remote server.";
} elseif (preg_match('#^/terms#', $path)) {
    $title = "Terms and Conditions - Quantum Qbit";
    $description = "Terms of service for utilizing the free tools and utility libraries on the Quantum Qbit workspace.";
} elseif (preg_match('#^/blogs/([^/]+)#', $path, $matches)) {
    $blogId = $matches[1];
    $blogFound = false;
    
    // Attempt to load blog metadata from JSON fallback first
    $blogsJsonFile = __DIR__ . '/api/data/blogs.json';
    if (file_exists($blogsJsonFile)) {
        $blogsData = json_decode(file_get_contents($blogsJsonFile), true);
        if (is_array($blogsData)) {
            foreach ($blogsData as $post) {
                if ($post['id'] === $blogId) {
                    $title = $post['title'] . " | Quantum Qbit Blog";
                    $description = $post['excerpt'];
                    $blogFound = true;
                    break;
                }
            }
        }
    }
    
    // If not found in JSON, attempt MySQL query
    if (!$blogFound) {
        $configFile = __DIR__ . '/api/data/config.json';
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true);
            if ($config && !empty($config['db_host']) && !empty($config['db_name']) && !empty($config['db_user'])) {
                try {
                    $dsn = "mysql:host=" . $config['db_host'] . ";dbname=" . $config['db_name'] . ";charset=utf8mb4";
                    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                    $stmt = $pdo->prepare("SELECT title, excerpt FROM blogs WHERE id = :id");
                    $stmt->execute(['id' => $blogId]);
                    $post = $stmt->fetch();
                    if ($post) {
                        $title = $post['title'] . " | Quantum Qbit Blog";
                        $description = $post['excerpt'];
                    }
                } catch (Exception $e) {
                    // Ignore DB error, use default fallback
                }
            }
        }
    }
} elseif (preg_match('#^/blogs#', $path)) {
    $title = "Quantum Qbit Blogs & Articles";
    $description = "Explore blogs and articles on privacy-first web utilities, local browser tools, and client-side technology written by the Quantum Engineering Team.";
}

// Read index.html template
$htmlFile = __DIR__ . '/index.html';
if (file_exists($htmlFile)) {
    $html = file_get_contents($htmlFile);
    
    // Replace Title
    $html = preg_replace('/<title>.*?<\/title>/is', "<title>" . htmlspecialchars($title) . "</title>", $html);
    
    // Replace Description
    $html = preg_replace('/<meta\s+name="description"\s+content=".*?"\s*\/?>/is', '<meta name="description" content="' . htmlspecialchars($description) . '" />', $html);
    
    // Replace Open Graph Title & Description
    if (preg_match('/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is', $html)) {
        $html = preg_replace('/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is', '<meta property="og:title" content="' . htmlspecialchars($title) . '" />', $html);
    }
    if (preg_match('/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is', $html)) {
        $html = preg_replace('/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is', '<meta property="og:description" content="' . htmlspecialchars($description) . '" />', $html);
    }
    
    // Replace og:url
    $siteUrl = 'https://quantumqbit.in';
    if (preg_match('/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is', $html)) {
        $html = preg_replace('/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is', '<meta property="og:url" content="' . htmlspecialchars($siteUrl . $canonicalPath) . '" />', $html);
    }
    
    // Inject Canonical URL link tag or replace if exists
    $canonicalTag = '<link rel="canonical" href="' . htmlspecialchars($siteUrl . $canonicalPath) . '" />';
    if (preg_match('/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is', $html)) {
        $html = preg_replace('/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is', $canonicalTag, $html);
    } else {
        $html = str_replace('</head>', '  ' . $canonicalTag . "\n</head>", $html);
    }

    echo $html;
} else {
    echo "Template index.html not found.";
}
