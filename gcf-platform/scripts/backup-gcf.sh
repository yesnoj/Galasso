#!/bin/sh
BACKUP_DIR=/share/Container/backups
TIMESTAMP=$(date +%Y%m%d_%H%M)
TEMP_DIR=/tmp/gcf-backup-$TIMESTAMP

# Crea directory temporanea
mkdir -p $TEMP_DIR

# Copia database dal container
docker cp gcf-platform:/app/db/gcf.sqlite $TEMP_DIR/gcf.sqlite

# Copia uploads dal container (se esistono)
docker cp gcf-platform:/app/uploads $TEMP_DIR/uploads 2>/dev/null

# Crea zip con database + uploads
cd $TEMP_DIR
tar czf $BACKUP_DIR/gcf-$TIMESTAMP.tar.gz *

# Pulizia
rm -rf $TEMP_DIR

# Tieni solo gli ultimi 30 backup
ls -t $BACKUP_DIR/gcf-*.tar.gz 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null

echo "Backup GCF completato: $(date) → gcf-$TIMESTAMP.tar.gz"
