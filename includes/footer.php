<footer class="site-footer">
    <div class="container footer-grid">
        <div class="footer-brand"><a class="brand brand--footer" href="<?= $basePath ?>index.php"><img src="<?= $basePath ?>assets/img/logo-chichej.png" alt="" width="520" height="480"><span>CHICHEJ<small>Tradición & innovación</small></span></a><p>Una experiencia boliviana que une tradición, sabor y tecnología.</p><div class="socials"><a href="https://www.facebook.com/share/19654KdARH" target="_blank" rel="noopener noreferrer" aria-label="Facebook oficial de CHICHEJ"><img src="<?= $basePath ?>assets/img/redes-ico/Facebook_Logo_Primary.png" alt=""></a><a href="https://www.instagram.com/chichejwinapu" target="_blank" rel="noopener noreferrer" aria-label="Instagram oficial de CHICHEJ"><img src="<?= $basePath ?>assets/img/redes-ico/Instagram_Glyph_Gradient.png" alt=""></a><a href="https://www.tiktok.com/@chichej.wiapu" target="_blank" rel="noopener noreferrer" aria-label="TikTok oficial de CHICHEJ"><img src="<?= $basePath ?>assets/img/redes-ico/TikTok_Icon_Black_Circle.png" alt=""></a><a class="social-link social-link--whatsapp" href="https://wa.me/59177271557" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp oficial de CHICHEJ"><img src="<?= $basePath ?>assets/img/redes-ico/Digital_Glyph_Green_RGB_2026.png" alt=""></a></div></div>
        <div><h2>Explora</h2><a href="<?= $basePath ?>nosotros.php">Nosotros</a><a href="<?= $basePath ?>productos.php">Productos</a><a href="<?= $basePath ?>productos.php#promociones">Promociones</a><a href="<?= $basePath ?>dispensar.php">Dispensar</a><a href="<?= $basePath ?>info.php">Información del proyecto</a><a class="footer-app-link" href="<?= $basePath ?>index.php#descargar-app">Descargar app Android</a></div>
        <div><h2>Tu cuenta</h2><a href="<?= $basePath ?>login.php">Iniciar sesión</a><a href="<?= $basePath ?>registro.php">Registrarse</a><a href="<?= $basePath ?>usuario/reservas.php">Reservas</a><a href="<?= $basePath ?>usuario/pedidos.php">Pedidos</a></div>
        <div><h2>Contacto</h2><a href="tel:+59173085467">Gerencia: 73085467</a><a href="https://wa.me/59177271557" target="_blank" rel="noopener noreferrer">WhatsApp: 77271557</a><a href="<?= $basePath ?>contacto.php">Formulario de contacto</a></div>
    </div>
    <div class="container footer-bottom"><span>© <?= date('Y') ?> CHICHEJ. Todos los derechos reservados.</span><span>Hecho con identidad boliviana <i>◆</i></span></div>
</footer>
<aside class="sound-player" data-sound-player aria-label="Identidad sonora CHICHEJ">
    <audio data-audio preload="metadata" src="<?= $basePath ?>assets/img/audio/wiñapu1.mp3"></audio>
    <div class="sound-player__info"><span aria-hidden="true">♫</span><div><small>Identidad sonora</small><strong data-track-name>Wiñapu 1</strong></div></div>
    <select data-track-select aria-label="Seleccionar pista CHICHEJ">
        <option value="<?= $basePath ?>assets/img/audio/wiñapu1.mp3">Wiñapu 1</option>
        <option value="<?= $basePath ?>assets/img/audio/wiñapu2.mp3">Wiñapu 2</option>
    </select>
    <button type="button" data-audio-toggle aria-label="Reproducir música" aria-pressed="false"><span data-audio-icon>▶</span></button>
    <button type="button" data-audio-mute aria-label="Silenciar música" aria-pressed="false"><span data-mute-icon>♪</span></button>
</aside>
<script src="<?= $basePath ?>assets/js/app.js"></script>
<?php if (($adminScripts ?? false) === true): ?><script src="<?= $basePath ?>assets/js/admin.js"></script><?php endif; ?>
<?php if (($reservationScripts ?? false) === true): ?><script src="<?= $basePath ?>assets/js/reservations.js"></script><?php endif; ?>
<?php if (($productScripts ?? false) === true): ?><script src="<?= $basePath ?>assets/js/products-admin.js"></script><?php endif; ?>
<?php if (($firebaseAuthModule ?? false) === true):
    $publicFirebase = require __DIR__ . '/../config/firebase.php';
?>
<script type="application/json" id="firebase-public-config"><?= json_encode([
    'enabled' => $publicFirebase['authentication_enabled'],
    'client' => $publicFirebase['client'],
], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES) ?></script>
<script type="module" src="<?= $basePath ?>assets/js/firebase-auth.js"></script>
<?php endif; ?>
</body>
</html>
