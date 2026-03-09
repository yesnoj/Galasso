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
// ENTI REFERENTI (lista per dropdown)
// ============================================================

// GET /api/beneficiaries/enti-referenti - Lista utenti ente_referente per dropdown
router.get('/enti-referenti', authenticate, (req, res) => {
  try {
    const db = getDb();
    const enti = db.prepare(`
      SELECT id, first_name, last_name, email, phone
      FROM users WHERE role = 'ente_referente' AND is_active = 1
      ORDER BY last_name, first_name
    `).all();
    res.json(enti);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero enti referenti' });
  }
});

// ============================================================
// REPORT EXCEL BENEFICIARI
// ============================================================

// GET /api/beneficiaries/report - Genera report Excel beneficiari
router.get('/report', authenticate, authorize('org_admin', 'org_operator'), async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const db = getDb();
    const { from, to, referring_entity } = req.query;

    // Trova l'organizzazione dell'utente
    if (!req.user.organization_id) return res.status(400).json({ error: 'Nessuna organizzazione associata' });
    const org = db.prepare('SELECT id, name FROM organizations WHERE id = ?').get(req.user.organization_id);
    if (!org) return res.status(400).json({ error: 'Nessuna organizzazione associata' });

    // Query beneficiari con filtri
    let where = 'b.organization_id = ?';
    let params = [org.id];
    if (referring_entity) { where += ' AND b.referring_entity LIKE ?'; params.push(`%${referring_entity}%`); }

    const beneficiaries = db.prepare(`
      SELECT b.id, b.code, b.target_type, b.referring_entity, b.referring_contact, b.ente_user_id,
        b.status, b.start_date, b.notes,
        eu.first_name || ' ' || eu.last_name as ente_referente_name
      FROM beneficiaries b
      LEFT JOIN users eu ON b.ente_user_id = eu.id
      WHERE ${where}
      ORDER BY b.code
    `).all(...params);

    // Per ogni beneficiario, calcola attività nel periodo
    let actWhere = 'al.beneficiary_id = ?';
    let actParams = [];
    if (from) actWhere += ' AND al.activity_date >= ?';
    if (to) actWhere += ' AND al.activity_date <= ?';

    const TARGET_LABELS = {
      minori: 'Minori', giovani: 'Giovani', anziani: 'Anziani', disabili: 'Disabili',
      dipendenze: 'Dipendenze', salute_mentale: 'Salute mentale', immigrati: 'Immigrati',
      detenuti_ex: 'Detenuti/ex-detenuti', senza_dimora: 'Senza dimora',
      donne_violenza: 'Donne vittime di violenza', nomadi: 'Nomadi',
      disagio_socioeconomico: 'Disagio socio-economico', altro: 'Altro'
    };
    const STATUS_LABELS = { active: 'Attivo', completed: 'Completato', suspended: 'Sospeso', abandoned: 'Abbandonato' };
    const SERVICE_LABELS = {
      coterapia_piante: 'Coterapia con piante', coterapia_animali: 'Coterapia con animali',
      socio_ricreativa: 'Attività socio-ricreativa', educativa: 'Attività educativa',
      inserimento_lavorativo: 'Inserimento lavorativo', formazione: 'Formazione'
    };

    const rows = beneficiaries.map(b => {
      let ap = [b.id];
      if (from) ap.push(from);
      if (to) ap.push(to);

      const activities = db.prepare(`
        SELECT service_type, duration_minutes FROM activity_logs al WHERE ${actWhere}
      `).all(...ap);

      const totalAct = activities.length;
      const totalMinutes = activities.reduce((s, a) => s + (a.duration_minutes || 0), 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
      const serviceTypes = [...new Set(activities.map(a => SERVICE_LABELS[a.service_type] || a.service_type).filter(Boolean))];

      return {
        code: b.code,
        targetType: TARGET_LABELS[b.target_type] || b.target_type || '',
        status: STATUS_LABELS[b.status] || b.status || '',
        referringEntity: b.referring_entity || '',
        referringContact: b.referring_contact || '',
        enteReferente: b.ente_referente_name || '',
        startDate: b.start_date || '',
        totalActivities: totalAct,
        totalHours: totalHours,
        serviceTypes: serviceTypes.join(', '),
        notes: b.notes || ''
      };
    });

    // Se è specificato un periodo, escludi beneficiari senza attività nel periodo
    const filteredRows = (from || to) ? rows.filter(r => r.totalActivities > 0) : rows;

    // Genera Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'GCF Platform - AICARE';
    wb.created = new Date();

    const ws = wb.addWorksheet('Report Beneficiari');

    // --- INTESTAZIONE ---
    ws.mergeCells('A1:K1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `REPORT BENEFICIARI — ${org.name}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1A3D17' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 35;

    ws.mergeCells('A2:K2');
    const subtitleParts = ['Piattaforma Green Care Farm Certificata — AICARE'];
    if (from || to) subtitleParts.push(`Periodo: ${from || '...'} — ${to || '...'}`);
    if (referring_entity) subtitleParts.push(`Ente inviante: ${referring_entity}`);
    const subtitleCell = ws.getCell('A2');
    subtitleCell.value = subtitleParts.join('  |  ');
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF666666' } };
    subtitleCell.alignment = { horizontal: 'center' };

    ws.mergeCells('A3:K3');
    ws.getCell('A3').value = `Report generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    ws.getCell('A3').font = { name: 'Arial', size: 9, color: { argb: 'FF999999' } };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    // Riga vuota
    ws.getRow(4).height = 10;

    // --- HEADER TABELLA ---
    const headers = [
      'Codice Beneficiario',
      'Nome e Cognome\n(da compilare a cura\ndell\'organizzazione)',
      'Tipologia Utenza',
      'Stato',
      'Ente Inviante',
      'Contatto Ente',
      'Ente Referente Collegato',
      'Data Inizio',
      'N. Attività',
      'Ore Totali',
      'Servizi Erogati'
    ];

    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5A27' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1A3D17' } },
        bottom: { style: 'thin', color: { argb: 'FF1A3D17' } },
        left: { style: 'thin', color: { argb: 'FF1A3D17' } },
        right: { style: 'thin', color: { argb: 'FF1A3D17' } }
      };
    });
    headerRow.height = 45;

    // --- DATI ---
    filteredRows.forEach((r, idx) => {
      const dataRow = ws.addRow([
        r.code,
        '', // Colonna vuota per nome e cognome
        r.targetType,
        r.status,
        r.referringEntity,
        r.referringContact,
        r.enteReferente,
        r.startDate ? new Date(r.startDate).toLocaleDateString('it-IT') : '',
        r.totalActivities,
        r.totalHours,
        r.serviceTypes
      ]);

      const isEven = idx % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: colNumber === 11 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F9F4' } };
        }
        // Colonna Nome e Cognome con sfondo giallo
        if (colNumber === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFC107' } },
            bottom: { style: 'thin', color: { argb: 'FFFFC107' } },
            left: { style: 'thin', color: { argb: 'FFFFC107' } },
            right: { style: 'thin', color: { argb: 'FFFFC107' } }
          };
        }
        // Numeri centrati
        if (colNumber === 9 || colNumber === 10) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // --- RIEPILOGO ---
    const summaryStartRow = ws.lastRow.number + 2;
    ws.mergeCells(`A${summaryStartRow}:C${summaryStartRow}`);
    ws.getCell(`A${summaryStartRow}`).value = 'RIEPILOGO';
    ws.getCell(`A${summaryStartRow}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1A3D17' } };

    const totalBen = filteredRows.length;
    const totalActAll = filteredRows.reduce((s, r) => s + r.totalActivities, 0);
    const totalHoursAll = filteredRows.reduce((s, r) => s + r.totalHours, 0);
    const activeCount = filteredRows.filter(r => r.status === 'Attivo').length;

    const summaryData = [
      ['Beneficiari totali:', totalBen],
      ['Di cui attivi:', activeCount],
      ['Totale attività nel periodo:', totalActAll],
      ['Totale ore nel periodo:', Math.round(totalHoursAll * 10) / 10],
    ];
    summaryData.forEach(([label, value]) => {
      const row = ws.addRow([label, value]);
      row.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      row.getCell(2).font = { name: 'Arial', size: 10 };
    });

    // --- DISCLAIMER ---
    const disclaimerRow = ws.lastRow.number + 2;
    ws.mergeCells(`A${disclaimerRow}:K${disclaimerRow}`);
    const discCell = ws.getCell(`A${disclaimerRow}`);
    discCell.value = '⚠️ DOCUMENTO RISERVATO — I codici beneficiario sono pseudonimi ai sensi del GDPR. L\'associazione con i dati identificativi è responsabilità esclusiva dell\'organizzazione e NON deve essere caricata sulla piattaforma.';
    discCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFCC0000' } };
    discCell.alignment = { wrapText: true };
    ws.getRow(disclaimerRow).height = 35;

    // --- LARGHEZZE COLONNE ---
    ws.getColumn(1).width = 22;  // Codice
    ws.getColumn(2).width = 25;  // Nome e Cognome
    ws.getColumn(3).width = 18;  // Tipologia
    ws.getColumn(4).width = 14;  // Stato
    ws.getColumn(5).width = 22;  // Ente inviante
    ws.getColumn(6).width = 20;  // Contatto
    ws.getColumn(7).width = 22;  // Ente referente
    ws.getColumn(8).width = 14;  // Data inizio
    ws.getColumn(9).width = 12;  // N. Attività
    ws.getColumn(10).width = 12; // Ore totali
    ws.getColumn(11).width = 35; // Servizi

    // Blocca header
    ws.views = [{ state: 'frozen', ySplit: 5 }];

    // Genera e invia
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `report_beneficiari_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Errore nella generazione del report: ' + err.message });
  }
});

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
      if (req.user.organization_id) { where += ' AND al.organization_id = ?'; params.push(req.user.organization_id); }
      else return res.json([]);
    } else if (req.user.role === 'ente_referente') {
      // L'ente referente vede solo le attività dei beneficiari collegati al suo utente
      where += ' AND al.beneficiary_id IN (SELECT id FROM beneficiaries WHERE ente_user_id = ?)';
      params.push(req.user.id);
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
router.post('/activities', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
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
router.put('/activities/:id', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
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
router.delete('/activities/:id', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
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
      if (req.user.organization_id) { where += ' AND b.organization_id = ?'; params.push(req.user.organization_id); }
      else return res.json([]);
    } else if (req.user.role === 'ente_referente') {
      // L'ente referente vede solo i beneficiari collegati al proprio utente
      where += ' AND b.ente_user_id = ?';
      params.push(req.user.id);
    } else if (organization_id) {
      where += ' AND b.organization_id = ?';
      params.push(organization_id);
    }
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const beneficiaries = db.prepare(`
      SELECT b.*, o.name as org_name,
        eu.first_name || ' ' || eu.last_name as ente_referente_name,
        (SELECT COUNT(*) FROM activity_logs al WHERE al.beneficiary_id = b.id) as activity_count,
        (SELECT MAX(al.activity_date) FROM activity_logs al WHERE al.beneficiary_id = b.id) as last_activity
      FROM beneficiaries b
      JOIN organizations o ON b.organization_id = o.id
      LEFT JOIN users eu ON b.ente_user_id = eu.id
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
      SELECT b.*, o.name as org_name,
        eu.first_name || ' ' || eu.last_name as ente_referente_name,
        eu.email as ente_referente_email
      FROM beneficiaries b
      JOIN organizations o ON b.organization_id = o.id
      LEFT JOIN users eu ON b.ente_user_id = eu.id
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
router.post('/', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
  try {
    const { organizationId, code, targetType, referringEntity, referringContact, enteUserId, startDate, notes } = req.body;
    if (!organizationId || !code) return res.status(400).json({ error: 'organizationId e code obbligatori' });

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO beneficiaries (id, organization_id, code, target_type, referring_entity, referring_contact, ente_user_id, start_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, organizationId, code, targetType || null, referringEntity || null, referringContact || null, enteUserId || null, startDate || null, notes || null);

    res.status(201).json({ id, message: 'Beneficiario registrato' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Codice beneficiario già esistente per questa organizzazione' });
    }
    res.status(500).json({ error: 'Errore nella registrazione beneficiario: ' + err.message });
  }
});

// PUT /api/beneficiaries/:id
router.put('/:id', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
  try {
    const { status, targetType, referringEntity, referringContact, enteUserId, startDate, notes } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE beneficiaries SET 
        status = COALESCE(?, status), target_type = COALESCE(?, target_type),
        referring_entity = COALESCE(?, referring_entity), referring_contact = COALESCE(?, referring_contact),
        ente_user_id = ?,
        start_date = COALESCE(?, start_date), notes = COALESCE(?, notes), updated_at = datetime('now')
      WHERE id = ?
    `).run(status, targetType, referringEntity, referringContact, enteUserId || null, startDate, notes, req.params.id);

    res.json({ message: 'Beneficiario aggiornato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento beneficiario: ' + err.message });
  }
});

// DELETE /api/beneficiaries/:id
router.delete('/:id', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
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
router.post('/:id/projects', authenticate, authorize('org_admin', 'org_operator'), (req, res) => {
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
