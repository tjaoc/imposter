# Despliegue: Render (todo en uno) + MongoDB Atlas + subdominios

Guía para desplegar Imposter. **Recomendado:** usar **Render** para frontend y backend (todo en un solo sitio, plan gratuito). Base de datos en **MongoDB Atlas** (también gratis).

**El proyecto ya está preparado para los 2 entornos de Render (producción + desarrollo):** hay un `render.yaml` (Blueprint) en la raíz que define un proyecto con dos entornos, cada uno con API + App. Ver **RENDER_ENVS.md** para URLs (impostor.netic.app, apiimp.netic.app, dev.*), bases de datos (production / develop) y variables a configurar en el Dashboard.

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

| Tipo  | Nombre | Apuntar a                          |
|-------|--------|-------------------------------------|
| CNAME | `app`  | URL que Render da al Static Site    |
| CNAME | `api`  | URL que Render da al Web Service    |

- **app.tudominio.com** → Frontend (Static Site en Render)
- **api.tudominio.com** → Backend (Web Service en Render)

Después de añadir el dominio en Render, te dirá exactamente a qué CNAME apuntar. Pueden tardar unos minutos en propagarse.

---

## 5. Resumen de variables

### Backend (Web Service en Render)

| Variable      | Ejemplo / Descripción                          |
|---------------|-------------------------------------------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.../imposter`  |
| `NODE_ENV`    | `production`                                   |
| `CORS_ORIGIN` | `https://imposter-app.onrender.com` (URL del frontend) |

### Frontend (Static Site en Render)

| Variable          | Ejemplo / Descripción                    |
|-------------------|------------------------------------------|
| `VITE_API_URL`    | `https://imposter-api.onrender.com`      |
| `VITE_SOCKET_URL` | `https://imposter-api.onrender.com`      |

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

## Alternativa: Vercel (frontend) + Render (backend)

Si prefieres Vercel para el frontend:

- **Frontend** en [Vercel](https://vercel.com): Root Directory `frontend`, variables `VITE_API_URL` y `VITE_SOCKET_URL` = URL del backend en Render.
- **Backend** solo en Render (como en la sección 2), con `CORS_ORIGIN` = URL de Vercel (ej. `https://tu-proyecto.vercel.app`).

El resto (Atlas, subdominios) es igual; solo cambia dónde está alojado el frontend.
