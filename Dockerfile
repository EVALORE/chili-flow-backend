FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run prisma:generate
RUN pnpm run build
RUN mkdir -p uploads

FROM build AS production-deps

RUN pnpm prune --prod

FROM gcr.io/distroless/nodejs24-debian12:nonroot

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-deps --chown=nonroot:nonroot /app/dist ./dist
COPY --from=production-deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=production-deps --chown=nonroot:nonroot /app/package.json ./package.json
COPY --from=production-deps --chown=nonroot:nonroot /app/prisma/generated ./prisma/generated
COPY --from=production-deps --chown=nonroot:nonroot /app/uploads ./uploads

EXPOSE 3000

CMD ["dist/src/main.js"]
