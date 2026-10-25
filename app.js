// --- CONFIGURARE SUPABASE ---
const SUPABASE_URL = "https://qfnhluyczxugyqkbyvmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_rikiPkqUDuSPVYdZyGR4Vw_ed371Huz";
let USE_SUPABASE = true;
const URL_APLICATIE = "https://app.beatrixyvett.com/";
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
  { id: 'tabFisa', titleRo: 'Fișă Clientă', titleEn: 'Client Profile', tip: 'fisa', idx: 2 },
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
    addExtraHour: "Adaugă oră suplimentară",
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
    addNewClientTitle: "Adaugă o Clientă Nouă în Aplicație",
    clientNamePlaceholder: "Nume și Prenume clientă",
    saveClientBtn: "Salvează Clienta",
    selectClientLabel: "SELECTEAZĂ CLIENTA",
    showArchived: "Arată și arhivate",
    selectClientOption: "Alege clienta...",
    emptyStateTitle: "Nici o clientă selectată",
    emptyStateDesc: "Alege o clientă din lista de mai sus pentru a-i vizualiza progresul, abonamentul și istoricul.",
    sessionsRemaining: "ȘEDINȚE RĂMASE",
    statusLabel: "STATUS",
    validityLabel: "VALABILITATE PÂNĂ LA",
    sessionsDone: "ȘEDINȚE EFECTUATE",
    editClientTitle: "Editează / Ajustează Datele Clientei",
    renameClientLabel: "Nume Clientă (Redenumește peste tot)",
    subTypeLabel: "Tip Abonament",
    startDateLabel: "Dată Start",
    expDateLabel: "Dată Expirare",
    includedLabel: "Incluse",
    doneLabel: "Efectuate",
    remainingLabel: "Rămase",
    saveChangesBtn: "Salvează Modificările",
    extendValidityTitle: "Prelungește Valabilitate Abonament",
    setBtn: "Setează",
    archiveBtn: "Arhivează / Ascunde din Liste",
    reactivateBtn: "Reactivează Clienta (Arată în Liste)",
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
    accentTitle: "Culoare",
    accentViolet: "Mov",
    accentBlue: "Albastru",
    accentRed: "Roșu",
    accentGreen: "Verde",
    accentGraphite: "Grafit",
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
    editPaymentTitle: "Editare Încasare",
    saveBtn: "Salvează",

    // Plan de Antrenament
    workoutPlanTitle: "Plan de Antrenament",
    drawerWorkoutDesc: "Programe, export PDF, trimitere la cliente",
    planSelectLabel: "ALEGE PLAN",
    btnImportPlan: "Import",
    btnNewPlan: "Plan Nou",
    btnSavePlan: "Salvează",
    btnPreviewPdfMode: "Mod PDF",
    btnEditMode: "Editare",
    btnSharePlan: "Share",
    toastPlanSaved: "✓ Planul de antrenament a fost salvat!",
    toastPlanDeleted: "✓ Planul a fost șters!",
    toastPlanImported: "✓ Fișierul a fost importat cu succes!",
    toastLinkCopied: "✓ Link copiat în clipboard!",
    toastTextCopied: "✓ Antrenament copiat ca text!",
    toastPdfGenerating: "Se generează PDF-ul...",

    authSubtitleLogin: "Autentificare antrenor & administrare",
    authSubtitleSignup: "Creează un cont nou pentru studio",
    authTabLogin: "Intră în cont",
    authTabSignup: "Creează cont",
    authEmailLabel: "Email",
    authPasswordLabel: "Parolă",
    authSubmitBtnLogin: "Intră în cont",
    authSubmitBtnSignup: "Creează cont",
    authMagicLinkBtn: "Conectare fără parolă (Magic Link)",
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
    authLogoutConfirmText: "Ești sigură că vrei să ieși din cont?",

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
    addExtraHour: "Add extra hour",
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
    extendValidityTitle: "Extend Subscription Validity",
    setBtn: "Set",
    archiveBtn: "Archive / Hide from lists",
    reactivateBtn: "Reactivate Client (Show in lists)",
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
    accentTitle: "Color",
    accentViolet: "Violet",
    accentBlue: "Blue",
    accentRed: "Red",
    accentGreen: "Green",
    accentGraphite: "Graphite",
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

    authSubtitleLogin: "Coach authentication & administration",
    authSubtitleSignup: "Create a new studio management account",
    authTabLogin: "Log In",
    authTabSignup: "Create Account",
    authEmailLabel: "Email",
    authPasswordLabel: "Password",
    authSubmitBtnLogin: "Log In",
    authSubmitBtnSignup: "Create Account",
    authMagicLinkBtn: "Passwordless login (Magic Link)",
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
    profile: document.getElementById('drawerProfileView')
  };

  Object.values(layers).forEach(el => {
    if (el) el.classList.remove('active');
  });

  if (layers[strat]) {
    layers[strat].classList.add('active');
  }
}

async function proceseazaSiUploadeazaAvatar(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
  if (!supabaseClient || !utilizatorCurent) {
    showToast(currentLang === 'en' ? 'You must be logged in to upload an avatar!' : 'Trebuie să fii conectată pentru a încărca poza!', 'error');
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
  if (elStart) elStart.value = aziStr;
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
  if (t.indexOf("gratuit") !== -1) return 0;
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

    if (uid) {
      qCli = qCli.eq('user_id', uid);
      qOrar = qOrar.eq('user_id', uid);
      qProg = qProg.eq('user_id', uid);
      qInc = qInc.eq('user_id', uid);
      qPrez = qPrez.eq('user_id', uid);
    }

    const [resCli, resOrar, resProg, resInc, resPrez, resPlan] = await Promise.all([
      qCli, qOrar, qProg, qInc, qPrez, qPlanuri
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
      contConectat: !!c.auth_user_id
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

    return { clienti, orarSloturi, progActive, progHold, incasari, prezente, planuri };
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

      const esteGratuita = (payload.antrenament || "").toLowerCase().indexOf("gratuit") !== -1;
      if (!esteGratuita) {
        let qCl = sb.from('cliente').select('*').ilike('nume', payload.clienta.trim());
        if (uid) qCl = qCl.eq('user_id', uid);
        const { data: clList } = await qCl.limit(1);
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

      const esteGratuita = antrenamentVechi.toLowerCase().indexOf("gratuit") !== -1;
      if (!esteGratuita) {
        let qCl = sb.from('cliente').select('*').ilike('nume', clientaVeche);
        if (uid) qCl = qCl.eq('user_id', uid);
        const { data: clList } = await qCl.limit(1);
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

    let qCli = sb.from('cliente').select('*').ilike('nume', payload.nume.trim());
    if (uid) qCli = qCli.eq('user_id', uid);
    const { data: exCli } = await qCli.limit(1);
    let idCli = "";

    if (!exCli || exCli.length === 0) {
      const rowCliNou = {
        nume: payload.nume.trim(),
        tipAbonament: payload.tip,
        incluse: totalSedinte,
        efectuate: 0,
        ramase: totalSedinte,
        dataStart: dataStartRo,
        dataExpirare: dataExpRo,
        status: "Activ"
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
        status: "Activ"
      }).eq('row', exCli[0].row);
    }

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
    const nouaData = payload.dataManuala
      ? new Date(payload.dataManuala)
      : new Date(new Date().getTime() + (Number(payload.zile) * 86400000));
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
  modalCallback = onConfirm;
}

function closeCustomModal(confirmed) {
  document.getElementById('customModalBackdrop').style.display = 'none';
  const inp = document.getElementById('modalInput');
  if (confirmed && modalCallback) modalCallback(inp.value.trim());
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

function autoScrollLaOraCurenta(faraHighlight = false) {
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
  document.getElementById('accentSectionTitle').innerText = t('accentTitle');
  document.getElementById('accentBtnVioletText').innerText = t('accentViolet');
  document.getElementById('accentBtnBlueText').innerText = t('accentBlue');
  document.getElementById('accentBtnRedText').innerText = t('accentRed');
  document.getElementById('accentBtnGreenText').innerText = t('accentGreen');
  document.getElementById('accentBtnGraphiteText').innerText = t('accentGraphite');
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
    }
    localStorage.setItem('BFIT_ROL', rolUtilizator);
  } catch (e) {
    // fără rețea: ultimul rol cunoscut pe acest dispozitiv
    rolUtilizator = localStorage.getItem('BFIT_ROL') === 'clienta' ? 'clienta' : 'antrenor';
  }
  document.documentElement.setAttribute('data-rol', rolUtilizator); // ascunde din sertar ce e doar pentru antrenor
}

// ---- Ecranul clientei: abonament + planurile ei; Profil și Setări vin din același sertar ca la antrenor ----
let dateClienta = { fisa: null, planuri: [], planCurent: null };
let timerSalvareProgres = null;

function randeazaHomeClienta() {
  const c = dateClienta.fisa;
  dateClienta.planCurent = null;
  document.getElementById('clientaBtnInapoi').style.visibility = 'hidden';
  const prenume = (c.nume || '').trim().split(' ')[0];
  document.getElementById('clientaTitlu').innerText = tr('Salut, ', 'Hi, ') + prenume + '!';
  const rand = (eticheta, valoare) => `<div style="display:flex; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);"><span style="color:var(--text-muted); font-size:0.85rem;">${eticheta}</span><b>${escAttr(String(valoare))}</b></div>`;
  let html = htmlOnboardingClienta() + `<div class="card">
    <div style="font-weight:800; color:var(--primary); margin-bottom:4px;">${tr('Abonamentul meu', 'My subscription')}</div>` +
    rand(tr('Abonament', 'Subscription'), traduceValoare(c.tipAbonament || '-')) +
    rand(tr('Ședințe rămase', 'Sessions left'), c.ramase ?? '-') +
    rand(tr('Ședințe efectuate', 'Sessions done'), `${c.efectuate ?? 0} ${tr('din', 'of')} ${c.incluse ?? 0}`) +
    rand(tr('Valabil până la', 'Valid until'), c.dataExpirare || '-') + `</div>`;

  html += `<div style="font-weight:800; color:var(--primary); margin:14px 2px 6px;">${tr('Planurile mele', 'My plans')}</div>`;
  if (dateClienta.planuri.length === 0) {
    html += `<div class="card" style="color:var(--text-muted); font-size:0.85rem;">${tr('Antrenorul tău nu ți-a trimis încă un plan.', 'Your trainer has not sent you a plan yet.')}</div>`;
  } else {
    dateClienta.planuri.forEach((p, i) => {
      html += `<div class="card drawer-nav-card" style="margin-bottom:8px;" onclick="deschidePlanClienta(${i})">
        <div class="drawer-nav-card-left"><div>
          <div class="drawer-nav-title">${escAttr(p.titlu || tr('Plan de antrenament', 'Workout plan'))}</div>
          <div class="drawer-nav-desc">${escAttr(p.subtitlu || '')}</div>
        </div></div>
        <div class="drawer-nav-arrow">›</div>
      </div>`;
    });
  }
  document.getElementById('clientaContinut').innerHTML = html;
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
  const text = (sec) => `<div class="plan-info-box"><div style="font-size:0.92rem; font-weight:800; color:var(--primary); margin-bottom:5px;">${escAttr(sec.titlu)}</div><div class="plan-info-rendered-text">${escAttr(sec.continut)}</div></div>`;

  let html = `<div class="plan-header-block"><div style="font-size:0.83rem; font-weight:600; color:var(--text-muted);">${escAttr(p.subtitlu)}</div></div>`;
  (cj.sectiuni_inceput || []).forEach(sec => { html += text(sec); });

  (cj.sesiuni || []).forEach((ses, s) => {
    html += `<div class="plan-session-block"><div class="plan-session-header"><div style="font-size:0.95rem; font-weight:800; color:var(--primary);">${escAttr(ses.titlu)}</div></div>`;
    (ses.exercitii || []).forEach((ex, e) => {
      const st = ex.status || '';
      const opt = (v, eticheta) => `<option value="${v}" ${st === v ? 'selected' : ''}>${eticheta}</option>`;
      html += `<div style="padding:8px 10px; border-top:1px solid var(--border);">
        <div style="font-weight:800; color:var(--primary); font-size:0.84rem;">${ex.nr || (e + 1)}. ${escAttr(ex.exercitiu)}</div>
        <div style="font-size:0.75rem; font-weight:700; margin-top:2px;">${escAttr(ex.seturi_repetari)}${ex.pauza ? ` • ${tr('Pauză', 'Rest')}: ${escAttr(ex.pauza)}` : ''}</div>
        ${ex.indicatii ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">${escAttr(ex.indicatii)}</div>` : ''}
        <div class="plan-tracking-grid">
          <div class="plan-tracking-field">
            <span class="plan-tracking-label">${tr('Greutate (kg)', 'Weight (kg)')}</span>
            <input type="text" inputmode="decimal" maxlength="20" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="-" oninput="peModificareProgresClienta(${s}, ${e}, 'greutate_kg', this.value)">
          </div>
          <div class="plan-tracking-field">
            <span class="plan-tracking-label">${tr('Seturi făcute', 'Sets done')}</span>
            <input type="text" inputmode="numeric" maxlength="20" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="-" oninput="peModificareProgresClienta(${s}, ${e}, 'seturi_finalizate', this.value)">
          </div>
          <div class="plan-tracking-field">
            <span class="plan-tracking-label">Status</span>
            <select class="pill-select plan-status-select ${getPillClass(st)}" onchange="this.className='pill-select plan-status-select '+getPillClass(this.value); peModificareProgresClienta(${s}, ${e}, 'status', this.value)">
              ${opt('', 'Status')}${opt('În așteptare', traduceValoare('În așteptare'))}${opt('Finalizat', traduceValoare('Finalizat'))}${opt('Sărit', traduceValoare('Sărit'))}
            </select>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });
  (cj.sectiuni_final || []).forEach(sec => { html += text(sec); });
  if (cj.nota_subsol) html += `<div class="plan-footer-note">${escAttr(cj.nota_subsol)}</div>`;
  html += `<div id="clientaStareSalvare" style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin-top:10px;">${tr('Modificările se salvează automat.', 'Changes are saved automatically.')}</div>`;
  document.getElementById('clientaContinut').innerHTML = html;
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
  // Conexiunea în timp real poate cădea cât telefonul e în fundal: la revenire recitim locurile
  if (document.visibilityState === 'visible' && rolUtilizator === 'clienta' && dateClienta.fisa) laSchimbareOrarClienta();
});

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

const TABURI_CLIENTA = ['acasa', 'orar', 'istoric'];

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
  else randeazaHomeClienta();
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

// Zilele în care clienta are deja o programare (inclusiv una deja efectuată azi): cheie zi -> data și ora programării
function programariPeZiClienta(randuri) {
  const zile = new Map();
  (randuri || []).map(o => dataSlot(o.ziRaw, o.ora)).filter(Boolean).sort((a, b) => a - b).forEach(d => {
    if (!zile.has(cheieZiClienta(d))) zile.set(cheieZiClienta(d), d);
  });
  return zile;
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
    // Anulare singură: doar rezervările făcute de ea în aplicație, cu cel puțin 24h înainte (aceeași regulă ca anuleaza_rezervare)
    const peste24h = (o.data - acum) >= 24 * 3600 * 1000;
    const poateAnula = o.rezervat_online && peste24h;
    const motiv = !o.rezervat_online
      ? tr('Programată de antrenor. Pentru anulare, contactează antrenorul.', 'Booked by your trainer. Contact your trainer to cancel.')
      : tr('Mai puțin de 24h până la ședință. Pentru anulare, contactează antrenorul.', 'Less than 24h before the session. Contact your trainer to cancel.');
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
    // O singură programare pe zi
    html += `<div class="card" style="font-size:0.85rem; line-height:1.4;">${escAttr(tr(
      `Ai deja o programare ${etichetaZiSlot(programataAzi).toLowerCase()} la ${oraSlot(programataAzi)}. Pentru o programare nouă, anuleaz-o întâi pe cea existentă sau contactează antrenorul.`,
      `You already have a booking on ${etichetaZiSlot(programataAzi)} at ${oraSlot(programataAzi)}. To book another, first cancel the existing one or contact your trainer.`))}</div>`;
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

async function randeazaIstoricClienta() {
  document.getElementById('clientaTitlu').innerText = tr('Istoric', 'History');
  const corp = document.getElementById('clientaContinut');
  corp.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${tr('Se încarcă...', 'Loading...')}</div>`;
  const { data, error } = await supabaseClient.from('prezente').select('*').eq('client_id', dateClienta.fisa.id);
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
    document.getElementById('clientaContinut').innerText = tr('Nu am găsit abonamentul. Contactează antrenorul.', 'Subscription not found. Contact your trainer.');
    return;
  }
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
  return tr('Linkul a expirat sau a fost deja folosit. Conectează-te cu email și parolă, sau cere un link nou cu Magic Link.', 'The link has expired or was already used. Sign in with email and password, or request a new link with Magic Link.');
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

    if (esteSaptamanaActiva()) {
      ziCurentaCheie = getZiImplicitaAzi();
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
      let efectuateText = currentLang === 'en' ? 'completed' : 'efectuate';
      let historyText = currentLang === 'en' ? '✓ History' : '✓ Istoric';
      htmlTrecut += `
        <div class="hour-block" data-ora="${ora}">
          <div class="hour-header">
            <div class="hour-title-wrap"><span>🕒 ${ora}</span></div>
            ${(() => {
              // Trecut: doar câte au fost confirmate (fără „/ locuri”); nimic dacă niciuna
              const nrEfectuate = lista.filter(s => s.bifat).length;
              const text = nrEfectuate === 1 ? tr('efectuată', 'completed') : efectuateText;
              return nrEfectuate ? `<div class="hour-badge hour-badge-busy">${nrEfectuate} ${text}</div>` : '';
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

    let badgeHtml = '';
    let clientsBadgeHtml = '';
    let occupiedText = currentLang === 'en' ? 'occupied' : 'ocupate';
    if (esteBlocat) {
      badgeHtml = `<div class="hour-badge hour-badge-blocked">${currentLang === 'en' ? 'Hour Blocked!' : 'Ora Blocată!'}</div>`;
      if (ocupate > 0) clientsBadgeHtml = `<div class="hour-badge hour-badge-busy">${ocupate} / ${total} ${occupiedText}</div>`;
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
          ${clientsBadgeHtml}
          ${badgeHtml}
        </div>
        <div class="hour-slots-wrapper" ${esteBlocat ? 'style="pointer-events: none; user-select: none;"' : ''}>
    `;

    if (esteBlocat) {
      let motivCurent = (sloturiOra.find(s => s && s.motiv) || {}).motiv || '';
      html += `
        <div class="hour-motiv-overlay">
          <textarea class="hour-motiv-input" id="motiv_${ora.replace(':', '')}" rows="2" maxlength="300" placeholder="${tr('Motiv / notiță (ex: programare)', 'Reason / note (e.g. appointment)')}" oninput="peSchimbareMotivOra('${ziCurentaCheie}', '${ora}')">${escAttr(motivCurent)}</textarea>
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

      let slotEsteCompletGol = !clientaCurata && !antVal;
      let clearBtnDisabledAttr = slotEsteCompletGol ? 'disabled' : '';
      let clearBtnClass = slotEsteCompletGol ? 'btn btn-clear btn-clear-disabled' : 'btn btn-clear';

      // Loc liber: numărul e și comutator „deschis pentru rezervări"; loc rezervat de clientă: număr marcat
      let slotNumHtml = `<div class="slot-num">${slotIdx + 1}</div>`;
      if (!isOccupied && !slot.bifat) {
        let titluDeschis = slot.deschis ? tr('Deschis pentru rezervări (apasă ca să închizi)', 'Open for booking (tap to close)') : tr('Închis pentru rezervări (apasă ca să deschizi)', 'Closed for booking (tap to open)');
        slotNumHtml = `<button type="button" class="slot-num slot-num-btn ${slot.deschis ? 'slot-deschis' : ''}" title="${titluDeschis}" onclick="comutaSlotDeschis('${ziCurentaCheie}', '${ora}', ${slotIdx})">${slotIdx + 1}</button>`;
      } else if (slot.rezervatOnline) {
        slotNumHtml = `<div class="slot-num slot-num-online" title="${tr('Rezervat de clientă', 'Booked by the client')}">${slotIdx + 1}</div>`;
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

// O blocare/deblocare în curs: o a doua atingere pe 🕒 ar putea crea rânduri duplicate în baza de date
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
      tr('Deja programată la această oră', 'Already booked at this time'),
      tr(`${nume} este deja programată ${zi} la ${ora}. Nu poate ocupa două locuri la aceeași oră.`,
         `${nume} is already booked on ${zi} at ${ora}. She cannot take two spots at the same time.`),
      function() { arataLocExistent(slot); }
    );
    document.getElementById('modalBtnConfirm').innerText = tr('Arată programarea', 'Show booking');
    return;
  }
  customConfirm(
    tr('Încă o programare în aceeași zi', 'Another booking on the same day'),
    tr(`${nume} are deja o programare ${zi} la ${ora}. O adaugi și la ${oraNoua}?`,
       `${nume} already has a booking on ${zi} at ${ora}. Add her at ${oraNoua} too?`),
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
  badge.textContent = `${nr} / ${inputs.length} ${currentLang === 'en' ? 'occupied' : 'ocupate'}`;
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
  document.getElementById('fisaTipAbonamentAfisat').innerText = traduceValoare(client.tipAbonament);

  let badge = document.getElementById('fisaStatusBadge');
  let stLower = (client.status || '').toLowerCase();
  let statusText = traduceValoare(client.status);
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
  filtreazaIstoricFisaInstant();
}

function actualizeazaBlocContClienta(client) {
  const inp = document.getElementById('fisaEmailInvitatie');
  const stare = document.getElementById('fisaContStatus');
  const btn = document.getElementById('btnInvitaClienta');
  if (!inp || !stare || !btn) return;
  inp.value = client.emailInvitatie || '';
  inp.disabled = client.contConectat;
  btn.style.display = client.contConectat ? 'none' : '';
  btn.innerText = client.emailInvitatie ? tr('Retrimite invitația', 'Resend invitation') : tr('Trimite invitația', 'Send invitation');
  stare.innerText = client.contConectat
    ? tr('Cont conectat', 'Account linked')
    : (client.emailInvitatie ? tr('Așteaptă conectarea', 'Waiting to sign in') : tr('Fără cont', 'No account'));
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

  callBackend("actualizeazaDateClienta", {
    numeVechi: numeVechi, numeNou: numeNou, tip: tip, dataStart: dStart, dataExp: dExp,
    incluse: inc, efectuate: ef, ramase: ram, status: st, telefon: telefon, email: email
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
        <td style="text-align:center; color:var(--text-muted); font-size:0.8rem;"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

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

function creeazaPlanNouCuSablon() {
  dupaConfirmareModificariPlan(pornestePlanNou);
}

function pornestePlanNou() {
  planActiv = construiesteSablonPlanDefault();
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
  showToast(currentLang === 'en' ? '✓ New plan started!' : '✓ Plan nou început!');
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

  let html = '';

  if (doarCitireStructura) {
    html += `
      <div class="plan-header-block">
        <div style="font-size:1.3rem; font-weight:800; color:var(--primary); line-height:1.25;">${escAttr(planActiv.titlu)}</div>
        <div style="font-size:0.83rem; font-weight:600; color:var(--text-muted); margin-top:4px;">${escAttr(planActiv.subtitlu)}</div>
        ${planActiv.clienta ? `<div style="margin-top:6px; font-size:0.78rem; font-weight:700; color:var(--primary);"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${tr('Clientă', 'Client')}: ${escAttr(planActiv.clienta)}</div>` : ''}
      </div>
    `;
  } else {
    html += `
      <div class="plan-header-block">
        <input type="text" class="plan-doc-title-input" value="${escAttr(planActiv.titlu)}" placeholder="${tr('Titlu program (ex: Program de forță generală)', 'Program title (e.g. General strength program)')}" oninput="planActiv.titlu = this.value">
        <input type="text" class="plan-doc-subtitle-input" value="${escAttr(planActiv.subtitlu)}" placeholder="${tr('Subtitlu / detalii (ex: 3 sesiuni pe săptămână)', 'Subtitle / details (e.g. 3 sessions per week)')}" oninput="planActiv.subtitlu = this.value">
        <div class="plan-meta-client-row no-print">
          <span style="font-size:0.76rem; font-weight:700; color:var(--text-muted); white-space:nowrap;"><svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${tr('Clientă', 'Client')}:</span>
          <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem;" value="${escAttr(planActiv.clienta)}" placeholder="${tr('Alege clientă sau lasă liber pentru șablon', 'Choose a client or leave empty for a template')}" list="listaClienteVizibile" oninput="planActiv.clienta = this.value">
        </div>
      </div>
    `;
  }

  cjson.sectiuni_inceput.forEach((sec, sIdx) => {
    if (doarCitireStructura) {
      html += `
        <div class="plan-info-box">
          <div style="font-size:0.92rem; font-weight:800; color:var(--primary); margin-bottom:5px;">${escAttr(sec.titlu)}</div>
          <div class="plan-info-rendered-text">${escAttr(sec.continut)}</div>
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
              <th style="width:12%;">${tr('Serii x Rep.', 'Sets x Reps')}</th>
              <th style="width:10%;">${tr('Pauză', 'Rest')}</th>
              <th style="width:28%;">${tr('Cum se execută / Indicații', 'How to perform / Notes')}</th>
              <th style="width:9%;">Kg</th>
              <th style="width:9%;">${tr('Seturi', 'Sets')}</th>
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
            <td style="font-weight:700; white-space:nowrap;">${escAttr(ex.seturi_repetari)}</td>
            <td style="white-space:nowrap;">${escAttr(ex.pauza || '-')}</td>
            <td>${escAttr(ex.indicatii)}</td>
            <td style="text-align:center; font-weight:700;">${escAttr(ex.greutate_kg || '')}</td>
            <td style="text-align:center; font-weight:700;">${escAttr(ex.seturi_finalizate || '')}</td>
            <td style="text-align:center; font-weight:700;">${escAttr(traduceValoare(stVal))}</td>
          </tr>
        `;
      } else if (esteModClientaShare) {
        html += `
          <tr>
            <td>
              <div style="font-weight:800; color:var(--primary); font-size:0.84rem;">${nrAfisat}. ${escAttr(ex.exercitiu)}</div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--text); margin-top:2px;">
                <svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5"/></svg> ${escAttr(ex.seturi_repetari)} ${ex.pauza ? ` • <svg class="plan-btn-svg" style="display:inline-block; vertical-align:-3px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> ${tr('Pauză', 'Rest')}: ${escAttr(ex.pauza)}` : ''}
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
                  <span class="plan-tracking-label">${tr('Seturi făcute', 'Sets done')}</span>
                  <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="-" readonly>
                </div>
                <div class="plan-tracking-field">
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
                <input type="text" class="plan-ex-input" style="font-weight:700;" value="${escAttr(ex.exercitiu)}" placeholder="${tr('Nume exercițiu', 'Exercise name')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].exercitiu = this.value">
              </div>
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_repetari)}" placeholder="${tr('Seturi x rep/sec', 'Sets x reps/sec')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].seturi_repetari = this.value">
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.pauza)}" placeholder="${tr('Pauză (sec)', 'Rest (sec)')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].pauza = this.value">
            </td>
            <td>
              <textarea class="plan-ex-textarea" placeholder="${tr('Indicații tehnice / cum se execută...', 'Technique notes / how to perform...')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].indicatii = this.value">${escAttr(ex.indicatii)}</textarea>
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="Kg" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].greutate_kg = this.value">
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="${tr('Seturi', 'Sets')}" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].seturi_finalizate = this.value">
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
          <div class="plan-info-rendered-text">${escAttr(sec.continut)}</div>
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
  customConfirm(tr("Ștergere sesiune", "Delete session"), tr("Ești sigură că vrei să ștergi această sesiune și exercițiile ei?", "Are you sure you want to delete this session and its exercises?"), function() {
    planActiv.continut_json.sesiuni.splice(sesIdx, 1);
    randeazaPlanAntrenamentUI();
  });
}

function adaugaExercitiuPlan(sesIdx) {
  const ses = planActiv?.continut_json?.sesiuni?.[sesIdx];
  if (!ses) return;
  if (!Array.isArray(ses.exercitii)) ses.exercitii = [];
  ses.exercitii.push({
    nr: ses.exercitii.length + 1,
    exercitiu: "",
    seturi_repetari: "",
    pauza: "",
    indicatii: "",
    greutate_kg: "",
    seturi_finalizate: "",
    status: ""
  });
  randeazaPlanAntrenamentUI();
}

function stergeExercitiuPlan(sesIdx, exIdx) {
  const ses = planActiv?.continut_json?.sesiuni?.[sesIdx];
  if (!ses || !Array.isArray(ses.exercitii)) return;
  customConfirm(tr("Ștergere exercițiu", "Delete exercise"), tr("Ești sigură că vrei să ștergi acest exercițiu?", "Are you sure you want to delete this exercise?"), function() {
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
      showToast(tr('Plan salvat; am preluat și progresul completat de clientă.', 'Plan saved; client progress was kept too.'));
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

// Librăria de generare PDF se încarcă doar la primul export
function incarcaHtml2Pdf() {
  if (window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Generează fișierul PDF și îl trimite prin meniul nativ de share (sau îl descarcă)
async function exportaPlanCurentPDF() {
  if (!planActiv) return;
  showToast(t('toastPdfGenerating'));

  const eraModPreview = esteModPrevizualizarePdf;
  esteModPrevizualizarePdf = true;
  randeazaPlanAntrenamentUI();

  const titlu = (planActiv.titlu || 'Plan de antrenament').trim();
  const numeFisier = [titlu, planActiv.clienta].filter(Boolean).join(' - ').replace(/[\\/:*?"<>|]/g, '') + '.pdf';

  try {
    await incarcaHtml2Pdf();
    const blob = await html2pdf().set({
      margin: [12, 10],
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        onclone: (doc) => {
          // PDF-ul e mereu pe fundal alb, indiferent de tema aplicației
          doc.documentElement.setAttribute('data-theme', 'light');
          doc.querySelectorAll('.plan-pdf-sheet').forEach(el => el.classList.add('pdf-export'));
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.plan-info-box'] }
    }).from(document.getElementById('planDocumentContainer')).outputPdf('blob');

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
    window.print();
  } finally {
    esteModPrevizualizarePdf = eraModPreview;
    randeazaPlanAntrenamentUI();
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

// Valorile curente afișate sub cardurile din Setări (Aspect, Limbă, Orar)
function actualizeazaRezumatSetari() {
  let tema = localStorage.getItem('beatrix_theme') || 'system';
  let accent = localStorage.getItem('beatrix_accent') || 'violet';
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
}

// Paleta de culori: mov (implicit, fără atribut) sau albastru (data-accent="blue")
const PALETE_ACCENT = ['violet', 'blue', 'red', 'green', 'graphite'];

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
  const paleta = PALETE_ACCENT.includes(optiune) ? optiune : 'violet';
  localStorage.setItem('beatrix_accent', paleta);
  if (paleta === 'violet') document.documentElement.removeAttribute('data-accent');
  else document.documentElement.setAttribute('data-accent', paleta);
  PALETE_ACCENT.forEach(p => {
    document.getElementById('accentBtn' + p.charAt(0).toUpperCase() + p.slice(1))?.classList.toggle('active', p === paleta);
  });
  // Iconița din tab și cea de pe ecranul principal (iOS o citește la „Add to Home Screen”) urmează paleta
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(l => l.setAttribute('href', paleta === 'violet' ? 'icon.svg' : `icon-${paleta}.svg`));
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
  seteazaAccent(localStorage.getItem('beatrix_accent') || 'violet', true);
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