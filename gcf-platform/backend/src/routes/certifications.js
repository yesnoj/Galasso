/**
 * Routes - Certificazioni
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/auth');

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
    res.status(500).json({ error: 'Errore nella creazione domanda' });
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
      const now = new Date();
      updates.issue_date = now.toISOString();
      updates.expiry_date = new Date(now.setFullYear(now.getFullYear() + 3)).toISOString();
      
      // Genera numero certificato
      const count = db.prepare("SELECT COUNT(*) as n FROM certifications WHERE cert_number IS NOT NULL").get().n;
      updates.cert_number = `GCF-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
      
      // Attiva organizzazione
      const cert = db.prepare('SELECT organization_id FROM certifications WHERE id = ?').get(req.params.id);
      if (cert) {
        db.prepare("UPDATE organizations SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(cert.organization_id);
      }
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
    res.status(500).json({ error: 'Errore aggiornamento status' });
  }
});

module.exports = router;
