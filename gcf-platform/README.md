# Green Care Farm Certificata - Piattaforma AICARE

Piattaforma per la gestione della certificazione Green Care Farm - AICARE.
Ottimizzata per l'esecuzione su QNAP TS-253A.

## Requisiti

- **QNAP TS-253A** con Container Station installato (o qualsiasi sistema con Docker)
- **Docker** e **Docker Compose**
- Circa **300MB di RAM** e **500MB di spazio disco**

## Installazione su QNAP

### 1. Preparazione

Copia la cartella `gcf-platform` sul NAS QNAP via rete (es. nella share condivisa).

Oppure via SSH:
```bash
# Connettiti al QNAP via SSH
ssh admin@IP-DEL-TUO-NAS

# Vai alla directory dove vuoi installare
cd /share/Container
```

### 2. Avvio con Docker Compose

```bash
cd gcf-platform

# Costruisci e avvia
docker-compose up -d --build

# Verifica che sia attivo
docker-compose ps

# Vedi i log
docker-compose logs -f
```

### 3. Accesso

Apri il browser e vai a: **http://IP-DEL-TUO-NAS:3000**

### Utenti demo

| Email | Password | Ruolo |
|-------|----------|-------|
| admin@aicare.it | Password123! | Amministratore |
| auditor@aicare.it | Password123! | Auditor |
| cascina@demo.it | Password123! | Admin organizzazione |
| fattoria@demo.it | Password123! | Admin organizzazione |
| servizi@comune.piacenza.it | Password123! | Ente referente |

## Comandi utili

```bash
# Ferma
docker-compose down

# Riavvia
docker-compose restart

# Ricostruisci (dopo modifiche al codice)
docker-compose up -d --build

# Reset completo database (ATTENZIONE: cancella tutti i dati)
docker-compose down -v
docker-compose up -d --build

# Vedi log in tempo reale
docker-compose logs -f gcf-app

# Entra nel container
docker exec -it gcf-platform sh
```

## Struttura progetto

```
gcf-platform/
├── backend/
│   ├── src/
│   │   ├── index.js          # Server Express principale
│   │   ├── init-db.js        # Inizializzazione database
│   │   ├── seed.js           # Dati demo
│   │   ├── routes/
│   │   │   ├── auth.js       # Autenticazione
│   │   │   ├── organizations.js
│   │   │   ├── certifications.js
│   │   │   ├── audits.js     # Audit e checklist
│   │   │   ├── beneficiaries.js
│   │   │   ├── registry.js   # Registro pubblico
│   │   │   └── admin.js      # Amministrazione
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT middleware
│   │   └── utils/
│   │       └── database.js   # Connessione SQLite
│   ├── db/                   # Database SQLite (creato automaticamente)
│   ├── uploads/              # File caricati
│   ├── package.json
│   └── .env
├── frontend/
│   └── build/                # Frontend statico
│       ├── index.html
│       ├── app.js
│       └── style.css
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## API principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Registrazione |
| GET | /api/registry | Registro pubblico |
| GET | /api/registry/stats | Statistiche |
| GET | /api/organizations | Lista organizzazioni |
| POST | /api/certifications | Domanda certificazione |
| GET | /api/audits | Lista audit |
| PUT | /api/audits/:id/evaluations | Salva valutazioni |
| GET | /api/audits/:id/pdf | Scarica report PDF |
| GET | /api/admin/dashboard | Dashboard admin |

## Sicurezza

- **Cambia il JWT_SECRET** nel file `.env` o in `docker-compose.yml`
- Tutte le password sono hashate con bcrypt
- Rate limiting sugli endpoint di autenticazione
- I beneficiari sono pseudonimizzati (solo codici, niente nomi reali)

## Backup

Il database è in un volume Docker (`gcf-data`). Per il backup:
```bash
# Backup database
docker cp gcf-platform:/app/db/gcf.sqlite ./backup_gcf_$(date +%Y%m%d).sqlite

# Backup uploads
docker cp gcf-platform:/app/uploads ./backup_uploads_$(date +%Y%m%d)
```

## Stack tecnologico

- **Backend**: Node.js 20 + Express
- **Database**: SQLite (via better-sqlite3)
- **Frontend**: HTML/CSS/JS vanilla (nessun build step)
- **Container**: Docker Alpine (~150MB immagine)
- **RAM**: ~100-200MB in uso

---

**AICARE** - Agenzia Italiana per la Campagna e l'Agricoltura Responsabile e Etica
