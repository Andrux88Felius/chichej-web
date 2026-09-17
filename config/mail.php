<?php
declare(strict_types=1);

$host = trim((string) (getenv('CHICHEJ_MAIL_HOST') ?: ''));
$username = trim((string) (getenv('CHICHEJ_MAIL_USERNAME') ?: ''));
$password = (string) (getenv('CHICHEJ_MAIL_PASSWORD') ?: '');
$fromAddress = trim((string) (getenv('CHICHEJ_MAIL_FROM_ADDRESS') ?: $username));
$toAddress = trim((string) (getenv('CHICHEJ_MAIL_TO_ADDRESS') ?: 'chichej.bolivia@gmail.com'));
$port = filter_var(getenv('CHICHEJ_MAIL_PORT') ?: '587', FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1, 'max_range' => 65535],
]);
$encryption = strtolower(trim((string) (getenv('CHICHEJ_MAIL_ENCRYPTION') ?: 'tls')));

return [
    'host' => $host,
    'port' => $port === false ? 587 : $port,
    'username' => $username,
    'password' => $password,
    'encryption' => in_array($encryption, ['tls', 'ssl'], true) ? $encryption : 'tls',
    'from_address' => $fromAddress,
    'from_name' => trim((string) (getenv('CHICHEJ_MAIL_FROM_NAME') ?: 'Sitio web CHICHEJ')),
    'to_address' => $toAddress,
    'configured' => $host !== '' && $username !== '' && $password !== ''
        && filter_var($fromAddress, FILTER_VALIDATE_EMAIL) !== false
        && filter_var($toAddress, FILTER_VALIDATE_EMAIL) !== false,
];
