# Plan para convertir Postiz MCP en CLI

## Investigación y decisiones preliminares

- El proyecto actual usa TypeScript con salida en `build/` y define cada herramienta como función `register...` que recibe un `McpServer`, combina validaciones con Zod y delega en `PostizApiClient`. Esta estructura se puede reutilizar si extraemos la lógica en definiciones reutilizables.
- Para entregar una experiencia de CLI ergonómica (incluyendo `--help` global y por comando) resulta conveniente usar [`commander`](https://github.com/tj/commander.js); ofrece subcomandos anidados, generación de ayuda y parsing de opciones legibles para modelos de lenguaje.
- Las validaciones existentes en Zod se pueden aprovechar en el CLI exportando metadatos de cada herramienta (nombre, descripción, esquema, función de ejecución) y generando dinámicamente tanto la ayuda como la validación de argumentos antes de invocar `PostizApiClient`.
- Para arrays y fechas, Commander permite flags repetibles (`--integrations id1 --integrations id2`) y combinados con Zod se puede mantener la semántica actual sin obligar a pasar blobs JSON; esto simplifica su uso por modelos de lenguaje.
- La ejecución "en caliente" se puede resolver con `npm link` tras el build y, durante el desarrollo, añadiendo un script `npm run dev:cli` que use `tsx` en modo watch (`npx tsx watch src/cli.ts`) para evitar reinstalar o reiniciar la terminal al probar cambios.
- Mantener la compatibilidad MCP requiere que el servidor siga registrando herramientas desde las mismas definiciones; conviene separar la definición de la herramienta (metadatos + handler) del adaptador MCP y del adaptador CLI.

## Tareas

- [x] Documentar con mayor detalle el diseño del CLI (estructura de carpetas, dependencias nuevas como `commander` y `tsx`, estrategia de salida y errores). _(2025-10-13 · Diseño base documentado en la sección "Diseño del CLI")_
- [x] Extraer cada herramienta a un objeto de definición reutilizable (`name`, `description`, `schema`, `execute`) que pueda consumir tanto el MCP como el CLI. _(2025-10-13 · Cada herramienta exporta `PostizToolDefinition` y mantiene `register...` como adaptadores)_
- [x] Actualizar el adaptador MCP (`src/index.ts`) para registrar herramientas a partir de las nuevas definiciones y verificar que nada se rompe. _(2025-10-13 · `registerPostizTools` centraliza el alta vía `src/adapters/mcp.ts`, `postizTools` lista las definiciones)_
- [x] Implementar el binario TypeScript `src/cli.ts` que cree el comando `postiz`, configure `commander`, liste todas las herramientas y registre subcomandos con ayuda autogenerada desde el esquema Zod. _(2025-10-13 · CLI basado en Commander con subcomandos autogenerados desde `postizTools`)_
- [x] Diseñar y codificar el mapeo de tipos Zod a flags CLI (strings, números, booleanos, arrays) con mensajes de ayuda claros y validaciones consistentes. _(2025-10-13 · `configureToolCommand` interpreta `ZodString`, `ZodEnum`, `ZodArray` y valores opcionales)_
- [x] Configurar scripts de compilación y distribución (`package.json`) para que `postiz` se genere en `build/`, añadir `npm run dev:cli` con `tsx --watch` y documentar el uso de `npm link` para probar el comando sin reiniciar la terminal. _(2025-10-13 · Scripts actualizados, bin `postiz` apunta a `build/cli.js`, `dev:cli` listo para hot reload)_
- [x] Actualizar documentación (README y ejemplos) describiendo uso de `postiz --help`, formato de argumentos de cada herramienta y pasos para desarrollo en caliente. _(2025-10-13 · README renovado con secciones de CLI, ejemplos de comandos y modo `dev:cli`)_
- [x] Ejecutar y documentar pruebas manuales del CLI frente a la API (incluidas rutas felices y casos de error de validación) y reflejar los resultados en el plan. _(2025-10-13 · `postiz --help`, `postiz postiz-get-channels`, `postiz postiz-list-posts`, creación/eliminación programada, verificación error por API key ausente)_
- [x] Definir alias cortos y coherentes para los comandos del CLI (p.ej. `channels`, `create`, `delete`) manteniendo compatibilidad con los nombres MCP. _(2025-10-13 · Nuevos nombres en `tool.cli`, Commander registra alias incluyendo nombres MCP)_

## Seguimiento

- Cada vez que se complete una tarea, actualizar esta lista marcándola con `[x]`, crear un commit, y, si procede, añadir una nota breve con la fecha y los hallazgos relevantes. De esta forma el plan se mantiene como fuente de verdad durante todo el desarrollo.

## Diseño del CLI

### Estructura de carpetas y archivos
- Mantener `src/postiz-api.ts` como cliente HTTP central.
- Convertir cada archivo en `src/tools/*.ts` para que exporte un objeto `PostizToolDefinition` con metadatos (`name`, `description`, `schema`, `execute`). El helper `register...` seguirá existiendo pero delegará en la definición.
- Añadir `src/tools/definitions.ts` que declare la interfaz `PostizToolDefinition`, funciones de ayuda para instanciar herramientas y un export `postizTools` con todas las definiciones.
- Crear `src/adapters/mcp.ts` para encapsular la lógica de registro en `McpServer` reutilizando `postizTools`. `src/index.ts` quedará como thin entry que prepara el cliente, importa el adaptador MCP y llama a `startMcpServer`.
- Crear `src/cli.ts` como entrypoint del binario, consumiendo `postizTools` para generar comandos de forma dinámica.

### Dependencias y tooling
- Añadir `commander` (runtime) para parsing de CLI y generación automática de `--help`.
- Añadir `tsx` como dependencia de desarrollo para servir un modo `npm run dev:cli` con recarga en caliente (`npx tsx watch src/cli.ts`).
- Mantener `zod` para validación, aprovechando descripciones existentes para componer la ayuda de cada comando.

### Estrategia de configuración
- El CLI expondrá flags globales `--api-key` y `--base-url` que sobrescriban las variables `POSTIZ_API_KEY` y `POSTIZ_BASE_URL`. Si no se proporcionan ni están en el entorno, la ejecución termina con código 1 y un mensaje claro.
- Cada subcomando empleará los esquemas Zod para derivar los flags disponibles:
  - `z.string()` → `--field <value>`
  - `z.array(z.string())` → `--field <value>` repetible
  - `z.enum([...])` → validación posterior al parseo con mensaje generado.
  - Campos opcionales generan flags opcionales; los obligatorios producen errores tempranos si Commander no recibe valor.

### Estrategia de salida y errores
- Por defecto toda respuesta exitosa se imprimirá como JSON estructurado (`{ success: true, data: ... }`) en stdout para facilitar el parseo por modelos.
- Añadir flag global `--pretty` para imprimir el JSON con indentación de 2 espacios.
- Los errores controlados (validaciones, respuestas 4xx/5xx) emitirán `{ success: false, error: { message, statusCode? } }` en stderr y finalizarán con código 1.
- Los errores inesperados incluyen traza resumida en stderr bajo `debug` si se activa `POSTIZ_CLI_DEBUG=true`.

### Experiencia de ayuda
- `postiz --help` listará descripción general, variables de entorno admitidas y subcomandos derivados de `postizTools`.
- `postiz <tool> --help` mostrará descripción, ejemplo de uso derivado del esquema Zod (incluyendo flags repetibles) y recordará restricciones especiales (p.ej. formato ISO 8601).
- Incluir ejemplos concretos en `README` y en el texto de ayuda de herramientas complejas (`create-post`, `update-post`).

### Flujo de desarrollo "en caliente"
- Añadir script `dev:cli` que ejecute `npx tsx watch src/cli.ts -- <args>` permitiendo correr `npm run dev:cli -- --help` sin recompilar manualmente.
- Documentar el uso de `npm link` (o `corepack pnpm link --global` equivalente) para exponer temporalmente el binario `postiz` durante el desarrollo.
- Para pruebas puntuales sin enlace global, documentar `node --loader ts-node/esm src/cli.ts ...` como alternativa.
