# Stage 1 — build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN npm run build

# Stage 2 — production
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "dist/main.js"]