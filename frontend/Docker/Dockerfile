# Stage 1: Development
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]


# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build


# Stage 3: Production
FROM nginx:1.25-alpine AS prod

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]