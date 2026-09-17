<?php
$pageTitle = 'Inicio';
$activePage = 'inicio';
$basePath = '';
require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/navbar.php';
?>

<main id="contenido">
    <section class="hero" id="inicio">
        <div class="container hero__grid">
            <div class="hero__content reveal">
                <span class="eyebrow"><span class="eyebrow__dot"></span> Tradición andina, visión de futuro</span>
                <h1>El sabor que nace de nuestra <em>tierra.</em></h1>
                <p>Descubre bebidas con identidad boliviana, elaboradas a partir de maíz y saberes que conectan generaciones.</p>
                <div class="hero__actions">
                    <a class="button button--primary" href="productos.php">Explorar productos <span aria-hidden="true">→</span></a>
                    <a class="button button--ghost" href="nosotros.php">Conoce nuestra historia</a>
                </div>
                <div class="hero__facts" aria-label="Atributos de CHICHEJ">
                    <span><strong>100%</strong> identidad local</span>
                    <span><strong>6</strong> presentaciones</span>
                    <span><strong>24/7</strong> dispensado inteligente</span>
                </div>
            </div>
            <div class="hero__visual reveal">
                <div class="hero__halo"></div>
                <img class="hero__bottle" src="assets/img/productos/1000ml.png" alt="Bebida CHICHEJ Reserva Especial" width="1254" height="1254">
                <div class="floating-card floating-card--top"><span class="status-dot"></span><div><small>Calidad de origen</small><strong>Tradición auténtica</strong></div></div>
                <div class="floating-card floating-card--bottom"><span class="floating-card__icon">✦</span><div><small>Experiencia CHICHEJ</small><strong>Hecha para compartir</strong></div></div>
            </div>
        </div>
        <div class="hero__scroll" aria-hidden="true">Descubrir <span>↓</span></div>
    </section>

    <section class="section section--cream" id="nosotros">
        <div class="container split">
            <div class="story-visual reveal">
                <img src="assets/img/maserado1.jpeg" alt="Vaso de bebida tradicional CHICHEJ junto a granos andinos" loading="lazy">
                <div class="story-visual__seal"><strong>Origen</strong><span>Bolivia</span></div>
            </div>
            <div class="section-copy reveal">
                <span class="eyebrow">Nuestra esencia</span>
                <h2>Una historia que se sirve en cada vaso.</h2>
                <p class="lead">CHICHEJ reinterpreta una bebida ancestral con una propuesta contemporánea, cuidando el vínculo entre comunidad, cultura e innovación.</p>
                <div class="feature-list">
                    <article><span>01</span><div><h3>Raíces vivas</h3><p>Saberes tradicionales y materias primas que hablan de nuestro origen.</p></div></article>
                    <article><span>02</span><div><h3>Innovación responsable</h3><p>Una experiencia moderna preparada para nuevos canales y formatos.</p></div></article>
                </div>
                <a class="text-link" href="nosotros.php">Conocer más sobre CHICHEJ <span>↗</span></a>
            </div>
        </div>
    </section>

    <section class="section" id="productos">
        <div class="container">
            <div class="section-heading reveal"><div><span class="eyebrow">Colección CHICHEJ</span><h2>Elige tu presentación.</h2></div><a class="text-link" href="productos.php">Ver catálogo completo <span>→</span></a></div>
            <div class="product-grid">
                <?php
                $products = [
                    ['1000ml.png', 'Reserva especial', '1.000 ml', 'La presentación ideal para compartir alrededor de una buena mesa.'],
                    ['500ml.png', 'Formato personal', '500 ml', 'Equilibrio perfecto para disfrutar el sabor de CHICHEJ.'],
                    ['250ml.png', 'Esencia CHICHEJ', '250 ml', 'Una porción práctica, intensa y lista para acompañarte.'],
                ];
                foreach ($products as $i => $product): ?>
                    <article class="product-card reveal">
                        <div class="product-card__media"><span class="product-card__number">0<?= $i + 1 ?></span><img src="assets/img/productos/<?= htmlspecialchars($product[0]) ?>" alt="<?= htmlspecialchars($product[1]) ?> CHICHEJ de <?= htmlspecialchars($product[2]) ?>" loading="lazy"></div>
                        <div class="product-card__body"><div><span><?= htmlspecialchars($product[2]) ?></span><h3><?= htmlspecialchars($product[1]) ?></h3></div><p><?= htmlspecialchars($product[3]) ?></p><a href="productos.php" aria-label="Ver <?= htmlspecialchars($product[1]) ?>">↗</a></div>
                    </article>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <section class="section benefits">
        <div class="container">
            <div class="benefits__intro reveal"><span class="eyebrow eyebrow--light">Por qué CHICHEJ</span><h2>Mucho más que una bebida.</h2><p>Una plataforma pensada para conectar producto, cultura y tecnología en una experiencia confiable.</p></div>
            <div class="benefits__grid">
                <article class="reveal"><span class="benefit-icon">✦</span><h3>Identidad</h3><p>Una marca inspirada en el patrimonio gastronómico andino.</p></article>
                <article class="reveal"><span class="benefit-icon">◎</span><h3>Cercanía</h3><p>Canales simples para comprar, reservar y volver a elegir.</p></article>
                <article class="reveal"><span class="benefit-icon">⌁</span><h3>Tecnología</h3><p>Preparada para integrar dispensado y monitoreo inteligente.</p></article>
                <article class="reveal"><span class="benefit-icon">♲</span><h3>Evolución</h3><p>Una experiencia escalable para clientes y aliados comerciales.</p></article>
            </div>
        </div>
    </section>

    <section class="section section--cream promotions-showcase" id="promociones">
        <div class="container">
            <div class="promotions-showcase__heading reveal"><div><span class="eyebrow">Momentos CHICHEJ</span><h2>Celebramos lo nuestro.</h2></div><div><p>Explora campañas creadas con identidad CHICHEJ. La vigencia se conectará posteriormente con los datos reales de promociones.</p><a class="text-link" href="productos.php#promociones">Ver catálogo y beneficios <span>→</span></a></div></div>
            <div class="reveal"><?php require __DIR__ . '/includes/promotions-carousel.php'; ?></div>
        </div>
    </section>

    <section class="section app-download" id="descargar-app">
        <div class="container app-download__card reveal">
            <div class="app-download__visual">
                <div class="app-device"><img src="assets/img/icon/logo_icon_foreground_android.png" alt="Aplicación Android CHICHEJ" loading="lazy"><span>CHICHEJ</span></div>
                <span class="app-download__badge">Android</span>
            </div>
            <div class="app-download__content"><span class="eyebrow eyebrow--light">Aplicación oficial para Android</span><h2>Descarga la app CHICHEJ</h2><p>Lleva la experiencia CHICHEJ contigo. Obtén directamente el APK de la versión actual desde el canal oficial de lanzamientos.</p><div class="app-meta"><span><small>Versión actual</small><strong>1.0.0</strong></span><span><small>Plataforma</small><strong>Android</strong></span></div><div class="app-download__actions"><a class="button button--download" href="https://github.com/Andrux88Felius/CHICHEJ/releases/latest/download/CHICHEJ-v1.0.0.apk" target="_blank" rel="noopener noreferrer" download>Descargar APK <span>↓</span></a><div class="app-qr-placeholder" aria-label="Espacio reservado para el QR oficial de descarga"><span aria-hidden="true">▦</span><div><small>QR de descarga</small><strong>Próximamente</strong></div></div></div></div>
        </div>
    </section>

    <section class="section section--cream business-section" id="negocios">
        <div class="container">
            <div class="section-heading reveal"><div><span class="eyebrow">Soluciones CHICHEJ</span><h2>CHICHEJ para negocios.</h2></div><span class="availability-tag">Consultar disponibilidad</span></div>
            <div class="business-grid">
                <div class="business-media reveal"><img src="assets/img/pedidos.png" alt="Ecosistema comercial CHICHEJ" loading="lazy"><div><small>Una solución integral</small><strong>Producto + tecnología + gestión</strong></div></div>
                <div class="business-content reveal"><p class="lead">Una propuesta preparada para negocios que buscan ofrecer CHICHEJ con una operación moderna, medible y escalable.</p><div class="business-features"><article><span>01</span><div><h3>Dispensador inteligente</h3><p>Interfaz de operación, disponibilidad y seguimiento.</p></div></article><article><span>02</span><div><h3>Ecosistema digital</h3><p>Aplicación, plataforma web y administración en una experiencia conectada.</p></div></article><article><span>03</span><div><h3>Gestión y reportes</h3><p>Preparado para pedidos, monitoreo, estadísticas y reportes operativos.</p></div></article><article><span>04</span><div><h3>Acompañamiento</h3><p>Espacio previsto para instalación, modalidades y propuesta comercial.</p></div></article></div><div class="business-actions"><a class="button button--primary" href="https://wa.me/59177271557?text=Hola%20CHICHEJ%2C%20deseo%20informaci%C3%B3n%20sobre%20el%20sistema%20para%20negocios." target="_blank" rel="noopener noreferrer">Solicitar información por WhatsApp</a><a class="text-link" href="contacto.php">Contacto comercial <span>→</span></a></div></div>
            </div>
        </div>
    </section>

    <section class="section multimedia-section" id="chichej-en-accion">
        <div class="container">
            <div class="section-heading reveal"><div><span class="eyebrow">Proyecto y demostraciones</span><h2>CHICHEJ en acción.</h2><p>Galería preparada para incorporar únicamente fotografías y videos oficiales del proyecto.</p></div></div>
            <div class="media-grid" aria-label="Galería multimedia futura">
                <article class="media-slot media-slot--featured reveal" data-media-source="pending"><div class="media-slot__icon">▶</div><span>Demostración principal</span><h3>Dispensador automático</h3><p>Espacio para video oficial del equipo funcionando.</p></article>
                <article class="media-slot reveal" data-media-source="pending"><div class="media-slot__icon">▣</div><span>Experiencia digital</span><h3>Pedido desde la app</h3><p>Demostración real pendiente.</p></article>
                <article class="media-slot reveal" data-media-source="pending"><div class="media-slot__icon">⌁</div><span>Sistema embebido</span><h3>ESP32 y monitoreo</h3><p>Material técnico pendiente.</p></article>
                <article class="media-slot reveal" data-media-source="pending"><div class="media-slot__icon">◎</div><span>Administración</span><h3>Panel y reportes</h3><p>Recorrido oficial pendiente.</p></article>
                <article class="media-slot reveal" data-media-source="pending"><div class="media-slot__icon">□</div><span>Proyecto</span><h3>Prototipo y elaboración</h3><p>Fotografías reales pendientes.</p></article>
                <article class="media-slot reveal" data-media-source="pending"><div class="media-slot__icon">✦</div><span>Comunidad</span><h3>Expo Feria 2026</h3><p>Fotografías y demostraciones pendientes.</p></article>
            </div>
            <div class="media-section-footer"><p class="media-note">No se muestran videos ficticios. La estructura admite posteriormente URLs oficiales de video y fotografía sin rediseñar la sección.</p><a class="text-link text-link--light" href="nosotros.php#feria-chelito-2026">Conocer la participación en feria <span>→</span></a></div>
        </div>
    </section>

    <section class="section cta-section">
        <div class="container cta-card reveal"><div><span class="eyebrow eyebrow--light">Tu experiencia comienza aquí</span><h2>CHICHEJ, más cerca de ti.</h2><p>Crea tu cuenta para preparar futuras reservas, pedidos y beneficios exclusivos.</p></div><div class="cta-card__actions"><a class="button button--light" href="registro.php">Crear mi cuenta</a><a class="button button--outline-light" href="dispensar.php">Ir a dispensar</a></div></div>
    </section>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
