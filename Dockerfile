FROM node:23-alpine AS builder
WORKDIR /app

# Make the Vite var available during build
ARG VITE_KEYCLOAK_AUTH_PATH
ENV VITE_KEYCLOAK_AUTH_PATH=${VITE_KEYCLOAK_AUTH_PATH:-http://localhost/keycloak/}

ARG VITE_BLUECORE_API_PATH
ENV VITE_BLUECORE_API_PATH=${VITE_BLUECORE_API_PATH:-http://localhost/api/}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html/marva
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
