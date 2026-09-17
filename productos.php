<?php
require __DIR__ . '/includes/views/products-live.php'; return;
$pageTitle = 'Productos'; $activePage = 'productos'; $basePath = '';
require __DIR__ . '/includes/header.php'; require __DIR__ . '/includes/navbar.php';
$catalog = [['1000ml.png','1.000 ml','Reserva familiar'],['750ml.png','750 ml','Para compartir'],['500ml.png','500 ml','Formato personal'],['250ml.png','250 ml','Esencia CHICHEJ'],['150ml.png','150 ml','Sabor compacto'],['45ml.png','45 ml','Degustación']];
?>
<main id="contenido">
    <section class="page-hero page-hero--products"><div class="container"><span class="eyebrow eyebrow--light">Nuestro catálogo</span><h1>Un tamaño para cada <em>momento.</em></h1><p>Explora las presentaciones CHICHEJ. La disponibilidad y compra en línea se habilitarán en una próxima etapa.</p></div></section>
    <section class="section"><div class="container"><div class="catalog-grid"><?php foreach ($catalog as $i => $item): ?><article class="catalog-card reveal"><div class="catalog-card__image"><span><?= str_pad((string)($i+1),2,'0',STR_PAD_LEFT) ?></span><img src="assets/img/productos/<?= htmlspecialchars($item[0]) ?>" alt="CHICHEJ <?= htmlspecialchars($item[1]) ?>" loading="lazy"></div><div><small><?= htmlspecialchars($item[1]) ?></small><h2><?= htmlspecialchars($item[2]) ?></h2><p>Presentación de la línea CHICHEJ, preparada para integrarse al catálogo comercial.</p><button class="text-link" type="button" data-notify="Próximamente podrás consultar disponibilidad.">Consultar disponibilidad <span>→</span></button></div></article><?php endforeach; ?></div></div></section>
    <section class="section section--cream promotions-showcase" id="promociones"><div class="container"><div class="promotions-showcase__heading"><div><span class="eyebrow">Promociones</span><h2>Beneficios con identidad.</h2></div><div><p>Campañas reales disponibles en los recursos CHICHEJ. Su estado y vigencia se conectarán posteriormente con el sistema de promociones.</p><a class="text-link" href="registro.php">Quiero enterarme <span>→</span></a></div></div><?php require __DIR__ . '/includes/promotions-carousel.php'; ?></div></section>
</main>
<?php require __DIR__ . '/includes/footer.php'; ?>
