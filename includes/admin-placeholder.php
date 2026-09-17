<?php
$adminSection=$adminSection??'Administración'; $adminDescription=$adminDescription??'Módulo preparado para integración futura.';
require_once __DIR__.'/auth.php'; requireAdmin('../login.php', '../usuario/index.php');
require __DIR__.'/header.php'; require __DIR__.'/navbar.php';
?>
<main id="contenido" class="admin-page"><section class="admin-head"><div class="container"><div><span class="eyebrow eyebrow--light">Administración</span><h1><?= htmlspecialchars($adminSection) ?></h1><p><?= htmlspecialchars($adminDescription) ?></p></div><a class="button button--outline-light" href="index.php">Volver al panel</a></div></section><section class="section section--cream"><div class="container narrow"><div class="empty-state"><span>⌁</span><h2>Módulo preparado</h2><p>La interfaz y los datos reales se habilitarán después de integrar autenticación, roles y servicios.</p><span class="status-pill status-pill--idle">● Sin conexión externa</span></div></div></section></main>
<?php require __DIR__.'/footer.php'; ?>
