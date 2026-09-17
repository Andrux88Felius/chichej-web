<?php
declare(strict_types=1);

use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\Factory;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function jsonResponse(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    jsonResponse(405, ['success' => false, 'code' => 'method_not_allowed']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    jsonResponse(415, ['success' => false, 'code' => 'json_required']);
}

$rawBody = file_get_contents('php://input');
if (!is_string($rawBody) || $rawBody === '' || strlen($rawBody) > 32768) {
    jsonResponse(400, ['success' => false, 'code' => 'invalid_request']);
}

try {
    $body = json_decode($rawBody, true, 4, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    jsonResponse(400, ['success' => false, 'code' => 'invalid_json']);
}

if (!is_array($body) || array_keys($body) !== ['idToken']) {
    jsonResponse(400, ['success' => false, 'code' => 'invalid_request']);
}

$idToken = $body['idToken'];
if (!is_string($idToken) || $idToken === '' || strlen($idToken) > 20000) {
    jsonResponse(400, ['success' => false, 'code' => 'invalid_token']);
}

$firebase = require dirname(__DIR__, 2) . '/config/firebase.php';
if ($firebase['server_token_verifier_configured'] !== true) {
    jsonResponse(503, ['success' => false, 'code' => 'server_unavailable']);
}

require $firebase['autoload_path'];
require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/firebase-profile.php';

try {
    $factory = (new Factory())
        ->withServiceAccount($firebase['service_account_path'])
        ->withDatabaseUri($firebase['client']['databaseURL']);

    $verifiedToken = $factory->createAuth()->verifyIdToken($idToken);
    $uid = trim((string) $verifiedToken->claims()->get('sub'));
    if ($uid === '') {
        jsonResponse(401, ['success' => false, 'code' => 'invalid_token']);
    }

    $profile = chichejProfileAtUid($factory->createDatabase(), $uid);
    if (!is_array($profile)) {
        jsonResponse(403, ['success' => false, 'code' => 'profile_unavailable']);
    }

    if (chichejProfileIsBlocked($profile)) {
        jsonResponse(403, [
            'success' => false,
            'code' => 'account_blocked',
            'message' => 'Tu cuenta no está disponible para acceder en este momento.',
        ]);
    }

    $role = chichejProfileRole($profile);
    if (!in_array($role, ['cliente', 'admin', 'admin_principal'], true)) {
        jsonResponse(403, ['success' => false, 'code' => 'role_not_allowed']);
    }

    $tokenEmail = $verifiedToken->claims()->get('email', '');
    establishVerifiedSession([
        'uid' => $uid,
        'name' => trim((string) ($profile['nombre'] ?? '')) ?: 'Usuario',
        'email' => is_string($tokenEmail) && $tokenEmail !== '' ? $tokenEmail : (string) ($profile['email'] ?? ''),
        'role' => $role,
        'avatar' => (string) ($profile['avatarPath'] ?? 'assets/avatares/invitado.png'),
        'blocked' => false,
    ]);

    jsonResponse(200, [
        'success' => true,
        'role' => $role,
        'redirect' => in_array($role, ['admin', 'admin_principal'], true) ? 'admin/' : 'usuario/',
    ]);
} catch (FailedToVerifyToken) {
    jsonResponse(401, ['success' => false, 'code' => 'invalid_token']);
} catch (Throwable) {
    jsonResponse(500, ['success' => false, 'code' => 'server_error']);
}
