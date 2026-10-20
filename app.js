const API_URL = "https://script.google.com/macros/s/AKfycbwN9ez1NjA32MnfUZGLcLjdWjsi9h4qilDBmjBVjm3lUhwU0Z2jMuta6p-NP9lmnG9H/exec";
const ESTE_APPS_SCRIPT = (typeof google !== 'undefined' && google.script && typeof google.script.run !== 'undefined');

// --- CONFIGURARE SUPABASE ---
const SUPABASE_URL = "https://qfnhluyczxugyqkbyvmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_rikiPkqUDuSPVYdZyGR4Vw_ed371Huz";
let USE_SUPABASE = true;
const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Dezactivăm restaurarea nativă automată a scroll-ului la refresh pentru a permite calibrarea exactă
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

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
const tabsOrder = [
  { id: 'tabOrar', titleRo: 'Orar Săptămânal', titleEn: 'Weekly Schedule', tip: 'orar', idx: 0 },
  { id: 'tabProgramari', titleRo: 'Programări', titleEn: 'Bookings', tip: 'prog', idx: 1 },
  { id: 'tabFisa', titleRo: 'Fișă Clientă', titleEn: 'Client Profile', tip: 'fisa', idx: 2 },
  { id: 'tabIncasari', titleRo: 'Încasări', titleEn: 'Payments', tip: 'incasari', idx: 3 }
];

// DICȚIONAR BILINGV (I18N)
const i18n = {
  ro: {
    appTitle: "Orar Săptămânal",
    navOrar: "Orar",
    navProg: "Programări",
    navFisa: "Fișă",
    navIncasari: "Încasări",
    pastWeek: "Săpt. Trecută",
    today: "Azi",
    nextWeek: "Săpt. Viitoare",
    pastWeekState: "Istoric (Săptămână trecută)",
    futureWeekState: "Planificat (Săptămână viitoare)",
    endScheduleTitle: "Ziua-i gata, caloriile-s topite!",
    endScheduleSubtitle: "Antrenorul a supraviețuit și azi!",
    addExtraHour: "➕ Adaugă oră suplimentară",
    addBtn: "+ Adaugă",
    historyOrarTitle: "Istoric Prezențe Orar",
    filterClient: "Filtrează după clientă:",
    filterMonth: "Filtrează după lună:",
    allClients: "Toate clientele",
    allMonths: "Toate lunile",
    noPresence: "Nici o prezență înregistrată în această zi din trecut.",
    noPresenceFound: "Nici o prezență găsită.",
    addClientPlaceholder: "+ Adaugă clientă",
    activeSection: "Activ",
    holdSection: "Hold",
    noRecords: "Nici o înregistrare",
    noClientsHold: "Nici o clientă în Hold",
    addNewClientTitle: "➕ Adaugă o Clientă Nouă în Aplicație",
    clientNamePlaceholder: "Nume și Prenume clientă",
    saveClientBtn: "Salvează Clienta",
    selectClientLabel: "SELECTEAZĂ CLIENTA",
    showArchived: "Arată și arhivate",
    selectClientOption: "Alege sau tastează clientă...",
    emptyStateTitle: "Nici o clientă selectată",
    emptyStateDesc: "Alege o clientă din lista de mai sus pentru a-i vizualiza progresul, abonamentul și istoricul.",
    sessionsRemaining: "ȘEDINȚE RĂMASE",
    statusLabel: "STATUS",
    validityLabel: "VALABILITATE PÂNĂ LA",
    sessionsDone: "ȘEDINȚE EFECTUATE",
    editClientTitle: "✏ Editează / Ajustează Datele Clientei",
    renameClientLabel: "Nume Clientă (Redenumește peste tot)",
    subTypeLabel: "Tip Abonament",
    startDateLabel: "Dată Start",
    expDateLabel: "Dată Expirare",
    includedLabel: "Incluse",
    doneLabel: "Efectuate",
    remainingLabel: "Rămase",
    saveChangesBtn: "Salvează Modificările",
    extendValidityTitle: "⏱ Prelungește Valabilitate Abonament",
    setBtn: "Setează",
    archiveBtn: "📦 Arhivează / Ascunde din Liste",
    reactivateBtn: "♻ Reactivează Clienta (Arată în Liste)",
    recentHistoryTitle: "Istoric Prezențe Recente",
    noPresenceYet: "Nici o prezență înregistrată încă.",
    newPaymentTitle: "Înregistrare Plată Nouă",
    clientNameIncPlaceholder: "Alege din listă sau scrie nume nou",
    selectSubPlaceholder: "Alege tip abonament",
    sumLabel: "Sumă (RON)",
    sumPresetPlaceholder: "Suma",
    otherSum: "Altă sumă...",
    paymentMethodLabel: "Metodă Plată",
    paymentMethodPlaceholder: "Metoda Plata",
    payDateLabel: "Dată Plată",
    payStartLabel: "Dată Start",
    paySubmitBtn: "Încasează & Salvează Abonamentul",
    paySavingBtn: "Se salvează...",
    paymentHistoryTitle: "Istoric Încasări",
    totalPaymentsLabel: "Total Încasări",
    paymentsFound: "plăți găsite",
    paymentFound: "plată găsită",
    themeTitle: "Temă",
    lightTheme: "Luminos",
    darkTheme: "Întunecat",
    systemTheme: "Sistem",
    langTitle: "Limbă / Language",
    toastThemeUpdated: "✓ Temă actualizată!",
    toastLangRo: "✓ Limbă setată pe Română",
    toastLangEn: "✓ Language set to English",
    toastAlreadyCurrent: "Ești deja în săptămâna curentă!",
    toastBackCurrent: "✓ Ai revenit la săptămâna curentă!",
    toastWorkoutSaved: "✓ Antrenament salvat!",
    toastPresenceMarked: "✓ Prezență marcată & ședință scăzută!",
    toastSlotFreed: "✓ Slot eliberat!",
    toastHourAdded: "✓ Oră adăugată: ",
    toastAddedProg: "✓ Adăugată în programări!",
    toastMovedHold: "✓ Mutată în Hold!",
    toastDeletedRecord: "✓ Înregistrare ștearsă!",
    toastDataUpdated: "✓ Date actualizate!",
    toastClientAdded: "✓ Clientă adăugată!",
    toastReactivated: "✓ Clientă reactivată!",
    toastArchived: "✓ Clientă arhivată!",
    toastExtended: "✓ Prelungit până la ",
    toastValiditySet: "✓ Valabilitate setată la ",
    toastSubSaved: "✓ Abonament & Încasare salvate!",
    toastPaymentUpdated: "✓ Încasare actualizată!",
    confirmTitle: "Confirmare",
    cancelBtn: "Renunță",
    confirmBtn: "Confirmă",
    editPaymentTitle: "✏️ Editare Încasare",
    saveBtn: "Salvează"
  },
  en: {
    appTitle: "Weekly Schedule",
    navOrar: "Schedule",
    navProg: "Bookings",
    navFisa: "Profile",
    navIncasari: "Payments",
    pastWeek: "Past Week",
    today: "Today",
    nextWeek: "Next Week",
    pastWeekState: "History (Past week)",
    futureWeekState: "Planned (Next week)",
    endScheduleTitle: "Day is done, calories burned!",
    endScheduleSubtitle: "The coach survived today too!",
    addExtraHour: "➕ Add extra hour",
    addBtn: "+ Add",
    historyOrarTitle: "Schedule Attendance History",
    filterClient: "Filter by client:",
    filterMonth: "Filter by month:",
    allClients: "All clients",
    allMonths: "All months",
    noPresence: "No attendance recorded on this past day.",
    noPresenceFound: "No attendance found.",
    addClientPlaceholder: "+ Add client",
    activeSection: "Active",
    holdSection: "Hold",
    noRecords: "No records",
    noClientsHold: "No clients in Hold",
    addNewClientTitle: "➕ Add New Client to App",
    clientNamePlaceholder: "Client Full Name",
    saveClientBtn: "Save Client",
    selectClientLabel: "SELECT CLIENT",
    showArchived: "Show archived",
    selectClientOption: "Choose or type client...",
    emptyStateTitle: "No client selected",
    emptyStateDesc: "Choose a client from the list above to view their progress, subscription, and history.",
    sessionsRemaining: "SESSIONS LEFT",
    statusLabel: "STATUS",
    validityLabel: "VALID UNTIL",
    sessionsDone: "SESSIONS DONE",
    editClientTitle: "✏ Edit / Adjust Client Data",
    renameClientLabel: "Client Name (Rename everywhere)",
    subTypeLabel: "Subscription Type",
    startDateLabel: "Start Date",
    expDateLabel: "Expiration Date",
    includedLabel: "Included",
    doneLabel: "Done",
    remainingLabel: "Left",
    saveChangesBtn: "Save Changes",
    extendValidityTitle: "⏱ Extend Subscription Validity",
    setBtn: "Set",
    archiveBtn: "📦 Archive / Hide from lists",
    reactivateBtn: "♻ Reactivate Client (Show in lists)",
    recentHistoryTitle: "Recent Attendance History",
    noPresenceYet: "No attendance recorded yet.",
    newPaymentTitle: "Register New Payment",
    clientNameIncPlaceholder: "Choose from list or type new name",
    selectSubPlaceholder: "Choose subscription type",
    sumLabel: "Amount (RON)",
    sumPresetPlaceholder: "Amount",
    otherSum: "Other amount...",
    paymentMethodLabel: "Payment Method",
    paymentMethodPlaceholder: "Payment Method",
    payDateLabel: "Payment Date",
    payStartLabel: "Start Date",
    paySubmitBtn: "Charge & Save Subscription",
    paySavingBtn: "Saving...",
    paymentHistoryTitle: "Payment History",
    totalPaymentsLabel: "Total Payments",
    paymentsFound: "payments found",
    paymentFound: "payment found",
    themeTitle: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    systemTheme: "System",
    langTitle: "Language / Limbă",
    toastThemeUpdated: "✓ Theme updated!",
    toastLangRo: "✓ Limbă setată pe Română",
    toastLangEn: "✓ Language set to English",
    toastAlreadyCurrent: "You are already in the current week!",
    toastBackCurrent: "✓ Returned to current week!",
    toastWorkoutSaved: "✓ Workout saved!",
    toastPresenceMarked: "✓ Attendance marked & session deducted!",
    toastSlotFreed: "✓ Slot freed!",
    toastHourAdded: "✓ Hour added: ",
    toastAddedProg: "✓ Added to bookings!",
    toastMovedHold: "✓ Moved to Hold!",
    toastDeletedRecord: "✓ Record deleted!",
    toastDataUpdated: "✓ Data updated!",
    toastClientAdded: "✓ Client added!",
    toastReactivated: "✓ Client reactivated!",
    toastArchived: "✓ Client archived!",
    toastExtended: "✓ Extended until ",
    toastValiditySet: "✓ Validity set to ",
    toastSubSaved: "✓ Subscription & Payment saved!",
    toastPaymentUpdated: "✓ Payment updated!",
    confirmTitle: "Confirmation",
    cancelBtn: "Cancel",
    confirmBtn: "Confirm",
    editPaymentTitle: "✏️ Edit Payment",
    saveBtn: "Save"
  }
};

let currentLang = localStorage.getItem('beatrix_lang') || 'ro';

function t(key) {
  if (i18n[currentLang] && i18n[currentLang][key] !== undefined) {
    return i18n[currentLang][key];
  }
  return i18n['ro'][key] || key;
}

function normalizeazaOraUi(oraStr) {
  if (!oraStr) return "";
  let s = oraStr.toString().trim();
  if (s.indexOf(":") !== -1 && s.length > 5) {
    let m = s.match(/(\d{1,2}:\d{2})/);
    if (m) s = m[1];
  }
  if (s.length === 4 && s.indexOf(":") === 1) {
    s = "0" + s;
  }
  return s;
}

function normalizeazaTipAbonament(tip) {
  if (!tip || typeof tip !== 'string') return "";
  let curat = tip.trim().toLowerCase();
  curat = curat.replace(/ș/g, 's').replace(/ş/g, 's').replace(/ț/g, 't').replace(/ţ/g, 't');
  curat = curat.replace(/\s+/g, ' ');

  if (curat.indexOf("gratuit") !== -1 || curat.indexOf("free") !== -1) return "sedinta gratuita";
  if (curat.indexOf("trainers") !== -1 || curat.indexOf("18") !== -1) return "18 trainers (12)";
  if (curat.indexOf("16") !== -1 && (curat.indexOf("1:1") !== -1 || curat.indexOf("1 la 1") !== -1)) return "16 sedinte 1:1";
  if (curat.indexOf("16") !== -1) return "16 sedinte";
  if (curat.indexOf("12") !== -1) return "12 sedinte";
  if (curat.indexOf("10") !== -1) return "10 sedinte";
  if (curat.indexOf("8") !== -1) return "8 sedinte";
  if (curat.indexOf("individual") !== -1 || curat.indexOf("1 sedint") !== -1) return "sedinta individuala";

  return tip.trim();
}

function gasesteClientaValida(numeIntrodus) {
  if (!numeIntrodus || typeof numeIntrodus !== 'string') return null;
  let curat = numeIntrodus.trim().toLowerCase();
  if (!curat) return null;
  return (DB.clienti || []).find(c => {
    if (!c || !c.nume) return false;
    let esteArhivat = (c.status || '').toLowerCase() === 'arhivat' || (c.status || '').toLowerCase() === 'archived';
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
  "18 trainers (12)": "400",
  "8 sedinte": "450", "10 sedinte": "520", "12 sedinte": "600",
  "16 sedinte": "750", "16 sedinte 1:1": "900", "sedinta individuala": "70", "sedinta gratuita": "0"
};

function esteSaptamanaActiva() {
  return dataReferintaLuni.getTime() === dataReferintaLuniBaza.getTime();
}

function esteSaptamanaTrecuta() {
  return dataReferintaLuni.getTime() < dataReferintaLuniBaza.getTime();
}

function getSaptamanaCheie() {
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

// --- UTILITARE FORMATE DATE RO & SUPABASE ---
function formateazaDataRoLocal(d) {
  if (!d) return "-";
  if (d instanceof Date) {
    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0');
    let yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }
  let dStr = d.toString().trim();
  if (dStr.indexOf("-") !== -1) {
    let p = dStr.split("-");
    if (p.length === 3 && p[0].length === 4) return `${p[2]}.${p[1]}.${p[0]}`;
  }
  return dStr;
}

function construiesteTagZiLocal(saptamanaCheie, zi) {
  let ziCurata = zi ? zi.toString().trim() : "";
  if (!saptamanaCheie || saptamanaCheie.trim() === "") return ziCurata;
  let sCheie = saptamanaCheie.trim();
  if (ziCurata.indexOf("W_") === 0) return ziCurata;
  return sCheie + "_" + ziCurata;
}

function getNrSedinteAbonamentLocal(tip) {
  let t = (tip || "").toLowerCase();
  if (t.indexOf("gratuit") !== -1) return 0;
  if (t.indexOf("trainers") !== -1 || t.indexOf("18") !== -1) return 12;
  if (t.indexOf("16") !== -1) return 16;
  if (t.indexOf("12") !== -1) return 12;
  if (t.indexOf("10") !== -1) return 10;
  if (t.indexOf("8") !== -1) return 8;
  if (t.indexOf("individual") !== -1 || t.indexOf("1") !== -1) return 1;
  return 8;
}

// --- MIGRARE AUTOMATĂ DIN GOOGLE SHEETS ÎN SUPABASE ---
async function migreazaDateDinGoogleSheetsInSupabase() {
  if (!supabaseClient) return;
  try {
    showToast("⏳ Se sincronizează datele din Google Sheets în Supabase...");
    const resp = await fetch(API_URL + "?action=getTotBazaDeDate");
    const gsData = await resp.json();
    if (!gsData || !Array.isArray(gsData.clienti)) return;

    // 1. Cliente
    if (gsData.clienti.length > 0) {
      const rowsCliente = gsData.clienti.map((c, idx) => ({
        id: c.id || ("cli_" + (idx + 1)),
        nume: c.nume,
        tipAbonament: c.tipAbonament || "-",
        incluse: Number(c.incluse) || 0,
        efectuate: Number(c.efectuate) || 0,
        ramase: Number(c.ramase) || 0,
        dataStart: c.dataStart || "-",
        dataExpirare: c.dataExpirare || "-",
        status: c.status || "Activ"
      }));
      await supabaseClient.from('cliente').insert(rowsCliente);
    }

    // 2. Orar
    if (Array.isArray(gsData.orarSloturi) && gsData.orarSloturi.length > 0) {
      const rowsOrar = gsData.orarSloturi.map(o => ({
        ziRaw: o.ziRaw || "",
        ora: normalizeazaOraUi(o.ora),
        clienta: o.clienta || "",
        antrenament: o.antrenament || "",
        blocat: !!o.blocat,
        bifat: !!o.bifat,
        slotIndex: Number(o.slotIndex) || 0
      }));
      await supabaseClient.from('orar').insert(rowsOrar);
    }

    // 3. Programari (Activ + Hold)
    const rowsProg = [];
    (gsData.progActive || []).forEach(p => {
      rowsProg.push({ sectiune: 'Activ', nume: p.nume, prezenta: p.prezenta || '', mentiuni: p.mentiuni || '' });
    });
    (gsData.progHold || []).forEach(p => {
      rowsProg.push({ sectiune: 'Hold', nume: p.nume, prezenta: p.prezenta || '', mentiuni: p.mentiuni || '' });
    });
    if (rowsProg.length > 0) {
      await supabaseClient.from('programari').insert(rowsProg);
    }

    // 4. Încasări (înversăm ca să păstrăm ordinea cronologică la inserare)
    if (Array.isArray(gsData.incasari) && gsData.incasari.length > 0) {
      const rowsInc = [...gsData.incasari].reverse().map(i => ({
        data: i.data || "-",
        clienta: i.clienta || "",
        suma: (i.suma || "").toString().replace(/RON/i, "").trim() || "-",
        metoda: i.metoda || "-",
        tip: i.tip || "-",
        luna: i.luna || "-"
      }));
      await supabaseClient.from('incasari').insert(rowsInc);
    }

    // 5. Prezențe
    if (Array.isArray(gsData.prezente) && gsData.prezente.length > 0) {
      const rowsPrez = [...gsData.prezente].reverse().map(p => ({
        data: p.data || "-",
        zi: p.zi || "",
        ora: normalizeazaOraUi(p.ora),
        clienta: p.clienta || "",
        antrenament: p.antrenament || "-"
      }));
      await supabaseClient.from('prezente').insert(rowsPrez);
    }

    showToast("✓ Migrare în Supabase completă!");
    incarcaBazaDateSilencios(null, true);
  } catch (err) {
    console.error("Eroare migrare Supabase:", err);
  }
}

async function executaActiuneSupabase(actionName, payload) {
  const sb = supabaseClient;

  const gasesteIdDupaNume = async (nume) => {
    if (!nume || !nume.trim()) return "";
    const { data } = await sb.from('cliente').select('id, row').ilike('nume', nume.trim()).limit(1);
    if (data && data.length > 0) return data[0].id || ("cli_" + data[0].row);
    return "";
  };

  const gasesteSauCreeazaSlotSupabase = async (saptamanaCheie, zi, ora, slotIndex, rowPropus) => {
    const tagZi = construiesteTagZiLocal(saptamanaCheie, zi);
    const oraNorm = normalizeazaOraUi(ora);
    const slotIdx = (typeof slotIndex === "number") ? slotIndex : 0;

    if (rowPropus) {
      const { data: ex } = await sb.from('orar').select('*').eq('row', rowPropus).maybeSingle();
      if (ex) {
        const zEx = (ex.ziRaw || "").trim();
        const oEx = normalizeazaOraUi(ex.ora);
        const sEx = Number(ex.slotIndex) || 0;
        if ((zEx === tagZi || (zi === "Marti" && zEx === (saptamanaCheie + "_Marți"))) && oEx === oraNorm && sEx === slotIdx) {
          return ex;
        }
      }
    }

    const { data: list } = await sb.from('orar')
      .select('*')
      .in('ziRaw', zi === "Marti" ? [tagZi, saptamanaCheie + "_Marți"] : [tagZi])
      .eq('ora', oraNorm)
      .eq('slotIndex', slotIdx)
      .limit(1);

    if (list && list.length > 0) return list[0];

    const { data: creat } = await sb.from('orar')
      .insert([{ ziRaw: tagZi, ora: oraNorm, clienta: "", antrenament: "", blocat: false, bifat: false, slotIndex: slotIdx, client_id: "" }])
      .select()
      .single();
    return creat;
  };

  if (actionName === "getTotBazaDeDate") {
    const [resCli, resOrar, resProg, resInc, resPrez] = await Promise.all([
      sb.from('cliente').select('*'),
      sb.from('orar').select('*').order('row', { ascending: true }),
      sb.from('programari').select('*').order('row', { ascending: true }),
      sb.from('incasari').select('*').order('row', { ascending: false }),
      sb.from('prezente').select('*').order('row', { ascending: false })
    ]);

    const clienti = (resCli.data || []).map(c => ({
      row: c.row,
      nume: (c.nume || "").trim(),
      tipAbonament: c.tipAbonament || "-",
      incluse: Number(c.incluse) || 0,
      efectuate: Number(c.efectuate) || 0,
      ramase: Number(c.ramase) || 0,
      dataStart: c.dataStart || "-",
      dataExpirare: c.dataExpirare || "-",
      status: c.status || "Activ",
      id: c.id || ("cli_" + c.row)
    })).filter(c => c.nume !== "");

    clienti.sort((a, b) => a.nume.localeCompare(b.nume));

    // Dacă baza Supabase e complet goală la primul start, migrăm automat din Google Sheets
    if (clienti.length === 0 && (resOrar.data || []).length === 0 && !localStorage.getItem('BFIT_SUPABASE_MIGRATED')) {
      localStorage.setItem('BFIT_SUPABASE_MIGRATED', '1');
      await migreazaDateDinGoogleSheetsInSupabase();
      return executaActiuneSupabase("getTotBazaDeDate", {});
    }

    const orarSloturi = (resOrar.data || []).map(o => ({
      row: o.row,
      ziRaw: (o.ziRaw || "").trim(),
      ora: normalizeazaOraUi(o.ora),
      clienta: (o.clienta || "").trim(),
      antrenament: (o.antrenament || "").trim(),
      blocat: !!o.blocat,
      bifat: !!o.bifat,
      slotIndex: Number(o.slotIndex) || 0
    }));

    const progActive = [];
    const progHold = [];
    (resProg.data || []).forEach(p => {
      const prNume = (p.nume || "").trim();
      if (!prNume) return;
      const item = {
        row: p.row,
        nume: prNume,
        prezenta: (p.prezenta || "").trim(),
        mentiuni: (p.mentiuni || "").trim()
      };
      if ((p.sectiune || "").trim() === "Hold") progHold.push(item);
      else progActive.push(item);
    });

    const incasari = (resInc.data || []).map(i => {
      const cl = (i.clienta || "").trim();
      const sVal = (i.suma || "").toString().trim();
      return {
        row: i.row,
        data: i.data || "-",
        clienta: cl,
        suma: sVal && sVal !== "-" ? (sVal.indexOf("RON") !== -1 ? sVal : sVal + " RON") : "-",
        metoda: i.metoda || "-",
        tip: i.tip || "-",
        luna: i.luna || "-"
      };
    }).filter(i => i.clienta !== "");

    const prezente = (resPrez.data || []).map(p => ({
      row: p.row,
      data: p.data || "-",
      zi: p.zi || "",
      ora: normalizeazaOraUi(p.ora),
      clienta: (p.clienta || "").trim(),
      antrenament: p.antrenament || "-"
    })).filter(p => p.clienta !== "");

    return { clienti, orarSloturi, progActive, progHold, incasari, prezente };
  }

  if (actionName === "salveazaSlotAuto") {
    const slot = await gasesteSauCreeazaSlotSupabase(payload.saptamanaCheie, payload.zi, payload.ora, payload.slotIndex, payload.row);
    const idCli = await gasesteIdDupaNume(payload.clienta);
    await sb.from('orar').update({
      clienta: payload.clienta || "",
      antrenament: payload.antrenament || "",
      client_id: idCli
    }).eq('row', slot.row);
    return { success: true, row: slot.row };
  }

  if (actionName === "bifeazaPrezenta") {
    const slot = await gasesteSauCreeazaSlotSupabase(payload.saptamanaCheie, payload.zi, payload.ora, payload.slotIndex, payload.row);
    const oraNorm = normalizeazaOraUi(payload.ora);
    const idCli = await gasesteIdDupaNume(payload.clienta);

    await sb.from('orar').update({
      clienta: payload.clienta || "",
      antrenament: payload.antrenament || "",
      bifat: true,
      client_id: idCli
    }).eq('row', slot.row);

    if (payload.clienta && payload.clienta.trim() !== "") {
      const { data: exPrez } = await sb.from('prezente')
        .select('*')
        .eq('data', payload.dataCalendar)
        .eq('ora', oraNorm)
        .ilike('clienta', payload.clienta.trim())
        .limit(1);

      if (exPrez && exPrez.length > 0) {
        await sb.from('prezente').update({ antrenament: payload.antrenament || "", client_id: idCli }).eq('row', exPrez[0].row);
      } else {
        await sb.from('prezente').insert([{
          data: payload.dataCalendar,
          zi: payload.zi,
          ora: oraNorm,
          clienta: payload.clienta.trim(),
          antrenament: payload.antrenament || "",
          client_id: idCli
        }]);
      }

      const esteGratuita = (payload.antrenament || "").toLowerCase().indexOf("gratuit") !== -1;
      if (!esteGratuita) {
        const { data: clList } = await sb.from('cliente').select('*').ilike('nume', payload.clienta.trim()).limit(1);
        if (clList && clList.length > 0) {
          const cl = clList[0];
          if ((cl.tipAbonament || "").toLowerCase().indexOf("gratuit") === -1) {
            const incluse = Number(cl.incluse) || 0;
            const efectuate = (Number(cl.efectuate) || 0) + 1;
            const ramase = Math.max(0, incluse - efectuate);
            const upd = { efectuate, ramase };
            if (ramase === 0 && incluse > 0) upd.status = "Finalizat";
            await sb.from('cliente').update(upd).eq('row', cl.row);
          }
        }
      }
    }
    return { success: true, row: slot.row };
  }

  if (actionName === "anuleazaSlot") {
    const slot = await gasesteSauCreeazaSlotSupabase(payload.saptamanaCheie, payload.zi, payload.ora, payload.slotIndex, payload.row);
    const clientaVeche = (slot.clienta || "").trim();
    const antrenamentVechi = slot.antrenament || "";
    const aFostBifat = !!slot.bifat;
    const oraNorm = normalizeazaOraUi(payload.ora);

    await sb.from('orar').update({
      clienta: "",
      antrenament: "",
      bifat: false,
      client_id: ""
    }).eq('row', slot.row);

    if (clientaVeche !== "" && aFostBifat) {
      const { data: pList } = await sb.from('prezente')
        .select('row')
        .eq('data', payload.dataCalendar)
        .eq('ora', oraNorm)
        .ilike('clienta', clientaVeche)
        .limit(1);

      if (pList && pList.length > 0) {
        await sb.from('prezente').delete().eq('row', pList[0].row);
      }

      const esteGratuita = antrenamentVechi.toLowerCase().indexOf("gratuit") !== -1;
      if (!esteGratuita) {
        const { data: clList } = await sb.from('cliente').select('*').ilike('nume', clientaVeche).limit(1);
        if (clList && clList.length > 0) {
          const cl = clList[0];
          const incluse = Number(cl.incluse) || 0;
          const efectuate = Math.max(0, (Number(cl.efectuate) || 0) - 1);
          const ramase = Math.max(0, incluse - efectuate);
          await sb.from('cliente').update({ efectuate, ramase, status: "Activ" }).eq('row', cl.row);
        }
      }
    }
    return { success: true, row: slot.row };
  }

  if (actionName === "comutaBlocareOra") {
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    const oraNorm = normalizeazaOraUi(payload.ora);
    const { data: gasite } = await sb.from('orar')
      .select('row')
      .in('ziRaw', payload.zi === "Marti" ? [tagZi, payload.saptamanaCheie + "_Marți"] : [tagZi])
      .eq('ora', oraNorm);

    if (gasite && gasite.length > 0) {
      const ids = gasite.map(g => g.row);
      await sb.from('orar').update({ blocat: !!payload.blocat }).in('row', ids);
    } else {
      const noi = [0, 1, 2].map(idx => ({
        ziRaw: tagZi, ora: oraNorm, clienta: "", antrenament: "", blocat: !!payload.blocat, bifat: false, slotIndex: idx, client_id: ""
      }));
      await sb.from('orar').insert(noi);
    }
    return { success: true };
  }

  if (actionName === "adaugaOraCustom") {
    const oraNorm = normalizeazaOraUi(payload.ora);
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    const noi = [0, 1, 2].map(idx => ({
      ziRaw: tagZi, ora: oraNorm, clienta: "", antrenament: "", blocat: false, bifat: false, slotIndex: idx, client_id: ""
    }));
    await sb.from('orar').insert(noi);
    return { success: true, ora: oraNorm };
  }

  if (actionName === "inregistreazaAbonament") {
    const dPlata = payload.dataPlata ? new Date(payload.dataPlata) : new Date();
    const dStart = payload.dataStart ? new Date(payload.dataStart) : new Date(dPlata.getTime());
    const dExp = new Date(dStart.getTime());
    dExp.setDate(dExp.getDate() + 30);

    const totalSedinte = getNrSedinteAbonamentLocal(payload.tip);
    const dataPlataRo = formateazaDataRoLocal(dPlata);
    const dataStartRo = formateazaDataRoLocal(dStart);
    const dataExpRo = formateazaDataRoLocal(dExp);
    const luniRoNume = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
    const lunaNume = luniRoNume[dPlata.getMonth()];

    const { data: exCli } = await sb.from('cliente').select('*').ilike('nume', payload.nume.trim()).limit(1);
    let idCli = "";

    if (!exCli || exCli.length === 0) {
      const { data: ins } = await sb.from('cliente').insert([{
        nume: payload.nume.trim(),
        tipAbonament: payload.tip,
        incluse: totalSedinte,
        efectuate: 0,
        ramase: totalSedinte,
        dataStart: dataStartRo,
        dataExpirare: dataExpRo,
        status: "Activ"
      }]).select().single();
      idCli = ins ? ("cli_" + ins.row) : "";
      if (ins) await sb.from('cliente').update({ id: idCli }).eq('row', ins.row);
    } else {
      idCli = exCli[0].id || ("cli_" + exCli[0].row);
      await sb.from('cliente').update({
        tipAbonament: payload.tip,
        incluse: totalSedinte,
        efectuate: 0,
        ramase: totalSedinte,
        dataStart: dataStartRo,
        dataExpirare: dataExpRo,
        status: "Activ"
      }).eq('row', exCli[0].row);
    }

    await sb.from('incasari').insert([{
      data: dataPlataRo,
      clienta: payload.nume.trim(),
      suma: (payload.suma || "").toString(),
      metoda: payload.metoda || "",
      tip: payload.tip || "",
      luna: lunaNume,
      client_id: idCli
    }]);

    return { success: true };
  }

  if (actionName === "actualizeazaIncasare") {
    let dObj = null;
    if (payload.data && payload.data.indexOf("-") !== -1) {
      dObj = new Date(payload.data);
    } else if (payload.data && payload.data.indexOf(".") !== -1) {
      let p = payload.data.split(".");
      if (p.length === 3) dObj = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    }
    if (!dObj || isNaN(dObj.getTime())) dObj = new Date();

    const dataRo = formateazaDataRoLocal(dObj);
    const luniRoNume = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
    const lunaNume = luniRoNume[dObj.getMonth()];
    const sumaCurata = payload.suma ? payload.suma.toString().replace(/RON/i, "").trim() : "";
    const idCli = await gasesteIdDupaNume(payload.clienta);

    await sb.from('incasari').update({
      data: dataRo,
      clienta: payload.clienta || "",
      suma: sumaCurata,
      metoda: payload.metoda || "",
      tip: payload.tip || "",
      luna: lunaNume,
      client_id: idCli
    }).eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "actualizeazaCampProgramare") {
    const upd = {};
    if (payload.col === 3) upd.prezenta = payload.val;
    else if (payload.col === 4) upd.mentiuni = payload.val;
    await sb.from('programari').update(upd).eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "adaugaRandProgramare") {
    const valPrezenta = payload.esteHold ? "" : (payload.prezenta || "In asteptare");
    const idCli = await gasesteIdDupaNume(payload.nume);
    await sb.from('programari').insert([{
      sectiune: payload.esteHold ? "Hold" : "Activ",
      nume: payload.nume,
      prezenta: valPrezenta,
      mentiuni: payload.mentiuni || "",
      client_id: idCli
    }]);
    return { success: true };
  }

  if (actionName === "mutaInHold") {
    await sb.from('programari').update({ sectiune: "Hold", prezenta: "" }).eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "stergeRandProgramare") {
    await sb.from('programari').delete().eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "actualizeazaDateClienta") {
    const numeVechi = (payload.numeVechi || "").trim();
    const numeNou = (payload.numeNou && payload.numeNou.trim() !== "") ? payload.numeNou.trim() : numeVechi;
    const { data: ex } = await sb.from('cliente').select('*').ilike('nume', numeVechi).limit(1);
    if (ex && ex.length > 0) {
      await sb.from('cliente').update({
        nume: numeNou,
        tipAbonament: payload.tip,
        incluse: Number(payload.incluse) || 0,
        efectuate: Number(payload.efectuate) || 0,
        ramase: Number(payload.ramase) || 0,
        dataStart: payload.dataStart,
        dataExpirare: payload.dataExp,
        status: payload.status
      }).eq('row', ex[0].row);

      if (numeVechi.toLowerCase() !== numeNou.toLowerCase()) {
        await sb.from('orar').update({ clienta: numeNou }).ilike('clienta', numeVechi);
        await sb.from('prezente').update({ clienta: numeNou }).ilike('clienta', numeVechi);
      }
      return { success: true, numeNou };
    }
    return { success: false, numeNou };
  }

  if (actionName === "adaugaClientaDirect") {
    const incluse = getNrSedinteAbonamentLocal(payload.tip);
    const { data: ins } = await sb.from('cliente').insert([{
      nume: payload.nume.trim(),
      tipAbonament: payload.tip,
      incluse: incluse,
      efectuate: 0,
      ramase: incluse,
      dataStart: "-",
      dataExpirare: "-",
      status: "Activ"
    }]).select().single();
    if (ins) {
      await sb.from('cliente').update({ id: "cli_" + ins.row }).eq('row', ins.row);
    }
    return { success: true };
  }

  if (actionName === "seteazaStatusClienta") {
    await sb.from('cliente').update({ status: payload.statusNou }).ilike('nume', payload.nume.trim());
    return { success: true };
  }

  if (actionName === "prelungesteValabilitate") {
    const nouaData = payload.dataManuala
      ? new Date(payload.dataManuala)
      : new Date(new Date().getTime() + (Number(payload.zile) * 86400000));
    const dataFinalaRo = formateazaDataRoLocal(nouaData);
    await sb.from('cliente').update({ dataExpirare: dataFinalaRo, status: "Activ" }).ilike('nume', payload.nume.trim());
    return { success: true, nouaData: dataFinalaRo };
  }

  return { success: false };
}

function callBackend(actionName, payload, callback) {
  if (USE_SUPABASE && supabaseClient) {
    executaActiuneSupabase(actionName, payload)
      .then(res => { if (callback) callback(res); })
      .catch(err => {
        console.error("Eroare Supabase:", err);
        showToast("Eroare sincronizare", "error");
      });
    return;
  }

  if (ESTE_APPS_SCRIPT) {
    let runner = google.script.run
      .withSuccessHandler(function(res) { if (callback) callback(res); })
      .withFailureHandler(function(err) { showToast("Eroare Apps Script: " + err.message, "error"); });

    if (actionName === "getTotBazaDeDate") runner.getTotBazaDeDate();
    else if (actionName === "salveazaSlotAuto") runner.salveazaSlotAuto(payload.row, payload.saptamanaCheie, payload.dataCalendar, payload.zi, payload.ora, payload.clienta, payload.antrenament, payload.slotIndex);
    else if (actionName === "bifeazaPrezenta") runner.bifeazaPrezentaSlot(payload.row, payload.saptamanaCheie, payload.dataCalendar, payload.zi, payload.ora, payload.clienta, payload.antrenament, payload.slotIndex);
    else if (actionName === "anuleazaSlot") runner.anuleazaSlotSiPrezenta(payload.row, payload.saptamanaCheie, payload.dataCalendar, payload.zi, payload.ora, payload.slotIndex);
    else if (actionName === "comutaBlocareOra") runner.comutaBlocareOra(payload.saptamanaCheie, payload.zi, payload.ora, payload.blocat);
    else if (actionName === "adaugaOraCustom") runner.adaugaOraCustomOrar(payload.saptamanaCheie, payload.zi, payload.ora);
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
  document.getElementById('modalBtnConfirm').innerText = t('confirmBtn');
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

function getTopOffsetSubZile() {
  let headerEl = document.querySelector('header');
  let daySelector = document.getElementById('dayButtonsContainer');
  let hHeader = headerEl ? headerEl.getBoundingClientRect().height : 50;
  let hDays = daySelector ? daySelector.getBoundingClientRect().height : 45;
  return hHeader + hDays + 5;
}

function calibreazaLayoutEcran(oraCheie, closestBlock) {
  let endCard = document.getElementById('endScheduleCard');
  if (!endCard) return;

  endCard.style.transition = 'none';
  endCard.classList.remove('state-ora-17', 'state-ora-18');
  endCard.style.minHeight = '';

  if (!closestBlock) {
    void endCard.offsetHeight;
    endCard.style.transition = '';
    return;
  }

  if (oraCheie === '18:00') {
    endCard.classList.add('state-ora-18');
  } else if (oraCheie === '17:00') {
    endCard.classList.add('state-ora-17');
  }

  void endCard.offsetHeight;

  let vh = window.innerHeight;
  let topOffset = getTopOffsetSubZile();
  let navEl = document.getElementById('bottomNav');
  let hNav = navEl ? navEl.getBoundingClientRect().height : 64;
  let spatiuVizibilUtil = vh - topOffset - hNav - 10;

  let istoricEl = document.getElementById('detailsIstoricOrar') || endCard;
  let blockRect = closestBlock.getBoundingClientRect();
  let istoricRect = istoricEl.getBoundingClientRect();

  let inaltimeDeLaCardLaBazaIstoric = istoricRect.bottom - blockRect.top;

  if (inaltimeDeLaCardLaBazaIstoric < spatiuVizibilUtil) {
    let deficit = spatiuVizibilUtil - inaltimeDeLaCardLaBazaIstoric;
    let currentEndCardHeight = endCard.getBoundingClientRect().height || 58;
    endCard.style.minHeight = Math.ceil(currentEndCardHeight + deficit) + 'px';
    void endCard.offsetHeight;
  }

  requestAnimationFrame(() => {
    endCard.style.transition = '';
  });
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
    calibreazaLayoutEcran("", null);
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

  if (!closestBlock) return;

  let calCard = document.getElementById('calendarExpandableCard');
  if (calCard && calCard.classList.contains('is-expanded')) {
    calCard.style.transition = 'none';
    calCard.classList.remove('is-expanded');
    void calCard.offsetHeight;
    calCard.style.transition = '';
  }

  const executaAliniereMilimetrica = () => {
    let prevAnim = tabOrar.style.animation;
    let prevTransform = tabOrar.style.transform;
    tabOrar.style.animation = 'none';
    tabOrar.style.transform = 'none';
    void tabOrar.offsetHeight;

    calibreazaLayoutEcran(closestOraText, closestBlock);

    let topOffset = getTopOffsetSubZile();
    let blockTopDoc = closestBlock.getBoundingClientRect().top + window.pageYOffset;
    let targetScrollY = Math.max(0, Math.round(blockTopDoc - topOffset));

    window.scrollTo({
      top: targetScrollY,
      behavior: 'auto'
    });

    tabOrar.style.animation = prevAnim;
    tabOrar.style.transform = prevTransform;
  };

  executaAliniereMilimetrica();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      executaAliniereMilimetrica();

      closestBlock.classList.remove('hour-block-current-highlight');
      void closestBlock.offsetWidth;
      closestBlock.classList.add('hour-block-current-highlight');
      setTimeout(() => {
        closestBlock.classList.remove('hour-block-current-highlight');
      }, 2000);
    });
  });
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
  } else if (detailsEl && !detailsEl.open) {
    let d = new Date();
    let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
    if (esteSaptamanaActiva() && ziCurentaCheie === zileChei[d.getDay()]) {
      setTimeout(() => {
        autoScrollLaOraCurenta();
      }, 50);
    }
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
      <button class="header-icon-bubble-btn" id="headerIconOrarBtn" onclick="comutaExpandareBaraCalendar(event)" title="${currentLang === 'en' ? 'Toggle week selector' : 'Comută selectorul de săptămână'}">
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

function aplicaTraduceriInterfataStatic() {
  document.getElementById('navTextOrar').innerText = t('navOrar');
  document.getElementById('navTextProg').innerText = t('navProg');
  document.getElementById('navTextFisa').innerText = t('navFisa');
  document.getElementById('navTextIncasari').innerText = t('navIncasari');

  document.getElementById('btnPastWeek').innerText = t('pastWeek');
  document.getElementById('btnRevinoAzi').innerText = t('today');
  document.getElementById('btnNextWeek').innerText = t('nextWeek');

  document.getElementById('endScheduleTitleText').innerText = t('endScheduleTitle');
  document.getElementById('endScheduleSubText').innerText = t('endScheduleSubtitle');

  document.getElementById('addOraCustomText').innerText = t('addExtraHour');
  document.getElementById('btnAddOraCustomAction').innerText = t('addBtn');
  document.getElementById('historyOrarSummaryText').innerText = t('historyOrarTitle');
  document.getElementById('labelFiltruCliOrar').innerText = t('filterClient');
  document.getElementById('labelFiltruLunaOrar').innerText = t('filterMonth');

  document.getElementById('progAddBtnText').innerText = t('addBtn');
  document.getElementById('progNouNume').placeholder = t('addClientPlaceholder');
  let selSec = document.getElementById('progNouSectiune');
  if (selSec) {
    selSec.options[0].text = t('activeSection');
    selSec.options[1].text = t('holdSection');
  }
  document.getElementById('holdHeaderTitle').innerText = t('holdSection').toUpperCase();

  document.getElementById('addClientSummaryText').innerText = t('addNewClientTitle');
  document.getElementById('nouNumeClienta').placeholder = t('clientNamePlaceholder');
  document.getElementById('saveClientDirectBtn').innerText = t('saveClientBtn');

  document.getElementById('labelSelectClientFisa').innerText = t('selectClientLabel');
  document.getElementById('spanArataArhivate').innerText = t('showArchived');
  document.getElementById('emptyStateTitleText').innerText = t('emptyStateTitle');
  document.getElementById('emptyStateDescText').innerText = t('emptyStateDesc');

  document.getElementById('labelSedinteRamase').innerText = t('sessionsRemaining');
  document.getElementById('labelStatusFisa').innerText = t('statusLabel');
  document.getElementById('labelValabilitate').innerText = t('validityLabel');
  document.getElementById('labelSedinteEfectuate').innerText = t('sessionsDone');

  document.getElementById('editClientSummaryText').innerText = t('editClientTitle');
  document.getElementById('labelEditNume').innerText = t('renameClientLabel');
  document.getElementById('labelEditTip').innerText = t('subTypeLabel');
  document.getElementById('labelEditStart').innerText = t('startDateLabel');
  document.getElementById('labelEditExp').innerText = t('expDateLabel');
  document.getElementById('labelEditIncluse').innerText = t('includedLabel');
  document.getElementById('labelEditEfectuate').innerText = t('doneLabel');
  document.getElementById('labelEditRamase').innerText = t('remainingLabel');
  document.getElementById('labelEditStatus').innerText = t('statusLabel');
  document.getElementById('saveEditClientBtn').innerText = t('saveChangesBtn');

  document.getElementById('extendValidityTitleText').innerText = t('extendValidityTitle');
  document.getElementById('setManualDateBtn').innerText = t('setBtn');

  document.getElementById('recentHistorySummaryText').innerText = t('recentHistoryTitle');
  document.getElementById('labelFiltruLunaFisa').innerText = t('filterMonth');

  document.getElementById('incasareTitleText').innerText = t('newPaymentTitle');
  document.getElementById('labelIncNume').innerText = t('clientNamePlaceholder');
  document.getElementById('incasareNume').placeholder = t('clientNameIncPlaceholder');
  document.getElementById('labelIncTip').innerText = t('subTypeLabel');
  document.getElementById('optSelectSubPlaceholder').innerText = t('selectSubPlaceholder');
  document.getElementById('labelIncSuma').innerText = t('sumLabel');
  document.getElementById('optSumaPlaceholder').innerText = t('sumPresetPlaceholder');
  document.getElementById('incasareSumaCustom').placeholder = t('sumLabel');
  document.getElementById('labelIncMetoda').innerText = t('paymentMethodLabel');
  document.getElementById('optMetodaPlaceholder').innerText = t('paymentMethodPlaceholder');
  document.getElementById('labelIncDataPlata').innerText = t('payDateLabel');
  document.getElementById('labelIncDataStart').innerText = t('payStartLabel');
  document.getElementById('submitAbonamentBtn').innerText = t('paySubmitBtn');

  document.getElementById('historyIncSummaryText').innerText = t('paymentHistoryTitle');
  document.getElementById('labelFiltruCliInc').innerText = t('filterClient');
  document.getElementById('labelFiltruLunaInc').innerText = t('filterMonth');
  document.getElementById('totalIncLabelText').innerText = t('totalPaymentsLabel');

  document.getElementById('themeSectionTitle').innerText = t('themeTitle');
  document.getElementById('themeBtnLightText').innerText = t('lightTheme');
  document.getElementById('themeBtnDarkText').innerText = t('darkTheme');
  document.getElementById('themeBtnSystemText').innerText = t('systemTheme');
  document.getElementById('langSectionTitle').innerText = t('langTitle');

  document.getElementById('modalTitle').innerText = t('confirmTitle');
  document.getElementById('modalBtnCancel').innerText = t('cancelBtn');
  document.getElementById('modalBtnConfirm').innerText = t('confirmBtn');

  document.getElementById('editPaymentModalTitle').innerText = t('editPaymentTitle');
  document.getElementById('editIncCancelBtn').innerText = t('cancelBtn');
  document.getElementById('editIncSaveBtn').innerText = t('saveBtn');
}

window.onload = function() {
  reseteazaDateIncasariAzi();
  leagaAscultatoriCuratareErori();
  initSwipeNavigation();
  aplicaTraduceriInterfataStatic();

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

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

  let areCacheLocal = false;
  try {
    let cached = localStorage.getItem("BFIT_DB_LOCAL");
    if (cached) {
      let parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.orarSloturi) && parsed.orarSloturi.length > 0) {
        DB = parsed;
        areCacheLocal = true;
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
  actualizeazaHeaderVisual(tipTabCurent, currentLang === 'en' ? tabsOrder[tabIndexCurent].titleEn : tabsOrder[tabIndexCurent].titleRo);

  if (areCacheLocal) {
    autoScrollLaOraCurenta();
    incarcaBazaDateSilencios(null, false);
  } else {
    incarcaBazaDateSilencios(null, true);
  }
};

// FIX GLITCH SCROLL MOBILE LA DESCHIDEREA TASTATURII
window.addEventListener('resize', () => {
  let activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
    return; // Tastatura virtuală mobilă este deschisă; ignorăm recalibrarea de scroll pentru a preveni flicker-ul
  }

  if (tipTabCurent === 'orar') {
    let now = new Date();
    let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
    if (esteSaptamanaActiva() && ziCurentaCheie === zileChei[now.getDay()]) {
      autoScrollLaOraCurenta();
    }
  }
});

function initSwipeNavigation() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let esteGestBlocat = false;

  document.addEventListener('touchstart', (e) => {
    esteGestBlocat = false;
    if (!e.touches || e.touches.length !== 1) {
      esteGestBlocat = true;
      return;
    }

    let target = e.target;
    if (target && (target.closest('.day-selector') || target.tagName === 'TEXTAREA')) {
      esteGestBlocat = true;
      return;
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (esteGestBlocat || !touchStartX) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;
    let deltaX = touchEndX - touchStartX;
    let deltaY = touchEndY - touchStartY;
    let absX = Math.abs(deltaX);
    let absY = Math.abs(deltaY);
    let durata = Date.now() - touchStartTime;

    let esteOrizontal = absX > (absY * 1.25);
    let pragMinim = (durata < 320) ? 35 : 55;

    if (esteOrizontal && absX >= pragMinim) {
      if (deltaX < 0) {
        if (tabIndexCurent < tabsOrder.length - 1) {
          let nextTab = tabsOrder[tabIndexCurent + 1];
          let btn = document.querySelectorAll('nav button')[nextTab.idx];
          let titluTab = currentLang === 'en' ? nextTab.titleEn : nextTab.titleRo;
          comutaTab(nextTab.id, titluTab, btn, nextTab.tip, nextTab.idx);
        }
      } else {
        if (tabIndexCurent > 0) {
          let prevTab = tabsOrder[tabIndexCurent - 1];
          let btn = document.querySelectorAll('nav button')[prevTab.idx];
          let titluTab = currentLang === 'en' ? prevTab.titleEn : prevTab.titleRo;
          comutaTab(prevTab.id, titluTab, btn, prevTab.tip, prevTab.idx);
        }
      }
    }

    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
  }, { passive: true });
}

function incarcaBazaDateSilencios(clientaSelectataDupaActualizare = null, aliniazaLaOraCurenta = false) {
  callBackend("getTotBazaDeDate", {}, function(data) {
    if (!data || !Array.isArray(data.orarSloturi)) return;
    DB = data;
    try {
      localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(data));
    } catch(e) {}

    let scrollAnterior = window.pageYOffset;

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

    if (tipTabCurent === 'orar') {
      if (aliniazaLaOraCurenta) {
        autoScrollLaOraCurenta();
      } else {
        let now = new Date();
        let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
        if (esteSaptamanaActiva() && ziCurentaCheie === zileChei[now.getDay()]) {
          let currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
          let closestBlock = null;
          let minDiff = Infinity;
          let closestOraText = "";
          document.querySelectorAll('.hour-block').forEach(block => {
            let oraText = block.getAttribute('data-ora');
            if (!oraText || oraText.indexOf(':') === -1) return;
            let parts = oraText.split(':');
            let diff = Math.abs(currentTimeInMinutes - (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)));
            if (diff < minDiff) {
              minDiff = diff;
              closestBlock = block;
              closestOraText = oraText;
            }
          });
          calibreazaLayoutEcran(closestOraText, closestBlock);
        }
        window.scrollTo({ top: scrollAnterior, behavior: 'auto' });
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

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

  setTimeout(() => {
    dataReferintaLuni.setDate(dataReferintaLuni.getDate() + (directie * 7));

    if (esteSaptamanaActiva()) {
      let d = new Date();
      let aziIdx = d.getDay();
      let zileChei = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
      ziCurentaCheie = (aziIdx >= 1 && aziIdx <= 5) ? zileChei[aziIdx - 1] : "Luni";
      actualizeazaBaraZile();
      randeazaOrarInstant();
      autoScrollLaOraCurenta();
    } else {
      ziCurentaCheie = "Luni";
      actualizeazaBaraZile();
      randeazaOrarInstant();
      calibreazaLayoutEcran("", null);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (lbl) {
      lbl.style.opacity = '1';
      lbl.style.transform = 'translateX(0)';
    }
  }, 140);
}

function revinoLaSaptamanaCurenta() {
  if (esteSaptamanaActiva()) {
    showToast(t('toastAlreadyCurrent'));
    autoScrollLaOraCurenta();
    return;
  }

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

  dataReferintaLuni = new Date(dataReferintaLuniBaza.getTime());
  
  let d = new Date();
  let aziIdx = d.getDay();
  let zileChei = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
  ziCurentaCheie = (aziIdx >= 1 && aziIdx <= 5) ? zileChei[aziIdx - 1] : "Luni";

  actualizeazaBaraZile();
  randeazaOrarInstant();
  autoScrollLaOraCurenta();
  showToast(t('toastBackCurrent'));
}

function getZileConfig() {
  let zileInfoRo = [
    { cheie: "Luni", nume: "Luni" },
    { cheie: "Marti", nume: "Marți" },
    { cheie: "Miercuri", nume: "Miercuri" },
    { cheie: "Joi", nume: "Joi" },
    { cheie: "Vineri", nume: "Vineri" }
  ];
  let zileInfoEn = [
    { cheie: "Luni", nume: "Monday" },
    { cheie: "Marti", nume: "Tuesday" },
    { cheie: "Miercuri", nume: "Wednesday" },
    { cheie: "Joi", nume: "Thursday" },
    { cheie: "Vineri", nume: "Friday" }
  ];

  let zileInfo = currentLang === 'en' ? zileInfoEn : zileInfoRo;
  let localeStr = currentLang === 'en' ? 'en-US' : 'ro';

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
      dataDate: d,
      monthName: d.toLocaleString(localeStr, { month: 'short' })
    };
  });
}

function getDataCalendaristicaCurenta() {
  let zCfg = getZileConfig().find(z => z.cheie === ziCurentaCheie);
  return zCfg ? zCfg.dataStrRo : "";
}

function actualizeazaBaraZile() {
  let zile = getZileConfig();
  let localeStr = currentLang === 'en' ? 'en-US' : 'ro';
  let luniStr = `${zile[0].dataDate.getDate()} ${zile[0].dataDate.toLocaleString(localeStr, { month: 'short' })}`;
  let vineriStr = `${zile[4].dataDate.getDate()} ${zile[4].dataDate.toLocaleString(localeStr, { month: 'short' })} ${zile[4].dataDate.getFullYear()}`;
  let textInterval = `${luniStr} - ${vineriStr}`;

  let lbl = document.getElementById('labelIntervalSaptamana');
  if (lbl) lbl.innerText = textInterval;

  let subLabel = document.getElementById('subLabelStareSaptamana');
  let btnAzi = document.getElementById('btnRevinoAzi');

  if (subLabel) {
    if (esteSaptamanaActiva()) {
      subLabel.style.display = 'none';
    } else if (esteSaptamanaTrecuta()) {
      subLabel.innerText = t('pastWeekState');
      subLabel.style.display = 'inline-block';
      subLabel.style.background = '#fee2e2';
      subLabel.style.color = '#b91c1c';
    } else {
      subLabel.innerText = t('futureWeekState');
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
        <span class="day-date-sub">${z.dataDate.getDate()} ${z.monthName}</span>
      </button>
    `;
  });
  container.innerHTML = html;
}

function schimbaZiInstant(ziCheie) {
  ziCurentaCheie = ziCheie;

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

  actualizeazaBaraZile();
  randeazaOrarInstant();
  
  let d = new Date();
  let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
  let esteAzi = esteSaptamanaActiva() && ziCurentaCheie === zileChei[d.getDay()];

  if (esteAzi) {
    autoScrollLaOraCurenta();
  } else {
    calibreazaLayoutEcran("", null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function populeazaSelectoriCliente() {
  let datalist = document.getElementById('listaClienteVizibile');
  if (!datalist) return;

  let arataArhivate = document.getElementById('checkArataArhivate')?.checked || false;

  datalist.innerHTML = '';
  (DB.clienti || []).forEach(c => {
    let esteArhivat = (c.status || '').toLowerCase() === 'arhivat' || (c.status || '').toLowerCase() === 'archived';
    if (!esteArhivat || arataArhivate) {
      let optL = document.createElement('option');
      optL.value = c.nume;
      datalist.appendChild(optL);
    }
  });
}

function curataNumeLuna(str) {
  if (!str) return "";
  let curat = str.toString().trim();
  curat = curat.replace(/^luna\s+/i, "").replace(/^month\s+/i, "").trim();
  if (!curat) return "";
  return curat.charAt(0).toUpperCase() + curat.slice(1).toLowerCase();
}

function populeazaSelectorLuni() {
  let selLuna = document.getElementById('filtruLunaIncasari');
  let selLunaOrar = document.getElementById('filtruLunaOrar');
  let selLunaFisa = document.getElementById('filtruLunaFisa');

  let luniSet = new Set();
  const luniRoNume = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

  (DB.incasari || []).forEach(i => {
    if (i && i.luna && i.luna.trim() !== "-" && i.luna.trim() !== "") {
      let n = curataNumeLuna(i.luna);
      if (n) luniSet.add(n);
    }
  });

  (DB.prezente || []).forEach(p => {
    if (p && p.data && p.data.indexOf('.') !== -1) {
      let parts = p.data.split('.');
      if (parts.length === 3) {
        let m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) {
          luniSet.add(luniRoNume[m - 1]);
        }
      }
    }
  });

  function calculeazaScorLuna(str) {
    if (!str) return 0;
    let s = str.toLowerCase().trim();
    let anGasit = 0;
    let anMatch = s.match(/\b(20\d\d)\b/);
    if (anMatch) anGasit = parseInt(anMatch[1], 10);
    
    let lunaIdx = -1;
    for (let idx = 0; idx < luniRoNume.length; idx++) {
      if (s.indexOf(luniRoNume[idx].toLowerCase()) !== -1) {
        lunaIdx = idx;
        break;
      }
    }
    return (anGasit || 2026) * 100 + (lunaIdx !== -1 ? lunaIdx : 0);
  }

  let luniArray = Array.from(luniSet);
  luniArray.sort((a, b) => calculeazaScorLuna(b) - calculeazaScorLuna(a));

  [selLuna, selLunaOrar, selLunaFisa].forEach(sel => {
    if (!sel) return;
    let valAnterioara = sel.value;
    sel.innerHTML = `<option value="">${t('allMonths')}</option>`;
    luniArray.forEach(luna => {
      let opt = document.createElement('option');
      opt.value = luna;
      opt.innerText = luna;
      sel.appendChild(opt);
    });
    if (valAnterioara) sel.value = valAnterioara;
  });
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

  let detAdaugFisa = document.getElementById('detailsDetailsAdaugareClienta');
  if (detAdaugFisa) detAdaugFisa.open = false;

  let detEditFisa = document.getElementById('detailsEditareFisa');
  if (detEditFisa) detEditFisa.open = false;

  let detIstFisa = document.getElementById('detailsIstoricFisa');
  if (detIstFisa) detIstFisa.open = false;

  if (tipTab === 'orar') {
    autoScrollLaOraCurenta();
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function randeazaOrarInstant() {
  let container = document.getElementById('sloturiContainer');
  if (!container) return;
  let dataCalendarCurenta = getDataCalendaristicaCurenta();
  let saptamanaCheie = getSaptamanaCheie();
  let tagZiCautat = saptamanaCheie + "_" + ziCurentaCheie;
  let eTrecuta = esteSaptamanaTrecuta();

  let oreStandard = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  if (eTrecuta) {
    let prezenteZi = (DB.prezente || []).filter(p => p && p.data === dataCalendarCurenta);
    let grupuriOreTrecute = {};
    prezenteZi.forEach(p => {
      if (!p.ora) return;
      let rawOra = normalizeazaOraUi(p.ora);
      if (!grupuriOreTrecute[rawOra]) grupuriOreTrecute[rawOra] = [];
      if (grupuriOreTrecute[rawOra].length < 3) {
        grupuriOreTrecute[rawOra].push({
          ora: rawOra,
          clienta: p.clienta,
          antrenament: p.antrenament,
          bifat: true
        });
      }
    });

    let oreSet = Object.keys(grupuriOreTrecute).sort((a, b) => a.localeCompare(b));
    if (oreSet.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); padding:24px; text-align:center;">${t('noPresence')}</div>`;
      return;
    }

    let htmlTrecut = '';
    oreSet.forEach(ora => {
      let lista = grupuriOreTrecute[ora];
      let efectuateText = currentLang === 'en' ? 'completed' : 'efectuate';
      let historyText = currentLang === 'en' ? '✓ History' : '✓ Istoric';
      htmlTrecut += `
        <div class="hour-block" data-ora="${ora}">
          <div class="hour-header">
            <div class="hour-title-wrap"><span>🕒 ${ora}</span></div>
            <div class="hour-badge hour-badge-busy">${lista.length} / 3 ${efectuateText}</div>
          </div>
          <div class="hour-slots-wrapper">
      `;
      lista.forEach((s, idx) => {
        let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === (s.antrenament || "").toLowerCase());
        let colorCls = cfg ? cfg.cls : "";

        htmlTrecut += `
          <div class="slot-row slot-occupied">
            <div class="slot-num">${idx + 1}</div>
            <div class="slot-info">
              <input type="text" class="slot-input" value="${s.clienta}" readonly style="font-weight:700;">
              <input type="text" class="slot-input ${colorCls}" value="${s.antrenament || '-'}" readonly style="font-size:0.75rem; font-weight:700; margin-top:2px;">
            </div>
            <div style="font-size:0.82rem; font-weight:800; color:#15803d; padding:0 8px; white-space:nowrap;">${historyText}</div>
          </div>
        `;
      });
      htmlTrecut += `</div></div>`;
    });
    container.innerHTML = htmlTrecut;
    return;
  }

  let sloturi = (DB.orarSloturi || []).filter(s => {
    if (!s || !s.ziRaw) return false;
    let z = s.ziRaw.trim();
    if (z === tagZiCautat) return true;
    if (ziCurentaCheie === "Marti" && z === (saptamanaCheie + "_Marți")) return true;
    return false;
  });

  let grupuriOre = {};
  sloturi.forEach(slot => {
    if (!slot || !slot.ora) return;
    let rawOra = normalizeazaOraUi(slot.ora);
    if (!grupuriOre[rawOra]) grupuriOre[rawOra] = [];
    grupuriOre[rawOra].push(slot);
  });

  oreStandard.forEach(ora => {
    if (!grupuriOre[ora]) grupuriOre[ora] = [];
    while (grupuriOre[ora].length < 3) {
      grupuriOre[ora].push({ row: null, ora: ora, clienta: "", antrenament: "", blocat: false, bifat: false, slotIndex: grupuriOre[ora].length });
    }
  });

  Object.keys(grupuriOre).forEach(ora => {
    grupuriOre[ora].sort((a, b) => (Number(a.slotIndex) || 0) - (Number(b.slotIndex) || 0));
    grupuriOre[ora].splice(3);
  });

  let oreSortate = Object.keys(grupuriOre).sort((a, b) => a.localeCompare(b));

  let html = '';
  oreSortate.forEach(ora => {
    let sloturiOra = grupuriOre[ora] || [];
    let esteBlocat = sloturiOra.some(s => s && s.blocat);
    let ocupate = sloturiOra.filter(s => s && s.clienta && s.clienta.trim() !== "").length;
    let total = sloturiOra.length;

    let badgeHtml = '';
    let occupiedText = currentLang === 'en' ? 'occupied' : 'ocupate';
    if (esteBlocat) {
      badgeHtml = `<div class="hour-badge hour-badge-blocked">${currentLang === 'en' ? 'Hour Blocked!' : 'Ora Blocată!'}</div>`;
    } else {
      badgeHtml = `<div class="hour-badge ${ocupate > 0 ? 'hour-badge-busy' : 'hour-badge-free'}">${ocupate} / ${total} ${occupiedText}</div>`;
    }

    let lockTitle = esteBlocat ? (currentLang === 'en' ? 'Unlock hour' : 'Deblochează ora') : (currentLang === 'en' ? 'Block hour' : 'Blochează ora');

    html += `
      <div class="hour-block ${esteBlocat ? 'hour-block-blocked' : ''}" data-ora="${ora}">
        <div class="hour-header">
          <div class="hour-title-wrap">
            <button class="btn-lock-hour" onclick="comutaBlocareOraInstant('${ziCurentaCheie}', '${ora}', ${!esteBlocat})" title="${lockTitle}">
              🕒
            </button>
            <span>${ora}</span>
          </div>
          ${badgeHtml}
        </div>
        <div class="hour-slots-wrapper" ${esteBlocat ? 'style="pointer-events: none; opacity: 0.65; user-select: none;"' : ''}>
    `;

    sloturiOra.forEach((slot, idx) => {
      let slotIdx = (typeof slot.slotIndex === 'number') ? slot.slotIndex : idx;
      let clientaCurata = (slot && slot.clienta) ? slot.clienta.trim() : "";
      let clientaValida = gasesteClientaValida(clientaCurata);
      let isOccupied = !!clientaValida;
      let antVal = (slot && slot.antrenament) ? slot.antrenament : "";
      let slotDomKey = `${ora.replace(':', '')}_${slotIdx}`;

      let colorCls = "";
      if (antVal) {
        let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === antVal.toLowerCase());
        if (cfg) colorCls = cfg.cls;
      }

      let tipAntrenamentPlaceholder = currentLang === 'en' ? 'Workout type' : 'Tip antrenament';
      let clientPlaceholder = currentLang === 'en' ? 'Choose existing client...' : 'Alege clientă existentă...';

      let selectAntHtml = `<select id="ant_${slotDomKey}" class="slot-select-type ${antVal ? 'select-active ' + colorCls : 'select-faded'}" onchange="aplicaCuloareAntrenament(this); peSchimbareAntrenament('${ziCurentaCheie}', '${ora}', ${slotIdx})">`;
      selectAntHtml += `<option value="" ${!antVal ? 'selected' : ''}>${tipAntrenamentPlaceholder}</option>`;
      optiuniAntrenamentConfig.forEach(opt => {
        let selected = (antVal === opt.text) ? 'selected' : '';
        selectAntHtml += `<option value="${opt.text}" ${selected}>${opt.text}</option>`;
      });
      selectAntHtml += `</select>`;

      let saveBtnDisabledAttr = (!isOccupied || slot.bifat) ? 'disabled' : '';
      let saveBtnClass = (!isOccupied || slot.bifat) ? 'btn btn-save-check btn-save-check-disabled' : 'btn btn-save-check';

      // BUTONUL ✕ (Clear) DEZACTIVAT DACĂ SLOTUL ESTE COMPLET GOL
      let slotEsteCompletGol = !clientaCurata && !antVal;
      let clearBtnDisabledAttr = slotEsteCompletGol ? 'disabled' : '';
      let clearBtnClass = slotEsteCompletGol ? 'btn btn-clear btn-clear-disabled' : 'btn btn-clear';

      html += `
        <div class="slot-row ${isOccupied ? 'slot-occupied' : 'slot-free'}">
          <div class="slot-num">${idx + 1}</div>
          <div class="slot-info">
            <input type="text" id="cli_${slotDomKey}" class="slot-input" value="${clientaCurata}" placeholder="${clientPlaceholder}" list="listaClienteVizibile" oninput="peSchimbareNumeClienta('${ziCurentaCheie}', '${ora}', ${slotIdx})">
            ${selectAntHtml}
          </div>
          <div style="display:flex; gap:4px;">
            <button id="btn_save_${slotDomKey}" class="${saveBtnClass}" ${saveBtnDisabledAttr} title="${currentLang === 'en' ? 'Mark Attendance & Deduct Session' : 'Bifează Prezența & Scade Ședință'}" onclick="bifeazaPrezentaSlot('${ziCurentaCheie}', '${ora}', ${slotIdx})">✓</button>
            <button id="btn_clear_${slotDomKey}" class="${clearBtnClass}" ${clearBtnDisabledAttr} title="${currentLang === 'en' ? 'Free Slot & Remove from History' : 'Eliberează Slot & Șterge din Istoric'}" onclick="anuleazaSlot('${ziCurentaCheie}', '${ora}', ${slotIdx})">✕</button>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function comutaBlocareOraInstant(zi, ora, blocatNou) {
  let saptamanaCheie = getSaptamanaCheie();
  let tagZiCautat = saptamanaCheie + "_" + zi;
  let oraNorm = normalizeazaOraUi(ora);
  let textConfirm = blocatNou ? 
    (currentLang === 'en' ? `Block time slot ${oraNorm}?` : `Blochezi intervalul orar ${oraNorm}?`) : 
    (currentLang === 'en' ? `Unblock time slot ${oraNorm}?` : `Deblochezi intervalul orar ${oraNorm}?`);

  customConfirm(currentLang === 'en' ? "Time Slot Locking" : "Blocare oră", textConfirm, function() {
    (DB.orarSloturi || []).forEach(s => {
      let rawOra = normalizeazaOraUi(s.ora);
      if ((s.ziRaw === tagZiCautat || s.ziRaw === (saptamanaCheie + "_Marți")) && rawOra === oraNorm) {
        s.blocat = blocatNou;
      }
    });
    randeazaOrarInstant();
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}

    callBackend("comutaBlocareOra", { saptamanaCheie: saptamanaCheie, zi: zi, ora: oraNorm, blocat: blocatNou }, function() {
      showToast(blocatNou ? 
        (currentLang === 'en' ? `✓ Time slot ${oraNorm} has been blocked!` : `✓ Intervalul ${oraNorm} a fost blocat!`) : 
        (currentLang === 'en' ? `✓ Time slot ${oraNorm} has been unblocked!` : `✓ Intervalul ${oraNorm} a fost deblocat!`)
      );
      incarcaBazaDateSilencios();
    });
  });
}

let debounceTimerNume = null;
function peSchimbareNumeClienta(zi, ora, slotIdx) {
  let oraNorm = normalizeazaOraUi(ora);
  let slotDomKey = `${oraNorm.replace(':', '')}_${slotIdx}`;
  let elCli = document.getElementById('cli_' + slotDomKey);
  let elBtnSave = document.getElementById('btn_save_' + slotDomKey);
  let elBtnClear = document.getElementById('btn_clear_' + slotDomKey);
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

  // Actualizăm starea butonului ✕ imediat ce se tastează sau se șterge
  if (elBtnClear) {
    let elAnt = document.getElementById('ant_' + slotDomKey);
    let areCevaCompletat = (textIntrodus !== "") || (elAnt && elAnt.value !== "");
    elBtnClear.disabled = !areCevaCompletat;
    if (areCevaCompletat) {
      elBtnClear.classList.remove('btn-clear-disabled');
    } else {
      elBtnClear.classList.add('btn-clear-disabled');
    }
  }

  clearTimeout(debounceTimerNume);
  debounceTimerNume = setTimeout(() => {
    let elAnt = document.getElementById('ant_' + slotDomKey);
    let antrenament = elAnt ? elAnt.value : "";
    let saptamanaCheie = getSaptamanaCheie();
    let dataCalendar = getDataCalendaristicaCurenta();
    let tagZi = saptamanaCheie + "_" + zi;

    let slotExistent = (DB.orarSloturi || []).find(s => {
      if (!s || !s.ziRaw) return false;
      let rawOra = normalizeazaOraUi(s.ora);
      return (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) && 
             rawOra === oraNorm && 
             Number(s.slotIndex) === Number(slotIdx);
    });
    let rowNum = slotExistent ? slotExistent.row : null;

    if (!textIntrodus) {
      if (slotExistent) {
        slotExistent.clienta = "";
        slotExistent.antrenament = "";
        slotExistent.bifat = false;
        try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
      }
      callBackend("salveazaSlotAuto", {
        row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: oraNorm, clienta: "", antrenament: "", slotIndex: slotIdx
      }, function() {
        incarcaBazaDateSilencios();
      });
      return;
    }

    if (!clientaGasita) return;

    let numeExact = clientaGasita.nume;
    if (elCli && elCli.value !== numeExact) {
      elCli.value = numeExact;
    }

    if (slotExistent) {
      slotExistent.clienta = numeExact;
      slotExistent.antrenament = antrenament;
    } else {
      DB.orarSloturi.push({
        row: null,
        ziRaw: tagZi,
        ora: oraNorm,
        clienta: numeExact,
        antrenament: antrenament,
        blocat: false,
        bifat: false,
        slotIndex: slotIdx
      });
    }
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}

    callBackend("salveazaSlotAuto", {
      row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: oraNorm, clienta: numeExact, antrenament: antrenament, slotIndex: slotIdx
    }, function(res) {
      if (res && res.row && slotExistent) {
        slotExistent.row = res.row;
        try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
      }
      incarcaBazaDateSilencios();
    });
  }, 400);
}

function peSchimbareAntrenament(zi, ora, slotIdx) {
  let oraNorm = normalizeazaOraUi(ora);
  let slotDomKey = `${oraNorm.replace(':', '')}_${slotIdx}`;
  let elCli = document.getElementById('cli_' + slotDomKey);
  let elAnt = document.getElementById('ant_' + slotDomKey);
  let elBtnClear = document.getElementById('btn_clear_' + slotDomKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let antrenament = elAnt ? elAnt.value : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (elBtnClear) {
    let areCeva = (textIntrodus !== "") || (antrenament !== "");
    elBtnClear.disabled = !areCeva;
    if (areCeva) elBtnClear.classList.remove('btn-clear-disabled');
    else elBtnClear.classList.add('btn-clear-disabled');
  }

  if (!clientaGasita) {
    showToast(currentLang === 'en' ? "Please choose an active existing client first!" : "Alege mai întâi o clientă activă existentă!", "error");
    if (elAnt) {
      elAnt.value = "";
      aplicaCuloareAntrenament(elAnt);
    }
    return;
  }

  let numeExact = clientaGasita.nume;
  let saptamanaCheie = getSaptamanaCheie();
  let dataCalendar = getDataCalendaristicaCurenta();
  let tagZi = saptamanaCheie + "_" + zi;

  let slotExistent = (DB.orarSloturi || []).find(s => {
    if (!s || !s.ziRaw) return false;
    let rawOra = normalizeazaOraUi(s.ora);
    return (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) && 
           rawOra === oraNorm && 
           Number(s.slotIndex) === Number(slotIdx);
  });
  let rowNum = slotExistent ? slotExistent.row : null;

  if (slotExistent) {
    slotExistent.clienta = numeExact;
    slotExistent.antrenament = antrenament;
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
  }

  callBackend("salveazaSlotAuto", {
    row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: oraNorm, clienta: numeExact, antrenament: antrenament, slotIndex: slotIdx
  }, function(res) {
    if (res && res.row && slotExistent) {
      slotExistent.row = res.row;
      try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
    }
    showToast(t('toastWorkoutSaved'));
  });
}

function bifeazaPrezentaSlot(zi, ora, slotIdx) {
  let oraNorm = normalizeazaOraUi(ora);
  let slotDomKey = `${oraNorm.replace(':', '')}_${slotIdx}`;
  let elCli = document.getElementById('cli_' + slotDomKey);
  let elAnt = document.getElementById('ant_' + slotDomKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let antrenament = elAnt ? elAnt.value : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (!clientaGasita) {
    showToast(currentLang === 'en' ? "Choose a valid client from the list!" : "Alege o clientă validă din listă!", "error");
    return;
  }

  let numeExact = clientaGasita.nume;
  let dataCalendar = getDataCalendaristicaCurenta();
  let saptamanaCheie = getSaptamanaCheie();
  let tagZi = saptamanaCheie + "_" + zi;

  let slotExistent = (DB.orarSloturi || []).find(s => {
    if (!s || !s.ziRaw) return false;
    let rawOra = normalizeazaOraUi(s.ora);
    return (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) && 
           rawOra === oraNorm && 
           Number(s.slotIndex) === Number(slotIdx);
  });
  let rowNum = slotExistent ? slotExistent.row : null;

  if (slotExistent) {
    slotExistent.clienta = numeExact;
    slotExistent.antrenament = antrenament;
    slotExistent.bifat = true;
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
  }

  let btnSave = document.getElementById('btn_save_' + slotDomKey);
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.classList.add('btn-save-check-disabled');
  }

  showToast(t('toastPresenceMarked'));
  callBackend("bifeazaPrezenta", {
    row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: oraNorm, clienta: numeExact, antrenament: antrenament, slotIndex: slotIdx
  }, function() {
    incarcaBazaDateSilencios();
  });
}

function anuleazaSlot(zi, ora, slotIdx) {
  let saptamanaCheie = getSaptamanaCheie();
  let tagZi = saptamanaCheie + "_" + zi;
  let oraNorm = normalizeazaOraUi(ora);
  let slotDomKey = `${oraNorm.replace(':', '')}_${slotIdx}`;

  let elCli = document.getElementById('cli_' + slotDomKey);
  let elAnt = document.getElementById('ant_' + slotDomKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let antrenament = elAnt ? elAnt.value : "";

  let slotExistent = (DB.orarSloturi || []).find(s => {
    if (!s || !s.ziRaw) return false;
    let rawOra = normalizeazaOraUi(s.ora);
    return (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) && 
           rawOra === oraNorm && 
           Number(s.slotIndex) === Number(slotIdx);
  });

  // Guard: dacă slotul este deja complet gol, nu deschidem modalul și nu facem nimic
  if (!textIntrodus && !antrenament && (!slotExistent || (!slotExistent.clienta && !slotExistent.antrenament))) {
    return;
  }

  let confirmTitleText = currentLang === 'en' ? "Free slot" : "Eliberare slot";
  let confirmDescText = currentLang === 'en' ? 
    "Free this slot? The session will be restored to the client's profile if it was checked, and the entry will be removed from history." : 
    "Eliberezi acest slot? Ședința va fi restituită în fișa clientei dacă a fost bifată, iar intrarea va fi ștearsă din istoric.";

  customConfirm(confirmTitleText, confirmDescText, function() {
    let dataCalendar = getDataCalendaristicaCurenta();
    let elBtnSave = document.getElementById('btn_save_' + slotDomKey);
    let elBtnClear = document.getElementById('btn_clear_' + slotDomKey);

    if (elCli) elCli.value = "";
    if (elAnt) {
      elAnt.value = "";
      aplicaCuloareAntrenament(elAnt);
    }
    if (elBtnSave) {
      elBtnSave.disabled = true;
      elBtnSave.classList.add('btn-save-check-disabled');
    }
    if (elBtnClear) {
      elBtnClear.disabled = true;
      elBtnClear.classList.add('btn-clear-disabled');
    }

    let rowNum = slotExistent ? slotExistent.row : null;

    if (slotExistent) {
      slotExistent.clienta = "";
      slotExistent.antrenament = "";
      slotExistent.bifat = false;
      try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
    }

    showToast(t('toastSlotFreed'));

    callBackend("anuleazaSlot", {
      row: rowNum, saptamanaCheie: saptamanaCheie, dataCalendar: dataCalendar, zi: zi, ora: oraNorm, slotIndex: slotIdx
    }, function() {
      incarcaBazaDateSilencios();
    });
  });
}

function adaugaOraCustom() {
  let inp = document.getElementById('inputOraCustom');
  let ora = inp ? inp.value.trim() : "";
  if (!ora) {
    showToast(currentLang === 'en' ? "Enter extra hour!" : "Introdu ora suplimentară!", "error");
    return;
  }
  let saptamanaCheie = getSaptamanaCheie();
  let oraNorm = normalizeazaOraUi(ora);

  callBackend("adaugaOraCustom", { saptamanaCheie: saptamanaCheie, zi: ziCurentaCheie, ora: oraNorm }, function(res) {
    showToast(t('toastHourAdded') + res.ora);
    if (inp) inp.value = '';
    incarcaBazaDateSilencios();
  });
}

function filtreazaIstoricOrarInstant() {
  let fEl = document.getElementById('filtruClientaOrar');
  let fLuna = document.getElementById('filtruLunaOrar');
  let filtruCli = fEl ? fEl.value.toLowerCase().trim() : "";
  let filtruLuna = fLuna ? curataNumeLuna(fLuna.value) : "";
  let tbody = document.getElementById('istoricOrarTbody');
  if (!tbody) return;

  const luniRoNume = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

  let filtrate = (DB.prezente || []).filter(p => {
    if (!p) return false;
    let potrivesteCli = !filtruCli || (p.clienta && p.clienta.toLowerCase() === filtruCli);
    let potrivesteLuna = true;

    if (filtruLuna) {
      let lunaPrezenta = "";
      if (p.data && p.data.indexOf('.') !== -1) {
        let parts = p.data.split('.');
        if (parts.length === 3) {
          let m = parseInt(parts[1], 10);
          if (m >= 1 && m <= 12) lunaPrezenta = luniRoNume[m - 1];
        }
      }
      potrivesteLuna = (lunaPrezenta === filtruLuna);
    }

    return potrivesteCli && potrivesteLuna;
  });

  filtrate.sort((a, b) => {
    let tA = parseazaDataOraRo(a.data, a.ora);
    let tB = parseazaDataOraRo(b.data, b.ora);
    return tB - tA;
  });

  if (filtrate.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888;">${t('noPresenceFound')}</td></tr>`;
    return;
  }
  let html = '';
  filtrate.forEach(item => {
    html += `
      <tr>
        <td><b>${item.data}</b></td>
        <td style="font-weight:700;">${item.ora || '-'}</td>
        <td style="font-weight:700; color:var(--primary);">${item.clienta}</td>
        <td>${item.antrenament || '-'}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function getPillClass(val) {
  if (val === "Confirmata" || val === "Confirmed") return "pill-confirmata";
  if (val === "In asteptare" || val === "Pending") return "pill-asteptare";
  if (val === "Absenta" || val === "Absent") return "pill-absenta";
  return "pill-empty";
}

function randeazaProgramariInstant() {
  let actContainer = document.getElementById('progActiveList');
  let holdContainer = document.getElementById('progHoldList');

  if (actContainer) {
    let actHtml = '';
    (DB.progActive || []).forEach((item, index) => {
      let pCls = getPillClass(item.prezenta);
      let confText = currentLang === 'en' ? 'Confirmed' : 'Confirmata';
      let pendText = currentLang === 'en' ? 'Pending' : 'In asteptare';
      let absText = currentLang === 'en' ? 'Absent' : 'Absenta';
      let mentionPlaceholder = currentLang === 'en' ? 'Mention...' : 'Mențiune...';

      actHtml += `
        <div class="prog-grid-layout prog-row">
          <div class="prog-idx">${index + 1}</div>
          <div class="prog-name">${item.nume}</div>
          <div>
            <select class="pill-select ${pCls}" onchange="schimbaPrezenta(${item.row}, this)">
              <option value="" ${item.prezenta === '' ? 'selected' : ''}>-</option>
              <option value="${confText}" ${item.prezenta === confText || item.prezenta === 'Confirmata' ? 'selected' : ''}>${confText}</option>
              <option value="${pendText}" ${item.prezenta === pendText || item.prezenta === 'In asteptare' ? 'selected' : ''}>${pendText}</option>
              <option value="${absText}" ${item.prezenta === absText || item.prezenta === 'Absenta' ? 'selected' : ''}>${absText}</option>
            </select>
          </div>
          <div>
            <textarea class="prog-mentiuni-textarea" placeholder="${mentionPlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action" onclick="mutaInHold(${item.row})" title="${currentLang === 'en' ? 'Move to Hold' : 'Mută în Hold'}">🗑</button>
          </div>
        </div>
      `;
    });
    actContainer.innerHTML = actHtml || `<div style="padding:10px; color:#888; text-align:center;">${t('noRecords')}</div>`;
  }

  if (holdContainer) {
    let holdHtml = '';
    let pausePlaceholder = currentLang === 'en' ? 'Pause reason...' : 'Motiv pauză...';
    (DB.progHold || []).forEach((item, index) => {
      holdHtml += `
        <div class="prog-grid-layout-hold prog-row hold-row">
          <div class="prog-idx">${index + 1}</div>
          <div class="prog-name">${item.nume}</div>
          <div style="grid-column: 3 / 4;">
            <textarea class="prog-mentiuni-textarea prog-mentiuni-hold" placeholder="${pausePlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action" onclick="stergeProgramareDefinitiv(${item.row})" title="${currentLang === 'en' ? 'Delete permanently' : 'Șterge definitiv'}">🗑</button>
          </div>
        </div>
      `;
    });
    holdContainer.innerHTML = holdHtml || `<div style="padding:10px; color:#888; text-align:center;">${t('noClientsHold')}</div>`;
  }
}

function schimbaPrezenta(row, selectEl) {
  let val = selectEl.value;
  selectEl.className = "pill-select " + getPillClass(val);
  callBackend("actualizeazaCampProgramare", { row: row, col: 3, val: val }, function() {
    showToast(currentLang === 'en' ? "✓ Status updated!" : "✓ Status actualizat!");
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
    showToast(t('toastAddedProg'));
    if (inp) inp.value = '';
    incarcaBazaDateSilencios();
  });
}

function mutaInHold(row) {
  customConfirm(currentLang === 'en' ? "Move to Hold" : "Mutare în Hold", currentLang === 'en' ? "Move client to Hold section?" : "Mut clienta în secțiunea Hold?", function() {
    callBackend("mutaInHold", { row: row }, function() {
      showToast(t('toastMovedHold'));
      incarcaBazaDateSilencios();
    });
  });
}

function stergeProgramareDefinitiv(row) {
  customConfirm(currentLang === 'en' ? "Permanent deletion" : "Ștergere definitivă", currentLang === 'en' ? "Remove this record from Hold?" : "Elimini această înregistrare din Hold?", function() {
    callBackend("stergeRandProgramare", { row: row }, function() {
      showToast(t('toastDeletedRecord'));
      incarcaBazaDateSilencios();
    });
  });
}

function afiseazaFisaClientaInstant() {
  let sel = document.getElementById('selectClientaFisa');
  let container = document.getElementById('detaliiFisa');
  let emptyState = document.getElementById('fisaEmptyState');
  if (!sel || !container) return;
  let nume = sel.value.trim();

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
  
  let progresText = currentLang === 'en' ? `Progress: ${client.efectuate} of ${client.incluse} sessions` : `Progres: ${client.efectuate} din ${client.incluse} ședințe`;
  document.getElementById('fisaProgres').innerText = `${client.efectuate} ${currentLang === 'en' ? 'of' : 'din'} ${client.incluse}`;

  let procent = client.incluse > 0 ? Math.round((client.efectuate / client.incluse) * 100) : 0;
  if (procent > 100) procent = 100;
  document.getElementById('graficBara').style.width = procent + '%';
  document.getElementById('graficProcent').innerText = procent + '%';
  document.getElementById('graficProgresText').innerText = progresText;
  document.getElementById('fisaTipAbonamentAfisat').innerText = client.tipAbonament;

  let badge = document.getElementById('fisaStatusBadge');
  let stLower = (client.status || '').toLowerCase();
  let statusText = client.status;
  if (stLower === 'activ' || stLower === 'active') {
    badge.innerHTML = `<span class="badge badge-activ">${currentLang === 'en' ? 'Active' : 'Activ'}</span>`;
  } else if (stLower === 'arhivat' || stLower === 'archived') {
    badge.innerHTML = `<span class="badge badge-arhivat">${currentLang === 'en' ? 'Archived' : 'Arhivat'}</span>`;
  } else {
    badge.innerHTML = `<span class="badge badge-expirat">${statusText}</span>`;
  }

  let btnArch = document.getElementById('btnArhivareToggle');
  if (btnArch) {
    if (stLower === 'arhivat' || stLower === 'archived') {
      btnArch.innerText = t('reactivateBtn');
      btnArch.style.color = '#15803d'; btnArch.style.borderColor = '#86efac'; btnArch.style.background = '#f0fdf4';
    } else {
      btnArch.innerText = t('archiveBtn');
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

  filtreazaIstoricFisaInstant();
}

function filtreazaIstoricFisaInstant() {
  let sel = document.getElementById('selectClientaFisa');
  let istoricDiv = document.getElementById('istoricPrezenteList');
  let fLuna = document.getElementById('filtruLunaFisa');
  if (!sel || !istoricDiv) return;
  let nume = sel.value.trim();
  let filtruLuna = fLuna ? curataNumeLuna(fLuna.value) : "";

  const luniRoNume = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

  let prezenteClienta = (DB.prezente || []).filter(p => {
    if (!p || !p.clienta || p.clienta.toLowerCase() !== nume.toLowerCase()) return false;
    
    if (filtruLuna) {
      let lunaPrezenta = "";
      if (p.data && p.data.indexOf('.') !== -1) {
        let parts = p.data.split('.');
        if (parts.length === 3) {
          let m = parseInt(parts[1], 10);
          if (m >= 1 && m <= 12) lunaPrezenta = luniRoNume[m - 1];
        }
      }
      return lunaPrezenta === filtruLuna;
    }
    return true;
  });

  prezenteClienta.sort((a, b) => {
    let tA = parseazaDataOraRo(a.data, a.ora);
    let tB = parseazaDataOraRo(b.data, b.ora);
    return tB - tA;
  });

  if (prezenteClienta.length === 0) {
    istoricDiv.innerHTML = `<div style="color:var(--text-muted);">${t('noPresenceYet')}</div>`;
  } else {
    let h = '';
    prezenteClienta.forEach(p => {
      h += `<div style="padding:5px 0; border-bottom:1px solid var(--border);">• <b>${p.data}</b> (${p.ora || '-'}) - ${p.antrenament || '-'}</div>`;
    });
    istoricDiv.innerHTML = h;
  }
}

function salveazaEditareClienta() {
  let sel = document.getElementById('selectClientaFisa');
  let numeVechi = sel ? sel.value.trim() : "";
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
    showToast(t('toastDataUpdated'));
    incarcaBazaDateSilencios(res && res.numeNou ? res.numeNou : numeNou);
  });
}

function creeazaClientaNouaDirect() {
  let inp = document.getElementById('nouNumeClienta');
  let nume = inp ? inp.value.trim() : "";
  let tip = document.getElementById('nouTipAbonament').value;
  if (!nume) { showToast(currentLang === 'en' ? "Enter name!" : "Introdu numele!", "error"); return; }

  callBackend("adaugaClientaDirect", { nume: nume, tip: tip }, function() {
    showToast(t('toastClientAdded'));
    if (inp) inp.value = '';
    incarcaBazaDateSilencios();
  });
}

function comutaArhivareClienta() {
  let sel = document.getElementById('selectClientaFisa');
  if (!sel) return;
  let nume = sel.value.trim();
  if (!nume) return;
  let client = (DB.clienti || []).find(c => c && c.nume.toLowerCase() === nume.toLowerCase());
  if (!client) return;

  let esteArhivat = (client.status || '').toLowerCase() === 'arhivat' || (client.status || '').toLowerCase() === 'archived';
  let nouStatus = esteArhivat ? "Activ" : "Arhivat";

  let confirmTitle = esteArhivat ? (currentLang === 'en' ? "Reactivation" : "Reactivare") : (currentLang === 'en' ? "Archiving" : "Arhivare");
  let confirmText = esteArhivat ? 
    (currentLang === 'en' ? `Reactivate client ${nume}?` : `Reactivezi clienta ${nume}?`) : 
    (currentLang === 'en' ? `Archive client ${nume} from lists?` : `Arhivezi clienta ${nume} din liste?`);

  customConfirm(confirmTitle, confirmText, function() {
    callBackend("seteazaStatusClienta", { nume: nume, statusNou: nouStatus }, function() {
      showToast(esteArhivat ? t('toastReactivated') : t('toastArchived'));
      incarcaBazaDateSilencios();
    });
  });
}

function adaugaZile(nrZile) {
  let sel = document.getElementById('selectClientaFisa');
  if (!sel) return;
  let nume = sel.value.trim();
  if (!nume) return;
  callBackend("prelungesteValabilitate", { nume: nume, zile: nrZile, dataManuala: null }, function(res) {
    showToast(t('toastExtended') + res.nouaData);
    incarcaBazaDateSilencios(nume);
  });
}

function seteazaDataManuala() {
  let sel = document.getElementById('selectClientaFisa');
  let inp = document.getElementById('dataPrelungireManuala');
  if (!sel || !inp) return;
  let nume = sel.value.trim();
  let d = inp.value;
  if (!nume || !d) return;
  callBackend("prelungesteValabilitate", { nume: nume, zile: 0, dataManuala: d }, function(res) {
    showToast(t('toastValiditySet') + res.nouaData);
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
  let filtru = fEl ? fEl.value.toLowerCase().trim() : "";
  let filtruLuna = fLuna ? curataNumeLuna(fLuna.value) : "";
  let tbody = document.getElementById('incasariIstoricTbody');
  if (!tbody) return;

  let filtrate = (DB.incasari || []).filter(i => {
    if (!i) return false;
    let potrivesteClienta = !filtru || (i.clienta && i.clienta.toLowerCase() === filtru);
    let potrivesteLuna = true;

    if (filtruLuna) {
      let lunaInc = curataNumeLuna(i.luna);
      potrivesteLuna = (lunaInc === filtruLuna);
    }

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
  if (elTotalCount) {
    let countText = filtrate.length === 1 ? t('paymentFound') : t('paymentsFound');
    elTotalCount.innerText = `${filtrate.length} ${countText}`;
  }

  if (filtrate.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">${t('noRecords')}</td></tr>`;
    return;
  }

  let html = '';
  filtrate.forEach(item => {
    let esteGol = !item.suma || item.suma === "-" || item.suma.trim() === "";
    let sumaStil = esteGol ? 'color:var(--text-muted); font-weight:700;' : 'color:#27ae60; font-weight:700;';
    
    let metodaContinut = (item.metoda && item.metoda.trim() !== "-" && item.metoda.trim() !== "") 
      ? item.metoda 
      : '<span class="dash-placeholder">-</span>';
      
    let tipContinut = (item.tip && item.tip.trim() !== "-" && item.tip.trim() !== "") 
      ? item.tip 
      : '<span class="dash-placeholder">-</span>';

    let itemJson = encodeURIComponent(JSON.stringify(item));

    html += `
      <tr class="incasare-row-clickable" onclick="deschideModalEditareIncasare('${itemJson}')" title="${currentLang === 'en' ? 'Click to edit this payment' : 'Apasă pentru a edita această plată'}">
        <td style="font-weight:700;">${item.data}</td>
        <td style="font-weight:700; color:var(--primary);">${item.clienta}</td>
        <td style="${sumaStil}">${item.suma}</td>
        <td style="text-align:center;">${metodaContinut}</td>
        <td>${tipContinut}</td>
        <td style="text-align:center; color:var(--text-muted); font-size:0.8rem;">✏️</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// FLAG BLOCARE DUBLU-CLICK LA SALVARE ÎNCASARE
let esteIncasareInCurs = false;

function salveazaIncasare() {
  if (esteIncasareInCurs) return;

  let inp = document.getElementById('incasareNume');
  let nume = inp ? inp.value.trim() : "";
  let tip = document.getElementById('incasareTip').value;
  let suma = getSumaSelectata();
  let metoda = document.getElementById('incasareMetoda').value;
  let dataPlata = document.getElementById('incasareDataPlata').value;
  let dataStart = document.getElementById('incasareDataStart').value;

  if (!nume) {
    showToast(currentLang === 'en' ? "Complete client name!" : "Completează numele clientei!", "error");
    if (inp) inp.focus();
    return;
  }
  if (!tip || tip === "-" || tip === "") {
    showToast(currentLang === 'en' ? "Select subscription type!" : "Selectează tipul abonamentului!", "error");
    document.getElementById('incasareTip').focus();
    return;
  }
  if (suma === "" || suma === null || isNaN(Number(suma)) || Number(suma) < 0) {
    showToast(currentLang === 'en' ? "Complete payment amount!" : "Completează suma plății!", "error");
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
    showToast(currentLang === 'en' ? "Select payment method!" : "Selectează metoda de plată!", "error");
    document.getElementById('incasareMetoda').focus();
    return;
  }
  if (!dataPlata) {
    showToast(currentLang === 'en' ? "Select payment date!" : "Selectează data plății!", "error");
    document.getElementById('incasareDataPlata').focus();
    return;
  }
  if (!dataStart) {
    showToast(currentLang === 'en' ? "Select subscription start date!" : "Selectează data de start a abonamentului!", "error");
    document.getElementById('incasareDataStart').focus();
    return;
  }

  // Blocare buton pentru a preveni salvarea dublă
  esteIncasareInCurs = true;
  let btnSubmit = document.getElementById('submitAbonamentBtn');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = t('paySavingBtn');
    btnSubmit.style.opacity = '0.65';
    btnSubmit.style.pointerEvents = 'none';
  }

  callBackend("inregistreazaAbonament", {
    nume: nume, tip: tip, suma: suma, metoda: metoda, dataPlata: dataPlata, dataStart: dataStart
  }, function() {
    showToast(t('toastSubSaved'));
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

    // Deblocare buton salvare
    esteIncasareInCurs = false;
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = t('paySubmitBtn');
      btnSubmit.style.opacity = '';
      btnSubmit.style.pointerEvents = '';
    }
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
    showToast(currentLang === 'en' ? "Complete client name!" : "Completează numele clientei!", "error");
    document.getElementById('editIncClienta').focus();
    return;
  }
  if (!dataStr) {
    showToast(currentLang === 'en' ? "Complete payment date!" : "Completează data plății!", "error");
    document.getElementById('editIncData').focus();
    return;
  }
  if (suma === "" || suma === null || isNaN(Number(suma)) || Number(suma) < 0) {
    showToast(currentLang === 'en' ? "Complete payment amount!" : "Completează suma plății!", "error");
    document.getElementById('editIncSuma').focus();
    return;
  }
  if (!metoda || metoda === "-" || metoda === "") {
    showToast(currentLang === 'en' ? "Select payment method!" : "Selectează metoda de plată!", "error");
    document.getElementById('incasareMetoda').focus();
    return;
  }
  if (!tip || tip === "-" || tip === "") {
    showToast(currentLang === 'en' ? "Select subscription type!" : "Selectează tipul abonamentului!", "error");
    document.getElementById('editIncTip').focus();
    return;
  }

  callBackend("actualizeazaIncasare", {
    row: Number(row), clienta: clienta, data: dataStr, suma: suma, metoda: metoda, tip: tip
  }, function() {
    showToast(t('toastPaymentUpdated'));
    inchideModalEditareIncasare();
    incarcaBazaDateSilencios();
  });
}

function deschideMeniuLateral() {
  let drawer = document.getElementById('appDrawer');
  let backdrop = document.getElementById('appDrawerBackdrop');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
}

function inchideMeniuLateral() {
  let drawer = document.getElementById('appDrawer');
  let backdrop = document.getElementById('appDrawerBackdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

// --- GESTIUNE TEMA SISTEM ÎN TIMP REAL ---
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function aplicaTemaSistemDinamica() {
  if (localStorage.getItem('beatrix_theme') === 'system') {
    if (systemDarkQuery.matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}

systemDarkQuery.addEventListener('change', () => {
  aplicaTemaSistemDinamica();
});

function seteazaTema(optiune, silent = false) {
  localStorage.setItem('beatrix_theme', optiune);
  
  ['themeBtnLight', 'themeBtnDark', 'themeBtnSystem'].forEach(id => {
    let btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });

  if (optiune === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    let btn = document.getElementById('themeBtnLight');
    if (btn) btn.classList.add('active');
  } else if (optiune === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    let btn = document.getElementById('themeBtnDark');
    if (btn) btn.classList.add('active');
  } else {
    aplicaTemaSistemDinamica();
    let btn = document.getElementById('themeBtnSystem');
    if (btn) btn.classList.add('active');
  }
  if (!silent) {
    showToast(t('toastThemeUpdated'));
  }
}

function seteazaLimba(lang, silent = false) {
  currentLang = lang;
  localStorage.setItem('beatrix_lang', lang);
  let btnRo = document.getElementById('langBtnRo');
  let btnEn = document.getElementById('langBtnEn');
  if (btnRo) btnRo.classList.toggle('active', lang === 'ro');
  if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  
  aplicaTraduceriInterfataStatic();
  actualizeazaBaraZile();
  populeazaSelectoriCliente();
  populeazaSelectorLuni();
  randeazaOrarInstant();
  randeazaProgramariInstant();
  filtreazaIstoricIncasariInstant();
  filtreazaIstoricOrarInstant();
  filtreazaIstoricFisaInstant();
  
  let titluTabCurent = currentLang === 'en' ? tabsOrder[tabIndexCurent].titleEn : tabsOrder[tabIndexCurent].titleRo;
  actualizeazaHeaderVisual(tipTabCurent, titluTabCurent);

  if (!silent) {
    showToast(lang === 'ro' ? t('toastLangRo') : t('toastLangEn'));
  }
}

// Inițializare temă și limbă salvate la pornire (silențios, fără toast)
(function() {
  let temaSalvata = localStorage.getItem('beatrix_theme') || 'system';
  seteazaTema(temaSalvata, true);
  let langSalvata = localStorage.getItem('beatrix_lang') || 'ro';
  seteazaLimba(langSalvata, true);
})();
