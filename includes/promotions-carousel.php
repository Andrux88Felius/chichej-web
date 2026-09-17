<?php
/**
 * Carrusel visual de campañas existentes.
 * Integración futura: reemplazar $promotions por datos reales y ordenar primero
 * el registro cuyo estado sea "activo". Agosto permanece primero porque era la
 * campaña destacada en la portada antes de este pase, no por vigencia asumida.
 */
$promotions = [
    ['asset' => 'agosto.png', 'month' => 'Agosto', 'featured' => true],
    ['asset' => 'septiembre.png', 'month' => 'Septiembre', 'featured' => false],
    ['asset' => 'julio.png', 'month' => 'Julio', 'featured' => false],
    ['asset' => 'junio.png', 'month' => 'Junio', 'featured' => false],
    ['asset' => 'mayo.png', 'month' => 'Mayo', 'featured' => false],
    ['asset' => 'abril.png', 'month' => 'Abril', 'featured' => false],
    ['asset' => 'marzo.png', 'month' => 'Marzo', 'featured' => false],
    ['asset' => 'febrero.png', 'month' => 'Febrero', 'featured' => false],
    ['asset' => 'enero.png', 'month' => 'Enero', 'featured' => false],
    ['asset' => 'octubre.png', 'month' => 'Octubre', 'featured' => false],
    ['asset' => 'noviembre.png', 'month' => 'Noviembre', 'featured' => false],
    ['asset' => 'diciembre.png', 'month' => 'Diciembre', 'featured' => false],
];
?>
<div class="promotion-carousel" data-carousel aria-roledescription="carrusel" aria-label="Campañas CHICHEJ">
    <div class="promotion-carousel__viewport">
        <div class="promotion-carousel__track" data-carousel-track>
            <?php foreach ($promotions as $index => $promotion): ?>
                <article class="promotion-slide<?= $index === 0 ? ' is-active' : '' ?>" data-carousel-slide data-featured="<?= $promotion['featured'] ? 'true' : 'false' ?>" aria-hidden="<?= $index === 0 ? 'false' : 'true' ?>" aria-label="<?= $index + 1 ?> de <?= count($promotions) ?>">
                    <div class="promotion-slide__media"><img src="<?= $basePath ?>assets/img/promos/<?= htmlspecialchars($promotion['asset']) ?>" alt="Campaña CHICHEJ de <?= htmlspecialchars($promotion['month']) ?>" <?= $index === 0 ? '' : 'loading="lazy"' ?>></div>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
    <div class="promotion-carousel__controls">
        <div class="promotion-carousel__arrows">
            <button type="button" data-carousel-prev aria-label="Ver promoción anterior">←</button>
            <button type="button" data-carousel-next aria-label="Ver promoción siguiente">→</button>
        </div>
        <div class="promotion-carousel__dots" data-carousel-dots aria-label="Seleccionar promoción">
            <?php foreach ($promotions as $index => $promotion): ?><button type="button" class="<?= $index === 0 ? 'is-active' : '' ?>" data-carousel-dot="<?= $index ?>" aria-label="Ir a la promoción <?= $index + 1 ?>" aria-current="<?= $index === 0 ? 'true' : 'false' ?>"></button><?php endforeach; ?>
        </div>
        <span class="promotion-carousel__count"><b data-carousel-current>01</b> / <?= str_pad((string)count($promotions), 2, '0', STR_PAD_LEFT) ?></span>
    </div>
    <p class="promotion-carousel__status sr-only" data-carousel-status aria-live="polite">Promoción 1 de <?= count($promotions) ?></p>
</div>
