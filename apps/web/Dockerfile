# ─── Build Stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

# Copy root manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy shared packages and web app
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies using the root context
# We use --frozen-lockfile for production builds
RUN pnpm install --frozen-lockfile

# Build the Next.js app from the root using a filter
# This ensures all workspace symlinks are respected during the build
RUN pnpm --filter web run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files for production dependency installation
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Install only production dependencies
# Use --ignore-scripts to skip husky and other dev-only scripts
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy the built Next.js application
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set working directory to the web app
WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "start"]