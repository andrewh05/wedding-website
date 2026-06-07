/* 
  Wedding Hub - Admin Dashboard Controller
  Features: Live Iframe Customizer Synchronizer, RSVP CRUD Engine, CSV Data Exporter, Planner Editors
*/

// --- CORE SYSTEM STATE ---
let config = {};
let rsvps = [];

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
    avatar: "./assets/groom.png"
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
  normalizedConfig.theme = "navy";

  return normalizedConfig;
}

// --- BOOTSTRAP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  await initData();
  setupNavigation();
  renderOverview();
  renderRsvpTable();
  renderRegistryCrud();
  setupModals();
});

// --- DATA INITIALIZER ---
async function initData() {
  config = normalizeConfig(cloneDefaultConfig());
  config.registry = [];
  rsvps = [];

  if (window.WeddingSupabase?.isEnabled()) {
    try {
      const [remoteConfig, remoteRegistry, remoteRsvps] = await Promise.all([
        window.WeddingSupabase.getSiteConfig(),
        window.WeddingSupabase.listRegistryItems(),
        window.WeddingSupabase.listRsvps()
      ]);

      if (remoteConfig) {
        config = normalizeConfig(remoteConfig);
      } else {
        await window.WeddingSupabase.saveSiteConfig(config);
      }

      config.registry = remoteRegistry || [];
      rsvps = remoteRsvps || [];
      return;
    } catch (error) {
      console.error("Supabase dashboard load failed:", error);
    }
  } else {
    console.warn("Supabase is not configured. Dashboard database data cannot be loaded.");
  }
}

async function reloadDashboardData() {
  await initData();
  renderOverview();
  renderRsvpTable(document.getElementById("rsvpSearch")?.value || "");
  renderRegistryCrud();
}

// Save core configuration to Supabase
async function saveConfig(markCustomized = true) {
  config = normalizeConfig({
    ...config,
    _customized: markCustomized || config._customized
  });

  if (!window.WeddingSupabase?.isEnabled()) {
    console.warn("Supabase is not configured. Site configuration was not saved.");
    return null;
  }

  return window.WeddingSupabase.saveSiteConfig(config);
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

// --- ANALYTICS OVERVIEW GENERATOR ---
function renderOverview() {
  // Update numbers
  const total = rsvps.length;
  const accepted = rsvps.filter(rsvp => rsvp.attendance === "Attending").length;
  const rejected = rsvps.filter(rsvp => rsvp.attendance === "Not Attending").length;
  
  document.getElementById("statTotalRsvp").textContent = total;
  document.getElementById("statAttending").textContent = accepted;
  document.getElementById("statDeclined").textContent = rejected;
  
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

  const guestCountBreakdown = {};
  rsvps.filter(rsvp => rsvp.attendance === "Attending").forEach(rsvp => {
    const partySize = Number(rsvp.guestCount) || 1;
    guestCountBreakdown[partySize] = (guestCountBreakdown[partySize] || 0) + 1;
  });

  const mealContainer = document.getElementById("mealBreakdownContainer");
  if (mealContainer) {
    mealContainer.innerHTML = "";

    if (Object.keys(guestCountBreakdown).length === 0) {
      mealContainer.innerHTML = "<p style='color: #888; font-style: italic;'>No RSVP data in the database yet.</p>";
    } else {
      Object.keys(guestCountBreakdown).sort((a, b) => Number(a) - Number(b)).forEach(partySize => {
        const count = guestCountBreakdown[partySize];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        const guestLabel = Number(partySize) === 1 ? "guest" : "guests";
        
        const item = document.createElement("div");
        item.className = "meal-item";
        item.innerHTML = `
          <div class="meal-info" style="width: 100%;">
            <div class="meal-name">
              <span>${partySize} ${guestLabel}</span>
              <span class="meal-count">${count} RSVP${count === 1 ? "" : "s"} (${percent}%)</span>
            </div>
            <div class="meal-progress-bg">
              <div class="meal-progress-bar" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
        mealContainer.appendChild(item);
      });
    }
  }

  // Render recent RSVP records
  const overviewList = document.getElementById("quickOverviewList");
  if (overviewList) {
    overviewList.innerHTML = "";
    
    if (rsvps.length === 0) {
      overviewList.innerHTML = "<p style='color: #888; font-style: italic;'>No RSVP records in the database yet.</p>";
      return;
    }

    rsvps.slice(0, 6).forEach(r => {
      const card = document.createElement("div");
      card.style.marginBottom = "0.75rem";
      card.style.padding = "0.75rem";
      card.style.borderRadius = "var(--border-radius-sm)";
      card.style.backgroundColor = "#f7f9f8";
      card.style.borderLeft = "4px solid #8f9bab";
      card.innerHTML = `
        <strong>${r.firstName} ${r.lastName}</strong>
        <span style="color:#647082;">&bull; ${formatRsvpStatus(r.attendance)}</span>
        <span style="color:#647082;">&bull; ${r.guestCount || 0} guest${(r.guestCount || 0) === 1 ? "" : "s"}</span>
      `;
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
    const q = query.toLowerCase();
    return fullName.includes(q);
  });

  if (filtered.length === 0) {
    rsvpTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #888; padding: 2rem;">
          No RSVP records found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement("tr");
    const status = formatRsvpStatus(r.attendance);
    const badgeClass = getRsvpBadgeClass(r.attendance);
    tr.innerHTML = `
      <td style="font-weight:600; color:#13233a;">${r.firstName} ${r.lastName}</td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
      <td>${r.guestCount || 0}</td>
      <td>${r.guestLimit || 1}</td>
      <td>${r.timestamp ? new Date(r.timestamp).toLocaleDateString() : "-"}</td>
      <td>
        <div class="table-ops">
          <button class="op-btn op-btn-edit" onclick="copyRsvpInviteLink('${r.id}')" title="Copy RSVP link">
            <i class="fa-solid fa-link"></i>
          </button>
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

function formatRsvpStatus(attendance) {
  if (attendance === "Attending") return "Accepted";
  if (attendance === "Not Attending") return "Rejected";
  return "Pending";
}

function getRsvpBadgeClass(attendance) {
  if (attendance === "Attending") return "badge-attending";
  if (attendance === "Not Attending") return "badge-not-attending";
  return "badge-pending";
}

function normalizeInviteGuestLimit(value) {
  const guestLimit = Number(value);
  if (!Number.isInteger(guestLimit) || guestLimit < 1) return 1;
  return Math.min(guestLimit, 20);
}

function buildRsvpInviteLink(id, guestLimit = 1) {
  const baseUrl = new URL("index.html", window.location.href);
  baseUrl.searchParams.set("rsvp", id);
  baseUrl.searchParams.set("limit", normalizeInviteGuestLimit(guestLimit));
  baseUrl.hash = "rsvp";
  return baseUrl.toString();
}

window.copyRsvpInviteLink = async function(id) {
  const guest = rsvps.find(r => r.id === id);
  const link = buildRsvpInviteLink(id, guest?.guestLimit || 1);
  try {
    await navigator.clipboard.writeText(link);
    alert("RSVP link copied.");
  } catch (error) {
    window.prompt("Copy this RSVP link:", link);
  }
};

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

    const headers = ["First Name", "Last Name", "Status", "Guests Coming", "Guest Limit", "Timestamp"];
    const rows = rsvps.map(r => [
      r.firstName,
      r.lastName,
      formatRsvpStatus(r.attendance),
      r.guestCount || 0,
      r.guestLimit || 1,
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

window.deleteRegistryItem = async function(index) {
  if (confirm("Are you sure you want to remove this registry link?")) {
    const item = config.registry[index];

    try {
      if (!window.WeddingSupabase?.isEnabled() || !item.id) {
        throw new Error("Supabase is not configured for registry deletes.");
      }

      await window.WeddingSupabase.deleteRegistryItem(item.id);
      config.registry = await window.WeddingSupabase.listRegistryItems() || [];
      renderRegistryCrud();
    } catch (error) {
      console.error("Registry delete failed:", error);
      alert("Could not delete registry item. Please try again.");
    }
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
  adminRegistryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const indexStr = document.getElementById("registryEditIndex").value;
    const site = document.getElementById("registrySite").value.trim();
    const title = document.getElementById("registryTitle").value.trim();
    const desc = document.getElementById("registryDesc").value.trim();
    const link = document.getElementById("registryLink").value.trim();

    const existingItem = indexStr !== "" ? config.registry[parseInt(indexStr)] : null;
    const newItem = { ...existingItem, site, title, desc, link };

    try {
      if (!window.WeddingSupabase?.isEnabled()) {
        throw new Error("Supabase is not configured for registry saves.");
      }

      await window.WeddingSupabase.saveRegistryItem(
        newItem,
        indexStr !== "" ? parseInt(indexStr) : config.registry.length
      );

      config.registry = await window.WeddingSupabase.listRegistryItems() || [];
      renderRegistryCrud();
      document.getElementById("registryModal").classList.remove("active");
    } catch (error) {
      console.error("Registry save failed:", error);
      alert("Could not save registry item. Please try again.");
    }
  });
}

// --- RSVP TABLE MANUAL INJECTORS / CRUD ACTIONS ---
window.deleteRsvpManual = async function(id) {
  if (confirm("Are you sure you want to permanently delete this RSVP guest record?")) {
    try {
      if (!window.WeddingSupabase?.isEnabled()) {
        throw new Error("Supabase is not configured for RSVP deletes.");
      }

      await window.WeddingSupabase.deleteRsvp(id);
      rsvps = await window.WeddingSupabase.listRsvps() || [];
      renderOverview();
      renderRsvpTable(document.getElementById("rsvpSearch").value);
    } catch (error) {
      console.error("RSVP delete failed:", error);
      alert("Could not delete RSVP. Please try again.");
    }
  }
};

window.editRsvpManual = function(id) {
  const guest = rsvps.find(r => r.id === id);
  if (!guest) return;

  document.getElementById("rsvpEditId").value = guest.id;
  document.getElementById("manualFirstName").value = guest.firstName;
  document.getElementById("manualLastName").value = guest.lastName;
  const isAccepted = guest.attendance === "Attending";
  const isRejected = guest.attendance === "Not Attending";
  const radioId = isAccepted ? "manualAcceptedRadio" : isRejected ? "manualRejectedRadio" : "manualPendingRadio";
  document.getElementById(radioId).checked = true;
  document.getElementById("manualGuestCount").disabled = !isAccepted;
  document.getElementById("manualGuestCount").value = isAccepted ? (guest.guestCount || 1) : 0;
  document.getElementById("manualGuestLimit").value = guest.guestLimit || 1;
  clampManualGuestCount();

  if (rsvpInviteLinkInput) rsvpInviteLinkInput.value = buildRsvpInviteLink(guest.id, guest.guestLimit || 1);
  if (rsvpInviteLinkPanel) rsvpInviteLinkPanel.hidden = false;

  document.getElementById("rsvpModalTitle").textContent = "Edit Guest RSVP";
  document.getElementById("rsvpModal").classList.add("active");
};

const manualAttendanceRadios = document.querySelectorAll("input[name='manualAttendance']");
const manualGuestCountInput = document.getElementById("manualGuestCount");
const manualGuestLimitInput = document.getElementById("manualGuestLimit");
const rsvpInviteLinkPanel = document.getElementById("rsvpInviteLinkPanel");
const rsvpInviteLinkInput = document.getElementById("rsvpInviteLinkInput");
const copySavedRsvpLinkBtn = document.getElementById("copySavedRsvpLinkBtn");

function clampManualGuestCount() {
  if (!manualGuestCountInput || !manualGuestLimitInput) return;

  const guestLimit = Number(manualGuestLimitInput.value) || 1;
  manualGuestCountInput.max = String(guestLimit);

  const guestCount = Number(manualGuestCountInput.value);
  if (!manualGuestCountInput.disabled && guestCount > guestLimit) {
    manualGuestCountInput.value = String(guestLimit);
  }
}

manualAttendanceRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    const isAccepted = document.querySelector("input[name='manualAttendance']:checked")?.value === "Attending";
    if (manualGuestCountInput) {
      manualGuestCountInput.disabled = !isAccepted;
      manualGuestCountInput.value = isAccepted ? "1" : "0";
      clampManualGuestCount();
    }
  });
});

if (manualGuestLimitInput) {
  manualGuestLimitInput.addEventListener("input", clampManualGuestCount);
}

if (copySavedRsvpLinkBtn) {
  copySavedRsvpLinkBtn.addEventListener("click", async () => {
    const link = rsvpInviteLinkInput?.value;
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      copySavedRsvpLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      setTimeout(() => {
        copySavedRsvpLinkBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
      }, 1600);
    } catch (error) {
      window.prompt("Copy this RSVP link:", link);
    }
  });
}

const adminRsvpForm = document.getElementById("adminRsvpForm");
if (adminRsvpForm) {
  adminRsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("rsvpEditId").value;
    const firstName = document.getElementById("manualFirstName").value.trim();
    const lastName = document.getElementById("manualLastName").value.trim();
    const guestCount = parseInt(document.getElementById("manualGuestCount").value, 10);
    const guestLimit = parseInt(document.getElementById("manualGuestLimit").value, 10);
    const attendance = document.querySelector("input[name='manualAttendance']:checked")?.value || "Pending";
    const isAccepted = attendance === "Attending";

    const normalizedGuestLimit = Number.isInteger(guestLimit) && guestLimit > 0 ? Math.min(guestLimit, 20) : 1;
    const normalizedGuestCount = isAccepted && Number.isInteger(guestCount) && guestCount > 0
      ? Math.min(guestCount, normalizedGuestLimit)
      : 0;

    let updatedGuest = {
      id: id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      firstName,
      lastName,
      guestCount: normalizedGuestCount,
      guestLimit: normalizedGuestLimit,
      email: "-",
      attendance,
      meal: "-",
      dietary: "-",
      song: "-",
      timestamp: new Date().toISOString()
    };

    try {
      if (!window.WeddingSupabase?.isEnabled()) {
        throw new Error("Supabase is not configured for RSVP saves.");
      }

      const savedGuest = await window.WeddingSupabase.saveRsvp(updatedGuest);
      rsvps = await window.WeddingSupabase.listRsvps() || [];
      renderOverview();
      renderRsvpTable(document.getElementById("rsvpSearch").value);

      const inviteLink = buildRsvpInviteLink(savedGuest.id, savedGuest.guestLimit || normalizedGuestLimit);
      document.getElementById("rsvpEditId").value = savedGuest.id;
      document.getElementById("rsvpModalTitle").textContent = "Edit Guest RSVP";
      if (rsvpInviteLinkInput) rsvpInviteLinkInput.value = inviteLink;
      if (rsvpInviteLinkPanel) rsvpInviteLinkPanel.hidden = false;

      if (id) {
        document.getElementById("rsvpModal").classList.remove("active");
      }
    } catch (error) {
      console.error("RSVP save failed:", error);
      alert("Could not save RSVP. Please try again.");
    }
  });
}

// --- SETUP MODAL CONTROLS & LISTENERS ---
function setupModals() {
  const modals = [
    { trigger: "openAddGuestModalBtn", modal: "rsvpModal", form: "adminRsvpForm", title: "rsvpModalTitle", titleTxt: "Add Guest RSVP Manually", resetId: "rsvpEditId" },
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
        
        if (m.modal === "rsvpModal") {
          document.getElementById("manualPendingRadio").checked = true;
          document.getElementById("manualGuestCount").value = "0";
          document.getElementById("manualGuestCount").disabled = true;
          document.getElementById("manualGuestLimit").value = "1";
          document.getElementById("manualGuestCount").max = "1";
          if (rsvpInviteLinkPanel) rsvpInviteLinkPanel.hidden = true;
          if (rsvpInviteLinkInput) rsvpInviteLinkInput.value = "";
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

// Listen for updates from the client preview and reload from Supabase.
window.addEventListener("rsvp-submitted", async () => {
  await reloadDashboardData();
});
