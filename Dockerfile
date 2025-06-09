# Multi-stage Dockerfile for Insider Threat Detection Backend
# Supports both development (with hot-reload) and production environments

# =============================================================================
# BASE STAGE
# Common base image for all stages to ensure consistency
# =============================================================================
FROM node:20-alpine AS base

# Install essential tools
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app


# =============================================================================
# DEPENDENCIES STAGE
# Install and cache dependencies separately for better layer caching
# =============================================================================
FROM base AS dependencies

# Copy dependency configuration files
COPY package*.json ./

# Install all dependencies for development
RUN npm ci

# Create a separate stage for production dependencies
FROM base AS prod-dependencies

# Copy dependency configuration files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev


# =============================================================================
# DEVELOPMENT STAGE
# Optimized for hot-reload with volume mounts and watching capabilities
# =============================================================================
FROM base AS development

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files for npm scripts
COPY package*.json ./

# Create directory structure for CSV file processing
RUN mkdir -p /app/storage/csv/drop/incidents \
             /app/storage/csv/drop/alerts \
             /app/storage/csv/processed/incidents \
             /app/storage/csv/processed/alerts \
             /app/storage/csv/error

# Expose application port
EXPOSE 3000

# Set development environment
ENV NODE_ENV=development

# Enable source map support for better debugging
ENV NODE_OPTIONS="--enable-source-maps"

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start with hot-reload enabled
# Note: Source files will be mounted as volumes
CMD ["npm", "run", "start:dev"]


# =============================================================================
# BUILD STAGE
# Compile TypeScript for production deployment
# =============================================================================
FROM base AS builder

# Copy all dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build the application
RUN npm run build


# =============================================================================
# PRODUCTION STAGE
# Optimized final stage with minimal footprint and security hardening
# =============================================================================
FROM base AS production

# Security hardening: Create dedicated non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production dependencies from prod-dependencies stage
COPY --from=prod-dependencies /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy compiled application from builder stage
COPY --from=builder /app/dist ./dist

# Create directory structure for CSV file processing
RUN mkdir -p /app/storage/csv/drop/incidents \
             /app/storage/csv/drop/alerts \
             /app/storage/csv/processed/incidents \
             /app/storage/csv/processed/alerts \
             /app/storage/csv/error

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Health check for production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Production command
CMD ["node", "dist/main"]