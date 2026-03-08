/**
 * Seed script — Popola il database con dati fittizi realistici
 * Standard SNM-AS — 14 requisiti, 5 aree
 * 
 * REGOLE RISPETTATE:
 * - Solo impresa_agricola e cooperativa_sociale
 * - Org pending → nessuna cert, beneficiari, attività
 * - Org attiva senza cert issued → nessun beneficiario/attività
 * - Org attiva con cert issued → beneficiari + attività
 * - Cert issued → tutti 14 requisiti C nell'audit
 * - ente_user_id collega beneficiari a enti referenti registrati
 * - Regioni diverse per filtro registro pubblico
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb, getDb, saveToFile } = require('./utils/database');

async function seed() {
const db_ready = await initDb();
const db = getDb();

const hash = (pw) => bcrypt.hashSync(pw, 10);
const id = () => uuidv4();
const date = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().split('T')[0]; };
const datetime = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().replace('T', ' ').substring(0, 19); };

console.log('🗑️  Svuotamento database...');
['system_logs','notifications','events','reviews','monitoring_reports','activity_logs','individual_projects',
 'corrective_actions','audit_evaluations','audit_attachments','audits','certification_documents','certifications',
 'organization_documents','organization_partners','organization_images','organization_target_users','organization_services',
 'beneficiaries','organizations','refresh_tokens','users'
].forEach(t => { try { db.prepare(`DELETE FROM ${t}`).run(); } catch(e) {} });

// ===================================================================
// UTENTI (17)
// ===================================================================
console.log('👤 Creazione utenti...');

const users = {
  admin:      { id: id(), email: 'admin@gcf.it',                      pw: 'admin123',   role: 'admin',          fn: 'Marco',     ln: 'Rossi',    phone: '+39 333 1234567' },
  auditor1:   { id: id(), email: 'luca.bianchi@gcf.it',               pw: 'auditor123', role: 'auditor',        fn: 'Luca',      ln: 'Bianchi',  phone: '+39 347 2345678' },
  auditor2:   { id: id(), email: 'anna.moretti@gcf.it',               pw: 'auditor123', role: 'auditor',        fn: 'Anna',      ln: 'Moretti',  phone: '+39 340 3456789' },
  org1_admin: { id: id(), email: 'giuseppe.verdi@terrabuona.it',       pw: 'org12345',   role: 'org_admin',      fn: 'Giuseppe',  ln: 'Verdi',    phone: '+39 348 4567890' },
  org2_admin: { id: id(), email: 'maria.conti@ilvigneto.it',           pw: 'org12345',   role: 'org_admin',      fn: 'Maria',     ln: 'Conti',    phone: '+39 339 5678901' },
  org3_admin: { id: id(), email: 'stefano.landi@collina.it',           pw: 'org12345',   role: 'org_admin',      fn: 'Stefano',   ln: 'Landi',    phone: '+39 328 6789012' },
  org4_admin: { id: id(), email: 'paolo.ferrara@camposociale.it',      pw: 'org12345',   role: 'org_admin',      fn: 'Paolo',     ln: 'Ferrara',  phone: '+39 335 7890123' },
  org5_admin: { id: id(), email: 'laura.gatti@cascinadelsole.it',      pw: 'org12345',   role: 'org_admin',      fn: 'Laura',     ln: 'Gatti',    phone: '+39 346 8901234' },
  org6_admin: { id: id(), email: 'elena.russo@fattoriasperanza.it',    pw: 'org12345',   role: 'org_admin',      fn: 'Elena',     ln: 'Russo',    phone: '+39 338 9012345' },
  org7_admin: { id: id(), email: 'francesco.romano@ortosociale.it',    pw: 'org12345',   role: 'org_admin',      fn: 'Francesco', ln: 'Romano',   phone: '+39 329 0123456' },
  operator1:  { id: id(), email: 'chiara.esposito@terrabuona.it',      pw: 'oper1234',   role: 'org_operator',   fn: 'Chiara',    ln: 'Esposito', phone: '+39 342 1122334' },
  operator2:  { id: id(), email: 'davide.colombo@ilvigneto.it',        pw: 'oper1234',   role: 'org_operator',   fn: 'Davide',    ln: 'Colombo',  phone: '+39 337 2233445' },
  operator3:  { id: id(), email: 'sara.neri@collina.it',               pw: 'oper1234',   role: 'org_operator',   fn: 'Sara',      ln: 'Neri',     phone: '+39 345 3344556' },
  ente1:      { id: id(), email: 'silvia.gallo@csmpiacenza.it',        pw: 'ente1234',   role: 'ente_referente', fn: 'Silvia',    ln: 'Gallo',    phone: '+39 342 4455667' },
  ente2:      { id: id(), email: 'roberto.fontana@csmparma.it',        pw: 'ente1234',   role: 'ente_referente', fn: 'Roberto',   ln: 'Fontana',  phone: '+39 337 5566778' },
  ente3:      { id: id(), email: 'chiara.martini@aslarezzo.it',        pw: 'ente1234',   role: 'ente_referente', fn: 'Chiara',    ln: 'Martini',  phone: '+39 331 6677889' },
  public1:    { id: id(), email: 'giovanna.marino@gmail.com',          pw: 'user1234',   role: 'public',         fn: 'Giovanna',  ln: 'Marino',   phone: '+39 345 7788990' },
};

const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`);
Object.values(users).forEach(u => {
  insertUser.run(u.id, u.email, hash(u.pw), u.role, u.fn, u.ln, u.phone, datetime(Math.floor(Math.random() * 7)));
});

// ===================================================================
// ORGANIZZAZIONI (7 — 3 regioni)
// 1-3: active + cert issued → beneficiari + attività
// 4:   active + cert audit_completed → NO beneficiari
// 5:   active + cert submitted → NO beneficiari
// 6-7: pending → NIENTE
// ===================================================================
console.log('🏠 Creazione organizzazioni...');

const orgs = [
  { id: id(), name: 'Cooperativa Terra Buona', lf: 'cooperativa_sociale', tc: 'COPTB0001234567', vat: '01234567890',
    addr: 'Via dei Campi 15', city: 'Piacenza', prov: 'PC', region: 'Emilia-Romagna',
    lat: 45.0526, lng: 9.6930, email: 'info@terrabuona.it', web: 'www.terrabuona.it', phone: '+39 0523 456789',
    desc: 'Cooperativa sociale che gestisce attività di agricoltura sociale con focus su percorsi di riabilitazione attraverso la coltivazione di orti e piante aromatiche.',
    mgr: 'Giuseppe Verdi', mgrRole: 'Coordinatore servizi sociali', status: 'active', admin: 'org1_admin' },
  { id: id(), name: 'Fattoria Sociale Il Vigneto', lf: 'impresa_agricola', tc: 'FTVILV987654321', vat: '09876543210',
    addr: 'Strada Provinciale 28', city: 'Parma', prov: 'PR', region: 'Emilia-Romagna',
    lat: 44.8015, lng: 10.3279, email: 'info@ilvigneto.it', web: 'www.ilvigneto.it', phone: '+39 0521 234567',
    desc: 'Impresa agricola con vigneto biologico che offre percorsi di inserimento lavorativo e coterapia con animali.',
    mgr: 'Maria Conti', mgrRole: 'Responsabile attività sociali', status: 'active', admin: 'org2_admin' },
  { id: id(), name: 'Agrifattoria La Collina', lf: 'impresa_agricola', tc: 'AGRLCL112233445', vat: '11223344556',
    addr: 'Loc. Poggio delle Fonti 5', city: 'Arezzo', prov: 'AR', region: 'Toscana',
    lat: 43.4633, lng: 11.8799, email: 'info@agrifattoriacollina.it', web: 'www.agrifattoriacollina.it', phone: '+39 0575 345678',
    desc: 'Impresa agricola biologica con attività di orticoltura, apicoltura e fattoria didattica per inclusione sociale.',
    mgr: 'Stefano Landi', mgrRole: 'Direttore', status: 'active', admin: 'org3_admin' },
  { id: id(), name: 'Associazione Campo Sociale', lf: 'cooperativa_sociale', tc: 'ASSCSO556677889', vat: '55667788990',
    addr: 'Via della Resistenza 42', city: 'Modena', prov: 'MO', region: 'Emilia-Romagna',
    lat: 44.6471, lng: 10.9252, email: 'info@camposociale.it', web: 'www.camposociale.it', phone: '+39 059 345678',
    desc: 'Cooperativa sociale con attività educative e socio-ricreative in ambiente agricolo per minori e famiglie.',
    mgr: 'Paolo Ferrara', mgrRole: 'Presidente', status: 'active', admin: 'org4_admin' },
  { id: id(), name: 'Cascina del Sole', lf: 'impresa_agricola', tc: 'CSCSOL334455667', vat: '33445566778',
    addr: 'Cascina Rondò 12', city: 'Novara', prov: 'NO', region: 'Piemonte',
    lat: 45.4487, lng: 8.6217, email: 'info@cascinadelsole.it', web: 'www.cascinadelsole.it', phone: '+39 0321 456789',
    desc: 'Impresa agricola con risaia e frutteto che accoglie persone con disabilità in percorsi di inserimento lavorativo.',
    mgr: 'Laura Gatti', mgrRole: 'Responsabile inclusione', status: 'active', admin: 'org5_admin' },
  { id: id(), name: 'Fattoria della Speranza', lf: 'cooperativa_sociale', tc: 'FTSPE778899001', vat: '77889900112',
    addr: 'Località Poggio Alto 3', city: 'Reggio Emilia', prov: 'RE', region: 'Emilia-Romagna',
    lat: 44.6989, lng: 10.6297, email: 'info@fattoriasperanza.it', web: 'www.fattoriasperanza.it', phone: '+39 0522 567890',
    desc: 'Cooperativa sociale specializzata in percorsi terapeutici con animali e inserimento lavorativo.',
    mgr: 'Elena Russo', mgrRole: 'Direttrice', status: 'pending', admin: 'org6_admin' },
  { id: id(), name: 'Orto Sociale Bologna', lf: 'cooperativa_sociale', tc: 'ORTSBO998877665', vat: '99887766554',
    addr: 'Via San Donato 108', city: 'Bologna', prov: 'BO', region: 'Emilia-Romagna',
    lat: 44.4949, lng: 11.3426, email: 'info@ortosociale.it', web: 'www.ortosociale.it', phone: '+39 051 678901',
    desc: 'Cooperativa che gestisce orti urbani terapeutici per persone con problemi di salute mentale e anziani.',
    mgr: 'Francesco Romano', mgrRole: 'Responsabile area sociale', status: 'pending', admin: 'org7_admin' },
];

const insertOrg = db.prepare(`INSERT INTO organizations (id, name, legal_form, tax_code, vat_number, address, city, province, region, latitude, longitude, email, website, phone, description, social_manager_name, social_manager_role, status, admin_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
orgs.forEach(o => {
  insertOrg.run(o.id, o.name, o.lf, o.tc, o.vat, o.addr, o.city, o.prov, o.region, o.lat, o.lng, o.email, o.web, o.phone, o.desc, o.mgr, o.mgrRole, o.status, users[o.admin].id, datetime(200));
});

// Collega utenti alle organizzazioni (organization_id su users)
const updateUserOrg = db.prepare('UPDATE users SET organization_id = ? WHERE id = ?');
// org_admin → propria org
updateUserOrg.run(orgs[0].id, users.org1_admin.id);
updateUserOrg.run(orgs[1].id, users.org2_admin.id);
updateUserOrg.run(orgs[2].id, users.org3_admin.id);
updateUserOrg.run(orgs[3].id, users.org4_admin.id);
updateUserOrg.run(orgs[4].id, users.org5_admin.id);
updateUserOrg.run(orgs[5].id, users.org6_admin.id);
updateUserOrg.run(orgs[6].id, users.org7_admin.id);
// operatori → stessa org del loro org_admin
updateUserOrg.run(orgs[0].id, users.operator1.id); // Chiara → Terra Buona
updateUserOrg.run(orgs[1].id, users.operator2.id); // Davide → Il Vigneto
updateUserOrg.run(orgs[2].id, users.operator3.id); // Sara → La Collina

// ===================================================================
// SERVIZI E TARGET UTENZA (tutte le 7 org)
// ===================================================================
console.log('🏷️  Servizi e target utenza...');

const insertSvc = db.prepare('INSERT INTO organization_services (id, organization_id, service_type, description) VALUES (?, ?, ?, ?)');
const insertTgt = db.prepare('INSERT INTO organization_target_users (id, organization_id, target_type, notes) VALUES (?, ?, ?, ?)');

// Org 1 — Terra Buona
[['coterapia_piante','Orti terapeutici e piante aromatiche'],['inserimento_lavorativo','Lavoro agricolo protetto'],['socio_ricreativa','Attività ricreative all\'aperto']].forEach(([t,d]) => insertSvc.run(id(), orgs[0].id, t, d));
[['salute_mentale','Percorsi CSM Piacenza'],['disabili','Disabilità fisica e intellettiva'],['anziani','Anziani fragili']].forEach(([t,n]) => insertTgt.run(id(), orgs[0].id, t, n));

// Org 2 — Il Vigneto
[['coterapia_animali','Ippoterapia e pet therapy'],['inserimento_lavorativo','Vinificazione e lavoro in vigna'],['formazione','Corsi di viticoltura sociale']].forEach(([t,d]) => insertSvc.run(id(), orgs[1].id, t, d));
[['dipendenze','Percorsi SerD Parma'],['disabili','Disabilità psichica'],['salute_mentale','Utenti CSM Parma']].forEach(([t,n]) => insertTgt.run(id(), orgs[1].id, t, n));

// Org 3 — La Collina (Toscana)
[['coterapia_piante','Orticoltura e apicoltura'],['educativa','Fattoria didattica'],['formazione','Corsi trasformazione prodotti']].forEach(([t,d]) => insertSvc.run(id(), orgs[2].id, t, d));
[['minori','Minori in difficoltà'],['giovani','NEET e giovani a rischio'],['immigrati','Richiedenti asilo']].forEach(([t,n]) => insertTgt.run(id(), orgs[2].id, t, n));

// Org 4 — Campo Sociale
[['educativa','Attività educative in fattoria'],['socio_ricreativa','Campus estivi e laboratori'],['coterapia_piante','Orti sociali']].forEach(([t,d]) => insertSvc.run(id(), orgs[3].id, t, d));
[['minori','Minori segnalati dai servizi'],['giovani','Giovani drop-out scolastico'],['donne_violenza','Donne in percorsi di fuoriuscita']].forEach(([t,n]) => insertTgt.run(id(), orgs[3].id, t, n));

// Org 5 — Cascina del Sole (Piemonte)
[['inserimento_lavorativo','Lavoro in risaia e frutteto'],['coterapia_animali','Cura animali da cortile'],['formazione','Formazione professionale agricola']].forEach(([t,d]) => insertSvc.run(id(), orgs[4].id, t, d));
[['disabili','Disabilità intellettiva'],['detenuti_ex','Ex-detenuti in reinserimento']].forEach(([t,n]) => insertTgt.run(id(), orgs[4].id, t, n));

// Org 6 — Fattoria della Speranza (pending)
[['coterapia_animali','Terapia assistita con animali'],['inserimento_lavorativo','Lavoro agricolo'],['socio_ricreativa','Attività di gruppo']].forEach(([t,d]) => insertSvc.run(id(), orgs[5].id, t, d));
[['dipendenze','Tossicodipendenze e alcol'],['detenuti_ex','Detenuti in misura alternativa']].forEach(([t,n]) => insertTgt.run(id(), orgs[5].id, t, n));

// Org 7 — Orto Sociale Bologna (pending)
[['coterapia_piante','Orti terapeutici urbani'],['formazione','Formazione orticoltura'],['socio_ricreativa','Attività in giardino']].forEach(([t,d]) => insertSvc.run(id(), orgs[6].id, t, d));
[['salute_mentale','Percorsi DSM Bologna'],['anziani','Anziani RSA e centri diurni']].forEach(([t,n]) => insertTgt.run(id(), orgs[6].id, t, n));

// ===================================================================
// CERTIFICAZIONI
// Org 1-3: issued (audit 14C) | Org 4: audit_completed | Org 5: submitted
// Org 6-7 (pending): NESSUNA certificazione
// ===================================================================
console.log('📜 Creazione certificazioni...');

const insertCert = db.prepare(`INSERT INTO certifications (id, organization_id, cert_number, status, application_date, doc_review_date, doc_reviewer_id, issue_date, expiry_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const certs = [
  { id: id(), orgIdx: 0, num: 'GCF-2025-001', status: 'issued', appDate: date(180), reviewDate: date(170), issueDate: date(120), expiryDate: date(-975), notes: 'Piena conformità — tutti 14 requisiti conformi' },
  { id: id(), orgIdx: 1, num: 'GCF-2025-002', status: 'issued', appDate: date(150), reviewDate: date(140), issueDate: date(90), expiryDate: date(-1005), notes: 'Eccellente conformità riscontrata' },
  { id: id(), orgIdx: 2, num: 'GCF-2025-003', status: 'issued', appDate: date(130), reviewDate: date(120), issueDate: date(70), expiryDate: date(-1025), notes: 'Organizzazione toscana modello' },
  { id: id(), orgIdx: 3, num: 'GCF-2026-004', status: 'audit_completed', appDate: date(60), reviewDate: date(50), issueDate: null, expiryDate: null, notes: 'In attesa di decisione finale dopo audit' },
  { id: id(), orgIdx: 4, num: null, status: 'submitted', appDate: date(10), reviewDate: null, issueDate: null, expiryDate: null, notes: 'Domanda appena inviata' },
];

certs.forEach(c => {
  insertCert.run(c.id, orgs[c.orgIdx].id, c.num, c.status, c.appDate, c.reviewDate, c.reviewDate ? users.admin.id : null, c.issueDate, c.expiryDate, c.notes, datetime(180));
});

// ===================================================================
// AUDIT — 4 completati
// Cert 1-3: tutti 14C → conforming | Cert 4: 10C+2PC+2NA → with_actions
// ===================================================================
console.log('✅ Creazione audit...');

const insertAudit = db.prepare(`INSERT INTO audits (id, certification_id, auditor_id, audit_type, audit_mode, scheduled_date, completed_date, status, total_conforming, total_partially, total_non_conforming, total_not_applicable, outcome, auditor_notes, org_representative_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const audits = [
  { id: id(), certIdx: 0, auditor: 'auditor1', type: 'initial', mode: 'on_site', sched: date(130), compl: date(125), status: 'completed', c: 14, pc: 0, nc: 0, na: 0, outcome: 'conforming', notes: 'Piena conformità. Documentazione completa e aggiornata.', rep: 'Giuseppe Verdi' },
  { id: id(), certIdx: 1, auditor: 'auditor2', type: 'initial', mode: 'on_site', sched: date(100), compl: date(95), status: 'completed', c: 14, pc: 0, nc: 0, na: 0, outcome: 'conforming', notes: 'Piena conformità. Struttura molto ben organizzata.', rep: 'Maria Conti' },
  { id: id(), certIdx: 2, auditor: 'auditor1', type: 'initial', mode: 'mixed', sched: date(80), compl: date(75), status: 'completed', c: 14, pc: 0, nc: 0, na: 0, outcome: 'conforming', notes: 'Ottimo esempio di agricoltura sociale in Toscana.', rep: 'Stefano Landi' },
  { id: id(), certIdx: 3, auditor: 'auditor2', type: 'initial', mode: 'on_site', sched: date(40), compl: date(35), status: 'completed', c: 10, pc: 2, nc: 0, na: 2, outcome: 'conforming_with_actions', notes: 'Req. 3.3 e 4.2 parzialmente conformi. Procedure tutela e organigramma da completare.', rep: 'Paolo Ferrara' },
];

audits.forEach(a => {
  insertAudit.run(a.id, certs[a.certIdx].id, users[a.auditor].id, a.type, a.mode, a.sched, a.compl, a.status, a.c, a.pc, a.nc, a.na, a.outcome, a.notes, a.rep, datetime(130));
});

// ===================================================================
// VALUTAZIONI AUDIT — 14 requisiti per ciascun audit
// ===================================================================
console.log('📋 Creazione valutazioni audit...');

const insertEval = db.prepare(`INSERT INTO audit_evaluations (id, audit_id, requirement_id, area_number, requirement_number, evaluation, evidences_checked, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const requirements = db.prepare(`SELECT cr.id, cr.requirement_number, aa.area_number FROM certification_requirements cr JOIN audit_areas aa ON cr.area_id = aa.id ORDER BY cr.sort_order`).all();

const allC = {
  '1.1': { ch: ['Visura camerale','Statuto/Atto costitutivo','Fascicolo aziendale attivo','Codice ATECO coerente'], n: 'Soggetto legittimato' },
  '1.2': { ch: ['Descrizione servizi','Documento interno','Materiale informativo'], n: 'Servizi documentati' },
  '1.3': { ch: ['Nomina formale','Organigramma'], n: 'Responsabile designato' },
  '2.1': { ch: ['Progetti individuali','Convenzioni','Accordi con enti'], n: 'Progettazione strutturata' },
  '2.2': { ch: ['Registro attività','Report','Note di monitoraggio'], n: 'Monitoraggio regolare' },
  '2.3': { ch: ['Dichiarazione scritta','Politica inclusione/non discriminazione'], n: 'Impegno formalizzato' },
  '3.1': { ch: ['Titolo disponibilità locali','Documentazione edilizia','Documentazione igienico-sanitaria'], n: 'Struttura conforme' },
  '3.2': { ch: ['Autocertificazione','Documentazione sicurezza (DVR)'], n: 'DVR aggiornato' },
  '3.3': { ch: ['Procedure tutela utenti','Modalità operative','Supervisione'], n: 'Protocolli completi' },
  '3.4': { ch: ['Dichiarazione assenza cause interdittive','Autodichiarazione assenza condanne'], n: 'Dichiarazioni raccolte' },
  '4.1': { ch: ['Attestato formazione','Esperienza documentata ≥2 anni (CV, contratti/incarichi)'], n: 'Personale qualificato' },
  '4.2': { ch: ['Organigramma','Mansionari','Descrizione ruoli'], n: 'Organigramma completo' },
  '5.1': { ch: ['Dichiarazione firmata','Politica qualità'], n: 'Impegno sottoscritto' },
  '5.2': { ch: ['Registro aggiornamenti','Archivio documentale','Evidenza aggiornamento annuale'], n: 'Archivio organizzato' },
};

// Audit 1, 2, 3: tutti C
[0, 1, 2].forEach(ai => {
  requirements.forEach(r => {
    const cfg = allC[r.requirement_number];
    if (cfg) insertEval.run(id(), audits[ai].id, r.id, r.area_number, r.requirement_number, 'C', JSON.stringify(cfg.ch), cfg.n);
  });
});

// Audit 4: Campo Sociale — 10C + 2PC + 2NA
const a4 = {
  '1.1': { ev:'C', ch:['Visura camerale','Codice ATECO coerente'], n:'Regolarmente iscritta' },
  '1.2': { ev:'C', ch:['Descrizione servizi','Materiale informativo'], n:'Servizi documentati' },
  '1.3': { ev:'C', ch:['Nomina formale'], n:'Responsabile designato' },
  '2.1': { ev:'C', ch:['Progetti individuali','Accordi con enti'], n:'Progetti presenti' },
  '2.2': { ev:'C', ch:['Registro attività'], n:'Registro compilato' },
  '2.3': { ev:'C', ch:['Dichiarazione scritta'], n:'Dichiarazione inclusione nello statuto' },
  '3.1': { ev:'C', ch:['Titolo disponibilità locali'], n:'Locali in comodato d\'uso' },
  '3.2': { ev:'C', ch:['Autocertificazione','Documentazione sicurezza (DVR)'], n:'DVR presente' },
  '3.3': { ev:'PC', ch:['Modalità operative'], n:'Procedure tutela presenti ma non complete. Mancano protocolli emergenze.' },
  '3.4': { ev:'NA', ch:[], n:'Non applicabile in questa configurazione' },
  '4.1': { ev:'C', ch:['Attestato formazione'], n:'Personale qualificato' },
  '4.2': { ev:'PC', ch:['Organigramma'], n:'Organigramma incompleto. Mancano descrizioni ruoli operativi.' },
  '5.1': { ev:'C', ch:['Dichiarazione firmata'], n:'Impegno firmato dal presidente' },
  '5.2': { ev:'NA', ch:[], n:'Primo ciclo — non ancora applicabile' },
};
requirements.forEach(r => {
  const cfg = a4[r.requirement_number];
  if (cfg) insertEval.run(id(), audits[3].id, r.id, r.area_number, r.requirement_number, cfg.ev, JSON.stringify(cfg.ch), cfg.n);
});

// ===================================================================
// BENEFICIARI — SOLO org con cert ISSUED (1, 2, 3)
// ===================================================================
console.log('👥 Creazione beneficiari...');

const insertBen = db.prepare(`INSERT INTO beneficiaries (id, organization_id, code, target_type, referring_entity, referring_contact, ente_user_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const beneficiaries = [
  // Org 1 — Terra Buona (5 beneficiari)
  { id: id(), orgIdx: 0, code: 'TB-2025-001', type: 'salute_mentale', entity: 'CSM Piacenza', contact: 'Silvia Gallo', ente: 'ente1', status: 'active', days: 100 },
  { id: id(), orgIdx: 0, code: 'TB-2025-002', type: 'disabili', entity: 'AUSL Piacenza', contact: 'Dr. Bianchi', ente: null, status: 'active', days: 90 },
  { id: id(), orgIdx: 0, code: 'TB-2025-003', type: 'anziani', entity: 'Comune di Piacenza', contact: 'Servizi Sociali', ente: null, status: 'active', days: 80 },
  { id: id(), orgIdx: 0, code: 'TB-2025-004', type: 'salute_mentale', entity: 'CSM Piacenza', contact: 'Silvia Gallo', ente: 'ente1', status: 'completed', days: 110 },
  { id: id(), orgIdx: 0, code: 'TB-2025-005', type: 'disabili', entity: 'Coop. Sociale Amici', contact: 'Resp. area', ente: null, status: 'active', days: 30 },
  // Org 2 — Il Vigneto (4 beneficiari)
  { id: id(), orgIdx: 1, code: 'VG-2025-001', type: 'dipendenze', entity: 'SerD Parma', contact: 'Dr.ssa Ferri', ente: null, status: 'active', days: 85 },
  { id: id(), orgIdx: 1, code: 'VG-2025-002', type: 'disabili', entity: 'AUSL Parma', contact: 'Servizio Disabilità', ente: null, status: 'active', days: 75 },
  { id: id(), orgIdx: 1, code: 'VG-2025-003', type: 'salute_mentale', entity: 'CSM Parma', contact: 'Roberto Fontana', ente: 'ente2', status: 'active', days: 65 },
  { id: id(), orgIdx: 1, code: 'VG-2025-004', type: 'dipendenze', entity: 'SerD Parma', contact: 'Dr.ssa Ferri', ente: null, status: 'suspended', days: 90 },
  // Org 3 — La Collina, Toscana (4 beneficiari)
  { id: id(), orgIdx: 2, code: 'LC-2025-001', type: 'minori', entity: 'Comune di Arezzo', contact: 'Servizi Educativi', ente: null, status: 'active', days: 60 },
  { id: id(), orgIdx: 2, code: 'LC-2025-002', type: 'giovani', entity: 'Centro Impiego Arezzo', contact: 'Orientatore', ente: null, status: 'active', days: 50 },
  { id: id(), orgIdx: 2, code: 'LC-2025-003', type: 'immigrati', entity: 'ASL Arezzo', contact: 'Chiara Martini', ente: 'ente3', status: 'active', days: 40 },
  { id: id(), orgIdx: 2, code: 'LC-2025-004', type: 'minori', entity: 'Tribunale Minorenni', contact: 'Assistente sociale', ente: null, status: 'active', days: 55 },
];

beneficiaries.forEach(b => {
  const enteId = b.ente ? users[b.ente].id : null;
  insertBen.run(b.id, orgs[b.orgIdx].id, b.code, b.type, b.entity, b.contact, enteId, b.status, datetime(b.days));
});

// ===================================================================
// ATTIVITÀ — SOLO org con cert ISSUED (1, 2, 3), ultimi 60 giorni
// ===================================================================
console.log('📋 Creazione attività...');

const insertAct = db.prepare(`INSERT INTO activity_logs (id, organization_id, beneficiary_id, activity_date, service_type, duration_minutes, description, participants_count, operator_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const actDescs = {
  coterapia_piante: ['Semina e trapianto nell\'orto','Raccolta erbe aromatiche','Manutenzione aiuole','Potatura alberi','Laboratorio alimentare','Cura piantine in serra'],
  coterapia_animali: ['Pet therapy con cani','Accudimento animali','Attività in maneggio','Sessione con asini','Cura conigli','Grooming cavalli'],
  socio_ricreativa: ['Giardinaggio di gruppo','Laboratorio creativo','Passeggiata naturalistica','Giochi all\'aperto','Pic-nic sociale','Attività in fattoria'],
  educativa: ['Visita didattica','Laboratorio orticoltura','Lezione sulle api','Riconoscimento piante','Educazione ambientale','Laboratorio del pane'],
  inserimento_lavorativo: ['Lavorazione in cantina','Raccolta frutta','Preparazione cassette','Lavoro in vigna','Confezionamento','Manutenzione strutture'],
  formazione: ['Corso sicurezza','Workshop trasformazione','Formazione operatori','Corso viticoltura','Modulo comunicazione','Corso HACCP'],
};

const orgSvc = { 0: ['coterapia_piante','inserimento_lavorativo','socio_ricreativa'], 1: ['coterapia_animali','inserimento_lavorativo','formazione'], 2: ['coterapia_piante','educativa','formazione'] };
const orgOps = { 0: users.operator1.id, 1: users.operator2.id, 2: users.operator3.id };

for (let day = 0; day < 60; day++) {
  const dow = new Date(new Date().setDate(new Date().getDate() - day)).getDay();
  if (dow === 0) continue;
  beneficiaries.filter(b => b.status === 'active').forEach(ben => {
    if (Math.random() > 0.35) return;
    const svcs = orgSvc[ben.orgIdx];
    const svc = svcs[Math.floor(Math.random() * svcs.length)];
    const descs = actDescs[svc];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    const dur = [60,90,120,150,180,240][Math.floor(Math.random() * 6)];
    insertAct.run(id(), orgs[ben.orgIdx].id, ben.id, date(day), svc, dur, desc, 1, orgOps[ben.orgIdx], '');
  });
}

// ===================================================================
// RECENSIONI — solo org certificate (1, 2, 3)
// ===================================================================
console.log('⭐ Creazione recensioni...');

const insertReview = db.prepare(`INSERT INTO reviews (id, organization_id, author_name, author_role, rating, comment, is_published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

[
  { orgIdx: 0, author: 'Maria Bianchi', role: 'Familiare', rating: 5, comment: 'Mio padre ha trovato grande beneficio. Personale gentile e competente.', pub: 1, days: 20 },
  { orgIdx: 0, author: 'Luigi Costa', role: 'Volontario', rating: 4, comment: 'Esperienza molto positiva come volontario. Ben gestita.', pub: 1, days: 30 },
  { orgIdx: 1, author: 'Francesca Neri', role: 'Familiare', rating: 5, comment: 'Il percorso con gli animali ha fatto miracoli. Mio figlio è rinato.', pub: 1, days: 15 },
  { orgIdx: 1, author: 'Antonio Pellegrini', role: 'Operatore esterno', rating: 4, comment: 'Collaborazione ottima. Equipe competente.', pub: 1, days: 25 },
  { orgIdx: 2, author: 'Giulia Rossi', role: 'Insegnante', rating: 5, comment: 'Visita didattica splendida. I ragazzi hanno imparato tanto.', pub: 1, days: 10 },
  { orgIdx: 2, author: 'Marco Verdi', role: 'Genitore', rating: 4, comment: 'Il campus estivo è stato molto positivo per mia figlia.', pub: 1, days: 18 },
  { orgIdx: 0, author: 'Giovanna Marino', role: 'Utente pubblico', rating: 5, comment: 'Giornata aperta bellissima.', pub: 0, days: 2 },
  { orgIdx: 1, author: 'Sara Bianchi', role: 'Familiare', rating: 5, comment: 'Grazie per quello che fate.', pub: 0, days: 1 },
  { orgIdx: 2, author: 'Luca Marini', role: 'Educatore', rating: 4, comment: 'Struttura eccellente.', pub: 0, days: 3 },
].forEach(r => {
  insertReview.run(id(), orgs[r.orgIdx].id, r.author, r.role, r.rating, r.comment, r.pub, datetime(r.days));
});

// ===================================================================
// NOTIFICHE
// ===================================================================
console.log('📢 Creazione notifiche...');

const insertNotif = db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);

[
  { userId: users.admin.id, type: 'review', title: 'Recensioni da moderare', msg: '3 recensioni in attesa', read: 0, days: 1 },
  { userId: users.admin.id, type: 'certification', title: 'Nuova domanda', msg: 'Cascina del Sole ha inviato una domanda', read: 0, days: 10 },
  { userId: users.admin.id, type: 'certification', title: 'Audit completato', msg: 'Campo Sociale — in attesa di decisione', read: 0, days: 35 },
  { userId: users.admin.id, type: 'organization', title: 'Org in attesa', msg: '2 organizzazioni in attesa di verifica', read: 0, days: 3 },
  { userId: users.org4_admin.id, type: 'certification', title: 'Audit completato', msg: 'In attesa di decisione finale.', read: 0, days: 35 },
  { userId: users.org5_admin.id, type: 'certification', title: 'Domanda inviata', msg: 'In attesa di revisione documenti.', read: 0, days: 10 },
  { userId: users.org6_admin.id, type: 'organization', title: 'In attesa', msg: 'In attesa di verifica AICARE.', read: 0, days: 5 },
  { userId: users.org7_admin.id, type: 'organization', title: 'In attesa', msg: 'In attesa di verifica AICARE.', read: 0, days: 3 },
].forEach(n => { insertNotif.run(id(), n.userId, n.type, n.title, n.msg, n.read, datetime(n.days)); });

// ===================================================================
// AZIONI CORRETTIVE — solo audit 4 (Campo Sociale, 2 PC)
// ===================================================================
console.log('🔧 Creazione azioni correttive...');

const insertCA = db.prepare(`INSERT INTO corrective_actions (id, audit_id, evaluation_id, description, action_required, deadline, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
insertCA.run(id(), audits[3].id, null, 'Procedure di tutela incomplete — mancano protocolli emergenze', 'Completare le procedure con protocolli per gestione emergenze utenti fragili', date(-15), 'open', datetime(30));
insertCA.run(id(), audits[3].id, null, 'Organigramma incompleto — mancano descrizioni ruoli operativi', 'Completare organigramma con descrizioni dettagliate ruoli e responsabilità', date(-15), 'in_progress', datetime(30));

// ===================================================================
// RIEPILOGO
// ===================================================================
const actCount = db.prepare('SELECT COUNT(*) as n FROM activity_logs').get().n;

console.log('');
console.log('✅ Database popolato con successo!');
console.log('');
console.log('📊 Riepilogo:');
console.log(`   👤 ${Object.keys(users).length} utenti`);
console.log(`   🏠 ${orgs.length} organizzazioni (3 certificate, 2 in corso, 2 in attesa)`);
console.log(`   📜 ${certs.length} certificazioni (3 rilasciate, 1 audit completato, 1 inviata)`);
console.log(`   ✅ ${audits.length} audit (4 completati)`);
console.log(`   👥 ${beneficiaries.length} beneficiari (solo org certificate)`);
console.log(`   📋 ~${actCount} attività (solo org certificate)`);
console.log(`   ⭐ 9 recensioni (6 pubblicate, 3 da moderare)`);
console.log(`   🔧 2 azioni correttive (Campo Sociale)`);
console.log(`   🌍 3 regioni: Emilia-Romagna, Toscana, Piemonte`);
console.log('');
console.log('📏 REGOLE RISPETTATE:');
console.log('   ✓ Beneficiari/attività SOLO per org con cert issued (1, 2, 3)');
console.log('   ✓ Org 4 (audit_completed): NO beneficiari');
console.log('   ✓ Org 5 (submitted): NO beneficiari');
console.log('   ✓ Org 6-7 (pending): NO cert, NO beneficiari');
console.log('   ✓ Cert issued → audit TUTTI 14 requisiti C');
console.log('   ✓ ente_user_id: Gallo→TB-001/004, Fontana→VG-003, Martini→LC-003');
console.log('');
console.log('🔑 Credenziali:');
console.log('   Admin:         admin@gcf.it / admin123');
console.log('   Auditor 1:     luca.bianchi@gcf.it / auditor123');
console.log('   Auditor 2:     anna.moretti@gcf.it / auditor123');
console.log('   Org (cert.):   giuseppe.verdi@terrabuona.it / org12345');
console.log('   Org (cert.):   maria.conti@ilvigneto.it / org12345');
console.log('   Org (cert.):   stefano.landi@collina.it / org12345');
console.log('   Org (audit):   paolo.ferrara@camposociale.it / org12345');
console.log('   Org (inviata): laura.gatti@cascinadelsole.it / org12345');
console.log('   Org (pending): elena.russo@fattoriasperanza.it / org12345');
console.log('   Operatore:     chiara.esposito@terrabuona.it / oper1234');
console.log('   Ente Ref:      silvia.gallo@csmpiacenza.it / ente1234');
console.log('   Ente Ref:      chiara.martini@aslarezzo.it / ente1234');
console.log('   Pubblico:      giovanna.marino@gmail.com / user1234');

saveToFile();
console.log('💾 Database salvato su disco.');
}

seed().catch(e => { console.error('Errore seed:', e); process.exit(1); });
