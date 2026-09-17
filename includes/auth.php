<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';

function currentUser(): ?array
{
    startChichejSession();
    $user = $_SESSION['auth_user'] ?? null;

    if (!is_array($user) || empty($user['uid']) || empty($user['role'])) {
        return null;
    }

    return $user;
}

function isAuthenticated(): bool
{
    return currentUser() !== null;
}

function isAdmin(): bool
{
    $user = currentUser();
    return $user !== null && in_array($user['role'], ['admin', 'admin_principal'], true);
}

function requireUser(string $loginPath = '../login.php'): void
{
    if (isAuthenticated()) {
        return;
    }

    header('Location: ' . $loginPath . '?reason=authentication_required', true, 302);
    exit;
}

function requireAdmin(string $loginPath = '../login.php', string $userPath = '../usuario/index.php'): void
{
    $user = currentUser();
    if ($user === null) {
        header('Location: ' . $loginPath . '?reason=authentication_required', true, 302);
        exit;
    }

    if (!in_array($user['role'], ['admin', 'admin_principal'], true)) {
        header('Location: ' . $userPath . '?reason=insufficient_role', true, 302);
        exit;
    }
}

/**
 * Único punto autorizado para crear la sesión después de verificar el ID token
 * Firebase y leer el perfil real en el servidor. No debe llamarse con datos del
 * navegador sin verificación criptográfica previa.
 */
function establishVerifiedSession(array $verifiedProfile): void
{
    $allowedRoles = ['cliente', 'admin', 'admin_principal'];
    $uid = trim((string)($verifiedProfile['uid'] ?? ''));
    $role = (string)($verifiedProfile['role'] ?? '');

    if ($uid === '' || ($verifiedProfile['blocked'] ?? true) === true || !in_array($role, $allowedRoles, true)) {
        throw new RuntimeException('El perfil verificado no está autorizado.');
    }

    startChichejSession();
    session_regenerate_id(true);
    $_SESSION['auth_user'] = [
        'uid' => $uid,
        'name' => (string)($verifiedProfile['name'] ?? 'Usuario'),
        'email' => (string)($verifiedProfile['email'] ?? ''),
        'role' => $role,
        'avatar' => (string)($verifiedProfile['avatar'] ?? 'assets/avatares/invitado.png'),
    ];
}

function updateCurrentSessionProfile(string $name, string $avatar): void
{
    startChichejSession();
    if (!isset($_SESSION['auth_user']) || !is_array($_SESSION['auth_user'])) return;
    $_SESSION['auth_user']['name'] = $name;
    $_SESSION['auth_user']['avatar'] = $avatar;
}
