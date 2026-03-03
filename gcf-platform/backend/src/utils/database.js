/**
 * Database connection - sql.js wrapper
 * API compatibile con better-sqlite3 usando sql.js (puro JS, no compilazione nativa)
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db', 'gcf.sqlite');
let db = null;
let saveTimer = null;

function saveToFile() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToFile, 500);
}

async function initDb() {
  if (db) return;
  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
}

// API wrapper compatibile con better-sqlite3
function getDb() {
  if (!db) throw new Error('Database non inizializzato. Chiamare await initDb().');
  return {
    prepare(sql) {
      return {
        run(...params) {
          const safeParams = params.map(p => p === undefined ? null : p);
          db.run(sql, safeParams);
          scheduleSave();
          return { changes: db.getRowsModified() };
        },
        get(...params) {
          const safeParams = params.map(p => p === undefined ? null : p);
          const stmt = db.prepare(sql);
          if (safeParams.length) stmt.bind(safeParams);
          let row;
          if (stmt.step()) row = stmt.getAsObject();
          stmt.free();
          return row;
        },
        all(...params) {
          const safeParams = params.map(p => p === undefined ? null : p);
          const results = [];
          const stmt = db.prepare(sql);
          if (safeParams.length) stmt.bind(safeParams);
          while (stmt.step()) results.push(stmt.getAsObject());
          stmt.free();
          return results;
        }
      };
    },
    exec(sql) { db.exec(sql); scheduleSave(); },
    pragma(s) { try { db.run('PRAGMA ' + s); } catch(e) {} },
    transaction(fn) {
      return (...args) => {
        db.run('BEGIN TRANSACTION');
        try {
          const r = fn(...args);
          db.run('COMMIT');
          scheduleSave();
          return r;
        } catch (e) { db.run('ROLLBACK'); throw e; }
      };
    },
    close() {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      saveToFile();
      if (db) { db.close(); db = null; }
    }
  };
}

function closeDb() { try { getDb().close(); } catch(e) {} }

async function reloadDb() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (db) { db.close(); db = null; }
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
}

module.exports = { initDb, getDb, closeDb, saveToFile, reloadDb };
