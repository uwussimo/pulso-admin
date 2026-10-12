FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty base: the browser calls /internal/* on its own origin and nginx proxies it to API_ORIGIN.
ENV VITE_API_BASE=
RUN npm run build

FROM nginx:1.29-alpine

# Upstream for /internal/*; override via the Vault secret (envFrom) if needed.
ENV API_ORIGIN=https://api.pulso.dorim.com

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
