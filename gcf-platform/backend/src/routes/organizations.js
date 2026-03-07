/**
 * Routes - Organizzazioni
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDb } = require('../utils/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Configure multer for organization document uploads
const orgUploadDir = process.env.UPLOAD_DIR 
  ? path.join(process.env.UPLOAD_DIR, 'organizations')
  : path.join(__dirname, '..', '..', 'uploads', 'organizations');
if (!fs.existsSync(orgUploadDir)) fs.mkdirSync(orgUploadDir, { recursive: true });

const orgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, orgUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuidv4().slice(0,8)}.pdf`)
});
const orgUpload = multer({
  storage: orgStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo file PDF ammessi'));
  }
});

// ===== Validazione Codice Fiscale e Partita IVA =====
function isValidCodiceFiscale(cf) {
  if (!cf) return true;
  cf = cf.toUpperCase().trim();
  if (cf.length !== 16) return false;
  if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) return false;
  
  const oddMap = {
    '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
    'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,
    'K':2,'L':4,'M':18,'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,
    'U':16,'V':10,'W':22,'X':25,'Y':24,'Z':23
  };
  const evenMap = {
    '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
    'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,
    'K':10,'L':11,'M':12,'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,
    'U':20,'V':21,'W':22,'X':23,'Y':24,'Z':25
  };
  
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += (i % 2 === 0) ? oddMap[cf[i]] : evenMap[cf[i]];
  }
  return cf[15] === String.fromCharCode(65 + (sum % 26));
}

function isValidPartitaIVA(pi) {
  if (!pi) return true;
  pi = pi.trim();
  if (pi.length !== 11 || !/^\d{11}$/.test(pi)) return false;
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(pi[i]);
    if (i % 2 === 0) { sum += digit; }
    else { const d = digit * 2; sum += d > 9 ? d - 9 : d; }
  }
  return sum % 10 === 0;
}

// GET /api/organizations - Lista (con filtri)
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, region, province, city, service_type, target_type, search } = req.query;
    
    let where = ['1=1'];
    let params = [];

    // Solo admin e auditor vedono tutte, org_admin/org_operator vedono la propria, gli altri solo active
    if (!req.user || !['admin', 'auditor', 'org_admin', 'org_operator'].includes(req.user.role)) {
      where.push("o.status = 'active'");
    } else if (['admin', 'auditor'].includes(req.user?.role) && status) {
      where.push('o.status = ?');
      params.push(status);
    }

    // org_admin e org_operator vedono solo la propria organizzazione
    if (req.user && ['org_admin', 'org_operator'].includes(req.user.role)) {
      where.push('o.admin_user_id = ?');
      params.push(req.user.id);
    }

    if (region) { where.push('o.region = ?'); params.push(region); }
    if (province) { where.push('o.province = ?'); params.push(province); }
    if (city) { where.push('o.city = ?'); params.push(city); }
    if (search) { where.push("(o.name LIKE ? OR o.city LIKE ? OR o.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    if (service_type) {
      where.push("EXISTS (SELECT 1 FROM organization_services os WHERE os.organization_id = o.id AND os.service_type = ?)");
      params.push(service_type);
    }
    if (target_type) {
      where.push("EXISTS (SELECT 1 FROM organization_target_users ot WHERE ot.organization_id = o.id AND ot.target_type = ?)");
      params.push(target_type);
    }

    const countSql = `SELECT COUNT(*) as total FROM organizations o WHERE ${where.join(' AND ')}`;
    const total = db.prepare(countSql).get(...params).total;

    const sql = `
      SELECT o.*, 
        (SELECT AVG(r.rating) FROM reviews r WHERE r.organization_id = o.id AND r.is_published = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.organization_id = o.id AND r.is_published = 1) as review_count
      FROM organizations o 
      WHERE ${where.join(' AND ')}
      ORDER BY o.name
    `;

    const orgs = db.prepare(sql).all(...params);

    // Aggiungi servizi e target per ogni org
    const getServices = db.prepare('SELECT service_type, description FROM organization_services WHERE organization_id = ?');
    const getTargets = db.prepare('SELECT target_type, notes FROM organization_target_users WHERE organization_id = ?');

    const results = orgs.map(org => ({
      ...org,
      services: getServices.all(org.id),
      targets: getTargets.all(org.id)
    }));

    res.json({ data: results, total });
  } catch (err) {
    console.error('Get organizations error:', err);
    res.status(500).json({ error: 'Errore nel recupero organizzazioni' });
  }
});

// GET /api/organizations/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });

    const services = db.prepare('SELECT * FROM organization_services WHERE organization_id = ?').all(org.id);
    const targets = db.prepare('SELECT * FROM organization_target_users WHERE organization_id = ?').all(org.id);
    const images = db.prepare('SELECT * FROM organization_images WHERE organization_id = ?').all(org.id);
    const reviews = db.prepare('SELECT * FROM reviews WHERE organization_id = ? AND is_published = 1 ORDER BY created_at DESC').all(org.id);
    const events = db.prepare("SELECT * FROM events WHERE organization_id = ? AND event_date >= date('now') ORDER BY event_date").all(org.id);

    // Certificazione attiva?
    const certification = db.prepare(`
      SELECT id, cert_number, status, issue_date, expiry_date 
      FROM certifications WHERE organization_id = ? AND status = 'issued'
      ORDER BY issue_date DESC LIMIT 1
    `).get(org.id);

    res.json({ ...org, services, targets, images, reviews, events, certification });
  } catch (err) {
    console.error('Get organization error:', err);
    res.status(500).json({ error: 'Errore nel recupero organizzazione' });
  }
});

// POST /api/organizations
router.post('/', authenticate, authorize('org_admin'), (req, res) => {
  try {
    const db = getDb();

    // Verifica che l'org_admin non abbia già un'organizzazione
    const existing = db.prepare('SELECT id FROM organizations WHERE admin_user_id = ?').get(req.user.id);
    if (existing) {
      return res.status(409).json({ error: 'Hai già un\'organizzazione associata' });
    }

    const {
      name, legalForm, taxCode, vatNumber, address, city, province, postalCode, region,
      latitude, longitude, phone, email, website, description,
      socialManagerName, socialManagerRole, services, targets
    } = req.body;

    if (!name || !legalForm || !address || !city || !province || !region) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti: nome, forma giuridica, indirizzo, città, provincia, regione' });
    }

    // Validazione Codice Fiscale e Partita IVA
    if (taxCode && !isValidCodiceFiscale(taxCode)) {
      return res.status(400).json({ error: 'Codice fiscale non valido. Deve essere di 16 caratteri con formato e carattere di controllo corretti.' });
    }
    if (vatNumber && !isValidPartitaIVA(vatNumber)) {
      return res.status(400).json({ error: 'Partita IVA non valida. Deve essere di 11 cifre con cifra di controllo corretta.' });
    }

    const id = uuidv4();
    // Convert empty strings to null for UNIQUE fields
    const safeTaxCode = taxCode?.trim() || null;
    const safeVatNumber = vatNumber?.trim() || null;
    db.prepare(`
      INSERT INTO organizations (id, name, legal_form, tax_code, vat_number, address, city, province, postal_code, region,
      latitude, longitude, phone, email, website, description, social_manager_name, social_manager_role, status, admin_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, name, legalForm, safeTaxCode, safeVatNumber, address, city, province, postalCode || null, region,
      latitude || null, longitude || null, phone || null, email || null, website || null, description || null,
      socialManagerName || null, socialManagerRole || null, req.user.id);

    // Servizi
    if (services && Array.isArray(services)) {
      const insertSvc = db.prepare('INSERT INTO organization_services (id, organization_id, service_type, description) VALUES (?, ?, ?, ?)');
      services.forEach(s => insertSvc.run(uuidv4(), id, s.type, s.description || null));
    }

    // Target
    if (targets && Array.isArray(targets)) {
      const insertTgt = db.prepare('INSERT INTO organization_target_users (id, organization_id, target_type, notes) VALUES (?, ?, ?, ?)');
      targets.forEach(t => insertTgt.run(uuidv4(), id, t.type, t.notes || null));
    }

    res.status(201).json({ id, message: 'Organizzazione creata' });
  } catch (err) {
    console.error('Create organization error:', err);
    if (err.message?.includes('UNIQUE') && err.message?.includes('tax_code')) {
      return res.status(409).json({ error: 'Codice fiscale già presente nel sistema. Verifica il valore inserito.' });
    }
    if (err.message?.includes('UNIQUE') && err.message?.includes('vat_number')) {
      return res.status(409).json({ error: 'Partita IVA già presente nel sistema. Verifica il valore inserito.' });
    }
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Dato duplicato: un valore inserito è già presente nel sistema.' });
    }
    if (err.message?.includes('NOT NULL')) {
      return res.status(400).json({ error: `Campo obbligatorio mancante: ${err.message}` });
    }
    res.status(500).json({ error: `Errore nella creazione organizzazione: ${err.message}` });
  }
});

// PUT /api/organizations/:id
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });

    // Verifica permessi
    if (req.user.role !== 'admin' && org.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const {
      name, legalForm, taxCode, vatNumber, address, city, province, postalCode, region,
      latitude, longitude, phone, email, website, description,
      socialManagerName, socialManagerRole, services, targets
    } = req.body;

    // Validazione Codice Fiscale e Partita IVA
    if (taxCode && !isValidCodiceFiscale(taxCode)) {
      return res.status(400).json({ error: 'Codice fiscale non valido. Deve essere di 16 caratteri con formato e carattere di controllo corretti.' });
    }
    if (vatNumber && !isValidPartitaIVA(vatNumber)) {
      return res.status(400).json({ error: 'Partita IVA non valida. Deve essere di 11 cifre con cifra di controllo corretta.' });
    }

    // Convert empty strings to null for UNIQUE fields
    const safeTaxCode = taxCode?.trim() || null;
    const safeVatNumber = vatNumber?.trim() || null;

    db.prepare(`
      UPDATE organizations SET 
        name = COALESCE(?, name), legal_form = COALESCE(?, legal_form),
        tax_code = ?, vat_number = ?,
        address = COALESCE(?, address), city = COALESCE(?, city),
        province = COALESCE(?, province), postal_code = COALESCE(?, postal_code),
        region = COALESCE(?, region), latitude = ?,
        longitude = ?, phone = ?,
        email = ?, website = ?,
        description = ?,
        social_manager_name = ?,
        social_manager_role = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, legalForm, safeTaxCode, safeVatNumber, address, city, province, postalCode || null, region,
      latitude || null, longitude || null, phone || null, email || null, website || null, 
      description || null, socialManagerName || null, socialManagerRole || null, req.params.id);

    // Aggiorna servizi se forniti
    if (services && Array.isArray(services)) {
      db.prepare('DELETE FROM organization_services WHERE organization_id = ?').run(req.params.id);
      const insertSvc = db.prepare('INSERT INTO organization_services (id, organization_id, service_type, description) VALUES (?, ?, ?, ?)');
      services.forEach(s => insertSvc.run(uuidv4(), req.params.id, s.type, s.description || null));
    }

    // Aggiorna target se forniti
    if (targets && Array.isArray(targets)) {
      db.prepare('DELETE FROM organization_target_users WHERE organization_id = ?').run(req.params.id);
      const insertTgt = db.prepare('INSERT INTO organization_target_users (id, organization_id, target_type, notes) VALUES (?, ?, ?, ?)');
      targets.forEach(t => insertTgt.run(uuidv4(), req.params.id, t.type, t.notes || null));
    }

    res.json({ message: 'Organizzazione aggiornata' });
  } catch (err) {
    console.error('Update organization error:', err);
    if (err.message?.includes('UNIQUE') && err.message?.includes('tax_code')) {
      return res.status(409).json({ error: 'Codice fiscale già presente nel sistema.' });
    }
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Dato duplicato: un valore inserito è già presente nel sistema.' });
    }
    res.status(500).json({ error: `Errore aggiornamento organizzazione: ${err.message}` });
  }
});

// PUT /api/organizations/:id/status (solo admin)
router.put('/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'active', 'suspended', 'revoked'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status non valido' });
    }

    const db = getDb();
    db.prepare("UPDATE organizations SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    res.json({ message: 'Status aggiornato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento status' });
  }
});

// ===== DOCUMENTI ORGANIZZAZIONE =====

// POST /api/organizations/:id/documents - Upload documento PDF
router.post('/:id/documents', authenticate, authorize('org_admin'), (req, res) => {
  orgUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File troppo grande (max 10MB)' });
      return res.status(500).json({ error: err.message || 'Errore upload' });
    }
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });

    try {
      const db = getDb();
      const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
      if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });
      if (org.admin_user_id !== req.user.id) return res.status(403).json({ error: 'Non autorizzato' });

      const docType = req.body.document_type || 'altro';
      const notes = req.body.notes || null;
      const docId = uuidv4();

      db.prepare(`
        INSERT INTO organization_documents (id, organization_id, document_type, file_path, file_name, file_size, uploaded_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(docId, req.params.id, docType, req.file.filename, req.file.originalname, req.file.size, req.user.id, notes);

      res.status(201).json({ id: docId, message: 'Documento caricato' });
    } catch (dbErr) {
      console.error('Org doc upload error:', dbErr);
      res.status(500).json({ error: 'Errore salvataggio documento' });
    }
  });
});

// GET /api/organizations/:id/documents - Lista documenti organizzazione
router.get('/:id/documents', authenticate, (req, res) => {
  try {
    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });

    // Solo admin o proprietario dell'org
    if (req.user.role !== 'admin' && org.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const docs = db.prepare(`
      SELECT od.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM organization_documents od
      LEFT JOIN users u ON od.uploaded_by = u.id
      WHERE od.organization_id = ?
      ORDER BY od.created_at DESC
    `).all(req.params.id);

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero documenti' });
  }
});

// GET /api/organizations/:id/documents/:docId/download - Scarica documento
router.get('/:id/documents/:docId/download', authenticate, (req, res) => {
  try {
    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });

    if (req.user.role !== 'admin' && org.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const doc = db.prepare('SELECT * FROM organization_documents WHERE id = ? AND organization_id = ?').get(req.params.docId, req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

    const filePath = path.join(orgUploadDir, doc.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File non trovato sul disco' });

    res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Errore download documento' });
  }
});

// DELETE /api/organizations/:id/documents/:docId - Elimina documento
router.delete('/:id/documents/:docId', authenticate, authorize('admin', 'org_admin'), (req, res) => {
  try {
    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });

    if (req.user.role !== 'admin' && org.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const doc = db.prepare('SELECT * FROM organization_documents WHERE id = ? AND organization_id = ?').get(req.params.docId, req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

    // Elimina file dal disco
    const filePath = path.join(orgUploadDir, doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM organization_documents WHERE id = ?').run(req.params.docId);
    res.json({ message: 'Documento eliminato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore eliminazione documento' });
  }
});

module.exports = router;
