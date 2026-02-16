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
      phone TEXT, is_active INTEGER DEFAULT 1, email_verified INTEGER DEFAULT 0,
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

  // Dati di riferimento
  const areas = [
    ['area-1', 1, 'Identità e trasparenza', 'Identità e trasparenza dell organizzazione'],
    ['area-2', 2, 'Gestione delle attività sociali', 'Gestione delle attività sociali'],
    ['area-3', 3, 'Sicurezza e tutela', 'Sicurezza e tutela'],
    ['area-4', 4, 'Competenze e organizzazione', 'Competenze e organizzazione'],
    ['area-5', 5, 'Impegno alla qualità', 'Impegno alla qualità']
  ];
  areas.forEach(a => {
    db.prepare('INSERT OR IGNORE INTO audit_areas (id, area_number, name, description) VALUES (?, ?, ?, ?)').run(...a);
  });

  const reqs = [
    ['req-1-1','area-1','1.1','Definizione dei servizi','L organizzazione deve documentare i servizi di agricoltura sociale offerti.','L organizzazione ha documentato i servizi di agricoltura sociale offerti, includendo tipologia di servizi, destinatari, obiettivi e modalità di erogazione?','["Descrizione servizi","Documento interno","Materiale informativo"]',1,1],
    ['req-1-2','area-1','1.2','Responsabile dei servizi','L organizzazione deve designare almeno un responsabile dei servizi.','È stato designato un responsabile dei servizi di agricoltura sociale?','["Nomina formale","Organigramma","Dichiarazione organizzazione"]',1,2],
    ['req-2-1','area-2','2.1','Progettazione delle attività','Per ogni attività sociale deve esistere documentazione.','Sono presenti progetti, accordi o documentazione equivalente per le attività sociali?','["Progetti individuali","Convenzioni","Accordi con enti","Documentazione equivalente"]',1,3],
    ['req-2-2','area-2','2.2','Monitoraggio delle attività','L organizzazione deve monitorare le attività.','L organizzazione monitora le attività sociali?','["Registro attività","Report","Note di monitoraggio"]',1,4],
    ['req-2-3','area-2','2.3','Impegno all inclusione','L organizzazione deve adottare un impegno formale.','L organizzazione ha adottato un impegno formale all inclusione?','["Dichiarazione scritta","Politica interna"]',1,5],
    ['req-3-1','area-3','3.1','Sicurezza sul lavoro','Rispetto normativa sicurezza sul lavoro.','L organizzazione rispetta la normativa sulla sicurezza sul lavoro?','["Autocertificazione","Documentazione sicurezza"]',1,6],
    ['req-3-2','area-3','3.2','Tutela delle persone coinvolte','Adeguate misure di tutela.','Sono presenti misure adeguate di tutela?','["Procedure","Modalità operative"]',1,7],
    ['req-4-1','area-4','4.1','Competenze','Competenze adeguate per erogazione servizi.','Sono presenti competenze adeguate?','["CV","Formazione","Esperienza documentata"]',1,8],
    ['req-4-2','area-4','4.2','Organizzazione','Ruoli e responsabilità definiti.','Sono definiti ruoli e responsabilità?','["Organigramma","Descrizione ruoli"]',1,9],
    ['req-5-1','area-5','5.1','Impegno formale','Dichiarazione di impegno allo standard.','L organizzazione ha sottoscritto l impegno allo standard?','["Dichiarazione firmata"]',1,10]
  ];
  reqs.forEach(r => {
    db.prepare('INSERT OR IGNORE INTO certification_requirements (id,area_id,requirement_number,title,description,verification_question,acceptable_evidences,is_mandatory,sort_order) VALUES (?,?,?,?,?,?,?,?,?)').run(...r);
  });

  console.log('Dati di riferimento inseriti.');
  closeDb();
  console.log('Database inizializzato:', require('path').resolve(process.env.DB_PATH || './db/gcf.sqlite'));
}

main().catch(e => { console.error('Errore init:', e); process.exit(1); });
