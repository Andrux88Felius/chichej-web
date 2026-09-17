<?php
declare(strict_types=1);

function reservationResponse(int $status, array $payload): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reservationResponse(405, ['success'=>false,'code'=>'method_not_allowed']);
require_once dirname(__DIR__, 3) . '/includes/auth.php';
$user = currentUser();
if ($user === null) reservationResponse(401, ['success'=>false,'code'=>'authentication_required']);
$raw = file_get_contents('php://input');
try { $body = json_decode(is_string($raw) ? $raw : '', true, 16, JSON_THROW_ON_ERROR); } catch (Throwable) { reservationResponse(400, ['success'=>false,'code'=>'invalid_json']); }
if (!is_array($body) || array_keys($body) !== ['csrf_token','detalle','fechaSolicitada','cantidadSolicitada','telefono','lugarEvento','direccion','referenciasLugar','observaciones']) reservationResponse(400, ['success'=>false,'code'=>'invalid_fields']);
if (!verifyChichejCsrfToken(is_string($body['csrf_token']) ? $body['csrf_token'] : null)) reservationResponse(403, ['success'=>false,'code'=>'invalid_csrf']);
$detail = trim(is_string($body['detalle']) ? $body['detalle'] : '');
$date = trim(is_string($body['fechaSolicitada']) ? $body['fechaSolicitada'] : '');
$place = trim(is_string($body['lugarEvento']) ? $body['lugarEvento'] : '');
$phone = trim(is_string($body['telefono']) ? $body['telefono'] : '');
$address = trim(is_string($body['direccion']) ? $body['direccion'] : '');
$reference = trim(is_string($body['referenciasLugar']) ? $body['referenciasLugar'] : '');
$notes = trim(is_string($body['observaciones']) ? $body['observaciones'] : '');
$quantity = filter_var($body['cantidadSolicitada'], FILTER_VALIDATE_INT);
$tz = new DateTimeZone('America/La_Paz');
$parsedDate = DateTimeImmutable::createFromFormat('!Y-m-d', $date, $tz);
$validDate = $parsedDate instanceof DateTimeImmutable && $parsedDate->format('Y-m-d') === $date;
$today = new DateTimeImmutable('today', $tz);
$phoneDigits = preg_replace('/\D+/', '', $phone);
if (mb_strlen($detail) < 3 || mb_strlen($detail) > 300 || mb_strlen($place) < 3 || mb_strlen($place) > 160 || mb_strlen($address) > 220 || mb_strlen($reference) > 300 || mb_strlen($notes) > 600 || !preg_match('/^[0-9+().\s-]{7,30}$/', $phone) || !is_string($phoneDigits) || strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15 || $quantity === false || $quantity < 1 || $quantity > 10000 || !$validDate || $parsedDate < $today || $parsedDate > $today->modify('+2 years')) reservationResponse(422, ['success'=>false,'code'=>'invalid_reservation']);
require_once dirname(__DIR__, 3) . '/services/ReservationService.php';
try {
    $id = (new ReservationService())->create($user, ['detalle'=>$detail,'fechaSolicitada'=>$date,'cantidadSolicitada'=>$quantity,'telefono'=>$phone,'lugarEvento'=>$place,'direccion'=>$address,'referenciasLugar'=>$reference,'observaciones'=>$notes]);
    reservationResponse(201, ['success'=>true,'reservationId'=>$id]);
} catch (Throwable $error) {
    error_log('Reservation create failed: ' . $error->getMessage());
    reservationResponse(503, ['success'=>false,'code'=>'reservation_unavailable']);
}
