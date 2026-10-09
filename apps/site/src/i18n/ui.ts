export const languages = { en: "English", es: "Español" } as const
export type Lang = keyof typeof languages
export const defaultLang: Lang = "en"

export const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/scripts/bootstrap.sh | bash"

export type TourStopId = "deploy" | "history" | "connection" | "theme"

const en = {
  meta: {
    title: "Komodo CD: continuous deployment for your Komodo stacks",
    description:
      "A small self-hosted dashboard on top of Komodo: see the state of every stack, pull or redeploy it by hand, and trigger the same action from CI with one curl.",
  },
  nav: {
    tour: "Tour",
    architecture: "Architecture",
    install: "Install",
    docs: "Docs",
    github: "GitHub",
    skip: "Skip to content",
    theme: "Switch between light and dark theme",
    language: "Language",
    menu: "Menu",
  },
  copy: {
    idle: "Copy",
    done: "Copied",
    label: "Copy the install command",
    code: "Copy the code",
  },
  hero: {
    title: "Redeploy your Komodo stacks from CI.",
    lede: "Komodo CD is a small self-hosted dashboard on top of Komodo: the state of every stack, one-click Pull or Redeploy, and a ready-to-paste curl so your pipeline does the same after every push.",
    installLabel: "Install on a server",
    installHint:
      "Run it in an empty directory. It asks a few questions, generates the secret and starts the stack with Docker Compose.",
    docs: "Read the docs",
    github: "Source on GitHub",
  },
  frame: {
    caption: "Screenshots of the running app. Click one to enlarge it.",
    open: "Enlarge screenshot",
    viewer: "Screenshot viewer",
    close: "Close",
    previous: "Previous screenshot",
    next: "Next screenshot",
  },
  tour: {
    heading: "What you get",
    stops: {
      deploy: {
        title: "Pull, redeploy, or both.",
        body: "Pick a stack and an action. Pull updates the images without restarting, Redeploy brings the whole stack down and up again, Pull + Redeploy does both. Under the form, the same action as a curl ready for a GitHub or Gitea Actions workflow.",
        alt: "Manual deploy page with the stack picker, the three actions and the equivalent curl command",
      },
      history: {
        title: "Every deploy leaves a trace.",
        body: "Actions launched from the dashboard and from CI land in the same history, with who ran them (a user or the name of the API key), the result and Komodo's own error message when one fails.",
        alt: "History page listing successful and failed actions, grouped by time",
      },
      connection: {
        title: "One Komodo, one key pair.",
        body: "Paste the URL of your Komodo instance and a key and secret from its Settings → API Keys. They stay on the backend: the API lists the connection by name and URL, never with its credentials.",
        alt: "Komodo connection page showing the connected instance, its URL and the number of stacks",
      },
      theme: {
        title: "Light or dark, English or Spanish.",
        body: "Both themes and both languages are built in and remembered per browser. On a phone the top navigation becomes a bottom bar, so a redeploy is a couple of taps away.",
        alt: "The stacks page in the light theme",
      },
    } satisfies Record<
      TourStopId,
      { title: string; body: string; alt: string }
    >,
    overviewAlt:
      "Stacks page with running, stopped and failing counts, filters and an expanded stack showing its curl for CI",
    rest: {
      heading: "And the rest",
      items: [
        {
          term: "Status at a glance",
          text: "Search and filter stacks by running, stopped or with issues: failed states, a missing project or missing files on the host.",
        },
        {
          term: "Update hints",
          text: "A stack is flagged when one of its images has an update or the deployed commit is behind the latest one.",
        },
        {
          term: "API keys",
          text: "Personal keys sent as x-api-key, shown once when created. Each pipeline can have its own and be revoked alone.",
        },
        {
          term: "OpenAPI reference",
          text: "Every endpoint is documented in an interactive reference at /scalar, with the spec at /doc.",
        },
        {
          term: "Failure alerts",
          text: "Optional ntfy notifications, on ntfy.sh or your own server, whenever a deploy fails, from CI or by hand.",
        },
        {
          term: "Three images, one volume",
          text: "Backend, frontend and gateway on ghcr.io, tagged latest and by release. SQLite in a single volume: no database server to run.",
        },
      ],
    },
  },
  arch: {
    heading: "How it fits together",
    lede: "Three containers run with Docker Compose. The gateway runs Caddy, the only published port, which sends the API to the backend and every page to Astro SSR in the frontend container. The backend owns a SQLite file and talks to your Komodo instance, and Komodo does the actual deploy on your servers.",
    diagramTitle: "Topology",
    diagramDesc:
      "A browser and a CI runner reach Caddy on port 80 in the gateway container. Caddy sends /rpc, /api, /doc and /scalar to the Hono backend on port 3000 and every other path to Astro SSR on port 4321 in the frontend container, which checks the session against the backend. Both listen only inside the Compose network. The backend reads and writes a SQLite file on the db_data volume and calls the Komodo Core API over HTTPS with a key and secret. Komodo then pulls and redeploys the stack on your servers through its Periphery agents.",
    legendHttp: "Connection, labelled with its protocol or route",
    legendKomodo: "Komodo's own traffic, outside Komodo CD",
    published: "published",
    pathsLabel: "Request paths",
    pagePath: "Opening a page",
    deployPath: "Deploying from CI",
    nodes: {
      browser: "Browser",
      ci: "CI runner",
      gateway: "Gateway",
      frontend: "Frontend",
      caddy: "Caddy",
      astro: "Astro SSR",
      backend: "Backend",
      sqlite: "SQLite",
      komodo: "Komodo",
      servers: "Your servers",
    },
    roles: {
      ci: "GitHub · Gitea",
      container: "container",
      caddy: "reverse proxy",
      astro: "Compose network only",
      backend: "Hono · oRPC · Better Auth",
      sqlite: "volume db_data",
      komodo: "your instance · Core API",
      servers: "Komodo Periphery",
    },
    routing: {
      heading: "Gateway routing",
      route: "Request",
      target: "Goes to",
      rows: [
        { route: "/rpc/*  /api/*", target: "backend:3000" },
        { route: "/doc  /scalar", target: "backend:3000" },
        { route: "any other path", target: "frontend:4321" },
      ],
      note: "Only the gateway's port 80 is mapped to the host, as PORT. The backend and the frontend are reachable only inside the Compose network. Caddy also answers /health and adds basic security headers to every response.",
    },
    principles: [
      {
        term: "The Komodo secret stays on the backend.",
        text: "The key and secret are stored in the backend's database and used only to call Komodo. Listing the connection returns its name and URL, never the credentials.",
      },
      {
        term: "One door for people and pipelines.",
        text: "The same endpoints take a session cookie from the browser or an x-api-key header from CI. Both end up in the history, a key under its own name.",
      },
      {
        term: "Komodo stays the source of truth.",
        text: "Stacks are read from Komodo on every request and actions call its PullStack and DeployStack. Komodo CD only stores users, API keys, the connection, the ntfy settings and the history.",
      },
    ],
    docsLink: "Read the architecture docs",
  },
  install: {
    heading: "Up in one command.",
    lede: "On a Linux host with Docker, curl and openssl, from an empty directory:",
    stepsLabel: "What the script does",
    steps: [
      "Asks for the host port, the public URL and the first admin's name, email and password.",
      "Generates BETTER_AUTH_SECRET with openssl and writes .env with mode 600. An existing .env is never overwritten.",
      "Downloads compose.yml into the current directory.",
      "Optionally pulls the images from ghcr.io and starts the stack. The backend migrates the database and creates the admin on startup.",
    ],
    warning:
      "Everything Komodo CD stores lives in the db_data volume: users, API keys, the Komodo connection, the ntfy settings and the history. Back it up, and keep in mind that docker compose down -v deletes it.",
    manual: "Prefer to set it up by hand?",
    manualLink: "Deploy with Docker Compose",
  },
  footer: {
    license: "Free software under the GNU GPL v3.0.",
    releases: "Releases",
    issues: "Issues",
    license_link: "License",
  },
  docs: {
    title: "Documentation",
    onThisPage: "On this page",
    pages: "Pages",
    edit: "Edit this page on GitHub",
    previous: "Previous",
    next: "Next",
  },
}

export type Dictionary = typeof en

const es: Dictionary = {
  meta: {
    title: "Komodo CD: despliegue continuo para tus stacks de Komodo",
    description:
      "Un pequeño panel autoalojado sobre Komodo: el estado de cada stack, Pull o Redeploy a mano, y la misma acción desde CI con un solo curl.",
  },
  nav: {
    tour: "Recorrido",
    architecture: "Arquitectura",
    install: "Instalar",
    docs: "Documentación",
    github: "GitHub",
    skip: "Saltar al contenido",
    theme: "Cambiar entre tema claro y oscuro",
    language: "Idioma",
    menu: "Menú",
  },
  copy: {
    idle: "Copiar",
    done: "Copiado",
    label: "Copiar el comando de instalación",
    code: "Copiar el código",
  },
  hero: {
    title: "Redespliega tus stacks de Komodo desde CI.",
    lede: "Komodo CD es un pequeño panel autoalojado sobre Komodo: el estado de cada stack, Pull o Redeploy con un clic y un curl listo para pegar, para que tu pipeline haga lo mismo después de cada push.",
    installLabel: "Instalar en un servidor",
    installHint:
      "Ejecútalo en un directorio vacío. Hace unas pocas preguntas, genera el secreto y arranca el stack con Docker Compose.",
    docs: "Leer la documentación",
    github: "Código en GitHub",
  },
  frame: {
    caption: "Capturas de la aplicación en marcha. Pulsa una para ampliarla.",
    open: "Ampliar captura",
    viewer: "Visor de capturas",
    close: "Cerrar",
    previous: "Captura anterior",
    next: "Captura siguiente",
  },
  tour: {
    heading: "Qué incluye",
    stops: {
      deploy: {
        title: "Pull, Redeploy o los dos.",
        body: "Elige un stack y una acción. Pull actualiza las imágenes sin reiniciar, Redeploy baja y vuelve a levantar todo el stack, Pull + Redeploy hace las dos cosas. Debajo del formulario, la misma acción como un curl listo para un workflow de GitHub o Gitea Actions.",
        alt: "Página de deploy manual con el selector de stack, las tres acciones y el comando curl equivalente",
      },
      history: {
        title: "Cada deploy deja rastro.",
        body: "Las acciones lanzadas desde el panel y desde CI acaban en el mismo historial, con quién las lanzó (un usuario o el nombre de la API key), el resultado y el propio mensaje de error de Komodo cuando algo falla.",
        alt: "Página de historial con acciones correctas y fallidas, agrupadas por tiempo",
      },
      connection: {
        title: "Un Komodo, un par de claves.",
        body: "Pega la URL de tu instancia de Komodo y una key y un secret de su Settings → API Keys. Se quedan en el backend: la API muestra la conexión por nombre y URL, nunca con sus credenciales.",
        alt: "Página de conexión con Komodo con la instancia conectada, su URL y el número de stacks",
      },
      theme: {
        title: "Claro u oscuro, inglés o español.",
        body: "Los dos temas y los dos idiomas vienen de serie y se recuerdan por navegador. En el móvil la navegación superior pasa a ser una barra inferior, así que un redeploy está a un par de toques.",
        alt: "La página de stacks con el tema claro",
      },
    },
    overviewAlt:
      "Página de stacks con los contadores de activos, parados y con problemas, los filtros y un stack desplegado con su curl para CI",
    rest: {
      heading: "Y el resto",
      items: [
        {
          term: "El estado de un vistazo",
          text: "Busca y filtra stacks por activos, parados o con problemas: estados de error, un proyecto que falta o ficheros que no están en el host.",
        },
        {
          term: "Avisos de actualización",
          text: "Un stack se marca cuando una de sus imágenes tiene actualización o el commit desplegado va por detrás del último.",
        },
        {
          term: "API keys",
          text: "Claves personales enviadas como x-api-key, que solo se muestran al crearlas. Cada pipeline puede tener la suya y revocarse por separado.",
        },
        {
          term: "Referencia OpenAPI",
          text: "Cada endpoint está documentado en una referencia interactiva en /scalar, con la especificación en /doc.",
        },
        {
          term: "Avisos de fallo",
          text: "Notificaciones opcionales de ntfy, en ntfy.sh o en tu propio servidor, cada vez que falla un deploy, desde CI o a mano.",
        },
        {
          term: "Tres imágenes, un volumen",
          text: "Backend, frontend y gateway en ghcr.io, con la etiqueta latest y la de cada versión. SQLite en un único volumen: sin servidor de base de datos.",
        },
      ],
    },
  },
  arch: {
    heading: "Cómo está montado",
    lede: "Tres contenedores levantados con Docker Compose. El gateway lleva Caddy, el único puerto publicado, que manda la API al backend y cada página a Astro SSR en el contenedor del frontend. El backend es el dueño de un fichero SQLite y habla con tu instancia de Komodo, y Komodo hace el despliegue real en tus servidores.",
    diagramTitle: "Topología",
    diagramDesc:
      "Un navegador y un runner de CI llegan a Caddy por el puerto 80 en el contenedor del gateway. Caddy manda /rpc, /api, /doc y /scalar al backend Hono en el puerto 3000 y cualquier otra ruta a Astro SSR en el 4321, en el contenedor del frontend, que comprueba la sesión contra el backend. Los dos solo escuchan dentro de la red de Compose. El backend lee y escribe un fichero SQLite en el volumen db_data y llama a la API de Komodo Core por HTTPS con una key y un secret. Komodo hace entonces el pull y el redeploy del stack en tus servidores a través de sus agentes Periphery.",
    legendHttp: "Conexión, con su protocolo o ruta",
    legendKomodo: "Tráfico propio de Komodo, fuera de Komodo CD",
    published: "publicado",
    pathsLabel: "Recorrido de las peticiones",
    pagePath: "Abrir una página",
    deployPath: "Desplegar desde CI",
    nodes: {
      browser: "Navegador",
      ci: "Runner de CI",
      gateway: "Gateway",
      frontend: "Frontend",
      caddy: "Caddy",
      astro: "Astro SSR",
      backend: "Backend",
      sqlite: "SQLite",
      komodo: "Komodo",
      servers: "Tus servidores",
    },
    roles: {
      ci: "GitHub · Gitea",
      container: "contenedor",
      caddy: "proxy inverso",
      astro: "solo red de Compose",
      backend: "Hono · oRPC · Better Auth",
      sqlite: "volumen db_data",
      komodo: "tu instancia · Core API",
      servers: "Komodo Periphery",
    },
    routing: {
      heading: "Enrutado del gateway",
      route: "Petición",
      target: "Va a",
      rows: [
        { route: "/rpc/*  /api/*", target: "backend:3000" },
        { route: "/doc  /scalar", target: "backend:3000" },
        { route: "cualquier otra ruta", target: "frontend:4321" },
      ],
      note: "Solo el puerto 80 del gateway se mapea al host, como PORT. El backend y el frontend solo son accesibles dentro de la red de Compose. Caddy además responde a /health y añade cabeceras de seguridad básicas a cada respuesta.",
    },
    principles: [
      {
        term: "El secret de Komodo no sale del backend.",
        text: "La key y el secret se guardan en la base de datos del backend y solo se usan para llamar a Komodo. Al listar la conexión se devuelven su nombre y su URL, nunca las credenciales.",
      },
      {
        term: "Una sola puerta para personas y pipelines.",
        text: "Los mismos endpoints aceptan la cookie de sesión del navegador o la cabecera x-api-key desde CI. Las dos acaban en el historial, una key con su propio nombre.",
      },
      {
        term: "Komodo sigue siendo la fuente de verdad.",
        text: "Los stacks se leen de Komodo en cada petición y las acciones llaman a su PullStack y DeployStack. Komodo CD solo guarda usuarios, API keys, la conexión, los ajustes de ntfy y el historial.",
      },
    ],
    docsLink: "Leer la arquitectura en la documentación",
  },
  install: {
    heading: "En marcha con un solo comando.",
    lede: "En un host Linux con Docker, curl y openssl, desde un directorio vacío:",
    stepsLabel: "Qué hace el script",
    steps: [
      "Pregunta el puerto del host, la URL pública y el nombre, email y contraseña del primer administrador.",
      "Genera BETTER_AUTH_SECRET con openssl y escribe .env con modo 600. Nunca sobrescribe un .env existente.",
      "Descarga compose.yml en el directorio actual.",
      "Opcionalmente descarga las imágenes de ghcr.io y arranca el stack. El backend migra la base de datos y crea el administrador al arrancar.",
    ],
    warning:
      "Todo lo que guarda Komodo CD vive en el volumen db_data: usuarios, API keys, la conexión con Komodo, los ajustes de ntfy y el historial. Haz copia, y ten en cuenta que docker compose down -v lo borra.",
    manual: "¿Prefieres montarlo a mano?",
    manualLink: "Desplegar con Docker Compose",
  },
  footer: {
    license: "Software libre bajo la GNU GPL v3.0.",
    releases: "Versiones",
    issues: "Incidencias",
    license_link: "Licencia",
  },
  docs: {
    title: "Documentación",
    onThisPage: "En esta página",
    pages: "Páginas",
    edit: "Editar esta página en GitHub",
    previous: "Anterior",
    next: "Siguiente",
  },
}

export const ui: Record<Lang, Dictionary> = { en, es }

export function t(lang: Lang): Dictionary {
  return ui[lang]
}
