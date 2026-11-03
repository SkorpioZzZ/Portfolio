// Applique le thème sauvegardé avant le premier affichage (évite le flash sombre).
try {
  if (localStorage.getItem("portfolio-theme") === "light") {
    document.documentElement.dataset.theme = "light";
  }
} catch {
  // Stockage bloqué : on garde le thème par défaut.
}
