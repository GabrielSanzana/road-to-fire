# El repositorio no traia Dockerfile ni archivos de infraestructura como codigo.
# Este archivo se agrega para que el pipeline tenga dos cosas que antes no existian:
#   1. un objeto que escanear en el control de imagenes de contenedor;
#   2. una aplicacion desplegable contra la cual ejecutar el DAST.
# Ademas es el archivo que analiza Trivy en el control de infraestructura como codigo.

# ---------- Etapa de construccion ----------
FROM node:18.20.4-alpine AS build

WORKDIR /app

# Se copian primero los manifiestos para aprovechar el cache de capas. Se incluye
# .npmrc porque el proyecto arrastra un conflicto de dependencias entre pares
# (@ecodev/fab-speed-dial exige rxjs 7 y Angular 14 trae rxjs 6) y ese archivo
# declara la excepcion. Sin el, npm ci falla con ERESOLVE dentro de la imagen.
COPY package.json package-lock.json .npmrc ./

# npm ci exige el archivo de bloqueo e instala el arbol exacto registrado en el.
RUN npm ci

COPY . .

RUN npx ng build --configuration production

# ---------- Etapa de ejecucion ----------
# Imagen sin privilegios: el proceso corre como usuario 101 y escucha en 8080.
# Esto evita los hallazgos de Trivy sobre contenedores que corren como root.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# La etiqueta de la imagen base arrastra paquetes del sistema con vulnerabilidades
# criticas ya corregidas por Alpine (openssl 3.3.3-r0, corregido en 3.3.7-r0). Se
# actualizan en la construccion para que la puerta de imagenes no bloquee por un
# componente que el proveedor ya parcho. La contrapartida esta documentada en la
# Seccion 3: esta instruccion resuelve versiones en el momento de construir, de
# modo que dos construcciones del mismo commit pueden diferir.
USER root
RUN apk --no-cache upgrade
USER 101

COPY --from=build /app/dist/RoadToFIRE /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost:8080/ || exit 1
