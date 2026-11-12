FROM node:24-alpine
WORKDIR /app
ARG NEXT_PUBLIC_API_ORIGIN
ENV NEXT_PUBLIC_API_ORIGIN=$NEXT_PUBLIC_API_ORIGIN
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && pnpm install --frozen-lockfile --filter @qavio/web...
COPY apps/web apps/web
RUN pnpm --filter @qavio/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@qavio/web", "start"]
