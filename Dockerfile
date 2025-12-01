FROM node:20-alpine AS server-builder

WORKDIR /app

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

FROM node:20-alpine AS client-admin-builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY client-admin/package*.json ./
RUN npm ci

COPY client-admin/ ./
RUN npm run build

FROM node:20-alpine AS client-mini-app-builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY client-mini-app/package*.json ./
RUN npm ci

COPY client-mini-app/ ./
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY --from=server-builder /app/dist ./dist

COPY server/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 5000

CMD ["./start.sh"]

