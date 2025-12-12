# Phoenix Hotel Microservice - Production Dockerfile
# This is an example Dockerfile for Node.js microservices
# Copy this to each service directory and customize as needed

# ============================================================================
# Stage 1: Build Stage
# ============================================================================
FROM node:18-alpine AS builder

# Build arguments
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build application (if using TypeScript or build step)
# RUN npm run build

# ============================================================================
# Stage 2: Production Stage
# ============================================================================
FROM node:18-alpine

# Metadata labels
LABEL maintainer="Phoenix Platform Team <platform@phoenix.com>"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.title="Phoenix Hotel Microservice"
LABEL org.opencontainers.image.description="Microservice for Phoenix Hotel platform"
LABEL org.opencontainers.image.source="https://github.com/phoenix/hotel-reservation"

# Install production dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1000 -S appuser && \
    adduser -u 1000 -S appuser -G appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=appuser:appuser package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application from builder
COPY --chown=appuser:appuser --from=builder /app/dist ./dist 2>/dev/null || :
COPY --chown=appuser:appuser --from=builder /app/src ./src 2>/dev/null || :
COPY --chown=appuser:appuser --from=builder /app/*.js ./ 2>/dev/null || :

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
