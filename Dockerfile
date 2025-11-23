# Backend builder
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# Frontend admin builder
FROM node:20-alpine AS frontend-builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY client-admin/package*.json ./
RUN npm ci

COPY client-admin/ ./
RUN npm run build

# Frontend pvp-app builder
FROM node:20-alpine AS pvp-app-builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY client-mini-app/pvp-app/package*.json ./
RUN npm ci

COPY client-mini-app/pvp-app/ ./
RUN npm run build

# Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend
COPY server/package*.json ./
RUN npm ci --only=production

COPY --from=backend-builder /app/dist ./dist

# Copy frontend admin build
COPY --from=frontend-builder /app/dist ./admin-dist

# Copy frontend pvp-app build
COPY --from=pvp-app-builder /app/dist ./pvp-app-dist

EXPOSE 5000

CMD ["node", "dist/main.js"]

