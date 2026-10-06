<?php

declare(strict_types=1);

const DESTINATAIRE = 'zapolski.alexandre2991@gmail.com';

session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; frame-ancestors 'none'");

function afficherErreur(string $message, int $code = 400): never
{
    http_response_code($code);
    echo '<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="style.css">
      <title>Erreur - Formulaire de contact</title>
    </head>
    <body>
      <main class="form_result">
        <section>
          <h1>Le message n’a pas pu être envoyé</h1>
          <p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>
          <a class="primary_button" href="index.html#contact">Retourner au formulaire</a>
        </section>
      </main>
  </body>
  </html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    afficherErreur('Cette page doit être appelée depuis le formulaire de contact.');
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 7000) {
    afficherErreur('La requête est trop volumineuse.');
}

$jeton = (string) ($_POST['csrf_token'] ?? '');
$jetonSession = (string) ($_SESSION['csrf_token'] ?? '');

if (
    $jetonSession === '' ||
    $jeton === '' ||
    !hash_equals($jetonSession, $jeton)
) {
    afficherErreur('La session du formulaire a expiré. Veuillez actualiser la page.', 403);
}

$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
$referent = $_SERVER['HTTP_REFERER'] ?? '';
$hoteAttendu = $_SERVER['HTTP_HOST'] ?? '';

if (
    ($origine !== '' && parse_url($origine, PHP_URL_HOST) !== $hoteAttendu) ||
    ($referent !== '' && parse_url($referent, PHP_URL_HOST) !== $hoteAttendu)
) {
    afficherErreur('La source de la requête n’est pas autorisée.', 403);
}

$nom = trim((string) ($_POST['nom'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$sujet = trim((string) ($_POST['sujet'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$siteWeb = trim((string) ($_POST['website'] ?? ''));

if ($siteWeb !== '') {
    afficherErreur('Les données du formulaire sont invalides.');
}

if ($nom === '' || $email === '' || $sujet === '' || $message === '') {
    afficherErreur('Tous les champs sont obligatoires.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    afficherErreur('Veuillez saisir une adresse e-mail valide.');
}

if (preg_match('/[\r\n]/', $nom . $email . $sujet) === 1) {
    afficherErreur('Les données du formulaire sont invalides.');
}

if (
    strlen($nom) > 100 ||
    strlen($email) > 254 ||
    strlen($sujet) > 150 ||
    strlen($message) > 5000
) {
    afficherErreur('Un ou plusieurs champs dépassent la longueur autorisée.');
}

$sujetEncode = 'Contact portfolio : ' . $sujet;
$contenu = "Nom : {$nom}\n";
$contenu .= "E-mail : {$email}\n\n";
$contenu .= "Message :\n{$message}\n";

$entetes = [
    'From: Portfolio <no-reply@localhost>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
];

$envoye = mail(
    DESTINATAIRE,
    $sujetEncode,
    wordwrap($contenu, 70),
    implode("\r\n", $entetes)
);

if (!$envoye) {
    afficherErreur(
        'Le serveur n’a pas pu envoyer le message. Veuillez réessayer plus tard.',
        500
    );
}
?>
<!doctype html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Message envoyé</title>
</head>

<body>
    <main class="form_result">
        <section>
            <h1>Merci pour votre message !</h1>
            <p>Votre demande a bien été envoyée.</p>
            <a class="primary_button" href="index.html">Retourner au portfolio</a>
        </section>
    </main>
</body>

</html>