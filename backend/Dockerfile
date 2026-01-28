# Dockerfile para Backend - Multi-stage build
# Stage 1: Desarrollo
FROM node:20-alpine AS development

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 4000

# Comando para desarrollo (con nodemon)
CMD ["npm", "run", "dev"]

# Stage 2: Producción
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && \
  npm cache clean --force

# Copiar código fuente
COPY . .

# Cambiar ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para producción
CMD ["npm", "start"]
