/**
 * Routes - Audit
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// GET /api/audits
router.get('/', authenticate, authorize('admin', 'auditor'), (req, res) => {
  try {
    const db = getDb();
    const { status, certification_id } = req.query;
    let where = '1=1';
    let params = [];

    if (req.user.role === 'auditor') {
      where += ' AND a.auditor_id = ?';
      params.push(req.user.id);
    }
    if (status) { where += ' AND a.status = ?'; params.push(status); }
    if (certification_id) { where += ' AND a.certification_id = ?'; params.push(certification_id); }

    const audits = db.prepare(`
      SELECT a.*, o.name as org_name, o.city as org_city, c.cert_number, c.organization_id
      FROM audits a
      JOIN certifications c ON a.certification_id = c.id
      JOIN organizations o ON c.organization_id = o.id
      WHERE ${where}
      ORDER BY a.created_at DESC
    `).all(...params);

    res.json(audits);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero audit' });
  }
});

// GET /api/audits/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const audit = db.prepare(`
      SELECT a.*, o.name as org_name, o.city as org_city, o.address as org_address,
      o.legal_form as org_legal_form, o.social_manager_name,
      c.cert_number, c.organization_id,
      u.first_name as auditor_first_name, u.last_name as auditor_last_name
      FROM audits a
      JOIN certifications c ON a.certification_id = c.id
      JOIN organizations o ON c.organization_id = o.id
      JOIN users u ON a.auditor_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!audit) return res.status(404).json({ error: 'Audit non trovato' });

    const evaluations = db.prepare(`
      SELECT ae.*, cr.title as req_title, cr.description as req_description,
      cr.verification_question, cr.acceptable_evidences, aa.name as area_name
      FROM audit_evaluations ae
      JOIN certification_requirements cr ON ae.requirement_id = cr.id
      JOIN audit_areas aa ON cr.area_id = aa.id
      ORDER BY cr.sort_order
    `).all();

    // Se non ci sono valutazioni, carica i requisiti vuoti
    let reqs = evaluations.filter(e => e.audit_id === audit.id);
    if (reqs.length === 0) {
      reqs = db.prepare(`
        SELECT cr.id as requirement_id, cr.requirement_number, cr.title as req_title,
        cr.description as req_description, cr.verification_question, cr.acceptable_evidences,
        aa.area_number, aa.name as area_name
        FROM certification_requirements cr
        JOIN audit_areas aa ON cr.area_id = aa.id
        ORDER BY cr.sort_order
      `).all();
    }

    const corrective_actions = db.prepare('SELECT * FROM corrective_actions WHERE audit_id = ?').all(audit.id);
    const attachments = db.prepare('SELECT * FROM audit_attachments WHERE audit_id = ?').all(audit.id);

    res.json({ ...audit, evaluations: reqs, corrective_actions, attachments });
  } catch (err) {
    console.error('Get audit error:', err);
    res.status(500).json({ error: 'Errore nel recupero audit' });
  }
});

// POST /api/audits
router.post('/', authenticate, authorize('admin', 'auditor'), (req, res) => {
  try {
    const { certificationId, auditType, auditMode, scheduledDate } = req.body;
    if (!certificationId || !auditType) {
      return res.status(400).json({ error: 'certificationId e auditType obbligatori' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO audits (id, certification_id, auditor_id, audit_type, audit_mode, scheduled_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'planned')
    `).run(id, certificationId, req.user.id, auditType, auditMode || 'on_site', scheduledDate || null);

    // Pre-popola le valutazioni
    const requirements = db.prepare('SELECT id, requirement_number FROM certification_requirements ORDER BY sort_order').all();
    const insertEval = db.prepare(`
      INSERT INTO audit_evaluations (id, audit_id, requirement_id, area_number, requirement_number)
      VALUES (?, ?, ?, ?, ?)
    `);

    requirements.forEach(r => {
      const areaNum = parseInt(r.requirement_number.split('.')[0]);
      insertEval.run(uuidv4(), id, r.id, areaNum, r.requirement_number);
    });

    // Aggiorna status certificazione
    db.prepare("UPDATE certifications SET status = 'audit_scheduled', updated_at = datetime('now') WHERE id = ?").run(certificationId);

    res.status(201).json({ id, message: 'Audit creato con valutazioni pre-compilate' });
  } catch (err) {
    console.error('Create audit error:', err);
    res.status(500).json({ error: 'Errore nella creazione audit: ' + err.message });
  }
});

// PUT /api/audits/:id/evaluations - Salva valutazioni
router.put('/:id/evaluations', authenticate, authorize('admin', 'auditor'), (req, res) => {
  try {
    const { evaluations } = req.body;
    if (!evaluations || !Array.isArray(evaluations)) {
      return res.status(400).json({ error: 'Array evaluations obbligatorio' });
    }

    const db = getDb();
    const updateEval = db.prepare(`
      UPDATE audit_evaluations SET evaluation = ?, evidences_checked = ?, notes = ?, updated_at = datetime('now')
      WHERE audit_id = ? AND requirement_id = ?
    `);

    const saveAll = db.transaction(() => {
      evaluations.forEach(e => {
        updateEval.run(
          e.evaluation || null,
          e.evidences_checked ? JSON.stringify(e.evidences_checked) : null,
          e.notes || null,
          req.params.id,
          e.requirementId
        );
      });

      // Ricalcola totali
      const counts = db.prepare(`
        SELECT 
          SUM(CASE WHEN evaluation = 'C' THEN 1 ELSE 0 END) as conforming,
          SUM(CASE WHEN evaluation = 'PC' THEN 1 ELSE 0 END) as partially,
          SUM(CASE WHEN evaluation = 'NC' THEN 1 ELSE 0 END) as non_conforming,
          SUM(CASE WHEN evaluation = 'NA' THEN 1 ELSE 0 END) as not_applicable
        FROM audit_evaluations WHERE audit_id = ?
      `).get(req.params.id);

      db.prepare(`
        UPDATE audits SET total_conforming = ?, total_partially = ?, 
        total_non_conforming = ?, total_not_applicable = ?,
        status = 'in_progress', updated_at = datetime('now')
        WHERE id = ?
      `).run(counts.conforming || 0, counts.partially || 0, counts.non_conforming || 0, counts.not_applicable || 0, req.params.id);
    });

    saveAll();
    res.json({ message: 'Valutazioni salvate' });
  } catch (err) {
    console.error('Save evaluations error:', err);
    res.status(500).json({ error: 'Errore nel salvataggio valutazioni: ' + err.message });
  }
});

// PUT /api/audits/:id/complete - Completa audit
router.put('/:id/complete', authenticate, authorize('admin', 'auditor'), (req, res) => {
  try {
    const { auditorNotes, orgRepresentativeName, correctiveActions } = req.body;
    const db = getDb();

    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit non trovato' });

    // Determina esito
    let outcome = 'conforming';
    if (audit.total_non_conforming > 0) outcome = 'non_conforming';
    else if (audit.total_partially > 0) outcome = 'conforming_with_actions';

    db.prepare(`
      UPDATE audits SET status = 'completed', outcome = ?, completed_date = datetime('now'),
      auditor_notes = ?, org_representative_name = ?, signed_at = datetime('now'),
      updated_at = datetime('now')
      WHERE id = ?
    `).run(outcome, auditorNotes || null, orgRepresentativeName || null, req.params.id);

    // Azioni correttive
    if (correctiveActions && Array.isArray(correctiveActions)) {
      const insertCA = db.prepare(`
        INSERT INTO corrective_actions (id, audit_id, evaluation_id, description, action_required, deadline, status)
        VALUES (?, ?, ?, ?, ?, ?, 'open')
      `);
      correctiveActions.forEach(ca => {
        insertCA.run(uuidv4(), req.params.id, ca.evaluationId || null, ca.description, ca.actionRequired, ca.deadline || null);
      });
    }

    // Aggiorna certificazione
    db.prepare(`
      UPDATE certifications SET status = 'audit_completed', updated_at = datetime('now')
      WHERE id = ?
    `).run(audit.certification_id);

    res.json({ message: 'Audit completato', outcome });
  } catch (err) {
    console.error('Complete audit error:', err);
    res.status(500).json({ error: 'Errore nel completamento audit: ' + err.message });
  }
});

// GET /api/audits/:id/pdf - Genera report PDF
router.get('/:id/pdf', authenticate, (req, res) => {
  try {
    const db = getDb();
    const audit = db.prepare(`
      SELECT a.*, o.name as org_name, o.city as org_city, o.address as org_address,
      o.legal_form, o.social_manager_name,
      u.first_name as auditor_fn, u.last_name as auditor_ln
      FROM audits a
      JOIN certifications c ON a.certification_id = c.id
      JOIN organizations o ON c.organization_id = o.id
      JOIN users u ON a.auditor_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!audit) return res.status(404).json({ error: 'Audit non trovato' });

    const evaluations = db.prepare(`
      SELECT ae.*, cr.title, cr.verification_question, aa.name as area_name
      FROM audit_evaluations ae
      JOIN certification_requirements cr ON ae.requirement_id = cr.id
      JOIN audit_areas aa ON cr.area_id = aa.id
      WHERE ae.audit_id = ?
      ORDER BY cr.sort_order
    `).all(req.params.id);

    // Genera PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit_report_${req.params.id.substring(0, 8)}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).text('REPORT DI AUDIT', { align: 'center' });
    doc.fontSize(12).text('Green Care Farm Certificata - AICARE', { align: 'center' });
    doc.moveDown();

    // Info generali
    doc.fontSize(10);
    doc.text(`Organizzazione: ${audit.org_name}`);
    doc.text(`Indirizzo: ${audit.org_address}, ${audit.org_city}`);
    doc.text(`Tipo audit: ${audit.audit_type}`);
    doc.text(`Auditor: ${audit.auditor_fn} ${audit.auditor_ln}`);
    doc.text(`Data: ${audit.completed_date || audit.scheduled_date || ''}`);
    doc.text(`Esito: ${audit.outcome || 'In corso'}`);
    doc.moveDown();

    // Valutazioni
    doc.fontSize(14).text('Valutazioni', { underline: true });
    doc.moveDown(0.5);
    
    let currentArea = '';
    evaluations.forEach(ev => {
      if (ev.area_name !== currentArea) {
        currentArea = ev.area_name;
        doc.moveDown(0.5);
        doc.fontSize(11).text(currentArea, { bold: true });
      }
      doc.fontSize(9);
      doc.text(`${ev.requirement_number} - ${ev.title}: ${ev.evaluation || 'N/V'}`, { indent: 20 });
      if (ev.notes) doc.text(`Note: ${ev.notes}`, { indent: 40 });
    });

    doc.moveDown();
    doc.fontSize(10).text(`Totali: C=${audit.total_conforming} | PC=${audit.total_partially} | NC=${audit.total_non_conforming} | NA=${audit.total_not_applicable}`);

    if (audit.auditor_notes) {
      doc.moveDown();
      doc.text(`Note auditor: ${audit.auditor_notes}`);
    }

    doc.end();
  } catch (err) {
    console.error('Generate PDF error:', err);
    res.status(500).json({ error: 'Errore generazione PDF: ' + err.message });
  }
});

// GET /api/audits/requirements - Lista requisiti per nuovo audit
router.get('/requirements/list', authenticate, (req, res) => {
  try {
    const db = getDb();
    const areas = db.prepare('SELECT * FROM audit_areas ORDER BY area_number').all();
    const requirements = db.prepare(`
      SELECT cr.*, aa.name as area_name, aa.area_number 
      FROM certification_requirements cr
      JOIN audit_areas aa ON cr.area_id = aa.id
      ORDER BY cr.sort_order
    `).all();

    res.json({ areas, requirements });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero requisiti' });
  }
});

module.exports = router;
