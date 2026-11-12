FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN corepack enable && pnpm install --frozen-lockfile --filter @qavio/api...
COPY apps/api apps/api
COPY migrations migrations
RUN pnpm --filter @qavio/api build
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
