<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Only POST is supported."]);
    exit();
}

// Get the POST data (supports both raw JSON and form data)
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
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

// Recipient email address
$to = "contactus@quantumqbit.in";

// Email subject
$email_subject = "Quantum Qbit Contact Form: " . $subject;

// Email body (HTML format)
$email_body = "
<html>
<head>
    <title>Contact Form Submission</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;'>
        <h2 style='color: #00f2fe; border-bottom: 2px solid #00f2fe; padding-bottom: 10px; margin-top: 0;'>New Message Received</h2>
        <p><strong>From:</strong> " . htmlspecialchars($name) . " (&lt;" . htmlspecialchars($email) . "&gt;)</p>
        <p><strong>Subject:</strong> " . htmlspecialchars($subject) . "</p>
        <div style='margin-top: 20px; padding: 15px; background-color: #fff; border-left: 4px solid #9d4edd; border-radius: 4px;'>
            <p style='margin: 0; white-space: pre-wrap;'>" . nl2br(htmlspecialchars($message)) . "</p>
        </div>
        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
        <p style='font-size: 0.8em; color: #777; margin: 0;'>Sent from Quantum Qbit Website Contact Form</p>
    </div>
</body>
</html>
";

// Headers
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Quantum Qbit Website <noreply@quantumqbit.in>\r\n";
$headers .= "Reply-To: " . $name . " <" . $email . ">\r\n";

if (mail($to, $email_subject, $email_body, $headers)) {
    echo json_encode(["success" => true, "message" => "Message sent successfully."]);
} else {
    // If local mail fails, log or output error
    http_response_code(500);
    echo json_encode(["error" => "Failed to send message. Please try again later or email us directly."]);
}
?>
