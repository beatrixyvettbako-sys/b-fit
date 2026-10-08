const API_URL = "https://script.google.com/macros/s/AKfycbwN9ez1NjA32MnfUZGLcLjdWjsi9h4qilDBmjBVjm3lUhwU0Z2jMuta6p-NP9lmnG9H/exec";
const ESTE_APPS_SCRIPT = (typeof google !== 'undefined' && google.script && typeof google.script.run !== 'undefined');

let DB = {
  clienti: [],
  orarSloturi: [],
  progActive: [],
  progHold: [],
  incasari: [],
  prezente: []
};

let tabIndexCurent = 0;
let tipTabCurent = 'orar';

function normalizeazaTipAbonament(tip) {
  if (!tip || typeof tip !== 'string') return "";
  let curat = tip.trim().toLowerCase();
  curat = curat.replace(/ș/g, 's').replace(/ş/g, 's').replace(/ț/g, 't').replace(/ţ/g, 't');
  curat = curat.replace(/\s+/g, ' ');

  if (curat.indexOf("gratuit") !== -1) return "Sedinta Gratuita";
  if (curat.indexOf("16") !== -1 && (curat.indexOf("1:1") !== -1 || curat.indexOf("1 la 1") !== -1)) return "16 sedinte 1:1";
  if (curat.indexOf("16") !== -1) return "16 sedinte";
  if (curat.indexOf("12") !== -1) return "12 sedinte";
  if (curat.indexOf("10") !== -1) return "10 sedinte";
  if (curat.indexOf("8") !== -1) return "8 sedinte";
  if (curat.indexOf("individual") !== -1 || curat.indexOf("1 sedint") !== -1) return "Sedinta Individuala";

  return tip.trim();
}

function gasesteClientaValida(numeIntrodus) {
  if (!numeIntrodus || typeof numeIntrodus !== 'string') return null;
  let curat = numeIntrodus.trim().toLowerCase();
  if (!curat) return null;
  return (DB.clienti || []).find(c => {
    if (!c || !c.nume) return false;
    let esteArhivat = (c.status || '').toLowerCase() === 'arhivat';
    return !esteArhivat && c.nume.trim().toLowerCase() === curat;
  }) || null;
}

function animaPilaMercur(nouIndex) {
  const pill = document.getElementById('navMercuryPill');
  if (!pill) return;
  const drop = pill.querySelector('.nav-mercury-drop');
  
  if (drop && nouIndex !== tabIndexCurent) {
    drop.classList.add('mercury-morph');
    setTimeout(() => {
      drop.classList.remove('mercury-morph');
    }, 260);
  }
  tabIndexCurent = nouIndex;
  pill.style.transform = `translateX(${nouIndex * 100}%)`;
}

function parseazaDataOraRo(dataStr, oraStr) {
  if (!dataStr || dataStr === "-" || typeof dataStr !== 'string') return 0;
  let s = dataStr.trim();
  let zi = 1, luna = 1, an = 1970;

  if (s.indexOf('.') !== -1) {
    let p = s.split('.');
    if (p.length === 3) {
      zi = parseInt(p[0], 10) || 1;
      luna = parseInt(p[1], 10) || 1;
      an = parseInt(p[2], 10) || 1970;
    }
  } else if (s.indexOf('-') !== -1) {
    let p = s.split('-');
    if (p.length === 3) {
      if (p[0].length === 4) {
        an = parseInt(p[0], 10) || 1970;
        luna = parseInt(p[1], 10) || 1;
        zi = parseInt(p[2], 10) || 1;
      } else {
        zi = parseInt(p[0], 10) || 1;
        luna = parseInt(p[1], 10) || 1;
        an = parseInt(p[2], 10) || 1970;
      }
    }
  }

  let h = 0, m = 0;
  if (oraStr && typeof oraStr === 'string' && oraStr.indexOf(':') !== -1) {
    let oParts = oraStr.trim().split(':');
    h = parseInt(oParts[0], 10) || 0;
    m = parseInt(oParts[1], 10) || 0;
  }

  return new Date(an, luna - 1, zi, h, m, 0).getTime();
}

function getAziFormatIso() {
  let d = new Date();
  let an = d.getFullYear();
  let luna = String(d.getMonth() + 1).padStart(2, '0');
  let zi = String(d.getDate()).padStart(2, '0');
  return `${an}-${luna}-${zi}`;
}

function reseteazaDateIncasariAzi() {
  let aziStr = getAziFormatIso();
  let elPlata = document.getElementById('incasareDataPlata');
  let elStart = document.getElementById('incasareDataStart');
  if (elPlata) elPlata.value = aziStr;
  if (elStart) elStart.value = aziStr;
}

function calculeazaLuniInitial() {
  let d = new Date();
  let day = d.getDay();
  let ora = d.getHours();

  let esteTrecutDeVineriSeara = (day === 5 && ora >= 22) || (day === 6) || (day === 0);

  if (esteTrecutDeVineriSeara) {
    let zilePanaLuniViitoare = (day === 5) ? 3 : (day === 6 ? 2 : 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + zilePanaLuniViitoare, 0, 0, 0);
  }

  let diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0);
}

let dataReferintaLuni = calculeazaLuniInitial();
let dataReferintaLuniBaza = new Date(dataReferintaLuni.getTime());
let ziCurentaCheie = "Luni";
let modalCallback = null;

const optiuniAntrenamentConfig = [
  { text: "Fesieri", cls: "ant-orange" },
  { text: "Picioare", cls: "ant-orange" },
  { text: "Spate + Brate", cls: "ant-darkblue" },
  { text: "Umeri + Piept", cls: "ant-lightblue" },
  { text: "Full body", cls: "ant-purple" },
  { text: "Cardio", cls: "ant-red" },
  { text: "Abdomen", cls: "ant-pink" },
  { text: "Mobility & Stretching", cls: "ant-lightgreen" },
  { text: "Postural", cls: "ant-lightgreen" },
  { text: "Fesieri + Abdomen", cls: "ant-yellow" },
  { text: "Spate + Abdomen", cls: "ant-turquoise" },
  { text: "Piept + Abdomen", cls: "ant-turquoise" },
  { text: "Cardio + Abdomen", cls: "ant-burgundy" },
  { text: "Sedinta Gratuita", cls: "ant-lightgreen" }
];

const preturiAbonament = {
  "8 sedinte": "450", "10 sedinte": "520", "12 sedinte": "600",
  "16 sedinte": "750", "16 sedinte 1:1": "900", "Sedinta Individuala": "70", "Sedinta Gratuita": "0"
};

function esteSaptamanaActiva() {
  return dataReferintaLuni.getTime() === dataReferintaLuniBaza.getTime();
}

function esteSaptamanaTrecuta() {
  return dataReferintaLuni.getTime() < dataReferintaLuniBaza.getTime();
}

function getSaptamanaCheie() {
  if (esteSaptamanaActiva()) return "";
  let y = dataReferintaLuni.getFullYear();
  let m = String(dataReferintaLuni.getMonth() + 1).padStart(2, '0');
  let d = String(dataReferintaLuni.getDate()).padStart(2, '0');
  return `W_${y}_${m}_${d}`;
}

function actualizeazaStilSelect(sel) {
  if (!sel || !sel.classList) return;
  if (!sel.value || sel.value === "") {
    sel.classList.add('select-faded');
    sel.classList.remove('select-active');
  } else {
    sel.classList.remove('select-faded');
    sel.classList.add('select-active');
  }
}

function curataEroareCamp(el) {
  if (el) el.classList.remove('input-error');
}

function leagaAscultatoriCuratareErori() {
  const ids = [
    'incasareNume', 'incasareTip', 'selectSumaPreset', 'incasareSumaCustom', 'incasareMetoda', 'incasareDataPlata', 'incasareDataStart',
    'editIncClienta', 'editIncData', 'editIncSuma', 'editIncMetoda', 'editIncTip'
  ];
  ids.forEach(id => {
    let el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => curataEroareCamp(el));
      el.addEventListener('change', () => curataEroareCamp(el));
    }
  });
}

function aplicaCuloareAntrenament(sel) {
  if (!sel || !sel.classList) return;
  actualizeazaStilSelect(sel);
  optiuniAntrenamentConfig.forEach(item => sel.classList.remove(item.cls));
  let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === (sel.value || "").toLowerCase());
  if (cfg && cfg.cls) {
    sel.classList.add(cfg.cls);
  }
}

function callBackend(actionName, payload, callback) {
  if (ESTE_APPS_SCRIPT) {
    let runner = google.script.run
      .withSuccessHandler(function(res) { if (callback) callback(res); })
      .withFailureHandler(function(err) { showToast("Eroare Apps Script: " + err.message, "error"); });

    if (actionName === "getTotBazaDeDate") runner.getTotBazaDeDate();
    else if (actionName === "salveazaSlotAuto") runner.salveazaSlotAuto(payload.row, payload.saptamanaCheie, payload.dataCalendar, payload.zi, payload.ora, payload.clienta, payload.antrenament);
    else if (actionName === "bifeazaPrezenta") runner.bifeazaPrezentaSlot(payload.row, payload.saptamanaCheie, payload.dataCalendar, payload.zi, payload.ora, payload.clienta, payload.antrenament);
    else if (actionName === "anuleazaSlot") runner.anuleazaSlotSiPrezenta(payload.row, payload.saptamanaCheie, payload.dataCalendar, payload.zi, payload.ora);
    else if (actionName === "comutaBlocareOra") runner.comutaBlocareOra(payload.zi, payload.ora, payload.blocat);
    else if (actionName === "adaugaOraCustom") runner.adaugaOraCustomOrar(payload.zi, payload.ora);
    else if (actionName === "inregistreazaAbonament") runner.inregistreazaAbonament(payload.nume, payload.tip, payload.dataPlata, payload.dataStart, payload.suma, payload.metoda);
    else if (actionName === "actualizeazaIncasare") runner.actualizeazaRandIncasare(payload.row, payload.data, payload.clienta, payload.suma, payload.metoda, payload.tip);
    else if (actionName === "actualizeazaCampProgramare") runner.actualizeazaCampProgramare(payload.row, payload.col, payload.val);
    else if (actionName === "adaugaRandProgramare") runner.adaugaRandNouProgramare(payload.nume, payload.prezenta, payload.mentiuni, payload.esteHold);
    else if (actionName === "mutaInHold") runner.mutaInHold(payload.row);
    else if (actionName === "stergeRandProgramare") runner.stergeRandProgramare(payload.row);
    else if (actionName === "actualizeazaDateClienta") runner.actualizeazaDateClienta(payload.numeVechi, payload.numeNou, payload.tip, payload.dataStart, payload.dataExp, payload.incluse, payload.efectuate, payload.ramase, payload.status);
    else if (actionName === "adaugaClientaDirect") runner.adaugaClientaNouaDirect(payload.nume, payload.tip);
    else if (actionName === "seteazaStatusClienta") runner.seteazaStatusClienta(payload.nume, payload.statusNou);
    else if (actionName === "prelungesteValabilitate") runner.prelungesteValabilitate(payload.nume, payload.zile, payload.dataManuala);
  } else {
    if (actionName === "getTotBazaDeDate") {
      fetch(API_URL + "?action=getTotBazaDeDate")
        .then(r => r.json())
        .then(data => {
          if (callback) callback(data);
        })
        .catch(err => {
          console.error("Eroare incarcare:", err);
        });
    } else {
      payload.action = actionName;
      fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(data => { if (callback) callback(data); })
      .catch(err => showToast("Eroare sincronizare", "error"));
    }
  }
}

function showToast(mesaj, tip = 'success') {
  let t = document.getElementById('customToast');
  if (!t) return;
  t.innerText = mesaj;
  t.className = 'show ' + (tip === 'error' ? 'error' : 'success');
  setTimeout(() => { t.className = ''; }, 2600);
}

function customConfirm(titlu, text, onConfirm) {
  document.getElementById('modalTitle').innerText = titlu;
  document.getElementById('modalText').innerText = text;
  document.getElementById('customModalBackdrop').style.display = 'flex';
  modalCallback = onConfirm;
}

function closeCustomModal(confirmed) {
  document.getElementById('customModalBackdrop').style.display = 'none';
  if (confirmed && modalCallback) modalCallback();
  modalCallback = null;
}

function comutaExpandareBaraCalendar(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (tipTabCurent !== 'orar') return;

  let card = document.getElementById('calendarExpandableCard');
  if (card) {
    let seDeschide = !card.classList.contains('is-expanded');
    card.classList.toggle('is-expanded');
    
    if (seDeschide) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function actualizeazaStareCardFinal(oraCheie) {
  let endCard = document.getElementById('endScheduleCard');
  let container = document.getElementById('sloturiContainer');
  if (!endCard) return;

  endCard.classList.remove('state-ora-17', 'state-ora-18');

  if (oraCheie === '17:00') {
    endCard.classList.add('state-ora-17');
    if (container) container.style.paddingBottom = '0px';
  } else if (oraCheie === '18:00') {
    endCard.classList.add('state-ora-18');
    if (container) container.style.paddingBottom = '0px';
  } else {
    if (container) container.style.paddingBottom = '0px';
  }
}

function autoScrollLaOraCurenta() {
  let now = new Date();
  let day = now.getDay();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();

  let esteInAfaraProgramuluiWeekend = (day === 5 && currentHour >= 22) || (day === 6) || (day === 0);
  if (esteInAfaraProgramuluiWeekend) return;

  let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
  if (!esteSaptamanaActiva() || ziCurentaCheie !== zileChei[day]) {
    actualizeazaStareCardFinal("");
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  let tabOrar = document.getElementById('tabOrar');
  if (!tabOrar || !tabOrar.classList.contains('active')) return;

  let hourBlocks = document.querySelectorAll('.hour-block');
  if (!hourBlocks || hourBlocks.length === 0) return;

  let currentTimeInMinutes = currentHour * 60 + currentMinute;
  let closestBlock = null;
  let minDiff = Infinity;
  let closestOraText = "";

  hourBlocks.forEach(block => {
    let oraText = block.getAttribute('data-ora');
    if (!oraText || oraText.indexOf(':') === -1) return;
    let parts = oraText.split(':');
    let blockMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    let diff = Math.abs(currentTimeInMinutes - blockMinutes);

    if (diff < minDiff) {
      minDiff = diff;
      closestBlock = block;
      closestOraText = oraText;
    }
  });

  actualizeazaStareCardFinal(closestOraText);

  if (closestBlock) {
    if (currentHour <= 8) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      let headerEl = document.querySelector('header');
      let daySelector = document.getElementById('dayButtonsContainer');
      let topOffset = (headerEl ? headerEl.offsetHeight : 50) + (daySelector ? daySelector.offsetHeight : 45) + 10;
      
      // Asigură că la 17:00 și 18:00 pagina are suficient spațiu pentru a aduce cardul fix sub tabul de zile
      let tabOrarEl = document.getElementById('tabOrar');
      if (tabOrarEl && (closestOraText === '17:00' || closestOraText === '18:00')) {
        let blockHeight = closestBlock.offsetHeight || 130;
        let vh = window.innerHeight;
        let spatiuNecesar = Math.max(0, Math.round(vh - blockHeight - topOffset - 40));
        tabOrarEl.style.minHeight = `calc(100vh + ${spatiuNecesar}px)`;
      } else if (tabOrarEl) {
        tabOrarEl.style.minHeight = 'auto';
      }

      let blockRect = closestBlock.getBoundingClientRect();
      let targetY = blockRect.top + window.pageYOffset - topOffset;

      if (targetY < 60) targetY = 0;

      window.scrollTo({
        top: Math.max(0, Math.round(targetY)),
        behavior: 'auto'
      });
    }

    closestBlock.classList.remove('hour-block-current-highlight');
    void closestBlock.offsetWidth;
    closestBlock.classList.add('hour-block-current-highlight');
    setTimeout(() => {
      closestBlock.classList.remove('hour-block-current-highlight');
    }, 2000);
  }
}

function peComutareIstoricIncasari(detailsEl) {
  if (detailsEl && detailsEl.open) {
    setTimeout(() => {
      let headerEl = document.querySelector('header');
      let hOffset = headerEl ? headerEl.offsetHeight : 52;
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - 12)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

function peComutareIstoricOrar(detailsEl) {
  if (detailsEl && detailsEl.open) {
    setTimeout(() => {
      let headerEl = document.querySelector('header');
      let daySelector = document.getElementById('dayButtonsContainer');
      let hOffset = (headerEl ? headerEl.offsetHeight : 52) + (daySelector ? daySelector.offsetHeight : 45);
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - 12)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

function peComutareIstoricFisa(detailsEl) {
  if (detailsEl && detailsEl.open) {
    setTimeout(() => {
      let headerEl = document.querySelector('header');
      let hOffset = headerEl ? headerEl.offsetHeight : 52;
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - 12)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

function actualizeazaHeaderVisual(tipTab, titlu) {
  let wrapper = document.getElementById('pageTitleWrapper');
  if (!wrapper) return;

  let iconHtml = '';
  if (tipTab === 'orar') {
    iconHtml = `
      <button class="header-icon-bubble-btn" id="headerIconOrarBtn" onclick="comutaExpandareBaraCalendar(event)" title="Comută selectorul de săptămână">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <text x="12" y="15" font-size="5.5" font-weight="900" font-family="-apple-system, sans-serif" text-anchor="middle" fill="#fff" stroke="none">21</text>
          <text x="12" y="19.5" font-size="4" font-weight="900" font-family="-apple-system, sans-serif" text-anchor="middle" fill="#fff" stroke="none">DEC</text>
        </svg>
      </button>
    `;
  } else if (tipTab === 'prog') {
    iconHtml = `
      <div class="header-static-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </div>
    `;
  } else if (tipTab === 'fisa') {
    iconHtml = `
      <div class="header-static-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"></rect>
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M7 17c0-2 2.5-3 5-3s5 1 5 3"></path>
        </svg>
      </div>
    `;
  } else if (tipTab === 'incasari') {
    iconHtml = `
      <div class="header-static-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
          <rect x="2" y="5" width="20" height="14" rx="3"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
          <circle cx="14" cy="15" r="1.8" fill="#fff" stroke="none"></circle>
          <circle cx="17" cy="15" r="1.8" fill="#fff" stroke="none" opacity="0.6"></circle>
        </svg>
      </div>
    `;
  }
  wrapper.innerHTML = `${iconHtml}<span id="pageTitle">${titlu}</span>`;
}

window.onload = function() {
  reseteazaDateIncasariAzi();
  leagaAscultatoriCuratareErori();

  let d = new Date();
  let aziIdx = d.getDay();
  let ora = d.getHours();
  let esteTrecutDeVineriSeara = (aziIdx === 5 && ora >= 22) || (aziIdx === 6) || (aziIdx === 0);

  let zileChei = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
  if (esteTrecutDeVineriSeara) {
    ziCurentaCheie = "Luni";
  } else {
    ziCurentaCheie = (aziIdx >= 1 && aziIdx <= 5) ? zileChei[aziIdx - 1] : "Luni";
  }

  actualizeazaBaraZile();

  try {
    let cached = localStorage.getItem("BFIT_DB_LOCAL");
    if (cached) {
      let parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.orarSloturi)) {
        DB = parsed;
      }
    }
  } catch(e) {}

  populeazaSelectoriCliente();
  populeazaSelectorLuni();
  randeazaOrarInstant();
  randeazaProgramariInstant();
  filtreazaIstoricIncasariInstant();
  filtreazaIstoricOrarInstant();

  animaPilaMercur(0);
  actualizeazaHeaderVisual(tipTabCurent, 'Orar Săptămânal');

  setTimeout(() => {
    autoScrollLaOraCurenta();
  }, 60);

  incarcaBazaDateSilencios(null);
};

function incarcaBazaDateSilencios(clientaSelectataDupaActualizare = null) {
  callBackend("getTotBazaDeDate", {}, function(data) {
    if (!data || !Array.isArray(data.orarSloturi)) return;
    DB = data;
    try {
      localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(data));
    } catch(e) {}

    populeazaSelectoriCliente();
    populeazaSelectorLuni();
    randeazaOrarInstant();
    randeazaProgramariInstant();
    filtreazaIstoricIncasariInstant();
    filtreazaIstoricOrarInstant();

    if (clientaSelectataDupaActualizare) {
      let sel = document.getElementById('selectClientaFisa');
      if (sel) {
        sel.value = clientaSelectataDupaActualizare;
        actualizeazaStilSelect(sel);
        afiseazaFisaClientaInstant();
      }
    }
  });
}

function schimbaSaptamanaAnimat(directie) {
  let lbl = document.getElementById('labelIntervalSaptamana');
  if (lbl) {
    lbl.style.opacity = '0.3';
    lbl.style.transform = directie > 0 ? 'translateX(8px)' : 'translateX(-8px)';
  }

  setTimeout(() => {
    dataReferintaLuni.setDate(dataReferintaLuni.getDate() + (directie * 7));
    actualizeazaBaraZile();
    randeazaOrarInstant();
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (lbl) {
      lbl.style.opacity = '1';
      lbl.style.transform = 'translateX(0)';
    }
  }, 140);
}

function revinoLaSaptamanaCurenta() {
  if (esteSaptamanaActiva()) {
    showToast("Ești deja în săptămâna curentă!");
    autoScrollLaOraCurenta();
    return;
  }
  dataReferintaLuni = new Date(dataReferintaLuniBaza.getTime());
  
  let d = new Date();
  let aziIdx = d.getDay();
  let zileChei = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
  ziCurentaCheie = (aziIdx >= 1 && aziIdx <= 5) ? zileChei[aziIdx - 1] : "Luni";

  actualizeazaBaraZile();
  randeazaOrarInstant();
  setTimeout(() => {
    autoScrollLaOraCurenta();
  }, 50);
  showToast("✓ Ai revenit la săptămâna curentă!");
}

function getZileConfig() {
  let zileInfo = [
    { cheie: "Luni", nume: "Luni" },
    { cheie: "Marti", nume: "Marți" },
    { cheie: "Miercuri", nume: "Miercuri" },
    { cheie: "Joi", nume: "Joi" },
    { cheie: "Vineri", nume: "Vineri" }
  ];

  return zileInfo.map((z, idx) => {
    let d = new Date(dataReferintaLuni);
    d.setDate(d.getDate() + idx);
    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0');
    let yyyy = d.getFullYear();
    return {
      cheie: z.cheie,
      nume: z.nume,
      dataStrRo: `${dd}.${mm}.${yyyy}`,
      dataDate: d
    };
  });
}

function getDataCalendaristicaCurenta() {
  let zCfg = getZileConfig().find(z => z.cheie === ziCurentaCheie);
  return zCfg ? zCfg.dataStrRo : "";
}

function actualizeazaBaraZile() {
  let zile = getZileConfig();
  let luniStr = `${zile[0].dataDate.getDate()} ${zile[0].dataDate.toLocaleString('ro', { month: 'short' })}`;
  let vineriStr = `${zile[4].dataDate.getDate()} ${zile[4].dataDate.toLocaleString('ro', { month: 'short' })} ${zile[4].dataDate.getFullYear()}`;
  let textInterval = `${luniStr} - ${vineriStr}`;

  let lbl = document.getElementById('labelIntervalSaptamana');
  if (lbl) lbl.innerText = textInterval;

  let subLabel = document.getElementById('subLabelStareSaptamana');
  let btnAzi = document.getElementById('btnRevinoAzi');

  if (subLabel) {
    if (esteSaptamanaActiva()) {
      subLabel.style.display = 'none';
    } else if (esteSaptamanaTrecuta()) {
      subLabel.innerText = "Istoric (Săptămână trecută)";
      subLabel.style.display = 'inline-block';
      subLabel.style.background = '#fee2e2';
      subLabel.style.color = '#b91c1c';
    } else {
      subLabel.innerText = "Planificat (Săptămână viitoare)";
      subLabel.style.display = 'inline-block';
      subLabel.style.background = '#fef3c7';
      subLabel.style.color = '#b45309';
    }
  }

  if (btnAzi) {
    btnAzi.style.display = esteSaptamanaActiva() ? 'none' : 'block';
  }

  let container = document.getElementById('dayButtonsContainer');
  if (!container) return;
  let html = '';
  zile.forEach(z => {
    let activeCls = (z.cheie === ziCurentaCheie) ? 'active' : '';
    html += `
      <button class="day-btn ${activeCls}" onclick="schimbaZiInstant('${z.cheie}')">
        <span>${z.nume}</span>
        <span class="day-date-sub">${z.dataDate.getDate()} ${z.dataDate.toLocaleString('ro', { month: 'short' })}</span>
      </button>
    `;
  });
  container.innerHTML = html;
}

function schimbaZiInstant(ziCheie) {
  ziCurentaCheie = ziCheie;
  actualizeazaBaraZile();
  randeazaOrarInstant();
  
  let d = new Date();
  let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
  let esteAzi = esteSaptamanaActiva() && ziCurentaCheie === zileChei[d.getDay()];

  if (esteAzi) {
    autoScrollLaOraCurenta();
  } else {
    actualizeazaStareCardFinal("");
    let tabOrarEl = document.getElementById('tabOrar');
    if (tabOrarEl) tabOrarEl.style.minHeight = 'auto';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function populeazaSelectoriCliente() {
  let checkArch = document.getElementById('checkArataArhivate');
  let arataArhivate = checkArch ? checkArch.checked : false;
  let select = document.getElementById('selectClientaFisa');
  if (!select) return;

  let valoareAnterioara = select.value;
  let datalist = document.getElementById('listaClienteVizibile');
  let filtruIncasari = document.getElementById('filtruClientaIncasari');
  let filtruOrar = document.getElementById('filtruClientaOrar');

  select.innerHTML = '<option value="">Alege o clientă</option>';
  if (datalist) datalist.innerHTML = '';
  if (filtruIncasari) filtruIncasari.innerHTML = '<option value="">Toate clientele</option>';
  if (filtruOrar) filtruOrar.innerHTML = '<option value="">Toate clientele</option>';

  (DB.clienti || []).forEach(c => {
    let esteArhivat = (c.status || '').toLowerCase() === 'arhivat';

    if (!esteArhivat) {
      if (datalist) {
        let optL = document.createElement('option');
        optL.value = c.nume;
        datalist.appendChild(optL);
      }
      if (filtruIncasari) {
        let optF = document.createElement('option');
        optF.value = c.nume;
        optF.innerText = c.nume;
        filtruIncasari.appendChild(optF);
      }
      if (filtruOrar) {
        let optO = document.createElement('option');
        optO.value = c.nume;
        optO.innerText = c.nume;
        filtruOrar.appendChild(optO);
      }
    }

    if (!esteArhivat || arataArhivate) {
      let opt = document.createElement('option');
      opt.value = c.nume;
      opt.innerText = c.nume + (esteArhivat ? ' (Arhivat)' : '');
      select.appendChild(opt);
    }
  });

  if (valoareAnterioara) {
    select.value = valoareAnterioara;
    actualizeazaStilSelect(select);
  }
}

function populeazaSelectorLuni() {
  let selLuna = document.getElementById('filtruLunaIncasari');
  if (!selLuna) return;

  let valoareAnterioara = selLuna.value;
  let luniSet = new Set();

  (DB.incasari || []).forEach(i => {
    if (i && i.luna && i.luna.trim() !== "-" && i.luna.trim() !== "") {
      luniSet.add(i.luna.trim());
    }
  });

  const luniRo = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

  function calculeazaScorLuna(str) {
    if (!str) return 0;
    let s = str.toLowerCase().trim();
    let anGasit = 0;
    let anMatch = s.match(/\b(20\d\d)\b/);
    if (anMatch) anGasit = parseInt(anMatch[1], 10);
    
    let lunaIdx = -1;
    for (let idx = 0; idx < luniRo.length; idx++) {
      if (s.indexOf(luniRo[idx]) !== -1) {
        lunaIdx = idx;
        break;
      }
    }
    if (lunaIdx === -1) {
      let p = s.split(/[\.\-\/]/);
      if (p.length >= 2) {
        let m = parseInt(p[0], 10);
        if (m >= 1 && m <= 12) lunaIdx = m - 1;
        if (p[1] && p[1].length === 4) anGasit = parseInt(p[1], 10);
      }
    }
    return (anGasit || 2026) * 100 + (lunaIdx !== -1 ? lunaIdx : 0);
  }

  let luniArray = Array.from(luniSet);
  luniArray.sort((a, b) => calculeazaScorLuna(b) - calculeazaScorLuna(a));

  selLuna.innerHTML = '<option value="">Toate lunile</option>';
  luniArray.forEach(luna => {
    let opt = document.createElement('option');
    opt.value = luna;
    opt.innerText = luna;
    selLuna.appendChild(opt);
  });

  if (valoareAnterioara) {
    selLuna.value = valoareAnterioara;
  }
}

function comutaTab(tabId, titlu, btn, tipTab, tabIdx) {
  tipTabCurent = tipTab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
  let target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  if (typeof tabIdx === 'number') {
    animaPilaMercur(tabIdx);
  }

  if (tipTab === 'incasari') {
    reseteazaDateIncasariAzi();
  }
  
  actualizeazaHeaderVisual(tipTab, titlu);

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

  let detInc = document.getElementById('detailsIstoricIncasari');
  if (detInc) detInc.open = false;

  let detAdaugFisa = document.getElementById('detailsAdaugareClienta');
  if (detAdaugFisa) detAdaugFisa.open = false;

  let detEditFisa = document.getElementById('detailsEditareFisa');
  if (detEditFisa) detEditFisa.open = false;

  let detIstFisa = document.getElementById('detailsIstoricFisa');
  if (detIstFisa) detIstFisa.open = false;

  let tabOrarEl = document.getElementById('tabOrar');
  if (tabOrarEl && tipTab !== 'orar') {
    tabOrarEl.style.minHeight = 'auto';
  }

  window.scrollTo({ top: 0, behavior: 'auto' });

  if (tipTab === 'orar') {
    setTimeout(() => {
      autoScrollLaOraCurenta();
    }, 50);
  }
}

// --- ORAR ---
function randeazaOrarInstant() {
  let container = document.getElementById('sloturiContainer');
  if (!container) return;
  let dataCalendarCurenta = getDataCalendaristicaCurenta();
  let saptamanaCheie = getSaptamanaCheie();
  let tagZiCautat = saptamanaCheie ? (saptamanaCheie + "_" + ziCurentaCheie) : ziCurentaCheie;
  let eTrecuta = esteSaptamanaTrecuta();

  let sloturi = [];

  if (eTrecuta) {
    let prezenteZi = (DB.prezente || []).filter(p => p && p.data === dataCalendarCurenta);
    let grupuriOreTrecute = {};
    prezenteZi.forEach(p => {
      if (!p.ora) return;
      if (!grupuriOreTrecute[p.ora]) grupuriOreTrecute[p.ora] = [];
      grupuriOreTrecute[p.ora].push({
        row: null,
        ora: p.ora,
        clienta: p.clienta,
        antrenament: p.antrenament,
        blocat: false,
        bifat: true
      });
    });

    let oreSet = Object.keys(grupuriOreTrecute).sort((a, b) => a.localeCompare(b));
    if (oreSet.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); padding:24px; text-align:center;">Nici o prezență înregistrată în această zi din trecut.</div>';
      return;
    }

    let htmlTrecut = '';
    oreSet.forEach(ora => {
      let lista = grupuriOreTrecute[ora];
      htmlTrecut += `
        <div class="hour-block" data-ora="${ora}">
          <div class="hour-header">
            <div class="hour-title-wrap"><span>🕒 ${ora}</span></div>
            <div class="hour-badge hour-badge-busy">${lista.length} efectuate</div>
          </div>
          <div class="hour-slots-wrapper">
      `;
      lista.forEach((s, idx) => {
        htmlTrecut += `
          <div class="slot-row slot-occupied">
            <div class="slot-num">${idx + 1}</div>
            <div class="slot-info">
              <input type="text" class="slot-input" value="${s.clienta}" readonly style="background:#f8fafc; font-weight:700;">
              <input type="text" class="slot-input" value="${s.antrenament}" readonly style="background:#f8fafc; color:#64748b; font-size:0.8rem; margin-top:2px;">
            </div>
            <div style="font-size:0.85rem; font-weight:800; color:#15803d; padding:0 8px;">✓ Istoric</div>
          </div>
        `;
      });
      htmlTrecut += `</div></div>`;
    });
    container.innerHTML = htmlTrecut;
    return;
  }

  sloturi = (DB.orarSloturi || []).filter(s => {
    if (!s || !s.ziRaw) return false;
    let z = s.ziRaw;
    if (saptamanaCheie === "") {
      return z === ziCurentaCheie || (ziCurentaCheie === "Marti" && z === "Marți");
    } else {
      return z === tagZiCautat;
    }
  });

  let oreStandard = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  let grupuriOre = {};
  sloturi.forEach(slot => {
    if (!slot || !slot.ora) return;
    if (!grupuriOre[slot.ora]) grupuriOre[slot.ora] = [];
    grupuriOre[slot.ora].push(slot);
  });

  oreStandard.forEach(ora => {
    if (!grupuriOre[ora]) grupuriOre[ora] = [];
    while (grupuriOre[ora].length < 3) {
      grupuriOre[ora].push({ row: null, ora: ora, clienta: "", antrenament: "", blocat: false, bifat: false });
    }
    if (grupuriOre[ora].length > 3) {
      grupuriOre[ora] = grupuriOre[ora].slice(0, 3);
    }
  });

  let oreSortate = Object.keys(grupuriOre).sort((a, b) => a.localeCompare(b));

  let html = '';
  oreSortate.forEach(ora => {
    let sloturiOra = grupuriOre[ora] || [];
    let esteBlocat = sloturiOra.some(s => s && s.blocat);
    let ocupate = sloturiOra.filter(s => s && s.clienta && s.clienta.trim() !== "").length;
    let total = Math.min(3, sloturiOra.length);

    let badgeHtml = '';
    if (esteBlocat) {
      badgeHtml = `<div class="hour-badge hour-badge-blocked">Ora Blocată!</div>`;
    } else {
      badgeHtml = `<div class="hour-badge ${ocupate > 0 ? 'hour-badge-busy' : 'hour-badge-free'}">${ocupate} / ${total} ocupate</div>`;
    }

    html += `
      <div class="hour-block ${esteBlocat ? 'hour-block-blocked' : ''}" data-ora="${ora}">
        <div class="hour-header">
          <div class="hour-title-wrap">
            <button class="btn-lock-hour" onclick="comutaBlocareOraInstant('${ziCurentaCheie}', '${ora}', ${!esteBlocat})" title="${esteBlocat ? 'Deblochează ora' : 'Blochează ora'}">
              🕒
            </button>
            <span>${ora}</span>
          </div>
          ${badgeHtml}
        </div>
        <div class="hour-slots-wrapper">
    `;

    sloturiOra.slice(0, 3).forEach((slot, idx) => {
      let clientaCurata = (slot && slot.clienta) ? slot.clienta.trim() : "";
      let clientaValida = gasesteClientaValida(clientaCurata);
      let isOccupied = !!clientaValida;
      let antVal = (slot && slot.antrenament) ? slot.antrenament : "";
      let slotRowKey = (slot && slot.row) ? slot.row : `new_${ora.replace(':', '')}_${idx}`;

      let colorCls = "";
      if (antVal) {
        let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === antVal.toLowerCase());
        if (cfg) colorCls = cfg.cls;
      }

      let selectAntHtml = `<select id="ant_${slotRowKey}" class="slot-select-type ${antVal ? 'select-active ' + colorCls : 'select-faded'}" onchange="aplicaCuloareAntrenament(this); peSchimbareAntrenament('${slotRowKey}', '${ziCurentaCheie}', '${ora}', ${idx})">`;
      selectAntHtml += `<option value="" ${!antVal ? 'selected' : ''}>Tip antrenament</option>`;
      optiuniAntrenamentConfig.forEach(opt => {
        let selected = (antVal === opt.text) ? 'selected' : '';
        selectAntHtml += `<option value="${opt.text}" ${selected}>${opt.text}</option>`;
      });
      selectAntHtml += `</select>`;

      let saveBtnDisabledAttr = (!isOccupied || slot.bifat) ? 'disabled' : '';
      let saveBtnClass = (!isOccupied || slot.bifat) ? 'btn btn-save-check btn-save-check-disabled' : 'btn btn-save-check';

      html += `
        <div class="slot-row ${isOccupied ? 'slot-occupied' : 'slot-free'}">
          <div class="slot-num">${idx + 1}</div>
          <div class="slot-info">
            <input type="text" id="cli_${slotRowKey}" class="slot-input" value="${clientaCurata}" placeholder="Alege clientă existentă..." list="listaClienteVizibile" oninput="peSchimbareNumeClienta('${slotRowKey}', '${ziCurentaCheie}', '${ora}', ${idx})">
            ${selectAntHtml}
          </div>
          <div style="display:flex; gap:4px;">
            <button id="btn_save_${slotRowKey}" class="${saveBtnClass}" ${saveBtnDisabledAttr} title="Bifează Prezența & Scade Ședință" onclick="bifeazaPrezentaSlot('${slotRowKey}', '${ziCurentaCheie}', '${ora}', ${idx})">✓</button>
            <button class="btn btn-clear" title="Eliberează Slot & Șterge din Istoric" onclick="anuleazaSlot('${slotRowKey}', '${ziCurentaCheie}', '${ora}', ${idx})">✕</button>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function comutaBlocareOraInstant(zi, ora, blocatNou) {
  let textConfirm = blocatNou ? `Blochezi intervalul orar ${ora}?` : `Deblochezi intervalul orar ${ora}?`;
  customConfirm("Blocare oră", textConfirm, function() {
    (DB.orarSloturi || []).forEach(s => {
      if ((s.ziRaw === zi || s.ziRaw.indexOf(zi) !== -1) && s.ora === ora) {
        s.blocat = blocatNou;
      }
    });
    randeazaOrarInstant();
    callBackend("comutaBlocareOra", { zi: zi, ora: ora, blocat: blocatNou }, function() {
      showToast(blocatNou ? `✓ Intervalul ${ora} a fost blocat!` : `✓ Intervalul ${ora} a fost deblocat!`);
      incarcaBazaDateSilencios();
    });
  });
}

let debounceTimerNume = null;
function peSchimbareNumeClienta(slotRowKey, zi, ora, slotIdx) {
  let elCli = document.getElementById('cli_' + slotRowKey);
  let elBtnSave = document.getElementById('btn_save_' + slotRowKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (elBtnSave) {
    if (clientaGasita) {
      elBtnSave.disabled = false;
      elBtnSave.classList.remove('btn-save-check-disabled');
    } else {
      elBtnSave.disabled = true;
      elBtnSave.classList.add('btn-save-check-disabled');
    }
  }

  clearTimeout(debounceTimerNume);
  debounceTimerNume = setTimeout(() => {
    let elAnt = document.getElementById('ant_' + slotRowKey);
    let antrenament = elAnt ? elAnt.value : "";
    let saptamanaCheie = getSaptamanaCheie();
    let dataCalendar = getDataCalendaristicaCurenta();
    let rowNum = (typeof slotRowKey === 'number' || (!isNaN(slotRowKey) && String(slotRowKey).indexOf('new_') === -1)) ? Number(slotRowKey) : null;

    if (!textIntrodus) {
      if (rowNum) {
        let slot = (DB.orarSloturi || []).find(s => s.row === rowNum);
        if (slot) {
          slot.clienta = "";
          slot.antrenament = "";
          slot.bifat = false;
        }
        callBackend("salveazaSlotAuto", {
          row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: ora, clienta: "", antrenament: ""
        }, function() {
          incarcaBazaDateSilencios();
        });
      }
      return;
    }

    if (!clientaGasita) {
      return;
    }

    let numeExact = clientaGasita.nume;
    if (elCli && elCli.value !== numeExact) {
      elCli.value = numeExact;
    }

    let slot = (DB.orarSloturi || []).find(s => s.row === rowNum);
    if (slot) {
      slot.clienta = numeExact;
      slot.antrenament = antrenament;
    }

    callBackend("salveazaSlotAuto", {
      row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: ora, clienta: numeExact, antrenament: antrenament
    }, function(res) {
      if (res && res.row) {
        if (!rowNum && elCli) {
          elCli.id = 'cli_' + res.row;
          if (elAnt) elAnt.id = 'ant_' + res.row;
          if (elBtnSave) elBtnSave.id = 'btn_save_' + res.row;
        }
        incarcaBazaDateSilencios();
      }
    });
  }, 400);
}

function peSchimbareAntrenament(slotRowKey, zi, ora, slotIdx) {
  let elCli = document.getElementById('cli_' + slotRowKey);
  let elAnt = document.getElementById('ant_' + slotRowKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let antrenament = elAnt ? elAnt.value : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (!clientaGasita) {
    showToast("Alege mai întâi o clientă activă existentă!", "error");
    if (elAnt) {
      elAnt.value = "";
      aplicaCuloareAntrenament(elAnt);
    }
    return;
  }

  let numeExact = clientaGasita.nume;
  let saptamanaCheie = getSaptamanaCheie();
  let dataCalendar = getDataCalendaristicaCurenta();
  let rowNum = (typeof slotRowKey === 'number' || (!isNaN(slotRowKey) && String(slotRowKey).indexOf('new_') === -1)) ? Number(slotRowKey) : null;
  let slot = (DB.orarSloturi || []).find(s => s.row === rowNum);
  if (slot) {
    slot.clienta = numeExact;
    slot.antrenament = antrenament;
  }

  callBackend("salveazaSlotAuto", {
    row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: ora, clienta: numeExact, antrenament: antrenament
  }, function(res) {
    if (res && res.row && !rowNum) {
      incarcaBazaDateSilencios();
    }
    showToast("✓ Antrenament salvat!");
  });
}

function bifeazaPrezentaSlot(slotRowKey, zi, ora, slotIdx) {
  let elCli = document.getElementById('cli_' + slotRowKey);
  let elAnt = document.getElementById('ant_' + slotRowKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let antrenament = elAnt ? elAnt.value : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (!clientaGasita) {
    showToast("Alege o clientă validă din listă!", "error");
    return;
  }

  let numeExact = clientaGasita.nume;
  let dataCalendar = getDataCalendaristicaCurenta();
  let saptamanaCheie = getSaptamanaCheie();
  let rowNum = (typeof slotRowKey === 'number' || (!isNaN(slotRowKey) && String(slotRowKey).indexOf('new_') === -1)) ? Number(slotRowKey) : null;

  let slot = (DB.orarSloturi || []).find(s => s.row === rowNum);
  if (slot) {
    slot.clienta = numeExact;
    slot.antrenament = antrenament;
    slot.bifat = true;
  }

  showToast("✓ Prezență marcată & ședință scăzută!");
  callBackend("bifeazaPrezenta", {
    row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: ora, clienta: numeExact, antrenament: antrenament
  }, function() {
    incarcaBazaDateSilencios();
  });
}

function anuleazaSlot(slotRowKey, zi, ora, slotIdx) {
  customConfirm("Eliberare slot", "Eliberezi acest slot? Ședința va fi restituită în fișa clientei dacă a fost bifată, iar intrarea va fi ștearsă din istoric.", function() {
    let dataCalendar = getDataCalendaristicaCurenta();
    let saptamanaCheie = getSaptamanaCheie();
    let rowNum = (typeof slotRowKey === 'number' || (!isNaN(slotRowKey) && String(slotRowKey).indexOf('new_') === -1)) ? Number(slotRowKey) : null;

    let elCli = document.getElementById('cli_' + slotRowKey);
    let elAnt = document.getElementById('ant_' + slotRowKey);
    let elBtnSave = document.getElementById('btn_save_' + slotRowKey);

    if (elCli) elCli.value = "";
    if (elAnt) {
      elAnt.value = "";
      aplicaCuloareAntrenament(elAnt);
    }
    if (elBtnSave) {
      elBtnSave.disabled = true;
      elBtnSave.classList.add('btn-save-check-disabled');
    }

    let slot = (DB.orarSloturi || []).find(s => s.row === rowNum);
    if (slot) {
      slot.clienta = "";
      slot.antrenament = "";
      slot.bifat = false;
    }

    showToast("✓ Slot eliberat!");
    callBackend("anuleazaSlot", {
      row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: ora
    }, function() {
      incarcaBazaDateSilencios();
    });
  });
}

function adaugaOraCustom() {
  let inp = document.getElementById('inputOraCustom');
  let ora = inp ? inp.value.trim() : "";
  if (!ora) {
    showToast("Introdu ora suplimentară!", "error");
    return;
  }

  callBackend("adaugaOraCustom", { zi: ziCurentaCheie, ora: ora }, function(res) {
    showToast("✓ Oră adăugată: " + res.ora);
    if (inp) inp.value = '';
    incarcaBazaDateSilencios();
  });
}

function filtreazaIstoricOrarInstant() {
  let fEl = document.getElementById('filtruClientaOrar');
  let filtru = fEl ? fEl.value.toLowerCase() : "";
  let tbody = document.getElementById('istoricOrarTbody');
  if (!tbody) return;

  let filtrate = (DB.prezente || []).filter(p => p && (!filtru || (p.clienta && p.clienta.toLowerCase() === filtru)));

  filtrate.sort((a, b) => {
    let tA = parseazaDataOraRo(a.data, a.ora);
    let tB = parseazaDataOraRo(b.data, b.ora);
    return tB - tA;
  });

  if (filtrate.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Nici o prezență găsită.</td></tr>';
    return;
  }
  let html = '';
  filtrate.forEach(item => {
    html += `
      <tr>
        <td><b>${item.data}</b></td>
        <td style="font-weight:700; color:#475569;">${item.ora || '-'}</td>
        <td style="font-weight:700; color:var(--primary);">${item.clienta}</td>
        <td>${item.antrenament || '-'}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// --- PROGRAMĂRI & HOLD ---
function getPillClass(val) {
  if (val === "Confirmata") return "pill-confirmata";
  if (val === "In asteptare") return "pill-asteptare";
  if (val === "Absenta") return "pill-absenta";
  return "pill-empty";
}

function randeazaProgramariInstant() {
  let actContainer = document.getElementById('progActiveList');
  let holdContainer = document.getElementById('progHoldList');

  if (actContainer) {
    let actHtml = '';
    (DB.progActive || []).forEach((item, index) => {
      let pCls = getPillClass(item.prezenta);
      actHtml += `
        <div class="prog-grid-layout prog-row">
          <div class="prog-idx">${index + 1}</div>
          <div class="prog-name">${item.nume}</div>
          <div>
            <select class="pill-select ${pCls}" onchange="schimbaPrezenta(${item.row}, this)">
              <option value="" ${item.prezenta === '' ? 'selected' : ''}>-</option>
              <option value="Confirmata" ${item.prezenta === 'Confirmata' ? 'selected' : ''}>Confirmata</option>
              <option value="In asteptare" ${item.prezenta === 'In asteptare' ? 'selected' : ''}>In asteptare</option>
              <option value="Absenta" ${item.prezenta === 'Absenta' ? 'selected' : ''}>Absenta</option>
            </select>
          </div>
          <div>
            <textarea class="prog-mentiuni-textarea" placeholder="Mențiune..." onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action" onclick="mutaInHold(${item.row})" title="Mută în Hold">🗑</button>
          </div>
        </div>
      `;
    });
    actContainer.innerHTML = actHtml || '<div style="padding:10px; color:#888; text-align:center;">Nici o înregistrare</div>';
  }

  if (holdContainer) {
    let holdHtml = '';
    (DB.progHold || []).forEach((item, index) => {
      let pCls = getPillClass(item.prezenta);
      holdHtml += `
        <div class="prog-grid-layout prog-row hold-row">
          <div class="prog-idx">${index + 1}</div>
          <div class="prog-name">${item.nume}</div>
          <div>
            <select class="pill-select ${pCls}" onchange="schimbaPrezenta(${item.row}, this)">
              <option value="" ${item.prezenta === '' ? 'selected' : ''}>-</option>
              <option value="Confirmata" ${item.prezenta === 'Confirmata' ? 'selected' : ''}>Confirmata</option>
              <option value="In asteptare" ${item.prezenta === 'In asteptare' ? 'selected' : ''}>In asteptare</option>
              <option value="Absenta" ${item.prezenta === 'Absenta' ? 'selected' : ''}>Absenta</option>
            </select>
          </div>
          <div>
            <textarea class="prog-mentiuni-textarea" placeholder="Motiv..." onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action" onclick="stergeProgramareDefinitiv(${item.row})" title="Șterge definitiv">🗑</button>
          </div>
        </div>
      `;
    });
    holdContainer.innerHTML = holdHtml || '<div style="padding:10px; color:#888; text-align:center;">Nici o clientă în Hold</div>';
  }
}

function schimbaPrezenta(row, selectEl) {
  let val = selectEl.value;
  selectEl.className = "pill-select " + getPillClass(val);
  callBackend("actualizeazaCampProgramare", { row: row, col: 3, val: val }, function() {
    showToast("✓ Status actualizat!");
  });
}

function schimbaMentiune(row, val) {
  callBackend("actualizeazaCampProgramare", { row: row, col: 4, val: val }, function() {});
}

function adaugaClientaInProgramari() {
  let inp = document.getElementById('progNouNume');
  let sec = document.getElementById('progNouSectiune');
  let nume = inp ? inp.value.trim() : "";
  let sectiune = sec ? sec.value : "Activ";
  if (!nume) return;

  callBackend("adaugaRandProgramare", { nume: nume, prezenta: "", mentiuni: "", esteHold: sectiune === "Hold" }, function() {
    showToast("✓ Adăugată în programări!");
    if (inp) inp.value = '';
    incarcaBazaDateSilencios();
  });
}

function mutaInHold(row) {
  customConfirm("Mutare în Hold", "Mut clienta în secțiunea Hold?", function() {
    callBackend("mutaInHold", { row: row }, function() {
      showToast("✓ Mutată în Hold!");
      incarcaBazaDateSilencios();
    });
  });
}

function stergeProgramareDefinitiv(row) {
  customConfirm("Ștergere definitivă", "Elimini această înregistrare din Hold?", function() {
    callBackend("stergeRandProgramare", { row: row }, function() {
      showToast("✓ Înregistrare ștearsă!");
      incarcaBazaDateSilencios();
    });
  });
}

// --- FIȘĂ CLIENTĂ ---
function afiseazaFisaClientaInstant() {
  let sel = document.getElementById('selectClientaFisa');
  let container = document.getElementById('detaliiFisa');
  let emptyState = document.getElementById('fisaEmptyState');
  if (!sel || !container) return;
  let nume = sel.value;

  if (!nume) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  let client = (DB.clienti || []).find(c => c && c.nume.toLowerCase() === nume.toLowerCase());
  if (!client) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  container.style.display = 'block';

  document.getElementById('fisaSedinteRamase').innerText = client.ramase;
  document.getElementById('fisaValabilitate').innerText = client.dataExpirare;
  document.getElementById('fisaProgres').innerText = client.efectuate + ' din ' + client.incluse;

  let procent = client.incluse > 0 ? Math.round((client.efectuate / client.incluse) * 100) : 0;
  if (procent > 100) procent = 100;
  document.getElementById('graficBara').style.width = procent + '%';
  document.getElementById('graficProcent').innerText = procent + '%';
  document.getElementById('graficProgresText').innerText = 'Progres: ' + client.efectuate + ' din ' + client.incluse + ' ședințe';
  document.getElementById('fisaTipAbonamentAfisat').innerText = client.tipAbonament;

  let badge = document.getElementById('fisaStatusBadge');
  let stLower = (client.status || '').toLowerCase();
  if (stLower === 'activ') badge.innerHTML = '<span class="badge badge-activ">Activ</span>';
  else if (stLower === 'arhivat') badge.innerHTML = '<span class="badge badge-arhivat">Arhivat</span>';
  else badge.innerHTML = '<span class="badge badge-expirat">' + client.status + '</span>';

  let btnArch = document.getElementById('btnArhivareToggle');
  if (btnArch) {
    if (stLower === 'arhivat') {
      btnArch.innerText = '♻ Reactivează Clienta (Arată în Liste)';
      btnArch.style.color = '#15803d'; btnArch.style.borderColor = '#86efac'; btnArch.style.background = '#f0fdf4';
    } else {
      btnArch.innerText = '📦 Arhivează / Ascunde din Liste';
      btnArch.style.color = '#b91c1c'; btnArch.style.borderColor = '#fecaca'; btnArch.style.background = '#fef2f2';
    }
  }

  document.getElementById('editNume').value = client.nume;
  let tipNormalizat = normalizeazaTipAbonament(client.tipAbonament);
  document.getElementById('editTip').value = tipNormalizat;
  document.getElementById('editDataStart').value = client.dataStart;
  document.getElementById('editDataExpirare').value = client.dataExpirare;
  document.getElementById('editIncluse').value = client.incluse;
  document.getElementById('editEfectuate').value = client.efectuate;
  document.getElementById('editRamase').value = client.ramase;
  document.getElementById('editStatus').value = client.status;

  let istoricDiv = document.getElementById('istoricPrezenteList');
  if (istoricDiv) {
    let prezenteClienta = (DB.prezente || []).filter(p => p && p.clienta && p.clienta.toLowerCase() === nume.toLowerCase());
    
    prezenteClienta.sort((a, b) => {
      let tA = parseazaDataOraRo(a.data, a.ora);
      let tB = parseazaDataOraRo(b.data, b.ora);
      return tB - tA;
    });

    if (prezenteClienta.length === 0) {
      istoricDiv.innerHTML = '<div style="color:var(--text-muted);">Nici o prezență înregistrată încă.</div>';
    } else {
      let h = '';
      prezenteClienta.forEach(p => {
        h += `<div style="padding:5px 0; border-bottom:1px solid #f0f0f0;">• <b>${p.data}</b> (${p.ora}) - ${p.antrenament}</div>`;
      });
      istoricDiv.innerHTML = h;
    }
  }
}

function salveazaEditareClienta() {
  let numeVechi = document.getElementById('selectClientaFisa').value;
  let numeNou = document.getElementById('editNume').value.trim();
  let tip = document.getElementById('editTip').value;
  let dStart = document.getElementById('editDataStart').value;
  let dExp = document.getElementById('editDataExpirare').value;
  let inc = document.getElementById('editIncluse').value;
  let ef = document.getElementById('editEfectuate').value;
  let ram = document.getElementById('editRamase').value;
  let st = document.getElementById('editStatus').value;

  callBackend("actualizeazaDateClienta", {
    numeVechi: numeVechi, numeNou: numeNou, tip: tip, dataStart: dStart, dataExp: dExp,
    incluse: inc, efectuate: ef, ramase: ram, status: st
  }, function(res) {
    showToast("✓ Date actualizate!");
    incarcaBazaDateSilencios(res && res.numeNou ? res.numeNou : numeNou);
  });
}

function creeazaClientaNouaDirect() {
  let inp = document.getElementById('nouNumeClienta');
  let nume = inp ? inp.value.trim() : "";
  let tip = document.getElementById('nouTipAbonament').value;
  if (!nume) { showToast("Introdu numele!", "error"); return; }

  callBackend("adaugaClientaDirect", { nume: nume, tip: tip }, function() {
    showToast("✓ Clientă adăugată!");
    if (inp) inp.value = '';
    incarcaBazaDateSilencios();
  });
}

function comutaArhivareClienta() {
  let sel = document.getElementById('selectClientaFisa');
  if (!sel) return;
  let nume = sel.value;
  if (!nume) return;
  let client = (DB.clienti || []).find(c => c && c.nume.toLowerCase() === nume.toLowerCase());
  if (!client) return;

  let esteArhivat = (client.status || '').toLowerCase() === 'arhivat';
  let nouStatus = esteArhivat ? "Activ" : "Arhivat";

  customConfirm(esteArhivat ? "Reactivare" : "Arhivare", 
    esteArhivat ? `Reactivezi clienta ${nume}?` : `Arhivezi clienta ${nume} din liste?`, function() {
    callBackend("seteazaStatusClienta", { nume: nume, statusNou: nouStatus }, function() {
      showToast(esteArhivat ? "✓ Clientă reactivată!" : "✓ Clientă arhivatã!");
      incarcaBazaDateSilencios();
    });
  });
}

function adaugaZile(nrZile) {
  let sel = document.getElementById('selectClientaFisa');
  if (!sel) return;
  let nume = sel.value;
  if (!nume) return;
  callBackend("prelungesteValabilitate", { nume: nume, zile: nrZile, dataManuala: null }, function(res) {
    showToast("✓ Prelungit până la " + res.nouaData);
    incarcaBazaDateSilencios(nume);
  });
}

function seteazaDataManuala() {
  let sel = document.getElementById('selectClientaFisa');
  let inp = document.getElementById('dataPrelungireManuala');
  if (!sel || !inp) return;
  let nume = sel.value;
  let d = inp.value;
  if (!nume || !d) return;
  callBackend("prelungesteValabilitate", { nume: nume, zile: 0, dataManuala: d }, function(res) {
    showToast("✓ Valabilitate setată la " + res.nouaData);
    incarcaBazaDateSilencios(nume);
  });
}

function autoSelecteazaSuma() {
  let tip = document.getElementById('incasareTip').value;
  let selPreset = document.getElementById('selectSumaPreset');
  let customInp = document.getElementById('incasareSumaCustom');
  if (!selPreset) return;

  if (!tip || tip === "") {
    selPreset.value = "";
    if (customInp) customInp.style.display = 'none';
    actualizeazaStilSelect(selPreset);
    return;
  }

  let tipNorm = normalizeazaTipAbonament(tip);
  if (preturiAbonament[tipNorm] !== undefined) {
    selPreset.value = preturiAbonament[tipNorm];
    if (customInp) customInp.style.display = 'none';
  }
  actualizeazaStilSelect(selPreset);
}

function gestioneazaSchimbareSumaPreset() {
  let selPreset = document.getElementById('selectSumaPreset');
  let customInp = document.getElementById('incasareSumaCustom');
  if (!selPreset || !customInp) return;
  if (selPreset.value === 'custom') {
    customInp.style.display = 'block';
    customInp.focus();
  } else {
    customInp.style.display = 'none';
  }
}

function getSumaSelectata() {
  let selPreset = document.getElementById('selectSumaPreset');
  if (!selPreset) return "";
  if (selPreset.value === 'custom') {
    let cInp = document.getElementById('incasareSumaCustom');
    return cInp ? cInp.value.trim() : "";
  }
  return selPreset.value;
}

function filtreazaIstoricIncasariInstant() {
  let fEl = document.getElementById('filtruClientaIncasari');
  let fLuna = document.getElementById('filtruLunaIncasari');
  let filtru = fEl ? fEl.value.toLowerCase() : "";
  let filtruLuna = fLuna ? fLuna.value.trim() : "";
  let tbody = document.getElementById('incasariIstoricTbody');
  if (!tbody) return;

  let filtrate = (DB.incasari || []).filter(i => {
    if (!i) return false;
    let potrivesteClienta = !filtru || (i.clienta && i.clienta.toLowerCase() === filtru);
    let potrivesteLuna = !filtruLuna || (i.luna && i.luna.trim() === filtruLuna);
    return potrivesteClienta && potrivesteLuna;
  });

  filtrate.sort((a, b) => {
    let tA = parseazaDataOraRo(a.data, null);
    let tB = parseazaDataOraRo(b.data, null);
    return tB - tA;
  });

  let totalSuma = 0;
  filtrate.forEach(i => {
    let s = (i.suma || "").toString().replace(/RON/i, "").replace(/\./g, "").replace(/,/g, ".").trim();
    let val = parseFloat(s);
    if (!isNaN(val)) totalSuma += val;
  });

  let elTotalVal = document.getElementById('totalIncasariVal');
  let elTotalCount = document.getElementById('totalIncasariCount');
  if (elTotalVal) elTotalVal.innerText = totalSuma.toLocaleString('ro-RO') + ' RON';
  if (elTotalCount) elTotalCount.innerText = `${filtrate.length} ${filtrate.length === 1 ? 'plată găsită' : 'plăți găsite'}`;

  if (filtrate.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Nici o înregistrare</td></tr>';
    return;
  }

  let html = '';
  filtrate.forEach(item => {
    let esteGol = !item.suma || item.suma === "-" || item.suma.trim() === "";
    let sumaStil = esteGol ? 'color:#94a3b8; font-weight:700;' : 'color:#27ae60; font-weight:700;';
    
    let metodaContinut = (item.metoda && item.metoda.trim() !== "-" && item.metoda.trim() !== "") 
      ? item.metoda 
      : '<span class="dash-placeholder">-</span>';
      
    let tipContinut = (item.tip && item.tip.trim() !== "-" && item.tip.trim() !== "") 
      ? item.tip 
      : '<span class="dash-placeholder">-</span>';

    let itemJson = encodeURIComponent(JSON.stringify(item));

    html += `
      <tr class="incasare-row-clickable" onclick="deschideModalEditareIncasare('${itemJson}')" title="Apasă pentru a edita această plată">
        <td style="font-weight:700;">${item.data}</td>
        <td style="font-weight:700; color:var(--primary);">${item.clienta}</td>
        <td style="${sumaStil}">${item.suma}</td>
        <td class="table-cell-center">${metodaContinut}</td>
        <td>${tipContinut}</td>
        <td style="text-align:center; color:#94a3b8; font-size:0.8rem;">✏️</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function salveazaIncasare() {
  let inp = document.getElementById('incasareNume');
  let nume = inp ? inp.value.trim() : "";
  let tip = document.getElementById('incasareTip').value;
  let suma = getSumaSelectata();
  let metoda = document.getElementById('incasareMetoda').value;
  let dataPlata = document.getElementById('incasareDataPlata').value;
  let dataStart = document.getElementById('incasareDataStart').value;

  if (!nume) {
    showToast("Completează numele clientei!", "error");
    if (inp) inp.focus();
    return;
  }
  if (!tip || tip === "-" || tip === "") {
    showToast("Selectează tipul abonamentului!", "error");
    document.getElementById('incasareTip').focus();
    return;
  }
  if (suma === "" || suma === null || isNaN(Number(suma)) || Number(suma) < 0) {
    showToast("Completează suma plății!", "error");
    let selPreset = document.getElementById('selectSumaPreset');
    if (selPreset && selPreset.value === 'custom') {
      let cInp = document.getElementById('incasareSumaCustom');
      if (cInp) cInp.focus();
    } else if (selPreset) {
      selPreset.focus();
    }
    return;
  }
  if (!metoda || metoda === "-" || metoda === "") {
    showToast("Selectează metoda de plată!", "error");
    document.getElementById('incasareMetoda').focus();
    return;
  }
  if (!dataPlata) {
    showToast("Selectează data plății!", "error");
    document.getElementById('incasareDataPlata').focus();
    return;
  }
  if (!dataStart) {
    showToast("Selectează data de start a abonamentului!", "error");
    document.getElementById('incasareDataStart').focus();
    return;
  }

  callBackend("inregistreazaAbonament", {
    nume: nume, tip: tip, suma: suma, metoda: metoda, dataPlata: dataPlata, dataStart: dataStart
  }, function() {
    showToast("✓ Abonament & Încasare salvate!");
    if (inp) inp.value = '';
    
    let selPreset = document.getElementById('selectSumaPreset');
    if (selPreset) {
      selPreset.value = '';
      actualizeazaStilSelect(selPreset);
    }
    
    let cInp = document.getElementById('incasareSumaCustom');
    if (cInp) {
      cInp.value = '';
      cInp.style.display = 'none';
    }
    
    let selMetoda = document.getElementById('incasareMetoda');
    if (selMetoda) {
      selMetoda.value = '';
      actualizeazaStilSelect(selMetoda);
    }
    
    let selTip = document.getElementById('incasareTip');
    if (selTip) {
      selTip.value = '';
      actualizeazaStilSelect(selTip);
    }
    
    reseteazaDateIncasariAzi();
    incarcaBazaDateSilencios();
  });
}

function deschideModalEditareIncasare(itemEncoded) {
  let item = JSON.parse(decodeURIComponent(itemEncoded));
  if (!item || !item.row) return;

  document.getElementById('editIncRow').value = item.row;
  document.getElementById('editIncClienta').value = item.clienta || "";
  document.getElementById('editIncData').value = item.data || "";
  
  let sCurata = (item.suma || "").replace(/RON/i, "").trim();
  document.getElementById('editIncSuma').value = sCurata;
  
  let selMet = document.getElementById('editIncMetoda');
  if (selMet) selMet.value = (item.metoda && item.metoda !== "-") ? item.metoda : "Revolut";

  let selTip = document.getElementById('editIncTip');
  if (selTip) {
    let tipNormalizat = normalizeazaTipAbonament(item.tip);
    selTip.value = tipNormalizat || "8 sedinte";
  }

  document.getElementById('modalEditareIncasareBackdrop').style.display = 'flex';
}

function inchideModalEditareIncasare() {
  document.getElementById('modalEditareIncasareBackdrop').style.display = 'none';
}

function salveazaModificareIncasare() {
  let row = document.getElementById('editIncRow').value;
  let clienta = document.getElementById('editIncClienta').value.trim();
  let dataStr = document.getElementById('editIncData').value.trim();
  let suma = document.getElementById('editIncSuma').value.trim();
  let metoda = document.getElementById('editIncMetoda').value;
  let tip = document.getElementById('editIncTip').value;

  if (!row) return;
  if (!clienta) {
    showToast("Completează numele clientei!", "error");
    document.getElementById('editIncClienta').focus();
    return;
  }
  if (!dataStr) {
    showToast("Completează data plății!", "error");
    document.getElementById('editIncData').focus();
    return;
  }
  if (suma === "" || suma === null || isNaN(Number(suma)) || Number(suma) < 0) {
    showToast("Completează suma plății!", "error");
    document.getElementById('editIncSuma').focus();
    return;
  }
  if (!metoda || metoda === "-" || metoda === "") {
    showToast("Selectează metoda de plată!", "error");
    document.getElementById('editIncMetoda').focus();
    return;
  }
  if (!tip || tip === "-" || tip === "") {
    showToast("Selectează tipul abonamentului!", "error");
    document.getElementById('editIncTip').focus();
    return;
  }

  callBackend("actualizeazaIncasare", {
    row: Number(row), clienta: clienta, data: dataStr, suma: suma, metoda: metoda, tip: tip
  }, function() {
    showToast("✓ Încasare actualizată!");
    inchideModalEditareIncasare();
    incarcaBazaDateSilencios();
  });
}
