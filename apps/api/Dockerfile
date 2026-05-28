FROM node:22-bookworm-slim

WORKDIR /app

ENV DATA_DIR=/data
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json

RUN npm ci

COPY . .

RUN npm run build --workspace @landfill/db
RUN npm run build --workspace @landfill/api

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@landfill/api"]
