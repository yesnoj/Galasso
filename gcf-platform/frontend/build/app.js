/**
 * GCF Platform - Frontend Application
 * Green Care Farm Certificata - AICARE
 * SPA con routing hash-based, senza dipendenze
 */

// ============================================================
// STATE & CONFIG
// ============================================================
const API = '/api';
let state = {
  user: null,
  token: localStorage.getItem('gcf_token'),
  refreshToken: localStorage.getItem('gcf_refresh'),
};

const SERVICE_LABELS = {
  coterapia_piante: 'Coterapia con piante',
  coterapia_animali: 'Coterapia con animali',
  socio_ricreativa: 'Attività socio-ricreativa',
  educativa: 'Attività educativa',
  inserimento_lavorativo: 'Inserimento lavorativo',
  formazione: 'Formazione'
};

const TARGET_LABELS = {
  minori: 'Minori', giovani: 'Giovani', anziani: 'Anziani', disabili: 'Disabili',
  dipendenze: 'Dipendenze', salute_mentale: 'Salute mentale', immigrati: 'Immigrati',
  detenuti_ex: 'Detenuti/ex-detenuti', senza_dimora: 'Senza dimora',
  donne_violenza: 'Donne vittime di violenza', nomadi: 'Nomadi',
  disagio_socioeconomico: 'Disagio socio-economico', altro: 'Altro'
};

const LEGAL_FORMS = {
  azienda_agricola: 'Azienda agricola', cooperativa_sociale: 'Cooperativa sociale',
  cooperativa_agricola: 'Cooperativa agricola', associazione: 'Associazione',
  fondazione: 'Fondazione', ente_pubblico: 'Ente pubblico', altro: 'Altro'
};

const AUDIT_TYPE_LABELS = {
  initial: 'Iniziale', surveillance: 'Sorveglianza', renewal: 'Rinnovo'
};

const AUDIT_MODE_LABELS = {
  on_site: 'In presenza', remote: 'Da remoto', mixed: 'Mista'
};

const ITALIAN_PROVINCES = [
  'AG','AL','AN','AO','AP','AQ','AR','AT','AV','BA','BG','BI','BL','BN','BO','BR','BS','BT','BZ',
  'CA','CB','CE','CH','CL','CN','CO','CR','CS','CT','CZ','EN','FC','FE','FG','FI','FM','FR','GE',
  'GO','GR','IM','IS','KR','LC','LE','LI','LO','LT','LU','MB','MC','ME','MI','MN','MO','MS','MT',
  'NA','NO','NU','OG','OR','OT','PA','PC','PD','PE','PG','PI','PN','PO','PR','PT','PU','PV','PZ',
  'RA','RC','RE','RG','RI','RM','RN','RO','SA','SI','SO','SP','SR','SS','SU','SV','TA','TE','TN',
  'TO','TP','TR','TS','TV','UD','VA','VB','VC','VE','VI','VR','VS','VT','VV'
];

const PROVINCE_REGION_MAP = {
  'AG':'Sicilia','AL':'Piemonte','AN':'Marche','AO':'Valle d\'Aosta','AP':'Marche','AQ':'Abruzzo',
  'AR':'Toscana','AT':'Piemonte','AV':'Campania','BA':'Puglia','BG':'Lombardia','BI':'Piemonte',
  'BL':'Veneto','BN':'Campania','BO':'Emilia-Romagna','BR':'Puglia','BS':'Lombardia','BT':'Puglia',
  'BZ':'Trentino-Alto Adige','CA':'Sardegna','CB':'Molise','CE':'Campania','CH':'Abruzzo',
  'CL':'Sicilia','CN':'Piemonte','CO':'Lombardia','CR':'Lombardia','CS':'Calabria','CT':'Sicilia',
  'CZ':'Calabria','EN':'Sicilia','FC':'Emilia-Romagna','FE':'Emilia-Romagna','FG':'Puglia',
  'FI':'Toscana','FM':'Marche','FR':'Lazio','GE':'Liguria','GO':'Friuli Venezia Giulia',
  'GR':'Toscana','IM':'Liguria','IS':'Molise','KR':'Calabria','LC':'Lombardia','LE':'Puglia',
  'LI':'Toscana','LO':'Lombardia','LT':'Lazio','LU':'Toscana','MB':'Lombardia','MC':'Marche',
  'ME':'Sicilia','MI':'Lombardia','MN':'Lombardia','MO':'Emilia-Romagna','MS':'Toscana',
  'MT':'Basilicata','NA':'Campania','NO':'Piemonte','NU':'Sardegna','OR':'Sardegna','PA':'Sicilia',
  'PC':'Emilia-Romagna','PD':'Veneto','PE':'Abruzzo','PG':'Umbria','PI':'Toscana',
  'PN':'Friuli Venezia Giulia','PO':'Toscana','PR':'Emilia-Romagna','PT':'Toscana','PU':'Marche',
  'PV':'Lombardia','PZ':'Basilicata','RA':'Emilia-Romagna','RC':'Calabria','RE':'Emilia-Romagna',
  'RG':'Sicilia','RI':'Lazio','RM':'Lazio','RN':'Emilia-Romagna','RO':'Veneto','SA':'Campania',
  'SI':'Toscana','SO':'Lombardia','SP':'Liguria','SR':'Sicilia','SS':'Sardegna','SU':'Sardegna',
  'SV':'Liguria','TA':'Puglia','TE':'Abruzzo','TN':'Trentino-Alto Adige','TO':'Piemonte',
  'TP':'Sicilia','TR':'Umbria','TS':'Friuli Venezia Giulia','TV':'Veneto','UD':'Friuli Venezia Giulia',
  'VA':'Lombardia','VB':'Piemonte','VC':'Piemonte','VE':'Veneto','VI':'Veneto','VR':'Veneto',
  'VT':'Lazio','VV':'Calabria'
};

const OUTCOME_LABELS = {
  conforming: 'Conforme',
  conforming_with_actions: 'Conforme con azioni correttive',
  non_conforming: 'Non conforme'
};

const STATUS_MAP = {
  draft: ['Bozza', 'neutral'], submitted: ['Inviata', 'info'], doc_review: ['Revisione doc.', 'info'],
  doc_approved: ['Doc. approvati', 'success'], doc_rejected: ['Doc. respinti', 'danger'],
  audit_scheduled: ['Audit pianificato', 'warning'], audit_completed: ['Audit completato', 'info'],
  approved: ['Approvata', 'success'], rejected: ['Respinta', 'danger'],
  issued: ['Rilasciata', 'success'], suspended: ['Sospesa', 'warning'],
  expired: ['Scaduta', 'danger'], renewed: ['Rinnovata', 'success'],
  pending: ['In attesa', 'warning'], active: ['Attiva', 'success'], revoked: ['Revocata', 'danger'],
  planned: ['Pianificato', 'info'], in_progress: ['In corso', 'warning'], completed: ['Completato', 'success'],
  cancelled: ['Annullato', 'neutral'], open: ['Aperto', 'warning'], closed: ['Chiuso', 'neutral']
};

// ============================================================
// API HELPER
// ============================================================
async function api(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (state.token) config.headers['Authorization'] = `Bearer ${state.token}`;

  try {
    const res = await fetch(`${API}${endpoint}`, config);
    if (res.status === 401) {
      // Try refresh
      if (state.refreshToken && !endpoint.includes('/refresh')) {
        const refreshed = await refreshAuth();
        if (refreshed) return api(endpoint, options);
      }
      logout();
      return null;
    }
    if (res.headers.get('content-type')?.includes('application/pdf')) return res.blob();
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Errore', 'error'); return null; }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    toast('Errore di connessione', 'error');
    return null;
  }
}

async function refreshAuth() {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: state.refreshToken })
    });
    if (!res.ok) return false;
    const data = await res.json();
    state.token = data.accessToken;
    state.refreshToken = data.refreshToken;
    localStorage.setItem('gcf_token', data.accessToken);
    localStorage.setItem('gcf_refresh', data.refreshToken);
    return true;
  } catch { return false; }
}

// ============================================================
// UTILITIES
// ============================================================
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function toast(msg, type = 'info') {
  const container = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function badge(status) {
  const [label, type] = STATUS_MAP[status] || [status, 'neutral'];
  return `<span class="badge badge-${type}">${label}</span>`;
}

function evalBadge(ev) {
  if (!ev) return '<span class="badge badge-neutral">N/V</span>';
  return `<span class="badge badge-${ev}">${ev}</span>`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT');
}

function sanitize(str) {
  if (!str) return '';
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

function togglePw(inputId, btn) {
  const input = $(`#${inputId}`);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🔒'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

function showConfirmModal(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal">
      <div class="confirm-modal-icon">🌿</div>
      <h3 class="confirm-modal-title">${title}</h3>
      <p class="confirm-modal-text">${message}</p>
      <div class="confirm-modal-actions">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Conferma</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));
  
  overlay.querySelector('#modal-cancel').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 200);
  };
  overlay.querySelector('#modal-confirm').onclick = async () => {
    overlay.remove();
    await onConfirm();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
    }
  };
}

function translateAuditType(t) { return AUDIT_TYPE_LABELS[t] || t; }
function translateAuditMode(m) { return AUDIT_MODE_LABELS[m] || m; }
function translateOutcome(o) { return OUTCOME_LABELS[o] || o; }

// ============================================================
// AUTH
// ============================================================
async function login(email, password) {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      // Mostra errore sotto il form
      const errEl = $('#login-error');
      if (errEl) { errEl.textContent = data.error || 'Credenziali non valide'; errEl.classList.remove('hidden'); }
      else toast(data.error || 'Credenziali non valide', 'error');
      return;
    }
    state.user = data.user;
    state.token = data.accessToken;
    state.refreshToken = data.refreshToken;
    localStorage.setItem('gcf_token', data.accessToken);
    localStorage.setItem('gcf_refresh', data.refreshToken);
    toast(`Benvenuto, ${data.user.firstName}!`, 'success');
    navigate('dashboard');
  } catch (err) {
    toast('Errore di connessione al server', 'error');
  }
}

function logout() {
  showConfirmModal('Vuoi davvero uscire?', 'La sessione corrente verrà terminata.', () => {
    if (state.token) api('/auth/logout', { method: 'POST' }).catch(() => {});
    state.user = null;
    state.token = null;
    state.refreshToken = null;
    localStorage.removeItem('gcf_token');
    localStorage.removeItem('gcf_refresh');
    navigate('login');
  });
}

async function loadUser() {
  if (!state.token) return false;
  const data = await api('/auth/me');
  if (data) { state.user = data; return true; }
  return false;
}

// ============================================================
// ROUTER
// ============================================================
function navigate(page, params) {
  window.location.hash = params ? `${page}/${params}` : page;
}

function getRoute() {
  const hash = window.location.hash.slice(1) || 'login';
  const parts = hash.split('/');
  return { page: parts[0], params: parts.slice(1).join('/') };
}

async function router() {
  const { page, params } = getRoute();

  // Pagine pubbliche
  if (page === 'login') return renderLogin();
  if (page === 'register') return renderRegister();
  if (page === 'registry') return renderRegistry();
  if (page === 'registry-detail') return renderRegistryDetail(params);

  // Verifica auth per pagine protette
  if (!state.user) {
    const loaded = await loadUser();
    if (!loaded) return navigate('login');
  }

  // Pagine protette
  switch (page) {
    case 'dashboard': return renderDashboard();
    case 'organizations': return renderOrganizations();
    case 'organization-edit': return renderOrganizationEdit(params);
    case 'organization-detail': return renderOrganizationDetail(params);
    case 'certifications': return renderCertifications();
    case 'certification-detail': return renderCertificationDetail(params);
    case 'audits': return renderAudits();
    case 'audit-detail': return renderAuditDetail(params);
    case 'audit-checklist': return renderAuditChecklist(params);
    case 'beneficiaries': return renderBeneficiaries();
    case 'activities': return renderActivities();
    case 'admin': return renderAdmin();
    case 'admin-users': return renderAdminUsers();
    case 'admin-reviews': return renderAdminReviews();
    case 'profile': return renderProfile();
    default: navigate(state.user ? 'dashboard' : 'login');
  }
}

window.addEventListener('hashchange', router);

// ============================================================
// LAYOUT
// ============================================================
function renderLayout(title, content, actions = '') {
  const u = state.user;
  const isAdmin = u.role === 'admin';
  const isAuditor = u.role === 'auditor';
  const isOrg = u.role === 'org_admin' || u.role === 'org_operator';
  const isEnte = u.role === 'ente_referente';

  const roleLabel = {admin:'Amministratore',auditor:'Auditor',org_admin:'Admin Organizzazione',
    org_operator:'Operatore',ente_referente:'Ente Referente',public:'Utente'}[u.role];

  $('#app').innerHTML = `
    <div class="app-container">
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div style="font-size:32px">🌿</div>
          <h2>Green Care Farm</h2>
          <small>Certificata - AICARE</small>
        </div>
        <div class="sidebar-nav">
          <div class="nav-section">Principale</div>
          <a href="#dashboard" class="${getRoute().page === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
          <a href="#registry" class="${getRoute().page === 'registry' ? 'active' : ''}">🗂️ Registro Pubblico</a>
          
          ${isOrg || isAdmin ? `
            <div class="nav-section">Organizzazione</div>
            <a href="#organizations" class="${getRoute().page === 'organizations' ? 'active' : ''}">🏠 Organizzazioni</a>
            <a href="#certifications" class="${getRoute().page === 'certifications' ? 'active' : ''}">📜 Certificazioni</a>
            <a href="#beneficiaries" class="${getRoute().page === 'beneficiaries' ? 'active' : ''}">👥 Beneficiari</a>
            <a href="#activities" class="${getRoute().page === 'activities' ? 'active' : ''}">📋 Attività</a>
          ` : ''}
          
          ${isAuditor || isAdmin ? `
            <div class="nav-section">Audit</div>
            <a href="#audits" class="${getRoute().page === 'audits' ? 'active' : ''}">✅ Audit</a>
            
          ` : ''}

          ${isEnte ? `
            <div class="nav-section">Monitoraggio</div>
            <a href="#beneficiaries" class="${getRoute().page === 'beneficiaries' ? 'active' : ''}">👥 Beneficiari</a>
          ` : ''}
          
          ${isAdmin ? `
            <div class="nav-section">Amministrazione</div>
            <a href="#admin" class="${getRoute().page === 'admin' ? 'active' : ''}">⚙️ Dashboard Admin</a>
            <a href="#admin-users" class="${getRoute().page === 'admin-users' ? 'active' : ''}">👤 Utenti</a>
            <a href="#admin-reviews" class="${getRoute().page === 'admin-reviews' ? 'active' : ''}">⭐ Recensioni</a>
          ` : ''}
        </div>
        <div class="sidebar-user">
          <div class="user-name">${sanitize(u.first_name || u.firstName)} ${sanitize(u.last_name || u.lastName)}</div>
          <div class="user-role">${roleLabel}</div>
        </div>
      </nav>
      <div class="main-content">
        <div class="page-header">
          <div class="flex gap-1" style="align-items:center">
            <button class="mobile-menu-btn" onclick="$('#sidebar').classList.toggle('open')">☰</button>
            <h2>${title}</h2>
          </div>
          <div class="flex gap-1" style="align-items:center">
            ${actions}
            <a href="#profile" class="btn btn-secondary btn-sm">👤 Profilo</a>
            <button class="btn btn-secondary btn-sm" onclick="logout()">Esci</button>
          </div>
        </div>
        <div class="page-body" id="page-content">${content}</div>
      </div>
    </div>
  `;
}

// ============================================================
// PAGE: LOGIN
// ============================================================
function renderLogin() {
  $('#app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="logo">🌿</div>
        <h1>Green Care Farm</h1>
        <p class="subtitle">Certificata - AICARE</p>
        <form id="login-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" placeholder="email@esempio.it">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="••••••••">
          </div>
          <div id="login-error" class="alert alert-danger hidden"></div>
          <button type="submit" class="btn btn-primary btn-block" id="login-btn">Accedi</button>
        </form>
        <p class="mt-2 text-center text-sm text-muted">
          <a href="#register">Registrati</a> · <a href="#registry">Registro Pubblico</a>
        </p>
      </div>
    </div>
  `;
  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const errEl = $('#login-error');
    
    if (!email) { errEl.textContent = 'Inserisci l\'email'; errEl.classList.remove('hidden'); return; }
    if (!password) { errEl.textContent = 'Inserisci la password'; errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    
    const btn = $('#login-btn');
    btn.disabled = true;
    btn.textContent = 'Accesso in corso...';
    await login(email, password);
    btn.disabled = false;
    btn.textContent = 'Accedi';
  };
}

// ============================================================
// PAGE: REGISTER
// ============================================================
function renderRegister() {
  $('#app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="logo">🌿</div>
        <h1>Registrazione</h1>
        <p class="subtitle">Green Care Farm Certificata</p>
        <form id="reg-form">
          <div class="form-row">
            <div class="form-group"><label>Nome</label><input id="reg-fn" required></div>
            <div class="form-group"><label>Cognome</label><input id="reg-ln" required></div>
          </div>
          <div class="form-group">
            <label>Email</label><input type="email" id="reg-email" required>
            <div id="reg-email-err" style="color:#d32f2f;font-size:12px;display:none;margin-top:4px">Inserisci un indirizzo email valido</div>
          </div>
          <div class="form-group">
            <label>Password (min 8 caratteri)</label>
            <div style="position:relative">
              <input type="password" id="reg-pw" required minlength="8" style="padding-right:40px">
              <button type="button" onclick="togglePwVis('reg-pw',this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px">👁️</button>
            </div>
          </div>
          <div class="form-group">
            <label>Conferma password</label>
            <div style="position:relative">
              <input type="password" id="reg-pw2" required minlength="8" style="padding-right:40px">
              <button type="button" onclick="togglePwVis('reg-pw2',this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px">👁️</button>
            </div>
            <div id="reg-pw-err" style="color:#d32f2f;font-size:12px;display:none;margin-top:4px">Le password non coincidono</div>
          </div>
          <div class="form-group"><label>Telefono</label>${phoneInputHtml('reg-phone')}</div>
          <div class="form-group"><label>Ruolo</label>
            <select id="reg-role">
              <option value="org_admin">Responsabile organizzazione</option>
              <option value="ente_referente">Ente referente</option>
              <option value="public">Utente pubblico</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Registrati</button>
        </form>
        <p class="mt-2 text-center text-sm text-muted"><a href="#login">Hai già un account? Accedi</a></p>
      </div>
    </div>
  `;

  // Email validation on blur
  const regEmailInput = $('#reg-email');
  regEmailInput.addEventListener('blur', () => {
    const v = regEmailInput.value.trim();
    const err = $('#reg-email-err');
    if (v && !isValidEmail(v)) { err.style.display = 'block'; regEmailInput.style.borderColor = '#d32f2f'; }
    else { err.style.display = 'none'; regEmailInput.style.borderColor = ''; }
  });

  // Password match check in tempo reale
  const regPw = $('#reg-pw');
  const regPw2 = $('#reg-pw2');
  const regPwErr = $('#reg-pw-err');
  function checkPwMatch() {
    if (!regPw2.value) { regPwErr.style.display = 'none'; regPw2.style.borderColor = ''; return; }
    if (regPw.value !== regPw2.value) {
      regPwErr.style.display = 'block'; regPw2.style.borderColor = '#d32f2f';
    } else {
      regPwErr.style.display = 'none'; regPw2.style.borderColor = '#4CAF50';
    }
  }
  regPw2.addEventListener('blur', checkPwMatch);
  regPw2.addEventListener('input', checkPwMatch);
  regPw.addEventListener('input', () => { if (regPw2.value) checkPwMatch(); });

  $('#reg-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#reg-email').value.trim();
    const pw = $('#reg-pw').value;
    const pw2 = $('#reg-pw2').value;

    if (!isValidEmail(email)) { toast('Inserisci un indirizzo email valido', 'error'); return; }
    if (pw !== pw2) { $('#reg-pw-err').style.display = 'block'; toast('Le password non coincidono', 'error'); return; }
    if (pw.length < 8) { toast('La password deve avere almeno 8 caratteri', 'error'); return; }

    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: $('#reg-fn').value, lastName: $('#reg-ln').value,
        email, password: pw,
        phone: getPhoneValue('reg-phone'), role: $('#reg-role').value
      })
    });
    if (data) {
      state.user = data.user;
      state.token = data.accessToken;
      state.refreshToken = data.refreshToken;
      localStorage.setItem('gcf_token', data.accessToken);
      localStorage.setItem('gcf_refresh', data.refreshToken);
      toast('Registrazione completata!', 'success');
      navigate('dashboard');
    }
  };
}

function togglePwVis(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁️'; }
}

// ============================================================
// PAGE: DASHBOARD
// ============================================================
async function renderDashboard() {
  renderLayout('Dashboard', '<div class="loading"><div class="spinner"></div><p>Caricamento...</p></div>');

  const u = state.user;
  let html = '';

  if (u.role === 'admin') {
    const stats = await api('/admin/dashboard');
    if (!stats) return;
    html = `
      <div class="stats-grid">
        <div class="stat-card clickable" onclick="navigate('organizations')"><div class="stat-icon">🏠</div><div class="stat-value">${stats.organizations.total}</div><div class="stat-label">Organizzazioni</div></div>
        <div class="stat-card clickable" onclick="navigate('certifications')"><div class="stat-icon">📜</div><div class="stat-value">${stats.certifications.total}</div><div class="stat-label">Certificazioni</div></div>
        <div class="stat-card clickable" onclick="navigate('audits')"><div class="stat-icon">✅</div><div class="stat-value">${stats.audits.completed}</div><div class="stat-label">Audit completati</div></div>
        <div class="stat-card clickable" onclick="navigate('beneficiaries')"><div class="stat-icon">👥</div><div class="stat-value">${stats.beneficiaries.active}</div><div class="stat-label">Beneficiari attivi</div></div>
        <div class="stat-card clickable" onclick="navigate('activities')"><div class="stat-icon">📋</div><div class="stat-value">${stats.activities.total}</div><div class="stat-label">Attività registrate</div></div>
        <div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-value">${Math.round(stats.activities.totalHours)}</div><div class="stat-label">Ore totali</div></div>
        <div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-value">${stats.correctiveActions.open}</div><div class="stat-label">Azioni correttive aperte</div></div>
        <div class="stat-card clickable" onclick="navigate('admin-users')"><div class="stat-icon">👤</div><div class="stat-value">${stats.users.total}</div><div class="stat-label">Utenti registrati</div></div>
      </div>
      ${stats.certifications.expiringSoon.length > 0 ? `
        <div class="card mb-2">
          <div class="card-header"><h3>⚠️ Certificazioni in scadenza (90 giorni)</h3></div>
          <div class="card-body"><div class="table-container"><table>
            <tr><th>Organizzazione</th><th>N. Certificato</th><th>Scadenza</th></tr>
            ${stats.certifications.expiringSoon.map(c => `
              <tr><td>${sanitize(c.org_name)}</td><td>${c.cert_number}</td><td>${formatDate(c.expiry_date)}</td></tr>
            `).join('')}
          </table></div></div>
        </div>
      ` : ''}
      <div class="card">
        <div class="card-header"><h3>Certificazioni per stato</h3></div>
        <div class="card-body">
          ${stats.certifications.byStatus.map(s => `<span class="mr-2">${badge(s.status)} ${s.count}</span> `).join('')}
        </div>
      </div>
    `;
  } else if (u.role === 'auditor') {
    const audits = await api('/audits');
    html = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${audits ? audits.filter(a => a.status === 'planned').length : 0}</div><div class="stat-label">Audit pianificati</div></div>
        <div class="stat-card"><div class="stat-value">${audits ? audits.filter(a => a.status === 'in_progress').length : 0}</div><div class="stat-label">In corso</div></div>
        <div class="stat-card"><div class="stat-value">${audits ? audits.filter(a => a.status === 'completed').length : 0}</div><div class="stat-label">Completati</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>I miei audit</h3></div>
        <div class="card-body">
          ${!audits || audits.length === 0 ? '<p class="text-muted">Nessun audit assegnato</p>' : `
            <div class="table-container"><table>
              <tr><th>Organizzazione</th><th>Tipo</th><th>Data</th><th>Stato</th><th></th></tr>
              ${audits.map(a => `<tr>
                <td>${sanitize(a.org_name)}</td>
                <td>${translateAuditType(a.audit_type)}</td>
                <td>${formatDate(a.scheduled_date || a.completed_date)}</td>
                <td>${badge(a.status)}</td>
                <td><a href="#audit-checklist/${a.id}" class="btn btn-primary btn-sm">Apri</a></td>
              </tr>`).join('')}
            </table></div>
          `}
        </div>
      </div>
    `;
  } else if (u.role === 'org_admin' || u.role === 'org_operator') {
    const certs = await api('/certifications');
    const bens = await api('/beneficiaries');
    html = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${certs ? certs.length : 0}</div><div class="stat-label">Certificazioni</div></div>
        <div class="stat-card"><div class="stat-value">${bens ? bens.filter(b => b.status === 'active').length : 0}</div><div class="stat-label">Beneficiari attivi</div></div>
        <div class="stat-card"><div class="stat-value">${bens ? bens.reduce((s, b) => s + (b.activity_count || 0), 0) : 0}</div><div class="stat-label">Attività totali</div></div>
      </div>
      ${certs && certs.length > 0 ? `
        <div class="card mb-2">
          <div class="card-header"><h3>Le mie certificazioni</h3></div>
          <div class="card-body"><div class="table-container"><table>
            <tr><th>N. Certificato</th><th>Stato</th><th>Rilascio</th><th>Scadenza</th></tr>
            ${certs.map(c => `<tr>
              <td>${c.cert_number || '—'}</td><td>${badge(c.status)}</td>
              <td>${formatDate(c.issue_date)}</td><td>${formatDate(c.expiry_date)}</td>
            </tr>`).join('')}
          </table></div></div>
        </div>
      ` : `
        <div class="alert alert-info">Non hai ancora una certificazione. <a href="#certifications">Fai domanda</a></div>
      `}
    `;
  } else {
    html = '<div class="alert alert-info">Benvenuto nella piattaforma Green Care Farm Certificata - AICARE.</div>';
  }

  $('#page-content').innerHTML = html;
}

// ============================================================
// PAGE: ORGANIZATIONS
// ============================================================
async function renderOrganizations() {
  renderLayout('Organizzazioni', '<div class="loading"><div class="spinner"></div></div>');

  const data = await api('/organizations');
  if (!data) return;

  const orgs = data.data || data;

  let tableHtml = '';
  if (orgs.length === 0) {
    tableHtml = `<div class="empty-state"><div class="icon">🏠</div><h3>Nessuna organizzazione</h3>
      <p>Crea la tua organizzazione per iniziare</p></div>`;
  } else {
    tableHtml = `<div class="table-container"><table>
      <tr><th>Nome</th><th>Forma giuridica</th><th>Città</th><th>Stato</th><th></th></tr>
      ${orgs.map(o => `<tr>
        <td><strong><a href="#organization-detail/${o.id}" style="color:var(--primary)">${sanitize(o.name)}</a></strong></td>
        <td>${LEGAL_FORMS[o.legal_form] || o.legal_form}</td>
        <td>${sanitize(o.city)} (${o.province})</td>
        <td>${state.user.role === 'admin' ? `
          <select onchange="changeOrgStatus('${o.id}', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid #ddd;font-size:13px">
            <option value="pending" ${o.status==='pending'?'selected':''}>⏳ In attesa</option>
            <option value="active" ${o.status==='active'?'selected':''}>✅ Attiva</option>
            <option value="suspended" ${o.status==='suspended'?'selected':''}>⚠️ Sospesa</option>
            <option value="revoked" ${o.status==='revoked'?'selected':''}>❌ Revocata</option>
          </select>
        ` : badge(o.status)}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="navigate('organization-edit','${o.id}')">✏️</button></td>
      </tr>`).join('')}
    </table></div>`;
  }

  $('#page-content').innerHTML = `
    <button class="btn btn-primary mb-2" onclick="navigate('organization-edit','new')">+ Nuova organizzazione</button>
    ${tableHtml}
  `;
}

// ============================================================
// PAGE: ORGANIZATION EDIT
// ============================================================
async function changeOrgStatus(orgId, newStatus) {
  const result = await api(`/organizations/${orgId}/status`, {
    method: 'PUT', body: JSON.stringify({ status: newStatus })
  });
  if (result) {
    const labels = { pending: 'In attesa', active: 'Attiva', suspended: 'Sospesa', revoked: 'Revocata' };
    toast(`Stato aggiornato: ${labels[newStatus]}`, 'success');
  }
}

async function renderOrganizationEdit(id) {
  const isNew = id === 'new';
  let org = null;

  if (!isNew) {
    org = await api(`/organizations/${id}`);
    if (!org) return;
  }

  renderLayout(isNew ? 'Nuova Organizzazione' : 'Modifica Organizzazione', `
    <form id="org-form" class="card">
      <div class="card-body">
        <div class="form-row">
          <div class="form-group"><label>Nome *</label><input id="org-name" value="${sanitize(org?.name || '')}" required></div>
          <div class="form-group"><label>Forma giuridica *</label>
            <select id="org-legal">${Object.entries(LEGAL_FORMS).map(([v,l]) => 
              `<option value="${v}" ${org?.legal_form===v?'selected':''}>${l}</option>`).join('')}</select></div>
        </div>
        <div class="form-row-3">
          <div class="form-group"><label>Codice fiscale</label><input id="org-tax" value="${org?.tax_code||''}"></div>
          <div class="form-group"><label>P.IVA</label><input id="org-vat" value="${org?.vat_number||''}"></div>
          <div class="form-group"><label>Telefono</label>${phoneInputHtml('org-phone', org?.phone||'')}</div>
        </div>
        <div class="form-group"><label>Indirizzo *</label><input id="org-addr" value="${sanitize(org?.address||'')}" required></div>
        <div class="form-row-3">
          <div class="form-group"><label>Città *</label><input id="org-city" value="${sanitize(org?.city||'')}" required></div>
          <div class="form-group"><label>Provincia *</label>
            <select id="org-prov" required onchange="autoFillRegion()">
              <option value="">Seleziona...</option>
              ${ITALIAN_PROVINCES.map(p => `<option value="${p}" ${org?.province===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Regione *</label><input id="org-reg" value="${sanitize(org?.region||'')}" required readonly style="background:#f5f5f5"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Email</label><input type="email" id="org-email" value="${org?.email||''}">
            <div id="org-email-err" style="color:#d32f2f;font-size:12px;display:none;margin-top:4px">Email non valida</div>
          </div>
          <div class="form-group"><label>Sito web</label><input id="org-web" value="${org?.website||''}"></div>
        </div>
        <div class="form-group"><label>Descrizione</label><textarea id="org-desc">${sanitize(org?.description||'')}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Responsabile servizi sociali</label><input id="org-mgr-name" value="${sanitize(org?.social_manager_name||'')}"></div>
          <div class="form-group"><label>Ruolo responsabile</label><input id="org-mgr-role" value="${sanitize(org?.social_manager_role||'')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Latitudine</label><input type="number" step="any" id="org-lat" value="${org?.latitude||''}"></div>
          <div class="form-group"><label>Longitudine</label><input type="number" step="any" id="org-lng" value="${org?.longitude||''}"></div>
        </div>
      </div>
      <div class="card-footer flex-between">
        <button type="button" class="btn btn-secondary" onclick="navigate('organizations')">Annulla</button>
        <button type="submit" class="btn btn-primary">${isNew ? 'Crea' : 'Salva'}</button>
      </div>
    </form>
  `);

  // Email validation on blur
  const orgEmailInput = $('#org-email');
  if (orgEmailInput) {
    orgEmailInput.addEventListener('blur', () => {
      const v = orgEmailInput.value.trim();
      const err = $('#org-email-err');
      if (v && !isValidEmail(v)) { err.style.display = 'block'; orgEmailInput.style.borderColor = '#d32f2f'; }
      else { err.style.display = 'none'; orgEmailInput.style.borderColor = ''; }
    });
  }

  // Auto fill region on load if province is set
  if (org?.province && !org?.region) autoFillRegion();

  $('#org-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#org-email').value.trim();
    if (email && !isValidEmail(email)) { toast('Inserisci un indirizzo email valido', 'error'); return; }

    const body = {
      name: $('#org-name').value, legalForm: $('#org-legal').value,
      taxCode: $('#org-tax').value, vatNumber: $('#org-vat').value,
      address: $('#org-addr').value, city: $('#org-city').value,
      province: $('#org-prov').value, region: $('#org-reg').value,
      phone: getPhoneValue('org-phone'), email,
      website: $('#org-web').value, description: $('#org-desc').value,
      socialManagerName: $('#org-mgr-name').value, socialManagerRole: $('#org-mgr-role').value,
      latitude: parseFloat($('#org-lat').value) || null, longitude: parseFloat($('#org-lng').value) || null
    };
    const result = isNew
      ? await api('/organizations', { method: 'POST', body: JSON.stringify(body) })
      : await api(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (result) { toast(isNew ? 'Organizzazione creata!' : 'Salvata!', 'success'); navigate('organizations'); }
  };
}

function autoFillRegion() {
  const prov = $('#org-prov')?.value;
  if (prov && PROVINCE_REGION_MAP[prov]) {
    $('#org-reg').value = PROVINCE_REGION_MAP[prov];
  }
}

// ============================================================
// PAGE: CERTIFICATIONS
// ============================================================
async function renderCertifications() {
  renderLayout('Certificazioni', '<div class="loading"><div class="spinner"></div></div>');
  const certs = await api('/certifications');
  if (!certs) return;

  const isAdmin = state.user.role === 'admin';
  const isOrg = state.user.role === 'org_admin' || state.user.role === 'org_operator';
  const orgId = state.user.organization?.id;

  // Verifica se l'org può fare domanda (nessuna cert attiva/in corso)
  const canRequest = isOrg && orgId && !certs.some(c => ['draft','submitted','doc_review','doc_approved','audit_scheduled','audit_completed','approved','issued'].includes(c.status));

  const actions = canRequest ? `<button class="btn btn-primary" onclick="requestCertification()">📜 Richiedi certificazione</button>` : '';

  $('#page-content').innerHTML = certs.length === 0 ? `
    <div class="empty-state"><div class="icon">📜</div><h3>Nessuna certificazione</h3>
    ${isOrg ? `<p>Non hai ancora una certificazione.</p><button class="btn btn-primary mt-2" onclick="requestCertification()">📜 Richiedi certificazione</button>` : '<p>Nessuna certificazione presente.</p>'}
    </div>
  ` : `
    ${actions ? `<div class="mb-2">${actions}</div>` : ''}
    <div class="table-container"><table>
      <tr><th>Organizzazione</th><th>N. Certificato</th><th>Stato</th><th>Data domanda</th><th>Scadenza</th><th></th></tr>
      ${certs.map(c => `<tr>
        <td>${sanitize(c.org_name)}</td>
        <td>${c.cert_number || '—'}</td>
        <td>${badge(c.status)}</td>
        <td>${formatDate(c.application_date)}</td>
        <td>${formatDate(c.expiry_date)}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="navigate('certification-detail','${c.id}')">Dettagli</button></td>
      </tr>`).join('')}
    </table></div>
  `;
}

// ============================================================
// PAGE: CERTIFICATION DETAIL
// ============================================================
async function renderCertificationDetail(id) {
  renderLayout('Dettaglio Certificazione', '<div class="loading"><div class="spinner"></div></div>');
  const cert = await api(`/certifications/${id}`);
  if (!cert) return;

  const isAdmin = state.user.role === 'admin';
  const isAuditor = state.user.role === 'auditor';
  const canManage = isAdmin || isAuditor;

  let actionsHtml = '';
  if (canManage) {
    const nextStatuses = {
      submitted: [['doc_review', 'Inizia revisione documenti']],
      doc_review: [['doc_approved', 'Approva documenti'], ['doc_rejected', 'Respingi documenti']],
      doc_approved: [['audit_scheduled', 'Pianifica audit']],
      audit_completed: [['approved', 'Approva'], ['rejected', 'Respingi']],
      approved: [['issued', 'Rilascia certificato']]
    };
    const available = nextStatuses[cert.status] || [];
    if (available.length > 0) {
      actionsHtml = `<div class="mt-2">${available.map(([s, l]) => 
        `<button class="btn ${s.includes('reject') ? 'btn-danger' : 'btn-primary'} btn-sm" 
         onclick="updateCertStatus('${id}', '${s}')">${l}</button>`).join(' ')}</div>`;
    }
  }

  // Pulsante crea audit
  let auditBtn = '';
  if (canManage && ['doc_approved', 'audit_scheduled'].includes(cert.status)) {
    auditBtn = `<button class="btn btn-primary mt-2" onclick="createAudit('${id}')">✅ Crea audit</button>`;
  }

  // Pulsante scarica certificato
  let certPdfBtn = '';
  if (cert.status === 'issued') {
    certPdfBtn = `<button class="btn btn-primary mt-2" onclick="downloadCertificatePdf('${id}', '${cert.cert_number || 'GCF'}')">📄 Scarica Certificato PDF</button>`;
  }

  // Carica documenti allegati
  const docs = await api(`/certifications/${id}/documents`) || [];
  const docsHtml = docs.length > 0 ? `
    <div class="card mb-2">
      <div class="card-header"><h3>📎 Documenti allegati (${docs.length})</h3></div>
      <div class="card-body">
        ${docs.map(d => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="flex:1">📄 <strong>${sanitize(d.file_name)}</strong> <span class="text-sm text-muted">(${(d.file_size/1024).toFixed(0)} KB — ${formatDate(d.created_at)})</span></span>
            <button class="btn btn-secondary btn-sm" onclick="downloadCertDoc('${d.id}','${sanitize(d.file_name)}')">⬇️</button>
            ${['admin','org_admin','org_operator'].includes(state.user.role) && ['submitted','doc_review','draft'].includes(cert.status) ?
              `<button class="btn btn-danger btn-sm" onclick="deleteCertDoc('${id}','${d.id}')">🗑️</button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Upload addizionale (se in fase di revisione)
  const canUploadMore = ['admin','org_admin','org_operator'].includes(state.user.role) && ['submitted','doc_review','draft'].includes(cert.status);
  const uploadBtn = canUploadMore ? `<button class="btn btn-secondary mt-2" onclick="uploadAdditionalDoc('${id}')">📎 Carica documento</button>` : '';

  $('#page-content').innerHTML = `
    <div class="card mb-2">
      <div class="card-header"><h3>Certificazione ${cert.cert_number || ''}</h3></div>
      <div class="card-body">
        <div class="form-row">
          <div><strong>Organizzazione:</strong> ${sanitize(cert.org_name)}</div>
          <div><strong>Stato:</strong> ${badge(cert.status)}</div>
        </div>
        <div class="form-row mt-1">
          <div><strong>Data domanda:</strong> ${formatDate(cert.application_date)}</div>
          <div><strong>Data rilascio:</strong> ${formatDate(cert.issue_date)}</div>
        </div>
        <div class="form-row mt-1">
          <div><strong>Data scadenza:</strong> ${formatDate(cert.expiry_date)}</div>
          <div><strong>Note:</strong> ${sanitize(cert.notes) || '—'}</div>
        </div>
        ${actionsHtml}
        ${auditBtn}
        ${certPdfBtn}
        ${uploadBtn}
      </div>
    </div>
    ${docsHtml}
    ${cert.audits && cert.audits.length > 0 ? `
      <div class="card">
        <div class="card-header"><h3>Audit associati</h3></div>
        <div class="card-body"><div class="table-container"><table>
          <tr><th>Tipo</th><th>Data</th><th>Stato</th><th>Esito</th><th></th></tr>
          ${cert.audits.map(a => `<tr>
            <td>${translateAuditType(a.audit_type)}</td><td>${formatDate(a.scheduled_date || a.completed_date)}</td>
            <td>${badge(a.status)}</td><td>${a.outcome ? translateOutcome(a.outcome) : '—'}</td>
            <td><a href="#audit-checklist/${a.id}" class="btn btn-primary btn-sm">Apri checklist</a></td>
          </tr>`).join('')}
        </table></div></div>
      </div>
    ` : ''}
  `;
}

async function updateCertStatus(certId, status) {

async function downloadCertDoc(docId, fileName) {
  try {
    const resp = await fetch(`${API}/certifications/doc-download/${docId}`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (!resp.ok) throw new Error('Download error');
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  } catch (err) { toast('Errore download documento', 'error'); }
}

function deleteCertDoc(certId, docId) {
  showConfirmModal('Eliminare documento?', 'Sei sicuro di voler eliminare questo documento?', async () => {
    const result = await api(`/certifications/${certId}/documents/${docId}`, { method: 'DELETE' });
    if (result) { toast('Documento eliminato', 'success'); renderCertificationDetail(certId); }
  });
}

function uploadAdditionalDoc(certId) {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.pdf';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast('Solo file PDF ammessi', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('File troppo grande (max 10MB)', 'error'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentName', file.name);
    formData.append('documentType', 'general');
    try {
      const resp = await fetch(`${API}/certifications/${certId}/documents`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.token}` }, body: formData
      });
      if (resp.ok) { toast('Documento caricato!', 'success'); renderCertificationDetail(certId); }
      else { const err = await resp.json(); toast(err.error || 'Errore upload', 'error'); }
    } catch (err) { toast('Errore upload', 'error'); }
  };
  input.click();
}
  if (status.includes('reject')) {
    showInputModal('Motivo del rifiuto', 'Inserisci la motivazione per il rifiuto della certificazione.', 'Motivazione...', (notes) => {
      doUpdateCertStatus(certId, status, notes);
    });
  } else {
    doUpdateCertStatus(certId, status, null);
  }
}

async function doUpdateCertStatus(certId, status, notes) {
  const result = await api(`/certifications/${certId}/status`, {
    method: 'PUT', body: JSON.stringify({ status, notes })
  });
  if (result) { toast('Stato aggiornato', 'success'); renderCertificationDetail(certId); }
}

function showInputModal(title, message, placeholder, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:420px">
      <div class="confirm-modal-icon">📝</div>
      <h3 class="confirm-modal-title">${title}</h3>
      <p class="confirm-modal-text">${message}</p>
      <div style="text-align:left;margin-bottom:20px">
        <textarea id="modal-input" rows="3" placeholder="${placeholder}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:vertical"></textarea>
      </div>
      <div class="confirm-modal-actions">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Conferma</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  overlay.querySelector('#modal-cancel').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 200);
  };
  overlay.querySelector('#modal-confirm').onclick = () => {
    const val = overlay.querySelector('#modal-input').value;
    overlay.remove();
    onConfirm(val);
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
    }
  };
}

async function createAudit(certId) {
  const result = await api('/audits', {
    method: 'POST',
    body: JSON.stringify({ certificationId: certId, auditType: 'initial', auditMode: 'on_site' })
  });
  if (result) { toast('Audit creato!', 'success'); navigate('audit-checklist', result.id); }
}

async function requestCertification() {
  const orgId = state.user.organization?.id;
  if (!orgId) { toast('Nessuna organizzazione associata al tuo account', 'error'); return; }
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:520px;text-align:left">
      <div style="text-align:center">
        <div class="confirm-modal-icon">📜</div>
        <h3 class="confirm-modal-title">Richiedi certificazione</h3>
        <p class="confirm-modal-text">Allega i documenti richiesti per la certificazione (formato PDF, max 10MB ciascuno)</p>
      </div>
      <div id="cert-docs-list" style="margin-bottom:16px"></div>
      <div style="margin-bottom:16px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:12px;border:2px dashed #ccc;border-radius:8px;justify-content:center;color:#666">
          <input type="file" id="cert-file-input" accept=".pdf" multiple style="display:none">
          📎 Seleziona file PDF da allegare
        </label>
      </div>
      <div class="confirm-modal-actions" style="justify-content:flex-end">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Invia domanda</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  let selectedFiles = [];

  overlay.querySelector('#cert-file-input').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      if (f.type !== 'application/pdf') { toast(`${f.name} non è un PDF`, 'error'); return; }
      if (f.size > 10 * 1024 * 1024) { toast(`${f.name} supera 10MB`, 'error'); return; }
      if (!selectedFiles.find(sf => sf.name === f.name)) selectedFiles.push(f);
    });
    renderDocsList();
    e.target.value = '';
  });

  function renderDocsList() {
    const list = overlay.querySelector('#cert-docs-list');
    if (selectedFiles.length === 0) { list.innerHTML = ''; return; }
    list.innerHTML = selectedFiles.map((f, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f5f5f5;border-radius:6px;margin-bottom:6px">
        <span style="flex:1">📄 ${f.name} <span style="color:#999;font-size:12px">(${(f.size/1024).toFixed(0)} KB)</span></span>
        <button type="button" onclick="this.closest('.modal-overlay').__removeFile(${i})" style="background:none;border:none;cursor:pointer;color:#d32f2f;font-size:16px">✕</button>
      </div>
    `).join('');
  }
  overlay.__removeFile = (i) => { selectedFiles.splice(i, 1); renderDocsList(); };

  overlay.querySelector('#modal-cancel').onclick = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); };
  overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); } };

  overlay.querySelector('#modal-confirm').onclick = async () => {
    overlay.remove();
    // 1. Create certification
    const result = await api('/certifications', {
      method: 'POST',
      body: JSON.stringify({ organizationId: orgId })
    });
    if (!result) return;

    // 2. Upload documents
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentName', file.name);
        formData.append('documentType', 'general');
        try {
          await fetch(`${API}/certifications/${result.id}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
          });
        } catch (err) { console.error('Upload error:', err); }
      }
      toast(`Domanda inviata con ${selectedFiles.length} documenti!`, 'success');
    } else {
      toast('Domanda di certificazione inviata!', 'success');
    }
    renderCertifications();
  };
}

// ============================================================
// PAGE: AUDITS LIST
// ============================================================
async function renderAudits() {
  renderLayout('Audit', '<div class="loading"><div class="spinner"></div></div>');
  const audits = await api('/audits');
  if (!audits) return;

  $('#page-content').innerHTML = audits.length === 0 ? `
    <div class="empty-state"><div class="icon">✅</div><h3>Nessun audit</h3></div>
  ` : `
    <div class="table-container"><table>
      <tr><th>Organizzazione</th><th>Tipo</th><th>Data</th><th>Stato</th><th>Esito</th><th></th></tr>
      ${audits.map(a => `<tr>
        <td>${sanitize(a.org_name)}</td>
        <td>${translateAuditType(a.audit_type)}</td>
        <td>${formatDate(a.scheduled_date || a.completed_date)}</td>
        <td>${badge(a.status)}</td>
        <td>${a.outcome ? translateOutcome(a.outcome) : '—'}</td>
        <td>
          <a href="#audit-checklist/${a.id}" class="btn btn-primary btn-sm">Checklist</a>
          ${a.status === 'completed' ? `<button class="btn btn-secondary btn-sm" onclick="downloadAuditPdf('${a.id}')">📄 PDF</button>` : ''}
        </td>
      </tr>`).join('')}
    </table></div>
  `;
}

// ============================================================
// PAGE: AUDIT CHECKLIST (core feature)
// ============================================================
async function renderAuditChecklist(auditId) {
  renderLayout('Checklist di Audit', '<div class="loading"><div class="spinner"></div><p>Caricamento checklist...</p></div>');
  
  const audit = await api(`/audits/${auditId}`);
  if (!audit) return;

  const isEditable = audit.status !== 'completed' && audit.status !== 'cancelled';
  const evaluations = audit.evaluations || [];

  // Raggruppa per area
  const areas = {};
  evaluations.forEach(ev => {
    const areaNum = ev.area_number;
    const areaName = ev.area_name;
    if (!areas[areaNum]) areas[areaNum] = { name: areaName, requirements: [] };
    areas[areaNum].requirements.push(ev);
  });

  let html = `
    <div style="margin-bottom:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigate('certification-detail','${audit.certification_id}')">← Torna al dettaglio certificazione</button>
    </div>
    <div class="card mb-2">
      <div class="card-body flex-between">
        <div>
          <strong>${sanitize(audit.org_name)}</strong> — ${sanitize(audit.org_city)}<br>
          <span class="text-sm text-muted">Tipo: ${translateAuditType(audit.audit_type)} | Modalità: ${translateAuditMode(audit.audit_mode)} | ${badge(audit.status)}</span>
        </div>
        <div>
          <span class="badge badge-C">C: ${audit.total_conforming}</span>
          <span class="badge badge-PC">PC: ${audit.total_partially}</span>
          <span class="badge badge-NC">NC: ${audit.total_non_conforming}</span>
          <span class="badge badge-NA">NA: ${audit.total_not_applicable}</span>
        </div>
      </div>
    </div>
    <form id="audit-form">
  `;

  Object.entries(areas).sort(([a],[b]) => a-b).forEach(([areaNum, area]) => {
    html += `<div class="audit-area"><h3>Area ${areaNum} — ${area.name}</h3>`;
    area.requirements.forEach(req => {
      const reqId = req.requirement_id;
      const currentEval = req.evaluation || '';
      const checkedEvidences = req.evidences_checked ? (typeof req.evidences_checked === 'string' ? JSON.parse(req.evidences_checked) : req.evidences_checked) : [];
      const availableEvidences = req.acceptable_evidences ? (typeof req.acceptable_evidences === 'string' ? JSON.parse(req.acceptable_evidences) : req.acceptable_evidences) : [];

      html += `
        <div class="audit-requirement" data-req-id="${reqId}">
          <h4>Requisito ${req.requirement_number} — ${sanitize(req.req_title || req.title || '')}</h4>
          <p class="question">${sanitize(req.verification_question || '')}</p>
          
          <div class="eval-options">
            ${['C','PC','NC','NA'].map(ev => `
              <div class="eval-option ${currentEval === ev ? 'selected-'+ev : ''}" 
                   data-eval="${ev}" data-req="${reqId}"
                   ${isEditable ? `onclick="selectEval(this, '${reqId}', '${ev}')"` : ''}>
                ${ev === 'C' ? '✓ Conforme' : ev === 'PC' ? '◐ Parz. Conforme' : ev === 'NC' ? '✗ Non Conforme' : '— N/A'}
              </div>
            `).join('')}
          </div>
          
          ${availableEvidences.length > 0 ? `
            <div class="evidence-checks">
              ${availableEvidences.map(ev => `
                <label class="evidence-check">
                  <input type="checkbox" data-req="${reqId}" data-evidence="${sanitize(ev)}" 
                    ${checkedEvidences.includes(ev) ? 'checked' : ''} ${!isEditable ? 'disabled' : ''}>
                  ${sanitize(ev)}
                </label>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="form-group">
            <textarea placeholder="Note / Evidenze osservate..." data-req="${reqId}" class="eval-notes"
              ${!isEditable ? 'disabled' : ''}>${sanitize(req.notes || '')}</textarea>
          </div>
        </div>
      `;
    });
    html += '</div>';
  });

  if (isEditable) {
    html += `
      <div class="card mt-2">
        <div class="card-body">
          <div class="btn-group">
            <button type="button" class="btn btn-primary" onclick="saveAuditEvaluations('${auditId}')">💾 Salva valutazioni</button>
            <button type="button" class="btn btn-success" onclick="completeAudit('${auditId}')">✅ Completa audit</button>
            <button type="button" class="btn btn-secondary" onclick="downloadAuditPdf('${auditId}')">📄 Scarica PDF</button>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="card mt-2">
        <div class="card-body flex-between">
          <div><strong>Esito:</strong> ${audit.outcome ? translateOutcome(audit.outcome) : '—'}</div>
          <button class="btn btn-secondary" onclick="downloadAuditPdf('${auditId}')">📄 Scarica Report PDF</button>
        </div>
      </div>
    `;
  }

  html += '</form>';
  $('#page-content').innerHTML = html;
}

function selectEval(el, reqId, value) {
  // Deseleziona tutti nella stessa riga
  el.parentNode.querySelectorAll('.eval-option').forEach(opt => {
    opt.className = 'eval-option';
  });
  el.className = `eval-option selected-${value}`;
}

async function saveAuditEvaluations(auditId) {
  const evaluations = [];
  $$('.audit-requirement').forEach(req => {
    const reqId = req.dataset.reqId;
    const selectedEl = req.querySelector('.eval-option[class*="selected-"]');
    let evaluation = null;
    if (selectedEl) {
      const cls = selectedEl.className;
      if (cls.includes('selected-C')) evaluation = 'C';
      else if (cls.includes('selected-PC')) evaluation = 'PC';
      else if (cls.includes('selected-NC')) evaluation = 'NC';
      else if (cls.includes('selected-NA')) evaluation = 'NA';
    }

    const evidencesChecked = [];
    req.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      evidencesChecked.push(cb.dataset.evidence);
    });

    const notes = req.querySelector('.eval-notes')?.value || '';

    evaluations.push({ requirementId: reqId, evaluation, evidences_checked: evidencesChecked, notes });
  });

  const result = await api(`/audits/${auditId}/evaluations`, {
    method: 'PUT', body: JSON.stringify({ evaluations })
  });
  if (result) { toast('Valutazioni salvate!', 'success'); renderAuditChecklist(auditId); }
}

async function completeAudit(auditId) {
  showAuditCompleteModal(auditId);
}

function showAuditCompleteModal(auditId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:440px">
      <div class="confirm-modal-icon">✅</div>
      <h3 class="confirm-modal-title">Completare l'audit?</h3>
      <p class="confirm-modal-text">Questa azione non è reversibile. L'esito verrà calcolato automaticamente.</p>
      <div style="text-align:left;margin-bottom:20px">
        <div class="form-group" style="margin-bottom:12px">
          <label style="font-weight:600;font-size:13px;color:#333">Nome rappresentante organizzazione</label>
          <input type="text" id="modal-org-rep" placeholder="es. Mario Bianchi" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px">
        </div>
        <div class="form-group">
          <label style="font-weight:600;font-size:13px;color:#333">Note finali auditor (opzionale)</label>
          <textarea id="modal-audit-notes" rows="3" placeholder="Eventuali osservazioni..." style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:vertical"></textarea>
        </div>
      </div>
      <div class="confirm-modal-actions">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Completa audit</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  overlay.querySelector('#modal-cancel').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 200);
  };
  overlay.querySelector('#modal-confirm').onclick = async () => {
    const orgRepName = overlay.querySelector('#modal-org-rep').value;
    const notes = overlay.querySelector('#modal-audit-notes').value;
    overlay.remove();

    await saveAuditEvaluations(auditId);
    const result = await api(`/audits/${auditId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ auditorNotes: notes, orgRepresentativeName: orgRepName })
    });
    if (result) { toast(`Audit completato — Esito: ${translateOutcome(result.outcome)}`, 'success'); renderAuditChecklist(auditId); }
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
    }
  };
}

async function downloadAuditPdf(auditId) {
  try {
    const res = await fetch(`${API}/audits/${auditId}/pdf`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (!res.ok) { toast('Errore download PDF', 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_audit_${auditId.substring(0,8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('PDF scaricato', 'success');
  } catch { toast('Errore download', 'error'); }
}

async function downloadCertificatePdf(certId, certNumber) {
  try {
    const res = await fetch(`${API}/certifications/${certId}/certificate-pdf`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (!res.ok) { toast('Errore download certificato', 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificato_${certNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Certificato scaricato', 'success');
  } catch { toast('Errore download', 'error'); }
}

// ============================================================
// PAGE: BENEFICIARIES
// ============================================================
async function renderBeneficiaries() {
  renderLayout('Beneficiari', '<div class="loading"><div class="spinner"></div></div>');
  const bens = await api('/beneficiaries');
  if (!bens) return;

  const canAdd = ['admin', 'org_admin', 'org_operator'].includes(state.user.role);

  $('#page-content').innerHTML = `
    ${canAdd ? '<button class="btn btn-primary mb-2" onclick="showAddBeneficiaryModal()">+ Nuovo beneficiario</button>' : ''}
    ${bens.length === 0 ? '<div class="empty-state"><div class="icon">👥</div><h3>Nessun beneficiario registrato</h3></div>' : `
      <div class="table-container"><table>
        <tr><th>Codice</th><th>Organizzazione</th><th>Tipologia</th><th>Stato</th><th>Ente inviante</th><th>Attività</th>${canAdd ? '<th>Azioni</th>' : ''}</tr>
        ${bens.map(b => `<tr>
          <td><strong>${sanitize(b.code)}</strong></td>
          <td>${sanitize(b.org_name)}</td>
          <td>${TARGET_LABELS[b.target_type] || b.target_type || '—'}</td>
          <td>${badge(b.status)}</td>
          <td>${sanitize(b.referring_entity) || '—'}</td>
          <td>${b.activity_count || 0}</td>
          ${canAdd ? `<td><div style="display:flex;gap:4px;flex-wrap:nowrap">
            <button class="btn btn-secondary btn-sm" onclick="showEditBeneficiaryModal('${b.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBeneficiary('${b.id}','${sanitize(b.code)}')">🗑️</button>
          </div></td>` : ''}
        </tr>`).join('')}
      </table></div>
    `}
    <div id="modal-container"></div>
  `;
}

function showAddBeneficiaryModal() {
  // Necessita dell'org_id - prende dalla prima organizzazione dell'utente
  const orgSelect = state.user.organization ? `<input type="hidden" id="ben-org" value="${state.user.organization.id}">` : `
    <div class="form-group"><label>ID Organizzazione</label><input id="ben-org" required></div>`;

  $('#modal-container').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="modal-header"><h3>Nuovo Beneficiario</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button></div>
        <div class="modal-body">
          <form id="ben-form">
            ${orgSelect}
            <div class="form-group"><label>Codice identificativo *</label><input id="ben-code" required placeholder="es. BEN-2026-003"></div>
            <div class="form-group"><label>Tipologia utenza</label>
              <select id="ben-target"><option value="">Seleziona...</option>
              ${Object.entries(TARGET_LABELS).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
            <div class="form-group"><label>Ente inviante</label><input id="ben-entity" placeholder="es. CSM Piacenza"></div>
            <div class="form-group"><label>Data inizio</label><input type="date" id="ben-start"></div>
            <div class="form-group"><label>Note</label><textarea id="ben-notes"></textarea></div>
            <button type="submit" class="btn btn-primary btn-block">Registra beneficiario</button>
          </form>
        </div>
      </div>
    </div>
  `;
  $('#ben-form').onsubmit = async (e) => {
    e.preventDefault();
    const orgId = $('#ben-org').value;
    const result = await api('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: orgId, code: $('#ben-code').value,
        targetType: $('#ben-target').value, referringEntity: $('#ben-entity').value,
        startDate: $('#ben-start').value, notes: $('#ben-notes').value
      })
    });
    if (result) { toast('Beneficiario registrato!', 'success'); renderBeneficiaries(); }
  };
}

// ============================================================
// PAGE: ACTIVITIES
// ============================================================
async function renderActivities() {
  renderLayout('Registro Attività', '<div class="loading"><div class="spinner"></div></div>');
  const activities = await api('/beneficiaries/activities/list');
  if (!activities) return;

  const canAdd = ['admin', 'org_admin', 'org_operator'].includes(state.user.role);

  $('#page-content').innerHTML = `
    ${canAdd ? '<button class="btn btn-primary mb-2" onclick="showAddActivityModal()">+ Registra attività</button>' : ''}
    ${activities.length === 0 ? '<div class="empty-state"><div class="icon">📋</div><h3>Nessuna attività registrata</h3></div>' : `
      <div class="table-container"><table>
        <tr><th>Data</th><th>Organizzazione</th><th>Beneficiario</th><th>Servizio</th><th>Durata</th><th>Descrizione</th>${canAdd ? '<th>Azioni</th>' : ''}</tr>
        ${activities.map(a => `<tr>
          <td>${formatDate(a.activity_date)}</td>
          <td>${sanitize(a.org_name)}</td>
          <td>${sanitize(a.beneficiary_code) || 'Gruppo'}</td>
          <td>${SERVICE_LABELS[a.service_type] || a.service_type || '—'}</td>
          <td>${a.duration_minutes ? (a.duration_minutes / 60).toFixed(1).replace('.0','') + ' h' : '—'}</td>
          <td>${sanitize(a.description)}</td>
          ${canAdd ? `<td><div style="display:flex;gap:4px;flex-wrap:nowrap">
            <button class="btn btn-secondary btn-sm" onclick="showEditActivityModal('${a.id}','${a.activity_date||''}','${a.service_type||''}',${a.duration_minutes||'null'},'${sanitize(a.description).replace(/'/g,"\\'")}','${sanitize(a.notes||'').replace(/'/g,"\\'")}','${a.organization_id||''}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteActivity('${a.id}')">🗑️</button>
          </div></td>` : ''}
        </tr>`).join('')}
      </table></div>
    `}
    <div id="modal-container"></div>
  `;
}

function showAddActivityModal() {
  const orgId = state.user.organization?.id || '';
  $('#modal-container').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="modal-header"><h3>Registra Attività</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button></div>
        <div class="modal-body">
          <form id="act-form">
            <input type="hidden" id="act-org" value="${orgId}">
            <div class="form-row">
              <div class="form-group"><label>Data *</label><input type="date" id="act-date" required value="${new Date().toISOString().split('T')[0]}"></div>
              <div class="form-group"><label>Durata (ore)</label><input type="number" id="act-dur" step="0.5" min="0.5" placeholder="2"></div>
            </div>
            <div class="form-group"><label>Tipo servizio</label>
              <select id="act-type"><option value="">Seleziona...</option>
              ${Object.entries(SERVICE_LABELS).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
            <div class="form-group"><label>Descrizione *</label><textarea id="act-desc" required placeholder="Descrivere l'attività svolta..."></textarea></div>
            <div class="form-group"><label>Note</label><textarea id="act-notes"></textarea></div>
            <button type="submit" class="btn btn-primary btn-block">Registra</button>
          </form>
        </div>
      </div>
    </div>
  `;
  $('#act-form').onsubmit = async (e) => {
    e.preventDefault();
    const result = await api('/beneficiaries/activities', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: $('#act-org').value, activityDate: $('#act-date').value,
        serviceType: $('#act-type').value, durationMinutes: Math.round(parseFloat($('#act-dur').value) * 60) || null,
        description: $('#act-desc').value, notes: $('#act-notes').value
      })
    });
    if (result) { toast('Attività registrata!', 'success'); renderActivities(); }
  };
}

async function showEditBeneficiaryModal(benId) {
  const bens = await api('/beneficiaries');
  const b = bens?.find(x => x.id === benId);
  if (!b) { toast('Beneficiario non trovato', 'error'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:480px;text-align:left">
      <div style="text-align:center"><div class="confirm-modal-icon">✏️</div>
      <h3 class="confirm-modal-title">Modifica Beneficiario</h3>
      <p class="confirm-modal-text">${sanitize(b.code)}</p></div>
      <div class="form-group" style="margin-bottom:12px"><label>Tipologia utenza</label>
        <select id="eb-target" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px">
          <option value="">Seleziona...</option>
          ${Object.entries(TARGET_LABELS).map(([v,l]) => `<option value="${v}" ${v===b.target_type?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Stato</label>
        <select id="eb-status" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px">
          <option value="active" ${b.status==='active'?'selected':''}>Attivo</option>
          <option value="completed" ${b.status==='completed'?'selected':''}>Completato</option>
          <option value="suspended" ${b.status==='suspended'?'selected':''}>Sospeso</option>
          <option value="dropped" ${b.status==='dropped'?'selected':''}>Abbandonato</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Ente inviante</label>
        <input id="eb-entity" value="${sanitize(b.referring_entity||'')}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px">
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Data fine</label>
        <input type="date" id="eb-end" value="${b.end_date||''}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px">
      </div>
      <div class="form-group" style="margin-bottom:20px"><label>Note</label>
        <textarea id="eb-notes" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;min-height:60px">${sanitize(b.notes||'')}</textarea>
      </div>
      <div class="confirm-modal-actions" style="justify-content:flex-end">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Salva</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  overlay.querySelector('#modal-cancel').onclick = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); };
  overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); } };
  overlay.querySelector('#modal-confirm').onclick = async () => {
    const body = {
      targetType: overlay.querySelector('#eb-target').value || null,
      status: overlay.querySelector('#eb-status').value,
      referringEntity: overlay.querySelector('#eb-entity').value.trim() || null,
      endDate: overlay.querySelector('#eb-end').value || null,
      notes: overlay.querySelector('#eb-notes').value.trim() || null,
    };
    overlay.remove();
    const result = await api(`/beneficiaries/${benId}`, { method: 'PUT', body: JSON.stringify(body) });
    if (result) { toast('Beneficiario aggiornato!', 'success'); renderBeneficiaries(); }
  };
}

function deleteBeneficiary(benId, code) {
  showConfirmModal('Eliminare beneficiario?', `Sei sicuro di voler eliminare il beneficiario ${code}? L'operazione è irreversibile.`, async () => {
    const result = await api(`/beneficiaries/${benId}`, { method: 'DELETE' });
    if (result) { toast('Beneficiario eliminato!', 'success'); renderBeneficiaries(); }
  });
}

function showEditActivityModal(actId, date, serviceType, duration, description, notes, orgId) {
  const durationHours = duration ? (duration / 60) : '';
  const inputStyle = 'width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:480px;text-align:left">
      <div style="text-align:center"><div class="confirm-modal-icon">✏️</div>
      <h3 class="confirm-modal-title">Modifica Attività</h3></div>
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group"><label>Data *</label><input type="date" id="ea-date" value="${date}" style="${inputStyle}"></div>
        <div class="form-group"><label>Durata (ore)</label><input type="number" id="ea-dur" step="0.5" min="0.5" value="${durationHours}" style="${inputStyle}"></div>
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Tipo servizio</label>
        <select id="ea-type" style="${inputStyle}">
          <option value="">Seleziona...</option>
          ${Object.entries(SERVICE_LABELS).map(([v,l]) => `<option value="${v}" ${v===serviceType?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Descrizione *</label>
        <textarea id="ea-desc" style="${inputStyle};min-height:80px">${description}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:20px"><label>Note</label>
        <textarea id="ea-notes" style="${inputStyle};min-height:60px">${notes}</textarea>
      </div>
      <div class="confirm-modal-actions" style="justify-content:flex-end">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Salva</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  overlay.querySelector('#modal-cancel').onclick = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); };
  overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); } };
  overlay.querySelector('#modal-confirm').onclick = async () => {
    const body = {
      activityDate: overlay.querySelector('#ea-date').value,
      serviceType: overlay.querySelector('#ea-type').value || null,
      durationMinutes: Math.round(parseFloat(overlay.querySelector('#ea-dur').value) * 60) || null,
      description: overlay.querySelector('#ea-desc').value.trim(),
      notes: overlay.querySelector('#ea-notes').value.trim() || null,
    };
    if (!body.activityDate || !body.description) { toast('Data e descrizione obbligatorie', 'error'); return; }
    overlay.remove();
    const result = await api(`/beneficiaries/activities/${actId}`, { method: 'PUT', body: JSON.stringify(body) });
    if (result) { toast('Attività aggiornata!', 'success'); renderActivities(); }
  };
}

function deleteActivity(actId) {
  showConfirmModal('Eliminare attività?', 'Sei sicuro di voler eliminare questa attività? L\'operazione è irreversibile.', async () => {
    const result = await api(`/beneficiaries/activities/${actId}`, { method: 'DELETE' });
    if (result) { toast('Attività eliminata!', 'success'); renderActivities(); }
  });
}

// ============================================================
// PAGE: ORGANIZATION DETAIL (Admin)
// ============================================================
async function renderOrganizationDetail(id) {
  renderLayout('Dettaglio Organizzazione', '<div class="loading"><div class="spinner"></div></div>');

  const org = await api(`/organizations/${id}`);
  if (!org) return;

  // Load beneficiaries for this org
  const bens = await api(`/beneficiaries?organization_id=${id}`) || [];
  // Load activities for this org
  const activities = await api(`/beneficiaries/activities/list?organization_id=${id}`) || [];

  $('#page-content').innerHTML = `
    <div class="card mb-2">
      <div class="card-header" style="background:linear-gradient(135deg,#1a3d17,#2d5a27);color:white;border-radius:8px 8px 0 0">
        <h3>${sanitize(org.name)}</h3>
        <span>${badge(org.status)}</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div><strong>Forma giuridica:</strong> ${LEGAL_FORMS[org.legal_form] || org.legal_form}</div>
          <div><strong>📍 Indirizzo:</strong> ${sanitize(org.address)}, ${sanitize(org.city)} (${org.province}) — ${sanitize(org.region)}</div>
        </div>
        <div class="form-row mt-1">
          <div><strong>📞 Telefono:</strong> ${org.phone || '—'}</div>
          <div><strong>✉️ Email:</strong> ${org.email || '—'}</div>
        </div>
        <div class="form-row mt-1">
          <div><strong>C.F.:</strong> ${org.tax_code || '—'}</div>
          <div><strong>P.IVA:</strong> ${org.vat_number || '—'}</div>
        </div>
        ${org.social_manager_name ? `<p class="mt-1"><strong>Responsabile servizi:</strong> ${sanitize(org.social_manager_name)} ${org.social_manager_role ? '('+sanitize(org.social_manager_role)+')' : ''}</p>` : ''}
        <div class="mt-2">
          <button class="btn btn-secondary btn-sm" onclick="navigate('organization-edit','${id}')">✏️ Modifica</button>
        </div>
      </div>
    </div>

    <div class="card mb-2">
      <div class="card-header"><h3>👥 Beneficiari (${bens.length})</h3></div>
      <div class="card-body">
        ${bens.length === 0 ? '<p class="text-muted">Nessun beneficiario registrato</p>' : `
          <div class="table-container"><table>
            <tr><th>Codice</th><th>Tipologia</th><th>Stato</th><th>Ente inviante</th><th>Attività</th></tr>
            ${bens.map(b => `<tr>
              <td><strong>${sanitize(b.code)}</strong></td>
              <td>${TARGET_LABELS[b.target_type] || b.target_type || '—'}</td>
              <td>${badge(b.status)}</td>
              <td>${sanitize(b.referring_entity) || '—'}</td>
              <td>${b.activity_count || 0}</td>
            </tr>`).join('')}
          </table></div>
        `}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>📋 Attività recenti (${activities.length})</h3></div>
      <div class="card-body">
        ${activities.length === 0 ? '<p class="text-muted">Nessuna attività registrata</p>' : `
          <div class="table-container"><table>
            <tr><th>Data</th><th>Beneficiario</th><th>Servizio</th><th>Durata</th><th>Descrizione</th></tr>
            ${activities.slice(0, 20).map(a => `<tr>
              <td>${formatDate(a.activity_date)}</td>
              <td>${sanitize(a.beneficiary_code) || 'Gruppo'}</td>
              <td>${SERVICE_LABELS[a.service_type] || a.service_type || '—'}</td>
              <td>${a.duration_minutes ? (a.duration_minutes / 60).toFixed(1).replace('.0','') + ' h' : '—'}</td>
              <td>${sanitize(a.description)}</td>
            </tr>`).join('')}
          </table></div>
          ${activities.length > 20 ? `<p class="text-sm text-muted mt-1">Mostrate le ultime 20 su ${activities.length} totali</p>` : ''}
        `}
      </div>
    </div>
  `;
}

// ============================================================
// PAGE: ADMIN REVIEWS MODERATION
// ============================================================
async function renderAdminReviews() {
  renderLayout('Moderazione Recensioni', '<div class="loading"><div class="spinner"></div></div>');
  const reviews = await api('/registry/reviews/pending');
  if (!reviews) return;

  $('#page-content').innerHTML = reviews.length === 0 ? `
    <div class="empty-state"><div class="icon">⭐</div><h3>Nessuna recensione da moderare</h3><p>Tutte le recensioni sono state revisionate.</p></div>
  ` : `
    <p class="mb-2">${reviews.length} recensione/i in attesa di approvazione</p>
    ${reviews.map(r => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="flex-between">
            <div>
              <strong>${sanitize(r.author_name)}</strong>
              ${r.author_role ? `<span class="text-sm text-muted"> — ${sanitize(r.author_role)}</span>` : ''}
            </div>
            <span>${'⭐'.repeat(r.rating)}</span>
          </div>
          <p class="text-sm text-muted mt-1">Organizzazione: <strong>${sanitize(r.org_name)}</strong> — ${formatDate(r.created_at)}</p>
          ${r.comment ? `<div style="background:#f5f5f5;padding:12px;border-radius:8px;margin-top:8px;border-left:3px solid var(--primary)">${sanitize(r.comment)}</div>` : ''}
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
            <button class="btn btn-danger btn-sm" onclick="moderateReview('${r.id}','reject')">🚫 Rifiuta</button>
            <button class="btn btn-primary btn-sm" onclick="moderateReview('${r.id}','approve')">✅ Approva</button>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

async function moderateReview(reviewId, action) {
  const result = await api(`/registry/reviews/${reviewId}/${action}`, { method: 'PUT' });
  if (result) {
    toast(action === 'approve' ? 'Recensione approvata e pubblicata!' : 'Recensione rifiutata e rimossa.', 'success');
    renderAdminReviews();
  }
}

// ============================================================
// PAGE: PUBLIC REGISTRY
// ============================================================
async function renderRegistry() {
  const hasUser = !!state.user;
  
  if (hasUser) {
    renderLayout('Registro Pubblico', '<div class="loading"><div class="spinner"></div></div>');
  } else {
    $('#app').innerHTML = `
      <div style="min-height:100vh">
        <div style="background:linear-gradient(135deg,#1a3d17,#2d5a27);color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center">
          <div><span style="font-size:24px">🌿</span> <strong>Green Care Farm Certificata</strong> — AICARE</div>
          <div><a href="#login" style="color:white;margin-right:15px">Accedi</a><a href="#register" class="btn btn-secondary btn-sm">Registrati</a></div>
        </div>
        <div class="page-body" id="page-content"><div class="loading"><div class="spinner"></div></div></div>
      </div>
    `;
  }

  const [orgs, stats] = await Promise.all([api('/registry'), api('/registry/stats')]);
  if (!orgs) return;

  let html = '';

  if (stats) {
    html += `
      <div class="stats-grid mb-3">
        <div class="stat-card"><div class="stat-value">${stats.totalCertified}</div><div class="stat-label">Organizzazioni certificate</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalBeneficiaries}</div><div class="stat-label">Beneficiari attivi</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalActivities}</div><div class="stat-label">Attività erogate</div></div>
      </div>
    `;
  }

  html += `
    <div class="card mb-2">
      <div class="card-body">
        <div class="form-row-3">
          <div class="form-group"><input id="reg-search" placeholder="Cerca organizzazione..." oninput="filterRegistry()"></div>
          <div class="form-group"><select id="reg-service" onchange="filterRegistry()"><option value="">Tutti i servizi</option>
            ${Object.entries(SERVICE_LABELS).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
          <div class="form-group"><select id="reg-target" onchange="filterRegistry()"><option value="">Tutte le utenze</option>
            ${Object.entries(TARGET_LABELS).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
        </div>
      </div>
    </div>
  `;

  html += `<div class="org-grid" id="registry-grid">`;
  orgs.forEach(org => {
    html += `
      <div class="org-card" data-services="${(org.services||[]).join(',')}" 
           data-targets="${(org.targets||[]).join(',')}" data-name="${(org.name||'').toLowerCase()}"
           onclick="navigate('registry-detail','${org.id}')">
        <div class="org-card-header">
          <h3>${sanitize(org.name)}</h3>
          <div class="cert-badge">📜 ${org.cert_number}</div>
        </div>
        <div class="org-card-body">
          <p>📍 ${sanitize(org.city)} (${org.province}) — ${sanitize(org.region)}</p>
          <p>${LEGAL_FORMS[org.legal_form] || org.legal_form}</p>
          ${org.avg_rating ? `<p>⭐ ${Number(org.avg_rating).toFixed(1)}/5 (${org.review_count} recensioni)</p>` : ''}
          <div class="org-tags">
            ${(org.services||[]).map(s => `<span class="org-tag">${SERVICE_LABELS[s] || s}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  if (orgs.length === 0) {
    html += '<div class="empty-state"><div class="icon">🗂️</div><h3>Nessuna organizzazione certificata al momento</h3></div>';
  }

  $('#page-content').innerHTML = html;
}

function filterRegistry() {
  const search = ($('#reg-search')?.value || '').toLowerCase();
  const service = $('#reg-service')?.value || '';
  const target = $('#reg-target')?.value || '';

  $$('.org-card').forEach(card => {
    const name = card.dataset.name;
    const services = card.dataset.services;
    const targets = card.dataset.targets;

    let show = true;
    if (search && !name.includes(search)) show = false;
    if (service && !services.includes(service)) show = false;
    if (target && !targets.includes(target)) show = false;

    card.style.display = show ? '' : 'none';
  });
}

// ============================================================
// PAGE: REGISTRY DETAIL
// ============================================================
async function renderRegistryDetail(id) {
  const hasUser = !!state.user;
  
  if (hasUser) {
    renderLayout('Dettaglio Organizzazione', '<div class="loading"><div class="spinner"></div></div>');
  } else {
    $('#app').innerHTML = `
      <div style="min-height:100vh">
        <div style="background:linear-gradient(135deg,#1a3d17,#2d5a27);color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center">
          <div><a href="#registry" style="color:white">← Registro</a></div>
          <div><a href="#login" style="color:white">Accedi</a></div>
        </div>
        <div class="page-body" id="page-content"><div class="loading"><div class="spinner"></div></div></div>
      </div>
    `;
  }

  const org = await api(`/registry/${id}`);
  if (!org) return;

  $('#page-content').innerHTML = `
    <div class="card mb-2">
      <div class="card-header" style="background:linear-gradient(135deg,#1a3d17,#2d5a27);color:white;border-radius:8px 8px 0 0">
        <h3>${sanitize(org.name)}</h3>
        <span class="badge badge-success">📜 ${org.cert_number}</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div><strong>📍 Indirizzo:</strong> ${sanitize(org.address)}, ${sanitize(org.city)} (${org.province})</div>
          <div><strong>Forma giuridica:</strong> ${LEGAL_FORMS[org.legal_form]}</div>
        </div>
        <div class="form-row mt-1">
          <div><strong>📞 Telefono:</strong> ${org.phone || '—'}</div>
          <div><strong>✉️ Email:</strong> ${org.email || '—'}</div>
        </div>
        ${org.website ? `<p class="mt-1"><strong>🌐 Sito:</strong> <a href="${org.website}" target="_blank">${org.website}</a></p>` : ''}
        ${org.description ? `<p class="mt-2">${sanitize(org.description)}</p>` : ''}
        <div class="mt-2">
          <strong>Certificazione valida:</strong> dal ${formatDate(org.issue_date)} al ${formatDate(org.expiry_date)}
        </div>
      </div>
    </div>

    <div class="form-row mb-2">
      <div class="card">
        <div class="card-header"><h3>Servizi offerti</h3></div>
        <div class="card-body">
          ${(org.services||[]).map(s => `<p>✅ ${SERVICE_LABELS[s.service_type] || s.service_type}${s.description ? ` — ${sanitize(s.description)}` : ''}</p>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Utenza destinataria</h3></div>
        <div class="card-body">
          ${(org.targets||[]).map(t => `<p>👤 ${TARGET_LABELS[t.target_type] || t.target_type}${t.notes ? ` — ${sanitize(t.notes)}` : ''}</p>`).join('')}
        </div>
      </div>
    </div>

    ${(org.reviews||[]).length > 0 ? `
      <div class="card mb-2">
        <div class="card-header"><h3>Recensioni</h3></div>
        <div class="card-body">
          ${org.reviews.map(r => `
            <div style="border-bottom:1px solid var(--border);padding:12px 0">
              <div class="flex-between">
                <strong>${sanitize(r.author_name)}</strong>
                <span>${'⭐'.repeat(r.rating)}</span>
              </div>
              ${r.author_role ? `<div class="text-sm text-muted">${sanitize(r.author_role)}</div>` : ''}
              ${r.comment ? `<p class="mt-1">${sanitize(r.comment)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="card">
      <div class="card-header"><h3>Lascia una recensione</h3></div>
      <div class="card-body">
        <form id="review-form">
          <div class="form-row">
            <div class="form-group"><label>Il tuo nome</label><input id="rev-name" required></div>
            <div class="form-group"><label>Ruolo</label><input id="rev-role" placeholder="es. Familiare, Operatore..."></div>
          </div>
          <div class="form-group"><label>Valutazione</label>
            <select id="rev-rating" required><option value="5">⭐⭐⭐⭐⭐ Eccellente</option>
            <option value="4">⭐⭐⭐⭐ Buono</option><option value="3">⭐⭐⭐ Sufficiente</option>
            <option value="2">⭐⭐ Insufficiente</option><option value="1">⭐ Scarso</option></select></div>
          <div class="form-group"><label>Commento</label><textarea id="rev-comment"></textarea></div>
          <button type="submit" class="btn btn-primary">Invia recensione</button>
        </form>
      </div>
    </div>
  `;

  $('#review-form').onsubmit = async (e) => {
    e.preventDefault();
    const result = await api(`/registry/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        authorName: $('#rev-name').value, authorRole: $('#rev-role').value,
        rating: parseInt($('#rev-rating').value), comment: $('#rev-comment').value
      })
    });
    if (result) { toast('Recensione inviata! Sarà pubblicata dopo approvazione.', 'success'); }
  };
}

// ============================================================
// PAGE: ADMIN DASHBOARD
// ============================================================
async function renderAdmin() {
  renderLayout('Amministrazione', '<div class="loading"><div class="spinner"></div></div>');
  const stats = await api('/admin/dashboard');
  if (!stats) return;

  $('#page-content').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card clickable" onclick="navigate('organizations')"><div class="stat-value">${stats.organizations.total}</div><div class="stat-label">Organizzazioni totali</div></div>
      <div class="stat-card clickable" onclick="navigate('certifications')"><div class="stat-value">${stats.certifications.total}</div><div class="stat-label">Certificazioni</div></div>
      <div class="stat-card clickable" onclick="navigate('audits')"><div class="stat-value">${stats.audits.total}</div><div class="stat-label">Audit</div></div>
      <div class="stat-card clickable" onclick="navigate('admin-users')"><div class="stat-value">${stats.users.total}</div><div class="stat-label">Utenti</div></div>
    </div>
    <div class="form-row">
      <div class="card">
        <div class="card-header"><h3>Organizzazioni per stato</h3></div>
        <div class="card-body">${stats.organizations.byStatus.map(s => `<p>${badge(s.status)} ${s.count}</p>`).join('')}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Utenti per ruolo</h3></div>
        <div class="card-body">${stats.users.byRole.map(r => `<p><strong>${ROLE_LABELS[r.role] || r.role}:</strong> ${r.count}</p>`).join('')}</div>
      </div>
    </div>
  `;
}

const ROLE_LABELS = { admin:'Amministratore', auditor:'Auditor', org_admin:'Admin Organizzazione', org_operator:'Operatore', ente_referente:'Ente Referente' };
const ROLE_OPTIONS = ['admin','auditor','org_admin','org_operator','ente_referente'];

// ============================================================
// PAGE: ADMIN USERS
// ============================================================
async function renderAdminUsers() {
  renderLayout('Gestione Utenti', '<div class="loading"><div class="spinner"></div></div>');
  const users = await api('/admin/users');
  if (!users) return;

  $('#page-content').innerHTML = `
    <div class="mb-2"><button class="btn btn-primary" onclick="showCreateUserModal()">➕ Nuovo utente</button></div>
    <div class="table-container"><table>
      <tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Organizzazione</th><th>Attivo</th><th>Ultimo accesso</th><th>Azioni</th></tr>
      ${users.map(u => `<tr>
        <td>${sanitize(u.first_name)} ${sanitize(u.last_name)}</td>
        <td>${u.email}</td>
        <td><span class="badge badge-info">${ROLE_LABELS[u.role] || u.role}</span></td>
        <td>${u.organization_name ? sanitize(u.organization_name) : '<span style="color:#999">—</span>'}</td>
        <td>${u.is_active ? '✅' : '❌'}</td>
        <td>${formatDate(u.last_login)}</td>
        <td><div style="display:flex;gap:4px;flex-wrap:nowrap">
          <button class="btn btn-secondary btn-sm" onclick="showEditUserModal('${u.id}','${sanitize(u.first_name)}','${sanitize(u.last_name)}','${u.email}','${u.role}','${u.phone||''}',${u.is_active})">✏️</button>
          <button class="btn btn-secondary btn-sm" onclick="showResetPasswordModal('${u.id}','${u.email}')">🔑</button>
          <button class="btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}" onclick="toggleUserActive('${u.id}',${u.is_active ? 0 : 1})">${u.is_active ? '🔒' : '🔓'}</button>
        </div></td>
      </tr>`).join('')}
    </table></div>
  `;
}

const PHONE_PREFIXES = [
  { code: '+39', country: '🇮🇹 Italia', default: true },
  { code: '+41', country: '🇨🇭 Svizzera' },
  { code: '+43', country: '🇦🇹 Austria' },
  { code: '+33', country: '🇫🇷 Francia' },
  { code: '+49', country: '🇩🇪 Germania' },
  { code: '+34', country: '🇪🇸 Spagna' },
  { code: '+44', country: '🇬🇧 Regno Unito' },
  { code: '+1', country: '🇺🇸 USA/Canada' },
  { code: '+32', country: '🇧🇪 Belgio' },
  { code: '+31', country: '🇳🇱 Paesi Bassi' },
  { code: '+351', country: '🇵🇹 Portogallo' },
  { code: '+40', country: '🇷🇴 Romania' },
  { code: '+48', country: '🇵🇱 Polonia' },
  { code: '+30', country: '🇬🇷 Grecia' },
  { code: '+385', country: '🇭🇷 Croazia' },
  { code: '+386', country: '🇸🇮 Slovenia' },
];

function phoneInputHtml(id, value = '') {
  // Separa prefisso dal numero se presente
  let prefix = '+39', number = value;
  if (value) {
    const match = value.match(/^(\+\d{1,3})\s*(.*)$/);
    if (match) { prefix = match[1]; number = match[2]; }
  }
  const inputStyle = 'padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px';
  return `
    <div style="display:flex;gap:8px">
      <select id="${id}-prefix" style="width:130px;${inputStyle}">
        ${PHONE_PREFIXES.map(p => `<option value="${p.code}" ${p.code===prefix?'selected':''}>${p.country} (${p.code})</option>`).join('')}
      </select>
      <input type="tel" id="${id}" value="${number}" placeholder="333 1234567" style="flex:1;${inputStyle}" oninput="this.value=this.value.replace(/[^0-9\\s]/g,'')">
    </div>`;
}

function getPhoneValue(id) {
  const prefix = document.querySelector(`#${id}-prefix`)?.value || '+39';
  const number = document.querySelector(`#${id}`)?.value.trim();
  return number ? `${prefix} ${number}` : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function showCreateUserModal() {
  const inputStyle = 'width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px';
  const orgs = await api('/admin/organizations-list') || [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:480px;text-align:left">
      <div style="text-align:center"><div class="confirm-modal-icon">👤</div>
      <h3 class="confirm-modal-title">Nuovo utente</h3></div>
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group"><label>Nome *</label><input type="text" id="mu-fn" style="${inputStyle}"></div>
        <div class="form-group"><label>Cognome *</label><input type="text" id="mu-ln" style="${inputStyle}"></div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label>Email *</label>
        <input type="email" id="mu-email" placeholder="nome@esempio.it" style="${inputStyle}">
        <small id="mu-email-err" style="color:#d32f2f;font-size:12px;display:none">Inserisci un indirizzo email valido</small>
      </div>
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group"><label>Password *</label><input type="password" id="mu-pw" placeholder="Minimo 8 caratteri" style="${inputStyle}"></div>
        <div class="form-group"><label>Conferma password *</label><input type="password" id="mu-pw2" placeholder="Ripeti la password" style="${inputStyle}"></div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label>Telefono</label>
        ${phoneInputHtml('mu-phone')}
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Ruolo *</label>
        <select id="mu-role" style="${inputStyle}">
          ${ROLE_OPTIONS.map(r => `<option value="${r}">${ROLE_LABELS[r]}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="mu-org-group" style="margin-bottom:20px;display:none">
        <label>Organizzazione</label>
        <select id="mu-org" style="${inputStyle}">
          <option value="">— Nessuna —</option>
          ${orgs.map(o => `<option value="${o.id}">${sanitize(o.name)} ${o.admin_user_id ? '(già assegnata)' : ''}</option>`).join('')}
        </select>
        <small style="color:#666;font-size:12px">Associa l'utente a un'organizzazione</small>
      </div>
      <div class="confirm-modal-actions" style="justify-content:flex-end">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Crea utente</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  // Mostra/nascondi dropdown organizzazione in base al ruolo
  const roleSelect = overlay.querySelector('#mu-role');
  const orgGroup = overlay.querySelector('#mu-org-group');
  roleSelect.addEventListener('change', () => {
    orgGroup.style.display = ['org_admin','org_operator'].includes(roleSelect.value) ? 'block' : 'none';
  });

  // Validazione email in tempo reale
  const emailInput = overlay.querySelector('#mu-email');
  const emailErr = overlay.querySelector('#mu-email-err');
  emailInput.addEventListener('blur', () => {
    const v = emailInput.value.trim();
    if (v && !isValidEmail(v)) { emailErr.style.display = 'block'; emailInput.style.borderColor = '#d32f2f'; }
    else { emailErr.style.display = 'none'; emailInput.style.borderColor = '#ddd'; }
  });
  emailInput.addEventListener('input', () => { emailErr.style.display = 'none'; emailInput.style.borderColor = '#ddd'; });

  // Password match check in tempo reale
  const muPw = overlay.querySelector('#mu-pw');
  const muPw2 = overlay.querySelector('#mu-pw2');
  function checkMuPwMatch() {
    if (!muPw2.value) { muPw2.style.borderColor = '#ddd'; return; }
    if (muPw.value !== muPw2.value) { muPw2.style.borderColor = '#d32f2f'; }
    else { muPw2.style.borderColor = '#4CAF50'; }
  }
  muPw2.addEventListener('blur', checkMuPwMatch);
  muPw2.addEventListener('input', checkMuPwMatch);
  muPw.addEventListener('input', () => { if (muPw2.value) checkMuPwMatch(); });

  overlay.querySelector('#modal-cancel').onclick = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); };
  overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); } };
  overlay.querySelector('#modal-confirm').onclick = async () => {
    const fn = overlay.querySelector('#mu-fn').value.trim();
    const ln = overlay.querySelector('#mu-ln').value.trim();
    const email = overlay.querySelector('#mu-email').value.trim();
    const pw = overlay.querySelector('#mu-pw').value;
    const pw2 = overlay.querySelector('#mu-pw2').value;
    const phone = getPhoneValue('mu-phone');
    const role = overlay.querySelector('#mu-role').value;
    const organizationId = overlay.querySelector('#mu-org').value || null;
    if (!fn || !ln || !email || !pw) { toast('Compila tutti i campi obbligatori', 'error'); return; }
    if (!isValidEmail(email)) { toast('Inserisci un indirizzo email valido', 'error'); emailErr.style.display = 'block'; emailInput.style.borderColor = '#d32f2f'; return; }
    if (pw.length < 8) { toast('La password deve avere almeno 8 caratteri', 'error'); return; }
    if (pw !== pw2) { toast('Le password non coincidono', 'error'); return; }
    overlay.remove();
    const result = await api('/admin/users', { method: 'POST', body: JSON.stringify({ firstName: fn, lastName: ln, email, password: pw, phone, role, organizationId }) });
    if (result) { toast('Utente creato!', 'success'); renderAdminUsers(); }
  };
}

async function showEditUserModal(id, fn, ln, email, role, phone, isActive) {
  const inputStyle = 'width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px';
  const orgs = await api('/admin/organizations-list') || [];
  const users = await api('/admin/users') || [];
  const currentUser = users.find(u => u.id === id);
  const currentOrgId = currentUser?.organization_id || '';
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:480px;text-align:left">
      <div style="text-align:center"><div class="confirm-modal-icon">✏️</div>
      <h3 class="confirm-modal-title">Modifica utente</h3>
      <p class="confirm-modal-text">${email}</p></div>
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group"><label>Nome</label><input type="text" id="mu-fn" value="${fn}" style="${inputStyle}"></div>
        <div class="form-group"><label>Cognome</label><input type="text" id="mu-ln" value="${ln}" style="${inputStyle}"></div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label>Telefono</label>
        ${phoneInputHtml('mu-phone', phone)}
      </div>
      <div class="form-group" style="margin-bottom:12px"><label>Ruolo</label>
        <select id="mu-role" style="${inputStyle}">
          ${ROLE_OPTIONS.map(r => `<option value="${r}" ${r===role?'selected':''}>${ROLE_LABELS[r]}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="mu-org-group" style="margin-bottom:20px;${['org_admin','org_operator'].includes(role) ? '' : 'display:none'}">
        <label>Organizzazione</label>
        <select id="mu-org" style="${inputStyle}">
          <option value="">— Nessuna —</option>
          ${orgs.map(o => `<option value="${o.id}" ${o.id===currentOrgId?'selected':''}>${sanitize(o.name)} ${o.admin_user_id && o.admin_user_id !== id ? '(già assegnata)' : ''}</option>`).join('')}
        </select>
      </div>
      <div class="confirm-modal-actions" style="justify-content:flex-end">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Salva</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  const roleSelect = overlay.querySelector('#mu-role');
  const orgGroup = overlay.querySelector('#mu-org-group');
  roleSelect.addEventListener('change', () => {
    orgGroup.style.display = ['org_admin','org_operator'].includes(roleSelect.value) ? 'block' : 'none';
  });

  overlay.querySelector('#modal-cancel').onclick = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); };
  overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); } };
  overlay.querySelector('#modal-confirm').onclick = async () => {
    const newRole = overlay.querySelector('#mu-role').value;
    const body = {
      firstName: overlay.querySelector('#mu-fn').value.trim(),
      lastName: overlay.querySelector('#mu-ln').value.trim(),
      phone: getPhoneValue('mu-phone'),
      role: newRole,
      organizationId: ['org_admin','org_operator'].includes(newRole) ? (overlay.querySelector('#mu-org').value || null) : null
    };
    overlay.remove();
    const result = await api(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (result) { toast('Utente aggiornato!', 'success'); renderAdminUsers(); }
  };
}

async function toggleUserActive(id, newState) {
  const action = newState ? 'attivare' : 'disattivare';
  showConfirmModal(`${newState ? 'Attivare' : 'Disattivare'} utente?`, `Sei sicuro di voler ${action} questo utente?`, async () => {
    const result = await api(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ isActive: newState }) });
    if (result) { toast(`Utente ${newState ? 'attivato' : 'disattivato'}!`, 'success'); renderAdminUsers(); }
  });
}

function showResetPasswordModal(id, email) {
  const inputStyle = 'width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" style="max-width:400px;text-align:left">
      <div style="text-align:center"><div class="confirm-modal-icon">🔑</div>
      <h3 class="confirm-modal-title">Reset password</h3>
      <p class="confirm-modal-text">${email}</p></div>
      <div class="form-group" style="margin-bottom:12px">
        <label>Nuova password *</label>
        <div style="position:relative">
          <input type="password" id="rp-pw" placeholder="Minimo 8 caratteri" style="${inputStyle}">
          <button type="button" class="btn-eye" onclick="togglePw('rp-pw',this)">👁</button>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:20px">
        <label>Conferma password *</label>
        <div style="position:relative">
          <input type="password" id="rp-pw2" placeholder="Ripeti la password" style="${inputStyle}">
          <button type="button" class="btn-eye" onclick="togglePw('rp-pw2',this)">👁</button>
        </div>
      </div>
      <div class="confirm-modal-actions" style="justify-content:flex-end">
        <button class="btn btn-secondary" id="modal-cancel">Annulla</button>
        <button class="btn btn-primary" id="modal-confirm">Reimposta</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  overlay.querySelector('#modal-cancel').onclick = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); };
  overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 200); } };

  // Password match check in tempo reale
  const rpPw = overlay.querySelector('#rp-pw');
  const rpPw2 = overlay.querySelector('#rp-pw2');
  function checkRpPwMatch() {
    if (!rpPw2.value) { rpPw2.style.borderColor = '#ddd'; return; }
    if (rpPw.value !== rpPw2.value) { rpPw2.style.borderColor = '#d32f2f'; }
    else { rpPw2.style.borderColor = '#4CAF50'; }
  }
  rpPw2.addEventListener('blur', checkRpPwMatch);
  rpPw2.addEventListener('input', checkRpPwMatch);
  rpPw.addEventListener('input', () => { if (rpPw2.value) checkRpPwMatch(); });

  overlay.querySelector('#modal-confirm').onclick = async () => {
    const pw = overlay.querySelector('#rp-pw').value;
    const pw2 = overlay.querySelector('#rp-pw2').value;
    if (!pw) { toast('Inserisci la nuova password', 'error'); return; }
    if (pw.length < 8) { toast('La password deve avere almeno 8 caratteri', 'error'); return; }
    if (pw !== pw2) { toast('Le password non coincidono', 'error'); return; }
    overlay.remove();
    const result = await api(`/admin/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password: pw }) });
    if (result) { toast('Password reimpostata!', 'success'); }
  };
}

// ============================================================
// PAGE: PROFILE
// ============================================================
async function renderProfile() {
  const u = state.user;
  renderLayout('Il mio profilo', `
    <div class="card" style="max-width:600px">
      <div class="card-header"><h3>Dati personali</h3></div>
      <div class="card-body">
        <form id="profile-form">
          <div class="form-row">
            <div class="form-group"><label>Nome</label><input id="prof-fn" value="${sanitize(u.first_name||u.firstName)}"></div>
            <div class="form-group"><label>Cognome</label><input id="prof-ln" value="${sanitize(u.last_name||u.lastName)}"></div>
          </div>
          <div class="form-group"><label>Email</label><input value="${u.email}" disabled></div>
          <div class="form-group"><label>Telefono</label><input id="prof-phone" value="${u.phone||''}"></div>
          <div class="form-group"><label>Ruolo</label><input value="${u.role}" disabled></div>
          <button type="submit" class="btn btn-primary">Salva modifiche</button>
        </form>
      </div>
    </div>
    <div class="card mt-2" style="max-width:600px">
      <div class="card-header"><h3>Cambia password</h3></div>
      <div class="card-body">
        <form id="pw-form">
          <div class="form-group">
            <label>Password attuale</label>
            <div style="position:relative">
              <input type="password" id="pw-current">
              <button type="button" class="btn-eye" onclick="togglePw('pw-current',this)" title="Mostra/nascondi">👁</button>
            </div>
          </div>
          <div class="form-group">
            <label>Nuova password (min 8 caratteri)</label>
            <div style="position:relative">
              <input type="password" id="pw-new">
              <button type="button" class="btn-eye" onclick="togglePw('pw-new',this)" title="Mostra/nascondi">👁</button>
            </div>
          </div>
          <div class="form-group">
            <label>Conferma nuova password</label>
            <div style="position:relative">
              <input type="password" id="pw-confirm">
              <button type="button" class="btn-eye" onclick="togglePw('pw-confirm',this)" title="Mostra/nascondi">👁</button>
            </div>
          </div>
          <div id="pw-error" class="alert alert-danger hidden"></div>
          <button type="submit" class="btn btn-warning">Aggiorna password</button>
        </form>
      </div>
    </div>
  `);

  $('#profile-form').onsubmit = async (e) => {
    e.preventDefault();
    const result = await api('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ firstName: $('#prof-fn').value, lastName: $('#prof-ln').value, phone: $('#prof-phone').value })
    });
    if (result) toast('Profilo aggiornato', 'success');
  };

  // Password match check in tempo reale (profilo)
  const profPwNew = $('#pw-new');
  const profPwConf = $('#pw-confirm');
  if (profPwNew && profPwConf) {
    function checkProfPwMatch() {
      if (!profPwConf.value) { profPwConf.style.borderColor = ''; return; }
      if (profPwNew.value !== profPwConf.value) { profPwConf.style.borderColor = '#d32f2f'; }
      else { profPwConf.style.borderColor = '#4CAF50'; }
    }
    profPwConf.addEventListener('blur', checkProfPwMatch);
    profPwConf.addEventListener('input', checkProfPwMatch);
    profPwNew.addEventListener('input', () => { if (profPwConf.value) checkProfPwMatch(); });
  }

  $('#pw-form').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = $('#pw-error');
    const currentPw = $('#pw-current').value;
    const newPw = $('#pw-new').value;
    const confirmPw = $('#pw-confirm').value;
    
    if (!currentPw) {
      errEl.textContent = 'Inserisci la password attuale';
      errEl.classList.remove('hidden');
      return;
    }
    if (newPw.length < 8) {
      errEl.textContent = 'La nuova password deve avere almeno 8 caratteri';
      errEl.classList.remove('hidden');
      return;
    }
    if (newPw !== confirmPw) {
      errEl.textContent = 'Le password non coincidono';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    
    const result = await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
    });
    if (result) { toast('Password aggiornata', 'success'); $('#pw-form').reset(); }
  };
}

// ============================================================
// INIT
// ============================================================
router();
