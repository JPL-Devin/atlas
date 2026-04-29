############################
# Builder
############################

FROM node:lts-jod AS builder

WORKDIR /usr/src/api

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

############################
# Runner
############################

FROM node:lts-jod AS runner

ENV NODE_ENV=production

WORKDIR /usr/src/api

COPY --from=builder /usr/src/api/node_modules ./node_modules
COPY --from=builder /usr/src/api/package*.json ./
COPY --from=builder /usr/src/api/server.js ./
COPY --from=builder /usr/src/api/config.js ./
COPY --from=builder /usr/src/api/routes ./routes
COPY --from=builder /usr/src/api/services ./services
COPY --from=builder /usr/src/api/middleware ./middleware

EXPOSE 3001

USER node

CMD ["node", "server.js"]
