<?php
// Retrieve database connection status and connection object

function getDBStatus() {
    $configFile = __DIR__ . '/data/config.json';
    if (!file_exists($configFile)) {
        return ['status' => 'fallback', 'message' => 'Config file not initialized.'];
    }
    
    $config = json_decode(file_get_contents($configFile), true);
    if (!$config) {
        return ['status' => 'fallback', 'message' => 'Config file is invalid.'];
    }
    
    $dbHost = isset($config['db_host']) ? trim($config['db_host']) : '';
    $dbName = isset($config['db_name']) ? trim($config['db_name']) : '';
    $dbUser = isset($config['db_user']) ? trim($config['db_user']) : '';
    $dbPass = isset($config['db_pass']) ? $config['db_pass'] : '';
    
    if (empty($dbHost) || empty($dbName) || empty($dbUser)) {
        return ['status' => 'fallback', 'message' => 'Database not configured. Using JSON file storage fallback.'];
    }
    
    try {
        $dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
        
        // Auto-initialize if tables don't exist
        $tablesExist = false;
        try {
            $result = $pdo->query("SELECT 1 FROM categories LIMIT 1");
            $tablesExist = ($result !== false);
        } catch (Exception $e) {
            $tablesExist = false;
        }
        
        if (!$tablesExist) {
            $schemaFile = __DIR__ . '/data/schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                $pdo->exec($sql);
            }
        }
        
        return [
            'status' => 'connected',
            'pdo' => $pdo,
            'host' => $dbHost,
            'dbname' => $dbName,
            'user' => $dbUser
        ];
    } catch (PDOException $e) {
        return [
            'status' => 'error',
            'message' => 'Connection failed: ' . $e->getMessage(),
            'host' => $dbHost,
            'dbname' => $dbName,
            'user' => $dbUser
        ];
    }
}

function getDBConnection() {
    $res = getDBStatus();
    return isset($res['pdo']) ? $res['pdo'] : null;
}
