<?php
/**
 * Shared Security & CORS Handler for Quantum Qbit APIs
 * Protects against cross-site request forgery, cross-origin leaks, and unauthorized origin reflection.
 */

function handleCorsAndSecurityHeaders() {
    // 1. Core HTTP Security Headers
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: SAMEORIGIN");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");

    // 2. Strict Origin Whitelisting
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? trim($_SERVER['HTTP_ORIGIN']) : '';
    $allowed = false;

    if (!empty($origin)) {
        $allowedOrigins = [
            'https://quantumqbit.in',
            'https://www.quantumqbit.in',
            'http://quantumqbit.in',
            'http://www.quantumqbit.in'
        ];

        if (in_array($origin, $allowedOrigins, true)) {
            $allowed = true;
        } elseif (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/i', $origin)) {
            // Permit local development testing
            $allowed = true;
        }
    }

    if ($allowed) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
        header("Vary: Origin");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept");

    // Fast-exit for CORS preflight OPTIONS requests
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        if (!empty($origin) && !$allowed) {
            http_response_code(403);
            exit;
        }
        http_response_code(204);
        exit;
    }
}

// Automatically invoke on inclusion
handleCorsAndSecurityHeaders();
