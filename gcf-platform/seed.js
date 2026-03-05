/**
 * Seed script — Popola il database con dati fittizi realistici
 * Standard SNM-AS — 14 requisiti, 5 aree
 * Eseguire: node seed.js
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Init DB
const { initDb, getDb, saveToFile } = require('./utils/database');

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
  'organization_documents', 'organization_partners', 'organization_images', 'organization_target_users', 'organization_services',
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
// Forme giuridiche: solo impresa_agricola e cooperativa_sociale
const orgs = [
  {
    id: id(), name: 'Cooperativa Terra Buona', lf: 'cooperativa_sociale', tc: 'COPTB0001234567',
    vat: '01234567890', addr: 'Via dei Campi 15', city: 'Piacenza', prov: 'PC', region: 'Emilia-Romagna',
    lat: 45.0526, lng: 9.6930, email: 'info@terrabuona.it', web: 'www.terrabuona.it', phone: '+39 0523 456789',
    desc: 'Cooperativa sociale che gestisce attività di agricoltura sociale con focus su percorsi di riabilitazione attraverso la coltivazione di orti e la cura di piante aromatiche.',
    mgr: 'Giuseppe Verdi', mgrRole: 'Coordinatore servizi sociali', status: 'active', admin: 'org1_admin'
  },
  {
    id: id(), name: 'Fattoria Sociale Il Vigneto', lf: 'impresa_agricola', tc: 'FTVILV987654321',
    vat: '09876543210', addr: 'Strada Provinciale 28', city: 'Parma', prov: 'PR', region: 'Emilia-Romagna',
    lat: 44.8015, lng: 10.3279, email: 'info@ilvigneto.it', web: 'www.ilvigneto.it', phone: '+39 0521 234567',
    desc: 'Impresa agricola con vigneto biologico che offre percorsi di inserimento lavorativo e coterapia con animali per persone con disabilità e disagio psichico.',
    mgr: 'Maria Conti', mgrRole: 'Responsabile attività sociali', status: 'active', admin: 'org2_admin'
  },
  {
    id: id(), name: 'Associazione Campo Sociale', lf: 'impresa_agricola', tc: 'ASSCSO112233445',
    vat: '11223344556', addr: 'Via della Resistenza 42', city: 'Modena', prov: 'MO', region: 'Emilia-Romagna',
    lat: 44.6471, lng: 10.9252, email: 'info@camposociale.it', web: 'www.camposociale.it', phone: '+39 059 345678',
    desc: 'Impresa agricola che promuove attività educative e socio-ricreative in ambiente agricolo per minori, giovani e famiglie in situazione di disagio.',
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

// Org 4 — Fattoria della Speranza (pending — nessuna cert, ma ha servizi configurati)
[['coterapia_animali', 'Pet therapy con cani e cavalli'], ['inserimento_lavorativo', 'Percorsi per detenuti in art. 21'], ['socio_ricreativa', 'Attività agricole di gruppo']].forEach(([t, d]) => insertSvc.run(id(), orgs[3].id, t, d));
[['dipendenze', 'Tossicodipendenze e alcol'], ['detenuti', 'Detenuti in misura alternativa'], ['disagio_adulti', 'Adulti senza fissa dimora']].forEach(([t, n]) => insertTgt.run(id(), orgs[3].id, t, n));

// Org 5 — Orto Sociale Bologna (pending — nessuna cert)
[['coterapia_piante', 'Orti terapeutici urbani'], ['formazione', 'Formazione orticoltura per operatori'], ['socio_ricreativa', 'Attività in giardino condiviso']].forEach(([t, d]) => insertSvc.run(id(), orgs[4].id, t, d));
[['salute_mentale', 'Percorsi DSM Bologna'], ['anziani', 'Anziani in RSA e centri diurni'], ['disagio_adulti', 'Adulti con grave disagio socio-economico']].forEach(([t, n]) => insertTgt.run(id(), orgs[4].id, t, n));

console.log('📜 Creazione certificazioni...');

// ===== CERTIFICATIONS =====
// Solo le 3 org attive hanno certificazioni. Le 2 pending non ne hanno (coerente: devono prima essere attivate).
const insertCert = db.prepare(`INSERT INTO certifications (id, organization_id, cert_number, status, application_date, doc_review_date, doc_reviewer_id, issue_date, expiry_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const certs = [
  { id: id(), orgIdx: 0, num: 'GCF-2025-001', status: 'issued', appDate: date(180), reviewDate: date(170), issueDate: date(120), expiryDate: date(-975), notes: 'Certificazione rilasciata — piena conformità su tutti i 14 requisiti' },
  { id: id(), orgIdx: 1, num: 'GCF-2025-002', status: 'issued', appDate: date(150), reviewDate: date(140), issueDate: date(90), expiryDate: date(-1005), notes: 'Eccellente conformità riscontrata' },
  { id: id(), orgIdx: 2, num: 'GCF-2026-003', status: 'audit_completed', appDate: date(60), reviewDate: date(50), issueDate: null, expiryDate: null, notes: 'In attesa di decisione finale dopo audit' },
];

certs.forEach(c => {
  insertCert.run(c.id, orgs[c.orgIdx].id, c.num, c.status, c.appDate, c.reviewDate, c.reviewDate ? users.admin.id : null, c.issueDate, c.expiryDate, c.notes, datetime(c.appDate ? 180 : 10));
});

console.log('✅ Creazione audit...');

// ===== AUDITS — 3 completati, 0 pianificati =====
const insertAudit = db.prepare(`INSERT INTO audits (id, certification_id, auditor_id, audit_type, audit_mode, scheduled_date, completed_date, status, total_conforming, total_partially, total_non_conforming, total_not_applicable, outcome, auditor_notes, org_representative_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const audits = [
  { id: id(), certIdx: 0, auditor: 'auditor1', type: 'initial', mode: 'on_site', sched: date(130), compl: date(125), status: 'completed', c: 14, pc: 0, nc: 0, na: 0, outcome: 'conforming', notes: 'Piena conformità su tutti i 14 requisiti. Organizzazione molto ben strutturata con documentazione completa e aggiornata.', rep: 'Giuseppe Verdi' },
  { id: id(), certIdx: 1, auditor: 'auditor2', type: 'initial', mode: 'on_site', sched: date(100), compl: date(95), status: 'completed', c: 14, pc: 0, nc: 0, na: 0, outcome: 'conforming', notes: 'Piena conformità su tutti i 14 requisiti. Struttura molto ben organizzata con documentazione completa.', rep: 'Maria Conti' },
  { id: id(), certIdx: 2, auditor: 'auditor1', type: 'initial', mode: 'mixed', sched: date(40), compl: date(35), status: 'completed', c: 10, pc: 2, nc: 0, na: 2, outcome: 'conforming_with_actions', notes: 'Requisiti 3.3 e 4.2 parzialmente conformi. Procedure di tutela e organigramma da completare.', rep: 'Paolo Ferrara' },
];

audits.forEach(a => {
  insertAudit.run(a.id, certs[a.certIdx].id, users[a.auditor].id, a.type, a.mode, a.sched, a.compl, a.status, a.c, a.pc, a.nc, a.na, a.outcome, a.notes, a.rep, datetime(130));
});

// =====================================================
// AUDIT EVALUATIONS — Standard SNM-AS — 14 requisiti
// =====================================================
console.log('📋 Creazione valutazioni audit...');

const insertEval = db.prepare(`INSERT INTO audit_evaluations (id, audit_id, requirement_id, area_number, requirement_number, evaluation, evidences_checked, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const requirements = db.prepare(`
  SELECT cr.*, aa.area_number 
  FROM certification_requirements cr 
  JOIN audit_areas aa ON cr.area_id = aa.id 
  ORDER BY cr.sort_order
`).all();

// =====================================================
// Audit 1: Terra Buona — 14C (piena conformità → certificato rilasciato)
// =====================================================
const eval1Config = {
  '1.1': { ev: 'C', checked: ['Visura camerale', 'Fascicolo aziendale attivo', 'Codice ATECO coerente'], note: 'Cooperativa sociale regolarmente iscritta, ATECO coerente con agricoltura sociale' },
  '1.2': { ev: 'C', checked: ['Descrizione servizi', 'Documento interno'], note: 'Carta dei servizi completa e aggiornata, disponibile sul sito web' },
  '1.3': { ev: 'C', checked: ['Nomina formale', 'Organigramma'], note: 'Giuseppe Verdi nominato responsabile con delibera del CdA' },
  '2.1': { ev: 'C', checked: ['Progetti individuali', 'Convenzioni'], note: 'Presenti progetti individuali per ogni beneficiario e convenzione con CSM Piacenza' },
  '2.2': { ev: 'C', checked: ['Registro attività', 'Report'], note: 'Registro attività giornaliero su piattaforma digitale, report mensili inviati al CSM' },
  '2.3': { ev: 'C', checked: ['Dichiarazione scritta', 'Politica inclusione/non discriminazione'], note: 'Politica di inclusione formalizzata e adottata con delibera del CdA' },
  '3.1': { ev: 'C', checked: ['Titolo disponibilità locali', 'Documentazione edilizia'], note: 'Locali di proprietà con documentazione edilizia in regola' },
  '3.2': { ev: 'C', checked: ['Autocertificazione', 'Documentazione sicurezza (DVR)'], note: 'DVR aggiornato, formazione sicurezza completata per tutti gli operatori' },
  '3.3': { ev: 'C', checked: ['Procedure tutela utenti', 'Modalità operative'], note: 'Protocolli di supervisione chiari, rapporto operatore/utente adeguato (1:4)' },
  '3.4': { ev: 'C', checked: ['Dichiarazione assenza cause interdittive', 'Autodichiarazione assenza condanne'], note: 'Tutte le dichiarazioni raccolte dal legale rappresentante e dai singoli operatori' },
  '4.1': { ev: 'C', checked: ['Attestato formazione', 'Esperienza documentata ≥2 anni (CV, contratti/incarichi)'], note: 'Personale qualificato: 2 educatori, 1 psicologo, 1 agronomo, 3 operatori con formazione specifica' },
  '4.2': { ev: 'C', checked: ['Organigramma', 'Mansionari', 'Descrizione ruoli'], note: 'Organigramma completo con mansionario dettagliato per ogni ruolo' },
  '5.1': { ev: 'C', checked: ['Dichiarazione firmata', 'Politica qualità'], note: 'Dichiarazione firmata dal presidente della cooperativa e dal CdA' },
  '5.2': { ev: 'C', checked: ['Registro aggiornamenti', 'Archivio documentale'], note: 'Archivio documentale organizzato e registro aggiornamenti tenuto regolarmente' },
};

requirements.forEach(r => {
  const cfg = eval1Config[r.requirement_number];
  if (!cfg) return;
  insertEval.run(id(), audits[0].id, r.id, r.area_number, r.requirement_number, cfg.ev, JSON.stringify(cfg.checked), cfg.note);
});

// =====================================================
// Audit 2: Il Vigneto — 14C (piena conformità → certificato rilasciato)
// =====================================================
const eval2Config = {
  '1.1': { ev: 'C', checked: ['Visura camerale', 'Statuto/Atto costitutivo', 'Fascicolo aziendale attivo', 'Codice ATECO coerente'], note: 'Impresa agricola regolarmente iscritta con tutti i requisiti giuridici in ordine' },
  '1.2': { ev: 'C', checked: ['Descrizione servizi', 'Documento interno', 'Materiale informativo'], note: 'Documentazione esemplare: brochure, sito web aggiornato, schede servizio dettagliate' },
  '1.3': { ev: 'C', checked: ['Nomina formale', 'Organigramma'], note: 'Maria Conti designata con atto formale, ruolo chiaramente definito' },
  '2.1': { ev: 'C', checked: ['Progetti individuali', 'Convenzioni', 'Accordi con enti'], note: 'Progetti individuali per tutti i beneficiari, convenzioni attive con SerD e AUSL Parma' },
  '2.2': { ev: 'C', checked: ['Registro attività', 'Report', 'Note di monitoraggio'], note: 'Sistema di monitoraggio strutturato con report settimanali e riunioni equipe mensili' },
  '2.3': { ev: 'C', checked: ['Dichiarazione scritta', 'Politica inclusione/non discriminazione'], note: 'Carta etica approvata con policy antidiscriminazione e codice di condotta' },
  '3.1': { ev: 'C', checked: ['Titolo disponibilità locali', 'Documentazione edilizia', 'Documentazione igienico-sanitaria'], note: 'Struttura a norma con tutta la documentazione edilizia e igienico-sanitaria in regola' },
  '3.2': { ev: 'C', checked: ['Autocertificazione', 'Documentazione sicurezza (DVR)'], note: 'DVR completo, RSPP esterno, formazione ex art. 37 D.Lgs 81/08 per tutti' },
  '3.3': { ev: 'C', checked: ['Procedure tutela utenti', 'Modalità operative', 'Supervisione'], note: 'Protocolli di tutela completi, supervisione professionale mensile con psicologo esterno' },
  '3.4': { ev: 'C', checked: ['Dichiarazione assenza cause interdittive', 'Autodichiarazione assenza condanne'], note: 'Tutte le dichiarazioni raccolte per il legale rappresentante e per ogni singolo operatore' },
  '4.1': { ev: 'C', checked: ['Attestato formazione', 'Esperienza documentata ≥2 anni (CV, contratti/incarichi)'], note: 'Referente con laurea in scienze agrarie e master in agricoltura sociale, 5 anni di esperienza' },
  '4.2': { ev: 'C', checked: ['Organigramma', 'Mansionari', 'Descrizione ruoli'], note: 'Organigramma dettagliato con mansionario completo e job description per ogni figura' },
  '5.1': { ev: 'C', checked: ['Dichiarazione firmata', 'Politica qualità'], note: 'Dichiarazione di impegno sottoscritta e politica qualità adottata formalmente' },
  '5.2': { ev: 'C', checked: ['Registro aggiornamenti', 'Archivio documentale', 'Evidenza aggiornamento annuale'], note: 'Sistema documentale completo con registro aggiornamenti e revisione annuale programmata' },
};

requirements.forEach(r => {
  const cfg = eval2Config[r.requirement_number];
  if (!cfg) return;
  insertEval.run(id(), audits[1].id, r.id, r.area_number, r.requirement_number, cfg.ev, JSON.stringify(cfg.checked), cfg.note);
});

// =====================================================
// Audit 3: Campo Sociale — 10C + 2PC + 2NA (in attesa di decisione)
// =====================================================
const eval3Config = {
  '1.1': { ev: 'C', checked: ['Visura camerale', 'Codice ATECO coerente'], note: 'Impresa agricola regolarmente iscritta con ATECO compatibile' },
  '1.2': { ev: 'C', checked: ['Descrizione servizi', 'Materiale informativo'], note: 'Servizi descritti nel sito web e nelle brochure distribuite' },
  '1.3': { ev: 'C', checked: ['Nomina formale'], note: 'Responsabile designato con verbale del consiglio direttivo' },
  '2.1': { ev: 'C', checked: ['Progetti individuali', 'Accordi con enti'], note: 'Progetti presenti, accordi con comune e ASL' },
  '2.2': { ev: 'C', checked: ['Registro attività'], note: 'Registro compilato regolarmente' },
  '2.3': { ev: 'C', checked: ['Dichiarazione scritta'], note: 'Dichiarazione di inclusione presente nello statuto' },
  '3.1': { ev: 'C', checked: ['Titolo disponibilità locali'], note: 'Locali in comodato d\'uso con contratto registrato' },
  '3.2': { ev: 'C', checked: ['Autocertificazione', 'Documentazione sicurezza (DVR)'], note: 'DVR presente ma da aggiornare entro 6 mesi' },
  '3.3': { ev: 'PC', checked: ['Modalità operative'], note: 'Procedure di tutela presenti ma non complete. Mancano protocolli scritti per la gestione emergenze con utenti fragili' },
  '3.4': { ev: 'NA', checked: [], note: 'Requisito valutato come non applicabile in questa configurazione organizzativa' },
  '4.1': { ev: 'C', checked: ['Attestato formazione'], note: '3 educatori professionali, 2 volontari con formazione specifica, 1 mediatore culturale' },
  '4.2': { ev: 'PC', checked: ['Organigramma'], note: 'Organigramma presente ma incompleto: mancano descrizioni dettagliate dei ruoli operativi e delle responsabilità dei volontari' },
  '5.1': { ev: 'C', checked: ['Dichiarazione firmata'], note: 'Impegno firmato dal presidente con delibera del consiglio direttivo' },
  '5.2': { ev: 'NA', checked: [], note: 'Organizzazione di recente costituzione, primo ciclo di certificazione — aggiornamento documentale non ancora applicabile' },
};

requirements.forEach(r => {
  const cfg = eval3Config[r.requirement_number];
  if (!cfg) return;
  insertEval.run(id(), audits[2].id, r.id, r.area_number, r.requirement_number, cfg.ev, JSON.stringify(cfg.checked), cfg.note);
});

console.log('👥 Creazione beneficiari...');

// ===== BENEFICIARIES (solo per le 3 org attive) =====
const insertBen = db.prepare(`INSERT INTO beneficiaries (id, organization_id, code, target_type, referring_entity, referring_contact, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const beneficiaries = [
  // Org 1 — Terra Buona (5 beneficiari)
  { id: id(), orgIdx: 0, code: 'TB-2025-001', type: 'salute_mentale', entity: 'CSM Piacenza', contact: 'Silvia Gallo', status: 'active', days: 150 },
  { id: id(), orgIdx: 0, code: 'TB-2025-002', type: 'disabili', entity: 'AUSL Piacenza', contact: 'Dr. Bianchi', status: 'active', days: 120 },
  { id: id(), orgIdx: 0, code: 'TB-2025-003', type: 'anziani', entity: 'Comune di Piacenza', contact: 'Ufficio Servizi Sociali', status: 'active', days: 90 },
  { id: id(), orgIdx: 0, code: 'TB-2025-004', type: 'salute_mentale', entity: 'CSM Piacenza', contact: 'Silvia Gallo', status: 'completed', days: 200 },
  { id: id(), orgIdx: 0, code: 'TB-2026-005', type: 'disabili', entity: 'Cooperativa Sociale Amici', contact: 'Responsabile area', status: 'active', days: 30 },

  // Org 2 — Il Vigneto (4 beneficiari)
  { id: id(), orgIdx: 1, code: 'VG-2025-001', type: 'dipendenze', entity: 'SerD Parma', contact: 'Dr.ssa Ferri', status: 'active', days: 180 },
  { id: id(), orgIdx: 1, code: 'VG-2025-002', type: 'disabili', entity: 'AUSL Parma', contact: 'Servizio Disabilità', status: 'active', days: 140 },
  { id: id(), orgIdx: 1, code: 'VG-2025-003', type: 'salute_mentale', entity: 'CSM Parma', contact: 'Roberto Fontana', status: 'active', days: 100 },
  { id: id(), orgIdx: 1, code: 'VG-2025-004', type: 'dipendenze', entity: 'SerD Parma', contact: 'Dr.ssa Ferri', status: 'suspended', days: 160 },

  // Org 3 — Campo Sociale (3 beneficiari)
  { id: id(), orgIdx: 2, code: 'CS-2025-001', type: 'minori', entity: 'Comune di Modena', contact: 'Servizi Educativi', status: 'active', days: 110 },
  { id: id(), orgIdx: 2, code: 'CS-2025-002', type: 'giovani', entity: 'Centro per l\'Impiego MO', contact: 'Orientatore', status: 'active', days: 80 },
  { id: id(), orgIdx: 2, code: 'CS-2026-003', type: 'immigrati', entity: 'Cooperativa Mediazione', contact: 'Karim El Fassi', status: 'active', days: 45 },
];

beneficiaries.forEach(b => {
  insertBen.run(b.id, orgs[b.orgIdx].id, b.code, b.type, b.entity, b.contact, b.status, datetime(b.days));
});

console.log('📋 Creazione attività...');

// ===== ACTIVITIES (solo per le 3 org attive, ultimi 60 giorni) =====
const insertAct = db.prepare(`INSERT INTO activity_logs (id, organization_id, beneficiary_id, activity_date, service_type, duration_minutes, description, is_group, operator_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const activityDescs = {
  coterapia_piante: [
    'Semina e trapianto piantine nell\'orto terapeutico', 'Raccolta erbe aromatiche e preparazione',
    'Manutenzione aiuole e percorso sensoriale', 'Attività di potatura e cura degli alberi',
    'Laboratorio di educazione alimentare', 'Attività di gruppo: semina e cura piantine'
  ],
  coterapia_animali: [
    'Sessione di pet therapy con cani', 'Accudimento animali: pulizia e alimentazione',
    'Attività in maneggio con cavalli', 'Sessione con asini: grooming e passeggiata',
    'Cura conigli e animali da cortile', 'Attività di gruppo: interazione con animali'
  ],
  inserimento_lavorativo: [
    'Turno in serra: semina e irrigazione', 'Confezionamento prodotti per vendita diretta',
    'Lavoro in campo: raccolta e selezione', 'Manutenzione attrezzature agricole',
    'Turno al punto vendita aziendale', 'Preparazione ordini per GAS e mense'
  ],
  educativa: [
    'Doposcuola in fattoria con compiti', 'Laboratorio scientifico: ciclo delle piante',
    'Visita guidata con classe della scuola', 'Attività ludico-educativa all\'aria aperta',
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

const svcForOrg = [
  ['coterapia_piante', 'inserimento_lavorativo', 'socio_ricreativa'],
  ['coterapia_animali', 'inserimento_lavorativo', 'formazione'],
  ['educativa', 'socio_ricreativa', 'coterapia_piante'],
];

for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
  const d = new Date(); d.setDate(d.getDate() - dayOffset);
  if (d.getDay() === 0) continue;

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

// ===== REVIEWS (solo per le 3 org attive) =====
const insertReview = db.prepare(`INSERT INTO reviews (id, organization_id, author_name, author_role, rating, comment, is_published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const reviews = [
  { orgIdx: 0, author: 'Silvia Gallo', role: 'Referente CSM', rating: 5, comment: 'Collaborazione eccellente. I pazienti mostrano progressi significativi grazie alle attività in orto. Personale preparato e attento.', pub: 1, days: 30 },
  { orgIdx: 0, author: 'Roberto Fontana', role: 'Assistente sociale', rating: 4, comment: 'Buona organizzazione delle attività. Ambiente accogliente e stimolante. Unica nota: sarebbe utile ampliare gli orari pomeridiani.', pub: 1, days: 25 },
  { orgIdx: 1, author: 'Laura Ferri', role: 'Psicologa SerD', rating: 5, comment: 'La fattoria sociale offre un contesto ideale per la riabilitazione. Le attività con gli animali sono particolarmente efficaci. Consiglio vivamente.', pub: 1, days: 45 },
  { orgIdx: 1, author: 'Massimo Tosi', role: 'Familiare', rating: 4, comment: 'Mio fratello ha trovato grande beneficio dalle attività in vigna. L\'ambiente è sereno e il personale molto competente.', pub: 1, days: 40 },
  { orgIdx: 2, author: 'Angela Ricci', role: 'Insegnante', rating: 5, comment: 'Il doposcuola in fattoria è un\'esperienza straordinaria per i bambini. Imparano il rispetto per la natura divertendosi.', pub: 1, days: 20 },
  { orgIdx: 2, author: 'Karim El Fassi', role: 'Mediatore culturale', rating: 4, comment: 'Le attività di integrazione per le famiglie straniere funzionano molto bene. I bambini si inseriscono facilmente.', pub: 1, days: 15 },
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
  { userId: users.admin.id, type: 'review', title: 'Nuova recensione da moderare', msg: '3 recensioni in attesa di approvazione', read: 0, days: 1 },
  { userId: users.admin.id, type: 'certification', title: 'Audit completato', msg: 'Associazione Campo Sociale — audit completato, in attesa di decisione finale', read: 0, days: 2 },
  { userId: users.admin.id, type: 'organization', title: 'Nuove organizzazioni in attesa', msg: '2 organizzazioni in attesa di verifica documenti e attivazione', read: 0, days: 3 },
  { userId: users.auditor1.id, type: 'audit', title: 'Audit completato', msg: 'Audit per Associazione Campo Sociale completato con esito conforme con azioni correttive', read: 1, days: 30 },
  { userId: users.org3_admin.id, type: 'certification', title: 'Audit completato', msg: 'L\'audit per la vostra organizzazione è stato completato. In attesa di decisione finale.', read: 0, days: 2 },
  { userId: users.org4_admin.id, type: 'organization', title: 'Organizzazione in attesa', msg: 'La tua organizzazione è in attesa di verifica da parte di AICARE.', read: 0, days: 5 },
  { userId: users.org5_admin.id, type: 'organization', title: 'Organizzazione in attesa', msg: 'La tua organizzazione è in attesa di verifica da parte di AICARE.', read: 0, days: 3 },
].forEach(n => {
  insertNotif.run(id(), n.userId, n.type, n.title, n.msg, n.read, datetime(n.days));
});

console.log('🔧 Creazione azioni correttive...');

// ===== CORRECTIVE ACTIONS (solo per audit 3 — Campo Sociale con 2 PC) =====
const insertCA = db.prepare(`INSERT INTO corrective_actions (id, audit_id, evaluation_id, description, action_required, deadline, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

insertCA.run(id(), audits[2].id, null, 'Procedure di tutela esistenti ma non aggiornate alla normativa vigente', 'Aggiornare le procedure di tutela e supervisione in conformità alla normativa corrente', date(-15), 'open', datetime(30));
insertCA.run(id(), audits[2].id, null, 'Organigramma incompleto, mancano descrizioni dei ruoli operativi', 'Completare l\'organigramma con tutti i ruoli e le relative responsabilità', date(-15), 'in_progress', datetime(30));

console.log('');
console.log('✅ Database popolato con successo!');
console.log('');
console.log('📊 Riepilogo:');
console.log(`   👤 ${Object.keys(users).length} utenti`);
console.log(`   🏠 ${orgs.length} organizzazioni (3 attive, 2 in attesa)`);
console.log(`   📜 ${certs.length} certificazioni (2 rilasciate, 1 audit completato)`);
console.log(`   ✅ ${audits.length} audit (3 completati)`);
console.log(`   👥 ${beneficiaries.length} beneficiari`);
console.log(`   📋 ~${db.prepare('SELECT COUNT(*) as n FROM activity_logs').get().n} attività`);
console.log(`   ⭐ ${reviews.length} recensioni (6 pubblicate, 3 da moderare)`);
console.log(`   🔧 2 azioni correttive (Campo Sociale)`);
console.log('');
console.log('🔑 Credenziali di accesso:');
console.log('   Admin:      admin@gcf.it / admin123');
console.log('   Auditor 1:  luca.bianchi@gcf.it / auditor123');
console.log('   Auditor 2:  anna.moretti@gcf.it / auditor123');
console.log('   Org Admin:  giuseppe.verdi@terrabuona.it / org12345');
console.log('   Org Admin:  maria.conti@ilvigneto.it / org12345');
console.log('   Org Admin:  paolo.ferrara@camposociale.it / org12345');
console.log('   Operatore:  chiara.esposito@terrabuona.it / oper1234');
console.log('   Ente Ref:   silvia.gallo@csmpiacenza.it / ente1234');
console.log('   Pubblico:   giovanna.marino@gmail.com / user1234');

saveToFile();
console.log('💾 Database salvato su disco.');
}

seed().catch(e => { console.error('Errore seed:', e); process.exit(1); });
