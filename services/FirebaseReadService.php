<?php
declare(strict_types=1);

use Google\Auth\Credentials\ServiceAccountCredentials;
use GuzzleHttp\Client;
use Kreait\Firebase\Factory;

final class FirebaseReadService
{
    private array $config;
    private ?Factory $factory = null;

    public function __construct()
    {
        $this->config = require dirname(__DIR__) . '/config/firebase.php';
        if (!is_file($this->config['autoload_path']) || !is_readable($this->config['service_account_path'])) {
            throw new RuntimeException('Firebase no está configurado para lectura en el servidor.');
        }
        require_once $this->config['autoload_path'];
    }

    public function rtdb(string $path): mixed
    {
        $databaseUrl = (string) $this->config['client']['databaseURL'];
        if ($databaseUrl === '') throw new RuntimeException('Realtime Database no está configurado.');
        $this->factory ??= (new Factory())->withServiceAccount($this->config['service_account_path'])->withDatabaseUri($databaseUrl);
        return $this->factory->createDatabase()->getReference($path)->getValue();
    }

    public function updateUserPersonalProfile(string $uid, string $name, string $avatarPath, string $phone): void
    {
        if (!preg_match('/^[A-Za-z0-9_-]{1,128}$/', $uid)) throw new InvalidArgumentException('UID no válido.');
        if (!preg_match('#^assets/avatares/(?:avatar[1-9]|invitado)\.png$#', $avatarPath)) throw new InvalidArgumentException('Avatar no válido.');
        $databaseUrl = (string) $this->config['client']['databaseURL'];
        if ($databaseUrl === '') throw new RuntimeException('Realtime Database no está configurado.');
        $this->factory ??= (new Factory())->withServiceAccount($this->config['service_account_path'])->withDatabaseUri($databaseUrl);
        $reference = $this->factory->createDatabase()->getReference('usuarios/' . $uid);
        if (!is_array($reference->getValue())) throw new RuntimeException('El perfil no está disponible.');
        $reference->update(['nombre'=>$name,'avatarPath'=>$avatarPath,'telefono'=>$phone]);
    }

    public function createCustomerProfileIfMissing(string $uid, string $name, string $email): array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{1,128}$/', $uid)) throw new InvalidArgumentException('UID no válido.');
        $existing = $this->rtdb('usuarios/' . $uid);
        if (is_array($existing)) return $existing;
        if ($existing !== null) throw new RuntimeException('El perfil existente no tiene una estructura compatible.');
        $profile = ['nombre'=>$name,'email'=>$email,'rol'=>'cliente','avatarPath'=>'assets/avatares/invitado.png','bloqueado'=>false,'fechaRegistro'=>(int)round(microtime(true)*1000)];
        $databaseUrl = (string) $this->config['client']['databaseURL'];
        if ($databaseUrl === '') throw new RuntimeException('Realtime Database no está configurado.');
        $this->factory ??= (new Factory())->withServiceAccount($this->config['service_account_path'])->withDatabaseUri($databaseUrl);
        $database = $this->factory->createDatabase();
        $reference = $database->getReference('usuarios/' . $uid);
        $database->runTransaction(static function ($transaction) use ($reference, $profile): void {
            $snapshot = $transaction->snapshot($reference);
            if (!$snapshot->exists()) $transaction->set($reference, $profile);
        });
        $stored = $reference->getValue();
        if (!is_array($stored)) throw new RuntimeException('El perfil no pudo completarse de forma compatible.');
        return $stored;
    }

    public function collection(string $collection): array
    {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $collection)) throw new InvalidArgumentException('Colección no válida.');
        $projectId = (string) $this->config['client']['projectId'];
        if ($projectId === '') throw new RuntimeException('Firestore no está configurado.');
        $serviceAccountJson = file_get_contents($this->config['service_account_path']);
        if (!is_string($serviceAccountJson)) throw new RuntimeException('No se pudo leer la cuenta de servicio.');
        $serviceAccount = json_decode($serviceAccountJson, true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($serviceAccount)) throw new RuntimeException('La cuenta de servicio no es válida.');
        $credentials = new ServiceAccountCredentials(['https://www.googleapis.com/auth/datastore'], $serviceAccount);
        $token = $credentials->fetchAuthToken();
        $accessToken = is_array($token) ? ($token['access_token'] ?? '') : '';
        if (!is_string($accessToken) || $accessToken === '') throw new RuntimeException('No se pudo autorizar la lectura de Firestore.');

        $client = new Client(['timeout' => 15, 'connect_timeout' => 5]);
        $url = sprintf('https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/%s', rawurlencode($projectId), rawurlencode($collection));
        $documents = [];
        $pageToken = null;
        do {
            $query = ['pageSize' => 300];
            if ($pageToken !== null) $query['pageToken'] = $pageToken;
            $response = $client->request('GET', $url, ['headers' => ['Authorization' => 'Bearer ' . $accessToken, 'Accept' => 'application/json'], 'query' => $query]);
            $payload = json_decode((string) $response->getBody(), true, 64, JSON_THROW_ON_ERROR);
            foreach (($payload['documents'] ?? []) as $document) {
                $data = $this->decodeFields($document['fields'] ?? []);
                $data['_id'] = basename((string) ($document['name'] ?? ''));
                $data['_createTime'] = $document['createTime'] ?? null;
                $documents[] = $data;
            }
            $pageToken = isset($payload['nextPageToken']) && is_string($payload['nextPageToken']) ? $payload['nextPageToken'] : null;
        } while ($pageToken !== null && count($documents) < 3000);
        return $documents;
    }

    private function decodeFields(array $fields): array
    {
        $decoded = [];
        foreach ($fields as $key => $value) $decoded[$key] = $this->decodeValue($value);
        return $decoded;
    }

    private function decodeValue(array $value): mixed
    {
        if (array_key_exists('nullValue', $value)) return null;
        if (array_key_exists('stringValue', $value)) return (string) $value['stringValue'];
        if (array_key_exists('booleanValue', $value)) return (bool) $value['booleanValue'];
        if (array_key_exists('integerValue', $value)) return (int) $value['integerValue'];
        if (array_key_exists('doubleValue', $value)) return (float) $value['doubleValue'];
        if (array_key_exists('timestampValue', $value)) return (string) $value['timestampValue'];
        if (array_key_exists('referenceValue', $value)) return (string) $value['referenceValue'];
        if (isset($value['arrayValue'])) return array_map(fn(array $item): mixed => $this->decodeValue($item), $value['arrayValue']['values'] ?? []);
        if (isset($value['mapValue'])) return $this->decodeFields($value['mapValue']['fields'] ?? []);
        return null;
    }
}
