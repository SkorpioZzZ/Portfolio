const sections = [...document.querySelectorAll("main > section")];

const sectionRail = document.createElement("nav");
sectionRail.className = "section_rail";
sectionRail.setAttribute("aria-hidden", "true");
sections.forEach((section, index) => {
  const railLink = document.createElement("a");
  railLink.href = `#${section.id}`;
  railLink.tabIndex = -1;
  railLink.textContent = String(index + 1).padStart(2, "0");
  sectionRail.append(railLink);
});
document.body.append(sectionRail);

const navigationLinks = [
  ...document.querySelectorAll(".nav_bar a, .section_rail a"),
];
const contactForm = document.querySelector(".contact_form");
const projectCards = [...document.querySelectorAll(".projets li")];
const themeToggle = document.querySelector(".theme_toggle");
const THEME_KEY = "portfolio-theme";

// Le thème sauvegardé est appliqué au chargement par theme-init.js.
function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Stockage indisponible : le thème s'applique sans être mémorisé.
  }
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

function updateThemeToggle() {
  const isLightTheme = document.documentElement.dataset.theme === "light";

  themeToggle?.setAttribute("aria-pressed", String(isLightTheme));
  if (themeToggle) {
    const nextTheme = isLightTheme ? "sombre" : "clair";
    themeToggle.setAttribute("aria-label", `Activer le thème ${nextTheme}`);
    themeToggle.setAttribute("title", `Activer le thème ${nextTheme}`);
  }
}

updateThemeToggle();

themeToggle?.addEventListener("click", () => {
  const isLightTheme = document.documentElement.dataset.theme === "light";

  if (isLightTheme) {
    delete document.documentElement.dataset.theme;
    storeTheme("dark");
  } else {
    document.documentElement.dataset.theme = "light";
    storeTheme("light");
  }

  updateThemeToggle();
});

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const suffix = counter.dataset.suffix ?? "";
  const duration = 900;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(target * progress);

    counter.textContent = `${String(value).padStart(2, "0")}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

if (!prefersReducedMotion) {
  document.querySelectorAll("[data-count]").forEach(animateCounter);
}

sections.forEach((section) => {
  section.classList.add("reveal");
});

if (prefersReducedMotion) {
  sections.forEach((section) => section.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );

  sections.forEach((section) => revealObserver.observe(section));
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navigationLinks.forEach((link) => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`,
        );
      });
    });
  },
  { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
);

sections.forEach((section) => sectionObserver.observe(section));

projectCards.forEach((card) => {
  card.addEventListener("mouseenter", () => card.classList.add("is-hovered"));
  card.addEventListener("mouseleave", () =>
    card.classList.remove("is-hovered"),
  );
  card.addEventListener("focusin", () => card.classList.add("is-hovered"));
  card.addEventListener("focusout", (event) => {
    if (!card.contains(event.relatedTarget)) {
      card.classList.remove("is-hovered");
    }
  });
});

const errorMessages = {
  name: "Veuillez saisir votre nom.",
  email: "Veuillez saisir une adresse e-mail valide.",
  subject: "Veuillez saisir un sujet.",
  message: "Veuillez saisir un message.",
};

function showFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");
  let error = document.getElementById(`${field.id}-error`);

  if (!error) {
    error = document.createElement("p");
    error.id = `${field.id}-error`;
    error.className = "field_error";
    field.closest("div").append(error);
  }

  error.textContent = message;
  field.setAttribute("aria-describedby", error.id);
}

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  document.getElementById(`${field.id}-error`)?.remove();
}

function validateField(field) {
  const value = field.value.trim();
  let message = "";

  if (!value) {
    message = errorMessages[field.name];
  } else if (field.type === "email" && !field.validity.valid) {
    message = "Veuillez saisir une adresse e-mail valide.";
  }

  if (message) {
    showFieldError(field, message);
    return false;
  }

  clearFieldError(field);
  return true;
}

if (contactForm) {
  const fields = [
    ...contactForm.querySelectorAll(
      'input:not([type="hidden"]):not([name="botcheck"]), textarea',
    ),
  ];
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formStatus = contactForm.querySelector(".form_status");

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formIsValid = fields.every((field) => validateField(field));

    if (!formIsValid) {
      fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }

    if (!submitButton || !formStatus) {
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Transmission en cours...";
    formStatus.hidden = true;
    formStatus.className = "form_status";

    try {
      const response = await fetch(contactForm.action, {
        method: contactForm.method,
        body: new FormData(contactForm),
      });
      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "L’envoi du message a échoué.");
      }

      contactForm.reset();
      formStatus.textContent =
        "[OK] Message transmis. Merci, je vous répondrai rapidement.";
      formStatus.classList.add("success");
    } catch (error) {
      formStatus.textContent = `[ERR] ${
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer votre message. Veuillez réessayer."
      }`;
      formStatus.classList.add("error");
    } finally {
      formStatus.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = "Transmettre le message";
    }
  });
}

const backToTop = document.createElement("button");
backToTop.type = "button";
backToTop.className = "back_to_top";
backToTop.textContent = "▲ HAUT";
backToTop.setAttribute("aria-label", "Retourner en haut de la page");
document.body.append(backToTop);

const navigationBar = document.querySelector(".nav_bar");

function updateScrollProgress() {
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress =
    scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;

  navigationBar?.style.setProperty("--scroll-progress", progress.toFixed(4));
}

updateScrollProgress();

window.addEventListener(
  "scroll",
  () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 500);
    updateScrollProgress();
  },
  { passive: true },
);

window.addEventListener("resize", updateScrollProgress);

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});
