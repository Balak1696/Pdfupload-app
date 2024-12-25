# FROM node:20-alpine as builder

# WORKDIR /app

# COPY package.json /app

# RUN npm i --production

# COPY . /app

# EXPOSE 5000

# CMD [ "npm", "start" ]


FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci --only=production

COPY . /app

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 5000

CMD ["npm", "start"]
