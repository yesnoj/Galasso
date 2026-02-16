FROM node:20-alpine

LABEL maintainer="AICARE" \
      description="GCF Platform - Green Care Farm Certificata" \
      version="1.0.0"

WORKDIR /app

# Dipendenze backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production && npm cache clean --force

# Codice backend
COPY backend/src ./src
COPY backend/.env ./.env

# Frontend statico (già pronto, no build step)
COPY frontend/build ./frontend/build

# Directory dati
RUN mkdir -p /app/db /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/db/gcf.sqlite
ENV UPLOAD_DIR=/app/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "node src/init-db.js && if [ ! -f /app/db/.seeded ]; then node src/seed.js && touch /app/db/.seeded; fi && node src/index.js"]
