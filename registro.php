<?php require __DIR__.'/includes/views/register-ux.php'; return; ?>
<?php
$pageTitle = 'Crear cuenta'; $activePage = 'registro'; $basePath = '';
require __DIR__ . '/includes/header.php'; require __DIR__ . '/includes/navbar.php';
?>
<main id="contenido" class="auth-page"><section class="auth-shell"><div class="auth-visual auth-visual--register"><img src="assets/img/maserado4.jpeg" alt="Experiencia tradicional CHICHEJ" loading="lazy"><div><span class="eyebrow eyebrow--light">Identidad compartida</span><h1>Una sola cuenta CHICHEJ.</h1><p>La aplicación y la web compartirán usuario y rol.</p></div></div><div class="auth-panel"><a class="auth-back" href="index.php">← Volver al inicio</a><div class="auth-form-wrap"><span class="eyebrow">Registro</span><h2>Registro web pendiente</h2><div class="auth-message"><strong>No se crearán cuentas desde esta página todavía.</strong><span>Antes debe trasladarse de forma completa la creación del perfil `usuarios/{uid}` y sus valores iniciales para mantener compatibilidad con la aplicación.</span></div><p>Si ya tienes una cuenta CHICHEJ, podrás utilizarla aquí cuando la verificación segura del servidor esté habilitada.</p><a class="button button--primary button--full" href="login.php">Volver al acceso <span>→</span></a></div></div></section></main>
<?php require __DIR__ . '/includes/footer.php'; ?>
