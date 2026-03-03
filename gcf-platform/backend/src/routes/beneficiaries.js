/**
 * Routes - Beneficiari e Attività
 * IMPORTANT: /activities/* routes MUST come before /:id routes
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// ATTIVITÀ (must be BEFORE /:id to avoid route conflict)
// ============================================================

// GET /api/beneficiaries/activities/list
router.get('/activities/list', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { organization_id, beneficiary_id, from, to, search } = req.query;
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
    if (search) { where += ' AND (b.code LIKE ? OR o.name LIKE ? OR al.description LIKE ? OR al.service_type LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }

    const activities = db.prepare(`
      SELECT al.*, b.code as beneficiary_code, o.name as org_name
      FROM activity_logs al
      LEFT JOIN beneficiaries b ON al.beneficiary_id = b.id
      JOIN organizations o ON al.organization_id = o.id
      WHERE ${where}
      ORDER BY al.activity_date DESC
    `).all(...params);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero attività' });
  }
});

// POST /api/beneficiaries/activities
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
    res.status(500).json({ error: 'Errore nella registrazione attività: ' + err.message });
  }
});

// PUT /api/beneficiaries/activities/:id
router.put('/activities/:id', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const { activityDate, serviceType, durationMinutes, description, notes } = req.body;
    const db = getDb();
    
    const existing = db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Attività non trovata' });

    db.prepare(`
      UPDATE activity_logs SET 
        activity_date = ?, service_type = ?,
        duration_minutes = ?, description = ?,
        notes = ?
      WHERE id = ?
    `).run(
      activityDate || existing.activity_date,
      serviceType !== undefined ? serviceType : existing.service_type,
      durationMinutes !== undefined ? durationMinutes : existing.duration_minutes,
      description || existing.description,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    res.json({ message: 'Attività aggiornata' });
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ error: 'Errore aggiornamento attività: ' + err.message });
  }
});

// DELETE /api/beneficiaries/activities/:id
router.delete('/activities/:id', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const db = getDb();
    const act = db.prepare('SELECT id FROM activity_logs WHERE id = ?').get(req.params.id);
    if (!act) return res.status(404).json({ error: 'Attività non trovata' });

    db.prepare('DELETE FROM activity_logs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Attività eliminata' });
  } catch (err) {
    res.status(500).json({ error: 'Errore eliminazione attività' });
  }
});

// ============================================================
// BENEFICIARI
// ============================================================

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

// GET /api/beneficiaries/:id - Dettaglio beneficiario con attività
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const ben = db.prepare(`
      SELECT b.*, o.name as org_name
      FROM beneficiaries b
      JOIN organizations o ON b.organization_id = o.id
      WHERE b.id = ?
    `).get(req.params.id);
    if (!ben) return res.status(404).json({ error: 'Beneficiario non trovato' });

    const activities = db.prepare(`
      SELECT al.* FROM activity_logs al
      WHERE al.beneficiary_id = ?
      ORDER BY al.activity_date DESC
    `).all(req.params.id);

    const projects = db.prepare(`
      SELECT * FROM individual_projects WHERE beneficiary_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({ ...ben, activities, projects });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero beneficiario' });
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
    res.status(500).json({ error: 'Errore nella registrazione beneficiario: ' + err.message });
  }
});

// PUT /api/beneficiaries/:id
router.put('/:id', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const { status, targetType, referringEntity, referringContact, startDate, notes } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE beneficiaries SET 
        status = COALESCE(?, status), target_type = COALESCE(?, target_type),
        referring_entity = COALESCE(?, referring_entity), referring_contact = COALESCE(?, referring_contact),
        start_date = COALESCE(?, start_date), notes = COALESCE(?, notes), updated_at = datetime('now')
      WHERE id = ?
    `).run(status, targetType, referringEntity, referringContact, startDate, notes, req.params.id);

    res.json({ message: 'Beneficiario aggiornato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento beneficiario: ' + err.message });
  }
});

// DELETE /api/beneficiaries/:id
router.delete('/:id', authenticate, authorize('admin', 'org_admin', 'org_operator'), (req, res) => {
  try {
    const db = getDb();
    const ben = db.prepare('SELECT id FROM beneficiaries WHERE id = ?').get(req.params.id);
    if (!ben) return res.status(404).json({ error: 'Beneficiario non trovato' });

    const actCount = db.prepare('SELECT COUNT(*) as c FROM activity_logs WHERE beneficiary_id = ?').get(req.params.id);
    if (actCount.c > 0) {
      return res.status(400).json({ error: `Impossibile eliminare: ci sono ${actCount.c} attività collegate. Elimina prima le attività.` });
    }

    db.prepare('DELETE FROM individual_projects WHERE beneficiary_id = ?').run(req.params.id);
    db.prepare('DELETE FROM monitoring_reports WHERE beneficiary_id = ?').run(req.params.id);
    db.prepare('DELETE FROM beneficiaries WHERE id = ?').run(req.params.id);
    res.json({ message: 'Beneficiario eliminato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore eliminazione beneficiario' });
  }
});

// ============================================================
// PROGETTI INDIVIDUALI
// ============================================================

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

// ============================================================
// REPORT MONITORAGGIO
// ============================================================

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
