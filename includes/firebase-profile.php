<?php
declare(strict_types=1);

function chichejProfileRole(array $profile): string
{
    return trim(is_scalar($profile['rol'] ?? null) ? (string) $profile['rol'] : '');
}

function chichejProfileIsBlocked(array $profile): bool
{
    if (!array_key_exists('bloqueado', $profile) || $profile['bloqueado'] === null || $profile['bloqueado'] === '') return false;
    $value = $profile['bloqueado'];
    if ($value === true || $value === 1 || $value === '1') return true;
    if ($value === false || $value === 0 || $value === '0') return false;
    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if ($normalized === 'true') return true;
        if ($normalized === 'false') return false;
    }
    return true;
}

function chichejProfileAtUid(object $database, string $uid): ?array
{
    if (!preg_match('/^[A-Za-z0-9_-]{1,128}$/', $uid)) return null;
    $profile = $database->getReference('usuarios/' . $uid)->getValue();
    return is_array($profile) ? $profile : null;
}
