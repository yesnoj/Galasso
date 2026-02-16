/**
 * Seed script — Popola il database con dati fittizi realistici
 * Eseguire: node seed.js
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Init DB
const { initDb, getDb, saveToFile } = require('./src/utils/database');

async function seed() {
const db_ready = await initDb();
const db = getDb();

// Helper
const hash = (pw) => bcrypt.hashSync(pw, 10);
const id = () => uuidv4();
const date = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};
const datetime = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

console.log('🗑️  Svuotamento database...');

// Svuota tutte le tabelle dati (non le reference tables)
const tables = [
  'system_logs', 'notifications', 'events', 'reviews',
  'monitoring_reports', 'activity_logs', 'individual_projects',
  'corrective_actions', 'audit_evaluations', 'audit_attachments', 'audits',
  'certification_documents', 'certifications',
  'organization_partners', 'organization_images', 'organization_target_users', 'organization_services',
  'beneficiaries', 'organizations', 'refresh_tokens', 'users'
];
tables.forEach(t => { try { db.prepare(`DELETE FROM ${t}`).run(); } catch(e) {} });

console.log('👤 Creazione utenti...');

// ===== USERS =====
const users = {
  admin: { id: id(), email: 'admin@gcf.it', pw: 'admin123', role: 'admin', fn: 'Marco', ln: 'Rossi', phone: '+39 333 1234567' },
  auditor1: { id: id(), email: 'luca.bianchi@gcf.it', pw: 'auditor123', role: 'auditor', fn: 'Luca', ln: 'Bianchi', phone: '+39 347 2345678' },
  auditor2: { id: id(), email: 'anna.moretti@gcf.it', pw: 'auditor123', role: 'auditor', fn: 'Anna', ln: 'Moretti', phone: '+39 340 3456789' },
  org1_admin: { id: id(), email: 'giuseppe.verdi@terrabuona.it', pw: 'org12345', role: 'org_admin', fn: 'Giuseppe', ln: 'Verdi', phone: '+39 348 4567890' },
  org2_admin: { id: id(), email: 'maria.conti@ilvigneto.it', pw: 'org12345', role: 'org_admin', fn: 'Maria', ln: 'Conti', phone: '+39 339 5678901' },
  org3_admin: { id: id(), email: 'paolo.ferrara@camposociale.it', pw: 'org12345', role: 'org_admin', fn: 'Paolo', ln: 'Ferrara', phone: '+39 328 6789012' },
  org4_admin: { id: id(), email: 'elena.russo@fattoriasperanza.it', pw: 'org12345', role: 'org_admin', fn: 'Elena', ln: 'Russo', phone: '+39 335 7890123' },
  org5_admin: { id: id(), email: 'francesco.romano@ortosociale.it', pw: 'org12345', role: 'org_admin', fn: 'Francesco', ln: 'Romano', phone: '+39 346 8901234' },
  operator1: { id: id(), email: 'chiara.esposito@terrabuona.it', pw: 'oper1234', role: 'org_operator', fn: 'Chiara', ln: 'Esposito', phone: '+39 329 9012345' },
  operator2: { id: id(), email: 'davide.colombo@ilvigneto.it', pw: 'oper1234', role: 'org_operator', fn: 'Davide', ln: 'Colombo', phone: '+39 338 0123456' },
  ente1: { id: id(), email: 'silvia.gallo@csmpiacenza.it', pw: 'ente1234', role: 'ente_referente', fn: 'Silvia', ln: 'Gallo', phone: '+39 342 1122334' },
  ente2: { id: id(), email: 'roberto.fontana@csmparma.it', pw: 'ente1234', role: 'ente_referente', fn: 'Roberto', ln: 'Fontana', phone: '+39 337 2233445' },
  public1: { id: id(), email: 'giovanna.marino@gmail.com', pw: 'user1234', role: 'public', fn: 'Giovanna', ln: 'Marino', phone: '+39 345 3344556' },
};

const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`);
Object.values(users).forEach(u => {
  const loginDays = Math.floor(Math.random() * 7);
  insertUser.run(u.id, u.email, hash(u.pw), u.role, u.fn, u.ln, u.phone, datetime(loginDays));
});

console.log('🏠 Creazione organizzazioni...');

// ===== ORGANIZATIONS =====
const orgs = [
  {
    id: id(), name: 'Cooperativa Terra Buona', lf: 'cooperativa_sociale', tc: 'COPTB0001234567',
    vat: '01234567890', addr: 'Via dei Campi 15', city: 'Piacenza', prov: 'PC', region: 'Emilia-Romagna',
    lat: 45.0526, lng: 9.6930, email: 'info@terrabuona.it', web: 'www.terrabuona.it', phone: '+39 0523 456789',
    desc: 'Cooperativa sociale che gestisce attività di agricoltura sociale con focus su percorsi di riabilitazione attraverso la coltivazione di orti e la cura di piante aromatiche.',
    mgr: 'Giuseppe Verdi', mgrRole: 'Coordinatore servizi sociali', status: 'active', admin: 'org1_admin'
  },
  {
    id: id(), name: 'Fattoria Sociale Il Vigneto', lf: 'azienda_agricola', tc: 'FTVILV987654321',
    vat: '09876543210', addr: 'Strada Provinciale 28', city: 'Parma', prov: 'PR', region: 'Emilia-Romagna',
    lat: 44.8015, lng: 10.3279, email: 'info@ilvigneto.it', web: 'www.ilvigneto.it', phone: '+39 0521 234567',
    desc: 'Azienda agricola con vigneto biologico che offre percorsi di inserimento lavorativo e coterapia con animali per persone con disabilità e disagio psichico.',
    mgr: 'Maria Conti', mgrRole: 'Responsabile attività sociali', status: 'active', admin: 'org2_admin'
  },
  {
    id: id(), name: 'Associazione Campo Sociale', lf: 'associazione', tc: 'ASSCSO112233445',
    vat: '11223344556', addr: 'Via della Resistenza 42', city: 'Modena', prov: 'MO', region: 'Emilia-Romagna',
    lat: 44.6471, lng: 10.9252, email: 'info@camposociale.it', web: 'www.camposociale.it', phone: '+39 059 345678',
    desc: 'Associazione che promuove attività educative e socio-ricreative in ambiente agricolo per minori, giovani e famiglie in situazione di disagio.',
    mgr: 'Paolo Ferrara', mgrRole: 'Presidente', status: 'active', admin: 'org3_admin'
  },
  {
    id: id(), name: 'Fattoria della Speranza', lf: 'cooperativa_sociale', tc: 'FTSPE556677889',
    vat: '55667788990', addr: 'Località Poggio Alto 3', city: 'Reggio Emilia', prov: 'RE', region: 'Emilia-Romagna',
    lat: 44.6989, lng: 10.6297, email: 'info@fattoriasperanza.it', web: 'www.fattoriasperanza.it', phone: '+39 0522 567890',
    desc: 'Cooperativa sociale specializzata in percorsi terapeutici con animali e inserimento lavorativo di persone con dipendenze e detenuti in misura alternativa.',
    mgr: 'Elena Russo', mgrRole: 'Direttrice', status: 'pending', admin: 'org4_admin'
  },
  {
    id: id(), name: 'Orto Sociale Bologna', lf: 'cooperativa_sociale', tc: 'ORTSBO998877665',
    vat: '99887766554', addr: 'Via San Donato 108', city: 'Bologna', prov: 'BO', region: 'Emilia-Romagna',
    lat: 44.4949, lng: 11.3426, email: 'info@ortosociale.it', web: 'www.ortosociale.it', phone: '+39 051 678901',
    desc: 'Cooperativa che gestisce orti urbani terapeutici per persone con problemi di salute mentale e anziani fragili. Progetti di orticoltura sociale e formazione.',
    mgr: 'Francesco Romano', mgrRole: 'Responsabile area sociale', status: 'pending', admin: 'org5_admin'
  }
];

const insertOrg = db.prepare(`INSERT INTO organizations (id, name, legal_form, tax_code, vat_number, address, city, province, region, latitude, longitude, email, website, phone, description, social_manager_name, social_manager_role, status, admin_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
orgs.forEach(o => {
  insertOrg.run(o.id, o.name, o.lf, o.tc, o.vat, o.addr, o.city, o.prov, o.region, o.lat, o.lng, o.email, o.web, o.phone, o.desc, o.mgr, o.mgrRole, o.status, users[o.admin].id, datetime(90 + Math.floor(Math.random() * 60)));
});

console.log('🏷️  Servizi e target utenza...');

// ===== SERVICES & TARGETS =====
const insertSvc = db.prepare('INSERT INTO organization_services (id, organization_id, service_type, description) VALUES (?, ?, ?, ?)');
const insertTgt = db.prepare('INSERT INTO organization_target_users (id, organization_id, target_type, notes) VALUES (?, ?, ?, ?)');

// Org 1 — Terra Buona
[['coterapia_piante', 'Orto terapeutico e coltivazione erbe aromatiche'], ['inserimento_lavorativo', 'Tirocini formativi in agricoltura'], ['socio_ricreativa', 'Laboratori settimanali di giardinaggio']].forEach(([t, d]) => insertSvc.run(id(), orgs[0].id, t, d));
[['salute_mentale', 'Percorsi riabilitativi CSM'], ['disabili', 'Disabilità cognitive lievi e moderate'], ['anziani', 'Anziani fragili']].forEach(([t, n]) => insertTgt.run(id(), orgs[0].id, t, n));

// Org 2 — Il Vigneto
[['coterapia_animali', 'Attività con cavalli, asini e conigli'], ['inserimento_lavorativo', 'Inserimento in vigna e cantina biologica'], ['formazione', 'Corsi di viticoltura sociale']].forEach(([t, d]) => insertSvc.run(id(), orgs[1].id, t, d));
[['disabili', 'Disabilità fisiche e cognitive'], ['dipendenze', 'Percorsi in collaborazione con SerD'], ['salute_mentale', 'Utenti CSM']].forEach(([t, n]) => insertTgt.run(id(), orgs[1].id, t, n));

// Org 3 — Campo Sociale
[['educativa', 'Doposcuola in fattoria'], ['socio_ricreativa', 'Campus estivi e weekend'], ['coterapia_piante', 'Orti didattici']].forEach(([t, d]) => insertSvc.run(id(), orgs[2].id, t, d));
[['minori', 'Bambini e adolescenti 6-17 anni'], ['giovani', 'NEET e giovani in difficoltà'], ['immigrati', 'Famiglie straniere in percorso di integrazione']].forEach(([t, n]) => insertTgt.run(id(), orgs[2].id, t, n));

// Org 4 — Fattoria della Speranza
[['coterapia_animali', 'Pet therapy con cani e cavalli'], ['inserimento_lavorativo', 'Percorsi per detenuti in art. 21'], ['socio_ricreativa', 'Attività agricole di gruppo']].forEach(([t, d]) => insertSvc.run(id(), orgs[3].id, t, d));
[['dipendenze', 'Tossicodipendenze e alcol'], ['detenuti', 'Detenuti in misura alternativa'], ['disagio_adulti', 'Adulti senza fissa dimora']].forEach(([t, n]) => insertTgt.run(id(), orgs[3].id, t, n));

// Org 5 — Orto Sociale Bologna
[['coterapia_piante', 'Orti terapeutici urbani'], ['formazione', 'Formazione orticoltura per operatori'], ['socio_ricreativa', 'Attività in giardino condiviso']].forEach(([t, d]) => insertSvc.run(id(), orgs[4].id, t, d));
[['salute_mentale', 'Percorsi DSM Bologna'], ['anziani', 'Anziani in RSA e centri diurni'], ['disagio_adulti', 'Adulti con grave disagio socio-economico']].forEach(([t, n]) => insertTgt.run(id(), orgs[4].id, t, n));

console.log('📜 Creazione certificazioni...');

// ===== CERTIFICATIONS =====
const insertCert = db.prepare(`INSERT INTO certifications (id, organization_id, cert_number, status, application_date, doc_review_date, doc_reviewer_id, issue_date, expiry_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const certs = [
  { id: id(), orgIdx: 0, num: 'GCF-2025-001', status: 'issued', appDate: date(180), reviewDate: date(170), issueDate: date(120), expiryDate: date(-975), notes: 'Certificazione rilasciata dopo audit positivo' },
  { id: id(), orgIdx: 1, num: 'GCF-2025-002', status: 'issued', appDate: date(150), reviewDate: date(140), issueDate: date(90), expiryDate: date(-1005), notes: 'Eccellente conformità riscontrata' },
  { id: id(), orgIdx: 2, num: 'GCF-2026-003', status: 'audit_completed', appDate: date(60), reviewDate: date(50), issueDate: null, expiryDate: null, notes: 'In attesa di decisione finale dopo audit' },
  { id: id(), orgIdx: 3, num: null, status: 'submitted', appDate: date(10), reviewDate: null, issueDate: null, expiryDate: null, notes: 'Domanda appena inviata' },
  { id: id(), orgIdx: 4, num: null, status: 'doc_review', appDate: date(20), reviewDate: date(5), issueDate: null, expiryDate: null, notes: 'Documenti in fase di revisione' },
];

certs.forEach(c => {
  insertCert.run(c.id, orgs[c.orgIdx].id, c.num, c.status, c.appDate, c.reviewDate, c.reviewDate ? users.admin.id : null, c.issueDate, c.expiryDate, c.notes, datetime(c.appDate ? 180 : 10));
});

console.log('✅ Creazione audit...');

// ===== AUDITS =====
const insertAudit = db.prepare(`INSERT INTO audits (id, certification_id, auditor_id, audit_type, audit_mode, scheduled_date, completed_date, status, total_conforming, total_partially, total_non_conforming, total_not_applicable, outcome, auditor_notes, org_representative_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const audits = [
  { id: id(), certIdx: 0, auditor: 'auditor1', type: 'initial', sched: date(130), compl: date(125), status: 'completed', c: 9, pc: 1, nc: 0, na: 0, outcome: 'conforming_with_actions', notes: 'Buona organizzazione. Requisito 2.3 parzialmente conforme: politica inclusione da formalizzare.', rep: 'Giuseppe Verdi' },
  { id: id(), certIdx: 1, auditor: 'auditor2', type: 'initial', sched: date(100), compl: date(95), status: 'completed', c: 10, pc: 0, nc: 0, na: 0, outcome: 'conforming', notes: 'Piena conformità. Struttura molto ben organizzata con documentazione completa.', rep: 'Maria Conti' },
  { id: id(), certIdx: 2, auditor: 'auditor1', type: 'initial', sched: date(40), compl: date(35), status: 'completed', c: 8, pc: 2, nc: 0, na: 0, outcome: 'conforming_with_actions', notes: 'Requisiti 3.2 e 4.2 parzialmente conformi. Procedure di tutela e organigramma da completare.', rep: 'Paolo Ferrara' },
  { id: id(), certIdx: 0, auditor: 'auditor2', type: 'surveillance', sched: date(5), compl: null, status: 'planned', c: 0, pc: 0, nc: 0, na: 0, outcome: null, notes: null, rep: null },
  { id: id(), certIdx: 1, auditor: 'auditor1', type: 'surveillance', sched: date(-30), compl: null, status: 'planned', c: 0, pc: 0, nc: 0, na: 0, outcome: null, notes: null, rep: null },
];

audits.forEach(a => {
  insertAudit.run(a.id, certs[a.certIdx].id, users[a.auditor].id, a.type, 'on_site', a.sched, a.compl, a.status, a.c, a.pc, a.nc, a.na, a.outcome, a.notes, a.rep, datetime(130));
});

// Audit evaluations for completed audits
console.log('📋 Creazione valutazioni audit...');

const insertEval = db.prepare(`INSERT INTO audit_evaluations (id, audit_id, requirement_id, area_number, requirement_number, evaluation, evidences_checked, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

// Get requirement IDs
const requirements = db.prepare('SELECT * FROM certification_requirements ORDER BY sort_order').all();

// Audit 1 (Terra Buona) — 9C + 1PC
const eval1Map = { '2.3': 'PC' }; // Politica inclusione parziale
requirements.forEach(r => {
  const ev = eval1Map[r.requirement_number] || 'C';
  const evidences = ev === 'C' ? 'Documentazione verificata, conforme' : 'Documentazione parziale, necessita integrazione';
  insertEval.run(id(), audits[0].id, r.id, r.area_id.replace('area-', ''), r.requirement_number, ev, evidences, ev === 'PC' ? 'Politica di inclusione presente ma non formalizzata in documento ufficiale' : '');
});

// Audit 2 (Il Vigneto) — 10C
requirements.forEach(r => {
  insertEval.run(id(), audits[1].id, r.id, r.area_id.replace('area-', ''), r.requirement_number, 'C', 'Documentazione completa e conforme', '');
});

// Audit 3 (Campo Sociale) — 8C + 2PC
const eval3Map = { '3.2': 'PC', '4.2': 'PC' };
requirements.forEach(r => {
  const ev = eval3Map[r.requirement_number] || 'C';
  const notes3 = { '3.2': 'Procedure di tutela esistenti ma da aggiornare', '4.2': 'Organigramma incompleto, mancano ruoli operativi' };
  insertEval.run(id(), audits[2].id, r.id, r.area_id.replace('area-', ''), r.requirement_number, ev, ev === 'C' ? 'Verificato e conforme' : 'Documentazione da integrare', notes3[r.requirement_number] || '');
});

console.log('👥 Creazione beneficiari...');

// ===== BENEFICIARIES =====
const insertBen = db.prepare(`INSERT INTO beneficiaries (id, organization_id, code, target_type, referring_entity, referring_contact, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const beneficiaries = [
  // Terra Buona (org 0)
  { id: id(), orgIdx: 0, code: 'BEN-2025-001', tt: 'salute_mentale', ent: 'CSM Piacenza', contact: 'Dott.ssa Gallo', status: 'active' },
  { id: id(), orgIdx: 0, code: 'BEN-2025-002', tt: 'salute_mentale', ent: 'CSM Piacenza', contact: 'Dott. Neri', status: 'active' },
  { id: id(), orgIdx: 0, code: 'BEN-2025-003', tt: 'disabili', ent: 'Servizi Sociali Piacenza', contact: 'Dott.ssa Bruni', status: 'active' },
  { id: id(), orgIdx: 0, code: 'BEN-2025-004', tt: 'anziani', ent: 'ASP Piacenza', contact: 'Sig.ra Pozzi', status: 'completed' },
  // Il Vigneto (org 1)
  { id: id(), orgIdx: 1, code: 'BEN-2025-005', tt: 'disabili', ent: 'AUSL Parma', contact: 'Dott. Riva', status: 'active' },
  { id: id(), orgIdx: 1, code: 'BEN-2025-006', tt: 'dipendenze', ent: 'SerD Parma', contact: 'Dott.ssa Sala', status: 'active' },
  { id: id(), orgIdx: 1, code: 'BEN-2025-007', tt: 'salute_mentale', ent: 'CSM Parma', contact: 'Dott. Fontana', status: 'active' },
  { id: id(), orgIdx: 1, code: 'BEN-2026-008', tt: 'dipendenze', ent: 'SerD Parma', contact: 'Dott. Bassi', status: 'active' },
  // Campo Sociale (org 2)
  { id: id(), orgIdx: 2, code: 'BEN-2025-009', tt: 'minori', ent: 'Servizi Sociali Modena', contact: 'Dott.ssa Caruso', status: 'active' },
  { id: id(), orgIdx: 2, code: 'BEN-2025-010', tt: 'minori', ent: 'Servizi Sociali Modena', contact: 'Dott. Greco', status: 'active' },
  { id: id(), orgIdx: 2, code: 'BEN-2026-011', tt: 'giovani', ent: 'Centro Impiego Modena', contact: 'Sig. Pellegrini', status: 'active' },
  { id: id(), orgIdx: 2, code: 'BEN-2026-012', tt: 'immigrati', ent: 'CPIA Modena', contact: 'Prof.ssa Hassan', status: 'active' },
];

beneficiaries.forEach(b => {
  insertBen.run(b.id, orgs[b.orgIdx].id, b.code, b.tt, b.ent, b.contact, b.status, datetime(60 + Math.floor(Math.random() * 90)));
});

console.log('📋 Creazione attività...');

// ===== ACTIVITIES =====
const insertAct = db.prepare(`INSERT INTO activity_logs (id, organization_id, beneficiary_id, activity_date, service_type, duration_minutes, description, participants_count, operator_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const activityDescs = {
  coterapia_piante: [
    'Semina ortaggi primaverili in serra', 'Raccolta erbe aromatiche (basilico, rosmarino, salvia)',
    'Cura e irrigazione orto terapeutico', 'Preparazione terreno per trapianto',
    'Potatura piante aromatiche', 'Laboratorio composizione bouquet erbe',
    'Trapianto piantine di pomodori', 'Manutenzione aiuole fiorite',
    'Raccolta zucchine e peperoni', 'Preparazione terreno invernale'
  ],
  coterapia_animali: [
    'Sessione di ippoterapia', 'Cura degli asini: pulizia e alimentazione',
    'Attività assistita con conigli', 'Percorso sensoriale con cavalli',
    'Pulizia e cura del pollaio', 'Passeggiata terapeutica con asini'
  ],
  inserimento_lavorativo: [
    'Tirocinio in vigna: gestione filari', 'Preparazione terreno orto aziendale',
    'Confezionamento prodotti per vendita', 'Gestione magazzino e logistica',
    'Raccolta uva per vinificazione', 'Lavorazione in cantina biologica',
    'Manutenzione attrezzi e strutture', 'Formazione sicurezza sul lavoro'
  ],
  educativa: [
    'Doposcuola in fattoria con attività pratiche', 'Laboratorio di scienze naturali all\'aperto',
    'Visita didattica al frutteto', 'Progetto orto didattico per bambini',
    'Laboratorio di educazione alimentare', 'Attività di gruppo: semina e cura piantine'
  ],
  socio_ricreativa: [
    'Attività di giardinaggio di gruppo', 'Laboratorio di cucina con prodotti dell\'orto',
    'Passeggiata naturalistica guidata', 'Merenda sociale con prodotti della fattoria',
    'Giornata aperta alle famiglie', 'Attività creative con materiali naturali'
  ],
  formazione: [
    'Corso base orticoltura biologica', 'Formazione operatori: tecniche di inclusione',
    'Workshop compostaggio domestico', 'Seminario agricoltura sociale e normativa'
  ]
};

// Generate activities for last 60 days
const svcForOrg = [
  ['coterapia_piante', 'inserimento_lavorativo', 'socio_ricreativa'],
  ['coterapia_animali', 'inserimento_lavorativo', 'formazione'],
  ['educativa', 'socio_ricreativa', 'coterapia_piante'],
];

for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
  // Skip weekends occasionally
  const d = new Date(); d.setDate(d.getDate() - dayOffset);
  if (d.getDay() === 0) continue; // Skip Sundays

  // Activities for each org (2-3 per working day)
  for (let orgIdx = 0; orgIdx < 3; orgIdx++) {
    const orgBens = beneficiaries.filter(b => b.orgIdx === orgIdx && b.status === 'active');
    if (orgBens.length === 0) continue;

    const numActivities = d.getDay() === 6 ? 1 : (1 + Math.floor(Math.random() * 2));
    for (let a = 0; a < numActivities; a++) {
      const svc = svcForOrg[orgIdx][Math.floor(Math.random() * svcForOrg[orgIdx].length)];
      const descs = activityDescs[svc];
      const desc = descs[Math.floor(Math.random() * descs.length)];
      const ben = orgBens[Math.floor(Math.random() * orgBens.length)];
      const dur = [60, 90, 120, 150, 180, 240][Math.floor(Math.random() * 6)];
      const operatorId = orgIdx === 0 ? users.operator1.id : (orgIdx === 1 ? users.operator2.id : users.org3_admin.id);

      insertAct.run(id(), orgs[orgIdx].id, ben.id, date(dayOffset), svc, dur, desc, 1, operatorId, '');
    }
  }
}

console.log('⭐ Creazione recensioni...');

// ===== REVIEWS =====
const insertReview = db.prepare(`INSERT INTO reviews (id, organization_id, author_name, author_role, rating, comment, is_published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const reviews = [
  // Published reviews
  { orgIdx: 0, author: 'Silvia Gallo', role: 'Referente CSM', rating: 5, comment: 'Collaborazione eccellente. I pazienti mostrano progressi significativi grazie alle attività in orto. Personale preparato e attento.', pub: 1, days: 30 },
  { orgIdx: 0, author: 'Roberto Fontana', role: 'Assistente sociale', rating: 4, comment: 'Buona organizzazione delle attività. Ambiente accogliente e stimolante. Unica nota: sarebbe utile ampliare gli orari pomeridiani.', pub: 1, days: 25 },
  { orgIdx: 1, author: 'Laura Ferri', role: 'Psicologa SerD', rating: 5, comment: 'La fattoria sociale offre un contesto ideale per la riabilitazione. Le attività con gli animali sono particolarmente efficaci. Consiglio vivamente.', pub: 1, days: 45 },
  { orgIdx: 1, author: 'Massimo Tosi', role: 'Familiare', rating: 4, comment: 'Mio fratello ha trovato grande beneficio dalle attività in vigna. L\'ambiente è sereno e il personale molto competente.', pub: 1, days: 40 },
  { orgIdx: 2, author: 'Angela Ricci', role: 'Insegnante', rating: 5, comment: 'Il doposcuola in fattoria è un\'esperienza straordinaria per i bambini. Imparano il rispetto per la natura divertendosi.', pub: 1, days: 20 },
  { orgIdx: 2, author: 'Karim El Fassi', role: 'Mediatore culturale', rating: 4, comment: 'Le attività di integrazione per le famiglie straniere funzionano molto bene. I bambini si inseriscono facilmente.', pub: 1, days: 15 },
  // Pending reviews (to test badge notifications)
  { orgIdx: 0, author: 'Giovanna Marino', role: 'Utente pubblico', rating: 5, comment: 'Ho partecipato alla giornata aperta e sono rimasta colpita dalla qualità dei servizi offerti. Un esempio di agricoltura sociale virtuosa.', pub: 0, days: 2 },
  { orgIdx: 1, author: 'Antonio Pellegrini', role: 'Volontario', rating: 4, comment: 'Esperienza molto positiva come volontario. L\'organizzazione è seria e ben strutturata, il rapporto con gli utenti è rispettoso.', pub: 0, days: 1 },
  { orgIdx: 2, author: 'Sara Bianchi', role: 'Genitore', rating: 5, comment: 'Mia figlia frequenta il campus estivo da due anni e ogni volta torna entusiasta. Educatori preparati e attenti.', pub: 0, days: 1 },
];

reviews.forEach(r => {
  insertReview.run(id(), orgs[r.orgIdx].id, r.author, r.role, r.rating, r.comment, r.pub, datetime(r.days));
});

console.log('📢 Creazione notifiche...');

// ===== NOTIFICATIONS =====
const insertNotif = db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);

[
  { userId: users.admin.id, type: 'certification', title: 'Nuova domanda di certificazione', msg: 'Fattoria della Speranza ha inviato una domanda di certificazione', read: 0, days: 10 },
  { userId: users.admin.id, type: 'certification', title: 'Documenti in revisione', msg: 'Orto Sociale Bologna — documenti caricati in attesa di revisione', read: 0, days: 5 },
  { userId: users.admin.id, type: 'review', title: 'Nuova recensione da moderare', msg: '3 recensioni in attesa di approvazione', read: 0, days: 1 },
  { userId: users.auditor1.id, type: 'audit', title: 'Audit di sorveglianza programmato', msg: 'Audit di sorveglianza per Cooperativa Terra Buona previsto tra 5 giorni', read: 0, days: 3 },
  { userId: users.auditor1.id, type: 'audit', title: 'Audit pianificato', msg: 'Audit di sorveglianza per Fattoria Sociale Il Vigneto programmato per marzo', read: 1, days: 15 },
  { userId: users.org1_admin.id, type: 'certification', title: 'Sorveglianza in arrivo', msg: 'Un audit di sorveglianza è stato pianificato per la vostra organizzazione', read: 0, days: 5 },
].forEach(n => {
  insertNotif.run(id(), n.userId, n.type, n.title, n.msg, n.read, datetime(n.days));
});

console.log('🔧 Creazione azioni correttive...');

// ===== CORRECTIVE ACTIONS =====
const insertCA = db.prepare(`INSERT INTO corrective_actions (id, audit_id, evaluation_id, description, action_required, deadline, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

// For audit 1 (Terra Buona - had 1 PC)
insertCA.run(id(), audits[0].id, null, 'Politica di inclusione non formalizzata in documento ufficiale', 'Redigere e pubblicare una politica formale di inclusione, non discriminazione e rispetto della dignità', date(-30), 'open', datetime(120));

// For audit 3 (Campo Sociale - had 2 PC)
insertCA.run(id(), audits[2].id, null, 'Procedure di tutela esistenti ma non aggiornate alla normativa vigente', 'Aggiornare le procedure di tutela e supervisione in conformità alla normativa corrente', date(-15), 'open', datetime(30));
insertCA.run(id(), audits[2].id, null, 'Organigramma incompleto, mancano descrizioni dei ruoli operativi', 'Completare l\'organigramma con tutti i ruoli e le relative responsabilità', date(-15), 'in_progress', datetime(30));

console.log('');
console.log('✅ Database popolato con successo!');
console.log('');
console.log('📊 Riepilogo:');
console.log(`   👤 ${Object.keys(users).length} utenti`);
console.log(`   🏠 ${orgs.length} organizzazioni (3 attive, 2 in attesa)`);
console.log(`   📜 ${certs.length} certificazioni (2 rilasciate, 1 audit completato, 1 inviata, 1 in revisione)`);
console.log(`   ✅ ${audits.length} audit (3 completati, 2 pianificati)`);
console.log(`   👥 ${beneficiaries.length} beneficiari`);
console.log(`   📋 ~${db.prepare('SELECT COUNT(*) as n FROM activity_logs').get().n} attività`);
console.log(`   ⭐ ${reviews.length} recensioni (6 pubblicate, 3 da moderare)`);
console.log(`   🔧 3 azioni correttive aperte`);
console.log('');
console.log('🔑 Credenziali di accesso:');
console.log('   Admin:      admin@gcf.it / admin123');
console.log('   Auditor 1:  luca.bianchi@gcf.it / auditor123');
console.log('   Auditor 2:  anna.moretti@gcf.it / auditor123');
console.log('   Org Admin:  giuseppe.verdi@terrabuona.it / org12345');
console.log('   Org Admin:  maria.conti@ilvigneto.it / org12345');
console.log('   Operatore:  chiara.esposito@terrabuona.it / oper1234');
console.log('   Ente Ref:   silvia.gallo@csmpiacenza.it / ente1234');
console.log('   Pubblico:   giovanna.marino@gmail.com / user1234');

saveToFile();
console.log('💾 Database salvato su disco.');
}

seed().catch(e => { console.error('Errore seed:', e); process.exit(1); });
