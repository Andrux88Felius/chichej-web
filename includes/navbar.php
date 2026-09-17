<?php
$activePage = $activePage ?? '';
require_once __DIR__ . '/auth.php';
$navUser = currentUser();
if ($navUser !== null) {
    $firebaseAuthModule = true;
}
$navAvatarName = $navUser !== null ? basename(is_scalar($navUser['avatar'] ?? null) ? (string)$navUser['avatar'] : 'invitado.png') : '';
$navAvatarUrl = $basePath . 'assets/img/avatares/' . (preg_match('/^avatar[1-9]\.png$/', $navAvatarName) ? $navAvatarName : 'invitado.png');
?>
<header class="site-header" data-header>
    <div class="container nav-wrap">
        <a class="brand" href="<?= $basePath ?>index.php" aria-label="CHICHEJ, inicio">
            <img src="<?= $basePath ?>assets/img/logo-chichej.png" alt="" width="520" height="480">
            <span>CHICHEJ<small>Tradición & innovación</small></span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span></span><span></span><span></span><span class="sr-only">Abrir menú</span></button>
        <nav class="main-nav" id="main-nav" aria-label="Navegación principal">
            <a class="<?= $activePage === 'inicio' ? 'is-active' : '' ?>" href="<?= $basePath ?>index.php">Inicio</a>
            <a class="<?= $activePage === 'nosotros' ? 'is-active' : '' ?>" href="<?= $basePath ?>nosotros.php">Nosotros</a>
            <a class="<?= $activePage === 'productos' ? 'is-active' : '' ?>" href="<?= $basePath ?>productos.php">Productos</a>
            <a href="<?= $basePath ?>productos.php#promociones">Promociones</a>
            <a class="<?= $activePage === 'dispensar' ? 'is-active' : '' ?>" href="<?= $basePath ?>dispensar.php">Dispensar</a>
            <a href="<?= $basePath ?>usuario/reservas.php">Reservas</a>
            <a class="nav-app-link" href="<?= $basePath ?>index.php#descargar-app">Descargar app</a>
            <a class="<?= $activePage === 'contacto' ? 'is-active' : '' ?>" href="<?= $basePath ?>contacto.php">Contacto</a>
            <a class="<?= $activePage === 'info' ? 'is-active' : '' ?>" href="<?= $basePath ?>info.php">Información</a>
            <?php if ($navUser !== null): ?>
                <span class="nav-role-links" aria-label="Accesos de cuenta">
                    <?php if (isAdmin()): ?>
                        <a href="<?= $basePath ?>admin/index.php">Panel administrativo</a>
                        <a href="<?= $basePath ?>usuario/perfil.php">Mi perfil</a>
                    <?php else: ?>
                        <a href="<?= $basePath ?>usuario/index.php">Mi cuenta</a>
                        <a href="<?= $basePath ?>usuario/perfil.php">Perfil</a>
                        <a href="<?= $basePath ?>usuario/pedidos.php">Mis pedidos</a>
                        <a href="<?= $basePath ?>usuario/reservas.php">Mis reservas</a>
                    <?php endif; ?>
                </span>
            <?php endif; ?>
        </nav>
        <?php if ($navUser === null): ?>
            <a class="nav-login" href="<?= $basePath ?>login.php"><span>Acceder</span><b aria-hidden="true">↗</b></a>
        <?php else: ?>
            <div class="nav-account">
                <a href="<?= $basePath ?><?= isAdmin() ? 'admin/index.php' : 'usuario/index.php' ?>" title="<?= isAdmin() ? 'Panel administrativo' : 'Mi cuenta CHICHEJ' ?>" aria-label="<?= isAdmin() ? 'Abrir Panel administrativo' : 'Abrir Mi cuenta CHICHEJ' ?>"><span><?= isAdmin() ? 'Panel administrativo' : 'Mi cuenta' ?></span><b><img src="<?= htmlspecialchars($navAvatarUrl, ENT_QUOTES, 'UTF-8') ?>" alt=""></b></a>
                <form class="nav-logout" action="<?= $basePath ?>logout.php" method="post" data-firebase-logout><input type="hidden" name="csrf_token" value="<?= htmlspecialchars(chichejCsrfToken()) ?>"><button type="submit">Cerrar sesión</button></form>
            </div>
        <?php endif; ?>
    </div>
</header>
