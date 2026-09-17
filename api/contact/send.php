<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once dirname(__DIR__, 2) . '/config/session.php';

function contactResponse(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    contactResponse(405, ['success' => false, 'code' => 'method_not_allowed']);
}
$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') contactResponse(415, ['success' => false, 'code' => 'json_required']);
$rawBody = file_get_contents('php://input');
if (!is_string($rawBody) || $rawBody === '' || strlen($rawBody) > 16384) contactResponse(400, ['success' => false, 'code' => 'invalid_request']);
try {
    $body = json_decode($rawBody, true, 4, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    contactResponse(400, ['success' => false, 'code' => 'invalid_json']);
}
$expectedKeys = ['csrf_token', 'email', 'message', 'name', 'organization', 'reason', 'website'];
if (!is_array($body) || array_keys($body) !== $expectedKeys) contactResponse(400, ['success' => false, 'code' => 'invalid_request']);
foreach ($expectedKeys as $key) if (!is_string($body[$key])) contactResponse(400, ['success' => false, 'code' => 'invalid_request']);
if (!verifyChichejCsrfToken($body['csrf_token'])) contactResponse(403, ['success' => false, 'code' => 'invalid_csrf']);

// Los bots suelen completar este campo invisible. Se responde sin enviar correo.
if (trim($body['website']) !== '') contactResponse(200, ['success' => true]);

$name = trim(preg_replace('/\s+/u', ' ', $body['name']) ?? '');
$email = trim($body['email']);
$organization = trim(preg_replace('/\s+/u', ' ', $body['organization']) ?? '');
$reason = trim($body['reason']);
$message = trim($body['message']);
$allowedReasons = ['Consulta general', 'Información comercial', 'Adquirir el sistema CHICHEJ', 'Alianza o distribución', 'Soporte'];
if (mb_strlen($name) < 2 || mb_strlen($name) > 80) contactResponse(422, ['success' => false, 'code' => 'invalid_name']);
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || strlen($email) > 254 || preg_match('/[\r\n]/', $email)) contactResponse(422, ['success' => false, 'code' => 'invalid_email']);
if (mb_strlen($organization) > 120) contactResponse(422, ['success' => false, 'code' => 'invalid_organization']);
if (!in_array($reason, $allowedReasons, true)) contactResponse(422, ['success' => false, 'code' => 'invalid_reason']);
if (mb_strlen($message) < 10 || mb_strlen($message) > 4000) contactResponse(422, ['success' => false, 'code' => 'invalid_message']);

startChichejSession();
$now = time();
$lastAttempt = (int) ($_SESSION['contact_last_attempt'] ?? 0);
if ($lastAttempt > 0 && ($now - $lastAttempt) < 60) contactResponse(429, ['success' => false, 'code' => 'rate_limited']);
$_SESSION['contact_last_attempt'] = $now;

$autoloadPath = dirname(__DIR__, 2) . '/vendor/autoload.php';
if (!is_file($autoloadPath)) contactResponse(503, ['success' => false, 'code' => 'service_unavailable']);
require $autoloadPath;
require_once dirname(__DIR__, 2) . '/services/ContactMailService.php';
$service = new ContactMailService(require dirname(__DIR__, 2) . '/config/mail.php');
if (!$service->isConfigured()) contactResponse(503, ['success' => false, 'code' => 'service_unavailable']);

try {
    $service->send([
        'name' => $name, 'email' => $email, 'organization' => $organization,
        'reason' => $reason, 'body' => $message,
        'sent_at' => (new DateTimeImmutable('now', new DateTimeZone('America/La_Paz')))->format('d/m/Y H:i:s T'),
    ]);
    contactResponse(200, ['success' => true]);
} catch (Throwable) {
    contactResponse(502, ['success' => false, 'code' => 'delivery_failed']);
}
