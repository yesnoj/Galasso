/**
 * Seed - Dati dimostrativi per test pilota Piacenza
 */
const { initDb, getDb, closeDb } = require('./utils/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function main() {
  await initDb();
  const db = getDb();
  console.log('Inserimento dati dimostrativi...');

  const hash = bcrypt.hashSync('Password123!', 10);
  const adminId = uuidv4(), auditorId = uuidv4(), org1AdminId = uuidv4(), org2AdminId = uuidv4(), enteId = uuidv4();

  const iu = db.prepare('INSERT INTO users (id,email,password_hash,role,first_name,last_name,phone,is_active,email_verified) VALUES (?,?,?,?,?,?,?,1,1)');
  iu.run(adminId,'admin@aicare.it',hash,'admin','Marco','Rossi','0523000001');
  iu.run(auditorId,'auditor@aicare.it',hash,'auditor','Laura','Bianchi','0523000002');
  iu.run(org1AdminId,'cascina@demo.it',hash,'org_admin','Giuseppe','Verdi','0523000003');
  iu.run(org2AdminId,'fattoria@demo.it',hash,'org_admin','Anna','Neri','0523000004');
  iu.run(enteId,'servizi@comune.piacenza.it',hash,'ente_referente','Paolo','Colombo','0523000005');

  const org1Id = uuidv4(), org2Id = uuidv4(), org3Id = uuidv4();
  const io = db.prepare('INSERT INTO organizations (id,name,legal_form,tax_code,address,city,province,region,latitude,longitude,phone,email,description,social_manager_name,social_manager_role,status,admin_user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  io.run(org1Id,'Cascina Verde Sociale','cooperativa_sociale','01234567890','Via della Campagna 15','Piacenza','PC','Emilia-Romagna',45.0526,9.693,'0523 111222','info@cascinaverdesociale.it','Cooperativa sociale che opera dal 2015 nell agricoltura sociale con focus su inserimento lavorativo e percorsi riabilitativi. 12 ettari coltivati a ortaggi biologici.','Maria Conti','Responsabile servizi sociali','active',org1AdminId);
  io.run(org2Id,'Fattoria Didattica Il Gelso','azienda_agricola','09876543210','Strada Provinciale 42','Rivergaro','PC','Emilia-Romagna',44.9067,9.5975,'0523 333444','info@ilgelso.it','Azienda agricola a conduzione familiare con attività didattiche e socio-ricreative per minori e anziani.','Anna Neri','Titolare','active',org2AdminId);
  io.run(org3Id,'Orto Comune di Borgonovo','associazione','11223344556','Via Roma 8','Borgonovo Val Tidone','PC','Emilia-Romagna',44.9879,9.4522,'0523 555666','ortocomune@gmail.com','Associazione che gestisce orti comunitari per anziani e persone con disagio socio-economico.','Luca Ferraris','Presidente','pending',null);

  const is = db.prepare('INSERT INTO organization_services (id,organization_id,service_type,description) VALUES (?,?,?,?)');
  is.run(uuidv4(),org1Id,'inserimento_lavorativo','Percorsi di inserimento lavorativo in orticoltura');
  is.run(uuidv4(),org1Id,'coterapia_piante','Ortoterapia per utenti salute mentale');
  is.run(uuidv4(),org1Id,'formazione','Corsi di orticoltura biologica');
  is.run(uuidv4(),org2Id,'educativa','Laboratori didattici per scuole');
  is.run(uuidv4(),org2Id,'socio_ricreativa','Attività per anziani');
  is.run(uuidv4(),org2Id,'coterapia_animali','Attività assistite con animali');
  is.run(uuidv4(),org3Id,'socio_ricreativa','Orti comunitari');
  is.run(uuidv4(),org3Id,'formazione','Corsi base orticoltura');

  const it = db.prepare('INSERT INTO organization_target_users (id,organization_id,target_type,notes) VALUES (?,?,?,?)');
  it.run(uuidv4(),org1Id,'disabili','Disabilità intellettiva e fisica');
  it.run(uuidv4(),org1Id,'salute_mentale','Utenti CSM Piacenza');
  it.run(uuidv4(),org1Id,'disagio_socioeconomico','Adulti in difficoltà');
  it.run(uuidv4(),org2Id,'minori','Scuole primarie e secondarie');
  it.run(uuidv4(),org2Id,'anziani','Centri diurni anziani');
  it.run(uuidv4(),org3Id,'anziani','Anziani del territorio');
  it.run(uuidv4(),org3Id,'disagio_socioeconomico',null);

  const cert1Id = uuidv4(), cert2Id = uuidv4();
  const ic = db.prepare('INSERT INTO certifications (id,organization_id,cert_number,status,application_date,issue_date,expiry_date) VALUES (?,?,?,?,?,?,?)');
  ic.run(cert1Id,org1Id,'GCF-2026-001','issued','2026-01-15','2026-02-10','2029-02-10');
  ic.run(cert2Id,org2Id,null,'submitted','2026-02-01',null,null);

  const audit1Id = uuidv4();
  db.prepare('INSERT INTO audits (id,certification_id,auditor_id,audit_type,audit_mode,scheduled_date,completed_date,status,total_conforming,total_partially,total_non_conforming,total_not_applicable,outcome) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(audit1Id,cert1Id,auditorId,'initial','on_site','2026-02-05','2026-02-05','completed',9,1,0,0,'conforming_with_actions');

  const ie = db.prepare('INSERT INTO audit_evaluations (id,audit_id,requirement_id,area_number,requirement_number,evaluation,evidences_checked,notes) VALUES (?,?,?,?,?,?,?,?)');
  ie.run(uuidv4(),audit1Id,'req-1-1',1,'1.1','C','["Descrizione servizi","Documento interno"]','Documentazione completa');
  ie.run(uuidv4(),audit1Id,'req-1-2',1,'1.2','C','["Nomina formale","Organigramma"]','Responsabile identificato');
  ie.run(uuidv4(),audit1Id,'req-2-1',2,'2.1','C','["Progetti individuali","Convenzioni"]','Progetti ben strutturati');
  ie.run(uuidv4(),audit1Id,'req-2-2',2,'2.2','C','["Registro attività","Report"]','Monitoraggio regolare');
  ie.run(uuidv4(),audit1Id,'req-2-3',2,'2.3','C','["Dichiarazione scritta"]','Politica inclusione presente');
  ie.run(uuidv4(),audit1Id,'req-3-1',3,'3.1','C','["Documentazione sicurezza"]','DVR aggiornato');
  ie.run(uuidv4(),audit1Id,'req-3-2',3,'3.2','PC','["Procedure"]','Procedure da formalizzare meglio');
  ie.run(uuidv4(),audit1Id,'req-4-1',4,'4.1','C','["CV","Formazione"]','Personale qualificato');
  ie.run(uuidv4(),audit1Id,'req-4-2',4,'4.2','C','["Organigramma","Descrizione ruoli"]','Struttura chiara');
  ie.run(uuidv4(),audit1Id,'req-5-1',5,'5.1','C','["Dichiarazione firmata"]','Impegno sottoscritto');

  db.prepare('INSERT INTO corrective_actions (id,audit_id,description,action_required,deadline,status) VALUES (?,?,?,?,?,?)').run(uuidv4(),audit1Id,'Procedure di tutela non completamente formalizzate','Formalizzare le procedure in documento scritto','2026-05-05','open');

  const ben1Id = uuidv4(), ben2Id = uuidv4();
  const ib = db.prepare('INSERT INTO beneficiaries (id,organization_id,code,target_type,referring_entity,status,start_date) VALUES (?,?,?,?,?,?,?)');
  ib.run(ben1Id,org1Id,'BEN-2026-001','disabili','CSM Piacenza','active','2026-01-20');
  ib.run(ben2Id,org1Id,'BEN-2026-002','salute_mentale','CSM Piacenza','active','2026-02-01');

  db.prepare('INSERT INTO individual_projects (id,beneficiary_id,title,objectives,activities_planned,start_date,status) VALUES (?,?,?,?,?,?,?)').run(uuidv4(),ben1Id,'Percorso orticoltura assistita','Sviluppo autonomie lavorative','Coltivazione orto, raccolta, confezionamento','2026-01-20','active');

  const il = db.prepare('INSERT INTO activity_logs (id,organization_id,beneficiary_id,activity_date,service_type,duration_minutes,description,operator_id) VALUES (?,?,?,?,?,?,?,?)');
  il.run(uuidv4(),org1Id,ben1Id,'2026-02-10','inserimento_lavorativo',240,'Semina pomodori in serra',org1AdminId);
  il.run(uuidv4(),org1Id,ben1Id,'2026-02-11','inserimento_lavorativo',240,'Preparazione terreno orto',org1AdminId);
  il.run(uuidv4(),org1Id,ben2Id,'2026-02-10','coterapia_piante',120,'Attività di ortoterapia di gruppo',org1AdminId);
  il.run(uuidv4(),org1Id,ben2Id,'2026-02-12','coterapia_piante',120,'Raccolta erbe aromatiche',org1AdminId);

  console.log('Utenti demo:');
  console.log('  admin@aicare.it / Password123!');
  console.log('  auditor@aicare.it / Password123!');
  console.log('  cascina@demo.it / Password123!');
  console.log('  fattoria@demo.it / Password123!');
  console.log('  servizi@comune.piacenza.it / Password123!');

  closeDb();
  console.log('Seed completato!');
}

main().catch(e => { console.error('Errore seed:', e); process.exit(1); });
