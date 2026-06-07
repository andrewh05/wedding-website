/* 
  Wedding Website - Guest Page Swiper & Interaction Script
  Features: Horizontal Swipe Slider, Touch Swipe Controls, Keyboard Arrow Keys, Customizer configuration Sync, Dynamic Themes, Countdown Clock, RSVP localStorage submission, Music controllers
*/

// --- DEFAULT DEMO CONFIGURATION DATA ---
const DEFAULT_CONFIG = {
  names: "Elie & Elissa",
  date: "2026-08-01T16:00:00",
  location: "Andaket, Akkar",
  venue: "Andaket, Akkar",
  subtitle: "Save the Date",
  heroImage: "./assets/hero_bg.jpeg",
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  musicName: "Preset Romance Instrumental",
  theme: "navy",
  bride: {
    name: "Elissa Massoud",
    bio: "",
    avatar: "./assets/bride.png"
  },
  groom: {
    name: "Elie Rakwe",
    bio: "",
    avatar: "./assets/groom.jpeg"
  },
  timeline: [
    {
      time: "",
      title: "Groom's Home",
      desc: "Gathering at the groom's family home.",
      link: "https://maps.app.goo.gl/MMX6W7CVm2zL96aN9?g_st=ac"
    },
    {
      time: "",
      title: "Bride's Home",
      desc: "Gathering at the bride's family home.",
      link: "https://maps.app.goo.gl/xzUdKhTZ5mWpEKicA?g_st=aw"
    },
    {
      time: "07:00 PM",
      title: "Church Ceremony",
      desc: "Join us for the wedding ceremony.",
      link: "https://maps.app.goo.gl/gFrVCpBx1EbSKi2n7"
    },
    {
      time: "08:15 PM",
      title: "Restaurant Reception",
      desc: "Dinner and celebration with family and friends.",
      link: "https://maps.app.goo.gl/BbCRaZZmNiuwDoFo7"
    }
  ],
  registry: [
    { site: "Honeyfund", title: "Honeymoon Registry", desc: "Help us fund our dream honeymoon exploring the Greek Islands!", link: "#" },
    { site: "Amazon", title: "Home Essentials", desc: "Kitchenware, smart home devices, and linens for our cozy new apartment.", link: "#" },
    { site: "Pottery Barn", title: "Indoor & Garden Furniture", desc: "For patio seating and cozy bedroom furniture styles we love.", link: "#" }
  ]
};

const CONFIG_STORAGE_KEY = "wedding_website_config";
const DEFAULT_CONFIG_SIGNATURE = JSON.stringify(DEFAULT_CONFIG);

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function mergeConfigWithDefaults(config) {
  return {
    ...cloneDefaultConfig(),
    ...config,
    bride: {
      ...DEFAULT_CONFIG.bride,
      ...(config.bride || {})
    },
    groom: {
      ...DEFAULT_CONFIG.groom,
      ...(config.groom || {})
    }
  };
}

function normalizeConfig(config) {
  const nextConfig = mergeConfigWithDefaults(config);

  if (
    nextConfig.heroImage &&
    (nextConfig.heroImage.includes("unsplash.com") || nextConfig.heroImage.endsWith("hero_bg.png"))
  ) {
    nextConfig.heroImage = "./assets/hero_bg.jpeg";
  }
  if (nextConfig.bride.avatar && nextConfig.bride.avatar.includes("unsplash.com")) {
    nextConfig.bride.avatar = "./assets/bride.png";
  }
  if (nextConfig.groom.avatar && nextConfig.groom.avatar.includes("unsplash.com")) {
    nextConfig.groom.avatar = "./assets/groom.jpeg";
  }

  nextConfig._defaultConfigSignature = DEFAULT_CONFIG_SIGNATURE;
  nextConfig._customized = Boolean(config._customized);
  nextConfig.theme = "navy";

  return nextConfig;
}

// --- PRESET THEMES SPECIFICATIONS ---
const THEME_PRESETS = {
  navy: {
    primary: "#13233a",
    secondary: "#2f3f56",
    accent: "#8f9bab",
    accentHover: "#748296",
    bg: "#f3f5f8",
    cardBg: "rgba(255, 255, 255, 0.75)",
    text: "#182333",
    textLight: "#647082",
    border: "rgba(19, 35, 58, 0.16)",
    shadow: "rgba(0, 0, 0, 0.08)",
    fontHeading: "'Playfair Display', serif"
  },
  rosegold: {
    primary: "#2c3e50",
    secondary: "#34495e",
    accent: "#e0a899",
    accentHover: "#d09687",
    bg: "#fafafb",
    cardBg: "rgba(255, 255, 255, 0.8)",
    text: "#2c3e50",
    textLight: "#7f8c8d",
    border: "rgba(44, 62, 80, 0.1)",
    shadow: "rgba(44, 62, 80, 0.05)",
    fontHeading: "'Outfit', sans-serif"
  },
  bohemian: {
    primary: "#c86b51",
    secondary: "#8a9a86",
    accent: "#d68060",
    accentHover: "#c07050",
    bg: "#faf7f2",
    cardBg: "rgba(255, 255, 255, 0.85)",
    text: "#4a3b32",
    textLight: "#7a6a5d",
    border: "rgba(200, 107, 81, 0.12)",
    shadow: "rgba(138, 154, 134, 0.15)",
    fontHeading: "'Playfair Display', serif"
  },
  classicdark: {
    primary: "#ffffff",
    secondary: "#e0e0e0",
    accent: "#8f9bab",
    accentHover: "#748296",
    bg: "#121212",
    cardBg: "rgba(30, 30, 30, 0.75)",
    text: "#e0e0e0",
    textLight: "#aaaaaa",
    border: "rgba(255, 255, 255, 0.1)",
    shadow: "rgba(0, 0, 0, 0.4)",
    fontHeading: "'Playfair Display', serif"
  }
};

let currentConfig = cloneDefaultConfig();
let activeRsvpInvite = null;

function normalizeGuestLimit(value, fallback = 20) {
  const guestLimit = Number(value);
  if (!Number.isInteger(guestLimit) || guestLimit < 1) return fallback;
  return Math.min(guestLimit, 20);
}

function getInviteLimitFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return normalizeGuestLimit(params.get("limit"), null);
}

function getActiveGuestLimit() {
  return normalizeGuestLimit(activeRsvpInvite?.guestLimit, 20);
}

function updateGuestLimitDisplay() {
  const limitNote = document.getElementById("guestLimitNote");
  const guestInput = document.getElementById("guestCount");
  const guestLimit = getActiveGuestLimit();

  if (guestInput) {
    guestInput.max = String(guestLimit);
    const guestCount = Number(guestInput.value);
    if (!guestInput.disabled && Number.isInteger(guestCount) && guestCount > guestLimit) {
      guestInput.value = String(guestLimit);
    }
  }

  if (limitNote) {
    limitNote.textContent = activeRsvpInvite
      ? `Your invite allows up to ${guestLimit} guest${guestLimit === 1 ? "" : "s"}.`
      : "";
  }
}

function saveLocalConfig(nextConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(nextConfig));
}

// --- DOM CONFIGURATION LOADER ---
async function loadConfiguration() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("resetConfig")) {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }

  const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      const savedConfig = JSON.parse(saved);
      const savedDefaultsAreStale =
        savedConfig._defaultConfigSignature !== DEFAULT_CONFIG_SIGNATURE && !savedConfig._customized;

      currentConfig = savedDefaultsAreStale ? cloneDefaultConfig() : savedConfig;
      currentConfig = normalizeConfig(currentConfig);
      saveLocalConfig(currentConfig);
    } catch (e) {
      console.error("Error parsing saved config:", e);
      currentConfig = normalizeConfig(cloneDefaultConfig());
      saveLocalConfig(currentConfig);
    }
  } else {
    // Save defaults to storage initially so dashboard is synchronized
    currentConfig = normalizeConfig(cloneDefaultConfig());
    saveLocalConfig(currentConfig);
  }

  if (window.WeddingSupabase?.isEnabled()) {
    try {
      const [remoteConfig, remoteRegistry] = await Promise.all([
        window.WeddingSupabase.getSiteConfig(),
        window.WeddingSupabase.listRegistryItems()
      ]);

      if (remoteConfig) {
        currentConfig = normalizeConfig(remoteConfig);
      }
      if (remoteRegistry && remoteRegistry.length > 0) {
        currentConfig.registry = remoteRegistry;
      }

      saveLocalConfig(currentConfig);
    } catch (error) {
      console.error("Supabase configuration load failed:", error);
    }
  }
  
  applyTheme(currentConfig.theme || "navy");
  applyContent(currentConfig);
  await loadRsvpInvite();
}

async function loadRsvpInvite() {
  const inviteId = new URLSearchParams(window.location.search).get("rsvp");
  if (!inviteId) return;

  const urlGuestLimit = getInviteLimitFromUrl();
  if (urlGuestLimit) {
    activeRsvpInvite = {
      id: inviteId,
      guestLimit: urlGuestLimit
    };
    updateGuestLimitDisplay();
    goToSlide(slides.indexOf("rsvp"));
  }

  if (!window.WeddingSupabase?.isEnabled()) return;

  try {
    const invite = await window.WeddingSupabase.getRsvp(inviteId);
    if (!invite) return;

    activeRsvpInvite = {
      ...invite,
      guestLimit: urlGuestLimit || normalizeGuestLimit(invite.guestLimit, 20)
    };
    const firstNameInput = document.getElementById("guestFirstName");
    const lastNameInput = document.getElementById("guestLastName");

    if (firstNameInput) {
      firstNameInput.value = invite.firstName || "";
      firstNameInput.readOnly = true;
    }
    if (lastNameInput) {
      lastNameInput.value = invite.lastName || "";
      lastNameInput.readOnly = true;
    }

    const isRejected = invite.attendance === "Not Attending";
    const inviteLimit = getActiveGuestLimit();
    const acceptedRadio = document.querySelector("input[name='attendance'][value='accepted']");
    const rejectedRadio = document.querySelector("input[name='attendance'][value='rejected']");
    if (acceptedRadio) acceptedRadio.checked = !isRejected;
    if (rejectedRadio) rejectedRadio.checked = isRejected;
    updateGuestLimitDisplay();

    const guestInput = document.getElementById("guestCount");
    if (guestInput) {
      guestInput.disabled = isRejected;
      guestInput.value = isRejected ? "0" : String(Math.min(invite.guestCount || 1, inviteLimit));
    }

    goToSlide(slides.indexOf("rsvp"));
  } catch (error) {
    console.error("RSVP invitation load failed:", error);
  }
}

// --- APPLY CUSTOM PROPERTY THEMES ---
function applyTheme(themeName) {
  const preset = THEME_PRESETS[themeName] || THEME_PRESETS.navy;
  const root = document.documentElement;
  
  root.style.setProperty("--theme-primary", preset.primary);
  root.style.setProperty("--theme-secondary", preset.secondary);
  root.style.setProperty("--theme-accent", preset.accent);
  root.style.setProperty("--theme-accent-hover", preset.accentHover);
  root.style.setProperty("--theme-bg", preset.bg);
  root.style.setProperty("--theme-card-bg", preset.cardBg);
  root.style.setProperty("--theme-text", preset.text);
  root.style.setProperty("--theme-text-light", preset.textLight);
  root.style.setProperty("--theme-border", preset.border);
  root.style.setProperty("--theme-shadow", preset.shadow);
  root.style.setProperty("--font-heading", preset.fontHeading);

  // Special visual handling for dark mode background layers
  if (themeName === "classicdark") {
    document.body.style.backgroundColor = "#121212";
    const coupleCardHeader = document.querySelector(".couple-divider");
    if(coupleCardHeader) coupleCardHeader.style.color = "#8f9bab";
  } else {
    document.body.style.backgroundColor = preset.bg;
  }
}

// --- POPULATE LIVE DOM CONTENT ---
function applyContent(config) {
  // Title & Header Texts
  document.title = `${config.names} - Wedding Website`;
  const logoEl = document.getElementById("navLogo");
  if (logoEl) logoEl.textContent = config.names.split("&").map(n => n.trim()[0]).join(" & ");
  
  const heroSubtitleEl = document.getElementById("heroSubtitle");
  if (heroSubtitleEl) heroSubtitleEl.textContent = config.subtitle || "Save the Date";

  const heroTitleEl = document.getElementById("heroTitle");
  if (heroTitleEl) heroTitleEl.textContent = config.names;

  const heroMetaEl = document.getElementById("heroMeta");
  if (heroMetaEl) {
    const d = new Date(config.date);
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    heroMetaEl.innerHTML = `${dateFormatted} &bull; ${config.location}`;
  }

  const heroBgEl = document.getElementById("heroBg");
  if (heroBgEl && config.heroImage) {
    heroBgEl.style.backgroundImage = `url('${config.heroImage}')`;
  }

  // Couples Details
  const brideName = document.getElementById("brideName");
  const brideBio = document.getElementById("brideBio");
  const brideAvatar = document.getElementById("brideAvatar");
  if (brideName && config.bride) {
    brideName.textContent = config.bride.name;
    brideBio.textContent = config.bride.bio;
    brideAvatar.src = config.bride.avatar || "./assets/bride.png";
  }

  const groomName = document.getElementById("groomName");
  const groomBio = document.getElementById("groomBio");
  const groomAvatar = document.getElementById("groomAvatar");
  if (groomName && config.groom) {
    groomName.textContent = config.groom.name;
    groomBio.textContent = config.groom.bio;
    groomAvatar.src = config.groom.avatar || "./assets/groom.jpeg";
  }

  // Ambient Audio Source Update
  const audioEl = document.getElementById("bgAudio");
  if (audioEl) {
    const sourceEl = audioEl.querySelector("source");
    if (sourceEl && sourceEl.src !== config.musicUrl) {
      sourceEl.src = config.musicUrl;
      audioEl.load(); // Reload track source
    }
  }

  // Dynamic Event Timeline Builder
  const timelineContainer = document.getElementById("timelineEventsContainer");
  if (timelineContainer && config.timeline) {
    timelineContainer.innerHTML = "";
    config.timeline.forEach((item) => {
      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";
      
      timelineItem.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-card glass-panel">
          ${item.time ? `<span class="timeline-time">${item.time}</span>` : ""}
          <h3 class="timeline-title">${item.title}</h3>
          <p class="timeline-desc">${item.desc}</p>
          ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="btn btn-text timeline-link"><i class="fa-solid fa-location-dot"></i> Open map</a>` : ""}
        </div>
      `;
      timelineContainer.appendChild(timelineItem);
    });
  }

  // Restart Countdown Engine with new target
  startCountdown(config.date);
}

// --- COUNTDOWN SCHEDULER ENGINE ---
let countdownInterval;
function startCountdown(targetDateString) {
  if (countdownInterval) clearInterval(countdownInterval);
  
  const targetDate = new Date(targetDateString).getTime();
  
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minsEl = document.getElementById("minutes");
    const secsEl = document.getElementById("seconds");
    
    if (distance < 0) {
      clearInterval(countdownInterval);
      if (daysEl) {
        daysEl.textContent = "W";
        hoursEl.textContent = "E";
        minsEl.textContent = "D";
        secsEl.textContent = "!";
        
        const subtitleEl = document.getElementById("heroSubtitle");
        if (subtitleEl) subtitleEl.textContent = "We are Married!";
      }
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }
  
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

// --- SWIPE SLIDER LOGIC ---
const slides = ["hero", "couple", "timeline", "registry", "rsvp"];
let currentSlideIndex = 0;

function goToSlide(index) {
  if (index < 0 || index >= slides.length) return;
  currentSlideIndex = index;
  const targetHash = `#${slides[index]}`;

  if (window.location.hash !== targetHash) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}${targetHash}`);
  }
  
  // Transition the slider wrapper horizontally
  const wrapper = document.getElementById("swipeWrapper");
  if (wrapper) {
    const targetSlide = document.getElementById(slides[index]);
    wrapper.style.width = `${slides.length * 100}vw`;
    wrapper.style.transform = `translateX(-${targetSlide?.offsetLeft || 0}px)`;
  }
  
  // Highlight active link in Navbar header
  const navLinks = document.querySelectorAll(".nav-menu .nav-link");
  navLinks.forEach((link, idx) => {
    if (idx === index) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Highlight active dot in Pagination indicators
  const dots = document.querySelectorAll(".pagination-dot");
  dots.forEach((dot, idx) => {
    if (idx === index) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  // Toggle visual states of Left / Right swipe arrows
  const prevBtn = document.getElementById("prevSlideBtn");
  const nextBtn = document.getElementById("nextSlideBtn");
  if (prevBtn) prevBtn.style.display = index === 0 ? "none" : "flex";
  if (nextBtn) nextBtn.style.display = index === slides.length - 1 ? "none" : "flex";

  document.body.classList.toggle("registry-active", slides[index] === "registry");

  // Seamlessly add scrolled styling to navbar if not on Home hero screen
  const header = document.getElementById("navHeader");
  if (header) {
    if (index > 0) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
}

// Expose goToSlide globally so inline triggers like hero RSVP button work
window.goToSlide = goToSlide;

function nextSlide() {
  if (currentSlideIndex < slides.length - 1) {
    goToSlide(currentSlideIndex + 1);
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    goToSlide(currentSlideIndex - 1);
  }
}

// --- BINDING SLIDER CONTROLS ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial configuration bootstrap
  loadConfiguration();

  // Initialize arrow buttons visibility
  const initialSlideIndex = Math.max(0, slides.indexOf(window.location.hash.replace("#", "")));
  goToSlide(initialSlideIndex);

  // 2. Navbar click binders
  document.querySelectorAll(".nav-menu .nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const slideIndex = parseInt(link.getAttribute("data-slide"));
      goToSlide(slideIndex);
      
      // Close mobile menu if open
      if (window.innerWidth <= 768) {
        navMenu.style.display = "none";
      }
    });
  });

  // 3. Pagination dots click binders
  document.querySelectorAll(".pagination-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const slideIndex = parseInt(dot.getAttribute("data-slide"));
      goToSlide(slideIndex);
    });
  });

  // 4. Navigation arrows click binders
  const prevBtn = document.getElementById("prevSlideBtn");
  const nextBtn = document.getElementById("nextSlideBtn");
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  // 5. Keyboard Navigation hooks
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      // Prevent key triggers if user is actively writing inside form inputs
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "SELECT") return;
      nextSlide();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "SELECT") return;
      prevSlide();
    }
  });

  // 6. Touch gestures handlers (Mobile swipe triggers)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const container = document.querySelector(".swipe-container");
  if (container) {
    container.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    container.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleTouchSwipe();
    }, { passive: true });
  }

  function handleTouchSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Validate horizontal swipe (horizontal movement exceeds vertical, and crosses 50px threshold)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        prevSlide(); // Swiped right -> previous slide
      } else {
        nextSlide(); // Swiped left -> next slide
      }
    }
  }
});

// --- MOBILE NAV TOGGLE (RESPONSIVE) ---
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    if (navMenu.style.display === "flex") {
      navMenu.style.flexDirection = "column";
      navMenu.style.position = "absolute";
      navMenu.style.top = "100%";
      navMenu.style.left = "0";
      navMenu.style.width = "100%";
      navMenu.style.backgroundColor = "var(--theme-bg)";
      navMenu.style.padding = "2rem";
      navMenu.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";
    }
  });
}

// --- RSVP LOCALSTORAGE SUBMITTER ---
const rsvpForm = document.getElementById("rsvpForm");
const rsvpSuccessAlert = document.getElementById("rsvpSuccessAlert");
const rsvpErrorAlert = document.getElementById("rsvpErrorAlert");
const guestCountInput = document.getElementById("guestCount");
const attendanceRadios = document.querySelectorAll("input[name='attendance']");

if (guestCountInput) {
  guestCountInput.addEventListener("input", () => {
    const guestLimit = getActiveGuestLimit();
    const guestCount = Number(guestCountInput.value);

    if (Number.isInteger(guestCount) && guestCount > guestLimit) {
      guestCountInput.value = String(guestLimit);
    }
  });
}

attendanceRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    const isRejected = document.querySelector("input[name='attendance']:checked")?.value === "rejected";
    if (guestCountInput) {
      guestCountInput.disabled = isRejected;
      guestCountInput.value = isRejected ? "0" : "1";
      updateGuestLimitDisplay();
    }
  });
});

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById("guestFirstName").value.trim();
    const lastName = document.getElementById("guestLastName").value.trim();
    const attendance = document.querySelector("input[name='attendance']:checked")?.value || "accepted";
    const guestCount = parseInt(document.getElementById("guestCount").value, 10);
    const isAccepted = attendance === "accepted";
    const guestLimit = getActiveGuestLimit();
    
    if (!firstName || !lastName || (isAccepted && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > guestLimit))) {
      showRsvpAlert(rsvpErrorAlert);
      return;
    }
    
    let guestResponse = {
      id: activeRsvpInvite?.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      firstName,
      lastName,
      guestCount: isAccepted ? guestCount : 0,
      guestLimit: activeRsvpInvite?.guestLimit || guestLimit,
      preserveGuestLimit: Boolean(activeRsvpInvite),
      email: "-",
      attendance: isAccepted ? "Attending" : "Not Attending",
      meal: "-",
      dietary: "-",
      song: "-",
      timestamp: new Date().toISOString()
    };
    
    try {
      if (window.WeddingSupabase?.isEnabled()) {
        await window.WeddingSupabase.saveRsvp(guestResponse);
      } else {
        let rsvps = [];
        const savedRsvps = localStorage.getItem("wedding_rsvps");
        if (savedRsvps) {
          try {
            rsvps = JSON.parse(savedRsvps);
          } catch (err) {
            rsvps = [];
          }
        }

        rsvps.push(guestResponse);
        localStorage.setItem("wedding_rsvps", JSON.stringify(rsvps));
      }
    } catch (error) {
      console.error("RSVP submission failed:", error);
      showRsvpAlert(rsvpErrorAlert);
      return;
    }
    
    // Successful actions feedback
    showRsvpAlert(rsvpSuccessAlert);
    if (!activeRsvpInvite) {
      rsvpForm.reset();
      document.getElementById("guestCount").disabled = false;
      document.getElementById("guestCount").value = "1";
    } else {
      activeRsvpInvite = {
        ...activeRsvpInvite,
        ...guestResponse
      };
      updateGuestLimitDisplay();
    }
    
    // Trigger customizer event if inside dashboard context frame
    window.dispatchEvent(new Event("rsvp-submitted"));
  });
}

function showRsvpAlert(alertEl) {
  rsvpSuccessAlert.style.display = "none";
  rsvpErrorAlert.style.display = "none";
  
  alertEl.style.display = "block";
  alertEl.style.animation = "fadeIn 0.3s ease";
  
  setTimeout(() => {
    alertEl.style.display = "none";
  }, 6000);
}

// --- AMBIENT BG MUSIC CONTROLLER ---
const musicPlayerBtn = document.getElementById("musicPlayerBtn");
const musicWave = document.getElementById("musicWave");
const musicStatusText = document.getElementById("musicStatusText");
const bgAudio = document.getElementById("bgAudio");

if (musicPlayerBtn && bgAudio) {
  musicPlayerBtn.addEventListener("click", () => {
    if (bgAudio.paused) {
      // Browser autoplay policy might block first load without click
      bgAudio.play().then(() => {
        musicWave.classList.remove("paused");
        musicStatusText.textContent = "Mute Music";
      }).catch(err => {
        console.error("Playback error:", err);
      });
    } else {
      bgAudio.pause();
      musicWave.classList.add("paused");
      musicStatusText.textContent = "Play Music";
    }
  });
}

// --- LIVE EDITING STORAGE LISTENER ---
// Listens for updates from Dashboard to update UI themes and texts instantly
window.addEventListener("storage", (e) => {
  if (e.key === CONFIG_STORAGE_KEY) {
    loadConfiguration();
  }
});
