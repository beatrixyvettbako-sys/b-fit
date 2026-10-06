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

function autoScrollLaOraCurenta() {
  let now = new Date();
  let day = now.getDay();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();

  let esteInAfaraProgramuluiWeekend = (day === 5 && currentHour >= 22) || (day === 6) || (day === 0);
  if (esteInAfaraProgramuluiWeekend) return;

  let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
  if (!esteSaptamanaActiva() || ziCurentaCheie !== zileChei[day]) {
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

  hourBlocks.forEach(block => {
    let oraText = block.getAttribute('data-ora');
    if (!oraText || oraText.indexOf(':') === -1) return;
    let parts = oraText.split(':');
    let blockMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    let diff = Math.abs(currentTimeInMinutes - blockMinutes);

    if (diff < minDiff) {
      minDiff = diff;
      closestBlock = block;
    }
  });

  if (closestBlock) {
    if (currentHour <= 8) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      let headerEl = document.querySelector('header');
      let daySelector = document.getElementById('dayButtonsContainer');
      let topOffset = (headerEl ? headerEl.offsetHeight : 50) + (daySelector ? daySelector.offsetHeight : 45) + 6;
      
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
      let hOffset = headerEl ? headerEl.offsetHeight : 50;
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
      let hOffset = (headerEl ? headerEl.offsetHeight : 50) + (daySelector ? daySelector.offsetHeight : 45);
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
      let hOffset = headerEl ? headerEl.offsetHeight : 50;
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - 12)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

window.onload = function() {
  reseteazaDateIncasariAzi();

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

  setTimeout(() => {
    autoScrollLaOraCurenta();
  }, 50);

  incarcaBazaDateSilencios(null, true);
};

function incarcaBazaDateSilencios(clientaSelectataDupaActualizare = null, estePrimaIncarcare = false) {
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

    if (estePrimaIncarcare) {
      setTimeout(() => {
        autoScrollLaOraCurenta();
      }, 50);
    }
  });
}

function comutaExpandareBaraCalendar() {
  let card = document.getElementById('calendarExpandableCard');
  if (card) {
    card.classList.toggle('is-expanded');
  }
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
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
  let target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  if (typeof tabIdx === 'number') {
    animaPilaMercur(tabIdx);
  }
  
  let wrapper = document.getElementById('pageTitleWrapper');
  if (wrapper) {
    let iconHtml = '';
    if (tipTab === 'orar') {
      iconHtml = `
        <svg viewBox="0 0 24 24" style="width:22px; height:22px; stroke:#fff; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <text x="12" y="15" font-size="5.5" font-weight="900" font-family="-apple-system, sans-serif" text-anchor="middle" fill="#fff" stroke="none">21</text>
          <text x="12" y="19.5" font-size="4" font-weight="900" font-family="-apple-system, sans-serif" text-anchor="middle" fill="#fff" stroke="none">DEC</text>
        </svg>
      `;
    } else if (tipTab === 'prog') {
      iconHtml = `
        <svg viewBox="0 0 24 24" style="width:22px; height:22px; stroke:#fff; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      `;
    } else if (tipTab === 'fisa') {
      iconHtml = `
        <svg viewBox="0 0 24 24" style="width:22px; height:22px; stroke:#fff; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;">
          <rect x="3" y="3" width="18" height="18" rx="3"></rect>
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M7 17c0-2 2.5-3 5-3s5 1 5 3"></path>
        </svg>
      `;
    } else if (tipTab === 'incasari') {
      reseteazaDateIncasariAzi();
      iconHtml = `
        <svg viewBox="0 0 24 24" style="width:22px; height:22px; stroke:#fff; fill:none; stroke-width:2;">
          <rect x="2" y="5" width="20" height="14" rx="3"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
          <circle cx="14" cy="15" r="1.8" fill="#fff" stroke="none"></circle>
          <circle cx="17" cy="15" r="1.8" fill="#fff" stroke="none" opacity="0.6"></circle>
        </svg>
      `;
    }
    wrapper.innerHTML = `${iconHtml}<span id="pageTitle">${titlu}</span>`;
  }

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
      container.innerHTML = '<div style="color:var(--text-muted); padding:24px; text-align:center;">Nici o prezență înregistrată în această
