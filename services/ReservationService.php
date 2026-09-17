<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/reservations.php';
require_once dirname(__DIR__) . '/includes/firebase-profile.php';
require_once __DIR__ . '/AdminAuthorizationService.php';

use Google\Auth\Credentials\ServiceAccountCredentials;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;

final class ReservationConflictException extends RuntimeException {}
final class ReservationNotFoundException extends RuntimeException {}
final class ReservationAuthorizationException extends RuntimeException {}

final class ReservationService
{
    private array $config;
    private Client $client;
    private string $token;
    private string $projectId;

    public function __construct()
    {
        $this->config = require dirname(__DIR__) . '/config/firebase.php';
        if (!is_file($this->config['autoload_path']) || !is_readable($this->config['service_account_path'])) {
            throw new RuntimeException('Firebase no está configurado para escrituras seguras.');
        }
        require_once $this->config['autoload_path'];
        $this->projectId = (string) ($this->config['client']['projectId'] ?? '');
        if ($this->projectId === '') throw new RuntimeException('Firestore no está configurado.');
        $json = file_get_contents($this->config['service_account_path']);
        $account = is_string($json) ? json_decode($json, true, 16, JSON_THROW_ON_ERROR) : null;
        if (!is_array($account)) throw new RuntimeException('La cuenta de servicio no es válida.');
        $credentials = new ServiceAccountCredentials(['https://www.googleapis.com/auth/datastore'], $account);
        $auth = $credentials->fetchAuthToken();
        $this->token = is_array($auth) ? (string) ($auth['access_token'] ?? '') : '';
        if ($this->token === '') throw new RuntimeException('No se pudo autorizar Firestore.');
        $this->client = new Client(['timeout' => 15, 'connect_timeout' => 5]);
    }

    public function create(array $user, array $reservation): string
    {
        $id = 'res_' . bin2hex(random_bytes(12));
        $now = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z');
        $requested = (new DateTimeImmutable($reservation['fechaSolicitada'] . ' 12:00:00', new DateTimeZone('America/La_Paz')))
            ->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z');
        $fields = [
            'reservaId' => $id,
            'usuarioId' => (string) $user['uid'],
            'nombreCliente' => (string) ($user['name'] ?? 'Cliente'),
            'correoCliente' => (string) ($user['email'] ?? ''),
            'telefono' => $reservation['telefono'],
            'detalle' => $reservation['detalle'],
            'fechaSolicitada' => $this->timestamp($requested),
            'cantidadSolicitada' => $reservation['cantidadSolicitada'],
            'lugarEvento' => $reservation['lugarEvento'],
            'direccion' => $reservation['direccion'],
            'referenciasLugar' => $reservation['referenciasLugar'],
            'observaciones' => $reservation['observaciones'],
            'estado' => 'pendiente',
            'fechaCreacion' => $this->timestamp($now),
            'fechaActualizacion' => $this->timestamp($now),
        ];
        $this->commit([['update' => ['name' => $this->documentName('reservas', $id), 'fields' => $this->encodeFields($fields)], 'currentDocument' => ['exists' => false]]]);
        return $id;
    }

    public function cancelByOwner(string $id, string $uid): void
    {
        $document = $this->getReservation($id);
        $fields = $this->decodeFields($document['fields'] ?? []);
        if (!hash_equals((string) ($fields['usuarioId'] ?? ''), $uid)) throw new ReservationAuthorizationException('La reserva no pertenece al usuario.');
        if (!reservationTransitionAllowed($fields['estado'] ?? null, 'cancelar', false)) throw new ReservationConflictException('La reserva ya no se puede cancelar.');
        $this->commit([$this->stateWrite($id, 'cancelada', (string) $document['updateTime'])]);
    }

    public function freshAdmin(array $sessionUser): array
    {
        try { return (new AdminAuthorizationService($this->config))->requireFreshAdmin($sessionUser); }
        catch (AdminAuthorizationException $error) { throw new ReservationAuthorizationException($error->getMessage(), 0, $error); }
    }

    public function changeByAdmin(string $id, string $action, array $admin): string
    {
        $document = $this->getReservation($id);
        $fields = $this->decodeFields($document['fields'] ?? []);
        if (!reservationTransitionAllowed($fields['estado'] ?? null, $action, true)) throw new ReservationConflictException('La transición solicitada ya no está permitida.');
        $previous = reservationCanonicalState($fields['estado'] ?? null) ?? (string) ($fields['estado'] ?? 'desconocido');
        $next = reservationTargetState($action, true);
        if ($next === null) throw new InvalidArgumentException('Acción no válida.');
        $now = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z');
        $auditId = 'aud_' . bin2hex(random_bytes(12));
        $audit = [
            'accion' => $action . '_reserva', 'adminUid' => $admin['uid'], 'adminNombre' => $admin['name'],
            'adminEmail' => $admin['email'], 'adminRol' => $admin['role'], 'modulo' => 'reservas',
            'entidad' => 'reserva', 'entidadId' => $id, 'reservaId' => $id,
            'valorAnterior' => $previous, 'valorNuevo' => $next,
            'descripcion' => sprintf('Reserva %s: %s → %s', $id, $previous, $next),
            'fechaHora' => $this->timestamp($now), 'origenWeb' => true,
        ];
        $writes = [
            $this->stateWrite($id, $next, (string) $document['updateTime']),
            ['update' => ['name' => $this->documentName('auditoria_admin', $auditId), 'fields' => $this->encodeFields($audit)], 'currentDocument' => ['exists' => false]],
        ];
        $this->commit($writes);
        return $next;
    }

    private function getReservation(string $id): array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{1,150}$/', $id)) throw new InvalidArgumentException('ID de reserva no válido.');
        try {
            $response = $this->client->request('GET', $this->restBase() . '/reservas/' . rawurlencode($id), ['headers' => $this->headers()]);
        } catch (ClientException $error) {
            if ($error->getResponse()->getStatusCode() === 404) throw new ReservationNotFoundException('Reserva no encontrada.', 0, $error);
            throw $error;
        }
        $document = json_decode((string) $response->getBody(), true, 64, JSON_THROW_ON_ERROR);
        if (!is_array($document) || empty($document['updateTime'])) throw new RuntimeException('Documento de reserva incompatible.');
        return $document;
    }

    private function stateWrite(string $id, string $state, string $updateTime): array
    {
        $now = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z');
        return ['update' => ['name' => $this->documentName('reservas', $id), 'fields' => $this->encodeFields(['estado' => $state, 'fechaActualizacion' => $this->timestamp($now)])], 'updateMask' => ['fieldPaths' => ['estado', 'fechaActualizacion']], 'currentDocument' => ['updateTime' => $updateTime]];
    }

    private function commit(array $writes): void
    {
        try {
            $this->client->request('POST', $this->restBase() . ':commit', ['headers' => $this->headers(), 'json' => ['writes' => $writes]]);
        } catch (ClientException $error) {
            $response = $error->getResponse();
            $body = (string) $response->getBody();
            if (in_array($response->getStatusCode(), [409, 412], true) || str_contains($body, 'FAILED_PRECONDITION')) throw new ReservationConflictException('Los datos cambiaron mientras se procesaba la solicitud.', 0, $error);
            throw $error;
        }
    }

    private function restBase(): string { return sprintf('https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents', rawurlencode($this->projectId)); }
    private function documentName(string $collection, string $id): string { return sprintf('projects/%s/databases/(default)/documents/%s/%s', $this->projectId, $collection, $id); }
    private function headers(): array { return ['Authorization' => 'Bearer ' . $this->token, 'Accept' => 'application/json']; }
    private function timestamp(string $value): array { return ['__firestoreTimestamp' => $value]; }

    private function encodeFields(array $fields): array
    {
        $encoded = [];
        foreach ($fields as $key => $value) $encoded[$key] = $this->encodeValue($value);
        return $encoded;
    }

    private function encodeValue(mixed $value): array
    {
        if (is_array($value) && isset($value['__firestoreTimestamp'])) return ['timestampValue' => (string) $value['__firestoreTimestamp']];
        if (is_bool($value)) return ['booleanValue' => $value];
        if (is_int($value)) return ['integerValue' => (string) $value];
        if (is_float($value)) return ['doubleValue' => $value];
        if ($value === null) return ['nullValue' => null];
        return ['stringValue' => (string) $value];
    }

    private function decodeFields(array $fields): array
    {
        $decoded = [];
        foreach ($fields as $key => $value) {
            if (isset($value['stringValue'])) $decoded[$key] = (string) $value['stringValue'];
            elseif (isset($value['integerValue'])) $decoded[$key] = (int) $value['integerValue'];
            elseif (isset($value['booleanValue'])) $decoded[$key] = (bool) $value['booleanValue'];
            elseif (isset($value['timestampValue'])) $decoded[$key] = (string) $value['timestampValue'];
            else $decoded[$key] = null;
        }
        return $decoded;
    }
}
