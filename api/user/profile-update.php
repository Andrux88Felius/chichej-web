<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
require_once dirname(__DIR__,2).'/includes/auth.php';require_once dirname(__DIR__,2).'/includes/firebase-data.php';
function profileJson(int $status,array $payload):never{http_response_code($status);echo json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');profileJson(405,['success'=>false,'code'=>'method_not_allowed']);}
$user=currentUser();if($user===null)profileJson(401,['success'=>false,'code'=>'authentication_required']);
if(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json')profileJson(415,['success'=>false,'code'=>'json_required']);
$raw=file_get_contents('php://input');if(!is_string($raw)||$raw===''||strlen($raw)>8192)profileJson(400,['success'=>false,'code'=>'invalid_request']);
try{$body=json_decode($raw,true,4,JSON_THROW_ON_ERROR);}catch(JsonException){profileJson(400,['success'=>false,'code'=>'invalid_json']);}
if(!is_array($body)||array_keys($body)!==['csrf_token','nombre','avatarPath','telefono'])profileJson(400,['success'=>false,'code'=>'invalid_fields']);
if(!verifyChichejCsrfToken(is_string($body['csrf_token'])?$body['csrf_token']:null))profileJson(403,['success'=>false,'code'=>'invalid_csrf']);
$name=is_string($body['nombre'])?trim($body['nombre']):'';$avatar=is_string($body['avatarPath'])?trim($body['avatarPath']):'';$phone=is_string($body['telefono'])?trim($body['telefono']):'';
if(mb_strlen($name)<2||mb_strlen($name)>80)profileJson(422,['success'=>false,'code'=>'invalid_name']);
if(!preg_match('#^assets/avatares/(?:avatar[1-9]|invitado)\.png$#',$avatar))profileJson(422,['success'=>false,'code'=>'invalid_avatar']);
if(mb_strlen($phone)>20||($phone!==''&&!preg_match('/^[0-9+() -]+$/',$phone)))profileJson(422,['success'=>false,'code'=>'invalid_phone']);
try{$service=new FirebaseReadService();$service->updateUserPersonalProfile((string)$user['uid'],$name,$avatar,$phone);updateCurrentSessionProfile($name,$avatar);profileJson(200,['success'=>true,'name'=>$name,'avatarPath'=>$avatar]);}catch(Throwable){profileJson(503,['success'=>false,'code'=>'service_unavailable']);}
