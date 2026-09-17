<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth.php';
requireUser('../login.php');
require_once __DIR__ . '/../firebase-data.php';
require_once __DIR__ . '/../reservations.php';

$user = currentUser();
$uid = (string) $user['uid'];
$basePath = '../';
$adminScripts = true;
$reservationScripts = true;
$pageTitle = 'Mis reservas';
$raw = firebaseRead(fn(FirebaseReadService $firebase) => $firebase->collection('reservas'));
$records = array_values(array_filter($raw, fn($record) => is_array($record) && (string) ($record['usuarioId'] ?? '') === $uid));
$profile = firebaseRead(fn(FirebaseReadService $firebase) => $firebase->rtdb('usuarios/' . $uid));
$profilePhone = is_array($profile) && is_scalar($profile['telefono'] ?? null) ? trim((string) $profile['telefono']) : '';
usort($records, fn($a, $b) => (firebaseDate($b['fechaCreacion'] ?? $b['fechaSolicitada'] ?? null)?->getTimestamp() ?? 0) <=> (firebaseDate($a['fechaCreacion'] ?? $a['fechaSolicitada'] ?? null)?->getTimestamp() ?? 0));
$now = new DateTimeImmutable('now', new DateTimeZone('America/La_Paz'));
$statuses = [];
foreach ($records as $record) {
    $state = reservationCanonicalState($record['estado'] ?? null) ?? trim((string) ($record['estado'] ?? ''));
    if ($state !== '') $statuses[$state] = reservationStateLabel($record['estado'] ?? null);
}

require __DIR__ . '/../header.php';
require __DIR__ . '/../navbar.php';
?>
<main id="contenido" class="portal">
    <section class="portal-hero portal-hero--small"><div class="container"><span class="eyebrow eyebrow--light">Área privada</span><h1>Mis reservas</h1><p>Solicita una reserva y consulta su estado con tu identidad autenticada.</p></div></section>
    <section class="section section--cream"><div class="container reservation-page-layout">
        <form class="form-card reservation-form" data-reservation-create data-endpoint="../api/user/reservations/create.php">
            <input type="hidden" name="csrf_token" value="<?= h(chichejCsrfToken()) ?>">
            <div><span class="eyebrow">Nueva solicitud</span><h2>Crear reserva</h2><p>La administración confirmará o rechazará la solicitud. Esto no garantiza disponibilidad.</p></div>
            <label>Detalle o motivo<input name="detalle" minlength="3" maxlength="300" required></label>
            <label>Fecha solicitada<input type="date" name="fechaSolicitada" min="<?= $now->format('Y-m-d') ?>" max="<?= $now->modify('+2 years')->format('Y-m-d') ?>" required></label>
            <label>Cantidad<input type="number" name="cantidadSolicitada" min="1" max="10000" required></label>
            <label>Teléfono de contacto<input type="tel" name="telefono" value="<?= h($profilePhone) ?>" minlength="7" maxlength="30" autocomplete="tel" required></label>
            <label>Lugar del evento<input name="lugarEvento" minlength="3" maxlength="160" required></label>
            <label>Dirección <small>Opcional</small><input name="direccion" maxlength="220"></label>
            <label>Referencia del lugar <small>Opcional</small><input name="referenciasLugar" maxlength="300"></label>
            <label class="reservation-form__wide">Observaciones <small>Opcional</small><textarea name="observaciones" maxlength="600" rows="4"></textarea></label>
            <button class="button button--primary" type="submit">Solicitar reserva</button>
            <p class="form-status" data-reservation-status role="status" aria-live="polite"></p>
        </form>

        <section class="user-records" data-filter-scope>
            <div class="admin-filterbar user-filterbar"><label class="admin-search">Buscar<input type="search" data-filter-search placeholder="Detalle, ID, teléfono o estado…"></label><label>Estado<select data-filter-key="status"><option value="">Todos</option><?php foreach ($statuses as $value => $label): ?><option value="<?= h($value) ?>"><?= h($label) ?></option><?php endforeach; ?></select></label><span data-filter-count><?= count($records) ?> registros</span></div>
            <?php if (!$records): ?><div class="empty-state"><span>◇</span><h2>Sin reservas registradas</h2><p>Tu primera solicitud aparecerá aquí.</p></div><?php else: ?>
            <div class="data-list user-data-scroll" tabindex="0" aria-label="Mis reservas">
                <?php foreach ($records as $record):
                    $reservationId = (string) ($record['reservaId'] ?? $record['_id'] ?? '');
                    $canonicalState = reservationCanonicalState($record['estado'] ?? null);
                    $filterState = $canonicalState ?? trim((string) ($record['estado'] ?? ''));
                    $place = trim((string) ($record['lugarEvento'] ?? $record['direccion'] ?? ''));
                    $search = implode(' ', [$reservationId, $record['detalle'] ?? '', $record['telefono'] ?? '', $filterState, $place]);
                ?>
                <article class="data-card" data-filter-row data-search="<?= h($search) ?>" data-status="<?= h($filterState) ?>">
                    <div class="data-card__head"><div><small>Reserva <?= h($reservationId !== '' ? $reservationId : 'Sin ID') ?></small><h2><?= h($record['detalle'] ?? 'Reserva CHICHEJ') ?></h2></div><span data-reservation-state-label><?= h(reservationStateLabel($record['estado'] ?? null)) ?></span></div>
                    <dl><div><dt>Fecha solicitada</dt><dd><?= h(displayDate($record['fechaSolicitada'] ?? null)) ?></dd></div><div><dt>Cantidad</dt><dd><?= h($record['cantidadSolicitada'] ?? $record['cantidad'] ?? 'Sin datos') ?></dd></div><div><dt>Teléfono</dt><dd><?= h($record['telefono'] ?? 'Sin datos') ?></dd></div><div><dt>Lugar</dt><dd><?= h($place !== '' ? $place : 'Sin datos') ?></dd></div><?php if (!empty($record['direccion'])): ?><div><dt>Dirección</dt><dd><?= h($record['direccion']) ?></dd></div><?php endif; ?><?php if (!empty($record['referenciasLugar'])): ?><div><dt>Referencia</dt><dd><?= h($record['referenciasLugar']) ?></dd></div><?php endif; ?><?php if (!empty($record['observaciones'])): ?><div><dt>Observaciones</dt><dd><?= h($record['observaciones']) ?></dd></div><?php endif; ?></dl>
                    <?php if ($reservationId !== '' && reservationTransitionAllowed($record['estado'] ?? null, 'cancelar', false)): ?><div class="reservation-card-actions"><button class="button button--ghost" type="button" data-reservation-cancel data-endpoint="../api/user/reservations/cancel.php" data-csrf="<?= h(chichejCsrfToken()) ?>" data-reservation-id="<?= h($reservationId) ?>">Cancelar reserva</button><p class="form-status" data-reservation-status role="status" aria-live="polite"></p></div><?php endif; ?>
                </article>
                <?php endforeach; ?>
            </div><p class="admin-filter-empty" data-filter-empty hidden>No hay reservas que coincidan con los filtros.</p><?php endif; ?>
        </section>
    </div></section>
</main>
<?php require __DIR__ . '/../footer.php'; ?>
