<?php
// Fully Autonomous AI Publisher & SEO Engine for Quantum Qbit
// Operates via Hostinger cPanel/hPanel Cron Job, Webhook, or Admin Console.

ini_set('max_execution_time', 300);
ini_set('memory_limit', '256M');

// Start PHP Session
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}
@session_start();

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db_config.php';

header('Content-Type: application/json');

$persistentDir = getQuantumDataDir();
$configFile = $persistentDir . '/config.json';
$localConfig = __DIR__ . '/data/config.json';
$blogsFile = __DIR__ . '/data/blogs.json';
$persistentBlogsFile = $persistentDir . '/blogs.json';
$logFile = $persistentDir . '/automation_log.json';
$lockFile = $persistentDir . '/cron.lock';

// Load Configurations
function loadConfigData($configFile, $localConfig) {
    if (file_exists($configFile)) {
        $data = json_decode(file_get_contents($configFile), true);
        if (is_array($data)) return $data;
    }
    if (file_exists($localConfig)) {
        $data = json_decode(file_get_contents($localConfig), true);
        if (is_array($data)) return $data;
    }
    return [];
}

$config = loadConfigData($configFile, $localConfig);

// Authentication Verification
$isCli = (php_sapi_name() === 'cli' || defined('STDIN'));
$isAdminSession = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
$isKeyAuthorized = false;

$expectedKey = !empty($config['api_key']) ? trim($config['api_key']) : '';
$suppliedKey = '';

if (isset($_SERVER['HTTP_X_API_KEY'])) {
    $suppliedKey = trim($_SERVER['HTTP_X_API_KEY']);
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth = trim($_SERVER['HTTP_AUTHORIZATION']);
    if (stripos($auth, 'Bearer ') === 0) {
        $suppliedKey = trim(substr($auth, 7));
    }
} elseif (isset($_REQUEST['key'])) {
    $suppliedKey = trim($_REQUEST['key']);
}

if (!empty($expectedKey) && !empty($suppliedKey) && hash_equals($expectedKey, $suppliedKey)) {
    $isKeyAuthorized = true;
}

if (!$isCli && !$isAdminSession && !$isKeyAuthorized) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Valid API key (?key=...), Authorization header, or Admin session required.'
    ]);
    exit;
}

// Action dispatcher for Admin UI inspecting logs or trigger
$action = isset($_REQUEST['action']) ? strtolower(trim($_REQUEST['action'])) : 'publish';

if ($action === 'logs') {
    $logs = [];
    if (file_exists($logFile)) {
        $logs = json_decode(file_get_contents($logFile), true) ?: [];
    }
    echo json_encode(['success' => true, 'logs' => array_slice($logs, 0, 30)]);
    exit;
}

if ($action === 'status') {
    $deepseekKey = !empty($config['deepseek_api_key']);
    $geminiKey = !empty($config['gemini_api_key']);
    $lastRun = null;
    if (file_exists($logFile)) {
        $logs = json_decode(file_get_contents($logFile), true) ?: [];
        if (!empty($logs)) $lastRun = $logs[0];
    }
    echo json_encode([
        'success' => true,
        'gemini_configured' => $geminiKey,
        'deepseek_configured' => $deepseekKey,
        'ready' => ($geminiKey || $deepseekKey),
        'last_run' => $lastRun
    ]);
    exit;
}

// Concurrency Lock Protection
if (file_exists($lockFile)) {
    $lockTime = filemtime($lockFile);
    // If lock is younger than 10 minutes, prevent overlap
    if (time() - $lockTime < 600) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Another AI automation process is currently executing. Lock active.'
        ]);
        exit;
    }
}
@file_put_contents($lockFile, time());

// Register shutdown function to always remove lock file
register_shutdown_function(function() use ($lockFile) {
    if (file_exists($lockFile)) {
        @unlink($lockFile);
    }
});

// Frequency / Cadence Check (default: max 1 per 18 hours unless forced)
$force = isset($_REQUEST['force']) && ($_REQUEST['force'] === '1' || $_REQUEST['force'] === 'true');
$frequencyHours = isset($_REQUEST['frequency_hours']) ? max(1, intval($_REQUEST['frequency_hours'])) : 18;

if (!$force && file_exists($logFile)) {
    $logs = json_decode(file_get_contents($logFile), true) ?: [];
    if (!empty($logs) && isset($logs[0]['timestamp'])) {
        $lastPublishedTime = $logs[0]['timestamp'];
        $hoursSince = (time() - $lastPublishedTime) / 3600;
        if ($hoursSince < $frequencyHours) {
            echo json_encode([
                'success' => true,
                'status' => 'skipped',
                'message' => sprintf(
                    'Cadence preserved: Last article published %.1f hours ago. Next run scheduled in %.1f hours. (Use ?force=1 to bypass)',
                    $hoursSince,
                    ($frequencyHours - $hoursSince)
                ),
                'last_article' => $logs[0]['title']
            ]);
            exit;
        }
    }
}

// Master High-Converting SEO Topic Catalogue
$seoTopicCatalogue = [
    [
        'keyword' => 'How to Compress Images to Exactly 20KB for Job Portals Without Blurriness',
        'category' => 'Image Optimization',
        'category_id' => 'creative-tech',
        'tool_url' => '/tools/image-compressor',
        'tool_name' => 'Quantum In-Browser Image Compressor',
        'tool_desc' => 'Target exact KB limits with vector quality preservation and zero cloud upload.'
    ],
    [
        'keyword' => 'Extract Text from Scanned PDFs with Browser OCR Without Uploading Documents',
        'category' => 'PDF Workflows',
        'category_id' => 'general-utilities',
        'tool_url' => '/tools/pdf-to-word',
        'tool_name' => 'Offline PDF to Word OCR Converter',
        'tool_desc' => 'Extract high-accuracy text directly inside your browser RAM using Tesseract.js.'
    ],
    [
        'keyword' => 'Passport & Visa Photo DPI Guidelines: How to Get 300 DPI Exactly',
        'category' => 'Image Guides',
        'category_id' => 'creative-tech',
        'tool_url' => '/tools/image-editor',
        'tool_name' => 'Client-Side Photo & DPI Editor',
        'tool_desc' => 'Crop, resize, and embed exact 300 DPI metadata without server uploads.'
    ],
    [
        'keyword' => 'Merge Confidential PDF Documents In-Browser Using WebAssembly',
        'category' => 'Document Security',
        'category_id' => 'privacy-security',
        'tool_url' => '/tools/pdf-compressor',
        'tool_name' => 'Quantum Local PDF Suite',
        'tool_desc' => 'Process multi-megabyte PDF files 100% locally with sub-second speeds.'
    ],
    [
        'keyword' => 'Top Free Alternatives to ILovePDF and TinyPNG That Respect Privacy',
        'category' => 'Web Utilities',
        'category_id' => 'general-utilities',
        'tool_url' => '/tools',
        'tool_name' => 'Quantum Qbit Free Privacy Tools',
        'tool_desc' => 'Explore the complete suite of zero-knowledge, client-side web utilities.'
    ],
    [
        'keyword' => 'ISRO Technical Assistant Computer Science: Complete Preparation Blueprint',
        'category' => 'Exam Prep',
        'category_id' => 'exam-prep',
        'tool_url' => '/isro-ta-computer-science-pyq',
        'tool_name' => 'ISRO TA Computer Science PYQ Portal',
        'tool_desc' => 'Practice real previous year questions with interactive timers and instant analysis.'
    ],
    [
        'keyword' => 'Mastering Binary, Hexadecimal, and Subnetting Math for Network Engineers',
        'category' => 'Engineering Utilities',
        'category_id' => 'dev-math',
        'tool_url' => '/tools/math-calculators',
        'tool_name' => 'Scientific Base & Subnet Calculator',
        'tool_desc' => 'Perform real-time IEEE 754, binary, octal, hex and scientific conversions offline.'
    ],
    [
        'keyword' => 'Why Uploading Sensitive Photos to Online Converters Is a Security Disaster',
        'category' => 'Digital Privacy',
        'category_id' => 'privacy-security',
        'tool_url' => '/tools/image-compressor',
        'tool_name' => 'Zero-Knowledge Photo Compressor',
        'tool_desc' => 'Strip dangerous EXIF geolocation data and compress photos completely offline.'
    ],
    [
        'keyword' => 'Lossless vs Lossy WebP Compression: How to Boost Google PageSpeed',
        'category' => 'Web Performance',
        'category_id' => 'creative-tech',
        'tool_url' => '/tools/image-compressor',
        'tool_name' => 'Instant WebP & JPG Compressor',
        'tool_desc' => 'Optimize site images for 100/100 Core Web Vitals with GPU-accelerated Canvas.'
    ],
    [
        'keyword' => 'Convert Word DOCX to PDF Locally: Security and Formatting Guide',
        'category' => 'PDF Workflows',
        'category_id' => 'general-utilities',
        'tool_url' => '/tools/convert-to-pdf',
        'tool_name' => 'Document to PDF Converter',
        'tool_desc' => 'Convert DOCX, PPTX and text documents to PDF without sending drafts to remote servers.'
    ],
    [
        'keyword' => 'Zero-Knowledge Web Architecture: How Modern Browsers Run Desktop Software',
        'category' => 'Web Architecture',
        'category_id' => 'privacy-security',
        'tool_url' => '/about',
        'tool_name' => 'About Quantum Qbit Architecture',
        'tool_desc' => 'Read our architectural manifest on client-side sandboxed execution.'
    ],
    [
        'keyword' => 'Combine Multiple Photos into a Single High-Resolution PDF Portfolio',
        'category' => 'Document Tools',
        'category_id' => 'general-utilities',
        'tool_url' => '/tools/images-to-pdf',
        'tool_name' => 'Images to PDF Compiler',
        'tool_desc' => 'Arrange multiple JPG, PNG, and WebP images into a single vector PDF in seconds.'
    ]
];

// Load existing blogs to prevent duplicate coverage
function getExistingSlugsAndTitles($pdo, $blogsFile, $persistentBlogsFile) {
    $existing = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT id, title FROM blogs");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $existing[strtolower(trim($row['id']))] = true;
                $existing[strtolower(trim($row['title']))] = true;
            }
        } catch (Exception $e) {}
    }
    foreach ([$persistentBlogsFile, $blogsFile] as $f) {
        if (file_exists($f)) {
            $arr = json_decode(file_get_contents($f), true);
            if (is_array($arr)) {
                foreach ($arr as $b) {
                    if (!empty($b['slug'])) $existing[strtolower(trim($b['slug']))] = true;
                    if (!empty($b['id'])) $existing[strtolower(trim($b['id']))] = true;
                    if (!empty($b['title'])) $existing[strtolower(trim($b['title']))] = true;
                }
            }
        }
    }
    return $existing;
}

$pdo = getDBConnection();
$existingRegistry = getExistingSlugsAndTitles($pdo, $blogsFile, $persistentBlogsFile);

// Topic selection: custom requested topic, or pick next available from catalogue
$targetTopic = null;

if (!empty($_REQUEST['topic'])) {
    $customTopicStr = trim($_REQUEST['topic']);
    $targetTopic = [
        'keyword' => $customTopicStr,
        'category' => 'Technology & Privacy',
        'category_id' => 'privacy-security',
        'tool_url' => '/tools/image-compressor',
        'tool_name' => 'Quantum Privacy Tools Suite',
        'tool_desc' => 'Run client-side media and document tools 100% locally on your device.'
    ];
} else {
    foreach ($seoTopicCatalogue as $candidate) {
        $slugCandidate = strtolower(preg_replace('/[^a-z0-9]+/', '-', trim($candidate['keyword'])));
        $slugCandidate = trim($slugCandidate, '-');
        if (!isset($existingRegistry[$slugCandidate]) && !isset($existingRegistry[strtolower($candidate['keyword'])])) {
            $targetTopic = $candidate;
            break;
        }
    }
    // If all pre-defined topics have been published, generate a fresh variant
    if (!$targetTopic) {
        $randSeed = time();
        $targetTopic = [
            'keyword' => "Next-Generation Browser Cryptography and Local Utilities in 2026 (Edition #{$randSeed})",
            'category' => 'Security & Utilities',
            'category_id' => 'privacy-security',
            'tool_url' => '/tools',
            'tool_name' => 'Quantum Qbit Offline Utilities',
            'tool_desc' => 'Explore ultra-fast, client-side tools with zero remote server tracking.'
        ];
    }
}

// AI Engine Setup
$geminiKey = !empty($config['gemini_api_key']) ? trim($config['gemini_api_key']) : getenv('GEMINI_API_KEY');
$deepseekKey = !empty($config['deepseek_api_key']) ? trim($config['deepseek_api_key']) : getenv('DEEPSEEK_API_KEY');

if (empty($geminiKey) && empty($deepseekKey)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Neither Gemini nor DeepSeek API key is configured in quantum_data/config.json.'
    ]);
    exit;
}

$providerChoice = isset($_REQUEST['provider']) ? strtolower(trim($_REQUEST['provider'])) : 'auto';

// Multi-Turn Editorial Prompt Construction
$systemPrompt = "You are the Chief Technology Editor and Lead Author for Quantum Qbit (quantumqbit.in), a privacy-first suite of free, browser-native web utility tools (Image Compressor, PDF Compressor, PDF to Word OCR, Base/Scientific Math Calculators, ISRO Prep).

MANDATORY EDITORIAL REQUIREMENTS:
1. OUTPUT FORMAT: Output strictly a valid, raw JSON object (NO markdown backticks, NO ```json wrapping).
2. WORD COUNT: The 'html_content' field MUST contain an exhaustive, deeply comprehensive article of AT LEAST 2,000+ WORDS.
3. STRUCTURE:
   - Begin with a compelling problem statement exposing why uploading files to cloud conversion servers leaks private data, metadata, and EXIF coordinates.
   - Include 6 to 8 comprehensive sub-sections with <h2> and <h3> headers.
   - Provide concrete, step-by-step instructions.
   - Include at least ONE multi-column comparison <table> contrasting Client-Side execution (Quantum Qbit) vs Traditional Cloud Server processing.
   - Contextual callouts: Use <tip>Security Advisory: ...</tip> or <tip>Engineering Intel: ...</tip> (NEVER repeat generic Pro-Tip prefixes).
   - Include an in-depth FAQ section with 4 to 5 frequently asked questions and clear, authoritative answers.
   - End with a summary and <takeaways><ul><li>...</li></ul></takeaways>.
4. TONE: Highly authoritative, engaging, modern, E-E-A-T compliant, and formatted in clean HTML tags (<p>, <h2>, <h3>, <ul>, <ol>, <table>, <code>, <tip>, <takeaways>).";

$userPrompt = "Write an exhaustive, high-ranking SEO article for the keyword: \"{$targetTopic['keyword']}\".
Category: {$targetTopic['category']}
Associated Tool to Recommend: {$targetTopic['tool_name']} ({$targetTopic['tool_url']})

Return JSON with this EXACT structure:
{
  \"title\": \"High-CTR, engaging title with current year 2026\",
  \"slug\": \"clean-seo-friendly-url-slug\",
  \"excerpt\": \"Compelling 140-160 character meta description hook\",
  \"category\": \"{$targetTopic['category']}\",
  \"tags\": [\"Tag1\", \"Tag2\", \"Tag3\", \"Tag4\"],
  \"tool_cta_title\": \"Catchy title for the interactive tool banner\",
  \"tool_cta_desc\": \"Persuasive 2-sentence call to action explaining why to use {$targetTopic['tool_name']}\",
  \"html_content\": \"<p>2,000+ words of rich HTML content...</p>\"
}";

// Call Gemini API helper
function queryGeminiAutonomous($key, $sys, $user) {
    $models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    foreach ($models as $m) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key=" . urlencode($key);
        $payload = [
            'systemInstruction' => ['parts' => [['text' => $sys]]],
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $user]]]
            ],
            'generationConfig' => [
                'temperature' => 0.6,
                'maxOutputTokens' => 8192
            ]
        ];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 140);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code === 200) {
            $json = json_decode($resp, true);
            if (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                return ['success' => true, 'provider' => 'gemini', 'model' => $m, 'text' => $json['candidates'][0]['content']['parts'][0]['text']];
            }
        }
    }
    return ['success' => false, 'error' => 'Gemini generation returned invalid response'];
}

// Call DeepSeek API helper
function queryDeepSeekAutonomous($key, $sys, $user) {
    $payload = [
        'model' => 'deepseek-chat',
        'messages' => [
            ['role' => 'system', 'content' => $sys],
            ['role' => 'user', 'content' => $user]
        ],
        'temperature' => 0.6,
        'max_tokens' => 8192
    ];
    $ch = curl_init('https://api.deepseek.com/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 160);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200) {
        $json = json_decode($resp, true);
        if (isset($json['choices'][0]['message']['content'])) {
            return ['success' => true, 'provider' => 'deepseek', 'model' => 'deepseek-chat', 'text' => $json['choices'][0]['message']['content']];
        }
    }
    return ['success' => false, 'error' => 'DeepSeek generation failed with code ' . $code];
}

// Execute Generation with Automatic Failover
$aiResult = null;
$startTime = microtime(true);

if ($providerChoice === 'deepseek' && !empty($deepseekKey)) {
    $aiResult = queryDeepSeekAutonomous($deepseekKey, $systemPrompt, $userPrompt);
    if (!$aiResult['success'] && !empty($geminiKey)) {
        $aiResult = queryGeminiAutonomous($geminiKey, $systemPrompt, $userPrompt);
    }
} elseif ($providerChoice === 'gemini' && !empty($geminiKey)) {
    $aiResult = queryGeminiAutonomous($geminiKey, $systemPrompt, $userPrompt);
    if (!$aiResult['success'] && !empty($deepseekKey)) {
        $aiResult = queryDeepSeekAutonomous($deepseekKey, $systemPrompt, $userPrompt);
    }
} else {
    // Auto: try Gemini first (fast, generous tokens), fallback to DeepSeek
    if (!empty($geminiKey)) {
        $aiResult = queryGeminiAutonomous($geminiKey, $systemPrompt, $userPrompt);
    }
    if ((!$aiResult || !$aiResult['success']) && !empty($deepseekKey)) {
        $aiResult = queryDeepSeekAutonomous($deepseekKey, $systemPrompt, $userPrompt);
    }
}

if (!$aiResult || !$aiResult['success']) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Autonomous generation failed: ' . ($aiResult['error'] ?? 'Unknown AI error')]);
    exit;
}

$rawAiText = trim($aiResult['text']);

// Strip markdown code fences if outputted
if (preg_match('/^```(?:json)?\s*(.*?)\s*```$/is', $rawAiText, $m)) {
    $rawAiText = trim($m[1]);
}

$articleData = json_decode($rawAiText, true);

// Fallback parsing if JSON decode failed
if (!is_array($articleData) || empty($articleData['html_content'])) {
    $title = $targetTopic['keyword'];
    $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $title));
    $slug = trim($slug, '-');
    $excerpt = "Comprehensive practical guide and technical insights regarding {$targetTopic['keyword']}.";
    $htmlContent = $rawAiText;
    $toolCtaTitle = "Try " . $targetTopic['tool_name'];
    $toolCtaDesc = $targetTopic['tool_desc'];
    $tags = [$targetTopic['category'], 'Quantum Qbit', 'Privacy', 'Web Tech'];
} else {
    $title = trim($articleData['title'] ?? $targetTopic['keyword']);
    $slug = trim($articleData['slug'] ?? strtolower(preg_replace('/[^a-z0-9]+/', '-', $title)));
    $slug = trim($slug, '-');
    $excerpt = trim($articleData['excerpt'] ?? "A comprehensive guide on {$title}");
    $htmlContent = trim($articleData['html_content']);
    $toolCtaTitle = trim($articleData['tool_cta_title'] ?? ("Try " . $targetTopic['tool_name']));
    $toolCtaDesc = trim($articleData['tool_cta_desc'] ?? $targetTopic['tool_desc']);
    $tags = is_array($articleData['tags'] ?? null) ? $articleData['tags'] : [$targetTopic['category'], 'Web Tech', 'Privacy'];
}

// Seamlessly embed the high-converting Interactive Tool Call-To-Action component
$toolCtaBanner = '
<div class="tool-embed-card" style="margin: 40px 0; padding: 26px 28px; border-radius: 18px; background: radial-gradient(circle at top right, rgba(0, 242, 254, 0.08), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(0, 242, 254, 0.3); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4); text-align: left; display: flex; flex-direction: column; gap: 12px;">
  <div style="display: flex; align-items: center; gap: 10px;">
    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #00F2FE; box-shadow: 0 0 10px #00F2FE;"></span>
    <span style="font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #00F2FE;">Interactive Free Utility</span>
  </div>
  <h3 style="color: #F8FAFC; margin: 0; font-size: 1.35rem; font-weight: 700;">' . htmlspecialchars($toolCtaTitle) . '</h3>
  <p style="color: #94A3B8; margin: 0; font-size: 0.95rem; line-height: 1.5;">' . htmlspecialchars($toolCtaDesc) . ' 100% private, client-side, zero files uploaded to any server.</p>
  <div style="margin-top: 6px;">
    <a href="' . htmlspecialchars($targetTopic['tool_url']) . '" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%); color: #050b14; font-weight: 700; border-radius: 12px; text-decoration: none; font-size: 0.92rem; transition: transform 0.2s ease;">
      <span>Launch Tool Online Free</span>
      <span style="font-size: 1.1rem;">→</span>
    </a>
  </div>
</div>';

// Insert tool banner after the second paragraph if possible
$paragraphs = explode('</p>', $htmlContent);
if (count($paragraphs) > 2) {
    $firstPart = $paragraphs[0] . '</p>' . $paragraphs[1] . '</p>';
    $rest = implode('</p>', array_slice($paragraphs, 2));
    $htmlContent = $firstPart . $toolCtaBanner . $rest;
} else {
    $htmlContent .= $toolCtaBanner;
}

// Compute metrics
$wordCount = str_word_count(strip_tags($htmlContent));
$readTime = max(1, ceil($wordCount / 200)) . ' min read';
$dateFormatted = date('M d, Y');
$publishedAtMs = time() * 1000;
$author = 'Quantum Qbit Editorial Team';
$categoryId = $targetTopic['category_id'] ?? 'privacy-security';
$categoryLabel = $targetTopic['category'] ?? 'Technology';

// Ensure Slug is completely unique
$baseSlug = $slug;
$counter = 1;
while (isset($existingRegistry[$slug])) {
    $slug = $baseSlug . '-' . $counter;
    $counter++;
}
$id = $slug;

// Assemble record
$newBlog = [
    'id' => $id,
    'slug' => $slug,
    'title' => $title,
    'category' => $categoryId,
    'categoryLabel' => $categoryLabel,
    'summary' => $excerpt,
    'readTime' => $readTime,
    'date' => $dateFormatted,
    'publishedAt' => $publishedAtMs,
    'author' => $author,
    'tags' => array_values($tags),
    'coverImage' => null,
    'htmlContent' => $htmlContent,
    'content' => [
        'intro' => $excerpt,
        'sections' => [],
        'takeaways' => []
    ]
];

// Save to persistent JSON stores
function appendToJsonStore($filePath, $newBlog) {
    $items = [];
    if (file_exists($filePath)) {
        $items = json_decode(file_get_contents($filePath), true) ?: [];
    }
    array_unshift($items, $newBlog);
    if (!file_exists(dirname($filePath))) {
        @mkdir(dirname($filePath), 0755, true);
    }
    @file_put_contents($filePath, json_encode($items, JSON_PRETTY_PRINT));
}

appendToJsonStore($blogsFile, $newBlog);
appendToJsonStore($persistentBlogsFile, $newBlog);

// Save to MySQL DB
if ($pdo) {
    try {
        $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, name) VALUES (:id, :name)");
        $stmtCat->execute(['id' => $categoryId, 'name' => $categoryLabel]);

        $stmtBlog = $pdo->prepare("
            INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
            VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
        ");
        $stmtBlog->execute([
            'id' => $id,
            'title' => $title,
            'excerpt' => $excerpt,
            'content' => $htmlContent,
            'author' => $author,
            'date' => $dateFormatted,
            'read_time' => $readTime,
            'category_id' => $categoryId,
            'image_glow' => 'rgba(0, 242, 254, 0.15)'
        ]);
    } catch (Exception $e) {
        // Fallback JSON already preserved
    }
}

// Dynamic Sitemap Auto-Update
$sitemapFile = dirname(__DIR__) . '/sitemap.xml';
if (file_exists($sitemapFile)) {
    $sitemapContent = file_get_contents($sitemapFile);
    $newUrlEntry = "  <url>\n    <loc>https://quantumqbit.in/blogs/{$slug}</loc>\n    <lastmod>" . date('Y-m-d') . "</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n";
    if (strpos($sitemapContent, "</urlset>") !== false) {
        $sitemapContent = str_replace("</urlset>", $newUrlEntry . "</urlset>", $sitemapContent);
        @file_put_contents($sitemapFile, $sitemapContent);
    }
}

// Ping Google and Search Engines
@file_get_contents("https://www.google.com/ping?sitemap=" . urlencode("https://quantumqbit.in/sitemap.xml"));
@file_get_contents("https://www.bing.com/ping?sitemap=" . urlencode("https://quantumqbit.in/sitemap.xml"));

$duration = round(microtime(true) - $startTime, 2);

// Append to Automation Log
$logEntry = [
    'timestamp' => time(),
    'date' => date('Y-m-d H:i:s'),
    'title' => $title,
    'slug' => $slug,
    'url' => 'https://quantumqbit.in/blogs/' . $slug,
    'provider' => $aiResult['provider'],
    'model' => $aiResult['model'],
    'word_count' => $wordCount,
    'read_time' => $readTime,
    'duration_seconds' => $duration,
    'status' => 'success'
];

$existingLogs = [];
if (file_exists($logFile)) {
    $existingLogs = json_decode(file_get_contents($logFile), true) ?: [];
}
array_unshift($existingLogs, $logEntry);
@file_put_contents($logFile, json_encode(array_slice($existingLogs, 0, 50), JSON_PRETTY_PRINT));

// Return detailed response
echo json_encode([
    'success' => true,
    'message' => 'Autonomous article generated and published successfully!',
    'article' => [
        'id' => $id,
        'title' => $title,
        'slug' => $slug,
        'url' => 'https://quantumqbit.in/blogs/' . $slug,
        'category' => $categoryLabel,
        'word_count' => $wordCount,
        'read_time' => $readTime,
        'provider' => $aiResult['provider'],
        'model' => $aiResult['model'],
        'duration' => $duration . 's'
    ]
], JSON_PRETTY_PRINT);
