FROM node:18-alpine3.17 AS builder

WORKDIR /app
COPY package-lock.json package.json vite.config.ts ./
RUN npm install
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./
RUN npm run build

FROM nginx:1.23-alpine-slim

COPY --from=builder /app/dist/ /usr/share/nginx/html
