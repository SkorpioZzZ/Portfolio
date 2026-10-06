const sections = [...document.querySelectorAll("main > section")];
const navigationLinks = [...document.querySelectorAll(".nav_bar a")];
const contactForm = document.querySelector(".contact_form");
const projectCards = [...document.querySelectorAll(".projets li")];
const themeToggle = document.querySelector(".theme_toggle");
const savedTheme = localStorage.getItem("portfolio-theme");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (savedTheme === "light") {
  document.documentElement.dataset.theme = "light";
}

function updateThemeToggle() {
  const isLightTheme = document.documentElement.dataset.theme === "light";

  themeToggle?.setAttribute("aria-pressed", String(isLightTheme));
  if (themeToggle) {
    const nextTheme = isLightTheme ? "sombre" : "clair";
    themeToggle.textContent = `Thème ${nextTheme}`;
    themeToggle.setAttribute("aria-label", `Activer le thème ${nextTheme}`);
    themeToggle.setAttribute("title", `Activer le thème ${nextTheme}`);
  }
}

updateThemeToggle();

themeToggle?.addEventListener("click", () => {
  const isLightTheme = document.documentElement.dataset.theme === "light";

  if (isLightTheme) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem("portfolio-theme", "dark");
  } else {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("portfolio-theme", "light");
  }

  updateThemeToggle();
});

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
    { threshold: 0.12 },
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
  nom: "Veuillez saisir votre nom.",
  email: "Veuillez saisir une adresse e-mail valide.",
  sujet: "Veuillez saisir un sujet.",
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
    ...contactForm.querySelectorAll('input:not([name="website"]), textarea'),
  ];
  const csrfField = contactForm.querySelector('input[name="csrf_token"]');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const csrfError = document.getElementById("csrf-error");

  fetch("csrf-token.php", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Le serveur n’a pas fourni de jeton CSRF.");
      }
      return response.json();
    })
    .then(({ token }) => {
      if (typeof token !== "string" || token.length < 32) {
        throw new Error("Le jeton CSRF reçu est invalide.");
      }

      csrfField.value = token;
      submitButton.disabled = false;
    })
    .catch(() => {
      csrfError.hidden = false;
    });

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  contactForm.addEventListener("submit", (event) => {
    if (!csrfField.value) {
      event.preventDefault();
      csrfError.hidden = false;
      return;
    }

    const formIsValid = fields.every((field) => validateField(field));

    if (!formIsValid) {
      event.preventDefault();
      fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
    }
  });
}

const backToTop = document.createElement("button");
backToTop.type = "button";
backToTop.className = "back_to_top";
backToTop.textContent = "↑ Haut";
backToTop.setAttribute("aria-label", "Retourner en haut de la page");
document.body.append(backToTop);

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("is-visible", window.scrollY > 500);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});
