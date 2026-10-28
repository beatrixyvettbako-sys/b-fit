// --- CONFIGURARE SUPABASE ---
const SUPABASE_URL = "https://qfnhluyczxugyqkbyvmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_rikiPkqUDuSPVYdZyGR4Vw_ed371Huz";
let USE_SUPABASE = true;
const URL_APLICATIE = "https://app.beatrixyvett.com/";
// Worker-ul Cloudflare pentru pozele de progres (R2); gol = pozele nu apar în aplicație
const URL_POZE = "https://bfit-poze.beatrixyvett-bako.workers.dev";
// Citit înainte ca Supabase să curețe adresa: venim din emailul „Am uitat parola”
const ESTE_LINK_RESETARE_PAROLA = typeof window !== 'undefined' && /type=recovery/.test(window.location.hash);
const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

let utilizatorCurent = null;
let rolUtilizator = 'antrenor'; // 'antrenor' | 'clienta' (din tabelul profiles)
let tipModAuth = 'login'; // 'login' sau 'signup'

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
    sumLabel: "Sumă (RON)",
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
    btnImportPlan: "Import",
    btnNewPlan: "Plan Nou",
    btnSavePlan: "Salvează",
    btnPreviewPdfMode: "Mod PDF",
    btnEditMode: "Editare",
    btnSharePlan: "Distribuie",
    toastPlanSaved: "✓ Planul de antrenament a fost salvat!",
    toastPlanDeleted: "✓ Planul a fost șters!",
    toastPlanImported: "✓ Fișierul a fost importat cu succes!",
    toastLinkCopied: "✓ Link copiat în clipboard!",
    toastTextCopied: "✓ Antrenament copiat ca text!",
    toastPdfGenerating: "Se generează PDF-ul...",

    authSubtitleLogin: "Antrenamente, programări și progres",
    authSubtitleSignup: "Creează un cont nou pentru studio",
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
    authErrPassLength: "Parola trebuie să aibă cel puțin 6 caractere.",
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
    sumLabel: "Amount (RON)",
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
    btnImportPlan: "Import",
    btnNewPlan: "New Plan",
    btnSavePlan: "Save",
    btnPreviewPdfMode: "PDF Mode",
    btnEditMode: "Edit",
    btnSharePlan: "Share",
    toastPlanSaved: "✓ Workout plan saved!",
    toastPlanDeleted: "✓ Workout plan deleted!",
    toastPlanImported: "✓ File imported successfully!",
    toastLinkCopied: "✓ Link copied to clipboard!",
    toastTextCopied: "✓ Workout copied as text!",
    toastPdfGenerating: "Generating PDF...",

    authSubtitleLogin: "Workouts, bookings and progress",
    authSubtitleSignup: "Create a new studio management account",
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
    authErrPassLength: "Password should be at least 6 characters.",
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
  'activ': 'Active', 'finalizat': 'Completed', 'expirat': 'Expired', 'arhivat': 'Archived',
  'în așteptare': 'Pending', 'sărit': 'Skipped',
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
  return t('authErrGeneric');
}

// ==========================================
// 1. SUPABASE AUTH & SESIUNE UTILIZATOR
// ==========================================

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

  try {
    if (tipModAuth === 'login') {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast(t('authLoginSuccess'));
    } else {
      if (password.length < 6) {
        afiseazaMesajAuthFeedback(t('authErrPassLength'));
        return;
      }
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      });
      if (error) throw error;
      if (data?.session) {
        showToast(t('authSignupSuccess'));
      } else {
        afiseazaMesajAuthFeedback(t('authSignupCheckEmail'), 'success');
      }
    }
  } catch (err) {
    afiseazaMesajAuthFeedback(localizeazaEroareAuth(err.message));
  } finally {
    if (btnSubmit) {
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
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  if (error) afiseazaMesajAuthFeedback(localizeazaEroareAuth(error.message));
  else afiseazaMesajAuthFeedback(tr('Ți-am trimis pe email un link pentru parolă nouă.', 'We emailed you a link to set a new password.'), 'success');
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
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
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
    if (supabaseClient) {
      await dezaboneazaPush();
      await supabaseClient.auth.signOut();
    }
    inchideMeniuLateral();
    localStorage.removeItem('BFIT_DB_LOCAL');
    localStorage.removeItem('BFIT_ROL');
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

  const elName = document.getElementById('drawerUserNameLabel');
  if (elName) elName.innerText = numeComplet;

  const elInpNume = document.getElementById('profileInputNume');
  if (elInpNume) elInpNume.value = numeComplet;

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
    settingsSignup: document.getElementById('drawerSettingsSignupView'),
    profile: document.getElementById('drawerProfileView')
  };

  Object.values(layers).forEach(el => {
    if (el) el.classList.remove('active');
  });

  if (layers[strat]) {
    layers[strat].classList.add('active');
  }
  if ((strat === 'settings' || strat === 'settingsSignup') && rolUtilizator === 'antrenor') incarcaCodInscriere();
  if (strat === 'profile' && rolUtilizator === 'antrenor') incarcaTelefonContact();
}

// ---- Telefonul antrenorului pentru cliente (profiles.telefon_contact) ----
async function incarcaTelefonContact() {
  const inp = document.getElementById('profileInputTelefon');
  if (!supabaseClient || !utilizatorCurent || !inp || document.activeElement === inp) return;
  const { data, error } = await supabaseClient.from('profiles').select('telefon_contact').eq('id', utilizatorCurent.id).maybeSingle();
  if (!error) inp.value = (data && data.telefon_contact) || '';
}

async function salveazaTelefonContact() {
  const tel = (document.getElementById('profileInputTelefon').value || '').trim();
  const { data, error } = await supabaseClient.rpc('seteaza_telefon_contact', { p_telefon: tel });
  if (error || data !== 'ok') {
    showToast(data === 'invalid' ? tr('Număr de telefon invalid.', 'Invalid phone number.') : tr('Nu s-a putut salva.', 'Could not save.'), 'error');
    return;
  }
  showToast(tr('✓ Telefon salvat', '✓ Phone saved'));
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

async function salveazaNumeProfil() {
  if (!supabaseClient || !utilizatorCurent) return;
  const nouNume = (document.getElementById('profileInputNume')?.value || '').trim();
  if (!nouNume) {
    showToast(currentLang === 'en' ? 'Name cannot be empty!' : 'Numele nu poate fi gol!', 'error');
    return;
  }

  const btn = document.getElementById('btnSalveazaNumeProfil');
  if (btn) btn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.updateUser({
      data: { full_name: nouNume }
    });
    if (error) throw error;
    actualizeazaDateProfilUI(data.user);
    showToast(currentLang === 'en' ? '✓ Name updated!' : '✓ Nume actualizat!');
  } catch (err) {
    showToast(err.message || 'Eroare la salvare nume!', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function schimbaParolaProfil() {
  if (!supabaseClient || !utilizatorCurent) return;
  const nouaParola = document.getElementById('profileInputParolaNoua')?.value || '';
  const confirmaParola = document.getElementById('profileInputParolaConfirma')?.value || '';

  if (!nouaParola || nouaParola.length < 6) {
    showToast(currentLang === 'en' ? 'Password must be at least 6 characters!' : 'Parola trebuie să aibă minim 6 caractere!', 'error');
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

// Bara de jos devine compactă (doar iconițe) când utilizatoarea derulează în jos și revine când derulează în sus.
// Reacționează doar la derularea făcută cu degetul / rotița, nu la salturile automate (ex. la ora curentă).
(function () {
  let ultimulY = window.scrollY;
  let ultimaAtingere = 0;
  const marcheazaInteractiune = () => { ultimaAtingere = Date.now(); };
  window.addEventListener('touchmove', marcheazaInteractiune, { passive: true });
  window.addEventListener('wheel', marcheazaInteractiune, { passive: true });

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const delta = y - ultimulY;
    const nav = document.getElementById('bottomNav');
    if (nav && Date.now() - ultimaAtingere < 1200 && Math.abs(delta) > 6) {
      nav.classList.toggle('nav-compact', delta > 0 && y > 40);
    }
    if (nav && y <= 40) nav.classList.remove('nav-compact');
    ultimulY = y;
  }, { passive: true });
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
  optiuniAntrenamentConfig.forEach(item => sel.classList.remove(item.cls));
  let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === (sel.value || "").toLowerCase());
  if (cfg && cfg.cls) {
    sel.classList.add(cfg.cls);
  }
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

    const [resCli, resOrar, resProg, resInc, resPrez, resPlan, resCereri] = await Promise.all([
      qCli, qOrar, qProg, qInc, qPrez, qPlanuri, qCereri
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
      obiectiv: c.obiectiv || null
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
        if (ramase === 0 && incluse > 0) upd.status = "Finalizat";
        // Abonament fără dată de start: pornește la prima ședință bifată, valabil 30 de zile
        if ((!cl.dataStart || cl.dataStart === "-") && payload.dataCalendar) {
          const dStart = new Date(parseazaDataOraRo(payload.dataCalendar));
          const dExp = new Date(dStart.getTime());
          dExp.setDate(dExp.getDate() + 30);
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
        // A fost anulată chiar ședința care a pornit abonamentul: așteaptă din nou prima ședință
        if (efectuate === 0 && cl.dataStart === payload.dataCalendar && !/gratuit|individual/i.test(cl.tipAbonament || "")) {
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
    const tipLower = (payload.tip || "").toLowerCase();
    const esteGratuita = tipLower.indexOf("gratuit") !== -1;
    // Ședința gratuită și cea individuală se plătesc pe loc: valabile doar în ziua plății
    const esteSedintaUnica = esteGratuita || tipLower.indexOf("individual") !== -1;
    const dPlata = payload.dataPlata ? new Date(payload.dataPlata) : new Date();
    // Fără dată de start, abonamentul pornește la prima ședință bifată (vezi bifeazaPrezenta)
    const dStart = esteSedintaUnica ? new Date(dPlata.getTime()) : (payload.dataStart ? new Date(payload.dataStart) : null);
    const dExp = dStart ? new Date(dStart.getTime()) : null;
    if (dExp && !esteSedintaUnica) dExp.setDate(dExp.getDate() + 30);

    const totalSedinte = getNrSedinteAbonamentLocal(payload.tip);
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
      let qG = sb.from('incasari').select('row').ilike('clienta', payload.nume.trim()).ilike('tip', '%gratuit%');
      if (uid) qG = qG.eq('user_id', uid);
      const { data: gratuite } = await qG.limit(1);
      if (gratuite && gratuite.length > 0) return { success: false, refuz: 'gratuita_folosita' };
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
        platit
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
      // și după numele vechi (rândurile fără client_id). Planurile nu au client_id, doar nume.
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
  setTimeout(() => { tEl.className = ''; }, 2600);
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

function peComutareIstoricIncasari(detailsEl) {
  if (detailsEl && detailsEl.open) {
    setTimeout(() => {
      let headerEl = document.getElementById('mainAppHeader');
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
      let headerEl = document.getElementById('mainAppHeader');
      let daySelector = document.getElementById('dayButtonsContainer');
      let hOffset = (headerEl ? headerEl.offsetHeight : 50) + (daySelector ? daySelector.offsetHeight : 45);
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
      let headerEl = document.getElementById('mainAppHeader');
      let hOffset = headerEl ? headerEl.offsetHeight : 50;
      let elTop = detailsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, Math.round(elTop - hOffset - 12)),
        behavior: 'smooth'
      });
    }, 80);
  }
}

// CONTROL HEADER STÂNGA / DREAPTA PE PLANUL DE ANTRENAMENT (BACK / CLOSE)
function gestioneazaClickStangaHeader(event) {
  if (tipTabCurent === 'plan') {
    // Înapoi (‹) duce la meniul din care a fost deschis planul; X din dreapta închide direct
    iesireDinPlanCuConfirmare(() => {
      revenireDinPlanAntrenament();
      if (!esteModClientaShare) deschideMeniuLateral();
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
  const elBtnImport = document.getElementById('btnImportPlanText');
  if (elBtnImport) elBtnImport.innerText = t('btnImportPlan');
  const elBtnNewPlan = document.getElementById('btnNewPlanText');
  if (elBtnNewPlan) elBtnNewPlan.innerText = t('btnNewPlan');
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
  rolUtilizator = 'antrenor';
  if (!supabaseClient || !utilizatorCurent) return;
  try {
    const { data: profil, error } = await supabaseClient.from('profiles').select('rol').eq('id', utilizatorCurent.id).maybeSingle();
    if (error) throw error;
    if (profil && profil.rol === 'clienta') {
      rolUtilizator = 'clienta';
    } else {
      const { data: legat } = await supabaseClient.rpc('leaga_cont_clienta');
      if (legat === true) rolUtilizator = 'clienta';
      else {
        // Cont făcut din formularul de înscriere, cererea neacceptată (în așteptare sau refuzată): nu e antrenor
        const { data: stareCerere } = await supabaseClient.rpc('stare_cerere_inscriere');
        if (stareCerere) rolUtilizator = 'clienta';
      }
    }
    localStorage.setItem('BFIT_ROL', rolUtilizator);
  } catch (e) {
    // fără rețea: ultimul rol cunoscut pe acest dispozitiv
    rolUtilizator = localStorage.getItem('BFIT_ROL') === 'clienta' ? 'clienta' : 'antrenor';
  }
  document.documentElement.setAttribute('data-rol', rolUtilizator); // ascunde din sertar ce e doar pentru antrenor
  incarcaNotificari();
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
  } else if (s.tip === 'nou') {
    titlu = tr('Încă nu ai un abonament activ', 'You don’t have an active subscription yet');
    text = tr('După prima plată, aici îți vezi ședințele și valabilitatea.', 'After your first payment, your sessions and validity show up here.');
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
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  const prenume = (c.nume || '').trim().split(' ')[0];
  document.getElementById('clientaTitlu').innerText = tr('Salut, ', 'Hi, ') + prenume + '!';
  const rand = (eticheta, valoare) => `<div style="display:flex; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);"><span style="color:var(--text-muted); font-size:0.85rem;">${eticheta}</span><b>${escAttr(String(valoare))}</b></div>`;
  let html = htmlReinnoireClienta(c) + htmlOnboardingClienta() + htmlNotaAntrenor(c) + `<div class="card">
    <div style="font-weight:800; color:var(--primary); margin-bottom:4px;">${tr('Abonamentul meu', 'My subscription')}</div>` +
    rand(tr('Abonament', 'Subscription'), traduceValoare(c.tipAbonament || '-')) +
    rand(tr('Ședințe rămase', 'Sessions left'), c.ramase ?? '-') +
    rand(tr('Ședințe efectuate', 'Sessions done'), `${c.efectuate ?? 0} ${tr('din', 'of')} ${c.incluse ?? 0}`) +
    rand(tr('Valabil până la', 'Valid until'), c.dataExpirare || '-') + `</div>`;

  html += `<div style="font-weight:800; color:var(--primary); margin:14px 2px 6px;">${tr('Planurile mele', 'My plans')}</div>`;
  if (dateClienta.planuri.length === 0) {
    html += `<div class="card" style="color:var(--text-muted); font-size:0.85rem;">${tr('Antrenorul tău nu ți-a trimis încă un plan.', 'Your trainer has not sent you a plan yet.')}</div>`;
  } else {
    // Cele mai noi 5 (lista vine ordonată după ultima modificare); restul sunt sub „Vezi toate”
    dateClienta.planuri.forEach((p, i) => {
      if (i >= PLANURI_VIZIBILE_CLIENTA && !dateClienta.arataToatePlanurile) return;
      html += `<div class="card drawer-nav-card" style="margin-bottom:8px;" onclick="deschidePlanClienta(${i})">
        <div class="drawer-nav-card-left"><div>
          <div class="drawer-nav-title">${escAttr(p.titlu || tr('Plan de antrenament', 'Workout plan'))}</div>
          <div class="drawer-nav-desc">${escAttr(p.subtitlu || '')}</div>
        </div></div>
        <div class="drawer-nav-arrow">›</div>
      </div>`;
    });
    const nrPlanuri = dateClienta.planuri.length;
    if (nrPlanuri > PLANURI_VIZIBILE_CLIENTA) {
      html += `<button type="button" class="btn btn-clear" style="width:100%; padding:8px;" onclick="comutaToatePlanurile()">${dateClienta.arataToatePlanurile
        ? tr('Arată mai puține', 'Show fewer')
        : tr(`Vezi toate (${nrPlanuri})`, `See all (${nrPlanuri})`)}</button>`;
    }
  }
  document.getElementById('clientaContinut').innerHTML = html;
}

const PLANURI_VIZIBILE_CLIENTA = 5;

function comutaToatePlanurile() {
  dateClienta.arataToatePlanurile = !dateClienta.arataToatePlanurile;
  randeazaHomeClienta();
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
        ${htmlCampParola('onboardParolaInput', tr('Parolă nouă (min. 6 caractere)', 'New password (min. 6 characters)'))}
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
  if (parola.length < 6) {
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

function clientaInapoi() {
  salveazaProgresClienta();
  randeazaHomeClienta();
}

function deschidePlanClienta(idx) {
  dateClienta.planCurent = JSON.parse(JSON.stringify(dateClienta.planuri[idx]));
  document.getElementById('clientaBtnInapoi').style.visibility = 'visible';
  randeazaPlanClienta();
}

function randeazaPlanClienta() {
  const p = dateClienta.planCurent;
  const cj = p.continut_json || {};
  document.getElementById('clientaTitlu').innerText = p.titlu || tr('Plan de antrenament', 'Workout plan');
  const text = (sec) => `<div class="plan-info-box"><div style="font-size:0.92rem; font-weight:800; color:var(--primary); margin-bottom:5px;">${escAttr(sec.titlu)}</div><div class="plan-info-rendered-text">${htmlTextPlan(sec.continut)}</div></div>`;

  let html = `<div class="plan-header-block"><div style="font-size:0.83rem; font-weight:600; color:var(--text-muted);">${escAttr(p.subtitlu)}</div></div>`;
  (cj.sectiuni_inceput || []).forEach(sec => { html += text(sec); });
  (cj.sesiuni || []).forEach((ses, s) => {
    html += `<div class="plan-session-block"><div class="plan-session-header"><div style="font-size:0.95rem; font-weight:800; color:var(--primary);">${escAttr(ses.titlu)}</div><span class="plan-progres-ses" id="progresSesClienta${s}">${textProgresSesiune(ses)}</span></div>`;
    (ses.exercitii || []).forEach((ex, e) => {
      const facut = ex.status === 'Finalizat';
      const ultimaKg = ultimaGreutateClienta(ex.exercitiu, p.id);
      html += `<div style="padding:8px 10px; border-top:1px solid var(--border);">
        <div style="font-weight:800; color:var(--primary); font-size:0.84rem;">${ex.nr || (e + 1)}. ${escAttr(ex.exercitiu)}</div>
        <div style="font-size:0.75rem; font-weight:700; margin-top:2px;">${ex.seturi_repetari ? `${tr('Serii × repetări', 'Sets × reps')}: ${escAttr(ex.seturi_repetari)}` : ''}${ex.seturi_repetari && ex.pauza ? ' • ' : ''}${ex.pauza ? `${tr('Pauză', 'Rest')}: ${escAttr(ex.pauza)}` : ''}</div>
        ${ex.indicatii ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">${escAttr(ex.indicatii)}</div>` : ''}
        <div class="plan-tracking-grid">
          <div class="plan-tracking-field">
            <span class="plan-tracking-label">${tr('Greutate (kg)', 'Weight (kg)')}</span>
            <input type="text" inputmode="decimal" maxlength="20" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="${ultimaKg ? escAttr(tr('ultima: ', 'last: ') + ultimaKg) : '-'}" oninput="peModificareProgresClienta(${s}, ${e}, 'greutate_kg', this.value)">
          </div>
          <div class="plan-tracking-field">
            <span class="plan-tracking-label">${tr('Serii făcute', 'Sets done')}</span>
            <input type="text" inputmode="numeric" maxlength="20" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="-" oninput="peModificareProgresClienta(${s}, ${e}, 'seturi_finalizate', this.value)">
          </div>
          <div class="plan-tracking-field plan-tracking-status">
            <span class="plan-tracking-label">${tr('Gata?', 'Done?')}</span>
            <button type="button" class="plan-facut-btn ${facut ? 'is-facut' : ''}" aria-pressed="${facut}" onclick="comutaFacutClienta(${s}, ${e}, this)">${facut ? '✓ ' : ''}${tr('Făcut', 'Done')}</button>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });
  (cj.sectiuni_final || []).forEach(sec => { html += text(sec); });
  if (cj.nota_subsol) html += `<div class="plan-footer-note">${escAttr(cj.nota_subsol)}</div>`;
  html += `<div id="clientaStareSalvare" style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin-top:10px;">${tr('Modificările se salvează automat.', 'Changes are saved automatically.')}</div>`;
  html += `<button type="button" class="btn btn-clear" style="width:100%; margin-top:10px;" onclick="exportaPlanCurentPDF(dateClienta.planCurent)">
    <svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg> ${tr('Descarcă PDF', 'Download PDF')}
  </button>`;
  document.getElementById('clientaContinut').innerHTML = html;
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

// „Făcut” bifează exercițiul (status Finalizat) sau îl debifează; progresul zilei se actualizează pe loc
function comutaFacutClienta(s, e, btn) {
  const ses = dateClienta.planCurent?.continut_json?.sesiuni?.[s];
  const ex = ses?.exercitii?.[e];
  if (!ex) return;
  const facut = ex.status !== 'Finalizat';
  peModificareProgresClienta(s, e, 'status', facut ? 'Finalizat' : '');
  btn.classList.toggle('is-facut', facut);
  btn.setAttribute('aria-pressed', facut);
  btn.innerText = (facut ? '✓ ' : '') + tr('Făcut', 'Done');
  const progres = document.getElementById('progresSesClienta' + s);
  if (progres) progres.innerText = textProgresSesiune(ses);
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
  seteazaStareSalvareClienta('Se salvează...', 'Saving...');
  clearTimeout(timerSalvareProgres);
  timerSalvareProgres = setTimeout(salveazaProgresClienta, 1200);
}

// Trimite doar greutatea, seturile și statusul; funcția din baza de date nu atinge restul planului
async function salveazaProgresClienta() {
  const p = dateClienta.planCurent;
  if (timerSalvareProgres === null || !p) return;
  clearTimeout(timerSalvareProgres);
  timerSalvareProgres = null;
  const progres = [];
  (p.continut_json?.sesiuni || []).forEach((ses, s) => (ses.exercitii || []).forEach((ex, e) => {
    progres.push({ s, e, greutate_kg: ex.greutate_kg || '', seturi_finalizate: ex.seturi_finalizate || '', status: ex.status || '' });
  }));
  const { data, error } = await supabaseClient.rpc('salveaza_progres_plan', { p_id: p.id, p_progres: progres });
  if (error || data !== true) {
    seteazaStareSalvareClienta('Nu s-a putut salva. Încearcă din nou.', 'Could not save. Try again.', true);
    showToast(tr('Eroare sincronizare', 'Sync error'), 'error');
    return;
  }
  const i = dateClienta.planuri.findIndex(x => x.id === p.id);
  if (i >= 0) dateClienta.planuri[i] = JSON.parse(JSON.stringify(p));
  seteazaStareSalvareClienta('Salvat ✓', 'Saved ✓');
}

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
  const [resFisa, resPlanuri] = await Promise.all([
    supabaseClient.from('cliente').select('*').eq('auth_user_id', utilizatorCurent.id).limit(1),
    supabaseClient.from('planuri_antrenament').select('*').order('updated_at', { ascending: false })
  ]);
  const c = resFisa.data && resFisa.data[0];
  if (resFisa.error || resPlanuri.error || !c) return;
  dateClienta.fisa = c;
  dateClienta.planuri = resPlanuri.data || [];
  // Doar Acasă se redesenează, și nu cât e deschis un plan: progresul bifat acolo nu se pierde
  if (clientaTabCurent === 'acasa' && !dateClienta.planCurent) randeazaHomeClienta();
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

const TABURI_CLIENTA = ['acasa', 'orar', 'istoric', 'fisa'];

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
  TABURI_CLIENTA.forEach(t => document.getElementById('clientaTab_' + t)?.classList.toggle('active', t === tab));
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  if (tab === 'orar') randeazaOrarClienta();
  else if (tab === 'istoric') randeazaIstoricClienta();
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
    incarcaListaPoze(dateClienta.fisa.id)
  ]);
  if (clientaTabCurent !== 'fisa') return;
  checkinuriClienta = error ? [] : (data || []);
  dateClienta.greutati = resGreutati.error ? [] : (resGreutati.data || []);
  checkinFormular = null;
  afiseazaFisaMeaClienta();
}

function afiseazaFisaMeaClienta() {
  if (checkinLink) return afiseazaCheckinLink();
  const r = dateClienta.fisa && dateClienta.fisa.fisa_inscriere;
  const titlu = text => `<div style="font-weight:800; color:var(--primary); margin:14px 2px 8px;">${text}</div>`;
  let html = `<div class="card checkin-card">${htmlCheckinClienta()}</div>`;
  html += titlu(tr('Progresul meu', 'My progress')) + `<div class="card">${htmlProgres(r, checkinuriClienta, { greutati: dateClienta.greutati || [], obiectiv: dateClienta.fisa.obiectiv })}</div>`;
  html += titlu(tr('Fișa de obiective', 'Goal-setting form')) + (r
    ? `<div class="card">${htmlRaspunsuriInscriere(r, true)}</div>`
    : `<div class="card" style="color:var(--text-muted); font-size:0.85rem;">${tr('Încă nu ai o fișă de obiective. Cere-i antrenorului tău link-ul formularului.', 'You don’t have a goal-setting form yet. Ask your trainer for the form link.')}</div>`);
  document.getElementById('clientaContinut').innerHTML = html;
  umplePoze(document.getElementById('clientaContinut'));
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
async function alegePozaCheckin(unghi, input) {
  const fisier = input.files && input.files[0];
  input.value = '';
  if (!fisier) return;
  try {
    const bmp = await createImageBitmap(fisier);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (!blob) throw new Error('toBlob');
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
      img.closest('.poza-cadru, .poza-mare')?.classList.add('poza-lipsa');
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
    abonament_inactiv: ['Abonamentul tău nu e activ. Contactează antrenorul.', 'Your subscription is not active. Contact your trainer.'],
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

// Bulina de pe Orar: câte ore au locuri deschise pe care clienta le poate rezerva
function seteazaBulinaOrar(nr) {
  const b = document.getElementById('clientaBulinaOrar');
  if (!b) return;
  b.textContent = nr > 9 ? '9+' : String(nr);
  b.hidden = !nr;
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
  if (!resDeschise.error) seteazaBulinaOrar(grupeazaSloturiDeschise(resDeschise.data, programariPeZiClienta(resRezervari.data)).length);
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
  seteazaBulinaOrar(grupuri.length);

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
      <div style="font-size:0.82rem; color:var(--text-muted);">${oraSlot(o.data)}${o.antrenament ? ' • ' + escAttr(o.antrenament) : ''}</div>
      ${poateAnula ? '' : `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">${motiv}</div>`}</div>
      ${poateAnula ? `<button type="button" class="btn btn-clear" style="white-space:nowrap;" onclick="anuleazaRezervareClienta(${o.row})">${tr('Anulează', 'Cancel')}</button>` : ''}
    </div>`;
  });

  html += `<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; margin-top:12px; line-height:1.4;">${tr('Programările făcute de tine aici le poți anula singură cu cel puțin 24 de ore înainte.', 'Bookings you make here can be cancelled on your own up to 24 hours before.')}</div>`;
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
  html += `</div><div style="font-weight:800; color:var(--primary); margin:6px 2px 6px;">${tr('Locuri deschise', 'Open spots')}</div>`;
  const indici = peZi[dateClienta.ziSelectata] || [];
  const programataAzi = dateClienta.zileProgramate && dateClienta.zileProgramate.get(dateClienta.ziSelectata);
  if (programataAzi) {
    // O singură programare pe zi: anularea (sau motivul pentru care nu se poate) chiar aici, nu doar în lista de mai jos
    const d = programataAzi.data;
    const { poateAnula, motiv } = stareAnulareClienta(programataAzi);
    const text = programataAzi.bifat
      ? tr(`Ai avut deja o ședință ${etichetaZiSlot(d).toLowerCase()}, la ${oraSlot(d)}.`, `You already had a session on ${etichetaZiSlot(d)} at ${oraSlot(d)}.`)
      : tr(`Ai deja o programare ${etichetaZiSlot(d).toLowerCase()} la ${oraSlot(d)}.`, `You already have a booking on ${etichetaZiSlot(d)} at ${oraSlot(d)}.`)
        + (poateAnula ? tr(' Pentru altă oră, anuleaz-o întâi.', ' To pick another time, cancel it first.') : '');
    html += `<div class="card" style="font-size:0.85rem; line-height:1.4;">${escAttr(text)}
      ${programataAzi.bifat ? '' : poateAnula
        ? `<button type="button" class="btn btn-clear" style="width:100%; margin-top:8px;" onclick="anuleazaRezervareClienta(${programataAzi.row})">${tr('Anulează programarea', 'Cancel booking')}</button>`
        : `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${motiv}</div>`}</div>`;
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
  { tip: 'checkin', prag: 10, ro: '10 check-in-uri', en: '10 check-ins' }
];
const ICONITE_INSIGNE = {
  sedinte: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  serie: '<path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.3-5.2.2 1.7 1 2.9 2.2 3.4C11.2 8.7 11 5.3 12 2z"/>',
  checkin: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>'
};

function htmlInsigne(nrSedinte, recordSerie, nrCheckin) {
  const valori = { sedinte: nrSedinte, serie: recordSerie, checkin: nrCheckin };
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

async function randeazaIstoricClienta() {
  document.getElementById('clientaTitlu').innerText = tr('Istoric', 'History');
  const corp = document.getElementById('clientaContinut');
  corp.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  const [{ data, error }, { count: nrCheckin }] = await Promise.all([
    supabaseClient.from('prezente').select('*').eq('client_id', dateClienta.fisa.id),
    supabaseClient.from('checkin_saptamanal').select('saptamana', { count: 'exact', head: true }).eq('client_id', dateClienta.fisa.id)
  ]);
  if (clientaTabCurent !== 'istoric') return;
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

  dateClienta.istoric = lista;
  dateClienta.lunaCalendar = new Date(acum.getFullYear(), acum.getMonth(), 1);
  html += htmlSerieClienta(lista) + htmlInsigne(lista.length, calculeazaSerie(lista).record, nrCheckin || 0)
    + `<div class="card calendar-prezente" id="calendarPrezente">${htmlCalendarPrezente()}</div>`;

  if (lista.length === 0) {
    html += `<div class="card" style="color:var(--text-muted); font-size:0.85rem; margin-top:10px;">${tr('Încă nu ai ședințe înregistrate.', 'No sessions recorded yet.')}</div>`;
  }
  let lunaCurenta = '';
  lista.forEach(p => {
    const luna = (currentLang === 'en' ? luniEn : luniRo)[p.d.getMonth()] + ' ' + p.d.getFullYear();
    if (luna !== lunaCurenta) {
      lunaCurenta = luna;
      html += `<div style="font-weight:800; color:var(--primary); margin:14px 2px 6px;">${luna}</div>`;
    }
    html += `<div class="card" style="display:flex; justify-content:space-between; gap:8px; margin-bottom:6px;">
      <div><b>${escAttr(p.data)}</b> <span style="font-size:0.8rem; color:var(--text-muted);">${escAttr(p.ora || '')}</span></div>
      <div style="font-size:0.82rem; font-weight:700; color:var(--primary); text-align:right;">${escAttr(p.antrenament || '-')}</div>
    </div>`;
  });
  corp.innerHTML = html;
}

async function afiseazaEcranClienta() {
  document.getElementById('clientaScreen')?.classList.remove('auth-hidden');
  actualizeazaStareNoScrollBody();
  const [resFisa, resPlanuri] = await Promise.all([
    supabaseClient.from('cliente').select('*').eq('auth_user_id', utilizatorCurent.id).limit(1),
    supabaseClient.from('planuri_antrenament').select('*').order('updated_at', { ascending: false })
  ]);
  const c = resFisa.data && resFisa.data[0];
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
  // Telefonul antrenorului pentru butoanele de pe cardul de reînnoire; vine separat, fără să întârzie ecranul
  supabaseClient.rpc('contact_antrenor').maybeSingle().then(({ data }) => {
    dateClienta.contact = data || null;
    if (data && data.telefon && clientaTabCurent === 'acasa' && !dateClienta.planCurent) randeazaHomeClienta();
  });
  dateClienta.fisa = c;
  dateClienta.planuri = resPlanuri.data || [];
  dateClienta.areParola = await verificaParolaClienta();
  conecteazaCanalOrar(c.user_id, laSchimbareOrarClienta);
  actualizeazaBulinaOrar();
  clientaTab('acasa');
}

// Link de acces expirat sau deja folosit: Supabase întoarce eroarea în adresă (#error_code=otp_expired). O citim și curățăm adresa.
function citesteEroareLinkAuth() {
  const parametri = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
  if (!parametri.get('error') && !parametri.get('error_code')) return '';
  history.replaceState(null, '', window.location.pathname);
  return tr('Linkul a expirat sau a fost deja folosit. Conectează-te cu email și parolă, sau cere un link nou pe email.', 'The link has expired or was already used. Sign in with email and password, or request a new link by email.');
}

// Aplicația antrenorului devine vizibilă doar după ce știm ce ecran urmează (vezi html.app-pornire în CSS)
function terminaPornirea() {
  document.documentElement.classList.remove('app-pornire');
}

async function verificaSesiuneSupabase() {
  const eroareLink = citesteEroareLinkAuth();
  const overlay = document.getElementById('authScreenOverlay');
  if (!supabaseClient) {
    if (overlay) overlay.classList.add('auth-hidden');
    actualizeazaStareNoScrollBody();
    terminaPornirea();
    return true;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    utilizatorCurent = session.user;
    actualizeazaDateProfilUI(session.user);
    await incarcaRolUtilizator();
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
          incarcaRolUtilizator().then(() => {
            if (rolUtilizator === 'clienta') afiseazaEcranClienta();
            else {
              conecteazaCanalOrar(utilizatorCurent.id, laSchimbareOrarAntrenor);
              incarcaBazaDateSilencios(null, true);
            }
            ascundeLogin();
          });
        } else {
          ascundeLogin();
        }
      } else if (event === 'SIGNED_OUT') {
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
  if (aziText !== dataUltimeiVerificari || bazaNoua.getTime() !== dataReferintaLuniBaza.getTime()) {
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

  if (tipTabCurent === 'orar') {
    let now = new Date();
    let day = now.getDay();
    let zileChei = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
    
    if (esteSaptamanaActiva() && ziCurentaCheie === zileChei[day]) {
      autoScrollLaOraCurenta();
    }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    gestioneazaRevenireForeground();
    // La revenirea în aplicație aducem datele noi (ex. rezervări făcute de cliente), fără redeschidere
    let activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
    if (utilizatorCurent && rolUtilizator !== 'clienta' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
      incarcaBazaDateSilencios();
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
      if (esteOrizontal && absX >= pragMinim && !dateClienta.planCurent && i !== -1 && j >= 0 && j < TABURI_CLIENTA.length) {
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

// Abonament propriu-zis (nu ședință gratuită / individuală) încă valabil
function areAbonamentActiv(c) {
  return !/gratuit|individual/i.test(c.tipAbonament || '') && ['activ', 'curand'].includes(stareAbonamentClienta(c).tip);
}

function randeazaListaClienteFisa() {
  const lista = document.getElementById('listaClienteFisa');
  const emptyState = document.getElementById('fisaEmptyState');
  if (!lista) return;
  const arataArhivate = document.getElementById('checkArataArhivate')?.checked;
  const cauta = (document.getElementById('selectClientaFisa')?.value || '').trim().toLowerCase();
  const toate = (DB.clienti || [])
    .map(c => ({ c, s: stareAbonamentClienta(c) }))
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
  if (deUrmarit === 0) filtruListaFisa = 'toate';
  const ordine = { expirat: 0, curand: 1, nou: 2, activ: 3, arhivat: 4 };
  const vizibile = toate
    .filter(x => filtruListaFisa === 'toate' || x.s.urmarit)
    .filter(x => !cauta || x.c.nume.toLowerCase().includes(cauta))
    .sort((a, b) => (ordine[a.s.tip] - ordine[b.s.tip]) || a.c.nume.localeCompare(b.c.nume));

  const filtru = (id, text, n) => `<button type="button" class="lista-filtru${filtruListaFisa === id ? ' active' : ''}" onclick="filtruListaFisa='${id}'; randeazaListaClienteFisa()">${text}<span>${n}</span></button>`;
  const initiale = nume => nume.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  let html = `<div class="lista-filtre">${filtru('toate', tr('Toate', 'All'), toate.length)}${deUrmarit ? filtru('urmarit', tr('De urmărit', 'Needs attention'), deUrmarit) : ''}</div>`;
  html += vizibile.length ? vizibile.map(({ c, s }) => {
    const detalii = s.tip === 'nou' ? tr('Abonamentul se adaugă din Încasări', 'Add the subscription in Payments')
      : [traduceValoare(c.tipAbonament), c.dataExpirare && c.dataExpirare !== '-' ? tr('până la ', 'until ') + c.dataExpirare : ''].filter(Boolean).join(' · ');
    return `<button type="button" class="lista-clienta" data-nume="${escAttr(c.nume)}" onclick="deschideClientaDinLista(this.dataset.nume)">
        <span class="lista-avatar">${escAttr(initiale(c.nume))}</span>
        <span class="lista-info"><b>${escAttr(c.nume)}</b><small>${escAttr(detalii)}</small></span>
        <span class="lista-stare ${s.tip}">${escAttr(s.text)}</span>
      </button>`;
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
        let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === (s.antrenament || "").toLowerCase());
        let colorCls = cfg ? cfg.cls : "";

        if (!s.bifat) {
          // Aceleași ID-uri ca în orarul curent: bifeazaPrezentaSlot / anuleazaSlot citesc numele și antrenamentul din ele
          let cheie = `${ora.replace(':', '')}_${s.slotIndex}`;
          htmlTrecut += `
          <div class="slot-row slot-occupied">
            <div class="slot-num">${idx + 1}</div>
            <div class="slot-info">
              <input type="text" id="cli_${cheie}" class="slot-input" value="${escAttr(s.clienta)}" readonly style="font-weight:700;">
              <input type="text" id="ant_${cheie}" class="slot-input ${colorCls}" value="${escAttr(s.antrenament)}" placeholder="-" readonly style="font-size:0.75rem; font-weight:700; margin-top:2px;">
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

      let colorCls = "";
      if (antVal) {
        let cfg = optiuniAntrenamentConfig.find(item => item.text.toLowerCase() === antVal.toLowerCase());
        if (cfg) colorCls = cfg.cls;
      }

      let tipAntrenamentPlaceholder = currentLang === 'en' ? 'Workout type' : 'Tip antrenament';
      let clientPlaceholder = currentLang === 'en' ? 'Choose existing client...' : 'Alege client existent...';

      let selectAntHtml = `<select id="ant_${slotDomKey}" class="slot-select-type ${antVal ? 'select-active ' + colorCls : 'select-faded'}" onchange="aplicaCuloareAntrenament(this); peSchimbareAntrenament('${ziCurentaCheie}', '${ora}', ${slotIdx})">`;
      selectAntHtml += `<option value="" ${!antVal ? 'selected' : ''}>${tipAntrenamentPlaceholder}</option>`;
      optiuniAntrenamentConfig.forEach(opt => {
        let selected = (antVal === opt.text) ? 'selected' : '';
        selectAntHtml += `<option value="${opt.text}" ${selected}>${opt.text}</option>`;
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
            <input type="text" id="cli_${slotDomKey}" class="slot-input" value="${clientaCurata}" placeholder="${clientPlaceholder}" list="listaClienteVizibile" autocomplete="off" oninput="peSchimbareNumeClienta('${ziCurentaCheie}', '${ora}', ${slotIdx}, event)">
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
  let antrenament = elAnt ? elAnt.value : "";
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
  let antrenament = elAnt ? elAnt.value : "";
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
  let antrenament = elAnt ? elAnt.value : "";

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
            <textarea rows="${item.mentiuni ? 2 : 1}" class="prog-mentiuni-textarea" placeholder="${mentionPlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action" onclick="mutaInHold(${item.row})" title="${currentLang === 'en' ? 'Move to Hold' : 'Mută în Hold'}">${SVG_COS_PLAN}</button>
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
            <textarea rows="${item.mentiuni ? 2 : 1}" class="prog-mentiuni-textarea prog-mentiuni-hold" placeholder="${pausePlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
          </div>
          <div style="text-align:center;">
            <button class="btn-trash-action" onclick="stergeProgramareDefinitiv(${item.row})" title="${currentLang === 'en' ? 'Delete permanently' : 'Șterge definitiv'}">${SVG_COS_PLAN}</button>
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
  customConfirm(currentLang === 'en' ? "Move to Hold" : "Mutare în Hold", currentLang === 'en' ? "Move client to Hold section?" : "Mut clientul în secțiunea Hold?", function() {
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
  document.getElementById('fisaValabilitate').innerText = client.dataExpirare;
  
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
  if (stare.tip === 'activ' || stare.tip === 'curand') {
    badge.innerHTML = `<span class="badge badge-activ">${tr('Activ', 'Active')}</span>`;
  } else if (stare.tip === 'expirat') {
    badge.innerHTML = `<span class="badge badge-expirat">${stare.text}</span>`;
  } else {
    badge.innerHTML = `<span class="badge badge-arhivat">${stare.text}</span>`;
  }

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
  let tipNormalizat = normalizeazaTipAbonament(client.tipAbonament);
  document.getElementById('editTip').value = tipNormalizat;
  document.getElementById('editDataStart').value = client.dataStart;
  document.getElementById('editDataExpirare').value = client.dataExpirare;
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
  detInscriere.hidden = !client.fisaInscriere;
  randeazaFisaInscriereDeschisa();
  // Progresul apare la toți: check-in-urile pot fi și importate (ex. din Google Forms), fără cont sau fișă de obiective
  document.getElementById('detailsProgresClienta').hidden = false;
  incarcaProgresFisa();
  filtreazaIstoricFisaInstant();
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
  return `<div class="card nota-antrenor-card">
      <div class="nota-antrenor-titlu">${tr('Nota antrenorului', 'Note from your trainer')}${c.nota_client_la ? `<small>${formatZiLuna(new Date(c.nota_client_la))}</small>` : ''}</div>
      <div class="nota-antrenor-text">${escAttr(c.nota_client)}</div>
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
function htmlGraficGreutate(puncte) {
  if (puncte.length < 2) {
    return `<div class="progres-gol">${tr('Graficul apare de la a doua greutate înregistrată.', 'The chart appears from the second recorded weight.')}</div>`;
  }
  const L = 320, H = 150, st = 30, dr = 14, sus = 18, jos = 26;
  const kg = puncte.map(p => p.kg);
  let min = Math.min(...kg), max = Math.max(...kg);
  if (max - min < 2) { min -= 1; max += 1; }
  const t0 = puncte[0].d.getTime(), t1 = puncte[puncte.length - 1].d.getTime();
  const x = d => st + (t1 === t0 ? (L - st - dr) / 2 : (d.getTime() - t0) / (t1 - t0) * (L - st - dr));
  const y = v => sus + (max - v) / (max - min) * (H - sus - jos);
  const linii = [max, (max + min) / 2, min].map(v => `<line x1="${st}" x2="${L - dr}" y1="${y(v)}" y2="${y(v)}" class="grafic-grila"/><text x="${st - 6}" y="${y(v) + 3}" class="grafic-axa" text-anchor="end">${formatKg(Math.round(v * 10) / 10)}</text>`).join('');
  const traseu = puncte.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const cercuri = puncte.map((p, i) => {
    const eticheta = `${formatZiLuna(p.d)}: ${formatKg(p.kg)} kg`;
    // Valoarea doar pe primul și ultimul punct, aliniată spre interior (nu peste cifrele axei sau peste margine)
    const capat = i === 0 ? 'start' : i === puncte.length - 1 ? 'end' : '';
    return `<g class="grafic-punct" onclick="arataPunctGrafic(this)" data-text="${escAttr(eticheta)}">
        <circle cx="${x(p.d)}" cy="${y(p.kg)}" r="14" class="grafic-tinta"/>
        <circle cx="${x(p.d)}" cy="${y(p.kg)}" r="4.5" class="grafic-marca"/>
        ${capat ? `<text x="${x(p.d) + (capat === 'start' ? -2 : 2)}" y="${y(p.kg) - 9}" class="grafic-valoare" text-anchor="${capat}">${formatKg(p.kg)}</text>` : ''}
        <title>${escAttr(eticheta)}</title>
      </g>`;
  }).join('');
  return `<svg class="grafic-greutate" viewBox="0 0 ${L} ${H}" role="img" aria-label="${tr('Greutatea în timp', 'Weight over time')}">
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

// ---- Notificări (tabelul notificari): clopoțelul din antet, panoul, actualizare pe loc prin Realtime ----
// Baza salvează doar tipul și datele; textul se compune aici, în limba aleasă.
let notificari = [];
let canalNotificari = null;

async function incarcaNotificari() {
  if (!supabaseClient || !utilizatorCurent) return;
  const { data, error } = await supabaseClient.from('notificari').select('*')
    .eq('user_id', utilizatorCurent.id).eq('ascuns', false).order('created_at', { ascending: false }).limit(60);
  if (error) return; // tabelul nu există încă (scriptul SQL nerulat): fără clopoțel
  notificari = data || [];
  document.querySelectorAll('.btn-notificari').forEach(b => { b.hidden = false; });
  actualizeazaBulinaNotificari();
  if (!canalNotificari) {
    canalNotificari = supabaseClient.channel('notificari-' + utilizatorCurent.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificari', filter: `user_id=eq.${utilizatorCurent.id}` }, payload => {
        notificari.unshift(payload.new);
        actualizeazaBulinaNotificari();
        if (!document.getElementById('panouNotificari').classList.contains('auth-hidden')) randeazaNotificari();
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
      showToast(tr('✓ Notificările sunt pornite pe acest telefon', '✓ Notifications are on for this phone'));
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
    text = tr('Primește notificările pe telefon, chiar și cu aplicația închisă.', 'Get notifications on your phone, even with the app closed.');
    buton = `<button type="button" class="btn" onclick="activeazaPush()">${tr('Pornește', 'Turn on')}</button>`;
  } else if (Notification.permission === 'denied') {
    text = tr('Notificările sunt blocate pentru B-Fit. Le poți porni din setările browserului sau ale telefonului.', 'Notifications are blocked for B-Fit. You can turn them on in your browser or phone settings.');
    buton = `<button type="button" class="notificare-x card-push-x" onclick="ascundeMesajPushBlocat()" aria-label="${tr('Închide', 'Close')}">×</button>`;
  } else {
    return '';
  }
  return `<div class="card card-push${blocate ? ' card-push-blocat' : ''}"><span>${text}</span>${buton}</div>`;
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
    nota_noua: [tr('Notă nouă de la antrenor', 'New note from your trainer'), tr('Antrenorul ți-a lăsat o notă în aplicație.', 'Your trainer left you a note in the app.')]
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
  await supabaseClient.from('notificari').update({ ascuns: true }).eq('id', id);
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
      await supabaseClient.from('notificari').update({ ascuns: true }).in('id', ids);
    });
  document.getElementById('modalBtnConfirm').innerText = tr('Șterge toate', 'Clear all');
}

// Atingerea unei notificări duce la locul potrivit din aplicație
// Tipurile care duc undeva în aplicație; restul (tip necunoscut, client șters) rămân doar de citit
function areDestinatieNotificare(n) {
  const d = n.date || {};
  if (rolUtilizator === 'clienta') return ['plan_nou', 'checkin_memento', 'abonament_expira', 'sedinte_putine', 'programare_maine', 'nota_noua'].includes(n.tip);
  if (n.tip === 'checkin_nou') return (DB.clienti || []).some(c => c.id === d.client_id);
  return ['cerere_noua', 'rezervare', 'anulare', 'lipsa_checkin', 'abonamente_expira'].includes(n.tip);
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
    clientaTab(n.tip === 'programare_maine' ? 'orar' : 'acasa');
    // Planul nou se deschide direct, dacă îl găsim după titlu
    const iPlan = n.tip === 'plan_nou' ? dateClienta.planuri.findIndex(p => p.titlu === (n.date || {}).titlu) : -1;
    if (iPlan !== -1) deschidePlanClienta(iPlan);
    return;
  }
  if (n.tip === 'rezervare' || n.tip === 'anulare') return mergiLaOraDinOrar((n.date || {}).zi, (n.date || {}).ora);
  document.getElementById('navBtnFisa').click();
  if (n.tip === 'cerere_noua') {
    // Cererile noi stau sus, deasupra listei de clienți
    inapoiLaListaClienteFisa();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  partajeaza(text, c.checkinToken ? `${URL_APLICATIE}?checkin=${c.checkinToken}` : URL_APLICATIE);
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
  const [{ data, error }, resGreutati] = await Promise.all([
    supabaseClient.from('checkin_saptamanal').select('*').eq('client_id', client.id),
    supabaseClient.from('greutati').select('*').eq('client_id', client.id),
    incarcaListaPoze(client.id)
  ]);
  if (clientaFisaCurenta() !== client || !det.open) return;
  const checkinuri = error ? [] : (data || []);
  // Fără tabelul greutati (scriptul SQL nerulat) graficul merge doar cu check-in-urile
  greutatiFisa = resGreutati.error ? [] : (resGreutati.data || []);
  corp.innerHTML = htmlProgres(client.fisaInscriere, checkinuri, { greutati: greutatiFisa, obiectiv: client.obiectiv, antrenor: true })
    + (checkinuri.length ? '' : `<div class="progres-gol">${client.contConectat
      ? tr('Clientul nu a făcut încă niciun check-in. Îl face din tab-ul „Fișa mea”.', 'No check-ins yet. The client does it from the “My profile” tab.')
      : tr('Check-in-ul săptămânal apare după ce clientul își face cont.', 'Weekly check-ins appear once the client creates an account.')}</div>`);
}

function randeazaFisaInscriereDeschisa() {
  const det = document.getElementById('detailsFisaInscriere');
  const client = clientaFisaCurenta();
  document.getElementById('fisaInscriereContinut').innerHTML = det.open && client ? htmlRaspunsuriInscriere(client.fisaInscriere) : '';
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
    const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: URL_APLICATIE } });
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

function salveazaEditareClienta() {
  if (valoriEditareFisa() === valoriInitialeFisa) return;
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
  const acelasiNume = n => (n || '').replace(/\s+/g, ' ').trim().toLowerCase() === numeVechi.replace(/\s+/g, ' ').toLowerCase();
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
    () => callBackend("inregistreazaAbonament", { nume: nume, tip: tip, mod: 'fara_plata' }, () => {
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

// Plan complet: structura unui program întreg (principii, încălzire, o sesiune, progresie, siguranță), de adaptat
function construiesteSablonPlanComplet() {
  const plan = construiesteSablonPlanDefault();
  const exercitiu = (nr) => ({ nr, exercitiu: "", seturi_repetari: "3 × 10–12", pauza: "60–90 sec", indicatii: "", greutate_kg: "", seturi_finalizate: "", status: "" });
  plan.continut_json = {
    sectiuni_inceput: [
      {
        titlu: tr("Principii de bază", "Basic principles"),
        continut: tr(
          "- Frecvență: 2–3 sesiuni pe săptămână, cu cel puțin o zi de pauză între ele.\n- Intensitate: la finalul fiecărei serii mai poți face 2–3 repetări curate.\n- Tehnică: contează mai mult decât greutatea. Dacă execuția se strică, oprește seria.\n- Pregătire: apă la îndemână, încălțăminte sport, o masă ușoară cu 1–2 ore înainte.",
          "- Frequency: 2–3 sessions per week, with at least one rest day between them.\n- Intensity: at the end of each set you can still do 2–3 clean reps.\n- Technique: matters more than the weight. If your form breaks, stop the set.\n- Preparation: water at hand, sports shoes, a light meal 1–2 hours before."
        )
      },
      {
        titlu: tr("Structura unei sesiuni", "Session structure"),
        continut: tr(
          "- Încălzire (8–10 min): mers rapid sau bicicletă, rotiri de articulații, genuflexiuni fără greutate.\n- Partea principală (30–40 min): exercițiile din tabel, în ordine.\n- Revenire (5 min): mers lent și întinderi ușoare, 20–30 sec pe grupă.",
          "- Warm-up (8–10 min): brisk walk or bike, joint rotations, bodyweight squats.\n- Main part (30–40 min): the exercises in the table, in order.\n- Cool-down (5 min): slow walk and light stretching, 20–30 sec per muscle group."
        )
      }
    ],
    sesiuni: [{ titlu: tr("Sesiunea A", "Session A"), exercitii: [exercitiu(1), exercitiu(2), exercitiu(3)] }],
    sectiuni_final: [
      {
        titlu: tr("Progresie", "Progression"),
        continut: tr(
          "- Săptămânile 1–2: greutăți mici, accent pe tehnică.\n- Apoi: crești întâi repetările până la capătul intervalului, apoi greutatea.\n- Jurnal: notează greutatea la fiecare exercițiu, direct în aplicație.",
          "- Weeks 1–2: light weights, focus on technique.\n- Then: first increase the reps to the top of the range, then the weight.\n- Log: note the weight for each exercise, right in the app."
        )
      },
      {
        titlu: tr("Când te oprești", "When to stop"),
        continut: tr(
          "- Durere ascuțită în articulații sau în spate.\n- Amețeli, greață sau dificultăți de respirație.\nÎn aceste cazuri oprește sesiunea și anunță antrenorul.",
          "- Sharp pain in the joints or back.\n- Dizziness, nausea or difficulty breathing.\nIn these cases stop the session and tell your trainer."
        )
      },
      {
        titlu: tr("Alimentație și recuperare", "Nutrition and recovery"),
        continut: tr(
          "- Somn: 7–9 ore pe noapte.\n- Alimentație: proteine la fiecare masă și suficientă apă.",
          "- Sleep: 7–9 hours per night.\n- Nutrition: protein at every meal and enough water."
        )
      }
    ],
    nota_subsol: tr(
      "Programul se adaptează împreună cu antrenorul în caz de accidentări sau probleme medicale.",
      "The program is adjusted together with your trainer in case of injuries or medical issues."
    )
  };
  return plan;
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

  // Dacă nu este selectat niciun plan, afișează șablonul default de creare
  if (!planActiv) {
    planActiv = construiesteSablonPlanDefault();
  }

  // Planul deschis și neatins se reia din baza de date (clienta poate fi completat progresul între timp)
  const eraNemodificat = !!(planActiv.id && !estePlanModificat());

  // Preluare proaspătă din Supabase pentru lista de planuri din dropdown
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
        const proaspat = eraNemodificat ? DB.planuri.find(p => String(p.id) === String(planActiv.id)) : null;
        if (proaspat) planActiv = JSON.parse(JSON.stringify(proaspat));
      }
    } catch (err) {
      console.error("Eroare sincronizare planuri:", err);
    }
  }

  populeazaSelectorPlanuri();
  randeazaPlanAntrenamentUI();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function populeazaSelectorPlanuri() {
  const sel = document.getElementById('selectPlanExistent');
  if (!sel) return;

  const idCurent = planActiv && planActiv.id ? planActiv.id : "";
  sel.innerHTML = `<option value="">${currentLang === 'en' ? 'Choose a plan' : 'Alege un plan'}</option>`;

  // Ordine alfabetică naturală (Săptămâna 2 înainte de Săptămâna 10), grupat pe clientă
  const eticheta = p => `${p.clienta ? `[${p.clienta}] ` : ''}${p.titlu}`;
  const sortate = [...(DB.planuri || [])]
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

  grupuri.forEach((lista, cheie) => {
    const grup = document.createElement('optgroup');
    grup.label = cheie;
    lista.forEach(p => adaugaOptiune(grup, p.id, p.text));
    sel.appendChild(grup);
  });

  if (altele.length > 0) {
    const parinte = grupuri.size > 0 ? document.createElement('optgroup') : sel;
    if (parinte !== sel) {
      parinte.label = currentLang === 'en' ? 'Other plans' : 'Alte planuri';
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

  construiestePanelPlanuri(panel, sel);

  if (!panel.children.length) {
    const gol = document.createElement('div');
    gol.className = 'plan-picker-empty';
    gol.textContent = currentLang === 'en' ? 'No saved plans yet' : 'Niciun plan salvat încă';
    panel.appendChild(gol);
  }
}

// ---- Lista de planuri: filtru (client / titlu / șabloane), recente și arhivă ----
const ARHIVA_PLAN_ZILE = 14; // un plan al unui client, nemodificat de atâtea zile, merge sub „Mai vechi” (nu se șterge)
const filtruPlanuri = { sabloane: false, vechiDeschis: false };
const faraDiacritice = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function actualizeazaButonSabloane() {
  document.getElementById('btnFiltruSabloane')?.classList.toggle('active', filtruPlanuri.sabloane);
}

function peFiltruPlanuri() {
  filtruPlanuri.sabloane = false;
  filtruPlanuri.vechiDeschis = false;
  actualizeazaButonSabloane();
  sincronizeazaListaPlanuri();
  comutaListaPlanuri(true);
}

function comutaFiltruSabloane() {
  filtruPlanuri.sabloane = !filtruPlanuri.sabloane;
  const inp = document.getElementById('filtruPlanClient');
  if (inp && filtruPlanuri.sabloane) inp.value = '';
  actualizeazaButonSabloane();
  sincronizeazaListaPlanuri();
  comutaListaPlanuri(true);
}

// Fără text: ultimele 10 planuri. Client exact: planurile lui (recente + „Mai vechi”). Alt text: căutare în client și titlu.
// „Șabloane”: planurile fără client. Select-ul ascuns rămâne sursa valorilor; la alegere i se setează valoarea și declanșează change.
function construiestePanelPlanuri(panel, sel) {
  panel.innerHTML = '';
  const text = faraDiacritice(document.getElementById('filtruPlanClient')?.value);
  const limita = Date.now() - ARHIVA_PLAN_ZILE * 86400000;
  const data = p => new Date(p.updated_at || 0).getTime();
  const toate = [...(DB.planuri || [])].sort((a, b) => data(b) - data(a));
  const esteSablon = p => !(p.clienta || '').trim();

  const rand = (p, textRand) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'plan-picker-item' + (String(p.id) === String(sel.value) ? ' is-selected' : '');
    btn.setAttribute('role', 'option');
    btn.textContent = textRand;
    btn.onclick = () => {
      sel.value = p.id;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      comutaListaPlanuri(false);
      sincronizeazaListaPlanuri();
    };
    panel.appendChild(btn);
  };
  const eticheta = (clasa, txt) => {
    const d = document.createElement('div');
    d.className = clasa;
    d.textContent = txt;
    panel.appendChild(d);
  };
  const titlu = txt => eticheta('plan-picker-group', txt);
  const nota = txt => eticheta('plan-picker-empty', txt);
  const cuClient = p => esteSablon(p) ? `${tr('Șablon', 'Template')} · ${p.titlu}` : `[${p.clienta}] ${p.titlu}`;

  if (filtruPlanuri.sabloane) {
    const lista = toate.filter(esteSablon).sort((a, b) => (a.titlu || '').localeCompare(b.titlu || '', 'ro', { numeric: true, sensitivity: 'base' }));
    titlu(`${tr('Șabloane', 'Templates')} (${lista.length})`);
    if (!lista.length) nota(tr('Niciun șablon încă. Un plan fără client devine șablon.', 'No templates yet. A plan without a client becomes a template.'));
    lista.forEach(p => rand(p, p.titlu));
    return;
  }

  const client = text ? (DB.clienti || []).find(c => faraDiacritice(c.nume) === text) : null;
  if (client) {
    const ale = toate.filter(p => faraDiacritice(p.clienta) === text);
    const recente = ale.filter(p => data(p) >= limita);
    const vechi = ale.filter(p => data(p) < limita);
    titlu(`${client.nume} · ${tr('recente', 'recent')} (${recente.length})`);
    if (!recente.length) nota(tr(`Niciun plan din ultimele ${ARHIVA_PLAN_ZILE} zile.`, `No plan in the last ${ARHIVA_PLAN_ZILE} days.`));
    recente.forEach(p => rand(p, p.titlu));
    if (vechi.length) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'plan-picker-vechi';
      toggle.innerHTML = `<span>${tr('Mai vechi', 'Older')} (${vechi.length})</span><span>${filtruPlanuri.vechiDeschis ? '▲' : '▼'}</span>`;
      toggle.onclick = () => { filtruPlanuri.vechiDeschis = !filtruPlanuri.vechiDeschis; sincronizeazaListaPlanuri(); };
      panel.appendChild(toggle);
      if (filtruPlanuri.vechiDeschis) vechi.forEach(p => rand(p, p.titlu));
    }
    return;
  }

  if (text) {
    const gasite = toate.filter(p => faraDiacritice(p.clienta).includes(text) || faraDiacritice(p.titlu).includes(text));
    titlu(`${tr('Rezultate', 'Results')} (${gasite.length})`);
    if (!gasite.length) nota(tr('Niciun plan găsit.', 'No plan found.'));
    gasite.slice(0, 40).forEach(p => rand(p, cuClient(p)));
    if (gasite.length > 40) nota(tr(`Încă ${gasite.length - 40}. Scrie mai mult ca să restrângi căutarea.`, `${gasite.length - 40} more. Type more to narrow the search.`));
    return;
  }

  if (!toate.length) return;
  titlu(tr('Recente', 'Recent'));
  toate.slice(0, 10).forEach(p => rand(p, cuClient(p)));
  if (toate.length > 10) nota(tr('Alege un client sau caută după titlu ca să vezi restul.', 'Pick a client or search by title to see the rest.'));
}

// ---- Trimite planul la clienți: o copie personală pentru fiecare client bifat ----
let trimitePlanSelectati = new Set();
let trimitereInCurs = false;

const arePlanDeja = (nume, titlu) => (DB.planuri || []).some(p => faraDiacritice(p.clienta) === faraDiacritice(nume) && faraDiacritice(p.titlu) === faraDiacritice(titlu));

function clientiPentruTrimitere() {
  const text = faraDiacritice(document.getElementById('cautaClientTrimitePlan')?.value);
  return (DB.clienti || [])
    .filter(c => !['arhivat', 'archived'].includes((c.status || '').toLowerCase()) && (!text || faraDiacritice(c.nume).includes(text)))
    .sort((a, b) => a.nume.localeCompare(b.nume, 'ro', { sensitivity: 'base' }));
}

function deschideModalTrimitePlan() {
  if (!planActiv) return;
  if (!(planActiv.titlu || '').trim()) {
    showToast(tr('Adaugă un titlu planului înainte să-l trimiți!', 'Add a plan title before sending!'), 'error');
    return;
  }
  inchideModalSharePlan();
  trimitePlanSelectati = new Set();
  const cauta = document.getElementById('cautaClientTrimitePlan');
  if (cauta) cauta.value = '';
  randeazaListaTrimitePlan();
  document.getElementById('modalTrimitePlanBackdrop').style.display = 'flex';
}

function inchideModalTrimitePlan() {
  document.getElementById('modalTrimitePlanBackdrop').style.display = 'none';
}

function randeazaListaTrimitePlan() {
  const lista = document.getElementById('listaTrimitePlan');
  if (!lista) return;
  const titlu = planActiv ? planActiv.titlu : '';
  const clienti = clientiPentruTrimitere();
  lista.innerHTML = clienti.length ? clienti.map(c => `<label class="trimite-plan-rand">
      <input type="checkbox" data-nume="${escAttr(c.nume)}" ${trimitePlanSelectati.has(c.nume) ? 'checked' : ''} onchange="comutaClientTrimitePlan(this)">
      <span>${escAttr(c.nume)}</span>${arePlanDeja(c.nume, titlu) ? `<small>${tr('are deja', 'has it')}</small>` : ''}
    </label>`).join('') : `<div class="plan-picker-empty">${tr('Niciun client găsit.', 'No client found.')}</div>`;
  actualizeazaButonTrimitePlan();
}

function comutaClientTrimitePlan(el) {
  if (el.checked) trimitePlanSelectati.add(el.dataset.nume);
  else trimitePlanSelectati.delete(el.dataset.nume);
  actualizeazaButonTrimitePlan();
}

// „Toți”: bifează clienții afișați care nu au deja planul; apăsat din nou, îi debifează
function bifeazaToatiTrimitePlan() {
  const titlu = planActiv ? planActiv.titlu : '';
  const vizibili = clientiPentruTrimitere().filter(c => !arePlanDeja(c.nume, titlu)).map(c => c.nume);
  const toti = vizibili.length > 0 && vizibili.every(n => trimitePlanSelectati.has(n));
  vizibili.forEach(n => toti ? trimitePlanSelectati.delete(n) : trimitePlanSelectati.add(n));
  randeazaListaTrimitePlan();
}

function actualizeazaButonTrimitePlan() {
  const btn = document.getElementById('btnTrimitePlanAcum');
  if (!btn) return;
  const n = trimitePlanSelectati.size;
  btn.disabled = n === 0 || trimitereInCurs;
  btn.style.opacity = btn.disabled ? '0.55' : '';
  btn.innerText = trimitereInCurs ? tr('Se trimite...', 'Sending...')
    : n === 0 ? tr('Alege clienții', 'Pick clients')
    : tr(`Trimite la ${n} ${n === 1 ? 'client' : 'clienți'}`, `Send to ${n} ${n === 1 ? 'client' : 'clients'}`);
}

async function trimitePlanLaClienti() {
  if (trimitereInCurs || !trimitePlanSelectati.size || !planActiv || !supabaseClient) return;
  const nume = [...trimitePlanSelectati];
  trimitereInCurs = true;
  actualizeazaButonTrimitePlan();

  const uid = utilizatorCurent ? utilizatorCurent.id : null;
  // Copia pornește curată: progresul altcuiva (greutate, serii, status) nu se duce la client
  const continut = JSON.parse(JSON.stringify(planActiv.continut_json || {}));
  (continut.sesiuni || []).forEach(s => (s.exercitii || []).forEach(ex => { ex.greutate_kg = ''; ex.seturi_finalizate = ''; ex.status = ''; }));
  const acum = new Date().toISOString();
  const randuri = nume.map(n => {
    const r = { clienta: n, titlu: (planActiv.titlu || '').trim(), subtitlu: (planActiv.subtitlu || '').trim(), continut_json: continut, updated_at: acum };
    if (uid) r.user_id = uid;
    return r;
  });

  let trimise = 0;
  try {
    for (let i = 0; i < randuri.length; i += 25) {
      const { data, error } = await supabaseClient.from('planuri_antrenament').insert(randuri.slice(i, i + 25)).select();
      if (error) throw error;
      trimise += (data || []).length;
      (data || []).forEach(r => { DB.planuri.unshift(r); trimitePlanSelectati.delete(r.clienta); });
    }
    showToast(tr(`✓ Plan trimis la ${trimise} ${trimise === 1 ? 'client' : 'clienți'}`, `✓ Plan sent to ${trimise} ${trimise === 1 ? 'client' : 'clients'}`));
    inchideModalTrimitePlan();
  } catch (err) {
    console.error('Eroare trimitere plan:', err);
    showToast(tr(`Trimiterea s-a oprit: ${trimise} din ${nume.length} trimise. Reîncearcă pentru restul.`, `Sending stopped: ${trimise} of ${nume.length} sent. Try again for the rest.`), 'error');
  } finally {
    trimitereInCurs = false;
    try { localStorage.setItem('BFIT_DB_LOCAL', JSON.stringify(DB)); } catch (e) {}
    populeazaSelectorPlanuri();
    randeazaListaTrimitePlan();
  }
}

// Un șablon (plan fără client) căruia îi scrii un client ar deveni planul clientului, iar șablonul ar dispărea: întrebăm
function cuGardaSablon(continua) {
  const salvat = planActiv && planActiv.id ? (DB.planuri || []).find(p => String(p.id) === String(planActiv.id)) : null;
  if (!salvat || (salvat.clienta || '').trim() || !(planActiv.clienta || '').trim()) { continua(); return; }
  customConfirm(tr('Planul era un șablon', 'This plan was a template'),
    tr(`Îl salvezi ca plan nou pentru ${planActiv.clienta}, cu șablonul neschimbat, sau transformi șablonul în planul lui?`, `Save it as a new plan for ${planActiv.clienta}, keeping the template, or turn the template into their plan?`),
    () => { planActiv.id = null; continua(); });
  document.getElementById('modalBtnConfirm').innerText = tr('Plan nou', 'New plan');
  aratButonAlternativModal(tr('Transformă șablonul', 'Turn the template into the plan'), continua);
}

function salveazaPlanDinButon() {
  cuGardaSablon(() => salveazaPlanCurentInBaza());
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

  document.addEventListener('click', (e) => {
    if (!selDeschis) return;
    if (panel && panel.contains(e.target)) return;
    if (e.target.closest && e.target.closest('select') === selDeschis) return;
    inchide();
  }, true);

  window.addEventListener('scroll', () => { if (selDeschis) inchide(); }, { passive: true });
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
document.addEventListener('click', (e) => {
  const picker = document.getElementById('planPicker');
  if (picker && picker.classList.contains('is-open') && !picker.contains(e.target)) comutaListaPlanuri(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') comutaListaPlanuri(false);
});

// Planul curent are modificări nesalvate: față de varianta din baza de date (plan salvat) sau față de planul gol (plan nou)
function estePlanModificat() {
  if (!planActiv || esteModClientaShare) return false;
  if (!planActiv.id) return !estePlanNouGol();
  const salvat = (DB.planuri || []).find(p => String(p.id) === String(planActiv.id));
  if (!salvat) return false;
  const cheie = p => JSON.stringify([(p.clienta || '').trim(), (p.titlu || '').trim(), (p.subtitlu || '').trim(), p.continut_json || {}]);
  return cheie(planActiv) !== cheie(salvat);
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
    randeazaPlanAntrenamentUI();
    return;
  }
  const gasit = (DB.planuri || []).find(p => String(p.id) === String(idPlan));
  if (gasit) {
    planActiv = JSON.parse(JSON.stringify(gasit));
    populeazaSelectorPlanuri();
    randeazaPlanAntrenamentUI();
  }
}

// „Plan nou”: complet (cu structura unui program) sau gol (o zi cu un exercițiu)
function creeazaPlanNouCuSablon() {
  dupaConfirmareModificariPlan(() => {
    // Modalul tocmai se închide (închiderea îi golește callback-urile): îl redeschidem după
    setTimeout(() => {
      customConfirm(
        tr("Plan nou", "New plan"),
        tr("Complet: vine cu principii, încălzire, o sesiune și recomandări, de adaptat.\nGol: doar o zi cu un exercițiu.", "Complete: comes with principles, warm-up, one session and tips, ready to adapt.\nEmpty: just one day with one exercise."),
        () => pornestePlanNou(construiesteSablonPlanComplet())
      );
      document.getElementById('modalBtnConfirm').innerText = tr("Plan complet", "Complete plan");
      aratButonAlternativModal(tr("Plan gol", "Empty plan"), () => pornestePlanNou());
    }, 0);
  });
}

// Copie după planul deschis (ex. săptămâna următoare): plan nou, același client, fără progresul lui
function duplicaPlanCurent() {
  if (!planActiv || estePlanNouGol()) {
    showToast(tr("Alege întâi planul pe care vrei să-l copiezi.", "Choose the plan you want to copy first."), "error");
    return;
  }
  const urmatoarea = (s) => (s || '').replace(/(săptămâna|saptamana|week)\s*(\d+)/i, (m, cuvant, nr) => `${cuvant} ${Number(nr) + 1}`);
  const copie = JSON.parse(JSON.stringify({ clienta: planActiv.clienta, titlu: planActiv.titlu, subtitlu: planActiv.subtitlu, continut_json: planActiv.continut_json }));
  copie.id = null;
  copie.titlu = urmatoarea(copie.titlu);
  (copie.continut_json.sesiuni || []).forEach(ses => {
    ses.titlu = urmatoarea(ses.titlu);
    (ses.exercitii || []).forEach(ex => { ex.greutate_kg = ''; ex.seturi_finalizate = ''; ex.status = ''; });
  });
  pornestePlanNou(copie, tr("✓ Copie creată. Verifică titlul și salvează.", "✓ Copy created. Check the title and save."));
}

function pornestePlanNou(plan, mesaj) {
  planActiv = plan || construiesteSablonPlanDefault();
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

function randeazaPlanAntrenamentUI() {
  const container = document.getElementById('planDocumentContainer');
  if (!container) return;
  if (!planActiv) planActiv = construiesteSablonPlanDefault();

  const cjson = planActiv.continut_json || {};
  if (!Array.isArray(cjson.sectiuni_inceput)) cjson.sectiuni_inceput = [];
  if (!Array.isArray(cjson.sesiuni)) cjson.sesiuni = [];
  if (!Array.isArray(cjson.sectiuni_final)) cjson.sectiuni_final = [];

  const doarCitireStructura = esteModPrevizualizarePdf || esteModClientaShare;
  if (!doarCitireStructura) actualizeazaListaExercitii();

  let html = '';

  if (doarCitireStructura) {
    html += `
      <div class="plan-header-block">
        <div style="font-size:1.3rem; font-weight:800; color:var(--primary); line-height:1.25;">${escAttr(planActiv.titlu)}</div>
        <div style="font-size:0.83rem; font-weight:600; color:var(--text-muted); margin-top:4px;">${escAttr(planActiv.subtitlu)}</div>
        ${planActiv.clienta ? `<div style="margin-top:6px; font-size:0.78rem; font-weight:700; color:var(--primary);"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${tr('Client', 'Client')}: ${escAttr(planActiv.clienta)}</div>` : ''}
      </div>
    `;
  } else {
    html += `
      <div class="plan-header-block">
        <input type="text" class="plan-doc-title-input" value="${escAttr(planActiv.titlu)}" placeholder="${tr('Titlu program (ex: Program de forță generală)', 'Program title (e.g. General strength program)')}" oninput="planActiv.titlu = this.value">
        <input type="text" class="plan-doc-subtitle-input" value="${escAttr(planActiv.subtitlu)}" placeholder="${tr('Subtitlu / detalii (ex: 3 sesiuni pe săptămână)', 'Subtitle / details (e.g. 3 sessions per week)')}" oninput="planActiv.subtitlu = this.value">
        <div class="plan-meta-client-row no-print">
          <span style="font-size:0.76rem; font-weight:700; color:var(--text-muted); white-space:nowrap;"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${tr('Client', 'Client')}:</span>
          <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem;" value="${escAttr(planActiv.clienta)}" placeholder="${tr('Alege clientul sau lasă liber pentru șablon', 'Choose a client or leave empty for a template')}" list="listaClienteVizibile" oninput="planActiv.clienta = this.value">
        </div>
      </div>
    `;
  }

  cjson.sectiuni_inceput.forEach((sec, sIdx) => {
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

  if (!doarCitireStructura) {
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

    html += `
      <div class="plan-session-block">
        <div class="plan-session-header">
          ${doarCitireStructura
            ? `<div style="font-size:0.95rem; font-weight:800; color:var(--primary);">${escAttr(ses.titlu)}</div>`
            : `<input type="text" class="plan-session-title-input" value="${escAttr(ses.titlu)}" placeholder="${tr('Titlu Sesiune / Zi', 'Session / Day title')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].titlu = this.value">
               <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSesiunePlan(${sesIdx})" title="${tr('Șterge toată ziua/sesiunea', 'Delete the whole day/session')}">${SVG_COS_PLAN}</button>`
          }
        </div>

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

  if (!doarCitireStructura) {
    html += `
      <div class="no-print" style="margin-bottom:14px;">
        <button type="button" class="btn" style="font-size:0.78rem; padding:7px 12px; width:100%;" onclick="adaugaSesiunePlan()">
          <svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> ${tr('Adaugă Zi / Sesiune Nouă de Antrenament', 'Add New Workout Day / Session')}
        </button>
      </div>
    `;
  }

  cjson.sectiuni_final.forEach((sec, sIdx) => {
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

  if (!doarCitireStructura) {
    html += `
      <div class="no-print" style="margin-bottom:10px;">
        <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 9px;" onclick="adaugaSectiuneTextPlan('sectiuni_final')">
          ${tr('+ Adaugă Secțiune Finală (Siguranță / Alimentație)', '+ Add Final Section (Safety / Nutrition)')}
        </button>
      </div>
    `;
  }

  if (cjson.nota_subsol !== undefined) {
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
  randeazaPlanAntrenamentUI();
}

function stergeSesiunePlan(sesIdx) {
  customConfirm(tr("Ștergere sesiune", "Delete session"), tr("Sigur vrei să ștergi această sesiune și exercițiile ei?", "Are you sure you want to delete this session and its exercises?"), function() {
    planActiv.continut_json.sesiuni.splice(sesIdx, 1);
    randeazaPlanAntrenamentUI();
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

// Exercițiile folosite în planurile salvate (cel mai recent câștigă): sugestii la nume + seriile, pauza și indicațiile lor
function exercitiiCunoscute() {
  const harta = new Map();
  (DB.planuri || []).forEach(p => (p.continut_json?.sesiuni || []).forEach(ses => (ses.exercitii || []).forEach(ex => {
    const cheie = (ex.exercitiu || '').trim().toLowerCase();
    if (cheie && !harta.has(cheie)) harta.set(cheie, ex);
  })));
  return harta;
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

// La alegerea unui exercițiu cunoscut se completează câmpurile goale (seriile, pauza, indicațiile)
function completeazaExercitiuCunoscut(sesIdx, exIdx) {
  const ex = planActiv?.continut_json?.sesiuni?.[sesIdx]?.exercitii?.[exIdx];
  const model = ex && exercitiiCunoscute().get((ex.exercitiu || '').trim().toLowerCase());
  if (!model || model === ex) return;
  let completat = false;
  ['seturi_repetari', 'pauza', 'indicatii'].forEach(camp => {
    if (!(ex[camp] || '').trim() && (model[camp] || '').trim()) {
      ex[camp] = model[camp];
      completat = true;
    }
  });
  if (completat) randeazaPlanAntrenamentUI();
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

// Progresul clientei (greutate, seturi, status) se scrie direct în baza de date. La salvare îl păstrăm
// pentru exercițiile unde antrenorul nu a modificat câmpul și care sunt tot la locul lor (același nume).
// Întoarce true dacă a preluat ceva nou.
async function integreazaProgresClientei() {
  if (!planActiv.id) return false;
  const { data: proaspat } = await supabaseClient.from('planuri_antrenament').select('continut_json').eq('id', planActiv.id).maybeSingle();
  const initial = (DB.planuri || []).find(p => String(p.id) === String(planActiv.id));
  if (!proaspat || !initial) return false;
  let preluat = false;
  (planActiv.continut_json?.sesiuni || []).forEach((ses, s) => (ses.exercitii || []).forEach((ex, e) => {
    const dinBaza = proaspat.continut_json?.sesiuni?.[s]?.exercitii?.[e];
    const dinInitial = initial.continut_json?.sesiuni?.[s]?.exercitii?.[e];
    if (!dinBaza || !dinInitial || (dinBaza.exercitiu || '') !== (ex.exercitiu || '')) return;
    ['greutate_kg', 'seturi_finalizate', 'status'].forEach(camp => {
      if ((ex[camp] || '') === (dinInitial[camp] || '') && (dinBaza[camp] || '') !== (ex[camp] || '')) {
        ex[camp] = dinBaza[camp] || '';
        preluat = true;
      }
    });
  }));
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
  const cheie = p => JSON.stringify([p.clienta, p.titlu, p.subtitlu, p.continut_json]);
  return [construiesteSablonPlanDefault(), construiesteSablonPlanComplet()].some(gol => cheie(planActiv) === cheie(gol));
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
      populeazaSelectorPlanuri();
      randeazaPlanAntrenamentUI();
      showToast(t('toastPlanDeleted'));
    } catch (err) {
      showToast(tr("Eroare la ștergere!", "Error deleting!"), "error");
    }
  });
}

function parseazaLinieCsv(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// Butonul unificat 'Import' acceptă atât JSON cât și CSV
function importaPlanDinFisier(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const text = (e.target.result || '').trim();
    if (!text) return;

    if (file.name.toLowerCase().endsWith('.json') || text.startsWith('{')) {
      try {
        const obj = JSON.parse(text);
        inputEl.value = '';
        // Importul JSON înlocuiește planul curent, deci cere confirmare dacă are modificări nesalvate
        dupaConfirmareModificariPlan(() => {
          if (obj.continut_json) {
            planActiv = obj;
          } else if (obj.sesiuni) {
            if (!planActiv) planActiv = construiesteSablonPlanDefault();
            planActiv.continut_json = obj;
          }
          randeazaPlanAntrenamentUI();
          showToast(t('toastPlanImported'));
        });
        return;
      } catch (err) {
        console.error("Eroare parsare JSON:", err);
      }
    }

    // Fallback: Parsare CSV
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    let titluSesiune = file.name.replace(/\.[^/.]+$/, "");
    const exercitiiImportate = [];

    lines.forEach((line, idx) => {
      const cols = parseazaLinieCsv(line);
      if (idx === 0 && cols[0] && !/^\d+$/.test(cols[0]) && cols[0].toLowerCase() !== 'nr.') {
        titluSesiune = cols[0];
        return;
      }
      if (cols[0] && /^\d+$/.test(cols[0])) {
        exercitiiImportate.push({
          nr: Number(cols[0]) || (exercitiiImportate.length + 1),
          exercitiu: cols[1] || "",
          seturi_repetari: cols[2] || "3 x 15",
          pauza: "60-90 sec",
          indicatii: cols[3] || "",
          greutate_kg: cols[4] || "",
          seturi_finalizate: cols[5] || "",
          status: cols[6] || ""
        });
      }
    });

    if (!planActiv) planActiv = construiesteSablonPlanDefault();
    if (!planActiv.continut_json) planActiv.continut_json = { sectiuni_inceput: [], sesiuni: [], sectiuni_final: [] };

    planActiv.continut_json.sesiuni.push({
      titlu: titluSesiune,
      exercitii: exercitiiImportate
    });

    randeazaPlanAntrenamentUI();
    showToast(t('toastPlanImported'));
    inputEl.value = '';
  };

  reader.readAsText(file, 'UTF-8');
}

// Librăria de PDF (pdfmake, cu fontul Roboto, care are diacriticele) se încarcă doar la primul export
function incarcaPdfMake() {
  if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
  const incarca = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return incarca('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js')
    .then(() => incarca('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js'));
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
      { stack: [{ text: 'B-Fit Studio', bold: true, color: culoare, fontSize: 12 }, { text: site, color: gri, fontSize: 8 }], margin: [8, 3, 0, 0] },
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
    info: { title: titluPlan, author: 'B-Fit Studio' },
    content: continut,
    // Un titlu de secțiune nu rămâne singur la capătul paginii
    pageBreakBefore: (nod, urmatoareleDePePagina) => nod.headlineLevel === 1 && urmatoareleDePePagina.length === 0,
    footer: (pagina, total) => ({
      columns: [
        { text: `B-Fit Studio · ${site}`, color: gri, fontSize: 7.5 },
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

// Generează fișierul PDF și îl trimite prin meniul nativ de share (sau îl descarcă); clientul îl folosește pe planul lui
async function exportaPlanCurentPDF(plan = planActiv) {
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
    if (navigator.canShare && navigator.canShare({ files: [fisier] })) {
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
  // Șablon cu client scris pe el: aceeași întrebare ca la Salvează (dacă renunți, nu se întâmplă nimic)
  await new Promise(continua => cuGardaSablon(() => continua()));
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

function htmlIntrebareInscriere(q) {
  const v = stareInscriere.r[q.id];
  const eticheta = `<label class="inscriere-eticheta" for="insc_${q.id}">${escAttr(textInscriere(q))}${q.ob ? ' <span class="inscriere-obligatoriu">*</span>' : ''}</label>`;
  const chip = (text, activ, onclick) => `<button type="button" class="inscriere-chip${activ ? ' active' : ''}" onclick="${onclick}">${escAttr(text)}</button>`;
  let camp = '';
  if (q.tip === 'paragraf') {
    camp = `<textarea id="insc_${q.id}" class="form-control" rows="2" oninput="seteazaRaspunsInscriere('${q.id}', this.value)">${escAttr(v || '')}</textarea>`;
  } else if (q.tip === 'alegere' || q.tip === 'multi' || q.tip === 'danu' || q.tip === 'scala') {
    let optiuni = q.tip === 'scala' ? OPTIUNI_SCALA : (q.optiuni || OPTIUNI_DA_NU);
    // „Alte obiective” nu repetă obiectivul principal
    if (q.id === 'obiective') optiuni = optiuni.filter(o => o.id !== stareInscriere.r.obiectivPrincipal);
    const multi = q.tip === 'multi';
    camp = `<div class="inscriere-chips${q.tip === 'scala' ? ' inscriere-scala' : ''}">${optiuni.map(o => chip(textInscriere(o),
      multi ? (Array.isArray(v) ? v : []).includes(o.id) : v === o.id,
      `alegeOptiuneInscriere('${q.id}', '${o.id}', ${multi})`)).join('')}</div>`;
    if (q.hint) camp += `<div class="inscriere-hint">${escAttr(textInscriere(q.hint))}</div>`;
    if (q.tip === 'danu' && v === 'da') {
      const det = stareInscriere.r[q.id + 'Detalii'] || '';
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
        <span>${tr('Confirm că informațiile oferite sunt reale și îmi dau acordul pentru prelucrarea lor în scopul serviciilor de antrenament personal.',
          'I confirm that the information I gave is true and I agree to it being processed for personal training services.')}
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
  stareInscriere.r[id] = valoare;
  document.getElementById('inscQ_' + id)?.classList.remove('inscriere-eroare');
  salveazaCiornaInscriere();
}

function alegeOptiuneInscriere(id, optiune, multi) {
  const r = stareInscriere.r;
  if (multi) {
    const lista = Array.isArray(r[id]) ? r[id] : [];
    r[id] = lista.includes(optiune) ? lista.filter(x => x !== optiune) : lista.concat(optiune);
  } else {
    r[id] = optiune;
    // obiectivul principal nu rămâne și printre „alte obiective”
    if (id === 'obiectivPrincipal' && Array.isArray(r.obiective)) r.obiective = r.obiective.filter(x => x !== optiune);
  }
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
        <label>${tr('Alege o parolă (minim 6 caractere)', 'Choose a password (at least 6 characters)')}</label>
        ${htmlCampParolaInscriere('inscriereParola')}
      </div>
      <div class="form-group">
        <label>${tr('Confirmă parola', 'Confirm password')}</label>
        ${htmlCampParolaInscriere('inscriereParolaConfirmare')}
      </div>
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
  if (parola.length < 6) {
    showToast(t('authErrPassLength'), 'error');
    return;
  }
  if (parola !== document.getElementById('inscriereParolaConfirmare').value) {
    showToast(tr('Parolele nu coincid.', 'Passwords do not match.'), 'error');
    return;
  }
  const btn = document.getElementById('btnInscriereCont');
  btn.disabled = true;
  const { data, error } = await supabaseClient.auth.signUp({
    email: (stareInscriere.r.email || '').trim().toLowerCase(),
    password: parola,
    options: { emailRedirectTo: URL_APLICATIE, data: { full_name: (stareInscriere.r.nume || '').trim() } }
  });
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