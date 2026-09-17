<?php
declare(strict_types=1);
$pageTitle = 'Información de CHICHEJ';
$activePage = 'info';
$basePath = '';
$gustitosMapsUrl = 'https://maps.app.goo.gl/XC7yM4PesMH95kJH8';
require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/navbar.php';
?>
<main id="contenido">
    <section class="page-hero page-hero--info">
        <div class="container">
            <span class="eyebrow eyebrow--light">Proyecto académico y tecnológico</span>
            <h1>Información de <em>CHICHEJ.</em></h1>
            <p>Tradición boliviana, desarrollo de software y automatización reunidos en una propuesta aplicada.</p>
        </div>
    </section>

    <section class="section section--cream">
        <div class="container info-intro">
            <div class="info-intro__title">
                <span class="eyebrow">Proyecto CHICHEJ</span>
                <h2>Implementación de un Dispensador Automático Inteligente de Bebidas mediante Aplicación Móvil.</h2>
                <p class="lead">Proyecto de Grado para optar al título de Técnico Superior en Sistemas Informáticos.</p>
            </div>
            <dl class="project-facts">
                <div><dt>Caso de estudio</dt><dd>Restaurante Gustitos Maggi</dd></div>
                <div><dt>Ubicación</dt><dd>Calle 5, Pura Pura</dd></div>
                <div><dt>Institución</dt><dd>Instituto Tecnológico Marcelo Quiroga Santa Cruz</dd></div>
                <div><dt>Carrera</dt><dd>Sistemas Informáticos</dd></div>
            </dl>
        </div>
    </section>

    <section class="section">
        <div class="container project-people">
            <div><span class="eyebrow">Equipo académico</span><h2>Responsables del proyecto.</h2></div>
            <div class="project-people__grid">
                <article><small>Postulante</small><h3>Eduardo Jordy Zeballos Garcia</h3></article>
                <article><small>Tutor metodológico</small><h3>Mg. Sc. Marco Antonio Dorado Gómez</h3></article>
                <article><small>Tutor especialista</small><h3>Lic. Marcelo Arteaga Luna</h3></article>
            </div>
        </div>
    </section>

    <section class="section section--cream" id="documentacion">
        <div class="container">
            <div class="section-heading"><div><span class="eyebrow">Consulta pública</span><h2>Documentación del proyecto.</h2><p>Espacio preparado para publicar únicamente documentos oficiales cuando sean proporcionados.</p></div></div>
            <div class="document-grid">
                <article><span>PDF</span><h3>Perfil del Proyecto de Grado</h3><p>Documento académico oficial disponible para consulta.</p><a href="https://drive.google.com/file/d/13aJAgi47Q4AdxZfPcVAu_TrjW4qOZ8FZ/view?usp=sharing" target="_blank" rel="noopener noreferrer">Ver Perfil del Proyecto de Grado ↗</a></article>
                <article><span>DOC</span><h3>Documentación pública</h3><p>Se habilitará cuando exista material aprobado para publicación.</p><button type="button" disabled>Pendiente</button></article>
                <article><span>FERIA</span><h3>Tríptico digital CHICHEJ</h3><p>Material digital oficial del proyecto.</p><a href="https://drive.google.com/file/d/1RNBj2EYIn7vzcQzBSa4UHKonm_QgRu9Y/view?usp=sharing" target="_blank" rel="noopener noreferrer">Ver tríptico digital ↗</a></article>
                <article class="document-grid__app"><span>APK</span><h3>Aplicación Android</h3><p>Versión oficial disponible desde el canal de lanzamientos.</p><a href="https://github.com/Andrux88Felius/CHICHEJ/releases/latest/download/CHICHEJ-v1.0.0.apk" target="_blank" rel="noopener noreferrer" download>Descargar APK 1.0.0 ↓</a></article>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container thanks-card">
            <div><span class="eyebrow eyebrow--light">Caso de estudio</span><h2>Gracias, Gustitos Maggi.</h2><p>CHICHEJ agradece al Restaurante Gustitos Maggi por servir como caso de estudio para el desarrollo del proyecto.</p></div>
            <?php if ($gustitosMapsUrl !== ''): ?>
                <a class="button button--light" href="<?= htmlspecialchars($gustitosMapsUrl, ENT_QUOTES, 'UTF-8') ?>" target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps</a>
            <?php else: ?>
                <button class="button button--outline-light" type="button" disabled title="Pendiente de configurar la URL oficial">Ver ubicación · enlace pendiente</button>
            <?php endif; ?>
        </div>
    </section>
</main>
<?php require __DIR__ . '/includes/footer.php'; ?>
