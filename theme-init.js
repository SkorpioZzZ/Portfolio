// Applique le thème avant le premier affichage (évite le flash).
// Le choix manuel enregistré prime ; sinon on suit le réglage du système.
// Bloc { } : les variables restent locales et n'entrent pas en conflit avec script.js.
{
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem("portfolio-theme");
  } catch {
    // Stockage bloqué : on se rabat sur le réglage du système.
  }

  const prefersLight = window.matchMedia(
    "(prefers-color-scheme: light)",
  ).matches;

  if (savedTheme === "light" || (savedTheme === null && prefersLight)) {
    document.documentElement.dataset.theme = "light";
  }
}
