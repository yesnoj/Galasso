/**
 * Routes - Autenticazione
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });
  
  // Salva refresh token
  const db = getDb();
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(id, userId, refreshToken, expiresAt);
  
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, nome e cognome sono obbligatori' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata' });
    }

    const allowedRoles = ['org_admin', 'ente_referente', 'public'];
    const userRole = allowedRoles.includes(role) ? role : 'public';

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, email.toLowerCase(), passwordHash, userRole, firstName, lastName, phone || null);

    const tokens = generateTokens(id);

    res.status(201).json({
      user: { id, email: email.toLowerCase(), role: userRole, firstName, lastName },
      ...tokens
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Aggiorna ultimo accesso
    db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

    const tokens = generateTokens(user.id);

    // Carica organizzazione se org_admin
    let organization = null;
    if (user.role === 'org_admin' || user.role === 'org_operator') {
      organization = db.prepare('SELECT id, name, status FROM organizations WHERE admin_user_id = ?').get(user.id);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        organization
      },
      ...tokens
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token richiesto' });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const db = getDb();
    
    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?').get(refreshToken, decoded.userId);
    if (!stored) {
      return res.status(401).json({ error: 'Refresh token non valido' });
    }

    // Elimina vecchio token e genera nuovo
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    const tokens = generateTokens(decoded.userId);

    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token scaduto o non valido' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Logout effettuato' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, email, role, first_name, last_name, phone, created_at, last_login
    FROM users WHERE id = ?
  `).get(req.user.id);
  
  // Se è org_admin, includi info organizzazione
  let organization = null;
  if (user.role === 'org_admin') {
    organization = db.prepare('SELECT id, name, status FROM organizations WHERE admin_user_id = ?').get(user.id);
  }

  res.json({ ...user, organization });
});

// PUT /api/auth/me
router.put('/me', authenticate, (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), 
      phone = COALESCE(?, phone), updated_at = datetime('now') WHERE id = ?
    `).run(firstName, lastName, phone, req.user.id);

    res.json({ message: 'Profilo aggiornato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento profilo' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password attuale e nuova password (min 8 caratteri) obbligatorie' });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Password attuale non corretta' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(newHash, req.user.id);

    res.json({ message: 'Password aggiornata' });
  } catch (err) {
    res.status(500).json({ error: 'Errore aggiornamento password' });
  }
});

module.exports = router;
