<?php
declare(strict_types=1);

function adminReservationResponse(int $status, array $payload): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') adminReservationResponse(405, ['success'=>false,'code'=>'method_not_allowed']);
require_once dirname(__DIR__, 3) . '/includes/auth.php';
$user = currentUser();
if ($user === null) adminReservationResponse(401, ['success'=>false,'code'=>'authentication_required']);
$raw = file_get_contents('php://input');
try { $body = json_decode(is_string($raw) ? $raw : '', true, 8, JSON_THROW_ON_ERROR); } catch (Throwable) { adminReservationResponse(400, ['success'=>false,'code'=>'invalid_json']); }
if (!is_array($body) || array_keys($body) !== ['csrf_token','reservationId','action']) adminReservationResponse(400, ['success'=>false,'code'=>'invalid_fields']);
if (!verifyChichejCsrfToken(is_string($body['csrf_token']) ? $body['csrf_token'] : null)) adminReservationResponse(403, ['success'=>false,'code'=>'invalid_csrf']);
$id = is_string($body['reservationId']) ? trim($body['reservationId']) : '';
$action = is_string($body['action']) ? trim($body['action']) : '';
if (!preg_match('/^[A-Za-z0-9_-]{1,150}$/', $id) || !in_array($action, ['aceptar','rechazar','cancelar'], true)) adminReservationResponse(422, ['success'=>false,'code'=>'invalid_action']);
require_once dirname(__DIR__, 3) . '/services/ReservationService.php';
try {
    $service = new ReservationService();
    $admin = $service->freshAdmin($user);
    $state = $service->changeByAdmin($id, $action, $admin);
    adminReservationResponse(200, ['success'=>true,'state'=>$state]);
} catch (ReservationAuthorizationException) { adminReservationResponse(403, ['success'=>false,'code'=>'admin_not_authorized']);
} catch (ReservationNotFoundException) { adminReservationResponse(404, ['success'=>false,'code'=>'not_found']);
} catch (ReservationConflictException) { adminReservationResponse(409, ['success'=>false,'code'=>'invalid_transition']);
} catch (Throwable $error) { error_log('Admin reservation update failed: ' . $error->getMessage()); adminReservationResponse(503, ['success'=>false,'code'=>'reservation_unavailable']); }
