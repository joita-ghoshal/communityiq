# Multi-stage build for CommunityIQ

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 3: Production Backend
FROM node:20-alpine AS backend
WORKDIR /app
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]

# Stage 4: Production Frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]