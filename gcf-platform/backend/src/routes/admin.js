/**
 * Routes - Amministrazione
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, saveToFile } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// GET /api/admin/backup - Scarica backup database
router.get('/backup', authenticate, authorize('admin'), (req, res) => {
  try {
    saveToFile(); // Salva dati in memoria su disco prima del backup
    const dbPath = process.env.DB_PATH || './db/gcf.sqlite';
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database non trovato' });
    }
    const date = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 19);
    const filename = `gcf-backup-${date}.sqlite`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/x-sqlite3');
    const stream = fs.createReadStream(dbPath);
    stream.pipe(res);
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'Errore durante il backup' });
  }
});

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();

    const stats = {
      users: {
        total: db.prepare('SELECT COUNT(*) as n FROM users').get().n,
        byRole: db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all(),
        active: db.prepare('SELECT COUNT(*) as n FROM users WHERE is_active = 1').get().n
      },
      organizations: {
        total: db.prepare('SELECT COUNT(*) as n FROM organizations').get().n,
        byStatus: db.prepare('SELECT status, COUNT(*) as count FROM organizations GROUP BY status').all(),
        byRegion: db.prepare('SELECT region, COUNT(*) as count FROM organizations GROUP BY region ORDER BY count DESC').all()
      },
      certifications: {
        total: db.prepare('SELECT COUNT(*) as n FROM certifications').get().n,
        byStatus: db.prepare('SELECT status, COUNT(*) as count FROM certifications GROUP BY status').all(),
        expiringSoon: db.prepare(`
          SELECT c.*, o.name as org_name FROM certifications c
          JOIN organizations o ON c.organization_id = o.id
          WHERE c.status = 'issued' AND c.expiry_date <= date('now', '+90 days')
          ORDER BY c.expiry_date
        `).all()
      },
      audits: {
        total: db.prepare('SELECT COUNT(*) as n FROM audits').get().n,
        pending: db.prepare("SELECT COUNT(*) as n FROM audits WHERE status IN ('planned','in_progress')").get().n,
        completed: db.prepare("SELECT COUNT(*) as n FROM audits WHERE status = 'completed'").get().n
      },
      beneficiaries: {
        total: db.prepare('SELECT COUNT(*) as n FROM beneficiaries').get().n,
        active: db.prepare("SELECT COUNT(*) as n FROM beneficiaries WHERE status = 'active'").get().n,
        byTarget: db.prepare("SELECT target_type, COUNT(*) as count FROM beneficiaries WHERE status = 'active' GROUP BY target_type").all()
      },
      activities: {
        total: db.prepare('SELECT COUNT(*) as n FROM activity_logs').get().n,
        thisMonth: db.prepare("SELECT COUNT(*) as n FROM activity_logs WHERE activity_date >= date('now','start of month')").get().n,
        totalHours: db.prepare('SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 as hours FROM activity_logs').get().hours
      },
      correctiveActions: {
        open: db.prepare("SELECT COUNT(*) as n FROM corrective_actions WHERE status IN ('open','in_progress')").get().n,
        overdue: db.prepare("SELECT COUNT(*) as n FROM corrective_actions WHERE status IN ('open','in_progress') AND deadline < date('now')").get().n
      }
    };

    res.json(stats);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Errore nel recupero statistiche' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.is_active, u.email_verified, u.last_login, u.created_at,
        o.id as organization_id, o.name as organization_name
      FROM users u LEFT JOIN organizations o ON o.admin_user_id = u.id
      ORDER BY u.created_at DESC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero utenti' });
  }
});

// GET /api/admin/organizations-list (per dropdown associazione)
router.get('/organizations-list', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const orgs = db.prepare('SELECT id, name, admin_user_id FROM organizations ORDER BY name').all();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero organizzazioni' });
  }
});

// POST /api/admin/users - Crea utente (admin)
router.post('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone, organizationId } = req.body;
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ error: 'Tutti i campi obbligatori' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email già registrata' });

    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).run(id, email.toLowerCase(), hash, role, firstName, lastName, phone || null);

    // Associa organizzazione se specificata
    if (organizationId && (role === 'org_admin' || role === 'org_operator')) {
      db.prepare('UPDATE organizations SET admin_user_id = ? WHERE id = ?').run(id, organizationId);
    }

    res.status(201).json({ id, message: 'Utente creato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione utente: ' + err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { role, isActive, firstName, lastName, phone, organizationId } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE users SET 
        role = COALESCE(?, role), is_active = COALESCE(?, is_active),
        first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone), updated_at = datetime('now')
      WHERE id = ?
    `).run(role, isActive, firstName, lastName, phone, req.params.id);

    // Gestisci associazione organizzazione
    if (organizationId !== undefined) {
      // Rimuovi vecchia associazione
      db.prepare('UPDATE organizations SET admin_user_id = NULL WHERE admin_user_id = ?').run(req.params.id);
      // Imposta nuova se specificata
      if (organizationId) {
        db.prepare('UPDATE organizations SET admin_user_id = ? WHERE id = ?').run(req.params.id, organizationId);
      }
    }

    res.json({ message: 'Utente aggiornato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento utente: ' + err.message });
  }
});

// PUT /api/admin/users/:id/reset-password
router.put('/users/:id/reset-password', authenticate, authorize('admin'), (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
    }
    const db = getDb();
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.params.id);
    res.json({ message: 'Password reimpostata' });
  } catch (err) {
    res.status(500).json({ error: 'Errore reset password: ' + err.message });
  }
});

// GET /api/admin/notifications
router.get('/notifications', authenticate, (req, res) => {
  try {
    const db = getDb();
    const notifs = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.user.id);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero notifiche' });
  }
});

// PUT /api/admin/notifications/:id/read
router.put('/notifications/:id/read', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notifica letta' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento notifica' });
  }
});

// GET /api/admin/reviews - Recensioni da moderare
router.get('/reviews', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.*, o.name as org_name
      FROM reviews r JOIN organizations o ON r.organization_id = o.id
      WHERE r.is_published = 0
      ORDER BY r.created_at DESC
    `).all();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero recensioni' });
  }
});

// PUT /api/admin/reviews/:id
router.put('/reviews/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { isPublished } = req.body;
    const db = getDb();
    if (isPublished) {
      db.prepare('UPDATE reviews SET is_published = 1 WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    }
    res.json({ message: isPublished ? 'Recensione approvata' : 'Recensione rimossa' });
  } catch (err) {
    res.status(500).json({ error: 'Errore moderazione recensione' });
  }
});

module.exports = router;
