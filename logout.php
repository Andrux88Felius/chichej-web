<?php
declare(strict_types=1);

require_once __DIR__ . '/config/session.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    header('Location: index.php', true, 303);
    exit;
}

if (!verifyChichejCsrfToken($_POST['csrf_token'] ?? null)) {
    // No cerrar una sesión sin validar su origen. Evitamos exponer un error
    // técnico y devolvemos al usuario a una ruta segura.
    http_response_code(403);
    header('Location: index.php', true, 303);
    exit;
}
destroyChichejSession();
header('Location: index.php', true, 303);
exit;
