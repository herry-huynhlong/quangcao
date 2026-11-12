FROM node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && pnpm install --frozen-lockfile --filter @qavio/web...
COPY apps/web apps/web
RUN pnpm --filter @qavio/web build
FROM node:24-alpine
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/node_modules ./node_modules
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
