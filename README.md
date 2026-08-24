# Space Launches

[![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=fff)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Deploy: GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?logo=githubpages&logoColor=fff)](https://bernard2806.github.io/Space-Launches/)

Seguimiento en vivo de los próximos lanzamientos espaciales de todo el mundo, con tarjetas elegantes, filtros y actualización automática. Los datos provienen de **Launch Library 2 (The Space Devs)**.

## Características

- **La crema de la crema**: selección de los mejores próximos lanzamientos mediante un *score híbrido* (riqueza de datos + cercanía en el tiempo + misiones tripuladas).
- **Tarjetas responsives**: diseño mobile-first con imagen, estado, agencia, cohete, sitio de lanzamiento, fecha y descripción.
- **Filtros y orden**: búsqueda por nombre/agencia, filtro por agencia y por estado, y orden por fecha o puntuación. Toda la interfaz en español.
- **Auto-refresco**: el navegador consulta la API directamente y actualiza las tarjetas cada cierto tiempo, sin recargar la página.
- **Listo para GitHub Pages**: sitio estático con workflow de despliegue automático.

## Puesta en marcha

Requiere **Node 22.12+** y **pnpm**.

```bash
pnpm install        # instalar dependencias
pnpm dev            # servidor de desarrollo (con base: /Space-Launches/)
pnpm build          # generar el sitio estático en dist/
pnpm preview        # previsualizar el build
pnpm mejores        # refrescar el caché local de lanzamientos (src/data/launches.json)
```

> En desarrollo, por la configuración de `base`, el sitio se sirve en `http://localhost:4321/Space-Launches/`.

## Cómo funciona

1. **Fuente de datos**: se consume la API de [Launch Library 2](https://ll.thespacedevs.com/docs/#/launches) (The Space Devs), la única de las opciones originales que sigue operativa (las otras dos comparten ese mismo backend o están dadas de baja).
2. **Score híbrido**: cada lanzamiento se puntúa por la cantidad de información disponible (imagen, agencia, cohete, sitio, misión, webcast), su relevancia temporal y si es tripulado.
3. **Auto-refresco en el cliente**: la página consulta LL2 directamente desde el navegador (la API permite CORS). Los resultados se guardan en `localStorage` durante 10 minutos para respetar el límite de la API (15 peticiones/hora), y si la API no responde se usa el *snapshot* pre-renderizado en `/api/launches.json`.
4. **Script de respaldo**: `scripts/mejores-lanzamientos.mjs` descarga los próximos lanzamientos y guarda el top en `src/data/launches.json`, que sirve de caché si la API falla en build.

## Despliegue en GitHub Pages

El repositorio incluye el workflow `.github/workflows/deploy.yml`:

1. En el repositorio, ve a **Settings → Pages → Source** y elige **GitHub Actions**.
2. Cada `push` a `main` reconstruye y publica el sitio automáticamente.
3. La URL resultante es `https://<usuario>.github.io/Space-Launches/`.

Si prefieres una página de usuario (en la raíz), quita `base` en `astro.config.mjs` y ajusta `site`.

## Estructura del proyecto

```
scripts/mejores-lanzamientos.mjs   Script que obtiene y puntúa lanzamientos desde LL2
src/
  components/
    LaunchCard.astro               Tarjeta de lanzamiento
    LaunchFilters.astro            Barra de búsqueda y filtros
  data/launches.json               Caché local de lanzamientos
  layouts/Layout.astro             Plantilla base con fondo APOD
  pages/
    index.astro                    Página principal (filtros + grid + auto-refresco)
    api/launches.json.ts           Endpoint de respaldo (snapshot)
  services/
    launches.ts                   Tipos, helpers en español y getLaunches()
    apod.ts                       Imagen diaria de la NASA (fondo)
.github/workflows/deploy.yml      Despliegue en GitHub Pages
```

## Licencia

Este proyecto está bajo la [Licencia MIT](./LICENSE).

---

### Sugerencia para el "About" del repositorio

- **Descripción**: `Lanzamientos espaciales en vivo con tarjetas, filtros y auto-refresco desde Launch Library 2 (Astro + Tailwind).`
- **Temas (topics)**: `astro`, `tailwindcss`, `space`, `rocket-launch`, `launch-library`, `github-pages`, `typescript`, `spacex`, `nasa`
