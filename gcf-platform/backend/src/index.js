/**
 * GCF Platform - Server principale
 * Green Care Farm Certificata - AICARE
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDb, getDb, closeDb } = require('./utils/database');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 200, message: { error: 'Troppe richieste' } }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend statico - cerca in Docker e locale
const frontendCandidates = [
  path.join(__dirname, '..', 'frontend', 'build'),
  path.join(__dirname, '..', '..', 'frontend', 'build'),
];
const frontendPath = frontendCandidates.find(p => fs.existsSync(p)) || frontendCandidates[0];
if (fs.existsSync(frontendPath)) {
  console.log('Frontend servito da:', frontendPath);
  app.use(express.static(frontendPath));
}

// Uploads
const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use('/uploads', express.static(uploadPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/certifications', require('./routes/certifications'));
app.use('/api/audits', require('./routes/audits'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/registry', require('./routes/registry'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  try { getDb().prepare('SELECT 1').get(); res.json({ status: 'ok', version: '1.0.0' }); }
  catch (err) { res.status(500).json({ status: 'error', error: err.message }); }
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint non trovato' });
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GCF</title></head><body>
    <h1>🌿 GCF Platform</h1><p style="color:green">✓ Backend attivo porta ${PORT}</p>
    <p>API: <code>/api/health</code>, <code>/api/registry</code></p></body></html>`);
});

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Errore server' }); });

// Start con init asincrono del database
async function start() {
  await initDb();
  console.log('Database connesso.');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌿 GCF Platform attivo su http://0.0.0.0:${PORT}\n`);
  });
}

start().catch(err => { console.error('Errore avvio:', err); process.exit(1); });

process.on('SIGTERM', () => { closeDb(); process.exit(0); });
process.on('SIGINT', () => { closeDb(); process.exit(0); });
