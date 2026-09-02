/* ==========================================================================
   PORTFOLIO SCRIPT
   Everything on this page is data-driven from the JSON files in /data.
   To change your content, edit the JSON files — you should rarely need to
   touch this file.

   Sections in this file:
   1. Data loading
   2. Theme (dark/light) handling
   3. Brand color customizer
   4. Navigation (render links, scroll-spy, mobile menu, sticky style)
   5. Hero (typewriter effect)
   6. Particle background (canvas)
   7. About / Tech Stack / Projects / Experience / Certifications / Footer renderers
   8. Contact form -> Google Sheets submission
   9. Init
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. DATA LOADING
   NOTE: fetch() of local JSON files requires the page to be served over
   http/https (e.g. `python -m http.server`, VS Code Live Server, or
   GitHub Pages). Opening index.html directly via file:// will block these
   requests in most browsers due to CORS rules on local files.
-------------------------------------------------------------------------- */
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function loadAllData() {
  const [config, techStack, projects, experience, certifications] = await Promise.all([
    loadJSON("data/config.json"),
    loadJSON("data/tech-stack.json"),
    loadJSON("data/projects.json"),
    loadJSON("data/experience.json"),
    loadJSON("data/certifications.json"),
  ]);
  return { config, techStack, projects, experience, certifications };
}

/* --------------------------------------------------------------------------
   2. THEME (DARK / LIGHT)
-------------------------------------------------------------------------- */
const THEME_KEY = "portfolio-theme";

function initTheme() {
  // The site is designed dark-first (matches the brand's particle-network look),
  // so default to dark unless the visitor previously chose light on this site.
  const saved = localStorage.getItem(THEME_KEY);
  const preferred = saved || "dark";
  document.documentElement.setAttribute("data-theme", preferred);

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });
}

/* --------------------------------------------------------------------------
   3. BRAND COLOR CUSTOMIZER
   Lets a visitor (i.e. you, while designing) live-preview accent and
   particle colors. Overrides are stored in localStorage as CSS variables
   set on the <html> element, so they persist across reloads in this
   browser. "Copy JSON" outputs the snippet to paste into data/config.json
   to make the change permanent for everyone.
-------------------------------------------------------------------------- */
const CUSTOM_COLORS_KEY = "portfolio-custom-colors";

function applyColorOverrides(overrides) {
  const root = document.documentElement;
  if (overrides.accentPrimary) root.style.setProperty("--accent-primary", overrides.accentPrimary);
  if (overrides.accentSecondary) root.style.setProperty("--accent-secondary", overrides.accentSecondary);
  if (overrides.particleColor) root.style.setProperty("--particle-color", overrides.particleColor);
  if (overrides.particleColor) {
    root.style.setProperty("--particle-line-rgb", hexToRgbString(overrides.particleColor));
  }
}

function hexToRgbString(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function initCustomizePanel(config) {
  const panel = document.getElementById("customize-panel");
  const backdrop = document.getElementById("customize-backdrop");
  const openBtn = document.getElementById("customize-toggle");
  const closeBtn = document.getElementById("customize-close");
  const resetBtn = document.getElementById("customize-reset");
  const copyBtn = document.getElementById("customize-copy");
  const output = document.getElementById("customize-output");

  const inputPrimary = document.getElementById("color-accent-primary");
  const inputSecondary = document.getElementById("color-accent-secondary");
  const inputParticles = document.getElementById("color-particles");

  // Seed the color inputs from saved overrides, or the current theme's defaults
  const saved = JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) || "{}");
  const activeTheme = document.documentElement.getAttribute("data-theme");
  const themeDefaults = config.colors[activeTheme];

  inputPrimary.value = saved.accentPrimary || themeDefaults.accentPrimary;
  inputSecondary.value = saved.accentSecondary || themeDefaults.accentSecondary;
  inputParticles.value = saved.particleColor || config.particles.color;

  if (Object.keys(saved).length) applyColorOverrides(saved);

  function openPanel() {
    panel.classList.add("is-open");
    backdrop.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  }
  function closePanel() {
    panel.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  openBtn.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  function currentOverrides() {
    return {
      accentPrimary: inputPrimary.value,
      accentSecondary: inputSecondary.value,
      particleColor: inputParticles.value,
    };
  }

  function persistAndApply() {
    const overrides = currentOverrides();
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(overrides));
    applyColorOverrides(overrides);
  }

  [inputPrimary, inputSecondary, inputParticles].forEach((input) => {
    input.addEventListener("input", persistAndApply);
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(CUSTOM_COLORS_KEY);
    document.documentElement.style.removeProperty("--accent-primary");
    document.documentElement.style.removeProperty("--accent-secondary");
    document.documentElement.style.removeProperty("--particle-color");
    document.documentElement.style.removeProperty("--particle-line-rgb");
    inputPrimary.value = themeDefaults.accentPrimary;
    inputSecondary.value = themeDefaults.accentSecondary;
    inputParticles.value = config.particles.color;
    output.hidden = true;
  });

  copyBtn.addEventListener("click", () => {
    const overrides = currentOverrides();
    const snippet = {
      "colors.dark.accentPrimary / colors.light.accentPrimary": overrides.accentPrimary,
      "colors.dark.accentSecondary / colors.light.accentSecondary": overrides.accentSecondary,
      "particles.color": overrides.particleColor,
      "particles.lineColor": hexToRgbString(overrides.particleColor),
    };
    const text = JSON.stringify(snippet, null, 2);
    output.textContent = text;
    output.hidden = false;
    navigator.clipboard?.writeText(text).catch(() => {});
  });
}

/* --------------------------------------------------------------------------
   4. NAVIGATION
-------------------------------------------------------------------------- */
function renderNav(config) {
  document.getElementById("nav-brand").querySelector(".nav__brand-name").textContent = config.site.brandFirstName;
  document.querySelectorAll(".nav__brand-suffix").forEach((el) => (el.textContent = config.site.domainSuffix));

  const linksHTML = config.nav.links.map((l) => `<li><a href="${l.href}" data-nav-link>${l.label}</a></li>`).join("");
  document.getElementById("nav-links").innerHTML = linksHTML;
  document.getElementById("mobile-menu-links").innerHTML = linksHTML;
}

function initNavBehavior() {
  const navWrap = document.getElementById("nav-wrap");
  window.addEventListener("scroll", () => {
    navWrap.classList.toggle("is-scrolled", window.scrollY > 12);
  });

  // Mobile menu toggle
  const burger = document.getElementById("nav-burger");
  const mobileMenu = document.getElementById("mobile-menu");
  burger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    burger.classList.toggle("is-open", isOpen);
    burger.setAttribute("aria-expanded", String(isOpen));
  });
  document.querySelectorAll("#mobile-menu-links a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  // Scroll-spy: highlight the nav link matching the section in view
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
}

/* --------------------------------------------------------------------------
   5. HERO — typewriter effect
-------------------------------------------------------------------------- */
function renderHero(config) {
  document.getElementById("hero-badge").append(document.createTextNode(config.hero.badge));
  document.getElementById("hero-greeting-line").textContent = `${config.hero.greeting} ${config.hero.nameLine1}`;
  document.getElementById("hero-name-line").textContent = config.hero.nameLine2;
  document.getElementById("hero-desc").textContent = config.hero.description;

  const primaryBtn = document.getElementById("hero-btn-primary");
  primaryBtn.textContent = config.hero.primaryButton.text;
  primaryBtn.href = config.hero.primaryButton.href;

  const secondaryBtn = document.getElementById("hero-btn-secondary");
  secondaryBtn.textContent = config.hero.secondaryButton.text;
  secondaryBtn.href = config.hero.secondaryButton.href;

  initTypewriter(config.hero.typewriterRoles);
}

function initTypewriter(roles) {
  const el = document.getElementById("typewriter-text");
  if (!roles || !roles.length) return;

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const TYPE_SPEED = 70;
  const DELETE_SPEED = 40;
  const PAUSE_AFTER_TYPE = 1600;
  const PAUSE_AFTER_DELETE = 300;

  function tick() {
    const word = roles[roleIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = word.slice(0, charIndex);
      if (charIndex === word.length) {
        deleting = true;
        return setTimeout(tick, PAUSE_AFTER_TYPE);
      }
      return setTimeout(tick, TYPE_SPEED);
    }

    charIndex--;
    el.textContent = word.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      return setTimeout(tick, PAUSE_AFTER_DELETE);
    }
    return setTimeout(tick, DELETE_SPEED);
  }

  tick();
}

/* --------------------------------------------------------------------------
   6. PARTICLE BACKGROUND (canvas)
   A lightweight hand-rolled particle network: dots drift slowly and draw a
   line between any two that are close enough to each other.
-------------------------------------------------------------------------- */
function initParticles(particleConfig) {
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  const heroSection = document.getElementById("hero");

  let particles = [];
  let width, height;
  let animationId;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    width = canvas.width = heroSection.clientWidth;
    height = canvas.height = heroSection.clientHeight;
  }

  function makeParticles() {
    const count = particleConfig.count || 80;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * particleConfig.speed,
      vy: (Math.random() - 0.5) * particleConfig.speed,
      r: Math.random() * 1.6 + 0.8,
    }));
  }

  function getParticleColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--particle-color").trim() || particleConfig.color;
  }
  function getLineRgb() {
    return getComputedStyle(document.documentElement).getPropertyValue("--particle-line-rgb").trim() || particleConfig.lineColor;
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    const dotColor = getParticleColor();
    const lineRgb = getLineRgb();
    const maxDist = particleConfig.maxDistance || 150;

    // move + draw dots
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    });

    // draw connecting lines between near particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const opacity = 1 - dist / maxDist;
          ctx.strokeStyle = `rgba(${lineRgb}, ${opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(step);
  }

  resize();
  makeParticles();

  if (prefersReducedMotion) {
    step(); // draw a single static frame, skip continuous animation
  } else {
    step();
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationId);
    resize();
    makeParticles();
    step();
  });
}

/* --------------------------------------------------------------------------
   7. SECTION RENDERERS
-------------------------------------------------------------------------- */
function renderAbout(config) {
  document.getElementById("about-eyebrow").textContent = config.about.eyebrow;
  document.getElementById("about-title").textContent = config.about.title;
  document.getElementById("about-image").src = config.about.image;
  document.getElementById("about-image").alt = `${config.site.brandFirstName} ${config.site.brandLastName}`;

  const paraWrap = document.getElementById("about-paragraphs");
  paraWrap.innerHTML = config.about.paragraphs.map((p) => `<p>${p}</p>`).join("");

  const tagsWrap = document.getElementById("about-tags");
  tagsWrap.innerHTML = config.about.tags.map((t) => `<li class="tag">${t}</li>`).join("");
}

function renderTechStack(techStack) {
  const grid = document.getElementById("tech-grid");
  grid.innerHTML = techStack.categories
    .map((cat) => {
      const items = cat.items
        .map((item) => {
          const iconUrl = item.color
            ? `https://cdn.simpleicons.org/${item.icon}/${item.color}`
            : `https://cdn.simpleicons.org/${item.icon}`;
          // Falls back to a simple initial badge if the icon CDN is unreachable (e.g. offline)
          const initial = item.name.charAt(0).toUpperCase();
          return `
            <div class="tech-item">
              <img src="${iconUrl}" alt="${item.name}" loading="lazy" width="28" height="28"
                   onerror="this.outerHTML='<span class=\\'tech-item__fallback\\'>${initial}</span>'" />
              <span>${item.name}</span>
            </div>`;
        })
        .join("");
      return `
        <div class="tech-category">
          <h3>${cat.name}</h3>
          <div class="tech-category__items">${items}</div>
        </div>`;
    })
    .join("");
}

let allProjects = [];

function renderProjects(projects) {
  allProjects = projects;
  const categories = ["All", ...new Set(projects.map((p) => p.category))];
  const filterRow = document.getElementById("project-filters");
  filterRow.innerHTML = categories
    .map((cat, i) => `<button class="filter-btn ${i === 0 ? "is-active" : ""}" data-filter="${cat}">${cat}</button>`)
    .join("");

  filterRow.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterRow.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      const filtered = filter === "All" ? allProjects : allProjects.filter((p) => p.category === filter);
      drawProjectGrid(filtered);
    });
  });

  drawProjectGrid(projects);
}

function drawProjectGrid(projects) {
  const grid = document.getElementById("project-grid");
  grid.innerHTML = projects
    .map((p) => {
      const media =
        p.media.type === "video"
          ? `<video src="${p.media.src}" autoplay muted loop playsinline></video>`
          : `<img src="${p.media.src}" alt="${p.title}" loading="lazy" />`;

      const links = `
        <div class="project-card__links">
          ${p.liveLink ? `<a href="${p.liveLink}" target="_blank" rel="noopener">Live site →</a>` : ""}
          ${p.githubLink ? `<a href="${p.githubLink}" target="_blank" rel="noopener">Code →</a>` : ""}
        </div>`;

      return `
        <article class="project-card">
          <div class="project-card__media">
            <span class="project-card__badge">${p.category}</span>
            ${media}
          </div>
          <div class="project-card__body">
            <h3 class="project-card__title">${p.title}</h3>
            <p class="project-card__desc">${p.description}</p>
            <div class="project-card__tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
            ${p.liveLink || p.githubLink ? links : ""}
          </div>
        </article>`;
    })
    .join("");
}

function renderExperience(experience) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = experience
    .map(
      (e) => `
      <div class="timeline-item ${e.current ? "timeline-item--current" : ""}">
        <span class="timeline-item__dot"></span>
        <span class="timeline-item__period">${e.period}</span>
        <div class="timeline-item__card">
          <h3 class="timeline-item__role">${e.role}</h3>
          <p class="timeline-item__company">${e.company}</p>
          <p class="timeline-item__desc">${e.description}</p>
        </div>
      </div>`
    )
    .join("");
}

const AWARD_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/></svg>`;

function renderCertifications(certifications) {
  const grid = document.getElementById("cert-grid");
  grid.innerHTML = certifications
    .map(
      (c) => `
      <div class="cert-card">
        <div class="cert-card__icon">
          ${c.image ? `<img src="${c.image}" alt="${c.title}" loading="lazy" onerror="this.parentElement.innerHTML='${AWARD_ICON.replace(/'/g, "\\'")}'" />` : AWARD_ICON}
        </div>
        <h3 class="cert-card__title">${c.title}</h3>
        <p class="cert-card__issuer">${c.issuer}</p>
        <span class="cert-card__year">${c.year}</span>
        ${c.link ? `<a class="cert-card__link" href="${c.link}" target="_blank" rel="noopener">View credential →</a>` : ""}
      </div>`
    )
    .join("");
}

const SOCIAL_ICONS = {
  github: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.14c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.4-5.28 5.69.42.36.78 1.07.78 2.16v3.2c0 .3.21.66.79.55A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>`,
  linkedin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.37 4.25 5.44v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`,
  email: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>`,
};

function renderContact(config) {
  document.getElementById("contact-intro").textContent = config.contact.intro;

  const links = [
    { icon: "email", label: config.contact.email, href: `mailto:${config.contact.email}` },
    { icon: "github", label: "GitHub", href: config.contact.github },
    { icon: "linkedin", label: "LinkedIn", href: config.contact.linkedin },
  ];

  document.getElementById("contact-links").innerHTML = links
    .map(
      (l) => `
      <li>
        <a href="${l.href}" target="_blank" rel="noopener">
          <span class="icon-btn">${SOCIAL_ICONS[l.icon]}</span>
          ${l.label}
        </a>
      </li>`
    )
    .join("");

  document.getElementById("footer-socials").innerHTML = links
    .map((l) => `<li><a class="icon-btn" href="${l.href}" target="_blank" rel="noopener" aria-label="${l.label}">${SOCIAL_ICONS[l.icon]}</a></li>`)
    .join("");
}

function renderFooter(config) {
  const year = new Date().getFullYear();
  document.getElementById("footer-text").textContent =
    `© ${year} ${config.site.brandFirstName} ${config.site.brandLastName}. ${config.footer.text}`;
}

function applyMisc(config) {
  document.title = config.site.pageTitle;
  if (config.site.favicon) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = config.site.favicon;
    document.head.appendChild(link);
  }
}

/* --------------------------------------------------------------------------
   8. CONTACT FORM -> GOOGLE SHEETS
   Submits to a Google Apps Script Web App URL (set in data/config.json ->
   contact.formEndpoint). See README.md for the full setup guide.
   We POST as "text/plain" with a JSON body and use mode: "no-cors" because
   Apps Script Web Apps commonly don't return CORS headers; this means we
   can't read the response, so we optimistically show success once the
   request is sent without a network error.
-------------------------------------------------------------------------- */
function initContactForm(config) {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const submitBtn = document.getElementById("form-submit");
  const submitText = document.getElementById("form-submit-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    const endpoint = config.contact.formEndpoint;
    const payload = {
      name: document.getElementById("form-name").value.trim(),
      email: document.getElementById("form-email").value.trim(),
      message: document.getElementById("form-message").value.trim(),
      submittedAt: new Date().toISOString(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      status.textContent = "Please fill in every field.";
      status.classList.add("is-error");
      return;
    }

    if (!endpoint || endpoint.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
      status.textContent = "Contact form isn't connected yet — see README.md to link Google Sheets.";
      status.classList.add("is-error");
      return;
    }

    submitBtn.disabled = true;
    submitText.textContent = "Sending...";

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors", // Apps Script won't send CORS headers; we can't read the response
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      status.textContent = "Message sent — thank you! I'll reply within a day.";
      status.classList.add("is-success");
      form.reset();
    } catch (err) {
      console.error("Contact form submission failed:", err);
      status.textContent = "Something went wrong sending your message. Please email me directly instead.";
      status.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
      submitText.textContent = "Send message";
    }
  });
}

/* --------------------------------------------------------------------------
   9. INIT
-------------------------------------------------------------------------- */
async function init() {
  initTheme();

  try {
    const { config, techStack, projects, experience, certifications } = await loadAllData();

    applyMisc(config);
    renderNav(config);
    renderHero(config);
    renderAbout(config);
    renderTechStack(techStack);
    renderProjects(projects);
    renderExperience(experience);
    renderCertifications(certifications);
    renderContact(config);
    renderFooter(config);

    initNavBehavior();
    initCustomizePanel(config);
    initParticles(config.particles);
    initContactForm(config);
  } catch (err) {
    console.error(err);
    document.getElementById("main").innerHTML = `
      <div style="padding:120px 24px;text-align:center;">
        <h1 style="font-family:sans-serif;">Couldn't load site data</h1>
        <p style="color:#8b93a7;font-family:sans-serif;">
          This page needs to be served over http(s) for the JSON data files to load
          (opening index.html directly from disk won't work). Try running
          <code>python -m http.server</code> in this folder, or view it via GitHub Pages.
        </p>
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
