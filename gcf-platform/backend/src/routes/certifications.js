/**
 * Routes - Certificazioni
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads', 'certifications');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuidv4().slice(0,8)}.pdf`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo file PDF ammessi'));
  }
});

// GET /api/certifications
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    let sql, params = [];

    if (req.user.role === 'admin' || req.user.role === 'auditor') {
      const { status } = req.query;
      let where = '1=1';
      if (status) { where += ' AND c.status = ?'; params.push(status); }

      sql = `SELECT c.*, o.name as org_name, o.city as org_city
             FROM certifications c JOIN organizations o ON c.organization_id = o.id
             WHERE ${where} ORDER BY c.created_at DESC`;
    } else {
      sql = `SELECT c.*, o.name as org_name FROM certifications c 
             JOIN organizations o ON c.organization_id = o.id 
             WHERE o.admin_user_id = ? ORDER BY c.created_at DESC`;
      params.push(req.user.id);
    }

    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    console.error('Get certifications error:', err);
    res.status(500).json({ error: 'Errore nel recupero certificazioni' });
  }
});

// GET /api/certifications/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const cert = db.prepare(`
      SELECT c.*, o.name as org_name, o.city as org_city, o.address as org_address,
      o.legal_form as org_legal_form, o.admin_user_id
      FROM certifications c JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!cert) return res.status(404).json({ error: 'Certificazione non trovata' });

    // Verifica accesso
    if (!['admin', 'auditor'].includes(req.user.role) && cert.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const documents = db.prepare('SELECT * FROM certification_documents WHERE certification_id = ?').all(cert.id);
    const audits = db.prepare('SELECT * FROM audits WHERE certification_id = ? ORDER BY created_at DESC').all(cert.id);

    res.json({ ...cert, documents, audits });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero certificazione' });
  }
});

// POST /api/certifications - Domanda di certificazione
router.post('/', authenticate, authorize('admin', 'org_admin'), (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) return res.status(400).json({ error: 'organizationId obbligatorio' });

    const db = getDb();
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(organizationId);
    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata' });

    if (req.user.role !== 'admin' && org.admin_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Verifica se esiste già una certificazione attiva/in corso
    const existing = db.prepare(`
      SELECT id FROM certifications WHERE organization_id = ? AND status NOT IN ('rejected','expired')
    `).get(organizationId);

    if (existing) {
      return res.status(409).json({ error: 'Esiste già una certificazione attiva o in corso per questa organizzazione' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO certifications (id, organization_id, status, application_date)
      VALUES (?, ?, 'submitted', datetime('now'))
    `).run(id, organizationId);

    res.status(201).json({ id, message: 'Domanda di certificazione inviata' });
  } catch (err) {
    console.error('Create certification error:', err);
    res.status(500).json({ error: 'Errore nella creazione domanda: ' + err.message });
  }
});

// PUT /api/certifications/:id/status
router.put('/:id/status', authenticate, authorize('admin', 'auditor'), (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['doc_review', 'doc_approved', 'doc_rejected', 'audit_scheduled',
      'audit_completed', 'approved', 'rejected', 'issued', 'suspended', 'expired', 'renewed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status non valido' });
    }

    const db = getDb();
    const updates = { status };
    
    if (status === 'doc_review') updates.doc_review_date = new Date().toISOString();
    if (status === 'issued') {
      // Verifica che l'ultimo audit sia completamente conforme (tutti C)
      const cert = db.prepare('SELECT * FROM certifications WHERE id = ?').get(req.params.id);
      if (!cert) return res.status(404).json({ error: 'Certificazione non trovata' });

      const latestAudit = db.prepare(`
        SELECT * FROM audits WHERE certification_id = ? AND status = 'completed'
        ORDER BY completed_date DESC LIMIT 1
      `).get(req.params.id);

      if (!latestAudit) {
        return res.status(400).json({ error: 'Nessun audit completato trovato per questa certificazione' });
      }
      if (latestAudit.outcome !== 'conforming') {
        return res.status(400).json({ 
          error: 'Impossibile rilasciare il certificato: non tutti i requisiti sono conformi. Esito ultimo audit: ' + latestAudit.outcome 
        });
      }

      const now = new Date();
      updates.issue_date = now.toISOString();
      updates.expiry_date = new Date(now.setFullYear(now.getFullYear() + 3)).toISOString();
      
      // Genera numero certificato (usa MAX per evitare duplicati)
      const year = new Date().getFullYear();
      const maxResult = db.prepare(`
        SELECT cert_number FROM certifications 
        WHERE cert_number LIKE 'GCF-${year}-%' 
        ORDER BY cert_number DESC LIMIT 1
      `).get();
      let nextNum = 1;
      if (maxResult && maxResult.cert_number) {
        const parts = maxResult.cert_number.split('-');
        nextNum = parseInt(parts[2]) + 1;
      }
      updates.cert_number = `GCF-${year}-${String(nextNum).padStart(3, '0')}`;
      
      // Attiva organizzazione
      db.prepare("UPDATE organizations SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(cert.organization_id);
    }
    if (status === 'approved' || status === 'rejected') updates.decision_date = new Date().toISOString();

    let sql = `UPDATE certifications SET status = ?, notes = COALESCE(?, notes), updated_at = datetime('now')`;
    let params = [status, notes || null];

    if (updates.doc_review_date) { sql += ', doc_review_date = ?'; params.push(updates.doc_review_date); }
    if (updates.issue_date) { sql += ', issue_date = ?, expiry_date = ?, cert_number = ?'; params.push(updates.issue_date, updates.expiry_date, updates.cert_number); }
    if (updates.decision_date) { sql += ', decision_date = ?'; params.push(updates.decision_date); }

    sql += ' WHERE id = ?';
    params.push(req.params.id);

    db.prepare(sql).run(...params);
    res.json({ message: 'Status certificazione aggiornato', ...updates });
  } catch (err) {
    console.error('Update cert status error:', err);
    res.status(500).json({ error: 'Errore aggiornamento status: ' + err.message });
  }
});

// GET /api/certifications/:id/certificate-pdf
router.get('/:id/certificate-pdf', authenticate, (req, res) => {
  try {
    const db = getDb();
    const cert = db.prepare(`
      SELECT c.*, o.name as org_name, o.city as org_city, o.address as org_address,
      o.province as org_province, o.region as org_region, o.postal_code as org_postal_code,
      o.legal_form, o.tax_code, o.vat_number, o.social_manager_name, o.social_manager_role,
      o.phone as org_phone, o.email as org_email
      FROM certifications c
      JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = ? AND c.status = 'issued'
    `).get(req.params.id);

    if (!cert) return res.status(404).json({ error: 'Certificato non trovato o non ancora rilasciato' });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificato_${cert.cert_number || 'GCF'}.pdf`);
    doc.pipe(res);

    const pageW = 595.28;
    const contentW = pageW - 120;
    const GREEN = '#2E7D32';
    const GREEN_LIGHT = '#4CAF50';
    const GRAY = '#666666';

    // === BORDO DECORATIVO ===
    doc.rect(20, 20, pageW - 40, 801.89).lineWidth(2).stroke(GREEN);
    doc.rect(25, 25, pageW - 50, 791.89).lineWidth(0.5).stroke(GREEN_LIGHT);

    // === HEADER ===
    doc.moveDown(2);
    doc.fontSize(13).fillColor(GREEN).text('AICARE', { align: 'center' });
    doc.fontSize(9).fillColor(GRAY).text('Agenzia Italiana per la Campagna e l\'Agricoltura Responsabile e Etica', { align: 'center' });
    doc.moveDown(1.5);

    // Linea separatrice
    const lineY = doc.y;
    doc.moveTo(80, lineY).lineTo(pageW - 80, lineY).lineWidth(1).stroke(GREEN);
    doc.moveDown(1.5);

    // === TITOLO ===
    doc.fontSize(24).fillColor(GREEN).text('CERTIFICATO DI CONFORMITÀ', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#333333').text('Green Care Farm Certificata — AICARE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(GRAY).text(`Codice certificato: AICARE-GCF-CERT-01`, { align: 'center' });
    doc.moveDown(2);

    // === NUMERO CERTIFICATO ===
    const certNumY = doc.y;
    doc.roundedRect(pageW / 2 - 100, certNumY, 200, 36, 8).lineWidth(1.5).stroke(GREEN);
    doc.fontSize(16).fillColor(GREEN).text(cert.cert_number || '—', pageW / 2 - 100, certNumY + 10, { width: 200, align: 'center' });
    doc.moveDown(3);

    // === DATI ORGANIZZAZIONE ===
    const legalForms = { farm: 'Azienda agricola', coop: 'Cooperativa sociale', social_enterprise: 'Impresa sociale', association: 'Associazione', foundation: 'Fondazione', other: 'Altro' };
    const legalLabel = legalForms[cert.legal_form] || cert.legal_form || '—';

    const orgStartY = doc.y;
    doc.fontSize(10).fillColor(GRAY).text('Organizzazione certificata:', 80);
    doc.fontSize(14).fillColor('#1a1a1a').text(cert.org_name, 80);
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Forma giuridica: ${legalLabel}`, 80);
    if (cert.tax_code) doc.text(`Codice fiscale: ${cert.tax_code}`, 80);
    if (cert.vat_number) doc.text(`Partita IVA: ${cert.vat_number}`, 80);
    const addressParts = [cert.org_address, cert.org_postal_code, cert.org_city, cert.org_province ? `(${cert.org_province})` : '', cert.org_region].filter(Boolean);
    doc.text(`Sede: ${addressParts.join(', ')}`, 80);
    doc.moveDown(1.5);

    // Linea
    const line2Y = doc.y;
    doc.moveTo(80, line2Y).lineTo(pageW - 80, line2Y).lineWidth(0.5).stroke('#CCCCCC');
    doc.moveDown(1);

    // === DICHIARAZIONE ===
    doc.fontSize(10).fillColor('#333333').text(
      'AICARE certifica che l\'organizzazione sopra indicata è conforme allo standard AICARE-GCF-STD-01 v1.0 "Green Care Farm Certificata — AICARE" per la qualità dei servizi di agricoltura sociale.',
      80, doc.y, { width: contentW, align: 'justify', lineGap: 4 }
    );
    doc.moveDown(1);
    doc.text(
      'La certificazione è stata rilasciata a seguito di verifica di conformità condotta secondo le procedure previste dallo schema di certificazione AICARE.',
      80, doc.y, { width: contentW, align: 'justify', lineGap: 4 }
    );
    doc.moveDown(2);

    // === DATE ===
    const dateBoxY = doc.y;
    // Box rilascio
    doc.roundedRect(80, dateBoxY, contentW / 2 - 10, 50, 6).fillAndStroke('#F1F8E9', GREEN_LIGHT);
    doc.fontSize(8).fillColor(GRAY).text('Data di rilascio', 90, dateBoxY + 8, { width: contentW / 2 - 30 });
    doc.fontSize(12).fillColor('#1a1a1a').text(formatDatePdf(cert.issue_date), 90, dateBoxY + 24, { width: contentW / 2 - 30 });

    // Box scadenza
    const box2X = 80 + contentW / 2 + 10;
    doc.roundedRect(box2X, dateBoxY, contentW / 2 - 10, 50, 6).fillAndStroke('#F1F8E9', GREEN_LIGHT);
    doc.fontSize(8).fillColor(GRAY).text('Data di scadenza', box2X + 10, dateBoxY + 8, { width: contentW / 2 - 30 });
    doc.fontSize(12).fillColor('#1a1a1a').text(formatDatePdf(cert.expiry_date), box2X + 10, dateBoxY + 24, { width: contentW / 2 - 30 });
    doc.y = dateBoxY + 70;

    doc.moveDown(2);

    // === FIRMA ===
    doc.fontSize(10).fillColor(GRAY).text('Firma autorizzata AICARE:', 80);
    doc.moveDown(2);
    const signLineY = doc.y;
    doc.moveTo(80, signLineY).lineTo(280, signLineY).lineWidth(0.5).stroke('#999999');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#333333').text('Nome e ruolo: ________________________________', 80);
    doc.moveDown(1);
    doc.fontSize(9).fillColor(GRAY).text('Luogo e data: ________________________________', 80);

    // === FOOTER ===
    doc.moveDown(3);
    const footerY = Math.max(doc.y, 740);
    const footLine = footerY;
    doc.moveTo(80, footLine).lineTo(pageW - 80, footLine).lineWidth(0.5).stroke('#CCCCCC');
    doc.fontSize(7).fillColor(GRAY);
    doc.text('Questo certificato autorizza l\'organizzazione a utilizzare il marchio Green Care Farm Certificata — AICARE secondo il regolamento vigente.', 80, footLine + 8, { width: contentW, align: 'center' });
    doc.text('La validità del certificato può essere verificata nel Registro Pubblico delle Organizzazioni Certificate.', 80, footLine + 20, { width: contentW, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Generate certificate PDF error:', err);
    res.status(500).json({ error: 'Errore generazione certificato PDF: ' + err.message });
  }
});

function formatDatePdf(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// POST /api/certifications/:id/documents - Upload documento PDF
router.post('/:id/documents', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.message === 'Solo file PDF ammessi') return res.status(400).json({ error: err.message });
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File troppo grande (max 10MB)' });
      return res.status(500).json({ error: 'Errore upload' });
    }
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });

    try {
      const db = getDb();
      const docId = uuidv4();
      const documentName = req.body.documentName || req.file.originalname;

      db.prepare(`
        INSERT INTO certification_documents (id, certification_id, requirement_id, document_type, file_path, file_name, file_size, uploaded_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(docId, req.params.id, req.body.requirementId || 'general', req.body.documentType || 'general',
        req.file.filename, documentName, req.file.size, req.user.id);

      res.status(201).json({ id: docId, fileName: documentName, message: 'Documento caricato' });
    } catch (dbErr) {
      console.error('Doc upload DB error:', dbErr);
      res.status(500).json({ error: 'Errore salvataggio documento' });
    }
  });
});

// GET /api/certifications/:id/documents - Lista documenti
router.get('/:id/documents', authenticate, (req, res) => {
  try {
    const db = getDb();
    const docs = db.prepare(`
      SELECT cd.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM certification_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.certification_id = ?
      ORDER BY cd.created_at DESC
    `).all(req.params.id);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero documenti' });
  }
});

// GET /api/certifications/doc-download/:docId - Scarica documento
router.get('/doc-download/:docId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const doc = db.prepare('SELECT * FROM certification_documents WHERE id = ?').get(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

    const filePath = path.join(uploadDir, doc.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File non trovato' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Errore download' });
  }
});

// DELETE /api/certifications/:id/documents/:docId - Elimina documento
router.delete('/:id/documents/:docId', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const db = getDb();
    const doc = db.prepare('SELECT * FROM certification_documents WHERE id = ? AND certification_id = ?').get(req.params.docId, req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

    const filePath = path.join(uploadDir, doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM certification_documents WHERE id = ?').run(req.params.docId);
    res.json({ message: 'Documento eliminato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
