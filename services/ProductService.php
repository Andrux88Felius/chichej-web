<?php
declare(strict_types=1);

use Google\Auth\Credentials\ServiceAccountCredentials;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;

final class ProductConflictException extends RuntimeException {}
final class ProductNotFoundException extends RuntimeException {}

final class ProductService
{
    private Client $client;
    private string $token;
    private string $projectId;

    public function __construct()
    {
        $config = require dirname(__DIR__) . '/config/firebase.php';
        if (!is_file($config['autoload_path']) || !is_readable($config['service_account_path'])) throw new RuntimeException('Firebase no está configurado para escrituras seguras.');
        require_once $config['autoload_path'];
        $this->projectId = (string) ($config['client']['projectId'] ?? '');
        $json = file_get_contents($config['service_account_path']);
        $account = is_string($json) ? json_decode($json, true, 16, JSON_THROW_ON_ERROR) : null;
        if ($this->projectId === '' || !is_array($account)) throw new RuntimeException('Firestore no está configurado.');
        $credentials = new ServiceAccountCredentials(['https://www.googleapis.com/auth/datastore'], $account);
        $auth = $credentials->fetchAuthToken();
        $this->token = is_array($auth) ? (string) ($auth['access_token'] ?? '') : '';
        if ($this->token === '') throw new RuntimeException('No se pudo autorizar Firestore.');
        $this->client = new Client(['timeout'=>15,'connect_timeout'=>5]);
    }

    public function create(array $data, array $admin): string
    {
        $id = 'prod_' . bin2hex(random_bytes(12));
        $now = $this->now();
        $fields = $data + ['productoId'=>$id,'creadoEn'=>$this->timestamp($now),'actualizadoEn'=>$this->timestamp($now)];
        $audit = $this->audit('producto_creado', $id, $data['nombre'], null, $this->summary($fields), $admin, $now);
        $this->commit([
            ['update'=>['name'=>$this->documentName('productos',$id),'fields'=>$this->encodeFields($fields)],'currentDocument'=>['exists'=>false]],
            $this->createWrite('auditoria_admin','aud_'.bin2hex(random_bytes(12)),$audit),
        ]);
        return $id;
    }

    public function update(string $id, array $data, array $admin): void
    {
        $document = $this->getProduct($id);
        $previous = $this->decodeFields($document['fields'] ?? []);
        $now = $this->now();
        $update = $data + ['actualizadoEn'=>$this->timestamp($now)];
        $audit = $this->audit('producto_editado',$id,(string)($data['nombre']??$previous['nombre']??$id),$this->summary($previous),$this->summary($data),$admin,$now);
        $this->commit([
            $this->updateWrite($id,$update,array_keys($update),(string)$document['updateTime']),
            $this->createWrite('auditoria_admin','aud_'.bin2hex(random_bytes(12)),$audit),
        ]);
    }

    public function changeStatus(string $id, string $action, array $admin): array
    {
        $targets = ['activar'=>['activo',true,'producto_activado'],'desactivar'=>['activo',false,'producto_desactivado'],'agotar'=>['agotado',true,'producto_agotado'],'disponible'=>['agotado',false,'producto_disponible']];
        if (!isset($targets[$action])) throw new InvalidArgumentException('Acción no válida.');
        [$field,$value,$auditAction] = $targets[$action];
        $document = $this->getProduct($id);
        $previous = $this->decodeFields($document['fields'] ?? []);
        $currentValue = array_key_exists($field, $previous) && is_bool($previous[$field]) ? $previous[$field] : ($field === 'activo');
        if ($currentValue === $value) throw new ProductConflictException('El producto ya tiene ese estado.');
        $now = $this->now();
        $update = [$field=>$value,'actualizadoEn'=>$this->timestamp($now)];
        $audit = $this->audit($auditAction,$id,(string)($previous['nombre']??$id),[$field=>$currentValue],[$field=>$value],$admin,$now);
        $this->commit([$this->updateWrite($id,$update,array_keys($update),(string)$document['updateTime']),$this->createWrite('auditoria_admin','aud_'.bin2hex(random_bytes(12)),$audit)]);
        return [$field=>$value];
    }

    private function getProduct(string $id): array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{1,150}$/',$id)) throw new InvalidArgumentException('ID no válido.');
        try { $response=$this->client->request('GET',$this->restBase().'/productos/'.rawurlencode($id),['headers'=>$this->headers()]); }
        catch (ClientException $error) { if ($error->getResponse()->getStatusCode()===404) throw new ProductNotFoundException('Producto no encontrado.',0,$error); throw $error; }
        $document=json_decode((string)$response->getBody(),true,64,JSON_THROW_ON_ERROR);
        if (!is_array($document)||empty($document['updateTime'])) throw new RuntimeException('Documento incompatible.');
        return $document;
    }

    private function updateWrite(string $id,array $fields,array $mask,string $updateTime): array { return ['update'=>['name'=>$this->documentName('productos',$id),'fields'=>$this->encodeFields($fields)],'updateMask'=>['fieldPaths'=>$mask],'currentDocument'=>['updateTime'=>$updateTime]]; }
    private function createWrite(string $collection,string $id,array $fields): array { return ['update'=>['name'=>$this->documentName($collection,$id),'fields'=>$this->encodeFields($fields)],'currentDocument'=>['exists'=>false]]; }
    private function audit(string $action,string $id,string $name,mixed $previous,mixed $next,array $admin,string $now): array { return ['accion'=>$action,'adminUid'=>$admin['uid'],'adminNombre'=>$admin['name'],'adminEmail'=>$admin['email'],'adminRol'=>$admin['role'],'modulo'=>'productos','entidad'=>'producto','entidadId'=>$id,'productoId'=>$id,'productoNombre'=>$name,'valorAnterior'=>$previous,'valorNuevo'=>$next,'descripcion'=>$action.' · '.$name,'fechaHora'=>$this->timestamp($now),'origenWeb'=>true]; }
    private function summary(array $fields): array { $keys=['nombre','descripcion','precio','cantidadMl','opcion','imagen','esGratis','activo','agotado','bebidaId','tipoBebida'];$out=[];foreach($keys as $key)if(array_key_exists($key,$fields))$out[$key]=$fields[$key];return $out; }
    private function commit(array $writes): void { try{$this->client->request('POST',$this->restBase().':commit',['headers'=>$this->headers(),'json'=>['writes'=>$writes]]);}catch(ClientException $error){$body=(string)$error->getResponse()->getBody();if(in_array($error->getResponse()->getStatusCode(),[409,412],true)||str_contains($body,'FAILED_PRECONDITION'))throw new ProductConflictException('El producto cambió durante la operación.',0,$error);throw $error;} }
    private function encodeFields(array $fields): array { $out=[];foreach($fields as $key=>$value)$out[$key]=$this->encodeValue($value);return $out; }
    private function encodeValue(mixed $value): array { if(is_array($value)&&isset($value['__timestamp']))return ['timestampValue'=>$value['__timestamp']];if(is_array($value))return ['mapValue'=>['fields'=>$this->encodeFields($value)]];if(is_bool($value))return ['booleanValue'=>$value];if(is_int($value))return ['integerValue'=>(string)$value];if(is_float($value))return ['doubleValue'=>$value];if($value===null)return ['nullValue'=>null];return ['stringValue'=>(string)$value]; }
    private function decodeFields(array $fields): array { $out=[];foreach($fields as $key=>$value){if(isset($value['stringValue']))$out[$key]=(string)$value['stringValue'];elseif(isset($value['integerValue']))$out[$key]=(int)$value['integerValue'];elseif(isset($value['doubleValue']))$out[$key]=(float)$value['doubleValue'];elseif(isset($value['booleanValue']))$out[$key]=(bool)$value['booleanValue'];elseif(isset($value['timestampValue']))$out[$key]=(string)$value['timestampValue'];else$out[$key]=null;}return $out; }
    private function timestamp(string $value): array { return ['__timestamp'=>$value]; }
    private function now(): string { return (new DateTimeImmutable('now',new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z'); }
    private function restBase(): string { return sprintf('https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents',rawurlencode($this->projectId)); }
    private function documentName(string $collection,string $id): string { return sprintf('projects/%s/databases/(default)/documents/%s/%s',$this->projectId,$collection,$id); }
    private function headers(): array { return ['Authorization'=>'Bearer '.$this->token,'Accept'=>'application/json']; }
}
