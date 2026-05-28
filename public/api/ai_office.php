<?php
// Enable CORS for local dev environment testing
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

session_start();
header('Content-Type: application/json');

$dbFile = __DIR__ . '/data/db.json';
$liveUpdatesFile = __DIR__ . '/data/live_updates.json';
$keysFile = __DIR__ . '/data/keys.json';

// Helper to load keys.json (ignored by Git for security)
function getAIKeys($keysFile) {
    if (!file_exists(dirname($keysFile))) {
        mkdir(dirname($keysFile), 0755, true);
    }
    if (!file_exists($keysFile)) {
        return [
            'deepseekKey' => '',
            'githubToken' => ''
        ];
    }
    $content = file_get_contents($keysFile);
    $data = json_decode($content, true);
    return is_array($data) ? $data : ['deepseekKey' => '', 'githubToken' => ''];
}

// Helper to save keys.json
function saveAIKeys($keysFile, $data) {
    if (!file_exists(dirname($keysFile))) {
        mkdir(dirname($keysFile), 0755, true);
    }
    return file_put_contents($keysFile, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}


// Helper to initialize and retrieve db.json
function getAIDB($dbFile) {
    if (!file_exists(dirname($dbFile))) {
        mkdir(dirname($dbFile), 0755, true);
    }
    
    if (!file_exists($dbFile)) {
        $defaultDB = [
            'config' => [
                'websitePath' => '.',
                'deepseekKey' => '',
                'githubToken' => '',
                'automationIntervalMinutes' => 360,
                'isAutomationActive' => true,
                'lastRunTimestamp' => null,
                'lastBrainstormTimestamp' => null
            ],
            'agents' => [
                ['name' => 'Sophia', 'role' => 'CEO', 'avatar' => '💼', 'bio' => 'Visionary executive who makes final approvals on business objectives, web deployments, and articles. Ensures everything matches the high standards of Quantum Qbit.', 'status' => 'Idle'],
                ['name' => 'Alex', 'role' => 'Manager', 'avatar' => '📋', 'bio' => 'Coordinates task flows, parses board directives, assigns work to specialists, reviews drafts, and prepares reports for Sophia.', 'status' => 'Idle'],
                ['name' => 'Mark', 'role' => 'Marketing', 'avatar' => '✍️', 'bio' => 'Specializes in keyword optimization, content writing, SEO research, and drafting educational technical blogs.', 'status' => 'Idle'],
                ['name' => 'Sarah', 'role' => 'Social Media', 'avatar' => '🐦', 'bio' => 'Maintains company social media channels. Creates promotions, Twitter threads, LinkedIn summaries, and monitors online traffic.', 'status' => 'Idle'],
                ['name' => 'Codey', 'role' => 'IT Developer', 'avatar' => '💻', 'bio' => 'Full-stack coder. Inspects target page elements, updates components, and develops new utilities for local-first browsers.', 'status' => 'Idle'],
                ['name' => 'Deployer', 'role' => 'DevOps', 'avatar' => '🚀', 'bio' => 'Monitors build health, verifies code formats, compiles outputs, and pushes approved articles/code changes to website directories.', 'status' => 'Idle'],
                ['name' => 'Harper', 'role' => 'HR', 'avatar' => '🤝', 'bio' => 'Handles personnel details, team cohesion, drafts job postings, and aligns core values.', 'status' => 'Idle']
            ],
            'tasks' => [],
            'chatLogs' => [],
            'publishedTopics' => []
        ];
        file_put_contents($dbFile, json_encode($defaultDB, JSON_PRETTY_PRINT));
        return $defaultDB;
    }
    
    $content = file_get_contents($dbFile);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

// Helper to save db.json
function saveAIDB($dbFile, $data) {
    return file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

// Helper to record live updates (queued for GitHub Action runner check-in)
function queueLiveUpdate($liveUpdatesFile, $updateType, $payload) {
    if (!file_exists(dirname($liveUpdatesFile))) {
        mkdir(dirname($liveUpdatesFile), 0755, true);
    }
    
    $updates = ['directives' => [], 'chatLogs' => [], 'taskOverrides' => [], 'configOverrides' => []];
    if (file_exists($liveUpdatesFile)) {
        $content = file_get_contents($liveUpdatesFile);
        $parsed = json_decode($content, true);
        if (is_array($parsed)) {
            $updates = array_merge($updates, $parsed);
        }
    }
    
    if ($updateType === 'directive') {
        $updates['directives'][] = $payload;
    } elseif ($updateType === 'chat') {
        $updates['chatLogs'][] = $payload;
    } elseif ($updateType === 'task') {
        $updates['taskOverrides'][] = $payload;
    } elseif ($updateType === 'config') {
        $updates['configOverrides'] = array_merge($updates['configOverrides'], $payload);
    }
    
    file_put_contents($liveUpdatesFile, json_encode($updates, JSON_PRETTY_PRINT));
}

// Extract request action
$action = isset($_GET['action']) ? $_GET['action'] : '';
$input = json_decode(file_get_contents('php://input'), true);

// Auth check: get_live_updates endpoint is authenticated via bearer token in request header
if ($action === 'get_live_updates') {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    
    $token = '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    }
    
    $keys = getAIKeys($keysFile);
    $storedDeepseekKey = isset($keys['deepseekKey']) ? $keys['deepseekKey'] : '';
    $storedGithubToken = isset($keys['githubToken']) ? $keys['githubToken'] : '';
    
    if (empty($token) || ($token !== $storedDeepseekKey && $token !== $storedGithubToken)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized token access']);
        exit;
    }
    
    // Serve and clear live updates
    $updates = ['directives' => [], 'chatLogs' => [], 'taskOverrides' => [], 'configOverrides' => []];
    if (file_exists($liveUpdatesFile)) {
        $content = file_get_contents($liveUpdatesFile);
        $updates = json_decode($content, true);
        unlink($liveUpdatesFile); // Clear file
    }
    
    echo json_encode($updates);
    exit;
}

// Verify admin session for all other routes
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access. Log in via Admin Panel first.']);
    exit;
}

switch ($action) {
    case 'dashboard':
        $db = getAIDB($dbFile);
        $keys = getAIKeys($keysFile);
        
        // Initialize config keys to empty
        $db['config']['deepseekKey'] = '';
        $db['config']['githubToken'] = '';
        
        $dsKey = isset($keys['deepseekKey']) ? $keys['deepseekKey'] : '';
        $ghToken = isset($keys['githubToken']) ? $keys['githubToken'] : '';
        
        // Mask keys before serving to client dashboard
        if (!empty($dsKey) && strlen($dsKey) > 10) {
            $db['config']['deepseekKey'] = substr($dsKey, 0, 5) . '...' . substr($dsKey, -4);
        }
        if (!empty($ghToken) && strlen($ghToken) > 10) {
            $db['config']['githubToken'] = substr($ghToken, 0, 5) . '...' . substr($ghToken, -4);
        }
        echo json_encode($db);
        break;
        
    case 'save_config':
        $db = getAIDB($dbFile);
        $newConfig = $input;
        $keys = getAIKeys($keysFile);
        
        // Extract and save key configs separately if not masked
        if (isset($newConfig['deepseekKey'])) {
            if (strpos($newConfig['deepseekKey'], '...') === false) {
                $keys['deepseekKey'] = $newConfig['deepseekKey'];
            }
            unset($newConfig['deepseekKey']);
        }
        if (isset($newConfig['githubToken'])) {
            if (strpos($newConfig['githubToken'], '...') === false) {
                $keys['githubToken'] = $newConfig['githubToken'];
            }
            unset($newConfig['githubToken']);
        }
        saveAIKeys($keysFile, $keys);
        
        // Remove keys from db.json config
        unset($db['config']['deepseekKey']);
        unset($db['config']['githubToken']);
        
        $db['config'] = array_merge($db['config'], $newConfig);
        saveAIDB($dbFile, $db);
        
        // Push config override to queue (without sensitive keys!)
        queueLiveUpdate($liveUpdatesFile, 'config', $newConfig);
        echo json_encode(['success' => true]);
        break;
        
    case 'chat':
        $db = getAIDB($dbFile);
        $text = isset($input['text']) ? trim($input['text']) : '';
        $sender = isset($input['sender']) ? trim($input['sender']) : 'Board';
        
        $newMsg = [
            'id' => 'msg-' . time() . '-' . rand(100, 999),
            'sender' => $sender,
            'text' => $text,
            'timestamp' => date(DATE_ATOM)
        ];
        
        $db['chatLogs'][] = $newMsg;
        saveAIDB($dbFile, $db);
        
        // Queue update
        queueLiveUpdate($liveUpdatesFile, 'chat', $newMsg);
        echo json_encode($newMsg);
        break;
        
    case 'boardroom_submit':
        $db = getAIDB($dbFile);
        $directive = isset($input['directive']) ? trim($input['directive']) : '';
        if (empty($directive)) {
            http_response_code(400);
            echo json_encode(['error' => 'Directive cannot be empty']);
            break;
        }
        
        // Add message from Board
        $boardMsg = [
            'id' => 'msg-' . time() . '-' . rand(100, 999),
            'sender' => 'Board',
            'text' => $directive,
            'timestamp' => date(DATE_ATOM)
        ];
        $db['chatLogs'][] = $boardMsg;
        
        // Update manager status
        foreach ($db['agents'] as &$agent) {
            if ($agent['name'] === 'Alex') {
                $agent['status'] = 'Analyzing boardroom directive';
            }
        }
        
        saveAIDB($dbFile, $db);
        
        // Queue directive update
        queueLiveUpdate($liveUpdatesFile, 'directive', $directive);
        echo json_encode(['success' => true]);
        break;
        
    case 'update_task':
        $db = getAIDB($dbFile);
        $taskId = isset($input['id']) ? $input['id'] : '';
        $newStatus = isset($input['status']) ? $input['status'] : '';
        
        $found = false;
        foreach ($db['tasks'] as &$task) {
            if ($task['id'] === $taskId) {
                $task['status'] = $newStatus;
                $task['updatedAt'] = date(DATE_ATOM);
                $found = true;
                break;
            }
        }
        
        if ($found) {
            saveAIDB($dbFile, $db);
            // Queue task override update
            queueLiveUpdate($liveUpdatesFile, 'task', ['id' => $taskId, 'status' => $newStatus]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Task not found']);
        }
        break;
        
    case 'seo_ranks':
        // Simulated organic ranking responses for India region SEO targets
        $ranks = [
            ['keyword' => 'offline pdf compressor', 'rank' => 14],
            ['keyword' => 'photo compressor online India', 'rank' => 6],
            ['keyword' => 'local file base converter', 'rank' => 21],
            ['keyword' => 'privacy first image editor', 'rank' => '50+'],
            ['keyword' => 'browser utility tools client side', 'rank' => 3]
        ];
        echo json_encode(['success' => true, 'ranks' => $ranks]);
        break;
        
    case 'seo_audit':
        // Static analysis of files in Hostinger directories
        $landingPage = __DIR__ . '/../../src/pages/LandingPage.tsx';
        $blogsPage = __DIR__ . '/../../src/pages/Blogs.tsx';
        $blogsJson = __DIR__ . '/data/blogs.json';
        
        $score = 92;
        $issues = [];
        $blogsCount = 0;
        
        if (file_exists($blogsJson)) {
            $blogsData = json_decode(file_get_contents($blogsJson), true);
            if (is_array($blogsData)) {
                $blogsCount = count($blogsData);
            }
        }
        
        if ($blogsCount < 5) {
            $issues[] = [
                'severity' => 'medium',
                'type' => 'Content Volume',
                'desc' => "Only {$blogsCount} blog posts detected in JSON database. Search bots crawl websites more frequently when they have 5+ indexable guides."
            ];
            $score -= 6;
        }
        
        // Scan LandingPage.tsx for meta tags / alt attributes
        if (file_exists($landingPage)) {
            $content = file_get_contents($landingPage);
            if (strpos($content, 'updateSEO') === false) {
                $issues[] = [
                    'severity' => 'high',
                    'type' => 'Dynamic Titles',
                    'desc' => 'Landing page has no explicit page title updating script or active SEO hooks.'
                ];
                $score -= 10;
            }
            if (preg_match_all('/<img[^>]+>/i', $content, $matches)) {
                $missingAlt = 0;
                foreach ($matches[0] as $img) {
                    if (strpos($img, 'alt=') === false) {
                        $missingAlt++;
                    }
                }
                if ($missingAlt > 0) {
                    $issues[] = [
                        'severity' => 'medium',
                        'type' => 'Alt Attributes',
                        'desc' => "{$missingAlt} image elements identified in LandingPage layout without explicit descriptive alt tags."
                    ];
                    $score -= 5;
                }
            }
        } else {
            $issues[] = [
                'severity' => 'high',
                'type' => 'Crawler Error',
                'desc' => 'LandingPage.tsx file could not be opened for indexing scanning.'
            ];
            $score -= 15;
        }
        
        echo json_encode([
            'success' => true,
            'score' => max(40, $score),
            'blogsCount' => $blogsCount,
            'issues' => $issues,
            'scannedAt' => date(DATE_ATOM)
        ]);
        break;
        
    case 'trigger_cycle':
        $keys = getAIKeys($keysFile);
        $token = isset($keys['githubToken']) ? $keys['githubToken'] : '';
        
        if (empty($token)) {
            http_response_code(400);
            echo json_encode(['error' => 'GitHub Personal Access Token (PAT) not configured in settings.']);
            exit;
        }
        
        // Dispatch GitHub Actions run
        $url = 'https://api.github.com/repos/abhikr1436/quantum-qbit/actions/workflows/ai_office_scheduler.yml/dispatches';
        $ch = curl_init();
        
        $payload = json_encode(['ref' => 'master']);
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $token",
            "Accept: application/vnd.github+json",
            "User-Agent: php-curl-quantum-office",
            "X-GitHub-Api-Version: 2022-11-28",
            "Content-Type: application/json"
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 204) {
            echo json_encode(['success' => true, 'message' => 'GitHub Action loop workflow triggered successfully in the cloud!']);
        } else {
            http_response_code(502);
            echo json_encode([
                'error' => "GitHub API returned HTTP $httpCode",
                'details' => json_decode($response, true)
            ]);
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid endpoint action']);
        break;
}
