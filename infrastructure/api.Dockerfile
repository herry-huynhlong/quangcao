FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN corepack enable && pnpm install --frozen-lockfile --filter @qavio/api...
FROM dependencies AS build
COPY apps/api apps/api
COPY migrations migrations
RUN pnpm --filter @qavio/api build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
EXPOSE 4000
CMD ["node", "dist/main.js"]
