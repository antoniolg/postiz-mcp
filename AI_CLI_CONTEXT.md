# Contexto para IAs: Postiz CLI

Guía rápida para que un agente pueda operar el CLI `postiz` sin conocer el proyecto. Sigue estos pasos para autenticarse, descubrir comandos y ejecutar acciones seguras.

## Configuración básica

- `POSTIZ_API_KEY` (o `--api-key`) – Token de Postiz; obligatorio.
- `POSTIZ_BASE_URL` (o `--base-url`) – URL base de la API; por defecto `https://api.postiz.com/public/v1`.
- `POSTIZ_CLI_DEBUG` – Exporta `1` para incluir stack traces en errores (opcional).
- `--pretty` – Flag global para imprimir JSON legible.

Ejemplo rápido:

```bash
export POSTIZ_API_KEY="token-secreto"
# Opcional: export POSTIZ_BASE_URL="https://api.dev.postiz.com/v1"
```

## Ejemplos de uso

Invocación general:

```bash
postiz <comando> [subcomando] [opciones]
```

### Canales

- Listar canales disponibles:

  ```bash
  postiz channels --pretty
  ```

### Posts

- Listar publicaciones por rango de fechas (opcionalmente por cliente):

  ```bash
  postiz posts list \
    --start-date 2024-04-01 \
    --end-date 2024-04-30 \
    --customer acme
  ```

- Crear una publicación inmediata en dos canales con imágenes:

  ```bash
  postiz posts create \
    --content "Primer tweet" \
    --content "Sigue el hilo" \
    --integrations tw_123 \
    --integrations li_456 \
    --images https://cdn.ejemplo.com/banner.png
  ```

- Programar actualización de contenido para un post existente:

  ```bash
  postiz posts update  \
    --id 987654 \
    --content "Nuevo copy" \
    --integrations tw_123 \
    --status scheduled \
    --scheduled-date "2024-05-01T09:00:00+02:00"
  ```

- Eliminar un post:

  ```bash
  postiz posts delete --id 987654
  ```

### Archivos

- Subir un asset y obtener la URL pública devuelta por la API:

  ```bash
  postiz upload \
    --file-path ./imagenes/banner.png \
    --filename banner-redes.png
  ```

## Consejos y ayuda

- `postiz --help` – Resumen global de comandos y opciones.
- `postiz posts --help` – Ver subcomandos disponibles en la sección de posts.
- `postiz posts create --help` – Listar todas las flags, incluyendo las repetibles (`--content`, `--integrations`, `--images`).

Recuerda que todos los comandos devuelven JSON. Comprueba el campo `success` y los mensajes de error estructurados para gestionar fallos o validaciones.
