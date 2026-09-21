FROM node:22-alpine AS builder

WORKDIR /app

COPY web/package.json ./
COPY web/pnpm-lock.yaml ./
RUN corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && pnpm install --frozen-lockfile

COPY web/. .
RUN pnpm run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/frontend/local_full/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
