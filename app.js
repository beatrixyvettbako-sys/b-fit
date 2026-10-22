// --- CONFIGURARE SUPABASE ---
const SUPABASE_URL = "https://qfnhluyczxugyqkbyvmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_rikiPkqUDuSPVYdZyGR4Vw_ed371Huz";
let USE_SUPABASE = true;
const URL_APLICATIE = "https://app.beatrixyvett.com/";
const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

let utilizatorCurent = null;
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
    saveBtn: "Salvează",

    // Plan de Antrenament
    workoutPlanTitle: "Plan de Antrenament",
    drawerWorkoutDesc: "Programe, export PDF & share cliente",
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
    authMagicLinkBtn: "✨ Conectare fără parolă (Magic Link)",
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
    authErrRateLimit: "Prea multe încercări. Te rugăm să aștepți câteva momente.",
    authErrNetwork: "Eroare de conexiune la rețea. Verifică internetul.",
    authErrGeneric: "Eroare la autentificare. Verifică datele introduse și reîncearcă."
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
    authMagicLinkBtn: "✨ Passwordless login (Magic Link)",
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

async function trimiteMagicLink() {
  if (!supabaseClient) return;
  const emailEl = document.getElementById('authEmail');
  const email = (emailEl?.value || '').trim();
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
    window.location.reload();
  });
}

function actualizeazaDateProfilUI(user) {
  if (!user) return;
  utilizatorCurent = user;

  const meta = user.user_metadata || {};
  const numeComplet = meta.full_name || meta.name || user.email?.split('@')[0] || 'Beatrix';
  const prenume = numeComplet.trim().split(' ')[0] || 'Beatrix';
  const avatarUrl = meta.avatar_url || meta.picture || '';

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
    const { error } = await supabaseClient.auth.updateUser({ password: nouaParola });
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

// Barele telefonului (ceas/baterie sus, linia de gesturi jos) iau culoarea de fundal a temei curente
(function () {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const actualizeaza = () => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) meta.setAttribute('content', bg);
  };
  new MutationObserver(actualizeaza).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
    let qProg = sb.from('programari').select('*').order('row', { ascending: true });
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
      id: c.id || ("cli_" + c.row)
    })).filter(c => c.nume !== "");

    clienti.sort((a, b) => a.nume.localeCompare(b.nume));

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
      await sb.from('orar').update({ blocat: !!payload.blocat }).in('row', ids);
    } else {
      const noi = [0, 1, 2].map(idx => {
        const item = {
          ziRaw: tagZi, ora: oraNorm, clienta: "", antrenament: "", blocat: !!payload.blocat, bifat: false, slotIndex: idx, client_id: ""
        };
        if (uid) item.user_id = uid;
        return item;
      });
      await sb.from('orar').insert(noi);
    }
    return { success: true };
  }

  if (actionName === "adaugaOraCustom") {
    const oraNorm = normalizeazaOraUi(payload.ora);
    const tagZi = construiesteTagZiLocal(payload.saptamanaCheie, payload.zi);
    const noi = [0, 1, 2].map(idx => {
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
    await sb.from('programari').update(upd).eq('row', payload.row);
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
    await sb.from('programari').insert([rowProgNou]);
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
    let qEx = sb.from('cliente').select('*').ilike('nume', numeVechi);
    if (uid) qEx = qEx.eq('user_id', uid);
    const { data: ex } = await qEx.limit(1);

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
        let qO = sb.from('orar').update({ clienta: numeNou }).ilike('clienta', numeVechi);
        let qP = sb.from('prezente').update({ clienta: numeNou }).ilike('clienta', numeVechi);
        if (uid) {
          qO = qO.eq('user_id', uid);
          qP = qP.eq('user_id', uid);
        }
        await Promise.all([qO, qP]);
      }
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
      status: "Activ"
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

  // Biblioteca Supabase nu s-a încărcat (ex. fără internet la pornire)
  showToast("Eroare sincronizare", "error");
}

function showToast(mesaj, tip = 'success') {
  let tEl = document.getElementById('customToast');
  if (!tEl) return;
  tEl.innerText = mesaj;
  tEl.className = 'show ' + (tip === 'error' ? 'error' : 'success');
  setTimeout(() => { tEl.className = ''; }, 2600);
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
    revenireDinPlanAntrenament();
  } else if (tipTabCurent === 'orar') {
    comutaExpandareBaraCalendar(event);
  }
}

function gestioneazaClickDreaptaHeader() {
  if (tipTabCurent === 'plan') {
    revenireDinPlanAntrenament();
  } else {
    deschideMeniuLateral();
  }
}

function revenireDinPlanAntrenament() {
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.style.display = 'flex';

  let tinta = tabAnteriorPlan || 'orar';
  let tabGasit = tabsOrder.find(t => t.tip === tinta) || tabsOrder[0];
  let btn = document.querySelectorAll('nav button')[tabGasit.idx];
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
      <button class="header-icon-bubble-btn" id="headerIconOrarBtn" onclick="gestioneazaClickStangaHeader(event)" title="Înapoi">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span id="pageTitle">${titlu}</span>
    `;
    if (burgerBtn && rightSvg) {
      burgerBtn.setAttribute('title', 'Închide');
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
      <button class="header-icon-bubble-btn" id="headerIconOrarBtn" onclick="gestioneazaClickStangaHeader(event)" title="${currentLang === 'en' ? 'Toggle week selector' : 'Comută selectorul de săptămână'}">
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
  const elBtnMagic = document.getElementById('authMagicLinkBtn');
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

async function verificaSesiuneSupabase() {
  const overlay = document.getElementById('authScreenOverlay');
  if (!supabaseClient) {
    if (overlay) overlay.classList.add('auth-hidden');
    actualizeazaStareNoScrollBody();
    return true;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    utilizatorCurent = session.user;
    actualizeazaDateProfilUI(session.user);
    if (overlay) overlay.classList.add('auth-hidden');
    actualizeazaStareNoScrollBody();
    return true;
  } else {
    utilizatorCurent = null;
    if (overlay) overlay.classList.remove('auth-hidden');
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
    await initModClientaSharePlan(sharedPlanId);
    return;
  }

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

  let sesiuneInitializata = false;

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;

      const overlay = document.getElementById('authScreenOverlay');
      if (session && session.user) {
        const eraNeconectat = !utilizatorCurent;
        utilizatorCurent = session.user;
        actualizeazaDateProfilUI(session.user);
        if (overlay) overlay.classList.add('auth-hidden');
        actualizeazaStareNoScrollBody();
        if (eraNeconectat && sesiuneInitializata) {
          incarcaBazaDateSilencios(null, true);
        }
      } else if (event === 'SIGNED_OUT') {
        utilizatorCurent = null;
        if (overlay) overlay.classList.remove('auth-hidden');
        actualizeazaStareNoScrollBody();
      }
    });
  }

  const areSesiune = await verificaSesiuneSupabase();
  sesiuneInitializata = true;
  if (!areSesiune) return;

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
      opt.innerText = luna;
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
  if (val === "Confirmata" || val === "Confirmed" || val === "Finalizat") return "pill-confirmata";
  if (val === "In asteptare" || val === "Pending" || val === "În așteptare") return "pill-asteptare";
  if (val === "Absenta" || val === "Absent" || val === "Sărit") return "pill-absenta";
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
            <textarea rows="${item.mentiuni ? 2 : 1}" class="prog-mentiuni-textarea" placeholder="${mentionPlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
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
            <textarea rows="${item.mentiuni ? 2 : 1}" class="prog-mentiuni-textarea prog-mentiuni-hold" placeholder="${pausePlaceholder}" onblur="schimbaMentiune(${item.row}, this.value)">${item.mentiuni || ''}</textarea>
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

function construiesteSablonPlanDefault() {
  return {
    id: null,
    clienta: "",
    titlu: "Program de forță & tonifiere",
    subtitlu: "B-Fit Studio • structură completă pe zile & jurnal progres",
    continut_json: {
      sectiuni_inceput: [
        {
          titlu: "1. Principii de bază (citește înainte de prima sesiune)",
          continut: "• Frecvență: Alege zile nealăturate (de exemplu luni, miercuri, vineri), cu cel puțin o zi de pauză între sesiuni.\n• Intensitate: Efort moderat. La finalul fiecărei serii trebuie să mai poți face 2–3 repetări curate (scara de efort 6–7 din 10).\n• Tehnică: Tehnica contează mai mult decât greutatea. Dacă execuția se strică, oprește seria sau scade greutatea.\n• Pregătire: Ține apă la îndemână, încălțăminte sport stabilă, mănâncă ceva ușor cu 1–2 ore înainte de sesiune."
        },
        {
          titlu: "2. Structura unei sesiuni (aprox. 45–55 minute)",
          continut: "Încălzire (8–10 minute) – la fiecare sesiune:\n• 2–3 minute mers rapid sau bicicletă ușoară\n• Rotiri de umeri, brațe, trunchi, șolduri, glezne (10 repetări pe fiecare)\n• 10 genuflexiuni fără greutate, 8 fandări înapoi pe picior, 10 ridicări pe vârfuri\n\nRevenire (5 minute):\n• Mers lent 2 minute, apoi întinderi ușoare 20–30 sec pentru coapse, fesieri, spate, piept și umeri."
        }
      ],
      sesiuni: [
        {
          titlu: "ZIUA 1: Sesiune de introducere",
          exercitii: [
            { nr: 1, exercitiu: "Genuflexiuni cu greutate proprie", seturi_repetari: "3 x 15", pauza: "60-90 sec", indicatii: "Coborâre controlată, spatele drept.", greutate_kg: "", seturi_finalizate: "", status: "În așteptare" },
            { nr: 2, exercitiu: "Tracțiuni la helcometru cu priză largă", seturi_repetari: "3 x 15", pauza: "60-90 sec", indicatii: "Trage spre piept, coatele în jos.", greutate_kg: "", seturi_finalizate: "", status: "În așteptare" },
            { nr: 3, exercitiu: "Plank (Scândură)", seturi_repetari: "3 x 45 sec", pauza: "60 sec", indicatii: "Abdomen încordat, corp aliniat.", greutate_kg: "", seturi_finalizate: "", status: "În așteptare" }
          ]
        }
      ],
      sectiuni_final: [
        {
          titlu: "Reguli de siguranță & recuperare",
          continut: "• Oprește imediat seria dacă apare durere ascuțită în articulații (genunchi, șold, umăr, gleznă) sau în coloană.\n• Somn 8 ore pe noapte și hidratare corespunzătoare.\n• Proteine la fiecare masă (ouă, carne, pește, lactate, leguminoase) și suficienți carbohidrați."
        }
      ],
      nota_subsol: "Notă: acest program este personalizat în cadrul B-Fit Studio. Notează în tabel greutatea și seturile finalizate la fiecare sesiune."
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
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

  const tabPlan = document.getElementById('tabPlanAntrenament');
  if (tabPlan) tabPlan.classList.add('active');

  actualizeazaHeaderVisual('plan', t('workoutPlanTitle'));

  // Dacă nu este selectat niciun plan, afișează șablonul default de creare
  if (!planActiv) {
    planActiv = construiesteSablonPlanDefault();
  }

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
  sel.innerHTML = `<option value="">${currentLang === 'en' ? 'Choose a saved plan' : 'Alege un plan salvat'}</option>`;

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
}

function selecteazaPlanDinLista(idPlan) {
  if (!idPlan) {
    planActiv = construiesteSablonPlanDefault();
    randeazaPlanAntrenamentUI();
    return;
  }
  const gasit = (DB.planuri || []).find(p => String(p.id) === String(idPlan));
  if (gasit) {
    planActiv = JSON.parse(JSON.stringify(gasit));
    randeazaPlanAntrenamentUI();
  }
}

function creeazaPlanNouCuSablon() {
  planActiv = construiesteSablonPlanDefault();
  esteModPrevizualizarePdf = false;
  const sel = document.getElementById('selectPlanExistent');
  if (sel) {
    sel.value = '';
    actualizeazaStilSelect(sel);
  }
  randeazaPlanAntrenamentUI();
  showToast(currentLang === 'en' ? '✓ New template loaded!' : '✓ Șablon nou încărcat!');
}

function comutaModPrevizualizarePlan() {
  esteModPrevizualizarePdf = !esteModPrevizualizarePdf;
  const btnTxt = document.getElementById('btnPreviewPlanText');
  if (btnTxt) {
    btnTxt.innerText = esteModPrevizualizarePdf ? t('btnEditMode') : t('btnPreviewPdfMode');
  }
  randeazaPlanAntrenamentUI();
}

// Iconița minimalistă de coș pentru butoanele de ștergere din plan (zi, secțiuni, exerciții)
const SVG_COS_PLAN = '<svg class="plan-btn-svg" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

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
        ${planActiv.clienta ? `<div style="margin-top:6px; font-size:0.78rem; font-weight:700; color:var(--primary);">👤 Clientă: ${escAttr(planActiv.clienta)}</div>` : ''}
      </div>
    `;
  } else {
    html += `
      <div class="plan-header-block">
        <input type="text" class="plan-doc-title-input" value="${escAttr(planActiv.titlu)}" placeholder="Titlu program (ex: Program de forță generală)" oninput="planActiv.titlu = this.value">
        <input type="text" class="plan-doc-subtitle-input" value="${escAttr(planActiv.subtitlu)}" placeholder="Subtitlu / detalii (ex: 3 sesiuni pe săptămână)" oninput="planActiv.subtitlu = this.value">
        <div class="plan-meta-client-row no-print">
          <span style="font-size:0.76rem; font-weight:700; color:var(--text-muted); white-space:nowrap;">👤 Clientă:</span>
          <input type="text" class="form-control" style="padding:4px 8px; font-size:0.8rem;" value="${escAttr(planActiv.clienta)}" placeholder="Alege clientă sau lasă liber pt. șablon..." list="listaClienteVizibile" oninput="planActiv.clienta = this.value">
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
            <input type="text" class="plan-info-title-input" value="${escAttr(sec.titlu)}" oninput="planActiv.continut_json.sectiuni_inceput[${sIdx}].titlu = this.value">
            <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSectiuneTextPlan('sectiuni_inceput', ${sIdx})" title="Șterge secțiunea">${SVG_COS_PLAN}</button>
          </div>
          <textarea class="plan-info-textarea" oninput="planActiv.continut_json.sectiuni_inceput[${sIdx}].continut = this.value">${escAttr(sec.continut)}</textarea>
        </div>
      `;
    }
  });

  if (!doarCitireStructura) {
    html += `
      <div class="no-print" style="margin-bottom:12px;">
        <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 9px;" onclick="adaugaSectiuneTextPlan('sectiuni_inceput')">
          + Adaugă Secțiune Introductivă (Principii / Încălzire)
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
            : `<input type="text" class="plan-session-title-input" value="${escAttr(ses.titlu)}" placeholder="Titlu Sesiune / Zi" oninput="planActiv.continut_json.sesiuni[${sesIdx}].titlu = this.value">
               <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSesiunePlan(${sesIdx})" title="Șterge toată ziua/sesiunea">${SVG_COS_PLAN}</button>`
          }
        </div>

        <table class="plan-exercises-table">
          <thead>
            <tr>
              <th style="width:22%;">Exercițiu</th>
              <th style="width:12%;">Serii x Rep.</th>
              <th style="width:10%;">Pauză</th>
              <th style="width:28%;">Cum se execută / Indicații</th>
              <th style="width:9%;">Kg</th>
              <th style="width:9%;">Seturi</th>
              <th style="width:10%;">Status</th>
              ${!doarCitireStructura ? `<th class="no-print" style="width:28px;"></th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    listaEx.forEach((ex, exIdx) => {
      const nrAfisat = ex.nr || (exIdx + 1);
      const stVal = ex.status || 'În așteptare';
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
            <td style="text-align:center; font-weight:700;">${escAttr(stVal)}</td>
          </tr>
        `;
      } else if (esteModClientaShare) {
        html += `
          <tr>
            <td>
              <div style="font-weight:800; color:var(--primary); font-size:0.84rem;">${nrAfisat}. ${escAttr(ex.exercitiu)}</div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--text); margin-top:2px;">
                🎯 ${escAttr(ex.seturi_repetari)} ${ex.pauza ? ` • ⏱ Pauză: ${escAttr(ex.pauza)}` : ''}
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">
                ${escAttr(ex.indicatii)}
              </div>
              <div class="plan-tracking-grid">
                <div class="plan-tracking-field">
                  <span class="plan-tracking-label">Greutate (kg)</span>
                  <input type="text" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="-" readonly>
                </div>
                <div class="plan-tracking-field">
                  <span class="plan-tracking-label">Seturi făcute</span>
                  <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="-" readonly>
                </div>
                <div class="plan-tracking-field">
                  <span class="plan-tracking-label">Status</span>
                  <select class="pill-select ${pillCls}" disabled>
                    <option value="În așteptare" ${stVal === 'În așteptare' ? 'selected' : ''}>În așteptare</option>
                    <option value="Finalizat" ${stVal === 'Finalizat' ? 'selected' : ''}>Finalizat</option>
                    <option value="Sărit" ${stVal === 'Sărit' ? 'selected' : ''}>Sărit</option>
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
                <input type="text" class="plan-ex-input" style="font-weight:700;" value="${escAttr(ex.exercitiu)}" placeholder="Nume exercițiu" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].exercitiu = this.value">
              </div>
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_repetari)}" placeholder="3 x 12" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].seturi_repetari = this.value">
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.pauza)}" placeholder="60-90 sec" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].pauza = this.value">
            </td>
            <td>
              <textarea class="plan-ex-textarea" placeholder="Indicații tehnice / cum se execută..." oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].indicatii = this.value">${escAttr(ex.indicatii)}</textarea>
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.greutate_kg)}" placeholder="Kg" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].greutate_kg = this.value">
            </td>
            <td>
              <input type="text" class="plan-ex-input" value="${escAttr(ex.seturi_finalizate)}" placeholder="Seturi" oninput="planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].seturi_finalizate = this.value">
            </td>
            <td>
              <select class="pill-select ${pillCls}" onchange="this.className='pill-select '+getPillClass(this.value); planActiv.continut_json.sesiuni[${sesIdx}].exercitii[${exIdx}].status = this.value">
                <option value="În așteptare" ${stVal === 'În așteptare' ? 'selected' : ''}>În așteptare</option>
                <option value="Finalizat" ${stVal === 'Finalizat' ? 'selected' : ''}>Finalizat</option>
                <option value="Sărit" ${stVal === 'Sărit' ? 'selected' : ''}>Sărit</option>
              </select>
            </td>
            <td class="no-print" style="text-align:center; vertical-align:middle;">
              <button type="button" class="btn-trash-action btn-trash-plan" onclick="stergeExercitiuPlan(${sesIdx}, ${exIdx})" title="Șterge exercițiul">${SVG_COS_PLAN}</button>
            </td>
          </tr>
        `;
      }
    });

    html += `
          </tbody>
        </table>
        ${!doarCitireStructura ? `
          <div class="no-print" style="padding:7px 10px; background:rgba(92,77,125,0.04); border-top:1px solid var(--border);">
            <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 10px;" onclick="adaugaExercitiuPlan(${sesIdx})">
              + Adaugă Exercițiu în această sesiune
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
          ➕ Adaugă Zi / Sesiune Nouă de Antrenament
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
            <input type="text" class="plan-info-title-input" value="${escAttr(sec.titlu)}" oninput="planActiv.continut_json.sectiuni_final[${sIdx}].titlu = this.value">
            <button type="button" class="btn-trash-action btn-trash-plan no-print" onclick="stergeSectiuneTextPlan('sectiuni_final', ${sIdx})" title="Șterge secțiunea">${SVG_COS_PLAN}</button>
          </div>
          <textarea class="plan-info-textarea" oninput="planActiv.continut_json.sectiuni_final[${sIdx}].continut = this.value">${escAttr(sec.continut)}</textarea>
        </div>
      `;
    }
  });

  if (!doarCitireStructura) {
    html += `
      <div class="no-print" style="margin-bottom:10px;">
        <button type="button" class="btn btn-clear" style="font-size:0.74rem; padding:4px 9px;" onclick="adaugaSectiuneTextPlan('sectiuni_final')">
          + Adaugă Secțiune Finală (Siguranță / Alimentație)
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
          <input type="text" class="plan-ex-input" style="font-style:italic;" value="${escAttr(cjson.nota_subsol)}" placeholder="Notă de subsol..." oninput="planActiv.continut_json.nota_subsol = this.value">
        </div>
      `;
    }
  }

  container.innerHTML = html;
}

function adaugaSectiuneTextPlan(cheieLista) {
  if (!planActiv || !planActiv.continut_json) return;
  planActiv.continut_json[cheieLista].push({
    titlu: "Secțiune nouă (ex: Recomandări)",
    continut: "• Adaugă indicațiile aici..."
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
    titlu: `ZIUA ${nrSes}: Sesiune nouă de antrenament`,
    exercitii: [
      { nr: 1, exercitiu: "", seturi_repetari: "3 x 12", pauza: "60-90 sec", indicatii: "", greutate_kg: "", seturi_finalizate: "", status: "În așteptare" }
    ]
  });
  randeazaPlanAntrenamentUI();
}

function stergeSesiunePlan(sesIdx) {
  customConfirm("Ștergere sesiune", "Ești sigură că vrei să ștergi această sesiune și exercițiile ei?", function() {
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
    seturi_repetari: "3 x 15",
    pauza: "60-90 sec",
    indicatii: "",
    greutate_kg: "",
    seturi_finalizate: "",
    status: "În așteptare"
  });
  randeazaPlanAntrenamentUI();
}

function stergeExercitiuPlan(sesIdx, exIdx) {
  const ses = planActiv?.continut_json?.sesiuni?.[sesIdx];
  if (!ses || !Array.isArray(ses.exercitii)) return;
  ses.exercitii.splice(exIdx, 1);
  ses.exercitii.forEach((e, i) => { e.nr = i + 1; });
  randeazaPlanAntrenamentUI();
}

// Salvare sincronizată direct cu tabela planuri_antrenament din Supabase
async function salveazaPlanCurentInBaza(silent = false) {
  if (!supabaseClient || !planActiv) return null;

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

    if (!silent) showToast(t('toastPlanSaved'));
    return rezultat;
  } catch (err) {
    console.error("Eroare salvare plan:", err);
    if (!silent) showToast("Eroare la salvarea planului: " + (err.message || ""), "error");
    return null;
  }
}

async function stergePlanCurent() {
  if (!planActiv || !planActiv.id) {
    planActiv = construiesteSablonPlanDefault();
    randeazaPlanAntrenamentUI();
    return;
  }

  customConfirm("Ștergere Plan", `Ștergi definitiv planul „${planActiv.titlu}”?`, async function() {
    try {
      await supabaseClient.from('planuri_antrenament').delete().eq('id', planActiv.id);
      DB.planuri = (DB.planuri || []).filter(p => p.id !== planActiv.id);
      try { localStorage.setItem("BFIT_DB_LOCAL", JSON.stringify(DB)); } catch(e) {}
      planActiv = construiesteSablonPlanDefault();
      populeazaSelectorPlanuri();
      randeazaPlanAntrenamentUI();
      showToast(t('toastPlanDeleted'));
    } catch (err) {
      showToast("Eroare la ștergere!", "error");
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
        if (obj.continut_json) {
          planActiv = obj;
        } else if (obj.sesiuni) {
          if (!planActiv) planActiv = construiesteSablonPlanDefault();
          planActiv.continut_json = obj;
        }
        randeazaPlanAntrenamentUI();
        showToast(t('toastPlanImported'));
        inputEl.value = '';
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
          status: cols[6] || "În așteptare"
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
  const salvat = await salveazaPlanCurentInBaza(true);
  const idPlan = salvat ? salvat.id : (planActiv ? planActiv.id : null);

  if (!idPlan) {
    showToast("Salvează mai întâi planul în baza de date!", "error");
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
        text: `🏋️‍♀️ ${titlu} – deschide fișa ta de antrenament:`,
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
      if (ex.pauza) txt += ` (pauză ${ex.pauza})`;
      if (ex.indicatii) txt += `\n   💡 ${ex.indicatii}`;
      txt += `\n`;
    });
    txt += `\n`;
  });

  const inp = document.getElementById('inputSharePlanUrl');
  if (inp && inp.value) {
    txt += `🔗 Fișa ta de antrenament:\n${inp.value}`;
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

  actualizeazaHeaderVisual('plan', 'Fișă Antrenament');
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
          Planul de antrenament nu a fost găsit sau link-ul a expirat.
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
  populeazaSelectorPlanuri();
  randeazaOrarInstant();
  randeazaProgramariInstant();
  filtreazaIstoricIncasariInstant();
  filtreazaIstoricOrarInstant();
  filtreazaIstoricFisaInstant();
  
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
  let langSalvata = localStorage.getItem('beatrix_lang') || 'ro';
  seteazaLimba(langSalvata, true);
})();