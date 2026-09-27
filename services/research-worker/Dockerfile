FROM node:22-bookworm-slim
WORKDIR /app/services/research-worker
COPY services/research-worker/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY services/research-worker/ ./
COPY periods.json /app/periods.json
COPY src/validation/siteValidator.ts /app/src/validation/siteValidator.ts
COPY src/types/settlement.ts /app/src/types/settlement.ts
USER node
CMD ["node", "--import", "tsx", "src/main.ts"]
