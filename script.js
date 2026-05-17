/* 
  Wedding Website - Guest Page Swiper & Interaction Script
  Features: Horizontal Swipe Slider, Touch Swipe Controls, Keyboard Arrow Keys, Customizer configuration Sync, Dynamic Themes, Countdown Clock, RSVP localStorage submission, Music controllers
*/

// --- DEFAULT DEMO CONFIGURATION DATA ---
const DEFAULT_CONFIG = {
  names: "Sarah & David",
  date: "2026-10-17T16:00:00",
  location: "Sonoma, CA",
  venue: "The Secret Garden, Sonoma",
  subtitle: "Save the Date",
  heroImage: "./assets/hero_bg.png",
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  musicName: "Preset Romance Instrumental",
  theme: "emerald", // 'emerald', 'rosegold', 'bohemian', 'classicdark'
  bride: {
    name: "Sarah Jenkins",
    bio: "Sarah is a designer who loves watercolor, botanical gardens, and morning espresso. She cannot wait to marry her best friend and celebrate under the Sonoma redwoods.",
    avatar: "./assets/bride.png"
  },
  groom: {
    name: "David Miller",
    bio: "David is a software architect who enjoys hiking coastal trails, roasting specialty coffee, and playing guitar. He is thrilled to embark on life's biggest adventure yet.",
    avatar: "./assets/groom.png"
  },
  timeline: [
    { time: "04:00 PM", title: "The Ceremony", desc: "The Vows & Exchange of Rings at our lovely outdoor redwood canopy." },
    { time: "05:00 PM", title: "Cocktail Hour", desc: "Enjoy live acoustic music, local wines, and gourmet signature appetizers." },
    { time: "06:30 PM", title: "Grand Reception & Dinner", desc: "A gourmet 3-course dinner under the fairy lights, followed by toasts." },
    { time: "09:00 PM", title: "Dancing & Send-off", desc: "Dancing the night away with the live band followed by a sparkler send-off." }
  ],
  registry: [
    { site: "Honeyfund", title: "Honeymoon Registry", desc: "Help us fund our dream honeymoon exploring the Greek Islands!", link: "#" },
    { site: "Amazon", title: "Home Essentials", desc: "Kitchenware, smart home devices, and linens for our cozy new apartment.", link: "#" },
    { site: "Pottery Barn", title: "Indoor & Garden Furniture", desc: "For patio seating and cozy bedroom furniture styles we love.", link: "#" }
  ]
};

// --- PRESET THEMES SPECIFICATIONS ---
const THEME_PRESETS = {
  emerald: {
    primary: "#0b3c2e",
    secondary: "#1a5c49",
    accent: "#d4af37",
    accentHover: "#c49e27",
    bg: "#fdfbf7",
    cardBg: "rgba(255, 255, 255, 0.75)",
    text: "#2c3531",
    textLight: "#606f6b",
    border: "rgba(11, 60, 46, 0.15)",
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
    accent: "#d4af37",
    accentHover: "#bfa030",
    bg: "#121212",
    cardBg: "rgba(30, 30, 30, 0.75)",
    text: "#e0e0e0",
    textLight: "#aaaaaa",
    border: "rgba(255, 255, 255, 0.1)",
    shadow: "rgba(0, 0, 0, 0.4)",
    fontHeading: "'Playfair Display', serif"
  }
};

let currentConfig = { ...DEFAULT_CONFIG };

// --- DOM CONFIGURATION LOADER ---
function loadConfiguration() {
  const saved = localStorage.getItem("wedding_website_config");
  if (saved) {
    try {
      currentConfig = JSON.parse(saved);
      // Seamlessly upgrade Unsplash placeholder assets to our stunning generated local assets
      if (currentConfig.heroImage && currentConfig.heroImage.includes("unsplash.com")) {
        currentConfig.heroImage = "./assets/hero_bg.png";
      }
      if (currentConfig.bride && currentConfig.bride.avatar && currentConfig.bride.avatar.includes("unsplash.com")) {
        currentConfig.bride.avatar = "./assets/bride.png";
      }
      if (currentConfig.groom && currentConfig.groom.avatar && currentConfig.groom.avatar.includes("unsplash.com")) {
        currentConfig.groom.avatar = "./assets/groom.png";
      }
      localStorage.setItem("wedding_website_config", JSON.stringify(currentConfig));
    } catch (e) {
      console.error("Error parsing saved config:", e);
      currentConfig = { ...DEFAULT_CONFIG };
    }
  } else {
    // Save defaults to storage initially so dashboard is synchronized
    localStorage.setItem("wedding_website_config", JSON.stringify(DEFAULT_CONFIG));
  }
  
  applyTheme(currentConfig.theme || "emerald");
  applyContent(currentConfig);
}

// --- APPLY CUSTOM PROPERTY THEMES ---
function applyTheme(themeName) {
  const preset = THEME_PRESETS[themeName] || THEME_PRESETS.emerald;
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
    if(coupleCardHeader) coupleCardHeader.style.color = "#d4af37";
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
    groomAvatar.src = config.groom.avatar || "./assets/groom.png";
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
          <span class="timeline-time">${item.time}</span>
          <h3 class="timeline-title">${item.title}</h3>
          <p class="timeline-desc">${item.desc}</p>
        </div>
      `;
      timelineContainer.appendChild(timelineItem);
    });
  }

  // Dynamic Registry Builder
  const registryContainer = document.getElementById("registryGrid");
  if (registryContainer && config.registry) {
    registryContainer.innerHTML = "";
    config.registry.forEach((item) => {
      const registryCard = document.createElement("div");
      registryCard.className = "registry-card glass-panel";
      
      registryCard.innerHTML = `
        <div class="registry-logo">${item.site}</div>
        <h3 class="registry-title">${item.title}</h3>
        <p class="registry-desc">${item.desc}</p>
        <a href="${item.link}" target="_blank" class="btn btn-secondary">Explore Registry</a>
      `;
      registryContainer.appendChild(registryCard);
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
const slides = ["hero", "couple", "timeline", "gallery", "registry", "rsvp"];
let currentSlideIndex = 0;

function goToSlide(index) {
  if (index < 0 || index >= slides.length) return;
  currentSlideIndex = index;
  
  // Transition the slider wrapper horizontally
  const wrapper = document.getElementById("swipeWrapper");
  if (wrapper) {
    wrapper.style.transform = `translateX(-${index * 100}vw)`;
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
  goToSlide(0);

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

// --- GALLERY ISOTOPE FILTER ---
const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItems = document.querySelectorAll(".gallery-item");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    
    const filterValue = btn.getAttribute("data-filter");
    
    galleryItems.forEach((item) => {
      if (filterValue === "all" || item.getAttribute("data-category") === filterValue) {
        item.style.display = "block";
        item.style.animation = "fadeIn 0.5s ease forwards";
      } else {
        item.style.display = "none";
      }
    });
  });
});

// --- PHOTO GALLERY ZOOM LIGHTBOX MODAL ---
const galleryModal = document.getElementById("galleryModal");
const galleryModalImg = document.getElementById("galleryModalImg");
const closeGalleryModal = document.getElementById("closeGalleryModal");

galleryItems.forEach((item) => {
  item.addEventListener("click", () => {
    const imgSrc = item.querySelector(".gallery-img").src;
    if (galleryModal && galleryModalImg) {
      galleryModalImg.src = imgSrc;
      galleryModal.classList.add("active");
    }
  });
});

if (closeGalleryModal) {
  closeGalleryModal.addEventListener("click", () => {
    galleryModal.classList.remove("active");
  });
}

if (galleryModal) {
  galleryModal.addEventListener("click", (e) => {
    if (e.target === galleryModal) {
      galleryModal.classList.remove("active");
    }
  });
}

// --- RSVP CONDITIONAL FIELD TOGGLING ---
const rsvpAttendanceRadios = document.querySelectorAll("input[name='attendance']");
const attendingDetails = document.getElementById("attendingDetails");

rsvpAttendanceRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "attending") {
      attendingDetails.style.display = "block";
      attendingDetails.style.animation = "fadeIn 0.4s ease forwards";
    } else {
      attendingDetails.style.display = "none";
    }
  });
});

// --- RSVP LOCALSTORAGE SUBMITTER ---
const rsvpForm = document.getElementById("rsvpForm");
const rsvpSuccessAlert = document.getElementById("rsvpSuccessAlert");
const rsvpErrorAlert = document.getElementById("rsvpErrorAlert");

if (rsvpForm) {
  rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById("guestFirstName").value.trim();
    const lastName = document.getElementById("guestLastName").value.trim();
    const email = document.getElementById("guestEmail").value.trim();
    const attendance = document.querySelector("input[name='attendance']:checked").value;
    
    // Simple validation validation
    if (!firstName || !lastName || !email) {
      showRsvpAlert(rsvpErrorAlert);
      return;
    }
    
    // Attending details data extraction
    let guestResponse = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      attendance: attendance === "attending" ? "Attending" : "Not Attending",
      timestamp: new Date().toISOString()
    };
    
    if (attendance === "attending") {
      const meal = document.getElementById("mealPreference").value;
      const dietary = document.getElementById("dietaryRestrictions").value.trim();
      const song = document.getElementById("songRequest").value.trim();
      
      guestResponse.meal = meal.charAt(0).toUpperCase() + meal.slice(1);
      guestResponse.dietary = dietary || "None";
      guestResponse.song = song || "None";
    } else {
      guestResponse.meal = "-";
      guestResponse.dietary = "-";
      guestResponse.song = "-";
    }
    
    // Save to local Storage array list
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
    
    // Successful actions feedback
    showRsvpAlert(rsvpSuccessAlert);
    rsvpForm.reset();
    
    // Keep attendance field sync
    attendingDetails.style.display = "block";
    
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
  if (e.key === "wedding_website_config") {
    loadConfiguration();
  }
});
