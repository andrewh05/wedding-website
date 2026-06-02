/* 
  Wedding Hub - Admin Dashboard Controller
  Features: Live Iframe Customizer Synchronizer, RSVP CRUD Engine, Mock Analytics Generator, CSV Data Exporter, Planner Editors
*/

// --- PRELOADED MOCK RSVP DATASET (For instant visualization) ---
const MOCK_RSVPS = [
  { id: "101", firstName: "Jane", lastName: "Doe", email: "jane.doe@example.com", attendance: "Attending", meal: "Fish", dietary: "Gluten-Free", song: "Sweet Caroline - Neil Diamond", timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "102", firstName: "John", lastName: "Smith", email: "john.smith@gmail.com", attendance: "Attending", meal: "Beef", dietary: "None", song: "Shut Up and Dance - Walk the Moon", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "103", firstName: "Alice", lastName: "Johnson", email: "alice.j@outlook.com", attendance: "Not Attending", meal: "-", dietary: "-", song: "-", timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "104", firstName: "Robert", lastName: "Miller", email: "robert.miller@yahoo.com", attendance: "Attending", meal: "Vegan", dietary: "Dairy-Free", song: "Billie Jean - Michael Jackson", timestamp: new Date(Date.now() - 43200000).toISOString() },
  { id: "105", firstName: "Emily", lastName: "Davis", email: "emily.d@example.com", attendance: "Attending", meal: "Vegetarian", dietary: "Nut Allergy", song: "Dancing Queen - ABBA", timestamp: new Date().toISOString() }
];

// --- CORE SYSTEM STATE ---
let config = {};
let rsvps = [];

const CONFIG_STORAGE_KEY = "wedding_website_config";
const DEFAULT_CONFIG = {
  names: "Elissa & Elie",
  date: "2026-10-17T16:00:00",
  location: "Sonoma, CA",
  venue: "The Secret Garden, Sonoma",
  subtitle: "Save the Date",
  heroImage: "./assets/hero_bg.jpeg",
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  musicName: "Preset Romance Instrumental",
  theme: "emerald",
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
const DEFAULT_CONFIG_SIGNATURE = JSON.stringify(DEFAULT_CONFIG);

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function mergeConfigWithDefaults(nextConfig) {
  return {
    ...cloneDefaultConfig(),
    ...nextConfig,
    bride: {
      ...DEFAULT_CONFIG.bride,
      ...(nextConfig.bride || {})
    },
    groom: {
      ...DEFAULT_CONFIG.groom,
      ...(nextConfig.groom || {})
    }
  };
}

function normalizeConfig(nextConfig) {
  const normalizedConfig = mergeConfigWithDefaults(nextConfig);

  if (
    normalizedConfig.heroImage &&
    (normalizedConfig.heroImage.includes("unsplash.com") || normalizedConfig.heroImage.endsWith("hero_bg.png"))
  ) {
    normalizedConfig.heroImage = "./assets/hero_bg.jpeg";
  }
  if (normalizedConfig.bride.avatar && normalizedConfig.bride.avatar.includes("unsplash.com")) {
    normalizedConfig.bride.avatar = "./assets/bride.png";
  }
  if (normalizedConfig.groom.avatar && normalizedConfig.groom.avatar.includes("unsplash.com")) {
    normalizedConfig.groom.avatar = "./assets/groom.png";
  }

  normalizedConfig._defaultConfigSignature = DEFAULT_CONFIG_SIGNATURE;
  normalizedConfig._customized = Boolean(nextConfig._customized);

  return normalizedConfig;
}

// --- BOOTSTRAP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initData();
  setupNavigation();
  setupAccordion();
  renderOverview();
  renderRsvpTable();
  setupCustomizerBindings();
  renderTimelineCrud();
  renderRegistryCrud();
  setupModals();
});

// --- DATA INITIALIZER ---
function initData() {
  // Load configuration
  const params = new URLSearchParams(window.location.search);
  if (params.has("resetConfig")) {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }

  const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      const savedDefaultsAreStale =
        parsedConfig._defaultConfigSignature !== DEFAULT_CONFIG_SIGNATURE && !parsedConfig._customized;

      config = normalizeConfig(savedDefaultsAreStale ? cloneDefaultConfig() : parsedConfig);
      saveConfig(false);
    } catch (e) {
      config = normalizeConfig(cloneDefaultConfig());
      saveConfig(false);
    }
  } else {
    // Falls back to defaults
    config = normalizeConfig(cloneDefaultConfig());
    saveConfig(false);
  }

  // Load RSVPs
  const savedRsvps = localStorage.getItem("wedding_rsvps");
  if (savedRsvps) {
    try {
      rsvps = JSON.parse(savedRsvps);
    } catch (e) {
      rsvps = [];
    }
  } else {
    // If first load, feed custom high-fidelity simulated RSVPs so dashboard comes alive!
    rsvps = [...MOCK_RSVPS];
    localStorage.setItem("wedding_rsvps", JSON.stringify(rsvps));
  }
}

// Save core configuration to LocalStorage
function saveConfig(markCustomized = true) {
  config = normalizeConfig({
    ...config,
    _customized: markCustomized || config._customized
  });
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  
  // Refresh sticky preview iframe seamlessly
  const previewIframe = document.getElementById("livePreviewIframe");
  if (previewIframe && previewIframe.contentWindow) {
    // Dispatch state triggers directly inside the iframe window if accessible
    try {
      if (typeof previewIframe.contentWindow.loadConfiguration === "function") {
        previewIframe.contentWindow.loadConfiguration();
      } else {
        previewIframe.contentWindow.location.reload();
      }
    } catch (e) {
      // In case of any context barriers, reload iframe is robust
      previewIframe.src = previewIframe.src;
    }
  }
}

// --- SIDEBAR TABS SWITCHING ---
function setupNavigation() {
  const sidebarButtons = document.querySelectorAll(".sidebar-item-btn[data-tab]");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const tabTitle = document.getElementById("tabTitle");

  sidebarButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sidebarButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
      
      // Update header title
      if (tabTitle) {
        tabTitle.textContent = btn.innerText.trim();
      }

      // Re-trigger visual rendering if switching pages
      if (tabId === "overview") renderOverview();
      if (tabId === "rsvps") renderRsvpTable();
    });
  });
}

// --- VISUAL ACCORDIONS FOR CUSTOMIZER ---
function setupAccordion() {
  const headers = document.querySelectorAll(".accordion-header");
  
  // Initialize first accordion open, others closed
  headers.forEach((header, index) => {
    const content = header.nextElementSibling;
    const icon = header.querySelector(".fa-chevron-down");
    
    if (index === 0) {
      content.style.display = "block";
      icon.style.transform = "rotate(180deg)";
    } else {
      content.style.display = "none";
      icon.style.transform = "rotate(0deg)";
    }
    
    header.addEventListener("click", () => {
      const isOpen = content.style.display === "block";
      
      // Toggle
      content.style.display = isOpen ? "none" : "block";
      icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
      icon.style.transition = "transform 0.3s ease";
    });
  });
}

// --- ANALYTICS OVERVIEW GENERATOR ---
function renderOverview() {
  // Update numbers
  const total = rsvps.length;
  const attending = rsvps.filter(r => r.attendance === "Attending").length;
  const declined = rsvps.filter(r => r.attendance === "Not Attending").length;
  
  document.getElementById("statTotalRsvp").textContent = total;
  document.getElementById("statAttending").textContent = attending;
  document.getElementById("statDeclined").textContent = declined;
  
  // Days to wedding calculation
  const weddingTime = new Date(config.date).getTime();
  const now = Date.now();
  const diffTime = weddingTime - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const daysEl = document.getElementById("statDaysToWedding");
  if (days < 0) {
    daysEl.textContent = "Married!";
    daysEl.style.fontSize = "1.5rem";
  } else {
    daysEl.textContent = days;
    daysEl.style.fontSize = "2.25rem";
  }

  // Render Meal preferences progress bars
  const mealBreakdown = { Beef: 0, Fish: 0, Vegetarian: 0, Vegan: 0 };
  let attendingCount = 0;
  
  rsvps.forEach(rsvp => {
    if (rsvp.attendance === "Attending") {
      attendingCount++;
      const meal = rsvp.meal; // Beef, Fish, etc.
      if (mealBreakdown[meal] !== undefined) {
        mealBreakdown[meal]++;
      }
    }
  });

  const mealContainer = document.getElementById("mealBreakdownContainer");
  if (mealContainer) {
    mealContainer.innerHTML = "";
    Object.keys(mealBreakdown).forEach(meal => {
      const count = mealBreakdown[meal];
      const percent = attendingCount > 0 ? Math.round((count / attendingCount) * 100) : 0;
      
      const item = document.createElement("div");
      item.className = "meal-item";
      item.innerHTML = `
        <div class="meal-info" style="width: 100%;">
          <div class="meal-name">
            <span>${meal}</span>
            <span class="meal-count">${count} guests (${percent}%)</span>
          </div>
          <div class="meal-progress-bg">
            <div class="meal-progress-bar" style="width: ${percent}%;"></div>
          </div>
        </div>
      `;
      mealContainer.appendChild(item);
    });
  }

  // Render quick feed for songs and allergy warnings
  const overviewList = document.getElementById("quickOverviewList");
  if (overviewList) {
    overviewList.innerHTML = "";
    
    // Gather warnings
    const entries = rsvps.filter(r => r.attendance === "Attending" && (r.dietary !== "None" && r.dietary !== "-" || r.song !== "None" && r.song !== "-"));
    
    if (entries.length === 0) {
      overviewList.innerHTML = "<p style='color: #888; font-style: italic;'>No song requests or dietary alerts yet.</p>";
      return;
    }

    entries.forEach(r => {
      const card = document.createElement("div");
      card.style.marginBottom = "0.75rem";
      card.style.padding = "0.75rem";
      card.style.borderRadius = "var(--border-radius-sm)";
      card.style.backgroundColor = "#fcf8e3";
      card.style.borderLeft = "4px solid #f0ad4e";
      
      let html = `<strong>${r.firstName} ${r.lastName}</strong>: `;
      if (r.dietary && r.dietary !== "None" && r.dietary !== "-") {
        html += `<span style="color:#c9302c;"><i class="fa-solid fa-triangle-exclamation"></i> Diet: ${r.dietary}</span>`;
      }
      if (r.song && r.song !== "None" && r.song !== "-") {
        if (r.dietary && r.dietary !== "None" && r.dietary !== "-") html += " &bull; ";
        html += `<span style="color:#31708f;"><i class="fa-solid fa-music"></i> Song: ${r.song}</span>`;
      }
      
      card.innerHTML = html;
      overviewList.appendChild(card);
    });
  }
}

// --- RSVP CRUD TABLE RENDERER ---
const rsvpTableBody = document.getElementById("rsvpTableBody");
const rsvpSearch = document.getElementById("rsvpSearch");

function renderRsvpTable(query = "") {
  if (!rsvpTableBody) return;
  rsvpTableBody.innerHTML = "";
  
  const filtered = rsvps.filter(r => {
    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
    const email = r.email.toLowerCase();
    const q = query.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  if (filtered.length === 0) {
    rsvpTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #888; padding: 2rem;">
          No RSVP records found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement("tr");
    const badgeClass = r.attendance === "Attending" ? "badge-attending" : "badge-not-attending";
    
    tr.innerHTML = `
      <td style="font-weight:600; color:#0b3c2e;">${r.firstName} ${r.lastName}</td>
      <td>${r.email}</td>
      <td><span class="badge ${badgeClass}">${r.attendance}</span></td>
      <td>${r.meal || "-"}</td>
      <td>${r.dietary || "-"}</td>
      <td>${r.song || "-"}</td>
      <td>
        <div class="table-ops">
          <button class="op-btn op-btn-edit" onclick="editRsvpManual('${r.id}')" title="Edit RSVP">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="op-btn op-btn-delete" onclick="deleteRsvpManual('${r.id}')" title="Delete RSVP">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    rsvpTableBody.appendChild(tr);
  });
}

// Dynamic Search binder
if (rsvpSearch) {
  rsvpSearch.addEventListener("input", (e) => {
    renderRsvpTable(e.target.value);
  });
}

// --- EXPORT TO CSV ENGINE ---
const exportCsvBtn = document.getElementById("exportCsvBtn");
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    if (rsvps.length === 0) {
      alert("No RSVP data available to export!");
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Attendance", "Meal Selection", "Dietary Restrictions", "Song Request", "Timestamp"];
    const rows = rsvps.map(r => [
      r.firstName,
      r.lastName,
      r.email,
      r.attendance,
      r.meal,
      r.dietary,
      r.song,
      r.timestamp || ""
    ]);

    // Construct CSV String
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wedding_rsvp_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// --- LIVE CUSTOMIZER CONFIG BUILDER ---
function setupCustomizerBindings() {
  // 1. Theme Presets Select Cards
  const themeCards = document.querySelectorAll(".theme-card");
  themeCards.forEach(card => {
    const preset = card.getAttribute("data-preset");
    if (config.theme === preset) card.classList.add("active");

    card.addEventListener("click", () => {
      themeCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      config.theme = preset;
      saveConfig();
    });
  });

  // 2. Hero Fields bindings
  const namesInput = document.getElementById("weddingNames");
  const subtitleInput = document.getElementById("weddingSubtitle");
  const dateInput = document.getElementById("weddingDate");
  const locationInput = document.getElementById("weddingLocation");
  const heroUrlInput = document.getElementById("weddingHeroUrl");

  // Populate inputs on load
  if (namesInput) namesInput.value = config.names;
  if (subtitleInput) subtitleInput.value = config.subtitle || "Save the Date";
  if (dateInput) dateInput.value = config.date ? config.date.slice(0, 16) : "";
  if (locationInput) locationInput.value = config.location;
  if (heroUrlInput) heroUrlInput.value = config.heroImage;

  // Bind key inputs to config changes
  const inputs = [
    { el: namesInput, key: "names" },
    { el: subtitleInput, key: "subtitle" },
    { el: dateInput, key: "date" },
    { el: locationInput, key: "location" },
    { el: heroUrlInput, key: "heroImage" }
  ];

  inputs.forEach(item => {
    if (item.el) {
      item.el.addEventListener("input", (e) => {
        config[item.key] = e.target.value;
        saveConfig();
      });
    }
  });

  // 3. Couple details inputs
  const brideName = document.getElementById("brideNameInput");
  const brideBio = document.getElementById("brideBioInput");
  const brideAvatar = document.getElementById("brideAvatarInput");
  const groomName = document.getElementById("groomNameInput");
  const groomBio = document.getElementById("groomBioInput");
  const groomAvatar = document.getElementById("groomAvatarInput");

  if (brideName && config.bride) {
    brideName.value = config.bride.name;
    brideBio.value = config.bride.bio;
    brideAvatar.value = config.bride.avatar;
    
    brideName.addEventListener("input", (e) => { config.bride.name = e.target.value; saveConfig(); });
    brideBio.addEventListener("input", (e) => { config.bride.bio = e.target.value; saveConfig(); });
    brideAvatar.addEventListener("input", (e) => { config.bride.avatar = e.target.value; saveConfig(); });
  }

  if (groomName && config.groom) {
    groomName.value = config.groom.name;
    groomBio.value = config.groom.bio;
    groomAvatar.value = config.groom.avatar;

    groomName.addEventListener("input", (e) => { config.groom.name = e.target.value; saveConfig(); });
    groomBio.addEventListener("input", (e) => { config.groom.bio = e.target.value; saveConfig(); });
    groomAvatar.addEventListener("input", (e) => { config.groom.avatar = e.target.value; saveConfig(); });
  }

  // 4. Background music track inputs
  const musicUrlInput = document.getElementById("musicTrackUrl");
  if (musicUrlInput) {
    musicUrlInput.value = config.musicUrl || "";
    musicUrlInput.addEventListener("input", (e) => {
      config.musicUrl = e.target.value;
      saveConfig();
    });
  }
}

// --- TIMELINE CRUD SCHEDULER RENDERER ---
const timelineCrudList = document.getElementById("timelineCrudList");

function renderTimelineCrud() {
  if (!timelineCrudList) return;
  timelineCrudList.innerHTML = "";

  if (!config.timeline || config.timeline.length === 0) {
    timelineCrudList.innerHTML = "<p style='color: #888; font-style: italic;'>No timeline events defined.</p>";
    return;
  }

  config.timeline.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "crud-item";
    div.innerHTML = `
      <div class="crud-info">
        <span class="crud-title">${item.title}</span>
        <span class="crud-sub"><i class="fa-solid fa-clock"></i> ${item.time} &bull; ${item.desc.substring(0, 45)}...</span>
      </div>
      <div class="crud-actions">
        <button class="op-btn op-btn-edit" onclick="editTimelineEvent(${index})" title="Edit event"><i class="fa-solid fa-pen"></i></button>
        <button class="op-btn op-btn-delete" onclick="deleteTimelineEvent(${index})" title="Delete event"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    timelineCrudList.appendChild(div);
  });
}

// Global actions exposed
window.deleteTimelineEvent = function(index) {
  if (confirm("Are you sure you want to remove this schedule event?")) {
    config.timeline.splice(index, 1);
    saveConfig();
    renderTimelineCrud();
  }
};

window.editTimelineEvent = function(index) {
  const item = config.timeline[index];
  document.getElementById("timelineEditIndex").value = index;
  document.getElementById("eventTime").value = item.time;
  document.getElementById("eventTitle").value = item.title;
  document.getElementById("eventDesc").value = item.desc;
  
  document.getElementById("timelineModalTitle").textContent = "Edit Timeline Event";
  document.getElementById("timelineModal").classList.add("active");
};

// Add / Edit submission handlers
const adminTimelineForm = document.getElementById("adminTimelineForm");
if (adminTimelineForm) {
  adminTimelineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const indexStr = document.getElementById("timelineEditIndex").value;
    const time = document.getElementById("eventTime").value.trim();
    const title = document.getElementById("eventTitle").value.trim();
    const desc = document.getElementById("eventDesc").value.trim();

    const newEvent = { time, title, desc };

    if (indexStr !== "") {
      config.timeline[parseInt(indexStr)] = newEvent;
    } else {
      if (!config.timeline) config.timeline = [];
      config.timeline.push(newEvent);
    }

    saveConfig();
    renderTimelineCrud();
    document.getElementById("timelineModal").classList.remove("active");
  });
}

// --- REGISTRY CRUD RENDERER ---
const registryCrudList = document.getElementById("registryCrudList");

function renderRegistryCrud() {
  if (!registryCrudList) return;
  registryCrudList.innerHTML = "";

  if (!config.registry || config.registry.length === 0) {
    registryCrudList.innerHTML = "<p style='color: #888; font-style: italic;'>No gift registry items defined.</p>";
    return;
  }

  config.registry.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "crud-item";
    div.innerHTML = `
      <div class="crud-info">
        <span class="crud-title">${item.title} (${item.site})</span>
        <span class="crud-sub">${item.desc}</span>
      </div>
      <div class="crud-actions">
        <button class="op-btn op-btn-edit" onclick="editRegistryItem(${index})" title="Edit Gift Card"><i class="fa-solid fa-pen"></i></button>
        <button class="op-btn op-btn-delete" onclick="deleteRegistryItem(${index})" title="Delete Gift Card"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    registryCrudList.appendChild(div);
  });
}

window.deleteRegistryItem = function(index) {
  if (confirm("Are you sure you want to remove this registry link?")) {
    config.registry.splice(index, 1);
    saveConfig();
    renderRegistryCrud();
  }
};

window.editRegistryItem = function(index) {
  const item = config.registry[index];
  document.getElementById("registryEditIndex").value = index;
  document.getElementById("registrySite").value = item.site;
  document.getElementById("registryTitle").value = item.title;
  document.getElementById("registryDesc").value = item.desc;
  document.getElementById("registryLink").value = item.link;

  document.getElementById("registryModalTitle").textContent = "Edit Gift Registry Item";
  document.getElementById("registryModal").classList.add("active");
};

const adminRegistryForm = document.getElementById("adminRegistryForm");
if (adminRegistryForm) {
  adminRegistryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const indexStr = document.getElementById("registryEditIndex").value;
    const site = document.getElementById("registrySite").value.trim();
    const title = document.getElementById("registryTitle").value.trim();
    const desc = document.getElementById("registryDesc").value.trim();
    const link = document.getElementById("registryLink").value.trim();

    const newItem = { site, title, desc, link };

    if (indexStr !== "") {
      config.registry[parseInt(indexStr)] = newItem;
    } else {
      if (!config.registry) config.registry = [];
      config.registry.push(newItem);
    }

    saveConfig();
    renderRegistryCrud();
    document.getElementById("registryModal").classList.remove("active");
  });
}

// --- RSVP TABLE MANUAL INJECTORS / CRUD ACTIONS ---
window.deleteRsvpManual = function(id) {
  if (confirm("Are you sure you want to permanently delete this RSVP guest record?")) {
    rsvps = rsvps.filter(r => r.id !== id);
    localStorage.setItem("wedding_rsvps", JSON.stringify(rsvps));
    renderOverview();
    renderRsvpTable(document.getElementById("rsvpSearch").value);
  }
};

window.editRsvpManual = function(id) {
  const guest = rsvps.find(r => r.id === id);
  if (!guest) return;

  document.getElementById("rsvpEditId").value = guest.id;
  document.getElementById("manualFirstName").value = guest.firstName;
  document.getElementById("manualLastName").value = guest.lastName;
  document.getElementById("manualEmail").value = guest.email;
  
  if (guest.attendance === "Attending") {
    document.getElementById("attendingRadio").checked = true;
    document.getElementById("manualAttendingDetails").style.display = "block";
    
    // Set drop down choice or default
    const mValue = guest.meal ? guest.meal.charAt(0).toUpperCase() + guest.meal.slice(1) : "Beef";
    document.getElementById("manualMeal").value = mValue;
    document.getElementById("manualDietary").value = guest.dietary === "-" ? "" : guest.dietary;
    document.getElementById("manualSong").value = guest.song === "-" ? "" : guest.song;
  } else {
    document.getElementById("decliningRadio").checked = true;
    document.getElementById("manualAttendingDetails").style.display = "none";
  }

  document.getElementById("rsvpModalTitle").textContent = "Edit Guest RSVP";
  document.getElementById("rsvpModal").classList.add("active");
};

// Manual entry conditional form displays
const manualAttendanceRadios = document.querySelectorAll("input[name='manualAttendance']");
const manualAttendingDetails = document.getElementById("manualAttendingDetails");

manualAttendanceRadios.forEach(radio => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "Attending") {
      manualAttendingDetails.style.display = "block";
    } else {
      manualAttendingDetails.style.display = "none";
    }
  });
});

const adminRsvpForm = document.getElementById("adminRsvpForm");
if (adminRsvpForm) {
  adminRsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("rsvpEditId").value;
    const firstName = document.getElementById("manualFirstName").value.trim();
    const lastName = document.getElementById("manualLastName").value.trim();
    const email = document.getElementById("manualEmail").value.trim();
    const attendance = document.querySelector("input[name='manualAttendance']:checked").value;

    let updatedGuest = {
      id: id || Date.now().toString(),
      firstName,
      lastName,
      email,
      attendance,
      timestamp: new Date().toISOString()
    };

    if (attendance === "Attending") {
      const meal = document.getElementById("manualMeal").value;
      const dietary = document.getElementById("manualDietary").value.trim();
      const song = document.getElementById("manualSong").value.trim();

      updatedGuest.meal = meal;
      updatedGuest.dietary = dietary || "None";
      updatedGuest.song = song || "None";
    } else {
      updatedGuest.meal = "-";
      updatedGuest.dietary = "-";
      updatedGuest.song = "-";
    }

    if (id) {
      // Edit mode
      const index = rsvps.findIndex(r => r.id === id);
      if (index !== -1) rsvps[index] = updatedGuest;
    } else {
      // Add mode
      rsvps.push(updatedGuest);
    }

    localStorage.setItem("wedding_rsvps", JSON.stringify(rsvps));
    renderOverview();
    renderRsvpTable(document.getElementById("rsvpSearch").value);
    document.getElementById("rsvpModal").classList.remove("active");
  });
}

// --- SETUP MODAL CONTROLS & LISTENERS ---
function setupModals() {
  const modals = [
    { trigger: "openAddGuestModalBtn", modal: "rsvpModal", form: "adminRsvpForm", title: "rsvpModalTitle", titleTxt: "Add Guest RSVP Manually", resetId: "rsvpEditId" },
    { trigger: "openAddEventModalBtn", modal: "timelineModal", form: "adminTimelineForm", title: "timelineModalTitle", titleTxt: "Add Timeline Event", resetId: "timelineEditIndex" },
    { trigger: "openAddRegistryModalBtn", modal: "registryModal", form: "adminRegistryForm", title: "registryModalTitle", titleTxt: "Add Gift Item / Registry Card", resetId: "registryEditIndex" }
  ];

  modals.forEach(m => {
    const tBtn = document.getElementById(m.trigger);
    const modalEl = document.getElementById(m.modal);
    const formEl = document.getElementById(m.form);
    
    if (tBtn && modalEl) {
      tBtn.addEventListener("click", () => {
        // Reset form
        if (formEl) formEl.reset();
        
        // Reset hidden ID fields
        if (m.resetId) {
          const resetInput = document.getElementById(m.resetId);
          if (resetInput) resetInput.value = "";
        }
        
        // Adjust manual details display
        if (m.modal === "rsvpModal") {
          document.getElementById("manualAttendingDetails").style.display = "block";
        }
        
        // Reset title
        if (m.title && m.titleTxt) {
          document.getElementById(m.title).textContent = m.titleTxt;
        }

        modalEl.classList.add("active");
      });
    }
  });

  // Modal Cancelers
  const cancelers = [
    { btn: "closeRsvpModalBtn", modal: "rsvpModal" },
    { btn: "closeTimelineModalBtn", modal: "timelineModal" },
    { btn: "closeRegistryModalBtn", modal: "registryModal" }
  ];

  cancelers.forEach(c => {
    const cBtn = document.getElementById(c.btn);
    const modalEl = document.getElementById(c.modal);
    if (cBtn && modalEl) {
      cBtn.addEventListener("click", () => {
        modalEl.classList.remove("active");
      });
    }
  });

  // Window clicks to dismiss modal overlay
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });
}

// Listen for updates from other frames (e.g. client submission in preview refresh)
window.addEventListener("storage", (e) => {
  if (e.key === "wedding_rsvps") {
    rsvps = JSON.parse(e.newValue || "[]");
    renderOverview();
    renderRsvpTable(document.getElementById("rsvpSearch")?.value || "");
  }
});
window.addEventListener("rsvp-submitted", () => {
  initData();
  renderOverview();
  renderRsvpTable(document.getElementById("rsvpSearch")?.value || "");
});
