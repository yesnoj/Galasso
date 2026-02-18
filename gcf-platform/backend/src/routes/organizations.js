/**
 * Routes - Organizzazioni
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// GET /api/organizations - Lista (con filtri)
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, region, province, city, service_type, target_type, search } = req.query;
    
    let where = ['1=1'];
    let params = [];

    // Solo admin e auditor vedono tutte, gli altri solo active
    if (!req.user || !['admin', 'auditor'].includes(req.user.role)) {
      where.push("o.status = 'active'");
    } else if (status) {
      where.push('o.status = ?');
      params.push(status);
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
router.post('/', authenticate, authorize('admin', 'org_admin'), (req, res) => {
  try {
    const db = getDb();
    const {
      name, legalForm, taxCode, vatNumber, address, city, province, postalCode, region,
      latitude, longitude, phone, email, website, description,
      socialManagerName, socialManagerRole, services, targets
    } = req.body;

    if (!name || !legalForm || !address || !city || !province || !region) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti: nome, forma giuridica, indirizzo, città, provincia, regione' });
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

module.exports = router;
