<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/firebase-profile.php';

use Kreait\Firebase\Factory;

final class AdminAuthorizationException extends RuntimeException {}

final class AdminAuthorizationService
{
    private array $config;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? require dirname(__DIR__) . '/config/firebase.php';
        if (!is_file($this->config['autoload_path']) || !is_readable($this->config['service_account_path'])) throw new RuntimeException('Firebase no está configurado.');
        require_once $this->config['autoload_path'];
    }

    public function requireFreshAdmin(array $sessionUser): array
    {
        $uid = trim((string) ($sessionUser['uid'] ?? ''));
        if (!preg_match('/^[A-Za-z0-9_-]{1,128}$/', $uid)) throw new AdminAuthorizationException('Identidad administrativa no válida.');
        $databaseUrl = (string) ($this->config['client']['databaseURL'] ?? '');
        if ($databaseUrl === '') throw new RuntimeException('Realtime Database no está configurado.');
        $database = (new Factory())->withServiceAccount($this->config['service_account_path'])->withDatabaseUri($databaseUrl)->createDatabase();
        $profile = chichejProfileAtUid($database, $uid);
        $role = is_array($profile) ? chichejProfileRole($profile) : '';
        if (!is_array($profile) || chichejProfileIsBlocked($profile) || !in_array($role, $this->config['admin_roles'], true)) throw new AdminAuthorizationException('El administrador no está autorizado.');
        return ['uid'=>$uid,'name'=>(string)($profile['nombre']??$sessionUser['name']??'Administrador'),'email'=>(string)($profile['email']??$sessionUser['email']??''),'role'=>$role];
    }
}
