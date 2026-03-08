/**
 * GCF Platform - Database Initialization
 */
const { initDb, getDb, closeDb } = require('./utils/database');

async function main() {
  console.log('Inizializzazione database GCF...');
  await initDb();
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      phone TEXT, organization_id TEXT, is_active INTEGER DEFAULT 1, email_verified INTEGER DEFAULT 0,
      last_login TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_form TEXT NOT NULL,
      tax_code TEXT UNIQUE, vat_number TEXT, address TEXT NOT NULL,
      city TEXT NOT NULL, province TEXT NOT NULL, postal_code TEXT, region TEXT NOT NULL,
      latitude REAL, longitude REAL, phone TEXT, email TEXT, website TEXT,
      description TEXT, social_manager_name TEXT, social_manager_role TEXT,
      status TEXT DEFAULT 'pending', admin_user_id TEXT, logo_path TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS organization_services (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, service_type TEXT NOT NULL,
      description TEXT, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS organization_target_users (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, target_type TEXT NOT NULL,
      notes TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS organization_images (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, file_path TEXT NOT NULL,
      caption TEXT, is_primary INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS organization_documents (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, document_type TEXT NOT NULL,
      file_path TEXT NOT NULL, file_name TEXT NOT NULL, file_size INTEGER,
      uploaded_by TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, cert_number TEXT UNIQUE,
      status TEXT DEFAULT 'draft', application_date TEXT, doc_review_date TEXT,
      doc_reviewer_id TEXT, audit_date TEXT, decision_date TEXT,
      issue_date TEXT, expiry_date TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS certification_documents (
      id TEXT PRIMARY KEY, certification_id TEXT NOT NULL, requirement_id TEXT NOT NULL,
      document_type TEXT NOT NULL, file_path TEXT NOT NULL, file_name TEXT NOT NULL,
      file_size INTEGER, uploaded_by TEXT, status TEXT DEFAULT 'pending', reviewer_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY, certification_id TEXT NOT NULL, auditor_id TEXT NOT NULL,
      audit_type TEXT NOT NULL, audit_mode TEXT DEFAULT 'on_site',
      scheduled_date TEXT, completed_date TEXT, status TEXT DEFAULT 'planned',
      total_conforming INTEGER DEFAULT 0, total_partially INTEGER DEFAULT 0,
      total_non_conforming INTEGER DEFAULT 0, total_not_applicable INTEGER DEFAULT 0,
      outcome TEXT, auditor_notes TEXT, auditor_signature TEXT,
      org_representative_name TEXT, org_representative_signature TEXT, signed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_evaluations (
      id TEXT PRIMARY KEY, audit_id TEXT NOT NULL, requirement_id TEXT NOT NULL,
      area_number INTEGER NOT NULL, requirement_number TEXT NOT NULL,
      evaluation TEXT, evidences_checked TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(audit_id, requirement_id)
    );
    CREATE TABLE IF NOT EXISTS audit_attachments (
      id TEXT PRIMARY KEY, audit_id TEXT NOT NULL, evaluation_id TEXT,
      file_path TEXT NOT NULL, file_name TEXT NOT NULL, file_size INTEGER,
      description TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS corrective_actions (
      id TEXT PRIMARY KEY, audit_id TEXT NOT NULL, evaluation_id TEXT,
      description TEXT NOT NULL, action_required TEXT NOT NULL, deadline TEXT,
      status TEXT DEFAULT 'open', completion_notes TEXT, verified_by TEXT,
      verified_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, code TEXT NOT NULL,
      target_type TEXT, referring_entity TEXT, referring_contact TEXT,
      ente_user_id TEXT,
      status TEXT DEFAULT 'active', start_date TEXT, end_date TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(organization_id, code)
    );
    CREATE TABLE IF NOT EXISTS individual_projects (
      id TEXT PRIMARY KEY, beneficiary_id TEXT NOT NULL, title TEXT NOT NULL,
      objectives TEXT, activities_planned TEXT, start_date TEXT,
      expected_end_date TEXT, actual_end_date TEXT, status TEXT DEFAULT 'active',
      outcome_notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, beneficiary_id TEXT,
      activity_date TEXT NOT NULL, service_type TEXT, duration_minutes INTEGER,
      description TEXT NOT NULL, participants_count INTEGER DEFAULT 1,
      operator_id TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS monitoring_reports (
      id TEXT PRIMARY KEY, beneficiary_id TEXT NOT NULL, report_date TEXT NOT NULL,
      author_id TEXT, period_from TEXT, period_to TEXT,
      progress_notes TEXT, issues TEXT, next_steps TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS partner_entities (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, entity_type TEXT,
      contact_person TEXT, email TEXT, phone TEXT, address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS organization_partners (
      organization_id TEXT NOT NULL, partner_id TEXT NOT NULL,
      partnership_type TEXT, start_date TEXT,
      PRIMARY KEY(organization_id, partner_id)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, author_name TEXT NOT NULL,
      author_role TEXT, rating INTEGER NOT NULL, comment TEXT,
      is_published INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT, event_date TEXT NOT NULL, event_time TEXT,
      location TEXT, is_public INTEGER DEFAULT 1, max_participants INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
      message TEXT NOT NULL, type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0,
      link TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL,
      entity_type TEXT, entity_id TEXT, details TEXT, ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_areas (
      id TEXT PRIMARY KEY, area_number INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL, description TEXT
    );
    CREATE TABLE IF NOT EXISTS certification_requirements (
      id TEXT PRIMARY KEY, area_id TEXT NOT NULL, requirement_number TEXT NOT NULL,
      title TEXT NOT NULL, description TEXT NOT NULL, verification_question TEXT NOT NULL,
      acceptable_evidences TEXT NOT NULL, is_mandatory INTEGER DEFAULT 1, sort_order INTEGER NOT NULL
    );
  `);

  console.log('Tabelle create.');

  // Migrazione: aggiunge ente_user_id se non esiste (per database esistenti)
  try {
    db.prepare("SELECT ente_user_id FROM beneficiaries LIMIT 1").get();
  } catch (e) {
    console.log('Migrazione: aggiunta colonna ente_user_id a beneficiaries...');
    db.exec("ALTER TABLE beneficiaries ADD COLUMN ente_user_id TEXT");
  }

  // Migrazione: aggiunge organization_id a users (per database esistenti)
  try {
    db.prepare("SELECT organization_id FROM users LIMIT 1").get();
  } catch (e) {
    console.log('Migrazione: aggiunta colonna organization_id a users...');
    db.exec("ALTER TABLE users ADD COLUMN organization_id TEXT");
    // Popola organization_id dagli admin_user_id esistenti
    const orgs = db.prepare("SELECT id, admin_user_id FROM organizations WHERE admin_user_id IS NOT NULL").all();
    const updateUser = db.prepare("UPDATE users SET organization_id = ? WHERE id = ?");
    orgs.forEach(org => {
      updateUser.run(org.id, org.admin_user_id);
    });
    if (orgs.length > 0) console.log(`Migrazione: ${orgs.length} utenti collegati alle organizzazioni.`);
  }

  // Dati di riferimento — Standard SNM-AS (14 requisiti, 5 aree)
  const areas = [
    ['area-1', 1, 'Identità giuridica e trasparenza', 'Identità giuridica e trasparenza dell organizzazione'],
    ['area-2', 2, 'Gestione delle attività sociali', 'Gestione delle attività sociali'],
    ['area-3', 3, 'Sicurezza, tutela e affidabilità', 'Sicurezza, tutela e affidabilità'],
    ['area-4', 4, 'Competenze e organizzazione', 'Competenze e organizzazione'],
    ['area-5', 5, 'Impegno alla qualità', 'Impegno alla qualità']
  ];
  areas.forEach(a => {
    db.prepare('INSERT OR IGNORE INTO audit_areas (id, area_number, name, description) VALUES (?, ?, ?, ?)').run(...a);
  });

  const reqs = [
    // AREA 1 — Identità giuridica e trasparenza (3 requisiti)
    ['req-1-1','area-1','1.1','Soggetto legittimato','L organizzazione deve rientrare tra i soggetti ammessi ai sensi della L. 141/2015 ed essere regolarmente iscritta.','L organizzazione rientra tra i soggetti ammessi ai sensi della L. 141/2015 ed è regolarmente iscritta?','["Visura camerale","Statuto/Atto costitutivo","Fascicolo aziendale attivo","Codice ATECO coerente"]',1,1],
    ['req-1-2','area-1','1.2','Definizione dei servizi','L organizzazione deve documentare i servizi di agricoltura sociale offerti.','L organizzazione ha documentato i servizi di agricoltura sociale offerti, includendo tipologia di servizi, destinatari, obiettivi e modalità di erogazione?','["Descrizione servizi","Documento interno","Materiale informativo"]',1,2],
    ['req-1-3','area-1','1.3','Responsabile dei servizi','L organizzazione deve designare almeno un responsabile dei servizi.','È stato designato un responsabile dei servizi di agricoltura sociale?','["Nomina formale","Organigramma","Dichiarazione organizzazione"]',1,3],
    // AREA 2 — Gestione delle attività sociali (3 requisiti)
    ['req-2-1','area-2','2.1','Progettazione delle attività','Per ogni attività sociale deve esistere documentazione.','Sono presenti progetti, accordi formalizzati o documentazione equivalente per le attività sociali?','["Progetti individuali","Convenzioni","Accordi con enti","Documentazione equivalente"]',1,4],
    ['req-2-2','area-2','2.2','Monitoraggio delle attività','L organizzazione deve monitorare le attività.','L organizzazione monitora le attività?','["Registro attività","Report","Note di monitoraggio"]',1,5],
    ['req-2-3','area-2','2.3','Impegno all inclusione','L organizzazione deve adottare un impegno formale all inclusione.','L organizzazione ha adottato un impegno formale all inclusione?','["Dichiarazione scritta","Politica inclusione/non discriminazione"]',1,6],
    // AREA 3 — Sicurezza, tutela e affidabilità (4 requisiti)
    ['req-3-1','area-3','3.1','Conformità strutturale','Deve esistere documentazione inerente ai locali utilizzati per lo svolgimento delle attività sociali.','Esiste la documentazione inerente ai locali utilizzati per lo svolgimento delle attività sociali?','["Titolo disponibilità locali","Documentazione edilizia","Documentazione igienico-sanitaria"]',1,7],
    ['req-3-2','area-3','3.2','Sicurezza sul lavoro','Rispetto normativa sicurezza sul lavoro.','L organizzazione rispetta la normativa sulla sicurezza sul lavoro?','["Autocertificazione","Documentazione sicurezza (DVR)"]',1,8],
    ['req-3-3','area-3','3.3','Tutela delle persone coinvolte','Adeguate misure di tutela.','Sono presenti misure di tutela adeguate?','["Procedure tutela utenti","Modalità operative","Supervisione"]',1,9],
    ['req-3-4','area-3','3.4','Affidabilità e onorabilità','Devono essere garantiti requisiti di affidabilità.','Sono garantiti requisiti di affidabilità?','["Dichiarazione assenza cause interdittive","Autodichiarazione assenza condanne"]',1,10],
    // AREA 4 — Competenze e organizzazione (2 requisiti)
    ['req-4-1','area-4','4.1','Competenze','Deve essere presente almeno un referente qualificato con formazione o esperienza documentata di almeno 2 anni.','È presente almeno un referente qualificato con formazione o esperienza ≥2 anni?','["Attestato formazione","Esperienza documentata ≥2 anni (CV, contratti/incarichi)"]',1,11],
    ['req-4-2','area-4','4.2','Organizzazione','Ruoli e responsabilità definiti.','Sono formalizzati ruoli e responsabilità?','["Organigramma","Mansionari","Descrizione ruoli"]',1,12],
    // AREA 5 — Impegno alla qualità (2 requisiti)
    ['req-5-1','area-5','5.1','Impegno formale','Dichiarazione di impegno allo standard.','L organizzazione ha sottoscritto una dichiarazione di impegno allo standard?','["Dichiarazione firmata","Politica qualità"]',1,13],
    ['req-5-2','area-5','5.2','Aggiornamento e trasparenza documentale','La documentazione deve essere aggiornata, disponibile e verificabile.','La documentazione è aggiornata, disponibile e verificabile?','["Registro aggiornamenti","Archivio documentale","Evidenza aggiornamento annuale"]',1,14]
  ];
  reqs.forEach(r => {
    db.prepare('INSERT OR IGNORE INTO certification_requirements (id,area_id,requirement_number,title,description,verification_question,acceptable_evidences,is_mandatory,sort_order) VALUES (?,?,?,?,?,?,?,?,?)').run(...r);
  });

  console.log('Dati di riferimento inseriti (5 aree, 14 requisiti SNM-AS).');
  closeDb();
  console.log('Database inizializzato:', require('path').resolve(process.env.DB_PATH || './db/gcf.sqlite'));
}

main().catch(e => { console.error('Errore init:', e); process.exit(1); });
