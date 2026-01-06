# Build
FROM node:22 AS builder

WORKDIR /erp-cnam-backend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install production dependencies only
FROM node:22 AS staged

WORKDIR /erp-cnam-backend

COPY package*.json ./
RUN npm install --omit=dev

# Create the final image
FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /erp-cnam-backend

ENV NODE_ENV=production

COPY --from=staged --chown=nonroot:nonroot /erp-cnam-backend/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /erp-cnam-backend/dist ./dist

USER nonroot

EXPOSE 3000

CMD ["dist/index.js"]