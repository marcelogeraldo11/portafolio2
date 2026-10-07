# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio estático en Astro (pnpm + Tailwind 4 + daisyUI 5) que muestra las fotos del portafolio "Portafolio MEL BHP" en una cuadrícula con filtros por proyecto y un visor modal. No hay lint ni tests.

```sh
pnpm install
pnpm images    # convierte los JPG fuente a WebP y regenera src/data/images.json
pnpm dev       # Astro 7 deja el servidor en segundo plano: `pnpm astro dev stop|status|logs`
pnpm build     # salida estática en dist/
```

Flujo de datos:
- `scripts/convert-images.mjs` (sharp) recorre `fotos portafolio ags bhp/`, fusiona las partes de Drive (ver abajo) y escribe en `public/images/<seccion>/<grupo>/<subcarpeta>/` una versión `*.webp` (lado mayor de 2400 px como máximo) y otra `*-thumb.webp` (800 px de ancho). También genera el manifiesto `src/data/images.json`. Las rutas usan slugs sin tildes. Las imágenes que ya están convertidas se omiten, así que hay que borrar `public/images` para forzar una nueva conversión.
- `src/pages/index.astro` es la única página: lee el manifiesto, pinta las miniaturas y los botones de filtro (por `group`) y, con un script inline, abre la imagen completa en un `<dialog>` de daisyUI (se navega con ❮ ❯ o las flechas del teclado, respetando el filtro activo).
- daisyUI se carga como `@plugin` en `src/styles/global.css` (temas light/dark). El título usa el color de marca `#E25200`.
- `pnpm-workspace.yaml` contiene `allowBuilds` para esbuild y sharp (pnpm 11 bloquea los scripts de instalación si no se autorizan).
- Los videos `.mp4` todavía no se usan en el sitio.

## Material fuente: `fotos portafolio ags bhp/`

~7 GB: 216 `.jpg` y 4 `.mp4`. Es una descarga de Google Drive partida en cuatro carpetas `drive-download-20261007T130619Z-1-00{1..4}/`. **Las cuatro partes son fragmentos de un mismo árbol lógico**: la misma carpeta (p. ej. `1. Proyectos/NovAndino/Fotografías`) aparece repartida entre varias partes. Para obtener todas las fotos de un proyecto hay que unir las cuatro partes. Una vez quitado el prefijo `drive-download-*/`, no hay rutas duplicadas, así que se pueden fusionar sin colisiones.

Árbol lógico (después de fusionar):

- `1. Proyectos/`
  - `Aguas Horizonte/Fotografías/` + videos `VIDEO AGOSTO AH_2026.mp4` (1,3 GB) y `Video_AH Septiembre.mp4` (1,2 GB)
  - `NovAndino/Fotografías/` + `NovAndino.mp4` (100 MB)
  - `Open Aster 26_/Premiación/` + `Open Aster Premiación.mp4` (695 MB)
  - `TGN/Fotografías/` y `TGN/Drone/` (tomas aéreas)
- `3. Banco de Imágenes/` — `1. Corporativo`, `2. Terreno`, `3. Bodega`, cada una con una subcarpeta `1. Agosto`

(No existe `2.` en la numeración; así viene del Drive.)

## Consideraciones al trabajar con estos archivos

- Los nombres (`AGS-N.jpg`) **no son únicos entre proyectos**: `AGS-12.jpg` existe en varias carpetas. Identificar siempre una imagen por su ruta lógica completa (proyecto + subcarpeta), nunca solo por el nombre.
- Las imágenes son de muy alta resolución (p. ej. las de drone llegan a 8192×4608) y los videos pesan hasta 1,3 GB. Para uso web, generar derivados redimensionados/comprimidos en una carpeta aparte (en macOS está disponible `sips`) y no modificar los originales.
- Las rutas contienen espacios, tildes (`Fotografías`, `Imágenes`, `Premiación`) y puntos; siempre entrecomillarlas en shell.
