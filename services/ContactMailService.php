<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

final class ContactMailService
{
    public function __construct(private readonly array $config)
    {
    }

    public function isConfigured(): bool
    {
        return ($this->config['configured'] ?? false) === true;
    }

    public function send(array $message): void
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('Mail service is not configured.');
        }

        $mailer = new PHPMailer(true);
        $mailer->CharSet = PHPMailer::CHARSET_UTF8;
        $mailer->isSMTP();
        $mailer->Host = (string) $this->config['host'];
        $mailer->Port = (int) $this->config['port'];
        $mailer->SMTPAuth = true;
        $mailer->Username = (string) $this->config['username'];
        $mailer->Password = (string) $this->config['password'];
        $mailer->SMTPSecure = $this->config['encryption'] === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->Timeout = 15;

        $mailer->setFrom((string) $this->config['from_address'], (string) $this->config['from_name']);
        $mailer->addAddress((string) $this->config['to_address'], 'CHICHEJ Bolivia');
        $mailer->addReplyTo($message['email'], $message['name']);
        $mailer->Subject = '[CHICHEJ Web] Mensaje de contacto - ' . $message['reason'];

        $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $organization = $message['organization'] !== '' ? $message['organization'] : 'No indicada';
        $mailer->isHTML(true);
        $mailer->Body = '<h2>Nuevo mensaje desde el sitio web CHICHEJ</h2>'
            . '<p><strong>Nombre:</strong> ' . $escape($message['name']) . '</p>'
            . '<p><strong>Correo:</strong> ' . $escape($message['email']) . '</p>'
            . '<p><strong>Organización:</strong> ' . $escape($organization) . '</p>'
            . '<p><strong>Motivo:</strong> ' . $escape($message['reason']) . '</p>'
            . '<p><strong>Mensaje:</strong><br>' . nl2br($escape($message['body'])) . '</p>'
            . '<p><strong>Fecha y hora:</strong> ' . $escape($message['sent_at']) . '</p>'
            . '<p><strong>Origen:</strong> Sitio web CHICHEJ</p>';
        $mailer->AltBody = "Nuevo mensaje desde el sitio web CHICHEJ\n\n"
            . "Nombre: {$message['name']}\n"
            . "Correo: {$message['email']}\n"
            . "Organización: {$organization}\n"
            . "Motivo: {$message['reason']}\n"
            . "Mensaje:\n{$message['body']}\n\n"
            . "Fecha y hora: {$message['sent_at']}\n"
            . "Origen: Sitio web CHICHEJ";

        $mailer->send();
    }
}
