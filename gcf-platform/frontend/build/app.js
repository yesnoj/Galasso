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
  overlay.querySelector('#modal-confirm').onclick = () => {
    overlay.remove();
    onConfirm();
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
    case 'certifications': return renderCertifications();
    case 'certification-detail': return renderCertificationDetail(params);
    case 'audits': return renderAudits();
    case 'audit-detail': return renderAuditDetail(params);
    case 'audit-checklist': return renderAuditChecklist(params);
    case 'beneficiaries': return renderBeneficiaries();
    case 'activities': return renderActivities();
    case 'admin': return renderAdmin();
    case 'admin-users': return renderAdminUsers();
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
          <div class="form-group"><label>Email</label><input type="email" id="reg-email" required></div>
          <div class="form-group"><label>Password (min 8 caratteri)</label><input type="password" id="reg-pw" required minlength="8"></div>
          <div class="form-group"><label>Telefono</label><input id="reg-phone"></div>
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
  $('#reg-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: $('#reg-fn').value, lastName: $('#reg-ln').value,
        email: $('#reg-email').value, password: $('#reg-pw').value,
        phone: $('#reg-phone').value, role: $('#reg-role').value
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
        <div class="stat-card"><div class="stat-icon">🏠</div><div class="stat-value">${stats.organizations.total}</div><div class="stat-label">Organizzazioni</div></div>
        <div class="stat-card"><div class="stat-icon">📜</div><div class="stat-value">${stats.certifications.total}</div><div class="stat-label">Certificazioni</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${stats.audits.completed}</div><div class="stat-label">Audit completati</div></div>
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${stats.beneficiaries.active}</div><div class="stat-label">Beneficiari attivi</div></div>
        <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${stats.activities.total}</div><div class="stat-label">Attività registrate</div></div>
        <div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-value">${Math.round(stats.activities.totalHours)}</div><div class="stat-label">Ore totali</div></div>
        <div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-value">${stats.correctiveActions.open}</div><div class="stat-label">Azioni correttive aperte</div></div>
        <div class="stat-card"><div class="stat-icon">👤</div><div class="stat-value">${stats.users.total}</div><div class="stat-label">Utenti registrati</div></div>
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
  renderLayout('Organizzazioni', '<div class="loading"><div class="spinner"></div></div>',
    `<button class="btn btn-primary btn-sm" onclick="navigate('organization-edit','new')">+ Nuova</button>`);

  const data = await api('/organizations');
  if (!data) return;

  const orgs = data.data || data;
  $('#page-content').innerHTML = orgs.length === 0 ? `
    <div class="empty-state"><div class="icon">🏠</div><h3>Nessuna organizzazione</h3>
    <p>Crea la tua organizzazione per iniziare</p>
    <button class="btn btn-primary mt-2" onclick="navigate('organization-edit','new')">+ Crea organizzazione</button></div>
  ` : `
    <div class="table-container"><table>
      <tr><th>Nome</th><th>Forma giuridica</th><th>Città</th><th>Stato</th><th></th></tr>
      ${orgs.map(o => `<tr>
        <td><strong>${sanitize(o.name)}</strong></td>
        <td>${LEGAL_FORMS[o.legal_form] || o.legal_form}</td>
        <td>${sanitize(o.city)} (${o.province})</td>
        <td>${badge(o.status)}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="navigate('organization-edit','${o.id}')">Modifica</button></td>
      </tr>`).join('')}
    </table></div>
  `;
}

// ============================================================
// PAGE: ORGANIZATION EDIT
// ============================================================
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
          <div class="form-group"><label>Telefono</label><input id="org-phone" value="${org?.phone||''}"></div>
        </div>
        <div class="form-group"><label>Indirizzo *</label><input id="org-addr" value="${sanitize(org?.address||'')}" required></div>
        <div class="form-row-3">
          <div class="form-group"><label>Città *</label><input id="org-city" value="${sanitize(org?.city||'')}" required></div>
          <div class="form-group"><label>Provincia *</label><input id="org-prov" value="${org?.province||''}" required maxlength="2"></div>
          <div class="form-group"><label>Regione *</label><input id="org-reg" value="${sanitize(org?.region||'')}" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Email</label><input type="email" id="org-email" value="${org?.email||''}"></div>
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

  $('#org-form').onsubmit = async (e) => {
    e.preventDefault();
    const body = {
      name: $('#org-name').value, legalForm: $('#org-legal').value,
      taxCode: $('#org-tax').value, vatNumber: $('#org-vat').value,
      address: $('#org-addr').value, city: $('#org-city').value,
      province: $('#org-prov').value, region: $('#org-reg').value,
      phone: $('#org-phone').value, email: $('#org-email').value,
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

// ============================================================
// PAGE: CERTIFICATIONS
// ============================================================
async function renderCertifications() {
  renderLayout('Certificazioni', '<div class="loading"><div class="spinner"></div></div>');
  const certs = await api('/certifications');
  if (!certs) return;

  const isAdmin = state.user.role === 'admin';

  $('#page-content').innerHTML = certs.length === 0 ? `
    <div class="empty-state"><div class="icon">📜</div><h3>Nessuna certificazione</h3>
    <p>Per fare domanda, prima registra la tua organizzazione.</p></div>
  ` : `
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
      </div>
    </div>
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
        <tr><th>Codice</th><th>Organizzazione</th><th>Tipologia</th><th>Stato</th><th>Ente inviante</th><th>Attività</th><th>Ultima attività</th></tr>
        ${bens.map(b => `<tr>
          <td><strong>${sanitize(b.code)}</strong></td>
          <td>${sanitize(b.org_name)}</td>
          <td>${TARGET_LABELS[b.target_type] || b.target_type || '—'}</td>
          <td>${badge(b.status)}</td>
          <td>${sanitize(b.referring_entity) || '—'}</td>
          <td>${b.activity_count || 0}</td>
          <td>${formatDate(b.last_activity)}</td>
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
        <tr><th>Data</th><th>Organizzazione</th><th>Beneficiario</th><th>Servizio</th><th>Durata</th><th>Descrizione</th></tr>
        ${activities.map(a => `<tr>
          <td>${formatDate(a.activity_date)}</td>
          <td>${sanitize(a.org_name)}</td>
          <td>${sanitize(a.beneficiary_code) || 'Gruppo'}</td>
          <td>${SERVICE_LABELS[a.service_type] || a.service_type || '—'}</td>
          <td>${a.duration_minutes ? a.duration_minutes + ' min' : '—'}</td>
          <td>${sanitize(a.description)}</td>
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
              <div class="form-group"><label>Durata (minuti)</label><input type="number" id="act-dur" placeholder="120"></div>
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
        serviceType: $('#act-type').value, durationMinutes: parseInt($('#act-dur').value) || null,
        description: $('#act-desc').value, notes: $('#act-notes').value
      })
    });
    if (result) { toast('Attività registrata!', 'success'); renderActivities(); }
  };
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
      <div class="stat-card"><div class="stat-value">${stats.organizations.total}</div><div class="stat-label">Organizzazioni totali</div></div>
      <div class="stat-card"><div class="stat-value">${stats.certifications.total}</div><div class="stat-label">Certificazioni</div></div>
      <div class="stat-card"><div class="stat-value">${stats.audits.total}</div><div class="stat-label">Audit</div></div>
      <div class="stat-card"><div class="stat-value">${stats.users.total}</div><div class="stat-label">Utenti</div></div>
    </div>
    <div class="form-row">
      <div class="card">
        <div class="card-header"><h3>Organizzazioni per stato</h3></div>
        <div class="card-body">${stats.organizations.byStatus.map(s => `<p>${badge(s.status)} ${s.count}</p>`).join('')}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Utenti per ruolo</h3></div>
        <div class="card-body">${stats.users.byRole.map(r => `<p><strong>${r.role}:</strong> ${r.count}</p>`).join('')}</div>
      </div>
    </div>
  `;
}

// ============================================================
// PAGE: ADMIN USERS
// ============================================================
async function renderAdminUsers() {
  renderLayout('Gestione Utenti', '<div class="loading"><div class="spinner"></div></div>');
  const users = await api('/admin/users');
  if (!users) return;

  $('#page-content').innerHTML = `
    <div class="table-container"><table>
      <tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Attivo</th><th>Ultimo accesso</th><th>Registrato</th></tr>
      ${users.map(u => `<tr>
        <td>${sanitize(u.first_name)} ${sanitize(u.last_name)}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.is_active ? '✅' : '❌'}</td>
        <td>${formatDate(u.last_login)}</td>
        <td>${formatDate(u.created_at)}</td>
      </tr>`).join('')}
    </table></div>
  `;
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
