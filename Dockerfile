FROM node:current-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm install

COPY . .

FROM node:current-alpine

WORKDIR /app
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build ./

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]
