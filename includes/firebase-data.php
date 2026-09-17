<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/FirebaseReadService.php';

function firebaseRead(callable $reader, mixed $fallback = []): mixed
{
    static $service = null;
    static $initializationFailed = false;
    if ($initializationFailed) return $fallback;
    try {
        $service ??= new FirebaseReadService();
        return $reader($service);
    } catch (Throwable) {
        $GLOBALS['chichej_firebase_read_failed'] = true;
        if ($service === null) $initializationFailed = true;
        return $fallback;
    }
}

function firebaseReadFailed(): bool { return ($GLOBALS['chichej_firebase_read_failed'] ?? false) === true; }

function normalizePeriod(mixed $value, array $allowed, string $default): string
{
    if (!in_array($default, $allowed, true)) {
        throw new InvalidArgumentException('El período predeterminado no está permitido.');
    }
    return is_string($value) && in_array($value, $allowed, true) ? $value : $default;
}

function adminPeriodBounds(string $period): array
{
    $tz = new DateTimeZone('America/La_Paz'); $now = new DateTimeImmutable('now', $tz);
    $start = match ($period) {
        'today' => $now->setTime(0, 0),
        '7days' => $now->modify('-6 days')->setTime(0, 0),
        'month' => $now->modify('first day of this month')->setTime(0, 0),
        'year' => $now->setDate((int)$now->format('Y'), 1, 1)->setTime(0, 0),
        default => null,
    };
    return [$start, $now, $tz];
}

function inAdminPeriod(mixed $value, ?DateTimeImmutable $start, DateTimeImmutable $end, DateTimeZone $tz): bool
{
    $date = firebaseDate($value);
    if (!$date) return false;
    $date = $date->setTimezone($tz);
    return ($start === null || $date >= $start) && $date <= $end;
}

function isValidSale(array $order): bool
{
    return strtolower((string)($order['estadoPago'] ?? '')) === 'aprobado'
        && strtolower((string)($order['estado'] ?? '')) !== 'cancelado'
        && strtolower((string)($order['metodoPago'] ?? '')) !== 'admin';
}

function isValidCustomerPurchase(array $order, string $uid): bool
{
    if ($uid === '' || (string)($order['usuarioId'] ?? '') !== $uid || !isValidSale($order)) return false;
    $state = strtolower(trim(is_scalar($order['estado'] ?? null) ? (string)$order['estado'] : ''));
    if (in_array($state, ['cancelado', 'cancelada', 'rechazado', 'rechazada'], true)) return false;
    return !in_array(orderOrigin($order), ['Administrativo', 'Físico / pulsador'], true);
}

function customerProgress(mixed $records, string $uid): array
{
    $valid = [];
    if (is_array($records)) foreach ($records as $record) if (is_array($record) && isValidCustomerPurchase($record, $uid)) $valid[] = $record;
    $tz = new DateTimeZone('America/La_Paz');$now = new DateTimeImmutable('now', $tz);$month = $now->format('Y-m');$monthlyPurchases = 0;$monthlyMl = 0;$beverages = 0;
    foreach ($valid as $order) {
        $date = firebaseDate($order['fechaCreacion'] ?? null)?->setTimezone($tz);$isCurrentMonth = $date !== null && $date->format('Y-m') === $month;
        if ($isCurrentMonth) $monthlyPurchases++;
        foreach (orderItems($order) as $item) {
            if (!is_array($item)) continue;
            $quantity = is_numeric($item['cantidad'] ?? null) ? max(0, (int)$item['cantidad']) : 0;
            $ml = is_numeric($item['cantidadMl'] ?? null) ? max(0, (int)$item['cantidadMl']) : 0;
            if ($quantity === 0) continue;
            $beverages += $quantity;
            if ($isCurrentMonth && $ml > 0) $monthlyMl += $quantity * $ml;
        }
    }
    return ['validOrders'=>count($valid),'monthlyPurchases'=>$monthlyPurchases,'monthlyPurchaseGoal'=>5,'beverages'=>$beverages,'beverageGoal'=>10,'monthlyMl'=>$monthlyMl,'monthlyLiters'=>$monthlyMl/1000];
}

function h(mixed $value): string { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function firebaseDate(mixed $value): ?DateTimeImmutable
{
    try {
        if ($value instanceof DateTimeInterface) return DateTimeImmutable::createFromInterface($value);
        if (is_numeric($value)) {
            $timestamp = (int) $value;
            if ($timestamp > 9999999999) $timestamp = intdiv($timestamp, 1000);
            return (new DateTimeImmutable())->setTimestamp($timestamp);
        }
        if (is_string($value) && trim($value) !== '') return new DateTimeImmutable($value);
    } catch (Throwable) {}
    return null;
}

function displayDate(mixed $value, string $fallback = 'Sin fecha'): string
{
    $date = firebaseDate($value);
    return $date ? $date->setTimezone(new DateTimeZone('America/La_Paz'))->format('d/m/Y H:i') : $fallback;
}

function money(mixed $value): string { return is_numeric($value) ? 'Bs ' . number_format((float) $value, 2, ',', '.') : 'Sin datos'; }
function orderItems(array $order): array { return isset($order['items']) && is_array($order['items']) ? $order['items'] : []; }

function normalizeProduct(mixed $record): ?array
{
    if (!is_array($record)) return null;
    $string = static fn(mixed $value): string => is_scalar($value) ? trim((string) $value) : '';
    $nullableString = static function (mixed $value) use ($string): ?string {
        $normalized = $string($value);
        return $normalized !== '' ? $normalized : null;
    };
    $boolean = static function (mixed $value, bool $default): bool {
        if (is_bool($value)) return $value;
        if ($value === 1 || $value === '1' || $value === 'true') return true;
        if ($value === 0 || $value === '0' || $value === 'false') return false;
        return $default;
    };
    $id = $nullableString($record['_id'] ?? null);
    $productId = $nullableString($record['productoId'] ?? null) ?? $id;

    return [
        'id' => $id,
        '_id' => $id,
        'productoId' => $productId,
        'nombre' => $nullableString($record['nombre'] ?? null) ?? 'Sin datos',
        'descripcion' => $string($record['descripcion'] ?? ''),
        'precio' => is_numeric($record['precio'] ?? null) ? (float) $record['precio'] : null,
        'cantidadMl' => is_numeric($record['cantidadMl'] ?? null) ? (int) $record['cantidadMl'] : null,
        'opcion' => is_numeric($record['opcion'] ?? null) ? (int) $record['opcion'] : null,
        'imagen' => $nullableString($record['imagen'] ?? null),
        'esGratis' => $boolean($record['esGratis'] ?? null, false),
        'activo' => $boolean($record['activo'] ?? null, true),
        'agotado' => $boolean($record['agotado'] ?? null, false),
        'bebidaId' => $nullableString($record['bebidaId'] ?? null),
        'tipoBebida' => $nullableString($record['tipoBebida'] ?? null),
        'creadoEn' => firebaseDate($record['creadoEn'] ?? $record['_createTime'] ?? null),
        'actualizadoEn' => firebaseDate($record['actualizadoEn'] ?? null),
    ];
}

function normalizeProducts(mixed $records): array
{
    if (!is_array($records)) return [];
    $products = [];
    foreach ($records as $record) {
        $product = normalizeProduct($record);
        if ($product !== null) $products[] = $product;
    }
    return $products;
}

function normalizeAuditRecord(mixed $record): ?array
{
    if (!is_array($record)) return null;
    $string = static fn(mixed $value): string => is_scalar($value) ? trim((string) $value) : '';
    $nullableString = static function (mixed $value) use ($string): ?string {
        $normalized = $string($value);
        return $normalized !== '' ? $normalized : null;
    };
    $previous = $record['valorAnterior'] ?? null;
    $next = $record['valorNuevo'] ?? null;

    return [
        'id' => $nullableString($record['_id'] ?? null),
        'accion' => $nullableString($record['accion'] ?? null),
        'adminNombre' => $nullableString($record['adminNombre'] ?? null),
        'adminRol' => $nullableString($record['adminRol'] ?? null),
        'adminUid' => $nullableString($record['adminUid'] ?? null),
        'cantidad' => is_numeric($record['cantidad'] ?? null) ? (float) $record['cantidad'] : null,
        'descripcion' => $nullableString($record['descripcion'] ?? null),
        'fecha' => firebaseDate($record['fecha'] ?? $record['fechaHora'] ?? $record['_createTime'] ?? null),
        'productoId' => $nullableString($record['productoId'] ?? null),
        'productoNombre' => $nullableString($record['productoNombre'] ?? null),
        'usuarioNombre' => $nullableString($record['usuarioNombre'] ?? null),
        'usuarioUid' => $nullableString($record['usuarioUid'] ?? null),
        'modulo' => $nullableString($record['modulo'] ?? null),
        'entidadId' => $nullableString($record['entidadId'] ?? null),
        'valorAnterior' => is_scalar($previous) || is_array($previous) || $previous === null ? $previous : null,
        'valorNuevo' => is_scalar($next) || is_array($next) || $next === null ? $next : null,
    ];
}

function normalizeAuditRecords(mixed $records): array
{
    if (!is_array($records)) return [];
    $audit = [];
    foreach ($records as $record) {
        $normalized = normalizeAuditRecord($record);
        if ($normalized !== null) $audit[] = $normalized;
    }
    return $audit;
}

function auditActionLabel(mixed $action): string
{
    if (!is_string($action) || trim($action) === '') return 'Acción sin datos';
    return ucfirst(str_replace('_', ' ', trim($action)));
}

function auditValueText(mixed $value): string
{
    if ($value === null || $value === '') return 'Sin datos';
    if (is_bool($value)) return $value ? 'Sí' : 'No';
    if (is_scalar($value)) return (string) $value;
    if (is_array($value)) {
        try { return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }
        catch (Throwable) { return 'Valor estructurado no disponible'; }
    }
    return 'Sin datos';
}

function orderSummary(array $order): string
{
    $names = [];
    foreach (orderItems($order) as $item) {
        if (!is_array($item)) continue;
        $name = trim((string) ($item['nombre'] ?? ''));
        $quantity = (int) ($item['cantidad'] ?? 1);
        if ($name !== '') $names[] = $name . ($quantity > 1 ? ' ×' . $quantity : '');
    }
    return $names ? implode(', ', $names) : 'Sin detalle';
}

function orderOrigin(array $order): string
{
    $origin = strtolower(trim((string) ($order['origenPedido'] ?? '')));
    $type = strtolower(trim((string) ($order['tipoUsuario'] ?? '')));
    $payment = strtolower(trim((string) ($order['metodoPago'] ?? '')));
    $paymentState = strtolower(trim((string) ($order['estadoPago'] ?? '')));
    if (($order['esDispensacionAdministrativa'] ?? false) === true || $payment === 'admin' || $paymentState === 'no_requerido') return 'Administrativo';
    if ($type === 'fisico' || $origin === 'pulsador') return 'Físico / pulsador';
    if ($origin === 'web') return 'Web';
    if (in_array($origin, ['app', 'aplicacion', 'móvil', 'movil'], true) || in_array($type, ['cliente', 'usuario'], true)) return 'Cliente / app';
    return $origin !== '' ? ucfirst($origin) : 'Otro / no especificado';
}

function safeAssetImage(mixed $path, string $basePath = ''): string
{
    if (!is_string($path)) return '';
    $path = ltrim(str_replace('\\', '/', trim($path)), '/');
    if ($path === '' || str_contains($path, "\0") || preg_match('#(^|/)\.\.(/|$)#', $path)) return '';
    if (!preg_match('/\.(?:png|jpe?g|webp|gif)$/i', $path)) return '';

    $candidates = [$path];
    if (str_starts_with($path, 'assets/productos/')) {
        $candidates[] = 'assets/img/productos/' . substr($path, strlen('assets/productos/'));
    } elseif (str_starts_with($path, 'assets/') && !str_starts_with($path, 'assets/img/')) {
        $candidates[] = 'assets/img/' . substr($path, strlen('assets/'));
    }

    $assetsRoot = realpath(dirname(__DIR__) . '/assets');
    if ($assetsRoot === false) return '';
    foreach (array_unique($candidates) as $candidate) {
        if (!str_starts_with($candidate, 'assets/')) continue;
        $resolved = realpath(dirname(__DIR__) . '/' . $candidate);
        if ($resolved !== false && is_file($resolved) && str_starts_with($resolved, $assetsRoot . DIRECTORY_SEPARATOR)) {
            return $basePath . str_replace(DIRECTORY_SEPARATOR, '/', $candidate);
        }
    }
    return '';
}
