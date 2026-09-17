<?php
declare(strict_types=1);

function reservationCanonicalState(mixed $state): ?string
{
    $value = strtolower(trim(is_scalar($state) ? (string) $state : ''));
    return match ($value) {
        'pendiente' => 'pendiente',
        'aceptada', 'aceptado', 'aprobada', 'aprobado' => 'aceptada',
        'rechazada', 'rechazado' => 'rechazada',
        'cancelada', 'cancelado' => 'cancelada',
        default => null,
    };
}

function reservationStateLabel(mixed $state): string
{
    $canonical = reservationCanonicalState($state);
    if ($canonical === null) {
        $historical = trim(is_scalar($state) ? (string) $state : '');
        return $historical !== '' ? ucfirst($historical) . ' (histórico)' : 'Estado desconocido';
    }
    return match ($canonical) {
        'pendiente' => 'Pendiente',
        'aceptada' => 'Aceptada',
        'rechazada' => 'Rechazada',
        'cancelada' => 'Cancelada',
        default => 'Estado desconocido',
    };
}

function reservationTargetState(string $action, bool $admin): ?string
{
    return match ($action) {
        'cancelar' => 'cancelada',
        'aceptar' => $admin ? 'aceptada' : null,
        'rechazar' => $admin ? 'rechazada' : null,
        default => null,
    };
}

function reservationTransitionAllowed(mixed $current, string $action, bool $admin): bool
{
    $state = reservationCanonicalState($current);
    if ($state === 'pendiente') return reservationTargetState($action, $admin) !== null;
    return $admin && $state === 'aceptada' && $action === 'cancelar';
}
