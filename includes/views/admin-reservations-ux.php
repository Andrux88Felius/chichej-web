<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth.php';
requireAdmin('../login.php', '../usuario/index.php');
require_once __DIR__ . '/../firebase-data.php';
require_once __DIR__ . '/../reservations.php';

$basePath = '../';
$adminScripts = true;
$reservationScripts = true;
$adminActive = 'reservas';
$pageTitle = 'Administración · Reservas';
$records = array_values(array_filter(firebaseRead(fn(FirebaseReadService $firebase) => $firebase->collection('reservas')), 'is_array'));
usort($records, fn($a, $b) => (firebaseDate($b['fechaCreacion'] ?? $b['fechaSolicitada'] ?? null)?->getTimestamp() ?? 0) <=> (firebaseDate($a['fechaCreacion'] ?? $a['fechaSolicitada'] ?? null)?->getTimestamp() ?? 0));
$statuses = [];
foreach ($records as $record) {
    $value = reservationCanonicalState($record['estado'] ?? null) ?? trim((string) ($record['estado'] ?? ''));
    if ($value !== '') $statuses[$value] = reservationStateLabel($record['estado'] ?? null);
}

require __DIR__ . '/../header.php';
require __DIR__ . '/../navbar.php';
require __DIR__ . '/../admin-nav.php';
?>
<main id="contenido" class="admin-page" data-reservation-admin data-endpoint="../api/admin/reservations/update-status.php" data-csrf="<?= h(chichejCsrfToken()) ?>">
    <section class="admin-head admin-head--with-nav"><div class="container"><div><span class="eyebrow eyebrow--light">Administración · Gestión segura</span><h1>Reservas</h1><p>Consulta y cambia estados con trazabilidad administrativa.</p></div><span class="status-pill <?= firebaseReadFailed() ? 'status-pill--idle' : 'status-pill--active' ?>">● <?= firebaseReadFailed() ? 'Sin datos' : 'Firebase activo' ?></span></div></section>
    <section class="section section--cream"><div class="container"><section class="admin-data" data-filter-scope>
        <div class="admin-filterbar"><label class="admin-search">Buscar<input type="search" data-filter-search placeholder="Cliente, teléfono, ID, lugar…"></label><label>Estado<select data-filter-key="status"><option value="">Todos</option><?php foreach ($statuses as $value => $label): ?><option value="<?= h($value) ?>"><?= h($label) ?></option><?php endforeach; ?></select></label><span data-filter-count><?= count($records) ?> registros</span></div>
        <?php if (!$records): ?><div class="empty-state"><span>◇</span><h2>Sin reservas</h2><p>No hay documentos disponibles en Firestore.</p></div><?php else: ?><div class="admin-scroll-list reservation-admin-list" role="region" aria-label="Listado de reservas" tabindex="0">
        <?php foreach ($records as $record):
            $reservationId = (string) ($record['reservaId'] ?? $record['_id'] ?? '');
            $canonicalState = reservationCanonicalState($record['estado'] ?? null);
            $filterState = $canonicalState ?? trim((string) ($record['estado'] ?? ''));
            $place = trim((string) ($record['lugarEvento'] ?? $record['direccion'] ?? ''));
            $search = implode(' ', [$reservationId, $record['nombreCliente'] ?? '', $record['correoCliente'] ?? $record['email'] ?? '', $record['telefono'] ?? '', $record['detalle'] ?? '', $place, $record['direccion'] ?? '', $record['referenciasLugar'] ?? '', $record['observaciones'] ?? '', $filterState]);
        ?>
            <article class="admin-row reservation-admin-card" data-filter-row data-search="<?= h($search) ?>" data-status="<?= h($filterState) ?>">
                <div class="reservation-admin-card__summary"><small><?= h($reservationId !== '' ? $reservationId : 'Sin ID') ?></small><h2><?= h($record['nombreCliente'] ?? $record['usuarioId'] ?? 'Cliente') ?></h2><p><?= h($record['detalle'] ?? 'Reserva CHICHEJ') ?></p></div>
                <dl><div><dt>Estado</dt><dd data-reservation-state-label><?= h(reservationStateLabel($record['estado'] ?? null)) ?></dd></div><div><dt>Fecha solicitada</dt><dd><?= h(displayDate($record['fechaSolicitada'] ?? null)) ?></dd></div><div><dt>Cantidad</dt><dd><?= h($record['cantidadSolicitada'] ?? $record['cantidad'] ?? 'Sin datos') ?></dd></div><div><dt>Teléfono</dt><dd><?= h($record['telefono'] ?? 'Sin datos') ?></dd></div><div><dt>Correo</dt><dd><?= h($record['correoCliente'] ?? $record['email'] ?? 'Sin datos') ?></dd></div><div><dt>Lugar</dt><dd><?= h($place !== '' ? $place : 'Sin datos') ?></dd></div><?php if (!empty($record['direccion'])): ?><div><dt>Dirección</dt><dd><?= h($record['direccion']) ?></dd></div><?php endif; ?><?php if (!empty($record['referenciasLugar'])): ?><div><dt>Referencia</dt><dd><?= h($record['referenciasLugar']) ?></dd></div><?php endif; ?><?php if (!empty($record['observaciones'])): ?><div><dt>Observaciones</dt><dd><?= h($record['observaciones']) ?></dd></div><?php endif; ?></dl>
                <div class="reservation-action-buttons">
                    <?php if ($reservationId !== '' && reservationTransitionAllowed($record['estado'] ?? null, 'aceptar', true)): ?><button class="button button--primary" type="button" data-reservation-admin-action="aceptar" data-reservation-id="<?= h($reservationId) ?>">Aceptar</button><?php endif; ?>
                    <?php if ($reservationId !== '' && reservationTransitionAllowed($record['estado'] ?? null, 'rechazar', true)): ?><button class="button button--ghost" type="button" data-reservation-admin-action="rechazar" data-reservation-id="<?= h($reservationId) ?>">Rechazar</button><?php endif; ?>
                    <?php if ($reservationId !== '' && reservationTransitionAllowed($record['estado'] ?? null, 'cancelar', true)): ?><button class="button button--ghost" type="button" data-reservation-admin-action="cancelar" data-reservation-id="<?= h($reservationId) ?>">Cancelar</button><?php endif; ?>
                    <?php if ($reservationId === '' || (!$canonicalState || (!reservationTransitionAllowed($record['estado'] ?? null, 'aceptar', true) && !reservationTransitionAllowed($record['estado'] ?? null, 'cancelar', true)))): ?><span>Sin acciones disponibles</span><?php endif; ?>
                </div><p class="form-status" data-reservation-status role="status" aria-live="polite"></p>
            </article>
        <?php endforeach; ?></div><p class="admin-filter-empty" data-filter-empty hidden>No hay reservas que coincidan con los filtros.</p><?php endif; ?>
    </section></div></section>
</main>
<?php require __DIR__ . '/../footer.php'; ?>
