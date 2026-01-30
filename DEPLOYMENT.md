# Despliegue: Render (todo en uno) + MongoDB Atlas + subdominios

Guía para desplegar Imposter. **Recomendado:** usar **Render** para frontend y backend (todo en un solo sitio, plan gratuito). Base de datos en **MongoDB Atlas** (también gratis).

**El proyecto ya está preparado para los 2 entornos de Render (producción + desarrollo):** hay un `render.yaml` (Blueprint) en la raíz que define un proyecto con dos entornos, cada uno con API + App. Ver **RENDER_ENVS.md** para URLs (impostor.netic.app, apiimp.netic.app, dev.\*), bases de datos (production / develop) y variables a configurar en el Dashboard.

---

## Conectar GitHub en Render y desplegar con render.yaml (Blueprint)

Sigue estos pasos para que Render importe el repo, lea el `render.yaml` y cree todos los servicios automáticamente.

### 1. Conectar GitHub a Render

1. Entra en **[Render](https://render.com)** e inicia sesión (o regístrate).
2. Si es la primera vez, haz clic en **Connect account** o **Connect GitHub** y autoriza a Render para acceder a tu cuenta de GitHub.
3. Render podrá ver tus repositorios. Asegúrate de que el repo **imposter** (o el nombre que tenga tu proyecto) esté en GitHub y que el archivo **`render.yaml`** esté en la **raíz** del repo.

### 2. Crear el Blueprint desde el repo

1. En el **Dashboard** de Render, haz clic en **New +** (botón azul).
2. Elige **Blueprint**.
3. Conecta el repositorio:
   - Si ya conectaste GitHub, verás la lista de repos. Selecciona **imposter** (o tu repo).
   - Si no aparece, haz clic en **Configure account** y vuelve a autorizar el acceso a ese repo/organización.
4. Render detecta el archivo **`render.yaml`** en la raíz y te muestra un resumen del proyecto y los servicios que va a crear (proyecto **imposter**, entornos **production** y **development**, 4 servicios: imposter-api-prod, imposter-app-prod, imposter-api-dev, imposter-app-dev).
5. Revisa la configuración y haz clic en **Apply** (o **Create Blueprint**).

### 3. Configurar variables con `sync: false` (MONGODB_URI)

Durante el flujo de creación (o justo después), Render te pedirá valores para las variables marcadas como **sync: false** en el `render.yaml`:

- **imposter-api-prod** y **imposter-api-dev**: variable **MONGODB_URI**.
  - Producción: `mongodb+srv://impostoradm:TU_PASSWORD@impostor.tnqoasv.mongodb.net/production?retryWrites=true&w=majority`
  - Desarrollo: `mongodb+srv://impostoradm:TU_PASSWORD@impostor.tnqoasv.mongodb.net/develop?retryWrites=true&w=majority`
  - Sustituye `TU_PASSWORD` por la contraseña real del usuario de Atlas.

Si no las rellenaste en ese momento, puedes hacerlo después:

1. En el Dashboard, entra en el **proyecto imposter**.
2. Elige el entorno (**Production** o **Development**).
3. Entra en el servicio **imposter-api-prod** (o **imposter-api-dev**).
4. Ve a **Environment** → **Environment Variables** → **Add variable**.
5. Añade **MONGODB_URI** con el valor correspondiente (con `/production` o `/develop` y la contraseña correcta).
6. Guarda; Render hará un **redeploy** automático del servicio.

### 4. Primer deploy

1. Tras aplicar el Blueprint, Render empieza a crear los 4 servicios y hace el **primer deploy** de cada uno (build + start).
2. Puedes seguir el progreso en el Dashboard: cada servicio tiene su pestaña **Logs** y **Events**.
3. Cuando terminen, tendrás:
   - **Production**: imposter-api-prod e imposter-app-prod (con dominios .onrender.com; los custom impostor.netic.app y apiimp.netic.app los configuras después).
   - **Development**: imposter-api-dev e imposter-app-dev (igual con .onrender.com y luego dev.impostor.netic.app, dev.apiimp.netic.app).

### 5. Añadir tus dominios (opcional)

1. En cada servicio, ve a **Settings** → **Custom Domains**.
2. Añade el dominio (ej. `impostor.netic.app`, `apiimp.netic.app`, `dev.impostor.netic.app`, `dev.apiimp.netic.app`).
3. Render te mostrará el **CNAME** al que debes apuntar en tu DNS (ej. tu servicio .onrender.com).
4. En el panel de tu dominio (netic.app), crea los registros **CNAME** que indica Render. Cuando propaguen, Render activará el SSL.

### Resumen rápido

| Paso | Dónde                                     | Acción                                              |
| ---- | ----------------------------------------- | --------------------------------------------------- |
| 1    | Render → Connect account                  | Conectar GitHub                                     |
| 2    | New + → Blueprint                         | Elegir repo imposter                                |
| 3    | Aplicar Blueprint                         | Rellenar MONGODB_URI (prod y dev) si lo pide        |
| 4    | Dashboard                                 | Esperar a que terminen los 4 deploys                |
| 5    | Settings → Custom Domains (cada servicio) | Añadir impostor.netic.app, apiimp.netic.app, dev.\* |

Si algo falla, revisa **Logs** del servicio que falle (build o runtime) y **RENDER_ENVS.md** para comprobar que las variables y dominios son los correctos.

---

## "Your render.yaml services require payment information"

Si Render te pide **método de pago** al usar el Blueprint:

1. **Opción A – Crear solo 2 servicios a mano (sin Blueprint)**  
   No uses Blueprint. En el Dashboard: **New + → Web Service** (backend) y **New + → Static Site** (frontend). Conecta el mismo repo, pon **Root Directory** `backend` / `frontend` y las variables (MONGODB_URI, CORS_ORIGIN, VITE_API_URL, VITE_SOCKET_URL). Así suele no pedir tarjeta.

2. **Opción B – Blueprint con 2 servicios (archivo `render-free.yaml`)**  
   En el repo hay un **`render-free.yaml`** con solo 2 servicios (API + App), sin proyectos ni entornos. Puedes **sustituir el contenido de `render.yaml`** por el de `render-free.yaml`, hacer commit y push, y volver a aplicar el Blueprint. Con solo 2 servicios a veces no pide pago. Luego añades los dominios en **Settings → Custom Domains** de cada servicio.

3. **Opción C – Añadir tarjeta**  
   Según la documentación de Render, el **plan gratuito no cobra** si te mantienes en los límites (servicios free, ancho de banda incluido). Pedir la tarjeta es para verificación; no se hace cargo si no pasas a plan de pago. Si quieres mantener prod + dev (4 servicios) con el `render.yaml` actual, puedes añadir el método de pago y seguir usando el tier gratuito.

---

## Por qué Render para todo

- **Vercel** es ideal para frontend (SPA/estático) pero es **serverless**: no mantiene conexiones largas. El backend usa **Socket.io** (WebSockets), que necesita un servidor siempre activo, así que el backend no encaja en Vercel.
- **Render** puede servir tanto el **frontend** (Static Site) como el **backend** (Web Service), los dos con plan gratuito. Un solo panel, un solo proveedor y subdominios fáciles de configurar.

---

## 1. MongoDB Atlas

1. Entra en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y crea una cuenta/cluster.
2. Crea un **cluster** (ej. M0 gratis).
3. **Network Access** → Add IP Address → "Allow Access from Anywhere" (`0.0.0.0/0`) para que Render pueda conectar.
4. **Database Access** → Create Database User (usuario y contraseña).
5. **Connect** → Drivers → copia la **connection string**. Ejemplo:

   ```txt
   mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/imposter?retryWrites=true&w=majority
   ```

6. Sustituye `<password>` por la contraseña real. Esta URL será tu `MONGODB_URI` en el backend.

---

## 2. Render: Backend (Web Service)

1. [Render](https://render.com) → Login con GitHub.
2. **New +** → **Web Service** → conecta tu repo.
3. Configuración:
   - **Name**: `imposter-api` (o el que quieras)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. **Environment** (Environment Variables):
   - `MONGODB_URI` = tu connection string de Atlas
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = URL del frontend en Render (ej. `https://imposter-app.onrender.com`; la tendrás después del paso 3)
5. **Create Web Service**. Te darán una URL tipo `https://imposter-api.onrender.com`. Anótala.
6. (Opcional) **Settings** → **Custom Domain** → añade `api.tudominio.com` y en tu DNS crea **CNAME** `api` → `imposter-api.onrender.com`.

---

## 3. Render: Frontend (Static Site) — si no usaste Blueprint

1. En Render: **New +** → **Static Site** → mismo repo.
2. Configuración:
   - **Name**: `imposter-app` (o el que quieras)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. **Environment** (Environment Variables):
   - `VITE_API_URL` = URL del backend en Render (ej. `https://imposter-api.onrender.com`)
   - `VITE_SOCKET_URL` = la misma URL (ej. `https://imposter-api.onrender.com`)
     (Sustituye por la URL real que te dio Render en el paso 2.)
4. **Create Static Site**. Te darán una URL tipo `https://imposter-app.onrender.com`.
5. Vuelve al **backend** (paso 2) y en **Environment** pon `CORS_ORIGIN` = esta URL del frontend (ej. `https://imposter-app.onrender.com`).
6. (Opcional) **Settings** → **Custom Domain** → añade `app.tudominio.com` y en tu DNS crea **CNAME** `app` → la URL que indique Render para el static site.

---

## 4. Subdominios (opcional)

Si usas tu propio dominio:

| Tipo  | Nombre | Apuntar a                        |
| ----- | ------ | -------------------------------- |
| CNAME | `app`  | URL que Render da al Static Site |
| CNAME | `api`  | URL que Render da al Web Service |

- **app.tudominio.com** → Frontend (Static Site en Render)
- **api.tudominio.com** → Backend (Web Service en Render)

Después de añadir el dominio en Render, te dirá exactamente a qué CNAME apuntar. Pueden tardar unos minutos en propagarse.

---

## 5. Resumen de variables

### Backend (Web Service en Render)

| Variable      | Ejemplo / Descripción                                  |
| ------------- | ------------------------------------------------------ |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.../imposter`          |
| `NODE_ENV`    | `production`                                           |
| `CORS_ORIGIN` | `https://imposter-app.onrender.com` (URL del frontend) |

### Frontend (Static Site en Render)

| Variable          | Ejemplo / Descripción               |
| ----------------- | ----------------------------------- |
| `VITE_API_URL`    | `https://imposter-api.onrender.com` |
| `VITE_SOCKET_URL` | `https://imposter-api.onrender.com` |

---

## 6. Comprobar despliegue

1. **Atlas**: En el cluster, "Browse Collections"; la base se crea al arrancar el backend y ejecutar el seed.
2. **Backend**: Abre `https://tu-api.onrender.com/health`; debe responder.
3. **Frontend**: Abre la URL del Static Site; debe cargar la app y conectar al API/Socket.

---

## 7. Notas

- **Orden**: Despliega primero el **backend** para tener su URL; luego el **frontend** con `VITE_API_URL` y `VITE_SOCKET_URL`; después actualiza `CORS_ORIGIN` en el backend con la URL del frontend.
- **Plan gratuito Render**: El Web Service puede “dormir” tras inactividad; la primera petición puede tardar unos segundos. El Static Site no duerme.
- **HTTPS**: Render sirve todo por HTTPS; usa siempre `https://` en las variables.
- **Socket.io**: Funciona correctamente en el Web Service de Render.

---

## Base de datos de palabras (seed)

- Al arrancar, el backend **borra todos los WordPacks** y vuelve a ejecutar el seed (es-ES + pt-PT).
- Para ejecutar solo el seed sin levantar el servidor (por ejemplo desde un cron o tras cambiar datos):

  ```bash
  cd backend && npm run seed
  ```

  Requiere `MONGODB_URI` en `backend/.env`.

---

## Actualización mensual de palabras (día 1)

El script `scripts/update-words-monthly.js` está pensado para ejecutarse **el día 1 de cada mes**:

1. **Buscar actualizaciones**: Si están configuradas las URLs, descarga listas de palabras nuevas (es-ES y/o pt-PT).
2. **Guardar**: Las fusiona en `backend/seeds/data/updates-es.json` y `updates-pt.json`.
3. **Seed**: Ejecuta el seed para subir todo a la base de datos.
4. **Commit y push**: Si hubo actualizaciones descargadas, hace commit y push con esos cambios.

**Variables de entorno** (en `backend/.env` o al ejecutar):

- `WORDS_ES_ES_UPDATE_URL`: URL que devuelve un JSON con formato `{ "slug": ["palabra1", "palabra2", ...], ... }` (mismos slugs que los packs: `cine-series`, `deportes`, etc.).
- `WORDS_PT_PT_UPDATE_URL`: Idem para pt-PT.
- `MONGODB_URI`: URI de MongoDB (necesaria para el seed).

**Ejecución manual** (desde la raíz del repo):

```bash
node scripts/update-words-monthly.js
```

Para automatizar el día 1 de cada mes sin usar plan de pago en Render, programa el script con un **cron externo** (tu máquina, VPS, etc.) o con [GitHub Actions](https://docs.github.com/en/actions). **Cron manual** (ejemplo: día 1 a las 00:00):

```bash
0 0 1 * * cd /ruta/al/repo && node scripts/update-words-monthly.js
```

Si no configuras las URLs, el script solo ejecuta el seed (sincroniza la DB con el código actual) y no hace commit ni push.

---

## Alternativa: Vercel (frontend) + Render (backend)

Si prefieres Vercel para el frontend:

- **Frontend** en [Vercel](https://vercel.com): Root Directory `frontend`, variables `VITE_API_URL` y `VITE_SOCKET_URL` = URL del backend en Render.
- **Backend** solo en Render (como en la sección 2), con `CORS_ORIGIN` = URL de Vercel (ej. `https://tu-proyecto.vercel.app`).

El resto (Atlas, subdominios) es igual; solo cambia dónde está alojado el frontend.
