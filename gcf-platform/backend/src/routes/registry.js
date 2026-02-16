/**
 * Routes - Registro Pubblico (senza autenticazione)
 */
const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/database');

// GET /api/registry - Registro organizzazioni certificate
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { region, province, city, service_type, target_type, search } = req.query;

    let where = ["o.status = 'active'", "c.status = 'issued'"];
    let params = [];

    if (region) { where.push('o.region = ?'); params.push(region); }
    if (province) { where.push('o.province = ?'); params.push(province); }
    if (city) { where.push('o.city = ?'); params.push(city); }
    if (search) { where.push("(o.name LIKE ? OR o.city LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
    if (service_type) {
      where.push("EXISTS (SELECT 1 FROM organization_services os WHERE os.organization_id = o.id AND os.service_type = ?)");
      params.push(service_type);
    }
    if (target_type) {
      where.push("EXISTS (SELECT 1 FROM organization_target_users ot WHERE ot.organization_id = o.id AND ot.target_type = ?)");
      params.push(target_type);
    }

    const orgs = db.prepare(`
      SELECT o.id, o.name, o.legal_form, o.city, o.province, o.region, o.latitude, o.longitude,
        o.phone, o.email, o.website, o.description,
        c.cert_number, c.issue_date, c.expiry_date,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.organization_id = o.id AND r.is_published = 1) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.organization_id = o.id AND r.is_published = 1) as review_count
      FROM organizations o
      JOIN certifications c ON c.organization_id = o.id AND c.status = 'issued'
      WHERE ${where.join(' AND ')}
      ORDER BY o.name
    `).all(...params);

    // Aggiungi servizi e target
    const getServices = db.prepare('SELECT service_type FROM organization_services WHERE organization_id = ?');
    const getTargets = db.prepare('SELECT target_type FROM organization_target_users WHERE organization_id = ?');

    const results = orgs.map(org => ({
      ...org,
      services: getServices.all(org.id).map(s => s.service_type),
      targets: getTargets.all(org.id).map(t => t.target_type)
    }));

    res.json(results);
  } catch (err) {
    console.error('Registry error:', err);
    res.status(500).json({ error: 'Errore nel registro' });
  }
});

// GET /api/registry/map - Dati mappa
router.get('/map', (req, res) => {
  try {
    const db = getDb();
    const orgs = db.prepare(`
      SELECT o.id, o.name, o.city, o.latitude, o.longitude, o.legal_form,
        c.cert_number
      FROM organizations o
      JOIN certifications c ON c.organization_id = o.id AND c.status = 'issued'
      WHERE o.status = 'active' AND o.latitude IS NOT NULL AND o.longitude IS NOT NULL
    `).all();

    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: 'Errore dati mappa' });
  }
});

// GET /api/registry/stats - Statistiche pubbliche
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    
    const stats = {
      totalCertified: db.prepare("SELECT COUNT(*) as n FROM organizations WHERE status = 'active'").get().n,
      totalCertifications: db.prepare("SELECT COUNT(*) as n FROM certifications WHERE status = 'issued'").get().n,
      totalBeneficiaries: db.prepare("SELECT COUNT(*) as n FROM beneficiaries WHERE status = 'active'").get().n,
      totalActivities: db.prepare("SELECT COUNT(*) as n FROM activity_logs").get().n,
      byRegion: db.prepare(`
        SELECT o.region, COUNT(*) as count 
        FROM organizations o WHERE o.status = 'active' 
        GROUP BY o.region ORDER BY count DESC
      `).all(),
      byServiceType: db.prepare(`
        SELECT os.service_type, COUNT(DISTINCT os.organization_id) as count
        FROM organization_services os
        JOIN organizations o ON os.organization_id = o.id AND o.status = 'active'
        GROUP BY os.service_type ORDER BY count DESC
      `).all(),
      byTargetType: db.prepare(`
        SELECT ot.target_type, COUNT(DISTINCT ot.organization_id) as count
        FROM organization_target_users ot
        JOIN organizations o ON ot.organization_id = o.id AND o.status = 'active'
        GROUP BY ot.target_type ORDER BY count DESC
      `).all()
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero statistiche' });
  }
});

// ===== REVIEW MODERATION (admin) =====

// GET /api/registry/reviews/pending - Lista recensioni da moderare
router.get('/reviews/pending', (req, res) => {
  try {
    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.*, o.name as org_name 
      FROM reviews r
      JOIN organizations o ON r.organization_id = o.id
      WHERE r.is_published = 0
      ORDER BY r.created_at DESC
    `).all();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero recensioni' });
  }
});

// PUT /api/registry/reviews/:id/approve
router.put('/reviews/:id/approve', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE reviews SET is_published = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Recensione approvata' });
  } catch (err) {
    res.status(500).json({ error: 'Errore approvazione' });
  }
});

// PUT /api/registry/reviews/:id/reject
router.put('/reviews/:id/reject', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ message: 'Recensione rifiutata ed eliminata' });
  } catch (err) {
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

// GET /api/registry/:id - Dettaglio organizzazione pubblica
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const org = db.prepare(`
      SELECT o.id, o.name, o.legal_form, o.address, o.city, o.province, o.region,
        o.latitude, o.longitude, o.phone, o.email, o.website, o.description,
        o.social_manager_name, o.social_manager_role,
        c.cert_number, c.issue_date, c.expiry_date
      FROM organizations o
      JOIN certifications c ON c.organization_id = o.id AND c.status = 'issued'
      WHERE o.id = ? AND o.status = 'active'
    `).get(req.params.id);

    if (!org) return res.status(404).json({ error: 'Organizzazione non trovata nel registro' });

    const services = db.prepare('SELECT service_type, description FROM organization_services WHERE organization_id = ?').all(org.id);
    const targets = db.prepare('SELECT target_type, notes FROM organization_target_users WHERE organization_id = ?').all(org.id);
    const reviews = db.prepare('SELECT author_name, author_role, rating, comment, created_at FROM reviews WHERE organization_id = ? AND is_published = 1 ORDER BY created_at DESC LIMIT 10').all(org.id);
    const events = db.prepare("SELECT * FROM events WHERE organization_id = ? AND event_date >= date('now') ORDER BY event_date LIMIT 5").all(org.id);

    res.json({ ...org, services, targets, reviews, events });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero dettaglio' });
  }
});

// POST /api/registry/:id/reviews - Aggiungi recensione
router.post('/:id/reviews', (req, res) => {
  try {
    const { authorName, authorRole, rating, comment } = req.body;
    if (!authorName || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Nome autore e rating (1-5) obbligatori' });
    }

    const db = getDb();
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    db.prepare(`
      INSERT INTO reviews (id, organization_id, author_name, author_role, rating, comment, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(id, req.params.id, authorName, authorRole || null, rating, comment || null);

    res.status(201).json({ id, message: 'Recensione inviata, in attesa di approvazione' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'invio recensione' });
  }
});

module.exports = router;
