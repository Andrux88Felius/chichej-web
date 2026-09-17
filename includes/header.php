<?php
declare(strict_types=1);
$pageTitle = $pageTitle ?? 'CHICHEJ';
$basePath = $basePath ?? '';
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="CHICHEJ: tradición andina, productos con identidad e innovación para una nueva experiencia.">
    <meta name="theme-color" content="#4b1f24">
    <title><?= htmlspecialchars($pageTitle) ?> | CHICHEJ</title>
    <link rel="icon" type="image/png" href="<?= $basePath ?>assets/img/icon/logo_icon.png">
    <link rel="stylesheet" href="<?= $basePath ?>assets/css/styles.css">
</head>
<body>
<a class="skip-link" href="#contenido">Saltar al contenido</a>
