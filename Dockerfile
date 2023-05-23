FROM node:18-alpine

WORKDIR /srv/app

ENV ENV prod
ENV PORT 9091

COPY package*.json ./

COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 9091
CMD [ "node", "dist/main.js" ]
