// ============ SolaTrip · comportamiento ============

// Número de WhatsApp en formato internacional, solo dígitos (ej.: 5215512345678).
const WHATSAPP_NUMBER = "525528865136";

// --- Al recargar la página, volver arriba (los enlaces directos a una sección siguen funcionando) ---
const navEntry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
const isReload = navEntry ? navEntry.type === "reload" : (performance.navigation && performance.navigation.type === 1);
if (isReload) {
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  window.addEventListener("load", () => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
}

// --- Barra de navegación: se vuelve sólida al bajar de la portada ---
const nav = document.getElementById("nav");
const hero = document.getElementById("inicio");
if (nav && hero && "IntersectionObserver" in window) {
  new IntersectionObserver(
    ([entry]) => nav.classList.toggle("is-solid", !entry.isIntersecting),
    { rootMargin: "-72px 0px 0px 0px" }
  ).observe(hero);
}

// --- Menú de celular ---
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("menu");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

if (toggle && menu) {
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setMenu(false);
  });
}

// --- Formulario: arma el mensaje y abre WhatsApp ---
const form = document.getElementById("trip-form");
const statusBox = document.getElementById("form-status");

function showError(select, show) {
  const field = select.closest(".field");
  const msg = document.getElementById(select.getAttribute("aria-describedby"));
  field.classList.toggle("has-error", show);
  select.setAttribute("aria-invalid", show ? "true" : "false");
  if (msg) msg.hidden = !show;
}

if (form) {
  form.querySelectorAll("select[required]").forEach((sel) =>
    sel.addEventListener("change", () => showError(sel, !sel.value))
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const missing = [...form.querySelectorAll("select[required]")].filter((sel) => !sel.value);
    form.querySelectorAll("select[required]").forEach((sel) => showError(sel, !sel.value));
    if (missing.length) {
      missing[0].focus();
      return;
    }

    const lines = ["¡Hola, Paulina! Quiero mi itinerario de SolaTrip.", ""];
    new FormData(form).forEach((value, key) => {
      const text = String(value).trim();
      if (text) lines.push(`*${key}:* ${text}`);
    });
    const message = lines.join("\n");

    if (!WHATSAPP_NUMBER) {
      statusBox.hidden = false;
      statusBox.textContent = "El número de WhatsApp todavía no está configurado en la página.";
      return;
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    statusBox.hidden = false;
    statusBox.textContent = "Abriendo WhatsApp con tu mensaje listo. Solo dale enviar.";
    window.open(url, "_blank", "noopener");
  });
}

// --- Animaciones al hacer scroll ---
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const groups = [
  ".includes .h2", ".checks li", ".page-shot", ".hand-note--pages",
  ".gift__text", ".gift__cover",
  ".steps .h2", ".steps__intro", ".route__stop",
  ".price .h2", ".postcard", ".postcard__stamp",
  ".about__text", ".polaroid",
  ".form-sec .h2", ".form-sec__intro", ".trip-form",
  ".faq .h2", ".faq details"
];
const staggered = { ".checks li": 70, ".route__stop": 140, ".faq details": 60, ".page-shot": 180 };
const delays = { ".postcard__stamp": 450, ".gift__cover": 150, ".polaroid": 150, ".hand-note--pages": 700 };

if (!reduceMotion && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("reveal");
      const d = (staggered[sel] ? i * staggered[sel] : 0) + (delays[sel] || 0);
      if (d) el.style.setProperty("--d", d + "ms");
      io.observe(el);
    });
  });

  // Parallax suave de la foto de portada (solo en pantallas grandes)
  const heroImg = document.querySelector(".hero__photo img");
  const wide = window.matchMedia("(min-width: 641px)");
  let ticking = false;
  const parallax = () => {
    ticking = false;
    if (!heroImg || !wide.matches) { if (heroImg) heroImg.style.transform = ""; return; }
    const y = window.scrollY;
    if (y > window.innerHeight * 1.2) return;
    heroImg.style.transform = `translate3d(0, ${y * 0.22}px, 0) scale(1.04)`;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
  parallax();
} else {
  document.documentElement.classList.remove("js");
}
