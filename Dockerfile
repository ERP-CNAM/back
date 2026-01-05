FROM node:22 AS builder

WORKDIR /erp-cnam-backend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /erp-cnam-backend

ENV NODE_ENV=production

COPY --from=builder --chown=nonroot:nonroot /erp-cnam-backend/package*.json ./
COPY --from=builder --chown=nonroot:nonroot /erp-cnam-backend/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /erp-cnam-backend/dist ./dist

USER nonroot

EXPOSE 3000

CMD ["dist/index.js"]