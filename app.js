// --- CONFIGURARE SUPABASE ---
// Rulat local pe serverul de dezvoltare (localhost / 127.0.0.1, port 5500), aplicația folosește proiectul de staging,
// ca testele să nu scrie în producție. Portul contează: o aplicație Android împachetată (ex. Capacitor) rulează tot pe localhost.
// Cât timp STAGING_URL / STAGING_KEY sunt goale, local rămâne pe producție.
const STAGING_URL = "https://oggzidgkvzopffeizxev.supabase.co";
const STAGING_KEY = "sb_publishable_grA4R7N_UkNMHlMmN6HfKw_4YqFFnPZ";
const ESTE_LOCAL = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.port === '5500';
const FOLOSESTE_STAGING = ESTE_LOCAL && !!STAGING_URL && !!STAGING_KEY;
if (ESTE_LOCAL) console.info(FOLOSESTE_STAGING ? '[B-Fit] Mediu: STAGING' : '[B-Fit] ATENȚIE: local, dar pe baza de PRODUCȚIE (STAGING_URL gol)');
const SUPABASE_URL = FOLOSESTE_STAGING ? STAGING_URL : "https://qfnhluyczxugyqkbyvmc.supabase.co";
const SUPABASE_KEY = FOLOSESTE_STAGING ? STAGING_KEY : "sb_publishable_rikiPkqUDuSPVYdZyGR4Vw_ed371Huz";
let USE_SUPABASE = true;
const URL_APLICATIE = FOLOSESTE_STAGING ? location.origin + "/" : "https://app.beatrixyvett.com/";
// Worker-ul Cloudflare pentru pozele de progres (R2); gol = pozele nu apar în aplicație (pe staging nu există)
const URL_POZE = FOLOSESTE_STAGING ? "" : "https://bfit-poze.beatrixyvett-bako.workers.dev";
// Fișierele atașate la feedback: același Worker (R2); ?test=1 = Worker-ul verifică sesiunea pe proiectul de staging
const URL_FEEDBACK = "https://bfit-poze.beatrixyvett-bako.workers.dev/feedback" + (FOLOSESTE_STAGING ? "?test=1" : "");
// Pozele antrenamentelor proprii: același Worker, și pe staging (?test=1, cheile stau separat, sub test/antr/)
const URL_POZE_ANTR = "https://bfit-poze.beatrixyvett-bako.workers.dev";
// Citit înainte ca Supabase să curețe adresa: venim din emailul „Am uitat parola”
const ESTE_LINK_RESETARE_PAROLA = typeof window !== 'undefined' && /type=recovery/.test(window.location.hash + window.location.search);
const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Erorile JavaScript de pe telefoanele utilizatorilor se salvează în tabelul erori_aplicatie (citit doar din SQL editor).
// O eroare se trimite o singură dată pe deschidere, cel mult 10 pe deschidere.
const eroriTrimise = new Set();
function raporteazaEroare(mesaj, sursa) {
  mesaj = String(mesaj || '').trim();
  if (!supabaseClient || !mesaj || eroriTrimise.has(mesaj) || eroriTrimise.size >= 10) return;
  eroriTrimise.add(mesaj);
  let ecran = '';
  try { ecran = tipTabCurent; } catch (e) {}
  const versiune = ((document.querySelector('script[src*="app.js"]')?.getAttribute('src') || '').match(/fitFinal(\d+)/) || [])[1] || '';
  supabaseClient.rpc('raporteaza_eroare', { p_mesaj: mesaj, p_sursa: sursa || '', p_ecran: ecran, p_versiune: versiune }).then(() => {}, () => {});
}
if (typeof window !== 'undefined') {
  window.addEventListener('error', e => {
    if (!e.message || e.message === 'Script error.') return; // resurse care nu s-au încărcat; erori din scripturi externe, fără detalii
    raporteazaEroare(e.message, (e.filename || '').split('/').pop().split('?')[0] + ':' + (e.lineno || 0) + ':' + (e.colno || 0));
  });
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason;
    raporteazaEroare(r && r.message ? r.message : r, r && r.stack ? String(r.stack).split('\n')[1]?.trim() : 'promise');
  });
}

let utilizatorCurent = null;
let rolUtilizator = 'antrenor'; // 'antrenor' | 'clienta' (din tabelul profiles)
let tipModAuth = 'login'; // 'login' sau 'signup'
let deconectareInCurs = false; // la ieșire ecranul doar se estompează până la reîncărcare (fără login suprapus, meniu animat, scrollbar)

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

let DB = {
  clienti: [],
  orarSloturi: [],
  progActive: [],
  progHold: [],
  incasari: [],
  prezente: [],
  planuri: []
};

let tabIndexCurent = 0;
let tipTabCurent = 'orar';
let tabAnteriorPlan = 'orar';
const tabsOrder = [
  { id: 'tabOrar', titleRo: 'Orar Săptămânal', titleEn: 'Weekly Schedule', tip: 'orar', idx: 0 },
  { id: 'tabProgramari', titleRo: 'Confirmări', titleEn: 'Check-in', tip: 'prog', idx: 1 },
  { id: 'tabFisa', titleRo: 'Fișă Client', titleEn: 'Client Profile', tip: 'fisa', idx: 2 },
  { id: 'tabIncasari', titleRo: 'Încasări', titleEn: 'Payments', tip: 'incasari', idx: 3 }
];

// DICȚIONAR BILINGV (I18N)
const i18n = {
  ro: {
    appTitle: "Orar Săptămânal",
    navOrar: "Orar",
    navProg: "Confirmări",
    navFisa: "Fișă",
    navIncasari: "Încasări",
    pastWeek: "Săpt. Trecută",
    today: "Azi",
    nextWeek: "Săpt. Viitoare",
    pastWeekState: "Istoric (Săptămână trecută)",
    futureWeekState: "Planificat (Săptămână viitoare)",
    endScheduleTitle: "Ziua-i gata, caloriile-s topite!",
    endScheduleSubtitle: "Antrenorul a supraviețuit și azi!",
    addExtraHour: "Oră suplimentară",
    addBtn: "Adaugă",
    historyOrarTitle: "Istoric Prezențe",
    filterClient: "Filtrează după client:",
    filterMonth: "Filtrează după lună:",
    allClients: "Toți clienții",
    allMonths: "Toate lunile",
    noPresence: "Nici o prezență înregistrată în această zi din trecut.",
    noPresenceFound: "Nici o prezență găsită.",
    addClientPlaceholder: "Adaugă client",
    activeSection: "Activ",
    holdSection: "Hold",
    noRecords: "Nici o înregistrare",
    noClientsHold: "Niciun client în Hold",
    addNewClientTitle: "Adaugă un Client Nou în Aplicație",
    clientNamePlaceholder: "Nume și prenume client",
    saveClientBtn: "Salvează Clientul",
    selectClientLabel: "SELECTEAZĂ CLIENTUL",
    showArchived: "Arată și arhivate",
    selectClientOption: "Alege clientul...",
    emptyStateTitle: "Niciun client selectat",
    emptyStateDesc: "Alege un client din lista de mai sus pentru a-i vizualiza progresul, abonamentul și istoricul.",
    sessionsRemaining: "ȘEDINȚE RĂMASE",
    statusLabel: "STATUS",
    validityLabel: "VALABILITATE PÂNĂ LA",
    sessionsDone: "ȘEDINȚE EFECTUATE",
    editClientTitle: "Editează / Ajustează Datele Clientului",
    renameClientLabel: "Nume Client (Redenumește peste tot)",
    subTypeLabel: "Tip Abonament",
    startDateLabel: "Dată Start",
    expDateLabel: "Dată Expirare",
    includedLabel: "Incluse",
    doneLabel: "Efectuate",
    remainingLabel: "Rămase",
    saveChangesBtn: "Salvează Modificările",
    extendValidityTitle: "Prelungește valabilitatea",
    setBtn: "Setează",
    archiveBtn: "Arhivează / Ascunde din Liste",
    reactivateBtn: "Reactivează Clientul (Arată în Liste)",
    recentHistoryTitle: "Istoric Prezențe",
    noPresenceYet: "Nici o prezență înregistrată încă.",
    newPaymentTitle: "Înregistrare Plată Nouă",
    clientNameIncPlaceholder: "Alege din listă sau scrie nume nou",
    selectSubPlaceholder: "Alege tip abonament",
    sumLabel: "Sumă",
    sumPresetPlaceholder: "Suma",
    otherSum: "Altă sumă...",
    paymentMethodLabel: "Metodă Plată",
    paymentMethodPlaceholder: "Metoda Plata",
    payDateLabel: "Dată Plată",
    payStartLabel: "Dată Start",
    paySubmitBtn: "Salvează încasarea",
    paySavingBtn: "Se salvează...",
    paymentHistoryTitle: "Istoric Încasări",
    totalPaymentsLabel: "Total Încasări",
    paymentsFound: "plăți găsite",
    paymentFound: "plată găsită",
    themeTitle: "Temă",
    lightTheme: "Luminos",
    darkTheme: "Întunecat",
    systemTheme: "Sistem",
    accentTitle: "Culoare",
    accentPetrol: "Petrol",
    accentBlue: "Albastru",
    accentRed: "Roșu",
    accentGreen: "Verde",
    accentGraphite: "Grafit",
    accentMov: "Mov",
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
    toastClientAdded: "✓ Client adăugat!",
    toastReactivated: "✓ Client reactivat!",
    toastArchived: "✓ Client arhivat!",
    toastExtended: "✓ Prelungit până la ",
    toastValiditySet: "✓ Valabilitate setată la ",
    toastSubSaved: "✓ Abonament & Încasare salvate!",
    toastPaymentUpdated: "✓ Încasare actualizată!",
    confirmTitle: "Confirmare",
    cancelBtn: "Renunță",
    confirmBtn: "Confirmă",
    editPaymentTitle: "Editare Încasare",
    saveBtn: "Salvează",

    // Plan de Antrenament
    workoutPlanTitle: "Plan de Antrenament",
    drawerWorkoutDesc: "Programe, export PDF, trimitere la clienți",
    planSelectLabel: "ALEGE PLAN",
    btnSavePlan: "Salvează",
    btnPreviewPdfMode: "Mod PDF",
    btnEditMode: "Editare",
    btnSharePlan: "Distribuie",
    toastPlanSaved: "✓ Planul de antrenament a fost salvat!",
    toastPlanDeleted: "✓ Planul a fost șters!",
    toastLinkCopied: "✓ Link copiat în clipboard!",
    toastTextCopied: "✓ Antrenament copiat ca text!",
    toastPdfGenerating: "Se generează PDF-ul...",

    authSubtitleLogin: "Antrenamente, programări și progres",
    authSubtitleSignup: "Creează un cont nou B-Fit",
    authTabLogin: "Intră în cont",
    authTabSignup: "Creează cont",
    authEmailLabel: "Email",
    authPasswordLabel: "Parolă",
    authSubmitBtnLogin: "Intră în cont",
    authSubmitBtnSignup: "Creează cont",
    authMagicLinkBtn: "Primește un link pe email",
    authDividerOr: "sau",
    authGoogleBtn: "Conectare cu Google",
    authProcessing: "Se procesează...",
    authFillEmailPass: "Te rugăm să completezi email-ul și parola!",
    authFillEmailOnly: "Te rugăm să introduci adresa de email!",
    authFillPassOnly: "Te rugăm să introduci parola!",
    authInvalidEmailFormat: "Adresa de email introdusă nu este validă!",
    authLoginSuccess: "✓ Conectat cu succes!",
    authSignupSuccess: "✓ Cont creat și conectat!",
    authSignupCheckEmail: "Cont creat! Verifică email-ul pentru confirmare.",
    authMagicLinkSent: "✓ Link-ul de conectare a fost trimis pe email!",
    authLogoutConfirmTitle: "Deconectare",
    authLogoutConfirmText: "Sigur vrei să ieși din cont?",

    authErrInvalidCreds: "Date de autentificare incorecte (email sau parolă greșită).",
    authErrEmailNotConfirmed: "Adresa de email nu a fost încă confirmată.",
    authErrUserExists: "Există deja un cont înregistrat cu această adresă de email.",
    authErrPassLength: "Parola trebuie să aibă cel puțin 8 caractere.",
    authErrSamePassword: "Parola nouă trebuie să fie diferită de cea actuală.",
    authErrRateLimit: "Prea multe încercări. Te rugăm să aștepți câteva momente.",
    authErrNetwork: "Eroare de conexiune la rețea. Verifică internetul.",
    authErrGeneric: "Eroare la autentificare. Verifică datele introduse și reîncearcă."
  },
  en: {
    appTitle: "Weekly Schedule",
    navOrar: "Schedule",
    navProg: "Check-in",
    navFisa: "Profile",
    navIncasari: "Payments",
    pastWeek: "Past Week",
    today: "Today",
    nextWeek: "Next Week",
    pastWeekState: "History (Past week)",
    futureWeekState: "Planned (Next week)",
    endScheduleTitle: "Day is done, calories burned!",
    endScheduleSubtitle: "The coach survived today too!",
    addExtraHour: "Extra hour",
    addBtn: "Add",
    historyOrarTitle: "Attendance History",
    filterClient: "Filter by client:",
    filterMonth: "Filter by month:",
    allClients: "All clients",
    allMonths: "All months",
    noPresence: "No attendance recorded on this past day.",
    noPresenceFound: "No attendance found.",
    addClientPlaceholder: "Add client",
    activeSection: "Active",
    holdSection: "Hold",
    noRecords: "No records",
    noClientsHold: "No clients in Hold",
    addNewClientTitle: "Add New Client to App",
    clientNamePlaceholder: "Client Full Name",
    saveClientBtn: "Save Client",
    selectClientLabel: "SELECT CLIENT",
    showArchived: "Show archived",
    selectClientOption: "Choose client...",
    emptyStateTitle: "No client selected",
    emptyStateDesc: "Choose a client from the list above to view their progress, subscription, and history.",
    sessionsRemaining: "SESSIONS LEFT",
    statusLabel: "STATUS",
    validityLabel: "VALID UNTIL",
    sessionsDone: "SESSIONS DONE",
    editClientTitle: "Edit / Adjust Client Data",
    renameClientLabel: "Client Name (Rename everywhere)",
    subTypeLabel: "Subscription Type",
    startDateLabel: "Start Date",
    expDateLabel: "Expiration Date",
    includedLabel: "Included",
    doneLabel: "Done",
    remainingLabel: "Left",
    saveChangesBtn: "Save Changes",
    extendValidityTitle: "Extend validity",
    setBtn: "Set",
    archiveBtn: "Archive / Hide from lists",
    reactivateBtn: "Reactivate Client (Show in lists)",
    recentHistoryTitle: "Attendance History",
    noPresenceYet: "No attendance recorded yet.",
    newPaymentTitle: "Register New Payment",
    clientNameIncPlaceholder: "Choose from list or type new name",
    selectSubPlaceholder: "Choose subscription type",
    sumLabel: "Amount",
    sumPresetPlaceholder: "Amount",
    otherSum: "Other amount...",
    paymentMethodLabel: "Payment Method",
    paymentMethodPlaceholder: "Payment Method",
    payDateLabel: "Payment Date",
    payStartLabel: "Start Date",
    paySubmitBtn: "Save payment",
    paySavingBtn: "Saving...",
    paymentHistoryTitle: "Payment History",
    totalPaymentsLabel: "Total Payments",
    paymentsFound: "payments found",
    paymentFound: "payment found",
    themeTitle: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    systemTheme: "System",
    accentTitle: "Color",
    accentPetrol: "Teal",
    accentBlue: "Blue",
    accentRed: "Red",
    accentGreen: "Green",
    accentGraphite: "Graphite",
    accentMov: "Violet",
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
    editPaymentTitle: "Edit Payment",
    saveBtn: "Save",

    // Workout Plan
    workoutPlanTitle: "Workout Plan",
    drawerWorkoutDesc: "Programs, PDF export & client share",
    planSelectLabel: "CHOOSE PLAN",
    btnSavePlan: "Save",
    btnPreviewPdfMode: "PDF Mode",
    btnEditMode: "Edit",
    btnSharePlan: "Share",
    toastPlanSaved: "✓ Workout plan saved!",
    toastPlanDeleted: "✓ Workout plan deleted!",
    toastLinkCopied: "✓ Link copied to clipboard!",
    toastTextCopied: "✓ Workout copied as text!",
    toastPdfGenerating: "Generating PDF...",

    authSubtitleLogin: "Workouts, bookings and progress",
    authSubtitleSignup: "Create a new B-Fit account",
    authTabLogin: "Log In",
    authTabSignup: "Create Account",
    authEmailLabel: "Email",
    authPasswordLabel: "Password",
    authSubmitBtnLogin: "Log In",
    authSubmitBtnSignup: "Create Account",
    authMagicLinkBtn: "Email me a sign-in link",
    authDividerOr: "or",
    authGoogleBtn: "Sign in with Google",
    authProcessing: "Processing...",
    authFillEmailPass: "Please fill in email and password!",
    authFillEmailOnly: "Please enter your email address!",
    authFillPassOnly: "Please enter your password!",
    authInvalidEmailFormat: "Please enter a valid email address!",
    authLoginSuccess: "✓ Connected successfully!",
    authSignupSuccess: "✓ Account created and connected!",
    authSignupCheckEmail: "Account created! Please check your email for confirmation.",
    authMagicLinkSent: "✓ The login link has been sent to your email!",
    authLogoutConfirmTitle: "Log Out",
    authLogoutConfirmText: "Are you sure you want to log out?",

    authErrInvalidCreds: "Invalid login credentials (wrong email or password).",
    authErrEmailNotConfirmed: "Email address has not been confirmed yet.",
    authErrUserExists: "A user with this email address already exists.",
    authErrPassLength: "Password should be at least 8 characters.",
    authErrSamePassword: "New password must be different from the current one.",
    authErrRateLimit: "Too many attempts. Please wait a moment and try again.",
    authErrNetwork: "Network error. Please check your internet connection.",
    authErrGeneric: "Authentication error. Please check your details and try again."
  }
};

let currentLang = localStorage.getItem('beatrix_lang') || 'ro';

function t(key) {
  if (i18n[currentLang] && i18n[currentLang][key] !== undefined) {
    return i18n[currentLang][key];
  }
  return i18n['ro'][key] || key;
}

// Text scurt în limba curentă, pentru șabloanele HTML generate din JS
function tr(ro, en) {
  return currentLang === 'en' ? en : ro;
}

// Valori salvate în română (abonamente, statusuri, luni) afișate în engleză; valoarea din bază rămâne aceeași
const TRADUCERI_VALORI_EN = {
  '8 sedinte': '8 sessions', '10 sedinte': '10 sessions', '12 sedinte': '12 sessions', '16 sedinte': '16 sessions',
  '16 sedinte 1:1': '16 sessions 1:1', 'sedinta individuala': 'Single session', 'sedinta gratuita': 'Free session',
  'activ': 'Active', 'finalizat': 'Completed', 'expirat': 'Expired', 'arhivat': 'Archived', 'înghețat': 'Frozen', 'inghetat': 'Frozen',
  'în așteptare': 'Pending', 'sărit': 'Skipped', 'transfer bancar': 'Bank transfer',
  // Tipurile implicite de antrenament (în bază rămâne textul românesc)
  'fesieri': 'Glutes', 'picioare': 'Legs', 'spate + brate': 'Back + Arms', 'umeri + piept': 'Shoulders + Chest',
  'abdomen': 'Abs', 'fesieri + abdomen': 'Glutes + Abs', 'spate + abdomen': 'Back + Abs', 'piept + abdomen': 'Chest + Abs', 'cardio + abdomen': 'Cardio + Abs',
  'ianuarie': 'January', 'februarie': 'February', 'martie': 'March', 'aprilie': 'April', 'mai': 'May', 'iunie': 'June',
  'iulie': 'July', 'august': 'August', 'septembrie': 'September', 'octombrie': 'October', 'noiembrie': 'November', 'decembrie': 'December'
};

function traduceValoare(text) {
  if (currentLang !== 'en' || !text) return text;
  return TRADUCERI_VALORI_EN[String(text).trim().toLowerCase()] || text;
}

// Textele fixe din index.html marcate cu data-en / data-en-placeholder / data-en-title / data-en-aria,
// plus opțiunile din liste cu valori românești. Originalul românesc se păstrează în data-ro*.
function aplicaTraduceriAtribute() {
  const perechi = [['en', 'ro', null], ['enPlaceholder', 'roPlaceholder', 'placeholder'], ['enTitle', 'roTitle', 'title'], ['enAria', 'roAria', 'aria-label']];
  document.querySelectorAll('[data-en],[data-en-placeholder],[data-en-title],[data-en-aria]').forEach(el => {
    perechi.forEach(([cheieEn, cheieRo, atribut]) => {
      if (el.dataset[cheieEn] === undefined) return;
      if (el.dataset[cheieRo] === undefined) el.dataset[cheieRo] = atribut ? (el.getAttribute(atribut) || '') : el.textContent.trim();
      const valoare = currentLang === 'en' ? el.dataset[cheieEn] : el.dataset[cheieRo];
      if (atribut) el.setAttribute(atribut, valoare); else el.textContent = valoare;
    });
  });
  document.querySelectorAll('select option').forEach(opt => {
    if (opt.dataset.en !== undefined) return;
    if (opt.dataset.ro === undefined) {
      if (!TRADUCERI_VALORI_EN[opt.textContent.trim().toLowerCase()]) return;
      opt.dataset.ro = opt.textContent.trim();
    }
    opt.textContent = currentLang === 'en' ? traduceValoare(opt.dataset.ro) : opt.dataset.ro;
  });
}

function comutaVizibilitateParola(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const esteAscunsa = input.type === 'password';
  input.type = esteAscunsa ? 'text' : 'password';

  if (btnEl) {
    const eyeOpen = btnEl.querySelector('.eye-open');
    const eyeClosed = btnEl.querySelector('.eye-closed');
    if (eyeOpen) eyeOpen.style.display = esteAscunsa ? 'none' : 'block';
    if (eyeClosed) eyeClosed.style.display = esteAscunsa ? 'block' : 'none';
  }
}

function actualizeazaStareNoScrollBody() {
  const authOverlay = document.getElementById('authScreenOverlay');
  const drawer = document.getElementById('appDrawer');
  const esteAuthVizibil = authOverlay && !authOverlay.classList.contains('auth-hidden');
  const esteDrawerDeschis = drawer && drawer.classList.contains('open');

  if (esteAuthVizibil || esteDrawerDeschis) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
}

function localizeazaEroareAuth(errMessage) {
  if (!errMessage) return t('authErrGeneric');
  const msg = errMessage.toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("wrong password") || msg.includes("user not found")) {
    return t('authErrInvalidCreds');
  }
  if (msg.includes("email not confirmed")) {
    return t('authErrEmailNotConfirmed');
  }
  if (msg.includes("user already registered") || msg.includes("already exists") || msg.includes("already been registered")) {
    return t('authErrUserExists');
  }
  // Înaintea verificării de lungime: mesajul Supabase conține și el „password should be”
  if (msg.includes("different from the old password") || msg.includes("same_password")) {
    return t('authErrSamePassword');
  }
  if (msg.includes("at least 6 characters") || msg.includes("password should be") || msg.includes("weak_password") || msg.includes("weak password")) {
    return t('authErrPassLength');
  }
  if (msg.includes("valid email") || msg.includes("unable to validate email") || msg.includes("invalid format") || msg.includes("invalid email")) {
    return t('authInvalidEmailFormat');
  }
  if (msg.includes("missing email") || msg.includes("provide either an email")) {
    return t('authFillEmailPass');
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("security purposes")) {
    return t('authErrRateLimit');
  }
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return t('authErrNetwork');
  }
  if (msg.includes("captcha")) {
    return tr('Verificarea anti-robot nu a reușit. Reîncearcă.', 'The anti-bot check failed. Please try again.');
  }
  return t('authErrGeneric');
}

// ==========================================
// 1. SUPABASE AUTH & SESIUNE UTILIZATOR
// ==========================================

// CAPTCHA (Cloudflare Turnstile): cu protecția activă în Supabase, login-ul, contul nou, resetarea parolei și magic link-ul
// cer un token nou la fiecare apel. Pe staging: cheia de test Cloudflare (trece mereu).
// Verificarea pornește din timp (pregatesteCaptcha, la ecranul de login), ca token-ul să fie gata la apăsarea butonului;
// după fiecare folosire se cere în fundal unul nou. Caseta apare doar când Cloudflare cere un clic și dispare imediat după.
const TURNSTILE_SITE_KEY = FOLOSESTE_STAGING ? '1x00000000000000000000AA' : '0x4AAAAAAFrlyuhRgdIADuX6';
let turnstileIncarcare = null;
let turnstileWidget = null;
let captchaTokenGata = null;
let captchaAsteptatori = [];

function incarcaTurnstile() {
  if (!turnstileIncarcare) turnstileIncarcare = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.onload = resolve;
    s.onerror = () => { s.remove(); turnstileIncarcare = null; reject(new Error('captcha')); };
    document.head.appendChild(s);
  });
  return turnstileIncarcare;
}

function arataCasetaCaptcha(vizibila) {
  document.getElementById('captchaCutie')?.classList.toggle('vizibil', vizibila);
}

function respingeAsteptatoriCaptcha() {
  captchaAsteptatori.splice(0).forEach(a => a.reject(new Error('captcha')));
}

async function pregatesteCaptcha() {
  await incarcaTurnstile();
  if (turnstileWidget !== null) return;
  // Caseta stă în formularul vizibil (login sau contul de după înscriere), deasupra butonului; altfel, card jos pe ecran
  const loc = [document.getElementById('captchaLocInscriere'), document.getElementById('captchaLoc')].find(e => e && e.offsetParent !== null);
  const cutie = document.createElement('div');
  cutie.id = 'captchaCutie';
  if (loc) {
    cutie.className = 'in-formular';
    cutie.innerHTML = '<div class="captcha-widget"></div>';
    loc.appendChild(cutie);
  } else {
    cutie.innerHTML = `<div class="captcha-titlu">${tr('Verificare de securitate', 'Security check')}</div><div class="captcha-widget"></div>`;
    document.body.appendChild(cutie);
  }
  turnstileWidget = window.turnstile.render(cutie.querySelector('.captcha-widget'), {
    sitekey: TURNSTILE_SITE_KEY,
    appearance: 'interaction-only',
    size: loc ? 'flexible' : 'normal',
    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
    language: currentLang === 'en' ? 'en' : 'ro',
    'refresh-expired': 'manual',
    'before-interactive-callback': () => arataCasetaCaptcha(true),
    'after-interactive-callback': () => arataCasetaCaptcha(false),
    callback: token => {
      arataCasetaCaptcha(false);
      const asteptator = captchaAsteptatori.shift();
      if (!asteptator) {
        captchaTokenGata = token;
        return;
      }
      asteptator.resolve(token);
      setTimeout(() => window.turnstile.reset(turnstileWidget), 0);
    },
    'error-callback': () => { arataCasetaCaptcha(false); respingeAsteptatoriCaptcha(); },
    'timeout-callback': () => { arataCasetaCaptcha(false); respingeAsteptatoriCaptcha(); window.turnstile.reset(turnstileWidget); },
    'expired-callback': () => { captchaTokenGata = null; window.turnstile.reset(turnstileWidget); }
  });
}

// Token-ul pregătit se folosește o singură dată; imediat după se cere în fundal următorul
async function obtineTokenCaptcha() {
  await pregatesteCaptcha();
  let token = captchaTokenGata;
  captchaTokenGata = null;
  if (!token) token = await new Promise((resolve, reject) => captchaAsteptatori.push({ resolve, reject }));
  else window.turnstile.reset(turnstileWidget);
  return token;
}

function afiseazaMesajAuthFeedback(mesaj, tip = 'error') {
  const el = document.getElementById('authStatusFeedback');
  if (!el) return;
  el.innerText = mesaj;
  el.className = 'auth-status-msg ' + (tip === 'error' ? 'error' : 'success');
  el.style.display = 'block';
}

function ascundeMesajAuthFeedback() {
  const el = document.getElementById('authStatusFeedback');
  if (el) el.style.display = 'none';
}

function comutaTabAuth(mod) {
  tipModAuth = mod;
  ascundeMesajAuthFeedback();
  const tabLogin = document.getElementById('authTabLogin');
  const tabSignup = document.getElementById('authTabSignup');
  const btnSubmit = document.getElementById('authSubmitBtn');
  const subTitle = document.getElementById('authSubtitleText');
  const uitatParola = document.getElementById('authUitatParolaBtn');
  if (uitatParola) uitatParola.hidden = mod !== 'login';
  const notaAntrenor = document.getElementById('authNotaAntrenor');
  if (notaAntrenor) notaAntrenor.hidden = mod === 'login';
  actualizeazaLinkComutareAuth();

  if (mod === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabSignup) tabSignup.classList.remove('active');
    if (btnSubmit) btnSubmit.innerText = t('authSubmitBtnLogin');
    if (subTitle) subTitle.innerText = t('authSubtitleLogin');
  } else {
    if (tabSignup) tabSignup.classList.add('active');
    if (tabLogin) tabLogin.classList.remove('active');
    if (btnSubmit) btnSubmit.innerText = t('authSubmitBtnSignup');
    if (subTitle) subTitle.innerText = t('authSubtitleSignup');
    // CAPTCHA doar pentru contul nou: pornește când se alege „Creează cont”, ca tokenul să fie gata la trimitere
    pregatesteCaptcha().catch(() => {});
  }
}

// Linkul de la finalul ecranului de autentificare: contul nou (doar pentru antrenori) sau întoarcerea la intrare
function actualizeazaLinkComutareAuth() {
  const link = document.getElementById('authLinkComutare');
  if (link) link.innerText = tipModAuth === 'login'
    ? tr('Ești antrenor? Creează cont', 'Are you a trainer? Create an account')
    : tr('Ai deja cont? Intră în cont', 'Already have an account? Log in');
}

async function gestioneazaSubmitAuth(e) {
  if (e) e.preventDefault();
  if (!supabaseClient) return;

  const emailEl = document.getElementById('authEmail');
  const passEl = document.getElementById('authPassword');
  const email = (emailEl?.value || '').trim();
  const password = passEl?.value || '';
  const btnSubmit = document.getElementById('authSubmitBtn');

  if (!email && !password) {
    afiseazaMesajAuthFeedback(t('authFillEmailPass'));
    if (emailEl) emailEl.focus();
    return;
  }
  if (!email) {
    afiseazaMesajAuthFeedback(t('authFillEmailOnly'));
    if (emailEl) emailEl.focus();
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    afiseazaMesajAuthFeedback(t('authInvalidEmailFormat'));
    if (emailEl) emailEl.focus();
    return;
  }
  if (!password) {
    afiseazaMesajAuthFeedback(t('authFillPassOnly'));
    if (passEl) passEl.focus();
    return;
  }

  ascundeMesajAuthFeedback();
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = t('authProcessing');
  }

  // Butonul arată etapa: conectarea, apoi încărcarea (până dispare ecranul de login)
  const etapa = text => { if (btnSubmit) btnSubmit.innerText = text; };
  let conectat = false;
  try {
    if (tipModAuth === 'login') {
      // Logarea nu cere CAPTCHA: verificarea anti-robot e doar la conturile noi (hook-ul „before user created”, vezi worker/)
      etapa(tr('Se conectează...', 'Signing in...'));
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      conectat = true;
      etapa(tr('Se încarcă...', 'Loading...'));
      showToast(t('authLoginSuccess'));
    } else {
      if (password.length < 8) {
        afiseazaMesajAuthFeedback(t('authErrPassLength'));
        return;
      }
      // Tokenul anti-robot merge în datele contului nou; serverul îl verifică înainte să creeze contul
      const captchaToken = await obtineTokenCaptcha();
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
            captcha_token: captchaToken
          }
        }
      });
      if (error) throw error;
      // Cu confirmarea pe email activă, un email existent nu dă eroare, ci un utilizator fără identități
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        afiseazaMesajAuthFeedback(t('authErrUserExists'));
        return;
      }
      if (data?.session) {
        showToast(t('authSignupSuccess'));
      } else {
        afiseazaMesajAuthFeedback(t('authSignupCheckEmail'), 'success');
      }
    }
  } catch (err) {
    afiseazaMesajAuthFeedback(localizeazaEroareAuth(err.message));
  } finally {
    // După o conectare reușită butonul rămâne „Se încarcă...” până se deschide aplicația (rolul și datele încă se încarcă)
    if (btnSubmit && !conectat) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = tipModAuth === 'login' ? t('authSubmitBtnLogin') : t('authSubmitBtnSignup');
    }
  }
}

// Emailul din formularul de login, validat; '' (cu mesaj afișat) dacă lipsește sau e greșit
function citesteEmailAuthValid() {
  const emailEl = document.getElementById('authEmail');
  const email = (emailEl?.value || '').trim();
  if (!email) {
    afiseazaMesajAuthFeedback(t('authFillEmailOnly'));
    if (emailEl) emailEl.focus();
    return '';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    afiseazaMesajAuthFeedback(t('authInvalidEmailFormat'));
    if (emailEl) emailEl.focus();
    return '';
  }
  return email;
}

async function trimiteResetareParola() {
  if (!supabaseClient) return;
  const email = citesteEmailAuthValid();
  if (!email) return;
  ascundeMesajAuthFeedback();
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
    if (error) throw error;
    afiseazaMesajAuthFeedback(tr('Ți-am trimis pe email un link pentru parolă nouă.', 'We emailed you a link to set a new password.'), 'success');
  } catch (err) {
    afiseazaMesajAuthFeedback(localizeazaEroareAuth(err.message));
  }
}

// După linkul din email clienta/antrenorul e conectat: deschidem Profil la „Schimbă parola”
function deschideProfilPentruParolaNoua() {
  deschideMeniuLateral();
  navigheazaSubMeniu('profile');
  showToast(tr('Setează parola nouă', 'Set your new password'));
  setTimeout(() => document.getElementById('profileInputParolaNoua')?.focus(), 350);
}

async function trimiteMagicLink() {
  if (!supabaseClient) return;
  const email = citesteEmailAuthValid();
  if (!email) return;

  ascundeMesajAuthFeedback();
  try {
    // Doar pentru conturi existente (inclusiv cele invitate de antrenor): de aici nu se creează conturi noi
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname, shouldCreateUser: false }
    });
    if (error) throw error;
    afiseazaMesajAuthFeedback(t('authMagicLinkSent'), 'success');
  } catch (err) {
    afiseazaMesajAuthFeedback(localizeazaEroareAuth(err.message));
  }
}

async function loginCuGoogle() {
  if (!supabaseClient) return;
  ascundeMesajAuthFeedback();
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
  } catch (err) {
    afiseazaMesajAuthFeedback(localizeazaEroareAuth(err.message));
  }
}

async function deconectareUtilizator() {
  customConfirm(t('authLogoutConfirmTitle'), t('authLogoutConfirmText'), async function() {
    deconectareInCurs = true;
    document.documentElement.classList.add('deconectare');
    if (supabaseClient) {
      // Bifele notate fără internet pleacă înainte de ieșire (după ieșire nu mai pot fi trimise)
      if (rolUtilizator === 'clienta' && Object.keys(progresNetrimis()).length) await trimiteProgresNetrimis();
      await dezaboneazaPush();
      await supabaseClient.auth.signOut();
    }
    localStorage.removeItem('BFIT_DB_LOCAL');
    stergeCacheClienti();
    window.location.reload();
  });
}

function actualizeazaDateProfilUI(user) {
  if (!user) return;
  utilizatorCurent = user;

  const meta = user.user_metadata || {};
  const numeComplet = meta.full_name || meta.name || user.email?.split('@')[0] || 'B-Fit';
  const prenume = numeComplet.trim().split(' ')[0] || 'B-Fit';
  const avatarUrl = meta.avatar_url || meta.picture || '';

  // Setările orarului din cont au prioritate față de copia locală (ex. schimbate pe alt dispozitiv)
  if (meta.setari_orar && !salvareSetariOrarInCurs && JSON.stringify(meta.setari_orar) !== JSON.stringify(setariOrar)) {
    seteazaSetariOrar(meta.setari_orar, true);
  }
  if (meta.setari_studio && !salvareSetariStudioInCurs && JSON.stringify(meta.setari_studio) !== JSON.stringify(setariStudio)) {
    seteazaSetariStudio(meta.setari_studio, true);
  }

  const elName = document.getElementById('drawerUserNameLabel');
  if (elName) elName.innerText = numeComplet;

  const elInpNume = document.getElementById('profileInputNume');
  if (elInpNume) elInpNume.value = elInpNume.dataset.initial = numeComplet;

  const elInpEmail = document.getElementById('profileInputEmail');
  if (elInpEmail) elInpEmail.value = user.email || '';

  const elAvatarWrap = document.getElementById('drawerUserAvatar');
  const elBigAvatar = document.getElementById('profileBigAvatarWrap');

  const avatarInner = avatarUrl
    ? `<img src="${avatarUrl}" alt="${prenume}">`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

  if (elAvatarWrap) elAvatarWrap.innerHTML = avatarInner;
  if (elBigAvatar) elBigAvatar.innerHTML = avatarInner;
}

function navigheazaSubMeniu(strat) {
  const layers = {
    main: document.getElementById('drawerMainView'),
    settings: document.getElementById('drawerSettingsView'),
    settingsAppearance: document.getElementById('drawerSettingsAppearanceView'),
    settingsLanguage: document.getElementById('drawerSettingsLanguageView'),
    settingsSchedule: document.getElementById('drawerSettingsScheduleView'),
    settingsWorkouts: document.getElementById('drawerSettingsWorkoutsView'),
    settingsPayments: document.getElementById('drawerSettingsPaymentsView'),
    settingsSubscriptions: document.getElementById('drawerSettingsSubscriptionsView'),
    settingsSignup: document.getElementById('drawerSettingsSignupView'),
    settingsNotifications: document.getElementById('drawerSettingsNotificationsView'),
    profile: document.getElementById('drawerProfileView'),
    feedback: document.getElementById('drawerFeedbackView'),
    noutati: document.getElementById('drawerNoutatiView'),
    comunitate: document.getElementById('drawerComunitateView'),
    verificaProdus: document.getElementById('drawerVerificaProdusView'),
    retete: document.getElementById('drawerReteteView')
  };

  Object.values(layers).forEach(el => {
    if (el) el.classList.remove('active');
  });

  if (layers[strat]) {
    layers[strat].classList.add('active');
  }
  if ((strat === 'settings' || strat === 'settingsSignup') && rolUtilizator === 'antrenor') incarcaCodInscriere();
  if (strat === 'settings') actualizeazaRezumatNotificari();
  if (strat === 'noutati') document.getElementById('noutatiLista').innerHTML = htmlNoutati(noutatiPentruRol(), true);
  if (strat === 'settingsNotifications') randeazaSetariNotificari();
  if (strat === 'profile' && rolUtilizator === 'antrenor') incarcaTelefonContact();
  if (strat === 'profile' && rolUtilizator === 'clienta') {
    const inp = document.getElementById('profileInputTelefonClient');
    if (inp && document.activeElement !== inp) inp.value = inp.dataset.initial = (dateClienta.fisa && dateClienta.fisa.telefon) || '';
  }
}

// ---- Feedback (meniu › Raportează o problemă): text în tabelul feedback (trimite_feedback), fișierul în R2 prin Worker ----
let feedbackTip = 'problema';
let feedbackFisier = null; // Blob gata de trimis (poza deja micșorată)

function seteazaTipFeedback(tip) {
  feedbackTip = tip;
  document.getElementById('feedbackTipProblema').classList.toggle('active', tip === 'problema');
  document.getElementById('feedbackTipSugestie').classList.toggle('active', tip === 'sugestie');
  // Textul ajutător depinde de tip; data-ro/en-placeholder îl păstrează și la schimbarea limbii
  const camp = document.getElementById('feedbackText');
  const [ro, en] = tip === 'sugestie'
    ? ['Ce ai vrea să îmbunătățim sau să adăugăm în aplicație?', 'What would you like us to improve or add to the app?']
    : ['Ce s-a întâmplat? Ce făceai când a apărut problema?', 'What happened? What were you doing when the problem appeared?'];
  camp.dataset.roPlaceholder = ro;
  camp.dataset.enPlaceholder = en;
  camp.placeholder = tr(ro, en);
}

async function alegeFisierFeedback(input) {
  const fisier = input.files && input.files[0];
  input.value = '';
  if (!fisier) return;
  let blob = fisier;
  if (fisier.type.startsWith('video/')) {
    if (fisier.size > 50 * 1024 * 1024) {
      showToast(tr('Video prea mare (max. 50 MB). Taie clipul sau folosește înregistrarea de ecran.', 'Video too large (max. 50 MB). Trim the clip or use a screen recording.'), 'error');
      return;
    }
    if (!/^video\/(mp4|quicktime|webm)$/.test(fisier.type)) {
      showToast(tr('Format video neacceptat. Folosește MP4 sau MOV.', 'Unsupported video format. Use MP4 or MOV.'), 'error');
      return;
    }
  } else {
    try {
      blob = await micsoreazaPozaJpeg(fisier);
    } catch (e) {
      showToast(tr('Poza nu a putut fi citită. Încearcă alta.', 'The photo could not be read. Try another one.'), 'error');
      return;
    }
  }
  feedbackFisier = blob;
  document.getElementById('feedbackFisierNume').textContent = `${(blob.size / 1024 / 1024).toFixed(1)} MB · ${fisier.name}`;
  document.getElementById('feedbackFisierAles').hidden = false;
}

function stergeFisierFeedback() {
  feedbackFisier = null;
  document.getElementById('feedbackFisierAles').hidden = true;
}

async function trimiteFeedback() {
  const campText = document.getElementById('feedbackText');
  const mesaj = campText.value.trim();
  if (!mesaj) {
    showToast(feedbackTip === 'sugestie'
      ? tr('Scrie pe scurt sugestia ta.', 'Briefly describe your suggestion.')
      : tr('Scrie pe scurt ce s-a întâmplat.', 'Briefly describe what happened.'), 'error');
    campText.focus();
    return;
  }
  if (!supabaseClient || !utilizatorCurent) return;
  const btn = document.getElementById('btnTrimiteFeedback');
  btn.disabled = true;
  btn.textContent = tr('Se trimite...', 'Sending...');
  try {
    let cheie = null;
    if (feedbackFisier) {
      const { data } = await supabaseClient.auth.getSession();
      const r = data.session && await fetch(URL_FEEDBACK, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + data.session.access_token, 'Content-Type': feedbackFisier.type },
        body: feedbackFisier
      }).catch(() => null);
      const rez = r && r.ok ? await r.json().catch(() => null) : null;
      if (!rez || !rez.cheie) {
        showToast(tr('Fișierul nu s-a putut încărca. Verifică internetul sau trimite fără fișier.', 'The file could not be uploaded. Check your internet or send without the file.'), 'error');
        return;
      }
      cheie = rez.cheie;
    }
    const versiune = ((document.querySelector('script[src*="app.js"]')?.getAttribute('src') || '').match(/fitFinal(\d+)/) || [])[1] || '';
    const { error } = await supabaseClient.rpc('trimite_feedback', {
      p_tip: feedbackTip, p_mesaj: mesaj, p_ecran: `${rolUtilizator}/${tipTabCurent}`, p_versiune: versiune, p_fisier: cheie
    });
    if (error) {
      showToast(/prea_multe/.test(error.message)
        ? tr('Ai trimis multe mesaje azi. Încearcă mâine.', 'You have sent many messages today. Try again tomorrow.')
        : tr('Mesajul nu s-a putut trimite. Reîncearcă.', 'The message could not be sent. Try again.'), 'error');
      return;
    }
    campText.value = '';
    stergeFisierFeedback();
    seteazaTipFeedback('problema');
    showToast(tr('Mulțumim! Mesajul a fost trimis.', 'Thank you! Your message has been sent.'));
    navigheazaSubMeniu('main');
  } finally {
    btn.disabled = false;
    btn.textContent = tr('Trimite', 'Send');
  }
}

// ---- Telefonul antrenorului pentru cliente (profiles.telefon_contact) ----
async function incarcaTelefonContact() {
  const inp = document.getElementById('profileInputTelefon');
  if (!supabaseClient || !utilizatorCurent || !inp || document.activeElement === inp) return;
  const { data, error } = await supabaseClient.from('profiles').select('telefon_contact').eq('id', utilizatorCurent.id).maybeSingle();
  if (!error) inp.value = inp.dataset.initial = (data && data.telefon_contact) || '';
}

// Telefon fără spații / cratime / puncte / paranteze, 00 → +: gol, 0 + 9 cifre (RO) sau + și 8-15 cifre. null = invalid
function normalizeazaTelefon(tel) {
  const t = (tel || '').replace(/[\s\-.()]/g, '').replace(/^00/, '+');
  return (!t || /^0\d{9}$/.test(t) || /^\+\d{8,15}$/.test(t)) ? t : null;
}

// ---- Profil: un singur buton pentru nume + telefon; trimite doar ce s-a schimbat ----
// Telefonul: la client cliente.telefon, la antrenor profiles.telefon_contact (cel văzut de cliente)
async function salveazaProfil() {
  if (!supabaseClient || !utilizatorCurent) return;
  const esteClienta = rolUtilizator === 'clienta';
  const inpNume = document.getElementById('profileInputNume');
  const inpTel = document.getElementById(esteClienta ? 'profileInputTelefonClient' : 'profileInputTelefon');
  const nouNume = (inpNume.value || '').trim();
  const tel = normalizeazaTelefon(inpTel.value);

  if (!nouNume) {
    showToast(tr('Numele nu poate fi gol!', 'Name cannot be empty!'), 'error');
    return;
  }
  if (tel === null) {
    showToast(tr('Număr de telefon invalid. Ex: 0712 345 678 sau +40 712 345 678', 'Invalid phone number. E.g. 0712 345 678 or +40 712 345 678'), 'error');
    inpTel.focus();
    return;
  }

  const btn = document.getElementById('btnSalveazaProfil');
  if (btn) btn.disabled = true;
  try {
    if (nouNume !== inpNume.dataset.initial) {
      const { data, error } = await supabaseClient.auth.updateUser({ data: { full_name: nouNume } });
      if (error) throw error;
      actualizeazaDateProfilUI(data.user);
    }
    if (tel !== (inpTel.dataset.initial || '')) {
      const { data, error } = await supabaseClient.rpc(esteClienta ? 'seteaza_telefon_client' : 'seteaza_telefon_contact', { p_telefon: tel });
      if (error || data !== 'ok') throw new Error(data === 'invalid' ? tr('Număr de telefon invalid.', 'Invalid phone number.') : tr('Telefonul nu s-a putut salva.', 'Could not save the phone.'));
      if (esteClienta && dateClienta.fisa) dateClienta.fisa.telefon = tel;
    }
    inpTel.value = inpTel.dataset.initial = tel;
    showToast(tr('✓ Salvat', '✓ Saved'));
  } catch (err) {
    showToast(err.message || tr('Nu s-a putut salva.', 'Could not save.'), 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---- Link de înscriere al antrenorului (?inscriere=<cod>); codul stă în profiles.cod_inscriere ----
let codInscriereAntrenor = null;

function linkInscriere(cod) {
  return `${URL_APLICATIE}?inscriere=${cod}`;
}

function afiseazaCodInscriere() {
  const cod = codInscriereAntrenor || '';
  const inp = document.getElementById('setariCodInscriere');
  if (inp && document.activeElement !== inp) inp.value = cod;
  document.getElementById('setariLinkInscriereBloc').hidden = !cod;
  document.getElementById('setariLinkInscriere').textContent = cod ? linkInscriere(cod) : '';
  actualizeazaRezumatSetari();
}

async function incarcaCodInscriere() {
  if (!supabaseClient || !utilizatorCurent) return;
  const { data, error } = await supabaseClient.from('profiles').select('cod_inscriere').eq('id', utilizatorCurent.id).maybeSingle();
  if (error) return;
  codInscriereAntrenor = (data && data.cod_inscriere) || null;
  if (!codInscriereAntrenor) {
    // propunere: prenumele, fără diacritice
    const meta = utilizatorCurent.user_metadata || {};
    const inp = document.getElementById('setariCodInscriere');
    if (inp && !inp.value) inp.value = (meta.full_name || meta.name || '').trim().split(' ')[0]
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }
  afiseazaCodInscriere();
}

async function salveazaCodInscriere() {
  const cod = (document.getElementById('setariCodInscriere').value || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{3,30}$/.test(cod)) {
    showToast(tr('Doar litere mici, cifre și cratimă, 3–30 de caractere.', 'Only lowercase letters, digits and dashes, 3–30 characters.'), 'error');
    return;
  }
  const { data, error } = await supabaseClient.rpc('seteaza_cod_inscriere', { p_cod: cod });
  if (error || data !== 'ok') {
    showToast(data === 'ocupat'
      ? tr('Numele acesta e deja folosit. Alege altul.', 'This name is already taken. Choose another.')
      : tr('Nu s-a putut salva.', 'Could not save.'), 'error');
    return;
  }
  codInscriereAntrenor = cod;
  afiseazaCodInscriere();
  showToast(tr('Link salvat', 'Link saved'));
}

function copiazaLinkInscriere() {
  if (!codInscriereAntrenor) return;
  navigator.clipboard.writeText(linkInscriere(codInscriereAntrenor)).then(() => showToast(tr('✓ Link copiat', '✓ Link copied')));
}

function distribuieLinkInscriere() {
  if (!codInscriereAntrenor) return;
  const url = linkInscriere(codInscriereAntrenor);
  // Meniul nativ de share (telefon, Windows); unde browserul nu-l are, link-ul se copiază
  if (navigator.share) {
    navigator.share({ title: 'B-Fit', text: tr('Completează fișa de obiective:', 'Fill in the goal-setting form:'), url })
      .catch(e => { if (e.name !== 'AbortError') copiazaLinkInscriere(); });
  } else {
    copiazaLinkInscriere();
  }
}

async function proceseazaSiUploadeazaAvatar(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
  if (!supabaseClient || !utilizatorCurent) {
    showToast(currentLang === 'en' ? 'You must be logged in to upload an avatar!' : 'Conectează-te ca să poți încărca poza!', 'error');
    return;
  }

  const file = inputEl.files[0];
  showToast(currentLang === 'en' ? '⏳ Optimizing and uploading photo...' : '⏳ Se optimizează și încarcă poza...');

  try {
    const imgBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const targetSize = 256;
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    const srcSize = Math.min(imgBitmap.width, imgBitmap.height);
    const srcX = (imgBitmap.width - srcSize) / 2;
    const srcY = (imgBitmap.height - srcSize) / 2;

    ctx.drawImage(imgBitmap, srcX, srcY, srcSize, srcSize, 0, 0, targetSize, targetSize);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast(currentLang === 'en' ? 'Image processing error' : 'Eroare la procesarea imaginii', 'error');
        return;
      }

      const filePath = `${utilizatorCurent.id}/avatar.webp`;
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload avatar error:', uploadError);
        showToast((currentLang === 'en' ? 'Storage upload error: ' : 'Eroare la încărcarea în storage: ') + uploadError.message, 'error');
        return;
      }

      const { data: pubData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = pubData.publicUrl + '?v=' + Date.now();

      const { data: updData, error: metaError } = await supabaseClient.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (metaError) throw metaError;

      actualizeazaDateProfilUI(updData.user);
      showToast(currentLang === 'en' ? '✓ Profile picture updated!' : '✓ Poză de profil actualizată!');
    }, 'image/webp', 0.82);

  } catch (err) {
    console.error('Procesare foto eroare:', err);
    showToast(currentLang === 'en' ? 'Photo processing error!' : 'Eroare la procesarea pozei!', 'error');
  } finally {
    inputEl.value = '';
  }
}

async function schimbaParolaProfil() {
  if (!supabaseClient || !utilizatorCurent) return;
  const nouaParola = document.getElementById('profileInputParolaNoua')?.value || '';
  const confirmaParola = document.getElementById('profileInputParolaConfirma')?.value || '';

  if (!nouaParola || nouaParola.length < 8) {
    showToast(currentLang === 'en' ? 'Password must be at least 8 characters!' : 'Parola trebuie să aibă minim 8 caractere!', 'error');
    return;
  }

  if (nouaParola !== confirmaParola) {
    showToast(currentLang === 'en' ? 'Passwords do not match!' : 'Parolele introduse nu coincid!', 'error');
    return;
  }

  const btn = document.getElementById('btnSchimbaParolaProfil');
  if (btn) btn.disabled = true;

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: nouaParola, data: { parola_setata: true } });
    if (error) throw error;
    showToast(currentLang === 'en' ? '✓ Password updated successfully!' : '✓ Parola a fost actualizată!');
    document.getElementById('profileInputParolaNoua').value = '';
    document.getElementById('profileInputParolaConfirma').value = '';
  } catch (err) {
    showToast(localizeazaEroareAuth(err.message), 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---- Datele tale (GDPR): copie a datelor (portabilitate) și ștergerea contului ----
// Tot ce ține de client, din fiecare tabel (GDPR art. 15 și 20). Un tabel lipsă sau o eroare = listă goală, nu oprește exportul.
async function dateleClientuluiPentruExport() {
  const c = dateClienta.fisa;
  if (!c) return {};
  const lista = q => q.then(r => r.error ? [] : (r.data || [])).catch(() => []);
  const ale = (tabel, ordine) => lista(supabaseClient.from(tabel).select('*').eq('client_id', c.id).order(ordine || 'created_at'));
  const [checkin, greutati, antrenamente, obiective, jurnal, setariNutritie, apa, cantariri, salvate, retete,
    cicluSetari, menstruatii, cicluZilnic, comunitateMembru, comunitateActivitati, mesaje, bravo] = await Promise.all([
    ale('checkin_saptamanal', 'saptamana'), ale('greutati'), ale('antrenamente_personale', 'data'), ale('obiective'), ale('jurnal_alimente', 'data'),
    ale('setari_nutritie', 'client_id'), ale('apa_zilnica', 'data'), ale('greutate_zilnica', 'data'), ale('nutritie_salvate'), ale('retete'),
    ale('ciclu_setari', 'client_id'), ale('ciclu_menstruatii', 'data_start'), ale('ciclu_zilnic', 'data'), ale('comunitate_membri', 'client_id'),
    ale('comunitate_activitati', 'data'), ale('mesaje'),
    lista(supabaseClient.from('comunitate_bravo').select('*').eq('auth_user_id', utilizatorCurent.id))
  ]);
  return { checkin, greutati, antrenamente, obiective, jurnal, setariNutritie, apa, cantariri, salvate, retete,
    ciclu: { setari: cicluSetari, menstruatii, zilnic: cicluZilnic }, comunitate: { membru: comunitateMembru, activitati: comunitateActivitati, bravoDate: bravo }, mesaje };
}

// Ce ține de antrenor, în afară de DB: rețetele pentru clienți și provocările din comunitate
async function dateleAntrenoruluiPentruExport() {
  const lista = q => q.then(r => r.error ? [] : (r.data || [])).catch(() => []);
  const [retete, provocari] = await Promise.all([
    lista(supabaseClient.from('retete').select('*').is('client_id', null).eq('user_id', utilizatorCurent.id).order('nume')),
    lista(supabaseClient.from('provocari').select('*').eq('user_id', utilizatorCurent.id).order('de'))
  ]);
  return { retete, provocari };
}

// Aceleași date în format tehnic (portabilitate, GDPR art. 20), pentru import în alt program
async function exportaDateleMeleJson() {
  if (!utilizatorCurent) return;
  const date = {
    exportatLa: new Date().toISOString(),
    cont: { email: utilizatorCurent.email, nume: (utilizatorCurent.user_metadata || {}).full_name || '', creatLa: utilizatorCurent.created_at, rol: rolUtilizator },
    date: rolUtilizator === 'clienta'
      ? Object.assign({ fisa: dateClienta.fisa, planuri: dateClienta.planuri }, await dateleClientuluiPentruExport())
      : Object.assign({}, DB, await dateleAntrenoruluiPentruExport())
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(date, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `b-fit-datele-mele-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Un PDF lizibil cu toate datele contului: antrenorul (clienți, orar, confirmări, încasări, prezențe, planuri, rețete, provocări),
// clientul (fișa, check-in-urile, greutatea, antrenamentele, obiectivele, nutriția, ciclul, comunitatea, mesajele, planurile)
async function exportaDateleMele() {
  if (!utilizatorCurent) return;
  const btn = document.getElementById('btnExportaDate');
  btn.disabled = true;
  showToast(t('toastPdfGenerating'));
  try {
    await incarcaPdfMake();
    const paleta = PALETE_ACCENT.includes(localStorage.getItem('beatrix_accent')) ? localStorage.getItem('beatrix_accent') : 'blue';
    const culoare = CULORI_PDF[paleta];
    const logo = await imagineDataUrl(`icon-${paleta}.png`).catch(() => null);
    const gri = '#64748b';
    const loc = currentLang === 'en' ? 'en-GB' : 'ro-RO';
    const data = v => { const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v + 'T12:00:00' : v); return v && !isNaN(d) ? d.toLocaleDateString(loc) : v; };
    const val = v => (v === undefined || v === null || String(v).trim() === '') ? '-' : String(v);
    const continut = [{
      columns: [
        logo ? { image: logo, width: 34 } : { text: '', width: 0 },
        { stack: [{ text: tr('Datele mele', 'My data'), bold: true, color: culoare, fontSize: 18 }, { text: 'B-Fit · ' + URL_APLICATIE.replace(/^https?:\/\//, '').replace(/\/$/, ''), color: gri, fontSize: 8 }], margin: [8, 0, 0, 0] },
        { text: data(new Date().toISOString()), color: gri, fontSize: 8, alignment: 'right', margin: [0, 6, 0, 0] }
      ],
      margin: [0, 0, 0, 6]
    }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.2, lineColor: culoare }], margin: [0, 0, 0, 4] }];
    const sectiune = (titlu, nr) => continut.push({ text: nr === undefined ? titlu : `${titlu} (${nr})`, style: 'h2', headlineLevel: 1 });
    const gol = () => continut.push({ text: tr('Nimic înregistrat.', 'Nothing recorded.'), color: gri, italics: true });
    const tabel = (cap, randuri, latimi) => {
      if (!randuri.length) return gol();
      continut.push({
        table: { headerRows: 1, dontBreakRows: true, widths: latimi || cap.map(() => '*'), body: [cap.map(c => ({ text: c, bold: true, color: '#ffffff' })), ...randuri.map(r => r.map(val))] },
        layout: {
          fillColor: i => i === 0 ? culoare : (i % 2 === 0 ? '#f1f5f9' : null),
          hLineColor: () => '#cbd5e1', vLineColor: () => '#cbd5e1', hLineWidth: () => 0.5, vLineWidth: () => 0.5,
          paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3
        },
        fontSize: 8.5
      });
    };
    const perechi = randuri => tabel([tr('Câmp', 'Field'), tr('Valoare', 'Value')], randuri.filter(r => val(r[1]) !== '-'), [150, '*']);
    // Fișa de obiective: întrebările formularului, în ordine, cu textul opțiunilor alese
    const raspunsuriInscriere = r => {
      const intrebari = SECTIUNI_INSCRIERE.flatMap(s => s.intrebari).concat(INTREBARI_VECHI_INSCRIERE);
      return intrebari.filter(q => r[q.id] !== undefined).map(q => {
        const opt = id => { const o = (q.optiuni || OPTIUNI_DA_NU).find(x => x.id === id); return o ? textInscriere(o) : id; };
        const v = Array.isArray(r[q.id]) ? r[q.id].map(opt).join(', ') : opt(r[q.id]);
        return [textInscriere(ETICHETE_SCURTE_INSCRIERE[q.id] || q).replace(/\s*\((opțional|optional)\)/, ''),[v, r[q.id + 'Detalii']].filter(x => val(x) !== '-').join(' · ')];
      });
    };
    const planuri = lista => {
      sectiune(tr('Planuri de antrenament', 'Workout plans'), lista.length);
      if (!lista.length) return gol();
      lista.forEach(p => {
        continut.push({ text: [{ text: (p.titlu || '').trim() || tr('Plan de antrenament', 'Workout plan'), bold: true }, { text: `  ${p.clienta ? p.clienta + ' · ' : ''}${data(p.updated_at)}`, color: gri, fontSize: 8 }], margin: [0, 6, 0, 2] });
        ((p.continut_json || {}).sesiuni || []).forEach(s => {
          const ex = (s.exercitii || []).filter(e => (e.exercitiu || '').trim()).map(e => [e.exercitiu, e.seturi_repetari, e.greutate_kg && e.greutate_kg + ' kg'].filter(Boolean).join(' · '));
          if (ex.length) continut.push({ text: [{ text: ((s.titlu || '').trim() || tr('Sesiune', 'Session')) + ': ', bold: true }, ex.join('; ')], fontSize: 8.5, margin: [8, 0, 0, 2] });
        });
      });
    };

    const meta = utilizatorCurent.user_metadata || {};
    sectiune(tr('Contul', 'Account'));
    perechi([
      [tr('Email', 'Email'), utilizatorCurent.email],
      [tr('Nume', 'Name'), meta.full_name],
      [tr('Tip cont', 'Account type'), rolUtilizator === 'clienta' ? tr('Client', 'Client') : tr('Antrenor', 'Trainer')],
      [tr('Creat la', 'Created on'), data(utilizatorCurent.created_at)]
    ]);

    if (rolUtilizator === 'clienta') {
      const c = dateClienta.fisa || {};
      const x = await dateleClientuluiPentruExport();
      const greutati = x.greutati || [];
      sectiune(tr('Abonamentul', 'Subscription'));
      perechi([
        [tr('Nume', 'Name'), c.nume], [tr('Telefon', 'Phone'), c.telefon],
        [tr('Abonament', 'Subscription'), c.tipAbonament], [tr('Ședințe incluse', 'Sessions included'), c.incluse],
        [tr('Ședințe efectuate', 'Sessions done'), c.efectuate], [tr('Ședințe rămase', 'Sessions left'), c.ramase],
        [tr('Început', 'Start'), data(c.dataStart)], [tr('Expiră', 'Expires'), data(c.dataExpirare)], [tr('Status', 'Status'), c.status],
        [tr('Nota antrenorului', 'Trainer’s note'), c.nota_client]
      ]);
      sectiune(tr('Fișa de obiective', 'Goal-setting form'));
      c.fisa_inscriere ? perechi(raspunsuriInscriere(c.fisa_inscriere)) : gol();
      sectiune(tr('Greutate', 'Weight'), (greutati || []).length);
      tabel([tr('Data', 'Date'), 'Kg'], (greutati || []).sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(g => [data(g.data), g.greutate]), [120, '*']);
      sectiune(tr('Cântăriri zilnice', 'Daily weigh-ins'), (x.cantariri || []).length);
      tabel([tr('Data', 'Date'), 'Kg'], (x.cantariri || []).map(g => [data(g.data), g.kg]), [120, '*']);
      sectiune(tr('Check-in săptămânal', 'Weekly check-in'), (x.checkin || []).length);
      tabel([tr('Săptămâna', 'Week'), 'Kg', tr('Răspunsuri', 'Answers')], (x.checkin || []).map(k => [data(k.saptamana), k.greutate,
        Object.entries(k.raspunsuri || {}).filter(([, v]) => v !== '' && v !== null && !(Array.isArray(v) && !v.length)).map(([q, v]) => `${q}: ${Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v)}`).join('; ')]), [70, 40, '*']);
      sectiune(tr('Antrenamente proprii', 'Own workouts'), (x.antrenamente || []).length);
      tabel([tr('Data', 'Date'), tr('Tip', 'Type'), tr('Titlu', 'Title'), tr('Durată', 'Duration'), 'Km', tr('Exerciții', 'Exercises'), tr('Vizibil antrenorului', 'Visible to trainer')],
        (x.antrenamente || []).map(a => [data(a.data), a.fel, a.titlu || a.activitate, a.durata_min ? a.durata_min + ' min' : '', a.distanta_km, (a.exercitii || []).map(e => e.exercitiu).join(', '), a.vizibil_antrenor ? tr('da', 'yes') : tr('nu', 'no')]),
        [50, 50, 70, 45, 30, '*', 55]);
      sectiune(tr('Obiective', 'Goals'), (x.obiective || []).length);
      tabel([tr('Tip', 'Type'), tr('Exercițiu', 'Exercise'), tr('Țintă', 'Target'), tr('Termen', 'Deadline'), tr('Atins', 'Reached')],
        (x.obiective || []).map(o => [o.tip, o.exercitiu, o.tinta, data(o.termen), data(o.atins_la)]), ['*', '*', 50, 70, 70]);
      const sn = (x.setariNutritie || [])[0] || {};
      sectiune(tr('Nutriție: ținte și setări', 'Nutrition: targets and settings'));
      perechi([[tr('Calorii', 'Calories'), sn.kcal], [tr('Proteine (g)', 'Protein (g)'), sn.proteine], [tr('Carbohidrați (g)', 'Carbohydrates (g)'), sn.carbo],
        [tr('Grăsimi (g)', 'Fat (g)'), sn.grasimi], [tr('Apă (pahare)', 'Water (glasses)'), sn.apa_tinta], [tr('Obiectiv', 'Goal'), sn.obiectiv],
        [tr('Țintele setate de', 'Targets set by'), sn.tinte_setate_de], [tr('Jurnal vizibil antrenorului', 'Log visible to trainer'), sn.vizibil_antrenor === undefined ? '' : (sn.vizibil_antrenor ? tr('da', 'yes') : tr('nu', 'no'))]]);
      sectiune(tr('Jurnal alimentar', 'Food log'), (x.jurnal || []).length);
      tabel([tr('Data', 'Date'), tr('Masa', 'Meal'), tr('Aliment', 'Food'), 'g', 'kcal', 'P', 'C', 'G'],
        (x.jurnal || []).map(j => [data(j.data), j.masa, j.nume + (j.marca ? ` (${j.marca})` : ''), Number(j.cantitate_g) === 1 ? '' : j.cantitate_g, Math.round(j.kcal), j.proteine, j.carbo, j.grasimi]),
        [50, 45, '*', 30, 30, 28, 28, 28]);
      sectiune(tr('Apă', 'Water'), (x.apa || []).length);
      tabel([tr('Data', 'Date'), tr('Pahare', 'Glasses')], (x.apa || []).map(a => [data(a.data), a.pahare]), [120, '*']);
      sectiune(tr('Favorite și mese salvate', 'Favourites and saved meals'), (x.salvate || []).length);
      tabel([tr('Tip', 'Type'), tr('Nume', 'Name'), tr('Alimente', 'Foods')], (x.salvate || []).map(f => [f.tip, f.nume, (f.continut || []).map(a => `${a.nume} ${a.cantitate_g || ''} g`).join(', ')]), [50, 110, '*']);
      sectiune(tr('Rețetele mele', 'My recipes'), (x.retete || []).length);
      tabel([tr('Rețeta', 'Recipe'), tr('Porții', 'Servings'), tr('Ingrediente', 'Ingredients'), tr('Preparare', 'Method')],
        (x.retete || []).map(r => [r.nume, r.portii, (r.ingrediente || []).map(i => `${i.nume} ${i.cantitate_g} g`).join(', '), r.instructiuni]), [80, 40, '*', '*']);
      const cs = (x.ciclu.setari || [])[0];
      sectiune(tr('Ciclu menstrual', 'Menstrual cycle'));
      if (!cs) gol();
      else {
        perechi([[tr('Durata ciclului (zile)', 'Cycle length (days)'), cs.durata_ciclu], [tr('Durata menstruației (zile)', 'Period length (days)'), cs.durata_menstruatie],
          [tr('Vizibil antrenorului', 'Visible to trainer'), cs.vizibil_antrenor ? tr('da', 'yes') : tr('nu', 'no')], [tr('Acord dat la', 'Consent given on'), data(cs.acord_la)]]);
        tabel([tr('Prima zi a menstruației', 'First day of period')], (x.ciclu.menstruatii || []).map(m => [data(m.data_start)]), ['*']);
        tabel([tr('Data', 'Date'), tr('Energie', 'Energy'), tr('Somn', 'Sleep'), tr('Simptome', 'Symptoms')],
          (x.ciclu.zilnic || []).map(z => [data(z.data), z.energie, z.somn, (z.simptome || []).join(', ')]), [70, 50, 50, '*']);
      }
      const cm = (x.comunitate.membru || [])[0];
      sectiune(tr('Comunitate', 'Community'));
      if (!cm) gol();
      else {
        perechi([[tr('Numele afișat', 'Display name'), cm.nume_afisat], [tr('Intrat la', 'Joined on'), data(cm.created_at)],
          [tr('Activități vizibile', 'Visible activities'), [cm.arata_sala !== false && tr('sală', 'gym'), cm.arata_plan !== false && tr('plan', 'plan'), cm.arata_proprii !== false && tr('proprii', 'own')].filter(Boolean).join(', ')],
          [tr('„Bravo” date', '“Well done” given'), (x.comunitate.bravoDate || []).length]]);
        tabel([tr('Data', 'Date'), tr('Tip', 'Type'), tr('Titlu', 'Title'), tr('Doar tu', 'Only you')],
          (x.comunitate.activitati || []).map(a => [data(a.data), a.tip, a.titlu, a.ascuns ? tr('da', 'yes') : tr('nu', 'no')]), [70, 60, '*', 50]);
      }
      sectiune(tr('Mesaje cu antrenorul', 'Messages with your trainer'), (x.mesaje || []).length);
      tabel([tr('Data', 'Date'), tr('De la', 'From'), tr('Mesaj', 'Message')],
        (x.mesaje || []).map(m => [data(m.created_at), m.autor === 'client' ? tr('tu', 'you') : tr('antrenorul', 'trainer'), m.text]), [70, 55, '*']);
      planuri(dateClienta.planuri || []);
    } else {
      const xa = await dateleAntrenoruluiPentruExport();
      sectiune(tr('Clienți', 'Clients'), DB.clienti.length);
      tabel([tr('Nume', 'Name'), tr('Telefon', 'Phone'), 'Email', tr('Abonament', 'Subscription'), tr('Ședințe', 'Sessions'), tr('Început', 'Start'), tr('Expiră', 'Expires'), 'Status'],
        DB.clienti.map(c => [c.nume, c.telefon, c.emailInvitatie, c.tipAbonament, `${c.efectuate}/${c.incluse}`, data(c.dataStart), data(c.dataExpirare), c.status]),
        ['16%', '12%', '18%', '12%', '9%', '11%', '11%', '11%']);
      DB.clienti.filter(c => c.fisaInscriere).forEach(c => {
        sectiune(`${tr('Fișa de obiective', 'Goal-setting form')}: ${c.nume}`);
        perechi(raspunsuriInscriere(c.fisaInscriere));
      });
      sectiune(tr('Orar', 'Schedule'), DB.orarSloturi.length);
      tabel([tr('Ziua', 'Day'), tr('Ora', 'Time'), tr('Client', 'Client'), tr('Antrenament', 'Workout'), tr('Stare', 'Status')],
        DB.orarSloturi.map(s => [s.ziRaw.replace(/_/g, ' '), s.ora, s.clienta, traduceValoare(s.antrenament), [s.bifat && tr('prezent', 'attended'), s.blocat && (tr('blocat', 'blocked') + (s.motiv ? ': ' + s.motiv : '')), s.deschis && tr('deschis', 'open')].filter(Boolean).join(', ')]),
        [90, 40, '*', '*', 90]);
      sectiune(tr('Confirmări', 'Check-in'), DB.progActive.length + DB.progHold.length);
      tabel([tr('Nume', 'Name'), tr('Secțiune', 'Section'), tr('Prezență', 'Attendance'), tr('Mențiuni', 'Notes')],
        DB.progActive.map(p => [p.nume, tr('Activ', 'Active'), p.prezenta, p.mentiuni]).concat(DB.progHold.map(p => [p.nume, 'Hold', p.prezenta, p.mentiuni])),
        ['*', 60, 80, '*']);
      sectiune(tr('Încasări', 'Payments'), DB.incasari.length);
      tabel([tr('Data', 'Date'), tr('Client', 'Client'), tr('Sumă', 'Amount'), tr('Metodă', 'Method'), tr('Tip', 'Type'), tr('Luna', 'Month')],
        DB.incasari.map(i => [data(i.data),i.clienta, formateazaSuma(i.suma), i.metoda, i.tip, i.luna]), [60, '*', 65, 65, '*', 60]);
      sectiune(tr('Prezențe', 'Attendance'), DB.prezente.length);
      tabel([tr('Data', 'Date'), tr('Ziua', 'Day'), tr('Ora', 'Time'), tr('Client', 'Client'), tr('Antrenament', 'Workout')],
        DB.prezente.map(p => [data(p.data),p.zi, p.ora, p.clienta, traduceValoare(p.antrenament)]), [60, 60, 40, '*', '*']);
      planuri(DB.planuri || []);
      sectiune(tr('Rețete pentru clienți', 'Recipes for clients'), xa.retete.length);
      tabel([tr('Rețeta', 'Recipe'), tr('Porții', 'Servings'), tr('Ingrediente', 'Ingredients')], xa.retete.map(r => [r.nume, r.portii, (r.ingrediente || []).map(i => `${i.nume} ${i.cantitate_g} g`).join(', ')]), [100, 45, '*']);
      sectiune(tr('Provocări în comunitate', 'Community challenges'), xa.provocari.length);
      tabel([tr('Titlu', 'Title'), tr('Zile active', 'Active days'), tr('De la', 'From'), tr('Până la', 'Until')], xa.provocari.map(p => [p.titlu, p.tinta, data(p.de), data(p.pana)]), ['*', 60, 70, 70]);
    }

    const doc = {
      pageSize: 'A4',
      pageMargins: [40, 36, 40, 44],
      info: { title: tr('Datele mele', 'My data'), author: 'B-Fit' },
      content: continut,
      pageBreakBefore: (nod, urmatoareleDePePagina) => nod.headlineLevel === 1 && urmatoareleDePePagina.length === 0,
      footer: (pagina, total) => ({ text: tr(`Pagina ${pagina} / ${total}`, `Page ${pagina} / ${total}`), color: gri, fontSize: 7.5, alignment: 'right', margin: [40, 14, 40, 0] }),
      styles: { h2: { fontSize: 12.5, bold: true, color: culoare, margin: [0, 14, 0, 6] } },
      defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#1e293b', lineHeight: 1.2 }
    };
    const blob = await new Promise(resolve => pdfMake.createPdf(doc).getBlob(resolve));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tr('B-Fit - datele mele', 'B-Fit - my data')} ${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Eroare export date:', err);
    showToast(tr('Nu s-a putut genera PDF-ul. Verifică conexiunea la internet.', 'Could not create the PDF. Check your internet connection.'), 'error');
  } finally {
    btn.disabled = false;
  }
}

// Antrenor: se șterg contul și toate datele lui. Client: contul; fișa rămâne la antrenor (vezi sql/2026-10-30_stergere_cont.sql)
function stergeContulMeu() {
  if (!utilizatorCurent) return;
  const cuvant = tr('ȘTERGE', 'DELETE');
  const text = rolUtilizator === 'clienta'
    ? tr('Contul tău se șterge definitiv. Fișa ta (abonament, programări, progres) rămâne la antrenor; pentru ștergerea ei, cere-i antrenorului.',
      'Your account will be permanently deleted. Your record (subscription, bookings, progress) stays with your trainer; ask your trainer to delete it.')
    : tr('Se șterg definitiv contul și toate datele tale: clienți, orar, încasări, prezențe, planuri. Clienții tăi pierd accesul în aplicație. Nu se poate anula.',
      'Your account and all your data will be permanently deleted: clients, schedule, payments, attendance, plans. Your clients lose access to the app. This cannot be undone.');
  customConfirm(tr('Ștergi contul?', 'Delete your account?'), `${text}\n\n${tr('Scrie', 'Type')} ${cuvant} ${tr('ca să confirmi.', 'to confirm.')}`, async (valoare) => {
    const normalizat = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
    if (normalizat(valoare) !== normalizat(cuvant)) {
      showToast(tr('Contul nu a fost șters: cuvântul de confirmare nu se potrivește.', 'Account not deleted: the confirmation word does not match.'), 'error');
      return;
    }
    // Antrenor: întâi pozele de progres ale clienților (Cloudflare R2, prin Worker); fără ele ștergerea nu continuă
    if (URL_POZE && rolUtilizator !== 'clienta') {
      const r = await cerePoze('DELETE', '/cont', {});
      if (!r || !r.ok) {
        showToast(tr('Pozele de progres nu s-au putut șterge. Verifică internetul și reîncearcă.', 'Progress photos could not be deleted. Check your internet and try again.'), 'error');
        return;
      }
    }
    await supabaseClient.storage.from('avatars').remove([`${utilizatorCurent.id}/avatar.webp`]).catch(() => {});
    await dezaboneazaPush();
    const { data, error } = await supabaseClient.rpc('sterge_contul_meu');
    if (error || data !== 'ok') {
      showToast(tr('Contul nu s-a putut șterge. Reîncearcă sau scrie-ne.', 'Could not delete the account. Try again or contact us.'), 'error');
      return;
    }
    deconectareInCurs = true;
    document.documentElement.classList.add('deconectare');
    await supabaseClient.auth.signOut().catch(() => {});
    localStorage.removeItem('BFIT_DB_LOCAL');
    localStorage.removeItem('BFIT_ROL');
    stergeCacheClienti();
    sessionStorage.setItem('BFIT_CONT_STERS', '1');
    window.location.reload();
  }, { placeholder: cuvant });
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

// Cheie de comparare a numelor: fără diacritice, majuscule și spații în plus (rândurile vechi pot avea altă grafie)
function cheieNume(nume) {
  return (nume || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// Rândul (prezență, încasare etc.) aparține clientului: după client_id, iar fără legătură, după nume
function randulClientei(rand, client, numeRand) {
  return !!client && (!!client.id && rand.client_id === client.id || cheieNume(numeRand) === cheieNume(client.nume));
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

// Bara de jos devine compactă (doar iconițe) când utilizatoarea derulează în jos și revine când derulează în sus.
// Reacționează doar la derularea făcută cu degetul / rotița, nu la salturile automate (ex. la ora curentă).
// La client derulează ecranul #clientaScreen (nu fereastra), cu bara #clientaNav.
(function () {
  let ultimaAtingere = 0;
  const marcheazaInteractiune = () => { ultimaAtingere = Date.now(); };
  window.addEventListener('touchmove', marcheazaInteractiune, { passive: true });
  window.addEventListener('wheel', marcheazaInteractiune, { passive: true });

  function urmareste(containerEl, navId, citesteY) {
    let ultimulY = citesteY();
    containerEl.addEventListener('scroll', () => {
      const y = citesteY();
      const delta = y - ultimulY;
      const nav = document.getElementById(navId);
      if (nav && Date.now() - ultimaAtingere < 1200 && Math.abs(delta) > 6) {
        nav.classList.toggle('nav-compact', delta > 0 && y > 40);
      }
      if (nav && y <= 40) nav.classList.remove('nav-compact');
      ultimulY = y;
    }, { passive: true });
  }

  urmareste(window, 'bottomNav', () => window.scrollY);
  const ecranClienta = document.getElementById('clientaScreen');
  if (ecranClienta) urmareste(ecranClienta, 'clientaNav', () => ecranClienta.scrollTop);
})();

// Service worker: pagina se ia mereu de pe internet (versiunea nouă apare la deschidere), fișierele merg și offline
// Local (127.0.0.1 / localhost) fără service worker, ca modificările să se vadă imediat la testare
if ('serviceWorker' in navigator) {
  if (['127.0.0.1', 'localhost'].includes(location.hostname)) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  } else {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// Invitație de instalare la deschiderea linkului în browser: Android prin promptul nativ, iPhone cu pașii „Adaugă pe ecranul principal”
(function () {
  const CHEIE = 'BFIT_INSTALL_AMANAT';
  const PAUZA_MS = 7 * 24 * 3600 * 1000;
  const instalata = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const esteIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let promptAndroid = null;
  if (instalata) return;

  const amanat = () => {
    try { return Date.now() - Number(localStorage.getItem(CHEIE) || 0) < PAUZA_MS; } catch (e) { return false; }
  };
  const inchide = (amana) => {
    document.getElementById('invitatieInstalare')?.remove();
    if (amana) { try { localStorage.setItem(CHEIE, String(Date.now())); } catch (e) {} }
  };
  const arata = () => {
    if (document.getElementById('invitatieInstalare') || amanat()) return;
    const pasiIos = tr('Apasă Partajează (pătratul cu săgeată), apoi „Adaugă pe ecranul principal”.', 'Tap Share (the square with an arrow), then “Add to Home Screen”.');
    const div = document.createElement('div');
    div.id = 'invitatieInstalare';
    div.className = 'invitatie-instalare';
    div.innerHTML = `<img src="icon-192.png" alt="" class="invitatie-instalare-icon">
      <div class="invitatie-instalare-text"><b>${tr('Instalează B-Fit', 'Install B-Fit')}</b><span>${esteIos ? pasiIos : tr('O deschizi direct, ca pe orice aplicație.', 'Open it directly, like any app.')}</span></div>
      ${esteIos ? '' : `<button type="button" class="btn" id="btnInstaleaza">${tr('Instalează', 'Install')}</button>`}
      <button type="button" class="notificare-x" id="btnInchideInstalare" aria-label="${tr('Închide', 'Close')}">×</button>`;
    document.body.appendChild(div);
    document.getElementById('btnInchideInstalare').onclick = () => inchide(true);
    const btn = document.getElementById('btnInstaleaza');
    if (btn) btn.onclick = async () => {
      if (!promptAndroid) return inchide(false);
      promptAndroid.prompt();
      await promptAndroid.userChoice.catch(() => {});
      promptAndroid = null;
      inchide(false);
    };
  };

  window.addEventListener('appinstalled', () => inchide(false));
  if (esteIos) {
    setTimeout(arata, 1500);
  } else {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      promptAndroid = e;
      setTimeout(arata, 1500);
    });
  }
})();

// Barele telefonului (ceas/baterie sus, linia de gesturi jos) iau nuanța header-ului din tema curentă (--status-bar-color)
(function () {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const actualizeaza = () => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--status-bar-color').trim();
    if (bg) meta.setAttribute('content', bg);
  };
  new MutationObserver(actualizeaza).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] });
  actualizeaza();
})();

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
  if (elStart) elStart.value = ''; // gol: abonamentul pornește la prima ședință bifată
}

// Setările orarului: în contul Supabase (user_metadata, aceleași pe toate dispozitivele), cu o copie locală pentru pornire instant
let setariOrar = { locuri: 3, weekend: false };
try { Object.assign(setariOrar, JSON.parse(localStorage.getItem('beatrix_setari_orar') || '{}')); } catch(e) {}
let salvareSetariOrarInCurs = 0;

function getZileActive() {
  let zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
  return setariOrar.weekend ? zile.concat(["Sambata", "Duminica"]) : zile;
}

// Ziua de azi dacă apare în bara de zile, altfel Luni
function getZiImplicitaAzi() {
  let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
  let azi = zileChei[new Date().getDay()];
  return getZileActive().includes(azi) ? azi : "Luni";
}

function calculeazaLuniInitial() {
  let d = new Date();
  let day = d.getDay();
  let ora = d.getHours();

  // Cu weekendul în orar, sâmbăta și duminica rămân în săptămâna curentă
  let esteTrecutDeVineriSeara = !setariOrar.weekend && ((day === 5 && ora >= 22) || (day === 6) || (day === 0));

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
let dataUltimeiVerificari = new Date().toDateString(); // pentru revenirea din fundal într-o zi nouă
let momentIntrareFundal = 0; // la revenire sărim la ora curentă doar după o pauză lungă (meniul de partajare, un mesaj scurt nu mută orarul)
const PAUZA_SALT_ORA_CURENTA = 5 * 60 * 1000;
let modalCallback = null;

// Tipurile implicite; antrenorul le schimbă din Setări › Tipuri de antrenament (setariStudio.antrenamente)
const ANTRENAMENTE_IMPLICITE = [
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
const CULORI_ANTRENAMENT = ['ant-orange', 'ant-yellow', 'ant-red', 'ant-burgundy', 'ant-pink', 'ant-purple', 'ant-darkblue', 'ant-lightblue', 'ant-turquoise', 'ant-lightgreen'];
const METODE_PLATA_IMPLICITE = ['Cash', 'Card', 'Revolut', 'ING', 'Transfer bancar'];
const MONEDE = ['RON', 'EUR', 'USD', 'GBP', 'HUF', 'CHF'];

// Tipuri de antrenament, metode de plată și moneda: în contul Supabase (user_metadata.setari_studio), cu o copie locală,
// ca setariOrar. În bază rămâne textul ales atunci, așa că un tip șters sau redenumit apare în continuare la rândurile vechi.
let setariStudio = { antrenamente: ANTRENAMENTE_IMPLICITE.map(a => ({ ...a })), metodePlata: METODE_PLATA_IMPLICITE.slice(), moneda: 'RON' };
try { Object.assign(setariStudio, JSON.parse(localStorage.getItem('beatrix_setari_studio') || '{}')); } catch(e) {}
let salvareSetariStudioInCurs = 0;
let timerSalvareSetariStudio = null;
const optiuniAntrenamentConfig = setariStudio.antrenamente;

// Culoarea unui tip: din lista curentă, altfel din cea implicită (tipurile vechi din istoric își păstrează culoarea)
function culoareAntrenament(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return '';
  const cfg = optiuniAntrenamentConfig.find(a => a.text.toLowerCase() === t) || ANTRENAMENTE_IMPLICITE.find(a => a.text.toLowerCase() === t);
  return cfg ? cfg.cls : '';
}

// Suma fără monedă („400 RON” din rândurile vechi → „400”) și cu moneda din setări
function sumaFaraMoneda(s) {
  return String(s || '').replace(/[^\d.,\-]/g, '').trim();
}
function formateazaSuma(s) {
  const n = sumaFaraMoneda(s);
  return n ? `${n} ${setariStudio.moneda}` : '-';
}

const preturiAbonament = {
  "18 trainers (12)": "400",
  "8 sedinte": "450", "10 sedinte": "520", "12 sedinte": "600",
  "16 sedinte": "750", "16 sedinte 1:1": "900", "sedinta individuala": "70", "sedinta gratuita": "0"
};

// Tipurile implicite de abonament (Setări › Abonamente pornește de la ele). fel: abonament (ședințe numărate, valabil `zile`
// de la prima ședință) | unica (valabilă în ziua plății, nu peste un abonament activ) | gratuita (ca unica, o dată per client)
const FELURI_ABONAMENT = ['abonament', 'unica', 'gratuita'];
const ABONAMENTE_IMPLICITE = [
  { nume: "8 sedinte", pret: 450, sedinte: 8, zile: 30, fel: 'abonament' },
  { nume: "10 sedinte", pret: 520, sedinte: 10, zile: 30, fel: 'abonament' },
  { nume: "12 sedinte", pret: 600, sedinte: 12, zile: 30, fel: 'abonament' },
  { nume: "16 sedinte", pret: 750, sedinte: 16, zile: 30, fel: 'abonament' },
  { nume: "16 sedinte 1:1", pret: 900, sedinte: 16, zile: 30, fel: 'abonament' },
  { nume: "18 trainers (12)", pret: 400, sedinte: 12, zile: 30, fel: 'abonament' },
  { nume: "Sedinta Individuala", pret: 70, sedinte: 1, zile: 30, fel: 'unica' },
  { nume: "Sedinta Gratuita", pret: 0, sedinte: 1, zile: 30, fel: 'gratuita' }
];
if (!Array.isArray(setariStudio.abonamente)) setariStudio.abonamente = ABONAMENTE_IMPLICITE.map(a => ({ ...a }));

// Numele salvate au variante („8 sedinte ”, „Sedinta Individuala” / „sedinta individuala”): se compară fără spații în plus, majuscule și diacritice
function cheieAbonament(tip) {
  return String(tip || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Regulile unui abonament după numele salvat: din Setări (inclusiv tipurile șterse sau redenumite, păstrate pentru rândurile vechi),
// altfel deduse din nume ca înainte de Setări › Abonamente
function regulaAbonament(tip) {
  const cheie = cheieAbonament(tip);
  const gasit = cheie && setariStudio.abonamente.find(a => cheieAbonament(a.nume) === cheie || (a.alias || []).some(x => cheieAbonament(x) === cheie));
  if (gasit) return gasit;
  const pret = preturiAbonament[normalizeazaTipAbonament(tip)];
  return {
    nume: String(tip || '').trim(), pret: pret !== undefined ? Number(pret) : null, sedinte: getNrSedinteDinNume(tip), zile: 30,
    fel: cheie.indexOf('gratuit') !== -1 ? 'gratuita' : cheie.indexOf('individual') !== -1 ? 'unica' : 'abonament'
  };
}

// Zilele de valabilitate de la start: ședința unică și cea gratuită sunt valabile doar în ziua lor
function zileValabilitateAbonament(tip) {
  const r = regulaAbonament(tip);
  return r.fel === 'abonament' ? r.zile : 0;
}

const abonamenteVizibile = () => setariStudio.abonamente.filter(a => !a.sters);

// Abonament înghețat (Fișă › Îngheață): status 'Inghetat' (fără diacritice, ca să-l compare și SQL-ul cu lower()),
// expirarea '-' cât durează pauza, iar data înghețării și expirarea de dinainte în coloana `inghetare`
const esteInghetat = c => !!c && (c.status || '').toLowerCase() === 'inghetat';

// La reluare (din fișă sau la prima ședință bifată): expirarea de dinainte + zilele de pauză, până la `dataRo`
function campuriReluareInghetare(c, dataRo) {
  const g = c.inghetare || {};
  const dela = parseazaDataOraRo(g.de_la);
  const pana = parseazaDataOraRo(dataRo) || new Date().setHours(0, 0, 0, 0);
  const zile = dela ? Math.max(0, Math.round((new Date(pana).setHours(0, 0, 0, 0) - new Date(dela).setHours(0, 0, 0, 0)) / 86400000)) : 0;
  const exp = parseazaDataOraRo(g.exp);
  let dataExpirare = g.exp && g.exp !== '-' ? g.exp : '-';
  if (exp) { const d = new Date(exp); d.setDate(d.getDate() + zile); dataExpirare = formateazaDataRoLocal(d); }
  return { status: 'Activ', dataExpirare, inghetare: null };
}

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

// Alegere din lista de cliente (nu tastare): evenimentul vine ca înlocuire / fără inputType, sau textul sare cu mai mult de un caracter.
// Telefoanele raportează inputType diferit, de aceea nu ne bazăm doar pe el.
function esteAlegereDinLista(el, ev) {
  const lungimeVeche = el._lungimeAnterioara || 0;
  el._lungimeAnterioara = el.value.length;
  return !!ev && (ev.inputType === 'insertReplacementText' || !ev.inputType || el.value.length - lungimeVeche > 1);
}

// Fișă clientă: după alegerea din listă ieșim din câmp și afișăm fișa imediat (onchange vine abia la blur, nu mereu pe telefon)
function peInputClientaFisa(ev) {
  const el = ev.target;
  actualizeazaStilSelect(el);
  if (esteAlegereDinLista(el, ev) && gasesteClientaValida(el.value.trim())) {
    el.blur();
    afiseazaFisaClientaInstant();
  } else if (document.getElementById('detaliiFisa').style.display === 'none') {
    randeazaListaClienteFisa(); // lista de sub căutare se filtrează pe măsură ce scrii
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
  sel.classList.remove(...CULORI_ANTRENAMENT);
  let cls = culoareAntrenament(sel.value);
  if (cls) sel.classList.add(cls);
}

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
  return regulaAbonament(tip).sedinte;
}

// Numărul de ședințe dedus din nume (abonamentele de dinainte de Setări › Abonamente)
function getNrSedinteDinNume(tip) {
  let t = (tip || "").toLowerCase();
  if (t.indexOf("gratuit") !== -1) return 1;
  if (t.indexOf("trainers") !== -1 || t.indexOf("18") !== -1) return 12;
  if (t.indexOf("16") !== -1) return 16;
  if (t.indexOf("12") !== -1) return 12;
  if (t.indexOf("10") !== -1) return 10;
  if (t.indexOf("8") !== -1) return 8;
  if (t.indexOf("individual") !== -1 || t.indexOf("1") !== -1) return 1;
  return 8;
}

// ==========================================
// 2. LOGICĂ BACKEND SUPABASE
// ==========================================

async function executaActiuneSupabase(actionName, payload) {
  const sb = supabaseClient;
  const uid = utilizatorCurent ? utilizatorCurent.id : null;

  const gasesteIdDupaNume = async (nume) => {
    if (!nume || !nume.trim()) return "";
    let q = sb.from('cliente').select('id, row').ilike('nume', nume.trim());
    if (uid) q = q.eq('user_id', uid);
    const { data } = await q.limit(1);
    if (data && data.length > 0) return data[0].id || ("cli_" + data[0].row);
    return "";
  };

  const gasesteSauCreeazaSlotSupabase = async (saptamanaCheie, zi, ora, slotIndex, rowPropus) => {
    const tagZi = construiesteTagZiLocal(saptamanaCheie, zi);
    const oraNorm = normalizeazaOraUi(ora);
    const slotIdx = (typeof slotIndex === "number") ? slotIndex : 0;

    if (rowPropus) {
      let q = sb.from('orar').select('*').eq('row', rowPropus);
      if (uid) q = q.eq('user_id', uid);
      const { data: ex } = await q.maybeSingle();
      if (ex) {
        const zEx = (ex.ziRaw || "").trim();
        const oEx = normalizeazaOraUi(ex.ora);
        const sEx = Number(ex.slotIndex) || 0;
        if ((zEx === tagZi || (zi === "Marti" && zEx === (saptamanaCheie + "_Marți"))) && oEx === oraNorm && sEx === slotIdx) {
          return ex;
        }
      }
    }

    let qList = sb.from('orar')
      .select('*')
      .in('ziRaw', zi === "Marti" ? [tagZi, saptamanaCheie + "_Marți"] : [tagZi])
      .eq('ora', oraNorm)
      .eq('slotIndex', slotIdx);
    if (uid) qList = qList.eq('user_id', uid);
    const { data: list } = await qList.limit(1);

    if (list && list.length > 0) return list[0];

    const slotNou = {
      ziRaw: tagZi,
      ora: oraNorm,
      clienta: "",
      antrenament: "",
      blocat: false,
      bifat: false,
      slotIndex: slotIdx,
      client_id: ""
    };
    if (uid) slotNou.user_id = uid;

    const { data: creat } = await sb.from('orar').insert([slotNou]).select().single();
    return creat;
  };

  if (actionName === "getTotBazaDeDate") {
    let qCli = sb.from('cliente').select('*');
    let qOrar = sb.from('orar').select('*').order('row', { ascending: true });
    let qProg = sb.from('confirmari').select('*').order('row', { ascending: true });
    let qInc = sb.from('incasari').select('*').order('row', { ascending: false });
    let qPrez = sb.from('prezente').select('*').order('row', { ascending: false });
    let qPlanuri = sb.from('planuri_antrenament').select('*').order('updated_at', { ascending: false });
    let qCereri = sb.from('cereri_inscriere').select('*').eq('stare', 'noua').order('created_at', { ascending: false });

    if (uid) {
      qCereri = qCereri.eq('user_id', uid);
      qCli = qCli.eq('user_id', uid);
      qOrar = qOrar.eq('user_id', uid);
      qProg = qProg.eq('user_id', uid);
      qInc = qInc.eq('user_id', uid);
      qPrez = qPrez.eq('user_id', uid);
    }

    // Supabase întoarce maximum 1.000 de rânduri pe cerere: orarul, prezențele și încasările cresc în timp, deci se citesc pe pagini
    // (ordinea după „row”, unică, ține paginile fără goluri sau dubluri)
    const toateRandurile = async (q) => {
      const tot = [];
      for (let de = 0; ; de += 1000) {
        const { data, error } = await q.range(de, de + 999);
        if (error) return { data: tot, error };
        tot.push(...(data || []));
        if (!data || data.length < 1000) return { data: tot };
      }
    };

    const [resCli, resOrar, resProg, resInc, resPrez, resPlan, resCereri] = await Promise.all([
      qCli, toateRandurile(qOrar), qProg, toateRandurile(qInc), toateRandurile(qPrez), qPlanuri, qCereri
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
      id: c.id || ("cli_" + c.row),
      emailInvitatie: (c.email_invitatie || "").trim(),
      telefon: (c.telefon || "").trim(),
      contConectat: !!c.auth_user_id,
      checkinToken: c.checkin_token || null,
      fisaInscriere: c.fisa_inscriere || null,
      notaClient: c.nota_client || '',
      notaClientLa: c.nota_client_la || null,
      obiectiv: c.obiectiv || null,
      inghetare: c.inghetare || null,
      sedinteSaptamana: Number(c.sedinte_saptamana) || null
    })).filter(c => c.nume !== "");

    clienti.sort((a, b) => a.nume.localeCompare(b.nume));

    const orarSloturi = (resOrar.data || []).map(o => ({
      row: o.row,
      ziRaw: (o.ziRaw || "").trim(),
      ora: normalizeazaOraUi(o.ora),
      clienta: (o.clienta || "").trim(),
      antrenament: (o.antrenament || "").trim(),
      blocat: !!o.blocat,
      motiv: (o.motiv || "").trim(),
      bifat: !!o.bifat,
      slotIndex: Number(o.slotIndex) || 0,
      deschis: !!o.deschis,
      rezervatOnline: !!o.rezervat_online
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
        mentiuni: (p.mentiuni || "").trim(),
        client_id: p.client_id || null
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
        suma: sumaFaraMoneda(sVal) || "-",
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
      antrenament: p.antrenament || "-",
      client_id: p.client_id || ""
    })).filter(p => p.clienta !== "");

    const planuri = (resPlan.data || []).map(pl => ({
      id: pl.id,
      user_id: pl.user_id,
      clienta: pl.clienta || "",
      titlu: pl.titlu || "Program de antrenament",
      subtitlu: pl.subtitlu || "",
      continut_json: pl.continut_json || {},
      updated_at: pl.updated_at
    }));

    // Fără tabelul cereri_inscriere (scriptul SQL nerulat) lista rămâne goală
    const cereri = resCereri.error ? [] : (resCereri.data || []);

    return { clienti, orarSloturi, progActive, progHold, incasari, prezente, planuri, cereri };
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
      let qEx = sb.from('prezente')
        .select('*')
        .eq('data', payload.dataCalendar)
        .eq('ora', oraNorm)
        .ilike('clienta', payload.clienta.trim());
      if (uid) qEx = qEx.eq('user_id', uid);
      const { data: exPrez } = await qEx.limit(1);

      if (exPrez && exPrez.length > 0) {
        await sb.from('prezente').update({ antrenament: payload.antrenament || "", client_id: idCli }).eq('row', exPrez[0].row);
      } else {
        const rowPrezNou = {
          data: payload.dataCalendar,
          zi: payload.zi,
          ora: oraNorm,
          clienta: payload.clienta.trim(),
          antrenament: payload.antrenament || "",
          client_id: idCli
        };
        if (uid) rowPrezNou.user_id = uid;
        await sb.from('prezente').insert([rowPrezNou]);
      }

      let qCl = sb.from('cliente').select('*').ilike('nume', payload.clienta.trim());
      if (uid) qCl = qCl.eq('user_id', uid);
      const { data: clList } = await qCl.limit(1);
      if (clList && clList.length > 0) {
        const cl = clList[0];
        const incluse = Number(cl.incluse) || 0;
        const efectuate = (Number(cl.efectuate) || 0) + 1;
        const ramase = Math.max(0, incluse - efectuate);
        const upd = { efectuate, ramase };
        // Clientul înghețat a venit la o ședință: abonamentul se reia, cu zilele de pauză până azi
        if (esteInghetat(cl)) Object.assign(upd, campuriReluareInghetare(cl, payload.dataCalendar));
        if (ramase === 0 && incluse > 0) upd.status = "Finalizat";
        // Abonament fără dată de start: pornește la prima ședință bifată, valabil câte zile are tipul (implicit 30)
        if ((!cl.dataStart || cl.dataStart === "-") && payload.dataCalendar) {
          const dStart = new Date(parseazaDataOraRo(payload.dataCalendar));
          const dExp = new Date(dStart.getTime());
          dExp.setDate(dExp.getDate() + zileValabilitateAbonament(cl.tipAbonament));
          upd.dataStart = formateazaDataRoLocal(dStart);
          upd.dataExpirare = formateazaDataRoLocal(dExp);
        }
        await sb.from('cliente').update(upd).eq('row', cl.row);
      }
    }
    return { success: true, row: slot.row };
  }

  if (actionName === "anuleazaSlot") {
    const slot = await gasesteSauCreeazaSlotSupabase(payload.saptamanaCheie, payload.zi, payload.ora, payload.slotIndex, payload.row);
    const clientaVeche = (slot.clienta || "").trim();
    const aFostBifat = !!slot.bifat;
    const oraNorm = normalizeazaOraUi(payload.ora);

    await sb.from('orar').update({
      clienta: "",
      antrenament: "",
      bifat: false,
      client_id: ""
    }).eq('row', slot.row);

    if (clientaVeche !== "" && aFostBifat) {
      let qP = sb.from('prezente')
        .select('row')
        .eq('data', payload.dataCalendar)
        .eq('ora', oraNorm)
        .ilike('clienta', clientaVeche);
      if (uid) qP = qP.eq('user_id', uid);
      const { data: pList } = await qP.limit(1);

      if (pList && pList.length > 0) {
        await sb.from('prezente').delete().eq('row', pList[0].row);
      }

      let qCl = sb.from('cliente').select('*').ilike('nume', clientaVeche);
      if (uid) qCl = qCl.eq('user_id', uid);
      const { data: clList } = await qCl.limit(1);
      if (clList && clList.length > 0) {
        const cl = clList[0];
        const incluse = Number(cl.incluse) || 0;
        const efectuate = Math.max(0, (Number(cl.efectuate) || 0) - 1);
        const ramase = Math.max(0, incluse - efectuate);
        const upd = { efectuate, ramase, status: "Activ" };
        if (esteInghetat(cl)) delete upd.status;
        // A fost anulată chiar ședința care a pornit abonamentul: așteaptă din nou prima ședință
        if (efectuate === 0 && cl.dataStart === payload.dataCalendar && regulaAbonament(cl.tipAbonament).fel === 'abonament') {
          upd.dataStart = "-";
          upd.dataExpirare = "-";
        }
        await sb.from('cliente').update(upd).eq('row', cl.row);
      }
    }
    return { success: true, row: slot.row };
  }

  if (actionName === "comutaBlocareOra") {
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    const oraNorm = normalizeazaOraUi(payload.ora);
    let qG = sb.from('orar')
      .select('row')
      .in('ziRaw', payload.zi === "Marti" ? [tagZi, payload.saptamanaCheie + "_Marți"] : [tagZi])
      .eq('ora', oraNorm);
    if (uid) qG = qG.eq('user_id', uid);
    const { data: gasite } = await qG;

    if (gasite && gasite.length > 0) {
      const ids = gasite.map(g => g.row);
      const upd = { blocat: !!payload.blocat };
      if (payload.motiv !== undefined) upd.motiv = payload.motiv;
      const { error: errUpd } = await sb.from('orar').update(upd).in('row', ids);
      if (errUpd) throw errUpd;
    } else {
      const noi = Array.from({ length: setariOrar.locuri }, (_, idx) => {
        const item = {
          ziRaw: tagZi, ora: oraNorm, clienta: "", antrenament: "", blocat: !!payload.blocat, motiv: payload.motiv || "", bifat: false, slotIndex: idx, client_id: ""
        };
        if (uid) item.user_id = uid;
        return item;
      });
      const { error: errIns } = await sb.from('orar').insert(noi);
      if (errIns) throw errIns;
    }
    return { success: true };
  }

  if (actionName === "seteazaSlotDeschis") {
    const slot = await gasesteSauCreeazaSlotSupabase(payload.saptamanaCheie, payload.zi, payload.ora, payload.slotIndex, payload.row);
    const { error } = await sb.from('orar').update({ deschis: !!payload.deschis }).eq('row', slot.row);
    if (error) throw error;
    return { success: true, row: slot.row };
  }

  if (actionName === "salveazaMotivOra") {
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    const oraNorm = normalizeazaOraUi(payload.ora);
    let q = sb.from('orar')
      .update({ motiv: payload.motiv || "" })
      .in('ziRaw', payload.zi === "Marti" ? [tagZi, payload.saptamanaCheie + "_Marți"] : [tagZi])
      .eq('ora', oraNorm);
    if (uid) q = q.eq('user_id', uid);
    const { error } = await q;
    if (error) throw error;
    return { success: true };
  }

  if (actionName === "adaugaOraCustom") {
    const oraNorm = normalizeazaOraUi(payload.ora);
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    const noi = Array.from({ length: setariOrar.locuri }, (_, idx) => {
      const item = {
        ziRaw: tagZi, ora: oraNorm, clienta: "", antrenament: "", blocat: false, bifat: false, slotIndex: idx, client_id: ""
      };
      if (uid) item.user_id = uid;
      return item;
    });
    const { data: randuri } = await sb.from('orar').insert(noi).select();
    return { success: true, ora: oraNorm, randuri: randuri || [] };
  }

  if (actionName === "stergeOraCustom") {
    const oraNorm = normalizeazaOraUi(payload.ora);
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    let q = sb.from('orar')
      .select('row, clienta, bifat')
      .in('ziRaw', payload.zi === "Marti" ? [tagZi, payload.saptamanaCheie + "_Marți"] : [tagZi])
      .eq('ora', oraNorm);
    if (uid) q = q.eq('user_id', uid);
    const { data: gasite } = await q;
    // Verificare și aici, pe datele din bază: între timp cineva putea rezerva un loc
    if ((gasite || []).some(s => (s.clienta || '').trim() || s.bifat)) return { success: false };
    if (gasite && gasite.length) await sb.from('orar').delete().in('row', gasite.map(s => s.row));
    return { success: true };
  }

  if (actionName === "inregistreazaAbonament") {
    const regula = regulaAbonament(payload.tip);
    const esteGratuita = regula.fel === 'gratuita';
    // Ședința gratuită și cea unică (individuală) se plătesc pe loc: valabile doar în ziua plății
    const esteSedintaUnica = regula.fel !== 'abonament';
    const dPlata = payload.dataPlata ? new Date(payload.dataPlata) : new Date();
    // Fără dată de start, abonamentul pornește la prima ședință bifată (vezi bifeazaPrezenta)
    const dStart = esteSedintaUnica ? new Date(dPlata.getTime()) : (payload.dataStart ? new Date(payload.dataStart) : null);
    const dExp = dStart ? new Date(dStart.getTime()) : null;
    if (dExp && !esteSedintaUnica) dExp.setDate(dExp.getDate() + regula.zile);

    const totalSedinte = regula.sedinte;
    const dataPlataRo = formateazaDataRoLocal(dPlata);
    const dataStartRo = dStart ? formateazaDataRoLocal(dStart) : "-";
    const dataExpRo = dExp ? formateazaDataRoLocal(dExp) : "-";
    const luniRoNume = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
    const lunaNume = luniRoNume[dPlata.getMonth()];

    let qCli = sb.from('cliente').select('*').ilike('nume', payload.nume.trim());
    if (uid) qCli = qCli.eq('user_id', uid);
    const { data: exCli } = await qCli.limit(1);
    let idCli = "";

    const abonamentActiv = !!(exCli && exCli.length > 0 && areAbonamentActiv(exCli[0]));
    if (esteSedintaUnica && abonamentActiv) return { success: false, refuz: 'abonament_activ' };
    // Abonament nou peste unul activ sau neplătit (activat din fișă): întâi întrebăm dacă îl înlocuim sau e doar plata lui
    const neplatit = !!(exCli && exCli.length > 0 && exCli[0].platit === false);
    if (!esteSedintaUnica && (abonamentActiv || neplatit) && !payload.mod) return { success: false, refuz: 'confirma_abonament_activ', neplatit };
    if (esteGratuita) {
      // Orice tip gratuit (din Setări sau cu „gratuit” în nume), nu doar cel ales acum
      let qG = sb.from('incasari').select('tip').ilike('clienta', payload.nume.trim());
      if (uid) qG = qG.eq('user_id', uid);
      const { data: platiClient } = await qG;
      if ((platiClient || []).some(i => regulaAbonament(i.tip).fel === 'gratuita')) return { success: false, refuz: 'gratuita_folosita' };
    } else if (regula.oData && payload.mod !== 'doar_plata') {
      // Ofertă „o singură dată per client”: refuzată dacă a mai fost plătită sau e chiar abonamentul lui de acum (inclusiv sub un nume vechi)
      let qO = sb.from('incasari').select('tip').ilike('clienta', payload.nume.trim());
      if (uid) qO = qO.eq('user_id', uid);
      const { data: platiClient } = await qO;
      const folosita = (platiClient || []).some(i => regulaAbonament(i.tip) === regula)
        || !!(exCli && exCli.length > 0 && regulaAbonament(exCli[0].tipAbonament) === regula);
      if (folosita) return { success: false, refuz: 'oferta_folosita' };
    }

    // null (clienții de dinainte de coloană) contează ca plătit
    const platit = payload.mod !== 'fara_plata';
    if (payload.mod === 'doar_plata') {
      idCli = exCli[0].id || ("cli_" + exCli[0].row);
      await sb.from('cliente').update({ platit: true }).eq('row', exCli[0].row);
    } else if (!exCli || exCli.length === 0) {
      const rowCliNou = {
        nume: payload.nume.trim(),
        tipAbonament: payload.tip,
        incluse: totalSedinte,
        efectuate: 0,
        ramase: totalSedinte,
        dataStart: dataStartRo,
        dataExpirare: dataExpRo,
        status: "Activ",
        platit
      };
      if (uid) rowCliNou.user_id = uid;

      const { data: ins } = await sb.from('cliente').insert([rowCliNou]).select().single();
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
        status: "Activ",
        platit,
        // Abonamentul nou înlocuiește și o pauză în curs
        ...(exCli[0].inghetare ? { inghetare: null } : {})
      }).eq('row', exCli[0].row);
    }
    // Activat din fișă, înainte de plată: nimic la încasări
    if (payload.mod === 'fara_plata') return { success: true };

    const rowIncNou = {
      data: dataPlataRo,
      clienta: payload.nume.trim(),
      suma: (payload.suma || "").toString(),
      metoda: payload.metoda || "",
      tip: payload.tip || "",
      luna: lunaNume,
      client_id: idCli
    };
    if (uid) rowIncNou.user_id = uid;

    await sb.from('incasari').insert([rowIncNou]);
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
    const sumaCurata = sumaFaraMoneda(payload.suma);
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
    await sb.from('confirmari').update(upd).eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "adaugaRandProgramare") {
    const valPrezenta = payload.esteHold ? "" : (payload.prezenta || "In asteptare");
    const idCli = await gasesteIdDupaNume(payload.nume);
    const rowProgNou = {
      sectiune: payload.esteHold ? "Hold" : "Activ",
      nume: payload.nume,
      prezenta: valPrezenta,
      mentiuni: payload.mentiuni || "",
      client_id: idCli
    };
    if (uid) rowProgNou.user_id = uid;
    await sb.from('confirmari').insert([rowProgNou]);
    return { success: true };
  }

  if (actionName === "mutaInHold") {
    await sb.from('confirmari').update({ sectiune: "Hold", prezenta: "" }).eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "stergeRandProgramare") {
    await sb.from('confirmari').delete().eq('row', payload.row);
    return { success: true };
  }

  if (actionName === "actualizeazaDateClienta") {
    const numeVechi = (payload.numeVechi || "").trim();
    const numeNou = (payload.numeNou && payload.numeNou.trim() !== "") ? payload.numeNou.trim() : numeVechi;
    let qEx = sb.from('cliente').select('*').ilike('nume', numeVechi);
    if (uid) qEx = qEx.eq('user_id', uid);
    const { data: ex } = await qEx.limit(1);

    if (ex && ex.length > 0) {
      const actualizare = {
        nume: numeNou,
        tipAbonament: payload.tip,
        incluse: Number(payload.incluse) || 0,
        efectuate: Number(payload.efectuate) || 0,
        ramase: Number(payload.ramase) || 0,
        dataStart: payload.dataStart,
        dataExpirare: payload.dataExp,
        status: payload.status,
        telefon: (payload.telefon || "").trim()
      };
      // Emailul e cel al invitației; cu cont conectat e emailul contului și nu se schimbă (legarea s-ar pierde)
      if (!ex[0].auth_user_id) actualizare.email_invitatie = (payload.email || "").trim().toLowerCase();
      await sb.from('cliente').update(actualizare).eq('row', ex[0].row);

      // Numele se schimbă peste tot: după client_id (legătura sigură, prinde și nume rămase vechi din redenumiri anterioare)
      // și după numele vechi (rândurile fără client_id). La planuri, client_id îl pune baza după nume (trigger leaga_plan_de_client).
      const idClienta = ex[0].id || ("cli_" + ex[0].row);
      const tabeleCuNume = [['orar', 'clienta'], ['prezente', 'clienta'], ['confirmari', 'nume'], ['incasari', 'clienta']];
      const cereri = tabeleCuNume.map(([tabel, col]) => {
        let q = sb.from(tabel).update({ [col]: numeNou }).eq('client_id', idClienta).neq(col, numeNou);
        return uid ? q.eq('user_id', uid) : q;
      });
      if (numeVechi.toLowerCase() !== numeNou.toLowerCase()) {
        tabeleCuNume.concat([['planuri_antrenament', 'clienta']]).forEach(([tabel, col]) => {
          let q = sb.from(tabel).update({ [col]: numeNou }).ilike(col, numeVechi);
          cereri.push(uid ? q.eq('user_id', uid) : q);
        });
      }
      // Rândurile vechi fără client_id, cu numele salvat ușor diferit (ex. spațiu la final): vin alese din aplicație
      // după numele afișat (payload.randuri). Primesc numele nou și legătura client_id, ca redenumirile viitoare să le prindă.
      Object.entries(payload.randuri || {}).forEach(([tabel, randuri]) => {
        const col = (tabeleCuNume.find(([t]) => t === tabel) || [])[1];
        if (!col || !randuri.length) return;
        let q = sb.from(tabel).update({ [col]: numeNou, client_id: idClienta }).in('row', randuri);
        cereri.push(uid ? q.eq('user_id', uid) : q);
      });
      await Promise.all(cereri);
      return { success: true, numeNou };
    }
    return { success: false, numeNou };
  }

  if (actionName === "adaugaClientaDirect") {
    const incluse = getNrSedinteAbonamentLocal(payload.tip);
    const rowDirect = {
      nume: payload.nume.trim(),
      tipAbonament: payload.tip,
      incluse: incluse,
      efectuate: 0,
      ramase: incluse,
      dataStart: "-",
      dataExpirare: "-",
      status: "Activ",
      telefon: (payload.telefon || "").trim()
    };
    if (uid) rowDirect.user_id = uid;

    const { data: ins } = await sb.from('cliente').insert([rowDirect]).select().single();
    if (ins) {
      await sb.from('cliente').update({ id: "cli_" + ins.row }).eq('row', ins.row);
    }
    return { success: true };
  }

  if (actionName === "seteazaStatusClienta") {
    let q = sb.from('cliente').update({ status: payload.statusNou }).ilike('nume', payload.nume.trim());
    if (uid) q = q.eq('user_id', uid);
    await q;
    return { success: true };
  }

  if (actionName === "prelungesteValabilitate") {
    let nouaData;
    if (payload.dataManuala) {
      nouaData = new Date(payload.dataManuala);
    } else {
      // +7 / +14 / +30 se adună la expirarea curentă (apăsări repetate se cumulează); expirat sau fără dată: de azi
      let qExp = sb.from('cliente').select('dataExpirare').ilike('nume', payload.nume.trim());
      if (uid) qExp = qExp.eq('user_id', uid);
      const { data: exList } = await qExp.limit(1);
      const azi = new Date(); azi.setHours(0, 0, 0, 0);
      const expCurenta = parseazaDataOraRo(exList && exList[0] ? exList[0].dataExpirare : '');
      nouaData = new Date(Math.max(azi.getTime(), expCurenta || 0));
      nouaData.setDate(nouaData.getDate() + Number(payload.zile));
    }
    const dataFinalaRo = formateazaDataRoLocal(nouaData);
    let q = sb.from('cliente').update({ dataExpirare: dataFinalaRo, status: "Activ" }).ilike('nume', payload.nume.trim());
    if (uid) q = q.eq('user_id', uid);
    await q;
    return { success: true, nouaData: dataFinalaRo };
  }

  // Pauză: zilele abonamentului se opresc (fără rezervări și fără notificări de expirare) până la Reia
  if (actionName === "ingheataAbonament" || actionName === "reiaAbonament") {
    let qC = sb.from('cliente').select('*').ilike('nume', payload.nume.trim());
    if (uid) qC = qC.eq('user_id', uid);
    const { data: lista } = await qC.limit(1);
    const cl = lista && lista[0];
    if (!cl) return { success: false };
    const azi = formateazaDataRoLocal(new Date());
    const upd = actionName === "ingheataAbonament"
      ? (esteInghetat(cl) ? null : { status: 'Inghetat', dataExpirare: '-', inghetare: { de_la: azi, exp: cl.dataExpirare || '-' } })
      : (esteInghetat(cl) ? campuriReluareInghetare(cl, azi) : null);
    if (!upd) return { success: true };
    const { error } = await sb.from('cliente').update(upd).eq('row', cl.row);
    return error ? { success: false, eroare: error.message } : { success: true, ...upd };
  }

  if (actionName === "seteazaEmailInvitatie") {
    let q = sb.from('cliente').update({ email_invitatie: payload.email }).ilike('nume', payload.nume.trim());
    if (uid) q = q.eq('user_id', uid);
    const { error } = await q;
    return { success: !error };
  }

  // Cererea din formular devine fișă: clienta nouă (fără abonament încă) sau, dacă numele există, răspunsurile se adaugă la fișa ei
  if (actionName === "acceptaCerereInscriere") {
    const cer = payload.cerere;
    const fisa = Object.assign({}, cer.raspunsuri, { limba: cer.limba, trimisLa: cer.created_at, consimtamantLa: cer.consimtamant_la });
    // Clientul existent vine ales din aplicație (gasesteClientPentruCerere: telefon, email, nume); fără el se creează unul nou
    let ex = null;
    if (payload.clientId) {
      let qEx = sb.from('cliente').select('*').eq('id', payload.clientId);
      if (uid) qEx = qEx.eq('user_id', uid);
      ({ data: ex } = await qEx.limit(1));
    }
    let error;
    if (ex && ex.length > 0) {
      const actualizare = { fisa_inscriere: fisa };
      if (!ex[0].telefon && cer.telefon) actualizare.telefon = cer.telefon;
      if (!ex[0].auth_user_id && !ex[0].email_invitatie && cer.email) actualizare.email_invitatie = cer.email;
      ({ error } = await sb.from('cliente').update(actualizare).eq('row', ex[0].row));
    } else {
      const rowNou = {
        nume: cer.nume.trim(),
        tipAbonament: "-",
        incluse: 0,
        efectuate: 0,
        ramase: 0,
        dataStart: "-",
        dataExpirare: "-",
        status: "Activ",
        telefon: cer.telefon || "",
        email_invitatie: cer.email || null,
        fisa_inscriere: fisa
      };
      if (uid) rowNou.user_id = uid;
      const res = await sb.from('cliente').insert([rowNou]).select().single();
      error = res.error;
      if (res.data) await sb.from('cliente').update({ id: "cli_" + res.data.row }).eq('row', res.data.row);
    }
    if (error) return { success: false };
    await sb.from('cereri_inscriere').delete().eq('id', cer.id);
    return { success: true, nume: (ex && ex.length > 0) ? ex[0].nume : cer.nume.trim() };
  }

  // Ștergerea cererii păstrează doar emailul, ca persoana să afle la login că cererea nu mai e activă
  if (actionName === "refuzaCerereInscriere") {
    const { data, error } = await sb.rpc('refuza_cerere_inscriere', { p_id: payload.id });
    return { success: !error && data === true };
  }

  return { success: false };
}

function callBackend(actionName, payload, callback, peEroare) {
  if (USE_SUPABASE && supabaseClient) {
    executaActiuneSupabase(actionName, payload)
      .then(res => {
        if (ACTIUNI_CARE_SCHIMBA_ORARUL.includes(actionName)) anuntaSchimbareOrar();
        if (callback) callback(res);
      })
      .catch(err => {
        console.error("Eroare Supabase:", err);
        showToast(tr("Eroare sincronizare", "Sync error"), "error");
        if (peEroare) peEroare(err);
      });
    return;
  }

  // Biblioteca Supabase nu s-a încărcat (ex. fără internet la pornire)
  showToast(tr("Eroare sincronizare", "Sync error"), "error");
  if (peEroare) peEroare();
}

function showToast(mesaj, tip = 'success') {
  let tEl = document.getElementById('customToast');
  if (!tEl) return;
  tEl.innerText = mesaj;
  tEl.className = 'show ' + (tip === 'error' ? 'error' : 'success');
  // La ascundere rămâne culoarea (altfel se face gri în timp ce dispare); un toast nou nu e închis de timer-ul celui vechi
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { tEl.classList.remove('show'); }, 2600);
}

// `camp` (opțional): { placeholder, valoare }. Afișează un câmp de text, iar onConfirm primește ce s-a scris.
function customConfirm(titlu, text, onConfirm, camp) {
  document.getElementById('modalTitle').innerText = titlu;
  document.getElementById('modalText').innerText = text;
  document.getElementById('modalBtnConfirm').innerText = t('confirmBtn');
  const inp = document.getElementById('modalInput');
  inp.style.display = camp ? 'block' : 'none';
  inp.value = camp ? (camp.valoare || '') : '';
  inp.placeholder = camp ? (camp.placeholder || '') : '';
  document.getElementById('customModalBackdrop').style.display = 'flex';
  document.getElementById('modalBtnAlt').style.display = 'none';
  modalCallback = onConfirm;
  modalAltCallback = null;
}

function closeCustomModal(confirmed) {
  document.getElementById('customModalBackdrop').style.display = 'none';
  const inp = document.getElementById('modalInput');
  if (confirmed && modalCallback) modalCallback(inp.value.trim());
  modalCallback = null;
  modalAltCallback = null;
}

// A treia variantă în modalul de confirmare (pe rând separat), după customConfirm
let modalAltCallback = null;
function aratButonAlternativModal(text, onClick) {
  const btn = document.getElementById('modalBtnAlt');
  btn.innerText = text;
  btn.style.display = '';
  modalAltCallback = onClick;
}

function apasaButonAlternativModal() {
  const cb = modalAltCallback;
  closeCustomModal(false);
  if (cb) cb();
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
    } else if (scrollLaInchidereCalendar) {
      // Am ajuns cu săgețile la săptămâna curentă: saltul la ora curentă vine abia acum, la închidere
      scrollLaInchidereCalendar = false;
      if (esteSaptamanaActiva()) autoScrollLaOraCurenta();
    }
  }
}

// Săgețile din selector nu închid sertarul; saltul la ora curentă se face la închiderea lui
let scrollLaInchidereCalendar = false;

function getTopOffsetSubZile() {
  let headerEl = document.getElementById('mainAppHeader');
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

  // Ultima oră a zilei (18:00 sau o oră suplimentară mai târzie) și penultima, nu ore fixe
  let oreZi = Array.from(document.querySelectorAll('#sloturiContainer .hour-block')).map(b => b.getAttribute('data-ora'));
  if (oraCheie === oreZi[oreZi.length - 1]) {
    endCard.classList.add('state-ora-18');
  } else if (oraCheie === oreZi[oreZi.length - 2]) {
    endCard.classList.add('state-ora-17');
  }

  void endCard.offsetHeight;

  let vh = window.innerHeight;
  let topOffset = getTopOffsetSubZile();
  // Înălțimea normală a barei de jos (56px), nu cea de moment: bara se poate afla compactă sau în animație
  let hNav = 56;
  // Bara de jos plutește la 10px de margine; +12px spațiu ca istoricul să rămână deasupra ei
  let spatiuVizibilUtil = vh - topOffset - hNav - 10 - 12;

  let istoricEl = document.getElementById('detailsIstoricOrar') || endCard;
  let blockRect = closestBlock.getBoundingClientRect();
  let istoricRect = istoricEl.getBoundingClientRect();

  let inaltimeDeLaCardLaBazaIstoric = istoricRect.bottom - blockRect.top;

  if (inaltimeDeLaCardLaBazaIstoric < spatiuVizibilUtil) {
    let deficit = spatiuVizibilUtil - inaltimeDeLaCardLaBazaIstoric;
    let currentEndCardHeight = endCard.getBoundingClientRect().height || 58;
    endCard.style.minHeight = Math.ceil(currentEndCardHeight + deficit) + 'px';
  }

  endCard.style.transition = '';
}

// Momentul ultimului highlight; re-randarea orarului în timpul animației îl reaplică
let momentHighlightOra = 0;
const DURATA_HIGHLIGHT_ORA = 1800;

// Din notificarea unei rezervări / anulări: orarul pe săptămâna și ziua ei, cu ora respectivă sus, sub bara de zile
function mergiLaOraDinOrar(ziIso, ora) {
  document.getElementById('navBtnOrar').click();
  const d = new Date((ziIso || '') + 'T12:00:00');
  if (isNaN(d)) return;
  const cheieZi = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"][d.getDay()];
  if (!getZileActive().includes(cheieZi)) return; // zi de weekend ascunsă din Setări: rămâne orarul obișnuit
  dataReferintaLuni = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  ziCurentaCheie = cheieZi;
  actualizeazaBaraZile();
  randeazaOrarInstant();
  aratOraInOrar(ora);
}

// Ora arătată ultima dată cu aratOraInOrar; reîncărcarea datelor din timpul animației o reaplică
let oraEvidentiata = null;

// Ora dată ajunge sus, sub bara de zile, și e evidențiată (notificări, oră suplimentară nou adăugată)
function aratOraInOrar(ora, reaplicare = false) {
  const oraNorm = normalizeazaOraUi(ora || '');
  if (!reaplicare) oraEvidentiata = { ora: oraNorm, zi: getSaptamanaCheie() + '_' + ziCurentaCheie, moment: Date.now() };
  const bloc = document.querySelector(`#sloturiContainer .hour-block[data-ora="${oraNorm}"]`);
  calibreazaLayoutEcran(bloc ? oraNorm : "", bloc);
  window.scrollTo({ top: bloc ? Math.max(0, Math.round(bloc.getBoundingClientRect().top + window.pageYOffset - getTopOffsetSubZile())) : 0, behavior: 'auto' });
  if (bloc && (!reaplicare || Date.now() - oraEvidentiata.moment < DURATA_HIGHLIGHT_ORA)) {
    bloc.classList.remove('hour-block-current-highlight');
    void bloc.offsetWidth;
    bloc.classList.add('hour-block-current-highlight');
  }
}

function autoScrollLaOraCurenta(faraHighlight = false) {
  scrollLaInchidereCalendar = false;
  // Saltul la ora curentă se calculează pentru bara de jos la mărime normală
  const navJos = document.getElementById('bottomNav');
  if (navJos) navJos.classList.remove('nav-compact');

  let now = new Date();
  let day = now.getDay();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();

  // Cu weekendul activ în Setări, sâmbăta și duminica au orar propriu și se sare la ora curentă
  let esteInAfaraProgramuluiWeekend = !setariOrar.weekend && ((day === 5 && currentHour >= 22) || (day === 6) || (day === 0));
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

  calibreazaLayoutEcran(closestOraText, closestBlock);

  let topOffset = getTopOffsetSubZile();
  let blockTopDoc = closestBlock.getBoundingClientRect().top + window.pageYOffset;
  let targetScrollY = Math.max(0, Math.round(blockTopDoc - topOffset));

  window.scrollTo({
    top: targetScrollY,
    behavior: 'auto'
  });

  if (!faraHighlight) {
    // Reflow forțat între remove și add, ca animația să repornească și dacă clasa exista deja
    closestBlock.classList.remove('hour-block-current-highlight');
    void closestBlock.offsetWidth;
    closestBlock.classList.add('hour-block-current-highlight');
    momentHighlightOra = Date.now();
  }
}

// Istoricul deschis urcă sub antet (pe Orar, sub bara zilelor), cu un spațiu mic între ele
const SPATIU_SUB_ISTORIC = 6;

function peComutareIstoricIncasari(detailsEl) {
  if (detailsEl && detailsEl.open) {
    setTimeout(() => {
      let headerEl = document.getElementById('mainAppHeader');
      let hOffset = headerEl ? headerEl.offsetHeight : 50;
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - SPATIU_SUB_ISTORIC)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

function peComutareIstoricOrar(detailsEl) {
  if (detailsEl && detailsEl.open) {
    setTimeout(() => {
      let headerEl = document.getElementById('mainAppHeader');
      let daySelector = document.getElementById('dayButtonsContainer');
      // Bara zilelor lipită stă cu 1px peste header (top: calc(var(--header-height) - 1px))
      let hOffset = (headerEl ? headerEl.offsetHeight - 1 : 50) + (daySelector ? daySelector.offsetHeight : 45);
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - SPATIU_SUB_ISTORIC)),
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
      let headerEl = document.getElementById('mainAppHeader');
      let hOffset = headerEl ? headerEl.offsetHeight : 50;
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - SPATIU_SUB_ISTORIC)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

// CONTROL HEADER STÂNGA / DREAPTA PE PLANUL DE ANTRENAMENT (BACK / CLOSE)
function gestioneazaClickStangaHeader(event) {
  if (tipTabCurent === 'plan') {
    // Pe pagina unei zile, Înapoi (‹) revine la lista zilelor
    if (!esteModPrevizualizarePdf && indexZiDeschisaPlan() !== null) {
      inchideZiPlan();
      return;
    }
    // Din planul deschis din bibliotecă, Înapoi revine la bibliotecă
    if (!esteModClientaShare && !bibliotecaPlanuri && !planDeschisDinFisa) {
      inapoiLaBiblioteca();
      return;
    }
    // Înapoi (‹) duce la meniul din care a fost deschis planul (sau la fișa clientului); X din dreapta închide direct
    iesireDinPlanCuConfirmare(() => {
      revenireDinPlanAntrenament();
      if (!esteModClientaShare && !planDeschisDinFisa) deschideMeniuLateral();
    });
  } else if (tipTabCurent === 'orar') {
    comutaExpandareBaraCalendar(event);
  }
}

function gestioneazaClickDreaptaHeader() {
  if (tipTabCurent === 'plan') {
    iesireDinPlanCuConfirmare(revenireDinPlanAntrenament);
  } else {
    deschideMeniuLateral();
  }
}

// Ieșirea din plan cu modificări nesalvate cere confirmare; la „renunț” planul revine la varianta salvată
function iesireDinPlanCuConfirmare(iesire) {
  dupaConfirmareModificariPlan(() => {
    if (estePlanModificat()) renuntaLaModificariPlan();
    iesire();
  });
}

function revenireDinPlanAntrenament() {
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.style.display = 'flex';

  let tinta = tabAnteriorPlan || 'orar';
  let tabGasit = tabsOrder.find(t => t.tip === tinta) || tabsOrder[0];
  let btn = document.querySelectorAll('#bottomNav button')[tabGasit.idx];
  let titlu = currentLang === 'en' ? tabGasit.titleEn : tabGasit.titleRo;
  comutaTab(tabGasit.id, titlu, btn, tabGasit.tip, tabGasit.idx);
}

function actualizeazaHeaderVisual(tipTab, titlu) {
  let wrapper = document.getElementById('pageTitleWrapper');
  let burgerBtn = document.getElementById('headerBurgerBtn');
  let rightSvg = document.getElementById('headerRightIconSvg');
  if (!wrapper) return;

  if (tipTab === 'plan') {
    wrapper.innerHTML = `
      <button class="header-icon-bubble-btn" id="headerIconOrarBtn" onclick="gestioneazaClickStangaHeader(event)" title="${tr('Înapoi', 'Back')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span id="pageTitle">${titlu}</span>
    `;
    if (burgerBtn && rightSvg) {
      burgerBtn.setAttribute('title', tr('Închide', 'Close'));
      rightSvg.innerHTML = `
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      `;
    }
    return;
  }

  if (burgerBtn && rightSvg) {
    burgerBtn.setAttribute('title', 'Meniu');
    rightSvg.innerHTML = `
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    `;
  }

  let iconHtml = '';
  if (tipTab === 'orar') {
    iconHtml = `
      <button class="header-icon-bubble-btn header-icon-clickable" id="headerIconOrarBtn" onclick="gestioneazaClickStangaHeader(event)" title="${currentLang === 'en' ? 'Toggle week selector' : 'Comută selectorul de săptămână'}">
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
  aplicaTraduceriAtribute();
  const elModPdf = document.getElementById('btnPreviewPlanText');
  if (elModPdf) elModPdf.innerText = esteModPrevizualizarePdf ? t('btnEditMode') : t('btnPreviewPdfMode');
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
  document.getElementById('btnAddOraCustomAction').innerText = tr('Adaugă', 'Add');
  document.getElementById('historyOrarSummaryText').innerText = t('historyOrarTitle');
  document.getElementById('labelFiltruCliOrar').innerText = t('filterClient');
  document.getElementById('labelFiltruLunaOrar').innerText = t('filterMonth');

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
  document.getElementById('optSumaPlaceholder').innerText = t('sumPresetPlaceholder');
  document.getElementById('labelIncMetoda').innerText = t('paymentMethodLabel');
  document.getElementById('optMetodaPlaceholder').innerText = t('paymentMethodPlaceholder');
  aplicaSetariPlatiUI();
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
  document.getElementById('accentSectionTitle').innerText = t('accentTitle');
  document.getElementById('accentBtnPetrolText').innerText = t('accentPetrol');
  document.getElementById('accentBtnBlueText').innerText = t('accentBlue');
  document.getElementById('accentBtnRedText').innerText = t('accentRed');
  document.getElementById('accentBtnGreenText').innerText = t('accentGreen');
  document.getElementById('accentBtnGraphiteText').innerText = t('accentGraphite');
  document.getElementById('accentBtnMovText').innerText = t('accentMov');
  document.getElementById('langSectionTitle').innerText = t('langTitle');

  document.getElementById('modalTitle').innerText = t('confirmTitle');
  document.getElementById('modalBtnCancel').innerText = t('cancelBtn');
  document.getElementById('modalBtnConfirm').innerText = t('confirmBtn');

  document.getElementById('editPaymentModalTitle').innerText = t('editPaymentTitle');
  document.getElementById('editIncCancelBtn').innerText = t('cancelBtn');
  document.getElementById('editIncSaveBtn').innerText = t('saveBtn');

  const elWTitle = document.getElementById('drawerMenuWorkoutTitle');
  if (elWTitle) elWTitle.innerText = t('workoutPlanTitle');
  const elWDesc = document.getElementById('drawerMenuWorkoutDesc');
  if (elWDesc) elWDesc.innerText = t('drawerWorkoutDesc');
  const elPlanSelLbl = document.getElementById('planSelectLabel');
  if (elPlanSelLbl) elPlanSelLbl.innerText = t('planSelectLabel');
  const elBtnSavePlan = document.getElementById('btnSavePlanText');
  if (elBtnSavePlan) elBtnSavePlan.innerText = t('btnSavePlan');

  const elSubAuth = document.getElementById('authSubtitleText');
  if (elSubAuth) elSubAuth.innerText = tipModAuth === 'login' ? t('authSubtitleLogin') : t('authSubtitleSignup');
  const elTabLog = document.getElementById('authTabLogin');
  if (elTabLog) elTabLog.innerText = t('authTabLogin');
  const elTabSign = document.getElementById('authTabSignup');
  if (elTabSign) elTabSign.innerText = t('authTabSignup');
  actualizeazaLinkComutareAuth();
  const elLblEmail = document.getElementById('authEmailLabel');
  if (elLblEmail) elLblEmail.innerText = t('authEmailLabel');
  const elLblPass = document.getElementById('authPasswordLabel');
  if (elLblPass) elLblPass.innerText = t('authPasswordLabel');
  const elBtnSubAuth = document.getElementById('authSubmitBtn');
  if (elBtnSubAuth && !elBtnSubAuth.disabled) {
    elBtnSubAuth.innerText = tipModAuth === 'login' ? t('authSubmitBtnLogin') : t('authSubmitBtnSignup');
  }
  const elBtnMagic = document.getElementById('authMagicLinkBtnText');
  if (elBtnMagic) elBtnMagic.innerText = t('authMagicLinkBtn');
  const elDivOr = document.getElementById('authDividerOrText');
  if (elDivOr) elDivOr.innerText = t('authDividerOr');
  const elTxtGoogle = document.getElementById('authGoogleBtnText');
  if (elTxtGoogle) elTxtGoogle.innerText = t('authGoogleBtn');

  const btnLogRo = document.getElementById('authLangBtnRo');
  const btnLogEn = document.getElementById('authLangBtnEn');
  if (btnLogRo) btnLogRo.classList.toggle('active', currentLang === 'ro');
  if (btnLogEn) btnLogEn.classList.toggle('active', currentLang === 'en');
}

// ==========================================
// 3. INIȚIALIZARE & GARDIAN SESIUNE
// ==========================================

// Rolul vine din tabelul profiles. Contul invitat devine „clienta” la primul login, prin leaga_cont_clienta().
// Rolul doar alege ecranul; accesul la date îl hotărăsc politicile RLS din Supabase.
async function incarcaRolUtilizator() {
  if (!supabaseClient || !utilizatorCurent) { rolUtilizator = 'antrenor'; return; }
  const id = utilizatorCurent.id;
  let rol = 'antrenor';
  try {
    // Toate trei deodată (o singură așteptare): profilul, legarea fișei de client și cererea de înscriere.
    // Cont făcut din formularul de înscriere, cererea neacceptată (în așteptare sau refuzată): nu e antrenor
    const [{ data: profil, error }, { data: legat }, { data: stareCerere }] = await Promise.all([
      supabaseClient.from('profiles').select('rol').eq('id', id).maybeSingle(),
      supabaseClient.rpc('leaga_cont_clienta'),
      supabaseClient.rpc('stare_cerere_inscriere')
    ]);
    if (error) throw error;
    if ((profil && profil.rol === 'clienta') || legat === true || stareCerere) rol = 'clienta';
    localStorage.setItem('BFIT_ROL', id + ':' + rol);
  } catch (e) {
    // fără rețea: ultimul rol cunoscut pe acest dispozitiv
    rol = rolSalvat(id) || (localStorage.getItem('BFIT_ROL') === 'clienta' ? 'clienta' : 'antrenor');
  }
  rolUtilizator = rol;
  document.documentElement.setAttribute('data-rol', rol); // ascunde din sertar ce e doar pentru antrenor
  incarcaNotificari();
}

// Rolul salvat pe dispozitiv pentru acest cont („<id>:<rol>”; rămâne și după ieșirea din cont)
function rolSalvat(id) {
  const [uid, rol] = (localStorage.getItem('BFIT_ROL') || '').split(':');
  return uid === id && (rol === 'clienta' || rol === 'antrenor') ? rol : null;
}

// Același cont pe același dispozitiv: aplicația pornește direct cu rolul salvat, iar verificarea din bază rulează în fundal.
// Dacă rolul s-a schimbat între timp (rar), pagina se reîncarcă pe ecranul corect. Fără rol salvat, se așteaptă verificarea.
async function stabilesteRol() {
  const salvat = rolSalvat(utilizatorCurent.id);
  if (!salvat) return incarcaRolUtilizator();
  rolUtilizator = salvat;
  document.documentElement.setAttribute('data-rol', salvat);
  incarcaRolUtilizator().then(() => { if (rolUtilizator !== salvat) location.reload(); });
}

// ---- Ecranul clientei: abonament + planurile ei; Profil și Setări vin din același sertar ca la antrenor ----
let dateClienta = { fisa: null, planuri: [], planCurent: null };
let timerSalvareProgres = null;

// Cardul de sus de pe Acasă: abonamentul se termină (≤ 7 zile sau ≤ 2 ședințe), s-a terminat sau încă nu există.
// Aceleași praguri ca eticheta „De urmărit” din lista antrenorului (stareAbonamentClienta).
function htmlReinnoireClienta(c) {
  const ramase = Number(c.ramase) || 0;
  const s = stareAbonamentClienta(Object.assign({}, c, { incluse: Number(c.incluse) || 0, ramase }));
  let titlu, text;
  if (s.tip === 'curand') {
    titlu = s.zile !== undefined
      ? (s.zile === 0 ? tr('Abonamentul tău expiră azi', 'Your subscription expires today')
        : tr(`Abonamentul tău expiră în ${s.zile} ${s.zile === 1 ? 'zi' : 'zile'}`, `Your subscription expires in ${s.zile} ${s.zile === 1 ? 'day' : 'days'}`))
      : (ramase === 1 ? tr('Mai ai o ședință din abonament', 'You have 1 session left') : tr(`Mai ai ${ramase} ședințe din abonament`, `You have ${ramase} sessions left`));
    text = tr('Vorbește cu antrenorul tău despre reînnoire, ca să-ți păstrezi ritmul și locul în orar.', 'Talk to your trainer about renewing, to keep your rhythm and your spot in the schedule.');
  } else if (s.tip === 'expirat') {
    titlu = ramase <= 0 && (c.status || '').toLowerCase() !== 'expirat'
      ? tr('Ai folosit toate ședințele', 'You’ve used all your sessions')
      : tr('Abonamentul tău a expirat', 'Your subscription has expired');
    text = tr('Reînnoiește abonamentul cu antrenorul tău ca să poți rezerva în continuare.', 'Renew with your trainer to keep booking sessions.');
  } else if (s.tip === 'inghetat') {
    titlu = tr('Abonamentul tău e în pauză', 'Your subscription is paused');
    text = tr('Zilele sunt oprite. Când revii, antrenorul îl reia și zilele de pauză se adaugă la final.', 'The days are on hold. When you come back, your trainer resumes it and the paused days are added at the end.');
  } else {
    return '';
  }
  // Sună / WhatsApp, doar dacă antrenorul și-a pus telefonul în Profil (contact_antrenor)
  const contact = dateClienta.contact;
  let butoane = '';
  if (contact && contact.telefon) {
    let cifre = contact.telefon.replace(/[^\d]/g, '');
    if (cifre.startsWith('0')) cifre = '40' + cifre.slice(1); // număr românesc → format internațional pentru WhatsApp
    const prenumeAntrenor = (contact.nume_antrenor || '').trim().split(' ')[0];
    const mesaj = tr(`Bună${prenumeAntrenor ? ', ' + prenumeAntrenor : ''}! Aș vrea să-mi reînnoiesc abonamentul.`, `Hi${prenumeAntrenor ? ' ' + prenumeAntrenor : ''}! I'd like to renew my subscription.`);
    butoane = `<div class="reinnoire-butoane">
        <a class="btn reinnoire-btn" href="tel:${escAttr(contact.telefon.replace(/[^\d+]/g, ''))}">
          <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>
          ${tr('Sună', 'Call')}
        </a>
        <a class="btn reinnoire-btn reinnoire-whatsapp" href="https://wa.me/${cifre}?text=${encodeURIComponent(mesaj)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>
          WhatsApp
        </a>
      </div>`;
  }
  return `<div class="card reinnoire-card ${s.tip}">
      <div class="reinnoire-icon"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></div>
      <div class="reinnoire-corp"><div class="reinnoire-titlu">${titlu}</div><div class="reinnoire-text">${text}</div>${butoane}</div>
    </div>`;
}

function randeazaHomeClienta() {
  const c = dateClienta.fisa;
  dateClienta.planCurent = null;
  antrPers.ecran = null;
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  const prenume = (c.nume || '').trim().split(' ')[0];
  document.getElementById('clientaTitlu').innerText = tr('Salut, ', 'Hi, ') + prenume + '!';
  // Fiecare lucru o singură dată, în ordinea importanței: reînnoire, mesajul antrenorului, antrenamentul (cu planul),
  // ședința la sală, check-in-ul, apoi cifrele (abonamentul complet și planurile vechi sunt în Fișa mea)
  // Sus: ce e urgent (reînnoire, mesaje); apoi „Azi” (antrenamentul, ședința, ciclul), cele trei cifre, „De făcut”,
  // scurtăturile și comunitatea. Un singur buton principal pe ecran: cel din „Azi”.
  const html = `<div id="cardReinnoireClienta">${htmlReinnoireClienta(c)}</div>` + htmlOnboardingClienta() + '<div id="cardPushAcasa"></div>'
    + `<div id="cardNotaAntrenor">${htmlNotaAntrenor(c)}</div><div id="cardMesajeAcasa"></div>`
    + `<div class="card acasa-azi"><div class="acasa-azi-data">${escAttr(dataAziAcasa())}</div>${htmlAntrenamentAcasa()}${htmlSedintaAcasa()}${htmlCicluAcasa()}</div>`
    + htmlCifreAcasa()
    + `<div class="card acasa-de-facut"><div class="acasa-eticheta">${tr('De făcut', 'To do')}</div>${htmlCheckinAcasa()}${htmlMasaAcasa()}</div>`
    + `<div class="acasa-scurtaturi">
        <button type="button" class="acasa-scurtatura" onclick="deschideAdaugaAliment(masaImplicita())"><span><svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7"/><path d="M12 11V5a2 2 0 0 1 2-2h2v1a2 2 0 0 1-2 2h-2"/><path d="M10 10.5c1.3.7 2.7.7 4 0"/></svg></span>${tr('Masă', 'Meal')}</button>
        ${htmlAntrPersAcasa()}
        <button type="button" class="acasa-scurtatura" onclick="scaneazaDinAcasa()"><span><svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/></svg></span>${tr('Scanează', 'Scan')}</button>
        <button type="button" class="acasa-scurtatura" onclick="clientaTab('orar')"><span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg></span>${tr('Programare', 'Book')}</button>
      </div>`
    + htmlComunitateAcasa();
  document.getElementById('clientaContinut').innerHTML = html;
  actualizeazaCardPushAcasa();
  actualizeazaCardMesajeAcasa();
}

// „Joi, 6 noiembrie”
function dataAziAcasa() {
  const t = new Date().toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// „De făcut”: masa probabilă după oră, dacă încă n-a notat nimic la ea azi (după ce se știe ce e notat)
function htmlMasaAcasa() {
  if (!nutritie.azi && nutritie.zi !== aziIsoAntrPers()) return '<div id="acasaMasa"></div>';
  const cod = masaImplicita();
  const notat = nutritie.zi === aziIsoAntrPers() && (nutritie.lista || []).some(x => x.masa === cod);
  if (notat) return '<div id="acasaMasa"></div>';
  const masa = MESE_NUTRITIE.find(m => m[0] === cod);
  return `<div class="acasa-rand" id="acasaMasa" onclick="deschideAdaugaAliment('${cod}')">
    <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7"/><path d="M12 11V5a2 2 0 0 1 2-2h2v1a2 2 0 0 1-2 2h-2"/><path d="M10 10.5c1.3.7 2.7.7 4 0"/></svg></span>
    <div class="acasa-rand-text"><b>${tr(`Notează ${masa[1].toLowerCase()}`, `Log ${masa[2].toLowerCase()}`)}</b>
    <div class="acasa-antrenament-detalii">${tr('Scanezi codul de bare sau cauți produsul.', 'Scan the barcode or search the product.')}</div></div>
    <div class="drawer-nav-arrow">›</div>
  </div>`;
}

// Scurtătura „Scanează” de pe Acasă: deschide adăugarea la masa probabilă și pornește camera
function scaneazaDinAcasa() {
  deschideAdaugaAliment(masaImplicita());
  pornesteScanare();
}

// Notificările oprite pe telefon: invitația de pornire apare și pe Acasă (până le pornește sau o închide cu ×)
async function actualizeazaCardPushAcasa() {
  const el = document.getElementById('cardPushAcasa');
  if (!el) return;
  let ascuns = false;
  try { ascuns = !!localStorage.getItem('BFIT_PUSH_ACASA_ASCUNS'); } catch (e) {}
  if (ascuns || (await stareNotificari()) !== 'oprite') { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="card card-push card-push-blocat">
      <span>${tr('Pornește notificările ca să afli la timp de programări, planuri și mesajele antrenorului.', 'Turn on notifications to hear in time about bookings, plans and your trainer’s messages.')}</span>
      <button type="button" class="btn" onclick="activeazaPush().then(actualizeazaCardPushAcasa)">${tr('Pornește', 'Turn on')}</button>
      <button type="button" class="notificare-x card-push-x" onclick="ascundeCardPushAcasa()" aria-label="${tr('Închide', 'Close')}">×</button>
    </div>`;
}

function ascundeCardPushAcasa() {
  try { localStorage.setItem('BFIT_PUSH_ACASA_ASCUNS', '1'); } catch (e) {}
  actualizeazaCardPushAcasa();
}

// Următorul antrenament din planul curent: prima zi nefăcută complet; o atingere până la pagina zilei
function htmlAntrenamentAcasa() {
  const p = dateClienta.planuri[0];
  const sesiuni = (p && p.continut_json?.sesiuni) || [];
  if (!p) {
    return '';
  }
  if (!sesiuni.length) return '';
  const exZi = s => (s.exercitii || []).filter(x => (x.exercitiu || '').trim());
  const idx = sesiuni.findIndex(s => exZi(s).some(x => x.status !== 'Finalizat'));
  // Planul din care vine antrenamentul, cu săptămâna lui și legătura spre toate zilele
  const nrSapt = (Array.isArray(p.continut_json.istoric_saptamani) ? p.continut_json.istoric_saptamani.length : 0) + 1;
  const antetPlan = `<div class="acasa-plan" onclick="deschidePlanClienta(0)">
      <span>${escAttr(p.titlu || tr('Plan de antrenament', 'Workout plan'))}${nrSapt > 1 ? ` · ${tr('Săptămâna', 'Week')} ${nrSapt}` : ''}</span>
      <b>${tr('Toate zilele', 'All days')} ›</b>
    </div>`;
  if (idx === -1) {
    return `<div class="acasa-antrenament gata">${antetPlan}
      <div class="acasa-antrenament-titlu">${tr('Ai terminat săptămâna!', 'You finished the week!')}</div>
      <div class="acasa-antrenament-detalii">${tr('Toate zilele sunt bifate. Începe săptămâna nouă: ce ai notat rămâne ca „data trecută”.', 'Every day is checked. Start a new week: what you logged stays as “last time”.')}</div>
      <button type="button" class="btn acasa-incepe" onclick="incepeSaptamanaNouaClienta(0)">${tr('Începe săptămâna nouă', 'Start a new week')}</button>
    </div>`;
  }
  const s = sesiuni[idx];
  const lista = exZi(s);
  const facute = lista.filter(x => x.status === 'Finalizat').length;
  return `<div class="acasa-antrenament">${antetPlan}
    <div class="acasa-eticheta">${tr('Următorul antrenament', 'Next workout')}</div>
    <div class="acasa-antrenament-titlu">${escAttr(s.titlu || tr(`Ziua ${idx + 1}`, `Day ${idx + 1}`))}</div>
    <div class="acasa-antrenament-detalii">${lista.length} ${tr('exerciții', 'exercises')} · ~${durataZiMin(s)} min${facute ? ` · ${facute}/${lista.length} ${tr('făcute', 'done')}` : ''}</div>
    <button type="button" class="btn acasa-incepe" onclick="deschidePlanClienta(0); deschideZiClienta(${idx})">${facute ? tr('Continuă', 'Continue') : tr('Începe', 'Start')}</button>
  </div>`;
}

// Check-in-ul săptămânii: apare doar cât nu e făcut; formularul rămâne în Fișa mea
function htmlCheckinAcasa() {
  const a = dateClienta.acasa;
  // Datele salvate pot fi din săptămâna trecută: de luni, check-in-ul e din nou de făcut
  const facut = a && (a.checkinSaptamana === lunaSaptamaniiCurente() ? a.checkinFacut : false);
  if (!a || facut !== false) return '<div id="acasaCheckin"></div>';
  return `<div class="acasa-rand" id="acasaCheckin" onclick="deschideCheckinDinAcasa()">
    <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg></span>
    <div class="acasa-rand-text"><b>${tr('Check-in-ul săptămânii', 'This week’s check-in')}</b>
    <div class="acasa-antrenament-detalii">${tr('2 minute. Antrenorul tău îl vede în fișa ta.', '2 minutes. Your trainer sees it in your profile.')}</div></div>
    <div class="drawer-nav-arrow">›</div>
  </div>`;
}

// Trei cifre: ședințe săptămâna asta, ședințe rămase, săptămâni la rând (până vin datele: „–”)
function htmlCifreAcasa() {
  const incaPutin = dateClienta.fisa ? incaPutinClient().map(t => `<div class="inca-putin"><span>›</span>${escAttr(t)}</div>`).join('') : '';
  return `<div id="acasaCifre"><div class="acasa-tile">${htmlSaptamanaAcasa()}${htmlNutritieAcasa()}${htmlApaAcasa()}</div>${incaPutin}</div>`;
}

// Următoarea ședință la sală: anularea direct de aici când e permisă; fără ședință, câte ore libere sunt de rezervat
function htmlSedintaAcasa() {
  const a = dateClienta.acasa;
  if (!a) return `<div class="acasa-rand schelet" id="acasaSedinta"></div>`;
  // Ședințele rămase doar cu un abonament pe ședințe (fără abonament, „0 rămase” n-ar spune nimic)
  const ramase = dateClienta.fisa && Number(dateClienta.fisa.incluse) > 0 ? Number(dateClienta.fisa.ramase) || 0 : null;
  const textRamase = ramase === null ? '' : ramase === 1 ? tr('1 ședință rămasă', '1 session left') : tr(`${ramase} ședințe rămase`, `${ramase} sessions left`);
  if (a.urmatoarea) {
    const { poateAnula } = stareAnulareClienta({ bifat: false, rezervat_online: !!a.urmatoareaOnline, data: a.urmatoarea });
    return `<div class="acasa-rand" id="acasaSedinta" onclick="clientaTab('orar')">
        <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
        <div class="acasa-rand-text"><div class="acasa-eticheta">${tr('Următoarea ședință', 'Next session')}${textRamase ? ` · ${textRamase}` : ''}</div>
        <b>${escAttr(etichetaZiSlot(a.urmatoarea))}, ${oraSlot(a.urmatoarea)}</b>${a.urmatoareaAntrenament ? `<div class="acasa-antrenament-detalii">${escAttr(traduceValoare(a.urmatoareaAntrenament))}</div>` : ''}</div>
        ${poateAnula && a.urmatoareaRow
          ? `<button type="button" class="btn btn-clear" style="white-space:nowrap;" onclick="event.stopPropagation(); anuleazaRezervareClienta(${Number(a.urmatoareaRow)})">${tr('Anulează', 'Cancel')}</button>`
          : '<div class="drawer-nav-arrow">›</div>'}
      </div>`;
  }
  const libere = dateClienta.locuriLibere || 0;
  return `<div class="acasa-rand" id="acasaSedinta" onclick="clientaTab('orar')">
      <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
      <div class="acasa-rand-text"><div class="acasa-eticheta">${tr('Următoarea ședință', 'Next session')}${textRamase ? ` · ${textRamase}` : ''}</div><b>${tr('Nicio ședință programată', 'No session booked')}</b>
      ${libere ? `<div class="acasa-antrenament-detalii">${libere === 1 ? tr('O oră liberă de rezervat', '1 open hour to book') : tr(`${libere} ore libere de rezervat`, `${libere} open hours to book`)}</div>` : ''}</div>
      <button type="button" class="btn btn-clear" style="white-space:nowrap;" onclick="event.stopPropagation(); clientaTab('orar')">${tr('Programează-te', 'Book')}</button>
    </div>`;
}

// Prima deschidere ca clientă: parolă (ca să se poată reconecta oricând, mai ales în aplicația instalată) + cum se instalează aplicația
function cheieOnboardingClienta() {
  return 'BFIT_ONBOARD_' + (utilizatorCurent ? utilizatorCurent.id : '');
}

// Clienta are parolă dacă a setat-o în aplicație (salvat în cont) sau dacă sesiunea curentă e din login cu parolă (amr din token)
async function verificaParolaClienta() {
  const meta = (utilizatorCurent && utilizatorCurent.user_metadata) || {};
  if (meta.parola_setata) return true;
  try {
    const { data } = await supabaseClient.auth.getSession();
    const payload = JSON.parse(atob(data.session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if ((payload.amr || []).some(a => a.method === 'password')) {
      supabaseClient.auth.updateUser({ data: { parola_setata: true } });
      return true;
    }
  } catch (e) {}
  return false;
}

function htmlCampParola(id, placeholder) {
  return `<div class="password-field-wrap">
    <input type="password" id="${id}" class="form-control" autocomplete="new-password" placeholder="${placeholder}" onkeydown="if (event.key === 'Enter') seteazaParolaOnboarding()">
    <button type="button" class="password-toggle-btn" onclick="comutaVizibilitateParola('${id}', this)" tabindex="-1" aria-label="${tr('Arată/Ascunde parola', 'Show/Hide password')}">
      <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      <svg class="eye-closed" style="display:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
    </button>
  </div>`;
}

// Cardul apare cât clienta nu are parolă; sfaturile de instalare se ascund cu „Gata” (pe acest dispozitiv)
function htmlOnboardingClienta() {
  const instalata = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const arataInstalare = !instalata && !localStorage.getItem(cheieOnboardingClienta());
  if (dateClienta.areParola && !arataInstalare) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const parola = dateClienta.areParola ? '' : `<div id="onboardParola" style="margin-top:8px; font-size:0.8rem; line-height:1.45;">
      <b>${tr('Setează o parolă', 'Set a password')}</b><br>
      ${tr('Așa te poți conecta oricând cu email și parolă, inclusiv în aplicația instalată.', 'This lets you sign in any time with email and password, including in the installed app.')}
      <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
        ${htmlCampParola('onboardParolaInput', tr('Parolă nouă (min. 8 caractere)', 'New password (min. 8 characters)'))}
        ${htmlCampParola('onboardParolaConfirma', tr('Confirmă parola', 'Confirm password'))}
        <button type="button" class="btn" id="btnOnboardParola" onclick="seteazaParolaOnboarding()">${tr('Setează parola', 'Set password')}</button>
      </div>
    </div>`;
  const instalare = !arataInstalare ? '' : `<div style="margin-top:12px; font-size:0.8rem; line-height:1.45;">
      <b>${tr('Instalează aplicația', 'Install the app')}</b><br>
      ${ios
        ? tr('Apasă Partajează (pătratul cu săgeată) → „Adaugă pe ecranul principal”. După instalare te conectezi din nou, cu email și parolă.', 'Tap Share (the square with an arrow) → "Add to Home Screen". After installing, sign in again with email and password.')
        : tr('Meniul ⋮ al browserului → „Instalează aplicația” sau „Adaugă pe ecranul principal”.', 'Browser menu ⋮ → "Install app" or "Add to Home screen".')}
    </div>`;
  return `<div class="card" id="clientaOnboarding">
    <div style="font-weight:800; color:var(--primary);">${tr('Bine ai venit!', 'Welcome!')}</div>
    ${parola}
    ${instalare}
    <button type="button" class="btn btn-clear" style="width:100%; margin-top:12px;" onclick="inchideOnboardingClienta()">${tr('Gata', 'Done')}</button>
  </div>`;
}

async function seteazaParolaOnboarding() {
  const parola = document.getElementById('onboardParolaInput')?.value || '';
  const confirmare = document.getElementById('onboardParolaConfirma')?.value || '';
  if (parola.length < 8) {
    showToast(t('authErrPassLength'), 'error');
    return;
  }
  if (parola !== confirmare) {
    showToast(tr('Parolele introduse nu coincid!', 'Passwords do not match!'), 'error');
    return;
  }
  const btn = document.getElementById('btnOnboardParola');
  if (btn) btn.disabled = true;
  // parola_setata rămâne în cont: cardul nu mai cere parola pe niciun dispozitiv
  const { error } = await supabaseClient.auth.updateUser({ password: parola, data: { parola_setata: true } });
  if (btn) btn.disabled = false;
  if (error) {
    showToast(localizeazaEroareAuth(error.message), 'error');
    return;
  }
  dateClienta.areParola = true;
  document.getElementById('onboardParola').innerHTML = `<b>${tr('Parola a fost setată ✓', 'Password set ✓')}</b>`;
}

function inchideOnboardingClienta() {
  localStorage.setItem(cheieOnboardingClienta(), '1');
  document.getElementById('clientaOnboarding')?.remove();
}

// Înapoi: din ziua deschisă la lista zilelor, din listă la Acasă
function clientaInapoi() {
  if (antrPers.ecran) return inapoiAntrPers();
  salveazaProgresClienta();
  if (dateClienta.ziCurenta !== null && dateClienta.ziCurenta !== undefined && (dateClienta.planCurent?.continut_json?.sesiuni || []).length > 1) {
    inchideZiClienta();
    return;
  }
  opresteTimerPauza();
  randeazaHomeClienta();
}

function deschidePlanClienta(idx) {
  dateClienta.planCurent = JSON.parse(JSON.stringify(dateClienta.planuri[idx]));
  dateClienta.ziCurenta = null;
  document.getElementById('clientaBtnInapoi').style.visibility = 'visible';
  randeazaPlanClienta();
}

function deschideZiClienta(s) {
  dateClienta.ziCurenta = s;
  randeazaPlanClienta();
  document.getElementById('clientaScreen')?.scrollTo({ top: 0, behavior: 'auto' });
}

function inchideZiClienta() {
  const s = dateClienta.ziCurenta;
  dateClienta.ziCurenta = null;
  randeazaPlanClienta();
  const card = document.getElementById('planZiCard' + s);
  if (card) card.scrollIntoView({ block: 'center', behavior: 'auto' });
}

function randeazaPlanClienta() {
  const p = dateClienta.planCurent;
  const cj = p.continut_json || {};
  document.getElementById('clientaTitlu').innerText = p.titlu || tr('Plan de antrenament', 'Workout plan');
  const text = (sec) => `<div class="plan-info-box"><div style="font-size:0.92rem; font-weight:800; color:var(--primary); margin-bottom:5px;">${escAttr(sec.titlu)}</div><div class="plan-info-rendered-text">${htmlTextPlan(sec.continut)}</div></div>`;
  // Planul cu o singură zi se deschide direct pe ea
  const sesiuni = cj.sesiuni || [];
  const zi = sesiuni.length === 1 ? 0 : (sesiuni[dateClienta.ziCurenta] ? dateClienta.ziCurenta : null);
  const paginaZi = zi !== null && sesiuni.length > 1;

  let html = '';
  if (paginaZi) {
    html += `<div class="plan-zi-bara">
      <button type="button" class="btn btn-clear plan-zi-inapoi" onclick="inchideZiClienta()">
        <svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg> ${tr('Toate zilele', 'All days')}
      </button>
    </div>`;
  }
  const nrSaptamana = (Array.isArray(cj.istoric_saptamani) ? cj.istoric_saptamani.length : 0) + 1;
  if (!paginaZi) {
    html += `<div class="plan-header-block"><div style="font-size:0.83rem; font-weight:600; color:var(--text-muted);">${escAttr(p.subtitlu)}</div>
      ${nrSaptamana > 1 ? `<div class="plan-tags"><span class="plan-tag">${tr('Săptămâna', 'Week')} ${nrSaptamana}</span></div>` : ''}</div>`;
    (cj.sectiuni_inceput || []).forEach(sec => { html += text(sec); });
  }
  sesiuni.forEach((ses, s) => {
    if (zi === null) {
      html += htmlCardZiPlan(ses, s, `deschideZiClienta(${s})`, true);
      return;
    }
    if (s !== zi) return;
    html += `<div class="plan-session-block"><div class="plan-session-header"><div style="font-size:0.95rem; font-weight:800; color:var(--primary);">${escAttr(ses.titlu)}</div><span class="plan-progres-ses" id="progresSesClienta${s}">${textProgresSesiune(ses)}</span></div>`;
    (ses.exercitii || []).forEach((ex, e) => {
      html += `<div style="padding:8px 10px; border-top:1px solid var(--border);">
        <button type="button" class="progres-ex-nume" style="font-size:0.84rem;" data-ex="${escAttr(ex.exercitiu)}" onclick="deschideProgresExercitiuDupaNume(this.dataset.ex)">${ex.nr || (e + 1)}. ${escAttr(ex.exercitiu)}${ICON_PROGRES_EX}</button>
        ${ex.muschi ? `<div class="plan-ex-muschi">${escAttr(ex.muschi)}</div>` : ''}
        <div style="font-size:0.75rem; font-weight:700; margin-top:2px;">${ex.seturi_repetari ? `${tr('Serii × repetări', 'Sets × reps')}: ${escAttr(ex.seturi_repetari)}` : ''}${ex.seturi_repetari && ex.pauza ? ' • ' : ''}${ex.pauza ? `${tr('Pauză', 'Rest')}: ${escAttr(ex.pauza)}` : ''}</div>
        ${ex.indicatii ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">${escAttr(ex.indicatii)}</div>` : ''}
        ${htmlSeriiClienta(ex, s, e, p.id)}
        <details class="nota-client"${ex.nota_client ? ' open' : ''}>
          <summary>${tr('+ Notiță', '+ Note')}</summary>
          <textarea class="plan-ex-textarea" maxlength="300" placeholder="${tr('Ex: am simțit genunchiul, am scăzut greutatea', 'E.g. knee felt off, lowered the weight')}" oninput="peModificareProgresClienta(${s}, ${e}, 'nota_client', this.value)" onchange="trimiteNotaInConversatie(${s}, ${e}, this.value)">${escAttr(ex.nota_client)}</textarea>
        </details>
      </div>`;
    });
    html += `<div class="nota-sesiune">
      <label>${tr('Cum a mers antrenamentul?', 'How did the workout go?')}</label>
      <textarea class="plan-ex-textarea" maxlength="500" placeholder="${tr('Energie, dificultate, ce a mers bine (vede și antrenorul)', 'Energy, difficulty, what went well (your coach sees it)')}" oninput="peModificareNotaSesiune(${s}, this.value)" onchange="trimiteNotaInConversatie(${s}, null, this.value)">${escAttr(ses.nota_client)}</textarea>
    </div>`;
    html += `</div>`;
  });
  // Săptămâna nouă: doar după ce a notat ceva; ce a notat rămâne ca „data trecută”
  const areProgres = sesiuni.some(s => (s.exercitii || []).some(x => x.status === 'Finalizat' || (x.serii || []).some(r => r.gata)));
  if (!paginaZi && areProgres) {
    html += `<div class="saptamana-noua">
      <button type="button" class="btn" onclick="incepeSaptamanaNouaClienta()">${tr('Începe săptămâna nouă', 'Start a new week')}</button>
      <div>${tr('Bifele se golesc, iar ce ai notat apare ca „data trecută”.', 'Checkmarks are cleared; what you logged shows as “last time”.')}</div>
    </div>`;
  }
  if (!paginaZi) {
    (cj.sectiuni_final || []).forEach(sec => { html += text(sec); });
    if (cj.nota_subsol) html += `<div class="plan-footer-note">${escAttr(cj.nota_subsol)}</div>`;
  }
  html += `<div id="clientaStareSalvare" style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin-top:10px; min-height:1em;"></div>`;
  html += `<button type="button" class="btn btn-clear" style="display:flex; width:auto; margin:10px auto 0; padding-left:22px; padding-right:22px;" onclick="exportaPlanCurentPDF(dateClienta.planCurent, true)">
    <svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg> ${tr('Descarcă PDF', 'Download PDF')}
  </button>`;
  document.getElementById('clientaContinut').innerHTML = html;
}

// Începe săptămâna nouă: baza mută progresul în istoricul planului și golește bifele (incepe_saptamana_noua).
// Cere internet; dacă mai sunt bife netrimise, le trimite întâi, ca să intre în săptămâna care se încheie.
async function incepeSaptamanaNouaClienta(idxPlan) {
  const plan = idxPlan !== undefined ? dateClienta.planuri[idxPlan] : dateClienta.planCurent;
  if (!plan) return;
  customConfirm(tr('Săptămână nouă', 'New week'),
    tr('Începi săptămâna nouă? Bifele se golesc, iar ce ai notat rămâne ca „data trecută” la fiecare exercițiu.', 'Start a new week? Checkmarks are cleared and what you logged stays as “last time” for each exercise.'),
    async function() {
      await trimiteProgresNetrimis();
      if (timerSalvareProgres !== null) await salveazaProgresClienta();
      if (progresNetrimis()[plan.id]) {
        showToast(tr('Ai nevoie de internet ca să începi săptămâna nouă.', 'You need internet to start a new week.'), 'error');
        return;
      }
      const { data, error } = await supabaseClient.rpc('incepe_saptamana_noua', { p_id: plan.id });
      if (error || !data) {
        showToast(tr('Nu s-a putut începe săptămâna nouă. Verifică internetul și reîncearcă.', 'Could not start a new week. Check your internet and try again.'), 'error');
        return;
      }
      const i = dateClienta.planuri.findIndex(x => x.id === plan.id);
      if (i >= 0) dateClienta.planuri[i] = Object.assign({}, dateClienta.planuri[i], { continut_json: data });
      if (dateClienta.planCurent && dateClienta.planCurent.id === plan.id) {
        dateClienta.planCurent = JSON.parse(JSON.stringify(dateClienta.planuri[i]));
        dateClienta.ziCurenta = null;
        randeazaPlanClienta();
      } else if (clientaTabCurent === 'acasa') {
        randeazaHomeClienta();
      }
      salveazaCacheClienta();
      showToast(tr('✓ Săptămână nouă. Spor la antrenamente!', '✓ New week. Enjoy your workouts!'));
    });
}

// ---- Antrenamente proprii (clientul, pe lângă planul antrenorului): jurnal de sală / cardio + rutine salvate ----
// Tabelul antrenamente_personale (sql/2026-11-04_antrenamente_personale.sql). Antrenamentul în lucru rămâne pe dispozitiv
// (ciornă) până la „Salvează”, ca să nu se piardă la închiderea aplicației sau fără internet.
let antrPers = { lista: null, usor: null, curent: null, ecran: null, start: 0 };

const ACTIVITATI_PERS = {
  sala: ['Sală', 'Gym'], alergare: ['Alergare', 'Running'], bicicleta: ['Bicicletă', 'Cycling'],
  inot: ['Înot', 'Swimming'], plimbare: ['Plimbare', 'Walking'], altele: ['Altă activitate', 'Other activity']
};

function cheieCiornaAntrPers() {
  return 'BFIT_CLIENT_CIORNA_' + (utilizatorCurent ? utilizatorCurent.id : '');
}

function citesteCiornaAntrPers() {
  try { return JSON.parse(localStorage.getItem(cheieCiornaAntrPers()) || 'null'); } catch (e) { return null; }
}

function salveazaCiornaAntrPers() {
  try { localStorage.setItem(cheieCiornaAntrPers(), JSON.stringify({ curent: antrPers.curent, start: antrPers.start })); } catch (e) {}
}

function stergeCiornaAntrPers() {
  try { localStorage.removeItem(cheieCiornaAntrPers()); } catch (e) {}
}

function aziIsoAntrPers() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function etichetaDataAntrPers(iso) {
  const [a, l, z] = String(iso || '').split('-').map(Number);
  if (!a) return '';
  const text = new Date(a, l - 1, z).toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function incarcaAntrPers() {
  if (!supabaseClient || !dateClienta.fisa) return;
  const { data, error } = await supabaseClient.from('antrenamente_personale').select('*')
    .eq('client_id', dateClienta.fisa.id).order('data', { ascending: false }).order('created_at', { ascending: false }).limit(200);
  if (error) return;
  antrPers.lista = data || [];
  const card = document.getElementById('cardAntrPersAcasa');
  if (card && clientaTabCurent === 'acasa' && !dateClienta.planCurent && !antrPers.ecran) card.outerHTML = htmlAntrPersAcasa();
}

function antrenamentePers() {
  return (antrPers.lista || []).filter(x => x.fel === 'antrenament');
}

// Pentru Acasă și seria de săptămâni: doar data și titlul antrenamentelor (fără exerciții, deci puțin de descărcat).
// Lista completă (antrPers.lista) se citește abia când clientul deschide Antrenamente, Fișa mea sau un grafic.
async function incarcaAntrPersUsor() {
  if (!supabaseClient || !dateClienta.fisa) return;
  const { data, error } = await supabaseClient.from('antrenamente_personale').select('id, fel, data, titlu, activitate, durata_min, distanta_km, created_at')
    .eq('client_id', dateClienta.fisa.id).eq('fel', 'antrenament').order('data', { ascending: false }).order('created_at', { ascending: false }).limit(400);
  if (!error) antrPers.usor = data || [];
}

// Antrenamentele făcute (lista completă dacă e încărcată, altfel cea ușoară), cel mai recent primul
function antrenamentePersFacute() {
  return antrPers.lista ? antrenamentePers() : (antrPers.usor || []);
}

// Zilele cu antrenament propriu, în forma listei de prezențe ({ d, ... }) pentru serie și calendar
function zileAntrPers() {
  return antrenamentePersFacute().map(x => {
    const [a, l, z] = String(x.data || '').split('-').map(Number);
    return Object.assign({}, x, { d: new Date(a, (l || 1) - 1, z || 1), propriu: true });
  }).filter(x => !isNaN(x.d));
}

// Graficele și recordurile au nevoie de exercițiile tuturor antrenamentelor
async function asiguraListaAntrPers() {
  if (antrPers.lista === null) await incarcaAntrPers();
}

// ---- Pozele antrenamentelor proprii (max. 3), în R2 prin Worker (antr/<antrenor>/<client>/<id>/<n>.jpg) ----
// În editor, schimbările stau în antrPers.pozeNoi (fișiere alese) și antrPers.pozeSterse (numere scoase) până la „Salvează”.
// Pozele alese nu intră în ciorna de pe dispozitiv (localStorage nu ține fișiere): se încarcă la salvare.
const MAX_POZE_ANTR = 3;
const cachePozeAntr = new Map(); // `id|n` -> Promise<object URL>

async function cerePozeAntr(metoda, cale, param, corp) {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) return null;
  const antete = { Authorization: 'Bearer ' + data.session.access_token };
  if (corp) antete['Content-Type'] = corp.type;
  const q = new URLSearchParams(Object.assign({}, param, FOLOSESTE_STAGING ? { test: '1' } : {}));
  return fetch(`${URL_POZE_ANTR}${cale}?${q}`, { method: metoda, headers: antete, body: corp }).catch(() => null);
}

// Imaginile <img data-poza-antr="id|n"> se aduc cu autentificare (nu pot fi link-uri publice)
function umplePozeAntr(radacina) {
  radacina.querySelectorAll('img[data-poza-antr]').forEach(async img => {
    const cheie = img.dataset.pozaAntr;
    if (!cachePozeAntr.has(cheie)) {
      const [id, n] = cheie.split('|');
      cachePozeAntr.set(cheie, cerePozeAntr('GET', '/antr-poza', { id, n })
        .then(r => r && r.ok ? r.blob() : null)
        .then(b => b ? URL.createObjectURL(b) : ''));
    }
    const src = await cachePozeAntr.get(cheie);
    if (src) img.src = src;
    else {
      cachePozeAntr.delete(cheie);
      img.closest('.antr-poza')?.classList.add('poza-lipsa');
    }
  });
}

// Grila de poze: în editor cu × și „+ Poză”, la antrenor doar de privit; atingerea mărește poza
function htmlGrilaPozeAntr(id, poze, editabil) {
  const cadru = (img, scoate) => `<div class="antr-poza">${img}${editabil ? scoate : ''}</div>`;
  const marire = `onclick="this.parentElement.classList.toggle('mare')"`;
  const existente = (poze || []).filter(n => !(editabil && (antrPers.pozeSterse || []).includes(n)))
    .map(n => cadru(`<img data-poza-antr="${escAttr(id)}|${escAttr(n)}" alt="" ${marire}>`,
      `<button type="button" class="poza-scoate" onclick="antrPersScoatePoza('${escAttr(n)}')" aria-label="${tr('Scoate poza', 'Remove photo')}">×</button>`));
  const noi = editabil ? (antrPers.pozeNoi || []).map((p, i) => cadru(`<img src="${p.url}" alt="" ${marire}>`,
    `<button type="button" class="poza-scoate" onclick="antrPersScoatePozaNoua(${i})" aria-label="${tr('Scoate poza', 'Remove photo')}">×</button>`)) : [];
  const adauga = editabil && existente.length + noi.length < MAX_POZE_ANTR
    ? `<label class="antr-poza antr-poza-adauga"><input type="file" accept="image/*" hidden onchange="antrPersAlegePoza(this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        <span>${tr('+ Poză', '+ Photo')}</span></label>` : '';
  return existente.concat(noi).length || adauga ? `<div class="antr-poze-grila">${existente.concat(noi).join('')}${adauga}</div>` : '';
}

async function antrPersAlegePoza(input) {
  const fisier = input.files && input.files[0];
  input.value = '';
  if (!fisier || !antrPers.curent) return;
  try {
    const blob = await micsoreazaPozaJpeg(fisier);
    antrPers.pozeNoi = (antrPers.pozeNoi || []).concat({ blob, url: URL.createObjectURL(blob) });
    reRandeazaEditorAntrPers();
  } catch (e) {
    showToast(tr('Poza nu a putut fi citită. Încearcă alta.', 'The photo could not be read. Try another one.'), 'error');
  }
}

function antrPersScoatePoza(n) {
  antrPers.pozeSterse = (antrPers.pozeSterse || []).concat(n);
  reRandeazaEditorAntrPers();
}

function antrPersScoatePozaNoua(i) {
  const p = (antrPers.pozeNoi || [])[i];
  if (!p) return;
  URL.revokeObjectURL(p.url);
  antrPers.pozeNoi.splice(i, 1);
  reRandeazaEditorAntrPers();
}

// După salvarea rândului: șterge pozele scoase, încarcă pozele noi pe numerele libere, apoi scrie lista în rând.
// false = cel puțin o poză nu a reușit (cele reușite rămân salvate)
async function sincronizeazaPozeAntrPers(rand) {
  const sterse = antrPers.pozeSterse || [], noi = antrPers.pozeNoi || [];
  antrPers.pozeSterse = [];
  antrPers.pozeNoi = [];
  if (!sterse.length && !noi.length) return true;
  let poze = (rand.poze || []).slice();
  let ok = true;
  for (const n of sterse) {
    const r = await cerePozeAntr('DELETE', '/antr-poza', { id: rand.id, n });
    if (r && r.ok) { poze = poze.filter(x => x !== n); cachePozeAntr.delete(rand.id + '|' + n); }
    else ok = false;
  }
  for (const p of noi) {
    const n = ['1', '2', '3'].find(x => !poze.includes(x));
    if (!n) break;
    const r = await cerePozeAntr('PUT', '/antr-poza', { id: rand.id, n }, p.blob);
    if (r && r.ok) { poze.push(n); cachePozeAntr.set(rand.id + '|' + n, Promise.resolve(p.url)); }
    else { ok = false; URL.revokeObjectURL(p.url); }
  }
  poze.sort();
  const { data, error } = await supabaseClient.from('antrenamente_personale').update({ poze }).eq('id', rand.id).select().single();
  if (error || !data) return false;
  const i = (antrPers.lista || []).findIndex(x => x.id === data.id);
  if (i >= 0) antrPers.lista[i] = data;
  return ok;
}

function rezumatAntrPers(x) {
  const parti = [];
  const ex = (x.exercitii || []).filter(e => (e.exercitiu || '').trim());
  if (ex.length) parti.push(`${ex.length} ${ex.length === 1 ? tr('exercițiu', 'exercise') : tr('exerciții', 'exercises')}`);
  if (x.distanta_km) parti.push(`${formatKg(Number(x.distanta_km))} km`);
  if (x.durata_min) parti.push(`${x.durata_min} min`);
  const nrPoze = (x.poze || []).length;
  if (nrPoze) parti.push(nrPoze === 1 ? tr('1 poză', '1 photo') : tr(`${nrPoze} poze`, `${nrPoze} photos`));
  return parti.join(' · ');
}

function titluAntrPers(x) {
  return (x.titlu || '').trim() || tr(...(ACTIVITATI_PERS[x.activitate] || ACTIVITATI_PERS.altele));
}

// Cardul de pe Acasă: ultimul antrenament propriu și „+ Nou”
function htmlAntrPersAcasa() {
  const ultim = antrenamentePersFacute()[0];
  const ciorna = citesteCiornaAntrPers();
  const detalii = ciorna && ciorna.curent ? tr('Ai un antrenament început. Continuă-l de aici.', 'You have a workout in progress. Continue it here.')
    : ultim ? `${tr('Ultimul', 'Last')}: ${escAttr(titluAntrPers(ultim))}, ${escAttr(etichetaDataAntrPers(ultim.data))}`
    : tr('Notează și ce faci în afara planului: sală, alergare, bicicletă.', 'Log what you do outside your plan too: gym, running, cycling.');
  const ciornaActiva = !!(ciorna && ciorna.curent);
  return `<button type="button" class="acasa-scurtatura${ciornaActiva ? ' activ' : ''}" id="cardAntrPersAcasa" onclick="deschideAntrPers()" title="${escAttr(detalii.replace(/<[^>]+>/g, ''))}">
    <span><svg viewBox="0 0 24 24"><path d="M6 5v14M18 5v14M3 9v6M21 9v6M6 12h12"/></svg></span>${ciornaActiva ? tr('Continuă', 'Continue') : tr('Antrenament', 'Workout')}
  </button>`;
}

function arataInapoiAntrPers() {
  document.getElementById('clientaBtnInapoi').style.visibility = 'visible';
}

async function deschideAntrPers() {
  antrPers.ecran = 'lista';
  dateClienta.planCurent = null;
  arataInapoiAntrPers();
  randeazaListaAntrPers();
  await incarcaAntrPers();
  if (antrPers.ecran === 'lista') randeazaListaAntrPers();
}

function randeazaListaAntrPers() {
  document.getElementById('clientaTitlu').innerText = tr('Antrenamente', 'My workouts');
  const corp = document.getElementById('clientaContinut');
  if (antrPers.lista === null) {
    corp.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
    return;
  }
  const ciorna = citesteCiornaAntrPers();
  let html = '';
  if (ciorna && ciorna.curent) {
    html += `<div class="card acasa-sedinta" onclick="continuaCiornaAntrPers()">
      <div><div class="acasa-eticheta">${tr('Neterminat', 'In progress')}</div><b>${escAttr(titluAntrPers(ciorna.curent))}</b></div>
      <div style="display:flex; gap:6px;"><button type="button" class="btn btn-clear" onclick="event.stopPropagation(); renuntaCiornaAntrPers()">${tr('Renunță', 'Discard')}</button>
      <button type="button" class="btn" onclick="event.stopPropagation(); continuaCiornaAntrPers()">${tr('Continuă', 'Continue')}</button></div>
    </div>`;
  }
  html += `<div class="antr-pers-actiuni">
    <button type="button" class="btn" onclick="antrPersNou()">${tr('+ Antrenament nou', '+ New workout')}</button>
    <button type="button" class="btn btn-clear" onclick="antrPersNou(null, 'rutina')">${tr('+ Rutină', '+ Routine')}</button>
  </div>`;
  const rutine = (antrPers.lista || []).map((x, i) => ({ x, i })).filter(o => o.x.fel === 'rutina');
  html += `<div class="antr-pers-sectiune">${tr('Rutinele mele', 'My routines')}</div>`;
  html += rutine.length ? rutine.map(({ x, i }) => `<div class="card acasa-sedinta" onclick="antrPersEditeaza(${i})">
      <div><b>${escAttr(titluAntrPers(x))}</b><div class="acasa-antrenament-detalii">${rezumatAntrPers(x)}</div></div>
      <button type="button" class="btn" style="white-space:nowrap;" onclick="event.stopPropagation(); antrPersNou(${i})">${tr('Începe', 'Start')}</button>
    </div>`).join('')
    : `<div class="antr-pers-gol">${tr('Salvează exercițiile pe care le faci des ca rutină și pornește-le cu o atingere.', 'Save the exercises you do often as a routine and start them with one tap.')}</div>`;
  const facute = (antrPers.lista || []).map((x, i) => ({ x, i })).filter(o => o.x.fel === 'antrenament');
  html += `<div class="antr-pers-sectiune">${tr('Istoric', 'History')}</div>`;
  html += facute.length ? facute.map(({ x, i }) => `<div class="card acasa-sedinta" onclick="antrPersEditeaza(${i})">
      <div><div class="acasa-eticheta">${escAttr(etichetaDataAntrPers(x.data))}${x.vizibil_antrenor ? '' : ` · ${tr('privat', 'private')}`}</div>
      <b>${escAttr(titluAntrPers(x))}</b><div class="acasa-antrenament-detalii">${rezumatAntrPers(x)}</div></div>
      <div class="drawer-nav-arrow">›</div>
    </div>`).join('')
    : `<div class="antr-pers-gol">${tr('Încă nu ai notat niciun antrenament propriu.', 'You haven’t logged any workouts of your own yet.')}</div>`;
  corp.innerHTML = html;
}

// Antrenament nou: gol, sau din rutina de pe poziția idxRutina (exercițiile și seriile ei, nebifate)
function antrPersNou(idxRutina, fel) {
  const ciorna = citesteCiornaAntrPers();
  const porneste = () => {
    const rutina = idxRutina !== undefined && idxRutina !== null ? antrPers.lista[idxRutina] : null;
    antrPers.curent = {
      id: null, fel: fel || 'antrenament', data: aziIsoAntrPers(), titlu: rutina ? rutina.titlu : '', activitate: 'sala',
      durata_min: null, distanta_km: null, nota: '', vizibil_antrenor: true,
      exercitii: rutina ? JSON.parse(JSON.stringify(rutina.exercitii || [])).map(e => Object.assign(e, { serii: (e.serii || []).map(r => ({ kg: r.kg || '', rep: r.rep || '', gata: false })) })) : []
    };
    antrPers.start = Date.now();
    deschideEditorAntrPers();
  };
  if (ciorna && ciorna.curent && (fel || 'antrenament') === 'antrenament' && ciorna.curent.fel === 'antrenament' && !ciorna.curent.id) {
    customConfirm(tr('Antrenament neterminat', 'Workout in progress'),
      tr('Ai deja un antrenament început. Îl înlocuiești cu unul nou?', 'You already have a workout in progress. Replace it with a new one?'), porneste);
    return;
  }
  porneste();
}

function antrPersEditeaza(idx) {
  const x = antrPers.lista && antrPers.lista[idx];
  if (!x) return;
  antrPers.curent = JSON.parse(JSON.stringify(x));
  antrPers.start = 0;
  deschideEditorAntrPers();
}

function continuaCiornaAntrPers() {
  const ciorna = citesteCiornaAntrPers();
  if (!ciorna || !ciorna.curent) return;
  antrPers.curent = ciorna.curent;
  antrPers.start = ciorna.start || 0;
  deschideEditorAntrPers();
}

function renuntaCiornaAntrPers() {
  customConfirm(tr('Renunță', 'Discard'), tr('Ștergi antrenamentul neterminat?', 'Discard the unfinished workout?'), () => {
    stergeCiornaAntrPers();
    randeazaListaAntrPers();
  });
}

function deschideEditorAntrPers() {
  (antrPers.pozeNoi || []).forEach(p => URL.revokeObjectURL(p.url));
  antrPers.pozeNoi = [];
  antrPers.pozeSterse = [];
  antrPers.ecran = 'editor';
  dateClienta.planCurent = null;
  arataInapoiAntrPers();
  salveazaCiornaAntrPers();
  randeazaEditorAntrPers();
  document.getElementById('clientaScreen')?.scrollTo({ top: 0, behavior: 'auto' });
  // Pornit de pe Acasă (fără lista completă): „data trecută”, recordurile și sugestiile apar după încărcare
  if (antrPers.lista === null) asiguraListaAntrPers().then(() => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (antrPers.ecran === 'editor' && tag !== 'INPUT' && tag !== 'TEXTAREA') reRandeazaEditorAntrPers();
  });
}

// Exercițiile cunoscute (șabloanele B-Fit, planurile clientului, antrenamentele lui), pentru sugestii și mușchi
function exercitiiCunoscuteAntrPers() {
  const harta = new Map();
  const adauga = ex => {
    const nume = (ex.exercitiu || '').trim();
    if (nume && !harta.has(nume.toLowerCase())) harta.set(nume.toLowerCase(), { exercitiu: nume, muschi: ex.muschi || '', tip: ex.tip || 'kg' });
  };
  (antrPers.lista || []).forEach(x => (x.exercitii || []).forEach(adauga));
  (dateClienta.planuri || []).forEach(p => (p.continut_json?.sesiuni || []).forEach(s => (s.exercitii || []).forEach(adauga)));
  if (typeof SABLOANE_PLAN !== 'undefined') SABLOANE_PLAN.forEach(p => (p.continut_json?.sesiuni || []).forEach(s => (s.exercitii || []).forEach(adauga)));
  return harta;
}

// Seriile de data trecută la exercițiu: întâi antrenamentele proprii (cel mai recent primul), apoi planurile
function seriiTrecutAntrPers(nume) {
  const cheie = (nume || '').trim().toLowerCase();
  for (const x of antrenamentePers()) {
    if (antrPers.curent && x.id === antrPers.curent.id) continue;
    const ex = (x.exercitii || []).find(e => (e.exercitiu || '').trim().toLowerCase() === cheie && (e.serii || []).some(r => r.gata));
    if (ex) return ex.serii;
  }
  return seriiDataTrecuta(nume, null);
}

// Exercițiile din antrenamentul c la care greutatea bifată trece peste tot ce s-a notat înainte
function recorduriAntrPers(c) {
  return (c.exercitii || []).map(ex => {
    const kg = kgMaxExercitiu(ex), inainte = recordAntrPers(ex.exercitiu);
    return { exercitiu: (ex.exercitiu || '').trim(), kg, inainte };
  }).filter(r => r.exercitiu && r.inainte > 0 && r.kg > r.inainte);
}

// Recordul de până acum (kg): planurile + celelalte antrenamente proprii
function recordAntrPers(nume) {
  const cheie = (nume || '').trim().toLowerCase();
  let max = recordAnteriorKg({ exercitiu: nume }, null);
  antrenamentePers().forEach(x => {
    if (antrPers.curent && x.id === antrPers.curent.id) return;
    (x.exercitii || []).forEach(e => { if ((e.exercitiu || '').trim().toLowerCase() === cheie) max = Math.max(max, kgMaxExercitiu(e)); });
  });
  return max;
}

function randeazaEditorAntrPers() {
  const c = antrPers.curent;
  if (!c) return;
  const rutina = c.fel === 'rutina';
  document.getElementById('clientaTitlu').innerText = rutina ? tr('Rutină', 'Routine') : (c.id ? tr('Antrenament', 'Workout') : tr('Antrenament nou', 'New workout'));
  const sala = rutina || c.activitate === 'sala';
  let html = '<div class="plan-session-block antr-pers-editor">';
  if (!rutina) {
    html += `<div class="antr-pers-activitati">${Object.entries(ACTIVITATI_PERS).map(([cod, et]) =>
      `<button type="button" class="antr-pers-activitate${c.activitate === cod ? ' activ' : ''}" onclick="antrPersActivitate('${cod}')">${tr(...et)}</button>`).join('')}</div>`;
  }
  html += `<div class="antr-pers-campuri">
    <label>${tr('Titlu', 'Title')}<input type="text" class="plan-ex-input" maxlength="80" value="${escAttr(c.titlu)}" placeholder="${escAttr(rutina ? tr('Ex: Picioare acasă', 'E.g. Home legs') : titluAntrPers(Object.assign({}, c, { titlu: '' })))}" oninput="antrPersCamp('titlu', this.value)"></label>
    ${rutina ? '' : `<label>${tr('Data', 'Date')}<input type="date" class="plan-ex-input" value="${escAttr(c.data)}" max="${aziIsoAntrPers()}" onchange="antrPersCamp('data', this.value)"></label>`}
  </div>`;
  if (!rutina) {
    html += `<div class="antr-pers-campuri">
      <label>${tr('Durată (min)', 'Duration (min)')}<input type="text" inputmode="numeric" maxlength="4" class="plan-ex-input" value="${escAttr(c.durata_min ?? '')}" placeholder="${sala && antrPers.start ? tr('automat', 'auto') : '-'}" oninput="antrPersCamp('durata_min', this.value)"></label>
      ${sala ? '' : `<label>${tr('Distanță (km)', 'Distance (km)')}<input type="text" inputmode="decimal" maxlength="7" class="plan-ex-input" value="${escAttr(c.distanta_km ?? '')}" placeholder="-" oninput="antrPersCamp('distanta_km', this.value)"></label>`}
    </div>`;
  }
  html += '</div>';
  if (sala) {
    (c.exercitii || []).forEach((ex, e) => { html += htmlExercitiuAntrPers(ex, e, rutina); });
    const sugestii = [...exercitiiCunoscuteAntrPers().values()].map(x => `<option value="${escAttr(x.exercitiu)}"></option>`).join('');
    html += `<div class="antr-pers-adauga">
      <input type="text" id="antrPersExNou" class="plan-ex-input" maxlength="80" list="listaExercitiiPers" placeholder="${tr('Caută sau scrie un exercițiu', 'Search or type an exercise')}" onkeydown="if (event.key === 'Enter') antrPersAdaugaExercitiu()">
      <datalist id="listaExercitiiPers">${sugestii}</datalist>
      <button type="button" class="btn" onclick="antrPersAdaugaExercitiu()">${tr('Adaugă', 'Add')}</button>
    </div>`;
  }
  if (!rutina) {
    html += `<div class="plan-session-block"><div class="nota-sesiune" style="border-top:0;">
      <label>${tr('Poze', 'Photos')} <span class="antr-poze-nota">${tr('(până la 3, se încarcă la salvare)', '(up to 3, uploaded when you save)')}</span></label>
      ${htmlGrilaPozeAntr(c.id, c.poze, true)}
    </div></div>`;
  }
  html += `<div class="plan-session-block"><div class="nota-sesiune" style="border-top:0;">
    <label>${rutina ? tr('Notiță', 'Note') : tr('Cum a mers?', 'How did it go?')}</label>
    <textarea class="plan-ex-textarea" maxlength="1000" oninput="antrPersCamp('nota', this.value)">${escAttr(c.nota)}</textarea>
  </div>
  ${rutina ? '' : `<label class="setare-notificare antr-pers-vizibil">
    <span><b>${tr('Vizibil antrenorului', 'Visible to my trainer')}</b><small>${tr('Antrenorul îl vede în fișa ta (doar citire).', 'Your trainer sees it in your profile (read only).')}</small></span>
    <input type="checkbox" class="comutator" ${c.vizibil_antrenor ? 'checked' : ''} onchange="antrPersCamp('vizibil_antrenor', this.checked)">
  </label>${comunitate.membru ? `<label class="setare-notificare antr-pers-vizibil">
    <span><b>${tr('Vizibil în comunitate', 'Visible to the community')}</b><small>${tr('Oprit = „Doar tu”. Ceilalți văd titlul și ziua, fără greutăți sau note.', 'Off = “Only you”. Others see the title and day, never weights or notes.')}</small></span>
    <input type="checkbox" class="comutator" ${antrPersInComunitate(c) ? 'checked' : ''} onchange="antrPersCamp('in_comunitate', this.checked)">
  </label>` : ''}`}</div>`;
  html += `<div class="antr-pers-actiuni antr-pers-final">
    <button type="button" class="btn" onclick="antrPersSalveaza()">${rutina ? tr('Salvează rutina', 'Save routine') : tr('Salvează antrenamentul', 'Save workout')}</button>
    ${!rutina && sala && (c.exercitii || []).length ? `<button type="button" class="btn btn-clear" onclick="antrPersSalveazaCaRutina()">${tr('Salvează ca rutină', 'Save as routine')}</button>` : ''}
    ${c.id ? `<button type="button" class="btn btn-clear antr-pers-sterge" onclick="antrPersSterge()">${tr('Șterge', 'Delete')}</button>` : ''}
  </div>`;
  document.getElementById('clientaContinut').innerHTML = html;
  umplePozeAntr(document.getElementById('clientaContinut'));
}

function htmlExercitiuAntrPers(ex, e, rutina) {
  const trecut = rutina ? [] : seriiTrecutAntrPers(ex.exercitiu);
  const record = rutina ? 0 : recordAntrPers(ex.exercitiu);
  const kgAzi = kgMaxExercitiu(ex);
  const iRecord = record > 0 && kgAzi > record ? (ex.serii || []).findIndex(r => r.gata && numarKg(r.kg) === kgAzi) : -1;
  const randuri = (ex.serii || []).map((r, i) => {
    const vechi = trecut[i] || {};
    return `<div class="serie-rand${r.gata ? ' is-gata' : ''}${i === iRecord ? ' is-record' : ''}">
      <span class="serie-nr">${i + 1}</span>
      <input type="text" inputmode="decimal" maxlength="10" class="plan-ex-input serie-camp" value="${escAttr(r.kg)}" placeholder="${escAttr(vechi.kg || 'kg')}" oninput="antrPersSerie(${e}, ${i}, 'kg', this.value)"><span class="serie-x">×</span>
      <input type="text" inputmode="numeric" maxlength="10" class="plan-ex-input serie-camp" value="${escAttr(r.rep)}" placeholder="${escAttr(vechi.rep || '-')}" oninput="antrPersSerie(${e}, ${i}, 'rep', this.value)">
      ${rutina ? '<span class="serie-bifa-loc"></span>' : `<button type="button" class="serie-bifa" aria-pressed="${!!r.gata}" aria-label="${tr('Serie făcută', 'Set done')}" onclick="antrPersBifa(${e}, ${i})">✓</button>`}
    </div>`;
  }).join('');
  return `<div class="plan-session-block antr-pers-ex">
    <div class="antr-pers-ex-antet">
      <div><button type="button" class="progres-ex-nume" style="font-size:0.88rem;" data-ex="${escAttr(ex.exercitiu)}" onclick="deschideProgresExercitiuDupaNume(this.dataset.ex)">${escAttr(ex.exercitiu)}${ICON_PROGRES_EX}</button>
      ${ex.muschi ? `<div class="plan-ex-muschi">${escAttr(ex.muschi)}</div>` : ''}</div>
      <button type="button" class="notificare-x" onclick="antrPersStergeExercitiu(${e})" aria-label="${tr('Scoate exercițiul', 'Remove exercise')}">×</button>
    </div>
    <div class="serii-lista"><div class="serie-rand serie-cap"><span class="serie-nr">${tr('Seria', 'Set')}</span><span class="serie-camp">Kg</span><span class="serie-x"></span><span class="serie-camp">${tr('Rep', 'Reps')}</span><span class="serie-bifa-loc"></span></div>${randuri}</div>
    <div class="antr-pers-serii-btn">
      <button type="button" class="btn btn-clear" onclick="antrPersSerieNoua(${e})">${tr('+ Serie', '+ Set')}</button>
      ${(ex.serii || []).length > 1 ? `<button type="button" class="btn btn-clear" onclick="antrPersScoateSerie(${e})">${tr('− Serie', '− Set')}</button>` : ''}
    </div>
  </div>`;
}

// Re-randare cu scroll păstrat (bifă, serie nouă, exercițiu nou)
function reRandeazaEditorAntrPers() {
  const ecran = document.getElementById('clientaScreen');
  const sus = ecran ? ecran.scrollTop : 0;
  randeazaEditorAntrPers();
  if (ecran) ecran.scrollTop = sus;
}

function antrPersCamp(camp, valoare) {
  const c = antrPers.curent;
  if (!c) return;
  if (camp === 'durata_min') valoare = String(valoare).replace(/\D/g, '') ? parseInt(String(valoare).replace(/\D/g, ''), 10) : null;
  if (camp === 'distanta_km') { const n = parseFloat(String(valoare).replace(',', '.')); valoare = isNaN(n) ? null : n; }
  c[camp] = valoare;
  salveazaCiornaAntrPers();
}

function antrPersActivitate(cod) {
  if (!antrPers.curent) return;
  antrPers.curent.activitate = cod;
  salveazaCiornaAntrPers();
  reRandeazaEditorAntrPers();
}

function antrPersSerie(e, i, camp, valoare) {
  const r = antrPers.curent?.exercitii?.[e]?.serii?.[i];
  if (!r) return;
  r[camp] = valoare;
  salveazaCiornaAntrPers();
}

// Bifa pe o serie goală preia valorile de data trecută sau de la seria de deasupra (ca la plan); record → toast
function antrPersBifa(e, i) {
  const ex = antrPers.curent?.exercitii?.[e];
  const r = ex?.serii?.[i];
  if (!r) return;
  const kgInainte = kgMaxExercitiu(ex);
  r.gata = !r.gata;
  if (r.gata) {
    const vechi = seriiTrecutAntrPers(ex.exercitiu)[i] || ex.serii[i - 1] || {};
    if (!String(r.kg).trim()) r.kg = vechi.kg || '';
    if (!String(r.rep).trim()) r.rep = vechi.rep || '';
    const record = recordAntrPers(ex.exercitiu);
    const kg = numarKg(r.kg);
    if (record > 0 && kg > record && kg > kgInainte) {
      showToast(tr(`Record nou: ${formatKg(kg)} kg la ${ex.exercitiu} (înainte ${formatKg(record)} kg)`, `New record: ${formatKg(kg)} kg on ${ex.exercitiu} (was ${formatKg(record)} kg)`));
      if (navigator.vibrate) navigator.vibrate(80);
    }
  }
  salveazaCiornaAntrPers();
  reRandeazaEditorAntrPers();
  const ultima = e === antrPers.curent.exercitii.length - 1 && i === ex.serii.length - 1;
  if (r.gata && !ultima) pornesteTimerPauza(ex.pauza);
  else opresteTimerPauza();
}

function antrPersSerieNoua(e) {
  const ex = antrPers.curent?.exercitii?.[e];
  if (!ex || ex.serii.length >= 10) return;
  ex.serii.push({ kg: '', rep: '', gata: false });
  salveazaCiornaAntrPers();
  reRandeazaEditorAntrPers();
}

function antrPersScoateSerie(e) {
  const ex = antrPers.curent?.exercitii?.[e];
  if (!ex || ex.serii.length <= 1) return;
  ex.serii.pop();
  salveazaCiornaAntrPers();
  reRandeazaEditorAntrPers();
}

function antrPersAdaugaExercitiu() {
  const inp = document.getElementById('antrPersExNou');
  const nume = (inp && inp.value || '').trim().slice(0, 80);
  if (!nume || !antrPers.curent) return;
  const cunoscut = exercitiiCunoscuteAntrPers().get(nume.toLowerCase());
  const nr = Math.max(seriiTrecutAntrPers(nume).length, 3);
  antrPers.curent.exercitii.push({
    exercitiu: cunoscut ? cunoscut.exercitiu : nume, muschi: cunoscut ? cunoscut.muschi : '',
    serii: Array.from({ length: Math.min(nr, 10) }, () => ({ kg: '', rep: '', gata: false }))
  });
  salveazaCiornaAntrPers();
  reRandeazaEditorAntrPers();
  document.getElementById('antrPersExNou')?.scrollIntoView({ block: 'center', behavior: 'auto' });
}

function antrPersStergeExercitiu(e) {
  const ex = antrPers.curent?.exercitii?.[e];
  if (!ex) return;
  customConfirm(tr('Scoate exercițiul', 'Remove exercise'), tr(`Scoți „${ex.exercitiu}” din antrenament?`, `Remove “${ex.exercitiu}” from the workout?`), () => {
    antrPers.curent.exercitii.splice(e, 1);
    salveazaCiornaAntrPers();
    reRandeazaEditorAntrPers();
  });
}

// Rândul de salvat: la sală doar exercițiile cu nume; la cardio fără exerciții
function randAntrPers(c) {
  const sala = c.fel === 'rutina' || c.activitate === 'sala';
  return {
    user_id: dateClienta.fisa.user_id, client_id: dateClienta.fisa.id, fel: c.fel, data: c.data || aziIsoAntrPers(),
    titlu: (c.titlu || '').trim().slice(0, 80), activitate: c.fel === 'rutina' ? 'sala' : c.activitate,
    durata_min: c.fel === 'rutina' ? null : (c.durata_min ?? null), distanta_km: sala ? null : (c.distanta_km ?? null),
    exercitii: sala ? (c.exercitii || []).filter(e => (e.exercitiu || '').trim()) : [],
    nota: (c.nota || '').slice(0, 1000), vizibil_antrenor: c.fel === 'rutina' ? false : !!c.vizibil_antrenor,
    updated_at: new Date().toISOString()
  };
}

async function scrieAntrPers(rand, id) {
  // Lista locală trebuie să fie completă înainte să adăugăm rândul nou în ea
  await asiguraListaAntrPers();
  const q = id ? supabaseClient.from('antrenamente_personale').update(rand).eq('id', id)
    : supabaseClient.from('antrenamente_personale').insert(rand);
  const { data, error } = await q.select().single();
  if (error || !data) {
    showToast(eroareDeRetea(error)
      ? tr('Fără internet. Antrenamentul rămâne pe dispozitiv; salvează-l când revine conexiunea.', 'No internet. The workout stays on this device; save it when you’re back online.')
      : tr('Nu s-a putut salva. Încearcă din nou.', 'Could not save. Try again.'), 'error');
    return null;
  }
  antrPers.lista = (antrPers.lista || []).filter(x => x.id !== data.id);
  antrPers.lista.push(data);
  antrPers.lista.sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.created_at).localeCompare(String(a.created_at)));
  return data;
}

async function antrPersSalveaza() {
  const c = antrPers.curent;
  if (!c) return;
  const sala = c.fel === 'rutina' || c.activitate === 'sala';
  const cuExercitii = (c.exercitii || []).some(e => (e.exercitiu || '').trim());
  if (sala && !cuExercitii) return showToast(tr('Adaugă cel puțin un exercițiu.', 'Add at least one exercise.'), 'error');
  if (c.fel === 'rutina' && !(c.titlu || '').trim()) return showToast(tr('Dă un nume rutinei.', 'Give the routine a name.'), 'error');
  if (!sala && !c.durata_min && !c.distanta_km) return showToast(tr('Completează durata sau distanța.', 'Fill in the duration or distance.'), 'error');
  // Durata la sală, dacă n-a scris-o: de la începutul antrenamentului (doar dacă a început azi, maxim 4 ore)
  if (sala && c.fel === 'antrenament' && !c.durata_min && antrPers.start) {
    const min = Math.round((Date.now() - antrPers.start) / 60000);
    if (min > 0 && min <= 240) c.durata_min = min;
  }
  // Recordurile se calculează înainte de salvare (după, antrenamentul nou ar intra în comparație)
  await asiguraListaAntrPers();
  const recorduri = c.fel === 'antrenament' && c.vizibil_antrenor && !c.id ? recorduriAntrPers(c) : [];
  const salvat = await scrieAntrPers(randAntrPers(c), c.id);
  if (!salvat) return;
  const pozeOk = c.fel !== 'antrenament' || await sincronizeazaPozeAntrPers(salvat);
  // Comunitatea vede doar antrenamentele lăsate vizibile antrenorului (titlul, durata, distanța, câte exerciții)
  // Comunitatea: separat de „Vizibil antrenorului”; „Doar tu” păstrează activitatea doar pentru autor
  if (c.fel === 'antrenament' && comunitate.membru) {
    const nrEx = (salvat.exercitii || []).length;
    posteazaActivitateComunitate({ tip: 'proprii', data: salvat.data, titlu: titluAntrPers(salvat), sursa: 'proprii:' + salvat.id, ascuns: !antrPersInComunitate(c),
      detalii: [salvat.durata_min ? `${salvat.durata_min} min` : '', salvat.distanta_km ? `${formatKg(Number(salvat.distanta_km))} km` : '',
        nrEx ? tr(`${nrEx} ${nrEx === 1 ? 'exercițiu' : 'exerciții'}`, `${nrEx} ${nrEx === 1 ? 'exercise' : 'exercises'}`) : ''].filter(Boolean).join(' · ') });
  }
  // Antrenorul vede recordurile în conversație, ca la plan (doar din antrenamentele lăsate vizibile, o dată pe exercițiu și greutate)
  recorduri.forEach(r => {
    const cheie = r.exercitiu + '|' + r.kg;
    if (recorduriTrimise.has(cheie)) return;
    recorduriTrimise.add(cheie);
    trimiteContextInConversatie('record', `${formatKg(r.kg)} kg (${tr('înainte', 'was')} ${formatKg(r.inainte)} kg)`, { exercitiu: r.exercitiu, zi: titluAntrPers(c) });
  });
  opresteTimerPauza();
  stergeCiornaAntrPers();
  antrPers.curent = null;
  if (!pozeOk) showToast(tr('Antrenamentul s-a salvat, dar o poză nu s-a încărcat. Deschide-l și încearcă din nou.', 'The workout was saved, but a photo didn’t upload. Open it and try again.'), 'error');
  else showToast(c.fel === 'rutina' ? tr('✓ Rutină salvată', '✓ Routine saved') : tr('✓ Antrenament salvat. Bravo!', '✓ Workout saved. Well done!'));
  antrPers.ecran = 'lista';
  randeazaListaAntrPers();
  document.getElementById('clientaScreen')?.scrollTo({ top: 0, behavior: 'auto' });
  // Obiectivele (săptămâna, greutatea la exerciții), după mesajul de salvare
  if (c.fel === 'antrenament') setTimeout(() => { verificaObiectivSaptamanaAtins(); verificaObiectiveAtinse(); }, 1800);
}

// Rutină nouă din antrenamentul deschis: aceleași exerciții și serii (kg/rep ca reper), fără bife
async function antrPersSalveazaCaRutina() {
  const c = antrPers.curent;
  if (!c) return;
  const rutina = Object.assign({}, c, {
    id: null, fel: 'rutina', titlu: (c.titlu || '').trim() || tr('Rutina mea', 'My routine'), nota: '',
    exercitii: (c.exercitii || []).map(e => Object.assign({}, e, { serii: (e.serii || []).map(r => ({ kg: r.kg || '', rep: r.rep || '', gata: false })) }))
  });
  if (await scrieAntrPers(randAntrPers(rutina), null)) showToast(tr('✓ Salvat ca rutină', '✓ Saved as routine'));
}

function antrPersSterge() {
  const c = antrPers.curent;
  if (!c || !c.id) return;
  customConfirm(tr('Șterge', 'Delete'), c.fel === 'rutina' ? tr('Ștergi rutina?', 'Delete this routine?') : tr('Ștergi antrenamentul?', 'Delete this workout?'), async () => {
    // Pozele întâi: după ștergerea rândului, Worker-ul nu mai poate verifica al cui era antrenamentul
    if ((c.poze || []).length) {
      const r = await cerePozeAntr('DELETE', '/antr-poze', { id: c.id });
      if (!r || !r.ok) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    }
    const { error } = await supabaseClient.from('antrenamente_personale').delete().eq('id', c.id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    if (antrPers.lista) antrPers.lista = antrPers.lista.filter(x => x.id !== c.id);
    scoateActivitateComunitate('proprii:' + c.id);
    if (antrPers.usor) antrPers.usor = antrPers.usor.filter(x => x.id !== c.id);
    if ((citesteCiornaAntrPers()?.curent || {}).id === c.id) stergeCiornaAntrPers();
    antrPers.curent = null;
    antrPers.ecran = 'lista';
    randeazaListaAntrPers();
  });
}

// Înapoi din editor: la listă (ciorna rămâne pe dispozitiv doar pentru un antrenament nou, nesalvat)
function inapoiAntrPers() {
  opresteTimerPauza();
  if (String(antrPers.ecran).startsWith('nutritie')) return inapoiNutritie();
  if (antrPers.ecran === 'ciclu' || antrPers.ecran === 'comunitate') { antrPers.ecran = null; return randeazaHomeClienta(); }
  if (antrPers.ecran === 'istoric') return clientaTab('fisa');
  if (antrPers.ecran === 'editor') {
    if (antrPers.curent && antrPers.curent.id) stergeCiornaAntrPers();
    else if (antrPers.curent && antrPers.curent.fel === 'rutina') stergeCiornaAntrPers();
    antrPers.curent = null;
    antrPers.ecran = 'lista';
    randeazaListaAntrPers();
    return;
  }
  antrPers.ecran = null;
  randeazaHomeClienta();
}

// La antrenor (Fișă › Progres): antrenamentele proprii lăsate vizibile de client, doar citire
function htmlAntrPersAntrenor(lista) {
  if (!lista || !lista.length) return '';
  return `<div class="antr-pers-sectiune">${tr('Antrenamente proprii ale clientului', 'Client’s own workouts')}</div>` + lista.map(x => {
    const ex = (x.exercitii || []).filter(e => (e.exercitiu || '').trim()).map(e => {
      const facute = (e.serii || []).filter(r => r.gata);
      const kg = kgMaxExercitiu(e);
      return `${escAttr(e.exercitiu)}${facute.length ? ` · ${facute.length} × ${kg ? formatKg(kg) + ' kg' : ''}${facute.map(r => r.rep).filter(Boolean).length ? ` (${facute.map(r => escAttr(r.rep)).filter(Boolean).join('/')} rep)` : ''}` : ''}`;
    });
    return `<details class="card antr-pers-antrenor"><summary><span class="acasa-eticheta">${escAttr(etichetaDataAntrPers(x.data))}</span>
      <b>${escAttr(titluAntrPers(x))}</b> <span class="acasa-antrenament-detalii">${rezumatAntrPers(x)}</span></summary>
      ${ex.length ? `<ul>${ex.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      ${x.nota ? `<div class="acasa-antrenament-detalii">„${escAttr(x.nota)}”</div>` : ''}
      ${htmlGrilaPozeAntr(x.id, x.poze, false)}
    </details>`;
  }).join('');
}

// ---- Progresul pe exerciții: kg maxim / repetări maxime / volum (kg × rep) pe fiecare antrenament, în timp ----
// Datele: planurile (săptămânile trecute din istoric_saptamani + săptămâna curentă) și antrenamentele proprii.
// Sursa o dă cine afișează: clientul (ale lui) sau antrenorul (planurile clientului + antrenamentele lăsate vizibile).
let sursaProgresEx = { planuri: [], antrenamente: [] };
let listaProgresEx = [];
const ICON_PROGRES_EX = '<svg class="progres-ex-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>';
let progresExDeschis = null;

// Valorile unui exercițiu dintr-un antrenament (doar seriile bifate); null = nimic notat
// Seriile unei zile, compact, cu unitatea o singură dată: „15 · 15 · 13 rep”, „20 kg × 10 · 10 · 8”
function detaliuSerii(serii) {
  const v = serii.map(r => ({ kg: String(r.kg || '').trim(), rep: String(r.rep || '').trim() })).filter(r => r.kg || r.rep);
  if (!v.length) return `${serii.length} ${serii.length === 1 ? tr('serie', 'set') : tr('serii', 'sets')}`;
  const lista = k => v.map(r => r[k]).join(' · ');
  if (v.every(r => r.kg && r.rep)) {
    // Seriile la rând cu aceeași greutate se grupează: „30 kg × 10 · 10, 32 kg × 8”
    const grupe = [];
    v.forEach(r => { const g = grupe[grupe.length - 1]; if (g && g.kg === r.kg) g.rep.push(r.rep); else grupe.push({ kg: r.kg, rep: [r.rep] }); });
    return grupe.map(g => `${g.kg} kg × ${g.rep.join(' · ')}`).join(', ');
  }
  if (v.every(r => !r.kg)) return `${lista('rep')} rep`;
  if (v.every(r => !r.rep)) return `${lista('kg')} kg`;
  return v.map(r => r.kg && r.rep ? `${r.kg}×${r.rep}` : r.kg ? `${r.kg} kg` : `${r.rep} rep`).join(' · ');
}

function valoriSeriiEx(ex) {
  const facute = Array.isArray(ex.serii) ? ex.serii.filter(r => r.gata) : [];
  if (facute.length) {
    return {
      kg: Math.max(0, ...facute.map(r => numarKg(r.kg))),
      rep: Math.max(0, ...facute.map(r => numarKg(r.rep))),
      volum: facute.reduce((s, r) => s + numarKg(r.kg) * numarKg(r.rep), 0),
      detaliu: detaliuSerii(facute)
    };
  }
  // Exercițiile bifate „Făcut” înainte de notarea pe serii: doar greutatea
  const kg = numarKg(ex.greutate_kg);
  return ex.status === 'Finalizat' && kg ? { kg, rep: 0, volum: 0, detaliu: `${formatKg(kg)} kg` } : null;
}

function istoricExercitii(sursa) {
  const harta = new Map();
  // d = data de rezervă (săptămâna din istoric / ultima actualizare a planului); ziua din plan o are pe a ei în data_client
  const adauga = (sesiuni, d) => (sesiuni || []).forEach(s => {
    const [a, l, z] = String(s.data_client || '').split('-').map(Number);
    const dz = a ? new Date(a, l - 1, z) : d;
    if (!dz || isNaN(dz)) return;
    const zi = new Date(dz.getFullYear(), dz.getMonth(), dz.getDate());
    (s.exercitii || []).forEach(ex => {
      const nume = (ex.exercitiu || '').trim();
      const v = nume ? valoriSeriiEx(ex) : null;
      if (!v) return;
      const cheie = nume.toLowerCase();
      if (!harta.has(cheie)) harta.set(cheie, { nume, puncte: [] });
      const puncte = harta.get(cheie).puncte;
      // Aceeași zi (două antrenamente): maximele rămân maxime, volumul se adună
      const p = puncte.find(x => x.d.getTime() === zi.getTime());
      if (p) Object.assign(p, { kg: Math.max(p.kg, v.kg), rep: Math.max(p.rep, v.rep), volum: p.volum + v.volum, detaliu: p.detaliu + '; ' + v.detaliu });
      else puncte.push(Object.assign({ d: zi }, v));
    });
  });
  (sursa.planuri || []).forEach(p => {
    (p.continut_json?.istoric_saptamani || []).forEach(sapt => adauga(sapt.sesiuni, new Date(sapt.data)));
    adauga(p.continut_json?.sesiuni, new Date(p.updated_at || Date.now()));
  });
  (sursa.antrenamente || []).filter(x => x.fel === 'antrenament').forEach(x => {
    const [a, l, z] = String(x.data || '').split('-').map(Number);
    if (a) adauga([{ exercitii: x.exercitii }], new Date(a, l - 1, z));
  });
  return [...harta.values()].map(o => { o.puncte.sort((a, b) => a.d - b.d); return o; })
    .sort((a, b) => b.puncte.length - a.puncte.length || b.puncte[b.puncte.length - 1].d - a.puncte[a.puncte.length - 1].d);
}

// Clientul: planurile lui (cel deschis cu ce a notat chiar acum) + antrenamentele proprii (și cel în lucru)
function sursaProgresClient() {
  const planuri = (dateClienta.planuri || []).map(p => dateClienta.planCurent && dateClienta.planCurent.id === p.id ? dateClienta.planCurent : p);
  let antrenamente = antrenamentePers();
  const c = antrPers.curent;
  if (c && c.fel === 'antrenament') antrenamente = antrenamente.filter(x => x.id !== c.id).concat([c]);
  return { planuri, antrenamente };
}

function textSchimbareEx(o) {
  const p = o.puncte, prim = p[0], ultim = p[p.length - 1];
  if (p.length < 2) return { text: tr('o dată', 'once'), sus: false };
  const cuKg = p.some(x => x.kg > 0);
  const dif = cuKg ? ultim.kg - prim.kg : ultim.rep - prim.rep;
  if (Math.abs(dif) < 0.05) return { text: tr('la fel', 'same'), sus: false };
  return { text: `${dif > 0 ? '+' : '−'}${formatKg(Math.abs(dif))} ${cuKg ? 'kg' : 'rep'}`, sus: dif > 0 };
}

// Lista exercițiilor cu progres (Fișa mea / Fișă › Progres); primele 6, restul la „Încă N exerciții”
function htmlProgresExercitii(sursa) {
  sursaProgresEx = sursa;
  listaProgresEx = istoricExercitii(sursa);
  if (!listaProgresEx.length) {
    return `<div class="progres-gol">${tr('Graficele apar după primele serii bifate la exerciții.', 'Charts appear after the first checked sets.')}</div>`;
  }
  const rand = (o, i) => {
    const maxKg = Math.max(...o.puncte.map(x => x.kg)), maxRep = Math.max(...o.puncte.map(x => x.rep));
    const sch = textSchimbareEx(o);
    return `<button type="button" class="plan-zi-card progres-ex-rand" onclick="deschideProgresExercitiu(${i})">
      <span class="plan-zi-card-text"><span class="plan-zi-card-titlu">${escAttr(o.nume)}</span>
      <span class="plan-zi-card-detalii">${o.puncte.length} ${o.puncte.length === 1 ? tr('antrenament', 'workout') : tr('antrenamente', 'workouts')}${maxKg ? ` · ${tr('record', 'best')} ${formatKg(maxKg)} kg` : maxRep ? ` · max ${formatKg(maxRep)} rep` : ''}</span></span>
      <span class="progres-ex-dif${sch.sus ? ' sus' : ''}">${sch.text}</span>
    </button>`;
  };
  const primele = listaProgresEx.slice(0, 6).map(rand).join('');
  const rest = listaProgresEx.slice(6);
  return `<div class="plan-fisa-lista">${primele}</div>` + (rest.length ? `<details class="progres-ex-toate"><summary>${tr(`Încă ${rest.length} ${rest.length === 1 ? 'exercițiu' : 'exerciții'}`, `${rest.length} more ${rest.length === 1 ? 'exercise' : 'exercises'}`)}</summary>
    <div class="plan-fisa-lista">${rest.map((o, i) => rand(o, i + 6)).join('')}</div></details>` : '');
}

// idx = poziția din lista afișată (Fișa mea / Fișă › Progres)
function deschideProgresExercitiu(idx) {
  const o = listaProgresEx[idx];
  if (!o) return;
  progresExDeschis = { o, masura: o.puncte.some(x => x.kg > 0) ? 'kg' : 'rep' };
  randeazaProgresExercitiu();
  document.getElementById('modalProgresExBackdrop').style.display = 'flex';
}

// Atingerea numelui exercițiului în plan sau în antrenamentul propriu (doar pe ecranele clientului)
async function deschideProgresExercitiuDupaNume(nume) {
  await asiguraListaAntrPers();
  const cheie = (nume || '').trim().toLowerCase();
  listaProgresEx = istoricExercitii(sursaProgresClient());
  const i = listaProgresEx.findIndex(o => o.nume.toLowerCase() === cheie);
  if (i === -1) return showToast(tr('Graficul apare după prima serie bifată la acest exercițiu.', 'The chart appears after the first checked set on this exercise.'));
  deschideProgresExercitiu(i);
}

function inchideProgresExercitiu() {
  document.getElementById('modalProgresExBackdrop').style.display = 'none';
  progresExDeschis = null;
}

function alegeMasuraProgresEx(masura) {
  if (!progresExDeschis) return;
  progresExDeschis.masura = masura;
  randeazaProgresExercitiu();
}

function randeazaProgresExercitiu() {
  const { o, masura } = progresExDeschis;
  document.getElementById('progresExTitlu').innerText = o.nume;
  const masuri = [['kg', tr('Kg maxim', 'Max kg')], ['rep', tr('Repetări', 'Reps')], ['volum', tr('Volum', 'Volume')]]
    .filter(([m]) => o.puncte.some(x => x[m] > 0));
  const puncte = o.puncte.filter(x => x[masura] > 0).map(x => ({ d: x.d, kg: x[masura] }));
  const unitate = masura === 'rep' ? 'rep' : 'kg';
  const valori = puncte.map(p => p.kg);
  const cifra = (eticheta, val) => `<div class="metric-box"><div style="font-size:0.66rem; color:var(--text-muted); text-transform:uppercase;">${eticheta}</div><div class="metric-val">${val}</div></div>`;
  let html = masuri.length > 1 ? `<div class="antr-pers-activitati">${masuri.map(([m, et]) =>
    `<button type="button" class="antr-pers-activitate${m === masura ? ' activ' : ''}" onclick="alegeMasuraProgresEx('${m}')">${et}</button>`).join('')}</div>` : '';
  if (valori.length) {
    const dif = valori[valori.length - 1] - valori[0];
    html += `<div class="metric-grid" style="grid-template-columns:repeat(3, 1fr);">
      ${cifra(tr('Record', 'Best'), `${formatKg(Math.max(...valori))} <small>${unitate}</small>`)}
      ${cifra(tr('Ultima dată', 'Last time'), `${formatKg(valori[valori.length - 1])} <small>${unitate}</small>`)}
      ${cifra(tr('Progres', 'Change'), valori.length < 2 ? '–' : `${dif > 0 ? '+' : dif < 0 ? '−' : ''}${formatKg(Math.abs(dif))} <small>${unitate}</small>`)}
    </div>`;
  }
  html += htmlGraficGreutate(puncte, {
    unitate, aria: `${o.nume}: ${masuri.find(([m]) => m === masura)?.[1] || ''}`,
    gol: tr('Graficul apare de la al doilea antrenament cu acest exercițiu.', 'The chart appears from the second workout with this exercise.')
  });
  html += `<div class="progres-ex-istoric">${o.puncte.slice(-6).reverse().map(p => `<div><b>${escAttr(formatZiLuna(p.d))}</b><span>${escAttr(p.detaliu)}</span></div>`).join('')}</div>`;
  document.getElementById('progresExContinut').innerHTML = html;
}

// ---- Obiective și motivație: inelul săptămânii, „încă puțin până la...”, obiectivele clientului (sql/2026-11-05_obiective.sql) ----
// Zi activă = o zi cu ședință la sală, o zi din plan bifată (data_client) sau un antrenament propriu; două în aceeași zi = una.
// Obiectivele le setează clientul (Fișa mea) sau antrenorul (Fișă › Progres); greutatea corporală rămâne în cliente.obiectiv.

async function incarcaObiectiveClient() {
  if (!supabaseClient || !dateClienta.fisa) return;
  const { data, error } = await supabaseClient.from('obiective').select('*').eq('client_id', dateClienta.fisa.id).order('created_at');
  if (!error) dateClienta.obiective = data || [];
}

function obiectiveAtinse() {
  return (dateClienta.obiective || []).filter(o => o.atins_la);
}

// Ziua ('YYYY-MM-DD') → Date locală; null dacă lipsește
function dataDinIso(s) {
  const [a, l, z] = String(s || '').split('-').map(Number);
  return a ? new Date(a, l - 1, z) : null;
}

// Zilele active din săptămâna curentă, din ce știe telefonul: prezențe (din rezumatul Acasă), planuri, antrenamente proprii
function zileActiveSaptamanaClient() {
  const luni = lunaSaptamanii(new Date());
  const a = dateClienta.acasa;
  const zile = new Set(a && a.checkinSaptamana === lunaSaptamaniiCurente() ? (a.zilePrezenteSapt || []) : []);
  zileAntrPers().forEach(x => { if (lunaSaptamanii(x.d) === luni) zile.add(cheieZiClienta(x.d)); });
  const planuri = (dateClienta.planuri || []).map(p => dateClienta.planCurent && dateClienta.planCurent.id === p.id ? dateClienta.planCurent : p);
  planuri.forEach(p => {
    const sesiuni = (p.continut_json?.sesiuni || []).concat(...(p.continut_json?.istoric_saptamani || []).map(w => w.sesiuni || []));
    sesiuni.forEach(s => { const d = dataDinIso(s.data_client); if (d && lunaSaptamanii(d) === luni) zile.add(cheieZiClienta(d)); });
  });
  return zile.size;
}

function obiectivSaptamana(lista) {
  return (lista || []).find(o => o.tip === 'antrenamente_saptamana') || null;
}

// Inel de progres (SVG): procent 0–100, în mijloc textul dat
function htmlInelProgres(procent, centru, atins) {
  const r = 24, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, procent));
  return `<svg class="inel-progres${atins ? ' atins' : ''}" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="${r}" class="inel-fundal"/>
      <circle cx="30" cy="30" r="${r}" class="inel-valoare" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(1)}" transform="rotate(-90 30 30)"/>
      <text x="30" y="35" text-anchor="middle" class="inel-text">${centru}</text>
    </svg>`;
}

// „Încă puțin până la...”: cea mai apropiată insignă și cel mai apropiat obiectiv la un exercițiu (maximum două rânduri)
function incaPutinClient() {
  const a = dateClienta.acasa || {};
  const valori = { sedinte: a.nrSedinte || 0, proprii: antrenamentePersFacute().length, serie: a.recordSerie || 0, obiective: obiectiveAtinse().length };
  const unitati = {
    sedinte: n => n === 1 ? tr('ședință', 'session') : tr('ședințe', 'sessions'),
    proprii: n => n === 1 ? tr('antrenament propriu', 'own workout') : tr('antrenamente proprii', 'own workouts'),
    serie: n => n === 1 ? tr('săptămână la rând', 'week in a row') : tr('săptămâni la rând', 'weeks in a row'),
    obiective: n => n === 1 ? tr('obiectiv atins', 'goal reached') : tr('obiective atinse', 'goals reached')
  };
  const randuri = [];
  const insigne = Object.keys(unitati).map(tip => {
    const urm = INSIGNE.find(i => i.tip === tip && valori[tip] < i.prag);
    return urm ? { urm, rest: urm.prag - valori[tip], tip } : null;
  }).filter(Boolean).sort((x, y) => x.rest - y.rest);
  if (insigne[0]) {
    const { urm, rest, tip } = insigne[0];
    randuri.push(tr(`Încă ${rest} ${unitati[tip](rest)} până la insigna „${urm.ro}”`, `${rest} more ${unitati[tip](rest)} to the “${urm.en}” badge`));
  }
  const exercitii = (dateClienta.obiective || []).filter(o => o.tip === 'exercitiu_kg' && !o.atins_la);
  if (exercitii.length) {
    const istoric = istoricExercitii(sursaProgresClient());
    const cel = exercitii.map(o => {
      const e = istoric.find(x => x.nume.toLowerCase() === o.exercitiu.trim().toLowerCase());
      const acum = e ? Math.max(...e.puncte.map(p => p.kg)) : 0;
      return { o, rest: Number(o.tinta) - acum, acum };
    // Doar cele cu o greutate deja notată (altfel „încă 30 kg până la 30 kg” nu spune nimic)
    }).filter(x => x.acum > 0).sort((x, y) => x.rest / Number(x.o.tinta) - y.rest / Number(y.o.tinta))[0];
    if (cel && cel.rest > 0) randuri.push(tr(`${cel.o.exercitiu}: încă ${formatKg(cel.rest)} kg până la ${formatKg(Number(cel.o.tinta))} kg`, `${cel.o.exercitiu}: ${formatKg(cel.rest)} kg more to ${formatKg(Number(cel.o.tinta))} kg`));
  }
  return randuri.slice(0, 2);
}

// Cardul de pe Acasă: inelul săptămânii (sau alegerea obiectivului) și „încă puțin până la...”
function htmlSaptamanaAcasa() {
  if (!dateClienta.fisa) return '<div id="cardSaptamanaAcasa"></div>';
  const ob = obiectivSaptamana(dateClienta.obiective);
  const facute = zileActiveSaptamanaClient();
  const tinta = ob ? Number(ob.tinta) : 0;
  const serie = (dateClienta.acasa || {}).serie || 0;
  return `<div class="acasa-tila acasa-tila-inel${tinta && facute >= tinta ? ' atins' : ''}" id="cardSaptamanaAcasa" onclick="deschideObiectiveDinAcasa()" role="button">
    ${htmlInelProgres(tinta ? facute / tinta * 100 : 0, tinta ? `${Math.min(facute, 99)}/${tinta}` : String(facute), tinta && facute >= tinta)}
    <span>${tinta ? tr('zile active', 'active days') : tr('zile active · alege ținta', 'active days · set a goal')}</span>
    ${serie ? `<small class="acasa-tila-serie">🔥 ${serie} ${serie === 1 ? tr('săpt.', 'wk') : tr('săpt.', 'wks')}</small>` : ''}
  </div>`;
}

let deschideObiectiveLaIncarcare = false;
function deschideObiectiveDinAcasa() {
  deschideObiectiveLaIncarcare = true;
  clientaTab('fisa');
}

// O singură dată pe săptămână: mesaj când obiectivul săptămânii e atins
function verificaObiectivSaptamanaAtins() {
  const ob = obiectivSaptamana(dateClienta.obiective);
  if (!ob || rolUtilizator !== 'clienta' || zileActiveSaptamanaClient() < Number(ob.tinta)) return;
  const cheie = 'BFIT_CLIENT_OBSAPT_' + (utilizatorCurent ? utilizatorCurent.id : '') + '_' + lunaSaptamaniiCurente();
  try { if (localStorage.getItem(cheie)) return; localStorage.setItem(cheie, '1'); } catch (e) { return; }
  showToast(tr(`🎯 Obiectivul săptămânii e atins: ${Number(ob.tinta)} antrenamente!`, `🎯 Weekly goal reached: ${Number(ob.tinta)} workouts!`));
  if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
}

// Obiectivele la un exercițiu atinse acum: se marchează (atins_la), mesaj pe ecran și la antrenor în conversație
let verificareObiectiveInCurs = null;
function verificaObiectiveAtinse() {
  if (!verificareObiectiveInCurs) verificareObiectiveInCurs = verificaObiectiveAtinseAcum().finally(() => { verificareObiectiveInCurs = null; });
  return verificareObiectiveInCurs;
}

async function verificaObiectiveAtinseAcum() {
  if (rolUtilizator !== 'clienta') return;
  const deVerificat = (dateClienta.obiective || []).filter(o => o.tip === 'exercitiu_kg' && !o.atins_la);
  if (!deVerificat.length) return;
  await asiguraListaAntrPers();
  const istoric = istoricExercitii(sursaProgresClient());
  for (const o of deVerificat) {
    const e = istoric.find(x => x.nume.toLowerCase() === o.exercitiu.trim().toLowerCase());
    const maxKg = e ? Math.max(...e.puncte.map(p => p.kg)) : 0;
    if (maxKg < Number(o.tinta)) continue;
    const { data, error } = await supabaseClient.from('obiective').update({ atins_la: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', o.id).select().single();
    if (error || !data) continue;
    Object.assign(o, data);
    showToast(tr(`🎯 Obiectiv atins: ${o.exercitiu} ${formatKg(Number(o.tinta))} kg!`, `🎯 Goal reached: ${o.exercitiu} ${formatKg(Number(o.tinta))} kg!`));
    if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 120]);
    trimiteContextInConversatie('text', tr(`🎯 Am atins obiectivul: ${o.exercitiu} ${formatKg(Number(o.tinta))} kg`, `🎯 Goal reached: ${o.exercitiu} ${formatKg(Number(o.tinta))} kg`), { exercitiu: o.exercitiu });
  }
  salveazaCacheClienta();
}

// ---- Lista de obiective (Fișa mea / Fișă › Progres), cu adăugare, modificare și ștergere ----
// ctx: { rol: 'client' | 'antrenor', clientId, userId, lista, sursa (planuri + antrenamente), zileSapt, editare: null | 'nou' | id }
let obiectiveUI = null;

function progresObiectiv(o, ctx) {
  if (o.tip === 'antrenamente_saptamana') {
    const f = ctx.zileSapt || 0, t = Number(o.tinta);
    return { procent: Math.round(Math.min(1, f / t) * 100), text: tr(`${f} din ${t} săptămâna asta`, `${f} of ${t} this week`), atins: f >= t };
  }
  const e = istoricExercitii(ctx.sursa).find(x => x.nume.toLowerCase() === o.exercitiu.trim().toLowerCase());
  const acum = e ? Math.max(...e.puncte.map(p => p.kg)) : 0;
  const t = Number(o.tinta), atins = !!o.atins_la || acum >= t;
  let text = acum ? tr(`Acum: ${formatKg(acum)} kg`, `Now: ${formatKg(acum)} kg`) : tr('Încă nimic notat la acest exercițiu', 'Nothing logged for this exercise yet');
  if (!atins && acum) text += tr(` · mai ai ${formatKg(t - acum)} kg`, ` · ${formatKg(t - acum)} kg to go`);
  if (!atins && o.termen) {
    const sapt = Math.max(0, (new Date(o.termen + 'T12:00:00') - new Date()) / (7 * 864e5));
    text += sapt < 0.15 ? tr(' · termenul a trecut', ' · deadline passed')
      : acum ? tr(` · ~${formatKg(Math.round((t - acum) / sapt * 10) / 10)} kg/săptămână`, ` · ~${formatKg(Math.round((t - acum) / sapt * 10) / 10)} kg/week`) : '';
  }
  if (atins) text = o.atins_la ? tr(`✓ Atins pe ${formatZiLuna(new Date(o.atins_la))}`, `✓ Reached on ${formatZiLuna(new Date(o.atins_la))}`) : tr('✓ Atins', '✓ Reached');
  return { procent: Math.round(Math.min(1, acum / t) * 100), text, atins };
}

function titluObiectiv(o) {
  if (o.tip === 'antrenamente_saptamana') return Number(o.tinta) === 1 ? tr('1 antrenament pe săptămână', '1 workout per week') : tr(`${Number(o.tinta)} antrenamente pe săptămână`, `${Number(o.tinta)} workouts per week`);
  return `${o.exercitiu}: ${formatKg(Number(o.tinta))} kg${o.termen ? ` ${tr('până la', 'by')} ${formatZiLuna(new Date(o.termen + 'T12:00:00'))}` : ''}`;
}

function htmlObiective() {
  const ctx = obiectiveUI;
  if (!ctx) return '';
  const cine = o => o.creat_de === (ctx.rol === 'client' ? 'client' : 'antrenor') ? tr('setat de tine', 'set by you')
    : o.creat_de === 'antrenor' ? tr('setat de antrenor', 'set by your trainer') : tr('setat de client', 'set by the client');
  const randuri = ctx.lista.map(o => {
    if (ctx.editare === o.id) return htmlFormObiectiv(o);
    const p = progresObiectiv(o, ctx);
    return `<div class="obiectiv-progres obiectiv-card${p.atins ? ' atins' : ''}">
      <div class="obiectiv-sus"><span><b>${escAttr(titluObiectiv(o))}</b> <small class="obiectiv-cine">${cine(o)}</small></span><b>${p.procent}%</b></div>
      <div class="progress-wrapper"><div class="progress-fill" style="width:${p.procent}%"></div></div>
      <div class="obiectiv-detalii">${escAttr(p.text)}</div>
      <div class="obiectiv-actiuni">
        <button type="button" class="btn btn-clear" onclick="editeazaObiectiv('${o.id}')">${tr('Modifică', 'Edit')}</button>
        <button type="button" class="btn btn-clear antr-pers-sterge" onclick="stergeObiectiv('${o.id}')">${tr('Șterge', 'Delete')}</button>
      </div>
    </div>`;
  }).join('');
  const gol = ctx.lista.length ? '' : `<div class="progres-gol">${ctx.rol === 'client'
    ? tr('Setează-ți un obiectiv: câte antrenamente pe săptămână sau o greutate de atins la un exercițiu.', 'Set a goal: workouts per week or a weight to reach on an exercise.')
    : tr('Clientul nu are încă obiective. Poți seta tu unul.', 'The client has no goals yet. You can set one.')}</div>`;
  return gol + randuri + (ctx.editare === 'nou' ? htmlFormObiectiv(null)
    : `<button type="button" class="btn btn-clear obiectiv-adauga" onclick="editeazaObiectiv('nou')">${tr('+ Obiectiv', '+ Goal')}</button>`);
}

function htmlFormObiectiv(o) {
  const ctx = obiectiveUI;
  const areSapt = ctx.lista.some(x => x.tip === 'antrenamente_saptamana' && (!o || x.id !== o.id));
  const tip = o ? o.tip : (ctx.tipNou || (areSapt ? 'exercitiu_kg' : 'antrenamente_saptamana'));
  // Întâi exercițiile pe care clientul le-a făcut deja (au progres), apoi restul celor cunoscute
  const nume = [...new Set(istoricExercitii(ctx.sursa).map(x => x.nume).concat([...exercitiiCunoscuteAntrPers().values()].map(x => x.exercitiu)))];
  const sugestii = nume.map(n => `<option value="${escAttr(n)}"></option>`).join('');
  const tipuri = o ? '' : `<div class="antr-pers-activitati">
      ${areSapt ? '' : `<button type="button" class="antr-pers-activitate${tip === 'antrenamente_saptamana' ? ' activ' : ''}" onclick="alegeTipObiectiv('antrenamente_saptamana')">${tr('Antrenamente pe săptămână', 'Workouts per week')}</button>`}
      <button type="button" class="antr-pers-activitate${tip === 'exercitiu_kg' ? ' activ' : ''}" onclick="alegeTipObiectiv('exercitiu_kg')">${tr('Greutate la un exercițiu', 'Weight on an exercise')}</button>
    </div>`;
  const campuri = tip === 'antrenamente_saptamana'
    ? `<div class="antr-pers-campuri"><label>${tr('Câte pe săptămână (1–7)', 'How many per week (1–7)')}<input type="number" inputmode="numeric" min="1" max="7" id="obiectivTinta" class="plan-ex-input" value="${o ? Number(o.tinta) : 3}"></label></div>`
    : `<div class="antr-pers-campuri"><label>${tr('Exercițiu', 'Exercise')}<input type="text" id="obiectivExercitiu" class="plan-ex-input" maxlength="80" list="listaExercitiiObiectiv" value="${escAttr(o ? o.exercitiu : '')}" placeholder="${tr('Ex: Hip thrust', 'E.g. Hip thrust')}"></label>
        <datalist id="listaExercitiiObiectiv">${sugestii}</datalist></div>
      <div class="antr-pers-campuri"><label>${tr('Greutate țintă (kg)', 'Target weight (kg)')}<input type="text" inputmode="decimal" id="obiectivTinta" class="plan-ex-input" maxlength="6" value="${o ? formatKg(Number(o.tinta)) : ''}"></label>
        <label>${tr('Termen (opțional)', 'Deadline (optional)')}<input type="date" id="obiectivTermen" class="plan-ex-input" value="${escAttr(o && o.termen ? o.termen : '')}"></label></div>`;
  return `<div class="card obiectiv-form" data-tip="${tip}">${tipuri}${campuri}
    <div class="antr-pers-actiuni">
      <button type="button" class="btn" onclick="salveazaObiectivUI('${o ? o.id : ''}')">${tr('Salvează', 'Save')}</button>
      <button type="button" class="btn btn-clear" onclick="editeazaObiectiv(null)">${tr('Renunță', 'Cancel')}</button>
    </div>
  </div>`;
}

function randeazaObiective() {
  const el = document.getElementById('obiectiveContinut');
  if (el && obiectiveUI) el.innerHTML = htmlObiective();
}

function editeazaObiectiv(id) {
  if (!obiectiveUI) return;
  obiectiveUI.editare = id;
  obiectiveUI.tipNou = null;
  randeazaObiective();
}

function alegeTipObiectiv(tip) {
  if (!obiectiveUI) return;
  obiectiveUI.tipNou = tip;
  randeazaObiective();
}

async function salveazaObiectivUI(id) {
  const ctx = obiectiveUI;
  const form = document.querySelector('#obiectiveContinut .obiectiv-form');
  if (!ctx || !form) return;
  const tip = form.dataset.tip;
  const tinta = parseFloat(String(document.getElementById('obiectivTinta').value).replace(',', '.'));
  const rand = { tip, tinta, updated_at: new Date().toISOString() };
  if (tip === 'antrenamente_saptamana') {
    if (!(tinta >= 1 && tinta <= 7)) return showToast(tr('Alege între 1 și 7 antrenamente pe săptămână.', 'Pick between 1 and 7 workouts per week.'), 'error');
    rand.tinta = Math.round(tinta);
  } else {
    rand.exercitiu = (document.getElementById('obiectivExercitiu').value || '').trim().slice(0, 80);
    rand.termen = document.getElementById('obiectivTermen').value || null;
    if (!rand.exercitiu) return showToast(tr('Alege exercițiul.', 'Choose the exercise.'), 'error');
    if (!(tinta > 0 && tinta <= 1000)) return showToast(tr('Scrie greutatea țintă în kg.', 'Enter the target weight in kg.'), 'error');
    rand.tinta = Math.round(tinta * 10) / 10;
    // Ținta schimbată: obiectivul se poate atinge din nou
    const vechi = id && ctx.lista.find(x => x.id === id);
    if (vechi && (Number(vechi.tinta) !== rand.tinta || vechi.exercitiu !== rand.exercitiu)) rand.atins_la = null;
  }
  const q = id ? supabaseClient.from('obiective').update(rand).eq('id', id)
    : supabaseClient.from('obiective').insert(Object.assign(rand, { user_id: ctx.userId, client_id: ctx.clientId, creat_de: ctx.rol }));
  const { data, error } = await q.select().single();
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  ctx.lista = ctx.lista.filter(x => x.id !== data.id).concat(data);
  ctx.editare = null;
  dupaSchimbareObiective();
  showToast(tr('✓ Obiectiv salvat', '✓ Goal saved'));
}

function stergeObiectiv(id) {
  customConfirm(tr('Ștergi obiectivul?', 'Delete the goal?'), tr('Obiectivul dispare și pentru client, și pentru antrenor.', 'The goal disappears for both client and trainer.'), async () => {
    const { error } = await supabaseClient.from('obiective').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    obiectiveUI.lista = obiectiveUI.lista.filter(x => x.id !== id);
    dupaSchimbareObiective();
  });
}

function dupaSchimbareObiective() {
  if (obiectiveUI.rol === 'client') {
    dateClienta.obiective = obiectiveUI.lista;
    salveazaCacheClienta();
    verificaObiectiveAtinse().then(randeazaObiective);
  }
  randeazaObiective();
}

// Zilele active ale clientului săptămâna asta, la antrenor: prezențele din DB, zilele bifate din planuri, antrenamentele proprii vizibile
function zileActiveSaptamanaAntrenor(client, planuri, antrenamente) {
  const luni = lunaSaptamanii(new Date());
  const zile = new Set();
  (DB.prezente || []).filter(p => (p.client_id && p.client_id === client.id) || (!p.client_id && randulClientei(p, client, p.clienta))).forEach(p => {
    const [z, l, a] = String(p.data || '').split('.').map(Number);
    const d = a ? new Date(a, l - 1, z) : null;
    if (d && lunaSaptamanii(d) === luni) zile.add(cheieZiClienta(d));
  });
  (planuri || []).forEach(p => (p.continut_json?.sesiuni || []).concat(...(p.continut_json?.istoric_saptamani || []).map(w => w.sesiuni || [])).forEach(s => {
    const d = dataDinIso(s.data_client);
    if (d && lunaSaptamanii(d) === luni) zile.add(cheieZiClienta(d));
  }));
  (antrenamente || []).forEach(x => { const d = dataDinIso(x.data); if (d && lunaSaptamanii(d) === luni) zile.add(cheieZiClienta(d)); });
  return zile.size;
}

// ---- Nutriție: jurnalul alimentar al clientului (sql/2026-11-05_nutritie.sql) ----
// Produsele vin din baza noastră (alimente, adăugate de clienți și văzute de toți) sau din Open Food Facts (gratuit, fără cheie).
// Ecranele folosesc antrPers.ecran ('nutritie', 'nutritie-adauga', 'nutritie-cantitate', 'nutritie-produs'), ca re-randările
// automate de pe Acasă să nu le acopere (aceleași verificări ca la antrenamentele proprii).
const URL_OFF = 'https://world.openfoodfacts.org';
const MESE_NUTRITIE = [
  ['mic_dejun', 'Mic dejun', 'Breakfast'], ['pranz', 'Prânz', 'Lunch'], ['cina', 'Cină', 'Dinner'], ['gustare', 'Gustări', 'Snacks']
];
let nutritie = { zi: null, lista: [], setari: null, azi: null, masa: 'pranz', produs: null, rezultate: [], cautare: '', recente: [] };

function rotunjeste1(n) { return Math.round((Number(n) || 0) * 10) / 10; }

// Totalurile unei liste de rânduri din jurnal
function totaluriNutritie(lista) {
  return (lista || []).reduce((t, x) => ({ kcal: t.kcal + Number(x.kcal || 0), proteine: t.proteine + Number(x.proteine || 0),
    carbo: t.carbo + Number(x.carbo || 0), grasimi: t.grasimi + Number(x.grasimi || 0) }), { kcal: 0, proteine: 0, carbo: 0, grasimi: 0 });
}

// Totalurile de azi pentru cardul de pe Acasă; null = nimic notat azi
function totaluriAzi(lista) {
  return lista && lista.length ? totaluriNutritie(lista) : null;
}

async function incarcaNutritieZi(zi) {
  if (!supabaseClient || !dateClienta.fisa) return;
  const [resJ, resS, resA] = await Promise.all([
    supabaseClient.from('jurnal_alimente').select('*').eq('client_id', dateClienta.fisa.id).eq('data', zi).order('created_at'),
    supabaseClient.from('setari_nutritie').select('*').eq('client_id', dateClienta.fisa.id).maybeSingle(),
    supabaseClient.from('apa_zilnica').select('pahare').eq('client_id', dateClienta.fisa.id).eq('data', zi).maybeSingle()
  ]);
  // Apa: null = fără tabel (SQL nerulat) sau fără rețea; atunci cardul nu apare
  if (!resA.error) { nutritie.apa = nutritie.apa || {}; nutritie.apa[zi] = resA.data ? resA.data.pahare : 0; }
  if (!resJ.error) {
    if (zi === aziIsoAntrPers()) nutritie.azi = totaluriAzi(resJ.data);
    // Reîncărcarea de pe Acasă (azi) nu înlocuiește altă zi deschisă în ecranul de nutriție
    if (!String(antrPers.ecran).startsWith('nutritie') || !nutritie.zi || nutritie.zi === zi) { nutritie.zi = zi; nutritie.lista = resJ.data || []; }
  }
  if (!resS.error) nutritie.setari = resS.data || null;
}

// Acasă: totalul de azi față de ținta de calorii
function htmlNutritieAcasa() {
  const t = nutritie.azi, s = nutritie.setari;
  const tinta = s && s.kcal ? Number(s.kcal) : 0;
  const kcal = t ? Math.round(t.kcal) : 0;
  const procent = tinta ? Math.min(100, Math.round(kcal / tinta * 100)) : 0;
  return `<div class="acasa-tila" id="cardNutritieAcasa" onclick="deschideNutritie()" role="button">
    <b>${kcal}${tinta ? `<small>/${tinta}</small>` : ''}</b><span>${tr('kcal azi', 'kcal today')}</span>
    ${tinta ? `<div class="progress-wrapper nutritie-bara-mica"><div class="progress-fill" style="width:${procent}%"></div></div>` : ''}
  </div>`;
}

// ---- Apă: pahare de 250 ml pe zi, ținta din setari_nutritie.apa_tinta (implicit 8) ----
function tintaApa() {
  return (nutritie.setari && nutritie.setari.apa_tinta) || 8;
}

async function adaugaPahar(delta, zi) {
  const c = dateClienta.fisa;
  zi = zi || aziIsoAntrPers();
  if (!c || !nutritie.apa || nutritie.apa[zi] === undefined) return;
  const nou = Math.max(0, Math.min(40, nutritie.apa[zi] + delta));
  const vechi = nutritie.apa[zi];
  nutritie.apa[zi] = nou;
  redeseneazaApa();
  const { error } = await supabaseClient.from('apa_zilnica').upsert({ client_id: c.id, user_id: c.user_id, data: zi, pahare: nou, updated_at: new Date().toISOString() }, { onConflict: 'client_id,data' });
  if (error) { nutritie.apa[zi] = vechi; redeseneazaApa(); showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error'); }
  else if (navigator.vibrate) navigator.vibrate(15);
}

function redeseneazaApa() {
  const tila = document.getElementById('cardApaAcasa');
  if (tila) tila.outerHTML = htmlApaAcasa();
  const zi = document.getElementById('nutritieApa');
  if (zi) zi.outerHTML = htmlApaZi();
}

// Pe Acasă: o plăcuță cu „+”; fără tabel (SQL nerulat) nu apare
function htmlApaAcasa() {
  const azi = aziIsoAntrPers();
  if (!nutritie.apa || nutritie.apa[azi] === undefined) return '<div id="cardApaAcasa"></div>';
  const p = nutritie.apa[azi], t = tintaApa();
  return `<div class="acasa-tila${p >= t ? ' atins' : ''}" id="cardApaAcasa" onclick="deschideNutritie()" role="button">
    <b>${p}<small>/${t}</small></b><span>${tr('pahare de apă', 'glasses of water')}</span>
    <button type="button" class="acasa-tila-plus" onclick="event.stopPropagation(); adaugaPahar(1)" aria-label="${tr('Un pahar de apă', 'One glass of water')}">+</button>
  </div>`;
}

// În ziua din Nutriție: paharele ca bife, cu − și +
function htmlApaZi() {
  const zi = nutritie.zi || aziIsoAntrPers();
  if (!nutritie.apa || nutritie.apa[zi] === undefined) return '<div id="nutritieApa"></div>';
  const p = nutritie.apa[zi], t = tintaApa();
  const pahare = Array.from({ length: Math.max(t, p) }, (_, i) => `<span class="apa-pahar${i < p ? ' plin' : ''}"></span>`).join('');
  return `<div class="card nutritie-apa" id="nutritieApa">
    <div class="nutritie-masa-sus"><b>${tr('Apă', 'Water')}</b><span>${p} ${tr('din', 'of')} ${t} ${tr('pahare', 'glasses')} · ${formatKg(p * 0.25)} l</span></div>
    <div class="apa-rand">
      <button type="button" class="apa-btn" onclick="adaugaPahar(-1, '${zi}')" aria-label="${tr('Un pahar mai puțin', 'One glass less')}">−</button>
      <div class="apa-pahare">${pahare}</div>
      <button type="button" class="apa-btn plus" onclick="adaugaPahar(1, '${zi}')" aria-label="${tr('Un pahar de apă', 'One glass of water')}">+</button>
    </div>
  </div>`;
}

// Masa probabilă după oră (la „+ Adaugă” de pe Acasă)
function masaImplicita() {
  const h = new Date().getHours();
  return h < 11 ? 'mic_dejun' : h < 16 ? 'pranz' : h < 21 ? 'cina' : 'gustare';
}

async function deschideNutritie(zi) {
  // Din Acasă (sau altundeva): întâi tab-ul Nutriție, care cheamă din nou funcția
  if (clientaTabCurent !== 'nutritie') { nutritie.ziCeruta = zi || null; return clientaTab('nutritie'); }
  zi = zi || nutritie.ziCeruta;
  nutritie.ziCeruta = null;
  antrPers.ecran = 'nutritie';
  dateClienta.planCurent = null;
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  document.getElementById('clientaTitlu').innerText = tr('Nutriție', 'Nutrition');
  const z = zi || nutritie.zi || aziIsoAntrPers();
  if (nutritie.zi !== z) document.getElementById('clientaContinut').innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  else randeazaNutritieZi();
  const [, , adaptiv] = await Promise.all([incarcaNutritieZi(z), nutritie.salvate === undefined ? incarcaSalvateNutritie() : null, incarcaDateAdaptive(dateClienta.fisa.id)]);
  nutritie.adaptiv = adaptiv;
  if (antrPers.ecran === 'nutritie') randeazaNutritieZi();
}

function schimbaZiNutritie(directie) {
  const d = dataDinIso(nutritie.zi || aziIsoAntrPers());
  d.setDate(d.getDate() + directie);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (iso > aziIsoAntrPers()) return;
  nutritie.zi = null;
  deschideNutritie(iso);
}

function htmlBaraNutritie(eticheta, valoare, tinta, unitate) {
  const procent = tinta ? Math.min(100, Math.round(valoare / tinta * 100)) : 0;
  const peste = tinta && valoare > tinta * 1.05;
  return `<div class="nutritie-bara${peste ? ' peste' : ''}">
    <div class="obiectiv-sus"><span>${eticheta}</span><b>${Math.round(valoare)}${tinta ? ` / ${tinta}` : ''} ${unitate}</b></div>
    ${tinta ? `<div class="progress-wrapper"><div class="progress-fill" style="width:${procent}%"></div></div>` : ''}
  </div>`;
}

function randeazaNutritieZi() {
  const t = totaluriNutritie(nutritie.lista), s = nutritie.setari || {};
  const esteAzi = nutritie.zi === aziIsoAntrPers();
  let html = `<div class="nutritie-zi-nav">
      <button type="button" class="cal-nav" onclick="schimbaZiNutritie(-1)" aria-label="${tr('Ziua anterioară', 'Previous day')}"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
      <b>${esteAzi ? tr('Azi', 'Today') : escAttr(etichetaDataAntrPers(nutritie.zi))}</b>
      <button type="button" class="cal-nav" onclick="schimbaZiNutritie(1)" ${esteAzi ? 'disabled' : ''} aria-label="${tr('Ziua următoare', 'Next day')}"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
    </div>
    <div class="acasa-scurtaturi nutritie-scurtaturi">
      <button type="button" class="acasa-scurtatura" onclick="copiazaZiuaDeIeri()"><span><svg viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/></svg></span>${tr('Copiază ieri', 'Copy yesterday')}</button>
      <button type="button" class="acasa-scurtatura" onclick="deschideAdaugaRapid(masaImplicita())"><span><svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></span>${tr('Adaugă rapid', 'Quick add')}</button>
      <button type="button" class="acasa-scurtatura" onclick="deschideRetete()"><span><svg viewBox="0 0 24 24"><path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/></svg></span>${tr('Rețete', 'Recipes')}</button>
      <button type="button" class="acasa-scurtatura" onclick="deschideRapoarte()"><span><svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M21 17V4"/></svg></span>${tr('Rapoarte', 'Reports')}</button>
    </div>
    <div class="card nutritie-totaluri">
      <div class="nutritie-ramase">${s.kcal
        ? `<b>${Math.round(Math.abs(s.kcal - t.kcal))}</b><span>${t.kcal > s.kcal ? tr('kcal peste țintă', 'kcal over target') : tr('kcal rămase', 'kcal left')} · ${Math.round(t.kcal)} ${tr('din', 'of')} ${s.kcal}</span>`
        : `<b>${Math.round(t.kcal)}</b><span>${tr('kcal azi · fără țintă (o setezi mai jos)', 'kcal today · no target (set it below)')}</span>`}</div>
      ${htmlBaraNutritie(tr('Proteine', 'Protein'), t.proteine, s.proteine, 'g')}
      ${htmlBaraNutritie(tr('Carbohidrați', 'Carbohydrates'), t.carbo, s.carbo, 'g')}
      ${htmlBaraNutritie(tr('Grăsimi', 'Fat'), t.grasimi, s.grasimi, 'g')}
    </div>`;
  // Mesele într-un singur card: fiecare cu „+” pe rândul ei, alimentele dedesubt
  html += '<div class="card nutritie-mese">';
  MESE_NUTRITIE.forEach(([cod, ro, en]) => {
    const randuri = nutritie.lista.filter(x => x.masa === cod);
    const tm = totaluriNutritie(randuri);
    html += `<div class="nutritie-masa">
      <div class="nutritie-masa-sus"><b>${tr(ro, en)}</b><span>${randuri.length ? `${Math.round(tm.kcal)} kcal` : tr('Nimic notat', 'Nothing logged')}</span>
        <button type="button" class="nutritie-masa-plus" onclick="deschideAdaugaAliment('${cod}')" aria-label="${tr(`Adaugă la ${ro.toLowerCase()}`, `Add to ${en.toLowerCase()}`)}">+</button></div>
      ${randuri.map(x => `<div class="nutritie-rand">
        ${htmlImagineProdus(x.imagine, 'mica')}
        <div class="nutritie-rand-text"><div class="nutritie-rand-nume">${escAttr(x.nume)}${x.marca ? ` <small>${escAttr(x.marca)}</small>` : ''}</div>
        <div class="acasa-antrenament-detalii">${Number(x.cantitate_g) === 1 ? `⚡ ${tr('rapid', 'quick')}` : `${formatKg(Number(x.cantitate_g))} g`} · <b>${Math.round(x.kcal)} kcal</b> · ${tr('Proteine', 'Protein')} ${formatKg(rotunjeste1(x.proteine))} g</div></div>
        <button type="button" class="notificare-x nutritie-sterge" onclick="stergeAliment('${x.id}')" aria-label="${tr('Șterge', 'Delete')}">×</button>
      </div>`).join('')}
      ${randuri.length && nutritie.salvate ? `<button type="button" class="nutritie-salveaza-masa" onclick="salveazaMasa('${cod}')">☆ ${tr('Salvează masa', 'Save meal')}</button>` : ''}
    </div>`;
  });
  html += '</div>' + htmlApaZi() + htmlAdaptiv(nutritie.adaptiv, s, ((dateClienta.fisa || {}).fisa_inscriere || {}).inaltime, false);
  const deAntrenor = s.tinte_setate_de === 'antrenor';
  html += `<div class="antr-pers-sectiune">${tr('Ținte zilnice', 'Daily targets')}</div>
    <div class="card">
      ${deAntrenor ? `<div class="acasa-antrenament-detalii" style="margin-bottom:8px;">${tr('Setate de antrenorul tău.', 'Set by your trainer.')}</div>` : ''}
      <div class="antr-pers-campuri nutritie-tinte">
        ${[['kcal', tr('Calorii (kcal)', 'Calories (kcal)')], ['proteine', tr('Proteine (g)', 'Protein (g)')], ['carbo', tr('Carbohidrați (g)', 'Carbohydrates (g)')], ['grasimi', tr('Grăsimi (g)', 'Fat (g)')]].map(([k, et]) =>
          `<label>${et}<input type="number" inputmode="numeric" id="tintaNut_${k}" class="plan-ex-input" value="${s[k] ?? ''}" ${deAntrenor ? 'disabled' : ''}></label>`).join('')}
      </div>
      ${deAntrenor ? '' : `<div class="nutritie-tinte-butoane">
        <button type="button" class="btn btn-clear" onclick="salveazaTinteNutritie()">${tr('Salvează țintele', 'Save targets')}</button>
        <button type="button" class="btn" onclick="deschideCalculatorTinte()">${tr('Calculează-mi țintele', 'Calculate my targets')}</button>
      </div>`}
      ${nutritie.apa ? `<div class="antr-pers-campuri nutritie-tinte" style="margin-top:8px;"><label>${tr('Apă (pahare de 250 ml)', 'Water (250 ml glasses)')}<input type="number" inputmode="numeric" id="tintaNut_apa" class="plan-ex-input" min="1" max="30" value="${s.apa_tinta ?? ''}" placeholder="8" onchange="salveazaTintaApa(this)"></label></div>` : ''}
      <label class="setare-notificare" style="margin-top:6px;">
        <span><b>${tr('Vizibil antrenorului', 'Visible to my trainer')}</b><small>${tr('Antrenorul vede ce mănânci și totalurile pe zi.', 'Your trainer sees what you eat and the daily totals.')}</small></span>
        <input type="checkbox" class="comutator" ${s.vizibil_antrenor === false ? '' : 'checked'} onchange="seteazaVizibilNutritie(this.checked, this)">
      </label>
    </div>
    <div class="nutritie-sursa">${tr('Datele despre produse: alimentele de bază din USDA FoodData Central, Open Food Facts (open data) și produsele adăugate de clienții B-Fit.', 'Product data: basic foods from USDA FoodData Central, Open Food Facts (open data) and products added by B-Fit clients.')}</div>`;
  document.getElementById('clientaTitlu').innerText = tr('Nutriție', 'Nutrition');
  document.getElementById('clientaContinut').innerHTML = html;
}

// ---- Rapoarte (Nutriție › 📊 Rapoarte): ultimele 7 sau 30 de zile, cu export CSV ----
// Rapoartele pe 7 / 30 de zile: clientul (Nutriție › Rapoarte) sau antrenorul (Fișă › Progres › Nutriție); unde = 'client' | 'antrenor'
let raport = { zile: 7, jurnal: null, apa: null, setari: null, adaptiv: null, nume: '', unde: 'client' };

async function deschideRapoarte() {
  antrPers.ecran = 'nutritie-rapoarte';
  arataInapoiAntrPers();
  document.getElementById('clientaTitlu').innerText = tr('Rapoarte', 'Reports');
  document.getElementById('clientaContinut').innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  const de = isoDinData(new Date(Date.now() - 30 * 86400000));
  const [resJ, resA] = await Promise.all([
    supabaseClient.from('jurnal_alimente').select('*').eq('client_id', dateClienta.fisa.id).gte('data', de).order('data').order('created_at'),
    supabaseClient.from('apa_zilnica').select('data, pahare').eq('client_id', dateClienta.fisa.id).gte('data', de)
  ]);
  if (!nutritie.adaptiv) nutritie.adaptiv = await incarcaDateAdaptive(dateClienta.fisa.id);
  Object.assign(raport, { jurnal: resJ.error ? null : (resJ.data || []), apa: resA.error ? null : (resA.data || []),
    setari: nutritie.setari, adaptiv: nutritie.adaptiv, nume: dateClienta.fisa.nume || '', unde: 'client' });
  if (antrPers.ecran === 'nutritie-rapoarte') randeazaRapoarte();
}

// Ultimele n zile (fără azi, care nu e încheiată... dar o arătăm ca „în curs”), cu totalurile fiecărei zile
function zileRaport(n) {
  const azi = aziIsoAntrPers(), out = [];
  for (let k = n - 1; k >= 0; k--) {
    const data = isoDinData(new Date(Date.now() - k * 86400000));
    const randuri = (raport.jurnal || []).filter(x => x.data === data);
    out.push({ data, azi: data === azi, notat: randuri.length > 0, t: totaluriNutritie(randuri), apa: ((raport.apa || []).find(x => x.data === data) || {}).pahare || 0 });
  }
  return out;
}

function randeazaRapoarte() {
  const el = document.getElementById(raport.unde === 'antrenor' ? 'raportNutritieFisa' : 'clientaContinut');
  if (el) el.innerHTML = htmlRapoarte();
}

function htmlRapoarte() {
  if (raport.jurnal === null) return `<div class="progres-gol">${tr('Rapoartele nu sunt disponibile acum. Verifică internetul.', 'Reports are not available right now. Check your internet.')}</div>`;
  const s = raport.setari || {};
  const zile = zileRaport(raport.zile);
  // Media: doar zilele încheiate și notate (azi e încă în curs)
  const complete = zile.filter(z => z.notat && !z.azi);
  const medie = k => complete.length ? complete.reduce((t, z) => t + z.t[k], 0) / complete.length : 0;
  const tinta = Number(s.kcal) || 0;
  const inTinta = tinta ? complete.filter(z => Math.abs(z.t.kcal - tinta) <= tinta * 0.1).length : 0;
  const apaMedie = zile.filter(z => !z.azi).reduce((t, z) => t + z.apa, 0) / Math.max(1, zile.filter(z => !z.azi).length);
  // Bare pe zile, cu linia țintei
  const max = Math.max(tinta * 1.2, ...zile.map(z => z.t.kcal), 1000);
  const W = 300, H = 110, lat = W / zile.length;
  const bare = zile.map((z, i) => {
    const h = z.t.kcal / max * (H - 18);
    const cls = !z.notat ? 'gol' : !tinta ? '' : z.t.kcal > tinta * 1.1 ? 'peste' : z.t.kcal < tinta * 0.9 ? 'sub' : 'in';
    return `<rect class="rb ${cls}" x="${(i * lat + lat * 0.15).toFixed(1)}" y="${(H - 14 - h).toFixed(1)}" width="${(lat * 0.7).toFixed(1)}" height="${Math.max(z.notat ? 2 : 0, h).toFixed(1)}" rx="2"/>`;
  }).join('');
  const linieTinta = tinta ? `<line class="rl" x1="0" x2="${W}" y1="${(H - 14 - tinta / max * (H - 18)).toFixed(1)}" y2="${(H - 14 - tinta / max * (H - 18)).toFixed(1)}"/>` : '';
  const etichete = raport.zile === 7 ? zile.map((z, i) => `<text class="rt" x="${(i * lat + lat / 2).toFixed(1)}" y="${H - 2}" text-anchor="middle">${escAttr(etichetaDataAntrPers(z.data).slice(0, 2))}</text>`).join('') : '';
  // Din ce vin caloriile, în medie
  const kp = medie('proteine') * 4, kc = medie('carbo') * 4, kg = medie('grasimi') * 9, kt = kp + kc + kg || 1;
  const rez = calculeazaAdaptiv(raport.adaptiv);
  const placa = (val, et) => `<div class="acasa-tila"><b>${val}</b><span>${et}</span></div>`;
  return `<div class="comunitate-taburi comunitate-perioade">${[7, 30].map(n => `<button type="button" class="theme-option-btn${raport.zile === n ? ' active' : ''}" onclick="raport.zile = ${n}; randeazaRapoarte()">${n === 7 ? tr('Ultimele 7 zile', 'Last 7 days') : tr('Ultimele 30 de zile', 'Last 30 days')}</button>`).join('')}</div>
    <div class="acasa-tile">
      ${placa(complete.length ? Math.round(medie('kcal')) : '–', tinta ? tr(`kcal/zi (țintă ${tinta})`, `kcal/day (target ${tinta})`) : tr('kcal pe zi, în medie', 'kcal a day, average'))}
      ${placa(tinta ? (complete.length ? `${inTinta}<small> ${tr('din', 'of')} ${complete.length}</small>` : '–') : `${zile.filter(z => z.notat).length}<small> ${tr('din', 'of')} ${zile.length}</small>`, tinta ? tr('zile în țintă (±10%)', 'days on target (±10%)') : tr('zile notate', 'days logged'))}
      ${placa(complete.length ? `${Math.round(medie('proteine'))}<small> g</small>` : '–', s.proteine ? tr(`proteine/zi (țintă ${s.proteine})`, `protein/day (target ${s.proteine})`) : tr('proteine pe zi', 'protein a day'))}
    </div>
    <div class="card">
      <div class="nutritie-masa-sus"><b>${tr('Calorii pe zi', 'Calories per day')}</b>${tinta ? `<span>${tr('linia = ținta', 'line = target')}</span>` : ''}</div>
      <svg class="grafic-raport" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${bare}${linieTinta}${etichete}</svg>
      ${tinta ? `<div class="adaptiv-legenda"><span class="rl-l in"></span>${tr('în țintă', 'on target')} <span class="rl-l sub"></span>${tr('sub', 'under')} <span class="rl-l peste"></span>${tr('peste', 'over')}</div>` : ''}
    </div>
    ${complete.length ? `<div class="card">
      <b>${tr('Din ce vin caloriile', 'Where the calories come from')}</b>
      <div class="raport-macro"><i class="proteine" style="width:${Math.round(kp / kt * 100)}%"></i><i class="carbo" style="width:${Math.round(kc / kt * 100)}%"></i><i class="grasimi" style="width:${Math.round(kg / kt * 100)}%"></i></div>
      <div class="acasa-antrenament-detalii">${tr('Proteine', 'Protein')} ${Math.round(kp / kt * 100)}% · ${tr('Carbohidrați', 'Carbohydrates')} ${Math.round(kc / kt * 100)}% · ${tr('Grăsimi', 'Fat')} ${Math.round(kg / kt * 100)}%</div>
      <div class="acasa-antrenament-detalii">${tr('În medie', 'Average')}: ${Math.round(medie('proteine'))} g · ${Math.round(medie('carbo'))} g · ${Math.round(medie('grasimi'))} g</div>
    </div>` : ''}
    <div class="card raport-rand">
      <div><b>${tr('Apă', 'Water')}</b><div class="acasa-antrenament-detalii">${tr('pahare pe zi, în medie', 'glasses a day, average')}</div></div><b>${formatKg(Math.round(apaMedie * 10) / 10)}</b>
    </div>
    ${rez && rez.ritmSapt !== null ? `<div class="card raport-rand">
      <div><b>${tr('Greutatea', 'Weight')}</b><div class="acasa-antrenament-detalii">${tr('tendința', 'trend')} ${formatKg(Math.round(rez.tendinta * 10) / 10)} kg</div></div><b>${escAttr(textRitm(rez.ritmSapt))}</b>
    </div>` : ''}
    <div class="nutritie-adauga-jos">
      <button type="button" class="btn btn-clear" id="btnJurnalPdf" onclick="exportaJurnalPdf()">⬇ ${tr('Descarcă jurnalul', 'Download the log')}</button>
    </div>
    <div class="nutritie-sursa">${raport.unde === 'antrenor' ? tr('Mediile folosesc doar zilele încheiate în care clientul a notat ceva.', 'Averages only use finished days the client logged something.')
      : tr('Mediile folosesc doar zilele încheiate în care ai notat ceva.', 'Averages only use finished days with something logged.')}</div>`;
}

// Jurnalul alimentar pe perioada raportului (7 / 30 de zile), ca PDF: fiecare zi cu totalurile ei și alimentele pe mese
async function exportaJurnalPdf() {
  const btn = document.getElementById('btnJurnalPdf');
  if (btn) btn.disabled = true;
  showToast(t('toastPdfGenerating'));
  try {
    await incarcaPdfMake();
    const paleta = PALETE_ACCENT.includes(localStorage.getItem('beatrix_accent')) ? localStorage.getItem('beatrix_accent') : 'blue';
    const culoare = CULORI_PDF[paleta];
    const logo = await imagineDataUrl(`icon-${paleta}.png`).catch(() => null);
    const gri = '#64748b';
    const de = isoDinData(new Date(Date.now() - (raport.zile - 1) * 86400000)), pana = aziIsoAntrPers();
    const randuri = (raport.jurnal || []).filter(x => x.data >= de);
    const s = raport.setari || {};
    const masa = cod => { const m = MESE_NUTRITIE.find(x => x[0] === cod); return m ? tr(m[1], m[2]) : cod; };
    const ordineMasa = cod => MESE_NUTRITIE.findIndex(x => x[0] === cod);
    const g = v => formatKg(rotunjeste1(Number(v || 0)));
    const nume = (raport.nume || '').trim();
    const continut = [{
      columns: [
        logo ? { image: logo, width: 34 } : { text: '', width: 0 },
        { stack: [{ text: tr('Jurnal alimentar', 'Food log'), bold: true, color: culoare, fontSize: 18 },
          { text: [nume, `${etichetaDataAntrPers(de)} – ${etichetaDataAntrPers(pana)}`].filter(Boolean).join(' · '), color: gri, fontSize: 8.5 }], margin: [8, 0, 0, 0] },
        { text: s.kcal ? tr(`Ținta: ${s.kcal} kcal`, `Target: ${s.kcal} kcal`) : '', color: gri, fontSize: 8.5, alignment: 'right', margin: [0, 6, 0, 0] }
      ],
      margin: [0, 0, 0, 6]
    }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.2, lineColor: culoare }], margin: [0, 0, 0, 4] }];
    const zile = [...new Set(randuri.map(x => x.data))].sort().reverse();
    if (!zile.length) continut.push({ text: tr('Nimic notat în această perioadă.', 'Nothing logged in this period.'), color: gri, italics: true, margin: [0, 10, 0, 0] });
    zile.forEach(zi => {
      const ale = randuri.filter(x => x.data === zi).sort((a, b) => ordineMasa(a.masa) - ordineMasa(b.masa));
      const t = totaluriNutritie(ale);
      continut.push({ columns: [{ text: etichetaDataAntrPers(zi), style: 'h2' },
        { text: `${Math.round(t.kcal)} kcal · P ${g(t.proteine)} · C ${g(t.carbo)} · G ${g(t.grasimi)}`, alignment: 'right', color: gri, fontSize: 8.5, margin: [0, 16, 0, 0] }] });
      continut.push({
        table: { headerRows: 1, dontBreakRows: true, widths: [62, '*', 40, 40, 34, 34, 34],
          body: [[tr('Masa', 'Meal'), tr('Aliment', 'Food'), 'g', 'kcal', 'P', 'C', 'G'].map(c => ({ text: c, bold: true, color: '#ffffff' })),
            ...ale.map(x => [masa(x.masa), x.marca ? `${x.nume} · ${x.marca}` : x.nume, Number(x.cantitate_g) === 1 ? '-' : formatKg(Number(x.cantitate_g)),
              String(Math.round(x.kcal)), g(x.proteine), g(x.carbo), g(x.grasimi)])] },
        layout: {
          fillColor: i => i === 0 ? culoare : (i % 2 === 0 ? '#f1f5f9' : null),
          hLineColor: () => '#cbd5e1', vLineColor: () => '#cbd5e1', hLineWidth: () => 0.5, vLineWidth: () => 0.5,
          paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3
        }
      });
    });
    const doc = {
      pageSize: 'A4',
      pageMargins: [40, 36, 40, 44],
      info: { title: tr('Jurnal alimentar', 'Food log'), author: 'B-Fit' },
      content: continut,
      footer: (pagina, total) => ({ text: tr(`Pagina ${pagina} / ${total}`, `Page ${pagina} / ${total}`), color: gri, fontSize: 7.5, alignment: 'right', margin: [40, 14, 40, 0] }),
      styles: { h2: { fontSize: 12, bold: true, color: culoare, margin: [0, 12, 0, 5] } },
      defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1e293b', lineHeight: 1.2 }
    };
    const blob = await new Promise(resolve => pdfMake.createPdf(doc).getBlob(resolve));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tr('B-Fit - jurnal alimentar', 'B-Fit - food log')} ${de} ${pana}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Eroare jurnal PDF:', err);
    showToast(tr('Nu s-a putut genera PDF-ul. Verifică conexiunea la internet.', 'Could not create the PDF. Check your internet connection.'), 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Rândul din setari_nutritie: creat la prima schimbare (fără el, antrenorul vede jurnalul și nu există ținte)
async function scrieSetariNutritie(camp) {
  const c = dateClienta.fisa;
  const rand = Object.assign({ client_id: c.id, user_id: c.user_id }, camp);
  const q = nutritie.setari ? supabaseClient.from('setari_nutritie').update(camp).eq('client_id', c.id)
    : supabaseClient.from('setari_nutritie').insert(rand);
  const { data, error } = await q.select().single();
  if (error || !data) { showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error'); return false; }
  nutritie.setari = data;
  return true;
}

async function salveazaTinteNutritie() {
  const v = k => { const n = parseInt(document.getElementById('tintaNut_' + k).value, 10); return isNaN(n) ? null : n; };
  const camp = { kcal: v('kcal'), proteine: v('proteine'), carbo: v('carbo'), grasimi: v('grasimi') };
  if (camp.kcal !== null && (camp.kcal < 500 || camp.kcal > 10000)) return showToast(tr('Caloriile: între 500 și 10.000.', 'Calories: between 500 and 10,000.'), 'error');
  if (await scrieSetariNutritie(camp)) { showToast(tr('✓ Ținte salvate', '✓ Targets saved')); randeazaNutritieZi(); }
}

// ---- Calculatorul de ținte: consumul zilnic (Mifflin-St Jeor × activitate), apoi obiectivul și macronutrienții ----
const ACTIVITATI_CALCULATOR = [
  [1.2, 'Sedentar (birou, fără sport)', 'Sedentary (desk job, no exercise)'],
  [1.375, 'Ușor activ (sport 1–3 zile pe săptămână)', 'Lightly active (exercise 1–3 days a week)'],
  [1.55, 'Moderat activ (sport 3–5 zile)', 'Moderately active (exercise 3–5 days)'],
  [1.725, 'Foarte activ (sport 6–7 zile)', 'Very active (exercise 6–7 days)'],
  [1.9, 'Extrem de activ (muncă fizică și sport)', 'Extremely active (physical job and exercise)']
];
const OBIECTIVE_CALCULATOR = [
  ['slabire', 0.8, 2.0, 'Slăbire', 'Lose fat'],
  ['mentinere', 1, 1.6, 'Menținere', 'Maintain'],
  ['masa', 1.1, 1.8, 'Masă musculară', 'Build muscle']
];
let calculator = null;

async function deschideCalculatorTinte() {
  const r = (dateClienta.fisa && dateClienta.fisa.fisa_inscriere) || {};
  antrPers.ecran = 'nutritie-calculator';
  arataInapoiAntrPers();
  document.getElementById('clientaTitlu').innerText = tr('Calculează țintele', 'Calculate targets');
  // Ultima greutate: tabelul greutăți, apoi ultimul check-in, apoi fișa de înscriere
  const [resG, resC] = await Promise.all([
    supabaseClient.from('greutati').select('greutate, created_at').eq('client_id', dateClienta.fisa.id).order('created_at', { ascending: false }).limit(1),
    supabaseClient.from('checkin_saptamanal').select('greutate, saptamana').eq('client_id', dateClienta.fisa.id).not('greutate', 'is', null).order('saptamana', { ascending: false }).limit(1)
  ]);
  const greutate = (resG.data && resG.data[0] && resG.data[0].greutate) || (resC.data && resC.data[0] && resC.data[0].greutate) || r.greutate || '';
  const frecventa = parseInt(r.frecventa, 10) || 0;
  calculator = { sex: '', varsta: r.varsta || '', inaltime: r.inaltime || '', greutate, activitate: frecventa >= 5 ? 1.725 : frecventa >= 3 ? 1.55 : frecventa >= 1 ? 1.375 : 1.375, obiectiv: 'mentinere' };
  randeazaCalculatorTinte();
}

function rezultatCalculator() {
  const c = calculator;
  const g = parseFloat(String(c.greutate).replace(',', '.')), h = parseFloat(c.inaltime), a = parseFloat(c.varsta);
  if (!c.sex || !(g >= 30 && g <= 300) || !(h >= 120 && h <= 230) || !(a >= 14 && a <= 100)) return null;
  const bmr = 10 * g + 6.25 * h - 5 * a + (c.sex === 'm' ? 5 : -161);
  const consum = bmr * c.activitate;
  const ob = OBIECTIVE_CALCULATOR.find(o => o[0] === c.obiectiv);
  const kcal = Math.max(1200, Math.round(consum * ob[1] / 10) * 10);
  // Proteinele din greutatea de referință (IMC 25) când greutatea reală e peste ea, altfel ar ieși prea multe
  const gReferinta = Math.min(g, 25 * (h / 100) * (h / 100));
  const proteine = Math.round(gReferinta * ob[2]);
  const grasimi = Math.round(kcal * 0.25 / 9);
  const carbo = Math.max(0, Math.round((kcal - proteine * 4 - grasimi * 9) / 4));
  return { consum: Math.round(consum / 10) * 10, kcal, proteine, carbo, grasimi };
}

function randeazaCalculatorTinte() {
  const c = calculator, rez = rezultatCalculator();
  const buton = (camp, val, et) => `<button type="button" class="antr-pers-activitate${String(c[camp]) === String(val) ? ' activ' : ''}" onclick="calculator.${camp} = ${typeof val === 'number' ? val : `'${val}'`}; randeazaCalculatorTinte()">${et}</button>`;
  const camp = (id, et, min, max) => `<label>${et}<input type="number" inputmode="decimal" class="plan-ex-input" min="${min}" max="${max}" value="${escAttr(String(c[id]))}" onchange="calculator.${id} = this.value; randeazaCalculatorTinte()"></label>`;
  document.getElementById('clientaContinut').innerHTML = `<div class="card obiectiv-form calculator-tinte">
      <div class="checkin-eticheta">${tr('Sexul (pentru formulă)', 'Sex (for the formula)')}</div>
      <div class="antr-pers-activitati">${buton('sex', 'f', tr('Feminin', 'Female'))}${buton('sex', 'm', tr('Masculin', 'Male'))}</div>
      <div class="antr-pers-campuri" style="margin-top:8px;">${camp('varsta', tr('Vârsta', 'Age'), 14, 100)}${camp('inaltime', tr('Înălțimea (cm)', 'Height (cm)'), 120, 230)}${camp('greutate', tr('Greutatea (kg)', 'Weight (kg)'), 30, 300)}</div>
      <div class="checkin-eticheta" style="margin-top:10px;">${tr('Cât de activ ești', 'How active you are')}</div>
      <div class="calculator-optiuni">${ACTIVITATI_CALCULATOR.map(([f, ro, en]) => buton('activitate', f, tr(ro, en))).join('')}</div>
      <div class="checkin-eticheta" style="margin-top:10px;">${tr('Obiectivul', 'Goal')}</div>
      <div class="antr-pers-activitati">${OBIECTIVE_CALCULATOR.map(o => buton('obiectiv', o[0], tr(o[3], o[4]))).join('')}</div>
    </div>
    ${rez ? `<div class="card calculator-rezultat">
      <div class="acasa-antrenament-detalii">${tr(`Consumul tău estimat: ~${rez.consum} kcal pe zi`, `Your estimated expenditure: ~${rez.consum} kcal a day`)}</div>
      <div class="nutritie-ramase" style="margin:6px 0;"><b>${rez.kcal}</b><span>${tr('kcal pe zi', 'kcal a day')}</span></div>
      <div class="nutritie-macro-uri">
        <div class="nutritie-macro proteine"><span>${tr('Proteine', 'Protein')}</span><b>${rez.proteine} g</b></div>
        <div class="nutritie-macro carbo"><span>${tr('Carbohidrați', 'Carbohydrates')}</span><b>${rez.carbo} g</b></div>
        <div class="nutritie-macro grasimi"><span>${tr('Grăsimi', 'Fat')}</span><b>${rez.grasimi} g</b></div>
      </div>
      <button type="button" class="btn profile-save-btn" style="margin-top:12px;" onclick="aplicaCalculatorTinte(this)">${tr('Folosește aceste ținte', 'Use these targets')}</button>
      <div class="nutritie-sursa">${tr('Estimare după formula Mifflin-St Jeor. Nu e sfat medical; antrenorul le poate ajusta.', 'Estimate using the Mifflin-St Jeor formula. Not medical advice; your trainer can adjust them.')}</div>
    </div>` : `<div class="progres-gol">${tr('Completează sexul, vârsta, înălțimea și greutatea.', 'Fill in sex, age, height and weight.')}</div>`}`;
}

async function aplicaCalculatorTinte(btn) {
  const rez = rezultatCalculator();
  if (!rez) return;
  btn.disabled = true;
  const ok = await scrieSetariNutritie({ kcal: rez.kcal, proteine: rez.proteine, carbo: rez.carbo, grasimi: rez.grasimi });
  btn.disabled = false;
  if (!ok) return;
  showToast(tr('✓ Ținte salvate', '✓ Targets saved'));
  antrPers.ecran = 'nutritie';
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  randeazaNutritieZi();
}

// ---- Ținte adaptive (sql/2026-11-06_tinte_adaptive.sql), ca la aplicațiile de nutriție de top ----
// Tendința greutății: medie exponențială pe zile (10% pe zi), ca apa și sarea de azi să nu conteze.
// Consumul real: media caloriilor din zilele notate, corectată cu ritmul greutății (panta, 7.700 kcal ≈ 1 kg),
// pe ultimele ~3 săptămâni. Ținta propusă: consumul × obiectiv (slăbire −20%, menținere, masă +10%).
const KCAL_PE_KG = 7700;

async function incarcaDateAdaptive(clientId) {
  const de = new Date(); de.setDate(de.getDate() - 42);
  const deIso = isoDinData(de);
  const [resJ, resZ, resC, resG] = await Promise.all([
    supabaseClient.from('jurnal_alimente').select('data, kcal').eq('client_id', clientId).gte('data', deIso),
    supabaseClient.from('greutate_zilnica').select('data, kg').eq('client_id', clientId).gte('data', deIso),
    supabaseClient.from('checkin_saptamanal').select('saptamana, greutate').eq('client_id', clientId).gte('saptamana', deIso).not('greutate', 'is', null),
    supabaseClient.from('greutati').select('greutate, created_at').eq('client_id', clientId).gte('created_at', deIso)
  ]);
  if (resZ.error) return null; // fără tabel (SQL nerulat): secțiunea nu apare
  const zile = new Map();
  (resJ.data || []).forEach(x => zile.set(x.data, (zile.get(x.data) || 0) + Number(x.kcal || 0)));
  // O greutate pe zi; cântărirea zilnică a clientului are prioritate față de check-in și de cea notată de antrenor
  const kg = new Map();
  (resG.error ? [] : resG.data || []).forEach(x => kg.set(String(x.created_at).slice(0, 10), Number(x.greutate)));
  (resC.error ? [] : resC.data || []).forEach(x => { if (!kg.has(x.saptamana)) kg.set(x.saptamana, Number(x.greutate)); });
  (resZ.data || []).forEach(x => kg.set(x.data, Number(x.kg)));
  return {
    zile, jurnal: !resJ.error,
    greutati: [...kg.entries()].map(([data, v]) => ({ data, kg: v })).filter(x => x.kg > 0).sort((a, b) => a.data.localeCompare(b.data)),
    azi: (resZ.data || []).find(x => x.data === aziIsoAntrPers()) || null
  };
}

// { puncte (cu tendința), tendinta, ritmSapt, consum, zileNotate, motiv }; motiv = de ce nu se poate încă estima consumul
function calculeazaAdaptiv(d) {
  if (!d) return null;
  let trend = null, anterior = null;
  const puncte = d.greutati.map(p => {
    if (trend === null) trend = p.kg;
    else trend += (1 - Math.pow(0.9, Math.max(1, zileIntre(anterior, p.data)))) * (p.kg - trend);
    anterior = p.data;
    return { data: p.data, kg: p.kg, trend };
  });
  const rez = { puncte, tendinta: trend, ritmSapt: null, consum: null, zileNotate: 0, motiv: '' };
  if (!puncte.length) { rez.motiv = tr('Cântărește-te de câteva ori pe săptămână (dimineața, înainte de micul dejun).', 'Weigh yourself a few times a week (in the morning, before breakfast).'); return rez; }
  const azi = aziIsoAntrPers();
  const start = isoDinData(new Date(Date.now() - 20 * 86400000));
  const inFereastra = puncte.filter(p => p.data >= start);
  // Tendința de la începutul ferestrei: ultimul punct de dinainte (dacă există), altfel primul din fereastră
  const inainte = puncte.filter(p => p.data < start).pop();
  const primul = inainte || inFereastra[0];
  const ultimul = puncte[puncte.length - 1];
  const zileGreutate = primul ? zileIntre(primul.data, ultimul.data) : 0;
  // Schimbarea greutății: panta dreptei prin cântăririle din perioadă (mai exactă decât capetele tendinței, care întârzie)
  const serie = puncte.filter(p => p.data >= primul.data);
  const xs = serie.map(p => zileIntre(primul.data, p.data)), ys = serie.map(p => p.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const sxx = xs.reduce((t, x) => t + (x - mx) * (x - mx), 0);
  const panta = sxx ? xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / sxx : 0; // kg pe zi
  if (zileGreutate >= 7 && serie.length >= 3) rez.ritmSapt = panta * 7;
  // Caloriile: zilele complete (de ieri înapoi) cu cel puțin 500 kcal notate, din aceeași perioadă
  const deLa = primul && primul.data > start ? primul.data : start;
  const ieri = isoDinData(new Date(Date.now() - 86400000));
  const zileFereastra = Math.max(1, zileIntre(deLa, ieri) + 1);
  const notate = [...d.zile.entries()].filter(([data, kcal]) => data >= deLa && data <= ieri && kcal >= 500);
  rez.zileNotate = notate.length;
  if (!d.jurnal) { rez.motiv = tr('Jurnalul alimentar e ascuns.', 'The food log is hidden.'); return rez; }
  if (zileGreutate < 10 || ultimul.data < isoDinData(new Date(Date.now() - 7 * 86400000))) {
    rez.motiv = tr('Pentru consumul real îmi trebuie greutăți pe cel puțin 10 zile, ultima din săptămâna asta.', 'For your real expenditure I need weights over at least 10 days, the last one this week.');
    return rez;
  }
  if (notate.length < 7 || notate.length / zileFereastra < 0.7) {
    rez.motiv = tr(`Notează mesele în cel puțin 7 zile din ultimele 3 săptămâni (acum: ${notate.length}).`, `Log your meals on at least 7 of the last 3 weeks’ days (now: ${notate.length}).`);
    return rez;
  }
  const medie = notate.reduce((t, [, k]) => t + k, 0) / notate.length;
  if (serie.length < 4) { rez.motiv = tr('Cântărește-te de cel puțin 4 ori în 3 săptămâni.', 'Weigh yourself at least 4 times in 3 weeks.'); return rez; }
  const consum = medie - panta * KCAL_PE_KG;
  if (consum < 1000 || consum > 6000) { rez.motiv = tr('Datele nu sunt încă destul de constante pentru o estimare sigură.', 'The data is not consistent enough yet for a reliable estimate.'); return rez; }
  rez.consum = Math.round(consum / 10) * 10;
  return rez;
}

// Ținta propusă din consum și obiectiv; proteinele rămân cele setate (sau 1,8 g/kg din greutatea de referință)
function tintaPropusa(rez, setari, inaltime) {
  if (!rez || !rez.consum) return null;
  const s = setari || {};
  const ob = OBIECTIVE_CALCULATOR.find(o => o[0] === (s.obiectiv || 'mentinere'));
  const kcal = Math.max(1200, Math.round(rez.consum * ob[1] / 10) * 10);
  const h = parseFloat(inaltime) || 0;
  const ref = h ? Math.min(rez.tendinta, 25 * (h / 100) * (h / 100)) : rez.tendinta;
  const proteine = Math.min(Number(s.proteine) || Math.round(ref * ob[2]), Math.round(kcal * 0.4 / 4));
  const grasimi = Math.round(kcal * 0.25 / 9);
  return { kcal, proteine, grasimi, carbo: Math.max(0, Math.round((kcal - proteine * 4 - grasimi * 9) / 4)) };
}

// Grafic mic: cântăririle (puncte) și tendința (linie), ultimele 5 săptămâni
function htmlGraficTendinta(puncte) {
  if (puncte.length < 2) return '';
  const p = puncte.slice(-40);
  const W = 300, H = 80, d0 = p[0].data, zile = Math.max(1, zileIntre(d0, p[p.length - 1].data));
  const valori = p.flatMap(x => [x.kg, x.trend]);
  const min = Math.min(...valori) - 0.3, max = Math.max(...valori) + 0.3;
  const x = q => (zileIntre(d0, q.data) / zile * (W - 16) + 8).toFixed(1);
  const y = v => ((max - v) / (max - min) * (H - 12) + 6).toFixed(1);
  return `<svg class="grafic-tendinta" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <polyline class="gg-trend" points="${p.map(q => `${x(q)},${y(q.trend)}`).join(' ')}"/>
      ${p.map(q => `<circle class="gg-punct" cx="${x(q)}" cy="${y(q.kg)}" r="2.6"/>`).join('')}
    </svg>`;
}

function textRitm(ritm) {
  if (ritm === null) return '';
  const r = Math.round(ritm * 10) / 10;
  if (Math.abs(r) < 0.1) return tr('stabilă', 'stable');
  return `${r > 0 ? '+' : '−'}${formatKg(Math.abs(r))} kg ${tr('pe săptămână', 'per week')}`;
}

// Secțiunea din Nutriție (client) și din fișă (antrenor). laAntrenor: butoanele scriu țintele antrenorului
function htmlAdaptiv(d, setari, inaltime, laAntrenor) {
  if (!d) return '';
  const rez = calculeazaAdaptiv(d), s = setari || {};
  const propusa = tintaPropusa(rez, s, inaltime);
  const deAntrenor = s.tinte_setate_de === 'antrenor';
  const poateAplica = laAntrenor || !deAntrenor;
  const fct = laAntrenor ? 'seteazaObiectivAntrenor' : 'seteazaObiectivNutritie';
  const ob = s.obiectiv || 'mentinere';
  const diferenta = propusa && s.kcal ? propusa.kcal - Number(s.kcal) : null;
  return `<div class="card nutritie-adaptiv" id="${laAntrenor ? 'adaptivAntrenor' : 'nutritieAdaptiv'}">
    <b>${tr('Greutate și consum', 'Weight and expenditure')}</b>
    ${rez.tendinta ? `<div class="adaptiv-tendinta"><b>${formatKg(Math.round(rez.tendinta * 10) / 10)} kg</b> ${tr('tendința', 'trend')}${rez.ritmSapt !== null ? ` · ${textRitm(rez.ritmSapt)}` : ''}</div>` : ''}
    ${laAntrenor ? '' : `<div class="adaptiv-cantar">
      <input type="number" inputmode="decimal" id="greutateAzi" class="plan-ex-input" min="30" max="300" step="0.1" placeholder="${tr('kg azi', 'kg today')}" value="${d.azi ? d.azi.kg : ''}">
      <button type="button" class="btn btn-clear" onclick="salveazaGreutateAzi(this)">${d.azi ? tr('Actualizează', 'Update') : tr('Notează greutatea', 'Log weight')}</button>
    </div>`}
    ${htmlGraficTendinta(rez.puncte)}
    ${rez.puncte.length >= 2 ? `<div class="adaptiv-legenda"><span class="gg-l-punct"></span>${tr('cântăriri', 'weigh-ins')} <span class="gg-l-trend"></span>${tr('tendința', 'trend')}</div>` : ''}
    <div class="checkin-eticheta" style="margin-top:10px;">${tr('Obiectivul', 'Goal')}</div>
    <div class="antr-pers-activitati">${OBIECTIVE_CALCULATOR.map(o => `<button type="button" class="antr-pers-activitate${o[0] === ob ? ' activ' : ''}" onclick="${fct}('${o[0]}')">${tr(o[3], o[4])}</button>`).join('')}</div>
    ${rez.consum ? `<div class="adaptiv-consum">
        <div class="acasa-antrenament-detalii">${tr(`Consum real estimat (din ${rez.zileNotate} zile notate și greutate)`, `Estimated real expenditure (from ${rez.zileNotate} logged days and weight)`)}</div>
        <b>~${rez.consum} kcal ${tr('pe zi', 'a day')}</b>
      </div>
      <div class="adaptiv-propunere">
        <div><div class="acasa-eticheta">${tr('Ținta propusă', 'Suggested target')}</div>
        <b>${propusa.kcal} kcal</b> <span class="acasa-antrenament-detalii">${s.kcal ? (Math.abs(diferenta) < 50 ? tr('· ținta de acum e potrivită', '· your current target fits') : `· ${tr('acum', 'now')} ${s.kcal} (${diferenta > 0 ? '+' : ''}${diferenta})`) : ''}</span>
        <div class="acasa-antrenament-detalii">${tr('Proteine', 'Protein')} ${propusa.proteine} g · ${tr('Carbohidrați', 'Carbohydrates')} ${propusa.carbo} g · ${tr('Grăsimi', 'Fat')} ${propusa.grasimi} g</div></div>
        ${poateAplica && (diferenta === null || Math.abs(diferenta) >= 50) ? `<button type="button" class="btn" onclick="${laAntrenor ? 'aplicaPropunereAntrenor' : 'aplicaPropunereNutritie'}(this)">${tr('Aplică', 'Apply')}</button>` : ''}
      </div>
      ${!poateAplica ? `<div class="acasa-antrenament-detalii">${tr('Țintele tale le setează antrenorul; vede și el propunerea.', 'Your trainer sets your targets and sees this suggestion too.')}</div>` : ''}`
    : `<div class="acasa-antrenament-detalii adaptiv-motiv">${escAttr(rez.motiv)}</div>`}
    <div class="nutritie-sursa">${tr('Estimare din datele tale, nu sfat medical. Se reface la fiecare deschidere.', 'An estimate from your data, not medical advice. It updates every time you open it.')}</div>
  </div>`;
}

function redeseneazaAdaptiv() {
  const el = document.getElementById('nutritieAdaptiv');
  if (el) el.outerHTML = htmlAdaptiv(nutritie.adaptiv, nutritie.setari, ((dateClienta.fisa || {}).fisa_inscriere || {}).inaltime, false);
}

async function salveazaGreutateAzi(btn) {
  const kg = parseFloat(String(document.getElementById('greutateAzi').value).replace(',', '.'));
  if (!(kg >= 30 && kg <= 300)) return showToast(tr('Scrie greutatea în kg (30–300).', 'Enter your weight in kg (30–300).'), 'error');
  const c = dateClienta.fisa;
  btn.disabled = true;
  const { data, error } = await supabaseClient.from('greutate_zilnica').upsert({ client_id: c.id, user_id: c.user_id, data: aziIsoAntrPers(), kg: rotunjeste1(kg), updated_at: new Date().toISOString() }, { onConflict: 'client_id,data' }).select().single();
  btn.disabled = false;
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  nutritie.adaptiv = await incarcaDateAdaptive(c.id);
  showToast(tr(`✓ ${formatKg(Number(data.kg))} kg notat`, `✓ ${formatKg(Number(data.kg))} kg logged`));
  redeseneazaAdaptiv();
}

async function seteazaObiectivNutritie(ob) {
  if (await scrieSetariNutritie({ obiectiv: ob })) redeseneazaAdaptiv();
}

async function aplicaPropunereNutritie(btn) {
  const p = tintaPropusa(calculeazaAdaptiv(nutritie.adaptiv), nutritie.setari, ((dateClienta.fisa || {}).fisa_inscriere || {}).inaltime);
  if (!p) return;
  btn.disabled = true;
  const ok = await scrieSetariNutritie({ kcal: p.kcal, proteine: p.proteine, carbo: p.carbo, grasimi: p.grasimi });
  btn.disabled = false;
  if (ok) { showToast(tr('✓ Ținte actualizate', '✓ Targets updated')); randeazaNutritieZi(); }
}

// La antrenor: aceleași date în fișă; obiectivul și ținta le scrie el (setari_nutritie, ca la „Salvează țintele zilnice”)
async function scrieSetariAntrenor(camp) {
  const n = nutritieFisa;
  const q = n.setari ? supabaseClient.from('setari_nutritie').update(camp).eq('client_id', n.client.id)
    : supabaseClient.from('setari_nutritie').insert(Object.assign({ client_id: n.client.id, user_id: utilizatorCurent.id }, camp));
  const { data, error } = await q.select().single();
  if (error || !data) { showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error'); return false; }
  n.setari = data;
  return true;
}

async function seteazaObiectivAntrenor(ob) {
  if (await scrieSetariAntrenor({ obiectiv: ob })) incarcaProgresFisa();
}

async function aplicaPropunereAntrenor(btn) {
  const n = nutritieFisa;
  const p = tintaPropusa(calculeazaAdaptiv(n.adaptiv), n.setari, (n.client.fisaInscriere || {}).inaltime);
  if (!p) return;
  btn.disabled = true;
  const ok = await scrieSetariAntrenor({ kcal: p.kcal, proteine: p.proteine, carbo: p.carbo, grasimi: p.grasimi });
  btn.disabled = false;
  if (ok) { showToast(tr('✓ Ținte salvate', '✓ Targets saved')); incarcaProgresFisa(); }
}

async function salveazaTintaApa(input) {
  const n = parseInt(input.value, 10);
  const valoare = isNaN(n) ? null : Math.max(1, Math.min(30, n));
  if (await scrieSetariNutritie({ apa_tinta: valoare })) { showToast(tr('✓ Ținta de apă salvată', '✓ Water target saved')); redeseneazaApa(); }
}

async function seteazaVizibilNutritie(vizibil, input) {
  input.disabled = true;
  const ok = await scrieSetariNutritie({ vizibil_antrenor: vizibil });
  input.disabled = false;
  if (!ok) input.checked = !vizibil;
}

function stergeAliment(id) {
  customConfirm(tr('Ștergi din jurnal?', 'Remove from the log?'), tr('Alimentul dispare din ziua asta.', 'The food is removed from this day.'), async () => {
    const { error } = await supabaseClient.from('jurnal_alimente').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    nutritie.lista = nutritie.lista.filter(x => x.id !== id);
    if (nutritie.zi === aziIsoAntrPers()) nutritie.azi = totaluriAzi(nutritie.lista);
    randeazaNutritieZi();
  });
}

// ---- Adăugare: scanare, căutare, recente, produs nou ----
async function deschideAdaugaAliment(masa) {
  if (clientaTabCurent !== 'nutritie') clientaTab('nutritie');
  nutritie.masa = masa;
  if (!nutritie.zi) nutritie.zi = aziIsoAntrPers();
  antrPers.ecran = 'nutritie-adauga';
  dateClienta.planCurent = null;
  arataInapoiAntrPers();
  nutritie.rezultate = [];
  nutritie.cautare = '';
  randeazaAdaugaAliment();
  // Recente: ce a mai notat clientul (ultimele 60 de rânduri, fără dubluri)
  const [{ data }] = await Promise.all([
    supabaseClient.from('jurnal_alimente').select('*').eq('client_id', dateClienta.fisa.id).order('created_at', { ascending: false }).limit(60),
    nutritie.salvate === undefined || nutritie.salvate === null ? incarcaSalvateNutritie() : null,
    retete.lista === null ? incarcaRetete() : null
  ]);
  const vazute = new Set();
  nutritie.recente = (data || []).filter(x => Number(x.cantitate_g) !== 1).filter(x => { const k = (x.cod || '') + '|' + x.nume.toLowerCase(); if (vazute.has(k)) return false; vazute.add(k); return true; })
    .slice(0, 12).map(x => produsDinJurnal(x));
  if (antrPers.ecran === 'nutritie-adauga' && !nutritie.rezultate.length) randeazaAdaugaAliment();
}

// Produs (valori la 100 g) refăcut dintr-un rând de jurnal
function produsDinJurnal(x) {
  const k = 100 / Number(x.cantitate_g || 100);
  return { nume: x.nume, marca: x.marca || '', cod: x.cod || null, kcal: rotunjeste1(x.kcal * k), proteine: rotunjeste1(x.proteine * k),
    carbo: rotunjeste1(x.carbo * k), grasimi: rotunjeste1(x.grasimi * k), portie_g: Number(x.cantitate_g), imagine: x.imagine || '', sursa: 'recent' };
}

// Poza produsului (Open Food Facts) sau un semn neutru; doar adrese de pe images.openfoodfacts.org
function htmlImagineProdus(url, marime) {
  const ok = /^https:\/\/images\.openfoodfacts\.org\//.test(url || '');
  return `<span class="nutritie-imagine ${marime || ''}">${ok ? `<img src="${escAttr(url)}" alt="" ${marime === 'mare' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.remove()">` : ''}<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="7"/><path d="M12 11V5a2 2 0 0 1 2-2h2v1a2 2 0 0 1-2 2h-2"/><path d="M10 10.5c1.3.7 2.7.7 4 0"/></svg></span>`;
}

// Nutri-Score de la Open Food Facts (A–E); necunoscut = nimic
function htmlNutriScore(nota) {
  const n = String(nota || '').toLowerCase();
  if (!/^[a-e]$/.test(n)) return '';
  return `<span class="nutriscore" title="Nutri-Score">${'abcde'.split('').map(x => `<i class="ns-${x}${x === n ? ' activ' : ''}">${x.toUpperCase()}</i>`).join('')}</span>`;
}

function htmlProdusRand(p, i, lista) {
  return `<button type="button" class="plan-zi-card nutritie-produs" onclick="alegeProdus('${lista}', ${i})">
    ${htmlImagineProdus(p.imagine, 'mica')}
    <span class="plan-zi-card-text"><span class="plan-zi-card-titlu">${escAttr(p.nume)}</span>
    <span class="plan-zi-card-detalii">${p.marca ? escAttr(p.marca) + ' · ' : ''}<b>${Math.round(p.kcal)} kcal</b> ${tr('la 100 g', 'per 100 g')}${p.sursa === 'recent' && p.portie_g ? ` · ${tr('ultima dată', 'last time')} ${formatKg(p.portie_g)} g` : ''}</span></span>
    <span class="progres-ex-dif">${lista === 'verificare' ? '›' : '+'}</span>
  </button>`;
}

function randeazaAdaugaAliment() {
  const masa = MESE_NUTRITIE.find(m => m[0] === nutritie.masa) || MESE_NUTRITIE[1];
  document.getElementById('clientaTitlu').innerText = tr(masa[1], masa[2]);
  const rez = nutritie.rezultate;
  document.getElementById('clientaContinut').innerHTML = `
    <button type="button" class="btn nutritie-scaneaza" onclick="pornesteScanare()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>
      ${tr('Scanează codul de bare', 'Scan the barcode')}</button>
    <div class="antr-pers-adauga" style="margin-top:10px;">
      <input type="search" id="nutritieCauta" class="plan-ex-input" maxlength="60" value="${escAttr(nutritie.cautare)}" placeholder="${tr('Caută produsul (ex: iaurt grecesc)', 'Search the product (e.g. greek yogurt)')}" onkeydown="if (event.key === 'Enter') cautaAlimente()">
      <button type="button" class="btn" onclick="cautaAlimente()">${tr('Caută', 'Search')}</button>
    </div>
    <div id="nutritieRezultate">${rez === 'cautare' ? `<div class="progres-gol">${tr('Se caută...', 'Searching...')}</div>`
      : rez.length ? `<div class="antr-pers-sectiune">${tr('Rezultate', 'Results')}</div>${rez.map((p, i) => htmlProdusRand(p, i, 'rezultate')).join('')}`
      : nutritie.cautare ? `<div class="progres-gol">${tr('Nu am găsit produsul. Îl poți adăuga tu, o singură dată.', 'Product not found. You can add it yourself, once.')}</div>` : ''}</div>
    ${!rez.length ? htmlSalvateAdauga() : ''}
    ${nutritie.recente.length && !rez.length ? `<div class="antr-pers-sectiune">${tr('Recente', 'Recent')}</div>${nutritie.recente.map((p, i) => htmlProdusRand(p, i, 'recente')).join('')}` : ''}
    <div class="nutritie-adauga-jos">
      <button type="button" class="btn btn-clear" onclick="deschideAdaugaRapid(nutritie.masa)">${tr('⚡ Adaugă rapid (doar calorii)', '⚡ Quick add (calories only)')}</button>
      <button type="button" class="btn btn-clear" onclick="deschideProdusNou(null)">${tr('+ Produs care nu e în listă', '+ Product not on the list')}</button>
    </div>`;
}

// Favoritele și mesele salvate, în ecranul de adăugare (fără tabel: nimic)
function htmlSalvateAdauga() {
  const toate = nutritie.salvate || [];
  const fav = toate.filter(x => x.tip === 'favorit'), mese = toate.filter(x => x.tip === 'masa');
  let html = '';
  if (mese.length) html += `<div class="antr-pers-sectiune">${tr('Mese salvate', 'Saved meals')}</div>` + mese.map(m => {
    const kcal = Math.round(m.continut.reduce((t, a) => t + Number(a.kcal) * (Number(a.cantitate_g) || 100) / 100, 0));
    return `<div class="plan-zi-card nutritie-produs nutritie-masa-salvata">
      <button type="button" class="nutritie-masa-salvata-corp" onclick="adaugaMasaSalvata('${m.id}')">
        <span class="plan-zi-card-text"><span class="plan-zi-card-titlu">${escAttr(m.nume)}</span>
        <span class="plan-zi-card-detalii">${escAttr(m.continut.map(a => a.nume).slice(0, 3).join(', '))}${m.continut.length > 3 ? ` +${m.continut.length - 3}` : ''} · <b>${kcal} kcal</b></span></span>
        <span class="progres-ex-dif">+</span></button>
      <button type="button" class="notificare-x nutritie-sterge" onclick="stergeSalvat('${m.id}')" aria-label="${tr('Șterge', 'Delete')}">×</button>
    </div>`;
  }).join('');
  if ((retete.lista || []).length) html += `<div class="antr-pers-sectiune">${tr('Rețete', 'Recipes')}</div>` + retete.lista.slice(0, 6).map(htmlRandReteta).join('');
  if (fav.length) html += `<div class="antr-pers-sectiune">${tr('Favorite', 'Favourites')}</div>` + fav.map((f, i) => htmlProdusRand(Object.assign({}, f.continut[0], { sursa: 'favorit' }), i, 'favorite')).join('');
  return html;
}

// Open Food Facts → produsul nostru (valori la 100 g); null dacă lipsesc caloriile
function produsDinOff(p, cod) {
  const n = p.nutriments || {};
  const kcal = Number(n['energy-kcal_100g'] ?? (n.energy_100g != null ? n.energy_100g / 4.184 : NaN));
  const nume = (p.product_name_ro || p.product_name || '').trim();
  if (!nume) return null;
  const optional = v => v === undefined || v === null || v === '' || isNaN(Number(v)) ? null : rotunjeste1(v);
  return { nume: nume.slice(0, 120), marca: String(p.brands || '').split(',')[0].trim().slice(0, 80), cod: cod || p.code || null,
    kcal: isNaN(kcal) ? null : rotunjeste1(kcal), proteine: rotunjeste1(n.proteins_100g), carbo: rotunjeste1(n.carbohydrates_100g),
    grasimi: rotunjeste1(n.fat_100g), portie_g: Number(p.serving_quantity) > 0 ? Number(p.serving_quantity) : null, sursa: 'off',
    imagine: p.image_front_small_url || '', imagineMare: p.image_front_url || p.image_front_small_url || '', nutriscore: p.nutriscore_grade || '',
    saturate: optional(n['saturated-fat_100g']), zaharuri: optional(n.sugars_100g), fibre: optional(n.fiber_100g), sare: optional(n.salt_100g) };
}

// Căutare după nume: întâi produsele noastre, apoi Open Food Facts (prin Worker; doar la „Caută”, nu la fiecare literă)
async function cautaAlimente() {
  const q = (document.getElementById('nutritieCauta').value || '').trim();
  if (q.length < 2) return;
  nutritie.cautare = q;
  nutritie.rezultate = 'cautare';
  randeazaAdaugaAliment();
  const lista = await cautaProduse(q);
  if (antrPers.ecran !== 'nutritie-adauga') return;
  nutritie.rezultate = lista;
  randeazaAdaugaAliment();
}

// Produsele noastre, apoi Open Food Facts (cel mult 20, doar cu calorii); client și antrenor
async function cautaProduse(q) {
  const cuvinte = faraDiacritice(q).split(/\s+/).filter(c => c.length >= 2).slice(0, 4);
  let qBaza = supabaseClient.from('alimente_baza').select('*').limit(12);
  cuvinte.forEach(c => { qBaza = qBaza.ilike('cautare', `%${c}%`); });
  const [baza, proprii, off] = await Promise.all([
    cuvinte.length ? qBaza : { data: [] },
    supabaseClient.from('alimente').select('*').ilike('nume', `%${q}%`).limit(10),
    // Prin Worker: căutarea Open Food Facts nu acceptă cereri direct din browser
    fetch(`${URL_POZE_ANTR}/off-cautare?q=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : null).catch(() => null)
  ]);
  // Cele mai scurte nume întâi („Ou” înaintea „Ou fiert tare”), apoi produsele adăugate de clienți și Open Food Facts
  const dinBaza = (baza.error ? [] : (baza.data || [])).map(produsBaza).sort((a, b) => a.nume.length - b.nume.length);
  return dinBaza.concat((proprii.data || []).map(produsPropriu))
    .concat((Array.isArray(off) ? off : []).map(p => produsDinOff(p)).filter(p => p && p.kcal !== null)).slice(0, 25);
}

function faraDiacritice(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Aliment de bază (sql/2026-11-06_alimente_baza.sql, din USDA): numele în limba aplicației, porțiile „ca acasă”
function produsBaza(a) {
  const n = v => v === null || v === undefined ? null : Number(v);
  return { nume: tr(a.nume, a.nume_en), marca: '', cod: null, kcal: Number(a.kcal), proteine: Number(a.proteine), carbo: Number(a.carbo),
    grasimi: Number(a.grasimi), saturate: n(a.saturate), zaharuri: n(a.zaharuri), fibre: n(a.fibre), sare: n(a.sare),
    portii: Array.isArray(a.portii) ? a.portii : [], portie_g: null, sursa: 'baza' };
}

function produsPropriu(a) {
  return Object.assign({}, a, { kcal: Number(a.kcal), proteine: Number(a.proteine), carbo: Number(a.carbo), grasimi: Number(a.grasimi), sursa: 'propriu' });
}

function alegeProdus(lista, i) {
  if (lista === 'verificare') { verificare.produs = verificare.rezultate[i] || null; return randeazaVerificaProdus(); }
  if (lista === 'reteta') return alegeIngredient(i);
  if (lista === 'favorite') {
    const f = (nutritie.salvate || []).filter(x => x.tip === 'favorit')[i];
    if (f) deschideCantitate(Object.assign({}, f.continut[0], { portie_g: Number(f.continut[0].cantitate_g) || null, sursa: 'favorit' }));
    return;
  }
  const p = (lista === 'recente' ? nutritie.recente : nutritie.rezultate)[i];
  if (p) deschideCantitate(p);
}

// Codul de bare: întâi baza noastră, apoi Open Food Facts; negăsit (sau fără calorii) → formularul de produs nou, cu ce știm
// { produs, complet }: produs = null dacă nu există nicăieri; complet = are calorii
async function produsDupaCod(cod) {
  // Baza noastră și Open Food Facts deodată (înainte, una după alta), ca produsul să apară mai repede
  const [resPropriu, r] = await Promise.all([
    supabaseClient.from('alimente').select('*').eq('cod', cod).maybeSingle(),
    fetch(`${URL_OFF}/api/v2/product/${encodeURIComponent(cod)}.json?fields=code,product_name,product_name_ro,brands,nutriments,serving_quantity,image_front_small_url,image_front_url,nutriscore_grade`)
      .then(x => x.ok ? x.json() : null).catch(() => null)
  ]);
  if (resPropriu.data) return { produs: produsPropriu(resPropriu.data), complet: true };
  const p = r && r.status === 1 && r.product ? produsDinOff(r.product, cod) : null;
  // Poza pornește la descărcare cât se desenează ecranul
  if (p && p.imagine) { const im = new Image(); im.src = p.imagine; }
  return { produs: p, complet: !!(p && p.kcal !== null) };
}

async function gasesteDupaCod(cod) {
  showToast(tr('Caut produsul...', 'Looking up the product...'));
  if (rolUtilizator === 'antrenor') return verificaProdusCod(cod);
  const { produs: p, complet } = await produsDupaCod(cod);
  if (complet) return deschideCantitate(p);
  showToast(p ? tr('Produsul nu are valorile nutriționale complete. Completează-le de pe etichetă.', 'The product has incomplete nutrition data. Fill them in from the label.')
    : tr('Produs negăsit. Adaugă-l de pe etichetă, o singură dată.', 'Product not found. Add it from the label, once.'), 'error');
  deschideProdusNou(Object.assign({ cod }, p || {}));
}

// ---- Favorite și mese salvate (sql/2026-11-06_nutritie_salvate.sql): doar ale clientului ----
// salvate: null = neîncărcat sau fără tabel (atunci steaua și secțiunile nu apar)
function cheieAliment(p) {
  return p.cod ? 'cod:' + p.cod : 'nume:' + faraDiacritice(p.nume);
}

// Ce se păstrează dintr-un aliment: valorile la 100 g și cantitatea obișnuită
function alimentDeSalvat(p, grame) {
  const o = { nume: p.nume, marca: p.marca || '', cod: p.cod || null, imagine: p.imagine || '', kcal: p.kcal, proteine: p.proteine, carbo: p.carbo, grasimi: p.grasimi, cantitate_g: grame || p.portie_g || 100 };
  if (p.portii && p.portii.length) o.portii = p.portii;
  return o;
}

async function incarcaSalvateNutritie() {
  if (!dateClienta.fisa) return;
  const { data, error } = await supabaseClient.from('nutritie_salvate').select('*').eq('client_id', dateClienta.fisa.id).order('created_at', { ascending: false });
  nutritie.salvate = error ? null : (data || []);
}

function esteFavorit(p) {
  return !!(nutritie.salvate || []).find(x => x.tip === 'favorit' && cheieAliment(x.continut[0]) === cheieAliment(p));
}

async function comutaFavorit(btn) {
  const p = nutritie.produs, c = dateClienta.fisa;
  if (!nutritie.salvate) return showToast(tr('Favoritele nu sunt disponibile acum. Verifică internetul.', 'Favourites are not available right now. Check your internet.'), 'error');
  btn.disabled = true;
  const existent = nutritie.salvate.find(x => x.tip === 'favorit' && cheieAliment(x.continut[0]) === cheieAliment(p));
  if (existent) {
    const { error } = await supabaseClient.from('nutritie_salvate').delete().eq('id', existent.id);
    btn.disabled = false;
    if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
    nutritie.salvate = nutritie.salvate.filter(x => x.id !== existent.id);
  } else {
    const g = parseFloat(String(document.getElementById('nutritieGrame')?.value || '').replace(',', '.')) || null;
    const { data, error } = await supabaseClient.from('nutritie_salvate').insert({ client_id: c.id, user_id: c.user_id, tip: 'favorit', nume: p.nume.slice(0, 120), continut: [alimentDeSalvat(p, g)] }).select().single();
    btn.disabled = false;
    if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
    nutritie.salvate = [data].concat(nutritie.salvate);
    showToast(tr('★ Adăugat la favorite', '★ Added to favourites'));
  }
  const fav = esteFavorit(p);
  btn.classList.toggle('activ', fav);
  btn.textContent = fav ? '★' : '☆';
}

// Masa din ziua deschisă → masă salvată, cu numele ales
function salveazaMasa(cod) {
  const randuri = nutritie.lista.filter(x => x.masa === cod);
  if (!randuri.length || !nutritie.salvate) return;
  const masa = MESE_NUTRITIE.find(m => m[0] === cod);
  customConfirm(tr('Salvează masa', 'Save meal'), tr('Apare la „Mese salvate” și o adaugi din nou cu o atingere.', 'It shows under “Saved meals” and you can add it again with one tap.'), async nume => {
    const c = dateClienta.fisa;
    const continut = randuri.map(x => alimentDeSalvat(Object.assign(produsDinJurnal(x), { cod: x.cod || null }), Number(x.cantitate_g)));
    const { data, error } = await supabaseClient.from('nutritie_salvate').insert({ client_id: c.id, user_id: c.user_id, tip: 'masa', nume: (nume || tr(`${masa[1]} salvat`, `Saved ${masa[2].toLowerCase()}`)).slice(0, 120), continut }).select().single();
    if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
    nutritie.salvate = [data].concat(nutritie.salvate);
    showToast(tr('✓ Masă salvată', '✓ Meal saved'));
  }, { valoare: tr(`${masa[1]} obișnuit`, `My usual ${masa[2].toLowerCase()}`), placeholder: tr('Numele mesei', 'Meal name') });
}

// Toate alimentele unei mese salvate, la masa deschisă (cu cantitățile salvate)
async function adaugaMasaSalvata(id) {
  const m = (nutritie.salvate || []).find(x => x.id === id);
  if (!m) return;
  const ok = await insereazaInJurnal(m.continut.map(a => ({ produs: a, grame: Number(a.cantitate_g) || 100 })), nutritie.masa);
  if (ok) { showToast(tr(`✓ ${m.nume}`, `✓ ${m.nume}`)); antrPers.ecran = 'nutritie'; document.getElementById('clientaBtnInapoi').style.visibility = 'hidden'; randeazaNutritieZi(); }
}

function stergeSalvat(id) {
  customConfirm(tr('Ștergi?', 'Delete?'), tr('Dispare din listă. Ce ai notat deja în jurnal rămâne.', 'It disappears from the list. What you already logged stays.'), async () => {
    const { error } = await supabaseClient.from('nutritie_salvate').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    nutritie.salvate = nutritie.salvate.filter(x => x.id !== id);
    randeazaAdaugaAliment();
  });
}

// Mai multe alimente deodată în jurnal (masa salvată, copierea zilei); false la eroare
async function insereazaInJurnal(lista, masa, zi) {
  const c = dateClienta.fisa;
  zi = zi || nutritie.zi || aziIsoAntrPers();
  const randuri = lista.map(({ produs: p, grame, masa: m }) => Object.assign({ user_id: c.user_id, client_id: c.id, data: zi, masa: m || masa,
    nume: p.nume, marca: p.marca || '', cod: p.cod && /^\d{6,14}$/.test(p.cod) ? p.cod : null, cantitate_g: rotunjeste1(grame),
    imagine: /^https:\/\/images\.openfoodfacts\.org\//.test(p.imagine || '') ? p.imagine.slice(0, 300) : null }, valoriPentruGrame(p, grame)));
  const { data, error } = await supabaseClient.from('jurnal_alimente').insert(randuri).select();
  if (error || !data) { showToast(tr('Nu s-a putut adăuga. Verifică internetul.', 'Could not add. Check your internet.'), 'error'); return false; }
  if (zi === nutritie.zi) nutritie.lista = nutritie.lista.concat(data);
  if (zi === aziIsoAntrPers()) nutritie.azi = totaluriAzi(nutritie.lista.filter(x => x.data === zi));
  return true;
}

// „Copiază ieri”: toate alimentele din ziua de dinainte, în ziua deschisă, pe aceleași mese
async function copiazaZiuaDeIeri() {
  const d = dataDinIso(nutritie.zi || aziIsoAntrPers());
  d.setDate(d.getDate() - 1);
  const ieri = isoDinData(d);
  const { data, error } = await supabaseClient.from('jurnal_alimente').select('*').eq('client_id', dateClienta.fisa.id).eq('data', ieri).order('created_at');
  if (error) return showToast(tr('Nu s-a putut citi ziua de ieri. Verifică internetul.', 'Could not read yesterday. Check your internet.'), 'error');
  if (!data.length) return showToast(tr('Ieri nu ai notat nimic.', 'Nothing logged yesterday.'));
  const kcal = Math.round(totaluriNutritie(data).kcal);
  customConfirm(tr('Copiezi ziua de ieri?', 'Copy yesterday?'), tr(`${data.length} ${data.length === 1 ? 'aliment' : 'alimente'}, ${kcal} kcal, pe aceleași mese.`, `${data.length} ${data.length === 1 ? 'item' : 'items'}, ${kcal} kcal, on the same meals.`), async () => {
    const lista = data.map(x => ({ produs: Object.assign(produsDinJurnal(x), { cod: x.cod || null }), grame: Number(x.cantitate_g), masa: x.masa }));
    // Adăugarea rapidă (fără grame, cantitate_g = 1) se copiază ca atare, cu valorile ei
    const rapide = data.filter(x => Number(x.cantitate_g) === 1);
    const normale = lista.filter((_, i) => Number(data[i].cantitate_g) !== 1);
    const ok = (!normale.length || await insereazaInJurnal(normale, null)) && (!rapide.length || await insereazaRapide(rapide));
    if (ok) { showToast(tr('✓ Ziua de ieri copiată', '✓ Yesterday copied')); randeazaNutritieZi(); }
  });
}

async function insereazaRapide(randuri) {
  const c = dateClienta.fisa, zi = nutritie.zi || aziIsoAntrPers();
  const { data, error } = await supabaseClient.from('jurnal_alimente').insert(randuri.map(x => ({ user_id: c.user_id, client_id: c.id, data: zi, masa: x.masa,
    nume: x.nume, marca: '', cod: null, cantitate_g: 1, kcal: x.kcal, proteine: x.proteine, carbo: x.carbo, grasimi: x.grasimi, imagine: null }))).select();
  if (error || !data) { showToast(tr('Nu s-a putut adăuga. Verifică internetul.', 'Could not add. Check your internet.'), 'error'); return false; }
  nutritie.lista = nutritie.lista.concat(data);
  if (zi === aziIsoAntrPers()) nutritie.azi = totaluriAzi(nutritie.lista);
  return true;
}

// „Adaugă rapid”: doar calorii (și, dacă vrea, macronutrienții), fără produs; cantitate_g = 1 marchează rândul
function deschideAdaugaRapid(masa) {
  antrPers.ecran = 'nutritie-rapid';
  arataInapoiAntrPers();
  nutritie.masa = masa || nutritie.masa || masaImplicita();
  document.getElementById('clientaTitlu').innerText = tr('Adaugă rapid', 'Quick add');
  const camp = (id, et) => `<label>${et}<input type="number" inputmode="decimal" id="rapid_${id}" class="plan-ex-input" min="0"></label>`;
  document.getElementById('clientaContinut').innerHTML = `<div class="card obiectiv-form">
      <div class="acasa-antrenament-detalii" style="margin-bottom:8px;">${tr('Când nu știi produsul exact: scrii doar caloriile (de exemplu de la restaurant).', 'When you don’t know the exact product: enter just the calories (for example at a restaurant).')}</div>
      <div class="antr-pers-activitati" style="margin-bottom:8px;">${MESE_NUTRITIE.map(([cod, ro, en]) => `<button type="button" class="antr-pers-activitate${cod === nutritie.masa ? ' activ' : ''}" onclick="nutritie.masa='${cod}'; this.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('activ', b === this))">${tr(ro, en)}</button>`).join('')}</div>
      <div class="antr-pers-campuri"><label>${tr('Ce ai mâncat (opțional)', 'What you ate (optional)')}<input type="text" id="rapid_nume" class="plan-ex-input" maxlength="80" placeholder="${tr('ex. Pizza la restaurant', 'e.g. Pizza at a restaurant')}"></label></div>
      <div class="antr-pers-campuri">${camp('kcal', tr('Calorii (kcal) *', 'Calories (kcal) *'))}${camp('proteine', tr('Proteine (g)', 'Protein (g)'))}</div>
      <div class="antr-pers-campuri">${camp('carbo', tr('Carbohidrați (g)', 'Carbohydrates (g)'))}${camp('grasimi', tr('Grăsimi (g)', 'Fat (g)'))}</div>
      <div class="antr-pers-actiuni" style="margin:12px 0 0;">
        <button type="button" class="btn" onclick="salveazaAdaugaRapid(this)">${tr('Adaugă', 'Add')}</button>
        <button type="button" class="btn btn-clear" onclick="inapoiNutritie()">${tr('Renunță', 'Cancel')}</button>
      </div>
    </div>`;
}

async function salveazaAdaugaRapid(btn) {
  const n = id => { const x = parseFloat(String(document.getElementById('rapid_' + id).value).replace(',', '.')); return isNaN(x) || x < 0 ? 0 : rotunjeste1(x); };
  const kcal = n('kcal');
  if (!(kcal > 0 && kcal <= 5000)) return showToast(tr('Scrie caloriile (1–5000).', 'Enter the calories (1–5000).'), 'error');
  btn.disabled = true;
  const nume = (document.getElementById('rapid_nume').value || '').trim() || tr('Adăugare rapidă', 'Quick add');
  const ok = await insereazaRapide([{ masa: nutritie.masa, nume: nume.slice(0, 120), kcal, proteine: n('proteine'), carbo: n('carbo'), grasimi: n('grasimi') }]);
  btn.disabled = false;
  if (!ok) return;
  showToast(tr(`✓ ${Math.round(kcal)} kcal adăugate`, `✓ ${Math.round(kcal)} kcal added`));
  antrPers.ecran = 'nutritie';
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  randeazaNutritieZi();
}

// ---- Cantitatea: câte grame, cu calculul pe loc ----
function deschideCantitate(p) {
  nutritie.produs = p;
  antrPers.ecran = 'nutritie-cantitate';
  randeazaCantitate(p.portie_g || ((p.portii || [])[0] || {}).g || 100);
}

function randeazaCantitate(grame) {
  const p = nutritie.produs;
  const masa = MESE_NUTRITIE.find(m => m[0] === nutritie.masa) || MESE_NUTRITIE[1];
  document.getElementById('clientaTitlu').innerText = tr(masa[1], masa[2]);
  // Porțiile „ca acasă” (alimentele de bază) sau porția de pe ambalaj, apoi gramaje uzuale
  const portii = (p.portii || []).map(x => ({ g: Number(x.g), et: `${tr(x.ro, x.en)} · ${formatKg(Number(x.g))} g` }));
  if (p.portie_g && !portii.length) portii.push({ g: p.portie_g, et: `${tr('1 porție', '1 serving')} · ${formatKg(p.portie_g)} g` });
  const rapide = portii.concat([100, 50, 200].filter(g => !portii.some(x => x.g === g)).map(g => ({ g, et: `${g} g` }))).slice(0, 6);
  const fav = esteFavorit(p);
  document.getElementById('clientaContinut').innerHTML = `<div class="card nutritie-cantitate">
      <button type="button" class="nutritie-stea${fav ? ' activ' : ''}" onclick="comutaFavorit(this)" aria-label="${tr('Favorit', 'Favourite')}" title="${tr('Favorit', 'Favourite')}">${fav ? '★' : '☆'}</button>
      ${htmlCapProdus(p)}
      <div class="antr-pers-campuri" style="margin-top:12px;"><label>${tr('Cantitate (g)', 'Amount (g)')}
        <input type="number" inputmode="decimal" id="nutritieGrame" class="plan-ex-input" value="${grame}" oninput="actualizeazaCalculCantitate()"></label></div>
      <div class="antr-pers-activitati nutritie-portii" style="margin-top:8px;">${rapide.map(x => `<button type="button" class="antr-pers-activitate" onclick="document.getElementById('nutritieGrame').value=${x.g}; actualizeazaCalculCantitate()">${escAttr(x.et)}</button>`).join('')}</div>
      <div class="nutritie-calcul" id="nutritieCalcul"></div>
      ${htmlEticheta(p, false)}
      <div class="antr-pers-actiuni" style="margin:12px 0 0;">
        <button type="button" class="btn" onclick="adaugaInJurnal()">${tr(`Adaugă la ${masa[1].toLowerCase()}`, `Add to ${masa[2].toLowerCase()}`)}</button>
        <button type="button" class="btn btn-clear" onclick="deschideAdaugaAliment(nutritie.masa)">${tr('Înapoi', 'Back')}</button>
      </div>
    </div>`;
  actualizeazaCalculCantitate();
}

// Poza, numele, marca și Nutri-Score
function htmlCapProdus(p) {
  return `<div class="nutritie-produs-cap">
      ${htmlImagineProdus(p.imagine || p.imagineMare, 'mare')}
      <div class="nutritie-produs-text">
        <b class="nutritie-produs-nume">${escAttr(p.nume)}</b>
        ${p.marca ? `<div class="acasa-antrenament-detalii">${escAttr(p.marca)}</div>` : ''}
        ${htmlNutriScore(p.nutriscore)}
      </div>
    </div>`;
}

// Eticheta la 100 g, ca pe ambalaj (rândurile lipsă nu apar)
function htmlEticheta(p, deschisa) {
  const rand = (et, v, sub) => v === null || v === undefined ? '' : `<div class="nutritie-eticheta-rand${sub ? ' sub' : ''}"><span>${et}</span><b>${formatKg(v)} g</b></div>`;
  return `<details class="nutritie-eticheta"${deschisa ? ' open' : ''}>
      <summary>${tr('Valori nutriționale la 100 g', 'Nutrition facts per 100 g')}</summary>
      <div class="nutritie-eticheta-rand"><span>${tr('Energie', 'Energy')}</span><b>${Math.round(p.kcal)} kcal</b></div>
      ${rand(tr('Grăsimi', 'Fat'), p.grasimi)}${rand(tr('din care saturate', 'of which saturates'), p.saturate, true)}
      ${rand(tr('Carbohidrați', 'Carbohydrates'), p.carbo)}${rand(tr('din care zaharuri', 'of which sugars'), p.zaharuri, true)}
      ${rand(tr('Fibre', 'Fibre'), p.fibre)}${rand(tr('Proteine', 'Protein'), p.proteine)}${rand(tr('Sare', 'Salt'), p.sare)}
      ${p.sursa === 'off' ? `<div class="nutritie-sursa" style="margin-top:6px;">${tr('Sursa: Open Food Facts', 'Source: Open Food Facts')}</div>`
        : p.sursa === 'baza' ? `<div class="nutritie-sursa" style="margin-top:6px;">${tr('Sursa: USDA FoodData Central', 'Source: USDA FoodData Central')}</div>` : ''}
    </details>`;
}

// Caloriile mari și plăcile macronutrienților pentru g grame, cu partea lor din calorii (4 / 4 / 9 kcal pe gram)
function htmlCalculProdus(p, g) {
  const v = valoriPentruGrame(p, g);
  const kcalMacro = { proteine: v.proteine * 4, carbo: v.carbo * 4, grasimi: v.grasimi * 9 };
  const totalMacro = kcalMacro.proteine + kcalMacro.carbo + kcalMacro.grasimi;
  const placa = (cheie, ro, en) => `<div class="nutritie-macro ${cheie}"><span>${tr(ro, en)}</span><b>${formatKg(v[cheie])} g</b>
    <i style="width:${totalMacro ? Math.round(kcalMacro[cheie] / totalMacro * 100) : 0}%"></i></div>`;
  return `<div class="nutritie-kcal-mare"><b>${Math.round(v.kcal)}</b> kcal <span>${tr(`pentru ${formatKg(g)} g`, `for ${formatKg(g)} g`)}</span></div>
    <div class="nutritie-macro-uri">${placa('proteine', 'Proteine', 'Protein')}${placa('carbo', 'Carbohidrați', 'Carbohydrates')}${placa('grasimi', 'Grăsimi', 'Fat')}</div>`;
}

function valoriPentruGrame(p, g) {
  const k = g / 100;
  return { kcal: rotunjeste1(p.kcal * k), proteine: rotunjeste1(p.proteine * k), carbo: rotunjeste1(p.carbo * k), grasimi: rotunjeste1(p.grasimi * k) };
}

function actualizeazaCalculCantitate() {
  const g = parseFloat(String(document.getElementById('nutritieGrame').value).replace(',', '.')) || 0;
  const v = valoriPentruGrame(nutritie.produs, g);
  // Și ce rămâne din ținta de azi
  const s = nutritie.setari || {};
  const deja = nutritie.zi === aziIsoAntrPers() && nutritie.azi ? nutritie.azi.kcal : 0;
  document.getElementById('nutritieCalcul').innerHTML = `${htmlCalculProdus(nutritie.produs, g)}
    ${s.kcal ? `<div class="acasa-antrenament-detalii nutritie-dupa">${tr(`Azi, după asta: ${Math.round(deja + v.kcal)} din ${s.kcal} kcal`, `Today, after this: ${Math.round(deja + v.kcal)} of ${s.kcal} kcal`)}</div>` : ''}`;
}

async function adaugaInJurnal() {
  const p = nutritie.produs;
  const g = parseFloat(String(document.getElementById('nutritieGrame').value).replace(',', '.'));
  if (!(g > 0 && g <= 5000)) return showToast(tr('Scrie cantitatea în grame.', 'Enter the amount in grams.'), 'error');
  if (!(await insereazaInJurnal([{ produs: p, grame: g }], nutritie.masa))) return;
  const kcal = Math.round(valoriPentruGrame(p, g).kcal);
  showToast(tr(`✓ ${p.nume}: ${kcal} kcal`, `✓ ${p.nume}: ${kcal} kcal`));
  antrPers.ecran = 'nutritie';
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  randeazaNutritieZi();
}

// ---- Produs nou (lipsește din liste): rămâne în baza comună, pentru toți ----
function deschideProdusNou(p) {
  nutritie.produs = p || {};
  antrPers.ecran = 'nutritie-produs';
  const x = nutritie.produs;
  const camp = (id, et, v, mod) => `<label>${et}<input type="${mod || 'text'}" inputmode="${mod === 'text' ? 'text' : 'decimal'}" id="produsNou_${id}" class="plan-ex-input" value="${v ?? ''}"></label>`;
  document.getElementById('clientaTitlu').innerText = tr('Produs nou', 'New product');
  document.getElementById('clientaContinut').innerHTML = `<div class="card obiectiv-form">
      <div class="acasa-antrenament-detalii" style="margin-bottom:8px;">${tr('Valorile de pe etichetă, la 100 g. Produsul rămâne salvat și pentru ceilalți clienți.', 'Values from the label, per 100 g. The product stays saved for other clients too.')}</div>
      <div class="antr-pers-campuri">${camp('nume', tr('Nume *', 'Name *'), escAttr(x.nume || ''), 'text')}</div>
      <div class="antr-pers-campuri">${camp('marca', tr('Marcă', 'Brand'), escAttr(x.marca || ''), 'text')}${camp('cod', tr('Cod de bare', 'Barcode'), escAttr(x.cod || ''), 'text')}</div>
      <div class="antr-pers-campuri">${camp('kcal', tr('Calorii (kcal) *', 'Calories (kcal) *'), x.kcal ?? '')}${camp('proteine', tr('Proteine (g)', 'Protein (g)'), x.proteine ?? '')}</div>
      <div class="antr-pers-campuri">${camp('carbo', tr('Carbohidrați (g)', 'Carbohydrates (g)'), x.carbo ?? '')}${camp('grasimi', tr('Grăsimi (g)', 'Fat (g)'), x.grasimi ?? '')}</div>
      <div class="antr-pers-campuri">${camp('portie', tr('Porție (g, opțional)', 'Serving (g, optional)'), x.portie_g ?? '')}</div>
      <div class="antr-pers-actiuni" style="margin:12px 0 0;">
        <button type="button" class="btn" onclick="salveazaProdusNou()">${tr('Salvează produsul', 'Save product')}</button>
        <button type="button" class="btn btn-clear" onclick="deschideAdaugaAliment(nutritie.masa)">${tr('Renunță', 'Cancel')}</button>
      </div>
    </div>`;
}

async function salveazaProdusNou() {
  const v = id => (document.getElementById('produsNou_' + id).value || '').trim();
  const n = id => { const x = parseFloat(v(id).replace(',', '.')); return isNaN(x) ? null : x; };
  const rand = { nume: v('nume').slice(0, 120), marca: v('marca').slice(0, 80), cod: v('cod').replace(/\D/g, '') || null,
    kcal: n('kcal'), proteine: n('proteine') || 0, carbo: n('carbo') || 0, grasimi: n('grasimi') || 0, portie_g: n('portie') };
  if (!rand.nume) return showToast(tr('Scrie numele produsului.', 'Enter the product name.'), 'error');
  if (rand.kcal === null || rand.kcal < 0 || rand.kcal > 1000) return showToast(tr('Scrie caloriile la 100 g (de pe etichetă).', 'Enter the calories per 100 g (from the label).'), 'error');
  if (rand.cod && !/^\d{6,14}$/.test(rand.cod)) rand.cod = null;
  if ([rand.proteine, rand.carbo, rand.grasimi].some(x => x < 0 || x > 100)) return showToast(tr('Proteinele, carbohidrații și grăsimile: între 0 și 100 g.', 'Protein, carbs and fat: between 0 and 100 g.'), 'error');
  const { data, error } = await supabaseClient.from('alimente').insert(rand).select().single();
  // Codul există deja (l-a adăugat altcineva între timp): folosim produsul lor
  if (error && rand.cod && /duplicate|unique/i.test(error.message || '')) return gasesteDupaCod(rand.cod);
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  showToast(tr('✓ Produs salvat', '✓ Product saved'));
  deschideCantitate(Object.assign({}, data, { kcal: Number(data.kcal), proteine: Number(data.proteine), carbo: Number(data.carbo), grasimi: Number(data.grasimi), sursa: 'propriu' }));
}

// ---- Scanarea codului de bare: BarcodeDetector unde există (Android, Chrome), altfel ZXing (iPhone), încărcat doar acum ----
let scanare = null; // { stream, video, oprit, cititor }

function incarcaZxing() {
  if (window.ZXing) return Promise.resolve();
  return new Promise((ok, eroare) => {
    const s = document.createElement('script');
    s.src = 'vendor/zxing-library-0.21.3.min.js';
    s.onload = ok;
    s.onerror = eroare;
    document.head.appendChild(s);
  });
}

async function pornesteScanare() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return showToast(tr('Camera nu e disponibilă pe acest dispozitiv. Caută produsul după nume.', 'The camera isn’t available on this device. Search the product by name.'), 'error');
  }
  const strat = document.createElement('div');
  strat.id = 'scanareStrat';
  strat.className = 'scanare-strat';
  strat.innerHTML = `<video playsinline muted autoplay></video>
    <div class="scanare-cadru"></div>
    <div class="scanare-jos">
      <div>${tr('Ține codul de bare în cadru', 'Keep the barcode inside the frame')}</div>
      <div class="antr-pers-adauga" style="margin:10px 0 0;">
        <input type="text" inputmode="numeric" id="scanareCodManual" class="plan-ex-input" maxlength="14" placeholder="${tr('sau scrie codul', 'or type the code')}">
        <button type="button" class="btn" onclick="codManualScanare()">OK</button>
      </div>
      <button type="button" class="btn btn-clear" style="width:100%; margin-top:8px;" onclick="opresteScanare()">${tr('Închide', 'Close')}</button>
    </div>`;
  document.body.appendChild(strat);
  const video = strat.querySelector('video');
  scanare = { video, oprit: false, stream: null, cititor: null };
  try {
    const formate = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
    const areDetector = 'BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats().catch(() => [])).some(f => formate.includes(f));
    if (areDetector) {
      scanare.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = scanare.stream;
      await video.play().catch(() => {});
      const detector = new BarcodeDetector({ formats: formate });
      const bucla = async () => {
        if (!scanare || scanare.oprit) return;
        const coduri = await detector.detect(video).catch(() => []);
        if (coduri.length && /^\d{6,14}$/.test(coduri[0].rawValue)) return codGasitScanare(coduri[0].rawValue);
        setTimeout(bucla, 250);
      };
      bucla();
    } else {
      await incarcaZxing();
      if (!scanare || scanare.oprit) return;
      const indicii = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]]]);
      scanare.cititor = new ZXing.BrowserMultiFormatReader(indicii, 300);
      await scanare.cititor.decodeFromConstraints({ video: { facingMode: 'environment' }, audio: false }, video, (rezultat) => {
        if (rezultat && scanare && !scanare.oprit && /^\d{6,14}$/.test(rezultat.getText())) codGasitScanare(rezultat.getText());
      });
    }
  } catch (e) {
    // Fără cameră (permisiune refuzată): fereastra rămâne pentru codul scris de mână
    const s = scanare && scanare.stream;
    if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
    strat.classList.add('fara-camera');
    strat.querySelector('.scanare-jos > div').textContent = tr('Nu am putut porni camera. Dă voie aplicației să folosească camera (setările telefonului) sau scrie codul de sub bare.', 'Couldn’t start the camera. Allow camera access (phone settings) or type the code under the bars.');
  }
}

function opresteScanare() {
  if (scanare) {
    scanare.oprit = true;
    try { scanare.cititor && scanare.cititor.reset(); } catch (e) {}
    const s = scanare.stream || (scanare.video && scanare.video.srcObject);
    if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
  }
  scanare = null;
  document.getElementById('scanareStrat')?.remove();
}

function codGasitScanare(cod) {
  if (navigator.vibrate) navigator.vibrate(60);
  opresteScanare();
  gasesteDupaCod(cod);
}

function codManualScanare() {
  const cod = (document.getElementById('scanareCodManual').value || '').replace(/\D/g, '');
  if (!/^\d{6,14}$/.test(cod)) return showToast(tr('Codul are între 6 și 14 cifre.', 'The code has 6 to 14 digits.'), 'error');
  codGasitScanare(cod);
}

// ---- Antrenorul: meniu › Verifică un produs. Scanare sau căutare, doar ca să vadă eticheta (nu se notează nicăieri) ----
let verificare = { cautare: '', rezultate: [], produs: null, negasit: '' };

function deschideVerificaProdus() {
  verificare = { cautare: '', rezultate: [], produs: null, negasit: '' };
  navigheazaSubMeniu('verificaProdus');
  randeazaVerificaProdus();
}

function randeazaVerificaProdus() {
  const el = document.getElementById('verificaProdusContinut');
  if (!el) return;
  const v = verificare;
  if (v.produs) {
    const p = v.produs;
    el.innerHTML = `<button type="button" class="btn btn-clear" onclick="verificare.produs = null; randeazaVerificaProdus()">‹ ${tr('Alt produs', 'Another product')}</button>
      <div class="card nutritie-cantitate">
        ${htmlCapProdus(p)}
        <div class="nutritie-calcul">${htmlCalculProdus(p, 100)}
          ${p.portie_g && p.portie_g !== 100 ? `<div class="acasa-antrenament-detalii nutritie-dupa">${tr(`O porție (${formatKg(p.portie_g)} g): ${Math.round(valoriPentruGrame(p, p.portie_g).kcal)} kcal`, `One serving (${formatKg(p.portie_g)} g): ${Math.round(valoriPentruGrame(p, p.portie_g).kcal)} kcal`)}</div>` : ''}
        </div>
        ${htmlEticheta(p, true)}
      </div>`;
    return;
  }
  el.innerHTML = `<div class="acasa-antrenament-detalii">${tr('Vezi eticheta unui produs, de exemplu ca să-i spui unui client dacă e o alegere bună. Nu se salvează nimic.', 'See a product’s label, for example to tell a client whether it is a good choice. Nothing is saved.')}</div>
    <button type="button" class="btn nutritie-scaneaza" onclick="pornesteScanare()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>
      ${tr('Scanează codul de bare', 'Scan the barcode')}</button>
    <div class="antr-pers-adauga">
      <input type="search" id="verificaCauta" class="plan-ex-input" maxlength="60" value="${escAttr(v.cautare)}" placeholder="${tr('Caută produsul (ex: iaurt grecesc)', 'Search the product (e.g. greek yogurt)')}" onkeydown="if (event.key === 'Enter') cautaVerificaProdus()">
      <button type="button" class="btn" onclick="cautaVerificaProdus()">${tr('Caută', 'Search')}</button>
    </div>
    ${v.negasit ? `<div class="progres-gol">${escAttr(v.negasit)}</div>` : ''}
    ${v.rezultate === 'cautare' ? `<div class="progres-gol">${tr('Se caută...', 'Searching...')}</div>`
      : v.rezultate.length ? v.rezultate.map((p, i) => htmlProdusRand(p, i, 'verificare')).join('')
      : v.cautare ? `<div class="progres-gol">${tr('Nu am găsit produsul.', 'Product not found.')}</div>` : ''}`;
}

async function cautaVerificaProdus() {
  const q = (document.getElementById('verificaCauta').value || '').trim();
  if (q.length < 2) return;
  verificare.cautare = q;
  verificare.negasit = '';
  verificare.rezultate = 'cautare';
  randeazaVerificaProdus();
  verificare.rezultate = await cautaProduse(q);
  randeazaVerificaProdus();
}

async function verificaProdusCod(cod) {
  const { produs, complet } = await produsDupaCod(cod);
  verificare.negasit = complet ? '' : produs
    ? tr(`„${produs.nume}”: produsul nu are valorile nutriționale în Open Food Facts.`, `“${produs.nume}”: the product has no nutrition data in Open Food Facts.`)
    : tr(`Codul ${cod} nu e în Open Food Facts.`, `Code ${cod} is not in Open Food Facts.`);
  verificare.produs = complet ? produs : null;
  randeazaVerificaProdus();
}

// Înapoi din ecranele de nutriție: din adăugare/cantitate/produs nou la ziua deschisă, din zi la Acasă
function inapoiNutritie() {
  opresteScanare();
  if (['nutritie-reteta', 'nutritie-reteta-editor', 'nutritie-cumparaturi'].includes(antrPers.ecran)) {
    if (antrPers.ecran === 'nutritie-reteta-editor' && retete.editor && retete.editor.id) { retete.vedere = 'reteta'; antrPers.ecran = 'nutritie-reteta'; }
    else { retete.vedere = 'lista'; antrPers.ecran = 'nutritie-retete'; }
    return randeazaRetete();
  }
  if (antrPers.ecran !== 'nutritie') { antrPers.ecran = 'nutritie'; document.getElementById('clientaBtnInapoi').style.visibility = 'hidden'; randeazaNutritieZi(); return; }
  antrPers.ecran = null;
  randeazaHomeClienta();
}

// ---- La antrenor (Fișă › Progres): țintele clientului și ultimele 7 zile din jurnal ----
let nutritieFisa = null; // { client, setari, zile: [{ data, totaluri, randuri }] }

function htmlNutritieAntrenor() {
  const n = nutritieFisa;
  if (!n) return '';
  const s = n.setari || {};
  const ascuns = s.vizibil_antrenor === false;
  const zile = n.zile.map(z => `<details class="card antr-pers-antrenor"><summary><span class="acasa-eticheta">${escAttr(etichetaDataAntrPers(z.data))}</span>
      <b>${Math.round(z.totaluri.kcal)}${s.kcal ? ` / ${s.kcal}` : ''} kcal</b> <span class="acasa-antrenament-detalii">${tr('Proteine', 'Protein')} ${Math.round(z.totaluri.proteine)} g · ${tr('Carbohidrați', 'Carbohydrates')} ${Math.round(z.totaluri.carbo)} g · ${tr('Grăsimi', 'Fat')} ${Math.round(z.totaluri.grasimi)} g</span></summary>
      <ul>${z.randuri.map(x => `<li>${escAttr((MESE_NUTRITIE.find(m => m[0] === x.masa) || [, ''])[1])}: ${escAttr(x.nume)} · ${formatKg(Number(x.cantitate_g))} g · ${Math.round(x.kcal)} kcal</li>`).join('')}</ul>
    </details>`).join('');
  return `<div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Nutriție', 'Nutrition')}</div>
    <div class="antr-pers-campuri nutritie-tinte">
      ${[['kcal', tr('Calorii (kcal)', 'Calories (kcal)')], ['proteine', tr('Proteine (g)', 'Protein (g)')], ['carbo', tr('Carbohidrați (g)', 'Carbohydrates (g)')], ['grasimi', tr('Grăsimi (g)', 'Fat (g)')]].map(([k, et]) =>
        `<label>${et}<input type="number" inputmode="numeric" id="tintaNutA_${k}" class="plan-ex-input" value="${s[k] ?? ''}"></label>`).join('')}
    </div>
    <button type="button" class="btn btn-clear" style="margin:8px 0; width:100%;" onclick="salveazaTinteNutritieAntrenor()">${tr('Salvează țintele zilnice', 'Save daily targets')}</button>
    ${htmlAdaptiv(n.adaptiv, s, (n.client.fisaInscriere || {}).inaltime, true)}
    ${ascuns ? `<div class="progres-gol">${tr('Clientul a ascuns jurnalul alimentar.', 'The client has hidden their food log.')}</div>`
      : `<div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Rapoarte', 'Reports')}</div>
        <div id="raportNutritieFisa">${htmlRapoarte()}</div>
        <div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Ultimele 7 zile', 'Last 7 days')}</div>
        ${zile || `<div class="progres-gol">${tr('Nimic notat în ultimele 7 zile.', 'Nothing logged in the last 7 days.')}</div>`}`}`;
}

// Ultimele 30 de zile: rapoartele (7 / 30) și, dedesubt, alimentele din ultimele 7 zile
async function incarcaNutritieAntrenor(client) {
  const iso = isoDinData(new Date(Date.now() - 30 * 86400000)), iso7 = isoDinData(new Date(Date.now() - 6 * 86400000));
  const [resJ, resS, resA] = await Promise.all([
    supabaseClient.from('jurnal_alimente').select('*').eq('client_id', client.id).gte('data', iso).order('data', { ascending: false }).order('created_at'),
    supabaseClient.from('setari_nutritie').select('*').eq('client_id', client.id).maybeSingle(),
    supabaseClient.from('apa_zilnica').select('data, pahare').eq('client_id', client.id).gte('data', iso)
  ]);
  if (resJ.error && resS.error) { nutritieFisa = null; return; }
  const peZi = new Map();
  (resJ.data || []).filter(x => x.data >= iso7).forEach(x => { if (!peZi.has(x.data)) peZi.set(x.data, []); peZi.get(x.data).push(x); });
  nutritieFisa = { client, setari: resS.data || null, zile: [...peZi.entries()].map(([data, randuri]) => ({ data, randuri, totaluri: totaluriNutritie(randuri) })),
    adaptiv: await incarcaDateAdaptive(client.id) };
  Object.assign(raport, { jurnal: resJ.error ? null : (resJ.data || []), apa: resA.error ? [] : (resA.data || []),
    setari: nutritieFisa.setari, adaptiv: nutritieFisa.adaptiv, nume: client.nume || '', unde: 'antrenor' });
}

async function salveazaTinteNutritieAntrenor() {
  const n = nutritieFisa;
  if (!n) return;
  const v = k => { const x = parseInt(document.getElementById('tintaNutA_' + k).value, 10); return isNaN(x) ? null : x; };
  const camp = { kcal: v('kcal'), proteine: v('proteine'), carbo: v('carbo'), grasimi: v('grasimi') };
  if (camp.kcal !== null && (camp.kcal < 500 || camp.kcal > 10000)) return showToast(tr('Caloriile: între 500 și 10.000.', 'Calories: between 500 and 10,000.'), 'error');
  const q = n.setari ? supabaseClient.from('setari_nutritie').update(camp).eq('client_id', n.client.id)
    : supabaseClient.from('setari_nutritie').insert(Object.assign({ client_id: n.client.id, user_id: utilizatorCurent.id }, camp));
  const { data, error } = await q.select().single();
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  n.setari = data;
  raport.setari = data;
  showToast(tr('✓ Ținte salvate', '✓ Targets saved'));
  incarcaProgresFisa(); // zilele din jurnal se arată față de țintele noi
}

// ---- Ciclu menstrual (sql/2026-11-05_ciclu.sql): opțional, pornit de client din Setări, cu acord explicit ----
// Faza se estimează din prima zi a ultimei menstruații și durata ciclului (media ultimelor cicluri, altfel cea setată).
// Antrenorul vede faza și check-in-urile doar dacă clientul pornește „Vizibil antrenorului”.
const FAZE_CICLU = {
  menstruala: ['Faza menstruală', 'Menstrual phase', 'Energia poate fi mai scăzută: antrenament mai ușor, mobilitate, ascultă-ți corpul.', 'Energy may be lower: lighter training and mobility; listen to your body.'],
  foliculara: ['Faza foliculară', 'Follicular phase', 'Energia crește de obicei: zi bună pentru greutăți mai mari și intensitate.', 'Energy usually rises: a good time for heavier weights and intensity.'],
  ovulatie: ['Ovulație', 'Ovulation', 'Forța e de obicei la vârf; încălzește-te bine înainte de greutățile mari.', 'Strength is usually at its peak; warm up well before heavy lifts.'],
  luteala: ['Faza luteală', 'Luteal phase', 'E normal să ai mai puțină energie spre final: păstrează greutățile, pauze mai lungi între serii.', 'Lower energy towards the end is normal: keep the weights, take longer rests.']
};
const SIMPTOME_CICLU = [
  ['crampe', 'Crampe', 'Cramps'], ['balonare', 'Balonare', 'Bloating'], ['dureri_cap', 'Dureri de cap', 'Headache'], ['oboseala', 'Oboseală', 'Fatigue'],
  ['pofte', 'Pofte', 'Cravings'], ['dispozitie', 'Schimbări de dispoziție', 'Mood swings'], ['sani', 'Sâni sensibili', 'Tender breasts'], ['acnee', 'Acnee', 'Acne']
];
// setari: undefined = neîncărcat, null = urmărirea e oprită
let ciclu = { setari: undefined, menstruatii: [], zilnic: [], formular: null };

function isoDinData(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function zileIntre(isoA, isoB) {
  return Math.round((dataDinIso(isoB) - dataDinIso(isoA)) / 86400000);
}

// { zi, durata, faza, urmatoarea, intarziere } sau null fără nicio menstruație notată. menstruatii: data_start, descrescător
function calculeazaCiclu(setari, menstruatii, aziIso) {
  const starturi = (menstruatii || []).map(m => m.data_start).filter(d => d <= aziIso);
  if (!setari || !starturi.length) return null;
  const intervale = [];
  for (let i = 0; i < starturi.length - 1 && intervale.length < 6; i++) {
    const n = zileIntre(starturi[i + 1], starturi[i]);
    if (n >= 18 && n <= 50) intervale.push(n);
  }
  const durata = intervale.length >= 2 ? Math.round(intervale.reduce((a, b) => a + b, 0) / intervale.length) : setari.durata_ciclu;
  const zi = zileIntre(starturi[0], aziIso) + 1;
  const ovulatie = durata - 14;
  const faza = zi <= setari.durata_menstruatie ? 'menstruala' : zi < ovulatie - 1 ? 'foliculara' : zi <= ovulatie + 1 ? 'ovulatie' : 'luteala';
  const urm = dataDinIso(starturi[0]); urm.setDate(urm.getDate() + durata);
  return { zi, durata, faza, urmatoarea: isoDinData(urm), intarziere: zi > durata ? zi - durata : 0, automat: intervale.length >= 2 };
}

async function incarcaCicluClient() {
  if (!supabaseClient || !dateClienta.fisa) return;
  const id = dateClienta.fisa.id;
  const { data: s, error } = await supabaseClient.from('ciclu_setari').select('*').eq('client_id', id).maybeSingle();
  if (error) return; // fără tabel (SQL nerulat) sau fără rețea: cardul nu apare
  if (!s) { ciclu.setari = null; ciclu.menstruatii = []; ciclu.zilnic = []; return; }
  const de = new Date(); de.setDate(de.getDate() - 6);
  const [resM, resZ] = await Promise.all([
    supabaseClient.from('ciclu_menstruatii').select('*').eq('client_id', id).order('data_start', { ascending: false }).limit(13),
    supabaseClient.from('ciclu_zilnic').select('*').eq('client_id', id).gte('data', isoDinData(de)).order('data', { ascending: false })
  ]);
  ciclu.setari = s;
  if (!resM.error) ciclu.menstruatii = resM.data || [];
  if (!resZ.error) ciclu.zilnic = resZ.data || [];
}

function textEstimareCiclu(c) {
  if (c.intarziere) return tr(`Ziua ${c.zi} · cu ${c.intarziere} ${c.intarziere === 1 ? 'zi' : 'zile'} peste durata obișnuită`, `Day ${c.zi} · ${c.intarziere} ${c.intarziere === 1 ? 'day' : 'days'} past your usual length`);
  const ramase = c.durata - c.zi + 1;
  return tr(`Ziua ${c.zi} din ~${c.durata} · următorul ciclu în ~${ramase} ${ramase === 1 ? 'zi' : 'zile'}`, `Day ${c.zi} of ~${c.durata} · next cycle in ~${ramase} ${ramase === 1 ? 'day' : 'days'}`);
}

// Acasă: faza de azi, lângă antrenamentul zilei (doar dacă urmărirea e pornită)
function htmlCicluAcasa() {
  if (!ciclu.setari) return '<div id="cardCicluAcasa"></div>';
  const c = calculeazaCiclu(ciclu.setari, ciclu.menstruatii, aziIsoAntrPers());
  const facut = ciclu.zilnic.some(z => z.data === aziIsoAntrPers());
  const f = c && FAZE_CICLU[c.faza];
  return `<div class="acasa-rand ciclu-acasa${c ? ' faza-' + c.faza : ''}" id="cardCicluAcasa" onclick="deschideCiclu()">
    <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16"/></svg></span>
    <div class="acasa-rand-text"><div class="acasa-eticheta">${tr('Ciclu', 'Cycle')}</div>
    <b>${f ? tr(f[0], f[1]) : tr('Notează prima zi a menstruației', 'Log the first day of your period')}</b>
    <div class="acasa-antrenament-detalii">${f ? `${textEstimareCiclu(c)}<br>${tr(f[2], f[3])}` : tr('Din ea se estimează faza și următorul ciclu.', 'It is used to estimate your phase and next cycle.')}</div></div>
    ${facut ? '<div class="drawer-nav-arrow">›</div>' : `<button type="button" class="btn btn-clear" style="white-space:nowrap;" onclick="event.stopPropagation(); deschideCiclu()">${tr('Check-in', 'Check-in')}</button>`}
  </div>`;
}

// Din Setări › Ciclu menstrual (și de pe cardul de pe Acasă)
async function deschideCiclu() {
  if (clientaTabCurent !== 'acasa') clientaTab('acasa');
  antrPers.ecran = 'ciclu';
  ciclu.formular = null;
  dateClienta.planCurent = null;
  arataInapoiAntrPers();
  document.getElementById('clientaTitlu').innerText = tr('Ciclu', 'Cycle');
  if (ciclu.setari === undefined) document.getElementById('clientaContinut').innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  else randeazaCiclu();
  await incarcaCicluClient();
  if (antrPers.ecran === 'ciclu') randeazaCiclu();
}

function htmlScalaCiclu(camp, valoare) {
  let h = '';
  for (let n = 1; n <= 5; n++) h += `<button type="button" class="checkin-scala-btn${valoare === n ? ' active' : ''}" onclick="ciclu.formular.${camp} = ${n}; randeazaCiclu()">${n}</button>`;
  return `<div class="checkin-scala" style="grid-template-columns: repeat(5, 1fr);">${h}</div>`;
}

function randeazaCiclu() {
  const el = document.getElementById('clientaContinut');
  const azi = aziIsoAntrPers();
  if (!ciclu.setari) {
    el.innerHTML = `<div class="card ciclu-intro">
        <b>${tr('Urmărește-ți ciclul', 'Track your cycle')}</b>
        <p>${tr('Notezi prima zi a menstruației și, dacă vrei, cum te simți în fiecare zi. Aplicația estimează faza și îți spune pe Acasă la ce să te aștepți la antrenament.', 'Log the first day of your period and, if you like, how you feel each day. The app estimates your phase and shows on Home what to expect in training.')}</p>
        <p>${tr('Datele sunt doar ale tale. Antrenorul le vede doar dacă pornești „Vizibil antrenorului”. Le poți șterge oricând.', 'The data is yours only. Your trainer sees it only if you turn on “Visible to my trainer”. You can delete it anytime.')}</p>
        <label class="antr-pers-campuri ciclu-camp">${tr('Prima zi a ultimei menstruații (opțional)', 'First day of your last period (optional)')}
          <input type="date" id="cicluStartNou" class="plan-ex-input" max="${azi}"></label>
        <label class="checkin-bifa"><input type="checkbox" id="cicluAcord"><span>${tr('Sunt de acord ca B-Fit să stocheze aceste date despre sănătate, pentru antrenamentul meu (', 'I agree that B-Fit stores this health data for my training (')}<a href="confidentialitate.html" target="_blank" rel="noopener">${tr('confidențialitate', 'privacy')}</a>).</span></label>
        <button type="button" class="btn profile-save-btn" onclick="pornesteCiclu(this)">${tr('Pornește', 'Turn on')}</button>
        <div class="nutritie-sursa">${tr('Estimările nu sunt sfat medical și nu sunt o metodă de contracepție.', 'Estimates are not medical advice and not a method of contraception.')}</div>
      </div>`;
    return;
  }
  const s = ciclu.setari;
  const c = calculeazaCiclu(s, ciclu.menstruatii, azi);
  const f = c && FAZE_CICLU[c.faza];
  const deAzi = ciclu.zilnic.find(z => z.data === azi);
  if (!ciclu.formular) ciclu.formular = { energie: deAzi?.energie ?? null, somn: deAzi?.somn ?? null, simptome: [...(deAzi?.simptome || [])] };
  const fo = ciclu.formular;
  let html = `<div class="card ciclu-faza${c ? ' faza-' + c.faza : ''}">
      ${f ? `<div class="acasa-eticheta">${tr('Azi', 'Today')}</div><b>${tr(f[0], f[1])}</b>
        <div class="acasa-antrenament-detalii">${textEstimareCiclu(c)}</div><p>${tr(f[2], f[3])}</p>`
      : `<b>${tr('Notează prima zi a menstruației', 'Log the first day of your period')}</b><div class="acasa-antrenament-detalii">${tr('Din ea se estimează faza și următorul ciclu.', 'It is used to estimate your phase and next cycle.')}</div>`}
      <div class="ciclu-start">
        <input type="date" id="cicluStart" class="plan-ex-input" value="${azi}" max="${azi}">
        <button type="button" class="btn" style="white-space:nowrap;" onclick="noteazaStartCiclu(this)">${tr('A început menstruația', 'Period started')}</button>
      </div>
    </div>
    <div class="antr-pers-sectiune">${tr('Cum te simți azi?', 'How do you feel today?')}</div>
    <div class="card ciclu-checkin">
      <div class="checkin-eticheta">${tr('Energie', 'Energy')} <small>(1 = ${tr('foarte scăzută', 'very low')}, 5 = ${tr('foarte bună', 'very good')})</small></div>
      ${htmlScalaCiclu('energie', fo.energie)}
      <div class="checkin-eticheta">${tr('Somn', 'Sleep')} <small>(1 = ${tr('foarte prost', 'very poor')}, 5 = ${tr('foarte bun', 'very good')})</small></div>
      ${htmlScalaCiclu('somn', fo.somn)}
      <div class="checkin-eticheta">${tr('Simptome', 'Symptoms')}</div>
      <div class="ciclu-simptome">${SIMPTOME_CICLU.map(([id, ro, en]) => `<button type="button" class="ciclu-simptom${fo.simptome.includes(id) ? ' active' : ''}" onclick="comutaSimptomCiclu('${id}')">${tr(ro, en)}</button>`).join('')}</div>
      <button type="button" class="btn profile-save-btn" onclick="salveazaCicluZilnic(this)">${deAzi ? tr('Actualizează', 'Update') : tr('Salvează', 'Save')}</button>
    </div>`;
  if (ciclu.menstruatii.length) {
    html += `<div class="antr-pers-sectiune">${tr('Istoric', 'History')}</div><div class="card">
      ${ciclu.menstruatii.slice(0, 12).map((m, i) => {
        const urm = ciclu.menstruatii[i - 1];
        const lung = urm ? zileIntre(m.data_start, urm.data_start) : null;
        return `<div class="nutritie-rand"><div><div class="nutritie-rand-nume">${escAttr(etichetaDataAntrPers(m.data_start))}</div>
          <div class="acasa-antrenament-detalii">${lung ? tr(`ciclu de ${lung} zile`, `${lung}-day cycle`) : tr('ciclul curent', 'current cycle')}</div></div>
          <button type="button" class="notificare-x nutritie-sterge" onclick="stergeStartCiclu('${m.id}')" aria-label="${tr('Șterge', 'Delete')}">×</button></div>`;
      }).join('')}</div>`;
  }
  html += `<div class="antr-pers-sectiune">${tr('Setări', 'Settings')}</div><div class="card">
      <div class="antr-pers-campuri nutritie-tinte">
        <label>${tr('Ciclul (zile)', 'Cycle (days)')}<input type="number" inputmode="numeric" id="cicluDurata" class="plan-ex-input" min="21" max="45" value="${s.durata_ciclu}"></label>
        <label>${tr('Menstruația (zile)', 'Period (days)')}<input type="number" inputmode="numeric" id="cicluMenstruatie" class="plan-ex-input" min="2" max="10" value="${s.durata_menstruatie}"></label>
      </div>
      ${c && c.automat ? `<div class="acasa-antrenament-detalii" style="margin-top:6px;">${tr(`După istoricul tău, ciclul are în medie ${c.durata} zile, iar estimarea folosește media. Durata de mai sus contează doar până ai 3 menstruații notate.`, `From your history your cycle averages ${c.durata} days and the estimate uses that average. The length above only counts until you have 3 periods logged.`)}</div>` : ''}
      <button type="button" class="btn btn-clear" style="margin-top:8px; width:100%;" onclick="salveazaSetariCiclu(this)">${tr('Salvează', 'Save')}</button>
      <label class="setare-notificare" style="margin-top:6px;">
        <span><b>${tr('Vizibil antrenorului', 'Visible to my trainer')}</b><small>${tr('Antrenorul vede faza și cum te simți, ca să-ți adapteze antrenamentul.', 'Your trainer sees your phase and how you feel, to adapt your training.')}</small></span>
        <input type="checkbox" class="comutator" ${s.vizibil_antrenor ? 'checked' : ''} onchange="seteazaVizibilCiclu(this.checked, this)">
      </label>
      <button type="button" class="btn btn-clear ciclu-opreste" onclick="opresteCiclu()">${tr('Oprește și șterge datele', 'Turn off and delete data')}</button>
    </div>
    <div class="nutritie-sursa">${tr('Estimările nu sunt sfat medical și nu sunt o metodă de contracepție.', 'Estimates are not medical advice and not a method of contraception.')}</div>`;
  el.innerHTML = html;
}

function eroareCiclu() {
  showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
}

async function pornesteCiclu(btn) {
  if (!document.getElementById('cicluAcord').checked) return showToast(tr('Bifează acordul ca să pornești.', 'Tick the consent box to turn it on.'), 'error');
  const c = dateClienta.fisa;
  const start = document.getElementById('cicluStartNou').value;
  btn.disabled = true;
  const { data, error } = await supabaseClient.from('ciclu_setari').insert({ client_id: c.id, user_id: c.user_id }).select().single();
  if (error || !data) { btn.disabled = false; return eroareCiclu(); }
  ciclu.setari = data;
  if (start) await supabaseClient.from('ciclu_menstruatii').insert({ client_id: c.id, user_id: c.user_id, data_start: start });
  await incarcaCicluClient();
  ciclu.formular = null;
  randeazaCiclu();
}

async function noteazaStartCiclu(btn) {
  const zi = document.getElementById('cicluStart').value;
  if (!zi || zi > aziIsoAntrPers()) return;
  if (ciclu.menstruatii.some(m => m.data_start === zi)) return showToast(tr('Ziua asta e deja notată.', 'This day is already logged.'));
  const c = dateClienta.fisa;
  btn.disabled = true;
  const { error } = await supabaseClient.from('ciclu_menstruatii').insert({ client_id: c.id, user_id: c.user_id, data_start: zi });
  btn.disabled = false;
  if (error) return eroareCiclu();
  showToast(tr('✓ Notat', '✓ Logged'));
  await incarcaCicluClient();
  randeazaCiclu();
}

function stergeStartCiclu(id) {
  customConfirm(tr('Ștergi ziua?', 'Delete this day?'), tr('Estimarea se recalculează fără ea.', 'The estimate is recalculated without it.'), async () => {
    const { error } = await supabaseClient.from('ciclu_menstruatii').delete().eq('id', id);
    if (error) return eroareCiclu();
    ciclu.menstruatii = ciclu.menstruatii.filter(m => m.id !== id);
    randeazaCiclu();
  });
}

function comutaSimptomCiclu(id) {
  const l = ciclu.formular.simptome;
  ciclu.formular.simptome = l.includes(id) ? l.filter(x => x !== id) : l.concat(id);
  randeazaCiclu();
}

async function salveazaCicluZilnic(btn) {
  const fo = ciclu.formular, c = dateClienta.fisa;
  if (!fo.energie && !fo.somn && !fo.simptome.length) return showToast(tr('Alege cel puțin o valoare.', 'Pick at least one value.'), 'error');
  btn.disabled = true;
  const rand = { client_id: c.id, user_id: c.user_id, data: aziIsoAntrPers(), energie: fo.energie, somn: fo.somn, simptome: fo.simptome, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseClient.from('ciclu_zilnic').upsert(rand, { onConflict: 'client_id,data' }).select().single();
  btn.disabled = false;
  if (error || !data) return eroareCiclu();
  ciclu.zilnic = [data].concat(ciclu.zilnic.filter(z => z.data !== data.data));
  showToast(tr('✓ Salvat', '✓ Saved'));
  randeazaCiclu();
}

async function salveazaSetariCiclu(btn) {
  const durata = parseInt(document.getElementById('cicluDurata').value, 10);
  const menstruatie = parseInt(document.getElementById('cicluMenstruatie').value, 10);
  if (!(durata >= 21 && durata <= 45)) return showToast(tr('Ciclul: între 21 și 45 de zile.', 'Cycle: between 21 and 45 days.'), 'error');
  if (!(menstruatie >= 2 && menstruatie <= 10)) return showToast(tr('Menstruația: între 2 și 10 zile.', 'Period: between 2 and 10 days.'), 'error');
  btn.disabled = true;
  const { data, error } = await supabaseClient.from('ciclu_setari').update({ durata_ciclu: durata, durata_menstruatie: menstruatie, updated_at: new Date().toISOString() })
    .eq('client_id', dateClienta.fisa.id).select().single();
  btn.disabled = false;
  if (error || !data) return eroareCiclu();
  ciclu.setari = data;
  showToast(tr('✓ Salvat', '✓ Saved'));
  randeazaCiclu();
}

async function seteazaVizibilCiclu(vizibil, input) {
  input.disabled = true;
  const { data, error } = await supabaseClient.from('ciclu_setari').update({ vizibil_antrenor: vizibil, updated_at: new Date().toISOString() })
    .eq('client_id', dateClienta.fisa.id).select().single();
  input.disabled = false;
  if (error || !data) { input.checked = !vizibil; return eroareCiclu(); }
  ciclu.setari = data;
}

function opresteCiclu() {
  customConfirm(tr('Oprești urmărirea ciclului?', 'Turn off cycle tracking?'), tr('Se șterg definitiv toate datele: zilele notate și check-in-urile.', 'All data is permanently deleted: logged days and check-ins.'), async () => {
    const { error } = await supabaseClient.from('ciclu_setari').delete().eq('client_id', dateClienta.fisa.id);
    if (error) return eroareCiclu();
    ciclu = { setari: null, menstruatii: [], zilnic: [], formular: null };
    showToast(tr('✓ Datele au fost șterse', '✓ Data deleted'));
    antrPers.ecran = null;
    randeazaHomeClienta();
  });
}

// ---- La antrenor (Fișă › Progres): faza și ultimele 7 zile, doar dacă clientul le-a lăsat vizibile ----
let cicluFisa = null;

async function incarcaCicluAntrenor(client) {
  cicluFisa = null;
  const { data: s, error } = await supabaseClient.from('ciclu_setari').select('*').eq('client_id', client.id).maybeSingle();
  if (error || !s) return;
  const de = new Date(); de.setDate(de.getDate() - 6);
  const [resM, resZ] = await Promise.all([
    supabaseClient.from('ciclu_menstruatii').select('data_start').eq('client_id', client.id).order('data_start', { ascending: false }).limit(7),
    supabaseClient.from('ciclu_zilnic').select('*').eq('client_id', client.id).gte('data', isoDinData(de)).order('data', { ascending: false })
  ]);
  cicluFisa = { setari: s, menstruatii: resM.data || [], zilnic: resZ.data || [] };
}

function htmlCicluAntrenor() {
  const n = cicluFisa;
  if (!n) return '';
  const c = calculeazaCiclu(n.setari, n.menstruatii, aziIsoAntrPers());
  const f = c && FAZE_CICLU[c.faza];
  const simptom = id => { const x = SIMPTOME_CICLU.find(s => s[0] === id); return x ? tr(x[1], x[2]) : id; };
  return `<div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Ciclu', 'Cycle')}</div>
    <div class="card ciclu-faza${c ? ' faza-' + c.faza : ''}">${f ? `<b>${tr(f[0], f[1])}</b><div class="acasa-antrenament-detalii">${textEstimareCiclu(c)}</div><p>${tr(f[2], f[3])}</p>`
      : `<div class="acasa-antrenament-detalii">${tr('Clientul nu a notat încă nicio menstruație.', 'The client has not logged a period yet.')}</div>`}</div>
    ${n.zilnic.length ? `<div class="card">${n.zilnic.map(z => `<div class="nutritie-rand"><div>
        <div class="nutritie-rand-nume">${escAttr(etichetaDataAntrPers(z.data))}</div>
        <div class="acasa-antrenament-detalii">${[z.energie ? `${tr('Energie', 'Energy')} ${z.energie}/5` : '', z.somn ? `${tr('Somn', 'Sleep')} ${z.somn}/5` : '', (z.simptome || []).map(simptom).join(', ')].filter(Boolean).join(' · ')}</div>
      </div></div>`).join('')}</div>`
      : `<div class="progres-gol">${tr('Niciun check-in în ultimele 7 zile.', 'No check-ins in the last 7 days.')}</div>`}`;
}

// ---- Comunitatea studioului (sql/2026-11-05_comunitate.sql): opțională, clientul alege să intre ----
// Fluxul are o activitate pe ședință la sală (trigger pe prezente), pe zi din plan și pe antrenament propriu.
// Clasamentul (zile active, serie de săptămâni) și provocările se calculează din aceleași activități. Fără greutăți.
// Confidențialitate ca la Strava / Garmin (sql/2026-11-05_comunitate_confidentialitate.sql): membrul alege ce tipuri se văd,
// dacă se văd detaliile și dacă apare în clasament / la provocări; fiecare activitate poate fi „Doar tu” (ascuns).
// membru: undefined = neîncărcat (sau fără tabel), null = nu e în comunitate
let comunitate = { membru: undefined, antrenorId: null, membri: [], activitati: [], bravo: [], provocari: [], tab: 'flux', perioada: 'saptamana' };
const TIPURI_ACTIVITATE = { sala: ['La sală', 'At the gym'], plan: ['Din plan', 'From the plan'], proprii: ['Antrenament propriu', 'Own workout'] };

async function incarcaMembruComunitate() {
  if (!supabaseClient || !dateClienta.fisa) return;
  const { data, error } = await supabaseClient.from('comunitate_membri').select('*').eq('client_id', dateClienta.fisa.id).maybeSingle();
  if (error) return;
  comunitate.membru = data || null;
  if (data) await incarcaComunitate(data.user_id);
}

// Membrii, activitățile din ultimele ~6 luni, bravo-urile celor mai noi 60 și provocările (client și antrenor)
async function incarcaComunitate(antrenorId) {
  const de = new Date(); de.setDate(de.getDate() - 190);
  const [resM, resA, resP] = await Promise.all([
    supabaseClient.from('comunitate_membri').select('*').eq('user_id', antrenorId),
    supabaseClient.from('comunitate_activitati').select('*').eq('user_id', antrenorId).gte('data', isoDinData(de))
      .order('data', { ascending: false }).order('created_at', { ascending: false }).limit(1500),
    supabaseClient.from('provocari').select('*').eq('user_id', antrenorId).order('de', { ascending: false }).limit(30)
  ]);
  if (resM.error || resA.error) return false;
  comunitate.antrenorId = antrenorId;
  comunitate.membri = resM.data || [];
  comunitate.activitati = resA.data || [];
  comunitate.provocari = resP.error ? [] : (resP.data || []);
  const ids = comunitate.activitati.slice(0, 60).map(a => a.id);
  const resB = ids.length ? await supabaseClient.from('comunitate_bravo').select('*').in('activitate_id', ids) : { data: [] };
  comunitate.bravo = resB.error ? [] : (resB.data || []);
  return true;
}

function numeMembru(clientId) {
  return (comunitate.membri.find(m => m.client_id === clientId) || {}).nume_afisat || tr('Fost membru', 'Former member');
}
function numeBravo(authId) {
  if (authId === comunitate.antrenorId) return tr('Antrenorul', 'Trainer');
  return (comunitate.membri.find(m => m.auth_user_id === authId) || {}).nume_afisat || '';
}

function setariMembru(clientId) {
  return comunitate.membri.find(m => m.client_id === clientId) || null;
}

// Ce vede comunitatea: nu „Doar tu” și doar din tipurile lăsate vizibile de autor (aceeași regulă ca în baza de date)
function activitatePublica(a) {
  const m = setariMembru(a.client_id);
  if (!m || a.ascuns) return false;
  return a.tip === 'sala' ? m.arata_sala !== false : a.tip === 'plan' ? m.arata_plan !== false : m.arata_proprii !== false;
}

// Zilele active ale unui membru între două date ISO (inclusiv), doar din activitățile publice (la fel pentru toți)
function zileActiveMembru(clientId, de, pana) {
  return new Set(comunitate.activitati.filter(a => a.client_id === clientId && a.data >= de && a.data <= pana && activitatePublica(a)).map(a => a.data));
}

// Săptămâni la rând cu cel puțin o zi activă, numărate de la săptămâna curentă (sau de la cea trecută, dacă asta e încă goală)
function serieMembru(clientId) {
  const saptamani = new Set(comunitate.activitati.filter(a => a.client_id === clientId && activitatePublica(a)).map(a => lunaSaptamanii(dataDinIso(a.data))));
  const d = new Date(lunaSaptamanii(new Date()));
  if (!saptamani.has(d.getTime())) d.setDate(d.getDate() - 7);
  let n = 0;
  while (saptamani.has(lunaSaptamanii(d))) { n++; d.setDate(d.getDate() - 7); }
  return n;
}

function intervalPerioada(perioada) {
  const azi = new Date();
  const de = perioada === 'luna' ? new Date(azi.getFullYear(), azi.getMonth(), 1) : new Date(lunaSaptamanii(azi));
  return [isoDinData(de), aziIsoAntrPers()];
}

function clasamentComunitate(perioada) {
  const [de, pana] = intervalPerioada(perioada);
  return comunitate.membri.filter(m => m.in_clasament !== false).map(m => ({ m, zile: zileActiveMembru(m.client_id, de, pana).size, serie: serieMembru(m.client_id) }))
    .sort((a, b) => b.zile - a.zile || b.serie - a.serie || a.m.nume_afisat.localeCompare(b.m.nume_afisat));
}

// Locul în clasament: la egalitate de zile active, același loc
function locClasament(lista, i) {
  let loc = i;
  while (loc > 0 && lista[loc - 1].zile === lista[i].zile) loc--;
  return loc + 1;
}

// Acasă: invitația (o dată, se poate închide) sau locul în clasamentul săptămânii și provocarea în curs
function htmlComunitateAcasa() {
  const m = comunitate.membru;
  if (m === undefined) return '<div id="cardComunitateAcasa"></div>';
  if (m === null) {
    let ascuns = false;
    try { ascuns = localStorage.getItem('BFIT_COMUNITATE_ASCUNS') === '1'; } catch (e) {}
    if (ascuns) return '<div id="cardComunitateAcasa"></div>';
    return `<div class="card acasa-mic" id="cardComunitateAcasa" onclick="deschideComunitate()">
      <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.3M18 14.3c1.8.8 3 2.7 3 4.9"/></svg></span>
      <div class="acasa-rand-text"><div class="acasa-eticheta">${tr('Comunitatea', 'Community')}</div>
      <b>${tr('Antrenează-te alături de ceilalți', 'Train alongside the others')}</b>
      <div class="acasa-antrenament-detalii">${tr('Vezi cine s-a antrenat, dă „Bravo” și intră în provocări. Opțional.', 'See who trained, give “Well done” and join challenges. Optional.')}</div></div>
      <button type="button" class="notificare-x nutritie-sterge" onclick="event.stopPropagation(); ascundeInvitatieComunitate()" aria-label="${tr('Închide', 'Close')}">×</button>
    </div>`;
  }
  const lista = clasamentComunitate('saptamana');
  const i = lista.findIndex(x => x.m.client_id === m.client_id);
  const eu = lista[i];
  const prov = provocariActive()[0];
  const progres = prov ? zileActiveMembru(m.client_id, prov.de, prov.pana).size : 0;
  return `<div class="card acasa-mic" id="cardComunitateAcasa" onclick="deschideComunitate()">
    <span class="acasa-rand-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.3M18 14.3c1.8.8 3 2.7 3 4.9"/></svg></span>
    <div class="acasa-rand-text"><div class="acasa-eticheta">${tr('Comunitatea', 'Community')}</div>
    <b>${m.in_clasament === false ? tr('Nu apari în clasament', 'You are hidden from the leaderboard')
      : eu && eu.zile ? tr(`Locul ${locClasament(lista, i)} din ${lista.length} săptămâna asta`, `${ordinalEn(locClasament(lista, i))} of ${lista.length} this week`) : tr('Prima zi activă te urcă în clasament', 'Your first active day puts you on the board')}</b>
    <div class="acasa-antrenament-detalii">${prov ? `${escAttr(prov.titlu)}: ${Math.min(progres, prov.tinta)}/${prov.tinta} ${tr('zile', 'days')}${progres >= prov.tinta ? ' 🏆' : ''}` : tr('Vezi fluxul și clasamentul.', 'See the feed and the leaderboard.')}</div></div>
    <div class="drawer-nav-arrow">›</div>
  </div>`;
}

function ordinalEn(n) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th';
  return n + s;
}

function ascundeInvitatieComunitate() {
  try { localStorage.setItem('BFIT_COMUNITATE_ASCUNS', '1'); } catch (e) {}
  const card = document.getElementById('cardComunitateAcasa');
  if (card) card.outerHTML = '<div id="cardComunitateAcasa"></div>';
}

function provocariActive() {
  const azi = aziIsoAntrPers();
  return comunitate.provocari.filter(p => p.de <= azi && p.pana >= azi).sort((a, b) => a.pana.localeCompare(b.pana));
}

async function deschideComunitate() {
  if (clientaTabCurent !== 'acasa') clientaTab('acasa');
  antrPers.ecran = 'comunitate';
  dateClienta.planCurent = null;
  arataInapoiAntrPers();
  document.getElementById('clientaTitlu').innerText = tr('Comunitatea', 'Community');
  if (comunitate.membru === undefined) document.getElementById('clientaContinut').innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  else randeazaComunitate();
  await incarcaMembruComunitate();
  if (antrPers.ecran === 'comunitate') randeazaComunitate();
}

function randeazaComunitate() {
  const el = document.getElementById('clientaContinut');
  if (comunitate.membru === undefined) {
    el.innerHTML = `<div class="progres-gol">${tr('Comunitatea nu e disponibilă acum. Verifică internetul.', 'The community is not available right now. Check your internet.')}</div>`;
    return;
  }
  if (!comunitate.membru) {
    const prenume = ((dateClienta.fisa && dateClienta.fisa.nume) || '').trim().split(' ')[0];
    el.innerHTML = `<div class="card ciclu-intro">
        <b>${tr('Comunitatea studioului', 'The studio community')}</b>
        <p>${tr('Vezi cine s-a antrenat, dă „Bravo”, urcă în clasament și intră în provocările antrenorului.', 'See who trained, give “Well done”, climb the leaderboard and join your trainer’s challenges.')}</p>
        <div class="comunitate-ce-vad">
          <b>${tr('Ce văd ceilalți membri', 'What other members see')}</b>
          <span>✓ ${tr('Numele afișat, ales mai jos', 'Your display name, chosen below')}</span>
          <span>✓ ${tr('Ziua și titlul antrenamentului: la sală, din plan, antrenamente proprii', 'The day and title of each workout: gym, plan, own workouts')}</span>
          <span>✓ ${tr('Locul în clasament și provocările terminate', 'Your leaderboard place and completed challenges')}</span>
          <span>✕ ${tr('Durata și distanța (le poți arăta din Confidențialitate)', 'Duration and distance (you can show them in Privacy)')}</span>
          <span>✕ ${tr('Greutăți, note, poze sau date despre sănătate. Niciodată.', 'Weights, notes, photos or health data. Never.')}</span>
        </div>
        <p>${tr('Alegi oricând ce se vede, din Confidențialitate, și poți face orice activitate „Doar tu”. Poți ieși oricând.', 'Change what is shown anytime in Privacy, and make any activity “Only you”. You can leave anytime.')}</p>
        <label class="ciclu-camp">${tr('Numele afișat', 'Display name')}
          <input type="text" id="comunitateNume" class="plan-ex-input" maxlength="40" value="${escAttr(prenume)}"></label>
        <button type="button" class="btn profile-save-btn" onclick="intraComunitate(this)">${tr('Intră în comunitate', 'Join the community')}</button>
      </div>`;
    return;
  }
  const taburi = [['flux', 'Flux', 'Feed'], ['clasament', 'Clasament', 'Leaderboard'], ['provocari', 'Provocări', 'Challenges']];
  let html = `<div class="comunitate-taburi">${taburi.map(([id, ro, en]) => `<button type="button" class="theme-option-btn${comunitate.tab === id ? ' active' : ''}" onclick="comunitate.tab = '${id}'; randeazaComunitate()">${tr(ro, en)}</button>`).join('')}</div>`;
  if (comunitate.tab === 'clasament') html += htmlClasamentComunitate(false);
  else if (comunitate.tab === 'provocari') html += htmlProvocariComunitate(false);
  else html += htmlFluxComunitate(false);
  const m = comunitate.membru;
  const comutator = (camp, ro, en, roMic, enMic) => `<label class="setare-notificare">
      <span><b>${tr(ro, en)}</b>${roMic ? `<small>${tr(roMic, enMic)}</small>` : ''}</span>
      <input type="checkbox" class="comutator" ${m[camp] !== false ? 'checked' : ''} onchange="seteazaConfComunitate('${camp}', this.checked, this)">
    </label>`;
  html += `<div class="antr-pers-sectiune">${tr('Profil', 'Profile')}</div>
    <div class="card">
      <label class="ciclu-camp">${tr('Numele afișat', 'Display name')}
        <span class="ciclu-start" style="margin-top:0;"><input type="text" id="comunitateNume" class="plan-ex-input" maxlength="40" value="${escAttr(m.nume_afisat)}">
        <button type="button" class="btn btn-clear" style="white-space:nowrap;" onclick="schimbaNumeComunitate(this)">${tr('Salvează', 'Save')}</button></span></label>
    </div>
    <div class="antr-pers-sectiune">${tr('Confidențialitate', 'Privacy')}</div>
    <div class="card comunitate-confidentialitate">
      <div class="checkin-eticheta">${tr('Activități vizibile comunității', 'Activities visible to the community')}</div>
      ${comutator('arata_sala', 'Ședințele la sală', 'Gym sessions', 'Bifate de antrenor în orar', 'Checked in by your trainer')}
      ${comutator('arata_plan', 'Zilele din plan', 'Plan days', 'Când bifezi exerciții în planul de la antrenor', 'When you tick exercises in your trainer’s plan')}
      ${comutator('arata_proprii', 'Antrenamentele proprii', 'Own workouts', 'Implicit pentru cele noi; fiecare se poate schimba din editor', 'Default for new ones; each can be changed in the editor')}
      <div class="checkin-eticheta">${tr('Detalii', 'Details')}</div>
      ${comutator('arata_detalii', 'Durata, distanța și exercițiile', 'Duration, distance and exercises', 'Oprit: ceilalți văd doar tipul, titlul și ziua', 'Off: others only see the type, title and day')}
      <div class="checkin-eticheta">${tr('Clasamente și provocări', 'Leaderboards and challenges')}</div>
      ${comutator('in_clasament', 'Apar în clasament', 'Show me on the leaderboard', '', '')}
      ${comutator('in_provocari', 'Apar la provocările terminate', 'Show me on completed challenges', '', '')}
      <div class="acasa-antrenament-detalii" style="margin-top:8px;">${tr('Doar pentru comunitate. Ce vede antrenorul alegi separat. Greutățile, notele, pozele și datele despre sănătate nu ajung niciodată în comunitate.', 'Community only. What your trainer sees is set separately. Weights, notes, photos and health data never reach the community.')}</div>
    </div>
    <button type="button" class="btn btn-clear ciclu-opreste" onclick="iesiComunitate()">${tr('Ieși din comunitate', 'Leave the community')}</button>`;
  el.innerHTML = html;
}

// Fluxul: cele mai noi 60 de activități, cu „Bravo”. laAntrenor: fără „Tu”, cu ștergere (moderare)
function htmlFluxComunitate(laAntrenor) {
  const eu = utilizatorCurent.id;
  const euId = !laAntrenor && comunitate.membru ? comunitate.membru.client_id : null;
  // Ceilalți văd doar ce e public; autorul își vede și activitățile „Doar tu”, marcate
  const lista = comunitate.activitati.filter(a => a.client_id === euId || activitatePublica(a)).slice(0, 60);
  if (!lista.length) return `<div class="progres-gol">${tr('Încă nicio activitate. Prima ședință, ziua din plan sau antrenamentul propriu apare aici.', 'No activity yet. The next gym session, plan day or own workout shows up here.')}</div>`;
  return lista.map(a => {
    const bravo = comunitate.bravo.filter(b => b.activitate_id === a.id);
    const dat = bravo.some(b => b.auth_user_id === eu);
    const alMeu = a.client_id === euId;
    const publica = activitatePublica(a);
    const cuDetalii = (setariMembru(a.client_id) || {}).arata_detalii === true;
    const nume = alMeu ? tr('Tu', 'You') : numeMembru(a.client_id);
    const cine = bravo.map(b => numeBravo(b.auth_user_id)).filter(Boolean);
    const tip = TIPURI_ACTIVITATE[a.tip] || ['', ''];
    return `<div class="card comunitate-activitate">
      <div class="comunitate-sus"><b>${escAttr(nume)}</b><span class="acasa-antrenament-detalii">${escAttr(etichetaDataAntrPers(a.data))}</span>
        ${laAntrenor ? `<button type="button" class="notificare-x nutritie-sterge" onclick="stergeActivitateComunitate('${a.id}')" aria-label="${tr('Șterge', 'Delete')}">×</button>` : ''}</div>
      <div class="acasa-eticheta">${tr(tip[0], tip[1])}</div>
      ${a.titlu ? `<div class="nutritie-rand-nume">${escAttr(traduceValoare(a.titlu))}</div>` : ''}
      ${a.detalii && cuDetalii ? `<div class="acasa-antrenament-detalii">${escAttr(a.detalii)}</div>` : ''}
      <div class="comunitate-bravo">
        ${alMeu ? `<button type="button" class="ciclu-simptom comunitate-cine" onclick="comutaAscunsActivitate('${a.id}', this)" title="${tr('Cine vede', 'Who can see')}">${publica ? `🌐 ${tr('Comunitatea', 'Community')}` : `🔒 ${tr('Doar tu', 'Only you')}`}</button>` : ''}
        <button type="button" class="ciclu-simptom${dat ? ' active' : ''}" onclick="comutaBravo('${a.id}', this)" ${alMeu ? 'disabled' : ''}>👏 ${tr('Bravo', 'Well done')}${bravo.length ? ` · ${bravo.length}` : ''}</button>
        ${cine.length ? `<span class="acasa-antrenament-detalii">${escAttr(cine.slice(0, 3).join(', '))}${cine.length > 3 ? ` +${cine.length - 3}` : ''}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function htmlClasamentComunitate(laAntrenor) {
  const perioade = [['saptamana', 'Săptămâna asta', 'This week'], ['luna', 'Luna asta', 'This month']];
  const lista = clasamentComunitate(comunitate.perioada);
  const euId = !laAntrenor && comunitate.membru ? comunitate.membru.client_id : null;
  const fct = laAntrenor ? 'randeazaComunitateAntrenor()' : 'randeazaComunitate()';
  return `<div class="comunitate-taburi comunitate-perioade">${perioade.map(([id, ro, en]) => `<button type="button" class="theme-option-btn${comunitate.perioada === id ? ' active' : ''}" onclick="comunitate.perioada = '${id}'; ${fct}">${tr(ro, en)}</button>`).join('')}</div>
    <div class="card">${lista.length ? lista.map((x, i) => `<div class="comunitate-loc${x.m.client_id === euId ? ' eu' : ''}">
        <span class="comunitate-nr">${x.zile ? locClasament(lista, i) : '–'}</span>
        <span class="comunitate-nume">${escAttr(x.m.client_id === euId ? tr('Tu', 'You') : x.m.nume_afisat)}</span>
        <span class="comunitate-cifre"><b>${x.zile}</b> ${x.zile === 1 ? tr('zi', 'day') : tr('zile', 'days')}${x.serie ? ` · 🔥 ${x.serie}` : ''}</span>
      </div>`).join('') : `<div class="progres-gol">${tr('Niciun membru încă.', 'No members yet.')}</div>`}</div>
    <div class="nutritie-sursa">${tr('Zile active: zile cu ședință la sală, zi din plan sau antrenament propriu. 🔥 = săptămâni la rând.', 'Active days: days with a gym session, plan day or own workout. 🔥 = weeks in a row.')}</div>`;
}

function htmlProvocariComunitate(laAntrenor) {
  const azi = aziIsoAntrPers();
  const lista = comunitate.provocari.filter(p => laAntrenor || p.pana >= isoDinData(new Date(Date.now() - 14 * 86400000)));
  const euId = !laAntrenor && comunitate.membru ? comunitate.membru.client_id : null;
  let html = lista.map(p => {
    const terminati = comunitate.membri.filter(m => (m.in_provocari !== false || m.client_id === euId) && zileActiveMembru(m.client_id, p.de, p.pana).size >= p.tinta);
    const progres = euId ? zileActiveMembru(euId, p.de, p.pana).size : 0;
    const gata = euId && progres >= p.tinta;
    const stare = p.de > azi ? tr('Începe', 'Starts') + ' ' + etichetaDataAntrPers(p.de) : p.pana < azi ? tr('Încheiată', 'Ended') : tr(`Până ${etichetaDataAntrPers(p.pana)}`, `Until ${etichetaDataAntrPers(p.pana)}`);
    return `<div class="card comunitate-provocare${gata ? ' gata' : ''}">
      <div class="comunitate-sus"><b>${gata ? '🏆 ' : ''}${escAttr(p.titlu)}</b>
        ${laAntrenor ? `<button type="button" class="notificare-x nutritie-sterge" onclick="stergeProvocare('${p.id}')" aria-label="${tr('Șterge', 'Delete')}">×</button>` : ''}</div>
      <div class="acasa-antrenament-detalii">${p.tinta} ${tr('zile active', 'active days')} · ${escAttr(stare)}</div>
      ${euId ? `<div class="progress-wrapper nutritie-bara-mica"><div class="progress-fill" style="width:${Math.min(100, Math.round(progres / p.tinta * 100))}%"></div></div>
        <div class="acasa-antrenament-detalii">${gata ? tr('Terminată. Bravo!', 'Completed. Well done!') : tr(`${progres} din ${p.tinta} zile`, `${progres} of ${p.tinta} days`)}</div>` : ''}
      <div class="acasa-antrenament-detalii">${terminati.length ? `🏆 ${escAttr(terminati.map(m => m.client_id === euId ? tr('Tu', 'You') : m.nume_afisat).join(', '))}` : tr('Nimeni n-a terminat-o încă.', 'Nobody has completed it yet.')}</div>
    </div>`;
  }).join('');
  if (!lista.length && !laAntrenor) html = `<div class="progres-gol">${tr('Nicio provocare acum. Antrenorul le anunță aici.', 'No challenges right now. Your trainer posts them here.')}</div>`;
  return html;
}

async function intraComunitate(btn) {
  const nume = document.getElementById('comunitateNume').value.trim();
  if (!nume) return showToast(tr('Alege un nume afișat.', 'Choose a display name.'), 'error');
  const c = dateClienta.fisa;
  btn.disabled = true;
  const { data, error } = await supabaseClient.from('comunitate_membri').insert({ client_id: c.id, user_id: c.user_id, nume_afisat: nume.slice(0, 40) }).select().single();
  if (error || !data) { btn.disabled = false; return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error'); }
  comunitate.membru = data;
  await incarcaComunitate(data.user_id);
  showToast(tr('✓ Bine ai venit în comunitate!', '✓ Welcome to the community!'));
  randeazaComunitate();
}

async function schimbaNumeComunitate(btn) {
  const nume = document.getElementById('comunitateNume').value.trim();
  if (!nume) return showToast(tr('Alege un nume afișat.', 'Choose a display name.'), 'error');
  btn.disabled = true;
  const { data, error } = await supabaseClient.from('comunitate_membri').update({ nume_afisat: nume.slice(0, 40) }).eq('client_id', comunitate.membru.client_id).select().single();
  btn.disabled = false;
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  comunitate.membru = data;
  comunitate.membri = comunitate.membri.map(m => m.client_id === data.client_id ? data : m);
  showToast(tr('✓ Salvat', '✓ Saved'));
}

function iesiComunitate() {
  customConfirm(tr('Ieși din comunitate?', 'Leave the community?'), tr('Activitățile tale dispar din flux și din clasament. Poți intra din nou oricând.', 'Your activities disappear from the feed and the leaderboard. You can join again anytime.'), async () => {
    await supabaseClient.from('comunitate_bravo').delete().eq('auth_user_id', utilizatorCurent.id);
    const { error } = await supabaseClient.from('comunitate_membri').delete().eq('client_id', comunitate.membru.client_id);
    if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
    comunitate = { membru: null, antrenorId: null, membri: [], activitati: [], bravo: [], provocari: [], tab: 'flux', perioada: 'saptamana' };
    showToast(tr('Ai ieșit din comunitate.', 'You left the community.'));
    randeazaComunitate();
  });
}

async function comutaBravo(id, btn) {
  const eu = utilizatorCurent.id;
  const dat = comunitate.bravo.some(b => b.activitate_id === id && b.auth_user_id === eu);
  btn.disabled = true;
  const { error } = dat
    ? await supabaseClient.from('comunitate_bravo').delete().eq('activitate_id', id).eq('auth_user_id', eu)
    : await supabaseClient.from('comunitate_bravo').insert({ activitate_id: id });
  btn.disabled = false;
  if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  comunitate.bravo = dat ? comunitate.bravo.filter(b => !(b.activitate_id === id && b.auth_user_id === eu)) : comunitate.bravo.concat({ activitate_id: id, auth_user_id: eu });
  if (rolUtilizator === 'antrenor') randeazaComunitateAntrenor(); else randeazaComunitate();
}

// Clientul: activitatea lui în flux (doar dacă e membru). sursa face activitatea unică: a doua scriere o actualizează
async function posteazaActivitateComunitate(a) {
  if (!supabaseClient || !dateClienta.fisa) return;
  if (comunitate.membru === undefined) await incarcaMembruComunitate();
  const m = comunitate.membru;
  if (!m) return;
  // Detaliile oprite nu se salvează deloc; „ascuns” se trimite doar când e ales explicit (altfel rămâne cum era)
  const rand = { user_id: m.user_id, client_id: m.client_id, data: a.data, tip: a.tip,
    titlu: (a.titlu || '').slice(0, 120), detalii: m.arata_detalii ? (a.detalii || '').slice(0, 160) : '', sursa: a.sursa };
  if (a.ascuns !== undefined) rand.ascuns = !!a.ascuns;
  const { data } = await supabaseClient.from('comunitate_activitati').upsert(rand, { onConflict: 'sursa' }).select().maybeSingle();
  if (data) comunitate.activitati = [data].concat(comunitate.activitati.filter(x => x.id !== data.id));
}

// Comutatoarele din Confidențialitate. Detaliile oprite se șterg și din activitățile deja publicate
async function seteazaConfComunitate(camp, valoare, input) {
  const m = comunitate.membru;
  input.disabled = true;
  const { data, error } = await supabaseClient.from('comunitate_membri').update({ [camp]: valoare }).eq('client_id', m.client_id).select().single();
  input.disabled = false;
  if (error || !data) { input.checked = !valoare; return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error'); }
  comunitate.membru = data;
  comunitate.membri = comunitate.membri.map(x => x.client_id === data.client_id ? data : x);
  if (camp === 'arata_detalii' && !valoare) {
    await supabaseClient.from('comunitate_activitati').update({ detalii: '' }).eq('client_id', m.client_id).neq('detalii', '');
    comunitate.activitati.forEach(a => { if (a.client_id === m.client_id) a.detalii = ''; });
  }
}

// O activitate proprie: „Comunitatea” ⇄ „Doar tu”
async function comutaAscunsActivitate(id, btn) {
  const a = comunitate.activitati.find(x => x.id === id);
  if (!a) return;
  const m = comunitate.membru;
  const tipOprit = a.tip === 'sala' ? m.arata_sala === false : a.tip === 'plan' ? m.arata_plan === false : m.arata_proprii === false;
  if (tipOprit && !a.ascuns) return showToast(tr('Tipul ăsta de activitate e ascuns din Confidențialitate.', 'This activity type is hidden in Privacy.'));
  btn.disabled = true;
  const { error } = await supabaseClient.from('comunitate_activitati').update({ ascuns: !a.ascuns }).eq('id', id);
  btn.disabled = false;
  if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  a.ascuns = !a.ascuns;
  randeazaComunitate();
}

// Editorul antrenamentului propriu: e în comunitate? (cel salvat: după activitatea lui; unul nou: după Confidențialitate)
function antrPersInComunitate(c) {
  if (c.in_comunitate !== undefined) return c.in_comunitate;
  const m = comunitate.membru;
  if (!m) return false;
  const a = c.id ? comunitate.activitati.find(x => x.sursa === 'proprii:' + c.id) : null;
  return a ? !a.ascuns : m.arata_proprii !== false;
}

async function scoateActivitateComunitate(sursa) {
  if (!supabaseClient || !comunitate.membru) return;
  await supabaseClient.from('comunitate_activitati').delete().eq('sursa', sursa);
}

// Zilele din plan cu cel puțin o serie bifată în ultimele 2 zile (zilele vechi nu ajung în flux la o salvare târzie)
function posteazaPlanInComunitate(plan) {
  if (!comunitate.membru || !plan) return;
  const ieri = isoDinData(new Date(Date.now() - 86400000));
  (plan.continut_json?.sesiuni || []).forEach((ses, s) => {
    if (!ses.data_client || ses.data_client < ieri) return;
    const facute = (ses.exercitii || []).filter(ex => ex.status === 'Finalizat').length;
    posteazaActivitateComunitate({ tip: 'plan', data: ses.data_client, titlu: ses.titlu || tr(`Ziua ${s + 1}`, `Day ${s + 1}`),
      detalii: facute ? tr(`${facute} ${facute === 1 ? 'exercițiu făcut' : 'exerciții făcute'}`, `${facute} ${facute === 1 ? 'exercise' : 'exercises'} done`) : '',
      sursa: `plan:${plan.id}:${s}:${ses.data_client}` });
  });
}

// ---- La antrenor: meniu › Comunitate (provocări, clasament, flux cu moderare) ----
async function deschideComunitateAntrenor() {
  navigheazaSubMeniu('comunitate');
  const el = document.getElementById('comunitateAntrenor');
  if (!comunitate.antrenorId) el.innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  const ok = await incarcaComunitate(utilizatorCurent.id);
  if (!ok) { el.innerHTML = `<div class="progres-gol">${tr('Comunitatea nu e disponibilă acum. Verifică internetul.', 'The community is not available right now. Check your internet.')}</div>`; return; }
  randeazaComunitateAntrenor();
}

function randeazaComunitateAntrenor() {
  const el = document.getElementById('comunitateAntrenor');
  if (!el) return;
  const azi = aziIsoAntrPers();
  const sfarsitLuna = (() => { const d = new Date(); return isoDinData(new Date(d.getFullYear(), d.getMonth() + 1, 0)); })();
  const taburi = [['provocari', 'Provocări', 'Challenges'], ['clasament', 'Clasament', 'Leaderboard'], ['flux', 'Flux', 'Feed']];
  if (!['provocari', 'clasament', 'flux'].includes(comunitate.tab)) comunitate.tab = 'provocari';
  let html = `<div class="acasa-antrenament-detalii">${tr(`${comunitate.membri.length} ${comunitate.membri.length === 1 ? 'membru' : 'membri'}. Clienții intră singuri, din aplicația lor (Acasă › Comunitatea).`, `${comunitate.membri.length} ${comunitate.membri.length === 1 ? 'member' : 'members'}. Clients join themselves, from their app (Home › Community).`)}</div>
    <div class="comunitate-taburi">${taburi.map(([id, ro, en]) => `<button type="button" class="theme-option-btn${comunitate.tab === id ? ' active' : ''}" onclick="comunitate.tab = '${id}'; randeazaComunitateAntrenor()">${tr(ro, en)}</button>`).join('')}</div>`;
  if (comunitate.tab === 'clasament') html += htmlClasamentComunitate(true);
  else if (comunitate.tab === 'flux') html += htmlFluxComunitate(true);
  else html += `<div class="card ciclu-intro">
      <b>${tr('Provocare nouă', 'New challenge')}</b>
      <label class="ciclu-camp">${tr('Titlu', 'Title')}<input type="text" id="provTitlu" class="plan-ex-input" maxlength="80" placeholder="${tr('ex. Noiembrie activ', 'e.g. Active November')}"></label>
      <div class="antr-pers-campuri nutritie-tinte comunitate-prov-campuri">
        <label>${tr('Zile active', 'Active days')}<input type="number" inputmode="numeric" id="provTinta" class="plan-ex-input" min="1" max="100" value="12"></label>
        <label>${tr('De la', 'From')}<input type="date" id="provDe" class="plan-ex-input" value="${azi}"></label>
        <label>${tr('Până la', 'Until')}<input type="date" id="provPana" class="plan-ex-input" value="${sfarsitLuna}"></label>
      </div>
      <button type="button" class="btn profile-save-btn" onclick="adaugaProvocare(this)">${tr('Creează provocarea', 'Create challenge')}</button>
    </div>` + htmlProvocariComunitate(true);
  el.innerHTML = html;
}

async function adaugaProvocare(btn) {
  const titlu = document.getElementById('provTitlu').value.trim();
  const tinta = parseInt(document.getElementById('provTinta').value, 10);
  const de = document.getElementById('provDe').value, pana = document.getElementById('provPana').value;
  if (!titlu) return showToast(tr('Dă un titlu provocării.', 'Give the challenge a title.'), 'error');
  if (!(tinta >= 1 && tinta <= 100)) return showToast(tr('Zile active: între 1 și 100.', 'Active days: between 1 and 100.'), 'error');
  if (!de || !pana || pana < de) return showToast(tr('Verifică datele: „până la” după „de la”.', 'Check the dates: “until” after “from”.'), 'error');
  if (zileIntre(de, pana) + 1 < tinta) return showToast(tr('Intervalul are mai puține zile decât ținta.', 'The period has fewer days than the target.'), 'error');
  btn.disabled = true;
  const { data, error } = await supabaseClient.from('provocari').insert({ titlu, tinta, de, pana }).select().single();
  btn.disabled = false;
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  comunitate.provocari = [data].concat(comunitate.provocari);
  showToast(tr('✓ Provocare creată', '✓ Challenge created'));
  randeazaComunitateAntrenor();
}

function stergeProvocare(id) {
  customConfirm(tr('Ștergi provocarea?', 'Delete the challenge?'), tr('Dispare pentru toți membrii.', 'It disappears for all members.'), async () => {
    const { error } = await supabaseClient.from('provocari').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    comunitate.provocari = comunitate.provocari.filter(p => p.id !== id);
    randeazaComunitateAntrenor();
  });
}

function stergeActivitateComunitate(id) {
  customConfirm(tr('Scoți activitatea din flux?', 'Remove this activity from the feed?'), tr('Dispare și din clasament și provocări.', 'It also disappears from the leaderboard and challenges.'), async () => {
    const { error } = await supabaseClient.from('comunitate_activitati').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    comunitate.activitati = comunitate.activitati.filter(a => a.id !== id);
    randeazaComunitateAntrenor();
  });
}

// ---- Rețete (sql/2026-11-06_retete.sql): ale clientului (private) și ale antrenorului (pentru toți clienții lui) ----
// Clientul le vede în Nutriție (ecranele antrPers.ecran = 'nutritie-retete', '-reteta', '-reteta-editor', '-cumparaturi'),
// antrenorul în meniu › Rețete. vedere: 'lista' | 'reteta' | 'editor' | 'cumparaturi'
let retete = { lista: null, vedere: 'lista', curenta: null, editor: null, cautare: '', rezultate: [] };
const ECRANE_RETETE = { lista: 'nutritie-retete', reteta: 'nutritie-reteta', editor: 'nutritie-reteta-editor', cumparaturi: 'nutritie-cumparaturi' };

function laAntrenorRetete() {
  return rolUtilizator === 'antrenor';
}

function elRetete() {
  return document.getElementById(laAntrenorRetete() ? 'reteteAntrenor' : 'clientaContinut');
}

async function incarcaRetete() {
  const { data, error } = await supabaseClient.from('retete').select('*').order('nume');
  retete.lista = error ? null : (data || []);
}

// Totalurile rețetei, pe porție și la 100 g (ca rețeta să intre în jurnal ca un aliment, cu grame reale)
function valoriReteta(r) {
  const ing = r.ingrediente || [];
  const grame = ing.reduce((t, i) => t + (Number(i.cantitate_g) || 0), 0);
  const total = ing.reduce((t, i) => { const v = valoriPentruGrame(i, Number(i.cantitate_g) || 0); return { kcal: t.kcal + v.kcal, proteine: t.proteine + v.proteine, carbo: t.carbo + v.carbo, grasimi: t.grasimi + v.grasimi }; }, { kcal: 0, proteine: 0, carbo: 0, grasimi: 0 });
  const p = Number(r.portii) || 1;
  const per = k => rotunjeste1(total[k] / p);
  const la100 = k => grame ? rotunjeste1(total[k] * 100 / grame) : 0;
  return { grame, gramePortie: grame / p, portie: { kcal: per('kcal'), proteine: per('proteine'), carbo: per('carbo'), grasimi: per('grasimi') },
    la100: { kcal: la100('kcal'), proteine: la100('proteine'), carbo: la100('carbo'), grasimi: la100('grasimi') } };
}

async function deschideRetete() {
  retete.vedere = 'lista';
  if (!laAntrenorRetete()) { antrPers.ecran = 'nutritie-retete'; arataInapoiAntrPers(); }
  if (retete.lista === null) elRetete().innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  else randeazaRetete();
  await incarcaRetete();
  randeazaRetete();
}

function deschideReteteAntrenor() {
  navigheazaSubMeniu('retete');
  deschideRetete();
}

function randeazaRetete() {
  const el = elRetete();
  if (!el) return;
  if (!laAntrenorRetete()) {
    // Clientul a plecat între timp din ecranele de rețete: nu desenăm peste alt ecran
    if (!String(antrPers.ecran).startsWith('nutritie-ret') && antrPers.ecran !== 'nutritie-cumparaturi') return;
    antrPers.ecran = ECRANE_RETETE[retete.vedere];
    document.getElementById('clientaTitlu').innerText = retete.vedere === 'cumparaturi' ? tr('Cumpărături', 'Shopping list')
      : retete.vedere === 'editor' ? (retete.editor && retete.editor.id ? tr('Editează rețeta', 'Edit recipe') : tr('Rețetă nouă', 'New recipe')) : tr('Rețete', 'Recipes');
  }
  if (retete.lista === null) { el.innerHTML = `<div class="progres-gol">${tr('Rețetele nu sunt disponibile acum. Verifică internetul.', 'Recipes are not available right now. Check your internet.')}</div>`; return; }
  const inapoi = laAntrenorRetete() && retete.vedere !== 'lista' ? `<button type="button" class="btn btn-clear" onclick="retete.vedere = 'lista'; randeazaRetete()">‹ ${tr('Rețete', 'Recipes')}</button>` : '';
  el.innerHTML = inapoi + (retete.vedere === 'reteta' ? htmlReteta() : retete.vedere === 'editor' ? htmlEditorReteta() : retete.vedere === 'cumparaturi' ? htmlCumparaturi() : htmlListaRetete());
}

function htmlRandReteta(r) {
  const v = valoriReteta(r);
  return `<button type="button" class="plan-zi-card nutritie-produs" onclick="deschideReteta('${r.id}')">
    <span class="nutritie-imagine mica reteta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg></span>
    <span class="plan-zi-card-text"><span class="plan-zi-card-titlu">${escAttr(r.nume)}</span>
    <span class="plan-zi-card-detalii"><b>${Math.round(v.portie.kcal)} kcal</b> ${tr('pe porție', 'per serving')} · ${r.portii} ${Number(r.portii) === 1 ? tr('porție', 'serving') : tr('porții', 'servings')}${r.timp_min ? ` · ${r.timp_min} min` : ''}</span></span>
    <span class="progres-ex-dif">›</span>
  </button>`;
}

function htmlListaRetete() {
  const antrenor = laAntrenorRetete();
  const aleAntrenorului = retete.lista.filter(r => !r.client_id);
  const aleMele = retete.lista.filter(r => r.client_id);
  let html = antrenor
    ? `<div class="acasa-antrenament-detalii">${tr('Rețetele tale le văd toți clienții tăi, în Nutriție › Rețete. Le pot adăuga în jurnal pe porții.', 'All your clients see your recipes in Nutrition › Recipes and can log them by serving.')}</div>`
    : `<div class="nutritie-scurtaturi"><button type="button" class="btn" onclick="deschideEditorReteta(null)">${tr('+ Rețetă nouă', '+ New recipe')}</button>
        <button type="button" class="btn btn-clear" onclick="retete.vedere = 'cumparaturi'; randeazaRetete()">🛒 ${tr('Cumpărături', 'Shopping')}${listaCumparaturi().length ? ` (${listaCumparaturi().filter(x => !x.bifat).length})` : ''}</button></div>`;
  if (antrenor) html += `<button type="button" class="btn profile-save-btn" onclick="deschideEditorReteta(null)">${tr('+ Rețetă nouă', '+ New recipe')}</button>`;
  if (antrenor) {
    html += aleAntrenorului.length ? aleAntrenorului.map(htmlRandReteta).join('') : `<div class="progres-gol">${tr('Încă nicio rețetă. Adaugă una: clienții o văd imediat.', 'No recipes yet. Add one: your clients see it right away.')}</div>`;
    return html;
  }
  if (aleAntrenorului.length) html += `<div class="antr-pers-sectiune">${tr('De la antrenorul tău', 'From your trainer')}</div>` + aleAntrenorului.map(htmlRandReteta).join('');
  html += `<div class="antr-pers-sectiune">${tr('Rețetele mele', 'My recipes')}</div>`
    + (aleMele.length ? aleMele.map(htmlRandReteta).join('') : `<div class="progres-gol">${tr('Pune ingredientele o dată și aplicația îți calculează caloriile pe porție.', 'Add the ingredients once and the app works out the calories per serving.')}</div>`);
  return html;
}

function deschideReteta(id) {
  retete.curenta = (retete.lista || []).find(r => r.id === id) || null;
  if (!retete.curenta) return;
  retete.vedere = 'reteta';
  if (!laAntrenorRetete()) { antrPers.ecran = 'nutritie-reteta'; arataInapoiAntrPers(); }
  randeazaRetete();
}

function htmlReteta() {
  const r = retete.curenta, v = valoriReteta(r);
  const editabila = laAntrenorRetete() ? !r.client_id : !!r.client_id;
  const placa = (k, ro, en) => `<div class="nutritie-macro ${k}"><span>${tr(ro, en)}</span><b>${formatKg(v.portie[k])} g</b></div>`;
  const masa = nutritie.masa || masaImplicita();
  return `<div class="card reteta-card">
      <b class="nutritie-produs-nume">${escAttr(r.nume)}</b>
      <div class="acasa-antrenament-detalii">${r.client_id ? tr('Rețeta ta', 'Your recipe') : laAntrenorRetete() ? tr('Rețeta ta · o văd clienții tăi', 'Your recipe · your clients see it') : tr('De la antrenor', 'From your trainer')} · ${r.portii} ${Number(r.portii) === 1 ? tr('porție', 'serving') : tr('porții', 'servings')} · ~${formatKg(Math.round(v.gramePortie))} g ${tr('porția', 'per serving')}${r.timp_min ? ` · ${r.timp_min} min` : ''}</div>
      <div class="nutritie-calcul">
        <div class="nutritie-kcal-mare"><b>${Math.round(v.portie.kcal)}</b> kcal <span>${tr('pe porție', 'per serving')}</span></div>
        <div class="nutritie-macro-uri">${placa('proteine', 'Proteine', 'Protein')}${placa('carbo', 'Carbohidrați', 'Carbohydrates')}${placa('grasimi', 'Grăsimi', 'Fat')}</div>
      </div>
      ${laAntrenorRetete() ? '' : `<div class="checkin-eticheta" style="margin-top:12px;">${tr('Adaugă în jurnal', 'Add to the log')}</div>
      <div class="antr-pers-activitati" id="retetaMese">${MESE_NUTRITIE.map(([cod, ro, en]) => `<button type="button" class="antr-pers-activitate${cod === masa ? ' activ' : ''}" data-masa="${cod}" onclick="this.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('activ', b === this))">${tr(ro, en)}</button>`).join('')}</div>
      <div class="reteta-portii-rand">
        <label class="ciclu-camp">${tr('Porții', 'Servings')}<input type="number" inputmode="decimal" id="retetaPortii" class="plan-ex-input" value="1" min="0.25" max="20" step="0.25"></label>
        <button type="button" class="btn" onclick="adaugaRetetaInJurnal(this)">${tr('Adaugă', 'Add')}</button>
      </div>`}
    </div>
    <div class="antr-pers-sectiune">${tr('Ingrediente', 'Ingredients')} <small>(${tr('pentru toată rețeta', 'for the whole recipe')})</small></div>
    <div class="card">${(r.ingrediente || []).map(i => `<div class="nutritie-rand">${htmlImagineProdus(i.imagine, 'mica')}
        <div class="nutritie-rand-text"><div class="nutritie-rand-nume">${escAttr(i.nume)}${i.marca ? ` <small>${escAttr(i.marca)}</small>` : ''}</div>
        <div class="acasa-antrenament-detalii">${formatKg(Number(i.cantitate_g))} g · ${Math.round(valoriPentruGrame(i, Number(i.cantitate_g)).kcal)} kcal</div></div></div>`).join('')}</div>
    ${r.instructiuni ? `<div class="antr-pers-sectiune">${tr('Mod de preparare', 'Method')}</div><div class="card reteta-instructiuni">${escAttr(r.instructiuni)}</div>` : ''}
    <div class="nutritie-adauga-jos">
      ${laAntrenorRetete() ? '' : `<button type="button" class="btn btn-clear" onclick="adaugaLaCumparaturi()">🛒 ${tr('Pune ingredientele pe lista de cumpărături', 'Add the ingredients to the shopping list')}</button>`}
      ${editabila ? `<button type="button" class="btn btn-clear" onclick="deschideEditorReteta('${r.id}')">${tr('Editează', 'Edit')}</button>
        <button type="button" class="btn btn-clear ciclu-opreste" onclick="stergeReteta('${r.id}')">${tr('Șterge rețeta', 'Delete recipe')}</button>` : ''}
    </div>`;
}

// Rețeta în jurnal: un rând cu numele ei, cu gramele porțiilor și valorile la 100 g ale rețetei
async function adaugaRetetaInJurnal(btn) {
  const r = retete.curenta, v = valoriReteta(r);
  const portii = parseFloat(String(document.getElementById('retetaPortii').value).replace(',', '.'));
  if (!(portii > 0 && portii <= 20)) return showToast(tr('Câte porții? (între 0,25 și 20)', 'How many servings? (0.25 to 20)'), 'error');
  const masa = (document.querySelector('#retetaMese .activ') || {}).dataset?.masa || masaImplicita();
  const produs = Object.assign({ nume: r.nume, marca: tr('Rețetă', 'Recipe'), cod: null, imagine: '' }, v.la100);
  btn.disabled = true;
  if (!nutritie.zi) nutritie.zi = aziIsoAntrPers();
  const ok = await insereazaInJurnal([{ produs, grame: Math.max(1.1, v.gramePortie * portii) }], masa);
  btn.disabled = false;
  if (!ok) return;
  showToast(tr(`✓ ${r.nume}: ${Math.round(v.portie.kcal * portii)} kcal`, `✓ ${r.nume}: ${Math.round(v.portie.kcal * portii)} kcal`));
  antrPers.ecran = 'nutritie';
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  randeazaNutritieZi();
}

function stergeReteta(id) {
  customConfirm(tr('Ștergi rețeta?', 'Delete the recipe?'), tr('Ce ai notat deja în jurnal rămâne.', 'What you already logged stays.'), async () => {
    const { error } = await supabaseClient.from('retete').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Verifică internetul.', 'Could not delete. Check your internet.'), 'error');
    retete.lista = retete.lista.filter(r => r.id !== id);
    retete.vedere = 'lista';
    if (!laAntrenorRetete()) antrPers.ecran = 'nutritie-retete';
    randeazaRetete();
  });
}

// ---- Editorul: nume, porții, timp, ingrediente (căutate ca la jurnal), mod de preparare ----
function deschideEditorReteta(id) {
  const r = id ? (retete.lista || []).find(x => x.id === id) : null;
  retete.editor = r ? JSON.parse(JSON.stringify({ id: r.id, nume: r.nume, portii: r.portii, timp_min: r.timp_min, instructiuni: r.instructiuni, ingrediente: r.ingrediente }))
    : { id: null, nume: '', portii: 4, timp_min: null, instructiuni: '', ingrediente: [] };
  retete.cautare = '';
  retete.rezultate = [];
  retete.vedere = 'editor';
  if (!laAntrenorRetete()) { antrPers.ecran = 'nutritie-reteta-editor'; arataInapoiAntrPers(); }
  randeazaRetete();
}

function htmlEditorReteta() {
  const e = retete.editor;
  const v = valoriReteta(e);
  const rez = retete.rezultate;
  return `<div class="card obiectiv-form">
      <div class="antr-pers-campuri"><label>${tr('Numele rețetei *', 'Recipe name *')}<input type="text" class="plan-ex-input" maxlength="120" value="${escAttr(e.nume)}" placeholder="${tr('ex. Ciorbă de legume', 'e.g. Vegetable soup')}" oninput="retete.editor.nume = this.value"></label></div>
      <div class="antr-pers-campuri">
        <label>${tr('Câte porții iese', 'Servings')}<input type="number" inputmode="numeric" class="plan-ex-input" min="1" max="50" value="${e.portii}" onchange="retete.editor.portii = Math.max(1, Math.min(50, parseInt(this.value, 10) || 1)); randeazaRetete()"></label>
        <label>${tr('Timp (min, opțional)', 'Time (min, optional)')}<input type="number" inputmode="numeric" class="plan-ex-input" min="1" max="1440" value="${e.timp_min ?? ''}" oninput="retete.editor.timp_min = parseInt(this.value, 10) || null"></label>
      </div>
    </div>
    <div class="antr-pers-sectiune">${tr('Ingrediente', 'Ingredients')} <small>(${tr('pentru toată rețeta', 'for the whole recipe')})</small></div>
    <div class="card">
      ${e.ingrediente.length ? e.ingrediente.map((i, k) => `<div class="nutritie-rand">${htmlImagineProdus(i.imagine, 'mica')}
        <div class="nutritie-rand-text"><div class="nutritie-rand-nume">${escAttr(i.nume)}</div>
        <div class="acasa-antrenament-detalii">${formatKg(Number(i.cantitate_g))} g · ${Math.round(valoriPentruGrame(i, Number(i.cantitate_g)).kcal)} kcal</div></div>
        <button type="button" class="notificare-x nutritie-sterge" onclick="retete.editor.ingrediente.splice(${k}, 1); randeazaRetete()" aria-label="${tr('Scoate', 'Remove')}">×</button></div>`).join('')
        : `<div class="acasa-antrenament-detalii">${tr('Caută ingredientele mai jos și scrie cantitatea pentru toată rețeta.', 'Search the ingredients below and enter the amount for the whole recipe.')}</div>`}
      ${e.ingrediente.length ? `<div class="reteta-total">${tr('Pe porție', 'Per serving')}: <b>${Math.round(v.portie.kcal)} kcal</b> · ${tr('Proteine', 'Protein')} ${formatKg(v.portie.proteine)} g · ${tr('Carbohidrați', 'Carbohydrates')} ${formatKg(v.portie.carbo)} g · ${tr('Grăsimi', 'Fat')} ${formatKg(v.portie.grasimi)} g</div>` : ''}
      <div class="antr-pers-adauga" style="margin-top:10px;">
        <input type="search" id="retetaCauta" class="plan-ex-input" maxlength="60" value="${escAttr(retete.cautare)}" placeholder="${tr('Caută ingredientul (ex: morcovi)', 'Search the ingredient (e.g. carrots)')}" onkeydown="if (event.key === 'Enter') cautaIngredient()">
        <button type="button" class="btn" onclick="cautaIngredient()">${tr('Caută', 'Search')}</button>
      </div>
      ${rez === 'cautare' ? `<div class="progres-gol">${tr('Se caută...', 'Searching...')}</div>`
        : rez.length ? rez.map((p, i) => htmlProdusRand(p, i, 'reteta')).join('')
        : retete.cautare ? `<div class="progres-gol">${tr('Nu am găsit ingredientul.', 'Ingredient not found.')}</div>` : ''}
    </div>
    <div class="antr-pers-sectiune">${tr('Mod de preparare (opțional)', 'Method (optional)')}</div>
    <div class="card"><textarea class="plan-ex-textarea" rows="5" maxlength="4000" oninput="retete.editor.instructiuni = this.value">${escAttr(e.instructiuni || '')}</textarea></div>
    <div class="antr-pers-actiuni" style="margin:12px 0 0;">
      <button type="button" class="btn" onclick="salveazaReteta(this)">${tr('Salvează rețeta', 'Save recipe')}</button>
      <button type="button" class="btn btn-clear" onclick="retete.vedere = '${e.id ? 'reteta' : 'lista'}'; randeazaRetete()">${tr('Renunță', 'Cancel')}</button>
    </div>`;
}

async function cautaIngredient() {
  const q = (document.getElementById('retetaCauta').value || '').trim();
  if (q.length < 2) return;
  retete.cautare = q;
  retete.rezultate = 'cautare';
  randeazaRetete();
  retete.rezultate = await cautaProduse(q);
  if (retete.vedere === 'editor') randeazaRetete();
}

// Ingredientul ales: cantitatea pentru toată rețeta (implicit porția lui sau 100 g)
function alegeIngredient(i) {
  const p = retete.rezultate[i];
  if (!p) return;
  const implicit = p.portie_g || ((p.portii || [])[0] || {}).g || 100;
  customConfirm(p.nume, tr('Câte grame pentru toată rețeta?', 'How many grams for the whole recipe?'), valoare => {
    const g = parseFloat(String(valoare).replace(',', '.'));
    if (!(g > 0 && g <= 10000)) return showToast(tr('Scrie cantitatea în grame.', 'Enter the amount in grams.'), 'error');
    retete.editor.ingrediente.push(alimentDeSalvat(p, rotunjeste1(g)));
    retete.cautare = '';
    retete.rezultate = [];
    randeazaRetete();
  }, { valoare: String(implicit), placeholder: tr('grame', 'grams') });
}

async function salveazaReteta(btn) {
  const e = retete.editor;
  if (!(e.nume || '').trim()) return showToast(tr('Dă un nume rețetei.', 'Give the recipe a name.'), 'error');
  if (!e.ingrediente.length) return showToast(tr('Adaugă cel puțin un ingredient.', 'Add at least one ingredient.'), 'error');
  const proprietar = laAntrenorRetete() ? { user_id: utilizatorCurent.id, client_id: null } : { user_id: dateClienta.fisa.user_id, client_id: dateClienta.fisa.id };
  const rand = Object.assign({ nume: e.nume.trim().slice(0, 120), portii: e.portii, timp_min: e.timp_min || null, ingrediente: e.ingrediente,
    instructiuni: (e.instructiuni || '').slice(0, 4000), updated_at: new Date().toISOString() }, e.id ? {} : proprietar);
  btn.disabled = true;
  const q = e.id ? supabaseClient.from('retete').update(rand).eq('id', e.id) : supabaseClient.from('retete').insert(rand);
  const { data, error } = await q.select().single();
  btn.disabled = false;
  if (error || !data) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  retete.lista = (retete.lista || []).filter(r => r.id !== data.id).concat(data).sort((a, b) => a.nume.localeCompare(b.nume));
  showToast(tr('✓ Rețetă salvată', '✓ Recipe saved'));
  deschideReteta(data.id);
}

// ---- Lista de cumpărături: pe acest dispozitiv, din ingredientele rețetelor, cu bife ----
function cheieCumparaturi() {
  return 'BFIT_CUMPARATURI_' + (utilizatorCurent ? utilizatorCurent.id : '');
}

function listaCumparaturi() {
  try { return JSON.parse(localStorage.getItem(cheieCumparaturi()) || '[]') || []; } catch (e) { return []; }
}

function salveazaCumparaturi(lista) {
  try { localStorage.setItem(cheieCumparaturi(), JSON.stringify(lista)); } catch (e) {}
}

// Ingredientele rețetei deschise, pentru porțiile alese (sau toată rețeta); același ingredient se adună
function adaugaLaCumparaturi() {
  const r = retete.curenta;
  const portii = parseFloat(String((document.getElementById('retetaPortii') || {}).value || '').replace(',', '.')) || Number(r.portii);
  const k = portii / (Number(r.portii) || 1);
  const lista = listaCumparaturi();
  (r.ingrediente || []).forEach(i => {
    const g = (Number(i.cantitate_g) || 0) * k;
    const existent = lista.find(x => !x.bifat && faraDiacritice(x.nume) === faraDiacritice(i.nume));
    if (existent) existent.g = rotunjeste1(existent.g + g); else lista.push({ nume: i.nume, g: rotunjeste1(g), bifat: false });
  });
  salveazaCumparaturi(lista);
  showToast(tr(`🛒 ${r.ingrediente.length} ingrediente pe listă`, `🛒 ${r.ingrediente.length} ingredients on the list`));
}

function htmlCumparaturi() {
  const lista = listaCumparaturi();
  if (!lista.length) return `<div class="progres-gol">${tr('Lista e goală. Deschide o rețetă și apasă „Pune ingredientele pe lista de cumpărături”.', 'The list is empty. Open a recipe and tap “Add the ingredients to the shopping list”.')}</div>`;
  return `<div class="card">${lista.map((x, i) => `<label class="checkin-bifa cumparaturi-rand${x.bifat ? ' bifat' : ''}"><input type="checkbox" ${x.bifat ? 'checked' : ''} onchange="bifeazaCumparatura(${i}, this.checked)"><span>${escAttr(x.nume)} <small>${formatKg(Math.round(x.g))} g</small></span></label>`).join('')}</div>
    <div class="nutritie-adauga-jos">
      <button type="button" class="btn" onclick="trimiteCumparaturi()">${tr('Trimite lista', 'Share the list')}</button>
      <button type="button" class="btn btn-clear" onclick="golesteCumparaturi(true)">${tr('Scoate ce am bifat', 'Remove ticked items')}</button>
      <button type="button" class="btn btn-clear ciclu-opreste" onclick="golesteCumparaturi(false)">${tr('Golește lista', 'Clear the list')}</button>
    </div>`;
}

function bifeazaCumparatura(i, bifat) {
  const lista = listaCumparaturi();
  if (!lista[i]) return;
  lista[i].bifat = bifat;
  salveazaCumparaturi(lista);
  randeazaRetete();
}

function golesteCumparaturi(doarBifate) {
  salveazaCumparaturi(doarBifate ? listaCumparaturi().filter(x => !x.bifat) : []);
  randeazaRetete();
}

// Meniul de partajare al telefonului (WhatsApp, notițe...), cu ce nu e bifat
async function trimiteCumparaturi() {
  const text = tr('Cumpărături', 'Shopping list') + ':\n' + listaCumparaturi().filter(x => !x.bifat).map(x => `• ${x.nume} (${formatKg(Math.round(x.g))} g)`).join('\n');
  if (navigator.share) { try { await navigator.share({ text }); } catch (e) {} return; }
  try { await navigator.clipboard.writeText(text); showToast(tr('✓ Lista copiată', '✓ List copied')); } catch (e) {}
}

// Cardul unei zile din lista zilelor (antrenor, client, link partajat). cuProgres: „făcute / total” în loc de numărul de exerciții
function htmlCardZiPlan(ses, idx, laClick, cuProgres) {
  const lista = (ses.exercitii || []).filter(ex => (ex.exercitiu || '').trim());
  const nume = lista.map(ex => ex.exercitiu.trim());
  const rest = nume.length > 3 ? ` +${nume.length - 3}` : '';
  const facute = lista.filter(ex => ex.status === 'Finalizat').length;
  const gata = cuProgres && lista.length > 0 && facute === lista.length;
  return `
    <button type="button" class="plan-zi-card" id="planZiCard${idx}" onclick="${laClick}">
      <span class="plan-zi-card-text">
        <span class="plan-zi-card-titlu">${escAttr(ses.titlu || tr(`Ziua ${idx + 1}`, `Day ${idx + 1}`))}</span>
        <span class="plan-zi-card-detalii">${nume.length ? escAttr(nume.slice(0, 3).join(' · ')) + rest : tr('Niciun exercițiu încă', 'No exercises yet')}</span>
      </span>
      <span class="plan-zi-card-nr${gata ? ' is-gata' : ''}">${cuProgres ? (gata ? '✓' : `${facute}/${lista.length}`) : lista.length}</span>
      <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  `;
}

function textProgresSesiune(ses) {
  const lista = (ses.exercitii || []).filter(ex => (ex.exercitiu || '').trim());
  return tr(`${lista.filter(ex => ex.status === 'Finalizat').length} din ${lista.length} făcute`, `${lista.filter(ex => ex.status === 'Finalizat').length} of ${lista.length} done`);
}

// Greutatea notată ultima dată la același exercițiu, în alt plan (planurile vin de la cel mai recent)
function ultimaGreutateClienta(nume, idPlan) {
  const cheie = (nume || '').trim().toLowerCase();
  if (!cheie) return '';
  for (const p of dateClienta.planuri || []) {
    if (p.id === idPlan) continue;
    for (const ses of p.continut_json?.sesiuni || []) {
      const ex = (ses.exercitii || []).find(x => (x.exercitiu || '').trim().toLowerCase() === cheie && (x.greutate_kg || '').trim());
      if (ex) return ex.greutate_kg.trim();
    }
  }
  return '';
}

// ---- Notarea pe serii (clientul): câte un rând pe serie, cu bifă; exercițiul e „Făcut” când toate seriile sunt bifate ----

// „4 × 10-12” → 4 serii și ținta „10-12”; fără număr de serii (ex. „15-20 min”) → o singură serie
function seriiPlanificate(ex) {
  const text = (ex.seturi_repetari || '').trim();
  const m = text.match(/^(\d+)\s*(?:[×x*]|circuit)/i);
  const tinta = text.includes('×') || /\d\s*x\s*\d/i.test(text) ? text.split(/[×x]/i).slice(1).join('×').trim() : '';
  return { nr: m ? Math.min(Math.max(+m[1], 1), 10) : (text ? 1 : 3), tinta };
}

// Seriile exercițiului, completate până la numărul planificat (cele notate deja rămân)
function seriiExercitiu(ex) {
  if (!Array.isArray(ex.serii)) ex.serii = [];
  const nr = seriiPlanificate(ex).nr;
  // Exercițiile bifate „Făcut” înainte de notarea pe serii apar cu toate seriile bifate, cu greutatea notată atunci
  const faraSerii = ex.serii.length === 0 && ex.status === 'Finalizat';
  while (ex.serii.length < nr) ex.serii.push({ kg: faraSerii ? String(ex.greutate_kg || '').trim() : '', rep: '', gata: faraSerii });
  return ex.serii;
}

// Seriile notate data trecută la același exercițiu, în alt plan (planurile vin de la cel mai recent)
function seriiDataTrecuta(nume, idPlan) {
  const cheie = (nume || '').trim().toLowerCase();
  if (!cheie) return [];
  // Întâi săptămânile anterioare ale aceluiași plan (cea mai recentă prima), apoi celelalte planuri
  const plan = (dateClienta.planCurent && dateClienta.planCurent.id === idPlan) ? dateClienta.planCurent : (dateClienta.planuri || []).find(p => p.id === idPlan);
  const istoric = (plan && plan.continut_json && Array.isArray(plan.continut_json.istoric_saptamani)) ? plan.continut_json.istoric_saptamani : [];
  for (let i = istoric.length - 1; i >= 0; i--) {
    for (const ses of istoric[i].sesiuni || []) {
      const ex = (ses.exercitii || []).find(x => (x.exercitiu || '').trim().toLowerCase() === cheie && Array.isArray(x.serii) && x.serii.some(r => r.gata));
      if (ex) return ex.serii;
    }
  }
  for (const p of dateClienta.planuri || []) {
    if (p.id === idPlan) continue;
    for (const ses of p.continut_json?.sesiuni || []) {
      const ex = (ses.exercitii || []).find(x => (x.exercitiu || '').trim().toLowerCase() === cheie && Array.isArray(x.serii) && x.serii.some(r => r.gata));
      if (ex) return ex.serii;
    }
  }
  return [];
}

// Recordul personal la un exercițiu: cea mai mare greutate notată vreodată înainte (săptămânile trecute, celelalte planuri,
// celelalte zile din planul curent), fără exercițiul de acum. 0 = încă nimic notat, deci nici record.
const numarKg = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; };
function kgMaxExercitiu(x) {
  const din = Array.isArray(x.serii) && x.serii.length ? x.serii.filter(r => r.gata).map(r => numarKg(r.kg)) : [numarKg(x.greutate_kg)];
  return Math.max(0, ...din);
}
function recordAnteriorKg(ex, idPlan) {
  const cheie = (ex.exercitiu || '').trim().toLowerCase();
  if (!cheie) return 0;
  let max = 0;
  const vezi = sesiuni => (sesiuni || []).forEach(ses => (ses.exercitii || []).forEach(x => {
    if (x !== ex && (x.exercitiu || '').trim().toLowerCase() === cheie) max = Math.max(max, kgMaxExercitiu(x));
  }));
  const curent = dateClienta.planCurent && dateClienta.planCurent.id === idPlan ? dateClienta.planCurent : null;
  for (const p of dateClienta.planuri || []) {
    const plan = curent && p.id === idPlan ? curent : p;
    (plan.continut_json?.istoric_saptamani || []).forEach(sapt => vezi(sapt.sesiuni));
    if (p.id !== idPlan) vezi(plan.continut_json?.sesiuni);
  }
  if (curent) vezi(curent.continut_json?.sesiuni);
  return max;
}

function htmlSeriiClienta(ex, s, e, idPlan) {
  const tip = ex.tip || 'kg';
  const { tinta } = seriiPlanificate(ex);
  const trecut = seriiDataTrecuta(ex.exercitiu, idPlan);
  // Seria cu cea mai mare greutate de azi primește eticheta „Record” când depășește tot ce s-a notat înainte
  const record = tip === 'kg' ? recordAnteriorKg(ex, idPlan) : 0;
  const kgAzi = tip === 'kg' ? kgMaxExercitiu(ex) : 0;
  const iRecord = record > 0 && kgAzi > record ? (ex.serii || []).findIndex(r => r.gata && numarKg(r.kg) === kgAzi) : -1;
  const kgVechi = ultimaGreutateClienta(ex.exercitiu, idPlan);
  const unitate = { rep: tr('Rep', 'Reps'), sec: tr('Sec', 'Sec'), min: tr('Min', 'Min') };
  const cuKg = tip === 'kg';
  const cuRep = tip !== 'circuit';
  const cap = `<div class="serie-rand serie-cap"><span class="serie-nr">${tr('Seria', 'Set')}</span>
    ${cuKg ? `<span class="serie-camp">Kg</span><span class="serie-x"></span>` : ''}
    ${cuRep ? `<span class="serie-camp">${unitate[tip] || unitate.rep}</span>` : '<span class="serie-camp"></span>'}
    <span class="serie-bifa-loc"></span></div>`;
  const randuri = seriiExercitiu(ex).map((r, i) => {
    const vechi = trecut[i] || {};
    const phKg = vechi.kg || kgVechi || 'kg';
    const phRep = vechi.rep || (tinta.match(/\d+(?:-\d+)?/) || [''])[0] || '-';
    return `<div class="serie-rand${r.gata ? ' is-gata' : ''}${i === iRecord ? ' is-record' : ''}">
      <span class="serie-nr">${i + 1}</span>
      ${cuKg ? `<input type="text" inputmode="decimal" maxlength="10" class="plan-ex-input serie-camp" value="${escAttr(r.kg)}" placeholder="${escAttr(phKg)}" oninput="peModificareSerieClienta(${s}, ${e}, ${i}, 'kg', this.value)"><span class="serie-x">×</span>` : ''}
      ${cuRep ? `<input type="text" inputmode="numeric" maxlength="10" class="plan-ex-input serie-camp" value="${escAttr(r.rep)}" placeholder="${escAttr(phRep)}" oninput="peModificareSerieClienta(${s}, ${e}, ${i}, 'rep', this.value)">` : `<span class="serie-camp serie-circuit">${tr('Circuitul', 'Circuit')} ${i + 1}</span>`}
      <button type="button" class="serie-bifa" aria-pressed="${!!r.gata}" aria-label="${tr('Serie făcută', 'Set done')}" onclick="bifeazaSerieClienta(${s}, ${e}, ${i})">✓</button>
    </div>`;
  }).join('');
  return `<div class="serii-lista">${cap}${randuri}</div>`;
}

// Greutatea maximă, numărul de serii făcute și statusul se calculează din serii (le folosesc PDF-ul și antrenorul)
function actualizeazaDinSerii(ex) {
  const facute = ex.serii.filter(r => r.gata);
  const kg = facute.map(r => parseFloat(String(r.kg).replace(',', '.'))).filter(n => !isNaN(n));
  ex.greutate_kg = kg.length ? String(Math.max(...kg)) : '';
  ex.seturi_finalizate = facute.length ? String(facute.length) : '';
  ex.status = facute.length === ex.serii.length ? 'Finalizat' : '';
}

function peModificareSerieClienta(s, e, i, camp, valoare) {
  const ex = dateClienta.planCurent?.continut_json?.sesiuni?.[s]?.exercitii?.[e];
  if (!ex || !ex.serii?.[i]) return;
  ex.serii[i][camp] = valoare;
  actualizeazaDinSerii(ex);
  peModificareProgresClienta(s, e, 'status', ex.status);
}

// Bifa pe o serie goală preia valorile de data trecută (sau ținta), ca seria repetată să nu trebuiască rescrisă
function bifeazaSerieClienta(s, e, i) {
  const ses = dateClienta.planCurent?.continut_json?.sesiuni?.[s];
  const ex = ses?.exercitii?.[e];
  if (!ex) return;
  const r = seriiExercitiu(ex)[i];
  const kgInainte = kgMaxExercitiu(ex);
  r.gata = !r.gata;
  if (r.gata) {
    // De data trecută la aceeași serie; altfel ca seria de deasupra
    const vechi = seriiDataTrecuta(ex.exercitiu, dateClienta.planCurent.id)[i] || ex.serii[i - 1] || {};
    const tinta = seriiPlanificate(ex).tinta;
    if ((ex.tip || 'kg') === 'kg' && !String(r.kg).trim()) r.kg = vechi.kg || ultimaGreutateClienta(ex.exercitiu, dateClienta.planCurent.id) || '';
    if (!String(r.rep).trim()) r.rep = vechi.rep || (/^\d+$/.test(tinta.replace(/\s*(rep|s|sec)\.?$/i, '')) ? tinta.replace(/\D+$/, '') : '');
  }
  actualizeazaDinSerii(ex);
  // Ziua antrenamentului: data primei serii bifate în ziua din plan (graficele de progres); fără nicio bifă se golește
  const bifeZi = (ses.exercitii || []).some(x => (x.serii || []).some(z => z.gata));
  if (r.gata && !ses.data_client) ses.data_client = aziIsoAntrPers();
  else if (!bifeZi) ses.data_client = '';
  peModificareProgresClienta(s, e, 'status', ex.status);
  // Record personal: o singură dată pe exercițiu, când seria bifată trece peste tot ce a ridicat înainte
  if (r.gata && (ex.tip || 'kg') === 'kg') {
    const record = recordAnteriorKg(ex, dateClienta.planCurent.id);
    const kg = numarKg(r.kg);
    if (record > 0 && kg > record && kg > kgInainte) {
      showToast(tr(`Record nou: ${formatKg(kg)} kg la ${ex.exercitiu} (înainte ${formatKg(record)} kg)`, `New record: ${formatKg(kg)} kg on ${ex.exercitiu} (was ${formatKg(record)} kg)`));
      if (navigator.vibrate) navigator.vibrate(80);
      // Antrenorul îl vede în conversație (o singură dată pe exercițiu și greutate)
      const cheie = ex.exercitiu + '|' + kg;
      if (!recorduriTrimise.has(cheie)) {
        recorduriTrimise.add(cheie);
        trimiteContextInConversatie('record', `${formatKg(kg)} kg (${tr('înainte', 'was')} ${formatKg(record)} kg)`, { exercitiu: ex.exercitiu, zi: ses.titlu || '' });
      }
    }
  }
  const sus = document.getElementById('clientaScreen')?.scrollTop;
  randeazaPlanClienta();
  if (sus !== undefined) document.getElementById('clientaScreen').scrollTop = sus;
  // Obiectivele: săptămâna (prima serie bifată face ziua activă) și greutatea la exerciții
  if (r.gata) { verificaObiectivSaptamanaAtins(); verificaObiectiveAtinse(); }
  // Pauza pornește după fiecare serie bifată, mai puțin după ultima serie a zilei
  const ultimaZilei = e === ses.exercitii.length - 1 && i === ex.serii.length - 1;
  if (r.gata && !ultimaZilei) pornesteTimerPauza(ex.pauza);
  else opresteTimerPauza();
}

// ---- Timer de pauză: pornește singur la bifarea unei serii; +15 sec sau „Sari peste” ----
let timerPauza = { id: null, ramas: 0 };

function pornesteTimerPauza(pauza) {
  // „90-120 sec” → 90; „2 min” → 120; fără pauză → 60
  const m = String(pauza || '').match(/(\d+)/);
  let sec = m ? +m[1] : 60;
  if (/min/i.test(pauza || '') && sec < 10) sec *= 60;
  let bara = document.getElementById('timerPauza');
  if (!bara) {
    bara = document.createElement('div');
    bara.id = 'timerPauza';
    bara.className = 'timer-pauza';
    bara.innerHTML = `<span class="timer-pauza-text">${tr('Pauză', 'Rest')} <b id="timerPauzaTimp"></b></span>
      <button type="button" class="timer-pauza-btn" onclick="adaugaTimpPauza(15)">+15s</button>
      <button type="button" class="timer-pauza-btn" onclick="opresteTimerPauza()">${tr('Sari peste', 'Skip')}</button>`;
    document.body.appendChild(bara);
  }
  // Deasupra meniului de jos (care plutește la o distanță de margine)
  const nav = document.getElementById('clientaNav');
  const susNav = nav && nav.offsetHeight ? nav.getBoundingClientRect().top : window.innerHeight;
  bara.style.bottom = Math.round(window.innerHeight - susNav + 10) + 'px';
  clearInterval(timerPauza.id);
  timerPauza.ramas = sec;
  bara.classList.remove('is-gata');
  bara.classList.add('is-vizibil');
  afiseazaTimpPauza();
  timerPauza.id = setInterval(() => {
    timerPauza.ramas--;
    afiseazaTimpPauza();
    if (timerPauza.ramas <= 0) {
      clearInterval(timerPauza.id);
      timerPauza.id = null;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      bara.classList.add('is-gata');
      document.getElementById('timerPauzaTimp').innerText = tr('gata, următoarea serie!', 'done, next set!');
      setTimeout(() => { if (!timerPauza.id) bara.classList.remove('is-vizibil'); }, 3000);
    }
  }, 1000);
}

function afiseazaTimpPauza() {
  const el = document.getElementById('timerPauzaTimp');
  const t = Math.max(0, timerPauza.ramas);
  if (el) el.innerText = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function adaugaTimpPauza(sec) {
  if (!timerPauza.id) return;
  timerPauza.ramas += sec;
  afiseazaTimpPauza();
}

function opresteTimerPauza() {
  clearInterval(timerPauza.id);
  timerPauza.id = null;
  document.getElementById('timerPauza')?.classList.remove('is-vizibil');
}

function seteazaStareSalvareClienta(ro, en, eroare) {
  const el = document.getElementById('clientaStareSalvare');
  if (!el) return;
  el.innerText = tr(ro, en);
  el.style.color = eroare ? 'var(--color-absenta)' : 'var(--text-muted)';
}

function peModificareProgresClienta(s, e, camp, valoare) {
  const ex = dateClienta.planCurent?.continut_json?.sesiuni?.[s]?.exercitii?.[e];
  if (!ex) return;
  ex[camp] = valoare;
  programeazaSalvareProgres();
}

function programeazaSalvareProgres() {
  seteazaStareSalvareClienta('Se salvează...', 'Saving...');
  clearTimeout(timerSalvareProgres);
  timerSalvareProgres = setTimeout(salveazaProgresClienta, 1200);
}

// Notița zilei („Cum a mers antrenamentul?”), citită de antrenor în plan
function peModificareNotaSesiune(s, valoare) {
  const ses = dateClienta.planCurent?.continut_json?.sesiuni?.[s];
  if (!ses) return;
  ses.nota_client = valoare;
  programeazaSalvareProgres();
}

// Trimite doar progresul (greutate, seturi, status, serii, notițe); funcția din baza de date nu atinge restul planului
async function salveazaProgresClienta() {
  const p = dateClienta.planCurent;
  if (timerSalvareProgres === null || !p) return;
  clearTimeout(timerSalvareProgres);
  timerSalvareProgres = null;
  const progres = [];
  (p.continut_json?.sesiuni || []).forEach((ses, s) => {
    progres.push({ s, nota_sesiune: ses.nota_client || '', data: ses.data_client || '' });
    (ses.exercitii || []).forEach((ex, e) => {
      progres.push({ s, e, greutate_kg: ex.greutate_kg || '', seturi_finalizate: ex.seturi_finalizate || '', status: ex.status || '', serii: ex.serii || [], nota: ex.nota_client || '' });
    });
  });
  const i = dateClienta.planuri.findIndex(x => x.id === p.id);
  if (i >= 0) dateClienta.planuri[i] = JSON.parse(JSON.stringify(p));
  const { data, error } = await supabaseClient.rpc('salveaza_progres_plan', { p_id: p.id, p_progres: progres });
  // Fără semnal (des la sală): progresul rămâne pe telefon și se trimite singur când revine internetul
  if (eroareDeRetea(error)) {
    memoreazaProgresNetrimis(p.id, progres);
    salveazaCacheClienta();
    seteazaStareSalvareClienta('Salvat pe acest dispozitiv. Se trimite când revine internetul.', 'Saved on this device. It will sync when you’re back online.');
    return;
  }
  if (error || data !== true) {
    seteazaStareSalvareClienta('Nu s-a putut salva. Încearcă din nou.', 'Could not save. Try again.', true);
    showToast(tr('Eroare sincronizare', 'Sync error'), 'error');
    return;
  }
  stergeProgresNetrimis(p.id);
  seteazaStareSalvareClienta('Salvat ✓', 'Saved ✓');
  posteazaPlanInComunitate(p);
  salveazaCacheClienta();
}

// ---- Progresul netrimis (fără internet): ultima variantă a fiecărui plan, pe telefon, până se trimite ----
function eroareDeRetea(error) {
  return !navigator.onLine || !!(error && /fetch|network|load failed|timeout|connection/i.test(error.message || ''));
}

function cheieProgresNetrimis() {
  return 'BFIT_PROGRES_NETRIMIS_' + (utilizatorCurent ? utilizatorCurent.id : '');
}

function progresNetrimis() {
  try { return JSON.parse(localStorage.getItem(cheieProgresNetrimis()) || '{}') || {}; } catch (e) { return {}; }
}

function memoreazaProgresNetrimis(idPlan, progres) {
  try { localStorage.setItem(cheieProgresNetrimis(), JSON.stringify(Object.assign(progresNetrimis(), { [idPlan]: progres }))); } catch (e) {}
}

function stergeProgresNetrimis(idPlan) {
  const toate = progresNetrimis();
  if (!(idPlan in toate)) return;
  delete toate[idPlan];
  try {
    if (Object.keys(toate).length) localStorage.setItem(cheieProgresNetrimis(), JSON.stringify(toate));
    else localStorage.removeItem(cheieProgresNetrimis());
  } catch (e) {}
}

// Trimite tot ce a rămas netrimis; se oprește la prima eroare de rețea (reîncearcă la revenirea internetului)
let trimitereNetrimisInCurs = null;
function trimiteProgresNetrimis() {
  if (trimitereNetrimisInCurs) return trimitereNetrimisInCurs;
  trimitereNetrimisInCurs = (async () => {
    for (const [idPlan, progres] of Object.entries(progresNetrimis())) {
      const { data, error } = await supabaseClient.rpc('salveaza_progres_plan', { p_id: idPlan, p_progres: progres });
      if (eroareDeRetea(error)) return;
      // Trimis, sau planul nu mai e al clientului (șters de antrenor): nu se mai reîncearcă
      stergeProgresNetrimis(idPlan);
      if (!error && data === true && dateClienta.planCurent && dateClienta.planCurent.id === idPlan) seteazaStareSalvareClienta('Salvat ✓', 'Saved ✓');
    }
  })().finally(() => { trimitereNetrimisInCurs = null; });
  return trimitereNetrimisInCurs;
}

// Planurile cu progres încă netrimis rămân în varianta de pe telefon, nu cea (mai veche) din bază
function pastreazaPlanuriNetrimise(planuriNoi) {
  const netrimise = progresNetrimis();
  return (planuriNoi || []).map(p => netrimise[p.id] ? ((dateClienta.planuri || []).find(x => x.id === p.id) || p) : p);
}

window.addEventListener('online', () => {
  if (rolUtilizator === 'clienta' && Object.keys(progresNetrimis()).length) trimiteProgresNetrimis();
});
setInterval(() => {
  if (rolUtilizator === 'clienta' && navigator.onLine && Object.keys(progresNetrimis()).length) trimiteProgresNetrimis();
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && timerSalvareProgres !== null) salveazaProgresClienta();
  // Conexiunea în timp real poate cădea cât telefonul e în fundal: la revenire recitim locurile, notificările și planurile
  if (document.visibilityState === 'visible' && utilizatorCurent) incarcaNotificari();
  if (document.visibilityState === 'visible' && rolUtilizator === 'clienta' && dateClienta.fisa) {
    laSchimbareOrarClienta();
    reincarcaDateClienta();
  }
});

// Abonamentul și planurile clientului, recitite fără repornirea aplicației (plan nou, notă, reînnoire)
async function reincarcaDateClienta() {
  if (rolUtilizator !== 'clienta' || !dateClienta.fisa || !supabaseClient || !utilizatorCurent) return;
  if (Object.keys(progresNetrimis()).length) await trimiteProgresNetrimis();
  const [resFisa, resPlanuri] = await Promise.all([
    supabaseClient.from('cliente').select('*').eq('auth_user_id', utilizatorCurent.id).limit(1),
    supabaseClient.from('planuri_antrenament').select('*').order('updated_at', { ascending: false })
  ]);
  const c = resFisa.data && resFisa.data[0];
  if (resFisa.error || resPlanuri.error || !c) return;
  dateClienta.fisa = c;
  dateClienta.planuri = pastreazaPlanuriNetrimise(resPlanuri.data || []);
  // Doar Acasă se redesenează, și nu cât e deschis un plan: progresul bifat acolo nu se pierde
  if (clientaTabCurent === 'acasa' && !dateClienta.planCurent && !antrPers.ecran) randeazaHomeClienta();
  salveazaCacheClienta();
  incarcaRezumatAcasa();
}

// ---- Orar în timp real (Supabase Realtime Broadcast, un canal pe antrenor) ----
// Mesajul nu conține date, doar „s-a schimbat orarul”: clienta recitește prin sloturi_deschise (regulile din bază rămân),
// antrenorul își reîncarcă baza. Expeditorul nu-și primește propriul mesaj.
const ACTIUNI_CARE_SCHIMBA_ORARUL = ['seteazaSlotDeschis', 'comutaBlocareOra', 'salveazaSlotAuto', 'bifeazaPrezenta', 'anuleazaSlot'];
let canalOrar = null;
let timerReincarcareOrar = null;

function conecteazaCanalOrar(idAntrenor, laSchimbare) {
  if (!supabaseClient || !idAntrenor) return;
  if (canalOrar) supabaseClient.removeChannel(canalOrar);
  canalOrar = supabaseClient.channel('orar-' + idAntrenor)
    .on('broadcast', { event: 'schimbat' }, laSchimbare)
    .subscribe();
}

function anuntaSchimbareOrar() {
  if (canalOrar) canalOrar.send({ type: 'broadcast', event: 'schimbat', payload: {} });
}

// La antrenor: nu re-randăm orarul cât scrie într-un câmp (ar pierde textul); reîncercăm peste câteva secunde
function laSchimbareOrarAntrenor() {
  clearTimeout(timerReincarcareOrar);
  let tag = document.activeElement ? document.activeElement.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    timerReincarcareOrar = setTimeout(laSchimbareOrarAntrenor, 3000);
    return;
  }
  incarcaBazaDateSilencios();
}

function laSchimbareOrarClienta() {
  if (clientaTabCurent === 'orar') {
    if (!rezervareInCurs) randeazaOrarClienta(true);
  } else {
    actualizeazaBulinaOrar();
  }
}

// ---- Orar (rezervări) și Istoric pentru clientă ----
let clientaTabCurent = 'acasa';
let rezervareInCurs = false;
const ZILE_OFFSET_SLOT = { luni: 0, marti: 1, 'marți': 1, miercuri: 2, joi: 3, vineri: 4, sambata: 5, 'sâmbătă': 5, duminica: 6, 'duminică': 6 };

// ziRaw „W_2026_10_26_Marți" + ora „09:00" -> data și ora slotului (aceeași regulă ca în baza de date)
function dataSlot(ziRaw, ora) {
  const p = (ziRaw || '').split('_');
  const off = ZILE_OFFSET_SLOT[(p[4] || '').toLowerCase()];
  if (off === undefined) return null;
  const d = new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3]) + off);
  const [h, m] = (ora || '0:0').split(':');
  d.setHours(Number(h), Number(m), 0, 0);
  return d;
}

function etichetaZiSlot(d) {
  const text = d.toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function oraSlot(d) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

const TABURI_CLIENTA = ['acasa', 'orar', 'nutritie', 'fisa'];

function clientaTab(tab) {
  salveazaProgresClienta();
  // Bula din bara de jos alunecă la tab-ul nou, ca la antrenor
  const pill = document.getElementById('clientaNavPill');
  const idx = TABURI_CLIENTA.indexOf(tab);
  if (pill && idx !== -1) {
    const drop = pill.querySelector('.nav-mercury-drop');
    if (drop && tab !== clientaTabCurent) {
      drop.classList.add('mercury-morph');
      setTimeout(() => drop.classList.remove('mercury-morph'), 260);
    }
    pill.style.transform = `translateX(${idx * 100}%)`;
  }
  clientaTabCurent = tab;
  // Antrenamentul propriu început rămâne ca ciornă pe dispozitiv (se continuă de pe Acasă)
  if (antrPers.ecran) { antrPers.ecran = null; antrPers.curent = null; opresteTimerPauza(); opresteScanare(); }
  document.getElementById('clientaNav')?.classList.remove('nav-compact');
  TABURI_CLIENTA.forEach(t => document.getElementById('clientaTab_' + t)?.classList.toggle('active', t === tab));
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  if (tab === 'orar') randeazaOrarClienta();
  else if (tab === 'nutritie') deschideNutritie();
  else if (tab === 'fisa') randeazaFisaMeaClienta();
  else randeazaHomeClienta();
}

// „Fișa mea”: check-in-ul săptămânii, progresul (greutate + check-in-uri) și fișa de obiective (doar de citit)
let checkinuriClienta = [];
let checkinFormular = null; // valorile din formularul de check-in deschis; null = formular închis

// Lunea săptămânii curente, 'YYYY-MM-DD' (ca în salveaza_checkin)
function lunaSaptamaniiCurente() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function randeazaFisaMeaClienta() {
  document.getElementById('clientaTitlu').innerText = tr('Fișa mea', 'My profile');
  const corp = document.getElementById('clientaContinut');
  corp.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  const [{ data, error }, resGreutati] = await Promise.all([
    supabaseClient.from('checkin_saptamanal').select('*').eq('client_id', dateClienta.fisa.id),
    supabaseClient.from('greutati').select('*').eq('client_id', dateClienta.fisa.id),
    incarcaListaPoze(dateClienta.fisa.id),
    antrPers.lista === null ? incarcaAntrPers() : null,
    incarcaObiectiveClient()
  ]);
  if (clientaTabCurent !== 'fisa') return;
  checkinuriClienta = error ? [] : (data || []);
  dateClienta.greutati = resGreutati.error ? [] : (resGreutati.data || []);
  checkinFormular = null;
  // Venit de pe cardul de pe Acasă: formularul se deschide după ce s-au încărcat check-in-urile
  if (deschideCheckinLaIncarcare) {
    deschideCheckinLaIncarcare = false;
    deschideCheckin();
    return;
  }
  afiseazaFisaMeaClienta();
}

// Numele abonamentului pentru client: valoarea din bază („8 sedinte”) cu diacritice, în engleză tradus
function numeAbonamentClienta(tip) {
  if (!tip || tip === '-') return '-';
  if (currentLang === 'en') return traduceValoare(tip);
  const t = String(tip).trim();
  const r = t.replace(/sedinta individuala/i, 'Ședință individuală').replace(/sedinta gratuita/i, 'Ședință gratuită').replace(/sedinte/i, 'ședințe');
  return r.charAt(0).toUpperCase() + r.slice(1);
}

// Abonamentul complet, în Fișa mea: stare, ședințe folosite din total, perioada de valabilitate.
// Butoanele de reînnoire (Sună / WhatsApp) rămân pe Acasă, pe cardul care apare când se apropie finalul.
function htmlAbonamentClienta(c) {
  if (!c) return '';
  const incluse = Number(c.incluse) || 0, ramase = Number(c.ramase) || 0, efectuate = Number(c.efectuate) || 0;
  const s = stareAbonamentClienta(Object.assign({}, c, { incluse, ramase }));
  if (s.tip === 'nou') {
    return `<div class="card" style="color:var(--text-muted); font-size:0.85rem;">${tr('Încă nu ai un abonament activ. După prima plată, aici îți vezi ședințele și valabilitatea.', 'You don’t have an active subscription yet. After your first payment, your sessions and validity show up here.')}</div>`;
  }
  const eticheta = { activ: ['badge-activ', tr('Activ', 'Active')], curand: ['badge-curand', s.text], expirat: ['badge-expirat', s.text], arhivat: ['badge-arhivat', s.text] }[s.tip] || ['badge-arhivat', s.text];
  const procent = incluse ? Math.min(100, Math.round(efectuate / incluse * 100)) : 0;
  const fara = v => !v || v === '-';
  const exp = parseazaDataOraRo(c.dataExpirare);
  const azi = new Date(); azi.setHours(0, 0, 0, 0);
  const zile = exp ? Math.round((new Date(exp).setHours(0, 0, 0, 0) - azi) / 86400000) : null;
  const rand = (e, v) => `<div class="abonament-rand"><span>${e}</span><b>${v}</b></div>`;
  return `<div class="card abonament-card">
    <div class="abonament-antet"><b>${escAttr(numeAbonamentClienta(c.tipAbonament))}</b><span class="badge ${eticheta[0]}">${escAttr(eticheta[1])}</span></div>
    <div class="abonament-bara"><span style="width:${procent}%"></span></div>
    <div class="abonament-sub">${tr(`${efectuate} din ${incluse} ședințe folosite`, `${efectuate} of ${incluse} sessions used`)} · <b>${ramase} ${ramase === 1 ? tr('rămasă', 'left') : tr('rămase', 'left')}</b></div>
    ${rand(tr('Început', 'Started'), fara(c.dataStart) ? '-' : escAttr(c.dataStart))}
    ${rand(tr('Valabil până la', 'Valid until'), s.tip === 'inghetat'
      ? tr('în pauză (zilele sunt oprite)', 'paused (days on hold)')
      : fara(c.dataExpirare)
      ? tr('Începe la prima ședință', 'Starts at your first session')
      : `${escAttr(c.dataExpirare)}${zile !== null && zile >= 0 ? ` <span class="abonament-zile">· ${zile === 0 ? tr('azi', 'today') : tr(`încă ${zile} ${zile === 1 ? 'zi' : 'zile'}`, `${zile} ${zile === 1 ? 'day' : 'days'} left`)}</span>` : ''}`)}
  </div>`;
}

function deschideAbonamentDinAcasa() {
  clientaTab('fisa');
  // După ce s-a desenat Fișa mea, se derulează la secțiunea abonamentului
  const asteapta = setInterval(() => {
    const card = document.querySelector('#clientaContinut .abonament-card');
    if (card || clientaTabCurent !== 'fisa') {
      clearInterval(asteapta);
      if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, 100);
  setTimeout(() => clearInterval(asteapta), 5000);
}

// Scurtătura de pe Acasă spre formularul de check-in din Fișa mea
let deschideCheckinLaIncarcare = false;
function deschideCheckinDinAcasa() {
  deschideCheckinLaIncarcare = true;
  clientaTab('fisa');
}

function afiseazaFisaMeaClienta() {
  if (checkinLink) return afiseazaCheckinLink();
  const r = dateClienta.fisa && dateClienta.fisa.fisa_inscriere;
  const titlu = text => `<div style="font-weight:800; color:var(--primary); margin:14px 2px 8px;">${text}</div>`;
  let html = `<button type="button" class="plan-zi-card fisa-istoric-btn" onclick="deschideIstoricClienta()">
      <span class="plan-zi-card-text"><span class="plan-zi-card-titlu">${tr('Istoric', 'History')}</span>
      <span class="plan-zi-card-detalii">${tr('Calendarul, seria de săptămâni și insignele', 'Calendar, weekly streak and badges')}</span></span>
      <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>`;
  html += `<div class="card checkin-card">${htmlCheckinClienta()}</div>`;
  html += titlu(tr('Abonamentul meu', 'My subscription')) + htmlAbonamentClienta(dateClienta.fisa);
  // Planurile mai vechi (cel curent e pe Acasă, la Următorul antrenament)
  if ((dateClienta.planuri || []).length > 1) {
    html += titlu(tr('Planuri anterioare', 'Earlier plans')) + `<div class="plan-fisa-lista">` + dateClienta.planuri.slice(1).map((p, i) => {
      const ex = (p.continut_json?.sesiuni || []).flatMap(s => (s.exercitii || []).filter(x => (x.exercitiu || '').trim()));
      return `<button type="button" class="plan-zi-card" onclick="deschidePlanClienta(${i + 1})">
        <span class="plan-zi-card-text">
          <span class="plan-zi-card-titlu">${escAttr(p.titlu || tr('Plan de antrenament', 'Workout plan'))}</span>
          <span class="plan-zi-card-detalii">${(p.continut_json?.sesiuni || []).length} ${tr('zile', 'days')} · ${ex.length} ${tr('exerciții', 'exercises')}</span>
        </span>
        <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>`;
    }).join('') + `</div>`;
  }
  obiectiveUI = { rol: 'client', clientId: dateClienta.fisa.id, userId: dateClienta.fisa.user_id, lista: (dateClienta.obiective || []).slice(),
    sursa: sursaProgresClient(), zileSapt: zileActiveSaptamanaClient(), editare: null };
  html += titlu(tr('Obiectivele mele', 'My goals')) + `<div id="obiectiveContinut">${htmlObiective()}</div>`;
  html += titlu(tr('Progresul meu', 'My progress')) + `<div class="card">${htmlProgres(r, checkinuriClienta, { greutati: dateClienta.greutati || [], obiectiv: dateClienta.fisa.obiectiv })}</div>`;
  html += titlu(tr('Progres la exerciții', 'Exercise progress')) + htmlProgresExercitii(sursaProgresClient());
  const butonFisa = `<button type="button" class="btn btn-clear fisa-obiective-editeaza" onclick="deschideEditorFisa('${escAttr(dateClienta.fisa.id)}', dateClienta.fisa.fisa_inscriere)">✎ ${r ? tr('Editează fișa', 'Edit my form') : tr('Completează fișa', 'Fill in my form')}</button>`;
  html += `<div id="fisaObiectiveClient"></div>` + titlu(tr('Fișa de obiective', 'Goal-setting form')) + (r
    ? `<div class="card">${htmlRaspunsuriInscriere(r, true)}${htmlModificareFisa(r)}${butonFisa}</div>`
    : `<div class="card"><div style="color:var(--text-muted); font-size:0.85rem;">${tr('Încă nu ai o fișă de obiective. O poți completa acum, iar antrenorul o vede imediat.', 'You don’t have a goal-setting form yet. You can fill it in now and your trainer sees it right away.')}</div>${butonFisa}</div>`);
  document.getElementById('clientaContinut').innerHTML = html;
  umplePoze(document.getElementById('clientaContinut'));
  verificaObiectiveAtinse().then(() => { if (obiectiveUI && obiectiveUI.rol === 'client') { obiectiveUI.lista = (dateClienta.obiective || []).slice(); randeazaObiective(); } });
  // Venit de pe Acasă („Obiective”): direct la secțiunea de obiective
  if (deschideObiectiveLaIncarcare) {
    deschideObiectiveLaIncarcare = false;
    // Titlul secțiunii chiar sub antetul fix (scrollIntoView l-ar lăsa ascuns sub antet)
    const titluOb = document.getElementById('obiectiveContinut')?.previousElementSibling;
    const ecran = document.getElementById('clientaScreen');
    const antet = document.querySelector('#clientaScreen .clienta-header');
    if (titluOb && ecran) ecran.scrollTop += titluOb.getBoundingClientRect().top - (antet ? antet.getBoundingClientRect().bottom : 0) - 8;
  }
}

// Check-in-ul săptămânal: aceleași întrebări ca formularul Google al antrenorului (fără poze, care vin separat).
// Greutatea se salvează în coloana proprie (graficul), restul în `raspunsuri`.
const OPTIUNI_PERFORMANTA = [
  { id: 'progres', ro: 'S-au depășit greutățile/repetările pe exercițiile principale', en: 'Weights/reps went up on the main exercises' },
  { id: 'mentinere', ro: 'Menținere', en: 'Maintained' }
];
const INTREBARI_CHECKIN = [
  { id: 'energie', tip: 'scala', min: 1, max: 10, ob: true, ro: 'Febră musculară și energie', en: 'Muscle soreness and energy',
    detalii: { ro: 'Cum te-ai simțit în timpul antrenamentelor (energie scăzută, dureri articulare)', en: 'How you felt during workouts (low energy, joint pain)' } },
  { id: 'somn', tip: 'scala', min: 1, max: 10, ob: true, ro: 'Somn', en: 'Sleep',
    detalii: { ro: 'Numărul mediu de ore pe noapte și calitatea somnului (1–10)', en: 'Average hours per night and sleep quality (1–10)' } },
  { id: 'performanta', tip: 'multi', ob: true, optiuni: OPTIUNI_PERFORMANTA, ro: 'Performanță în antrenament', en: 'Training performance' },
  { id: 'mese', tip: 'text', ob: true, ro: 'Mese neplanificate în această săptămână', en: 'Unplanned meals this week' },
  { id: 'victorie', tip: 'text', ob: true, ro: 'Cea mai mare victorie a săptămânii', en: 'Biggest win of the week',
    detalii: { ro: 'ex.: „am avut mai multă energie”, „am refuzat un desert”', en: 'e.g. “I had more energy”, “I said no to a dessert”' } },
  { id: 'provocare', tip: 'text', ro: 'Cea mai mare provocare', en: 'Biggest challenge',
    detalii: { ro: 'ex.: ce te-a împiedicat să dai 100%? (dacă e cazul)', en: 'e.g. what kept you from giving 100%? (if anything)' } },
  { id: 'intrebari', tip: 'text', ro: 'Întrebări / nelămuriri', en: 'Questions / doubts' }
];

function htmlCheckinClienta() {
  const saptamana = lunaSaptamaniiCurente();
  const facut = checkinuriClienta.find(c => c.saptamana === saptamana);
  const antet = `<div class="checkin-titlu">${tr('Check-in-ul săptămânii', 'This week’s check-in')}</div>`;
  if (!checkinFormular) {
    if (facut) {
      return `${antet}<div class="checkin-facut">✓ ${tr('Făcut. Antrenorul tău îl vede în fișa ta.', 'Done. Your trainer can see it in your profile.')}</div>
        <button type="button" class="btn btn-clear checkin-btn" onclick="deschideCheckin()">${tr('Modifică', 'Edit')}</button>`;
    }
    return `${antet}<div class="checkin-subtitlu">${tr('Cum a fost săptămâna ta?', 'How was your week?')}</div>
      <button type="button" class="btn checkin-btn" onclick="deschideCheckin()">${tr('Check-in săptămânal', 'Weekly check-in')}</button>`;
  }
  const f = checkinFormular;
  const eticheta = q => `<div class="checkin-eticheta">${escAttr(textInscriere(q))}${q.ob ? ' <span class="inscriere-obligatoriu">*</span>' : ''}</div>
    ${q.detalii ? `<div class="checkin-detalii">${escAttr(textInscriere(q.detalii))}</div>` : ''}`;
  const camp = q => {
    if (q.tip === 'scala') {
      const note = [];
      for (let n = q.min; n <= q.max; n++) note.push(`<button type="button" class="checkin-scala-btn${f[q.id] === n ? ' active' : ''}" onclick="alegeNotaCheckin('${q.id}', ${n})">${n}</button>`);
      return `<div class="checkin-scala" style="grid-template-columns: repeat(${q.max - q.min + 1}, 1fr);">${note.join('')}</div>`;
    }
    if (q.tip === 'multi') {
      return q.optiuni.map(o => `<label class="checkin-bifa"><input type="checkbox" ${(f[q.id] || []).includes(o.id) ? 'checked' : ''} onchange="bifeazaCheckin('${q.id}', '${o.id}', this.checked)"><span>${escAttr(textInscriere(o))}</span></label>`).join('');
    }
    return `<textarea class="form-control checkin-nota-text" rows="1" maxlength="600" oninput="checkinFormular['${q.id}'] = this.value">${escAttr(f[q.id] || '')}</textarea>`;
  };
  return `${antet}
    <div class="checkin-camp" id="checkinQ_greutate">
      <div class="checkin-eticheta">${tr('Greutatea corporală', 'Body weight')} <span class="inscriere-obligatoriu">*</span></div>
      <div class="checkin-detalii">${tr('Media săptămânală (cântărit dimineața, pe stomacul gol) e mai relevantă decât o singură cântărire', 'The weekly average (weighed in the morning, on an empty stomach) tells more than a single weigh-in')}</div>
      <div class="checkin-greutate"><input type="number" inputmode="decimal" step="0.1" min="30" max="300" class="form-control" value="${f.greutate ?? ''}" oninput="checkinFormular.greutate = this.value"><span>kg</span></div>
    </div>
    ${INTREBARI_CHECKIN.map(q => `<div class="checkin-camp" id="checkinQ_${q.id}">${eticheta(q)}${camp(q)}</div>`).join('')}
    ${htmlPozeCheckin()}
    <div class="inscriere-butoane">
      <button type="button" class="btn btn-clear" onclick="checkinFormular = null; afiseazaFisaMeaClienta()">${tr('Renunță', 'Cancel')}</button>
      <button type="button" class="btn" id="btnSalveazaCheckin" onclick="salveazaCheckinClienta()">${tr('Trimite', 'Send')}</button>
    </div>`;
}

function deschideCheckin() {
  const facut = checkinuriClienta.find(c => c.saptamana === lunaSaptamaniiCurente());
  // Check-in-ul săptămânii în formatul nou se poate modifica; unul în formatul vechi (note 1–5) pornește de la zero
  checkinFormular = facut && facut.raspunsuri ? Object.assign({ greutate: facut.greutate }, facut.raspunsuri) : {};
  afiseazaFisaMeaClienta();
}

function alegeNotaCheckin(id, n) {
  checkinFormular[id] = n;
  redeseneazaCheckin();
}

function redeseneazaCheckin() {
  const card = document.querySelector('.checkin-card');
  card.innerHTML = htmlCheckinClienta();
  umplePoze(card);
}

// Pozele de progres din check-in (opțional): față / profil / spate, câte una pe săptămână.
// Cele noi se încarcă la „Trimite”, înainte de check-in; cele scoase se șterg tot atunci.
const UNGHIURI_POZE = [
  { id: 'fata', ro: 'Față', en: 'Front' },
  { id: 'profil', ro: 'Profil', en: 'Side' },
  { id: 'spate', ro: 'Spate', en: 'Back' }
];

function htmlPozeCheckin() {
  if (!URL_POZE) return '';
  const f = checkinFormular;
  const saptamana = lunaSaptamaniiCurente();
  const existente = checkinLink ? [] : pozeCurente.lista.filter(p => p.s === saptamana && !(f.pozeSterse || []).some(x => x.u === p.u));
  const cadre = UNGHIURI_POZE.map(o => {
    const noua = (f.pozeNoi || {})[o.id];
    const veche = existente.find(p => p.u === o.id);
    const img = noua ? `<img src="${noua.url}" alt="">`
      : veche ? `<img data-poza="${escAttr(pozeCurente.client)}|${veche.s}|${veche.u}|${veche.t}" alt="">` : '';
    const scoate = img ? `<button type="button" class="poza-scoate" onclick="scoatePozaCheckin('${o.id}')" aria-label="${tr('Scoate poza', 'Remove photo')}">×</button>` : '';
    return `<div class="poza-cadru${img ? ' are-poza' : ''}">
        <label>
          <input type="file" accept="image/*" hidden onchange="alegePozaCheckin('${o.id}', this)">
          ${img || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`}
        </label>
        ${scoate}
        <span>${tr(o.ro, o.en)}</span>
      </div>`;
  }).join('');
  return `<div class="checkin-camp" id="checkinQ_poze">
      <div class="checkin-eticheta">${tr('Poze de progres', 'Progress photos')}</div>
      <div class="checkin-detalii">${tr('Opțional. Le vedeți doar tu și antrenorul tău.', 'Optional. Only you and your trainer can see them.')}</div>
      <div class="poze-alege">${cadre}</div>
    </div>`;
}

// Poza se micșorează în telefon (max. 1600 px, JPEG) înainte de încărcare: câteva sute de KB în loc de câțiva MB
async function micsoreazaPozaJpeg(fisier) {
  const bmp = await createImageBitmap(fisier);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.82));
  if (!blob) throw new Error('toBlob');
  return blob;
}

async function alegePozaCheckin(unghi, input) {
  const fisier = input.files && input.files[0];
  input.value = '';
  if (!fisier) return;
  try {
    const blob = await micsoreazaPozaJpeg(fisier);
    const f = checkinFormular;
    f.pozeNoi = f.pozeNoi || {};
    if (f.pozeNoi[unghi]) URL.revokeObjectURL(f.pozeNoi[unghi].url);
    f.pozeNoi[unghi] = { blob, url: URL.createObjectURL(blob) };
    redeseneazaCheckin();
  } catch (e) {
    showToast(tr('Poza nu a putut fi citită. Încearcă alta.', 'The photo could not be read. Try another one.'), 'error');
  }
}

// Încarcă pozele noi și le șterge pe cele scoase; false dacă una nu a reușit (cele reușite rămân salvate)
async function trimitePozeCheckin(f) {
  const noi = Object.entries(f.pozeNoi || {});
  if (!noi.length && !(f.pozeSterse || []).length) return true;
  const btn = document.getElementById('btnSalveazaCheckin');
  if (btn) btn.textContent = tr('Se încarcă pozele...', 'Uploading photos...');
  const client = checkinLink ? null : dateClienta.fisa.id;
  for (const [u, p] of noi) {
    const r = await cerePoze('PUT', '/poza', { client, u }, p.blob);
    if (!r || !r.ok) return false;
    URL.revokeObjectURL(p.url);
    delete f.pozeNoi[u];
  }
  for (const p of f.pozeSterse || []) {
    const r = await cerePoze('DELETE', '/poza', { client, s: p.s, u: p.u });
    if (!r || !r.ok) return false;
  }
  f.pozeSterse = [];
  return true;
}

function scoatePozaCheckin(unghi) {
  const f = checkinFormular;
  if (f.pozeNoi && f.pozeNoi[unghi]) {
    URL.revokeObjectURL(f.pozeNoi[unghi].url);
    delete f.pozeNoi[unghi];
  } else {
    const veche = pozeCurente.lista.find(p => p.s === lunaSaptamaniiCurente() && p.u === unghi);
    if (veche) f.pozeSterse = (f.pozeSterse || []).concat(veche);
  }
  redeseneazaCheckin();
}

// ---- Pozele de progres: cereri către Worker-ul R2 și afișare ----
let pozeCurente = { client: null, lista: [] }; // pozele clientului afișat: [{ s: lunea săptămânii, u: unghi, t: încărcată la }]
const cachePoze = new Map(); // `client|s|u|t` -> Promise<object URL>

async function cerePoze(metoda, cale, param, corp) {
  const antete = {};
  if (checkinLink) antete['X-Checkin-Token'] = checkinLink.token;
  else {
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) return null;
    antete.Authorization = 'Bearer ' + data.session.access_token;
  }
  if (corp) antete['Content-Type'] = corp.type;
  const q = new URLSearchParams(Object.entries(param).filter(([, v]) => v));
  return fetch(`${URL_POZE}${cale}?${q}`, { method: metoda, headers: antete, body: corp }).catch(() => null);
}

async function incarcaListaPoze(clientId) {
  pozeCurente = { client: clientId, lista: [] };
  if (!URL_POZE || !clientId) return;
  const r = await cerePoze('GET', '/poze', { client: clientId });
  const lista = r && r.ok ? await r.json().catch(() => []) : [];
  if (pozeCurente.client === clientId) pozeCurente.lista = Array.isArray(lista) ? lista : [];
}

// Imaginile <img data-poza="client|s|u|t"> se aduc cu autentificare (nu pot fi link-uri publice)
function umplePoze(radacina) {
  radacina.querySelectorAll('img[data-poza]').forEach(async img => {
    const cheie = img.dataset.poza;
    if (!cachePoze.has(cheie)) {
      const [client, s, u] = cheie.split('|');
      cachePoze.set(cheie, cerePoze('GET', '/poza', { client, s, u })
        .then(r => r && r.ok ? r.blob() : null)
        .then(b => b ? URL.createObjectURL(b) : ''));
    }
    const src = await cachePoze.get(cheie);
    if (src) img.src = src;
    else {
      cachePoze.delete(cheie);
      img.closest('.poza-cadru, .poza-mare, .poza-comp')?.classList.add('poza-lipsa');
    }
  });
}

function deschidePanouPoze(saptamana) {
  document.getElementById('panouPozeTitlu').textContent = `${tr('Săpt.', 'Week of')} ${formatZiLuna(new Date(saptamana + 'T12:00:00'))}`;
  document.getElementById('panouPoze').dataset.s = saptamana;
  document.getElementById('panouPoze').classList.remove('auth-hidden');
  randeazaPanouPoze();
}

function inchidePanouPoze() {
  document.getElementById('panouPoze').classList.add('auth-hidden');
}

function randeazaPanouPoze() {
  const s = document.getElementById('panouPoze').dataset.s;
  const corp = document.getElementById('panouPozeContinut');
  const poze = UNGHIURI_POZE.map(o => ({ o, p: pozeCurente.lista.find(p => p.s === s && p.u === o.id) })).filter(x => x.p);
  corp.innerHTML = poze.length ? poze.map(({ o, p }) => `
    <div class="poza-mare">
      <div class="poza-mare-sus">
        <b>${tr(o.ro, o.en)}</b>
        <button type="button" class="btn btn-clear" onclick="stergePozaProgres('${s}', '${o.id}')">${tr('Șterge', 'Delete')}</button>
      </div>
      <img data-poza="${escAttr(pozeCurente.client)}|${p.s}|${p.u}|${p.t}" alt="${tr(o.ro, o.en)}">
    </div>`).join('')
    : `<div class="notificari-gol">${tr('Nicio poză în această săptămână.', 'No photos this week.')}</div>`;
  umplePoze(corp);
}

// Ștergerea e definitivă: dispare și la antrenor, și la client
function stergePozaProgres(s, u) {
  customConfirm(tr('Ștergi poza?', 'Delete the photo?'), tr('Poza se șterge definitiv, și la antrenor, și la client.', 'The photo is deleted for good, for both trainer and client.'), async () => {
    const r = await cerePoze('DELETE', '/poza', { client: pozeCurente.client, s, u });
    if (!r || !r.ok) return showToast(tr('Nu s-a putut șterge. Verifică internetul și reîncearcă.', 'Could not delete. Check your internet and try again.'), 'error');
    pozeCurente.lista = pozeCurente.lista.filter(p => !(p.s === s && p.u === u));
    showToast(tr('✓ Poză ștearsă', '✓ Photo deleted'));
    randeazaPanouPoze();
    if (rolUtilizator === 'clienta') afiseazaFisaMeaClienta();
    else incarcaProgresFisa();
  });
}

// Comparația „Început / Acum”: pe un unghi, prima și ultima săptămână cu poze; oricare se poate schimba cu altă săptămână
let comparatiePoze = { client: null, u: null, st: null, dr: null, greutati: {} };

function htmlComparatiePoze(checkinuri) {
  if (!URL_POZE || !pozeCurente.lista.length) return '';
  const c = comparatiePoze;
  if (c.client !== pozeCurente.client) Object.assign(c, { client: pozeCurente.client, u: null, st: null, dr: null });
  c.greutati = {};
  (checkinuri || []).forEach(x => { if (x.greutate != null) c.greutati[x.saptamana] = Number(x.greutate); });
  return `<div class="poze-comparatie">${htmlCorpComparatie()}</div>`;
}

function htmlCorpComparatie() {
  const c = comparatiePoze;
  const unghiuri = UNGHIURI_POZE.filter(o => pozeCurente.lista.some(p => p.u === o.id));
  if (!unghiuri.some(o => o.id === c.u)) c.u = unghiuri[0].id;
  const poze = pozeCurente.lista.filter(p => p.u === c.u).sort((a, b) => a.s.localeCompare(b.s));
  const prima = poze[0].s, ultima = poze[poze.length - 1].s;
  // Fără o alegere explicită, capetele urmează prima și ultima săptămână (și după un set nou)
  const st = poze.some(p => p.s === c.st) ? c.st : prima;
  const dr = poze.some(p => p.s === c.dr) ? c.dr : ultima;
  const butoane = unghiuri.map(o => `<button type="button" class="inscriere-chip${o.id === c.u ? ' active' : ''}" onclick="alegeComparatiePoze('u', '${o.id}')">${tr(o.ro, o.en)}</button>`).join('');
  const coloana = (latura, s) => {
    const p = poze.find(x => x.s === s);
    const eticheta = s === prima ? tr('Început', 'Start') : s === ultima ? tr('Acum', 'Now') : tr('Săptămâna', 'Week');
    const optiuni = poze.map(x => `<option value="${x.s}"${x.s === s ? ' selected' : ''}>${tr('Săpt.', 'Week of')} ${formatZiLuna(new Date(x.s + 'T12:00:00'))}</option>`).join('');
    const kg = comparatiePoze.greutati[s];
    return `<div class="poza-comp">
        <div class="poza-comp-eticheta">${eticheta}</div>
        <img data-poza="${escAttr(pozeCurente.client)}|${p.s}|${p.u}|${p.t}" alt="" onclick="deschidePanouPoze('${s}')">
        <select class="form-control poza-comp-data" aria-label="${tr('Alege săptămâna', 'Choose the week')}" onchange="alegeComparatiePoze('${latura}', this.value)">${optiuni}</select>
        <div class="poza-comp-kg">${kg != null ? `${formatKg(kg)} kg` : '&nbsp;'}</div>
      </div>`;
  };
  return `<div class="inscriere-chips poze-comp-unghiuri">${butoane}</div>
    ${poze.length < 2
      ? `${coloana('st', prima)}<div class="progres-gol">${tr('Comparația apare de la al doilea set de poze.', 'The comparison appears from the second set of photos.')}</div>`
      : `<div class="poze-comp-grid">${coloana('st', st)}${coloana('dr', dr)}</div>`}`;
}

function alegeComparatiePoze(camp, valoare) {
  const c = comparatiePoze;
  if (camp === 'u') Object.assign(c, { u: valoare, st: null, dr: null });
  else c[camp] = valoare;
  const bloc = document.querySelector('.poze-comparatie');
  if (!bloc) return;
  bloc.innerHTML = htmlCorpComparatie();
  umplePoze(bloc);
}

function bifeazaCheckin(id, optiune, bifat) {
  const lista = (checkinFormular[id] || []).filter(x => x !== optiune);
  checkinFormular[id] = bifat ? lista.concat(optiune) : lista;
}

async function salveazaCheckinClienta() {
  const f = checkinFormular;
  const arata = (id, mesaj) => {
    const el = document.getElementById('checkinQ_' + id);
    el?.classList.add('inscriere-eroare');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(mesaj, 'error');
  };
  document.querySelectorAll('.checkin-camp.inscriere-eroare').forEach(el => el.classList.remove('inscriere-eroare'));
  const kg = parseFloat(String(f.greutate ?? '').replace(',', '.'));
  if (!(kg >= 30 && kg <= 300)) return arata('greutate', tr('Scrie greutatea, între 30 și 300 kg.', 'Enter your weight, between 30 and 300 kg.'));
  for (const q of INTREBARI_CHECKIN) {
    const v = f[q.id];
    const gol = Array.isArray(v) ? v.length === 0 : (q.tip === 'scala' ? typeof v !== 'number' : !String(v ?? '').trim());
    if (q.ob && gol) return arata(q.id, tr('Completează câmpurile marcate cu *', 'Fill in the fields marked with *'));
  }
  const raspunsuri = {};
  INTREBARI_CHECKIN.forEach(q => {
    const v = f[q.id];
    if (q.tip === 'text') { if (String(v ?? '').trim()) raspunsuri[q.id] = String(v).trim(); }
    else if (v !== undefined && !(Array.isArray(v) && !v.length)) raspunsuri[q.id] = v;
  });
  const btn = document.getElementById('btnSalveazaCheckin');
  btn.disabled = true;
  if (!(await trimitePozeCheckin(f))) {
    btn.disabled = false;
    btn.textContent = tr('Trimite', 'Send');
    showToast(tr('Pozele nu s-au putut încărca. Verifică internetul și reîncearcă.', 'The photos could not be uploaded. Check your internet and try again.'), 'error');
    return;
  }
  const { data, error } = checkinLink
    ? await supabaseClient.rpc('salveaza_checkin_prin_link', { p_token: checkinLink.token, p_greutate: kg, p_raspunsuri: raspunsuri })
    : await supabaseClient.rpc('salveaza_checkin_raspunsuri', { p_greutate: kg, p_raspunsuri: raspunsuri });
  if (error || data !== 'ok') {
    btn.disabled = false;
    btn.textContent = tr('Trimite', 'Send');
    showToast(data === 'link_invalid'
      ? tr('Link-ul nu mai e valid. Cere-i antrenorului link-ul nou.', 'This link is no longer valid. Ask your trainer for the new link.')
      : tr('Nu s-a putut salva. Verifică internetul și reîncearcă.', 'Could not save. Check your internet and try again.'), 'error');
    return;
  }
  showToast(tr('✓ Check-in trimis', '✓ Check-in sent'));
  if (!checkinLink && dateClienta.acasa) {
    Object.assign(dateClienta.acasa, { checkinFacut: true, checkinSaptamana: lunaSaptamaniiCurente() });
    salveazaCacheClienta();
  }
  if (checkinLink) {
    checkinLink.trimis = true;
    checkinFormular = null;
    afiseazaCheckinLink();
    return;
  }
  randeazaFisaMeaClienta();
}

// ---- Pagina publică ?checkin=<cod>: check-in-ul săptămânal fără cont, prin link-ul personal al clientului ----
let checkinLink = null; // { token, prenume, nume_antrenor, trimis }

async function initCheckinLink(token) {
  document.getElementById('inscriereScreen').classList.remove('auth-hidden');
  document.body.classList.add('no-scroll');
  const continut = document.getElementById('inscriereContinut');
  continut.innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  if (!supabaseClient) {
    continut.innerHTML = `<div class="card">${tr('Nu ne putem conecta. Verifică internetul și reîncearcă.', 'We cannot connect. Check your internet and try again.')}</div>`;
    return;
  }
  const { data, error } = await supabaseClient.rpc('info_checkin_link', { p_token: token }).maybeSingle();
  if (error || !data) {
    randeazaAntetCheckinLink();
    continut.innerHTML = `<div class="card">${tr('Link-ul de check-in nu este valid. Cere-i antrenorului tău link-ul corect.', 'This check-in link is not valid. Ask your trainer for the correct link.')}</div>`;
    return;
  }
  checkinLink = Object.assign({ token, trimis: false }, data);
  // Săptămâna deja trimisă: arată „Făcut” (cu opțiunea de a-l retrimite); altfel deschide direct formularul
  checkinuriClienta = data.facut_saptamana ? [{ saptamana: lunaSaptamaniiCurente() }] : [];
  checkinFormular = data.facut_saptamana ? null : {};
  afiseazaCheckinLink();
}

function randeazaAntetCheckinLink() {
  document.getElementById('inscriereAntrenor').innerHTML = `<span class="inscriere-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg></span>
    <span class="inscriere-antet-text"><b>${tr('Check-in săptămânal', 'Weekly check-in')}</b>${checkinLink ? `<small>${escAttr(checkinLink.nume_antrenor || '')}</small>` : ''}</span>`;
  document.getElementById('inscriereLangRo').classList.toggle('active', currentLang !== 'en');
  document.getElementById('inscriereLangEn').classList.toggle('active', currentLang === 'en');
}

function afiseazaCheckinLink() {
  randeazaAntetCheckinLink();
  const salut = `<div class="checkin-link-salut">${tr('Salut', 'Hi')}, ${escAttr(checkinLink.prenume || '')}!</div>`;
  document.getElementById('inscriereContinut').innerHTML = checkinLink.trimis
    ? `<div class="card inscriere-final">
        <div class="inscriere-final-icon">✓</div>
        <div style="font-weight:800; font-size:1.05rem; color:var(--primary);">${tr('Mulțumesc', 'Thank you')}, ${escAttr(checkinLink.prenume || '')}!</div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${tr('Check-in-ul a ajuns la antrenor. Săptămâna viitoare îl trimiți din același link.', 'Your check-in reached your trainer. Next week, send it from the same link.')}</div>
      </div>`
    : `${salut}<div class="card checkin-card">${htmlCheckinClienta()}</div>`;
}

function mesajRezervare(cod) {
  const mesaje = {
    ocupat: ['Locul a fost luat între timp.', 'The spot was just taken.'],
    inchis: ['Locul nu mai e deschis pentru programări.', 'This spot is no longer open for booking.'],
    trecut: ['Ora a trecut deja.', 'This time has already passed.'],
    in_afara_ferestrei: ['Poți rezerva doar în săptămâna curentă. Săptămâna următoare se deschide vineri la ora 20:00.', 'You can only book in the current week. Next week opens on Friday at 8 PM.'],
    abonament_inactiv: esteInghetat(dateClienta.fisa)
      ? ['Abonamentul tău e în pauză. Antrenorul îl reia când revii.', 'Your subscription is paused. Your trainer resumes it when you come back.']
      : ['Abonamentul tău nu e activ. Contactează antrenorul.', 'Your subscription is not active. Contact your trainer.'],
    abonament_expirat: ['Abonamentul tău expiră înainte de această ședință.', 'Your subscription expires before this session.'],
    fara_sedinte: ['Nu mai ai ședințe disponibile pentru programare.', 'You have no sessions left to book.'],
    deja_rezervat: ['Ai deja o programare în această zi. Pentru o programare nouă, anuleaz-o întâi pe cea existentă sau contactează antrenorul.', 'You already have a booking on this day. To book another, first cancel the existing one or contact your trainer.']
  };
  const m = mesaje[cod];
  return m ? tr(m[0], m[1]) : tr('Nu te-am putut programa. Încearcă din nou.', 'Could not book. Try again.');
}

// Locurile libere dintr-o oră se strâng într-un singur rând; rezervarea încearcă pe rând locurile grupului.
// O singură programare pe zi: în zilele în care clienta are deja una nu se mai oferă ore.
function grupeazaSloturiDeschise(lista, zileProgramate = new Map()) {
  const acum = new Date();
  const grupuri = [];
  (lista || []).forEach(o => {
    const data = dataSlot(o.ziRaw, o.ora);
    if (!data || data <= acum || zileProgramate.has(cheieZiClienta(data))) return;
    let g = grupuri.find(x => x.data.getTime() === data.getTime());
    if (!g) { g = { data, randuri: [] }; grupuri.push(g); }
    g.randuri.push(o);
  });
  return grupuri.sort((a, b) => a.data - b.data);
}

// Câte ore au locuri deschise pe care clientul le poate rezerva (fără bulină pe Programări: ar sta mereu pe „9+”)
function seteazaLocuriLibere(nr) {
  // Același număr apare pe Acasă, pe cardul ședinței, când clientul nu are nicio ședință programată
  const schimbat = dateClienta.locuriLibere !== nr;
  dateClienta.locuriLibere = nr;
  if (schimbat && clientaTabCurent === 'acasa' && !dateClienta.planCurent && !antrPers.ecran && dateClienta.acasa && !dateClienta.acasa.urmatoarea) {
    const card = document.getElementById('acasaSedinta');
    if (card) card.outerHTML = htmlSedintaAcasa();
  }
}

// Zilele în care clienta are deja o programare (inclusiv una deja efectuată azi): cheie zi -> rândul programării, cu `data`
function programariPeZiClienta(randuri) {
  const zile = new Map();
  (randuri || []).map(o => ({ ...o, data: dataSlot(o.ziRaw, o.ora) })).filter(o => o.data).sort((a, b) => a.data - b.data).forEach(o => {
    if (!zile.has(cheieZiClienta(o.data))) zile.set(cheieZiClienta(o.data), o);
  });
  return zile;
}

// Anulare singură: doar rezervările făcute de ea în aplicație, cu cel puțin 24h înainte (aceeași regulă ca anuleaza_rezervare)
function stareAnulareClienta(o) {
  const poateAnula = !o.bifat && o.rezervat_online && (o.data - new Date()) >= 24 * 3600 * 1000;
  const motiv = !o.rezervat_online
    ? tr('Programată de antrenor. Pentru anulare, contactează antrenorul.', 'Booked by your trainer. Contact your trainer to cancel.')
    : tr('Mai puțin de 24h până la ședință. Pentru anulare, contactează antrenorul.', 'Less than 24h before the session. Contact your trainer to cancel.');
  return { poateAnula, motiv };
}

async function actualizeazaBulinaOrar() {
  const [resDeschise, resRezervari] = await Promise.all([
    supabaseClient.rpc('sloturi_deschise'),
    supabaseClient.from('orar').select('ziRaw, ora, bifat').eq('client_id', dateClienta.fisa.id)
  ]);
  if (!resDeschise.error) seteazaLocuriLibere(grupeazaSloturiDeschise(resDeschise.data, programariPeZiClienta(resRezervari.data)).length);
}

// faraIncarcare: actualizare în fundal (timp real), fără „Se încarcă...” peste lista existentă
async function randeazaOrarClienta(faraIncarcare = false) {
  document.getElementById('clientaTitlu').innerText = tr('Programări', 'Bookings');
  const corp = document.getElementById('clientaContinut');
  if (!faraIncarcare) corp.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  const [resDeschise, resRezervari] = await Promise.all([
    supabaseClient.rpc('sloturi_deschise'),
    supabaseClient.from('orar').select('*').eq('client_id', dateClienta.fisa.id)
  ]);
  if (clientaTabCurent !== 'orar') return;
  if (resDeschise.error) {
    corp.innerText = tr('Nu am putut încărca orarul.', 'Could not load the schedule.');
    return;
  }
  const acum = new Date();
  const mele = (resRezervari.data || []).filter(o => !o.bifat)
    .map(o => ({ ...o, data: dataSlot(o.ziRaw, o.ora) }))
    .filter(o => o.data && o.data > acum)
    .sort((a, b) => a.data - b.data);

  dateClienta.zileProgramate = programariPeZiClienta(resRezervari.data);
  const grupuri = grupeazaSloturiDeschise(resDeschise.data, dateClienta.zileProgramate);
  dateClienta.grupuri = grupuri;
  seteazaLocuriLibere(grupuri.length);

  const titlu = (txt) => `<div style="font-weight:800; color:var(--primary); margin:14px 2px 6px;">${txt}</div>`;
  // Sus: bara de zile și orele libere din ziua aleasă; dedesubt, programările ei
  let html = htmlZileSiOreClienta(grupuri);
  html += titlu(tr('Programările mele', 'My bookings'));
  if (mele.length === 0) {
    html += `<div class="card" style="color:var(--text-muted); font-size:0.85rem;">${tr('Nu ai nicio programare viitoare.', 'You have no upcoming bookings.')}</div>`;
  }
  mele.forEach(o => {
    const { poateAnula, motiv } = stareAnulareClienta(o);
    html += `<div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <div style="min-width:0;"><div style="font-weight:800;">${escAttr(etichetaZiSlot(o.data))}</div>
      <div style="font-size:0.82rem; color:var(--text-muted);">${oraSlot(o.data)}${o.antrenament ? ' • ' + escAttr(traduceValoare(o.antrenament)) : ''}</div>
      ${poateAnula ? '' : `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">${motiv}</div>`}</div>
      ${poateAnula ? `<button type="button" class="btn btn-clear" style="white-space:nowrap;" onclick="anuleazaRezervareClienta(${o.row})">${tr('Anulează', 'Cancel')}</button>` : ''}
    </div>`;
  });

  html += `<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; margin-top:12px; line-height:1.4;">${tr('Programările făcute de tine în aplicație le poți anula cu cel puțin 24 de ore înainte.', 'Bookings you make in the app can be cancelled up to 24 hours before.')}</div>`;
  corp.innerHTML = html;
  ajusteazaNumeZile(document.getElementById('clientaZile'));
  document.querySelector('#clientaZile .day-btn.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

// Zilele în care clienta poate rezerva acum: de azi până duminică; de vineri 20:00 (și în weekend) plus săptămâna următoare.
// Aceeași regulă ca luni_ferestrei() din baza de date; serverul rămâne cel care decide la rezervare.
function zileFereastraRezervare() {
  const acum = new Date();
  const azi = new Date(acum.getFullYear(), acum.getMonth(), acum.getDate());
  const ziSapt = (azi.getDay() + 6) % 7; // 0 = luni
  const luni = new Date(azi); luni.setDate(azi.getDate() - ziSapt);
  const deschisaUrmatoarea = ziSapt >= 5 || (ziSapt === 4 && acum.getHours() >= 20);
  const zile = [];
  for (let d = new Date(azi); ; d.setDate(d.getDate() + 1)) {
    const zileDeLaLuni = Math.round((d - luni) / 86400000);
    if (zileDeLaLuni >= (deschisaUrmatoarea ? 14 : 7)) break;
    zile.push(new Date(d));
  }
  return zile;
}

function cheieZiClienta(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function selecteazaZiClienta(cheie) {
  dateClienta.ziSelectata = cheie;
  const corp = document.getElementById('clientaZileSiOre');
  if (corp) corp.outerHTML = htmlZileSiOreClienta(dateClienta.grupuri || []);
  ajusteazaNumeZile(document.getElementById('clientaZile'));
  document.querySelector('#clientaZile .day-btn.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

// Bara de zile (ca la antrenor) + orele libere din ziua aleasă; weekendul apare doar dacă antrenorul a deschis locuri atunci
function htmlZileSiOreClienta(grupuri) {
  const peZi = {};
  grupuri.forEach((g, i) => { (peZi[cheieZiClienta(g.data)] = peZi[cheieZiClienta(g.data)] || []).push(i); });
  const zile = zileFereastraRezervare().filter(d => d.getDay() % 6 !== 0 || peZi[cheieZiClienta(d)]);
  if (!zile.some(d => cheieZiClienta(d) === dateClienta.ziSelectata)) {
    const primaCuLocuri = zile.find(d => peZi[cheieZiClienta(d)]);
    dateClienta.ziSelectata = cheieZiClienta(primaCuLocuri || zile[0] || new Date());
  }
  const locale = currentLang === 'en' ? 'en-GB' : 'ro-RO';
  let html = `<div id="clientaZileSiOre"><div class="zile-clienta" id="clientaZile">`;
  zile.forEach(d => {
    const cheie = cheieZiClienta(d);
    const numeLung = d.toLocaleDateString(locale, { weekday: 'long' });
    const numeScurt = d.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
    const mare = s => s.charAt(0).toUpperCase() + s.slice(1);
    html += `<button type="button" class="day-btn ${cheie === dateClienta.ziSelectata ? 'active' : ''} ${peZi[cheie] ? '' : 'zi-fara-locuri'}" onclick="selecteazaZiClienta('${cheie}')">
      <span data-nume-lung="${escAttr(mare(numeLung))}" data-nume-scurt="${escAttr(mare(numeScurt))}">${escAttr(mare(numeLung))}</span>
      <span class="day-date-sub">${d.getDate()} ${escAttr(d.toLocaleDateString(locale, { month: 'short' }).replace('.', ''))}</span>
    </button>`;
  });
  const indici = peZi[dateClienta.ziSelectata] || [];
  const programataAzi = dateClienta.zileProgramate && dateClienta.zileProgramate.get(dateClienta.ziSelectata);
  html += `</div>${programataAzi ? '<div style="height:6px;"></div>' : `<div style="font-weight:800; color:var(--primary); margin:6px 2px 6px;">${tr('Locuri deschise', 'Open spots')}</div>`}`;
  if (programataAzi) {
    // O singură programare pe zi: ziua aleasă arată programarea ca o confirmare (anularea e o singură dată, în „Programările mele”)
    const d = programataAzi.data;
    const titlu = programataAzi.bifat ? tr('Ședința ta din această zi', 'Your session on this day') : tr('Programarea ta', 'Your booking');
    const nota = programataAzi.bifat
      ? tr('Ședința e deja bifată. Poți avea o singură ședință pe zi.', 'This session is already checked off. You can have one session per day.')
      : tr('Poți avea o singură programare pe zi. Detaliile și anularea sunt mai jos, la Programările mele.', 'You can have one booking per day. Details and cancelling are below, under My bookings.');
    html += `<div class="card programare-zi-confirmata">
      <div class="programare-zi-icon">✓</div>
      <div><div class="acasa-eticheta">${titlu}</div>
      <b>${escAttr(etichetaZiSlot(d))}, ${oraSlot(d)}</b>${programataAzi.antrenament ? `<div class="acasa-antrenament-detalii">${escAttr(traduceValoare(programataAzi.antrenament))}</div>` : ''}
      <div class="programare-zi-nota">${nota}</div></div>
    </div>`;
  } else if (indici.length === 0) {
    html += `<div class="card" style="color:var(--text-muted); font-size:0.85rem;">${grupuri.length ? tr('Nicio oră liberă în această zi.', 'No open spots on this day.') : tr('Momentan nu sunt locuri deschise pentru rezervări.', 'There are no open spots right now.')}</div>`;
  }
  indici.forEach(i => {
    html += `<div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
      <b>${oraSlot(grupuri[i].data)}</b>
      <button type="button" class="btn" style="white-space:nowrap;" onclick="rezervaClienta(${i})">${tr('Programează-te', 'Book')}</button>
    </div>`;
  });
  return html + `</div>`;
}

async function rezervaClienta(i) {
  const g = dateClienta.grupuri && dateClienta.grupuri[i];
  if (!g || rezervareInCurs) return;
  rezervareInCurs = true;
  let rezultat = 'ocupat';
  for (const r of g.randuri) {
    const { data, error } = await supabaseClient.rpc('rezerva_slot', { p_row: r.row });
    if (error) { rezultat = 'eroare'; break; }
    rezultat = data;
    if (data !== 'ocupat') break;
  }
  rezervareInCurs = false;
  if (rezultat === 'ok') anuntaSchimbareOrar();
  if (rezultat === 'ok') showToast(tr('Te-ai programat ✓', 'Booked ✓'));
  else showToast(mesajRezervare(rezultat), 'error');
  if (clientaTabCurent === 'orar') randeazaOrarClienta();
}

function anuleazaRezervareClienta(row) {
  customConfirm(tr('Anulare programare', 'Cancel booking'), tr('Anulezi această programare?', 'Cancel this booking?'), async function() {
    const { data, error } = await supabaseClient.rpc('anuleaza_rezervare', { p_row: row });
    if (!error && data === 'ok') anuntaSchimbareOrar();
    if (!error && data === 'ok') showToast(tr('Programare anulată', 'Booking cancelled'));
    else if (data === 'prea_tarziu') showToast(tr('Prea târziu pentru anulare. Contactează antrenorul.', 'Too late to cancel. Contact your trainer.'), 'error');
    else showToast(tr('Nu s-a putut anula.', 'Could not cancel.'), 'error');
    if (clientaTabCurent === 'orar') randeazaOrarClienta();
    // Anulată de pe Acasă: cardul ședinței se actualizează (următoarea ședință sau orele libere)
    if (clientaTabCurent === 'acasa') { incarcaRezumatAcasa(); actualizeazaBulinaOrar(); }
  });
}

// ---- Istoric: seria de săptămâni consecutive cu cel puțin o ședință și calendarul lunar al prezențelor ----
// Lunea săptămânii unei date, ca număr (ms), pentru comparații între săptămâni
function lunaSaptamanii(d) {
  const l = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  return l.getTime();
}

// Seria curentă de săptămâni consecutive cu cel puțin o ședință și recordul
function calculeazaSerie(lista) {
  const saptamani = new Set(lista.map(p => lunaSaptamanii(p.d)));
  const pas = d => { const x = new Date(d); x.setDate(x.getDate() - 7); return x.getTime(); };
  const curenta = lunaSaptamanii(new Date());
  const facutaAcum = saptamani.has(curenta);
  // Săptămâna în curs nu rupe seria: dacă încă nu a venit, numărăm de la săptămâna trecută
  let serie = 0;
  for (let s = facutaAcum ? curenta : pas(curenta); saptamani.has(s); s = pas(s)) serie++;
  let record = 0, sir = 0, anterior = null;
  [...saptamani].sort((a, b) => a - b).forEach(s => {
    sir = anterior !== null && pas(s) === anterior ? sir + 1 : 1;
    record = Math.max(record, sir);
    anterior = s;
  });
  return { serie, record, facutaAcum };
}

// Insignele clientului: ședințe, serii de săptămâni și check-in-uri; cele neobținute arată cât mai e
const INSIGNE = [
  { tip: 'sedinte', prag: 1, ro: 'Primul antrenament', en: 'First workout' },
  { tip: 'sedinte', prag: 10, ro: '10 ședințe', en: '10 sessions' },
  { tip: 'sedinte', prag: 25, ro: '25 de ședințe', en: '25 sessions' },
  { tip: 'sedinte', prag: 50, ro: '50 de ședințe', en: '50 sessions' },
  { tip: 'sedinte', prag: 100, ro: '100 de ședințe', en: '100 sessions' },
  { tip: 'serie', prag: 4, ro: '4 săptămâni la rând', en: '4 weeks in a row' },
  { tip: 'serie', prag: 8, ro: '8 săptămâni la rând', en: '8 weeks in a row' },
  { tip: 'serie', prag: 12, ro: '12 săptămâni la rând', en: '12 weeks in a row' },
  { tip: 'checkin', prag: 1, ro: 'Primul check-in', en: 'First check-in' },
  { tip: 'checkin', prag: 10, ro: '10 check-in-uri', en: '10 check-ins' },
  { tip: 'proprii', prag: 1, ro: 'Primul antrenament propriu', en: 'First own workout' },
  { tip: 'proprii', prag: 10, ro: '10 antrenamente proprii', en: '10 own workouts' },
  { tip: 'proprii', prag: 25, ro: '25 de antrenamente proprii', en: '25 own workouts' },
  { tip: 'proprii', prag: 50, ro: '50 de antrenamente proprii', en: '50 own workouts' },
  { tip: 'obiective', prag: 1, ro: 'Primul obiectiv atins', en: 'First goal reached' },
  { tip: 'obiective', prag: 5, ro: '5 obiective atinse', en: '5 goals reached' },
  { tip: 'obiective', prag: 10, ro: '10 obiective atinse', en: '10 goals reached' }
];
const ICONITE_INSIGNE = {
  sedinte: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  serie: '<path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.3-5.2.2 1.7 1 2.9 2.2 3.4C11.2 8.7 11 5.3 12 2z"/>',
  checkin: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>',
  proprii: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  obiective: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'
};

function htmlInsigne(nrSedinte, recordSerie, nrCheckin, nrProprii = 0, nrObiective = 0) {
  const valori = { sedinte: nrSedinte, serie: recordSerie, checkin: nrCheckin, proprii: nrProprii, obiective: nrObiective };
  const obtinute = INSIGNE.filter(i => valori[i.tip] >= i.prag).length;
  // Cele obținute + următoarea din fiecare categorie (restul ar încărca ecranul)
  const vizibile = INSIGNE.filter(i => valori[i.tip] >= i.prag || i === INSIGNE.find(x => x.tip === i.tip && valori[x.tip] < x.prag));
  const piese = vizibile.map(i => {
    const are = valori[i.tip] >= i.prag;
    return `<div class="insigna${are ? ' obtinuta' : ''}">
        <span class="insigna-icon"><svg viewBox="0 0 24 24">${ICONITE_INSIGNE[i.tip]}</svg></span>
        <span class="insigna-nume">${tr(i.ro, i.en)}</span>
        ${are ? '' : `<span class="insigna-cat">${valori[i.tip]}/${i.prag}</span>`}
      </div>`;
  }).join('');
  return `<div class="card insigne-card">
      <div class="insigne-antet"><b>${tr('Insigne', 'Badges')}</b><span>${obtinute} ${tr('din', 'of')} ${INSIGNE.length}</span></div>
      <div class="insigne-grila">${piese}</div>
    </div>`;
}

function htmlSerieClienta(lista) {
  const { serie, record, facutaAcum } = calculeazaSerie(lista);

  const unitate = n => n === 1 ? tr('săptămână la rând', 'week in a row') : tr('săptămâni la rând', 'weeks in a row');
  const text = serie === 0
    ? tr('Vino săptămâna asta ca să începi o serie nouă.', 'Come this week to start a new streak.')
    : facutaAcum
      ? tr('Ai bifat și săptămâna asta. Ține-o tot așa!', 'This week is done too. Keep it up!')
      : tr('Vino săptămâna asta ca să păstrezi seria.', 'Come this week to keep your streak.');
  return `<div class="card serie-card${serie ? '' : ' fara-serie'}">
      <div class="serie-icon"><svg viewBox="0 0 24 24"><path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.3-5.2.2 1.7 1 2.9 2.2 3.4C11.2 8.7 11 5.3 12 2z"/></svg></div>
      <div class="serie-corp">
        <div class="serie-valoare"><b>${serie}</b> ${unitate(serie)}</div>
        <div class="serie-text">${text}</div>
        ${record > serie ? `<div class="serie-record">${tr('Recordul tău', 'Your best')}: ${record} ${record === 1 ? tr('săptămână', 'week') : tr('săptămâni', 'weeks')}</div>` : ''}
      </div>
    </div>`;
}

function htmlCalendarPrezente() {
  const luna = dateClienta.lunaCalendar;
  const an = luna.getFullYear(), l = luna.getMonth();
  const azi = new Date();
  const cuSedinta = new Set((dateClienta.istoric || []).filter(p => p.d.getFullYear() === an && p.d.getMonth() === l).map(p => p.d.getDate()));
  const numeLuna = luna.toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { month: 'long', year: 'numeric' });
  const zileSapt = currentLang === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
  const primaZi = (new Date(an, l, 1).getDay() + 6) % 7;
  const nrZile = new Date(an, l + 1, 0).getDate();
  const esteLunaCurenta = an === azi.getFullYear() && l === azi.getMonth();
  let celule = '';
  for (let i = 0; i < primaZi; i++) celule += '<span></span>';
  for (let z = 1; z <= nrZile; z++) {
    const clase = [cuSedinta.has(z) ? 'cu-sedinta' : '', esteLunaCurenta && z === azi.getDate() ? 'azi' : ''].join(' ').trim();
    celule += `<span class="${clase}">${z}</span>`;
  }
  const n = cuSedinta.size;
  return `<div class="cal-antet">
      <button type="button" class="cal-nav" onclick="schimbaLunaCalendar(-1)" aria-label="${tr('Luna anterioară', 'Previous month')}"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
      <b>${numeLuna.charAt(0).toUpperCase() + numeLuna.slice(1)}</b>
      <button type="button" class="cal-nav" onclick="schimbaLunaCalendar(1)" ${esteLunaCurenta ? 'disabled' : ''} aria-label="${tr('Luna următoare', 'Next month')}"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
    </div>
    <div class="cal-grila cal-zile-sapt">${zileSapt.map(z => `<span>${z}</span>`).join('')}</div>
    <div class="cal-grila">${celule}</div>
    <div class="cal-total">${n === 0 ? tr('Nicio zi de antrenament în luna asta', 'No training days this month') : n === 1 ? tr('1 zi de antrenament', '1 training day') : tr(`${n} zile de antrenament`, `${n} training days`)}</div>`;
}

function schimbaLunaCalendar(directie) {
  const l = dateClienta.lunaCalendar;
  dateClienta.lunaCalendar = new Date(l.getFullYear(), l.getMonth() + directie, 1);
  document.getElementById('calendarPrezente').innerHTML = htmlCalendarPrezente();
}

// Istoricul (calendar, serie, insigne): din Fișa mea, cu Înapoi
function deschideIstoricClienta() {
  antrPers.ecran = 'istoric';
  arataInapoiAntrPers();
  randeazaIstoricClienta();
}

async function randeazaIstoricClienta() {
  document.getElementById('clientaTitlu').innerText = tr('Istoric', 'History');
  const corp = document.getElementById('clientaContinut');
  corp.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  const [{ data, error }, { count: nrCheckin }] = await Promise.all([
    supabaseClient.from('prezente').select('*').eq('client_id', dateClienta.fisa.id),
    supabaseClient.from('checkin_saptamanal').select('saptamana', { count: 'exact', head: true }).eq('client_id', dateClienta.fisa.id),
    antrPers.lista === null ? incarcaAntrPersUsor() : null,
    incarcaObiectiveClient()
  ]);
  if (antrPers.ecran !== 'istoric') return;
  if (error) {
    corp.innerText = tr('Nu am putut încărca istoricul.', 'Could not load the history.');
    return;
  }
  const luniRo = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
  const luniEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const lista = (data || []).map(p => {
    const [z, l, a] = (p.data || '').split('.').map(Number);
    return { ...p, d: new Date(a, (l || 1) - 1, z || 1) };
  }).filter(p => !isNaN(p.d)).sort((x, y) => y.d - x.d || (y.ora || '').localeCompare(x.ora || ''));

  const acum = new Date();
  const lunaAceasta = lista.filter(p => p.d.getMonth() === acum.getMonth() && p.d.getFullYear() === acum.getFullYear()).length;
  const metrica = (valoare, eticheta) => `<div class="metric-box"><div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${eticheta}</div><div class="metric-val">${valoare}</div></div>`;
  let html = `<div class="metric-grid" style="grid-template-columns:repeat(3, 1fr);">${metrica(lunaAceasta, tr('Luna aceasta', 'This month'))}${metrica(lista.length, tr('Total ședințe', 'Total sessions'))}${metrica(dateClienta.fisa.ramase ?? '-', tr('Rămase', 'Left'))}</div>`;

  // Seria, calendarul și lista includ și antrenamentele proprii; cifrele de sus și insignele de ședințe rămân pe cele de la sală
  const toate = lista.concat(zileAntrPers()).sort((x, y) => y.d - x.d || (y.ora || '').localeCompare(x.ora || ''));
  dateClienta.istoric = toate;
  dateClienta.lunaCalendar = new Date(acum.getFullYear(), acum.getMonth(), 1);
  html += htmlSerieClienta(toate) + htmlInsigne(lista.length, calculeazaSerie(toate).record, nrCheckin || 0, toate.length - lista.length, obiectiveAtinse().length)
    + `<div class="card calendar-prezente" id="calendarPrezente">${htmlCalendarPrezente()}</div>`;

  if (toate.length === 0) {
    html += `<div class="card" style="color:var(--text-muted); font-size:0.85rem; margin-top:10px;">${tr('Încă nu ai ședințe înregistrate.', 'No sessions recorded yet.')}</div>`;
  }
  let lunaCurenta = '';
  toate.forEach(p => {
    const luna = (currentLang === 'en' ? luniEn : luniRo)[p.d.getMonth()] + ' ' + p.d.getFullYear();
    if (luna !== lunaCurenta) {
      lunaCurenta = luna;
      html += `<div style="font-weight:800; color:var(--primary); margin:14px 2px 6px;">${luna}</div>`;
    }
    if (p.propriu) {
      const detalii = [p.distanta_km ? `${formatKg(Number(p.distanta_km))} km` : '', p.durata_min ? `${p.durata_min} min` : ''].filter(Boolean).join(' · ');
      html += `<div class="card istoric-propriu" onclick="deschideAntrPers()" style="display:flex; justify-content:space-between; gap:8px; margin-bottom:6px; cursor:pointer;">
        <div><b>${escAttr(formateazaDataRoLocal(p.d))}</b> <span style="font-size:0.8rem; color:var(--text-muted);">${tr('propriu', 'own')}${detalii ? ' · ' + detalii : ''}</span></div>
        <div style="font-size:0.82rem; font-weight:700; color:var(--primary); text-align:right;">${escAttr(titluAntrPers(p))}</div>
      </div>`;
      return;
    }
    html += `<div class="card" style="display:flex; justify-content:space-between; gap:8px; margin-bottom:6px;">
      <div><b>${escAttr(p.data)}</b> <span style="font-size:0.8rem; color:var(--text-muted);">${escAttr(p.ora || '')}</span></div>
      <div style="font-size:0.82rem; font-weight:700; color:var(--primary); text-align:right;">${escAttr(traduceValoare(p.antrenament) || '-')}</div>
    </div>`;
  });
  corp.innerHTML = html;
}

// Ultimele date ale clientului, păstrate pe telefonul lui: Acasă apare instant, iar datele proaspete le înlocuiesc discret
function cheieCacheClienta() {
  return 'BFIT_CLIENT_' + (utilizatorCurent ? utilizatorCurent.id : '');
}

function salveazaCacheClienta() {
  try {
    const a = dateClienta.acasa;
    localStorage.setItem(cheieCacheClienta(), JSON.stringify({
      fisa: dateClienta.fisa, planuri: dateClienta.planuri, contact: dateClienta.contact || null, areParola: !!dateClienta.areParola,
      obiective: dateClienta.obiective || null,
      acasa: a ? Object.assign({}, a, { urmatoarea: a.urmatoarea ? a.urmatoarea.toISOString() : null }) : null
    }));
  } catch (e) {}
}

function citesteCacheClienta() {
  try {
    const c = JSON.parse(localStorage.getItem(cheieCacheClienta()) || 'null');
    if (c && c.acasa && c.acasa.urmatoarea) c.acasa.urmatoarea = new Date(c.acasa.urmatoarea);
    return c && c.fisa ? c : null;
  } catch (e) { return null; }
}

// La ieșirea din cont rămân pe telefon doar preferințele, nu datele clientului
function stergeCacheClienti() {
  try { Object.keys(localStorage).filter(k => k.startsWith('BFIT_CLIENT_') || k.startsWith('BFIT_PROGRES_NETRIMIS_')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

// Contururi gri cât se încarcă prima dată (fără date salvate): fără ecran gol și fără sărituri
function htmlScheletAcasa() {
  const bloc = h => `<div class="card schelet" style="height:${h}px;"></div>`;
  return bloc(132) + `<div class="acasa-cifre">${'<div class="acasa-cifra schelet"></div>'.repeat(3)}</div>` + bloc(64) + bloc(72) + bloc(56);
}

async function afiseazaEcranClienta() {
  document.getElementById('clientaScreen')?.classList.remove('auth-hidden');
  actualizeazaStareNoScrollBody();
  const salvat = citesteCacheClienta();
  if (salvat) {
    Object.assign(dateClienta, { fisa: salvat.fisa, planuri: salvat.planuri || [], contact: salvat.contact, areParola: salvat.areParola, acasa: salvat.acasa || null, obiective: salvat.obiective || null });
    document.getElementById('clientaNav').style.display = '';
    clientaTab('acasa');
  } else {
    document.getElementById('clientaTitlu').innerText = '';
    document.getElementById('clientaContinut').innerHTML = htmlScheletAcasa();
  }
  // Ce a rămas netrimis de data trecută (fără internet) pleacă înainte să citim planurile din bază
  if (Object.keys(progresNetrimis()).length) await trimiteProgresNetrimis();
  const [resFisa, resPlanuri] = await Promise.all([
    supabaseClient.from('cliente').select('*').eq('auth_user_id', utilizatorCurent.id).limit(1),
    supabaseClient.from('planuri_antrenament').select('*').order('updated_at', { ascending: false })
  ]);
  const c = resFisa.data && resFisa.data[0];
  // Fără internet, cu date salvate: rămâne pe ecran ce era salvat (se actualizează la revenirea internetului)
  if (salvat && (eroareDeRetea(resFisa.error) || eroareDeRetea(resPlanuri.error))) {
    showToast(tr('Fără internet: vezi datele salvate pe acest dispozitiv.', 'Offline: showing data saved on this device.'));
    return;
  }
  if (resFisa.error || !c) {
    document.getElementById('clientaNav').style.display = 'none';
    const { data: stareCerere } = resFisa.error ? { data: null } : await supabaseClient.rpc('stare_cerere_inscriere');
    const mesajCerere = (titlu, text) => `<div class="card inscriere-final">
        <div style="font-weight:800; color:var(--primary);">${titlu}</div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${text}</div>
      </div>`;
    document.getElementById('clientaContinut').innerHTML = stareCerere === 'noua'
      ? mesajCerere(tr('Cererea ta a fost trimisă', 'Your request has been sent'),
          tr('După ce antrenorul o acceptă, aici îți vezi abonamentul, programările și planurile. Revino puțin mai târziu.', 'Once your trainer accepts it, you will see your subscription, bookings and plans here. Check back a little later.'))
      : stareCerere === 'refuzata'
        ? mesajCerere(tr('Cererea ta nu mai este activă', 'Your request is no longer active'),
            tr('Contactează antrenorul sau completează din nou formularul.', 'Contact your trainer or fill in the form again.'))
        : `<div class="card">${tr('Nu am găsit abonamentul. Contactează antrenorul.', 'Subscription not found. Contact your trainer.')}</div>`;
    return;
  }
  document.getElementById('clientaNav').style.display = '';
  // Telefonul antrenorului pentru butoanele de pe cardul de reînnoire; vine separat și completează doar acel card
  supabaseClient.rpc('contact_antrenor').maybeSingle().then(({ data }) => {
    dateClienta.contact = data || null;
    const card = document.getElementById('cardReinnoireClienta');
    if (card && dateClienta.fisa) card.innerHTML = htmlReinnoireClienta(dateClienta.fisa);
    const nota = document.getElementById('cardNotaAntrenor');
    if (nota && dateClienta.fisa) nota.innerHTML = htmlNotaAntrenor(dateClienta.fisa);
    salveazaCacheClienta();
  });
  const eraAfisat = !!salvat;
  const planuriNoi = pastreazaPlanuriNetrimise(resPlanuri.data || []);
  const schimbat = !salvat || JSON.stringify([salvat.fisa, salvat.planuri]) !== JSON.stringify([c, planuriNoi]);
  dateClienta.fisa = c;
  dateClienta.planuri = planuriNoi;
  dateClienta.areParola = await verificaParolaClienta();
  conecteazaCanalOrar(c.user_id, laSchimbareOrarClienta);
  actualizeazaBulinaOrar();
  // Cu date salvate, Acasă e deja pe ecran: se redesenează doar dacă s-a schimbat ceva și clientul n-a plecat de pe Acasă
  if (!eraAfisat) clientaTab('acasa');
  else if (schimbat && clientaTabCurent === 'acasa' && !dateClienta.planCurent && !antrPers.ecran) randeazaHomeClienta();
  incarcaRezumatAcasa();
  salveazaCacheClienta();
}

// Următoarea ședință, ședințele din săptămâna asta și seria de săptămâni; completează doar cardurile lor de pe Acasă
async function incarcaRezumatAcasa() {
  if (!dateClienta.fisa) return;
  const [resPrez, resOrar, resCheckin, resAntrPers] = await Promise.all([
    supabaseClient.from('prezente').select('data, ora').eq('client_id', dateClienta.fisa.id),
    supabaseClient.from('orar').select('row, ziRaw, ora, bifat, antrenament, rezervat_online').eq('client_id', dateClienta.fisa.id),
    supabaseClient.from('checkin_saptamanal').select('saptamana').eq('client_id', dateClienta.fisa.id).eq('saptamana', lunaSaptamaniiCurente()),
    incarcaAntrPersUsor(),
    incarcaObiectiveClient(),
    incarcaNutritieZi(aziIsoAntrPers()),
    incarcaCicluClient(),
    incarcaMembruComunitate()
  ]);
  if (resPrez.error || resOrar.error) return;
  const lista = (resPrez.data || []).map(p => {
    const [z, l, a] = (p.data || '').split('.').map(Number);
    return { d: new Date(a, (l || 1) - 1, z || 1) };
  }).filter(p => !isNaN(p.d));
  // Antrenamentele proprii țin și ele seria de săptămâni (ședințele de la sală rămân cele de pe abonament)
  const cuProprii = lista.concat(zileAntrPers());
  const acum = new Date();
  const saptamana = lunaSaptamanii(acum);
  const urm = (resOrar.data || []).filter(o => !o.bifat).map(o => ({ data: dataSlot(o.ziRaw, o.ora), antrenament: o.antrenament || '', row: o.row, online: !!o.rezervat_online }))
    .filter(o => o.data && o.data > acum).sort((a, b) => a.data - b.data)[0];
  dateClienta.acasa = {
    saptamana: lista.filter(p => lunaSaptamanii(p.d) === saptamana).length,
    serie: calculeazaSerie(cuProprii).serie,
    urmatoarea: urm ? urm.data : null,
    urmatoareaAntrenament: urm ? urm.antrenament : '',
    urmatoareaRow: urm ? urm.row : null,
    urmatoareaOnline: urm ? urm.online : false,
    // null = necunoscut (eroare la citire): cardul de check-in nu apare
    checkinFacut: resCheckin.error ? null : (resCheckin.data || []).length > 0,
    checkinSaptamana: lunaSaptamaniiCurente(),
    // Pentru inelul săptămânii și „încă puțin până la...”: zilele cu ședință săptămâna asta, totalul ședințelor, recordul de serie
    zilePrezenteSapt: [...new Set(lista.filter(p => lunaSaptamanii(p.d) === saptamana).map(p => cheieZiClienta(p.d)))],
    nrSedinte: lista.length,
    recordSerie: calculeazaSerie(cuProprii).record
  };
  salveazaCacheClienta();
  verificaObiectivSaptamanaAtins();
  if (clientaTabCurent !== 'acasa' || dateClienta.planCurent) return;
  const cardSapt = document.getElementById('cardSaptamanaAcasa');
  if (cardSapt && !antrPers.ecran) cardSapt.outerHTML = htmlSaptamanaAcasa();
  const cardNut = document.getElementById('cardNutritieAcasa');
  if (cardNut && !antrPers.ecran) cardNut.outerHTML = htmlNutritieAcasa();
  const cardCiclu = document.getElementById('cardCicluAcasa');
  if (cardCiclu && !antrPers.ecran) cardCiclu.outerHTML = htmlCicluAcasa();
  const cardCom = document.getElementById('cardComunitateAcasa');
  if (cardCom && !antrPers.ecran) cardCom.outerHTML = htmlComunitateAcasa();
  const cifre = document.getElementById('acasaCifre');
  const sedinta = document.getElementById('acasaSedinta');
  const checkin = document.getElementById('acasaCheckin');
  if (cifre) cifre.outerHTML = htmlCifreAcasa();
  if (sedinta) sedinta.outerHTML = htmlSedintaAcasa();
  if (checkin) checkin.outerHTML = htmlCheckinAcasa();
  const cardProprii = document.getElementById('cardAntrPersAcasa');
  if (cardProprii && !antrPers.ecran) cardProprii.outerHTML = htmlAntrPersAcasa();
  const cardMasa = document.getElementById('acasaMasa');
  if (cardMasa && !antrPers.ecran) cardMasa.outerHTML = htmlMasaAcasa();
}

// Link de acces expirat sau deja folosit: Supabase întoarce eroarea în adresă (#error_code=otp_expired). O citim și curățăm adresa.
function citesteEroareLinkAuth() {
  const parametri = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
  if (!parametri.get('error') && !parametri.get('error_code')) return '';
  history.replaceState(null, '', window.location.pathname);
  return textLinkExpirat();
}

function textLinkExpirat() {
  return tr('Linkul a expirat sau a fost deja folosit. Conectează-te cu email și parolă, sau cere un link nou pe email.', 'The link has expired or was already used. Sign in with email and password, or request a new link by email.');
}

// Aplicația antrenorului devine vizibilă doar după ce știm ce ecran urmează (vezi html.app-pornire în CSS)
function terminaPornirea() {
  document.documentElement.classList.remove('app-pornire');
  if (utilizatorCurent) setTimeout(arataNoutatiNevazute, 1200);
}

// ==========================================
// NOUTĂȚI: ce s-a schimbat, pe versiuni (cea mai nouă prima), separat pentru client și antrenor.
// Se adaugă o intrare la fiecare publicare cu ceva vizibil pentru utilizatori (skill-ul publica).
// Pop-up-ul apare o dată, cu versiunile nevăzute pe acest dispozitiv; toate rămân în meniu › Noutăți.
// ==========================================
const NOUTATI = [
  { v: 182, data: '2026-11-07',
    client: [
      ['Fișa de obiective se poate edita: în Fișa mea, sub fișă, apasă „✎ Editează fișa”, schimbă răspunsurile (greutate, obiective, sănătate, program etc.) și Salvează. Dacă n-ai completat-o încă, o completezi tot de acolo.', 'You can now edit your goal-setting form: in My file, under the form, tap “✎ Edit my form”, change your answers (weight, goals, health, schedule etc.) and Save. If you haven’t filled it in yet, you can do it from there.'],
      ['Când tu sau antrenorul modificați fișa, celălalt primește o notificare cu exact ce s-a schimbat, de exemplu „Greutatea: 80 → 78”. Sub fișă scrie cine a actualizat-o ultima dată.', 'When you or your trainer change the form, the other gets a notification with exactly what changed, for example “Weight: 80 → 78”. Under the form you see who updated it last.']
    ],
    antrenor: [
      ['Fișa de obiective se poate edita: în fișa clientului › Fișa de obiective › „✎ Editează fișa”. Apare și la clienții fără fișă, cu „Completează fișa”, ca s-o poți completa tu. Numele, telefonul și emailul de la înscriere nu se schimbă de aici.', 'The goal-setting form can now be edited: in the client’s file › Goal-setting form › “✎ Edit the form”. It also shows for clients without a form, as “Fill in the form”, so you can fill it in yourself. The name, phone and email from sign-up don’t change here.'],
      ['Când modifici fișa, clientul cu cont primește o notificare cu ce s-a schimbat (de exemplu „Greutatea: 80 → 78”); când o modifică el, o primești tu, iar atingerea ei deschide fișa lui. Sub fișă scrie cine a actualizat-o ultima dată. Notificarea se oprește din Setări › Notificări › Fișe de obiective.', 'When you change the form, the client with an account gets a notification with what changed (for example “Weight: 80 → 78”); when they change it, you get it, and tapping it opens their file. Under the form you see who updated it last. Turn it off in Settings › Notifications › Goal-setting forms.']
    ] },
  { v: 181, data: '2026-11-07',
    client: [
      ['Reminder pentru programări: luni și miercuri seara primești o notificare dacă nu ți-ai programat toate ședințele săptămânii (de exemplu 2 pe săptămână la un abonament de 8). O oprești din Setări › Notificări.', 'Booking reminder: on Monday and Wednesday evening you get a notification if you haven’t booked all of this week’s sessions (for example 2 a week on an 8-session plan). Turn it off in Settings › Notifications.']
    ],
    antrenor: [
      ['Confirmări se completează singur: apar toți clienții (fără cei arhivați), iar bara de adăugare de sus a dispărut. Coloana „Săptămâna” arată câte ședințe are fiecare programate săptămâna asta din câte trebuie: verde ✓ complet, portocaliu ◐ parțial, roșu ○ niciuna. Sus vezi câți sunt compleți. Cei neprogramați sunt primii; cei fără abonament activ apar la final, cu „Expirat” sau „Fără abonament”.', 'Confirmations now fill in by themselves: every client appears (except archived ones), and the add bar at the top is gone. The “This week” column shows how many sessions each one has booked this week out of how many they should: green ✓ complete, orange ◐ partial, red ○ none. At the top you see how many are complete. Those not booked come first; those without an active subscription are at the end, marked “Expired” or “No subscription”.'],
      ['Câte ședințe pe săptămână se calculează singur: ședințele rămase împărțite la săptămânile rămase până la expirare (la un abonament nou de 8: 2 pe săptămână). Dacă clientul vine mai des, ținta scade în săptămânile următoare; dacă rămâne în urmă, crește, ca să-și folosească abonamentul înainte să expire. O fixezi manual pentru un client atingând „2 pe săpt.” de sub nume (apare cu ✎).', 'Sessions per week are worked out automatically: sessions left divided by the weeks left until expiry (2 a week on a new 8-session plan). If the client comes more often, the target drops in the following weeks; if they fall behind, it rises, so they use the plan before it expires. Fix it by hand for a client by tapping “2 a week” under their name (shown with ✎).'],
      ['Atingi pastila unui client rămas în urmă și îi trimiți un reminder gata scris (în aplicație, WhatsApp sau SMS). Statusul pus de mână (Confirmată / În așteptare / Absentă) a fost înlocuit de acest calcul.', 'Tap the pill of a client who is behind to send a ready-made reminder (in the app, WhatsApp or SMS). The manual status (Confirmed / Pending / Absent) is replaced by this count.'],
      ['Clienții tăi cu cont primesc reminder automat luni și miercuri seara. Tu primești marți și joi dimineața lista celor încă neprogramați. Mențiunile rămân. Butonul ⏸ de pe rând mută clientul în Hold (nu mai primește remindere), iar ↩ din Hold îl readuce în listă; abonamentele înghețate apar automat la Hold.', 'Your clients with an account get an automatic reminder on Monday and Wednesday evening. On Tuesday and Thursday morning you get the list of those still not booked. Notes stay. The ⏸ button on a row moves the client to Hold (no more reminders), and ↩ in Hold brings them back; frozen subscriptions show up under Hold automatically.']
    ] },
  { v: 180, data: '2026-11-06',
    client: [],
    antrenor: [
      ['Fișa clientului › Progres › Nutriție: rapoarte pe 7 și 30 de zile (calorii, zile în țintă, proteine, apă, greutate) și jurnalul descărcabil în PDF.', 'Client file › Progress › Nutrition: 7- and 30-day reports (calories, days on target, protein, water, weight) and the log as a PDF download.']
    ] },
  { v: 179, data: '2026-11-06',
    client: [
      ['Nutriție: Copiază ieri, Adaugă rapid, Rețete și Rapoarte au acum scurtături sus, iar jurnalul se descarcă în PDF, pe zile și pe mese.', 'Nutrition: Copy yesterday, Quick add, Recipes and Reports now have shortcuts at the top, and the log downloads as a PDF, by day and meal.'],
      ['Progres la exerciții: seriile apar mai clar, iar graficul din Progresul meu are din nou mărimea normală.', 'Exercise progress: sets are shown more clearly, and the chart in My progress is back to its normal size.'],
      ['Profil › Datele tale: descărcarea include acum tot ce ai notat (nutriție, apă, ciclu, comunitate, mesaje).', 'Profile › Your data: the download now includes everything you logged (nutrition, water, cycle, community, messages).'],
      ['Listele de alegere se închid la atingere în afara lor, iar meniul nu mai e acoperit de bara telefonului.', 'Choice lists close when you tap outside them, and the menu is no longer covered by the phone’s bar.']
    ],
    antrenor: [
      ['Fișa clientului › Șterge definitiv: se șterg fișa și tot ce ține de client, inclusiv pozele. Rămân doar încasările, pentru contabilitate.', 'Client file › Delete permanently: the file and everything related to the client are deleted, photos included. Only payments are kept, for accounting.'],
      ['Profil › Datele tale: descărcarea include acum și rețetele și provocările tale.', 'Profile › Your data: the download now also includes your recipes and challenges.'],
      ['Listele de alegere se închid la atingere în afara lor, iar meniul nu mai e acoperit de bara telefonului.', 'Choice lists close when you tap outside them, and the menu is no longer covered by the phone’s bar.']
    ] },
  { v: 178, data: '2026-11-06',
    client: [
      ['Nutriție: rapoarte pe 7 și 30 de zile (media caloriilor, zile în țintă, proteine, apă, greutate) și jurnalul descărcabil pentru Excel.', 'Nutrition: 7- and 30-day reports (average calories, days on target, protein, water, weight) and a log you can download for Excel.'],
      ['Memento la 13 și la 20, dacă ai uitat să notezi mesele. Le oprești din Setări › Notificări.', 'Reminders at 1 pm and 8 pm if you forgot to log your meals. Turn them off in Settings › Notifications.'],
      ['Iconiță nouă pentru Nutriție și pozele produselor scanate se încarcă mai repede.', 'A new Nutrition icon, and scanned product photos load faster.']
    ],
    antrenor: [] },
  { v: 177, data: '2026-11-06',
    client: [
      ['Ținte adaptive: notează-ți greutatea în Nutriție și vezi tendința (fără fluctuațiile zilnice) și cât slăbești sau iei pe săptămână.', 'Adaptive targets: log your weight in Nutrition and see the trend (without daily swings) and your weekly rate.'],
      ['Din calorii și greutate, aplicația îți estimează consumul real și propune ținta potrivită obiectivului tău.', 'From calories and weight, the app estimates your real expenditure and suggests the right target for your goal.']
    ],
    antrenor: [
      ['Ținte adaptive: în fișa clientului, la Nutriție, vezi tendința greutății, consumul real estimat și ținta propusă, pe care o aplici cu un buton.', 'Adaptive targets: in the client’s file, under Nutrition, see the weight trend, estimated real expenditure and the suggested target, applied with one tap.']
    ] },
  { v: 176, data: '2026-11-06',
    client: [
      ['Rețete: în Nutriție › 📖 Rețete pui ingredientele o dată și aplicația calculează caloriile pe porție. Le adaugi în jurnal pe porții.', 'Recipes: in Nutrition › 📖 Recipes add the ingredients once and the app works out the calories per serving. Log them by serving.'],
      ['Vezi și rețetele de la antrenor, iar cu 🛒 pui ingredientele pe lista de cumpărături și o trimiți din telefon.', 'You also see your trainer’s recipes, and with 🛒 you put the ingredients on a shopping list you can share from your phone.']
    ],
    antrenor: [
      ['Rețete: din meniu › Rețete creezi rețete pentru toți clienții tăi; ei le văd în Nutriție și le adaugă în jurnal pe porții.', 'Recipes: in the menu › Recipes create recipes for all your clients; they see them in Nutrition and log them by serving.']
    ] },
  { v: 175, data: '2026-11-06',
    client: [
      ['Nutriție: 250 de alimente de bază în română (ouă, carne, legume, fructe...) cu porții ca acasă: „1 ou”, „1 lingură”, „1 felie”.', 'Nutrition: 250 basic foods (eggs, meat, vegetables, fruit...) with everyday portions: “1 egg”, “1 tbsp”, “1 slice”.'],
      ['Favorite ★, mese salvate, „Copiază ieri” și „Adaugă rapid” (doar calorii), ca să notezi în câteva secunde.', 'Favourites ★, saved meals, “Copy yesterday” and “Quick add” (calories only), to log in seconds.'],
      ['„Calculează-mi țintele”: caloriile și macronutrienții din vârstă, înălțime, greutate, activitate și obiectiv.', '“Calculate my targets”: calories and macros from age, height, weight, activity and goal.']
    ],
    antrenor: [] },
  { v: 174, data: '2026-11-06',
    client: [
      ['Acasă e mai simplu: sus vezi „Azi” (antrenamentul și ședința), apoi zilele active, caloriile și apa, ce ai de făcut și scurtăturile.', 'Home is simpler: “Today” at the top (workout and session), then active days, calories and water, your to-dos and shortcuts.'],
      ['Nutriția are tab-ul ei în bara de jos, cu caloriile rămase pe zi și mesele într-un singur loc. Istoricul e acum în Fișa mea.', 'Nutrition has its own tab in the bottom bar, with calories left for the day and all meals in one place. History is now in My profile.'],
      ['Apă: notezi paharele cu un „+”, de pe Acasă sau din Nutriție.', 'Water: log glasses with a “+”, from Home or Nutrition.']
    ],
    antrenor: [] },
  { v: 173, data: '2026-11-05',
    client: [],
    antrenor: [['Verifică un produs: din meniu scanezi codul de bare sau cauți după nume și vezi poza, Nutri-Score și eticheta completă. Nu se salvează nimic, e doar pentru sfaturi.', 'Check a product: from the menu scan the barcode or search by name and see the photo, Nutri-Score and the full label. Nothing is saved; it is just for advice.']] },
  { v: 172, data: '2026-11-05',
    client: [
      ['Nutriție: produsele au poză și Nutri-Score, la scanare, în căutare și în jurnal.', 'Nutrition: products show a photo and Nutri-Score, when scanning, in search and in your log.'],
      ['După scanare vezi mare caloriile pentru cantitatea aleasă, proteinele, carbohidrații și grăsimile, plus eticheta completă la 100 g (zaharuri, fibre, sare).', 'After scanning you see the calories for your amount, protein, carbohydrates and fat, plus the full label per 100 g (sugars, fibre, salt).']
    ],
    antrenor: [] },
  { v: 171, data: '2026-11-05',
    client: [
      ['Comunitatea (opțional): intră de pe Acasă, alege-ți numele afișat și vezi cine s-a antrenat. Dă „Bravo” celorlalți.', 'Community (optional): join from Home, choose your display name and see who trained. Give others a “Well done”.'],
      ['Clasament pe săptămână și lună, după zilele active, și provocări de la antrenor, cu 🏆 la final.', 'Weekly and monthly leaderboard by active days, plus challenges from your trainer, with a 🏆 at the end.'],
      ['Confidențialitate ca la Strava: alegi ce tipuri de activitate se văd, dacă apar durata și distanța, dacă apari în clasament, și poți face orice activitate „Doar tu”. Greutățile și datele despre sănătate nu ajung niciodată în comunitate.', 'Strava-style privacy: choose which activity types are shown, whether duration and distance appear, whether you are on the leaderboard, and make any activity “Only you”. Weights and health data never reach the community.']
    ],
    antrenor: [
      ['Comunitate: din meniu › Comunitate creezi provocări („12 zile active în noiembrie”), vezi clasamentul și fluxul și dai „Bravo”. Clienții intră singuri, de pe Acasă.', 'Community: in the menu › Community create challenges (“12 active days in November”), see the leaderboard and the feed, and give “Well done”. Clients join themselves, from Home.']
    ] },
  { v: 170, data: '2026-11-05',
    client: [
      ['Ciclu menstrual (opțional): pornește-l din meniu › Setări. Pe Acasă vezi faza de azi și la ce să te aștepți la antrenament.', 'Menstrual cycle (optional): turn it on in the menu › Settings. Home shows today\'s phase and what to expect in training.'],
      ['Check-in zilnic de câteva secunde: energie, somn și simptome. Antrenorul le vede doar dacă alegi tu.', 'A few-second daily check-in: energy, sleep and symptoms. Your trainer sees it only if you choose so.']
    ],
    antrenor: [
      ['Ciclu menstrual: dacă un client îl urmărește și ți-l arată, în fișă, la Progres, vezi faza și cum s-a simțit în ultimele 7 zile.', 'Menstrual cycle: if a client tracks it and shares it, the client\'s file shows, under Progress, the phase and how they felt in the last 7 days.']
    ] },
  { v: 169, data: '2026-11-05',
    client: [['Noutăți: după fiecare actualizare vezi ce s-a schimbat; le găsești oricând în meniu › Noutăți.', 'What\'s new: after each update you see what changed; find it anytime in the menu › What\'s new.']],
    antrenor: [['Noutăți: după fiecare actualizare vezi ce s-a schimbat; le găsești oricând în meniu › Noutăți. Clienții văd separat noutățile pentru ei.', 'What\'s new: after each update you see what changed; find it anytime in the menu › What\'s new. Clients see their own news separately.']] },
  { v: 168, data: '2026-11-05',
    client: [
      ['Nutriție: notezi ce mănânci pe mese, cauți produse după nume sau scanezi codul de bare.', 'Nutrition: log what you eat by meal, search foods by name or scan the barcode.'],
      ['Îți poți seta ținte zilnice de calorii, proteine, carbohidrați și grăsimi; pe Acasă vezi caloriile de azi.', 'Set daily targets for calories, protein, carbs and fat; Home shows today\'s calories.'],
      ['Tu alegi dacă antrenorul îți vede jurnalul alimentar.', 'You choose whether your trainer sees your food log.']
    ],
    antrenor: [
      ['Nutriție: în fișa clientului, la Progres, vezi jurnalul alimentar (dacă clientul l-a lăsat vizibil) și îi poți seta ținte zilnice.', 'Nutrition: in the client\'s file, under Progress, see the food log (if the client allows it) and set daily targets.']
    ] },
  { v: 166, data: '2026-11-05',
    client: [
      ['Obiective: pe Acasă vezi inelul săptămânii și cât mai ai până la următoarea insignă sau obiectiv.', 'Goals: Home shows your week ring and how close you are to the next badge or goal.'],
      ['Îți poți seta obiective la exerciții și pe săptămână; antrenorul află când le atingi.', 'Set goals for exercises and for the week; your trainer is told when you reach them.'],
      ['Remindere joi și duminică, ca să nu pierzi seria; se pot opri din Setări.', 'Reminders on Thursday and Sunday so you keep your streak; turn them off in Settings.']
    ],
    antrenor: [
      ['Obiective: setezi clienților obiective la exerciții și pe săptămână și primești un mesaj când le ating.', 'Goals: set exercise and weekly goals for clients and get a message when they reach them.']
    ] },
  { v: 164, data: '2026-11-04',
    client: [
      ['Antrenamente proprii: până la 3 poze pe antrenament, insigne noi; apar în Istoric și țin seria de săptămâni.', 'Own workouts: up to 3 photos per workout and new badges; they show in History and keep your weekly streak.']
    ],
    antrenor: [
      ['Vezi pozele și recordurile din antrenamentele proprii pe care clienții le lasă vizibile.', 'See photos and records from the own workouts clients make visible.']
    ] }
];
const NOUTATI_CHEIE = 'BFIT_NOUTATI_VAZUT';

// Versiunile publicate până acum (din adresa app.js), cu texte pentru rolul curent
function noutatiPentruRol() {
  const curenta = Number(((document.querySelector('script[src*="app.js"]')?.getAttribute('src') || '').match(/fitFinal(\d+)/) || [])[1]) || Infinity;
  const rol = rolUtilizator === 'clienta' ? 'client' : 'antrenor';
  return NOUTATI.filter(n => n.v <= curenta && n[rol] && n[rol].length).map(n => ({ v: n.v, data: n.data, texte: n[rol] }));
}

function htmlNoutati(lista, cuVersiune) {
  if (!lista.length) return `<div class="noutati-gol">${tr('Nicio noutate deocamdată.', 'Nothing new yet.')}</div>`;
  return lista.map(n => `
    <div class="noutati-versiune">
      ${cuVersiune ? `<div class="noutati-meta">${tr('Versiunea', 'Version')} ${n.v} · ${formateazaDataNoutati(n.data)}</div>` : ''}
      <ul>${n.texte.map(([ro, en]) => `<li>${tr(ro, en)}</li>`).join('')}</ul>
    </div>`).join('');
}

function formateazaDataNoutati(iso) {
  const [a, l, z] = iso.split('-').map(Number);
  return new Date(a, l - 1, z).toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Prima deschidere cu noutăți nevăzute: cel mult ultimele 3 versiuni. Fără cheie salvată, se pornește de la v167 (ultima fără Noutăți).
function arataNoutatiNevazute() {
  if (!utilizatorCurent || document.getElementById('modalNoutatiBackdrop').style.display === 'flex') return;
  let vazut = 167;
  try { vazut = Number(localStorage.getItem(NOUTATI_CHEIE)) || 167; } catch (e) {}
  const lista = noutatiPentruRol();
  const nevazute = lista.filter(n => n.v > vazut).slice(0, 3);
  if (!nevazute.length) return;
  document.getElementById('noutatiPopupLista').innerHTML = htmlNoutati(nevazute, nevazute.length > 1);
  document.getElementById('modalNoutatiBackdrop').style.display = 'flex';
  try { localStorage.setItem(NOUTATI_CHEIE, String(lista[0].v)); } catch (e) {}
}

function inchideNoutati() {
  document.getElementById('modalNoutatiBackdrop').style.display = 'none';
}

// Linkurile din emailuri duc la adresa aplicației (?token_hash=...&type=...), nu la supabase.co (filtrele anti-spam penalizează
// linkurile spre alt domeniu decât expeditorul). Aplicația confirmă singură linkul și curăță adresa.
async function confirmaLinkEmail() {
  const parametri = new URLSearchParams(window.location.search);
  const tokenHash = parametri.get('token_hash');
  const tip = parametri.get('type');
  if (!tokenHash || !tip) return '';
  history.replaceState(null, '', window.location.pathname);
  const { error } = await supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type: tip });
  return error ? textLinkExpirat() : '';
}

async function verificaSesiuneSupabase() {
  let eroareLink = citesteEroareLinkAuth();
  const overlay = document.getElementById('authScreenOverlay');
  if (!supabaseClient) {
    if (overlay) overlay.classList.add('auth-hidden');
    actualizeazaStareNoScrollBody();
    terminaPornirea();
    return true;
  }
  eroareLink = (await confirmaLinkEmail()) || eroareLink;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    utilizatorCurent = session.user;
    actualizeazaDateProfilUI(session.user);
    await stabilesteRol();
    // Clienta: ecranul ei apare înaintea oricărei alte afișări
    if (rolUtilizator === 'clienta') document.getElementById('clientaScreen')?.classList.remove('auth-hidden');
    if (overlay) overlay.classList.add('auth-hidden');
    actualizeazaStareNoScrollBody();
    terminaPornirea();
    return true;
  } else {
    utilizatorCurent = null;
    // Fără sesiune aplicația rămâne ascunsă (app-pornire): login-ul apare cu fade și orarul s-ar vedea prin el.
    // Devine vizibilă abia la conectare (ascundeLogin din onAuthStateChange).
    if (overlay) overlay.classList.remove('auth-hidden');
    if (eroareLink) afiseazaMesajAuthFeedback(eroareLink);
    if (sessionStorage.getItem('BFIT_CONT_STERS')) {
      sessionStorage.removeItem('BFIT_CONT_STERS');
      afiseazaMesajAuthFeedback(tr('Contul tău a fost șters.', 'Your account has been deleted.'), 'success');
    }
    actualizeazaStareNoScrollBody();
    return false;
  }
}

window.onload = async function() {
  reseteazaDateIncasariAzi();
  leagaAscultatoriCuratareErori();
  initSwipeNavigation();
  aplicaTraduceriInterfataStatic();

  const urlParams = new URLSearchParams(window.location.search);
  const sharedPlanId = urlParams.get('plan');
  if (sharedPlanId) {
    terminaPornirea();
    await initModClientaSharePlan(sharedPlanId);
    return;
  }
  const codCheckin = urlParams.get('checkin');
  if (codCheckin) {
    terminaPornirea();
    await initCheckinLink(codCheckin);
    return;
  }
  const codInscriere = urlParams.get('inscriere');
  if (codInscriere) {
    terminaPornirea();
    await initInscriere(codInscriere);
    return;
  }
  // Siguranță: dacă verificarea sesiunii se blochează (rețea), aplicația nu rămâne ascunsă; sub login rămâne ascunsă
  setTimeout(() => {
    if (document.getElementById('authScreenOverlay')?.classList.contains('auth-hidden')) terminaPornirea();
  }, 5000);

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

  let d = new Date();
  let aziIdx = d.getDay();
  let ora = d.getHours();
  let esteTrecutDeVineriSeara = !setariOrar.weekend && ((aziIdx === 5 && ora >= 22) || (aziIdx === 6) || (aziIdx === 0));

  if (esteTrecutDeVineriSeara) {
    ziCurentaCheie = "Luni";
  } else {
    ziCurentaCheie = getZiImplicitaAzi();
  }

  actualizeazaBaraZile();

  let sesiuneInitializata = false;

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;

      const overlay = document.getElementById('authScreenOverlay');
      if (session && session.user) {
        const eraNeconectat = !utilizatorCurent;
        utilizatorCurent = session.user;
        actualizeazaDateProfilUI(session.user);
        const ascundeLogin = () => {
          if (overlay) overlay.classList.add('auth-hidden');
          actualizeazaStareNoScrollBody();
          terminaPornirea();
        };
        if (eraNeconectat && sesiuneInitializata) {
          // Ecranul de login rămâne până se știe rolul, altfel o clientă vede o clipă orarul antrenorului
          stabilesteRol().then(() => {
            if (rolUtilizator === 'clienta') afiseazaEcranClienta();
            else {
              conecteazaCanalOrar(utilizatorCurent.id, laSchimbareOrarAntrenor);
              incarcaBazaDateSilencios(null, true);
            }
            ascundeLogin();
          });
        } else if (sesiuneInitializata) {
          ascundeLogin();
        } // înainte de verificaSesiuneSupabase: pornirea o încheie ea, după ce știe rolul (altfel pâlpâie orarul antrenorului)
      } else if (event === 'SIGNED_OUT' && !deconectareInCurs) {
        utilizatorCurent = null;
        document.getElementById('clientaScreen')?.classList.add('auth-hidden');
        if (overlay) overlay.classList.remove('auth-hidden');
        actualizeazaStareNoScrollBody();
      }
    });
  }

  const areSesiune = await verificaSesiuneSupabase();
  sesiuneInitializata = true;
  if (!areSesiune) return;
  if (ESTE_LINK_RESETARE_PAROLA) setTimeout(deschideProfilPentruParolaNoua, 600);
  if (rolUtilizator === 'clienta') {
    afiseazaEcranClienta();
    return;
  }
  conecteazaCanalOrar(utilizatorCurent.id, laSchimbareOrarAntrenor);

  let areCacheLocal = false;
  try {
    let cached = localStorage.getItem("BFIT_DB_LOCAL");
    if (cached) {
      let parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.orarSloturi) && parsed.orarSloturi.length > 0) {
        DB = parsed;
        if (!Array.isArray(DB.planuri)) DB.planuri = [];
        areCacheLocal = true;
      }
    }
  } catch(e) {}

  populeazaSelectoriCliente();
  populeazaSelectorLuni();
  populeazaSelectorPlanuri();
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

// Saltul la ora curentă doar când se schimbă lățimea (rotire, ecran pliabil).
// Pe Android înălțimea se schimbă și în timpul scroll-ului rapid; aceea nu trebuie să mute pagina.
let ultimaLatimeFereastra = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === ultimaLatimeFereastra) return;
  ultimaLatimeFereastra = window.innerWidth;
  ajusteazaNumeZile(document.getElementById('dayButtonsContainer'));
  ajusteazaNumeZile(document.getElementById('clientaZile'));

  let activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
    return;
  }

  if (tipTabCurent === 'orar') {
    let now = new Date();
    let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
    if (esteSaptamanaActiva() && ziCurentaCheie === zileChei[now.getDay()]) {
      autoScrollLaOraCurenta();
    }
  }
});

function gestioneazaRevenireForeground() {
  // Aplicația a stat în fundal peste miezul nopții sau peste pragul de vineri seara: trecem pe ziua și săptămâna de azi
  let bazaNoua = calculeazaLuniInitial();
  let aziText = new Date().toDateString();
  let pauzaLunga = !momentIntrareFundal || Date.now() - momentIntrareFundal >= PAUZA_SALT_ORA_CURENTA;
  if (aziText !== dataUltimeiVerificari || bazaNoua.getTime() !== dataReferintaLuniBaza.getTime()) {
    pauzaLunga = true;
    dataUltimeiVerificari = aziText;
    dataReferintaLuniBaza = bazaNoua;
    dataReferintaLuni = new Date(bazaNoua.getTime());
    // Luni din viitor = s-a trecut deja la săptămâna următoare (vineri seara / weekend fără weekend în orar)
    ziCurentaCheie = bazaNoua.getTime() > Date.now() ? "Luni" : getZiImplicitaAzi();
    actualizeazaBaraZile();
    randeazaOrarInstant();
    if (tipTabCurent === 'orar' && ziCurentaCheie === "Luni" && bazaNoua.getTime() > Date.now()) {
      calibreazaLayoutEcran("", null);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  let activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
    return;
  }

  if (tipTabCurent === 'orar' && pauzaLunga) {
    let now = new Date();
    let day = now.getDay();
    let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];

    if (esteSaptamanaActiva() && ziCurentaCheie === zileChei[day]) {
      autoScrollLaOraCurenta();
    }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') momentIntrareFundal = Date.now();
  if (document.visibilityState === 'visible') {
    gestioneazaRevenireForeground();
    // La revenirea în aplicație aducem datele noi (ex. rezervări făcute de cliente), fără redeschidere
    let activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
    if (utilizatorCurent && rolUtilizator !== 'clienta' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
      incarcaBazaDateSilencios();
    }
  }
});

// ---- Butonul Înapoi al telefonului: închide pe rând ce e deschis, apoi revine pe Orar (Acasă la client); de acolo iese din aplicație ----
// Cât timp e ceva de închis ținem o intrare în plus în istoric; Înapoi o consumă (popstate) și facem un singur pas.
const PARINTE_SUBMENIU = { settingsAppearance: 'settings', settingsLanguage: 'settings', settingsSchedule: 'settings', settingsSignup: 'settings', settingsNotifications: 'settings', settingsWorkouts: 'settings', settingsPayments: 'settings', settingsSubscriptions: 'settings' };
const MODALE_INAPOI = [
  ['modalInlocuiesteBackdrop', () => inchideInlocuiesteExercitiu()],
  ['modalCuloareTipBackdrop', () => inchideCuloareTip()],
  ['modalTrimitePlanBackdrop', () => inchideTrimitePlan()],
  ['modalSharePlanBackdrop', () => inchideModalSharePlan()],
  ['modalQrBackdrop', () => inchideModalQr()],
  ['modalEditareIncasareBackdrop', () => inchideModalEditareIncasare()]
];
let ignoraPopstateGarda = false;

// Pasul pe care îl face Înapoi acum, sau null când suntem la rădăcină
function pasInapoiTelefon() {
  const vizibil = id => { const el = document.getElementById(id); return el && !el.classList.contains('auth-hidden'); };
  if (document.getElementById('customModalBackdrop').style.display === 'flex') return () => closeCustomModal(false);
  const modal = MODALE_INAPOI.find(([id]) => document.getElementById(id)?.style.display === 'flex');
  if (modal) return modal[1];
  if (vizibil('panouPoze')) return inchidePanouPoze;
  if (vizibil('panouMesaje')) return inchidePanouMesaje;
  if (vizibil('panouConversatii') && selectieMesaj) return anuntMesaj ? deschideMesajNou : anuleazaMesajNou;
  if (vizibil('panouConversatii')) return inchidePanouConversatii;
  if (vizibil('panouNotificari')) return inchidePanouNotificari;
  if (document.getElementById('appDrawer')?.classList.contains('open')) {
    const strat = document.querySelector('#appDrawer [id^="drawer"][id$="View"].active')?.id.replace(/^drawer|View$/g, '');
    const cheie = strat ? strat.charAt(0).toLowerCase() + strat.slice(1) : 'main';
    if (cheie !== 'main') return () => navigheazaSubMeniu(PARINTE_SUBMENIU[cheie] || 'main');
    return inchideMeniuLateral;
  }
  if (vizibil('authScreenOverlay') || vizibil('inscriereScreen')) return null;

  if (rolUtilizator === 'clienta' && vizibil('clientaScreen')) {
    if (document.getElementById('clientaBtnInapoi').style.visibility === 'visible') return clientaInapoi;
    if (clientaTabCurent !== 'acasa') return () => clientaTab('acasa');
    return null;
  }

  if (tipTabCurent === 'plan') {
    if (document.getElementById('planMeniuMaiMulte')?.style.display !== 'none') return () => comutaMeniuMaiMulte(false);
    // Linkul de plan trimis clientului: Înapoi închide doar ziua deschisă
    if (esteModClientaShare) return indexZiDeschisaPlan() !== null ? inchideZiPlan : null;
    // Ca săgeata ‹ din header: ziua → planul → biblioteca → meniul din care s-a deschis planul
    return () => gestioneazaClickStangaHeader();
  }
  if (tipTabCurent === 'orar') {
    return document.getElementById('calendarExpandableCard')?.classList.contains('is-expanded') ? () => comutaExpandareBaraCalendar() : null;
  }
  return () => comutaTab(tabsOrder[0].id, '', document.querySelectorAll('#bottomNav button')[0], 'orar', 0);
}

// Chrome (Android): Înapoi ajunge la un CloseWatcher, fără pași în istoric. Navigarea prin istoric ar arăta
// pentru o clipă captura ecranului anterior (animația de Înapoi a Chrome). Fără CloseWatcher (Safari): garda din istoric.
let paznicInapoi = null;

function sincronizeazaIstoricInapoi() {
  if (typeof CloseWatcher === 'function') {
    const arePas = !!pasInapoiTelefon();
    if (arePas && !paznicInapoi) {
      paznicInapoi = new CloseWatcher();
      paznicInapoi.onclose = () => {
        paznicInapoi = null;
        const pas = pasInapoiTelefon();
        if (pas) pas();
        sincronizeazaIstoricInapoi();
        // Unele închideri au animație sau cer confirmare (plan nesalvat): verificăm din nou după ce s-au așezat
        setTimeout(sincronizeazaIstoricInapoi, 350);
      };
    } else if (!arePas && paznicInapoi) {
      // S-a închis din interfață (X, click pe fundal): Înapoi de la rădăcină iese din aplicație din prima
      const p = paznicInapoi;
      paznicInapoi = null;
      p.destroy();
    }
    return;
  }
  if (ignoraPopstateGarda) return;
  const areGarda = !!(history.state && history.state.bfitInapoi);
  const arePas = !!pasInapoiTelefon();
  if (arePas && !areGarda) {
    history.pushState({ bfitInapoi: 1 }, '');
  } else if (!arePas && areGarda) {
    // S-a închis din interfață (X, click pe fundal): scoatem intrarea în plus, ca Înapoi de la rădăcină să iasă din prima
    ignoraPopstateGarda = true;
    history.back();
  }
}

window.addEventListener('popstate', () => {
  if (ignoraPopstateGarda) {
    ignoraPopstateGarda = false;
    return;
  }
  const pas = pasInapoiTelefon();
  if (pas) pas();
  // A rămas ceva deschis (ex. din Plan înapoi la meniu): refolosim intrarea consumată (înainte), nu adăugăm alta.
  // Chrome sare la Înapoi peste intrările adăugate fără o atingere, așa că un pushState aici ar face aplicația să iasă.
  if (pasInapoiTelefon()) {
    ignoraPopstateGarda = true;
    history.forward();
  }
  // Unele închideri au animație sau cer confirmare (plan nesalvat): verificăm din nou după ce s-au așezat
  setTimeout(sincronizeazaIstoricInapoi, 350);
});

// În faza de captură: unele butoane opresc propagarea (ex. sertarul calendarului din header)
['click', 'touchend'].forEach(ev => document.addEventListener(ev, () => setTimeout(sincronizeazaIstoricInapoi, 350), { capture: true, passive: true }));

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

    if (tipTabCurent === 'plan' || esteModClientaShare) {
      esteGestBlocat = true;
      return;
    }

    let target = e.target;
    if (target && (target.closest('.day-selector') || target.tagName === 'TEXTAREA' || target.closest('.app-drawer') || target.closest('.auth-card'))) {
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

    const ecranClienta = document.getElementById('clientaScreen');
    if (ecranClienta && !ecranClienta.classList.contains('auth-hidden')) {
      // Ecranul clientei: swipe între Acasă, Orar, Istoric (nu și în interiorul unui plan deschis)
      const i = TABURI_CLIENTA.indexOf(clientaTabCurent);
      const j = i + (deltaX < 0 ? 1 : -1);
      if (esteOrizontal && absX >= pragMinim && !dateClienta.planCurent && (!antrPers.ecran || antrPers.ecran === 'nutritie') && i !== -1 && j >= 0 && j < TABURI_CLIENTA.length) {
        clientaTab(TABURI_CLIENTA[j]);
      }
    } else if (esteOrizontal && absX >= pragMinim) {
      if (deltaX < 0) {
        if (tabIndexCurent < tabsOrder.length - 1) {
          let nextTab = tabsOrder[tabIndexCurent + 1];
          let btn = document.querySelectorAll('#bottomNav button')[nextTab.idx];
          let titluTab = currentLang === 'en' ? nextTab.titleEn : nextTab.titleRo;
          comutaTab(nextTab.id, titluTab, btn, nextTab.tip, nextTab.idx);
        }
      } else {
        if (tabIndexCurent > 0) {
          let prevTab = tabsOrder[tabIndexCurent - 1];
          let btn = document.querySelectorAll('#bottomNav button')[prevTab.idx];
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
    if (!Array.isArray(data.planuri)) data.planuri = [];

    const jsonNou = JSON.stringify(data);
    const jsonVechi = localStorage.getItem("BFIT_DB_LOCAL");
    const dateNeschimbate = (jsonNou === jsonVechi);

    DB = data;
    try {
      localStorage.setItem("BFIT_DB_LOCAL", jsonNou);
    } catch(e) {}

    populeazaSelectorPlanuri();

    if (dateNeschimbate && !clientaSelectataDupaActualizare && !aliniazaLaOraCurenta) {
      return;
    }

    let scrollAnterior = window.pageYOffset;

    populeazaSelectoriCliente();
    populeazaSelectorLuni();
    randeazaOrarInstant();
    randeazaProgramariInstant();
    filtreazaIstoricIncasariInstant();
    filtreazaIstoricOrarInstant();

    let sel = document.getElementById('selectClientaFisa');
    if (clientaSelectataDupaActualizare) {
      if (sel) {
        sel.value = clientaSelectataDupaActualizare;
        actualizeazaStilSelect(sel);
        afiseazaFisaClientaInstant();
      }
    } else if (sel && sel.value.trim()) {
      // Fișa deschisă reflectă și schimbările din alte tab-uri (prezență bifată, încasare); nu suprascriem un câmp în editare
      let fisa = document.getElementById('tabFisa');
      if (!fisa || !fisa.contains(document.activeElement)) afiseazaFisaClientaInstant();
    }

    if (tipTabCurent === 'orar') {
      if (aliniazaLaOraCurenta) {
        autoScrollLaOraCurenta();
      } else if (oraEvidentiata && oraEvidentiata.zi === getSaptamanaCheie() + '_' + ziCurentaCheie && Date.now() - oraEvidentiata.moment < 5000) {
        aratOraInOrar(oraEvidentiata.ora, true);
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
          // Datele din Supabase pot sosi în timpul animației și înlocuiesc cardurile: reaplicăm highlight-ul
          if (closestBlock && Date.now() - momentHighlightOra < DURATA_HIGHLIGHT_ORA) {
            closestBlock.classList.add('hour-block-current-highlight');
          }
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

    let calCard = document.getElementById('calendarExpandableCard');
    scrollLaInchidereCalendar = false;
    if (esteSaptamanaActiva()) {
      ziCurentaCheie = getZiImplicitaAzi();
      actualizeazaBaraZile();
      randeazaOrarInstant();
      if (calCard && calCard.classList.contains('is-expanded')) {
        scrollLaInchidereCalendar = true;
        calibreazaLayoutEcran("", null);
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        autoScrollLaOraCurenta();
      }
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
  ziCurentaCheie = getZiImplicitaAzi();

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
    { cheie: "Vineri", nume: "Vineri" },
    { cheie: "Sambata", nume: "Sâmbătă" },
    { cheie: "Duminica", nume: "Duminică" }
  ];
  let zileInfoEn = [
    { cheie: "Luni", nume: "Monday" },
    { cheie: "Marti", nume: "Tuesday" },
    { cheie: "Miercuri", nume: "Wednesday" },
    { cheie: "Joi", nume: "Thursday" },
    { cheie: "Vineri", nume: "Friday" },
    { cheie: "Sambata", nume: "Saturday" },
    { cheie: "Duminica", nume: "Sunday" }
  ];

  let zileActive = getZileActive();
  let zileInfo = (currentLang === 'en' ? zileInfoEn : zileInfoRo).filter(z => zileActive.includes(z.cheie));
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
  let ultima = zile[zile.length - 1].dataDate;
  let vineriStr = `${ultima.getDate()} ${ultima.toLocaleString(localeStr, { month: 'short' })} ${ultima.getFullYear()}`;
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
  // Cu 7 zile butoanele sunt mai înguste; numele se scurtează (Lun, Mar...) doar dacă cele întregi nu încap
  let sapteZile = zile.length > 5;
  container.classList.toggle('sapte-zile', sapteZile);
  let html = '';
  zile.forEach(z => {
    let activeCls = (z.cheie === ziCurentaCheie) ? 'active' : '';
    html += `
      <button class="day-btn ${activeCls}" onclick="schimbaZiInstant('${z.cheie}')">
        <span data-nume-lung="${z.nume}" data-nume-scurt="${z.nume.slice(0, 3)}">${z.nume}</span>
        <span class="day-date-sub">${z.dataDate.getDate()} ${z.monthName}</span>
      </button>
    `;
  });
  container.innerHTML = html;
  ajusteazaNumeZile(container);
}

// Numele întregi ale zilelor când încap toate în bară, pe un rând; altfel prescurtate (Lun, Mar...).
// O bară ascunsă (alt tab) nu se poate măsura: rămâne cu numele întregi până la următoarea afișare.
function ajusteazaNumeZile(container) {
  if (!container || !container.offsetWidth) return;
  const etichete = [...container.querySelectorAll('[data-nume-lung]')];
  etichete.forEach(e => { e.textContent = e.dataset.numeLung; });
  // Nu încap: bara derulează, un nume se rupe pe două rânduri sau iese din butonul lui (butoanele de 7 zile sunt înguste)
  const nuIncap = container.scrollWidth > container.clientWidth + 1 ||
    etichete.some(e => e.getClientRects().length > 1 || e.offsetWidth > e.parentElement.clientWidth - 2);
  if (nuIncap) etichete.forEach(e => { e.textContent = e.dataset.numeScurt; });
}

function schimbaZiInstant(ziCheie) {
  if (ziCurentaCheie === ziCheie) return;
  ziCurentaCheie = ziCheie;

  let detOrar = document.getElementById('detailsIstoricOrar');
  if (detOrar) detOrar.open = false;

  const dayBtns = document.querySelectorAll('#dayButtonsContainer .day-btn');
  const zile = getZileConfig();
  dayBtns.forEach((btn, idx) => {
    if (zile[idx]) {
      btn.classList.toggle('active', zile[idx].cheie === ziCurentaCheie);
    }
  });

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
  randeazaCereriInscriere();
  if (document.getElementById('detaliiFisa')?.style.display === 'none') randeazaListaClienteFisa();
}

// ---- Fișă fără clientă aleasă: lista clientelor, cu starea abonamentului și filtrul „De urmărit” ----
let filtruListaFisa = 'toate';

// Starea abonamentului pentru listă; `urmarit` = are nevoie de atenție (reînnoire, expirat, fără abonament)
function stareAbonamentClienta(c) {
  const st = (c.status || '').toLowerCase();
  if (st === 'arhivat' || st === 'archived') return { tip: 'arhivat', text: tr('Arhivată', 'Archived'), urmarit: false };
  if (st === 'inghetat') {
    const dela = c.inghetare && c.inghetare.de_la;
    return { tip: 'inghetat', text: dela ? tr(`Înghețat din ${dela}`, `Frozen since ${dela}`) : tr('Înghețat', 'Frozen'), urmarit: false };
  }
  if (!c.incluse || !c.tipAbonament || c.tipAbonament === '-') return { tip: 'nou', text: tr('Fără abonament', 'No subscription'), urmarit: true };
  const exp = parseazaDataOraRo(c.dataExpirare);
  const azi = new Date(); azi.setHours(0, 0, 0, 0);
  const zile = exp ? Math.round((new Date(exp).setHours(0, 0, 0, 0) - azi) / 86400000) : null;
  if (st === 'expirat' || (zile !== null && zile < 0)) return { tip: 'expirat', text: tr('Expirat', 'Expired'), urmarit: true };
  if (st === 'finalizat' || c.ramase <= 0) return { tip: 'expirat', text: tr('Fără ședințe', 'No sessions left'), urmarit: true };
  if (zile !== null && zile <= 7) {
    return { tip: 'curand', urmarit: true, zile, text: zile === 0 ? tr('Expiră azi', 'Expires today')
      : tr(`Expiră în ${zile} ${zile === 1 ? 'zi' : 'zile'}`, `Expires in ${zile} ${zile === 1 ? 'day' : 'days'}`) };
  }
  if (c.ramase <= 2) return { tip: 'curand', urmarit: true, text: tr(`${c.ramase} ${c.ramase === 1 ? 'ședință' : 'ședințe'}`, `${c.ramase} ${c.ramase === 1 ? 'session' : 'sessions'} left`) };
  return { tip: 'activ', text: tr(`${c.ramase} rămase`, `${c.ramase} left`), urmarit: false };
}

// Semafor de retenție: clienții care nu mai vin. Galben = 14–29 de zile fără prezență; roșu = 30+ zile,
// sau abonament terminat și nereînnoit de cel puțin 7 zile. Peste 180 de zile nu mai apar (de arhivat, nu de reactivat).
function stareRetentie(c, s) {
  if (s.tip === 'arhivat' || s.tip === 'nou' || s.tip === 'inghetat') return null;
  const ultima = (DB.prezente || []).filter(p => randulClientei(p, c, p.clienta))
    .reduce((max, p) => Math.max(max, parseazaDataOraRo(p.data)), 0);
  if (!ultima) return null;
  const azi = new Date(); azi.setHours(0, 0, 0, 0);
  const zile = Math.round((azi - new Date(ultima).setHours(0, 0, 0, 0)) / 86400000);
  if (zile < 7 || zile > 180) return null;
  if (zile >= 30 || (s.tip === 'expirat' && zile >= 7)) return { culoare: 'rosu', zile };
  return zile >= 14 ? { culoare: 'galben', zile } : null;
}

function trimiteMesajReactivare(nume) {
  const c = (DB.clienti || []).find(x => x.nume === nume);
  if (!c) return;
  const prenume = c.nume.trim().split(/\s+/)[0];
  trimiteMesajClient(c, tr(`Bună, ${prenume}! Ne-a fost dor de tine la antrenamente. Vrei să-ți rezerv un loc săptămâna asta?`,
    `Hi ${prenume}! We’ve missed you at training. Shall I book you a spot this week?`), c.contConectat ? URL_APLICATIE : undefined);
}

// Clientul cu cont: alegi conversația din aplicație (textul e gata scris, se poate modifica) sau meniul de partajare.
// Fără cont: direct meniul de partajare.
function trimiteMesajClient(c, text, link) {
  if (!c.contConectat) return partajeaza(text, link);
  customConfirm(tr(`Mesaj către ${c.nume}`, `Message to ${c.nume}`),
    tr('Textul e deja scris; îl poți modifica înainte să-l trimiți.', 'The text is ready; you can edit it before sending.'),
    () => deschideMesajeCuText(c, text));
  document.getElementById('modalBtnConfirm').innerText = tr('În aplicație', 'In the app');
  aratButonAlternativModal(tr('WhatsApp, SMS…', 'WhatsApp, SMS…'), () => partajeaza(text, link));
}

function deschideMesajeCuText(c, text) {
  deschideMesaje(c.id, utilizatorCurent.id, c.nume);
  const camp = document.getElementById('mesajText');
  camp.value = text;
  potrivesteCampMesaj(camp);
  camp.focus();
}

// Abonament propriu-zis (nu ședință gratuită / individuală) încă valabil
function areAbonamentActiv(c) {
  return regulaAbonament(c.tipAbonament).fel === 'abonament' && ['activ', 'curand', 'inghetat'].includes(stareAbonamentClienta(c).tip);
}

function randeazaListaClienteFisa() {
  const lista = document.getElementById('listaClienteFisa');
  const emptyState = document.getElementById('fisaEmptyState');
  if (!lista) return;
  const arataArhivate = document.getElementById('checkArataArhivate')?.checked;
  const cauta = (document.getElementById('selectClientaFisa')?.value || '').trim().toLowerCase();
  const toate = (DB.clienti || [])
    .map(c => { const s = stareAbonamentClienta(c); return { c, s, r: stareRetentie(c, s) }; })
    .filter(x => arataArhivate || x.s.tip !== 'arhivat');

  // Fără nicio clientă (antrenor nou): rămâne cardul gol, cu explicația
  if (toate.length === 0) {
    lista.hidden = true;
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  lista.hidden = false;

  const deUrmarit = toate.filter(x => x.s.urmarit).length;
  const deReactivat = toate.filter(x => x.r).length;
  if ((filtruListaFisa === 'urmarit' && !deUrmarit) || (filtruListaFisa === 'reactivat' && !deReactivat)) filtruListaFisa = 'toate';
  const ordine = { expirat: 0, curand: 1, nou: 2, activ: 3, inghetat: 3, arhivat: 4 };
  const reactivare = filtruListaFisa === 'reactivat';
  const vizibile = toate
    .filter(x => filtruListaFisa === 'toate' || (reactivare ? x.r : x.s.urmarit))
    .filter(x => !cauta || x.c.nume.toLowerCase().includes(cauta))
    .sort((a, b) => reactivare ? (b.r.zile - a.r.zile) : ((ordine[a.s.tip] - ordine[b.s.tip]) || a.c.nume.localeCompare(b.c.nume)));

  const filtru = (id, text, n) => `<button type="button" class="lista-filtru${filtruListaFisa === id ? ' active' : ''}" onclick="filtruListaFisa='${id}'; randeazaListaClienteFisa()">${text}<span>${n}</span></button>`;
  const initiale = nume => nume.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  let html = `<div class="lista-filtre">${filtru('toate', tr('Toate', 'All'), toate.length)}${deUrmarit ? filtru('urmarit', tr('De urmărit', 'Needs attention'), deUrmarit) : ''}${deReactivat ? filtru('reactivat', tr('De reactivat', 'Win back'), deReactivat) : ''}</div>`;
  html += vizibile.length ? vizibile.map(({ c, s, r }) => {
    const detalii = s.tip === 'nou' ? tr('Abonamentul se adaugă din Încasări', 'Add the subscription in Payments')
      : [traduceValoare(c.tipAbonament), c.dataExpirare && c.dataExpirare !== '-' ? tr('până la ', 'until ') + c.dataExpirare : ''].filter(Boolean).join(' · ');
    // În „De reactivat”: semaforul (zile fără prezență) în locul stării abonamentului și butonul de mesaj
    const stare = reactivare
      ? `<span class="lista-stare ${r.culoare === 'rosu' ? 'expirat' : 'curand'}">${tr(`${r.zile} zile`, `${r.zile} days`)}</span>`
      : `<span class="lista-stare ${s.tip}">${escAttr(s.text)}</span>`;
    const rand = `<button type="button" class="lista-clienta" data-nume="${escAttr(c.nume)}" onclick="deschideClientaDinLista(this.dataset.nume)">
        <span class="lista-avatar">${escAttr(initiale(c.nume))}</span>
        <span class="lista-info"><b>${escAttr(c.nume)}</b><small>${reactivare ? tr('fără prezență', 'no attendance') : escAttr(detalii)}</small></span>
        ${stare}
      </button>`;
    return reactivare ? `<div class="lista-rand">${rand}<button type="button" class="lista-mesaj" data-nume="${escAttr(c.nume)}" onclick="trimiteMesajReactivare(this.dataset.nume)" aria-label="${tr('Trimite mesaj', 'Send message')}"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button></div>` : rand;
  }).join('') : `<div class="lista-gol">${tr('Niciun client găsit.', 'No client found.')}</div>`;
  lista.innerHTML = html;
}

// Din fișa deschisă înapoi la lista tuturor clientelor
function inapoiLaListaClienteFisa() {
  const sel = document.getElementById('selectClientaFisa');
  sel.value = '';
  actualizeazaStilSelect(sel);
  filtruListaFisa = 'toate';
  afiseazaFisaClientaInstant();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deschideClientaDinLista(nume) {
  const sel = document.getElementById('selectClientaFisa');
  sel.value = nume;
  actualizeazaStilSelect(sel);
  afiseazaFisaClientaInstant();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
      opt.innerText = traduceValoare(luna);
      sel.appendChild(opt);
    });
    if (valAnterioara) sel.value = valAnterioara;
  });
}

function comutaTab(tabId, titlu, btn, tipTab, tabIdx) {
  tipTabCurent = tipTab;

  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) {
    bottomNav.style.display = 'flex';
    bottomNav.classList.remove('nav-compact');
  }

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#bottomNav button').forEach(el => el.classList.remove('active'));
  let target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  if (typeof tabIdx === 'number') {
    animaPilaMercur(tabIdx);
  }

  if (tipTab === 'incasari') {
    reseteazaDateIncasariAzi();
  }

  // Titlul vine mereu din tabsOrder în limba curentă (butoanele din bara de jos trimit titlul scris în română)
  const tabInfo = tabsOrder.find(tb => tb.id === tabId);
  if (tabInfo) titlu = currentLang === 'en' ? tabInfo.titleEn : tabInfo.titleRo;
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
    ajusteazaNumeZile(document.getElementById('dayButtonsContainer'));
    autoScrollLaOraCurenta();
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

// Iconițele din antetul orei: ceas (ora deschisă, apăsarea o blochează) și lacăt (ora blocată)
const ICON_CEAS_ORA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const ICON_LACAT_ORA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

// Eticheta din antetul orei: „3 libere”, „1 liber”, „Complet”
function textLocuriLibere(libere) {
  if (libere <= 0) return tr('Complet', 'Full');
  return `${libere} ${libere === 1 ? tr('liber', 'free') : tr('libere', 'free')}`;
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
      // Istoricul arată toate prezențele orei, indiferent de numărul de locuri setat acum
      grupuriOreTrecute[rawOra].push({
        ora: rawOra,
        clienta: p.clienta,
        antrenament: p.antrenament,
        bifat: true
      });
    });

    // Programări rămase neconfirmate (clientă trecută, fără bifă): se pot încă confirma (✓) sau șterge (✕)
    (DB.orarSloturi || []).forEach(s => {
      if (!s || s.bifat || !(s.clienta || '').trim()) return;
      if (s.ziRaw !== tagZiCautat && !(ziCurentaCheie === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) return;
      let rawOra = normalizeazaOraUi(s.ora);
      if (!grupuriOreTrecute[rawOra]) grupuriOreTrecute[rawOra] = [];
      grupuriOreTrecute[rawOra].push({
        ora: rawOra,
        clienta: s.clienta.trim(),
        antrenament: s.antrenament || '',
        bifat: false,
        slotIndex: Number(s.slotIndex) || 0
      });
    });

    let oreSet = Object.keys(grupuriOreTrecute).sort((a, b) => a.localeCompare(b));
    if (oreSet.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); padding:24px; text-align:center;">${t('noPresence')}</div>`;
      return;
    }

    let htmlTrecut = '';
    oreSet.forEach(ora => {
      let lista = grupuriOreTrecute[ora];
      let historyText = currentLang === 'en' ? '✓ History' : '✓ Istoric';
      htmlTrecut += `
        <div class="hour-block" data-ora="${ora}">
          <div class="hour-header">
            <div class="hour-title-wrap"><span class="hour-icon-static">${ICON_CEAS_ORA}</span><span>${ora}</span></div>
            ${(() => {
              // Trecut: eticheta apare doar unde a rămas ceva neconfirmat (rândurile confirmate au deja „✓ Istoric”)
              const neconfirmate = lista.filter(s => !s.bifat).length;
              return neconfirmate ? `<div class="hour-badge hour-badge-neconfirmat">${neconfirmate} ${neconfirmate === 1 ? tr('neconfirmată', 'unconfirmed') : tr('neconfirmate', 'unconfirmed')}</div>` : '';
            })()}
          </div>
          <div class="hour-slots-wrapper">
      `;
      lista.forEach((s, idx) => {
        let colorCls = culoareAntrenament(s.antrenament);

        if (!s.bifat) {
          // Aceleași ID-uri ca în orarul curent: bifeazaPrezentaSlot / anuleazaSlot citesc numele și antrenamentul din ele
          let cheie = `${ora.replace(':', '')}_${s.slotIndex}`;
          htmlTrecut += `
          <div class="slot-row slot-occupied">
            <div class="slot-num">${idx + 1}</div>
            <div class="slot-info">
              <input type="text" id="cli_${cheie}" class="slot-input" value="${escAttr(s.clienta)}" readonly style="font-weight:700;">
              <input type="text" id="ant_${cheie}" class="slot-input ${colorCls}" value="${escAttr(traduceValoare(s.antrenament))}" data-valoare="${escAttr(s.antrenament)}" placeholder="-" readonly style="font-size:0.75rem; font-weight:700; margin-top:2px;">
            </div>
            <div style="display:flex; gap:4px;">
              <button id="btn_save_${cheie}" class="btn btn-save-check" title="${tr('Confirmă prezența (scade o ședință)', 'Confirm attendance (deducts a session)')}" onclick="bifeazaPrezentaSlot('${ziCurentaCheie}', '${ora}', ${s.slotIndex})">✓</button>
              <button id="btn_clear_${cheie}" class="btn btn-clear" title="${tr('Nu a venit: șterge programarea', 'Did not come: remove booking')}" onclick="anuleazaSlot('${ziCurentaCheie}', '${ora}', ${s.slotIndex})">✕</button>
            </div>
          </div>
        `;
          return;
        }

        htmlTrecut += `
          <div class="slot-row slot-occupied">
            <div class="slot-num">${idx + 1}</div>
            <div class="slot-info">
              <input type="text" class="slot-input" value="${escAttr(s.clienta)}" readonly style="font-weight:700;">
              <input type="text" class="slot-input ${colorCls}" value="${escAttr(traduceValoare(s.antrenament) || '-')}" readonly style="font-size:0.75rem; font-weight:700; margin-top:2px;">
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
  });

  // Exact un loc pentru fiecare index (numărul de locuri vine din Setări): indexul lipsă se completează,
  // la rânduri dublate pe același index rămâne cel ocupat, altfel apar ID-uri dublate și numere decalate
  let nrLocuri = setariOrar.locuri;
  Object.keys(grupuriOre).forEach(ora => {
    let indexuri = Array.from({ length: nrLocuri }, (_, i) => i);
    // Dacă numărul de locuri s-a micșorat, locurile de peste rămân vizibile cât au clientă, prezență sau sunt deschise
    grupuriOre[ora].forEach(s => {
      let i = Number(s.slotIndex) || 0;
      if (i >= nrLocuri && (s.clienta || s.bifat || s.deschis) && !indexuri.includes(i)) indexuri.push(i);
    });
    indexuri.sort((a, b) => a - b);
    grupuriOre[ora] = indexuri.map(i => {
      let ale = grupuriOre[ora].filter(s => (Number(s.slotIndex) || 0) === i);
      return ale.find(s => s.clienta) || ale[0] || { row: null, ora: ora, clienta: "", antrenament: "", blocat: false, bifat: false, slotIndex: i };
    });
  });

  let oreSortate = Object.keys(grupuriOre).sort((a, b) => a.localeCompare(b));

  let html = '';
  oreSortate.forEach(ora => {
    let sloturiOra = grupuriOre[ora] || [];
    let esteBlocat = sloturiOra.some(s => s && s.blocat);
    let ocupate = sloturiOra.filter(s => s && s.clienta && s.clienta.trim() !== "").length;
    let total = sloturiOra.length;

    // Eticheta arată locurile libere; ora blocată (lacăt + chenar roșu) o are doar dacă are deja cliente programate
    let badgeHtml = '';
    let clientsBadgeHtml = '';
    let libere = Math.max(0, total - ocupate);
    if (esteBlocat) {
      if (ocupate > 0) clientsBadgeHtml = `<div class="hour-badge hour-badge-busy">${ocupate} ${ocupate === 1 ? tr('programare', 'booking') : tr('programări', 'bookings')}</div>`;
    } else {
      badgeHtml = `<div class="hour-badge ${ocupate > 0 ? 'hour-badge-busy' : 'hour-badge-free'}">${textLocuriLibere(libere)}</div>`;
    }

    let lockTitle = esteBlocat ? (currentLang === 'en' ? 'Unlock hour' : 'Deblochează ora') : (currentLang === 'en' ? 'Block hour' : 'Blochează ora');
    // Oră suplimentară goală: se poate șterge (stergeOraCustom)
    let stergeOraHtml = !oreStandard.includes(ora) && ocupate === 0 && !sloturiOra.some(s => s && s.bifat)
      ? `<button class="btn-sterge-ora" onclick="stergeOraCustom('${ziCurentaCheie}', '${ora}')" title="${tr('Șterge ora suplimentară', 'Remove extra hour')}" aria-label="${tr('Șterge ora suplimentară', 'Remove extra hour')}">×</button>`
      : '';

    html += `
      <div class="hour-block ${esteBlocat ? 'hour-block-blocked' : ''}" data-ora="${ora}">
        <div class="hour-header">
          <div class="hour-title-wrap">
            <button class="btn-lock-hour" onclick="comutaBlocareOraInstant('${ziCurentaCheie}', '${ora}', ${!esteBlocat})" title="${lockTitle}" aria-label="${lockTitle}">
              ${esteBlocat ? ICON_LACAT_ORA : ICON_CEAS_ORA}
            </button>
            <span>${ora}</span>
          </div>
          <div class="hour-header-dreapta">
            ${clientsBadgeHtml}
            ${badgeHtml}
            ${stergeOraHtml}
          </div>
        </div>
        <div class="hour-slots-wrapper" ${esteBlocat ? 'style="pointer-events: none; user-select: none;"' : ''}>
    `;

    if (esteBlocat) {
      let motivCurent = (sloturiOra.find(s => s && s.motiv) || {}).motiv || '';
      html += `
        <div class="hour-motiv-overlay">
          <textarea class="hour-motiv-input" id="motiv_${ora.replace(':', '')}" rows="1" maxlength="300" placeholder="${tr('Motiv / notiță (ex: programare)', 'Reason / note (e.g. appointment)')}" oninput="peSchimbareMotivOra('${ziCurentaCheie}', '${ora}')">${escAttr(motivCurent)}</textarea>
        </div>
      `;
    }

    sloturiOra.forEach((slot, idx) => {
      let slotIdx = (typeof slot.slotIndex === 'number') ? slot.slotIndex : idx;
      let clientaCurata = (slot && slot.clienta) ? slot.clienta.trim() : "";
      let clientaValida = gasesteClientaValida(clientaCurata);
      let isOccupied = !!clientaValida;
      let antVal = (slot && slot.antrenament) ? slot.antrenament : "";
      let slotDomKey = `${ora.replace(':', '')}_${slotIdx}`;

      let colorCls = culoareAntrenament(antVal);

      let tipAntrenamentPlaceholder = currentLang === 'en' ? 'Workout type' : 'Tip antrenament';
      let clientPlaceholder = currentLang === 'en' ? 'Choose existing client...' : 'Alege client existent...';

      let selectAntHtml = `<select id="ant_${slotDomKey}" class="slot-select-type ${antVal ? 'select-active ' + colorCls : 'select-faded'}" onchange="aplicaCuloareAntrenament(this); peSchimbareAntrenament('${ziCurentaCheie}', '${ora}', ${slotIdx})">`;
      selectAntHtml += `<option value="" ${!antVal ? 'selected' : ''}>${tipAntrenamentPlaceholder}</option>`;
      // Tip șters sau redenumit între timp: rămâne în listă cât e salvat pe slot
      let tipuriSlot = optiuniAntrenamentConfig.map(opt => opt.text);
      if (antVal && !tipuriSlot.includes(antVal)) tipuriSlot.push(antVal);
      tipuriSlot.forEach(text => {
        let selected = (antVal === text) ? 'selected' : '';
        selectAntHtml += `<option value="${escAttr(text)}" ${selected}>${escAttr(traduceValoare(text))}</option>`;
      });
      selectAntHtml += `</select>`;

      let saveBtnDisabledAttr = (!isOccupied || slot.bifat) ? 'disabled' : '';
      let saveBtnClass = (!isOccupied || slot.bifat) ? 'btn btn-save-check btn-save-check-disabled' : 'btn btn-save-check';

      let slotEsteCompletGol = !clientaCurata && !antVal;
      let clearBtnDisabledAttr = slotEsteCompletGol ? 'disabled' : '';
      let clearBtnClass = slotEsteCompletGol ? 'btn btn-clear btn-clear-disabled' : 'btn btn-clear';

      // Loc liber: numărul e și comutator „deschis pentru rezervări"; loc rezervat de clientă: număr marcat
      let slotNumHtml = `<div class="slot-num">${slotIdx + 1}</div>`;
      if (!isOccupied && !slot.bifat) {
        let titluDeschis = slot.deschis ? tr('Deschis pentru rezervări (apasă ca să închizi)', 'Open for booking (tap to close)') : tr('Închis pentru rezervări (apasă ca să deschizi)', 'Closed for booking (tap to open)');
        slotNumHtml = `<button type="button" class="slot-num slot-num-btn ${slot.deschis ? 'slot-deschis' : ''}" title="${titluDeschis}" onclick="comutaSlotDeschis('${ziCurentaCheie}', '${ora}', ${slotIdx})">${slotIdx + 1}</button>`;
      } else if (slot.rezervatOnline) {
        slotNumHtml = `<div class="slot-num slot-num-online" title="${tr('Rezervat de client', 'Booked by the client')}">${slotIdx + 1}</div>`;
      }

      html += `
        <div class="slot-row ${isOccupied ? 'slot-occupied' : 'slot-free'}">
          ${slotNumHtml}
          <div class="slot-info">
            <input type="text" id="cli_${slotDomKey}" class="slot-input" value="${escAttr(clientaCurata)}" placeholder="${clientPlaceholder}" list="listaClienteVizibile" autocomplete="off" oninput="peSchimbareNumeClienta('${ziCurentaCheie}', '${ora}', ${slotIdx}, event)">
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
  container.querySelectorAll('.hour-motiv-input').forEach(potrivesteInaltimeNotita);
}

// Notița orei blocate crește cu textul. Unde CSS nu are `field-sizing` (Safari mai vechi), înălțimea se pune din JS,
// imediat după randare, ca să fie măsurată corect de calibreazaLayoutEcran
const ARE_FIELD_SIZING = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('field-sizing', 'content');
function potrivesteInaltimeNotita(el) {
  if (ARE_FIELD_SIZING || !el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight + 2, 120) + 'px';
}

// Deschide/închide un loc liber pentru rezervările clientelor. Locul se creează în baza de date dacă nu există încă.
function comutaSlotDeschis(zi, ora, slotIdx) {
  const saptamanaCheie = getSaptamanaCheie();
  const oraNorm = normalizeazaOraUi(ora);
  const tagZi = saptamanaCheie + '_' + zi;
  let slot = (DB.orarSloturi || []).find(s => s && (s.ziRaw === tagZi || (zi === 'Marti' && s.ziRaw === saptamanaCheie + '_Marți')) && normalizeazaOraUi(s.ora) === oraNorm && (Number(s.slotIndex) || 0) === slotIdx);
  const nou = !(slot && slot.deschis);
  if (!slot) {
    slot = { row: null, ziRaw: tagZi, ora: oraNorm, clienta: '', antrenament: '', blocat: false, bifat: false, slotIndex: slotIdx, deschis: false, rezervatOnline: false };
    DB.orarSloturi.push(slot);
  }
  slot.deschis = nou;
  randeazaOrarInstant();
  callBackend("seteazaSlotDeschis", { saptamanaCheie: saptamanaCheie, zi: zi, ora: oraNorm, slotIndex: slotIdx, row: slot.row, deschis: nou }, function(res) {
    if (res && res.row) slot.row = res.row;
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
  }, function() {
    slot.deschis = !nou;
    randeazaOrarInstant();
  });
}

// O blocare/deblocare în curs: o a doua atingere pe ceas/lacăt ar putea crea rânduri duplicate în baza de date
let blocareOraInCurs = false;

function comutaBlocareOraInstant(zi, ora, blocatNou) {
  if (blocareOraInCurs) {
    showToast(tr("Se salvează, încearcă din nou în câteva secunde", "Saving, try again in a few seconds"), "error");
    return;
  }
  let saptamanaCheie = getSaptamanaCheie();
  let tagZiCautat = saptamanaCheie + "_" + zi;
  let oraNorm = normalizeazaOraUi(ora);
  let textConfirm = blocatNou ? 
    (currentLang === 'en' ? `Block time slot ${oraNorm}?` : `Blochezi intervalul orar ${oraNorm}?`) : 
    (currentLang === 'en' ? `Unblock time slot ${oraNorm}?` : `Deblochezi intervalul orar ${oraNorm}?`);
  const sloturiOra = (DB.orarSloturi || []).filter(s => (s.ziRaw === tagZiCautat || s.ziRaw === (saptamanaCheie + "_Marți")) && normalizeazaOraUi(s.ora) === oraNorm);
  // Motivul se cere doar la blocare, cu câmpul gol; la deblocare se șterge
  const camp = blocatNou ? { placeholder: tr('Motiv / notiță (opțional)', 'Reason / note (optional)') } : undefined;

  customConfirm(currentLang === 'en' ? "Time Slot Locking" : "Blocare oră", textConfirm, function(motivNou) {
    sloturiOra.forEach(s => {
      s.blocat = blocatNou;
      s.motiv = blocatNou ? motivNou : '';
    });
    randeazaOrarInstant();
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}

    const payload = { saptamanaCheie: saptamanaCheie, zi: zi, ora: oraNorm, blocat: blocatNou };
    payload.motiv = blocatNou ? motivNou : '';
    blocareOraInCurs = true;
    callBackend("comutaBlocareOra", payload, function() {
      blocareOraInCurs = false;
      showToast(blocatNou ? 
        (currentLang === 'en' ? `✓ Time slot ${oraNorm} has been blocked!` : `✓ Intervalul ${oraNorm} a fost blocat!`) : 
        (currentLang === 'en' ? `✓ Time slot ${oraNorm} has been unblocked!` : `✓ Intervalul ${oraNorm} a fost deblocat!`)
      );
      incarcaBazaDateSilencios();
    }, function() { blocareOraInCurs = false; });
  }, camp);
}

// Notița orei blocate se salvează singură, la o scurtă pauză după ultima tastă
let debounceTimerMotiv = null;
function peSchimbareMotivOra(zi, ora) {
  let oraNorm = normalizeazaOraUi(ora);
  let el = document.getElementById('motiv_' + oraNorm.replace(':', ''));
  if (!el) return;
  potrivesteInaltimeNotita(el);
  let saptamanaCheie = getSaptamanaCheie();
  let tagZiCautat = saptamanaCheie + "_" + zi;
  let motiv = el.value.trim();

  (DB.orarSloturi || []).forEach(s => {
    if ((s.ziRaw === tagZiCautat || s.ziRaw === (saptamanaCheie + "_Marți")) && normalizeazaOraUi(s.ora) === oraNorm) s.motiv = motiv;
  });

  clearTimeout(debounceTimerMotiv);
  debounceTimerMotiv = setTimeout(() => {
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
    callBackend("salveazaMotivOra", { saptamanaCheie: saptamanaCheie, zi: zi, ora: oraNorm, motiv: motiv });
  }, 700);
}

let debounceTimerNume = null;

// „Arată programarea”: locul existent ajunge în mijlocul ecranului și pulsează ca ora curentă
function arataLocExistent(slot) {
  const ora = normalizeazaOraUi(slot.ora);
  const rand = document.getElementById('cli_' + ora.replace(':', '') + '_' + (Number(slot.slotIndex) || 0))?.closest('.slot-row');
  if (!rand) return;
  rand.scrollIntoView({ behavior: 'auto', block: 'center' });
  rand.classList.remove('slot-evidentiat');
  void rand.offsetWidth;
  rand.classList.add('slot-evidentiat');
  setTimeout(() => rand.classList.remove('slot-evidentiat'), DURATA_HIGHLIGHT_ORA + 100);
}

// Clienta are deja un loc în ziua afișată. Aceeași oră: blocat (cu „Arată programarea”).
// Altă oră: avertizare, iar „Adaugă oricum” salvează (adaugaOricum).
function arataProgramareaExistenta(nume, slot, oraNoua, adaugaOricum) {
  const ora = normalizeazaOraUi(slot.ora);
  const zi = ((getZileConfig().find(z => z.cheie === ziCurentaCheie) || {}).nume || '').toLowerCase();
  if (ora === oraNoua) {
    customConfirm(
      tr('Are deja o programare la această oră', 'Already booked at this time'),
      tr(`${nume} are deja o programare ${zi} la ${ora}. Nu poate ocupa două locuri la aceeași oră.`,
         `${nume} is already booked on ${zi} at ${ora}. They cannot take two spots at the same time.`),
      function() { arataLocExistent(slot); }
    );
    document.getElementById('modalBtnConfirm').innerText = tr('Arată programarea', 'Show booking');
    return;
  }
  customConfirm(
    tr('Încă o programare în aceeași zi', 'Another booking on the same day'),
    tr(`${nume} are deja o programare ${zi} la ${ora}. Adaugi o programare și la ${oraNoua}?`,
       `${nume} already has a booking on ${zi} at ${ora}. Add them at ${oraNoua} too?`),
    function() {
      adaugaOricum();
      randeazaOrarInstant();
    }
  );
  document.getElementById('modalBtnConfirm').innerText = tr('Adaugă oricum', 'Add anyway');
}
function seteazaStilSlotOcupat(elCli, ocupat) {
  let rand = elCli ? elCli.closest('.slot-row') : null;
  if (!rand) return;
  rand.classList.toggle('slot-occupied', ocupat);
  rand.classList.toggle('slot-free', !ocupat);

  let bloc = rand.closest('.hour-block');
  let badge = bloc ? bloc.querySelector('.hour-badge-busy, .hour-badge-free') : null;
  if (!badge) return;
  let inputs = bloc.querySelectorAll('.slot-input');
  let nr = 0;
  inputs.forEach(inp => { if (gasesteClientaValida(inp.value.trim())) nr++; });
  badge.textContent = textLocuriLibere(inputs.length - nr);
  badge.classList.toggle('hour-badge-busy', nr > 0);
  badge.classList.toggle('hour-badge-free', nr === 0);
}

function peSchimbareNumeClienta(zi, ora, slotIdx, ev) {
  let oraNorm = normalizeazaOraUi(ora);
  let slotDomKey = `${oraNorm.replace(':', '')}_${slotIdx}`;
  let elCli = document.getElementById('cli_' + slotDomKey);
  let elBtnSave = document.getElementById('btn_save_' + slotDomKey);
  let elBtnClear = document.getElementById('btn_clear_' + slotDomKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);
  seteazaStilSlotOcupat(elCli, !!clientaGasita);

  // Alegere din listă (nu tastare): ieșim din câmp, salvarea pornește oricum după debounce
  let dinLista = ev && (ev.inputType === 'insertReplacementText' || !ev.inputType);
  if (clientaGasita && dinLista && elCli) elCli.blur();

  if (elBtnSave) {
    if (clientaGasita) {
      elBtnSave.disabled = false;
      elBtnSave.classList.remove('btn-save-check-disabled');
    } else {
      elBtnSave.disabled = true;
      elBtnSave.classList.add('btn-save-check-disabled');
    }
  }

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
    let antrenament = elAnt ? (elAnt.dataset.valoare ?? elAnt.value) : "";
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

    // Aceeași clientă în aceeași zi: la aceeași oră e blocat; la altă oră se poate, după avertizare
    let dubluri = (DB.orarSloturi || []).filter(s => s &&
      (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) &&
      (s.clienta || '').trim().toLowerCase() === numeExact.toLowerCase() &&
      !(normalizeazaOraUi(s.ora) === oraNorm && Number(s.slotIndex) === Number(slotIdx)))
      .sort((a, b) => normalizeazaOraUi(a.ora).localeCompare(normalizeazaOraUi(b.ora)));
    let dublura = dubluri.find(s => normalizeazaOraUi(s.ora) === oraNorm) || dubluri[0];
    if (dublura) {
      if (elCli) elCli.blur();
      randeazaOrarInstant(); // locul revine la ce era salvat; se completează doar dacă antrenorul confirmă
      arataProgramareaExistenta(numeExact, dublura, oraNorm, salveazaInSlot);
      return;
    }
    salveazaInSlot();

    function salveazaInSlot() {
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
    }
  }, 400);
}

function peSchimbareAntrenament(zi, ora, slotIdx) {
  let oraNorm = normalizeazaOraUi(ora);
  let slotDomKey = `${oraNorm.replace(':', '')}_${slotIdx}`;
  let elCli = document.getElementById('cli_' + slotDomKey);
  let elAnt = document.getElementById('ant_' + slotDomKey);
  let elBtnClear = document.getElementById('btn_clear_' + slotDomKey);
  let textIntrodus = elCli ? elCli.value.trim() : "";
  let antrenament = elAnt ? (elAnt.dataset.valoare ?? elAnt.value) : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (elBtnClear) {
    let areCeva = (textIntrodus !== "") || (antrenament !== "");
    elBtnClear.disabled = !areCeva;
    if (areCeva) elBtnClear.classList.remove('btn-clear-disabled');
    else elBtnClear.classList.add('btn-clear-disabled');
  }

  if (!clientaGasita) {
    showToast(currentLang === 'en' ? "Please choose an active existing client first!" : "Alege mai întâi un client activ existent!", "error");
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
  let antrenament = elAnt ? (elAnt.dataset.valoare ?? elAnt.value) : "";
  let clientaGasita = gasesteClientaValida(textIntrodus);

  if (!clientaGasita) {
    showToast(currentLang === 'en' ? "Choose a valid client from the list!" : "Alege un client valid din listă!", "error");
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
  let antrenament = elAnt ? (elAnt.dataset.valoare ?? elAnt.value) : "";

  let slotExistent = (DB.orarSloturi || []).find(s => {
    if (!s || !s.ziRaw) return false;
    let rawOra = normalizeazaOraUi(s.ora);
    return (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === (saptamanaCheie + "_Marți"))) && 
           rawOra === oraNorm && 
           Number(s.slotIndex) === Number(slotIdx);
  });

  if (!textIntrodus && !antrenament && (!slotExistent || (!slotExistent.clienta && !slotExistent.antrenament))) {
    return;
  }

  let confirmTitleText = currentLang === 'en' ? "Free slot" : "Eliberare slot";
  let confirmDescText = currentLang === 'en' ? 
    "Free this slot? The session will be restored to the client's profile if it was checked, and the entry will be removed from history." : 
    "Eliberezi acest slot? Ședința va fi restituită în fișa clientului dacă a fost bifată, iar intrarea va fi ștearsă din istoric.";

  customConfirm(confirmTitleText, confirmDescText, function() {
    let dataCalendar = getDataCalendaristicaCurenta();
    let elBtnSave = document.getElementById('btn_save_' + slotDomKey);
    let elBtnClear = document.getElementById('btn_clear_' + slotDomKey);

    if (elCli) elCli.value = "";
    seteazaStilSlotOcupat(elCli, false);
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
  let oraNorm = normalizeazaOraUi(ora.replace('.', ':'));
  let m = oraNorm.match(/^(\d{2}):(\d{2})$/);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
    showToast(tr("Ora trebuie scrisă ca 07:30", "Use the format 07:30"), "error");
    return;
  }
  let existaDeja = document.querySelector(`#sloturiContainer .hour-block[data-ora="${oraNorm}"]`);
  if (existaDeja) {
    showToast(tr(`Ora ${oraNorm} există deja`, `${oraNorm} already exists`), "error");
    return;
  }

  const zi = ziCurentaCheie;
  callBackend("adaugaOraCustom", { saptamanaCheie: saptamanaCheie, zi: zi, ora: oraNorm }, function(res) {
    // Ora se adaugă doar în ziua selectată: toast-ul o spune explicit
    const zCfg = getZileConfig().find(z => z.cheie === zi);
    const ziText = zCfg ? `${zCfg.nume}, ${formatZiLuna(zCfg.dataDate)}` : '';
    showToast(tr(`✓ Ora ${res.ora} adăugată pentru ${ziText}`, `✓ ${res.ora} added for ${ziText}`));
    if (inp) inp.value = '';
    // Rândurile noi intră direct în orar, ca ora să se vadă imediat; reîncărcarea completă vine după
    if (Array.isArray(res.randuri)) DB.orarSloturi = (DB.orarSloturi || []).concat(res.randuri);
    if (ziCurentaCheie === zi) {
      randeazaOrarInstant();
      aratOraInOrar(res.ora);
    }
    incarcaBazaDateSilencios();
  });
}

// O oră suplimentară adăugată greșit se poate scoate cât e goală (fără cliente și fără prezențe)
function stergeOraCustom(zi, ora) {
  customConfirm(tr('Ștergi ora suplimentară?', 'Remove the extra hour?'), tr(`Ora ${ora} dispare din această zi.`, `${ora} is removed from this day.`), () => {
    const tagZi = getSaptamanaCheie() + "_" + zi;
    callBackend("stergeOraCustom", { saptamanaCheie: getSaptamanaCheie(), zi: zi, ora: ora }, function(res) {
      if (!res || !res.success) {
        showToast(tr('Ora are deja programări și nu se poate șterge.', 'This hour already has bookings and cannot be removed.'), 'error');
        incarcaBazaDateSilencios();
        return;
      }
      DB.orarSloturi = (DB.orarSloturi || []).filter(s => !(s && (s.ziRaw === tagZi || (zi === "Marti" && s.ziRaw === getSaptamanaCheie() + "_Marți")) && normalizeazaOraUi(s.ora) === ora));
      randeazaOrarInstant();
      showToast(tr(`Ora ${ora} a fost ștearsă`, `${ora} removed`));
      incarcaBazaDateSilencios();
    });
  });
  document.getElementById('modalBtnConfirm').innerText = tr('Șterge', 'Remove');
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
        <td><b>${escAttr(item.data)}</b></td>
        <td style="font-weight:700;">${escAttr(item.ora || '-')}</td>
        <td style="font-weight:700; color:var(--primary);">${escAttr(item.clienta)}</td>
        <td>${escAttr(traduceValoare(item.antrenament) || '-')}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function getPillClass(val) {
  if (val === "Confirmata" || val === "Confirmed" || val === "Finalizat") return "pill-confirmata";
  if (val === "In asteptare" || val === "Pending" || val === "În așteptare") return "pill-asteptare";
  if (val === "Absenta" || val === "Absent" || val === "Sărit") return "pill-absenta";
  return "pill-empty";
}

function randeazaProgramariInstant() {
  let actContainer = document.getElementById('progActiveList');
  let holdContainer = document.getElementById('progHoldList');
  // După randare nu mai sunt „în încărcare”: fără padding-ul de 16px, rândurile se aliniază cu antetul (#, Nume...)
  if (actContainer) actContainer.classList.remove('loader');
  if (holdContainer) holdContainer.classList.remove('loader');

  if (actContainer) {
    randuriSaptamana = randuriConfirmariSaptamana();
    const mentionPlaceholder = tr('Mențiune...', 'Mention...');
    const cuTinta = randuriSaptamana.filter(r => r.tinta);
    const complete = cuTinta.filter(r => r.facute >= r.tinta).length;
    const partiale = cuTinta.filter(r => r.facute && r.facute < r.tinta).length, zero = cuTinta.length - complete - partiale;
    const luni = new Date(dataReferintaLuniBaza), duminica = new Date(luni.getTime() + 6 * 86400000);
    const perioada = luni.getMonth() === duminica.getMonth() ? `${luni.getDate()} – ${formatZiLuna(duminica)}` : `${formatZiLuna(luni)} – ${formatZiLuna(duminica)}`;
    const rezumat = cuTinta.length ? `<div class="prog-rezumat">
        <div class="prog-rezumat-sus"><span>${tr('Săptămâna', 'Week')} ${perioada}</span><b>${complete}<small> / ${cuTinta.length} ${tr('compleți', 'complete')}</small></b></div>
        <div class="prog-rezumat-bara"><i style="width:${Math.round(complete / cuTinta.length * 100)}%"></i></div>
        <div class="prog-rezumat-legenda">
          ${zero ? `<span class="zero">○ ${zero} ${zero === 1 ? tr('neprogramat', 'not booked') : tr('neprogramați', 'not booked')}</span>` : ''}
          ${partiale ? `<span class="partial">◐ ${partiale} ${tr('parțial', 'partly')}</span>` : ''}
          ${complete ? `<span class="complet">✓ ${complete} ${tr('complet', 'complete')}</span>` : ''}
        </div>
      </div>` : '';
    const actHtml = randuriSaptamana.map((r, i) => {
      const cls = !r.tinta ? 'fara' : r.facute >= r.tinta ? 'complet' : r.facute ? 'partial' : 'zero';
      const stare = r.tinta ? `<button type="button" class="prog-saptamana ${cls}" onclick="apasaStareSaptamana(${i})" title="${r.facute >= r.tinta ? tr('Are toate ședințele programate', 'All sessions booked') : tr('Trimite un reminder', 'Send a reminder')}">${r.facute >= r.tinta ? '✓' : r.facute ? '◐' : '○'} ${r.facute}/${r.tinta}</button>`
        : `<span class="prog-saptamana fara">${escAttr(r.stare || '–')}</span>`;
      return `
        <div class="prog-grid-layout prog-row">
          <div class="prog-idx">${i + 1}</div>
          <div class="prog-name"><span class="prog-nume-bloc"><span>${escAttr(r.nume)}</span>${r.tinta ? `<button type="button" class="prog-tinta" onclick="seteazaTintaSaptamana(${i})">${r.tinta} ${tr('pe săpt.', 'a week')}${r.c && r.c.sedinteSaptamana ? ' ✎' : ''}</button>` : ''}</span></div>
          <div>${stare}</div>
          <div>
            <textarea rows="${r.conf && r.conf.mentiuni ? 2 : 1}" class="prog-mentiuni-textarea" placeholder="${mentionPlaceholder}" onblur="schimbaMentiuneSaptamana(${i}, this.value)">${escAttr(r.conf ? r.conf.mentiuni : '')}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action prog-hold-btn" onclick="mutaInHoldSaptamana(${i})" title="${tr('Mută în Hold', 'Move to Hold')}" aria-label="${tr('Mută în Hold', 'Move to Hold')}">${SVG_PAUZA_HOLD}</button>
          </div>
        </div>`;
    }).join('');
    actContainer.innerHTML = actHtml ? rezumat + actHtml : `<div style="padding:10px; color:#888; text-align:center;">${t('noRecords')}</div>`;
  }

  if (holdContainer) {
    let holdHtml = '';
    let pausePlaceholder = currentLang === 'en' ? 'Pause reason...' : 'Motiv pauză...';
    (DB.progHold || []).forEach((item, index) => {
      holdHtml += `
        <div class="prog-grid-layout-hold prog-row hold-row">
          <div class="prog-idx">${index + 1}</div>
          <div class="prog-name">${escAttr(item.nume)}</div>
          <div style="grid-column: 3 / 4;">
            <textarea rows="${item.mentiuni ? 2 : 1}" class="prog-mentiuni-textarea prog-mentiuni-hold" placeholder="${pausePlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${escAttr(item.mentiuni)}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action prog-din-hold-btn" onclick="stergeProgramareDefinitiv(${item.row})" title="${tr('Scoate din Hold', 'Take out of Hold')}" aria-label="${tr('Scoate din Hold', 'Take out of Hold')}">${SVG_DIN_HOLD}</button>
          </div>
        </div>
      `;
    });
    // Abonamentele înghețate din fișă apar și ele aici (doar de citit; se reiau din fișă)
    (DB.clienti || []).filter(c => esteInghetat(c) && !(DB.progHold || []).some(p => randulClientei(p, c, p.nume))).forEach((c, i) => {
      holdHtml += `
        <div class="prog-grid-layout-hold prog-row hold-row">
          <div class="prog-idx">${(DB.progHold || []).length + i + 1}</div>
          <div class="prog-name">${escAttr(c.nume)}</div>
          <div style="grid-column: 3 / 4;" class="prog-inghetat">⏸ ${escAttr(stareAbonamentClienta(c).text)}</div>
          <div></div>
        </div>`;
    });
    holdContainer.innerHTML = holdHtml || `<div style="padding:10px; color:#888; text-align:center;">${t('noClientsHold')}</div>`;
  }
}

// ---- Confirmări pe săptămână (sql/2026-11-07_confirmari_saptamana.sql): lista se face singură din abonamente și orar ----
// Ținta = ședințele pe săptămână setate de antrenor sau, automat, ședințele rămase de la începutul săptămânii împărțite la
// săptămânile rămase până la expirare: cine vine mai des primește apoi o țintă mai mică, cine rămâne în urmă una mai mare.
// Programat = programările clientului din orar în săptămâna curentă (făcute sau încă nu). Aceleași reguli ca reminderele din bază.
let randuriSaptamana = [];
const SVG_PAUZA_HOLD = '<svg class="plan-btn-svg" viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>';
const SVG_DIN_HOLD = '<svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>';

// bifate = ședințele făcute deja săptămâna asta (scăzute din `ramase`): se adaugă înapoi, ca ținta să nu scadă în timpul săptămânii
function tintaAutomataSaptamana(c, bifate) {
  const disponibile = c.ramase + bifate;
  const luni = new Date(dataReferintaLuniBaza); luni.setHours(0, 0, 0, 0);
  const exp = parseazaDataOraRo(c.dataExpirare);
  // Abonament fără dată de expirare (pornește la prima ședință): toată valabilitatea lui
  const zile = exp ? Math.round((new Date(exp).setHours(0, 0, 0, 0) - luni) / 86400000) + 1 : (zileValabilitateAbonament(c.tipAbonament) || 30);
  return Math.min(Math.max(1, Math.round(disponibile / Math.max(1, zile / 7))), disponibile, 7);
}

const tintaSaptamanaClient = (c, bifate) => c.sedinteSaptamana ? Math.min(c.sedinteSaptamana, c.ramase + bifate) : tintaAutomataSaptamana(c, bifate);

function randuriConfirmariSaptamana() {
  const prefix = `W_${isoDinData(dataReferintaLuniBaza).replace(/-/g, '_')}_`;
  // Rândurile din confirmari se leagă de client după client_id, iar fără legătură, după nume (randulClientei)
  const inHold = c => (DB.progHold || []).some(p => randulClientei(p, c, p.nume));
  const folosite = new Set();
  const randuri = (DB.clienti || []).filter(c => {
    const t = stareAbonamentClienta(c).tip;
    return t !== 'arhivat' && t !== 'inghetat' && !inHold(c);
  }).map(c => {
    // Toate rândurile clientului (pot fi mai multe, rămase din lista de dinainte) devin unul: primul cu mențiune
    const aleLui = (DB.progActive || []).filter(p => randulClientei(p, c, p.nume));
    aleLui.forEach(p => folosite.add(p));
    const s = stareAbonamentClienta(c);
    // Ținta doar la abonamentele active (aceleași reguli ca reminderele din bază); ceilalți apar cu starea abonamentului
    const areTinta = (s.tip === 'activ' || s.tip === 'curand') && c.incluse >= 4 && c.ramase > 0;
    const aleSaptamanii = (DB.orarSloturi || []).filter(x => x.clienta && x.ziRaw.startsWith(prefix) && cheieNume(x.clienta) === cheieNume(c.nume));
    const bifate = aleSaptamanii.filter(x => x.bifat).length;
    return {
      c, nume: c.nume, bifate, tinta: areTinta ? tintaSaptamanaClient(c, bifate) : 0, stare: areTinta ? '' : s.text,
      facute: aleSaptamanii.length,
      conf: aleLui.find(p => p.mentiuni) || aleLui[0] || null
    };
  });
  // Rândurile vechi, adăugate de mână pentru nume care nu mai sunt în lista de clienți, rămân cu mențiunile lor
  (DB.progActive || []).forEach(p => {
    // Doar rândurile care nu sunt ale niciunui client din listă (și nici ale unuia arhivat, înghețat sau în Hold)
    if (folosite.has(p) || (DB.clienti || []).some(c => randulClientei(p, c, p.nume))) return;
    randuri.push({ c: null, nume: p.nume, tinta: 0, stare: '', facute: 0, conf: p });
  });
  // Întâi cine n-a programat nimic, apoi cine e la jumătate, apoi cei compleți
  const ordine = r => !r.tinta ? 3 : r.facute >= r.tinta ? 2 : r.facute ? 1 : 0;
  return randuri.sort((a, b) => ordine(a) - ordine(b) || a.nume.localeCompare(b.nume));
}

function apasaStareSaptamana(i) {
  const r = randuriSaptamana[i];
  if (!r || !r.c) return;
  if (r.facute >= r.tinta) return showToast(tr(`${r.nume} are toate ședințele săptămânii programate.`, `${r.nume} has all of this week’s sessions booked.`));
  const prenume = r.c.nume.trim().split(/\s+/)[0], lipsa = r.tinta - r.facute;
  trimiteMesajClient(r.c, r.facute
    ? tr(`Bună, ${prenume}! Săptămâna asta ai programată ${r.facute === 1 ? 'o ședință' : `${r.facute} ședințe`} din ${r.tinta}. Îți rezervi ${lipsa === 1 ? 'și ora care lipsește' : 'și orele care lipsesc'}?`,
      `Hi ${prenume}! This week you have ${r.facute} of ${r.tinta} sessions booked. Shall we book the ${lipsa === 1 ? 'missing one' : 'missing ones'}?`)
    : tr(`Bună, ${prenume}! Încă nu ți-ai programat ședințele săptămâna asta (${r.tinta}). Ce ore îți convin?`,
      `Hi ${prenume}! You haven’t booked this week’s sessions yet (${r.tinta}). Which times suit you?`),
    r.c.contConectat ? URL_APLICATIE : undefined);
}

// Ședințele pe săptămână ale clientului; gol = calculul din abonament
function seteazaTintaSaptamana(i) {
  const r = randuriSaptamana[i];
  if (!r || !r.c) return;
  const auto = tintaAutomataSaptamana(r.c, r.bifate);
  customConfirm(tr('Ședințe pe săptămână', 'Sessions per week'),
    tr(`Câte ședințe trebuie să programeze ${r.nume} pe săptămână (1–7). Lasă gol pentru calculul automat (ședințele rămase pe săptămânile până la expirare): acum ${auto}.`,
      `How many sessions ${r.nume} should book each week (1–7). Leave empty for the automatic count (sessions left over the weeks until expiry): now ${auto}.`), async valoare => {
      const v = valoare === '' ? null : parseInt(valoare, 10);
      if (v !== null && !(v >= 1 && v <= 7)) return showToast(tr('Alege între 1 și 7.', 'Pick between 1 and 7.'), 'error');
      const { error } = await supabaseClient.from('cliente').update({ sedinte_saptamana: v }).eq('id', r.c.id).eq('user_id', utilizatorCurent.id);
      if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
      r.c.sedinteSaptamana = v;
      try { localStorage.setItem('BFIT_DB_LOCAL', JSON.stringify(DB)); } catch (e) {}
      showToast(tr('✓ Salvat', '✓ Saved'));
      randeazaProgramariInstant();
    }, { valoare: r.c.sedinteSaptamana ? String(r.c.sedinteSaptamana) : '', placeholder: String(auto) });
}

// Mențiunile și Hold-ul stau în confirmari; rândul se creează la prima mențiune sau la mutarea în Hold
function schimbaMentiuneSaptamana(i, val) {
  const r = randuriSaptamana[i];
  if (!r) return;
  if (r.conf) { if (val !== r.conf.mentiuni) schimbaMentiune(r.conf.row, val); return; }
  if (!val.trim()) return;
  callBackend("adaugaRandProgramare", { nume: r.nume, prezenta: "", mentiuni: val, esteHold: false }, () => incarcaBazaDateSilencios());
}

function mutaInHoldSaptamana(i) {
  const r = randuriSaptamana[i];
  if (!r) return;
  if (r.conf) return mutaInHold(r.conf.row);
  customConfirm(tr('Mutare în Hold', 'Move to Hold'), tr(`Muți ${r.nume} în Hold? Nu mai apare în lista săptămânii și nu mai primește remindere.`, `Move ${r.nume} to Hold? They leave this week’s list and get no reminders.`), function() {
    callBackend("adaugaRandProgramare", { nume: r.nume, prezenta: "", mentiuni: "", esteHold: true }, function() {
      showToast(t('toastMovedHold'));
      incarcaBazaDateSilencios();
    });
  });
}

function schimbaPrezenta(row, selectEl) {
  let val = selectEl.value;
  selectEl.className = "pill-select " + getPillClass(val);
  actualizeazaProgramareLocal(row, 'prezenta', val);
  callBackend("actualizeazaCampProgramare", { row: row, col: 3, val: val }, function() {
    showToast(currentLang === 'en' ? "✓ Status updated!" : "✓ Status actualizat!");
  });
}

// Memoria și cache-ul local rămân la zi, ca o re-randare (ex. schimbarea limbii) să nu readucă valoarea veche
function actualizeazaProgramareLocal(row, camp, val) {
  let item = (DB.progActive || []).concat(DB.progHold || []).find(p => p.row === row);
  if (!item) return;
  item[camp] = val;
  try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
}

function schimbaMentiune(row, val) {
  actualizeazaProgramareLocal(row, 'mentiuni', val);
  callBackend("actualizeazaCampProgramare", { row: row, col: 4, val: val }, function() {});
}

function mutaInHold(row) {
  customConfirm(currentLang === 'en' ? "Move to Hold" : "Mutare în Hold", currentLang === 'en' ? "Move client to Hold section?" : "Mut clientul în secțiunea Hold?", function() {
    callBackend("mutaInHold", { row: row }, function() {
      showToast(t('toastMovedHold'));
      incarcaBazaDateSilencios();
    });
  });
}

function stergeProgramareDefinitiv(row) {
  const r = (DB.progHold || []).find(p => p.row === row);
  customConfirm(tr('Scoate din Hold', 'Take out of Hold'), tr(`Scoți ${r ? r.nume : 'clientul'} din Hold? Revine în lista săptămânii (mențiunea de pauză se șterge).`, `Take ${r ? r.nume : 'the client'} out of Hold? They return to this week’s list (the pause note is removed).`), function() {
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

  let client = nume ? (DB.clienti || []).find(c => c && c.nume.toLowerCase() === nume.toLowerCase()) : null;
  if (!client) {
    container.style.display = 'none';
    randeazaListaClienteFisa();
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  document.getElementById('listaClienteFisa').hidden = true;
  container.style.display = 'block';
  randeazaAntetFisa(client);
  randeazaNotaClient(client);

  document.getElementById('fisaSedinteRamase').innerText = client.ramase;
  // Abonament activat fără dată: valabilitatea pornește la prima ședință bifată
  const asteaptaStart = client.incluse > 0 && (!client.dataExpirare || client.dataExpirare === '-');
  // Înghețat: expirarea e oprită până la Reia (cea de dinainte stă în client.inghetare)
  document.getElementById('fisaValabilitate').innerText = esteInghetat(client) ? tr('În pauză', 'Paused')
    : asteaptaStart ? tr('La prima ședință', 'At first session') : client.dataExpirare;
  
  let progresText = currentLang === 'en' ? `Progress: ${client.efectuate} of ${client.incluse} sessions` : `Progres: ${client.efectuate} din ${client.incluse} ședințe`;
  document.getElementById('fisaProgres').innerText = `${client.efectuate} ${currentLang === 'en' ? 'of' : 'din'} ${client.incluse}`;

  let procent = client.incluse > 0 ? Math.round((client.efectuate / client.incluse) * 100) : 0;
  if (procent > 100) procent = 100;
  document.getElementById('graficBara').style.width = procent + '%';
  document.getElementById('graficProcent').innerText = procent + '%';
  document.getElementById('graficProgresText').innerText = progresText;
  document.getElementById('fisaTipAbonamentAfisat').innerText = traduceValoare(client.tipAbonament);

  // Aceeași stare ca în lista de clienți (după dată și ședințe), nu doar câmpul `status` salvat
  let badge = document.getElementById('fisaStatusBadge');
  let stLower = (client.status || '').toLowerCase();
  const stare = stareAbonamentClienta(client);
  // Îngheață / Reia: doar cât există un abonament propriu-zis în desfășurare (sau deja înghețat)
  const btnIngh = document.getElementById('btnInghetareAbonament');
  if (btnIngh) {
    const poate = stare.tip === 'inghetat' || (['activ', 'curand'].includes(stare.tip) && regulaAbonament(client.tipAbonament).fel === 'abonament');
    document.getElementById('blocInghetareAbonament').hidden = !poate;
    btnIngh.innerText = stare.tip === 'inghetat' ? tr('Reia abonamentul', 'Resume subscription') : tr('Îngheață abonamentul', 'Freeze subscription');
    document.getElementById('notaInghetareAbonament').innerText = stare.tip === 'inghetat'
      ? tr(`${stare.text}. Zilele de pauză se adaugă la expirare când îl reiei.`, `${stare.text}. The paused days are added to the expiry when you resume.`)
      : tr('Pentru concediu sau boală: zilele se opresc, ședințele rămân.', 'For holidays or illness: the days stop, the sessions stay.');
  }
  if (stare.tip === 'activ' || stare.tip === 'curand') {
    badge.innerHTML = `<span class="badge badge-activ">${tr('Activ', 'Active')}</span>`;
  } else if (stare.tip === 'expirat') {
    badge.innerHTML = `<span class="badge badge-expirat">${stare.text}</span>`;
  } else {
    badge.innerHTML = `<span class="badge badge-arhivat">${stare.text}</span>`;
  }

  document.getElementById('btnStergeClientDefinitivText').innerText = tr('Șterge definitiv', 'Delete permanently');
  let btnArch = document.getElementById('btnArhivareToggle');
  if (btnArch) {
    if (stLower === 'arhivat' || stLower === 'archived') {
      document.getElementById('btnArhivareToggleText').innerText = t('reactivateBtn');
      btnArch.querySelector('svg').innerHTML = '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>';
      btnArch.style.color = '#15803d';
    } else {
      document.getElementById('btnArhivareToggleText').innerText = t('archiveBtn');
      btnArch.querySelector('svg').innerHTML = '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>';
      btnArch.style.color = '';
    }
  }

  document.getElementById('editNume').value = client.nume;
  seteazaTipAbonamentSelect(document.getElementById('editTip'), client.tipAbonament);
  document.getElementById('editDataStart').value = dataRoInIso(client.dataStart);
  document.getElementById('editDataExpirare').value = dataRoInIso(client.dataExpirare);
  document.getElementById('editIncluse').value = client.incluse;
  document.getElementById('editEfectuate').value = client.efectuate;
  document.getElementById('editRamase').value = client.ramase;
  document.getElementById('editStatus').value = client.status;
  document.getElementById('editTelefon').value = client.telefon || '';
  // Emailul = cel al invitației; cu cont conectat e emailul contului, deci blocat
  const elEmail = document.getElementById('editEmail');
  elEmail.value = client.emailInvitatie || '';
  elEmail.disabled = client.contConectat;
  document.getElementById('labelEditEmail').innerText = client.contConectat ? tr('Email (cont)', 'Email (account)') : 'Email';
  actualizeazaContactFisa(client);
  valoriInitialeFisa = valoriEditareFisa();

  actualizeazaBlocContClienta(client);
  const detInscriere = document.getElementById('detailsFisaInscriere');
  detInscriere.hidden = false;
  randeazaFisaInscriereDeschisa();
  randeazaPlanFisa(client);
  // Progresul apare la toți: check-in-urile pot fi și importate (ex. din Google Forms), fără cont sau fișă de obiective
  document.getElementById('detailsProgresClienta').hidden = false;
  incarcaProgresFisa();
  filtreazaIstoricFisaInstant();
}

// Planurile clientului în fișă (cel mai recent primul): progres pe exerciții, ultima notiță, deschidere pentru editare
function randeazaPlanFisa(client) {
  const cont = document.getElementById('planFisaContinut');
  if (!cont) return;
  const planuri = (DB.planuri || []).filter(p => randulClientei(p, client, p.clienta))
    .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
  if (!planuri.length) {
    cont.innerHTML = `<div class="plan-picker-empty">${tr('Niciun plan trimis. Deschide un șablon din Plan de antrenament și apasă „Trimite la clienți”.', 'No plan sent yet. Open a template in Workout plan and press "Send to clients".')}</div>`;
    return;
  }
  cont.innerHTML = planuri.map((p, i) => {
    const ex = (p.continut_json?.sesiuni || []).flatMap(s => (s.exercitii || []).filter(x => (x.exercitiu || '').trim()));
    const facute = ex.filter(x => x.status === 'Finalizat').length;
    const note = (p.continut_json?.sesiuni || []).flatMap(s => [s.nota_client, ...(s.exercitii || []).map(x => x.nota_client)]).filter(n => (n || '').trim());
    const data = p.updated_at ? new Date(p.updated_at).toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO') : '';
    return `<button type="button" class="plan-zi-card" onclick="deschidePlanDinFisa('${escAttr(p.id)}')">
      <span class="plan-zi-card-text">
        <span class="plan-zi-card-titlu">${i === 0 ? '' : `<span class="plan-fisa-vechi">${tr('Anterior', 'Earlier')} · </span>`}${escAttr(p.titlu)}</span>
        <span class="plan-zi-card-detalii">${data ? `${tr('Actualizat', 'Updated')} ${data} · ` : ''}${facute}/${ex.length} ${tr('exerciții făcute', 'exercises done')}${note.length ? ` · ${note.length} ${note.length === 1 ? tr('notiță', 'note') : tr('notițe', 'notes')}` : ''}</span>
      </span>
      <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>`;
  }).join('');
}

// Deschide planul clientului în Plan de antrenament (cu revenire în fișă la Înapoi)
let planDeschisDinFisa = false;
async function deschidePlanDinFisa(idPlan) {
  await deschideSectiunePlanAntrenamentDinMeniu();
  planDeschisDinFisa = true;
  selecteazaPlanDinLista(idPlan);
}

function actualizeazaBlocContClienta(client) {
  const inp = document.getElementById('fisaEmailInvitatie');
  const stare = document.getElementById('fisaContStatus');
  const btn = document.getElementById('btnInvitaClienta');
  if (!inp || !stare || !btn) return;
  inp.value = client.emailInvitatie || '';
  inp.disabled = client.contConectat;
  // Cu cont conectat emailul e deja în contact, sus: rămâne doar starea
  document.getElementById('fisaContInvitatie').hidden = client.contConectat;
  // Venită din formular: emailul e pus din formular, nu dintr-o invitație trimisă, deci încă „Fără cont”
  const invitata = client.emailInvitatie && !client.fisaInscriere;
  btn.innerText = invitata ? tr('Retrimite invitația', 'Resend invitation') : tr('Trimite invitația', 'Send invitation');
  stare.innerText = client.contConectat
    ? '✓ ' + tr('Conectat', 'Linked')
    : (invitata ? tr('Așteaptă conectarea', 'Waiting to sign in') : tr('Fără cont', 'No account'));
  stare.className = 'fisa-cont-stare ' + (client.contConectat ? 'conectat' : invitata ? 'asteapta' : 'fara');
}

// ---- Formularul de înscriere la antrenor: cererile noi și răspunsurile din fișă ----
// Titluri scurte pentru afișarea răspunsurilor (întrebările întregi rămân în formular)
const ETICHETE_SCURTE_INSCRIERE = {
  afectiuni: { ro: 'Afecțiuni medicale', en: 'Medical conditions' },
  dureri: { ro: 'Dureri / accidentări', en: 'Pain / injuries' },
  restrictii: { ro: 'Restricții de la medic', en: 'Doctor’s restrictions' },
  angajament: { ro: 'Program de 3 luni', en: '3-month program' },
  feedback: { ro: 'Feedback', en: 'Feedback' },
  pozeProgres: { ro: 'Poze de progres', en: 'Progress photos' },
  medicatie: { ro: 'Medicație / tratament', en: 'Medication / treatment' },
  sarcina: { ro: 'Sarcină sau naștere în ultimele 12 luni', en: 'Pregnancy or birth in the last 12 months' },
  urgenta: { ro: 'Contact pentru urgențe', en: 'Emergency contact' },
  domeniu: { ro: 'Domeniu de lucru', en: 'Line of work' },
  energie: { ro: 'Nivel de energie', en: 'Energy level' },
  somn: { ro: 'Somn', en: 'Sleep' },
  sportAnterior: { ro: 'Sport practicat', en: 'Past training' },
  termen: { ro: 'Termen pentru obiective', en: 'Goal deadline' },
  intervaleNota: { ro: 'Detalii despre program', en: 'Schedule details' },
  deUnde: { ro: 'De unde a aflat', en: 'Heard about you from' },
  consecventa: { ro: 'Ce ajută la consecvență', en: 'What helps with consistency' },
  frecventa: { ro: 'Antrenamente pe săptămână', en: 'Sessions per week' },
  intervale: { ro: 'Intervale orare preferate', en: 'Preferred time slots' },
  asteptari: { ro: 'Așteptări de la antrenor', en: 'Expectations from the trainer' },
  deStiut: { ro: 'De știut înainte de început', en: 'Good to know before starting' }
};
// În „Fișa mea” clienta își citește propriile răspunsuri: titlurile la persoana I
const ETICHETE_CLIENTA_INSCRIERE = {
  consecventa: { ro: 'Ce mă ajută să nu renunț', en: 'What keeps me going' },
  dataStart: { ro: 'Încep din', en: 'Starting from' },
  deUnde: { ro: 'Am aflat din', en: 'I heard from' }
};

// Fișa de obiective ca rezumat: cifre, alertă medicală, etichete, apoi textele libere.
// Numele, telefonul și emailul nu se repetă (sunt deja în fișă / în antetul cererii).
// ---- Notița antrenorului pentru client (cliente.nota_client): clientul o vede pe Acasă ----
function randeazaNotaClient(client) {
  document.getElementById('notaClientText').value = client.notaClient || '';
  document.getElementById('notaClientStare').textContent = client.notaClientLa
    ? `${tr('Actualizată', 'Updated')} ${formatZiLuna(new Date(client.notaClientLa))}` : '';
  randeazaBlocMesaje(client);
}

// ---- Mesaje în aplicație între antrenor și client (tabelul mesaje, sql/2026-11-03_mesaje.sql); WhatsApp rămâne în paralel ----
let conversatie = null; // { clientId, userId, mesaje }
let mesajEditat = null; // mesajul (din conversatie.mesaje) care se editează în câmpul de jos
const autorulMeu = () => rolUtilizator === 'clienta' ? 'client' : 'antrenor';

// Ultimul mesaj și câte sunt necitite (primite de la celălalt), pentru cardul de pe Acasă și blocul din fișă
async function rezumatMesaje(clientId) {
  const [ultim, necitite] = await Promise.all([
    supabaseClient.from('mesaje').select('autor, text, created_at, tip, context').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1),
    supabaseClient.from('mesaje').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('citit', false).neq('autor', autorulMeu())
  ]);
  if (ultim.error) return null;
  return { ultim: (ultim.data || [])[0] || null, necitite: necitite.count || 0 };
}

const textUltimulMesaj = r => r && r.ultim
  ? (r.ultim.autor === autorulMeu() ? tr('Tu: ', 'You: ') : '') + textScurtMesaj(r.ultim)
  : '';

// Textul scurt al unui mesaj (liste, Acasă, fișă): notițele și recordurile din antrenament cu exercițiul în față
function textScurtMesaj(m) {
  const ex = (m.context && (m.context.exercitiu || m.context.zi)) || '';
  if (m.tip === 'nota') return '📝 ' + (ex ? ex + ': ' : '') + m.text;
  if (m.tip === 'record') return '🏆 ' + tr('Record', 'Record') + (ex ? ' ' + ex : '') + ': ' + m.text;
  return m.text;
}

// ---- Contextul din antrenament în conversație (client): notițele scrise la exerciții / zi și recordurile noi ----
const recorduriTrimise = new Set();

async function trimiteContextInConversatie(tip, text, context) {
  const c = dateClienta.fisa;
  if (rolUtilizator !== 'clienta' || !c || !c.user_id || !(text || '').trim()) return;
  // Fără internet nu se trimite (notița rămâne oricum în plan); nu deranjăm clientul cu o eroare
  await supabaseClient.from('mesaje').insert({ user_id: c.user_id, client_id: c.id, autor: 'client', text: text.trim().slice(0, 2000), tip, context });
}

function trimiteNotaInConversatie(s, e, valoare) {
  const ses = dateClienta.planCurent?.continut_json?.sesiuni?.[s];
  if (!ses) return;
  const ex = e === null ? null : ses.exercitii?.[e];
  trimiteContextInConversatie('nota', valoare, { exercitiu: ex ? ex.exercitiu || '' : '', zi: ses.titlu || '' });
}

// Fișa clientului (antrenor): blocul Mesaje apare doar pentru clienții cu cont în aplicație
async function randeazaBlocMesaje(client) {
  const bloc = document.getElementById('blocMesajeClient');
  if (!bloc) return;
  bloc.hidden = !client.contConectat;
  if (!client.contConectat) return;
  const stare = document.getElementById('mesajeClientStare');
  const ultimul = document.getElementById('mesajeClientUltimul');
  const r = await rezumatMesaje(client.id);
  if (clientaFisaCurenta() !== client) return;
  stare.textContent = r && r.necitite ? (r.necitite === 1 ? tr('1 necitit', '1 unread') : tr(`${r.necitite} necitite`, `${r.necitite} unread`)) : '';
  stare.classList.toggle('mesaje-necitite', !!(r && r.necitite));
  ultimul.textContent = textUltimulMesaj(r) || tr('Niciun mesaj încă. Clientul îți poate răspunde din aplicație.', 'No messages yet. The client can reply in the app.');
}

function deschideMesajeAntrenor() {
  const client = clientaFisaCurenta();
  if (client) deschideMesaje(client.id, utilizatorCurent.id, client.nume);
}

function deschideMesajeClienta() {
  const c = dateClienta.fisa;
  if (!c) return;
  const prenume = ((dateClienta.contact && dateClienta.contact.nume_antrenor) || '').trim().split(' ')[0];
  deschideMesaje(c.id, c.user_id, prenume || tr('Antrenorul tău', 'Your trainer'));
}

async function deschideMesaje(clientId, userId, titlu) {
  conversatie = { clientId, userId, mesaje: [] };
  // Câmpul pornește gol: o ciornă nescrisă nu trece la conversația altui client
  const camp = document.getElementById('mesajText');
  camp.value = '';
  camp.style.height = '';
  seteazaEditareMesaj(null);
  document.getElementById('btnStergeConversatia').hidden = true;
  document.getElementById('panouMesajeTitlu').textContent = titlu;
  document.getElementById('mesajeLista').innerHTML = `<div class="mesaje-gol">${tr('Se încarcă...', 'Loading...')}</div>`;
  raspunsuriEditare = false;
  randeazaRaspunsuriRapide();
  document.getElementById('panouMesaje').classList.remove('auth-hidden');
  sincronizeazaIstoricInapoi();
  await incarcaConversatie();
}

async function incarcaConversatie() {
  if (!conversatie) return;
  const { clientId } = conversatie;
  const { data, error } = await supabaseClient.from('mesaje').select('id, autor, text, created_at, citit, tip, context, editat_la').eq('client_id', clientId).order('created_at').limit(500);
  if (!conversatie || conversatie.clientId !== clientId) return;
  if (error) {
    document.getElementById('mesajeLista').innerHTML = `<div class="mesaje-gol">${tr('Mesajele nu s-au putut încărca. Verifică internetul și reîncearcă.', 'Messages could not be loaded. Check your internet and try again.')}</div>`;
    return;
  }
  conversatie.mesaje = data || [];
  randeazaConversatie();
  if (conversatie.mesaje.some(m => !m.citit && m.autor !== autorulMeu())) {
    await supabaseClient.rpc('marcheaza_mesaje_citite', { p_client_id: clientId });
  }
}

function randeazaConversatie() {
  const lista = document.getElementById('mesajeLista');
  document.getElementById('btnStergeConversatia').hidden = !conversatie.mesaje.length;
  if (!conversatie.mesaje.length) {
    lista.innerHTML = `<div class="mesaje-gol">${rolUtilizator === 'clienta'
      ? tr('Scrie-i antrenorului tău. Vede mesajul în aplicație și primește o notificare.', 'Write to your trainer. They see it in the app and get a notification.')
      : tr('Scrie-i clientului. Vede mesajul în aplicație și primește o notificare.', 'Write to your client. They see it in the app and get a notification.')}</div>`;
    return;
  }
  let ziAnterioara = '';
  lista.innerHTML = conversatie.mesaje.map((m, i) => {
    const d = new Date(m.created_at);
    const zi = d.toDateString();
    const separator = zi !== ziAnterioara ? `<div class="mesaje-zi">${formatZiLuna(d)}</div>` : '';
    ziAnterioara = zi;
    const ora = d.toLocaleTimeString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { hour: '2-digit', minute: '2-digit' });
    // Notițele și recordurile din antrenament: card cu exercițiul și ziua deasupra textului
    const cx = m.context || {};
    const antet = m.tip === 'nota' ? `📝 ${tr('Notiță', 'Note')}` : m.tip === 'record' ? `🏆 ${tr('Record nou', 'New record')}` : '';
    const unde = [cx.exercitiu, cx.zi].filter(Boolean).map(escAttr).join(' · ');
    const context = antet ? `<div class="mesaj-context"><b>${antet}</b>${unde ? `<span>${unde}</span>` : ''}</div>` : '';
    // Mesajele proprii: atingerea deschide Editează / Șterge
    const alMeu = m.autor === autorulMeu();
    const editat = m.editat_la ? `${tr('editat', 'edited')} · ` : '';
    return `${separator}<div class="mesaj${alMeu ? ' al-meu' : ''}${antet ? ' mesaj-' + m.tip : ''}${mesajEditat && mesajEditat.id === m.id ? ' in-editare' : ''}"${alMeu ? ` onclick="actiuniMesaj(${i})"` : ''}>${context}<div class="mesaj-text">${escAttr(m.text)}</div><small>${editat}${ora}</small></div>`;
  }).join('');
  // „Văzut” sub ultimul mesaj trimis, după ce celălalt a deschis conversația
  const ultim = conversatie.mesaje[conversatie.mesaje.length - 1];
  if (ultim.autor === autorulMeu() && ultim.citit) lista.insertAdjacentHTML('beforeend', `<div class="mesaj-vazut">${tr('Văzut', 'Seen')}</div>`);
  lista.scrollTop = lista.scrollHeight;
}

// Câmpul de scris crește cu textul (până la ~5 rânduri); bara de derulare apare doar peste înălțimea maximă
function potrivesteCampMesaj(camp) {
  camp.style.height = 'auto';
  const inaltime = camp.scrollHeight + camp.offsetHeight - camp.clientHeight; // + bordura
  camp.style.height = Math.min(inaltime, 120) + 'px';
  camp.style.overflowY = inaltime > 120 ? 'auto' : 'hidden';
}

async function trimiteMesaj() {
  const camp = document.getElementById('mesajText');
  const text = camp.value.trim();
  if (!text || !conversatie) return;
  const btn = document.getElementById('btnTrimiteMesaj');
  btn.disabled = true;
  if (mesajEditat) {
    const m = mesajEditat;
    const { data: rez, error: err } = await supabaseClient.rpc('editeaza_mesaj', { p_id: m.id, p_text: text });
    btn.disabled = false;
    if (err || rez !== 'ok') return showToast(tr('Mesajul nu s-a modificat. Verifică internetul și reîncearcă.', 'The message was not changed. Check your internet and try again.'), 'error');
    // Conversația se poate reîncărca între timp (mesaj nou): se actualizează rândul din lista curentă
    const x = (conversatie && conversatie.mesaje.find(y => y.id === m.id)) || m;
    x.text = text;
    x.editat_la = new Date().toISOString();
    seteazaEditareMesaj(null);
    return randeazaConversatie();
  }
  const { data, error } = await supabaseClient.from('mesaje')
    .insert({ user_id: conversatie.userId, client_id: conversatie.clientId, autor: autorulMeu(), text })
    .select('id, autor, text, created_at, citit, tip, context, editat_la').single();
  btn.disabled = false;
  if (error) return showToast(tr('Mesajul nu s-a trimis. Verifică internetul și reîncearcă.', 'The message was not sent. Check your internet and try again.'), 'error');
  camp.value = '';
  camp.style.height = '';
  if (!conversatie) return;
  conversatie.mesaje.push(data);
  randeazaConversatie();
}

// ---- Editarea și ștergerea mesajelor proprii (pentru amândoi); conversația se șterge doar pentru cel care o șterge ----
function actiuniMesaj(i) {
  const m = conversatie && conversatie.mesaje[i];
  if (!m || m.autor !== autorulMeu()) return;
  if (String(window.getSelection ? window.getSelection() : '')) return; // pe calculator, selectarea textului nu deschide meniul
  // Notițele și recordurile din antrenament nu se editează aici (rămân ca în plan): doar se pot șterge
  if (m.tip !== 'text') return confirmaStergereMesaj(m);
  customConfirm(tr('Mesajul tău', 'Your message'), m.text.length > 160 ? m.text.slice(0, 160) + '…' : m.text, () => seteazaEditareMesaj(m));
  document.getElementById('modalBtnConfirm').innerText = tr('Editează', 'Edit');
  aratButonAlternativModal(tr('Șterge', 'Delete'), () => confirmaStergereMesaj(m));
}

function confirmaStergereMesaj(m) {
  customConfirm(tr('Ștergi mesajul?', 'Delete this message?'), tr('Se șterge pentru amândoi.', 'It will be deleted for both of you.'), () => stergeMesaj(m));
  document.getElementById('modalBtnConfirm').innerText = tr('Șterge', 'Delete');
}

async function stergeMesaj(m) {
  const { data, error } = await supabaseClient.rpc('sterge_mesaj', { p_id: m.id });
  if (error || data !== 'ok') return showToast(tr('Mesajul nu s-a șters. Verifică internetul și reîncearcă.', 'The message was not deleted. Check your internet and try again.'), 'error');
  if (!conversatie) return;
  conversatie.mesaje = conversatie.mesaje.filter(x => x.id !== m.id);
  if (mesajEditat && mesajEditat.id === m.id) seteazaEditareMesaj(null);
  randeazaConversatie();
}

// Editarea se face în câmpul de jos, cu bara „Editezi mesajul” deasupra; null = înapoi la mesaj nou
function seteazaEditareMesaj(m) {
  mesajEditat = m;
  const camp = document.getElementById('mesajText');
  document.getElementById('mesajEditare').hidden = !m;
  camp.value = m ? m.text : '';
  camp.style.height = '';
  if (m) { potrivesteCampMesaj(camp); camp.focus(); }
  if (conversatie && conversatie.mesaje.length) randeazaConversatie();
}

function anuleazaEditareMesaj() {
  seteazaEditareMesaj(null);
}

function stergeConversatia() {
  if (!conversatie) return;
  // Dispare doar la cel care o șterge; celălalt își păstrează mesajele
  const nume = document.getElementById('panouMesajeTitlu').textContent;
  customConfirm(tr('Ștergi conversația?', 'Delete the conversation?'),
    tr(`Conversația dispare doar din lista ta. ${nume} își păstrează mesajele.`, `The conversation is removed only from your list. ${nume} keeps the messages.`), async () => {
      const { error } = await supabaseClient.rpc('sterge_conversatia', { p_client_id: conversatie.clientId });
      if (error) return showToast(tr('Conversația nu s-a șters. Verifică internetul și reîncearcă.', 'The conversation was not deleted. Check your internet and try again.'), 'error');
      showToast(tr('✓ Conversația a fost ștearsă', '✓ Conversation deleted'));
      inchidePanouMesaje();
    });
  document.getElementById('modalBtnConfirm').innerText = tr('Șterge', 'Delete');
}

function inchidePanouMesaje() {
  document.getElementById('panouMesaje').classList.add('auth-hidden');
  conversatie = null;
  mesajEditat = null;
  // Necititele s-au citit: se actualizează bulina din antet, cardul de pe Acasă, blocul din fișă și lista conversațiilor
  actualizeazaBulinaMesaje();
  if (rolUtilizator === 'clienta') actualizeazaCardMesajeAcasa();
  else {
    const client = clientaFisaCurenta(); if (client) randeazaBlocMesaje(client);
    if (!document.getElementById('panouConversatii').classList.contains('auth-hidden')) incarcaConversatii();
  }
}

// Bulina de pe butonul Mesaje din antet: câte mesaje necitite au venit de la celălalt (toți clienții, la antrenor)
async function actualizeazaBulinaMesaje() {
  if (!supabaseClient || !utilizatorCurent) return;
  const { count, error } = await supabaseClient.from('mesaje').select('id', { count: 'exact', head: true }).eq('citit', false).neq('autor', autorulMeu());
  if (error) return;
  document.querySelectorAll('.mesaje-bulina-antet').forEach(b => {
    b.hidden = !count;
    b.textContent = count > 9 ? '9+' : count;
  });
}

// ---- Lista conversațiilor (antrenor): necititele sus, apoi după ultimul mesaj; dedesubt clienții cu cont fără mesaje ----
let conversatiiDoarNecitite = false;
let conversatiiDate = [];

function deschideConversatii() {
  const panou = document.getElementById('panouConversatii');
  panou.classList.remove('auth-hidden');
  panou.scrollTop = 0;
  sincronizeazaIstoricInapoi();
  incarcaConversatii();
}

function inchidePanouConversatii() {
  document.getElementById('panouConversatii').classList.add('auth-hidden');
  selectieMesaj = null;
  anuntMesaj = false;
}

async function incarcaConversatii() {
  const corp = document.getElementById('conversatiiContinut');
  if (!conversatiiDate.length) corp.innerHTML = `<div class="mesaje-gol" style="padding-top:40px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  const { data, error } = await supabaseClient.from('mesaje').select('client_id, autor, text, created_at, citit, tip, context').order('created_at', { ascending: false }).limit(2000);
  if (error) {
    if (selectieMesaj) return; // Mesaj nou rămâne deschis; lista se reîncearcă la următoarea deschidere
    corp.innerHTML = `<div class="mesaje-gol" style="padding-top:40px;">${tr('Mesajele nu s-au putut încărca. Verifică internetul și reîncearcă.', 'Messages could not be loaded. Check your internet and try again.')}</div>`;
    return;
  }
  const peClient = new Map();
  (data || []).forEach(m => {
    if (!peClient.has(m.client_id)) peClient.set(m.client_id, { ultim: m, necitite: 0 });
    if (!m.citit && m.autor !== 'antrenor') peClient.get(m.client_id).necitite++;
  });
  conversatiiDate = (DB.clienti || []).filter(c => c.contConectat || peClient.has(c.id))
    .map(c => ({ client: c, ...(peClient.get(c.id) || { ultim: null, necitite: 0 }) }));
  randeazaConversatii();
}

// ---- Mesaj nou (antrenor): atingerea unui client îi deschide conversația; „Anunț” trimite același mesaj la mai mulți ----
let selectieMesaj = null; // Set cu id-urile clienților aleși, cât timp e deschis Mesaj nou (și lista nu se redesenează peste el)
let anuntMesaj = false; // true în ecranul Anunț (bife + mesaj), false în lista de clienți
// Megafonul de la „Anunț către mai mulți clienți”
const SVG_ANUNT = '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
// Iconița „Mesaj nou” (pătrat cu creion), aceeași ca în antetul listei de conversații
const SVG_MESAJ_NOU = '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>';

function clientiMesajNou() {
  return (DB.clienti || []).filter(c => c.contConectat && !/^(arhivat|archived)$/i.test(c.status || ''))
    .sort((a, b) => a.nume.localeCompare(b.nume));
}

function deschideMesajNou() {
  if (document.getElementById('panouConversatii').classList.contains('auth-hidden')) deschideConversatii();
  const clienti = clientiMesajNou();
  if (!clienti.length) {
    selectieMesaj = null;
    return showToast(tr('Niciun client nu are încă cont în aplicație.', 'No client has an app account yet.'), 'error');
  }
  selectieMesaj = new Set();
  anuntMesaj = false;
  document.getElementById('conversatiiContinut').innerHTML = `<div class="mesaj-nou-antet"><b>${tr('Mesaj nou', 'New message')}</b>
      <button type="button" class="btn btn-clear" onclick="anuleazaMesajNou()">${tr('Renunță', 'Cancel')}</button></div>
    <input type="text" class="form-control" placeholder="${tr('Caută client...', 'Search client...')}" oninput="filtreazaMesajNou(this.value)" style="margin-bottom:8px;">
    <div class="card conversatii-lista">
      <button type="button" class="conversatie-rand" onclick="deschideAnuntMesaj()">
        <span class="conversatie-initiala">${SVG_ANUNT}</span>
        <span class="conversatie-text"><b>${tr('Anunț către mai mulți clienți', 'Message several clients')}</b><small>${tr('Același mesaj, fiecăruia în conversația lui', 'Same message, each in their own conversation')}</small></span>
      </button>
    </div>
    <div class="card conversatii-lista" style="margin-top:10px;">
      ${clienti.map(c => `<button type="button" class="conversatie-rand" data-nume="${escAttr(cheieNume(c.nume))}" onclick="alegeClientMesajNou('${escAttr(c.id)}')">
        <span class="conversatie-initiala">${escAttr((c.nume || '?').trim().charAt(0).toUpperCase())}</span>
        <span class="conversatie-text"><b>${escAttr(c.nume)}</b></span>
      </button>`).join('')}
    </div>`;
  document.getElementById('panouConversatii').scrollTop = 0;
}

// Un singur client: se deschide conversația, unde se vede și ce v-ați scris înainte
function alegeClientMesajNou(id) {
  const c = clientiMesajNou().find(x => x.id === id);
  anuleazaMesajNou();
  if (c) deschideMesaje(c.id, utilizatorCurent.id, c.nume);
}

function deschideAnuntMesaj() {
  const clienti = clientiMesajNou();
  const corp = document.getElementById('conversatiiContinut');
  selectieMesaj = new Set();
  anuntMesaj = true;
  corp.innerHTML = `<div class="mesaj-nou-antet"><b>${tr('Anunț către mai mulți', 'Message several clients')}</b>
      <button type="button" class="btn btn-clear" onclick="deschideMesajNou()">${tr('Înapoi', 'Back')}</button></div>
    <input type="text" class="form-control" placeholder="${tr('Caută client...', 'Search client...')}" oninput="filtreazaMesajNou(this.value)" style="margin-bottom:8px;">
    <div class="card trimite-plan-lista">
      <label class="trimite-plan-rand"><input type="checkbox" id="mesajNouToti" onchange="selecteazaTotiMesajNou(this.checked)">
        <span class="trimite-plan-text"><span class="trimite-plan-nume">${tr('Toți clienții', 'All clients')} (${clienti.length})</span></span></label>
      ${clienti.map(c => `<label class="trimite-plan-rand" data-nume="${escAttr(cheieNume(c.nume))}">
        <input type="checkbox" value="${escAttr(c.id)}" onchange="comutaClientMesajNou(this.value, this.checked)">
        <span class="trimite-plan-text"><span class="trimite-plan-nume">${escAttr(c.nume)}</span></span></label>`).join('')}
    </div>
    <div class="mesaj-nou-scrie">
      <div class="mesaj-nou-info" id="mesajNouInfo">${tr('Alege cui trimiți. Fiecare îl primește în conversația lui.', 'Choose who gets it. Each client receives it in their own conversation.')}</div>
      <form class="mesaje-scrie" onsubmit="event.preventDefault(); trimiteMesajNou();">
        <textarea id="mesajNouText" class="form-control" rows="1" maxlength="2000" placeholder="${tr('Scrie un mesaj...', 'Write a message...')}" oninput="potrivesteCampMesaj(this)"></textarea>
        <button type="submit" class="btn" id="btnTrimiteMesajNou" aria-label="${tr('Trimite', 'Send')}"><svg class="icon-trimite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg></button>
      </form>
    </div>`;
  document.getElementById('panouConversatii').scrollTop = 0;
}

function anuleazaMesajNou() {
  selectieMesaj = null;
  anuntMesaj = false;
  randeazaConversatii();
  document.getElementById('panouConversatii').scrollTop = 0;
}

function filtreazaMesajNou(text) {
  const cauta = cheieNume(text);
  document.querySelectorAll('#conversatiiContinut [data-nume]').forEach(r => { r.hidden = !!cauta && !r.dataset.nume.includes(cauta); });
}

function comutaClientMesajNou(id, ales) {
  if (ales) selectieMesaj.add(id); else selectieMesaj.delete(id);
  actualizeazaInfoMesajNou();
}

function selecteazaTotiMesajNou(ales) {
  document.querySelectorAll('#conversatiiContinut .trimite-plan-rand[data-nume] input').forEach(i => {
    i.checked = ales;
    if (ales) selectieMesaj.add(i.value); else selectieMesaj.delete(i.value);
  });
  actualizeazaInfoMesajNou();
}

function actualizeazaInfoMesajNou() {
  const n = selectieMesaj.size;
  document.getElementById('mesajNouToti').checked = n === clientiMesajNou().length;
  document.getElementById('mesajNouInfo').textContent = n
    ? (n === 1 ? tr('Se trimite la 1 client.', 'Goes to 1 client.') : tr(`Se trimite la ${n} clienți, fiecăruia în conversația lui.`, `Goes to ${n} clients, each in their own conversation.`))
    : tr('Alege cui trimiți. Fiecare îl primește în conversația lui.', 'Choose who gets it. Each client receives it in their own conversation.');
}

async function trimiteMesajNou() {
  const text = document.getElementById('mesajNouText').value.trim();
  const ids = [...(selectieMesaj || [])];
  if (!ids.length) return showToast(tr('Alege cel puțin un client.', 'Choose at least one client.'), 'error');
  if (!text) return;
  const btn = document.getElementById('btnTrimiteMesajNou');
  btn.disabled = true;
  const { error } = await supabaseClient.from('mesaje').insert(ids.map(id => ({ user_id: utilizatorCurent.id, client_id: id, autor: 'antrenor', text })));
  btn.disabled = false;
  if (error) return showToast(tr('Mesajul nu s-a trimis. Verifică internetul și reîncearcă.', 'The message was not sent. Check your internet and try again.'), 'error');
  showToast(ids.length === 1 ? tr('✓ Mesaj trimis', '✓ Message sent') : tr(`✓ Trimis la ${ids.length} clienți`, `✓ Sent to ${ids.length} clients`));
  selectieMesaj = null;
  anuntMesaj = false;
  await incarcaConversatii();
  // La un singur client, conversația se deschide direct
  if (ids.length === 1) {
    const c = (DB.clienti || []).find(x => x.id === ids[0]);
    if (c) deschideMesaje(c.id, utilizatorCurent.id, c.nume);
  }
}

function deschideConversatieDinLista(i) {
  const x = conversatiiDate[i];
  if (x) deschideMesaje(x.client.id, utilizatorCurent.id, x.client.nume);
}

function comutaFiltruConversatii(doarNecitite) {
  conversatiiDoarNecitite = doarNecitite;
  randeazaConversatii();
}

function randeazaConversatii() {
  if (selectieMesaj) return; // cât se scrie un mesaj nou, lista nu se redesenează peste el
  const corp = document.getElementById('conversatiiContinut');
  const cuMesaje = conversatiiDate.filter(x => x.ultim)
    .sort((a, b) => (b.necitite > 0) - (a.necitite > 0) || b.ultim.created_at.localeCompare(a.ultim.created_at));
  const totalNecitite = cuMesaje.filter(x => x.necitite).length;
  const lista = conversatiiDoarNecitite ? cuMesaje.filter(x => x.necitite) : cuMesaje;
  const cand = iso => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { hour: '2-digit', minute: '2-digit' })
      : formatZiLuna(d);
  };
  const rand = x => `<button type="button" class="conversatie-rand${x.necitite ? ' necitita' : ''}" onclick="deschideConversatieDinLista(${conversatiiDate.indexOf(x)})">
      <span class="conversatie-initiala">${escAttr((x.client.nume || '?').trim().charAt(0).toUpperCase())}</span>
      <span class="conversatie-text"><b>${escAttr(x.client.nume)}</b><small>${x.ultim ? escAttr((x.ultim.autor === 'antrenor' ? tr('Tu: ', 'You: ') : '') + textScurtMesaj(x.ultim)) : tr('Scrie primul mesaj', 'Write the first message')}</small></span>
      ${x.ultim ? `<span class="conversatie-meta"><small>${cand(x.ultim.created_at)}</small>${x.necitite ? `<span class="mesaje-bulina">${x.necitite}</span>` : ''}</span>` : ''}
    </button>`;
  let html = `<div class="inscriere-chips conversatii-filtre">
      <button type="button" class="inscriere-chip${conversatiiDoarNecitite ? '' : ' active'}" onclick="comutaFiltruConversatii(false)">${tr('Toate', 'All')}</button>
      <button type="button" class="inscriere-chip${conversatiiDoarNecitite ? ' active' : ''}" onclick="comutaFiltruConversatii(true)">${tr('Necitite', 'Unread')}${totalNecitite ? ` (${totalNecitite})` : ''}</button>
    </div>`;
  // Un client nou se alege din „Mesaj nou” (butonul din antet), nu dintr-o listă cu toți clienții
  if (lista.length) html += `<div class="card conversatii-lista">${lista.map(rand).join('')}</div>`;
  else html += `<div class="mesaje-gol" style="padding:24px 20px;">${conversatiiDoarNecitite ? tr('Niciun mesaj necitit.', 'No unread messages.')
    : tr(`Nicio conversație încă. Apasă ${SVG_MESAJ_NOU} ca să scrii unuia sau mai multor clienți.`, `No conversations yet. Tap ${SVG_MESAJ_NOU} to message one or more clients.`)}</div>`;
  if (!conversatiiDate.length) html += `<div class="mesaje-gol" style="padding:0 20px;">${tr('Mesajele apar pentru clienții care au cont în aplicație.', 'Messages are available for clients with an app account.')}</div>`;
  corp.innerHTML = html;
}

// ---- Răspunsuri rapide (antrenor): o atingere pune textul în câmp; lista se poate modifica (user_metadata.raspunsuri_rapide) ----
const RASPUNSURI_IMPLICITE = [
  ['Bravo! 💪', 'Well done! 💪'],
  ['Ne vedem mâine!', 'See you tomorrow!'],
  ['Cum te simți după antrenament?', 'How do you feel after the workout?'],
  ['Trimite-mi o poză, te rog.', 'Please send me a photo.']
];
let raspunsuriEditare = false;
const raspunsuriRapide = () => (utilizatorCurent && utilizatorCurent.user_metadata && utilizatorCurent.user_metadata.raspunsuri_rapide)
  || RASPUNSURI_IMPLICITE.map(r => tr(...r));

function randeazaRaspunsuriRapide() {
  const el = document.getElementById('raspunsuriRapide');
  el.hidden = rolUtilizator === 'clienta';
  if (el.hidden) return;
  el.innerHTML = raspunsuriRapide().map((r, i) => raspunsuriEditare
    ? `<button type="button" class="raspuns-rapid editare" onclick="stergeRaspunsRapid(${i})">${escAttr(r)} <b>×</b></button>`
    : `<button type="button" class="raspuns-rapid" onclick="folosesteRaspunsRapid(${i})">${escAttr(r)}</button>`).join('')
    + (raspunsuriEditare ? `<button type="button" class="raspuns-rapid adauga" onclick="adaugaRaspunsRapid()">+ ${tr('Adaugă', 'Add')}</button>` : '')
    + `<button type="button" class="raspuns-rapid adauga" onclick="raspunsuriEditare = !raspunsuriEditare; randeazaRaspunsuriRapide()">${raspunsuriEditare ? tr('Gata', 'Done') : tr('Editează', 'Edit')}</button>`;
}

function folosesteRaspunsRapid(i) {
  const camp = document.getElementById('mesajText');
  const text = raspunsuriRapide()[i];
  camp.value = camp.value.trim() ? camp.value.trim() + ' ' + text : text;
  potrivesteCampMesaj(camp);
  camp.focus();
}

async function salveazaRaspunsuriRapide(lista) {
  const { data, error } = await supabaseClient.auth.updateUser({ data: { raspunsuri_rapide: lista } });
  if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul și reîncearcă.', 'Could not save. Check your internet and try again.'), 'error');
  if (data && data.user) utilizatorCurent = data.user;
  randeazaRaspunsuriRapide();
}

function stergeRaspunsRapid(i) {
  salveazaRaspunsuriRapide(raspunsuriRapide().filter((_, j) => j !== i));
}

function adaugaRaspunsRapid() {
  customConfirm(tr('Răspuns rapid nou', 'New quick reply'), tr('Textul apare ca buton deasupra câmpului de scris.', 'The text appears as a button above the message box.'), text => {
    if (text) salveazaRaspunsuriRapide(raspunsuriRapide().concat([text.slice(0, 80)]));
  }, { placeholder: tr('Ex.: Felicitări pentru record!', 'E.g. Congrats on the record!') });
}

// Acasă (client): conversația apare cu ultimul mesaj și bulina de necitite, de îndată ce există un mesaj
async function actualizeazaCardMesajeAcasa() {
  const el = document.getElementById('cardMesajeAcasa');
  if (!el || !dateClienta.fisa) return;
  const r = await rezumatMesaje(dateClienta.fisa.id);
  // Doar la mesaje necitite (altfel conversația e la butonul din antet); dispare după ce le citește
  if (!r || !r.ultim || !r.necitite) { el.innerHTML = ''; return; }
  const prenume = ((dateClienta.contact && dateClienta.contact.nume_antrenor) || '').trim().split(' ')[0];
  el.innerHTML = `<div class="card acasa-sedinta acasa-mesaje" onclick="deschideMesajeClienta()">
      <div><div class="acasa-eticheta">${prenume ? tr(`${escAttr(prenume)} ți-a scris`, `${escAttr(prenume)} wrote to you`) : tr('Mesaj nou', 'New message')} <span class="mesaje-bulina">${r.necitite}</span></div>
      <div class="acasa-mesaje-text necitit">${escAttr(textUltimulMesaj(r))}</div></div>
      <div class="drawer-nav-arrow">›</div>
    </div>`;
}

async function salveazaNotaClient() {
  const client = clientaFisaCurenta();
  if (!client) return;
  const text = document.getElementById('notaClientText').value.trim();
  if (text === (client.notaClient || '')) return showToast(tr('Nota nu s-a schimbat.', 'The note has not changed.'));
  const btn = document.getElementById('btnSalveazaNotaClient');
  btn.disabled = true;
  const la = text ? new Date().toISOString() : null;
  const { error } = await supabaseClient.from('cliente').update({ nota_client: text || null, nota_client_la: la }).eq('id', client.id).eq('user_id', utilizatorCurent.id);
  btn.disabled = false;
  if (error) return showToast(tr('Nu s-a putut salva nota. Verifică internetul și reîncearcă.', 'Could not save the note. Check your internet and try again.'), 'error');
  client.notaClient = text;
  client.notaClientLa = la;
  try { localStorage.setItem('BFIT_DB_LOCAL', JSON.stringify(DB)); } catch (e) {}
  randeazaNotaClient(client);
  showToast(text
    ? (client.contConectat ? tr('✓ Nota a fost salvată. Clientul primește o notificare.', '✓ Note saved. The client gets a notification.') : tr('✓ Nota a fost salvată. Clientul o vede după ce își face cont.', '✓ Note saved. The client sees it once they create an account.'))
    : tr('✓ Nota a fost ștearsă', '✓ Note removed'));
}

// Nota închisă cu × nu mai apare pe acest dispozitiv; o notă nouă (alt text sau altă dată) apare din nou
const cheieNotaAscunsa = () => 'BFIT_NOTA_ASCUNSA_' + (utilizatorCurent ? utilizatorCurent.id : '');
const semnaturaNota = c => (c.nota_client_la || '') + '|' + (c.nota_client || '');

function htmlNotaAntrenor(c) {
  if (!(c.nota_client || '').trim()) return '';
  try { if (localStorage.getItem(cheieNotaAscunsa()) === semnaturaNota(c)) return ''; } catch (e) {}
  // Ca un mesaj: de la cine, când, și răspunsul direct pe WhatsApp (dacă antrenorul și-a pus telefonul în Profil)
  const contact = dateClienta.contact;
  const prenumeAntrenor = ((contact && contact.nume_antrenor) || '').trim().split(' ')[0];
  // Răspunsul în aplicație (mesaje); WhatsApp rămâne alături, pentru cine îl preferă
  let raspuns = `<button type="button" class="btn nota-antrenor-raspuns" onclick="deschideMesajeClienta()">
      <svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg> ${tr('Răspunde', 'Reply')}
    </button>`;
  if (contact && contact.telefon) {
    let cifre = contact.telefon.replace(/[^\d]/g, '');
    if (cifre.startsWith('0')) cifre = '40' + cifre.slice(1);
    raspuns += `<a class="btn nota-antrenor-raspuns nota-antrenor-whatsapp" href="https://wa.me/${cifre}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg> WhatsApp
      </a>`;
  }
  raspuns = `<div class="nota-antrenor-butoane">${raspuns}</div>`;
  return `<div class="card nota-antrenor-card">
      <div class="nota-antrenor-titlu">📌 ${prenumeAntrenor ? tr(`De la ${escAttr(prenumeAntrenor)}`, `From ${escAttr(prenumeAntrenor)}`) : tr('De la antrenor', 'From your trainer')}${c.nota_client_la ? `<small>${formatZiLuna(new Date(c.nota_client_la))}</small>` : ''}</div>
      <div class="nota-antrenor-text">${escAttr(c.nota_client)}</div>
      ${raspuns}
      <button type="button" class="notificare-x nota-antrenor-x" onclick="ascundeNotaAntrenor()" aria-label="${tr('Închide nota', 'Close note')}">×</button>
    </div>`;
}

function ascundeNotaAntrenor() {
  try { localStorage.setItem(cheieNotaAscunsa(), semnaturaNota(dateClienta.fisa || {})); } catch (e) {}
  randeazaHomeClienta();
}

// Întrebările medicale cu „Da” (și sarcină / naștere recentă) din fișa de obiective
const INTREBARI_MEDICALE = ['afectiuni', 'dureri', 'restrictii', 'medicatie'];
const problemeSanatate = r => INTREBARI_MEDICALE.filter(id => r[id] === 'da').concat(r.sarcina === 'da' ? ['sarcina'] : []);

// Sus în fișă: cine e clientul dintr-o privire și, dacă are, ce trebuie știut despre sănătate
function randeazaAntetFisa(client) {
  const r = client.fisaInscriere || {};
  const initiale = client.nume.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  const date = [
    r.varsta ? `${r.varsta} ${tr('ani', 'yrs')}` : '',
    r.inaltime ? `${r.inaltime} cm` : '',
    r.obiectivPrincipal ? textInscriere(OPTIUNI_OBIECTIVE.find(o => o.id === r.obiectivPrincipal) || { ro: r.obiectivPrincipal, en: r.obiectivPrincipal }) : ''
  ].filter(Boolean).join(' · ');
  const probleme = problemeSanatate(r);
  const eticheta = id => textInscriere(ETICHETE_SCURTE_INSCRIERE[id]);
  const banda = probleme.length ? `<div class="fisa-banda-medicala">
      <b>⚠ ${tr('Atenție la sănătate', 'Health notes')}</b>
      ${probleme.map(id => `<span><b>${eticheta(id)}</b>${r[id + 'Detalii'] ? `: ${escAttr(r[id + 'Detalii'])}` : ''}</span>`).join('')}
      ${r.urgenta ? `<span><b>${eticheta('urgenta')}</b>: ${escAttr(r.urgenta)}</span>` : ''}
    </div>` : '';
  document.getElementById('fisaAntetClient').innerHTML = `<div class="fisa-profil">
      <span class="fisa-profil-avatar">${escAttr(initiale)}</span>
      <span class="fisa-profil-text"><b>${escAttr(client.nume)}</b>${date ? `<small>${escAttr(date)}</small>` : ''}</span>
    </div>${banda}`;
}

// ---- Fișa de obiective editabilă (sql/2026-11-07_fisa_obiective_editare.sql): antrenorul din fișă, clientul din Fișa mea ----
// Aceleași întrebări ca la înscriere, toate pe un ecran. Numele, telefonul și emailul nu se schimbă de aici.
// Cine salvează îi trimite celuilalt o notificare cu ce s-a schimbat (vechi → nou).
let editareFisa = null; // { clientId, r }
const CAMPURI_FIXE_FISA = ['nume', 'telefon', 'email'];

function intrebareInscriere(id) {
  for (const s of SECTIUNI_INSCRIERE) { const q = s.intrebari.find(x => x.id === id); if (q) return q; }
  return INTREBARI_VECHI_INSCRIERE.find(x => x.id === id) || null;
}

// Etichete scurte pentru notificarea cu schimbări (restul vin din ETICHETE_SCURTE_INSCRIERE)
const ETICHETE_SCHIMBARI_FISA = {
  varsta: { ro: 'Vârsta', en: 'Age' }, inaltime: { ro: 'Înălțimea', en: 'Height' }, greutate: { ro: 'Greutatea', en: 'Weight' },
  obiectivPrincipal: { ro: 'Obiectivul principal', en: 'Main goal' }, obiective: { ro: 'Alte obiective', en: 'Other goals' },
  greutateTinta: { ro: 'Greutatea țintă', en: 'Target weight' }, somnOre: { ro: 'Ore de somn', en: 'Hours of sleep' },
  somnCalitate: { ro: 'Calitatea somnului', en: 'Sleep quality' }, activitate: { ro: 'Activitatea zilnică', en: 'Daily activity' },
  stilAntrenor: { ro: 'Stilul de antrenor preferat', en: 'Preferred coaching style' }, dataStart: { ro: 'Data de început', en: 'Start date' }
};

function etichetaCampInscriere(id) {
  if (id.endsWith('Detalii')) return `${etichetaCampInscriere(id.slice(0, -7))} (${tr('detalii', 'details')})`;
  const e = ETICHETE_SCHIMBARI_FISA[id] || ETICHETE_SCURTE_INSCRIERE[id] || intrebareInscriere(id);
  return e ? textInscriere(e) : id;
}

function textValoareInscriere(id, v) {
  if (v === null || v === undefined || String(v).trim() === '' || (Array.isArray(v) && !v.length)) return '–';
  const q = id.endsWith('Detalii') ? null : intrebareInscriere(id);
  const optiuni = q && q.tip !== 'scala' && ['alegere', 'multi', 'danu'].includes(q.tip) ? (q.optiuni || OPTIUNI_DA_NU) : null;
  const una = x => { const o = optiuni && optiuni.find(o => o.id === x); return o ? textInscriere(o) : String(x); };
  return Array.isArray(v) ? v.map(una).join(', ') : una(v);
}

// „Greutate: 80 → 78; Obiectiv principal: Slăbire → Tonifiere”, din notificarea fisa_modificata
function textSchimbariFisa(schimbari, nr) {
  const chei = Object.keys(schimbari || {});
  const randuri = chei.slice(0, 4).map(k => `${etichetaCampInscriere(k)}: ${textValoareInscriere(k, schimbari[k][0])} → ${textValoareInscriere(k, schimbari[k][1])}`);
  return randuri.join('; ') + ((nr || chei.length) > randuri.length ? ` ${tr(`și încă ${(nr || chei.length) - randuri.length}`, `and ${(nr || chei.length) - randuri.length} more`)}` : '');
}

function deschideEditorFisa(clientId, fisa) {
  editareFisa = { clientId, r: JSON.parse(JSON.stringify(fisa || {})) };
  randeazaEditorFisa();
  document.getElementById('modalFisaObiectiveBackdrop').style.display = 'flex';
}

function randeazaEditorFisa() {
  const corp = document.getElementById('fisaObiectiveEditor');
  const sus = corp.scrollTop;
  corp.innerHTML = SECTIUNI_INSCRIERE.map(s => {
    const intrebari = s.intrebari.filter(q => !CAMPURI_FIXE_FISA.includes(q.id));
    return intrebari.length ? `<div class="inscriere-sectiune">${escAttr(textInscriere(s))}</div>` + intrebari.map(htmlIntrebareInscriere).join('') : '';
  }).join('');
  corp.scrollTop = sus;
}

function inchideEditorFisa() {
  document.getElementById('modalFisaObiectiveBackdrop').style.display = 'none';
  editareFisa = null;
}

async function salveazaEditorFisa() {
  if (!editareFisa) return;
  const r = editareFisa.r;
  // Cifrele trebuie să fie în limitele întrebării (ca la înscriere); golul e voie
  for (const s of SECTIUNI_INSCRIERE) for (const q of s.intrebari) {
    if (q.tip === 'numar' && String(r[q.id] ?? '').trim() && !numarInInterval(q, r[q.id])) {
      document.getElementById('inscQ_' + q.id)?.scrollIntoView({ block: 'center' });
      return showToast(tr(`${etichetaCampInscriere(q.id)}: între ${q.min} și ${q.max}.`, `${etichetaCampInscriere(q.id)}: between ${q.min} and ${q.max}.`), 'error');
    }
  }
  const btn = document.getElementById('btnSalveazaFisaObiective');
  btn.disabled = true;
  const { data, error } = await supabaseClient.rpc('actualizeaza_fisa_obiective', { p_client_id: editareFisa.clientId, p_fisa: r });
  btn.disabled = false;
  if (error || !data || !data.ok) return showToast(tr('Nu s-a putut salva. Verifică internetul.', 'Could not save. Check your internet.'), 'error');
  if (!data.schimbari) { inchideEditorFisa(); return showToast(tr('Nimic de salvat: fișa e la fel.', 'Nothing to save: the form is unchanged.')); }
  const clientId = editareFisa.clientId;
  inchideEditorFisa();
  if (rolUtilizator === 'clienta') {
    dateClienta.fisa.fisa_inscriere = data.fisa;
    afiseazaFisaMeaClienta();
    showToast(tr('✓ Fișa e actualizată. Antrenorul tău primește o notificare.', '✓ Form updated. Your trainer gets a notification.'));
  } else {
    const c = (DB.clienti || []).find(x => x.id === clientId);
    if (c) c.fisaInscriere = data.fisa;
    try { localStorage.setItem('BFIT_DB_LOCAL', JSON.stringify(DB)); } catch (e) {}
    document.getElementById('detailsFisaInscriere').open = true;
    randeazaFisaInscriereDeschisa();
    showToast(c && c.contConectat ? tr('✓ Fișa e actualizată. Clientul primește o notificare.', '✓ Form updated. The client gets a notification.') : tr('✓ Fișa e actualizată.', '✓ Form updated.'));
  }
}

// „Actualizată de antrenor pe 7 nov.” sub fișă
function htmlModificareFisa(r) {
  if (!r || !r.modificatLa) return '';
  const cine = r.modificatDe === 'antrenor' ? tr('de antrenor', 'by the trainer') : tr('de client', 'by the client');
  return `<div class="fisa-modificata">${tr('Actualizată', 'Updated')} ${cine} ${tr('pe', 'on')} ${formatZiLuna(new Date(r.modificatLa))}</div>`;
}

function htmlRaspunsuriInscriere(r, pentruClienta = false) {
  if (!r) return '';
  const intrebari = {};
  SECTIUNI_INSCRIERE.forEach(s => s.intrebari.forEach(q => { intrebari[q.id] = q; }));
  INTREBARI_VECHI_INSCRIERE.forEach(q => { intrebari[q.id] = q; });
  const areValoare = v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
  // Răspunsurile vechi scrise liber (ex. „Mediu”, „2-3”) nu sunt id-uri de opțiuni: se arată ca atare
  const textOptiune = (id, val) => {
    const o = (intrebari[id].optiuni || OPTIUNI_DA_NU).find(x => x.id === val);
    return o ? textInscriere(o) : val;
  };
  const esteScala = v => /^[1-5]$/.test(String(v || ''));
  const eticheta = id => textInscriere((pentruClienta && ETICHETE_CLIENTA_INSCRIERE[id]) || ETICHETE_SCURTE_INSCRIERE[id] || intrebari[id]);
  const afisate = new Set(['nume', 'telefon', 'email']);
  let html = '';

  // 1. Cifrele
  const metrica = (id, titlu, unitate) => {
    afisate.add(id);
    return `<div class="metric-box"><div class="obiective-metrica-eticheta">${titlu}</div>
      <div class="metric-val">${areValoare(r[id]) ? escAttr(r[id]) : '-'}<small>${unitate}</small></div></div>`;
  };
  html += `<div class="metric-grid obiective-metrici">${metrica('varsta', tr('Vârstă', 'Age'), tr(' ani', ' yrs'))}${metrica('inaltime', tr('Înălțime', 'Height'), ' cm')}${metrica('greutate', tr('Greutate', 'Weight'), ' kg')}</div>`;

  // 2. Sănătatea: alertă roșie dacă a răspuns „Da” la oricare întrebare medicală (sau sarcină / naștere recentă)
  INTREBARI_MEDICALE.concat('sarcina').forEach(id => afisate.add(id));
  const probleme = problemeSanatate(r);
  if (probleme.length) {
    html += `<div class="obiective-alerta">
        <div class="obiective-alerta-titlu">⚠ ${tr('Atenție la sănătate', 'Health notes')}</div>
        ${probleme.map(id => `<div class="obiective-alerta-rand"><b>${escAttr(eticheta(id))}</b>${r[id + 'Detalii'] ? `<span>${escAttr(r[id + 'Detalii'])}</span>` : ''}</div>`).join('')}
      </div>`;
  } else if (['afectiuni', 'dureri', 'restrictii'].every(id => r[id] === 'nu')) {
    html += `<div class="obiective-ok">✓ ${tr('Fără afecțiuni, dureri sau restricții declarate', 'No conditions, pain or restrictions reported')}</div>`;
  }

  // 3. Etichete: obiective, energie și somn, stil, activitate, disponibilitate, angajament
  const grup = (titlu, continut) => continut ? `<div class="obiective-grup"><div class="obiective-grup-titlu">${titlu}</div><div class="obiective-chips">${continut}</div></div>` : '';
  const chip = (text, tip = '') => `<span class="obiective-chip ${tip}">${escAttr(text)}</span>`;
  const lista = v => Array.isArray(v) ? v : [];
  ['obiectivPrincipal', 'obiective', 'greutateTinta', 'stilAntrenor', 'activitate', 'dataStart', 'angajament', 'feedback', 'pozeProgres', 'somnOre'].forEach(id => afisate.add(id));
  if (r.obiectivPrincipal) {
    html += grup(tr('Obiectiv principal', 'Main goal'), chip(textOptiune('obiectivPrincipal', r.obiectivPrincipal)));
    html += grup(tr('Alte obiective', 'Other goals'), lista(r.obiective).map(id => chip(textOptiune('obiective', id))).join(''));
  } else {
    html += grup(tr('Obiective', 'Goals'), lista(r.obiective).map(id => chip(textOptiune('obiective', id))).join(''));
  }
  const tinta = parseFloat(String(r.greutateTinta || '').replace(',', '.'));
  const acum = parseFloat(String(r.greutate || '').replace(',', '.'));
  if (!isNaN(tinta)) {
    const dif = !isNaN(acum) && Math.abs(tinta - acum) >= 0.1 ? ` (${tinta < acum ? '−' : '+'}${formatKg(Math.abs(tinta - acum))} kg)` : '';
    html += grup(tr('Greutate țintă', 'Target weight'), chip(`${formatKg(tinta)} kg${dif}`));
  }
  // Energie și somn pe scala 1–5 (ca la check-in); răspunsurile vechi scrise liber rămân la texte, mai jos
  const energieSomn = [];
  if (esteScala(r.energie)) { afisate.add('energie'); energieSomn.push(chip(`${tr('Energie', 'Energy')} ${r.energie}/5`)); }
  if (r.somnOre) energieSomn.push(chip(`${tr('Somn', 'Sleep')} ${textOptiune('somnOre', r.somnOre)}`));
  if (esteScala(r.somnCalitate)) { afisate.add('somnCalitate'); energieSomn.push(chip(`${tr('Calitate somn', 'Sleep quality')} ${r.somnCalitate}/5`)); }
  html += grup(tr('Energie și somn', 'Energy & sleep'), energieSomn.join(''));
  html += grup(tr('Stil preferat', 'Preferred style'), r.stilAntrenor ? chip(textOptiune('stilAntrenor', r.stilAntrenor)) : '');
  html += grup(tr('Activitate zilnică', 'Daily activity'), r.activitate ? chip(textOptiune('activitate', r.activitate)) : '');
  const dataStart = /^\d{4}-\d{2}-\d{2}$/.test(r.dataStart || '') ? r.dataStart.split('-').reverse().join('.') : r.dataStart;
  html += grup(pentruClienta ? eticheta('dataStart') : tr('Poate începe din', 'Can start from'), dataStart ? chip(dataStart) : '');
  // Disponibilitatea ca etichete doar în formatul nou (butoane); textele vechi rămân mai jos
  const disponibil = [];
  if (intrebari.frecventa.optiuni.some(o => o.id === r.frecventa)) { afisate.add('frecventa'); disponibil.push(chip(`${textOptiune('frecventa', r.frecventa)} ${tr('pe săptămână', 'per week')}`)); }
  if (Array.isArray(r.intervale)) { afisate.add('intervale'); r.intervale.forEach(id => disponibil.push(chip(textOptiune('intervale', id)))); }
  html += grup(tr('Disponibilitate', 'Availability'), disponibil.join(''));
  html += grup(tr('Angajament', 'Commitment'), ['angajament', 'feedback', 'pozeProgres'].filter(id => r[id])
    .map(id => chip(`${r[id] === 'da' ? '✓' : '✕'} ${eticheta(id)}`, r[id] === 'da' ? 'da' : 'nu')).join(''));

  // 4. Textele libere (și orice întrebare nouă care nu e mai sus)
  let randuri = '';
  Object.keys(intrebari).forEach(id => {
    if (afisate.has(id) || !areValoare(r[id])) return;
    const q = intrebari[id];
    const text = q.tip === 'multi' ? (Array.isArray(r[id]) ? r[id].map(v => textOptiune(id, v)).join(', ') : String(r[id]))
      : (q.tip === 'alegere' || q.tip === 'danu') ? textOptiune(id, r[id])
      : q.tip === 'scala' && esteScala(r[id]) ? `${r[id]} / 5` : String(r[id]);
    randuri += `<div class="obiective-grup"><div class="obiective-grup-titlu">${escAttr(eticheta(id))}</div><div class="obiective-text">${escAttr(text)}</div></div>`;
  });
  html += randuri;

  if (r.data) html += `<div class="raspuns-data">${tr('Completată pe', 'Filled in on')} ${escAttr(r.data)}</div>`;
  return html;
}

// ---- Progres: check-in săptămânal (tabelul checkin_saptamanal) și graficul greutății ----
// Punctele graficului: greutatea din formularul de înscriere (start) + greutățile din check-in-uri
function puncteGreutate(fisaInscriere, checkinuri, greutati = []) {
  const puncte = [];
  if (fisaInscriere && parseFloat(fisaInscriere.greutate) && fisaInscriere.trimisLa) {
    puncte.push({ d: new Date(fisaInscriere.trimisLa), kg: parseFloat(fisaInscriere.greutate) });
  }
  // Data reală a salvării (updated_at), nu lunea săptămânii: altfel un check-in din săptămâna formularului ar ieși înaintea startului
  (checkinuri || []).forEach(c => { if (c.greutate != null) puncte.push({ d: new Date(c.updated_at || (c.saptamana + 'T12:00:00')), kg: Number(c.greutate) }); });
  // Cântăririle de la sală (tabelul greutati), adăugate de antrenor
  greutati.forEach(g => puncte.push({ d: new Date(g.data + 'T12:00:00'), kg: Number(g.greutate) }));
  return puncte.sort((a, b) => a.d - b.d);
}

// Obiectivul de greutate: cel setat de antrenor (cliente.obiectiv) sau, până atunci, cel din fișa de obiective
function obiectivClient(obiectiv, fisaInscriere) {
  if (obiectiv && obiectiv.kg) return obiectiv;
  const r = fisaInscriere || {};
  const kg = parseFloat(String(r.greutateTinta || '').replace(',', '.'));
  if (!(kg >= 30)) return null;
  const luni = { '1luna': 1, '3luni': 3, '6luni': 6, '1an': 12 }[r.termen];
  if (!luni || !r.trimisLa) return { kg, data: null };
  const d = new Date(r.trimisLa);
  d.setMonth(d.getMonth() + luni);
  return { kg, data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` };
}

// Bara obiectivului: cât din drumul de la prima greutate până la țintă s-a parcurs
function htmlObiectiv(ob, puncte) {
  if (!ob) return '';
  const termen = ob.data ? ` ${tr('până la', 'by')} ${formatZiLuna(new Date(ob.data + 'T12:00:00'))}` : '';
  let procent = 0, detalii = '';
  if (puncte.length) {
    const start = puncte[0].kg, acum = puncte[puncte.length - 1].kg;
    const atins = start >= ob.kg ? acum <= ob.kg : acum >= ob.kg;
    if (atins) {
      procent = 100;
      detalii = '✓ ' + tr('Obiectiv atins!', 'Goal reached!');
    } else {
      procent = Math.max(0, Math.min(100, Math.round((start - acum) / (start - ob.kg) * 100)));
      detalii = `${tr('Mai ai', 'To go')} ${formatKg(Math.abs(acum - ob.kg))} kg`;
      if (ob.data) {
        const zile = Math.ceil((new Date(ob.data + 'T12:00:00') - new Date()) / 864e5);
        detalii += ' · ' + (zile <= 0 ? tr('termenul a trecut', 'deadline passed')
          : zile >= 14 ? `${Math.round(zile / 7)} ${tr('săptămâni', 'weeks')}`
          : `${zile} ${zile === 1 ? tr('zi', 'day') : tr('zile', 'days')}`);
      }
    }
  }
  return `<div class="obiectiv-progres${procent === 100 ? ' atins' : ''}">
      <div class="obiectiv-sus"><span>${tr('Obiectiv', 'Goal')}: <b>${formatKg(ob.kg)} kg</b>${termen}</span><b>${procent}%</b></div>
      <div class="progress-wrapper"><div class="progress-fill" style="width:${procent}%"></div></div>
      ${detalii ? `<div class="obiectiv-detalii">${detalii}</div>` : ''}
    </div>`;
}

// Doar la antrenor: cântărirea de la sală și obiectivul (kg + termen)
function htmlControaleProgres(ob, greutati) {
  const lista = greutati.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5).map(g => `
    <span class="greutate-sala">${formatZiLuna(new Date(g.data + 'T12:00:00'))}: <b>${formatKg(Number(g.greutate))} kg</b>
      <button type="button" onclick="stergeGreutateSala(${Number(g.id)})" aria-label="${tr('Șterge', 'Delete')}">×</button></span>`).join('');
  return `<div class="progres-controale">
      <div class="progres-control">
        <label for="inputGreutateSala">${tr('Cântărire la sală (azi)', 'Weigh-in at the gym (today)')}</label>
        <div class="progres-control-rand">
          <input type="number" inputmode="decimal" step="0.1" min="30" max="300" id="inputGreutateSala" class="form-control" placeholder="kg">
          <button type="button" class="btn" onclick="adaugaGreutateSala()">${tr('Adaugă', 'Add')}</button>
        </div>
        ${lista ? `<div class="greutati-sala">${lista}</div>` : ''}
      </div>
      <div class="progres-control">
        <label for="inputObiectivKg">${tr('Obiectiv: greutate și termen', 'Goal: weight and deadline')}</label>
        <div class="progres-control-rand">
          <input type="number" inputmode="decimal" step="0.1" min="30" max="300" id="inputObiectivKg" class="form-control obiectiv-kg" placeholder="kg" value="${ob ? ob.kg : ''}">
          <div class="camp-data camp-data-cu-icona">
            <input type="date" id="inputObiectivData" class="form-control" required onclick="deschideCalendarData(this)" value="${ob && ob.data ? ob.data : ''}">
            <span class="camp-data-eticheta">${tr('Termen', 'Deadline')}</span>
            <svg class="camp-data-icona" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
          </div>
          <button type="button" class="btn" onclick="salveazaObiectiv()">${tr('Salvează', 'Save')}</button>
        </div>
      </div>
    </div>`;
}

let greutatiFisa = []; // cântăririle de la sală ale clientului deschis în fișă

async function adaugaGreutateSala() {
  const client = clientaFisaCurenta();
  const kg = parseFloat(String(document.getElementById('inputGreutateSala').value).replace(',', '.'));
  if (!client) return;
  if (!(kg >= 30 && kg <= 300)) return showToast(tr('Scrie greutatea, între 30 și 300 kg.', 'Enter the weight, between 30 and 300 kg.'), 'error');
  const { error } = await supabaseClient.from('greutati').insert([{ client_id: client.id, greutate: Math.round(kg * 10) / 10 }]);
  if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul și reîncearcă.', 'Could not save. Check your internet and try again.'), 'error');
  showToast(tr('✓ Greutate adăugată', '✓ Weight added'));
  incarcaProgresFisa();
}

function stergeGreutateSala(id) {
  customConfirm(tr('Ștergi cântărirea?', 'Delete the weigh-in?'), tr('Dispare din graficul clientului.', 'It disappears from the client’s chart.'), async () => {
    const { error } = await supabaseClient.from('greutati').delete().eq('id', id);
    if (error) return showToast(tr('Nu s-a putut șterge. Reîncearcă.', 'Could not delete. Try again.'), 'error');
    incarcaProgresFisa();
  });
}

async function salveazaObiectiv() {
  const client = clientaFisaCurenta();
  if (!client) return;
  const textKg = document.getElementById('inputObiectivKg').value.trim();
  const kg = parseFloat(textKg.replace(',', '.'));
  const data = document.getElementById('inputObiectivData').value || null;
  if (textKg && !(kg >= 30 && kg <= 300)) return showToast(tr('Greutatea țintă trebuie să fie între 30 și 300 kg.', 'The target weight must be between 30 and 300 kg.'), 'error');
  const obiectiv = textKg ? { kg: Math.round(kg * 10) / 10, data } : null;
  const { error } = await supabaseClient.from('cliente').update({ obiectiv }).eq('id', client.id).eq('user_id', utilizatorCurent.id);
  if (error) return showToast(tr('Nu s-a putut salva. Verifică internetul și reîncearcă.', 'Could not save. Check your internet and try again.'), 'error');
  client.obiectiv = obiectiv;
  try { localStorage.setItem('BFIT_DB_LOCAL', JSON.stringify(DB)); } catch (e) {}
  showToast(obiectiv ? tr('✓ Obiectiv salvat', '✓ Goal saved') : tr('✓ Obiectiv șters', '✓ Goal removed'));
  incarcaProgresFisa();
}

const formatKg = kg => kg.toLocaleString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { maximumFractionDigits: 1 });
const formatZiLuna = d => d.toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO', { day: 'numeric', month: 'short' });

// Grafic cu o singură serie (fără legendă; titlul o numește): linie 2px, puncte cu inel de suprafață,
// etichete doar pe primul și ultimul punct; atingerea unui punct îi arată valoarea dedesubt
// opt (graficul de progres pe exerciții): { unitate, aria, gol } în locul textelor pentru greutatea corporală
function htmlGraficGreutate(puncte, opt = {}) {
  const unitate = opt.unitate ?? 'kg';
  if (puncte.length < 2) {
    return `<div class="progres-gol">${opt.gol || tr('Graficul apare de la a doua greutate înregistrată.', 'The chart appears from the second recorded weight.')}</div>`;
  }
  const L = 320, H = 150, st = 30, dr = 14, sus = 18, jos = 26;
  const kg = puncte.map(p => p.kg);
  let min = Math.min(...kg), max = Math.max(...kg);
  // Interval minim de 2 unități, fără să coboare sub zero (kg / repetări mici la exerciții)
  if (max - min < 2) { min = Math.max(0, min - 1); max = min + Math.max(2, max - min + 1); }
  const t0 = puncte[0].d.getTime(), t1 = puncte[puncte.length - 1].d.getTime();
  const x = d => st + (t1 === t0 ? (L - st - dr) / 2 : (d.getTime() - t0) / (t1 - t0) * (L - st - dr));
  const y = v => sus + (max - v) / (max - min) * (H - sus - jos);
  const linii = [max, (max + min) / 2, min].map(v => `<line x1="${st}" x2="${L - dr}" y1="${y(v)}" y2="${y(v)}" class="grafic-grila"/><text x="${st - 6}" y="${y(v) + 3}" class="grafic-axa" text-anchor="end">${formatKg(Math.round(v * 10) / 10)}</text>`).join('');
  const traseu = puncte.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const cercuri = puncte.map((p, i) => {
    const eticheta = `${formatZiLuna(p.d)}: ${formatKg(p.kg)}${unitate ? ' ' + unitate : ''}`;
    // Valoarea doar pe primul și ultimul punct, aliniată spre interior (nu peste cifrele axei sau peste margine)
    const capat = i === 0 ? 'start' : i === puncte.length - 1 ? 'end' : '';
    return `<g class="grafic-punct" onclick="arataPunctGrafic(this)" data-text="${escAttr(eticheta)}">
        <circle cx="${x(p.d)}" cy="${y(p.kg)}" r="14" class="grafic-tinta"/>
        <circle cx="${x(p.d)}" cy="${y(p.kg)}" r="4.5" class="grafic-marca"/>
        ${capat ? `<text x="${x(p.d) + (capat === 'start' ? -2 : 2)}" y="${y(p.kg) - 9}" class="grafic-valoare" text-anchor="${capat}">${formatKg(p.kg)}</text>` : ''}
        <title>${escAttr(eticheta)}</title>
      </g>`;
  }).join('');
  return `<svg class="grafic-greutate" viewBox="0 0 ${L} ${H}" role="img" aria-label="${escAttr(opt.aria || tr('Greutatea în timp', 'Weight over time'))}">
      ${linii}
      <path d="${traseu}" class="grafic-linie"/>
      ${cercuri}
      <text x="${st}" y="${H - 6}" class="grafic-axa">${formatZiLuna(puncte[0].d)}</text>
      <text x="${L - dr}" y="${H - 6}" class="grafic-axa" text-anchor="end">${formatZiLuna(puncte[puncte.length - 1].d)}</text>
    </svg>
    <div class="grafic-detaliu">${tr('Atinge un punct pentru detalii', 'Tap a point for details')}</div>`;
}

function arataPunctGrafic(el) {
  const svg = el.closest('svg');
  svg.querySelectorAll('.grafic-punct.activ').forEach(p => p.classList.remove('activ'));
  el.classList.add('activ');
  svg.nextElementSibling.textContent = el.getAttribute('data-text');
}

// Greutatea curentă + diferența față de început, graficul și ultimele check-in-uri
// extra: { greutati (cântăriri la sală), obiectiv (cliente.obiectiv), antrenor (arată controalele de editare) }
function htmlProgres(fisaInscriere, checkinuri, extra = {}) {
  const greutati = extra.greutati || [];
  const puncte = puncteGreutate(fisaInscriere, checkinuri, greutati);
  const ob = obiectivClient(extra.obiectiv, fisaInscriere);
  let html = '';
  if (puncte.length) {
    const ultim = puncte[puncte.length - 1].kg, dif = ultim - puncte[0].kg;
    const textDif = puncte.length < 2 || Math.abs(dif) < 0.05 ? tr('fără schimbare', 'no change')
      : `${dif > 0 ? '+' : '−'}${formatKg(Math.abs(dif))} kg ${tr('de la început', 'since the start')}`;
    html += `<div class="progres-erou"><span class="progres-erou-val">${formatKg(ultim)}<small> kg</small></span><span class="progres-erou-dif">${textDif}</span></div>`;
  }
  html += htmlObiectiv(ob, puncte);
  html += htmlGraficGreutate(puncte);
  if (extra.antrenor) html += htmlControaleProgres(ob, greutati);
  const comparatie = htmlComparatiePoze(checkinuri);
  if (comparatie) html += `<div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Poze de progres', 'Progress photos')}</div>${comparatie}`;

  const lista = (checkinuri || []).slice().sort((a, b) => b.saptamana.localeCompare(a.saptamana)).slice(0, 8);
  if (lista.length) {
    const scor = (eticheta, v, max) => (v || v === 0) ? `<span class="checkin-scor"><span>${eticheta}</span><b>${v}</b>/${max}</span>` : '';
    // Formatul nou (răspunsuri ca în formularul Google) sau cel vechi (energie / somn / stare 1–5 + notă)
    const corp = c => {
      const r = c.raspunsuri;
      if (!r) {
        return `<div class="checkin-scoruri">${scor(tr('Energie', 'Energy'), c.energie, 5)}${scor(tr('Somn', 'Sleep'), c.somn, 5)}${scor(tr('Stare', 'Mood'), c.stare, 5)}</div>
          ${c.nota ? `<div class="checkin-nota">${escAttr(c.nota)}</div>` : ''}`;
      }
      const perf = (Array.isArray(r.performanta) ? r.performanta : []).map(id => {
        const o = OPTIUNI_PERFORMANTA.find(x => x.id === id);
        return `<span class="checkin-scor">${escAttr(o ? (id === 'progres' ? tr('↑ Greutăți / repetări', '↑ Weights / reps') : textInscriere(o)) : id)}</span>`;
      }).join('');
      const texte = ['mese', 'victorie', 'provocare', 'intrebari'].filter(id => r[id]).map(id => {
        const q = INTREBARI_CHECKIN.find(x => x.id === id);
        return `<div class="checkin-text"><span>${escAttr(textInscriere(q))}</span><div class="checkin-nota">${escAttr(r[id])}</div></div>`;
      }).join('');
      return `<div class="checkin-scoruri">${scor(tr('Energie', 'Energy'), r.energie, 10)}${scor(tr('Somn', 'Sleep'), r.somn, 10)}${perf}</div>${texte}`;
    };
    // Pozele din R2 ale săptămânii (pozeCurente e încărcat de cel care afișează progresul)
    const butonPoze = s => {
      const n = pozeCurente.lista.filter(p => p.s === s).length;
      return n ? `<button type="button" class="checkin-poze-btn" onclick="deschidePanouPoze('${s}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>${n}</button>` : '';
    };
    html += `<div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Check-in-uri', 'Check-ins')}</div>` + lista.map(c => `
      <div class="checkin-rand">
        <div class="checkin-rand-sus">
          <b>${tr('Săpt.', 'Week of')} ${formatZiLuna(new Date(c.saptamana + 'T12:00:00'))}</b>
          <span class="checkin-rand-dreapta">${butonPoze(c.saptamana)}${c.greutate != null ? `<span>${formatKg(Number(c.greutate))} kg</span>` : ''}</span>
        </div>
        ${corp(c)}
      </div>`).join('');
  }
  return html;
}

function randeazaCereriInscriere() {
  const bloc = document.getElementById('cereriInscriereBloc');
  if (!bloc) return;
  const cereri = DB.cereri || [];
  if (cereri.length === 0) {
    bloc.innerHTML = '';
    return;
  }
  bloc.innerHTML = `<details class="cereri-inscriere" open>
      <summary class="summary-toggle-clean">
        <span class="icon-history-title">
          <svg class="icon-history-svg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
          <span>${tr('Cereri noi de înscriere', 'New sign-up requests')}</span>
          <b class="cereri-numar">${cereri.length}</b>
        </span>
        <span style="font-size: 0.8rem; opacity: 0.6;">▼</span>
      </summary>
      <div class="cereri-nota">${tr('Acceptă cererea când persoana vine la prima ședință. Dacă nu mai vine, șterge cererea.', 'Accept the request when the person comes to the first session. If they don’t come, delete the request.')}</div>
      ${cereri.map((c, i) => `<details class="cerere-item" ontoggle="randeazaCerereDeschisa(this, ${i})">
          <summary><b>${escAttr(c.nume)}</b><small>${escAttr(formateazaDataRoLocal(new Date(c.created_at)))}</small></summary>
          <div class="cerere-corp"></div>
        </details>`).join('')}
    </details>`;
}

function randeazaCerereDeschisa(el, i) {
  const corp = el.querySelector('.cerere-corp');
  const c = (DB.cereri || [])[i];
  if (!el.open || !c) {
    corp.innerHTML = '';
    return;
  }
  const contact = [c.telefon ? `<a href="tel:${escAttr(c.telefon.replace(/\s/g, ''))}">${escAttr(c.telefon)}</a>` : '',
    c.email ? `<a href="mailto:${escAttr(c.email)}">${escAttr(c.email)}</a>` : ''].filter(Boolean).join(' · ');
  corp.innerHTML = `${contact ? `<div class="cerere-contact">${contact}</div>` : ''}
    ${htmlPotrivireCerere(c)}
    ${htmlRaspunsuriInscriere(c.raspunsuri)}
    <div class="inscriere-butoane">
      <button type="button" class="btn btn-clear cerere-refuza" onclick="refuzaCerereInscriere(${i})">${tr('Șterge', 'Delete')}</button>
      <button type="button" class="btn cerere-accepta" onclick="acceptaCerereInscriere(${i}, this)">${tr('Acceptă', 'Accept')}</button>
    </div>`;
}

// Cu cine se leagă o cerere: același telefon, același email sau același nume (cuvintele în orice ordine, fără diacritice).
// Un nume dintr-un singur cuvânt (ex. doar prenumele) nu ajunge pentru potrivire: e prea nesigur.
function gasesteClientPentruCerere(c) {
  const clienti = DB.clienti || [];
  const cifre = s => (s || '').replace(/\D/g, '').slice(-9);
  const tel = cifre(c.telefon);
  if (tel.length === 9) {
    const g = clienti.find(x => cifre(x.telefon) === tel);
    if (g) return { client: g, motiv: tr('același telefon', 'same phone') };
  }
  const email = (c.email || '').trim().toLowerCase();
  if (email) {
    const g = clienti.find(x => (x.emailInvitatie || '').toLowerCase() === email);
    if (g) return { client: g, motiv: tr('același email', 'same email') };
  }
  const cuvinte = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[\s-]+/).filter(Boolean);
  const inclus = (a, b) => a.length >= 2 && a.every(w => b.includes(w));
  const cn = cuvinte(c.nume);
  const potriviri = clienti.filter(x => { const xn = cuvinte(x.nume); return inclus(xn, cn) || inclus(cn, xn); });
  if (potriviri.length === 1) return { client: potriviri[0], motiv: tr('același nume', 'same name') };
  return null;
}

function htmlPotrivireCerere(c) {
  const p = gasesteClientPentruCerere(c);
  return p
    ? `<div class="cerere-potrivire">${tr('Se leagă de', 'Will be linked to')} <b>${escAttr(p.client.nume)}</b> <span>(${p.motiv}${p.client.fisaInscriere ? tr(', are deja fișă de obiective', ', already has a goal-setting form') : ''})</span></div>`
    : `<div class="cerere-potrivire nou">${tr('Client nou: nu se potrivește cu niciun client existent', 'New client: no match with an existing client')}</div>`;
}

function acceptaCerereInscriere(i, btn) {
  const cerere = (DB.cereri || [])[i];
  if (!cerere) return;
  const p = gasesteClientPentruCerere(cerere);
  const trimite = () => {
    btn.disabled = true;
    callBackend("acceptaCerereInscriere", { cerere, clientId: p ? p.client.id : null }, res => {
      if (!res || !res.success) {
        btn.disabled = false;
        showToast(tr('Nu s-a putut accepta cererea.', 'Could not accept the request.'), 'error');
        return;
      }
      showToast(tr(`✓ ${res.nume} e acum în lista de clienți`, `✓ ${res.nume} is now in your client list`));
      incarcaBazaDateSilencios(res.nume);
    }, () => { btn.disabled = false; });
  };
  // Fișa existentă nu se înlocuiește fără întrebare
  if (p && p.client.fisaInscriere) {
    customConfirm(tr('Înlocuiești fișa de obiective?', 'Replace the goal-setting form?'),
      tr(`${p.client.nume} are deja o fișă de obiective (completată pe ${p.client.fisaInscriere.data || '-'}). O înlocuiești cu răspunsurile noi?`,
        `${p.client.nume} already has a goal-setting form (filled in on ${p.client.fisaInscriere.data || '-'}). Replace it with the new answers?`), trimite);
    return;
  }
  trimite();
}

function refuzaCerereInscriere(i) {
  const cerere = (DB.cereri || [])[i];
  if (!cerere) return;
  customConfirm(tr('Ștergi cererea?', 'Delete the request?'),
    tr(`Răspunsurile de la ${cerere.nume} se șterg definitiv.`, `The answers from ${cerere.nume} will be deleted permanently.`), () => {
      callBackend("refuzaCerereInscriere", { id: cerere.id }, res => {
        if (!res || !res.success) {
          showToast(tr('Nu s-a putut șterge cererea.', 'Could not delete the request.'), 'error');
          return;
        }
        DB.cereri = (DB.cereri || []).filter(c => c.id !== cerere.id);
        try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
        randeazaCereriInscriere();
        showToast(tr('Cerere ștearsă', 'Request deleted'));
      });
    });
}

function clientaFisaCurenta() {
  const nume = (document.getElementById('selectClientaFisa')?.value || '').trim().toLowerCase();
  return (DB.clienti || []).find(c => c && c.nume.toLowerCase() === nume);
}

// ---- Link personal de check-in (fără cont): antrenorul îl trimite clientului, de ex. pe WhatsApp ----
async function trimiteLinkCheckin(nou) {
  const client = clientaFisaCurenta();
  if (!client) return;
  const genereaza = async () => {
    const { data: cod, error } = await supabaseClient.rpc('genereaza_link_checkin', { p_client_id: client.id, p_nou: nou });
    if (error || !cod) {
      showToast(tr('Nu s-a putut crea link-ul.', 'Could not create the link.'), 'error');
      return;
    }
    client.checkinToken = cod;
    partajeaza(tr(`Bună, ${client.nume.split(' ')[0]}! Check-in-ul tău săptămânal:`, `Hi ${client.nume.split(' ')[0]}! Your weekly check-in:`),
      `${URL_APLICATIE}?checkin=${cod}`);
    if (nou) showToast(tr('✓ Link nou creat. Cel vechi nu mai merge.', '✓ New link created. The old one no longer works.'));
  };
  if (nou) {
    customConfirm(tr('Link nou de check-in?', 'New check-in link?'),
      tr(`Link-ul trimis până acum lui ${client.nume} nu va mai funcționa. Continui?`, `The link sent so far to ${client.nume} will stop working. Continue?`), genereaza);
    return;
  }
  genereaza();
}

function copiazaText(text) {
  navigator.clipboard.writeText(text).then(() => showToast(tr('✓ Link copiat', '✓ Link copied')));
}

// Partajare prin meniul nativ al telefonului (WhatsApp, SMS, email...); pe calculator, copiere
function partajeaza(text, url) {
  if (navigator.share) {
    navigator.share({ title: 'B-Fit', text, url }).catch(e => { if (e.name !== 'AbortError') copiazaText(url ? `${text} ${url}` : text); });
  } else {
    copiazaText(url ? `${text} ${url}` : text);
  }
}

// ---- Cod QR pentru link-uri: clientul scanează de pe ecranul antrenorului, la sală, fără să primească link-ul pe mesaj ----
// Generatorul (qrcode-generator, ~20 KB) se încarcă doar la primul cod afișat
let qrCurent = null;

async function arataQr(url, titlu, eticheta, numeFisier) {
  try {
    if (!window.qrcode) await incarcaScriptVerificat('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1');
  } catch (e) {
    showToast(tr('Nu s-a putut genera codul QR. Verifică conexiunea la internet.', 'Could not create the QR code. Check your internet connection.'), 'error');
    return;
  }
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  // Desenat pe canvas cu margine albă (zona liniștită cerută de scanere) și eticheta dedesubt, pentru imaginea salvată
  const n = qr.getModuleCount();
  const cel = Math.max(4, Math.floor(640 / (n + 8)));
  const latura = cel * (n + 8);
  const canvas = document.getElementById('qrCanvas');
  canvas.width = latura;
  canvas.height = latura + cel * 4;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + 4) * cel, (r + 4) * cel, cel, cel);
  ctx.fillStyle = '#1e293b';
  ctx.font = `700 ${Math.round(latura / 22)}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(eticheta, latura / 2, latura + cel, latura - cel * 4);
  qrCurent = { titlu, numeFisier };
  document.getElementById('qrModalTitlu').textContent = titlu;
  document.getElementById('modalQrBackdrop').style.display = 'flex';
}

function inchideModalQr() {
  document.getElementById('modalQrBackdrop').style.display = 'none';
}

// Pe telefon: meniul nativ (Salvează în galerie, WhatsApp...); pe calculator: descărcare PNG
function salveazaImagineQr() {
  if (!qrCurent) return;
  document.getElementById('qrCanvas').toBlob(async blob => {
    const fisier = new File([blob], qrCurent.numeFisier, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [fisier] })) {
      try { await navigator.share({ files: [fisier], title: qrCurent.titlu }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(fisier);
    const a = document.createElement('a');
    a.href = url;
    a.download = qrCurent.numeFisier;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

function arataQrInscriere() {
  if (!codInscriereAntrenor) return;
  arataQr(linkInscriere(codInscriereAntrenor), tr('Link de înscriere', 'Sign-up link'),
    tr('Scanează și completează fișa de înscriere', 'Scan to fill in the sign-up form'), 'B-Fit QR inscriere.png');
}

async function arataQrCheckin() {
  const client = clientaFisaCurenta();
  if (!client) return;
  if (!client.checkinToken) {
    const { data: cod, error } = await supabaseClient.rpc('genereaza_link_checkin', { p_client_id: client.id, p_nou: false });
    if (error || !cod) return showToast(tr('Nu s-a putut crea link-ul.', 'Could not create the link.'), 'error');
    client.checkinToken = cod;
  }
  arataQr(`${URL_APLICATIE}?checkin=${client.checkinToken}`, tr('Check-in', 'Check-in'),
    `Check-in · ${client.nume}`, `B-Fit QR check-in ${client.nume}.png`.replace(/[\\/:*?"<>|]/g, ''));
}

// ---- Notificări (tabelul notificari): clopoțelul din antet, panoul, actualizare pe loc prin Realtime ----
// Baza salvează doar tipul și datele; textul se compune aici, în limba aleasă.
let notificari = [];
let canalNotificari = null;

async function incarcaNotificari() {
  if (!supabaseClient || !utilizatorCurent) return;
  const { data, error } = await supabaseClient.from('notificari').select('*')
    .eq('user_id', utilizatorCurent.id).eq('ascuns', false).order('created_at', { ascending: false }).limit(60);
  if (error) return;
  notificari = data || [];
  actualizeazaBulinaNotificari();
  actualizeazaBulinaMesaje();
  if (!canalNotificari) {
    canalNotificari = supabaseClient.channel('notificari-' + utilizatorCurent.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificari', filter: `user_id=eq.${utilizatorCurent.id}` }, payload => {
        notificari.unshift(payload.new);
        actualizeazaBulinaNotificari();
        if (!document.getElementById('panouNotificari').classList.contains('auth-hidden')) randeazaNotificari();
        // Mesaj nou: conversația deschisă se completează pe loc; altfel se actualizează cardul / blocul cu necitite
        if (payload.new.tip === 'mesaj_nou') {
          const d = payload.new.date || {};
          actualizeazaBulinaMesaje();
          if (!document.getElementById('panouConversatii').classList.contains('auth-hidden')) incarcaConversatii();
          if (conversatie && (rolUtilizator === 'clienta' || d.client_id === conversatie.clientId)) incarcaConversatie();
          else if (rolUtilizator !== 'clienta') { const client = clientaFisaCurenta(); if (client && client.id === d.client_id) randeazaBlocMesaje(client); }
        }
        // Plan nou, notă, abonament: clientul vede imediat și conținutul, nu doar notificarea
        reincarcaDateClienta();
      })
      .subscribe();
  }
  sincronizeazaPush();
  // Atingerea unei notificări push deschide aplicația cu ?notificari=1
  if (new URLSearchParams(location.search).has('notificari')) {
    history.replaceState(null, '', location.pathname);
    deschidePanouNotificari();
  }
}

// ---- Notificări push: ajung pe telefon și cu aplicația închisă (push.sql + ruta /push din Worker) ----
const VAPID_PUBLIC = "BErZykGaO-_GR1wm9lX6N0Z9JJgq7YfRoruooR0vh_U8JF6ntU99v0h3PQKWzdELKGDPLNu8jXyWo75GJFEk_Uc";
const suportaPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function abonamentPushCurent() {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

async function salveazaAbonamentPush(abonament) {
  const j = abonament.toJSON();
  const { data, error } = await supabaseClient.rpc('salveaza_abonament_push', {
    p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_limba: currentLang
  });
  return !error && data === 'ok';
}

// La fiecare deschidere, abonamentul existent se leagă din nou de contul logat și de limba curentă
async function sincronizeazaPush() {
  if (!suportaPush() || Notification.permission !== 'granted') return;
  const abonament = await abonamentPushCurent().catch(() => null);
  if (abonament) salveazaAbonamentPush(abonament);
}

async function activeazaPush() {
  if (!suportaPush()) return;
  const permisiune = await Notification.requestPermission();
  if (permisiune === 'granted') {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error('fara service worker');
      const cheie = Uint8Array.from(atob(VAPID_PUBLIC.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const abonament = await reg.pushManager.getSubscription()
        || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cheie });
      if (!(await salveazaAbonamentPush(abonament))) throw new Error('salvare');
      showToast(tr('✓ Notificările sunt pornite pe acest dispozitiv', '✓ Notifications are on for this device'));
      actualizeazaCardPushAcasa();
    } catch (e) {
      showToast(tr('Nu s-au putut porni notificările. Reîncearcă.', 'Could not turn on notifications. Try again.'), 'error');
    }
  }
  randeazaNotificari();
}

// La deconectare telefonul nu mai primește notificările contului
async function dezaboneazaPush() {
  if (!suportaPush()) return;
  try {
    const abonament = await abonamentPushCurent();
    if (!abonament) return;
    await supabaseClient.rpc('sterge_abonament_push', { p_endpoint: abonament.endpoint });
    await abonament.unsubscribe();
  } catch (e) { /* deconectarea merge oricum */ }
}

function htmlCardPush() {
  const esteIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalata = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let text = '', buton = '';
  // Mesajul „blocate” închis cu ×: nu mai apare pe acest dispozitiv cât notificările rămân blocate
  const blocate = suportaPush() && Notification.permission === 'denied';
  try {
    if (!blocate) localStorage.removeItem('BFIT_PUSH_BLOCAT_ASCUNS');
    else if (localStorage.getItem('BFIT_PUSH_BLOCAT_ASCUNS')) return '';
  } catch (e) {}
  if (!suportaPush()) {
    if (!esteIos || instalata) return '';
    text = tr('Pe iPhone, notificările ajung doar dacă adaugi aplicația pe ecranul principal: Partajează › „Adaugă pe ecranul principal”.', 'On iPhone, notifications only arrive if you add the app to your home screen: Share › “Add to Home Screen”.');
  } else if (Notification.permission === 'default') {
    text = tr('Primește notificările pe acest dispozitiv, chiar și cu aplicația închisă.', 'Get notifications on this device, even with the app closed.');
    buton = `<button type="button" class="btn" onclick="activeazaPush()">${tr('Pornește', 'Turn on')}</button>`;
  } else if (Notification.permission === 'denied') {
    text = tr('Notificările sunt blocate pentru B-Fit. Le poți porni din setările browserului sau ale telefonului.', 'Notifications are blocked for B-Fit. You can turn them on in your browser or phone settings.');
    buton = `<button type="button" class="notificare-x card-push-x" onclick="ascundeMesajPushBlocat()" aria-label="${tr('Închide', 'Close')}">×</button>`;
  } else {
    return '';
  }
  return `<div class="card card-push${blocate ? ' card-push-blocat' : ''}"><span>${text}</span>${buton}</div>`;
}

// Setări › Notificări: starea pe acest telefon și pornirea / oprirea lor (și după ce cardul de la clopoțel a fost închis)
async function stareNotificari() {
  if (!suportaPush()) return 'nesuportat';
  if (Notification.permission === 'denied') return 'blocate';
  if (Notification.permission !== 'granted') return 'oprite';
  return (await abonamentPushCurent().catch(() => null)) ? 'pornite' : 'oprite';
}

async function actualizeazaRezumatNotificari() {
  const el = document.getElementById('setariRezumatNotificari');
  if (!el) return;
  const stare = await stareNotificari();
  el.textContent = { pornite: tr('Pornite pe acest dispozitiv', 'On for this device'), oprite: tr('Oprite pe acest dispozitiv', 'Off for this device'),
    blocate: tr('Blocate din setări', 'Blocked in settings'), nesuportat: tr('Indisponibile aici', 'Not available here') }[stare];
}

async function comutaNotificariSetari() {
  const stare = await stareNotificari();
  if (stare === 'oprite') {
    await activeazaPush();
  } else if (stare === 'pornite') {
    customConfirm(tr('Oprești notificările?', 'Turn off notifications?'), tr('Pe acest dispozitiv nu mai primești notificări. Le poți porni oricând de aici.', 'This device will stop getting notifications. You can turn them back on here anytime.'), async () => {
      await dezaboneazaPush();
      actualizeazaCardPushAcasa();
      showToast(tr('✓ Notificările sunt oprite pe acest dispozitiv', '✓ Notifications are off for this device'));
      actualizeazaRezumatNotificari();
      randeazaSetariNotificari();
    });
  } else if (stare === 'blocate') {
    showToast(tr('Notificările sunt blocate pentru B-Fit. Le poți porni din setările browserului sau ale telefonului.', 'Notifications are blocked for B-Fit. You can turn them on in your browser or phone settings.'), 'error');
  } else {
    const esteIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    showToast(esteIos
      ? tr('Pe iPhone, notificările merg doar dacă adaugi aplicația pe ecranul principal: Partajează › „Adaugă pe ecranul principal”.', 'On iPhone, notifications only work if you add the app to your home screen: Share › “Add to Home Screen”.')
      : tr('Browserul acesta nu suportă notificări.', 'This browser does not support notifications.'), 'error');
  }
  actualizeazaRezumatNotificari();
  randeazaSetariNotificari();
}

// Ce notificări pleacă pe telefon, pe tipuri (rândurile cu mai multe tipuri se comută împreună).
// Tipurile oprite stau în contul utilizatorului (user_metadata.notificari_oprite); trigger-ul trimite_push le sare,
// dar notificarea rămâne la clopoțel.
const TIPURI_NOTIFICARI = {
  clienta: [
    [['programare_maine'], ['Antrenament mâine', 'Workout tomorrow'], ['Seara dinainte de ședință', 'The evening before a session']],
    [['loc_liber'], ['Loc liber', 'Spot available'], ['Când se eliberează o oră', 'When an hour opens up']],
    [['plan_nou'], ['Plan nou', 'New plan'], ['Când primești un plan de antrenament', 'When you get a workout plan']],
    [['mesaj_nou'], ['Mesaje', 'Messages'], ['Când antrenorul îți scrie', 'When your trainer writes to you']],
    [['nota_noua'], ['Notă de la antrenor', 'Note from your trainer'], ['Când antrenorul îți schimbă nota', 'When your trainer updates your note']],
    [['checkin_memento'], ['Check-in săptămânal', 'Weekly check-in'], ['Memento dacă nu l-ai trimis', 'Reminder if you haven’t sent it']],
    [['obiectiv_saptamana', 'serie_pericol'], ['Obiective și serie', 'Goals and streak'], ['Joi, dacă ești în urmă; duminică, dacă seria e în pericol', 'Thursday if you’re behind; Sunday if your streak is at risk']],
    [['fisa_modificata'], ['Fișa de obiective', 'Goal-setting form'], ['Când antrenorul îți modifică fișa', 'When your trainer changes your form']],
    [['programari_saptamana'], ['Programările săptămânii', 'This week’s bookings'], ['Luni și miercuri seara, dacă nu ți-ai programat toate ședințele', 'Monday and Wednesday evening if you haven’t booked all your sessions']],
    [['masa_nenotata'], ['Nutriție', 'Nutrition'], ['La 13 și la 20, dacă n-ai notat mesele (doar când folosești jurnalul)', 'At 1 pm and 8 pm if you haven’t logged your meals (only when you use the log)']],
    [['abonament_expira', 'sedinte_putine'], ['Abonament', 'Subscription'], ['Când expiră sau mai ai puține ședințe', 'When it ends or few sessions are left']]
  ],
  antrenor: [
    [['mesaj_nou'], ['Mesaje', 'Messages'], ['Când un client îți scrie', 'When a client writes to you']],
    [['rezervare', 'anulare'], ['Rezervări și anulări', 'Bookings and cancellations'], ['Când un client rezervă sau anulează', 'When a client books or cancels']],
    [['checkin_nou'], ['Check-in nou', 'New check-in'], ['Când un client trimite check-in-ul', 'When a client sends a check-in']],
    [['fisa_modificata'], ['Fișe de obiective', 'Goal-setting forms'], ['Când un client își modifică fișa', 'When a client changes their form']],
    [['programari_lipsa'], ['Clienți neprogramați', 'Clients not booked'], ['Marți și joi dimineața: cine nu și-a programat ședințele săptămânii', 'Tuesday and Thursday morning: who hasn’t booked this week’s sessions']],
    [['lipsa_checkin'], ['Check-in-uri lipsă', 'Missing check-ins'], ['Clienții care n-au trimis check-in-ul', 'Clients who didn’t send the check-in']],
    [['cerere_noua'], ['Cereri de înscriere', 'Sign-up requests'], ['Când cineva completează fișa', 'When someone fills in the form']],
    [['abonamente_expira'], ['Abonamente care expiră', 'Subscriptions ending'], ['Abonamentele care se termină în curând', 'Subscriptions ending soon']]
  ]
};

const notificariOprite = () => (utilizatorCurent && utilizatorCurent.user_metadata && utilizatorCurent.user_metadata.notificari_oprite) || [];

async function randeazaSetariNotificari() {
  const corp = document.getElementById('setariNotificariContinut');
  if (!corp) return;
  const stare = await stareNotificari();
  const textStare = {
    pornite: tr('Pornite pe acest dispozitiv.', 'On for this device.'),
    oprite: tr('Oprite pe acest dispozitiv. Pornește-le ca să afli la timp de programări și mesaje, chiar și cu aplicația închisă.', 'Off for this device. Turn them on to hear about bookings and messages in time, even with the app closed.'),
    blocate: tr('Blocate pentru B-Fit. Le poți porni din setările browserului sau ale telefonului.', 'Blocked for B-Fit. You can turn them on in your browser or phone settings.'),
    nesuportat: tr('Pe acest dispozitiv notificările nu sunt disponibile. Pe iPhone, adaugă aplicația pe ecranul principal: Partajează › „Adaugă pe ecranul principal”.', 'Notifications aren’t available on this device. On iPhone, add the app to your home screen: Share › “Add to Home Screen”.')
  }[stare];
  const buton = stare === 'oprite' ? `<button type="button" class="btn" onclick="comutaNotificariSetari()">${tr('Pornește', 'Turn on')}</button>`
    : stare === 'pornite' ? `<button type="button" class="btn btn-clear" onclick="comutaNotificariSetari()">${tr('Oprește', 'Turn off')}</button>` : '';
  const oprite = notificariOprite();
  const randuri = (TIPURI_NOTIFICARI[rolUtilizator === 'clienta' ? 'clienta' : 'antrenor']).map(([tipuri, titlu, desc]) => `
    <label class="setare-notificare">
      <span><b>${tr(...titlu)}</b><small>${tr(...desc)}</small></span>
      <input type="checkbox" class="comutator" ${tipuri.some(x => oprite.includes(x)) ? '' : 'checked'} onchange="seteazaTipNotificare('${tipuri.join(',')}', this.checked, this)">
    </label>`).join('');
  corp.innerHTML = `<div class="drawer-section">
      <div class="card card-push"><span>${textStare}</span>${buton}</div>
    </div>
    <div class="drawer-section" style="margin-top:14px;">
      <div class="drawer-section-title">${tr('Notificări push', 'Push notifications')}</div>
      <div class="card setari-notificari-lista">${randuri}</div>
      <div style="font-size:0.72rem; color:var(--text-muted); margin-top:6px; line-height:1.4;">${tr('Cele oprite nu te mai anunță, dar le găsești în continuare la clopoțel.', 'The ones turned off won’t alert you, but you’ll still find them under the bell.')}</div>
    </div>`;
}

async function seteazaTipNotificare(tipuri, pornit, input) {
  const lista = tipuri.split(',');
  const oprite = notificariOprite().filter(x => !lista.includes(x)).concat(pornit ? [] : lista);
  input.disabled = true;
  const { data, error } = await supabaseClient.auth.updateUser({ data: { notificari_oprite: oprite } });
  input.disabled = false;
  if (error) {
    input.checked = !pornit;
    return showToast(tr('Nu s-a putut salva. Verifică internetul și reîncearcă.', 'Could not save. Check your internet and try again.'), 'error');
  }
  if (data && data.user) utilizatorCurent = data.user;
}

function ascundeMesajPushBlocat() {
  try { localStorage.setItem('BFIT_PUSH_BLOCAT_ASCUNS', '1'); } catch (e) {}
  randeazaNotificari();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.tip === 'deschide-notificari' && utilizatorCurent) deschidePanouNotificari();
  });
}

function actualizeazaBulinaNotificari() {
  const necitite = notificari.filter(n => !n.citit).length;
  document.querySelectorAll('.notificari-bulina').forEach(b => {
    b.hidden = necitite === 0;
    b.textContent = necitite > 9 ? '9+' : necitite;
  });
  // Bulina de pe iconița aplicației (Android) stă cât timp notificarea push e în bara telefonului:
  // fără nimic necitit în aplicație, le închidem și pe acelea
  if (necitite === 0 && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration()
      .then(reg => reg ? reg.getNotifications() : [])
      .then(lista => lista.forEach(n => n.close()))
      .catch(() => {});
  }
}

function textNotificare(n) {
  const d = n.date || {};
  const zi = d.zi ? formatZiLuna(new Date(d.zi + 'T12:00:00')) : '';
  const plural = (nr, unu, multe) => nr === 1 ? unu : multe;
  // `nume` e text la notificările despre un client și listă la „abonamente care expiră”
  const listaNume = Array.isArray(d.nume) ? d.nume.join(', ') : '';
  const t = {
    cerere_noua: [tr('Cerere nouă de înscriere', 'New sign-up request'), tr(`${d.nume || ''} a completat fișa de obiective.`, `${d.nume || ''} filled in the goal-setting form.`)],
    checkin_nou: [tr('Check-in nou', 'New check-in'), tr(`${d.nume || ''} a trimis check-in-ul săptămânal.`, `${d.nume || ''} sent the weekly check-in.`)],
    rezervare: [tr('Rezervare nouă', 'New booking'), tr(`${d.nume || ''} a rezervat ${zi}, ora ${d.ora || ''}.`, `${d.nume || ''} booked ${zi} at ${d.ora || ''}.`)],
    anulare: [tr('Rezervare anulată', 'Booking cancelled'), tr(`${d.nume || ''} a anulat ${zi}, ora ${d.ora || ''}.`, `${d.nume || ''} cancelled ${zi} at ${d.ora || ''}.`)],
    lipsa_checkin: [tr('Check-in-uri lipsă', 'Missing check-ins'), tr(`${d.nr} ${plural(d.nr, 'client n-a', 'clienți n-au')} trimis check-in-ul săptămânii trecute. Trimite-le un memento.`, `${d.nr} ${plural(d.nr, 'client', 'clients')} didn’t send last week’s check-in. Send them a reminder.`)],
    abonamente_expira: [tr('Abonamente care expiră', 'Subscriptions ending'), tr(`${d.nr} ${plural(d.nr, 'abonament expiră', 'abonamente expiră')} săptămâna asta: ${listaNume}${d.nr > 3 ? '…' : ''}`, `${d.nr} ${plural(d.nr, 'subscription ends', 'subscriptions end')} this week: ${listaNume}${d.nr > 3 ? '…' : ''}`)],
    plan_nou: [tr('Plan nou de antrenament', 'New workout plan'), tr(`Antrenorul ți-a trimis „${d.titlu || ''}”.`, `Your trainer sent you “${d.titlu || ''}”.`)],
    checkin_memento: [tr('Check-in săptămânal', 'Weekly check-in'), tr('E timpul pentru check-in-ul săptămânal. Durează un minut.', 'Time for your weekly check-in. It takes a minute.')],
    abonament_expira: d.zile === 1
      ? [tr('Abonamentul expiră mâine', 'Subscription ends tomorrow'), tr('Vorbește cu antrenorul despre reînnoire.', 'Talk to your trainer about renewing.')]
      : [tr('Abonamentul expiră curând', 'Subscription ending soon'), tr(`Abonamentul tău expiră pe ${d.data || ''}.`, `Your subscription ends on ${d.data || ''}.`)],
    sedinte_putine: [tr(`Mai ai ${d.ramase} ședințe`, `${d.ramase} sessions left`), tr('Vorbește cu antrenorul despre reînnoire.', 'Talk to your trainer about renewing.')],
    programare_maine: [tr('Antrenament mâine', 'Workout tomorrow'), tr(`Mâine la ${d.ora || ''} ai antrenament.`, `You have a workout tomorrow at ${d.ora || ''}.`)],
    loc_liber: [tr('Loc liber', 'Spot available'), tr(`S-a eliberat un loc ${zi}, ora ${d.ora || ''}. Rezervă din aplicație.`, `A spot opened up on ${zi} at ${d.ora || ''}. Book it in the app.`)],
    nota_noua: [tr('Notă nouă de la antrenor', 'New note from your trainer'), tr('Antrenorul ți-a lăsat o notă în aplicație.', 'Your trainer left you a note in the app.')],
    mesaj_nou: [d.nume ? tr(`Mesaj de la ${d.nume}`, `Message from ${d.nume}`) : tr('Mesaj nou de la antrenor', 'New message from your trainer'), d.text || ''],
    obiectiv_saptamana: [tr('Obiectivul săptămânii', 'This week’s goal'), d.ramase === 1
      ? tr(`Mai ai 1 antrenament până la obiectivul săptămânii (${d.facute} din ${d.tinta}).`, `1 more workout to reach this week’s goal (${d.facute} of ${d.tinta}).`)
      : tr(`Mai ai ${d.ramase} antrenamente până la obiectivul săptămânii (${d.facute} din ${d.tinta}).`, `${d.ramase} more workouts to reach this week’s goal (${d.facute} of ${d.tinta}).`)],
    serie_pericol: [tr('Seria ta e în pericol', 'Your streak is at risk'), tr(`Seria ta de ${d.serie} săptămâni se încheie azi. Un antrenament scurt o păstrează.`, `Your ${d.serie}-week streak ends today. A short workout keeps it going.`)],
    masa_nenotata: d.masa === 'cina' ? [tr('Notează cina', 'Log your dinner'), tr('Câteva secunde și ziua e completă: scanezi sau alegi din favorite.', 'A few seconds and your day is complete: scan or pick from favourites.')]
      : [tr('Ce ai mâncat azi?', 'What did you eat today?'), tr('Notează micul dejun și prânzul, cât le ții minte.', 'Log breakfast and lunch while you remember them.')],
    programari_saptamana: [tr('Programează-ți ședințele', 'Book your sessions'), tr(`Săptămâna asta ai programate ${d.facute} din ${d.tinta} ședințe. Alege-ți ${d.tinta - d.facute === 1 ? 'ora' : 'orele'} din aplicație.`, `This week you have ${d.facute} of ${d.tinta} sessions booked. Pick your ${d.tinta - d.facute === 1 ? 'time' : 'times'} in the app.`)],
    programari_lipsa: [tr('Clienți neprogramați', 'Clients not booked'), tr(`${d.nr} ${plural(d.nr, 'client nu și-a', 'clienți nu și-au')} programat toate ședințele săptămânii: ${listaNume}${d.nr > 3 ? '…' : ''}`, `${d.nr} ${plural(d.nr, 'client hasn’t', 'clients haven’t')} booked all of this week’s sessions: ${listaNume}${d.nr > 3 ? '…' : ''}`)],
    fisa_modificata: [d.de === 'client' ? tr(`${d.nume || 'Clientul'} și-a actualizat fișa de obiective`, `${d.nume || 'The client'} updated their goal-setting form`) : tr('Antrenorul ți-a actualizat fișa de obiective', 'Your trainer updated your goal-setting form'),
      textSchimbariFisa(d.schimbari, d.nr)],
  }[n.tip];
  return t || [tr('Notificare', 'Notification'), ''];
}

function cand(dataIso) {
  const min = Math.round((Date.now() - new Date(dataIso)) / 60000);
  if (min < 1) return tr('acum', 'now');
  if (min < 60) return tr(`acum ${min} min`, `${min} min ago`);
  const ore = Math.round(min / 60);
  if (ore < 24) return tr(`acum ${ore} h`, `${ore} h ago`);
  return formatZiLuna(new Date(dataIso));
}

async function deschidePanouNotificari() {
  document.getElementById('panouNotificari').classList.remove('auth-hidden');
  sincronizeazaIstoricInapoi(); // se deschide și din notificarea push, fără click în aplicație
  randeazaNotificari();
  // Deschiderea panoului le marchează pe toate ca citite (bulina dispare)
  const necitite = notificari.filter(n => !n.citit).map(n => n.id);
  if (necitite.length) {
    notificari.forEach(n => { n.citit = true; });
    actualizeazaBulinaNotificari();
    await supabaseClient.from('notificari').update({ citit: true }).in('id', necitite);
  }
}

function inchidePanouNotificari() {
  document.getElementById('panouNotificari').classList.add('auth-hidden');
}

function randeazaNotificari() {
  const corp = document.getElementById('notificariContinut');
  document.getElementById('btnStergeNotificari').style.visibility = notificari.length ? '' : 'hidden';
  if (!notificari.length) {
    corp.innerHTML = htmlCardPush() + `<div class="card notificari-gol">${tr('Nu ai notificări încă.', 'No notifications yet.')}</div>`;
    return;
  }
  // Necititele rămân evidențiate cât timp panoul e deschis (au fost desenate înainte de marcarea ca citite)
  corp.innerHTML = htmlCardPush() + notificari.map(n => {
    const [titlu, mesaj] = textNotificare(n);
    // Fără loc în aplicație unde să ducă: rămâne doar de citit; clientul șters răspunde totuși cu un mesaj
    const actiune = areDestinatieNotificare(n) || esteClientSters(n) ? `onclick="deschideNotificare('${n.id}')"` : 'disabled';
    return `<div class="notificare-rand">
      <button type="button" class="notificare${n.citit ? '' : ' necitita'}" ${actiune}>
        <span class="notificare-icon tip-${escAttr(n.tip)}"></span>
        <span class="notificare-text"><b>${escAttr(titlu)}</b><span>${escAttr(mesaj)}</span></span>
        <small>${escAttr(cand(n.created_at))}</small>
      </button>
      <button type="button" class="notificare-x" onclick="ascundeNotificare('${n.id}')" aria-label="${tr('Șterge notificarea', 'Remove notification')}">×</button>
    </div>`;
  }).join('');
}

// Notificările se ascund, nu se șterg: rândul (cu cheia lui) rămâne, ca aceeași notificare să nu fie trimisă din nou
async function ascundeNotificare(id) {
  notificari = notificari.filter(n => n.id !== id);
  randeazaNotificari();
  actualizeazaBulinaNotificari();
  const { data, error } = await supabaseClient.from('notificari').update({ ascuns: true }).eq('id', id).select('id');
  if (error || !(data || []).length) eroareAscundereNotificari();
}

// Baza n-a salvat ascunderea (fără internet sau fără drept de modificare): lista revine la ce e în bază
function eroareAscundereNotificari() {
  showToast(tr('Notificarea nu s-a putut șterge. Verifică internetul și reîncearcă.', 'The notification could not be removed. Check your internet and try again.'), 'error');
  incarcaNotificari().then(() => {
    if (!document.getElementById('panouNotificari').classList.contains('auth-hidden')) randeazaNotificari();
  });
}

function stergeToateNotificarile() {
  if (!notificari.length) return;
  customConfirm(tr('Ștergi toate notificările?', 'Clear all notifications?'),
    tr('Dispar din listă. Notificările noi vor apărea în continuare.', 'They disappear from the list. New notifications will still arrive.'),
    async () => {
      const ids = notificari.map(n => n.id);
      notificari = [];
      randeazaNotificari();
      actualizeazaBulinaNotificari();
      const { data, error } = await supabaseClient.from('notificari').update({ ascuns: true }).in('id', ids).select('id');
      if (error || (data || []).length < ids.length) eroareAscundereNotificari();
    });
  document.getElementById('modalBtnConfirm').innerText = tr('Șterge toate', 'Clear all');
}

// Atingerea unei notificări duce la locul potrivit din aplicație
// Tipurile care duc undeva în aplicație; restul (tip necunoscut, client șters) rămân doar de citit
function areDestinatieNotificare(n) {
  const d = n.date || {};
  if (rolUtilizator === 'clienta') return ['plan_nou', 'checkin_memento', 'abonament_expira', 'sedinte_putine', 'programare_maine', 'nota_noua', 'loc_liber', 'mesaj_nou', 'obiectiv_saptamana', 'serie_pericol', 'masa_nenotata', 'programari_saptamana', 'fisa_modificata'].includes(n.tip);
  if (n.tip === 'checkin_nou' || n.tip === 'mesaj_nou' || n.tip === 'fisa_modificata') return (DB.clienti || []).some(c => c.id === d.client_id);
  return ['cerere_noua', 'rezervare', 'anulare', 'lipsa_checkin', 'abonamente_expira', 'programari_lipsa'].includes(n.tip);
}

// Check-in de la un client care nu mai e în listă (șters)
function esteClientSters(n) {
  return rolUtilizator !== 'clienta' && n.tip === 'checkin_nou' && !areDestinatieNotificare(n);
}

function deschideNotificare(id) {
  const n = notificari.find(x => x.id === id);
  if (!n) return;
  if (esteClientSters(n)) return showToast(tr('Clientul nu mai e în listă.', 'This client is no longer in your list.'));
  if (!areDestinatieNotificare(n)) return;
  if (n.tip === 'lipsa_checkin') return arataLipsaCheckin(n);
  inchidePanouNotificari();
  if (rolUtilizator === 'clienta') {
    if (n.tip === 'checkin_memento') { clientaTab('fisa'); return; }
    if (n.tip === 'fisa_modificata') {
      clientaTab('fisa');
      setTimeout(() => { const el = document.getElementById('fisaObiectiveClient'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); }, 400);
      return;
    }
    if (n.tip === 'mesaj_nou') { clientaTab('acasa'); deschideMesajeClienta(); return; }
    if (n.tip === 'masa_nenotata') { deschideAdaugaAliment((n.date || {}).masa === 'cina' ? 'cina' : masaImplicita()); return; }
    // Locul liber: Orarul se deschide direct pe ziua locului
    if (n.tip === 'loc_liber' && (n.date || {}).zi) dateClienta.ziSelectata = cheieZiClienta(new Date(n.date.zi + 'T12:00:00'));
    clientaTab(['programare_maine', 'loc_liber', 'programari_saptamana'].includes(n.tip) ? 'orar' : 'acasa');
    // Planul nou se deschide direct, dacă îl găsim după titlu
    const iPlan = n.tip === 'plan_nou' ? dateClienta.planuri.findIndex(p => p.titlu === (n.date || {}).titlu) : -1;
    if (iPlan !== -1) deschidePlanClienta(iPlan);
    return;
  }
  if (n.tip === 'rezervare' || n.tip === 'anulare') return mergiLaOraDinOrar((n.date || {}).zi, (n.date || {}).ora);
  if (n.tip === 'programari_lipsa') { document.getElementById('navBtnProg').click(); return; }
  document.getElementById('navBtnFisa').click();
  if (n.tip === 'cerere_noua') {
    // Cererile noi stau sus, deasupra listei de clienți
    inapoiLaListaClienteFisa();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (n.tip === 'mesaj_nou') {
    const client = (DB.clienti || []).find(c => c.id === n.date.client_id);
    if (client) { deschideClientaDinLista(client.nume); deschideMesajeAntrenor(); }
    return;
  }
  if (n.tip === 'fisa_modificata') {
    const client = (DB.clienti || []).find(c => c.id === n.date.client_id);
    if (client) {
      deschideClientaDinLista(client.nume);
      const det = document.getElementById('detailsFisaInscriere');
      det.open = true;
      setTimeout(() => det.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
    return;
  }
  if (n.tip === 'checkin_nou' && n.date && n.date.client_id) {
    const client = (DB.clienti || []).find(c => c.id === n.date.client_id);
    if (client) {
      deschideClientaDinLista(client.nume);
      const det = document.getElementById('detailsProgresClienta');
      det.open = true;
      setTimeout(() => det.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  } else if (n.tip === 'abonamente_expira') {
    inapoiLaListaClienteFisa();
    filtruListaFisa = 'urmarit';
    randeazaListaClienteFisa();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Lista clienților fără check-in în săptămâna din notificare, cu memento prin meniul de partajare
async function arataLipsaCheckin(n) {
  const corp = document.getElementById('notificariContinut');
  corp.innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  const saptamana = n.date && n.date.saptamana;
  const { data } = await supabaseClient.from('checkin_saptamanal').select('client_id').eq('user_id', utilizatorCurent.id).eq('saptamana', saptamana);
  const facut = new Set((data || []).map(k => k.client_id));
  window.__lipsaCheckin = (DB.clienti || []).filter(c => (c.status || '').toLowerCase() === 'activ'
    && (c.contConectat || c.checkinToken) && !facut.has(c.id));
  const lista = window.__lipsaCheckin;
  corp.innerHTML = `<button type="button" class="lista-inapoi" onclick="randeazaNotificari()">
      <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg><span>${tr('Notificări', 'Notifications')}</span>
    </button>
    <div class="checkin-titlu" style="margin:12px 2px 8px;">${tr('Fără check-in în săptămâna', 'No check-in for the week of')} ${formatZiLuna(new Date(saptamana + 'T12:00:00'))}</div>
    ${lista.length ? lista.map((c, i) => `<div class="lista-clienta lipsa-checkin-rand">
        <span class="lista-avatar">${escAttr(c.nume.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase())}</span>
        <span class="lista-info"><b>${escAttr(c.nume)}</b><small>${c.checkinToken ? tr('link de check-in', 'check-in link') : tr('cont în aplicație', 'app account')}</small></span>
        <button type="button" class="btn lipsa-checkin-btn" onclick="trimiteMementoCheckin(${i})">${tr('Memento', 'Remind')}</button>
      </div>`).join('') : `<div class="card notificari-gol">${tr('Toți au trimis check-in-ul. 🎉', 'Everyone sent their check-in. 🎉')}</div>`}`;
}

function trimiteMementoCheckin(i) {
  const c = window.__lipsaCheckin[i];
  if (!c) return;
  const text = tr(`Bună, ${c.nume.split(' ')[0]}! Nu uita de check-in-ul săptămânal 🙂`, `Hi ${c.nume.split(' ')[0]}! Don’t forget your weekly check-in 🙂`);
  trimiteMesajClient(c, text, c.checkinToken ? `${URL_APLICATIE}?checkin=${c.checkinToken}` : URL_APLICATIE);
}

// Check-in-urile se citesc din Supabase doar când secțiunea „Progres” e deschisă (nu intră în cache-ul DB)
async function incarcaProgresFisa() {
  const det = document.getElementById('detailsProgresClienta');
  const corp = document.getElementById('progresFisaContinut');
  const client = clientaFisaCurenta();
  if (!det.open || !client) {
    corp.innerHTML = '';
    return;
  }
  // Fișa se redesenează și la reîmprospătarea datelor: fără „Se încarcă” peste un progres deja afișat
  if (!corp.innerHTML) corp.innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  const [{ data, error }, resGreutati, , resAntrPers, resObiective] = await Promise.all([
    supabaseClient.from('checkin_saptamanal').select('*').eq('client_id', client.id),
    supabaseClient.from('greutati').select('*').eq('client_id', client.id),
    incarcaListaPoze(client.id),
    supabaseClient.from('antrenamente_personale').select('*').eq('client_id', client.id).eq('fel', 'antrenament')
      .order('data', { ascending: false }).limit(150),
    supabaseClient.from('obiective').select('*').eq('client_id', client.id).order('created_at'),
    incarcaNutritieAntrenor(client),
    incarcaCicluAntrenor(client)
  ]);
  if (clientaFisaCurenta() !== client || !det.open) return;
  const checkinuri = error ? [] : (data || []);
  // Fără tabelul greutati (scriptul SQL nerulat) graficul merge doar cu check-in-urile
  greutatiFisa = resGreutati.error ? [] : (resGreutati.data || []);
  const planuriClient = (DB.planuri || []).filter(p => randulClientei(p, client, p.clienta));
  const antrenamenteClient = resAntrPers && !resAntrPers.error ? resAntrPers.data : [];
  // Obiectivele clientului: antrenorul le vede, le adaugă și le modifică (fără tabel, secțiunea nu apare)
  obiectiveUI = resObiective && !resObiective.error ? { rol: 'antrenor', clientId: client.id, userId: utilizatorCurent.id, lista: resObiective.data || [],
    sursa: { planuri: planuriClient, antrenamente: antrenamenteClient }, zileSapt: zileActiveSaptamanaAntrenor(client, planuriClient, antrenamenteClient), editare: null } : null;
  corp.innerHTML = (obiectiveUI ? `<div class="obiective-grup-titlu">${tr('Obiective', 'Goals')}</div><div id="obiectiveContinut">${htmlObiective()}</div>` : '')
    + htmlProgres(client.fisaInscriere, checkinuri, { greutati: greutatiFisa, obiectiv: client.obiectiv, antrenor: true })
    + (checkinuri.length ? '' : `<div class="progres-gol">${client.contConectat
      ? tr('Clientul nu a făcut încă niciun check-in. Îl face din tab-ul „Fișa mea”.', 'No check-ins yet. The client does it from the “My profile” tab.')
      : tr('Check-in-ul săptămânal apare după ce clientul își face cont.', 'Weekly check-ins appear once the client creates an account.')}</div>`)
    + `<div class="obiective-grup-titlu" style="margin-top:14px;">${tr('Progres la exerciții', 'Exercise progress')}</div>`
    + htmlProgresExercitii({ planuri: planuriClient, antrenamente: antrenamenteClient })
    + htmlAntrPersAntrenor(antrenamenteClient.slice(0, 20))
    + htmlNutritieAntrenor()
    + htmlCicluAntrenor();
  umplePoze(corp);
  umplePozeAntr(corp);
}

function randeazaFisaInscriereDeschisa() {
  const det = document.getElementById('detailsFisaInscriere');
  const client = clientaFisaCurenta();
  if (!det.open || !client) { document.getElementById('fisaInscriereContinut').innerHTML = ''; return; }
  const buton = `<button type="button" class="btn btn-clear fisa-obiective-editeaza" onclick="deschideEditorFisa('${escAttr(client.id)}', (clientaFisaCurenta() || {}).fisaInscriere)">✎ ${client.fisaInscriere ? tr('Editează fișa', 'Edit the form') : tr('Completează fișa', 'Fill in the form')}</button>`;
  document.getElementById('fisaInscriereContinut').innerHTML = client.fisaInscriere
    ? htmlRaspunsuriInscriere(client.fisaInscriere) + htmlModificareFisa(client.fisaInscriere) + buton
    : `<div class="progres-gol">${tr('Clientul n-a completat încă formularul. Îl poți completa tu, din ce știi.', 'The client hasn’t filled in the form yet. You can fill it in from what you know.')}</div>` + buton;
}

// Emailul se salvează întâi în fișă (leaga_cont_clienta îl caută la login), apoi se trimite link-ul de acces
function invitaClienta() {
  const sel = document.getElementById('selectClientaFisa');
  const nume = sel ? sel.value.trim() : '';
  const email = (document.getElementById('fisaEmailInvitatie').value || '').trim().toLowerCase();
  if (!nume) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast(t('authInvalidEmailFormat'), 'error');
    return;
  }
  const btn = document.getElementById('btnInvitaClienta');
  btn.disabled = true;
  callBackend("seteazaEmailInvitatie", { nume: nume, email: email }, async function(res) {
    if (!res || !res.success) {
      btn.disabled = false;
      showToast(tr("Eroare sincronizare", "Sync error"), "error");
      return;
    }
    const captchaToken = await obtineTokenCaptcha().catch(() => null);
    const { error } = captchaToken
      ? await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: URL_APLICATIE, data: { captcha_token: captchaToken } } })
      : { error: true };
    btn.disabled = false;
    if (error) showToast(tr('Emailul nu s-a putut trimite', 'Could not send the email'), 'error');
    else showToast(tr('Invitație trimisă', 'Invitation sent'));
    incarcaBazaDateSilencios(nume);
  }, function() { btn.disabled = false; });
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
    if (!p || !p.clienta || !randulClientei(p, clientaFisaCurenta(), p.clienta)) return false;

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
      h += `<div style="padding:5px 0; border-bottom:1px solid var(--border);">• <b>${escAttr(p.data)}</b> (${escAttr(p.ora || '-')}) - ${escAttr(traduceValoare(p.antrenament) || '-')}</div>`;
    });
    istoricDiv.innerHTML = h;
  }
}

// Telefon și email în fișă: atingerea pornește apelul / emailul; fără valoare apare „—”
function actualizeazaContactFisa(client) {
  const tel = client.telefon || '';
  const email = client.emailInvitatie || '';
  const elTel = document.getElementById('fisaTelefon');
  const elEmail = document.getElementById('fisaEmail');
  if (!elTel || !elEmail) return;
  document.getElementById('fisaTelefonText').innerText = tel || '—';
  document.getElementById('fisaEmailText').innerText = email || '—';
  if (tel) elTel.href = 'tel:' + tel.replace(/[^\d+]/g, ''); else elTel.removeAttribute('href');
  if (email) elEmail.href = 'mailto:' + email; else elEmail.removeAttribute('href');
}

// „Salvează Modificările” nu trimite nimic dacă formularul e identic cu datele fișei
const CAMPURI_EDITARE_FISA = ['editNume', 'editTelefon', 'editEmail', 'editTip', 'editDataStart', 'editDataExpirare', 'editIncluse', 'editEfectuate', 'editRamase', 'editStatus'];
let valoriInitialeFisa = '';

function valoriEditareFisa() {
  return CAMPURI_EDITARE_FISA.map(id => (document.getElementById(id)?.value || '').trim()).join('\u0001');
}

// dd.mm.yyyy → yyyy-mm-dd pentru <input type="date">; „-” sau gol → ''
function dataRoInIso(s) {
  const ms = parseazaDataOraRo(s);
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Tipul nou din „Editează” aduce numărul lui de ședințe; altfel clientul rămâne „Fără abonament” (incluse 0)
function recalculeazaSedinteEditare() {
  const tip = document.getElementById('editTip').value;
  const incluse = tip === '-' ? 0 : getNrSedinteAbonamentLocal(tip);
  const efectuate = Number(document.getElementById('editEfectuate').value) || 0;
  document.getElementById('editIncluse').value = incluse;
  document.getElementById('editRamase').value = Math.max(0, incluse - efectuate);
}

// Start ales fără expirare: expirarea devine start + 30 de zile (se poate ajusta)
function completeazaExpirareEditare() {
  const start = document.getElementById('editDataStart').value;
  const elExp = document.getElementById('editDataExpirare');
  if (!start || elExp.value) return;
  const d = new Date(parseazaDataOraRo(start));
  d.setDate(d.getDate() + zileValabilitateAbonament(document.getElementById('editTip').value));
  elExp.value = dataRoInIso(formateazaDataRoLocal(d));
}

function salveazaEditareClienta() {
  if (valoriEditareFisa() === valoriInitialeFisa) return;
  let sel = document.getElementById('selectClientaFisa');
  let numeVechi = sel ? sel.value.trim() : "";
  let numeNou = document.getElementById('editNume').value.trim();
  let tip = document.getElementById('editTip').value;
  // Câmpurile de dată dau yyyy-mm-dd (gol = „-”, abonamentul pornește la prima ședință bifată)
  let dStart = formateazaDataRoLocal(document.getElementById('editDataStart').value);
  let dExp = formateazaDataRoLocal(document.getElementById('editDataExpirare').value);
  let inc = document.getElementById('editIncluse').value;
  let ef = document.getElementById('editEfectuate').value;
  let ram = document.getElementById('editRamase').value;
  let st = document.getElementById('editStatus').value;
  let telefon = document.getElementById('editTelefon').value.trim();
  let email = document.getElementById('editEmail').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast(t('authInvalidEmailFormat'), 'error');
    return;
  }
  // Formularul salvat devine noua referință: un al doilea click (dublu click) nu mai trimite nimic
  const valoriAnterioare = valoriInitialeFisa;
  valoriInitialeFisa = valoriEditareFisa();

  // Rândurile care pe ecran poartă numele vechi (numele sunt afișate fără spații în plus), ca să fie redenumite
  // și cele salvate cu mici diferențe de scriere în baza de date
  const acelasiNume = n => cheieNume(n) === cheieNume(numeVechi);
  const randuri = {
    confirmari: (DB.progActive || []).concat(DB.progHold || []).filter(p => acelasiNume(p.nume)).map(p => p.row),
    orar: (DB.orarSloturi || []).filter(s => acelasiNume(s.clienta)).map(s => s.row),
    prezente: (DB.prezente || []).filter(p => acelasiNume(p.clienta)).map(p => p.row),
    incasari: (DB.incasari || []).filter(i => acelasiNume(i.clienta)).map(i => i.row)
  };

  callBackend("actualizeazaDateClienta", {
    numeVechi: numeVechi, numeNou: numeNou, tip: tip, dataStart: dStart, dataExp: dExp,
    incluse: inc, efectuate: ef, ramase: ram, status: st, telefon: telefon, email: email, randuri: randuri
  }, function(res) {
    showToast(t('toastDataUpdated'));
    // Planul deschis în memorie păstrează numele nou, altfel la salvare ar readuce numele vechi
    if (planActiv && (planActiv.clienta || '').trim().toLowerCase() === numeVechi.toLowerCase()) planActiv.clienta = numeNou;
    incarcaBazaDateSilencios(res && res.numeNou ? res.numeNou : numeNou);
  }, function() {
    valoriInitialeFisa = valoriAnterioare;
  });
}

function creeazaClientaNouaDirect() {
  let inp = document.getElementById('nouNumeClienta');
  let nume = inp ? inp.value.trim() : "";
  let tip = document.getElementById('nouTipAbonament').value;
  let inpTel = document.getElementById('nouTelefonClienta');
  if (!nume) { showToast(currentLang === 'en' ? "Enter name!" : "Introdu numele!", "error"); return; }

  callBackend("adaugaClientaDirect", { nume: nume, tip: tip, telefon: inpTel ? inpTel.value : '' }, function() {
    showToast(t('toastClientAdded'));
    if (inp) inp.value = '';
    if (inpTel) inpTel.value = '';
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
    (currentLang === 'en' ? `Reactivate client ${nume}?` : `Reactivezi clientul ${nume}?`) : 
    (currentLang === 'en' ? `Archive client ${nume} from lists?` : `Arhivezi clientul ${nume} din liste?`);

  customConfirm(confirmTitle, confirmText, function() {
    callBackend("seteazaStatusClienta", { nume: nume, statusNou: nouStatus }, function() {
      showToast(esteArhivat ? t('toastReactivated') : t('toastArchived'));
      incarcaBazaDateSilencios();
    });
  });
}

// Fișă › Șterge definitiv (GDPR): întâi pozele (Worker, R2), apoi toate datele clientului; încasările rămân (contabilitate).
// Contul clientului, dacă are, rămâne fără fișă (vezi sql/2026-11-06_stergere_client.sql)
function stergeClientDefinitiv() {
  const sel = document.getElementById('selectClientaFisa');
  const client = gasesteClientaValida((sel && sel.value || '').trim());
  if (!client || !client.id) return;
  const nume = client.nume.trim();
  const text = tr(`Se șterg definitiv fișa lui ${nume} și tot ce ține de ea: programări, prezențe, planuri, progres, poze, nutriție, mesaje. Rămân doar încasările (contabilitate). Nu se poate anula.`,
    `${nume}'s record and everything related will be permanently deleted: bookings, attendance, plans, progress, photos, nutrition, messages. Only payments are kept (accounting). This cannot be undone.`);
  customConfirm(tr('Ștergi definitiv clientul?', 'Permanently delete the client?'), `${text}\n\n${tr('Scrie numele clientului ca să confirmi.', 'Type the client’s name to confirm.')}`, async (valoare) => {
    const normalizat = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (normalizat(valoare) !== normalizat(nume)) {
      showToast(tr('Clientul nu a fost șters: numele nu se potrivește.', 'Client not deleted: the name does not match.'), 'error');
      return;
    }
    const r = await cerePozeAntr('DELETE', '/client', { client: client.id });
    if (!r || !r.ok) {
      showToast(tr('Pozele nu s-au putut șterge. Verifică internetul și reîncearcă.', 'Photos could not be deleted. Check your internet and try again.'), 'error');
      return;
    }
    const { data, error } = await supabaseClient.rpc('sterge_client_definitiv', { p_client_id: client.id });
    if (error || !data || !data.ok) {
      showToast(tr('Clientul nu s-a putut șterge. Reîncearcă.', 'Could not delete the client. Try again.'), 'error');
      return;
    }
    DB.clienti = (DB.clienti || []).filter(c => c !== client);
    sel.value = '';
    afiseazaFisaClientaInstant();
    showToast(tr(`${nume} a fost șters definitiv.`, `${nume} was permanently deleted.`));
    incarcaBazaDateSilencios();
  }, { placeholder: nume });
}

// Prelungirea unui abonament înghețat ar strica pauza: întâi Reia (zilele de pauză se adaugă singure)
function refuzaDacaInghetat(nume) {
  if (!esteInghetat(gasesteClientaValida(nume))) return false;
  showToast(tr('Abonamentul e înghețat. Apasă întâi „Reia abonamentul”.', 'The subscription is frozen. Press “Resume subscription” first.'), 'error');
  return true;
}

// Fișă › Îngheață / Reia abonamentul
function comutaInghetareAbonament() {
  const nume = (document.getElementById('selectClientaFisa').value || '').trim();
  const client = gasesteClientaValida(nume);
  if (!client) return;
  const reia = esteInghetat(client);
  const zile = reia && client.inghetare && parseazaDataOraRo(client.inghetare.de_la)
    ? Math.max(0, Math.round((new Date().setHours(0, 0, 0, 0) - new Date(parseazaDataOraRo(client.inghetare.de_la)).setHours(0, 0, 0, 0)) / 86400000)) : 0;
  customConfirm(reia ? tr('Reia abonamentul', 'Resume subscription') : tr('Îngheață abonamentul', 'Freeze subscription'),
    reia
      ? tr(`${client.nume} poate rezerva din nou. ` + (zile === 0 ? 'Pauza a început azi, deci expirarea rămâne aceeași.' : `${zile === 1 ? 'Ziua' : `Cele ${zile} zile`} de pauză se adaugă la expirare.`),
           `${client.nume} can book again. ` + (zile === 0 ? 'The pause started today, so the expiry stays the same.' : `The ${zile} paused ${zile === 1 ? 'day is' : 'days are'} added to the expiry date.`))
      : tr(`Zilele abonamentului lui ${client.nume} se opresc de azi: nu poate rezerva și nu primește notificări de expirare. Ședințele rămase se păstrează. Dacă vine la o ședință, abonamentul se reia singur.`,
           `${client.nume}'s subscription days stop from today: no booking and no expiry notifications. Remaining sessions are kept. If they come to a session, the subscription resumes by itself.`),
    () => callBackend(reia ? "reiaAbonament" : "ingheataAbonament", { nume: client.nume }, res => {
      if (!res || !res.success) { showToast(tr('Nu s-a putut salva. Verifică internetul și reîncearcă.', 'Could not save. Check your internet and try again.'), 'error'); return; }
      showToast(reia ? tr('✓ Abonament reluat', '✓ Subscription resumed') : tr('✓ Abonament înghețat', '✓ Subscription frozen'));
      incarcaBazaDateSilencios(client.nume);
    }));
}

function adaugaZile(nrZile) {
  let sel = document.getElementById('selectClientaFisa');
  if (!sel) return;
  let nume = sel.value.trim();
  if (!nume) return;
  if (refuzaDacaInghetat(nume)) return;
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
  if (refuzaDacaInghetat(nume)) return;
  callBackend("prelungesteValabilitate", { nume: nume, zile: 0, dataManuala: d }, function(res) {
    showToast(t('toastValiditySet') + res.nouaData);
    incarcaBazaDateSilencios(nume);
  });
}

// Abonament pornit înainte de plată: fără încasare, datele pornesc la prima ședință bifată
function activeazaAbonamentFaraPlata() {
  const nume = (document.getElementById('selectClientaFisa').value || '').trim();
  const selTip = document.getElementById('activareTip');
  const tip = selTip.value;
  if (!nume) return;
  if (!tip) {
    showToast(tr('Alege tipul abonamentului!', 'Pick the subscription type!'), 'error');
    return selTip.focus();
  }
  const client = gasesteClientaValida(nume);
  const inlocuieste = client && areAbonamentActiv(client);
  customConfirm(tr('Activează abonament', 'Activate subscription'),
    (inlocuieste ? tr('Abonamentul activ va fi înlocuit. ', 'The active subscription will be replaced. ') : '') +
    tr(`${tip} pornește la prima ședință bifată. Când clientul plătește, la Încasări alegi „Doar plata”.`,
       `${tip} starts at the first checked session. When the client pays, choose "Payment only" in Payments.`),
    () => callBackend("inregistreazaAbonament", { nume: nume, tip: tip, mod: 'fara_plata' }, (res) => {
      if (res && res.refuz === 'oferta_folosita') return showToast(textOfertaFolosita(tip), 'error');
      showToast(tr('Abonament activat', 'Subscription activated'));
      selTip.value = '';
      actualizeazaStilSelect(selTip);
      incarcaBazaDateSilencios(nume);
    }));
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

  const pret = regulaAbonament(tip).pret;
  if (pret !== null && pret !== undefined) {
    seteazaValoareSelect(selPreset, String(pret));
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
    let s = sumaFaraMoneda(i.suma).replace(/\./g, "").replace(/,/g, ".");
    let val = parseFloat(s);
    if (!isNaN(val)) totalSuma += val;
  });

  let elTotalVal = document.getElementById('totalIncasariVal');
  let elTotalCount = document.getElementById('totalIncasariCount');
  if (elTotalVal) elTotalVal.innerText = totalSuma.toLocaleString('ro-RO') + ' ' + setariStudio.moneda;
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
    let esteGol = !sumaFaraMoneda(item.suma);
    let sumaStil = esteGol ? 'color:var(--text-muted); font-weight:700;' : 'color:#27ae60; font-weight:700;';
    
    let metodaContinut = (item.metoda && item.metoda.trim() !== "-" && item.metoda.trim() !== "") 
      ? escAttr(item.metoda)
      : '<span class="dash-placeholder">-</span>';

    let tipContinut = (item.tip && item.tip.trim() !== "-" && item.tip.trim() !== "")
      ? escAttr(item.tip)
      : '<span class="dash-placeholder">-</span>';

    // encodeURIComponent lasă apostroful necodificat, iar el ar închide argumentul din onclick
    let itemJson = encodeURIComponent(JSON.stringify(item)).replace(/'/g, '%27');

    html += `
      <tr class="incasare-row-clickable" onclick="deschideModalEditareIncasare('${itemJson}')" title="${currentLang === 'en' ? 'Click to edit this payment' : 'Apasă pentru a edita această plată'}">
        <td style="font-weight:700;">${escAttr(item.data)}</td>
        <td style="font-weight:700; color:var(--primary);">${escAttr(item.clienta)}</td>
        <td style="${sumaStil}">${escAttr(formateazaSuma(item.suma))}</td>
        <td style="text-align:center;">${metodaContinut}</td>
        <td>${tipContinut}</td>
        <td style="text-align:center; color:var(--text-muted); font-size:0.8rem;"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

let esteIncasareInCurs = false;

// `mod` (opțional), după întrebarea despre abonamentul activ: 'inlocuieste' sau 'doar_plata'
function salveazaIncasare(mod) {
  if (esteIncasareInCurs) return;

  let inp = document.getElementById('incasareNume');
  let nume = inp ? inp.value.trim() : "";
  let tip = document.getElementById('incasareTip').value;
  let suma = getSumaSelectata();
  let metoda = document.getElementById('incasareMetoda').value;
  let dataPlata = document.getElementById('incasareDataPlata').value;
  let dataStart = document.getElementById('incasareDataStart').value;

  if (!nume) {
    showToast(currentLang === 'en' ? "Complete client name!" : "Completează numele clientului!", "error");
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

  esteIncasareInCurs = true;
  let btnSubmit = document.getElementById('submitAbonamentBtn');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = t('paySavingBtn');
    btnSubmit.style.opacity = '0.65';
    btnSubmit.style.pointerEvents = 'none';
  }

  callBackend("inregistreazaAbonament", {
    nume: nume, tip: tip, suma: suma, metoda: metoda, dataPlata: dataPlata, dataStart: dataStart, mod: mod || ''
  }, function(res) {
    if (res && res.refuz) {
      esteIncasareInCurs = false;
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerText = t('paySubmitBtn');
        btnSubmit.style.opacity = '';
        btnSubmit.style.pointerEvents = '';
      }
      if (res.refuz === 'confirma_abonament_activ') {
        customConfirm(res.neplatit ? tr('Abonament neplătit', 'Unpaid subscription') : tr('Abonament activ', 'Active subscription'),
          res.neplatit
            ? tr(`${nume} are un abonament activat fără plată. Înregistrezi plata lui sau îl înlocuiești cu cel nou?`, `${nume} has a subscription activated without payment. Record its payment or replace it with the new one?`)
            : tr(`${nume} are deja un abonament activ. Îl înlocuiești cu cel nou sau înregistrezi doar plata?`, `${nume} already has an active subscription. Replace it with the new one or record the payment only?`),
          () => salveazaIncasare('inlocuieste'));
        document.getElementById('modalBtnConfirm').innerText = tr('Înlocuiește', 'Replace');
        aratButonAlternativModal(tr('Doar plata', 'Payment only'), () => salveazaIncasare('doar_plata'));
        return;
      }
      showToast(res.refuz === 'gratuita_folosita'
        ? tr('Clientul a beneficiat deja de o ședință gratuită.', 'This client already had a free session.')
        : res.refuz === 'oferta_folosita' ? textOfertaFolosita(tip)
        : tr('Clientul are deja un abonament activ.', 'This client already has an active subscription.'), 'error');
      return;
    }
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
  
  let sCurata = sumaFaraMoneda(item.suma);
  document.getElementById('editIncSuma').value = sCurata;
  
  populeazaMetodeEditare((item.metoda && item.metoda !== "-") ? item.metoda : "-");

  let selTip = document.getElementById('editIncTip');
  if (selTip) {
    seteazaTipAbonamentSelect(selTip, item.tip);
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
    showToast(currentLang === 'en' ? "Complete client name!" : "Completează numele clientului!", "error");
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
    document.getElementById('editIncMetoda').focus();
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
  navigheazaSubMeniu('main');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  actualizeazaStareNoScrollBody();
}

function inchideMeniuLateral() {
  let drawer = document.getElementById('appDrawer');
  let backdrop = document.getElementById('appDrawerBackdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  actualizeazaStareNoScrollBody();
}

// ==========================================
// 4. SECȚIUNEA PLAN DE ANTRENAMENT
// ==========================================

let planActiv = null;
let esteModPrevizualizarePdf = false;
let esteModClientaShare = false;

function escAttr(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Plan nou: gol, cu o singură zi neîncepută (titlul se completează la salvare)
// Șabloanele B-Fit în limba interfeței (sabloane.js: SABLOANE_PLAN în română, SABLOANE_PLAN_EN în engleză)
function sabloanePlan() {
  if (typeof SABLOANE_PLAN === 'undefined') return [];
  return currentLang === 'en' && typeof SABLOANE_PLAN_EN !== 'undefined' ? SABLOANE_PLAN_EN : SABLOANE_PLAN;
}

function construiesteSablonPlanDefault() {
  return {
    id: null,
    clienta: "",
    titlu: "",
    subtitlu: "",
    continut_json: {
      sectiuni_inceput: [],
      sesiuni: [
        {
          titlu: tr("ZIUA 1: Sesiune nouă de antrenament", "DAY 1: New workout session"),
          exercitii: [
            { nr: 1, exercitiu: "", seturi_repetari: "", pauza: "", indicatii: "", greutate_kg: "", seturi_finalizate: "", status: "" }
          ]
        }
      ],
      sectiuni_final: [],
      nota_subsol: ""
    }
  };
}

async function deschideSectiunePlanAntrenamentDinMeniu() {
  inchideMeniuLateral();
  tabAnteriorPlan = tipTabCurent || 'orar';
  tipTabCurent = 'plan';

  // Ascundere Bottom Nav Bar
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.style.display = 'none';

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#bottomNav button').forEach(el => el.classList.remove('active'));

  const tabPlan = document.getElementById('tabPlanAntrenament');
  if (tabPlan) tabPlan.classList.add('active');

  actualizeazaHeaderVisual('plan', t('workoutPlanTitle'));
  ziDeschisaPlan = null;
  planDeschisDinFisa = false;
  // Din meniu se deschide biblioteca; un plan cu modificări nesalvate rămâne deschis
  bibliotecaPlanuri = !estePlanModificat();

  // Dacă nu este selectat niciun plan, afișează șablonul default de creare
  if (!planActiv) {
    planActiv = construiesteSablonPlanDefault();
    retinePlanInitial();
  }

  // Planul deschis și neatins se reia din baza de date (clienta poate fi completat progresul între timp)
  const eraNemodificat = !!(planActiv.id && !estePlanModificat());
  const idPlanLaDeschidere = planActiv.id;

  // Pagina se desenează imediat din datele locale; lista se actualizează când vin cele din Supabase
  populeazaSelectorPlanuri();
  randeazaPlanAntrenamentUI();
  window.scrollTo({ top: 0, behavior: 'auto' });

  // Preluare proaspătă din Supabase pentru lista de planuri
  if (USE_SUPABASE && supabaseClient) {
    try {
      const { data: planuriNoi, error } = await supabaseClient
        .from('planuri_antrenament')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(planuriNoi)) {
        DB.planuri = planuriNoi.map(pl => ({
          id: pl.id,
          user_id: pl.user_id,
          clienta: pl.clienta || "",
          titlu: pl.titlu || "Program de antrenament",
          subtitlu: pl.subtitlu || "",
          continut_json: pl.continut_json || {},
          updated_at: pl.updated_at
        }));
        try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch (e) {}
        // Doar dacă e tot planul de la deschidere, neatins între timp
        const proaspat = eraNemodificat && planActiv && planActiv.id === idPlanLaDeschidere && !estePlanModificat()
          ? DB.planuri.find(p => String(p.id) === String(planActiv.id)) : null;
        if (proaspat) { planActiv = JSON.parse(JSON.stringify(proaspat)); retinePlanInitial(); }
      }
    } catch (err) {
      console.error("Eroare sincronizare planuri:", err);
    }
  }

  // Cât timp a venit răspunsul, antrenorul poate fi ieșit din plan: atunci nu se mai redesenează nimic
  if (tipTabCurent !== 'plan') return;
  populeazaSelectorPlanuri();
  // Lista bibliotecii se actualizează pe loc, fără a șterge căutarea sau a muta pagina
  if (bibliotecaPlanuri && document.getElementById('bibliotecaLista')) actualizeazaListaBiblioteca();
  else randeazaPlanAntrenamentUI();
}

function populeazaSelectorPlanuri() {
  const sel = document.getElementById('selectPlanExistent');
  if (!sel) return;

  const idCurent = planActiv && planActiv.id ? planActiv.id : "";
  sel.innerHTML = `<option value="">${currentLang === 'en' ? 'Choose a plan' : 'Alege un plan'}</option>`;

  // Lista e biblioteca de șabloane: planurile trimise clienților se găsesc în fișa fiecărui client.
  // Ordine alfabetică naturală (Săptămâna 2 înainte de Săptămâna 10)
  const eticheta = p => `${p.clienta ? `[${p.clienta}] ` : ''}${p.titlu}`;
  const sortate = (DB.planuri || []).filter(p => !(p.clienta || '').trim())
    .sort((a, b) => eticheta(a).localeCompare(eticheta(b), 'ro', { numeric: true, sensitivity: 'base' }));

  // Titlurile „Săptămâna N - Ziua M: ...” se grupează pe săptămâni, ca rândurile din listă să fie scurte
  const grupuri = new Map();
  const altele = [];
  sortate.forEach(p => {
    const m = (p.titlu || '').match(/^(S[ăa]pt[ăa]m[âa]na\s+\d+)\s*[-–—:]\s*(.+)$/i);
    if (!m) { altele.push(p); return; }
    const cheie = `${p.clienta ? `[${p.clienta}] ` : ''}${m[1]}`;
    if (!grupuri.has(cheie)) grupuri.set(cheie, []);
    grupuri.get(cheie).push({ id: p.id, text: m[2] });
  });

  const adaugaOptiune = (parinte, id, text) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.innerText = text;
    parinte.appendChild(opt);
  };

  // Planul unui client deschis din fișa lui rămâne vizibil în listă cât e deschis
  if (planActiv && planActiv.id && (planActiv.clienta || '').trim()) {
    const grup = document.createElement('optgroup');
    grup.label = tr('Deschis acum', 'Open now');
    adaugaOptiune(grup, planActiv.id, eticheta(planActiv));
    sel.appendChild(grup);
  }

  adaugaOptiune(sel, 'gol', tr('+ Plan gol', '+ Blank plan'));

  // Șabloanele B-Fit: alegerea unuia deschide o copie de editat
  const sabloane = sabloanePlan();
  if (sabloane.length) {
    const grup = document.createElement('optgroup');
    grup.label = tr('Șabloane B-Fit', 'B-Fit templates');
    sabloane.forEach((s, i) => adaugaOptiune(grup, 'sablon:' + i, s.titlu));
    sel.appendChild(grup);
  }

  grupuri.forEach((lista, cheie) => {
    const grup = document.createElement('optgroup');
    grup.label = cheie;
    lista.forEach(p => adaugaOptiune(grup, p.id, p.text));
    sel.appendChild(grup);
  });

  if (altele.length > 0) {
    const parinte = grupuri.size > 0 || sabloane.length ? document.createElement('optgroup') : sel;
    if (parinte !== sel) {
      parinte.label = grupuri.size > 0 ? tr('Alte șabloane', 'Other templates') : tr('Șabloanele mele', 'My templates');
      sel.appendChild(parinte);
    }
    altele.forEach(p => adaugaOptiune(parinte, p.id, eticheta(p)));
  }

  sel.value = idCurent;
  actualizeazaStilSelect(sel);
  sincronizeazaListaPlanuri();
}

// Lista proprie de planuri: se construiește din select-ul ascuns (grupuri + opțiuni) și îl actualizează la alegere
function sincronizeazaListaPlanuri() {
  const sel = document.getElementById('selectPlanExistent');
  const trigger = document.getElementById('planPickerTrigger');
  const label = document.getElementById('planPickerLabel');
  const panel = document.getElementById('planPickerPanel');
  if (!sel || !trigger || !label || !panel) return;

  const optAles = sel.value ? sel.options[sel.selectedIndex] : null;
  if (optAles) {
    const grup = optAles.parentElement.tagName === 'OPTGROUP' ? optAles.parentElement.label : '';
    label.textContent = grup ? `${grup} · ${optAles.text}` : optAles.text;
  } else {
    label.textContent = sel.options[0] ? sel.options[0].text : '';
  }
  trigger.classList.toggle('select-faded', !sel.value);
  trigger.classList.toggle('select-active', !!sel.value);

  construiesteOptiuniListaProprie(panel, sel, true, () => {
    comutaListaPlanuri(false);
    sincronizeazaListaPlanuri();
  });

  if (!panel.children.length) {
    const gol = document.createElement('div');
    gol.className = 'plan-picker-empty';
    gol.textContent = currentLang === 'en' ? 'No saved plans yet' : 'Niciun plan salvat încă';
    panel.appendChild(gol);
  }
}

// Construiește rândurile listei proprii din opțiunile unui <select> (cu grupuri); la alegere setează valoarea
// și declanșează change, ca logica existentă a select-ului să ruleze neschimbată
function construiesteOptiuniListaProprie(panel, sel, faraOptiuneGoala, laAlegere) {
  panel.innerHTML = '';
  const adaugaElement = (opt) => {
    if (opt.disabled || opt.hidden || (faraOptiuneGoala && !opt.value)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    // Opțiunea goală (ex. „Tip antrenament”, „-”) apare gri și nu e marcată ca alegere
    btn.className = 'plan-picker-item' + (!opt.value ? ' is-empty' : (opt.value === sel.value ? ' is-selected' : ''));
    btn.setAttribute('role', 'option');
    btn.textContent = opt.text;
    btn.onclick = () => {
      sel.value = opt.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if (laAlegere) laAlegere();
    };
    panel.appendChild(btn);
  };

  [...sel.children].forEach(copil => {
    if (copil.tagName === 'OPTGROUP') {
      const titlu = document.createElement('div');
      titlu.className = 'plan-picker-group';
      titlu.textContent = copil.label;
      panel.appendChild(titlu);
      [...copil.children].forEach(adaugaElement);
    } else {
      adaugaElement(copil);
    }
  });
}

// Listele de alegere din formulare (select.form-control) se deschid în lista proprie a aplicației, nu în cea a telefonului.
// Select-ul rămâne la locul lui (aceeași mărime, același text afișat); doar lista deschisă e înlocuită.
(function () {
  let panel = null;
  let selDeschis = null;

  // Listele din formulare, pastilele de status (Confirmata / În așteptare / Absenta, status exerciții) și Tip antrenament din sloturi
  const esteLista = (el) => el && el.tagName === 'SELECT' && (el.classList.contains('form-control') || el.classList.contains('pill-select') || el.classList.contains('slot-select-type')) && el.id !== 'selectPlanExistent' && !el.disabled;

  const inchide = () => {
    if (panel) panel.classList.remove('is-open');
    selDeschis = null;
  };

  const deschide = (sel) => {
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'plan-picker-panel lista-proprie-panel';
      panel.setAttribute('role', 'listbox');
      document.body.appendChild(panel);
    }
    selDeschis = sel;
    // Opțiunea goală e placeholder doar la listele estompate (ex. „Metoda Plata”); la filtre „Toate lunile” rămâne
    // La Tip antrenament opțiunea goală rămâne, ca tipul să poată fi șters ca înainte
    const placeholderAscuns = sel.classList.contains('form-control') && (sel.classList.contains('select-faded') || sel.classList.contains('select-active'));
    construiesteOptiuniListaProprie(panel, sel, placeholderAscuns, inchide);

    const r = sel.getBoundingClientRect();
    panel.style.left = Math.max(8, r.left) + 'px';
    panel.style.width = Math.max(r.width, 160) + 'px';
    panel.classList.add('is-open');
    const spatiuJos = window.innerHeight - r.bottom - 80;
    if (spatiuJos < Math.min(panel.scrollHeight, 220) && r.top > spatiuJos) {
      panel.style.top = '';
      panel.style.bottom = (window.innerHeight - r.top + 4) + 'px';
    } else {
      panel.style.bottom = '';
      panel.style.top = (r.bottom + 4) + 'px';
    }
    const latimeMax = window.innerWidth - 16;
    if (panel.getBoundingClientRect().right > latimeMax) panel.style.left = Math.max(8, latimeMax - panel.offsetWidth) + 'px';

    const ales = panel.querySelector('.is-selected');
    panel.scrollTop = ales ? Math.max(0, ales.offsetTop - panel.clientHeight / 2) : 0;
  };

  // Oprește lista nativă și deschide-o pe a noastră.
  // Pe telefon reacționează la atingere scurtă (touchend), ca derularea care începe pe o listă să meargă normal.
  const comuta = (sel) => { if (selDeschis === sel) inchide(); else deschide(sel); };
  let atingere = null;
  document.addEventListener('touchstart', (e) => {
    const sel = e.target.closest ? e.target.closest('select') : null;
    atingere = esteLista(sel) && e.touches.length === 1 ? { sel, x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { capture: true, passive: true });
  document.addEventListener('touchend', (e) => {
    if (!atingere) return;
    const t = e.changedTouches[0];
    const scurta = Math.abs(t.clientX - atingere.x) < 10 && Math.abs(t.clientY - atingere.y) < 10;
    const sel = atingere.sel;
    atingere = null;
    if (!scurta) return;
    e.preventDefault();
    comuta(sel);
  }, { capture: true, passive: false });
  document.addEventListener('mousedown', (e) => {
    const sel = e.target.closest ? e.target.closest('select') : null;
    if (!esteLista(sel)) return;
    e.preventDefault();
    comuta(sel);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { inchide(); return; }
    if (esteLista(e.target) && [' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      deschide(e.target);
    }
  });

  // pointerdown, nu click: pe telefon atingerea unei zone fără buton (fundal, text) nu trimite click, iar lista rămânea deschisă
  document.addEventListener('pointerdown', (e) => {
    if (!selDeschis) return;
    if (panel && panel.contains(e.target)) return;
    if (e.target.closest && e.target.closest('select') === selDeschis) return;
    inchide();
  }, true);

  // Și la derularea oricărui container (ecranele se derulează în interior, nu în fereastră), mai puțin a listei însăși
  document.addEventListener('scroll', (e) => { if (selDeschis && !(panel && panel.contains(e.target))) inchide(); }, { capture: true, passive: true });
  window.addEventListener('resize', () => { if (selDeschis) inchide(); });
})();

function comutaListaPlanuri(deschide) {
  const picker = document.getElementById('planPicker');
  const trigger = document.getElementById('planPickerTrigger');
  if (!picker) return;
  const deschis = (typeof deschide === 'boolean') ? deschide : !picker.classList.contains('is-open');
  picker.classList.toggle('is-open', deschis);
  if (trigger) trigger.setAttribute('aria-expanded', deschis ? 'true' : 'false');
  if (deschis) {
    // Derulează doar lista (nu și pagina) până la planul ales
    const panel = document.getElementById('planPickerPanel');
    const ales = picker.querySelector('.plan-picker-item.is-selected');
    if (panel) panel.scrollTop = ales ? Math.max(0, ales.offsetTop - panel.clientHeight / 2) : 0;
  }
}

// Închide lista de planuri la atingere în afara ei sau la Escape
document.addEventListener('pointerdown', (e) => {
  const picker = document.getElementById('planPicker');
  if (picker && picker.classList.contains('is-open') && !picker.contains(e.target)) comutaListaPlanuri(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') comutaListaPlanuri(false);
});

// Amprenta planului: secțiunile goale pe care afișarea le adaugă singură nu contează ca modificare
function amprentaPlanului(p) {
  const c = Object.assign({ sectiuni_inceput: [], sesiuni: [], sectiuni_final: [] }, (p && p.continut_json) || {});
  return JSON.stringify([((p && p.clienta) || '').trim(), ((p && p.titlu) || '').trim(), ((p && p.subtitlu) || '').trim(), c]);
}

// Starea planului la deschidere (sau la ultima salvare); modificările se compară cu ea
let amprentaPlanInitial = null;
function retinePlanInitial() {
  amprentaPlanInitial = planActiv ? amprentaPlanului(planActiv) : null;
}

// Planul curent are modificări nesalvate față de cum era când a fost deschis sau salvat
// (merge și pentru șabloanele B-Fit, care nu sunt în baza de date)
function estePlanModificat() {
  if (!planActiv || esteModClientaShare) return false;
  if (amprentaPlanInitial === null) return !planActiv.id && !estePlanNouGol();
  return amprentaPlanului(planActiv) !== amprentaPlanInitial;
}

// Rulează `continua` direct sau, dacă ar pierde modificări nesalvate, doar după confirmare
function dupaConfirmareModificariPlan(continua) {
  if (!estePlanModificat()) { continua(); return; }
  customConfirm(
    tr("Modificări nesalvate", "Unsaved changes"),
    tr("Ai modificări nesalvate în plan. Renunți la ele?", "You have unsaved changes in the plan. Discard them?"),
    continua
  );
}

// Închiderea paginii cu modificări nesalvate (desktop; pe telefon browserul nu o mai cere mereu)
window.addEventListener('beforeunload', (e) => {
  if (estePlanModificat()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// După „renunț”: planul revine la varianta salvată (sau la planul gol), ca să nu rămână modificările în memorie
function renuntaLaModificariPlan() {
  const salvat = planActiv && planActiv.id ? (DB.planuri || []).find(p => String(p.id) === String(planActiv.id)) : null;
  planActiv = salvat ? JSON.parse(JSON.stringify(salvat)) : construiesteSablonPlanDefault();
  retinePlanInitial();
}

function selecteazaPlanDinLista(idPlan) {
  if (estePlanModificat()) {
    // Lista arată din nou planul curent cât timp așteaptă răspunsul
    populeazaSelectorPlanuri();
    dupaConfirmareModificariPlan(() => {
      renuntaLaModificariPlan();
      incarcaPlanDinLista(idPlan);
    });
    return;
  }
  incarcaPlanDinLista(idPlan);
}

function incarcaPlanDinLista(idPlan) {
  if (!idPlan) {
    planActiv = construiesteSablonPlanDefault();
    bibliotecaPlanuri = true;
    retinePlanInitial();
    randeazaPlanAntrenamentUI();
    return;
  }
  if (idPlan === 'gol') {
    pornestePlanNou();
    return;
  }
  if (String(idPlan).startsWith('sablon:')) {
    incarcaSablonPlan(Number(String(idPlan).slice(7)));
    return;
  }
  const gasit = (DB.planuri || []).find(p => String(p.id) === String(idPlan));
  if (gasit) {
    planActiv = JSON.parse(JSON.stringify(gasit));
    bibliotecaPlanuri = false;
    retinePlanInitial();
    populeazaSelectorPlanuri();
    randeazaPlanAntrenamentUI();
  }
}

// Șablon din listă: planul nou e o copie; modificările nu ating șablonul și se salvează în bază doar la „Salvează”
function incarcaSablonPlan(idx) {
  const s = idx >= 0 ? sabloanePlan()[idx] : null;
  if (!s) { pornestePlanNou(); return; }
  const copie = JSON.parse(JSON.stringify(s));
  pornestePlanNou({ id: null, clienta: '', titlu: copie.titlu, subtitlu: copie.subtitlu, continut_json: copie.continut_json },
    tr('✓ Șablon încărcat. Modifică-l și apasă Salvează.', '✓ Template loaded. Edit it and press Save.'));
}

// Progresul clientului nu se copiază: planul nou (variantă sau trimis) pornește curat
function continutFaraProgres(cjson) {
  const continut = JSON.parse(JSON.stringify(cjson || {}));
  delete continut.istoric_saptamani;
  (continut.sesiuni || []).forEach(ses => {
    delete ses.nota_client;
    (ses.exercitii || []).forEach(ex => {
      ex.greutate_kg = ''; ex.seturi_finalizate = ''; ex.status = '';
      delete ex.serii;
      delete ex.nota_client;
    });
  });
  return continut;
}

// „Salvează ca nou”: o variantă a planului, salvată separat; originalul rămâne cum era salvat
async function salveazaPlanCaNou() {
  if (!planActiv?.id) return;
  const original = (planActiv.titlu || '').trim();
  planActiv = Object.assign({}, planActiv, {
    id: null,
    titlu: `${original} (${tr('variantă', 'variant')})`,
    continut_json: continutFaraProgres(planActiv.continut_json)
  });
  const salvat = await salveazaPlanCurentInBaza(true);
  randeazaPlanAntrenamentUI();
  if (salvat) showToast(tr('✓ Salvat ca plan nou. Originalul a rămas neschimbat; poți redenumi varianta.', '✓ Saved as a new plan. The original is unchanged; you can rename the variant.'));
  else showToast(tr('Planul nou nu s-a putut salva.', 'Could not save the new plan.'), 'error');
}

// ---- Trimite la clienți: fiecare client ales primește o copie a planului, fără progres ----
// Baza leagă copia de client după nume (trigger leaga_plan_de_client) și îi trimite notificarea „plan nou”.
function deschideTrimitePlan() {
  if (!(planActiv?.titlu || '').trim()) {
    showToast(tr('Adaugă un titlu planului înainte să-l trimiți!', 'Add a plan title before sending!'), 'error');
    return;
  }
  const titlu = planActiv.titlu.trim();
  const clienti = (DB.clienti || []).filter(c => !/^(arhivat|archived)$/i.test(c.status || ''));
  const lista = document.getElementById('listaTrimitePlan');
  lista.innerHTML = clienti.length ? clienti.map(c => {
    const areDeja = (DB.planuri || []).some(p => cheieNume(p.clienta) === cheieNume(c.nume) && (p.titlu || '').trim() === titlu);
    const eticheta = [areDeja ? tr('are deja planul', 'already has it') : '', !c.contConectat ? tr('fără cont: folosește Distribuie', 'no account: use Share') : ''].filter(Boolean).join(' · ');
    return `<label class="trimite-plan-rand" data-nume="${escAttr(cheieNume(c.nume))}">
      <input type="checkbox" value="${escAttr(c.nume)}" onchange="actualizeazaButonTrimitePlan()">
      <span class="trimite-plan-text">
        <span class="trimite-plan-nume">${escAttr(c.nume)}</span>
        ${eticheta ? `<span class="trimite-plan-eticheta">${eticheta}</span>` : ''}
      </span>
    </label>`;
  }).join('') : `<div class="plan-picker-empty">${tr('Nu ai clienți activi.', 'You have no active clients.')}</div>`;
  document.getElementById('cautareTrimitePlan').value = '';
  actualizeazaButonTrimitePlan();
  document.getElementById('modalTrimitePlanBackdrop').style.display = 'flex';
}

function inchideTrimitePlan() {
  document.getElementById('modalTrimitePlanBackdrop').style.display = 'none';
}

function filtreazaTrimitePlan(text) {
  const cautat = cheieNume(text);
  document.querySelectorAll('#listaTrimitePlan .trimite-plan-rand').forEach(r => {
    r.style.display = !cautat || r.dataset.nume.includes(cautat) ? '' : 'none';
  });
}

function clientiAlesiTrimitePlan() {
  return [...document.querySelectorAll('#listaTrimitePlan input:checked')].map(i => i.value);
}

function actualizeazaButonTrimitePlan() {
  const n = clientiAlesiTrimitePlan().length;
  const btn = document.getElementById('btnTrimitePlanConfirma');
  btn.innerText = n ? tr(`Trimite la ${n} ${n === 1 ? 'client' : 'clienți'}`, `Send to ${n} ${n === 1 ? 'client' : 'clients'}`) : tr('Alege clienții', 'Choose clients');
  btn.classList.toggle('btn-clear-disabled', !n);
}

async function trimitePlanLaClienti() {
  const alesi = clientiAlesiTrimitePlan();
  const btn = document.getElementById('btnTrimitePlanConfirma');
  if (!alesi.length || btn.disabled) return;
  btn.disabled = true;
  try {
    // Planul trimis rămâne și la antrenor: cel nou sau modificat se salvează întâi
    if (!planActiv.id || estePlanModificat()) {
      if (!await salveazaPlanCurentInBaza(true)) {
        showToast(tr('Planul nu s-a putut salva. Încearcă din nou.', 'Could not save the plan. Try again.'), 'error');
        return;
      }
    }
    const continut = continutFaraProgres(planActiv.continut_json);
    const acum = new Date().toISOString();
    const randuri = alesi.map(nume => ({
      user_id: utilizatorCurent.id,
      clienta: nume,
      titlu: planActiv.titlu.trim(),
      subtitlu: (planActiv.subtitlu || '').trim(),
      continut_json: continut,
      updated_at: acum
    }));
    const { data, error } = await supabaseClient.from('planuri_antrenament').insert(randuri).select();
    if (error) throw error;
    DB.planuri = (data || []).concat(DB.planuri || []);
    try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch (e) {}
    populeazaSelectorPlanuri();
    inchideTrimitePlan();
    showToast(tr(`✓ Trimis la ${alesi.length} ${alesi.length === 1 ? 'client' : 'clienți'}. Îl găsești în fișa clientului.`, `✓ Sent to ${alesi.length} ${alesi.length === 1 ? 'client' : 'clients'}. Find it in the client's profile.`));
  } catch (err) {
    console.error("Eroare trimitere plan:", err);
    showToast(tr('Eroare la trimitere: ', 'Error sending: ') + (err.message || ''), 'error');
  } finally {
    btn.disabled = false;
  }
}

function pornestePlanNou(plan, mesaj) {
  planActiv = plan || construiesteSablonPlanDefault();
  bibliotecaPlanuri = false;
  retinePlanInitial();
  esteModPrevizualizarePdf = false;
  const btnTxt = document.getElementById('btnPreviewPlanText');
  if (btnTxt) btnTxt.innerText = t('btnPreviewPdfMode');
  const sel = document.getElementById('selectPlanExistent');
  if (sel) {
    sel.value = '';
    actualizeazaStilSelect(sel);
    sincronizeazaListaPlanuri();
  }
  randeazaPlanAntrenamentUI();
  showToast(mesaj || (currentLang === 'en' ? '✓ New plan started!' : '✓ Plan nou început!'));
}

function comutaModPrevizualizarePlan() {
  esteModPrevizualizarePdf = !esteModPrevizualizarePdf;
  const btnTxt = document.getElementById('btnPreviewPlanText');
  if (btnTxt) {
    btnTxt.innerText = esteModPrevizualizarePdf ? t('btnEditMode') : t('btnPreviewPdfMode');
  }
  randeazaPlanAntrenamentUI();
}

// Iconița de coș pentru butoanele de ștergere din plan (zi, secțiuni, exerciții), aceeași ca pe Programări
const SVG_COS_PLAN = '<svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

// La editare, planul arată zilele ca listă de carduri; o zi se deschide pe pagina ei.
// Ziua deschisă ține de obiectul planului, deci orice alt plan încărcat pornește de la listă.
let ziDeschisaPlan = null; // { plan, idx }

function indexZiDeschisaPlan() {
  const z = ziDeschisaPlan;
  return (z && z.plan === planActiv && planActiv.continut_json?.sesiuni?.[z.idx]) ? z.idx : null;
}

function deschideZiPlan(idx) {
  ziDeschisaPlan = { plan: planActiv, idx };
  randeazaPlanAntrenamentUI();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function inchideZiPlan() {
  const idx = indexZiDeschisaPlan();
  ziDeschisaPlan = null;
  randeazaPlanAntrenamentUI();
  const card = idx !== null ? document.getElementById('planZiCard' + idx) : null;
  if (card) card.scrollIntoView({ block: 'center', behavior: 'auto' });
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

// ---- Biblioteca de planuri: pagina de pornire (șabloanele B-Fit și ale antrenorului); planurile clienților sunt în fișe ----
let bibliotecaPlanuri = true;
let filtruBiblioteca = { text: '', tip: 'toate' };

// Durata estimată a unei zile: serii × (lucru + pauză), plus pregătirea aparatului; rotunjită la 5 minute
function durataZiMin(ses) {
  let sec = 0;
  (ses.exercitii || []).filter(ex => (ex.exercitiu || '').trim()).forEach(ex => {
    const { nr, tinta } = seriiPlanificate(ex);
    const numar = t => { const m = String(t || '').match(/(\d+)/); return m ? +m[1] : 0; };
    if (ex.tip === 'min') { sec += (numar(ex.seturi_repetari) || 15) * 60; return; }
    const lucru = ex.tip === 'sec' ? (numar(tinta) || 45) : 40;
    let pauza = numar(ex.pauza) || 60;
    if (/min/i.test(ex.pauza || '') && pauza < 10) pauza *= 60;
    sec += nr * lucru + (nr - 1) * pauza + 60;
  });
  return Math.max(5, Math.round(sec / 300) * 5);
}

// Grupa musculară după primul mușchi din listă (cel principal)
function grupaMusculara(ex) {
  const m = cheieNume((ex.muschi || '').split(',')[0]);
  const reguli = [['fesier', 'Fesieri'], ['glute', 'Fesieri'], ['biceps femural', 'Femurali'], ['femural', 'Femurali'], ['lant posterior', 'Lanț posterior'],
    ['cvadriceps', 'Cvadriceps'], ['gamb', 'Gambe'], ['dorsal', 'Spate'], ['spate', 'Spate'], ['romboid', 'Spate'], ['trapez', 'Spate'],
    ['pectoral', 'Piept'], ['piept', 'Piept'], ['deltoid', 'Umeri'], ['umer', 'Umeri'], ['triceps', 'Triceps'], ['biceps', 'Biceps'],
    ['core', 'Core'], ['abdom', 'Core'], ['oblic', 'Core'], ['oblique', 'Core'], ['transvers', 'Core'], ['cardio', 'Cardio'],
    // Mușchii din șabloanele în engleză
    ['hamstring', 'Femurali'], ['posterior chain', 'Lanț posterior'], ['quadriceps', 'Cvadriceps'], ['calves', 'Gambe'], ['calf', 'Gambe'],
    ['lats', 'Spate'], ['back', 'Spate'], ['rhomboid', 'Spate'], ['chest', 'Piept'], ['shoulder', 'Umeri']];
  const r = reguli.find(([cheie]) => m.includes(cheie));
  const en = { 'Fesieri': 'Glutes', 'Femurali': 'Hamstrings', 'Lanț posterior': 'Posterior chain', 'Cvadriceps': 'Quads', 'Gambe': 'Calves',
    'Spate': 'Back', 'Piept': 'Chest', 'Umeri': 'Shoulders' };
  return r ? tr(r[1], en[r[1]] || r[1]) : '';
}

function rezumatPlan(cjson) {
  const sesiuni = (cjson && cjson.sesiuni) || [];
  const exercitii = sesiuni.flatMap(s => (s.exercitii || []).filter(ex => (ex.exercitiu || '').trim()));
  const durate = sesiuni.filter(s => (s.exercitii || []).some(ex => (ex.exercitiu || '').trim())).map(durataZiMin);
  const volum = {};
  exercitii.forEach(ex => { const g = grupaMusculara(ex); if (g) volum[g] = (volum[g] || 0) + seriiPlanificate(ex).nr; });
  return {
    zile: sesiuni.length,
    exercitii: exercitii.length,
    minute: durate.length ? Math.round(durate.reduce((a, b) => a + b, 0) / durate.length / 5) * 5 : 0,
    volum: Object.entries(volum).sort((a, b) => b[1] - a[1])
  };
}

function elementeBiblioteca() {
  const bfit = sabloanePlan().map((s, i) => ({
    cheie: 'sablon:' + i, titlu: s.titlu, detalii: s.focus, nrZile: s.nr_zile, bfit: true, plan: s
  }));
  const ale = (DB.planuri || []).filter(p => !(p.clienta || '').trim())
    .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
    .map(p => ({ cheie: p.id, titlu: p.titlu, detalii: p.subtitlu, nrZile: (p.continut_json?.sesiuni || []).length, bfit: false, plan: p }));
  return ale.concat(bfit);
}

function randeazaBibliotecaPlanuri(container) {
  const chip = (tip, text) => `<button type="button" class="plan-chip${filtruBiblioteca.tip === tip ? ' is-activ' : ''}" onclick="filtreazaBiblioteca('${tip}')">${text}</button>`;
  container.innerHTML = `
    <div class="biblioteca-antet">
      <input type="search" class="form-control" id="cautareBiblioteca" value="${escAttr(filtruBiblioteca.text)}" placeholder="${tr('Caută plan sau exercițiu', 'Search plan or exercise')}" oninput="filtruBiblioteca.text = this.value; actualizeazaListaBiblioteca()">
      <div class="plan-chips" id="chipsBiblioteca">
        ${chip('toate', tr('Toate', 'All'))}${chip('bfit', 'B-Fit')}${chip('ale', tr('Ale mele', 'Mine'))}${chip('2', tr('2 zile', '2 days'))}${chip('3', tr('3 zile', '3 days'))}${chip('4', tr('4 zile', '4 days'))}${chip('5', tr('5 zile', '5 days'))}
      </div>
    </div>
    <button type="button" class="plan-zi-card biblioteca-nou" onclick="incarcaPlanDinLista('gol')">
      <span class="plan-zi-card-text">
        <span class="plan-zi-card-titlu">${tr('Plan nou', 'New plan')}</span>
        <span class="plan-zi-card-detalii">${tr('Pornești de la o pagină goală', 'Start from a blank page')}</span>
      </span>
      <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <div id="bibliotecaLista" class="plan-fisa-lista"></div>
  `;
  actualizeazaListaBiblioteca();
}

function filtreazaBiblioteca(tip) {
  filtruBiblioteca.tip = tip;
  document.querySelectorAll('#chipsBiblioteca .plan-chip').forEach(b => b.classList.toggle('is-activ', b.getAttribute('onclick').includes(`'${tip}'`)));
  actualizeazaListaBiblioteca();
}

function actualizeazaListaBiblioteca() {
  const lista = document.getElementById('bibliotecaLista');
  if (!lista) return;
  const cautat = cheieNume(filtruBiblioteca.text);
  const tip = filtruBiblioteca.tip;
  const potriviri = elementeBiblioteca().filter(el => {
    if (tip === 'bfit' && !el.bfit) return false;
    if (tip === 'ale' && el.bfit) return false;
    if (tip === '2' && el.nrZile !== 2) return false;
    if (tip === '3' && el.nrZile !== 3) return false;
    if (tip === '4' && el.nrZile !== 4) return false;
    if (tip === '5' && el.nrZile !== 5) return false;
    if (!cautat) return true;
    const exercitii = (el.plan.continut_json?.sesiuni || []).flatMap(s => (s.exercitii || []).map(ex => ex.exercitiu || ''));
    return [el.titlu, ...exercitii].some(t => cheieNume(t).includes(cautat));
  });
  lista.innerHTML = potriviri.length ? potriviri.map(el => {
    const r = rezumatPlan(el.plan.continut_json);
    const trimis = (DB.planuri || []).filter(p => (p.clienta || '').trim() && (p.titlu || '').trim() === (el.titlu || '').trim()).length;
    return `<button type="button" class="plan-zi-card" onclick="incarcaPlanDinLista('${escAttr(el.cheie)}')">
      <span class="plan-zi-card-text">
        <span class="plan-zi-card-titlu">${escAttr(el.titlu || tr('Plan fără titlu', 'Untitled plan'))}</span>
        ${el.detalii ? `<span class="plan-zi-card-detalii">${escAttr(el.detalii)}</span>` : ''}
        <span class="plan-tags">
          <span class="plan-tag">${r.exercitii} ${tr('exerciții', 'exercises')}</span>
          ${r.minute ? `<span class="plan-tag">~${r.minute} min/${tr('zi', 'day')}</span>` : ''}
          ${el.bfit ? '<span class="plan-tag is-bfit">B-Fit</span>' : ''}
          ${trimis ? `<span class="plan-tag">${tr('trimis la', 'sent to')} ${trimis}</span>` : ''}
        </span>
      </span>
      <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>`;
  }).join('') : `<div class="plan-picker-empty">${tr('Niciun plan nu se potrivește.', 'No plan matches.')}</div>`;
}

// Titlul planului trece pe al doilea rând când e lung (câmp care crește cu textul); rândurile noi lipite devin spații
function potrivesteInaltimeTitlu(camp) {
  if (/[\r\n]/.test(camp.value)) camp.value = camp.value.replace(/[\r\n]+/g, ' ');
  camp.style.height = 'auto';
  // Pe o pagină ascunsă înălțimea e 0: câmpul rămâne pe un rând până la următoarea afișare
  camp.style.height = camp.scrollHeight ? (camp.scrollHeight + camp.offsetHeight - camp.clientHeight) + 'px' : '';
  return camp.value;
}

// Bara de jos apare doar când e deschis un plan (nu în bibliotecă, nu pe linkul clientului)
function actualizeazaBaraPlan(vizibil) {
  const bara = document.getElementById('planBaraActiuni');
  const tab = document.getElementById('tabPlanAntrenament');
  if (bara) bara.style.display = vizibil ? 'flex' : 'none';
  if (tab) tab.classList.toggle('cu-bara-plan', !!vizibil);
  comutaMeniuMaiMulte(false);
}

function comutaMeniuMaiMulte(deschide) {
  const meniu = document.getElementById('planMeniuMaiMulte');
  if (!meniu) return;
  const deschis = typeof deschide === 'boolean' ? deschide : meniu.style.display === 'none';
  if (deschis) {
    const optiune = (text, actiune, cls) => `<button type="button" class="plan-meniu-optiune${cls ? ' ' + cls : ''}" onclick="comutaMeniuMaiMulte(false); ${actiune}">${text}</button>`;
    meniu.innerHTML = [
      optiune(esteModPrevizualizarePdf ? tr('Editare', 'Edit') : tr('Mod PDF', 'PDF mode'), 'comutaModPrevizualizarePlan()'),
      optiune(tr('Distribuie (link, PDF, text)', 'Share (link, PDF, text)'), 'deschideModalSharePlan()'),
      planActiv && planActiv.id ? optiune(tr('Salvează ca nou', 'Save as new'), 'salveazaPlanCaNou()') : '',
      estePlanNouGol() ? '' : optiune(planActiv && planActiv.id ? tr('Șterge planul', 'Delete plan') : tr('Renunță la planul nou', 'Discard new plan'), 'stergePlanCurent()', 'is-pericol')
    ].join('');
  }
  meniu.style.display = deschis ? 'flex' : 'none';
}

document.addEventListener('click', (e) => {
  const meniu = document.getElementById('planMeniuMaiMulte');
  if (meniu && meniu.style.display !== 'none' && !e.target.closest('#planMeniuMaiMulte, #btnPlanMaiMulte')) comutaMeniuMaiMulte(false);
});

// Din plan înapoi la bibliotecă (cu confirmare dacă sunt modificări nesalvate)
function inapoiLaBiblioteca() {
  dupaConfirmareModificariPlan(() => {
    renuntaLaModificariPlan();
    esteModPrevizualizarePdf = false;
    ziDeschisaPlan = null;
    bibliotecaPlanuri = true;
    retinePlanInitial();
    randeazaPlanAntrenamentUI();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function randeazaPlanAntrenamentUI() {
  const container = document.getElementById('planDocumentContainer');
  if (!container) return;
  if (!planActiv) planActiv = construiesteSablonPlanDefault();

  // La antrenor, bara veche de sus e înlocuită de bibliotecă și de bara de acțiuni de jos
  const baraVeche = document.getElementById('planCoachToolbar');
  if (baraVeche && !esteModClientaShare) baraVeche.style.display = 'none';
  if (bibliotecaPlanuri && !esteModClientaShare) {
    actualizeazaBaraPlan(false);
    randeazaBibliotecaPlanuri(container);
    return;
  }
  actualizeazaBaraPlan(!esteModClientaShare);

  const cjson = planActiv.continut_json || {};
  if (!Array.isArray(cjson.sectiuni_inceput)) cjson.sectiuni_inceput = [];
  if (!Array.isArray(cjson.sesiuni)) cjson.sesiuni = [];
  if (!Array.isArray(cjson.sectiuni_final)) cjson.sectiuni_final = [];

  const doarCitireStructura = esteModPrevizualizarePdf || esteModClientaShare;
  if (!doarCitireStructura) actualizeazaListaExercitii();
  // Lista zilelor la editare și pe linkul clientului (dacă are mai multe zile); în Mod PDF rămâne tot planul pe o pagină
  const cuListaZile = !esteModPrevizualizarePdf && (!esteModClientaShare || cjson.sesiuni.length > 1);
  const ziIdx = cuListaZile ? indexZiDeschisaPlan() : null;
  const peZi = ziIdx !== null;

  let html = '';

  if (peZi) {
    html += `
      <div class="plan-zi-bara no-print">
        <button type="button" class="btn btn-clear plan-zi-inapoi" onclick="inchideZiPlan()">
          <svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg> ${tr('Toate zilele', 'All days')}
        </button>
        <span class="plan-zi-bara-titlu">${escAttr(planActiv.titlu || tr('Plan nou', 'New plan'))}</span>
      </div>
    `;
  } else if (doarCitireStructura) {
    html += `
      <div class="plan-header-block">
        <div style="font-size:1.3rem; font-weight:800; color:var(--primary); line-height:1.25;">${escAttr(planActiv.titlu)}</div>
        <div style="font-size:0.83rem; font-weight:600; color:var(--text-muted); margin-top:4px;">${escAttr(planActiv.subtitlu)}</div>
        ${planActiv.clienta ? `<div style="margin-top:6px; font-size:0.78rem; font-weight:700; color:var(--primary);"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${tr('Client', 'Client')}: ${escAttr(planActiv.clienta)}</div>` : ''}
      </div>
    `;
  } else {
    // Planul unui client se deschide din fișa lui; planurile din bibliotecă nu au client
    const rez = rezumatPlan(cjson);
    const maxVolum = rez.volum.length ? rez.volum[0][1] : 1;
    html += `
      <div class="plan-sus no-print">
        <button type="button" class="plan-inapoi-biblioteca" onclick="${planDeschisDinFisa ? 'gestioneazaClickStangaHeader(event)' : 'inapoiLaBiblioteca()'}">
          <svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg> ${planDeschisDinFisa ? tr('Fișa clientului', 'Client profile') : tr('Biblioteca', 'Library')}
        </button>
        ${(planActiv.clienta || '').trim() ? `<span class="plan-tag plan-pentru">${tr('Plan pentru', 'Plan for')}: ${escAttr(planActiv.clienta)}</span>` : ''}
      </div>
      <div class="plan-header-block">
        <textarea class="plan-doc-title-input" rows="1" placeholder="${tr('Titlu program (ex: Program de forță generală)', 'Program title (e.g. General strength program)')}" oninput="planActiv.titlu = potrivesteInaltimeTitlu(this)" onkeydown="if (event.key === 'Enter') event.preventDefault()">${escAttr(planActiv.titlu)}</textarea>
        <input type="text" class="plan-doc-subtitle-input" value="${escAttr(planActiv.subtitlu)}" placeholder="${tr('Subtitlu / detalii (ex: 3 sesiuni pe săptămână)', 'Subtitle / details (e.g. 3 sessions per week)')}" oninput="planActiv.subtitlu = this.value">
        <div class="plan-tags no-print">
          <span class="plan-tag">${rez.zile} ${rez.zile === 1 ? tr('zi în plan', 'day in plan') : tr('zile în plan', 'days in plan')}</span>
          <span class="plan-tag">${rez.exercitii} ${tr('exerciții', 'exercises')}</span>
          ${rez.minute ? `<span class="plan-tag">~${rez.minute} min/${tr('zi', 'day')}</span>` : ''}
        </div>
        ${rez.volum.length ? `<details class="plan-volum no-print">
          <summary>${tr('Volum pe grupe musculare', 'Volume by muscle group')}</summary>
          <div class="plan-volum-nota">${tr('Serii pe toate zilele planului', 'Sets across all plan days')}</div>
          ${rez.volum.map(([g, n]) => `<div class="plan-volum-rand"><span>${escAttr(g)}</span><span class="plan-volum-bara"><span style="width:${Math.round(n / maxVolum * 100)}%"></span></span><b>${n}</b></div>`).join('')}
        </details>` : ''}
      </div>
    `;
  }

  (peZi ? [] : cjson.sectiuni_inceput).forEach((sec, sIdx) => {
    if (doarCitireStructura) {
      html += `
        <div class="plan-info-box">
          <div style="font-size:0.92rem; font-weight:800; color:var(--primary); margin-bottom:5px;">${escAttr(sec.titlu)}</div>
          <div class="plan-info-rendered-text">${htmlTextPlan(sec.continut)}</div>
        </div>
      `;
    } else {
      html += `
        <div class="plan-info-box">
          <div class="plan-info-box-header">
            <input type="text" class="plan-info-title-input" value="${escAttr(sec.titlu)}" placeholder="${tr('Titlu secțiune (ex: Recomandări)', 'Section title (e.g. Recommendations)')}" oninput="planActiv.continut_json.sectiuni_inceput[${sIdx}].titlu = this.value">
            <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSectiuneTextPlan('sectiuni_inceput', ${sIdx})" title="${tr('Șterge secțiunea', 'Delete section')}">${SVG_COS_PLAN}</button>
          </div>
          <textarea class="plan-info-textarea" placeholder="${tr('Adaugă indicațiile aici...', 'Add your notes here...')}" oninput="planActiv.continut_json.sectiuni_inceput[${sIdx}].continut = this.value">${escAttr(sec.continut)}</textarea>
        </div>
      `;
    }
  });

  if (!doarCitireStructura && !peZi) {
    html += `
      <div class="no-print" style="margin-bottom:12px;">
        <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 9px;" onclick="adaugaSectiuneTextPlan('sectiuni_inceput')">
          ${tr('+ Adaugă Secțiune Introductivă (Principii / Încălzire)', '+ Add Intro Section (Principles / Warm-up)')}
        </button>
      </div>
    `;
  }

  cjson.sesiuni.forEach((ses, sesIdx) => {
    const listaEx = ses.exercitii || [];

    if (peZi && sesIdx !== ziIdx) return;
    if (cuListaZile && !peZi) {
      html += htmlCardZiPlan(ses, sesIdx, `deschideZiPlan(${sesIdx})`, esteModClientaShare);
      return;
    }

    html += `
      <div class="plan-session-block">
        <div class="plan-session-header">
          ${doarCitireStructura
            ? `<div style="font-size:0.95rem; font-weight:800; color:var(--primary);">${escAttr(ses.titlu)}</div>`
            : `<input type="text" class="plan-session-title-input" value="${escAttr(ses.titlu)}" placeholder="${tr('Titlu Sesiune / Zi', 'Session / Day title')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].titlu = this.value">
               <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSesiunePlan(${sesIdx})" title="${tr('Șterge toată ziua/sesiunea', 'Delete the whole day/session')}">${SVG_COS_PLAN}</button>`
          }
        </div>
        ${ses.nota_client && !esteModClientaShare ? `<div class="plan-nota-client plan-nota-sesiune"><b>${tr('Clientul despre antrenament', 'Client about the workout')}:</b> ${escAttr(ses.nota_client)}</div>` : ''}

        <table class="plan-exercises-table">
          <thead>
            <tr>
              <th style="width:22%;">${tr('Exercițiu', 'Exercise')}</th>
              <th style="width:12%;">${tr('Serii × repetări', 'Sets × reps')}</th>
              <th style="width:10%;">${tr('Pauză', 'Rest')}</th>
              <th style="width:28%;">${tr('Cum se execută / Indicații', 'How to perform / Notes')}</th>
              <th style="width:9%;">${tr('Greutate (kg)', 'Weight (kg)')}</th>
              <th style="width:9%;">${tr('Serii făcute', 'Sets done')}</th>
              <th style="width:10%;">Status</th>
              ${!doarCitireStructura ? `<th class="no-print" style="width:28px;"></th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    listaEx.forEach((ex, exIdx) => {
      const nrAfisat = ex.nr || (exIdx + 1);
      const stVal = ex.status || '';
      const pillCls = getPillClass(stVal);

      if (esteModPrevizualizarePdf) {
        html += `
          <tr>
            <td style="font-weight:700;">${nrAfisat}. ${escAttr(ex.exercitiu)}</td>
            <td style="font-weight:700; white-space:nowrap;" data-eticheta="${tr('Serii × repetări', 'Sets × reps')}">${escAttr(ex.seturi_repetari)}</td>
            <td style="white-space:nowrap;" data-eticheta="${tr('Pauză', 'Rest')}">${escAttr(ex.pauza || '-')}</td>
            <td data-eticheta="${tr('Indicații', 'Notes')}">${escAttr(ex.indicatii)}</td>
            <td style="text-align:center; font-weight:700;" data-eticheta="${tr('Greutate (kg)', 'Weight (kg)')}">${escAttr(ex.greutate_kg || '')}</td>
            <td style="text-align:center; font-weight:700;" data-eticheta="${tr('Serii făcute', 'Sets done')}">${escAttr(ex.seturi_finalizate || '')}</td>
            <td style="text-align:center; font-weight:700;">${escAttr(traduceValoare(stVal))}</td>
          </tr>
        `;
      } else if (esteModClientaShare) {
        html += `
          <tr>
            <td>
              <div style="font-weight:800; color:var(--primary); font-size:0.84rem;">${nrAfisat}. ${escAttr(ex.exercitiu)}</div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--text); margin-top:2px;">
                <svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5"/></svg> ${tr('Serii × repetări', 'Sets × reps')}: ${escAttr(ex.seturi_repetari)} ${ex.pauza ? ` • <svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> ${tr('Pauză', 'Rest')}: ${escAttr(ex.pauza)}` : ''}
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">
                ${escAttr(ex.indicatii)}
              </div>
              <div class="plan-tracking-grid">
                <div class="plan-tracking-field">
                  <span class="plan-tracking-label">${tr('Greutate (kg)', 'Weight (kg)')}</span>
                  <input type="text" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="-" readonly>
                </div>
                <div class="plan-tracking-field">
                  <span class="plan-tracking-label">${tr('Serii făcute', 'Sets done')}</span>
                  <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="-" readonly>
                </div>
                <div class="plan-tracking-field plan-tracking-status">
                  <span class="plan-tracking-label">Status</span>
                  <select class="pill-select plan-status-select ${pillCls}" disabled>
                    <option value="" ${stVal === "" ? "selected" : ""}>Status</option>
                    <option value="Finalizat" ${stVal === 'Finalizat' ? 'selected' : ''}>${traduceValoare('Finalizat')}</option>
                    <option value="Sărit" ${stVal === 'Sărit' ? 'selected' : ''}>${traduceValoare('Sărit')}</option>
                  </select>
                </div>
              </div>
            </td>
          </tr>
        `;
      } else {
        html += `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:4px;">
                <span style="font-weight:800; color:var(--primary); font-size:0.76rem;">${nrAfisat}.</span>
                <input type="text" class="plan-ex-input" style="font-weight:700;" value="${escAttr(ex.exercitiu)}" placeholder="${tr('Nume exercițiu', 'Exercise name')}" list="listaExercitiiPlan" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].exercitiu = this.value" onchange="completeazaExercitiuCunoscut(${sesIdx}, ${exIdx})">
              </div>
              ${ex.muschi ? `<div class="plan-ex-muschi">${escAttr(ex.muschi)}</div>` : ''}
              <button type="button" class="plan-inlocuieste-btn no-print" onclick="deschideInlocuiesteExercitiu(${sesIdx}, ${exIdx})">${(ex.exercitiu || '').trim() ? `⇄ ${tr('Înlocuiește', 'Swap')}` : tr('Alege din bibliotecă', 'Choose from library')}</button>
              ${ex.nota_client ? `<div class="plan-nota-client"><b>${tr('Notița clientului', 'Client note')}:</b> ${escAttr(ex.nota_client)}</div>` : ''}
            </td>
            <td data-eticheta="${tr('Serii × repetări', 'Sets × reps')}">
              <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_repetari)}" placeholder="${tr('ex. 4×12 sau 3×30 sec', 'e.g. 4×12 or 3×30 sec')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].seturi_repetari = this.value">
            </td>
            <td data-eticheta="${tr('Pauză', 'Rest')}">
              <input type="text" class="plan-ex-input" value="${escAttr(ex.pauza)}" placeholder="${tr('Pauză (sec)', 'Rest (sec)')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].pauza = this.value">
            </td>
            <td data-eticheta="${tr('Indicații', 'Notes')}">
              <textarea class="plan-ex-textarea" placeholder="${tr('Indicații tehnice / cum se execută...', 'Technique notes / how to perform...')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].indicatii = this.value">${escAttr(ex.indicatii)}</textarea>
            </td>
            <td data-eticheta="${tr('Greutate (kg)', 'Weight (kg)')}">
              <input type="text" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="Kg" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].greutate_kg = this.value">
            </td>
            <td data-eticheta="${tr('Serii făcute', 'Sets done')}">
              <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="${tr('Serii', 'Sets')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].seturi_finalizate = this.value">
            </td>
            <td>
              <select class="pill-select plan-status-select ${pillCls}" onchange="this.className='pill-select plan-status-select '+getPillClass(this.value); planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].status = this.value">
                <option value="" ${stVal === "" ? "selected" : ""}>Status</option>
                <option value="În așteptare" ${stVal === 'În așteptare' ? 'selected' : ''}>${traduceValoare('În așteptare')}</option>
                <option value="Finalizat" ${stVal === 'Finalizat' ? 'selected' : ''}>${traduceValoare('Finalizat')}</option>
                <option value="Sărit" ${stVal === 'Sărit' ? 'selected' : ''}>${traduceValoare('Sărit')}</option>
              </select>
            </td>
            <td class="no-print" style="text-align:center; vertical-align:middle;">
              <button type="button" class="btn-trash-action btn-trash-plan" onclick="stergeExercitiuPlan(${sesIdx}, ${exIdx})" title="${tr('Șterge exercițiul', 'Delete exercise')}">${SVG_COS_PLAN}</button>
            </td>
          </tr>
        `;
      }
    });

    html += `
          </tbody>
        </table>
        ${!doarCitireStructura ? `
          <div class="no-print" style="padding:7px 10px; background:rgba(var(--primary-rgb),0.04); border-top:1px solid var(--border);">
            <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 10px;" onclick="adaugaExercitiuPlan(${sesIdx})">
              ${tr('+ Adaugă Exercițiu în această sesiune', '+ Add Exercise to this session')}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  });

  if (!doarCitireStructura && !peZi) {
    html += `
      <div class="no-print" style="margin-bottom:14px;">
        <button type="button" class="btn" style="font-size:0.78rem; padding:7px 12px; width:100%;" onclick="adaugaSesiunePlan()">
          <svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> ${tr('Adaugă Zi / Sesiune Nouă de Antrenament', 'Add New Workout Day / Session')}
        </button>
      </div>
    `;
  }

  (peZi ? [] : cjson.sectiuni_final).forEach((sec, sIdx) => {
    if (doarCitireStructura) {
      html += `
        <div class="plan-info-box">
          <div style="font-size:0.92rem; font-weight:800; color:var(--primary); margin-bottom:5px;">${escAttr(sec.titlu)}</div>
          <div class="plan-info-rendered-text">${htmlTextPlan(sec.continut)}</div>
        </div>
      `;
    } else {
      html += `
        <div class="plan-info-box">
          <div class="plan-info-box-header">
            <input type="text" class="plan-info-title-input" value="${escAttr(sec.titlu)}" placeholder="${tr('Titlu secțiune (ex: Recomandări)', 'Section title (e.g. Recommendations)')}" oninput="planActiv.continut_json.sectiuni_final[${sIdx}].titlu = this.value">
            <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSectiuneTextPlan('sectiuni_final', ${sIdx})" title="${tr('Șterge secțiunea', 'Delete section')}">${SVG_COS_PLAN}</button>
          </div>
          <textarea class="plan-info-textarea" placeholder="${tr('Adaugă indicațiile aici...', 'Add your notes here...')}" oninput="planActiv.continut_json.sectiuni_final[${sIdx}].continut = this.value">${escAttr(sec.continut)}</textarea>
        </div>
      `;
    }
  });

  if (!doarCitireStructura && !peZi) {
    html += `
      <div class="no-print" style="margin-bottom:10px;">
        <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 9px;" onclick="adaugaSectiuneTextPlan('sectiuni_final')">
          ${tr('+ Adaugă Secțiune Finală (Siguranță / Alimentație)', '+ Add Final Section (Safety / Nutrition)')}
        </button>
      </div>
    `;
  }

  if (cjson.nota_subsol !== undefined && !peZi) {
    if (doarCitireStructura) {
      html += `<div class="plan-footer-note">${escAttr(cjson.nota_subsol)}</div>`;
    } else {
      html += `
        <div class="plan-footer-note">
          <input type="text" class="plan-ex-input" style="font-style:italic;" value="${escAttr(cjson.nota_subsol)}" placeholder="${tr('Notă de subsol...', 'Footnote...')}" oninput="planActiv.continut_json.nota_subsol = this.value">
        </div>
      `;
    }
  }

  container.innerHTML = html;
  container.querySelectorAll('textarea.plan-doc-title-input').forEach(potrivesteInaltimeTitlu);
  actualizeazaButonStergePlan();
}

function adaugaSectiuneTextPlan(cheieLista) {
  if (!planActiv || !planActiv.continut_json) return;
  planActiv.continut_json[cheieLista].push({
    titlu: "",
    continut: ""
  });
  randeazaPlanAntrenamentUI();
}

function stergeSectiuneTextPlan(cheieLista, idx) {
  if (!planActiv || !planActiv.continut_json) return;
  planActiv.continut_json[cheieLista].splice(idx, 1);
  randeazaPlanAntrenamentUI();
}

function adaugaSesiunePlan() {
  if (!planActiv || !planActiv.continut_json) return;
  const nrSes = planActiv.continut_json.sesiuni.length + 1;
  planActiv.continut_json.sesiuni.push({
    titlu: tr(`ZIUA ${nrSes}: Sesiune nouă de antrenament`, `DAY ${nrSes}: New workout session`),
    exercitii: [
      { nr: 1, exercitiu: "", seturi_repetari: "", pauza: "", indicatii: "", greutate_kg: "", seturi_finalizate: "", status: "" }
    ]
  });
  deschideZiPlan(nrSes - 1);
}

function stergeSesiunePlan(sesIdx) {
  customConfirm(tr("Ștergere sesiune", "Delete session"), tr("Sigur vrei să ștergi această sesiune și exercițiile ei?", "Are you sure you want to delete this session and its exercises?"), function() {
    planActiv.continut_json.sesiuni.splice(sesIdx, 1);
    ziDeschisaPlan = null;
    randeazaPlanAntrenamentUI();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function adaugaExercitiuPlan(sesIdx) {
  const ses = planActiv?.continut_json?.sesiuni?.[sesIdx];
  if (!ses) return;
  if (!Array.isArray(ses.exercitii)) ses.exercitii = [];
  // Seriile și pauza se preiau de la exercițiul de deasupra (de obicei sunt aceleași)
  const anterior = ses.exercitii[ses.exercitii.length - 1] || {};
  ses.exercitii.push({
    nr: ses.exercitii.length + 1,
    exercitiu: "",
    seturi_repetari: anterior.seturi_repetari || "",
    pauza: anterior.pauza || "",
    indicatii: "",
    greutate_kg: "",
    seturi_finalizate: "",
    status: ""
  });
  randeazaPlanAntrenamentUI();
}

// Exercițiile folosite în planurile salvate (cel mai recent câștigă), apoi cele din șabloanele B-Fit:
// sugestii la nume + seriile, pauza, indicațiile și mușchii lor
function exercitiiCunoscute() {
  const harta = new Map();
  const planuri = (DB.planuri || []).concat(sabloanePlan());
  planuri.forEach(p => (p.continut_json?.sesiuni || []).forEach(ses => (ses.exercitii || []).forEach(ex => {
    const cheie = (ex.exercitiu || '').trim().toLowerCase();
    if (cheie && !harta.has(cheie)) harta.set(cheie, ex);
  })));
  return harta;
}

// Mușchii și tipul notării vin din șabloane (planurile salvate mai vechi nu le au), în oricare limbă
function exercitiuDinSabloane(nume) {
  const cheie = (nume || '').trim().toLowerCase();
  const toate = typeof SABLOANE_PLAN !== 'undefined' ? SABLOANE_PLAN.concat(typeof SABLOANE_PLAN_EN !== 'undefined' ? SABLOANE_PLAN_EN : []) : [];
  for (const s of toate) {
    for (const ses of s.continut_json.sesiuni) {
      const ex = ses.exercitii.find(x => x.exercitiu.trim().toLowerCase() === cheie);
      if (ex) return ex;
    }
  }
  return null;
}

function actualizeazaListaExercitii() {
  let lista = document.getElementById('listaExercitiiPlan');
  if (!lista) {
    lista = document.createElement('datalist');
    lista.id = 'listaExercitiiPlan';
    document.body.appendChild(lista);
  }
  lista.innerHTML = [...exercitiiCunoscute().values()].map(ex => `<option value="${escAttr(ex.exercitiu.trim())}"></option>`).join('');
}

// La alegerea unui exercițiu cunoscut se completează câmpurile goale (seriile, pauza, indicațiile).
// Mușchii și tipul notării țin de nume, deci se actualizează la orice schimbare a numelui.
function completeazaExercitiuCunoscut(sesIdx, exIdx) {
  const ex = planActiv?.continut_json?.sesiuni?.[sesIdx]?.exercitii?.[exIdx];
  if (!ex) return;
  const model = exercitiiCunoscute().get((ex.exercitiu || '').trim().toLowerCase());
  const sablon = exercitiuDinSabloane(ex.exercitiu);
  let completat = false;
  if (model && model !== ex) {
    ['seturi_repetari', 'pauza', 'indicatii'].forEach(camp => {
      if (!(ex[camp] || '').trim() && (model[camp] || '').trim()) {
        ex[camp] = model[camp];
        completat = true;
      }
    });
  }
  const muschi = (model && model.muschi) || (sablon && sablon.muschi) || '';
  const tip = (model && model.tip) || (sablon && sablon.tip) || '';
  if ((ex.muschi || '') !== muschi || (ex.tip || '') !== tip) {
    ex.muschi = muschi;
    ex.tip = tip;
    completat = true;
  }
  if (completat) randeazaPlanAntrenamentUI();
}

// ---- Înlocuiește exercițiul: alternative pentru același mușchi principal (primul din listă), din biblioteca de exerciții ----
// „Fesieri (gluteul mare), Biceps Femural” → ['fesieri', 'biceps femural']
function muschiExercitiu(ex) {
  return (ex.muschi || '').replace(/\([^)]*\)/g, '').split(/[,&]/).map(m => cheieNume(m)).filter(Boolean);
}

let exercitiuDeInlocuit = null;
let alternativeInlocuieste = [];

function deschideInlocuiesteExercitiu(sesIdx, exIdx) {
  const ex = planActiv?.continut_json?.sesiuni?.[sesIdx]?.exercitii?.[exIdx];
  if (!ex) return;
  exercitiuDeInlocuit = { sesIdx, exIdx };
  const muschi = muschiExercitiu(ex);
  const nume = cheieNume(ex.exercitiu);
  // Toată biblioteca de exerciții; cele pentru aceiași mușchi (scor > 0) apar primele
  const scor = x => { const m = muschiExercitiu(x); return !muschi.length ? 0 : (m[0] === muschi[0] ? 2 : (m.some(y => muschi.includes(y)) ? 1 : 0)); };
  alternativeInlocuieste = [...exercitiiCunoscute().values()]
    .filter(x => (x.exercitiu || '').trim() && cheieNume(x.exercitiu) !== nume)
    .map(x => ({ ex: x, scor: scor(x), grupa: grupaMusculara(x) || tr('Altele', 'Other') }));
  document.getElementById('inlocuiesteTitlu').innerText = (ex.exercitiu || '').trim() ? tr('Înlocuiește exercițiul', 'Swap exercise') : tr('Alege exercițiul', 'Choose exercise');
  document.getElementById('inlocuiesteDesc').innerText = (ex.exercitiu || '').trim()
    ? tr(`În locul exercițiului „${ex.exercitiu}”. Seriile și pauza rămân cele din plan.`, `Instead of "${ex.exercitiu}". Sets and rest stay as planned.`)
    : tr('Alege din biblioteca de exerciții. Seriile și pauza rămân cele din plan.', 'Choose from the exercise library. Sets and rest stay as planned.');
  document.getElementById('cautareInlocuieste').value = '';
  randeazaListaInlocuieste('');
  document.getElementById('modalInlocuiesteBackdrop').style.display = 'flex';
}

// Fără căutare: „Pentru aceiași mușchi”, apoi toate exercițiile pe grupe musculare; cu căutare: după nume sau mușchi
function randeazaListaInlocuieste(text) {
  const cautat = cheieNume(text);
  const card = (el) => `
    <button type="button" class="plan-zi-card" onclick="alegeInlocuitor(${alternativeInlocuieste.indexOf(el)})">
      <span class="plan-zi-card-text">
        <span class="plan-zi-card-titlu">${escAttr(el.ex.exercitiu)}</span>
        ${el.ex.muschi ? `<span class="plan-zi-card-detalii">${escAttr(el.ex.muschi)}</span>` : ''}
      </span>
      <svg class="plan-btn-svg plan-zi-card-sageata" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>`;
  const titlu = t => `<div class="plan-picker-group">${escAttr(t)}</div>`;
  const dupaNume = (a, b) => a.ex.exercitiu.localeCompare(b.ex.exercitiu, 'ro');
  let html = '';
  if (cautat) {
    const gasite = alternativeInlocuieste.filter(el => cheieNume(el.ex.exercitiu + ' ' + (el.ex.muschi || '')).includes(cautat)).sort((a, b) => b.scor - a.scor || dupaNume(a, b));
    html = gasite.map(card).join('');
  } else {
    const potrivite = alternativeInlocuieste.filter(el => el.scor > 0).sort((a, b) => b.scor - a.scor || dupaNume(a, b));
    if (potrivite.length) html += titlu(tr('Pentru aceiași mușchi', 'Same muscles')) + potrivite.map(card).join('');
    const grupe = new Map();
    alternativeInlocuieste.filter(el => !el.scor).sort(dupaNume).forEach(el => {
      if (!grupe.has(el.grupa)) grupe.set(el.grupa, []);
      grupe.get(el.grupa).push(el);
    });
    // „Altele” (exerciții fără mușchi cunoscuți, scrise de antrenor) la final
    const altele = tr('Altele', 'Other');
    [...grupe.keys()].sort((a, b) => (a === altele) - (b === altele) || a.localeCompare(b, 'ro'))
      .forEach(g => { html += titlu(g) + grupe.get(g).map(card).join(''); });
  }
  document.getElementById('listaInlocuieste').innerHTML = html || `<div class="plan-picker-empty">${tr('Niciun exercițiu nu se potrivește.', 'No exercise matches.')}</div>`;
}

function inchideInlocuiesteExercitiu() {
  document.getElementById('modalInlocuiesteBackdrop').style.display = 'none';
}

// Exercițiul nou își aduce numele, mușchii, tipul notării și indicațiile; seriile și pauza din plan rămân
function alegeInlocuitor(i) {
  const alt = (alternativeInlocuieste[i] || {}).ex;
  const loc = exercitiuDeInlocuit;
  const ex = loc && planActiv?.continut_json?.sesiuni?.[loc.sesIdx]?.exercitii?.[loc.exIdx];
  if (!alt || !ex) return;
  ex.exercitiu = alt.exercitiu;
  ex.muschi = alt.muschi || '';
  ex.tip = alt.tip || '';
  ex.indicatii = alt.indicatii || '';
  ex.greutate_kg = ''; ex.seturi_finalizate = ''; ex.status = '';
  delete ex.serii;
  delete ex.nota_client;
  inchideInlocuiesteExercitiu();
  randeazaPlanAntrenamentUI();
  showToast(tr('✓ Exercițiu înlocuit', '✓ Exercise swapped'));
}

function stergeExercitiuPlan(sesIdx, exIdx) {
  const ses = planActiv?.continut_json?.sesiuni?.[sesIdx];
  if (!ses || !Array.isArray(ses.exercitii)) return;
  customConfirm(tr("Ștergere exercițiu", "Delete exercise"), tr("Sigur vrei să ștergi acest exercițiu?", "Are you sure you want to delete this exercise?"), function() {
    ses.exercitii.splice(exIdx, 1);
    ses.exercitii.forEach((e, i) => { e.nr = i + 1; });
    randeazaPlanAntrenamentUI();
  });
}

// Progresul clientei (greutate, seturi, status, seriile notate, notițele) se scrie direct în baza de date. La salvare îl păstrăm
// pentru exercițiile unde antrenorul nu a modificat câmpul și care sunt tot la locul lor (același nume).
// Întoarce true dacă a preluat ceva nou.
async function integreazaProgresClientei() {
  if (!planActiv.id) return false;
  const { data: proaspat } = await supabaseClient.from('planuri_antrenament').select('continut_json').eq('id', planActiv.id).maybeSingle();
  const initial = (DB.planuri || []).find(p => String(p.id) === String(planActiv.id));
  if (!proaspat || !initial) return false;
  let preluat = false;
  const valoare = v => JSON.stringify(v ?? '');
  const preia = (tinta, dinBaza, dinInitial, campuri) => campuri.forEach(camp => {
    if (valoare(tinta[camp]) === valoare(dinInitial[camp]) && valoare(dinBaza[camp]) !== valoare(tinta[camp])) {
      tinta[camp] = dinBaza[camp] === undefined ? '' : JSON.parse(JSON.stringify(dinBaza[camp]));
      preluat = true;
    }
  });
  (planActiv.continut_json?.sesiuni || []).forEach((ses, s) => {
    const sesBaza = proaspat.continut_json?.sesiuni?.[s];
    const sesInitial = initial.continut_json?.sesiuni?.[s];
    if (sesBaza && sesInitial) preia(ses, sesBaza, sesInitial, ['nota_client']);
    (ses.exercitii || []).forEach((ex, e) => {
      const dinBaza = sesBaza?.exercitii?.[e];
      const dinInitial = sesInitial?.exercitii?.[e];
      if (!dinBaza || !dinInitial || (dinBaza.exercitiu || '') !== (ex.exercitiu || '')) return;
      preia(ex, dinBaza, dinInitial, ['greutate_kg', 'seturi_finalizate', 'status', 'serii', 'nota_client']);
    });
  });
  // Istoricul săptămânilor îl scrie doar clientul (incepe_saptamana_noua): se ia mereu din bază
  const istoricBaza = proaspat.continut_json?.istoric_saptamani;
  if (planActiv.continut_json && JSON.stringify(istoricBaza ?? null) !== JSON.stringify(planActiv.continut_json.istoric_saptamani ?? null)) {
    if (istoricBaza === undefined) delete planActiv.continut_json.istoric_saptamani;
    else planActiv.continut_json.istoric_saptamani = JSON.parse(JSON.stringify(istoricBaza));
    preluat = true;
  }
  return preluat;
}

// Salvare sincronizată direct cu tabela planuri_antrenament din Supabase
async function salveazaPlanCurentInBaza(silent = false) {
  if (!supabaseClient || !planActiv) return null;
  const progresPreluat = await integreazaProgresClientei().catch(() => false);

  const uid = utilizatorCurent ? utilizatorCurent.id : (planActiv.user_id || null);
  const payload = {
    clienta: (planActiv.clienta || "").trim(),
    titlu: (planActiv.titlu || "Program de antrenament").trim(),
    subtitlu: (planActiv.subtitlu || "").trim(),
    continut_json: planActiv.continut_json || {},
    updated_at: new Date().toISOString()
  };
  if (uid) payload.user_id = uid;

  try {
    let rezultat = null;
    if (planActiv.id) {
      const { data, error } = await supabaseClient
        .from('planuri_antrenament')
        .update(payload)
        .eq('id', planActiv.id)
        .select()
        .single();
      if (error) throw error;
      rezultat = data;
    } else {
      const { data, error } = await supabaseClient
        .from('planuri_antrenament')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      rezultat = data;
      planActiv.id = data.id;
    }

    if (rezultat) {
      const idx = (DB.planuri || []).findIndex(p => p.id === rezultat.id);
      if (idx !== -1) DB.planuri[idx] = rezultat;
      else DB.planuri.unshift(rezultat);

      try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
      populeazaSelectorPlanuri();
    }
    retinePlanInitial();

    if (progresPreluat) {
      showToast(tr('Plan salvat; am preluat și progresul completat de client.', 'Plan saved; client progress was kept too.'));
      randeazaPlanAntrenamentUI();
    } else if (!silent) {
      showToast(t('toastPlanSaved'));
    }
    return rezultat;
  } catch (err) {
    console.error("Eroare salvare plan:", err);
    if (!silent) showToast(tr("Eroare la salvarea planului: ", "Error saving plan: ") + (err.message || ""), "error");
    return null;
  }
}

// Plan nesalvat și neatins: nu are ce să se șteargă, deci butonul de coș e inactiv
function estePlanNouGol() {
  if (!planActiv || planActiv.id) return false;
  const gol = construiesteSablonPlanDefault();
  const cheie = p => JSON.stringify([p.clienta, p.titlu, p.subtitlu, p.continut_json]);
  return cheie(planActiv) === cheie(gol);
}

function actualizeazaButonStergePlan() {
  const btn = document.getElementById('btnStergePlan');
  if (btn) btn.classList.toggle('btn-clear-disabled', estePlanNouGol());
}

// Câmpurile planului se editează fără re-randare, deci starea butonului se actualizează la fiecare tastare
document.addEventListener('input', (e) => {
  if (e.target.closest && e.target.closest('#planDocumentContainer')) actualizeazaButonStergePlan();
});

async function stergePlanCurent() {
  if (estePlanNouGol()) return;

  if (!planActiv || !planActiv.id) {
    customConfirm(tr("Renunțare plan", "Discard plan"), tr("Renunți la planul nou, nesalvat?", "Discard the new, unsaved plan?"), function() {
      planActiv = construiesteSablonPlanDefault();
      bibliotecaPlanuri = true;
      retinePlanInitial();
      randeazaPlanAntrenamentUI();
    });
    return;
  }

  customConfirm(tr("Ștergere Plan", "Delete Plan"), tr(`Ștergi definitiv planul „${planActiv.titlu}”?`, `Permanently delete the plan "${planActiv.titlu}"?`), async function() {
    try {
      await supabaseClient.from('planuri_antrenament').delete().eq('id', planActiv.id);
      DB.planuri = (DB.planuri || []).filter(p => p.id !== planActiv.id);
      try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
      planActiv = construiesteSablonPlanDefault();
      bibliotecaPlanuri = true;
      retinePlanInitial();
      populeazaSelectorPlanuri();
      randeazaPlanAntrenamentUI();
      showToast(t('toastPlanDeleted'));
    } catch (err) {
      showToast(tr("Eroare la ștergere!", "Error deleting!"), "error");
    }
  });
}

// integrity: browserul refuză fișierul dacă diferă de versiunea verificată (CDN compromis sau modificat)
function incarcaScriptVerificat(src, integrity) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.integrity = integrity;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = () => { s.remove(); reject(new Error('script')); };
    document.head.appendChild(s);
  });
}

// Librăria de PDF (pdfmake, cu fontul Roboto, care are diacriticele) se încarcă doar la primul export
function incarcaPdfMake() {
  if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
  const incarca = incarcaScriptVerificat;
  return incarca('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js', 'sha384-VFQrHzqBh5qiJIU0uGU5CIW3+OWpdGGJM9LBnGbuIH2mkICcFZ7lPd/AAtI7SNf7')
    .then(() => incarca('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js', 'sha384-/RlQG9uf0M2vcTw3CX7fbqgbj/h8wKxw7C3zu9/GxcBPRKOEcESxaxufwRXqzq6n'));
}

// Culoarea de brand a fiecărei palete (aceeași ca fundalul iconiței)
const CULORI_PDF = { blue: '#335C8F', petrol: '#0F5E63', mov: '#5C4D7D', red: '#9F2A3A', green: '#267048', graphite: '#343A43' };

// Textul secțiunilor: rândurile care încep cu „-”, „•” sau „*” devin buline; la „Termen: explicație” termenul e îngroșat
function parseazaTextPlan(text) {
  return (text || '').split('\n').map(r => r.trim()).filter(Boolean).map(r => {
    const bulina = /^[-•*]\s*/.test(r);
    const linie = r.replace(/^[-•*]\s*/, '');
    const m = linie.match(/^([^:]{1,40}):\s+(.+)$/);
    return { bulina, eticheta: m ? m[1] + ':' : '', rest: m ? m[2] : linie };
  });
}

function htmlTextPlan(text) {
  let html = '';
  let inLista = false;
  parseazaTextPlan(text).forEach(r => {
    if (r.bulina !== inLista) {
      html += r.bulina ? '<ul class="plan-text-lista">' : '</ul>';
      inLista = r.bulina;
    }
    const continut = (r.eticheta ? `<b>${escAttr(r.eticheta)}</b> ` : '') + escAttr(r.rest);
    html += r.bulina ? `<li>${continut}</li>` : `<p class="plan-text-para">${continut}</p>`;
  });
  return html + (inLista ? '</ul>' : '');
}

// Documentul PDF: antet cu sigla, titlu, secțiuni numerotate, câte un tabel pe zi, subsol cu numărul paginii
function construiestePdfPlan(plan, culoare, logo) {
  const cj = plan.continut_json || {};
  const sesiuni = cj.sesiuni || [];
  const gri = '#64748b';
  const site = URL_APLICATIE.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const titluPlan = (plan.titlu || '').trim() || tr('Plan de antrenament', 'Workout plan');
  let nrSectiune = 0;
  const titluSectiune = (text) => ({ text: `${++nrSectiune}. ${text}`, style: 'h2', headlineLevel: 1 });

  const blocText = (text) => {
    const blocuri = [];
    let lista = null;
    parseazaTextPlan(text).forEach(r => {
      const rand = r.eticheta ? [{ text: r.eticheta + ' ', bold: true }, r.rest] : r.rest;
      if (r.bulina) {
        if (!lista) { lista = { ul: [], margin: [6, 0, 0, 6] }; blocuri.push(lista); }
        lista.ul.push({ text: rand, margin: [0, 0, 0, 2] });
      } else {
        lista = null;
        blocuri.push({ text: rand, margin: [0, 0, 0, 4] });
      }
    });
    return blocuri;
  };
  // Titlul secțiunii rămâne pe aceeași pagină cu primul ei paragraf / prima listă
  const sectiuni = (lista) => (lista || []).filter(s => (s.titlu || '').trim() || (s.continut || '').trim())
    .flatMap(s => {
      const [primul, ...rest] = blocText(s.continut);
      return [{ stack: [titluSectiune((s.titlu || '').trim()), primul || { text: '' }], unbreakable: true }, ...rest];
    });

  const continut = [{
    columns: [
      logo ? { image: logo, width: 34 } : { text: '', width: 0 },
      { stack: [{ text: 'B-Fit', bold: true, color: culoare, fontSize: 12 }, { text: site, color: gri, fontSize: 8 }], margin: [8, 3, 0, 0] },
      { stack: [
          plan.clienta ? { text: [{ text: tr('Client: ', 'Client: '), color: gri }, { text: plan.clienta, bold: true }], alignment: 'right' } : { text: '' },
          { text: new Date().toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ro-RO'), color: gri, fontSize: 8, alignment: 'right' }
        ], margin: [0, 3, 0, 0] }
    ],
    margin: [0, 0, 0, 16]
  }, { text: titluPlan, style: 'h1' }];
  if ((plan.subtitlu || '').trim()) continut.push({ text: plan.subtitlu.trim(), color: gri, fontSize: 10, margin: [0, 3, 0, 0] });
  continut.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.2, lineColor: culoare }], margin: [0, 7, 0, 2] });
  continut.push(...sectiuni(cj.sectiuni_inceput));

  sesiuni.forEach(ses => {
    const exercitii = (ses.exercitii || []).filter(ex => (ex.exercitiu || '').trim() || (ex.seturi_repetari || '').trim());
    if (!exercitii.length) return;
    const titluSes = (ses.titlu || '').trim();
    // Un plan de o zi are adesea ziua cu același nume ca planul: nu-l repetăm
    if (titluSes && !(sesiuni.length === 1 && titluSes.toLowerCase() === titluPlan.toLowerCase())) continut.push(titluSectiune(titluSes));
    else continut.push({ text: '', margin: [0, 8, 0, 0] });

    // Greutatea și seriile făcute apar doar dacă clientul le-a completat
    const areKg = exercitii.some(ex => (ex.greutate_kg || '').trim());
    const areSerii = exercitii.some(ex => (ex.seturi_finalizate || '').trim());
    const cap = [tr('Exercițiu', 'Exercise'), tr('Serii × repetări', 'Sets × reps'), tr('Pauză', 'Rest'), tr('Cum se execută / sfaturi', 'How to perform / tips')];
    const latimi = ['27%', 56, 50, '*'];
    if (areKg) { cap.push('Kg'); latimi.push(32); }
    if (areSerii) { cap.push(tr('Serii făcute', 'Sets done')); latimi.push(40); }
    const corp = [cap.map(c => ({ text: c, bold: true, color: '#ffffff', fontSize: 8.5 }))];
    exercitii.forEach((ex, i) => {
      const rand = [
        { text: `${ex.nr || i + 1}. ${(ex.exercitiu || '').trim()}`, bold: true },
        ex.seturi_repetari || '',
        ex.pauza || '–',
        ex.indicatii || ''
      ];
      if (areKg) rand.push({ text: ex.greutate_kg || '', alignment: 'center' });
      if (areSerii) rand.push({ text: ex.seturi_finalizate || '', alignment: 'center' });
      corp.push(rand);
    });
    continut.push({
      table: { headerRows: 1, dontBreakRows: true, widths: latimi, body: corp },
      layout: {
        fillColor: (i) => i === 0 ? culoare : (i % 2 === 0 ? '#f1f5f9' : null),
        hLineColor: () => '#cbd5e1',
        vLineColor: () => '#cbd5e1',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 4,
        paddingBottom: () => 4
      },
      fontSize: 9
    });
  });

  continut.push(...sectiuni(cj.sectiuni_final));
  if ((cj.nota_subsol || '').trim()) {
    continut.push({ text: [{ text: tr('Notă: ', 'Note: '), bold: true }, cj.nota_subsol.trim()], italics: true, color: gri, fontSize: 8.5, margin: [0, 16, 0, 0] });
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 36, 40, 44],
    info: { title: titluPlan, author: 'B-Fit' },
    content: continut,
    // Un titlu de secțiune nu rămâne singur la capătul paginii
    pageBreakBefore: (nod, urmatoareleDePePagina) => nod.headlineLevel === 1 && urmatoareleDePePagina.length === 0,
    footer: (pagina, total) => ({
      columns: [
        { text: `B-Fit · ${site}`, color: gri, fontSize: 7.5 },
        { text: tr(`Pagina ${pagina} / ${total}`, `Page ${pagina} / ${total}`), color: gri, fontSize: 7.5, alignment: 'right' }
      ],
      margin: [40, 14, 40, 0]
    }),
    styles: {
      h1: { fontSize: 20, bold: true, color: culoare },
      h2: { fontSize: 12.5, bold: true, color: culoare, margin: [0, 14, 0, 6] }
    },
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#1e293b', lineHeight: 1.2 }
  };
}

async function imagineDataUrl(cale) {
  const blob = await (await fetch(cale)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// Generează fișierul PDF și îl trimite prin meniul nativ de share (sau îl descarcă); clientul doar îl descarcă (doarDescarca)
async function exportaPlanCurentPDF(plan = planActiv, doarDescarca = false) {
  if (!plan) return;
  showToast(t('toastPdfGenerating'));

  const titlu = (plan.titlu || 'Plan de antrenament').trim();
  const numeFisier = [titlu, plan.clienta].filter(Boolean).join(' - ').replace(/[\\/:*?"<>|]/g, '') + '.pdf';

  try {
    await incarcaPdfMake();
    const paleta = PALETE_ACCENT.includes(localStorage.getItem('beatrix_accent')) ? localStorage.getItem('beatrix_accent') : 'blue';
    const logo = await imagineDataUrl(`icon-${paleta}.png`).catch(() => null);
    const blob = await new Promise(resolve => pdfMake.createPdf(construiestePdfPlan(plan, CULORI_PDF[paleta], logo)).getBlob(resolve));

    const fisier = new File([blob], numeFisier, { type: 'application/pdf' });
    let trimis = false;
    if (!doarDescarca && navigator.canShare && navigator.canShare({ files: [fisier] })) {
      try {
        await navigator.share({ files: [fisier], title: titlu });
        trimis = true;
      } catch (e) {
        trimis = (e.name === 'AbortError');
      }
    }
    if (!trimis) {
      const url = URL.createObjectURL(fisier);
      const a = document.createElement('a');
      a.href = url;
      a.download = numeFisier;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (err) {
    console.error("Eroare generare PDF:", err);
    showToast(tr('Nu s-a putut genera PDF-ul. Verifică conexiunea la internet.', 'Could not create the PDF. Check your internet connection.'), 'error');
  }
}

async function deschideModalSharePlan() {
  if (planActiv && !planActiv.id && !(planActiv.titlu || '').trim()) {
    showToast(tr("Adaugă un titlu planului înainte să-l trimiți!", "Add a plan title before sharing!"), "error");
    return;
  }
  const salvat = await salveazaPlanCurentInBaza(true);
  const idPlan = salvat ? salvat.id : (planActiv ? planActiv.id : null);

  if (!idPlan) {
    showToast(tr("Salvează mai întâi planul în baza de date!", "Save the plan first!"), "error");
    return;
  }

  // Mereu adresa de producție, chiar dacă planul e trimis din testarea locală
  const shareUrl = `${URL_APLICATIE}?plan=${idPlan}`;
  const inp = document.getElementById('inputSharePlanUrl');
  if (inp) inp.value = shareUrl;

  const modal = document.getElementById('modalSharePlanBackdrop');
  if (modal) modal.style.display = 'flex';
}

function inchideModalSharePlan() {
  const modal = document.getElementById('modalSharePlanBackdrop');
  if (modal) modal.style.display = 'none';
}

function copiazaLinkSharePlan() {
  const inp = document.getElementById('inputSharePlanUrl');
  if (!inp || !inp.value) return;
  navigator.clipboard.writeText(inp.value).then(() => {
    showToast(t('toastLinkCopied'));
  });
}

async function trimiteShareNativPlan() {
  const inp = document.getElementById('inputSharePlanUrl');
  const url = inp ? inp.value : window.location.href;
  const titlu = planActiv ? planActiv.titlu : 'Plan de Antrenament B-Fit';

  if (navigator.share) {
    try {
      await navigator.share({
        title: titlu,
        text: `🏋️‍♀️ ${titlu} – ${tr('deschide fișa ta de antrenament', 'open your workout sheet')}:`,
        url: url
      });
    } catch (e) {}
  } else {
    copiazaLinkSharePlan();
  }
}

function copiazaTextFormatatPlan() {
  if (!planActiv) return;
  let txt = `🏋️‍♀️ ${planActiv.titlu}\n`;
  if (planActiv.subtitlu) txt += `${planActiv.subtitlu}\n\n`;

  (planActiv.continut_json?.sesiuni || []).forEach(ses => {
    txt += `📌 ${ses.titlu}\n`;
    (ses.exercitii || []).forEach((ex, i) => {
      txt += `${i + 1}. ${ex.exercitiu} — ${ex.seturi_repetari}`;
      if (ex.pauza) txt += ` (${tr('pauză', 'rest')} ${ex.pauza})`;
      if (ex.indicatii) txt += `\n   💡 ${ex.indicatii}`;
      txt += `\n`;
    });
    txt += `\n`;
  });

  const inp = document.getElementById('inputSharePlanUrl');
  if (inp && inp.value) {
    txt += `🔗 ${tr('Fișa ta de antrenament', 'Your workout sheet')}:\n${inp.value}`;
  }

  navigator.clipboard.writeText(txt).then(() => {
    showToast(t('toastTextCopied'));
  });
}

async function initModClientaSharePlan(planId) {
  esteModClientaShare = true;
  tipTabCurent = 'plan';

  const authOverlay = document.getElementById('authScreenOverlay');
  if (authOverlay) authOverlay.classList.add('auth-hidden');

  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.style.display = 'none';

  const burgerBtn = document.getElementById('headerBurgerBtn');
  if (burgerBtn) burgerBtn.style.display = 'none';

  const coachToolbar = document.getElementById('planCoachToolbar');
  if (coachToolbar) coachToolbar.style.display = 'none';

  const clientBanner = document.getElementById('planClientSharedBanner');
  if (clientBanner) clientBanner.style.display = 'block';

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const tabPlan = document.getElementById('tabPlanAntrenament');
  if (tabPlan) tabPlan.classList.add('active');

  actualizeazaHeaderVisual('plan', currentLang === 'en' ? 'Workout Sheet' : 'Fișă Antrenament');
  actualizeazaStareNoScrollBody();

  if (!supabaseClient) return;

  try {
    // Funcție Supabase care întoarce doar planul cu id-ul din link (fără acces la tabel)
    const { data, error } = await supabaseClient
      .rpc('citeste_plan_share', { p_id: planId })
      .maybeSingle();

    if (error || !data) {
      document.getElementById('planDocumentContainer').innerHTML = `
        <div style="padding:24px; text-align:center; color:var(--text-muted);">
          ${tr('Planul de antrenament nu a fost găsit sau link-ul a expirat.', 'The workout plan was not found or the link has expired.')}
        </div>
      `;
      return;
    }

    planActiv = data;
    randeazaPlanAntrenamentUI();
  } catch (err) {
    console.error("Eroare incarcare plan share:", err);
  }
}

// ==========================================
// FORMULAR DE ÎNSCRIERE (?inscriere=<cod>)
// ==========================================
// Răspunsurile la variante se salvează ca id-uri (ex. 'slabire'), afișate apoi în limba celui care citește.
const OPTIUNI_DA_NU = [{ id: 'da', ro: 'Da', en: 'Yes' }, { id: 'nu', ro: 'Nu', en: 'No' }];
// Scala 1–5, aceeași ca la check-in-ul săptămânal (energie, somn), ca valorile de start să fie comparabile
const OPTIUNI_SCALA = ['1', '2', '3', '4', '5'].map(n => ({ id: n, ro: n, en: n }));
const OPTIUNI_OBIECTIVE = [
  { id: 'slabire', ro: 'Slăbire', en: 'Weight loss' }, { id: 'masaMusculara', ro: 'Creștere masă musculară', en: 'Muscle gain' },
  { id: 'tonifiere', ro: 'Tonifiere', en: 'Toning' }, { id: 'forta', ro: 'Forță / putere', en: 'Strength / power' },
  { id: 'rezistenta', ro: 'Rezistență', en: 'Endurance' }, { id: 'mobilitate', ro: 'Recuperare / mobilitate', en: 'Recovery / mobility' },
  { id: 'stilSanatos', ro: 'Stil de viață sănătos', en: 'Healthy lifestyle' }
];
const SECTIUNI_INSCRIERE = [
  { ro: 'Date personale', en: 'Personal details', intrebari: [
    { id: 'nume', tip: 'text', ob: true, ro: 'Nume și prenume', en: 'Full name' },
    { id: 'varsta', tip: 'numar', ob: true, min: 12, max: 100, ro: 'Vârsta', en: 'Age' },
    { id: 'inaltime', tip: 'numar', ob: true, min: 120, max: 220, ro: 'Înălțimea (cm)', en: 'Height (cm)' },
    { id: 'greutate', tip: 'numar', ob: true, min: 30, max: 250, ro: 'Greutatea actuală (kg)', en: 'Current weight (kg)' },
    { id: 'telefon', tip: 'tel', ob: true, ro: 'Nr. telefon', en: 'Phone number' },
    { id: 'email', tip: 'email', ob: true, ro: 'E-mail de contact', en: 'Email where you can be reached' },
    { id: 'domeniu', tip: 'text', ob: true, ro: 'În ce domeniu lucrezi? (ex.: IT, medicină, educație etc.)', en: 'What field do you work in? (e.g. IT, medicine, education)' },
    { id: 'angajament', tip: 'alegere', ob: true, optiuni: OPTIUNI_DA_NU, ro: 'Îți poți asuma un program de antrenament de minimum 3 luni?', en: 'Are you willing to commit to a training program for at least 3 months?' },
    { id: 'feedback', tip: 'alegere', ob: true, optiuni: OPTIUNI_DA_NU, ro: 'Ești de acord să trimiți periodic feedback despre cum te simți și cum progresezi?', en: 'Are you willing to give regular feedback on how you feel and progress?' },
    { id: 'pozeProgres', tip: 'alegere', ob: true, optiuni: OPTIUNI_DA_NU, ro: 'Ești de acord să faci poze de progres? Le văd doar eu, ca antrenor, și nu le folosesc în alt scop.', en: 'Do you agree to take progress photos? Only I, as your trainer, see them, and they are not used for anything else.' },
    { id: 'urgenta', tip: 'text', ro: 'Contact pentru urgențe (nume și telefon)', en: 'Emergency contact (name and phone)' }
  ] },
  { ro: 'Istoric medical & sănătate', en: 'Medical history & health', intrebari: [
    { id: 'afectiuni', tip: 'danu', ob: true, ro: 'Suferi de afecțiuni medicale? (ex: probleme cardiace, respiratorii, diabet, scolioză, hipertensiune etc.)', en: 'Do you have any medical conditions? (e.g. heart or breathing problems, diabetes, scoliosis, high blood pressure)' },
    { id: 'dureri', tip: 'danu', ob: true, ro: 'Ai dureri articulare sau accidentări anterioare? (genunchi, umeri, zona lombară etc.)', en: 'Do you have joint pain or previous injuries? (knees, shoulders, lower back etc.)' },
    { id: 'restrictii', tip: 'danu', ob: true, ro: 'Ai restricții de efort fizic recomandate de medic?', en: 'Has a doctor recommended any limits on physical effort?' },
    { id: 'medicatie', tip: 'danu', ob: true, ro: 'Iei medicamente sau urmezi un tratament în prezent?', en: 'Are you currently taking medication or following a treatment?' },
    { id: 'sarcina', tip: 'alegere', optiuni: [
      { id: 'da', ro: 'Da', en: 'Yes' }, { id: 'nu', ro: 'Nu', en: 'No' }, { id: 'nuECazul', ro: 'Nu e cazul', en: 'Not applicable' }
    ], ro: 'Sarcină sau naștere în ultimele 12 luni?', en: 'Pregnancy or giving birth in the last 12 months?' },
    { id: 'energie', tip: 'scala', ro: 'Cum ți-ai nota nivelul general de energie?', en: 'How would you rate your general energy level?', hint: { ro: '1 = foarte scăzut · 5 = foarte ridicat', en: '1 = very low · 5 = very high' } },
    { id: 'somnOre', tip: 'alegere', optiuni: [
      { id: 'sub6', ro: 'Sub 6 ore', en: 'Under 6 h' }, { id: '6-7', ro: '6–7 ore', en: '6–7 h' },
      { id: '7-8', ro: '7–8 ore', en: '7–8 h' }, { id: 'peste8', ro: 'Peste 8 ore', en: 'Over 8 h' }
    ], ro: 'Câte ore dormi pe noapte, de obicei?', en: 'How many hours do you usually sleep?' },
    { id: 'somnCalitate', tip: 'scala', ro: 'Cum ți-ai nota calitatea somnului?', en: 'How would you rate your sleep quality?', hint: { ro: '1 = foarte slabă · 5 = excelentă', en: '1 = very poor · 5 = excellent' } }
  ] },
  { ro: 'Nivel actual de activitate fizică', en: 'Current activity level', intrebari: [
    { id: 'sportAnterior', tip: 'paragraf', ro: 'Ai mai făcut sport? Ce tip de antrenamente?', en: 'Have you exercised before? What kind of training?' },
    { id: 'activitate', tip: 'alegere', optiuni: [
      { id: 'sedentar', ro: 'Sedentar', en: 'Sedentary' }, { id: 'moderat', ro: 'Moderat activ', en: 'Moderately active' },
      { id: 'activ', ro: 'Activ', en: 'Active' }, { id: 'foarteActiv', ro: 'Foarte activ', en: 'Very active' }
    ], ro: 'Cât de mult te miști zilnic?', en: 'How active are you day to day?' }
  ] },
  { ro: 'Obiective personale & motivație', en: 'Personal goals & motivation', intrebari: [
    { id: 'obiectivPrincipal', tip: 'alegere', ob: true, optiuni: OPTIUNI_OBIECTIVE, ro: 'Care este obiectivul tău principal? (alege unul)', en: 'What is your main goal? (pick one)' },
    // „obiective” = alte obiective; în fișele mai vechi conține toate obiectivele bifate
    { id: 'obiective', tip: 'multi', optiuni: OPTIUNI_OBIECTIVE, ro: 'Alte obiective (opțional)', en: 'Other goals (optional)' },
    { id: 'greutateTinta', tip: 'numar', min: 30, max: 250, ro: 'Ai o greutate țintă? (kg, opțional)', en: 'Do you have a target weight? (kg, optional)' },
    { id: 'termen', tip: 'alegere', optiuni: [
      { id: '1luna', ro: '1 lună', en: '1 month' }, { id: '3luni', ro: '3 luni', en: '3 months' }, { id: '6luni', ro: '6 luni', en: '6 months' },
      { id: '1an', ro: '1 an', en: '1 year' }, { id: 'fara', ro: 'Fără termen', en: 'No deadline' }
    ], ro: 'În cât timp ți-ai propus să atingi obiectivul?', en: 'By when do you want to reach your goal?' }
  ] },
  { ro: 'Evaluare psihologică soft', en: 'Coaching style', intrebari: [
    { id: 'stilAntrenor', tip: 'alegere', ob: true, optiuni: [
      { id: 'bland', ro: 'Blând și răbdător', en: 'Gentle and patient' }, { id: 'motivant', ro: 'Motivant și energic', en: 'Motivating and energetic' },
      { id: 'ferm', ro: 'Ferm și disciplinat', en: 'Firm and disciplined' }, { id: 'combinatie', ro: 'O combinație', en: 'A mix' }
    ], ro: 'Preferi un antrenor:', en: 'You prefer a trainer who is:' },
    { id: 'consecventa', tip: 'paragraf', ro: 'Ce te ajută cel mai mult să nu renunți?', en: 'What helps you most to keep going?' }
  ] },
  { ro: 'Disponibilitate', en: 'Availability', intrebari: [
    { id: 'dataStart', tip: 'data', ob: true, ro: 'Care este data estimată de la care îți poți începe antrenamentele?', en: 'From what date can you start training?' },
    { id: 'frecventa', tip: 'alegere', optiuni: [
      { id: '1', ro: '1', en: '1' }, { id: '2', ro: '2', en: '2' }, { id: '3', ro: '3', en: '3' }, { id: '4', ro: '4+', en: '4+' }
    ], ro: 'De câte ori pe săptămână poți veni la antrenamente?', en: 'How many times a week can you come to training?' },
    { id: 'intervale', tip: 'multi', optiuni: [
      { id: 'dimineata', ro: 'Dimineața', en: 'Morning' }, { id: 'pranz', ro: 'Prânz', en: 'Midday' },
      { id: 'dupaAmiaza', ro: 'După-amiaza', en: 'Afternoon' }, { id: 'seara', ro: 'Seara', en: 'Evening' }
    ], ro: 'Intervalele orare preferate', en: 'Preferred time slots' },
    { id: 'intervaleNota', tip: 'paragraf', ro: 'Detalii despre program (opțional, ex.: lucrez în ture)', en: 'Schedule details (optional, e.g. I work shifts)' }
  ] },
  { ro: 'Așteptări & angajament', en: 'Expectations & commitment', intrebari: [
    { id: 'asteptari', tip: 'paragraf', ro: 'Ce aștepți de la mine ca antrenor personal?', en: 'What do you expect from me as your personal trainer?' },
    { id: 'deStiut', tip: 'paragraf', ro: 'Există ceva ce ar trebui să știu înainte să începem?', en: 'Is there anything I should know before we start?' },
    { id: 'deUnde', tip: 'alegere', optiuni: [
      { id: 'instagram', ro: 'Instagram', en: 'Instagram' }, { id: 'recomandare', ro: 'Recomandare', en: 'Recommendation' },
      { id: 'google', ro: 'Google', en: 'Google' }, { id: 'altceva', ro: 'Altceva', en: 'Other' }
    ], ro: 'Cum ai aflat de mine?', en: 'How did you hear about me?' }
  ] }
];
// Întrebări care nu mai sunt în formular, dar apar în fișele completate înainte (doar pentru afișare)
const INTREBARI_VECHI_INSCRIERE = [
  { id: 'somn', tip: 'paragraf', ro: 'Calitatea somnului (ore/noapte, dificultăți)', en: 'Sleep quality (hours per night, difficulties)' }
];

let stareInscriere = { cod: '', pas: 0, r: {}, antrenor: null, areSesiune: false, trimitere: false };

function cheieCiornaInscriere() {
  return 'BFIT_INSCRIERE_' + stareInscriere.cod;
}

function salveazaCiornaInscriere() {
  try { localStorage.setItem(cheieCiornaInscriere(), JSON.stringify({ pas: stareInscriere.pas, r: stareInscriere.r })); } catch (e) {}
}

async function initInscriere(cod) {
  stareInscriere.cod = cod.trim().toLowerCase();
  document.getElementById('inscriereScreen').classList.remove('auth-hidden');
  document.body.classList.add('no-scroll');
  try {
    const ciorna = JSON.parse(localStorage.getItem(cheieCiornaInscriere()) || 'null');
    if (ciorna && typeof ciorna.pas === 'number') { stareInscriere.pas = ciorna.pas; stareInscriere.r = ciorna.r || {}; }
  } catch (e) {}

  const continut = document.getElementById('inscriereContinut');
  continut.innerHTML = `<div class="loader">${tr('Se încarcă...', 'Loading...')}</div>`;
  if (!supabaseClient) {
    continut.innerHTML = `<div class="card">${tr('Nu ne putem conecta. Verifică internetul și reîncearcă.', 'We cannot connect. Check your internet and try again.')}</div>`;
    return;
  }
  const [{ data, error }, { data: sesiune }] = await Promise.all([
    supabaseClient.rpc('antrenor_inscriere', { p_cod: stareInscriere.cod }).maybeSingle(),
    supabaseClient.auth.getSession()
  ]);
  stareInscriere.areSesiune = !!(sesiune && sesiune.session);
  if (error || !data) {
    stareInscriere.antrenor = null;
    randeazaAntetInscriere();
    continut.innerHTML = `<div class="card">${tr('Link-ul de înscriere nu este valid. Cere-i antrenorului tău link-ul corect.', 'This sign-up link is not valid. Ask your trainer for the correct link.')}</div>`;
    return;
  }
  stareInscriere.antrenor = data;
  randeazaInscriere();
}

function randeazaAntetInscriere() {
  const a = stareInscriere.antrenor;
  const avatar = a && a.avatar
    ? `<img src="${escAttr(a.avatar)}" alt="">`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  document.getElementById('inscriereAntrenor').innerHTML = `<span class="inscriere-avatar">${avatar}</span>
    <span class="inscriere-antet-text"><b>${tr('Fișa de obiective', 'Goal-setting form')}</b>${a ? `<small>${escAttr(a.nume_antrenor || '')}</small>` : ''}</span>`;
  document.getElementById('inscriereLangRo').classList.toggle('active', currentLang !== 'en');
  document.getElementById('inscriereLangEn').classList.toggle('active', currentLang === 'en');
}

function schimbaLimbaInscriere(lang) {
  currentLang = lang;
  localStorage.setItem('beatrix_lang', lang);
  document.documentElement.lang = lang;
  if (checkinLink) afiseazaCheckinLink();
  else if (stareInscriere.antrenor) randeazaInscriere();
  else randeazaAntetInscriere();
}

// Câmp de dată (.camp-data): la apăsare se deschide direct calendarul, nu editarea pe bucăți zz/ll/aaaa
function deschideCalendarData(el) {
  try { el.showPicker(); } catch (e) {}
}

function textInscriere(ob) {
  return currentLang === 'en' ? ob.en : ob.ro;
}

// Răspunsurile pe care lucrează întrebările: editorul fișei de obiective (dacă e deschis) sau formularul de înscriere
const raspunsuriActiveInscriere = () => editareFisa ? editareFisa.r : stareInscriere.r;

function htmlIntrebareInscriere(q) {
  const v = raspunsuriActiveInscriere()[q.id];
  const eticheta = `<label class="inscriere-eticheta" for="insc_${q.id}">${escAttr(textInscriere(q))}${q.ob ? ' <span class="inscriere-obligatoriu">*</span>' : ''}</label>`;
  const chip = (text, activ, onclick) => `<button type="button" class="inscriere-chip${activ ? ' active' : ''}" onclick="${onclick}">${escAttr(text)}</button>`;
  let camp = '';
  if (q.tip === 'paragraf') {
    camp = `<textarea id="insc_${q.id}" class="form-control" rows="2" oninput="seteazaRaspunsInscriere('${q.id}', this.value)">${escAttr(v || '')}</textarea>`;
  } else if (q.tip === 'alegere' || q.tip === 'multi' || q.tip === 'danu' || q.tip === 'scala') {
    let optiuni = q.tip === 'scala' ? OPTIUNI_SCALA : (q.optiuni || OPTIUNI_DA_NU);
    // „Alte obiective” nu repetă obiectivul principal
    if (q.id === 'obiective') optiuni = optiuni.filter(o => o.id !== raspunsuriActiveInscriere().obiectivPrincipal);
    const multi = q.tip === 'multi';
    camp = `<div class="inscriere-chips${q.tip === 'scala' ? ' inscriere-scala' : ''}">${optiuni.map(o => chip(textInscriere(o),
      multi ? (Array.isArray(v) ? v : []).includes(o.id) : v === o.id,
      `alegeOptiuneInscriere('${q.id}', '${o.id}', ${multi})`)).join('')}</div>`;
    if (q.hint) camp += `<div class="inscriere-hint">${escAttr(textInscriere(q.hint))}</div>`;
    if (q.tip === 'danu' && v === 'da') {
      const det = raspunsuriActiveInscriere()[q.id + 'Detalii'] || '';
      camp += `<textarea class="form-control" rows="2" style="margin-top:6px;" placeholder="${escAttr(tr('Spune-mi câteva detalii', 'Tell me a few details'))}" oninput="seteazaRaspunsInscriere('${q.id}Detalii', this.value)">${escAttr(det)}</textarea>`;
    }
  } else {
    const tipuri = { numar: 'number', tel: 'tel', email: 'email', data: 'date', text: 'text' };
    const extra = q.tip === 'numar' ? ` inputmode="decimal" min="${q.min}" max="${q.max}" step="any"` : q.id === 'nume' ? ' autocomplete="name"' : q.tip === 'tel' ? ' autocomplete="tel"' : q.tip === 'email' ? ' autocomplete="email"' : '';
    camp = `<input id="insc_${q.id}" type="${tipuri[q.tip]}" class="form-control"${extra} value="${escAttr(v || '')}" oninput="seteazaRaspunsInscriere('${q.id}', this.value)">`;
    // Câmp de dată gol: eticheta „Alege data” în locul șablonului zz.ll.aaaa al browserului
    if (q.tip === 'data') camp = `<div class="camp-data">${camp.replace('<input ', '<input required onclick="deschideCalendarData(this)" ')}<span class="camp-data-eticheta">${tr('Alege data', 'Pick a date')}</span></div>`;
  }
  return `<div class="inscriere-intrebare" id="inscQ_${q.id}">${eticheta}${camp}</div>`;
}

function randeazaInscriere() {
  randeazaAntetInscriere();
  const continut = document.getElementById('inscriereContinut');
  const total = SECTIUNI_INSCRIERE.length + 1; // ultimul pas: consimțământul
  const pas = stareInscriere.pas;

  if (pas === 'trimis') {
    continut.innerHTML = htmlFinalInscriere();
    if (!stareInscriere.areSesiune) pregatesteCaptcha().catch(() => {});
    return;
  }

  const bara = `<div class="inscriere-progres">
      <span>${tr('Pasul', 'Step')} ${pas + 1} ${tr('din', 'of')} ${total}</span>
      <div class="progress-wrapper"><div class="progress-fill" style="width:${Math.round(((pas + 1) / total) * 100)}%"></div></div>
    </div>`;
  let corp;
  if (pas < SECTIUNI_INSCRIERE.length) {
    const s = SECTIUNI_INSCRIERE[pas];
    corp = `<div class="inscriere-sectiune">${escAttr(textInscriere(s))}</div>` + s.intrebari.map(htmlIntrebareInscriere).join('');
  } else {
    const acord = !!stareInscriere.r.consimtamant;
    corp = `<div class="inscriere-sectiune">${tr('Consimțământ', 'Consent')}</div>
      <label class="inscriere-acord" id="inscQ_consimtamant">
        <input type="checkbox" ${acord ? 'checked' : ''} onchange="seteazaRaspunsInscriere('consimtamant', this.checked)">
        <span>${tr('Am cel puțin 16 ani, informațiile oferite sunt reale și îmi dau acordul explicit ca antrenorul să le prelucreze, inclusiv datele despre sănătate (afecțiuni, dureri, greutate, poze de progres), doar pentru antrenamentul meu personal. Pot retrage acordul oricând.',
          'I am at least 16, the information I gave is true and I explicitly agree to my trainer processing it, including health data (conditions, pain, weight, progress photos), only for my personal training. I can withdraw my consent at any time.')}
          <a href="confidentialitate.html" target="_blank" rel="noopener">${tr('Politica de confidențialitate', 'Privacy policy')}</a></span>
      </label>
      <input type="text" id="inscriereWebsite" class="inscriere-capcana" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  }
  const ultim = pas === total - 1;
  const butoane = `<div class="inscriere-butoane">
      ${pas > 0 ? `<button type="button" class="btn btn-clear" onclick="pasInscriere(-1)">${tr('Înapoi', 'Back')}</button>` : ''}
      <button type="button" class="btn" id="btnInscriereUrmator" onclick="${ultim ? 'trimiteInscriere()' : 'pasInscriere(1)'}"${stareInscriere.trimitere ? ' disabled' : ''}>${ultim ? tr('Trimite', 'Send') : tr('Continuă', 'Continue')}</button>
    </div>`;
  continut.innerHTML = `<div class="card">${bara}${corp}${butoane}</div>`;
}

function seteazaRaspunsInscriere(id, valoare) {
  raspunsuriActiveInscriere()[id] = valoare;
  document.getElementById('inscQ_' + id)?.classList.remove('inscriere-eroare');
  if (!editareFisa) salveazaCiornaInscriere();
}

function alegeOptiuneInscriere(id, optiune, multi) {
  const r = raspunsuriActiveInscriere();
  if (multi) {
    const lista = Array.isArray(r[id]) ? r[id] : [];
    r[id] = lista.includes(optiune) ? lista.filter(x => x !== optiune) : lista.concat(optiune);
  } else {
    r[id] = optiune;
    // obiectivul principal nu rămâne și printre „alte obiective”
    if (id === 'obiectivPrincipal' && Array.isArray(r.obiective)) r.obiective = r.obiective.filter(x => x !== optiune);
  }
  if (editareFisa) return randeazaEditorFisa();
  salveazaCiornaInscriere();
  randeazaInscriere();
}

// Întoarce id-ul primei întrebări obligatorii necompletate (sau completate greșit) din pasul curent
function verificaPasInscriere() {
  const r = stareInscriere.r;
  if (stareInscriere.pas >= SECTIUNI_INSCRIERE.length) return r.consimtamant ? null : 'consimtamant';
  const gol = v => Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim();
  for (const q of SECTIUNI_INSCRIERE[stareInscriere.pas].intrebari) {
    if (q.ob && gol(r[q.id])) return q.id;
    if (q.tip === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r[q.id]).trim())) return q.id;
    if (q.tip === 'numar' && !gol(r[q.id]) && !numarInInterval(q, r[q.id])) return q.id;
  }
  return null;
}

// Cifre între limitele întrebării (ex. înălțimea în cm, nu în metri); acceptă și virgulă zecimală
function numarInInterval(q, valoare) {
  const n = parseFloat(String(valoare).replace(',', '.'));
  return !isNaN(n) && n >= q.min && n <= q.max;
}

function pasInscriere(directie) {
  if (directie > 0) {
    const lipsa = verificaPasInscriere();
    if (lipsa) {
      const el = document.getElementById('inscQ_' + lipsa);
      el?.classList.add('inscriere-eroare');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const q = (SECTIUNI_INSCRIERE[stareInscriere.pas]?.intrebari || []).find(x => x.id === lipsa);
      const valoare = String(stareInscriere.r[lipsa] ?? '').trim();
      showToast(lipsa === 'email' ? t('authInvalidEmailFormat')
        : q && q.tip === 'numar' && valoare ? tr(`Verifică valoarea: între ${q.min} și ${q.max}.`, `Check the value: between ${q.min} and ${q.max}.`)
        : tr('Completează câmpurile marcate cu *', 'Fill in the fields marked with *'), 'error');
      return;
    }
  }
  stareInscriere.pas = Math.max(0, stareInscriere.pas + directie);
  salveazaCiornaInscriere();
  randeazaInscriere();
  document.getElementById('inscriereScreen').scrollTop = 0;
}

async function trimiteInscriere() {
  if (verificaPasInscriere()) {
    pasInscriere(1);
    return;
  }
  const r = stareInscriere.r;
  const finalizeaza = () => {
    stareInscriere.pas = 'trimis';
    try { localStorage.removeItem(cheieCiornaInscriere()); } catch (e) {}
    randeazaInscriere();
    document.getElementById('inscriereScreen').scrollTop = 0;
  };
  // Câmpul ascuns completat = robot: pare trimis, dar nu ajunge nimic la antrenor
  if (document.getElementById('inscriereWebsite')?.value) {
    finalizeaza();
    return;
  }
  stareInscriere.trimitere = true;
  randeazaInscriere();
  const raspunsuri = Object.assign({}, r, { data: formateazaDataRoLocal(new Date()) });
  delete raspunsuri.consimtamant;
  const { data, error } = await supabaseClient.rpc('trimite_inscriere', {
    p_cod: stareInscriere.cod,
    p_nume: (r.nume || '').trim(),
    p_telefon: (r.telefon || '').trim(),
    p_email: (r.email || '').trim().toLowerCase(),
    p_limba: currentLang,
    p_raspunsuri: raspunsuri,
    p_consimtamant: true
  });
  stareInscriere.trimitere = false;
  if (!error && data === 'ok') {
    finalizeaza();
    return;
  }
  randeazaInscriere();
  showToast(data === 'prea_multe'
    ? tr('Prea multe cereri în ultima oră. Încearcă mai târziu.', 'Too many requests in the last hour. Try again later.')
    : tr('Nu s-a putut trimite. Verifică internetul și reîncearcă.', 'Could not send. Check your internet and try again.'), 'error');
}

function htmlFinalInscriere() {
  const prenume = (stareInscriere.r.nume || '').trim().split(' ')[0];
  let html = `<div class="card inscriere-final">
      <div class="inscriere-final-icon">✓</div>
      <div style="font-weight:800; font-size:1.05rem; color:var(--primary);">${tr('Mulțumesc', 'Thank you')}${prenume ? ', ' + escAttr(prenume) : ''}!</div>
      <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${tr('Fișa ta a fost trimisă. Te contactez în curând.', 'Your form has been sent. I will get in touch soon.')}</div>
    </div>`;
  if (stareInscriere.areSesiune) return html;
  html += `<div class="card" id="inscriereCont">
      <div style="font-weight:800; color:var(--primary);">${tr('Fă-ți și cont (recomandat)', 'Create an account too (recommended)')}</div>
      <div style="font-size:0.82rem; color:var(--text-muted); margin:4px 0 10px;">${tr('După ce îți accept cererea, îți vezi abonamentul, programările și planurile de antrenament în aplicație.', 'Once I accept your request, you can see your subscription, bookings and workout plans in the app.')}</div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" class="form-control" value="${escAttr(stareInscriere.r.email || '')}" disabled>
      </div>
      <div class="form-group">
        <label>${tr('Alege o parolă (minim 8 caractere)', 'Choose a password (at least 8 characters)')}</label>
        ${htmlCampParolaInscriere('inscriereParola')}
      </div>
      <div class="form-group">
        <label>${tr('Confirmă parola', 'Confirm password')}</label>
        ${htmlCampParolaInscriere('inscriereParolaConfirmare')}
      </div>
      <div id="captchaLocInscriere" class="captcha-loc"></div>
      <div class="inscriere-butoane">
        <button type="button" class="btn btn-clear" onclick="document.getElementById('inscriereCont').remove()">${tr('Nu acum', 'Not now')}</button>
        <button type="button" class="btn" id="btnInscriereCont" onclick="creeazaContInscriere()">${tr('Creează contul', 'Create account')}</button>
      </div>
      <div class="inscriere-am-cont">${tr('Ai deja cont?', 'Already have an account?')} <a href="${location.pathname}">${tr('Intră în cont', 'Sign in')}</a></div>
    </div>`;
  return html;
}

// Același câmp cu ochișor ca pe ecranul de login (comutaVizibilitateParola)
function htmlCampParolaInscriere(id) {
  return `<div class="password-field-wrap">
      <input type="password" id="${id}" class="form-control" autocomplete="new-password">
      <button type="button" class="password-toggle-btn" onclick="comutaVizibilitateParola('${id}', this)" tabindex="-1" aria-label="${tr('Arată/Ascunde parola', 'Show/Hide password')}">
        <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <svg class="eye-closed" style="display:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
      </button>
    </div>`;
}

// Emailul are deja cont: cererea a ajuns oricum la antrenor, clienta intră cu parola ei
function htmlAreDejaContInscriere() {
  return `<div style="font-weight:800; color:var(--primary);">${tr('Ai deja cont cu acest email', 'You already have an account with this email')}</div>
    <div style="font-size:0.82rem; color:var(--text-muted); margin:4px 0 10px;">${tr('Cererea ta a ajuns la antrenor. Intră în aplicație cu parola pe care o ai deja. Dacă nu o mai știi, apasă „Ai uitat parola?” pe ecranul de conectare.', 'Your request has reached your trainer. Sign in to the app with your existing password. If you forgot it, tap “Forgot password?” on the sign-in screen.')}</div>
    <a class="btn" style="display:block; text-align:center; text-decoration:none;" href="${location.pathname}">${tr('Intră în cont', 'Sign in')}</a>`;
}

// Contul primește rolul de clientă abia după acceptare (leaga_cont_clienta găsește emailul în fișă la login)
async function creeazaContInscriere() {
  const parola = document.getElementById('inscriereParola').value;
  if (parola.length < 8) {
    showToast(t('authErrPassLength'), 'error');
    return;
  }
  if (parola !== document.getElementById('inscriereParolaConfirmare').value) {
    showToast(tr('Parolele nu coincid.', 'Passwords do not match.'), 'error');
    return;
  }
  const btn = document.getElementById('btnInscriereCont');
  btn.disabled = true;
  const captchaToken = await obtineTokenCaptcha().catch(() => null);
  const { data, error } = captchaToken
    ? await supabaseClient.auth.signUp({
      email: (stareInscriere.r.email || '').trim().toLowerCase(),
      password: parola,
      options: { emailRedirectTo: URL_APLICATIE, data: { full_name: (stareInscriere.r.nume || '').trim(), captcha_token: captchaToken } }
    })
    : { data: null, error: new Error('captcha') };
  const mesaj = ((error && error.message) || '').toLowerCase();
  // Cu confirmarea pe email activă, Supabase nu dă eroare pentru un email existent, ci un utilizator fără identități
  const areDejaCont = /already (registered|exists|been registered)/.test(mesaj)
    || (!error && data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);
  if (areDejaCont) {
    document.getElementById('inscriereCont').innerHTML = htmlAreDejaContInscriere();
    return;
  }
  if (error) {
    btn.disabled = false;
    showToast(localizeazaEroareAuth(error.message), 'error');
    return;
  }
  document.getElementById('inscriereCont').innerHTML = data && data.session
    ? `<div style="font-weight:800; color:var(--primary);">${tr('Contul e gata', 'Your account is ready')}</div>
       <div style="font-size:0.82rem; color:var(--text-muted); margin:4px 0 10px;">${tr('Intră oricând în aplicație cu emailul și parola ta.', 'Sign in to the app anytime with your email and password.')}</div>
       <a class="btn" style="display:block; text-align:center; text-decoration:none;" href="${location.pathname}">${tr('Deschide aplicația', 'Open the app')}</a>`
    : `<div style="font-weight:800; color:var(--primary);">${tr('Verifică emailul', 'Check your email')}</div>
       <div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">${tr('Ți-am trimis un link de confirmare. Apasă pe el ca să-ți activezi contul.', 'We sent you a confirmation link. Tap it to activate your account.')}</div>`;
}

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
  actualizeazaRezumatSetari();
  if (!silent) {
    showToast(t('toastThemeUpdated'));
  }
}

// Valorile curente afișate sub cardurile din Setări (Aspect, Limbă, Orar, Link de înscriere)
function actualizeazaRezumatSetari() {
  let tema = localStorage.getItem('beatrix_theme') || 'system';
  let accent = localStorage.getItem('beatrix_accent') || 'blue';
  if (accent === 'violet') accent = 'blue';
  let elAspect = document.getElementById('setariRezumatAspect');
  if (elAspect) elAspect.textContent = [
    t(tema === 'light' ? 'lightTheme' : tema === 'dark' ? 'darkTheme' : 'systemTheme'),
    t('accent' + accent.charAt(0).toUpperCase() + accent.slice(1))
  ].join(' · ');
  let elLimba = document.getElementById('setariRezumatLimba');
  if (elLimba) elLimba.textContent = currentLang === 'en' ? 'English' : 'Română';
  let elOrar = document.getElementById('setariRezumatOrar');
  if (elOrar) elOrar.textContent = tr(`${setariOrar.locuri} locuri pe oră`, `${setariOrar.locuri} spots per hour`)
    + ' · ' + (setariOrar.weekend ? tr('Luni – Duminică', 'Mon – Sun') : tr('Luni – Vineri', 'Mon – Fri'));
  let elInscriere = document.getElementById('setariRezumatInscriere');
  if (elInscriere) elInscriere.textContent = codInscriereAntrenor
    ? linkInscriere(codInscriereAntrenor).replace(/^https?:\/\//, '')
    : tr('Nesetat', 'Not set');
  let elAnt = document.getElementById('setariRezumatAntrenamente');
  if (elAnt) elAnt.textContent = tr(`${setariStudio.antrenamente.length} tipuri`, `${setariStudio.antrenamente.length} types`);
  let elAbonamente = document.getElementById('setariRezumatAbonamente');
  if (elAbonamente) { const n = abonamenteVizibile().length; elAbonamente.textContent = tr(`${n} ${n === 1 ? 'tip' : 'tipuri'}`, `${n} ${n === 1 ? 'type' : 'types'}`); }
  let elPlati = document.getElementById('setariRezumatPlati');
  if (elPlati) elPlati.textContent = tr(`${setariStudio.metodePlata.length} metode`, `${setariStudio.metodePlata.length} methods`) + ' · ' + setariStudio.moneda;
  actualizeazaRezumatNotificari();
}

// Paleta de culori: albastru (implicit; <html data-accent="blue"> din index.html, ca iconița și manifest.json) sau celelalte.
// Petrolul își păstrează valorile în :root din style.css și apare doar când atributul lipsește (vezi scriptul din <head>).
// „violet” (vechiul mov) și petrolul implicit din v95 trec o singură dată pe albastru (beatrix_paleta_v96); movul de acum e „mov”.
const PALETE_ACCENT = ['blue', 'petrol', 'mov', 'red', 'green', 'graphite'];

function actualizeazaButoaneSetariOrar() {
  let val = document.getElementById('setariLocuriValoare');
  if (val) val.textContent = setariOrar.locuri;
  document.getElementById('btnLocuriMinus')?.toggleAttribute('disabled', setariOrar.locuri <= 1);
  document.getElementById('btnLocuriPlus')?.toggleAttribute('disabled', setariOrar.locuri >= 8);
  document.getElementById('btnZileLucru')?.classList.toggle('active', !setariOrar.weekend);
  document.getElementById('btnZileWeekend')?.classList.toggle('active', setariOrar.weekend);
  actualizeazaRezumatSetari();
}

function schimbaLocuriPeOra(pas) {
  seteazaSetariOrar({ locuri: setariOrar.locuri + pas });
}

// dinCont = valorile vin din contul Supabase (alt dispozitiv): se aplică fără să le salvăm înapoi
function seteazaSetariOrar(modificari, dinCont = false) {
  let weekendInainte = setariOrar.weekend;
  Object.assign(setariOrar, modificari);
  setariOrar.locuri = Math.min(8, Math.max(1, Number(setariOrar.locuri) || 3));
  setariOrar.weekend = !!setariOrar.weekend;
  try { localStorage.setItem('beatrix_setari_orar', JSON.stringify(setariOrar)); } catch(e) {}
  actualizeazaButoaneSetariOrar();

  if (setariOrar.weekend !== weekendInainte) {
    // Sâmbăta și duminica, weekendul schimbă săptămâna curentă (fără el, orarul sare la săptămâna următoare)
    let bazaNoua = calculeazaLuniInitial();
    if (bazaNoua.getTime() !== dataReferintaLuniBaza.getTime()) {
      dataReferintaLuniBaza = bazaNoua;
      dataReferintaLuni = new Date(bazaNoua.getTime());
      ziCurentaCheie = getZiImplicitaAzi();
    }
    if (!getZileActive().includes(ziCurentaCheie)) ziCurentaCheie = esteSaptamanaActiva() ? getZiImplicitaAzi() : "Luni";
    actualizeazaBaraZile();
  }
  randeazaOrarInstant();

  if (dinCont || !supabaseClient || !utilizatorCurent) return;
  salvareSetariOrarInCurs++;
  supabaseClient.auth.updateUser({ data: { setari_orar: { ...setariOrar } } })
    .then(({ error }) => { if (error) showToast(tr("Eroare sincronizare", "Sync error"), "error"); })
    .catch(() => showToast(tr("Eroare sincronizare", "Sync error"), "error"))
    .finally(() => { salvareSetariOrarInCurs--; });
}

// ---- Setări › Tipuri de antrenament / Plăți (setariStudio) ----
// dinCont = valorile vin din contul Supabase (alt dispozitiv): se aplică fără să le salvăm înapoi
function seteazaSetariStudio(modificari, dinCont = false) {
  Object.assign(setariStudio, modificari);
  const antrenamente = (Array.isArray(setariStudio.antrenamente) ? setariStudio.antrenamente : ANTRENAMENTE_IMPLICITE)
    .filter(a => a && typeof a.text === 'string' && a.text.trim())
    .map(a => ({ text: a.text.trim(), cls: a.cls === '' || CULORI_ANTRENAMENT.includes(a.cls) ? a.cls : CULORI_ANTRENAMENT[0] }));
  // Aceeași listă (optiuniAntrenamentConfig e o referință la ea)
  optiuniAntrenamentConfig.splice(0, optiuniAntrenamentConfig.length, ...antrenamente);
  setariStudio.antrenamente = optiuniAntrenamentConfig;
  setariStudio.metodePlata = (Array.isArray(setariStudio.metodePlata) ? setariStudio.metodePlata : METODE_PLATA_IMPLICITE)
    .filter(m => typeof m === 'string' && m.trim()).map(m => m.trim());
  if (!MONEDE.includes(setariStudio.moneda)) setariStudio.moneda = 'RON';
  const nr = (v, min, max, implicit) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : implicit; };
  setariStudio.abonamente = (Array.isArray(setariStudio.abonamente) ? setariStudio.abonamente : ABONAMENTE_IMPLICITE)
    .filter(a => a && typeof a.nume === 'string' && a.nume.trim())
    .map(a => {
      const fel = FELURI_ABONAMENT.includes(a.fel) ? a.fel : 'abonament';
      const ab = { nume: a.nume.trim(), pret: nr(a.pret, 0, 1000000, 0), sedinte: fel === 'abonament' ? nr(a.sedinte, 1, 200, 8) : 1, zile: nr(a.zile, 1, 730, 30), fel };
      if (a.oData && fel !== 'gratuita') ab.oData = true;
      if (Array.isArray(a.alias) && a.alias.length) ab.alias = a.alias.filter(x => typeof x === 'string').slice(-10);
      if (a.sters) ab.sters = true;
      return ab;
    });
  try { localStorage.setItem('beatrix_setari_studio', JSON.stringify(setariStudio)); } catch(e) {}

  aplicaSetariPlatiUI();
  randeazaOrarInstant();
  filtreazaIstoricIncasariInstant();

  if (dinCont || !supabaseClient || !utilizatorCurent) return;
  // Schimbările făcute una după alta pleacă într-o singură salvare: mai multe updateUser simultane sunt refuzate
  if (!timerSalvareSetariStudio) salvareSetariStudioInCurs++;
  clearTimeout(timerSalvareSetariStudio);
  timerSalvareSetariStudio = setTimeout(() => {
    timerSalvareSetariStudio = null;
    supabaseClient.auth.updateUser({ data: { setari_studio: JSON.parse(JSON.stringify(setariStudio)) } })
      .then(({ error }) => { if (error) showToast(tr("Eroare sincronizare", "Sync error"), "error"); })
      .catch(() => showToast(tr("Eroare sincronizare", "Sync error"), "error"))
      .finally(() => { salvareSetariStudioInCurs--; });
  }, 800);
}

// Valoarea salvată pe un rând care nu mai e în listă (metodă ștearsă) se adaugă ca opțiune, ca să nu se piardă la salvare
function seteazaValoareSelect(sel, valoare) {
  if (!sel) return;
  if (valoare && ![...sel.options].some(o => o.value === valoare)) sel.add(new Option(traduceValoare(valoare), valoare));
  sel.value = valoare;
}

// Lista din editarea unei plăți, refăcută la fiecare deschidere: o metodă ștearsă apare doar la plata salvată cu ea
function populeazaMetodeEditare(valoare) {
  const sel = document.getElementById('editIncMetoda');
  if (!sel) return;
  sel.innerHTML = '';
  setariStudio.metodePlata.concat('-').forEach(m => sel.add(new Option(traduceValoare(m), m)));
  if (valoare) seteazaValoareSelect(sel, valoare);
}

// Moneda în etichete și sumele propuse; metodele de plată în cele două liste (Încasări și editarea unei plăți)
function aplicaSetariPlatiUI() {
  const moneda = setariStudio.moneda;
  const eticheta = `${t('sumLabel')} (${moneda})`;
  ['labelIncSuma', 'labelEditIncSuma'].forEach(id => { const el = document.getElementById(id); if (el) el.innerText = eticheta; });
  const inpCustom = document.getElementById('incasareSumaCustom');
  if (inpCustom) inpCustom.placeholder = eticheta;
  document.querySelectorAll('#selectSumaPreset option').forEach(o => {
    if (/^\d+$/.test(o.value)) o.textContent = `${o.value} ${moneda}`;
  });

  const selNou = document.getElementById('incasareMetoda');
  if (selNou) {
    const val = selNou.value;
    [...selNou.options].forEach(o => { if (o.id !== 'optMetodaPlaceholder') o.remove(); });
    setariStudio.metodePlata.forEach(m => selNou.add(new Option(traduceValoare(m), m)));
    selNou.value = setariStudio.metodePlata.includes(val) ? val : '';
    actualizeazaStilSelect(selNou);
  }
  const selEdit = document.getElementById('editIncMetoda');
  if (selEdit) populeazaMetodeEditare(selEdit.value);
  aplicaAbonamenteUI();
  randeazaSetariStudio();
  actualizeazaRezumatSetari();
}

// Numele afișat al unui abonament: cu diacritice în română, tradus în engleză (în bază rămâne textul salvat)
const numeAbonamentAfisat = tip => numeAbonamentClienta(tip);

// Alege în listă tipul salvat (și scris puțin altfel, ex. cu spațiu la final); un tip care nu mai e în listă se adaugă ca opțiune
function seteazaTipAbonamentSelect(sel, tip) {
  if (!sel) return;
  const cheie = cheieAbonament(tip);
  const opt = cheie && cheie !== '-' && [...sel.options].find(o => o.value && cheieAbonament(o.value) === cheie);
  if (opt) { sel.value = opt.value; return; }
  if (cheie && cheie !== '-') { sel.add(new Option(numeAbonamentAfisat(tip), String(tip).trim())); sel.value = String(tip).trim(); return; }
  sel.value = [...sel.options].some(o => o.value === '-') ? '-' : (sel.options[0] ? sel.options[0].value : '');
}

// Cele 5 liste de abonamente (Încasări, editarea plății, client nou, activarea și editarea fișei) și sumele propuse, din Setări › Abonamente.
// Opțiunile fixe din index.html (alegerea goală, „Fără abonament”) rămân; activarea fără plată arată doar abonamentele propriu-zise.
function aplicaAbonamenteUI() {
  const vizibile = abonamenteVizibile();
  [['incasareTip', false], ['editIncTip', false], ['nouTipAbonament', false], ['activareTip', true], ['editTip', false]].forEach(([id, doarAbonamente]) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.value;
    [...sel.options].forEach(o => { if (o.value !== '' && o.value !== '-') o.remove(); });
    vizibile.filter(a => !doarAbonamente || a.fel === 'abonament').forEach(a => sel.add(new Option(numeAbonamentAfisat(a.nume), a.nume)));
    if (val) seteazaTipAbonamentSelect(sel, val);
    if (sel.classList.contains('select-faded') || sel.classList.contains('select-active')) actualizeazaStilSelect(sel);
  });
  const selSuma = document.getElementById('selectSumaPreset');
  if (selSuma) {
    const val = selSuma.value;
    const custom = selSuma.querySelector('option[value="custom"]');
    [...selSuma.options].forEach(o => { if (/^\d+$/.test(o.value)) o.remove(); });
    [...new Set(vizibile.map(a => String(a.pret)))].forEach(pret => selSuma.add(new Option(`${pret} ${setariStudio.moneda}`, pret), custom));
    if (val) seteazaValoareSelect(selSuma, val);
  }
}

function randeazaSetariStudio() {
  const randuri = (lista, colorat) => lista.map((el, i) => {
    const text = colorat ? el.text : el;
    const cls = colorat ? el.cls : '';
    return `<div class="setari-lista-rand">
      ${colorat ? `<button type="button" class="setari-lista-culoare slot-input ${cls || 'fara-culoare'}" onclick="schimbaCuloareAntrenament(${i})" title="${tr('Schimbă culoarea', 'Change colour')}" aria-label="${tr('Schimbă culoarea', 'Change colour')}"></button>` : ''}
      <input type="text" class="slot-input setari-lista-input ${cls}" maxlength="40" value="${escAttr(traduceValoare(text))}" onchange="redenumesteElementSetari('${colorat ? 'antrenamente' : 'metodePlata'}', ${i}, this)">
      <button type="button" class="setari-lista-sterge" onclick="stergeElementSetari('${colorat ? 'antrenamente' : 'metodePlata'}', ${i})" title="${tr('Șterge', 'Delete')}" aria-label="${tr('Șterge', 'Delete')}">${SVG_COS_PLAN}</button>
    </div>`;
  }).join('');
  const elAnt = document.getElementById('setariListaAntrenamente');
  if (elAnt) elAnt.innerHTML = randuri(setariStudio.antrenamente, true);
  const elMet = document.getElementById('setariListaMetode');
  if (elMet) elMet.innerHTML = randuri(setariStudio.metodePlata, false);
  const elAb = document.getElementById('setariListaAbonamente');
  if (elAb && !elAb.querySelector('.setari-abonament-form')) elAb.innerHTML = setariStudio.abonamente.map((a, i) => a.sters ? '' :
    `<button type="button" class="setari-abonament-rand" onclick="deschideFormAbonament(${i})">
      <span><b>${escAttr(numeAbonamentAfisat(a.nume))}</b><small>${escAttr(rezumatAbonament(a))}</small></span><span class="drawer-nav-arrow">›</span>
    </button>`).join('');
  const elMon = document.getElementById('setariMonede');
  if (elMon) elMon.innerHTML = MONEDE.map(m =>
    `<button type="button" class="theme-option-btn${m === setariStudio.moneda ? ' active' : ''}" onclick="seteazaSetariStudio({ moneda: '${m}' })">${m}</button>`).join('');
}

const textElementSetari = (lista, el) => lista === 'antrenamente' ? el.text : el;

function existaElementSetari(lista, text, exceptIdx) {
  return setariStudio[lista].some((el, i) => i !== exceptIdx && textElementSetari(lista, el).toLowerCase() === text.toLowerCase());
}

function adaugaElementSetari(lista) {
  const ant = lista === 'antrenamente';
  customConfirm(ant ? tr('Tip nou de antrenament', 'New workout type') : tr('Metodă nouă de plată', 'New payment method'),
    ant ? tr('Poate fi și o combinație, de ex. „Fesieri + Abdomen”.', 'It can also be a combination, e.g. “Glutes + Abs”.') : '',
    (text) => {
      text = (text || '').slice(0, 40).trim();
      if (!text) return;
      if (existaElementSetari(lista, text, -1)) { showToast(tr('Există deja în listă.', 'Already in the list.'), 'error'); return; }
      const nou = ant ? { text, cls: CULORI_ANTRENAMENT[setariStudio.antrenamente.length % CULORI_ANTRENAMENT.length] } : text;
      seteazaSetariStudio({ [lista]: setariStudio[lista].concat([nou]) });
    }, { placeholder: ant ? tr('Nume tip', 'Type name') : tr('Ex. Card, Transfer bancar', 'E.g. Card, Bank transfer') });
}

// Redenumirea schimbă doar ce se alege de acum; rândurile deja salvate își păstrează textul
function redenumesteElementSetari(lista, idx, inp) {
  const vechi = setariStudio[lista][idx];
  if (vechi === undefined) return;
  const text = inp.value.trim();
  if (!text || existaElementSetari(lista, text, idx)) {
    if (text) showToast(tr('Există deja în listă.', 'Already in the list.'), 'error');
    inp.value = traduceValoare(textElementSetari(lista, vechi));
    return;
  }
  // Element implicit afișat tradus și nemodificat: rămâne valoarea românească
  if (text === traduceValoare(textElementSetari(lista, vechi))) return;
  const noua = setariStudio[lista].slice();
  noua[idx] = lista === 'antrenamente' ? { ...vechi, text } : text;
  seteazaSetariStudio({ [lista]: noua });
}

function stergeElementSetari(lista, idx) {
  const el = setariStudio[lista][idx];
  if (el === undefined) return;
  const text = traduceValoare(textElementSetari(lista, el));
  customConfirm(tr(`Ștergi „${text}”?`, `Delete “${text}”?`),
    tr('Nu va mai apărea în listă. Ce s-a salvat deja cu el rămâne neschimbat.', 'It will no longer appear in the list. Anything already saved with it stays unchanged.'),
    () => seteazaSetariStudio({ [lista]: setariStudio[lista].filter((_, i) => i !== idx) }));
}

// Culoarea se alege dintr-o fereastră cu toate culorile, plus „Fără culoare”
let idxCuloareTip = null;

function schimbaCuloareAntrenament(idx) {
  const el = setariStudio.antrenamente[idx];
  if (!el) return;
  idxCuloareTip = idx;
  const nume = traduceValoare(el.text);
  document.getElementById('culoareTipTitlu').innerText = tr(`Culoarea pentru „${nume}”`, `Colour for “${nume}”`);
  document.getElementById('listaCuloriTip').innerHTML = CULORI_ANTRENAMENT.map(cls =>
    `<button type="button" class="culoare-tip-optiune slot-input ${cls}${cls === el.cls ? ' activ' : ''}" onclick="alegeCuloareTip('${cls}')"></button>`).join('');
  const fara = document.getElementById('btnFaraCuloareTip');
  fara.classList.toggle('active', !el.cls);
  document.getElementById('modalCuloareTipBackdrop').style.display = 'flex';
}

function alegeCuloareTip(cls) {
  const el = setariStudio.antrenamente[idxCuloareTip];
  inchideCuloareTip();
  if (!el || el.cls === cls) return;
  const noua = setariStudio.antrenamente.slice();
  noua[idxCuloareTip] = { ...el, cls };
  seteazaSetariStudio({ antrenamente: noua });
}

function inchideCuloareTip() {
  document.getElementById('modalCuloareTipBackdrop').style.display = 'none';
}

// ---- Setări › Abonamente: lista, iar la atingere formularul (nume, fel, preț, ședințe, zile, o dată per client) ----
function rezumatAbonament(a) {
  const pret = `${a.pret} ${setariStudio.moneda}`;
  const oData = a.oData ? ` · ${tr('o dată per client', 'once per client')}` : '';
  if (a.fel === 'gratuita') return tr('Gratuită · o dată per client', 'Free · once per client');
  if (a.fel === 'unica') return `${pret} · ${tr('valabilă în ziua plății', 'valid on the payment day')}${oData}`;
  return `${pret} · ${a.sedinte} ${tr(a.sedinte === 1 ? 'ședință' : 'ședințe', a.sedinte === 1 ? 'session' : 'sessions')} · ${a.zile} ${tr(a.zile === 1 ? 'zi' : 'zile', a.zile === 1 ? 'day' : 'days')}${oData}`;
}

function textOfertaFolosita(tip) {
  const nume = numeAbonamentAfisat(tip);
  return tr(`Clientul a folosit deja „${nume}” (o dată per client).`, `This client already used “${nume}” (once per client).`);
}

let idxFormAbonament = null; // null = abonament nou
let felFormAbonament = 'abonament';

function deschideFormAbonament(idx) {
  const a = idx === null ? { nume: '', pret: '', sedinte: 8, zile: 30, fel: 'abonament' } : setariStudio.abonamente[idx];
  if (!a) return;
  idxFormAbonament = idx;
  const el = document.getElementById('setariListaAbonamente');
  el.innerHTML = `<div class="setari-abonament-form">
    <div class="form-group"><label>${tr('Nume', 'Name')}</label>
      <input type="text" id="formAbNume" class="form-control" maxlength="40" value="${escAttr(idx === null ? '' : numeAbonamentAfisat(a.nume))}" placeholder="${tr('Ex. 8 ședințe', 'E.g. 8 sessions')}"></div>
    <div class="form-group"><label>${tr('Fel', 'Kind')}</label>
      <div class="theme-selector-grid" id="formAbFel">
        ${[['abonament', tr('Abonament', 'Subscription')], ['unica', tr('Ședință unică', 'Single session')], ['gratuita', tr('Gratuită', 'Free')]]
          .map(([f, txt]) => `<button type="button" class="theme-option-btn" data-fel="${f}" onclick="alegeFelAbonament('${f}')">${txt}</button>`).join('')}
      </div>
      <div class="setari-lista-nota" id="formAbFelNota"></div></div>
    <div class="setari-abonament-campuri">
      <div class="form-group" id="formAbPretGrup"><label>${tr('Preț', 'Price')} (${setariStudio.moneda})</label>
        <input type="number" id="formAbPret" class="form-control" min="0" inputmode="numeric" value="${escAttr(a.pret)}"></div>
      <div class="form-group" id="formAbSedinteGrup"><label>${tr('Ședințe', 'Sessions')}</label>
        <input type="number" id="formAbSedinte" class="form-control" min="1" max="200" inputmode="numeric" value="${escAttr(a.sedinte)}"></div>
      <div class="form-group" id="formAbZileGrup"><label>${tr('Valabil (zile)', 'Valid (days)')}</label>
        <input type="number" id="formAbZile" class="form-control" min="1" max="730" inputmode="numeric" value="${escAttr(a.zile)}"></div>
    </div>
    <label class="setari-abonament-bifa" id="formAbODataGrup"><input type="checkbox" id="formAbOData"${a.oData ? ' checked' : ''}>
      <span>${tr('O singură dată per client', 'Once per client')}<small>${tr('Ex. ofertă pentru primul abonament', 'E.g. a first-subscription offer')}</small></span></label>
    <div class="setari-abonament-butoane">
      ${idx === null ? '' : `<button type="button" class="btn btn-clear" onclick="stergeAbonamentSetari()">${tr('Șterge', 'Delete')}</button>`}
      <button type="button" class="btn btn-clear" onclick="inchideFormAbonament()">${tr('Renunță', 'Cancel')}</button>
      <button type="button" class="btn" onclick="salveazaFormAbonament()">${tr('Salvează', 'Save')}</button>
    </div>
    <div class="setari-lista-nota">${tr('Schimbările se aplică abonamentelor activate de acum. Fișele și încasările existente rămân cum sunt.', 'Changes apply to subscriptions activated from now on. Existing profiles and payments stay as they are.')}</div>
  </div>`;
  alegeFelAbonament(a.fel);
  document.getElementById('btnAdaugaAbonament').hidden = true;
  if (idx === null) document.getElementById('formAbNume').focus();
}

function alegeFelAbonament(fel) {
  felFormAbonament = fel;
  document.querySelectorAll('#formAbFel .theme-option-btn').forEach(b => b.classList.toggle('active', b.dataset.fel === fel));
  document.getElementById('formAbSedinteGrup').hidden = fel !== 'abonament';
  document.getElementById('formAbZileGrup').hidden = fel !== 'abonament';
  document.getElementById('formAbPretGrup').hidden = fel === 'gratuita';
  // Gratuita e oricum o dată per client
  document.getElementById('formAbODataGrup').hidden = fel === 'gratuita';
  document.getElementById('formAbFelNota').textContent = {
    abonament: tr('Ședințele se numără; zilele încep de la prima ședință bifată (sau de la data de start aleasă).', 'Sessions are counted; the days start at the first checked session (or the chosen start date).'),
    unica: tr('O ședință, valabilă în ziua plății. Nu se poate da peste un abonament activ.', 'One session, valid on the payment day. Not allowed over an active subscription.'),
    gratuita: tr('O ședință gratuită, valabilă în ziua ei, o singură dată per client.', 'One free session, valid on its day, once per client.')
  }[fel];
}

function inchideFormAbonament() {
  idxFormAbonament = null;
  document.getElementById('setariListaAbonamente').innerHTML = '';
  document.getElementById('btnAdaugaAbonament').hidden = false;
  randeazaSetariStudio();
}

function salveazaFormAbonament() {
  const idx = idxFormAbonament;
  const vechi = idx === null ? null : setariStudio.abonamente[idx];
  let nume = document.getElementById('formAbNume').value.trim().slice(0, 40);
  // Nume implicit afișat cu diacritice sau tradus și nemodificat: rămâne cel salvat
  if (vechi && nume === numeAbonamentAfisat(vechi.nume)) nume = vechi.nume;
  if (!nume) { showToast(tr('Completează numele!', 'Enter the name!'), 'error'); return; }
  const fel = felFormAbonament;
  const campPret = document.getElementById('formAbPret').value;
  const pret = fel === 'gratuita' ? 0 : Number(campPret);
  const sedinte = fel === 'abonament' ? Number(document.getElementById('formAbSedinte').value) : 1;
  const zile = fel === 'abonament' ? Number(document.getElementById('formAbZile').value) : (vechi ? vechi.zile : 30);
  if (fel !== 'gratuita' && (campPret === '' || !(pret >= 0))) { showToast(tr('Completează prețul!', 'Enter the price!'), 'error'); return; }
  if (!(sedinte >= 1 && sedinte <= 200)) { showToast(tr('Ședințe: între 1 și 200.', 'Sessions: between 1 and 200.'), 'error'); return; }
  if (!(zile >= 1 && zile <= 730)) { showToast(tr('Zile: între 1 și 730.', 'Days: between 1 and 730.'), 'error'); return; }
  const cheie = cheieAbonament(nume);
  if (setariStudio.abonamente.some((a, i) => i !== idx && !a.sters && cheieAbonament(a.nume) === cheie)) { showToast(tr('Există deja în listă.', 'Already in the list.'), 'error'); return; }

  // Un tip șters cu același nume e înlocuit de cel nou; numele vechi al unui tip redenumit rămâne ca alias, ca fișele vechi să-și păstreze regulile
  const lista = setariStudio.abonamente.filter((a, i) => i === idx || !(a.sters && cheieAbonament(a.nume) === cheie));
  const nou = { nume, pret, sedinte, zile, fel };
  if (fel !== 'gratuita' && document.getElementById('formAbOData').checked) nou.oData = true;
  if (vechi) {
    const alias = (vechi.alias || []).slice();
    if (cheieAbonament(vechi.nume) !== cheie) alias.push(vechi.nume);
    if (alias.length) nou.alias = alias;
    lista[lista.indexOf(vechi)] = nou;
  } else lista.push(nou);
  idxFormAbonament = null;
  document.getElementById('setariListaAbonamente').innerHTML = '';
  document.getElementById('btnAdaugaAbonament').hidden = false;
  seteazaSetariStudio({ abonamente: lista });
  showToast(tr('✓ Abonament salvat', '✓ Subscription saved'));
}

// Ștergerea îl scoate din liste; regulile lui rămân pentru fișele și încasările vechi
function stergeAbonamentSetari() {
  const idx = idxFormAbonament;
  const a = setariStudio.abonamente[idx];
  if (!a) return;
  if (abonamenteVizibile().length <= 1) { showToast(tr('Păstrează cel puțin un abonament.', 'Keep at least one subscription.'), 'error'); return; }
  const nume = numeAbonamentAfisat(a.nume);
  customConfirm(tr(`Ștergi „${nume}”?`, `Delete “${nume}”?`),
    tr('Nu va mai apărea în liste. Clienții care îl au deja și încasările lui rămân neschimbate.', 'It will no longer appear in the lists. Clients who already have it and its payments stay unchanged.'),
    () => {
      const lista = setariStudio.abonamente.slice();
      lista[idx] = { ...a, sters: true };
      idxFormAbonament = null;
      document.getElementById('setariListaAbonamente').innerHTML = '';
      document.getElementById('btnAdaugaAbonament').hidden = false;
      seteazaSetariStudio({ abonamente: lista });
    });
}


function seteazaAccent(optiune, silent = false) {
  const paleta = PALETE_ACCENT.includes(optiune) ? optiune : 'blue';
  localStorage.setItem('beatrix_accent', paleta);
  if (paleta === 'petrol') document.documentElement.removeAttribute('data-accent');
  else document.documentElement.setAttribute('data-accent', paleta);
  PALETE_ACCENT.forEach(p => {
    document.getElementById('accentBtn' + p.charAt(0).toUpperCase() + p.slice(1))?.classList.toggle('active', p === paleta);
  });
  // Iconița din tab, cea de pe ecranul principal (iOS o citește la „Add to Home Screen”) și logoul de la autentificare urmează paleta
  document.querySelector('link[rel="icon"]')?.setAttribute('href', `icon-${paleta}.png`);
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', `apple-${paleta}.png`);
  document.getElementById('authLogoImg')?.setAttribute('src', `icon-${paleta}.png`);
  actualizeazaRezumatSetari();
  if (!silent) showToast(t('toastThemeUpdated'));
}

function seteazaLimba(lang, silent = false) {
  currentLang = lang;
  localStorage.setItem('beatrix_lang', lang);
  let btnRo = document.getElementById('langBtnRo');
  let btnEn = document.getElementById('langBtnEn');
  if (btnRo) btnRo.classList.toggle('active', lang === 'ro');
  if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  
  aplicaTraduceriInterfataStatic();
  actualizeazaRezumatSetari();
  actualizeazaBaraZile();
  populeazaSelectoriCliente();
  populeazaSelectorLuni();
  populeazaSelectorPlanuri();
  randeazaOrarInstant();
  randeazaProgramariInstant();
  filtreazaIstoricIncasariInstant();
  filtreazaIstoricOrarInstant();
  filtreazaIstoricFisaInstant();
  if (document.getElementById('selectClientaFisa')?.value) afiseazaFisaClientaInstant();

  if (tipTabCurent === 'plan') {
    actualizeazaHeaderVisual('plan', t('workoutPlanTitle'));
    randeazaPlanAntrenamentUI();
  } else {
    let titluTabCurent = currentLang === 'en' ? tabsOrder[tabIndexCurent].titleEn : tabsOrder[tabIndexCurent].titleRo;
    actualizeazaHeaderVisual(tipTabCurent, titluTabCurent);
  }

  if (!silent) {
    showToast(lang === 'ro' ? t('toastLangRo') : t('toastLangEn'));
  }
}

(function() {
  let temaSalvata = localStorage.getItem('beatrix_theme') || 'system';
  seteazaTema(temaSalvata, true);
  // Migrare unică (v96): cine nu a ales nimic, are petrolul implicit din v95 sau vechiul „violet” trece pe albastru
  try {
    if (!localStorage.getItem('beatrix_paleta_v96')) {
      const veche = localStorage.getItem('beatrix_accent');
      if (!veche || veche === 'petrol' || veche === 'violet') localStorage.setItem('beatrix_accent', 'blue');
      localStorage.setItem('beatrix_paleta_v96', '1');
    }
  } catch (e) {}
  seteazaAccent(localStorage.getItem('beatrix_accent') || 'blue', true);
  actualizeazaButoaneSetariOrar();
  // Subsol meniu: anul curent și versiunea din adresa app.js (?v=fitFinalN, urcată la fiecare publicare)
  const elAn = document.getElementById('footerAn');
  if (elAn) elAn.textContent = new Date().getFullYear();
  const potrivireVersiune = (document.querySelector('script[src*="app.js"]')?.getAttribute('src') || '').match(/fitFinal(\d+)/);
  const elVersiune = document.getElementById('footerVersiune');
  if (elVersiune) elVersiune.textContent = potrivireVersiune ? potrivireVersiune[1] : '';
  let langSalvata = localStorage.getItem('beatrix_lang') || 'ro';
  seteazaLimba(langSalvata, true);
})();