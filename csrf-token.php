<?php

declare(strict_types=1);

// Configure le cookie de session pour limiter son accès et son envoi.
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);

// Ouvre la session qui permettra d'associer le jeton au visiteur.
session_start();

// Retourne une réponse JSON et empêche sa mise en cache.
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

// Ajoute des protections HTTP complémentaires.
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

// Ce fichier fournit uniquement un jeton via une requête GET.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Méthode non autorisée'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Crée un jeton aléatoire une seule fois par session.
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Envoie le jeton au formulaire pour qu'il soit transmis lors de sa soumission.
echo json_encode(
    ['token' => $_SESSION['csrf_token']],
    JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
);
