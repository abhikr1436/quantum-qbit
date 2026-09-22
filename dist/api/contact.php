<?php
require_once __DIR__ . '/cors.php';

ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}
@session_start();
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Only POST is supported."]);
    exit();
}

// Get POST data
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

// 1. Honeypot check to block automated spam bots
if (!empty($input['website_hp']) || !empty($input['bot_check'])) {
    // Fake success to fool bots without sending email
    echo json_encode(["success" => true, "message" => "Message sent successfully."]);
    exit();
}

// 2. Simple Rate Limiting: Max 4 messages per 10 minutes
$now = time();
if (!isset($_SESSION['contact_count'])) {
    $_SESSION['contact_count'] = 0;
    $_SESSION['contact_first_time'] = $now;
}

if ($now - $_SESSION['contact_first_time'] > 600) {
    $_SESSION['contact_count'] = 0;
    $_SESSION['contact_first_time'] = $now;
}

if ($_SESSION['contact_count'] >= 4) {
    http_response_code(429);
    echo json_encode(["error" => "Too many messages sent. Please wait a few minutes before sending another inquiry."]);
    exit();
}

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$subject = isset($input['subject']) ? trim($input['subject']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(["error" => "All fields are required."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid email address format."]);
    exit();
}

// 3. Security Sanitize: Strip carriage returns and newlines to prevent email header injection
$cleanName = str_replace(["\r", "\n"], '', $name);
$cleanSubject = str_replace(["\r", "\n"], '', $subject);
$cleanEmail = str_replace(["\r", "\n"], '', $email);

// Limit field sizes
$cleanName = mb_substr($cleanName, 0, 100);
$cleanSubject = mb_substr($cleanSubject, 0, 150);
$cleanMessage = mb_substr($message, 0, 5000);

$to = "contactus@quantumqbit.in";
$email_subject = "Quantum Qbit Contact Form: " . $cleanSubject;

$email_body = "
<html>
<head>
    <title>Contact Form Submission</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;'>
        <h2 style='color: #00f2fe; border-bottom: 2px solid #00f2fe; padding-bottom: 10px; margin-top: 0;'>New Message Received</h2>
        <p><strong>From:</strong> " . htmlspecialchars($cleanName) . " (&lt;" . htmlspecialchars($cleanEmail) . "&gt;)</p>
        <p><strong>Subject:</strong> " . htmlspecialchars($cleanSubject) . "</p>
        <div style='margin-top: 20px; padding: 15px; background-color: #fff; border-left: 4px solid #9d4edd; border-radius: 4px;'>
            <p style='margin: 0; white-space: pre-wrap;'>" . nl2br(htmlspecialchars($cleanMessage)) . "</p>
        </div>
        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
        <p style='font-size: 0.8em; color: #777; margin: 0;'>Sent from Quantum Qbit Website Contact Form</p>
    </div>
</body>
</html>
";

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Quantum Qbit Website <noreply@quantumqbit.in>\r\n";
$headers .= "Reply-To: " . addslashes($cleanName) . " <" . $cleanEmail . ">\r\n";

if (@mail($to, $email_subject, $email_body, $headers)) {
    $_SESSION['contact_count']++;
    echo json_encode(["success" => true, "message" => "Message sent successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to send message. Please try again later or email us directly at contactus@quantumqbit.in."]);
}
