FROM node:18.12.1-alpine AS base

WORKDIR /usr/src/app

FROM base as deps

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY ./prisma ./prisma

RUN npm ci
RUN npx prisma generate

FROM deps AS DEVELOPMENT

RUN rm -rf ./prisma
RUN apk add --no-cache bash

USER node

CMD npm run dev

FROM deps as build

COPY ./src ./src
COPY tsconfig.json ./tsconfig.json

RUN npm run build

FROM base AS PRODUCTION

RUN mkdir storage
RUN chown -R node:node /usr/src/app

USER node

COPY package.json .
COPY ./prisma ./prisma
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

CMD npm run start