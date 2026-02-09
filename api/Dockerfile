# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for tsx)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (tsx needed for runtime)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start command using tsx
CMD ["npx", "tsx", "src/index.ts"]
