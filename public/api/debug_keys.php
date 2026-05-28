<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/db_config.php';

$pdo = getDBConnection();
echo "=== SETTINGS DB DIAGNOSTICS ===\n";
echo "PDO: " . ($pdo ? "Connected" : "Failed") . "\n";

if ($pdo) {
    try {
        // Create table settings if not exists
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            `key` VARCHAR(100) PRIMARY KEY,
            `value` TEXT NOT NULL
        )");
        echo "Table settings checked/created.\n";
        
        $stmt = $pdo->query("SELECT `key`, LENGTH(`value`) as len FROM settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Settings entries found in DB:\n";
        foreach ($rows as $row) {
            echo "  - " . $row['key'] . " (Length: " . $row['len'] . ")\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

$keysFile = getQuantumDataDir() . '/keys.json';
echo "Keys File Path: " . $keysFile . "\n";
echo "Keys File Exists: " . (file_exists($keysFile) ? "Yes" : "No") . "\n";
if (file_exists($keysFile)) {
    $content = file_get_contents($keysFile);
    $data = json_decode($content, true);
    echo "Keys File Content status:\n";
    if (is_array($data)) {
        foreach ($data as $k => $v) {
            echo "  - " . $k . " (Length: " . strlen($v) . ")\n";
        }
    } else {
        echo "  - Invalid JSON in keys.json\n";
    }
}
