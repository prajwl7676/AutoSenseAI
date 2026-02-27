# ─── Build Stage ───────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Install git for any workspace packages that need it
RUN apk add --no-cache git

# Copy root manifests (including pnpm-workspace.yaml!)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages + API source
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies from workspace root
RUN pnpm install --frozen-lockfile

# Build NestJS app
WORKDIR /app/apps/api

# Now that tsconfig.json has outDir explicitly set, build normally
RUN pnpm build

# Verify the build output exists
RUN ls -la ./dist/main.js || (echo "ERROR: Build failed - main.js not found!" && exit 1)

# ─── Production Stage ─────────────────────────────────────────
FROM node:20-alpine AS runner

# Install pnpm in production stage
RUN npm install -g pnpm

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production dependency installation
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Install only production dependencies
# Use --ignore-scripts to skip husky and other dev-only scripts
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy the built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main.js"]