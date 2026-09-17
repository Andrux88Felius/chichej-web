<?php
declare(strict_types=1);

/**
 * Configuración pública del cliente Firebase Web.
 * Los valores se inyectarán desde el entorno del servidor. Este archivo no
 * contiene credenciales, tokens, cuentas de servicio ni claves privadas.
 *
 * La cuenta de servicio permanece fuera del repositorio. La autenticación se
 * habilita únicamente cuando el cliente Web y el servidor están configurados.
 */
$client = [
    'apiKey' => getenv('CHICHEJ_FIREBASE_API_KEY') ?: '',
    'authDomain' => getenv('CHICHEJ_FIREBASE_AUTH_DOMAIN') ?: '',
    'databaseURL' => getenv('CHICHEJ_FIREBASE_DATABASE_URL') ?: '',
    'projectId' => getenv('CHICHEJ_FIREBASE_PROJECT_ID') ?: '',
    'appId' => getenv('CHICHEJ_FIREBASE_APP_ID') ?: '',
    'messagingSenderId' => getenv('CHICHEJ_FIREBASE_MESSAGING_SENDER_ID') ?: '',
];

$requiredClientKeys = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'];
$clientConfigured = array_reduce(
    $requiredClientKeys,
    static fn(bool $configured, string $key): bool => $configured && $client[$key] !== '',
    true
);
$serviceAccountPath = getenv('CHICHEJ_FIREBASE_SERVICE_ACCOUNT') ?: '/etc/chichej/firebase-service-account.json';
$autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
$serverConfigured = is_file($autoloadPath) && is_readable($serviceAccountPath) && $client['databaseURL'] !== '';

return [
    'client' => $client,
    'client_configured' => $clientConfigured,
    'service_account_path' => $serviceAccountPath,
    'autoload_path' => $autoloadPath,
    'server_token_verifier_configured' => $serverConfigured,
    'authentication_enabled' => $clientConfigured && $serverConfigured,
    'profile_path_template' => 'usuarios/{uid}',
    'role_field' => 'rol',
    'blocked_field' => 'bloqueado',
    'admin_roles' => ['admin', 'admin_principal'],
    'user_role' => 'cliente',
];
