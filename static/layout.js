const PAGES = {
  "index.html": { en: "Home", hi: "मुख्य पृष्ठ", crumb: "Home" },
  "report.html": {
    en: "Report Issue",
    hi: "शिकायत दर्ज करें",
    crumb: "Citizen Services / Report an Issue",
  },
  "challenges.html": {
    en: "Challenges",
    hi: "चुनौतियाँ",
    crumb: "Challenges / Public Register",
  },
  "university.html": {
    en: "Universities",
    hi: "विश्वविद्यालय",
    crumb: "Collaboration / University Portal",
  },
  "industry.html": {
    en: "Industry",
    hi: "उद्योग",
    crumb: "Collaboration / Industry & CSR Portal",
  },
  "government.html": {
    en: "Govt. Dashboard",
    hi: "सरकारी डैशबोर्ड",
    crumb: "Monitoring / Government Dashboard",
  },
  "track.html": {
    en: "Track Status",
    hi: "स्थिति जानें",
    crumb: "Citizen Services / Track Application Status",
  },
};

const I18N = {
  en: {
    goi: "भारत सरकार | Government of India",
    ministry: "Ministry of Education · Smart India Hackathon 2026",
    skip: "Skip to main content",
    screenReader: "Screen Reader Access",
    sitemap: "Sitemap",
    help: "Help",
    lang: "हिन्दी",
    portal: "Societal Innovation Collaboration Portal",
    dept: "National Civic Challenge Redressal System",
    search: "Search challenges, ticket ID",
    report: "Report Issue",
  },
  hi: {
    goi: "भारत सरकार | Government of India",
    ministry: "शिक्षा मंत्रालय · स्मार्ट इंडिया हैकाथॉन 2026",
    skip: "मुख्य सामग्री पर जाएँ",
    screenReader: "स्क्रीन रीडर एक्सेस",
    sitemap: "साइट मैप",
    help: "सहायता",
    lang: "English",
    portal: "सामाजिक नवाचार सहयोग पोर्टल",
    dept: "राष्ट्रीय नागरिक समस्या निवारण प्रणाली",
    search: "चुनौती या टिकट आईडी खोजें",
    report: "शिकायत दर्ज करें",
  },
};

function currentPage() {
  const file = location.pathname.split("/").pop();
  return !file || file === "" ? "index.html" : file;
}

function currentRole() {
  return sessionStorage.getItem("ngx_role") || "Citizen";
}

function currentLang() {
  return localStorage.getItem("ngx_lang") || "en";
}

function ashokaChakra() {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    return `<line x1="${32 + 5 * Math.sin(a)}" y1="${32 - 5 * Math.cos(a)}" x2="${32 + 26 * Math.sin(a)}" y2="${32 - 26 * Math.cos(a)}" stroke="#10306b" stroke-width="1.6"/>`;
  }).join("");
  return `
    <svg class="emblem" viewBox="0 0 64 64" role="img" aria-label="National emblem">
      <circle cx="32" cy="32" r="30" fill="#fff" stroke="#10306b" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="27" fill="none" stroke="#10306b" stroke-width="1"/>
      ${spokes}
      <circle cx="32" cy="32" r="4.5" fill="#10306b"/>
    </svg>`;
}

function injectLayout() {
  const page = currentPage();
  const lang = currentLang();
  const t = I18N[lang];
  const meta = PAGES[page] || { crumb: "Home" };

  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#main-content";
  skip.textContent = t.skip;
  document.body.prepend(skip);

  const chrome = document.createElement("div");
  chrome.innerHTML = `
    <div class="gov-topbar">
      <div class="container">
        <div class="topbar-left">
          <span>${t.goi}</span>
          <span class="topbar-sep">|</span>
          <span>${t.ministry}</span>
        </div>
        <div class="topbar-right">
          <a href="#main-content">${t.skip}</a>
          <span class="topbar-sep">|</span>
          <a href="#" onclick="return false">${t.screenReader}</a>
          <span class="topbar-sep">|</span>
          <span class="font-ctl" role="group" aria-label="Font size">
            <button type="button" data-font="-" aria-label="Decrease font size">A-</button>
            <button type="button" data-font="0" aria-label="Reset font size">A</button>
            <button type="button" data-font="+" aria-label="Increase font size">A+</button>
          </span>
          <button class="lang-toggle" type="button" id="langToggle">${t.lang}</button>
        </div>
      </div>
    </div>

    <header class="gov-header">
      <div class="container">
        <div class="emblem-block">
          ${ashokaChakra()}
          <div class="emblem-text">
            <div class="hi">सत्यमेव जयते</div>
            <div class="en">${t.dept}</div>
            <div class="portal-title">NexGen<span>X</span> · ${t.portal}</div>
          </div>
        </div>
        <div class="header-right">
          <form class="header-search" role="search" id="govSearch">
            <label class="sr-only" for="govSearchInput" style="display:none">Search</label>
            <input id="govSearchInput" type="search" placeholder="${t.search}" />
            <button type="submit">Search</button>
          </form>
          <div class="sih-badge">SIH 2026<br>PS ID: SIH26043</div>
        </div>
      </div>
    </header>

    <div class="tricolour"><i></i><i></i><i></i></div>

    <nav class="gov-nav" aria-label="Main navigation">
      <div class="container">
        <button class="nav-toggle" type="button" id="navToggle" aria-expanded="false">☰ Menu</button>
        <ul id="navList">
          ${Object.entries(PAGES)
            .map(
              ([href, p]) => `
            <li><a href="${href}" class="${page === href ? "active" : ""}">${lang === "hi" ? p.hi : p.en}</a></li>`,
            )
            .join("")}
        </ul>
        <div class="nav-right">
          <label for="roleSwitch" style="color:#fff;margin:0;font-size:12px">Login as</label>
          <select class="role-chip" id="roleSwitch" aria-label="Select stakeholder role">
            <option>Citizen</option>
            <option>University</option>
            <option>Industry</option>
            <option>Government</option>
          </select>
        </div>
      </div>
    </nav>

    <div class="breadcrumb">
      <div class="container">You are here: <a href="index.html">Home</a> / ${meta.crumb}</div>
    </div>`;
  document.body.prepend(chrome);

  const main = document.querySelector("section.section, section.hero");
  if (main && !document.getElementById("main-content"))
    main.id = "main-content";

  document.querySelectorAll("[data-font]").forEach((btn) => {
    btn.onclick = () => {
      const step = btn.dataset.font;
      let zoom = parseFloat(localStorage.getItem("ngx_zoom") || "1");
      if (step === "+") zoom = Math.min(1.3, zoom + 0.1);
      else if (step === "-") zoom = Math.max(0.85, zoom - 0.1);
      else zoom = 1;
      localStorage.setItem("ngx_zoom", String(zoom));
      document.body.style.zoom = zoom;
    };
  });
  document.body.style.zoom = "1";
  localStorage.removeItem("ngx_zoom");

  document.getElementById("langToggle").onclick = () => {
    localStorage.setItem("ngx_lang", lang === "en" ? "hi" : "en");
    location.reload();
  };

  const navToggle = document.getElementById("navToggle");
  navToggle.onclick = () => {
    const list = document.getElementById("navList");
    list.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", list.classList.contains("open"));
  };

  document.getElementById("govSearch").onsubmit = (e) => {
    e.preventDefault();
    const q = document.getElementById("govSearchInput").value.trim();
    if (q) location.href = "challenges.html?q=" + encodeURIComponent(q);
  };

  const select = document.getElementById("roleSwitch");
  select.value = currentRole();
  select.addEventListener("change", () => {
    sessionStorage.setItem("ngx_role", select.value);
    const routes = {
      Citizen: "report.html",
      University: "university.html",
      Industry: "industry.html",
      Government: "government.html",
    };
    location.href = routes[select.value] || "index.html";
  });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-main">
      <div class="container footer-cols">
        <div>
          <h4>Citizen Services</h4>
          <ul>
            <li><a href="report.html">Report an Issue</a></li>
            <li><a href="track.html">Track Status</a></li>
            <li><a href="challenges.html">Public Challenge Register</a></li>
          </ul>
        </div>
        <div>
          <h4>Collaboration</h4>
          <ul>
            <li><a href="university.html">University Portal</a></li>
            <li><a href="industry.html">Industry & CSR Portal</a></li>
            <li><a href="government.html">Government Dashboard</a></li>
          </ul>
        </div>
        <div>
          <h4>Important Links</h4>
          <ul>
            <li><a href="https://www.india.gov.in" target="_blank" rel="noopener">India.gov.in</a></li>
            <li><a href="https://www.mygov.in" target="_blank" rel="noopener">MyGov</a></li>
            <li><a href="https://www.sih.gov.in" target="_blank" rel="noopener">Smart India Hackathon</a></li>
            <li><a href="https://www.digitalindia.gov.in" target="_blank" rel="noopener">Digital India</a></li>
          </ul>
        </div>
        <div>
          <h4>Policies</h4>
          <ul>
            <li><a href="#" onclick="return false">Terms & Conditions</a></li>
            <li><a href="#" onclick="return false">Privacy Policy</a></li>
            <li><a href="#" onclick="return false">Accessibility Statement</a></li>
            <li><a href="#" onclick="return false">Help & Grievance</a></li>
          </ul>
        </div>
      </div>
      <div class="container" style="margin-top:18px">
        <p class="footer-note">
          Website content managed by Team NexGenX, Smart India Hackathon 2026 (Problem Statement SIH26043).
          This is a prototype developed for evaluation purposes and is not an official Government of India website.
        </p>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">
        <span>© ${new Date().getFullYear()} NexGenX · Societal Innovation Collaboration Portal</span>
        <span>Last Updated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · Visitors: 1,04,265</span>
      </div>
    </div>`;
  document.body.appendChild(footer);
}

document.addEventListener("DOMContentLoaded", injectLayout);
