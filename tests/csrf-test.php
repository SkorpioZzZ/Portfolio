<?php

declare(strict_types=1);

const ROOT = __DIR__ . '/..';
const HOST = '127.0.0.1';

final class HttpResponse
{
    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public readonly int $status,
        public readonly array $headers,
        public readonly string $body,
    ) {
    }
}

/**
 * @param array<string, string> $headers
 * @param array<string, string> $data
 */
function request(string $url, string $method, array $headers = [], array $data = []): HttpResponse
{
    global $_SESSION_COOKIE;

    $requestHeaders = $headers;
    $requestHeaders['Cookie'] = $_SESSION_COOKIE ?? '';

    $options = [
        'http' => [
            'method' => $method,
            'ignore_errors' => true,
            'header' => implode(
                "\r\n",
                array_map(
                    static fn (string $name, string $value): string => "{$name}: {$value}",
                    array_keys($requestHeaders),
                    $requestHeaders,
                ),
            ),
        ],
    ];

    if ($data !== []) {
        $options['http']['content'] = http_build_query($data);
    }

    $body = file_get_contents($url, false, stream_context_create($options));
    if ($body === false || !isset($http_response_header)) {
        throw new RuntimeException("La requête {$method} {$url} a échoué.");
    }

    $status = (int) preg_replace('/^HTTP\/\S+ (\d+).*$/', '$1', $http_response_header[0]);
    $responseHeaders = [];
    foreach ($http_response_header as $header) {
        if (str_contains($header, ':')) {
            [$name, $value] = explode(':', $header, 2);
            $responseHeaders[strtolower($name)] = trim($value);
        }
    }

    if (isset($responseHeaders['set-cookie'])) {
        $_SESSION_COOKIE = explode(';', $responseHeaders['set-cookie'], 2)[0];
    }

    return new HttpResponse($status, $responseHeaders, $body);
}

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$port = random_int(18080, 18999);
$process = proc_open(
    [PHP_BINARY, '-S', HOST . ':' . $port, '-t', ROOT],
    [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ],
    $pipes,
    ROOT,
);

if (!is_resource($process)) {
    throw new RuntimeException('Impossible de démarrer le serveur PHP de test.');
}

try {
    $url = 'http://' . HOST . ':' . $port;
    $ready = false;
    for ($attempt = 0; $attempt < 20; $attempt++) {
        usleep(50_000);
        $probe = @file_get_contents($url . '/csrf-token.php');
        if ($probe !== false) {
            $ready = true;
            break;
        }
    }
    assertTrue($ready, 'Le serveur PHP de test ne répond pas.');

    $_SESSION_COOKIE = '';
    $tokenResponse = request($url . '/csrf-token.php', 'GET');
    assertTrue($tokenResponse->status === 200, 'GET csrf-token.php doit répondre 200.');
    assertTrue(isset($tokenResponse->headers['set-cookie']), 'La réponse doit créer une session.');

    $payload = json_decode($tokenResponse->body, true, 512, JSON_THROW_ON_ERROR);
    $token = $payload['token'] ?? null;
    assertTrue(is_string($token) && preg_match('/^[a-f0-9]{64}$/', $token) === 1, 'Le jeton doit contenir 32 octets aléatoires.');

    $secondResponse = request($url . '/csrf-token.php', 'GET');
    $secondPayload = json_decode($secondResponse->body, true, 512, JSON_THROW_ON_ERROR);
    assertTrue($secondPayload['token'] === $token, 'Le jeton doit rester stable dans la même session.');

    $wrongMethod = request($url . '/csrf-token.php', 'POST');
    assertTrue($wrongMethod->status === 405, 'POST csrf-token.php doit répondre 405.');

    $missingToken = request($url . '/traitement.php', 'POST', [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'Origin' => $url,
    ], []);
    assertTrue($missingToken->status === 403, 'Un formulaire sans jeton doit répondre 403.');

    $invalidToken = request($url . '/traitement.php', 'POST', [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'Origin' => $url,
    ], ['csrf_token' => str_repeat('0', 64)]);
    assertTrue($invalidToken->status === 403, 'Un jeton invalide doit répondre 403.');

    $externalOrigin = request($url . '/traitement.php', 'POST', [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'Origin' => 'https://evil.example',
    ], ['csrf_token' => $token]);
    assertTrue($externalOrigin->status === 403, 'Une origine externe doit répondre 403.');

    echo "CSRF test passed.\n";
} finally {
    proc_terminate($process);
    proc_close($process);
}
