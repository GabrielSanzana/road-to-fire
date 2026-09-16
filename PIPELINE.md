# Pipeline seguro para road-to-fire

Caso de estudio de la Sección 3 (Tema 2, TI-11). Repositorio:
https://github.com/GabrielSanzana/road-to-fire

## 1. Qué es el repositorio y qué implicó para el diseño

Aplicación Angular 14 con TypeScript 4.8, gestionada con npm y con
`package-lock.json` versionado. Las pruebas unitarias usan Karma y Jasmine, y la
salida de construcción queda en `dist/RoadToFIRE`. Es una aplicación de una sola
página que guarda los datos en el navegador mediante remoteStorage, de modo que
no tiene servidor propio.

Tres ausencias condicionaron el diseño:

- **No había Dockerfile.** El control de imágenes de contenedor no tenía objeto
  que escanear. Se agrega un Dockerfile de dos etapas que construye la
  aplicación y la sirve con nginx sin privilegios.
- **No había archivos de infraestructura como código.** Ese mismo Dockerfile
  pasa a ser lo que analiza Trivy en el control de IaC.
- **No había ningún flujo de trabajo en `.github/`.** El pipeline completo es
  nuevo.

La versión de Angular está varios ciclos atrás de la actual, de modo que el
control de dependencias encontrará hallazgos reales. Eso conviene para el
informe: la medición se hace sobre un repositorio con vulnerabilidades
efectivas y no sobre un caso limpio de laboratorio.

## 2. Archivos que se agregan

| Archivo | Para qué |
|---|---|
| `.github/workflows/security.yml` | El pipeline completo, con un job por control |
| `.github/CODEOWNERS` | Exige revisión antes de modificar la definición de los controles |
| `Dockerfile` | Objeto del escaneo de imagen y de IaC; produce la aplicación desplegable para el DAST |
| `nginx.conf` | Servidor de la SPA con cabeceras de seguridad |
| `sonar-project.properties` | Qué analiza SonarQube y dónde está la cobertura |
| `.zap/rules.tsv` | Reglas del DAST, con las excepciones declaradas por escrito |

Se copian a la raíz del repositorio conservando la estructura de carpetas.

## 3. Correspondencia con la Sección 3

| Job | Control (Tabla 1) | Insumo que necesita | Carácter (Tabla 2) | Herramienta |
|---|---|---|---|---|
| `secretos` | Detección de secretos | El contenido del commit | Bloqueante ante cualquier hallazgo | Gitleaks |
| `sast-semgrep` | SAST | El código fuente | Bloqueante en severidad ERROR | Semgrep |
| `sast-codeql` | SAST | El código fuente | Informativo, publica en Code Scanning | GitHub Code Security (CodeQL) |
| `iac` | Infraestructura como código | Los archivos de configuración | Bloqueante en crítico y alto | Trivy config |
| `sca` | SCA | El árbol de dependencias resuelto | Bloqueante si es crítica **con** corrección disponible; informativo si no la hay | Trivy fs, Snyk si hay token |
| `build` | Construcción | El código y las dependencias | Bloqueante | Angular CLI, Karma |
| `puerta-calidad` | Puerta de calidad sobre código nuevo | El análisis y la cobertura | Bloqueante según las condiciones del servidor | SonarQube |
| `imagen` | Imágenes de contenedor | La imagen construida | Bloqueante antes de publicar | Trivy image |
| `dast` | DAST | La aplicación desplegada | Informativo en la solicitud de fusión | OWASP ZAP baseline |

El orden de ejecución sigue el criterio del insumo que cada control necesita.
`build` depende de los cuatro controles bloqueantes que trabajan sobre el
repositorio, de modo que un hallazgo corta el pipeline antes de pagar el costo
de construir. `imagen` depende de `build` porque la imagen no existe antes, y
`dast` depende de `imagen` porque necesita la aplicación corriendo.

## 4. Prácticas del apartado 3.3 aplicadas

- **Permisos mínimos.** El flujo declara `permissions: contents: read` a nivel
  global y cada job eleva solo lo que necesita, que en la mayoría de los casos
  es `security-events: write` para publicar hallazgos.
- **Fijación por hash.** Todas las acciones de terceros están fijadas al SHA
  completo del commit, con el número de versión anotado al lado como comentario.
  Los hashes se resolvieron el 16 de septiembre de 2026.
- **Archivo de bloqueo.** Tanto el pipeline como el Dockerfile instalan con
  `npm ci`, que exige la presencia de `package-lock.json`.
- **Ejecutores efímeros.** Se usan ejecutores alojados por GitHub, que corren en
  máquinas virtuales limpias y desechables.
- **Protección de la definición.** `CODEOWNERS` cubre `.github/workflows/` para
  que un cambio en los controles requiera aprobación.
- **Sin credenciales de larga vida.** El pipeline no almacena claves de nube. Si
  más adelante se agrega un despliegue, corresponde usar OIDC.

## 5. Configuración que hay que hacer en GitHub

**Secretos opcionales.** El pipeline corre sin ellos y omite los pasos
correspondientes.

| Secreto | Para qué |
|---|---|
| `SONAR_TOKEN` y `SONAR_HOST_URL` | Habilitan el job de puerta de calidad |
| `SNYK_TOKEN` | Habilita el análisis de Snyk dentro del job de SCA |

**Regla de repositorio para volver exigibles las puertas.** En Settings,
Rules, New ruleset, sobre la rama por defecto, con la condición de
verificaciones de estado requeridas y estas marcadas:

```
1 · Deteccion de secretos
2 · SAST (Semgrep)
3 · Infraestructura como codigo (Trivy config)
4 · SCA (dependencias)
5 · Construccion y pruebas
7 · Imagen de contenedor (Trivy image)
```

Los jobs `sast-codeql`, `puerta-calidad` y `dast` quedan fuera de la lista
porque están declarados como informativos o dependen de un servidor externo.

Conviene además activar Code scanning y Secret scanning con protección de
inserción en Settings, Code security.

## 6. Medición del costo en tiempo

Las duraciones por job salen de la API de GitHub. Con el CLI:

```bash
gh run list --workflow security.yml --limit 10
gh run view <run-id> --json jobs --jq '.jobs[] | {name, startedAt, completedAt}'
```

Protocolo para que la medición sea comparable, según lo comprometido en la
sección:

1. Mismo commit en todas las corridas.
2. Mismo tipo de ejecutor (`ubuntu-24.04`).
3. Tres corridas por configuración; se reporta la mediana.
4. Una corrida base con los controles de seguridad deshabilitados, para obtener
   la línea de referencia.
5. Registrar la fecha y la versión exacta de cada herramienta.

La caché de npm está activada en `setup-node`. Para medir el costo real de cada
control conviene hacer una serie con caché y otra sin ella, y declarar cuál se
usó en cada cifra.

## 7. Límites de este diseño

- El DAST corre sobre una SPA estática sin sesión ni autenticación, de modo que
  el escaneo baseline revisa cabeceras y respuestas del servidor y no lógica de
  negocio. Es el alcance que corresponde al caso, y conviene decirlo en el
  informe en lugar de presentar el control como más completo de lo que es.
- El control de IaC analiza un solo archivo, el Dockerfile. Si el caso se amplía
  con despliegue en nube, ese mismo job cubrirá los archivos que se agreguen sin
  cambios en su configuración.
- La puerta de calidad requiere un servidor SonarQube disponible. Sin él, el
  job se omite y el criterio de corte sobre código nuevo queda sin aplicar.
- Los umbrales de severidad son una decisión del equipo. Ninguna de las fuentes
  consultadas fija valores numéricos.
