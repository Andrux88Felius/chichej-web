<?php
declare(strict_types=1);

function reservationCancelResponse(int $status, array $payload): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reservationCancelResponse(405, ['success'=>false,'code'=>'method_not_allowed']);
require_once dirname(__DIR__, 3) . '/includes/auth.php';
$user = currentUser();
if ($user === null) reservationCancelResponse(401, ['success'=>false,'code'=>'authentication_required']);
$raw = file_get_contents('php://input');
try { $body = json_decode(is_string($raw) ? $raw : '', true, 8, JSON_THROW_ON_ERROR); } catch (Throwable) { reservationCancelResponse(400, ['success'=>false,'code'=>'invalid_json']); }
if (!is_array($body) || array_keys($body) !== ['csrf_token','reservationId']) reservationCancelResponse(400, ['success'=>false,'code'=>'invalid_fields']);
if (!verifyChichejCsrfToken(is_string($body['csrf_token']) ? $body['csrf_token'] : null)) reservationCancelResponse(403, ['success'=>false,'code'=>'invalid_csrf']);
$id = is_string($body['reservationId']) ? trim($body['reservationId']) : '';
if (!preg_match('/^[A-Za-z0-9_-]{1,150}$/', $id)) reservationCancelResponse(422, ['success'=>false,'code'=>'invalid_reservation_id']);
require_once dirname(__DIR__, 3) . '/services/ReservationService.php';
try {
    (new ReservationService())->cancelByOwner($id, (string) $user['uid']);
    reservationCancelResponse(200, ['success'=>true,'state'=>'cancelada']);
} catch (ReservationAuthorizationException) { reservationCancelResponse(403, ['success'=>false,'code'=>'not_owner']);
} catch (ReservationNotFoundException) { reservationCancelResponse(404, ['success'=>false,'code'=>'not_found']);
} catch (ReservationConflictException) { reservationCancelResponse(409, ['success'=>false,'code'=>'invalid_transition']);
} catch (Throwable $error) { error_log('Reservation cancellation failed: ' . $error->getMessage()); reservationCancelResponse(503, ['success'=>false,'code'=>'reservation_unavailable']); }
