/**
 * Middleware di autenticazione e autorizzazione
 */
const jwt = require('jsonwebtoken');
const { getDb } = require('../utils/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'gcf-aicare-secret-change-me-2026';

/**
 * Verifica token JWT
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Utente non trovato o disattivato' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token non valido' });
  }
}

/**
 * Autorizzazione per ruoli
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Non autorizzato per questa operazione' });
    }
    next();
  };
}

/**
 * Opzionale - non blocca se non c'è token
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  authenticate(req, res, next);
}

module.exports = { authenticate, authorize, optionalAuth, JWT_SECRET };
