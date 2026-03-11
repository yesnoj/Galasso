# 🌿 GCF Platform — Green Care Farm Certificata AICARE

Piattaforma web per la gestione del ciclo completo di certificazione delle organizzazioni che erogano servizi di **agricoltura sociale** in Italia, secondo lo standard **SNM-AS v1.0** (Standard Nazionale Minimo — Agricoltura Sociale).

![Node.js](https://img.shields.io/badge/Node.js-20_Alpine-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![License](https://img.shields.io/badge/License-Proprietario-red)

---

## Indice

- [Panoramica](#panoramica)
- [Funzionalità](#funzionalità)
- [Architettura](#architettura)
- [Stack tecnologico](#stack-tecnologico)
- [Struttura del progetto](#struttura-del-progetto)
- [Installazione](#installazione)
- [Deployment Docker (QNAP / NAS)](#deployment-docker-qnap--nas)
- [Database](#database)
- [API Reference](#api-reference)
- [Ruoli e permessi](#ruoli-e-permessi)
- [Flusso di certificazione](#flusso-di-certificazione)
- [Interfaccia mobile](#interfaccia-mobile)
- [Dati di esempio](#dati-di-esempio)
- [Documentazione allegata](#documentazione-allegata)
- [Credenziali demo](#credenziali-demo)
- [Changelog](#changelog)

---

## Panoramica

La piattaforma gestisce l'intero ciclo di vita della certificazione **Green Care Farm — AICARE**:

1. **Registrazione** dell'organizzazione con upload documenti di legittimazione (visura camerale, statuto, delega)
2. **Verifica e attivazione** da parte dell'admin AICARE (scarica PDF, verifica, attiva)
3. **Richiesta certificazione** con upload documentazione di conformità
4. **Revisione documentale** da parte dell'admin con download/verifica PDF
5. **Audit di conformità** con checklist a 14 requisiti / 5 aree (compilata dall'auditor)
6. **Rilascio certificato** con numero univoco e validità triennale (solo se tutti i 14 requisiti C)
7. **Registro pubblico** delle organizzazioni certificate consultabile senza login

Il sistema implementa una **separazione rigorosa dei ruoli**: l'admin verifica documenti e assegna gli audit, ma solo l'auditor può compilare la checklist. L'admin non crea organizzazioni né gestisce beneficiari/attività — sono compiti dell'organizzazione stessa.

---

## Funzionalità

### Gestione completa
- Organizzazioni con dati anagrafici, servizi, target utenza, coordinate GPS
- Certificazioni con workflow a stati (inviata → revisione → audit → rilascio)
- Audit con checklist 14 requisiti / 5 aree, evidenze, note, azioni correttive
- Beneficiari anonimi con codice, tipologia, ente inviante
- Registro attività quotidiane con durata in ore e tipo di servizio
- Generazione PDF (certificati ufficiali e report audit)

### Interfaccia utente
- SPA (Single Page Application) con routing hash-based
- Dashboard con statistiche cliccabili e card interattive
- 6 ruoli con permessi granulari e viste dedicate
- Badge notifiche nella sidebar (solo per azioni azionabili)
- Nomi organizzazione cliccabili in tutte le tabelle
- Modal personalizzate (no `alert`/`confirm` nativi del browser)
- Layout mobile responsive con card-based tables (12 tabelle convertite)
- Dropdown touch-friendly (16px, min-height 44px)
- Form a colonna singola su smartphone

### Sicurezza
- Autenticazione JWT con refresh token
- Bcrypt per hash password
- Helmet per header HTTP sicuri
- Rate limiting
- Validazione input lato server
- CORS configurabile
- Upload file con validazione MIME type e dimensione

---

## Architettura

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  app.js   │  │ style.css│  │index.html│              │
│  │ (3100+ LOC)│  │ (350 LOC)│  │ (15 LOC) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────┬───────────────────────────────────┘
                      │ fetch() → /api/*
┌─────────────────────▼───────────────────────────────────┐
│                 Express.js Server                        │
│  ┌────────┐ ┌──────────────┐ ┌─────────────────┐       │
│  │  Auth  │ │   7 Route    │ │   Middleware     │       │
│  │  JWT   │ │   Modules    │ │ (auth, multer)   │       │
│  └────────┘ └──────────────┘ └─────────────────┘       │
│                      │                                   │
│              ┌───────▼────────┐                          │
│              │  sql.js (SQLite)│                          │
│              │   25 tabelle    │                          │
│              └───────┬────────┘                          │
│                      │                                   │
│              ┌───────▼────────┐  ┌──────────────┐       │
│              │   db/gcf.sqlite │  │ uploads/*.pdf │       │
│              └────────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Stack tecnologico

| Componente | Tecnologia | Note |
|-----------|------------|------|
| **Runtime** | Node.js 20 (Alpine) | Immagine Docker leggera |
| **Backend** | Express.js 4.18 | REST API |
| **Database** | sql.js 1.14 (SQLite in-memory) | Persistenza su file con auto-save |
| **Auth** | JWT + bcryptjs | Access token 24h + refresh token 7d |
| **PDF** | PDFKit 0.15 | Certificati e report audit |
| **Upload** | Multer | File PDF fino a 10 MB |
| **Sicurezza** | Helmet + express-rate-limit | Header sicuri + rate limiting |
| **Frontend** | Vanilla JS (SPA) | Nessun framework, nessun build step |
| **CSS** | CSS custom + media queries | Design responsive mobile-first |
| **Container** | Docker + Docker Compose | Ottimizzato per QNAP NAS |

**Zero dipendenze frontend** — nessun React, Vue, Angular, webpack o npm install lato client.

---

## Struttura del progetto

```
gcf-platform/
├── Dockerfile                  # Build container Node.js Alpine
├── docker-compose.yml          # Orchestrazione con volumi persistenti
├── README.md                   # Questo file
│
├── backend/
│   ├── .env                    # Configurazione ambiente
│   ├── package.json            # Dipendenze Node.js
│   ├── seed.js                 # Dati di esempio realistici
│   ├── db/                     # Database SQLite (generato)
│   ├── uploads/                # Documenti PDF caricati
│   └── src/
│       ├── index.js            # Entry point Express
│       ├── init-db.js          # Schema DB (25 tabelle)
│       ├── middleware/
│       │   └── auth.js         # JWT authentication + role check
│       ├── routes/
│       │   ├── admin.js        # Dashboard admin, utenti, recensioni
│       │   ├── audits.js       # CRUD audit + checklist + PDF
│       │   ├── auth.js         # Login, registrazione, profilo, badge
│       │   ├── beneficiaries.js # CRUD beneficiari + attività
│       │   ├── certifications.js # Workflow certificazione + documenti
│       │   ├── organizations.js # CRUD organizzazioni
│       │   └── registry.js     # Registro pubblico + recensioni
│       └── utils/
│           └── database.js     # Wrapper sql.js con auto-save
│
└── frontend/
    └── build/
        ├── index.html          # Shell HTML (15 righe)
        ├── app.js              # Intera applicazione SPA (2600+ LOC)
        └── style.css           # Stili + responsive (350+ LOC)
```

---

## Installazione

### Prerequisiti

- **Node.js** 18+ (consigliato 20 LTS)
- **npm** (incluso con Node.js)
- **Docker** + **Docker Compose** (per deployment containerizzato)

### Installazione locale (sviluppo)

```bash
# Clona il repository
git clone https://github.com/AICARE/gcf-platform.git
cd gcf-platform

# Installa dipendenze backend
cd backend
npm install

# Inizializza il database
node src/init-db.js

# (Opzionale) Popola con dati di esempio
node seed.js

# Avvia il server
node src/index.js
# oppure con auto-reload:
npm run dev
```

La piattaforma sarà disponibile su **http://localhost:3000**

### Variabili d'ambiente (.env)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=CAMBIARE-IN-PRODUZIONE          # Obbligatorio
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
DB_PATH=./db/gcf.sqlite
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760                      # 10 MB
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Importante:** cambiare `JWT_SECRET` con un valore casuale lungo in produzione.

---

## Deployment Docker (QNAP / NAS)

Il progetto è ottimizzato per deployment su **QNAP TS-253A** (Celeron N3150, 4 GB RAM) ma funziona su qualsiasi host Docker.

### Primo deploy

```bash
# Trasferisci il progetto sul NAS (dal Mac)
scp -r gcf-platform admin@192.168.1.111:/share/Container/gcf-platform

# Accedi al NAS via SSH
ssh admin@192.168.1.111
cd /share/Container/gcf-platform

# Build e avvio (NOTA: su QNAP è "docker compose" senza trattino)
docker compose up -d --build

# Verifica che il server sia attivo
docker logs gcf-platform
# → 🌿 GCF Platform attivo su http://0.0.0.0:3000

# Popola il database con dati di esempio
docker cp backend/seed.js gcf-platform:/app/seed.js
docker exec gcf-platform node /app/seed.js
```

La piattaforma è ora disponibile su **http://192.168.1.111:3000** da qualsiasi dispositivo sulla rete LAN.

### Gestione container

```bash
# Verifica stato
docker logs gcf-platform

# Stop
docker compose down

# Stop con rimozione dati (⚠️ cancella database e uploads)
docker compose down -v

# Riavvio dopo modifica file
docker compose up -d --build
```

### Aggiornamento file (senza rebuild)

Per aggiornare singoli file senza ricostruire l'immagine:

```bash
# Frontend (app.js, style.css, index.html)
docker cp frontend/build/app.js gcf-platform:/app/frontend/build/app.js
docker cp frontend/build/style.css gcf-platform:/app/frontend/build/style.css
docker cp frontend/build/index.html gcf-platform:/app/frontend/build/index.html

# Backend (routes, middleware)
docker cp backend/src/routes/auth.js gcf-platform:/app/src/routes/auth.js
docker restart gcf-platform   # Necessario solo per file backend

# Rigenerare il seed (resetta il database con dati demo)
docker cp backend/seed.js gcf-platform:/app/seed.js
docker exec gcf-platform node /app/seed.js
```

> 💡 I file frontend non richiedono riavvio — basta un hard refresh nel browser (Cmd+Shift+R / Ctrl+Shift+R).

### Accesso da smartphone (stessa rete WiFi)

Qualsiasi dispositivo connesso alla stessa rete può accedere alla piattaforma:

```
http://192.168.1.111:3000
```

Per testare dal Mac in locale (se il server gira anche sul Mac):
```bash
# Trova l'IP del Mac
ipconfig getifaddr en0
# → es. 192.168.1.44

# Dal telefono: http://192.168.1.44:3000
```

### Risorse allocate

| Risorsa | Limite | Riservato |
|---------|--------|-----------|
| RAM | 512 MB | 128 MB |
| CPU | 2 core | 0.5 core |

### Volumi persistenti

| Volume | Percorso nel container | Contenuto |
|--------|----------------------|-----------|
| `gcf-data` | `/app/db/` | Database SQLite |
| `gcf-uploads` | `/app/uploads/` | Documenti PDF |

### Accesso remoto

La piattaforma è accessibile pubblicamente tramite **Cloudflare Tunnel**:

```
🌐 https://gcf.aicare.it
```

Il tunnel è gestito da un container dedicato (`gcf-cloudflared`) che espone il servizio senza necessità di port forwarding o modifiche al router. Include HTTPS automatico, protezione DDoS e nessun limite di connessioni.

### Health check

```bash
curl http://localhost:3000/api/health
# → { "status": "ok", "timestamp": "..." }
```

---

## Database

### Schema (25 tabelle)

```
ENTITÀ PRINCIPALI
├── users                       # Utenti con ruoli
├── organizations               # Organizzazioni certificate/da certificare
├── certifications              # Domande e certificazioni rilasciate
├── audits                      # Audit di conformità
├── beneficiaries               # Beneficiari anonimi (codice)
└── activity_logs               # Registro attività quotidiane

RELAZIONI
├── organization_services       # Servizi erogati (coterapia, educativa...)
├── organization_target_users   # Utenza target (minori, disabili...)
├── organization_images         # Immagini organizzazione
├── organization_documents      # Documenti di legittimazione (visura, statuto, delega)
├── organization_partners       # Enti partner
├── certification_documents     # PDF allegati alla certificazione
├── audit_evaluations           # Valutazioni per requisito
├── audit_attachments           # Allegati audit
├── corrective_actions          # Azioni correttive post-audit
├── individual_projects         # Progetti individuali beneficiari
└── monitoring_reports          # Report di monitoraggio enti referenti

SISTEMA
├── audit_areas                 # 5 aree di valutazione (reference)
├── certification_requirements  # 14 requisiti standard (reference)
├── reviews                     # Recensioni pubbliche
├── events                      # Calendario eventi
├── notifications               # Notifiche utente
├── refresh_tokens              # Token di refresh JWT
├── partner_entities            # Anagrafica enti partner
└── system_logs                 # Log di sistema
```

### Requisiti di certificazione (5 aree, 14 requisiti)

| Area | Req. | Titolo | Evidenze accettabili |
|------|------|--------|---------------------|
| 1. Identità e trasparenza | 1.1 | Soggetto legittimato | Visura camerale, iscrizione albo regionale (se previsto) |
| | 1.2 | Definizione servizi | Descrizione servizi, documento interno, materiale informativo, sito web |
| | 1.3 | Responsabile servizi | Nomina formale, organigramma, dichiarazione |
| 2. Gestione attività sociali | 2.1 | Progettazione attività | Progetti individuali, convenzioni, accordi con enti/associazioni, progetti collettivi |
| | 2.2 | Monitoraggio attività | Registro, report, note di monitoraggio |
| | 2.3 | Impegno all'inclusione | Dichiarazione di impegno, politica inclusione/non discriminazione |
| 3. Sicurezza e tutela | 3.1 | Conformità strutturale | Titolo disponibilità locali, documentazione edilizia, igienico-sanitaria |
| | 3.2 | Sicurezza sul lavoro | Autocertificazione, documentazione sicurezza (DVR) |
| | 3.3 | Tutela persone | Procedure tutela, modalità operative, supervisione |
| | 3.4 | Affidabilità e onorabilità | Dichiarazione assenza cause interdittive |
| 4. Competenze e organizzazione | 4.1 | Competenze | Attestato formazione, esperienza ≥2 anni documentata |
| | 4.2 | Organizzazione | Organigramma, mansionari, descrizione ruoli |
| 5. Impegno alla qualità | 5.1 | Impegno formale | Dichiarazione firmata, politica qualità |
| | 5.2 | Aggiornamento documentale | Registro aggiornamenti, archivio, evidenza annuale |

---

## API Reference

**Base URL:** `/api`

### Autenticazione (`/api/auth`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrazione nuovo utente | No |
| POST | `/auth/login` | Login con email/password → JWT | No |
| POST | `/auth/refresh` | Refresh token | No |
| GET | `/auth/profile` | Profilo utente corrente | ✅ |
| PUT | `/auth/profile` | Aggiorna profilo | ✅ |
| PUT | `/auth/change-password` | Cambia password | ✅ |
| POST | `/auth/logout` | Logout (invalida refresh token) | ✅ |
| GET | `/auth/badges` | Contatori badge sidebar | ✅ |

### Organizzazioni (`/api/organizations`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/organizations` | Lista organizzazioni (filtrata per ruolo) | ✅ |
| GET | `/organizations/:id` | Dettaglio organizzazione | ✅ |
| POST | `/organizations` | Crea organizzazione | Org Admin |
| PUT | `/organizations/:id` | Modifica organizzazione | Admin/Org |
| PATCH | `/organizations/:id/status` | Cambia stato | Admin |
| POST | `/organizations/:id/documents` | Upload documento legittimazione (PDF) | Org Admin |
| GET | `/organizations/:id/documents` | Lista documenti organizzazione | Admin/Org |
| GET | `/organizations/:id/documents/:docId/download` | Scarica documento PDF | Admin/Org |
| DELETE | `/organizations/:id/documents/:docId` | Elimina documento | Admin/Org |
| POST | `/organizations/:id/images` | Upload foto organizzazione | Admin/Org Admin |
| GET | `/organizations/:id/images` | Lista foto organizzazione | Pubblico |
| PUT | `/organizations/:id/images/:imgId/primary` | Imposta foto principale | Admin/Org Admin |
| DELETE | `/organizations/:id/images/:imgId` | Elimina foto | Admin/Org Admin |

### Certificazioni (`/api/certifications`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/certifications` | Lista certificazioni | ✅ |
| GET | `/certifications/:id` | Dettaglio con audit e documenti | ✅ |
| POST | `/certifications` | Richiedi certificazione | Org |
| PATCH | `/certifications/:id/start-review` | Avvia revisione documentale | Admin |
| PATCH | `/certifications/:id/approve-docs` | Approva documenti | Admin |
| PATCH | `/certifications/:id/reject-docs` | Respingi documenti | Admin |
| PATCH | `/certifications/:id/issue` | Rilascia certificato | Admin |
| POST | `/certifications/:id/documents` | Upload documento PDF | Org Admin/Op |
| DELETE | `/certifications/:id/documents/:docId` | Elimina documento | Org Admin/Op |

### Audit (`/api/audits`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/audits` | Lista audit (filtrata per ruolo) | ✅ |
| GET | `/audits/:id` | Dettaglio con valutazioni e requisiti | ✅ |
| POST | `/audits` | Crea e assegna audit | Admin |
| PUT | `/audits/:id/evaluations` | Salva valutazioni checklist | Auditor |
| PATCH | `/audits/:id/complete` | Completa audit | Auditor |
| GET | `/audits/:id/pdf` | Scarica report PDF | ✅ |
| GET | `/audits/:id/certificate-pdf` | Scarica certificato PDF | ✅ |
| DELETE | `/audits/:id` | Elimina audit pianificato | Admin |

### Beneficiari e Attività (`/api/beneficiaries`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/beneficiaries` | Lista beneficiari (filtrata per ruolo/ente) | ✅ |
| GET | `/beneficiaries/enti-referenti` | Lista enti referenti per dropdown | ✅ |
| GET | `/beneficiaries/report` | Genera report Excel beneficiari | Org Admin/Op |
| GET | `/beneficiaries/:id` | Dettaglio beneficiario | ✅ |
| POST | `/beneficiaries` | Crea beneficiario | Org Admin/Op |
| PUT | `/beneficiaries/:id` | Modifica beneficiario | Org Admin/Op |
| DELETE | `/beneficiaries/:id` | Elimina (se senza attività) | Org Admin/Op |
| GET | `/beneficiaries/activities` | Lista attività | ✅ |
| POST | `/beneficiaries/activities` | Registra attività | Org Admin/Op |
| PUT | `/beneficiaries/activities/:id` | Modifica attività | Org Admin/Op |
| DELETE | `/beneficiaries/activities/:id` | Elimina attività | Org Admin/Op |
| GET | `/beneficiaries/org/:orgId` | Beneficiari per organizzazione | ✅ |
| GET | `/beneficiaries/activities/org/:orgId` | Attività per organizzazione | ✅ |

### Admin (`/api/admin`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Statistiche globali | Admin |
| GET | `/admin/dashboard` | Dashboard avanzata | Admin |
| GET | `/admin/users` | Lista utenti | Admin |
| POST | `/admin/users` | Crea utente | Admin |
| PUT | `/admin/users/:id` | Modifica utente | Admin |
| PATCH | `/admin/users/:id/toggle-active` | Attiva/disattiva | Admin |
| PATCH | `/admin/users/:id/reset-password` | Reset password | Admin |
| GET | `/admin/reviews` | Recensioni da moderare | Admin |
| PATCH | `/admin/reviews/:id/approve` | Approva recensione | Admin |
| DELETE | `/admin/reviews/:id` | Rifiuta/elimina recensione | Admin |

### Registro Pubblico (`/api/registry`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/registry/organizations` | Organizzazioni certificate | No |
| GET | `/registry/organizations/:id` | Dettaglio pubblico | No |
| GET | `/registry/organizations/:id/reviews` | Recensioni pubblicate | No |
| POST | `/registry/organizations/:id/reviews` | Scrivi recensione | ✅ |
| GET | `/registry/stats` | Statistiche pubbliche | No |
| GET | `/registry/services` | Lista servizi disponibili | No |
| GET | `/registry/regions` | Regioni con organizzazioni | No |
| GET | `/registry/search` | Ricerca organizzazioni | No |

**Totale: 65 endpoint**

---

## Ruoli e permessi

| Funzionalità | Admin | Auditor | Org Admin | Operatore | Istit. Ref. |
|-------------|:-----:|:-------:|:---------:|:---------:|:---------:|
| Dashboard completa | ✅ | ✅ | ✅* | ✅* | ✅ |
| Creare organizzazione | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modificare organizzazione | ✅ | ❌ | ✅* | ✅* | ❌ |
| Cambiare stato organizzazione | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload documenti legittimazione | ❌ | ❌ | ✅* | ❌ | ❌ |
| Upload foto organizzazione | ✅ | ❌ | ✅* | ❌ | ❌ |
| Verificare documenti organizzazione | ✅ | ❌ | ✅* | ❌ | ❌ |
| Richiedere certificazione | ❌ | ❌ | ✅* | ❌ | ❌ |
| Upload documenti certificazione | ❌ | ❌ | ✅* | ✅* | ❌ |
| Revisione documenti certificazione | ✅ | ❌ | ❌ | ❌ | ❌ |
| Creare/assegnare audit | ✅ | ❌ | ❌ | ❌ | ❌ |
| Compilare checklist audit | ❌ | ✅ | ❌ | ❌ | ❌ |
| Visualizzare checklist (sola lettura) | ✅ | — | ✅* | ✅* | ❌ |
| Rilasciare certificato | ✅ | ❌ | ❌ | ❌ | ❌ |
| Beneficiari (CRUD) | 👁 | ❌ | ✅*‡ | ✅*‡ | 👁† |
| Report Excel beneficiari | ❌ | ❌ | ✅*‡ | ✅*‡ | ❌ |
| Attività (CRUD) | 👁 | ❌ | ✅*‡ | ✅*‡ | ❌ |
| Gestione utenti | ✅ | ❌ | ❌ | ❌ | ❌ |
| Moderazione recensioni | ✅ | ❌ | ❌ | ❌ | ❌ |
| Registro pubblico | ✅ | ✅ | ✅ | ✅ | ✅ |

*\* = solo per la propria organizzazione. 👁 = sola lettura. † = solo beneficiari collegati al proprio utente. ‡ = solo se l'organizzazione ha certificazione rilasciata (status `issued`).*

---

## Flusso di certificazione

```
  ORGANIZZAZIONE          ADMIN                 AUDITOR
       │                    │                      │
  ┌────▼─────────┐          │                      │
  │ Registrazione│          │                      │
  │ + upload doc │──────────▶                      │
  │ legittimaz.  │     ┌────▼─────────┐            │
  └──────────────┘     │  Verifica    │            │
                       │  documenti   │            │
                       │  → Attiva org│            │
                       └──────┬───────┘            │
  ┌────────────────────◀──────┘                    │
  │                    │                           │
  ┌────▼────┐          │                           │
  │ Domanda │          │                           │
  │ cert.   │──────────▶                           │
  └─────────┘     ┌────▼────────┐                  │
                  │  Revisione  │                  │
                  │  documenti  │                  │
                  └──────┬──────┘                  │
                    ┌────▼────┐                    │
                    │ Approva │                    │
                    │   doc   │                    │
                    └────┬────┘                    │
                    ┌────▼──────────┐              │
                    │ Crea audit e  │──────────────▶
                    │ assegna auditor│         ┌────▼─────────┐
                    └───────────────┘         │  Compila      │
                                              │  checklist    │
                                              │  (14 req.)    │
                                              └────┬──────────┘
                    ┌────────────────────◀─────────┘
               ┌────▼────────┐
               │  Rilascia   │ Solo se 14/14 C
               │ certificato │
               └──────┬──────┘
                 ┌────▼────┐
                 │ ISSUED  │  Validità 3 anni
                 └─────────┘
```

### Stati certificazione

| Stato | Significato | Azione successiva |
|-------|------------|-------------------|
| `submitted` | Domanda inviata | Admin: avvia revisione |
| `doc_review` | Documenti in revisione | Admin: approva/respingi |
| `doc_approved` | Documenti approvati | Admin: pianifica audit |
| `doc_rejected` | Documenti respinti | Org: corregge e riinvia |
| `audit_planned` | Audit pianificato | Auditor: compila checklist |
| `audit_completed` | Audit completato | Admin: rilascia certificato |
| `issued` | Certificato rilasciato | — (sorveglianza periodica) |
| `rejected` | Certificazione negata | — |

### Esiti audit

| Esito | Condizione |
|-------|-----------|
| **Conforme** | Tutti i 14 requisiti C |
| **Conforme con azioni correttive** | ≥1 PC, nessun NC |
| **Non conforme** | ≥1 NC |

---

## Interfaccia mobile

La piattaforma è completamente responsive per smartphone e tablet.

### Ottimizzazioni mobile (< 768px)

| Componente | Desktop | Mobile |
|-----------|---------|--------|
| Tabelle dati | Tabella tradizionale con header | Card verticali con etichette (`data-label`) |
| Sidebar | Fissa a sinistra (260px) | Overlay con backdrop scuro, auto-close |
| Form | Multi-colonna | Colonna singola, larghezza piena |
| Modal | Max-width limitata | 95% larghezza schermo |
| Select/dropdown | 14px | 16px con min-height 44px |
| Bottoni | Dimensioni standard | Min-height 44px (Apple touch target) |

**12 tabelle** convertite a layout card con **59 attributi `data-label`** per le etichette mobile.

Il font 16px sulle select previene lo zoom automatico di iOS.

---

## Dati di esempio

Il file `seed.js` popola il database con dati realistici italiani:

| Entità | Quantità | Dettagli |
|--------|----------|---------|
| Utenti | 17 | Admin, 2 auditor, 7 org admin, 3 operatori, 3 enti, 1 pubblico |
| Organizzazioni | 7 | 3 certificate (issued), 1 audit completato, 1 cert inviata, 2 pending |
| Certificazioni | 5 | 3 rilasciate (14C), 1 audit completato (10C+2PC+2NA), 1 appena inviata |
| Audit | 4 | 4 completati con valutazioni dettagliate su 14 requisiti |
| Beneficiari | 13 | Solo su org certificate. 3 collegati a enti referenti registrati |
| Attività | ~200 | Generate per 60 giorni, 6 tipologie di servizio. Solo su org certificate |
| Recensioni | 9 | 6 pubblicate, 3 da moderare |
| Azioni correttive | 2 | Per Campo Sociale (req. 3.3 e 4.2 parzialmente conformi) |
| Regioni | 3 | Emilia-Romagna, Toscana, Piemonte |

**Regole di business rispettate nel seed:**
- Org pending → nessuna certificazione, beneficiari, attività
- Org attiva senza cert issued → nessun beneficiario, nessuna attività
- Cert issued → tutti 14 requisiti C nell'ultimo audit
- Operatori collegati via `organization_id` alla stessa org dell'org_admin

### Eseguire il seed

**Locale (sviluppo sul Mac):**
```bash
cd backend
node src/seed.js
```

**Docker (NAS / produzione):**
```bash
docker cp backend/src/seed.js gcf-platform:/app/src/seed.js
docker exec gcf-platform rm /app/db/gcf.sqlite /app/db/.seeded
docker exec gcf-platform node /app/src/init-db.js
docker exec gcf-platform node /app/src/seed.js
docker restart gcf-platform
```

> ⚠️ Il seed svuota le tabelle dati e le ripopola. Le tabelle di riferimento (aree, requisiti) non vengono toccate. Eseguire solo per demo/test, non su dati reali.

---

## Documentazione allegata

| Documento | Codice | Descrizione |
|-----------|--------|-------------|
| **Standard** | SNM-AS v1.0 | Standard Nazionale Minimo — Agricoltura Sociale |
| **Checklist Audit** | SNM-AS-AUD-01 v1.0 | Modulo di verifica per l'auditor (14 requisiti, 5 aree) |
| **Certificato** | AICARE-GCF-CERT-01 v1.0 | Template certificato di conformità |
| **Registro** | AICARE-GCF-REG-01 v1.0 | Registro ufficiale organizzazioni certificate |
| **Guida Operativa** | v9.0 | Manuale utente completo |
| **Diagramma Ruoli** | HTML interattivo | Mappa interattiva azioni per ruolo |
| **Schema Flusso** | — | Schema esemplificativo servizi agricoltura sociale |

---

## Credenziali demo

| Ruolo | Email | Password | Organizzazione | Stato |
|-------|-------|----------|----------------|-------|
| Amministratore | `admin@gcf.it` | `admin123` | — | — |
| Auditor 1 | `luca.bianchi@gcf.it` | `auditor123` | — | — |
| Auditor 2 | `anna.moretti@gcf.it` | `auditor123` | — | — |
| Admin Org | `giuseppe.verdi@terrabuona.it` | `org12345` | Terra Buona | ✅ Certificata |
| Admin Org | `maria.conti@ilvigneto.it` | `org12345` | Il Vigneto | ✅ Certificata |
| Admin Org | `stefano.landi@collina.it` | `org12345` | La Collina (Toscana) | ✅ Certificata |
| Admin Org | `paolo.ferrara@camposociale.it` | `org12345` | Campo Sociale | ⏳ Audit completato |
| Admin Org | `laura.gatti@cascinadelsole.it` | `org12345` | Cascina del Sole (Piemonte) | 📩 Cert. inviata |
| Admin Org | `elena.russo@fattoriasperanza.it` | `org12345` | Fattoria Speranza | ⏳ Org. pending |
| Admin Org | `francesco.romano@ortosociale.it` | `org12345` | Orto Sociale Bologna | ⏳ Org. pending |
| Operatore | `chiara.esposito@terrabuona.it` | `oper1234` | Terra Buona | ✅ Certificata |
| Operatore | `davide.colombo@ilvigneto.it` | `oper1234` | Il Vigneto | ✅ Certificata |
| Operatore | `sara.neri@collina.it` | `oper1234` | La Collina (Toscana) | ✅ Certificata |
| Istituzione Referente | `silvia.gallo@csmpiacenza.it` | `ente1234` | — | Vede TB-001/004 |
| Istituzione Referente | `roberto.fontana@csmparma.it` | `ente1234` | — | Vede VG-003 |
| Istituzione Referente | `chiara.martini@aslarezzo.it` | `ente1234` | — | Vede LC-003 |
| Utente pubblico | `giovanna.marino@gmail.com` | `user1234` | — | — |

> ⚠️ Queste credenziali sono solo per demo/test. Cambiarle in produzione.

---

## Changelog

### v2.3 — Marzo 2026 (Checklist audit, rinomina ruolo)

**Checklist audit — Aggiornamento evidenze**
- Req. 1.1: evidenze ridotte a "Visura camerale" + "Iscrizione albo regionale (se previsto)"
- Req. 1.2: aggiunto "Sito web" tra gli elementi di verifica
- Req. 2.1: "Accordi con enti" → "Accordi con enti/associazioni"; "Documentazione equivalente" → "Progetti collettivi"
- Req. 2.3: "Dichiarazione scritta" → "Dichiarazione di impegno"

**Rinomina ruolo: "Ente Referente" → "Istituzione Referente"**
- Aggiornate tutte le etichette visibili nella piattaforma (sidebar, form, popup, registrazione)
- Il nome tecnico del ruolo nel database (`ente_referente`) e il campo (`ente_user_id`) restano invariati per compatibilità
- Documentazione (README, diagramma ruoli, guida operativa) aggiornata

### v2.2 — Marzo 2026 (Ruoli operatore, regole business, documenti audit)

**Architettura ruoli — `organization_id` su utenti**
- Nuovo campo `organization_id` nella tabella `users` per collegare ogni utente alla propria organizzazione
- Più utenti (org_admin + operatori) possono appartenere alla stessa organizzazione senza conflitti
- Il campo `admin_user_id` su `organizations` resta come riferimento al proprietario/creatore
- Migrazione automatica per database esistenti: popola `organization_id` da `admin_user_id`
- Tutti gli endpoint backend aggiornati per usare `user.organization_id` per filtri e permessi

**Regola business: certificazione obbligatoria**
- Beneficiari e attività possono essere creati solo da organizzazioni con certificazione rilasciata (status `issued`)
- Banner giallo "Organizzazione non ancora certificata" nelle pagine Beneficiari e Attività
- Il pulsante "+ Nuovo" è nascosto per org non certificate

**Documenti allegati nella checklist audit**
- L'auditor può ora visualizzare e scaricare i documenti PDF caricati dall'organizzazione
- Sezione collassabile "📎 Documenti allegati dall'organizzazione" nella pagina checklist
- Mostra nome file, dimensione, autore, data e pulsante download

**Miglioramenti UX**
- Istituzione referente: pulsante "← Torna ai beneficiari" (invece di "Torna alle organizzazioni") nel dettaglio org
- Rimossa funzionalità "foto principale" (badge ⭐ e pulsante) dalla galleria foto
- Operatore: messaggio dashboard "Nessuna certificazione attiva" (senza link "Fai domanda")
- Report Excel: disponibile anche per org con beneficiari pre-esistenti

**Seed database completamente riscritto**
- 17 utenti, 7 organizzazioni su 3 regioni (Emilia-Romagna, Toscana, Piemonte)
- 3 org certificate (issued) con beneficiari e attività, 2 in corso (audit_completed, submitted), 2 pending
- Tutte le regole di business rispettate: zero beneficiari su org non certificate
- 3 istituzioni referenti collegate ai beneficiari, 3 operatori collegati alle rispettive org

### v2.1 — Marzo 2026 (Foto, Istituzione Referente, Validazioni)

**Galleria foto organizzazione**
- Upload immagini JPG/PNG/WebP (max 5MB, max 10 per organizzazione)
- Galleria griglia responsive nel dettaglio organizzazione
- Visualizzazione fullscreen al click
- Galleria visibile anche nel **registro pubblico**
- Immagini salvate in `uploads/images/` e incluse nel backup automatico

**Istituzione referente collegata ai beneficiari**
- Nuovo campo `ente_user_id` nella tabella beneficiari
- Dropdown "Istituzione referente collegata" nel form creazione e modifica beneficiario
- L'istituzione referente accede e vede **solo** i beneficiari collegati al suo utente
- Nome istituzione referente visibile nel popup dettaglio beneficiario
- Migrazione automatica per DB esistenti (ALTER TABLE)

**Validazione Codice Fiscale e Partita IVA**
- Validazione completa C.F. (16 caratteri, algoritmo ufficiale con carattere di controllo)
- Validazione completa P.IVA (11 cifre, algoritmo Luhn modificato)
- Controllo real-time on blur (bordo rosso + messaggio errore)
- Blocco invio form se non validi
- Validazione anche lato backend (400 Bad Request)

**Navigazione migliorata**
- Pulsante "← Torna alle organizzazioni" nel dettaglio organizzazione
- Pulsante "← Torna alle certificazioni" nel dettaglio certificazione
- Pulsante "← Torna al registro" nel dettaglio registro pubblico (utenti loggati)
- Filtro **regione** aggiunto al registro pubblico

**Report Excel beneficiari**
- Generazione report Excel (.xlsx) dalla pagina Beneficiari (org_admin e org_operator)
- Filtri: periodo attività (da/a) e ente inviante
- Colonna "Nome e Cognome" vuota con sfondo giallo, da compilare offline dall'organizzazione
- Riepilogo: beneficiari totali, attivi, attività e ore nel periodo
- Disclaimer GDPR in fondo: i codici sono pseudonimi, l'associazione con dati identificativi è offline
- La piattaforma non ospita mai dati personali identificativi dei beneficiari

**Miglioramenti UI**
- Telefono: prefisso e numero sulla stessa riga
- Campo "Contatto ente" aggiunto nel form creazione beneficiario

### v2.0 — Marzo 2026 (Upgrade SNM-AS)

**Standard e requisiti**
- Standard aggiornato da AICARE-GCF-STD-01 a **SNM-AS v1.0** (Standard Nazionale Minimo — Agricoltura Sociale)
- Checklist audit aggiornata a **SNM-AS-AUD-01 v1.0** con 14 requisiti su 5 aree
- Certificato PDF con riferimento SNM-AS v1.0
- Forme giuridiche ridotte a: **Impresa agricola** e **Cooperativa sociale** (L. 141/2015)

**Flusso organizzazioni**
- Org admin crea la propria organizzazione con **upload obbligatorio documenti di legittimazione** (visura camerale, statuto, delega, nomina)
- Organizzazione nasce in stato "In attesa" con banner di avviso
- Admin AICARE verifica i documenti, li scarica, e attiva l'organizzazione
- Solo dopo l'attivazione l'org admin può richiedere la certificazione
- Documenti organizzazione salvati in `uploads/organizations/` e inclusi nel backup automatico
- Nuova tabella `organization_documents` (25 tabelle totali)

**Permessi e sicurezza**
- Admin: **sola lettura** su beneficiari e attività (niente creazione/modifica/elimina)
- Admin: **non può caricare** documenti di certificazione (solo l'organizzazione)
- Admin: **non crea** organizzazioni (solo modifica e cambio stato)
- Istituzione referente: **sola lettura** — nessun pulsante modifica visibile
- Org admin: vede **solo la propria** organizzazione
- Operatore: **non può richiedere** certificazione (solo org admin)
- Pulsante "Torna alla certificazione" (invece di "Torna agli audit") per ruoli org

**Registro pubblico**
- Statistiche corrette: contano solo organizzazioni **attive con certificato rilasciato**
- Filtri regione, servizi, target allineati alle sole organizzazioni certificate

**Dati demo coerenti**
- 3 certificazioni (2 rilasciate con 14C, 1 audit completato con azioni correttive)
- 3 audit (tutti completati, zero pianificati)
- 2 azioni correttive (solo Campo Sociale)
- Nessuna certificazione per organizzazioni in attesa
- Forme giuridiche aggiornate nel seed

**Infrastruttura**
- Hosting su Cloudflare Tunnel: `https://gcf.aicare.it`
- Profilo utente full-width su desktop
- Guida Operativa v9.0 aggiornata
- Diagramma ruoli HTML aggiornato

### v1.0 — Febbraio 2026

**Session 1-3: Fondamenta**
- Schema database 25 tabelle con init automatico
- Backend Express.js con 59 endpoint REST
- Frontend SPA vanilla JS con routing hash-based
- Autenticazione JWT con refresh token
- CRUD completo organizzazioni, certificazioni, audit
- Docker deployment per QNAP NAS

**Session 4-5: Funzionalità core**
- Workflow certificazione a stati completo
- Upload/download documenti PDF con Multer
- Checklist audit 14 requisiti / 5 aree
- Generazione PDF certificati e report audit
- Seed database con dati realistici italiani

**Session 6-7: UI/UX**
- Modal personalizzate (eliminati alert/confirm nativi)
- Province picklist (107) con regione automatica
- Prefisso telefonico internazionale
- Validazione email real-time
- Password con conferma e indicatore forza
- Messaggi errore dettagliati (no più errori generici)
- Badge notifiche sidebar

**Session 8: Ruoli e mobile**
- Separazione rigorosa admin/auditor (admin sola lettura su checklist)
- Sidebar mobile overlay con backdrop
- Audit creation modal con selezione auditor
- Fix upload documenti in scope

**Session 9: Responsive completo**
- 12 tabelle convertite a card layout mobile (59 data-labels)
- Form single-column su mobile con `!important` override
- Fix spinner infinito audit (error handling + fallback)
- Fix JSON parse difensivo su `evidences_checked`

**Session 10: Rifinitura**
- Rimosso badge Audit per admin (non azionabile)
- Bottone "← Torna alla lista audit" nella checklist
- Dropdown mobile 16px / 44px min-height (no iOS auto-zoom)
- Guida Operativa v5.0
- Diagramma ruoli HTML aggiornato
- README.md completo

---

## Licenza

Proprietario — **AICARE** (Agenzia Italiana per la Campagna e l'Agricoltura Responsabile e Etica)

Per informazioni: info@aicare.it

---

*Green Care Farm Certificata — AICARE © 2026*
