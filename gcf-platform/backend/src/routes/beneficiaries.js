/**
 * Routes - Beneficiari e Attività
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/auth');

// === BENEFICIARI ===

// GET /api/beneficiaries
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { organization_id, status } = req.query;
    let where = '1=1';
    let params = [];

    if (req.user.role === 'org_admin' || req.user.role === 'org_operator') {
      const org = db.prepare('SELECT id FROM organizations WHERE admin_user_id = ?').get(req.user.id);
      if (org) { where += ' AND b.organization_id = ?'; params.push(org.id); }
      else return res.json([]);
    } else if (organization_id) {
      where += ' AND b.organization_id = ?';
      params.push(organization_id);
    }
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const beneficiaries = db.prepare(`
      SELECT b.*, o.name as org_name,
        (SELECT COUNT(*) FROM activity_logs al WHERE al.beneficiary_id = b.id) as activity_count,
        (SELECT MAX(al.activity_date) FROM activity_logs al WHERE al.beneficiary_id = b.id) as last_activity
      FROM beneficiaries b
      JOIN organizations o ON b.organization_id = o.id
      WHERE ${where}
      ORDER BY b.created_at DESC
    `).all(...params);

    res.json(beneficiaries);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero beneficiari' });
  }
});

// POST /api/beneficiaries
router.post('/', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const { organizationId, code, targetType, referringEntity, referringContact, startDate, notes } = req.body;
    if (!organizationId || !code) return res.status(400).json({ error: 'organizationId e code obbligatori' });

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO beneficiaries (id, organization_id, code, target_type, referring_entity, referring_contact, start_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, organizationId, code, targetType || null, referringEntity || null, referringContact || null, startDate || null, notes || null);

    res.status(201).json({ id, message: 'Beneficiario registrato' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Codice beneficiario già esistente per questa organizzazione' });
    }
    res.status(500).json({ error: 'Errore nella registrazione beneficiario' });
  }
});

// PUT /api/beneficiaries/:id
router.put('/:id', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const { status, targetType, referringEntity, referringContact, endDate, notes } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE beneficiaries SET 
        status = COALESCE(?, status), target_type = COALESCE(?, target_type),
        referring_entity = COALESCE(?, referring_entity), referring_contact = COALESCE(?, referring_contact),
        end_date = COALESCE(?, end_date), notes = COALESCE(?, notes), updated_at = datetime('now')
      WHERE id = ?
    `).run(status, targetType, referringEntity, referringContact, endDate, notes, req.params.id);

    res.json({ message: 'Beneficiario aggiornato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento beneficiario' });
  }
});

// === PROGETTI INDIVIDUALI ===

// GET /api/beneficiaries/:id/projects
router.get('/:id/projects', authenticate, (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM individual_projects WHERE beneficiary_id = ? ORDER BY created_at DESC').all(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero progetti' });
  }
});

// POST /api/beneficiaries/:id/projects
router.post('/:id/projects', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const { title, objectives, activitiesPlanned, startDate, expectedEndDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Titolo obbligatorio' });

    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO individual_projects (id, beneficiary_id, title, objectives, activities_planned, start_date, expected_end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, req.params.id, title, objectives || null, activitiesPlanned || null, startDate || null, expectedEndDate || null);

    res.status(201).json({ id, message: 'Progetto creato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione progetto' });
  }
});

// === ATTIVITÀ ===

// GET /api/activities
router.get('/activities/list', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { organization_id, beneficiary_id, from, to, page = 1, limit = 50 } = req.query;
    let where = '1=1';
    let params = [];

    if (req.user.role === 'org_admin' || req.user.role === 'org_operator') {
      const org = db.prepare('SELECT id FROM organizations WHERE admin_user_id = ?').get(req.user.id);
      if (org) { where += ' AND al.organization_id = ?'; params.push(org.id); }
    } else if (organization_id) {
      where += ' AND al.organization_id = ?';
      params.push(organization_id);
    }
    if (beneficiary_id) { where += ' AND al.beneficiary_id = ?'; params.push(beneficiary_id); }
    if (from) { where += ' AND al.activity_date >= ?'; params.push(from); }
    if (to) { where += ' AND al.activity_date <= ?'; params.push(to); }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const activities = db.prepare(`
      SELECT al.*, b.code as beneficiary_code, o.name as org_name
      FROM activity_logs al
      LEFT JOIN beneficiaries b ON al.beneficiary_id = b.id
      JOIN organizations o ON al.organization_id = o.id
      WHERE ${where}
      ORDER BY al.activity_date DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero attività' });
  }
});

// POST /api/activities
router.post('/activities', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const { organizationId, beneficiaryId, activityDate, serviceType, durationMinutes, description, participantsCount, notes } = req.body;
    if (!organizationId || !activityDate || !description) {
      return res.status(400).json({ error: 'organizationId, activityDate e description obbligatori' });
    }

    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO activity_logs (id, organization_id, beneficiary_id, activity_date, service_type, duration_minutes, description, participants_count, operator_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, organizationId, beneficiaryId || null, activityDate, serviceType || null, durationMinutes || null, description, participantsCount || 1, req.user.id, notes || null);

    res.status(201).json({ id, message: 'Attività registrata' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella registrazione attività' });
  }
});

// === REPORT MONITORAGGIO ===

// POST /api/beneficiaries/:id/reports
router.post('/:id/reports', authenticate, authorize('admin', 'org_admin', 'org_operator', 'ente_referente'), (req, res) => {
  try {
    const { periodFrom, periodTo, progressNotes, issues, nextSteps } = req.body;
    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO monitoring_reports (id, beneficiary_id, report_date, author_id, period_from, period_to, progress_notes, issues, next_steps)
      VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, req.user.id, periodFrom || null, periodTo || null, progressNotes || null, issues || null, nextSteps || null);

    res.status(201).json({ id, message: 'Report creato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione report' });
  }
});

module.exports = router;
