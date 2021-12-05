# install dependencies
FROM node:erbium-alpine
RUN npm i -g pnpm

WORKDIR /app-src

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY src ./src

USER node

ENV PORT=3000
CMD ["pnpm", "run", "start"]
