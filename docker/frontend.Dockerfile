# ============================================================
# Frontend Dockerfile — React + Vite (Flight Intelligence Platform)
# Build em duas etapas: compila com Node, serve com Nginx
# ============================================================

# ---- Etapa 1: build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# URL da API que o navegador vai usar (nao o container) —
# como a porta do backend e' publicada no host, localhost funciona.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Etapa 2: servir com Nginx ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
