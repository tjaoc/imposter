# Configuración Render: Producción y Desarrollo

Resumen de URLs, bases de datos y variables para los entornos en Render.

---

## 1. MongoDB Atlas: crear las bases de datos

En el cluster de Atlas (`impostor.tnqoasv.mongodb.net`), crea **dos bases de datos** (o déjalas que se creen al arrancar el backend):

| Entorno    | Nombre de la base |
| ---------- | ----------------- |
| Producción | `production`      |
| Desarrollo | `develop`         |

No hace falta crearlas a mano: al arrancar el backend con una `MONGODB_URI` que termina en `/production` o `/develop`, MongoDB crea la base si no existe.

---

## 2. Producción

| Servicio | Tipo        | Dominio                |
| -------- | ----------- | ---------------------- |
| API      | Web Service | **apiimp.netic.app**   |
| App      | Static Site | **impostor.netic.app** |

### Variables en Render (entorno Production)

**imposter-api-prod**

| Variable      | Valor                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`    | `production` (ya en Blueprint)                                                                              |
| `CORS_ORIGIN` | `https://impostor.netic.app` (ya en Blueprint)                                                              |
| `MONGODB_URI` | `mongodb+srv://impostoradm:TU_PASSWORD@impostor.tnqoasv.mongodb.net/production?retryWrites=true&w=majority` |

Sustituye `TU_PASSWORD` por la contraseña real del usuario `impostoradm`. No subas la contraseña al repo.

**CORS:** Si usas varios frontends (ej. prod + dev), puedes poner varios orígenes separados por coma:  
`CORS_ORIGIN=https://impostor.netic.app,https://impostor.netic.dev`

**imposter-app-prod**

| Variable          | Valor                                        |
| ----------------- | -------------------------------------------- |
| `VITE_API_URL`    | `https://apiimp.netic.app` (ya en Blueprint) |
| `VITE_SOCKET_URL` | `https://apiimp.netic.app` (ya en Blueprint) |

---

## 3. Desarrollo

| Servicio | Tipo        | Dominio                    |
| -------- | ----------- | -------------------------- |
| API      | Web Service | **dev.apiimp.netic.app**   |
| App      | Static Site | **dev.impostor.netic.app** |

### Variables en Render (entorno Development)

**imposter-api-dev**

| Variable      | Valor                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`    | `development` (ya en Blueprint)                                                                          |
| `CORS_ORIGIN` | `https://dev.impostor.netic.app` (ya en Blueprint)                                                       |
| `MONGODB_URI` | `mongodb+srv://impostoradm:TU_PASSWORD@impostor.tnqoasv.mongodb.net/develop?retryWrites=true&w=majority` |

Sustituye `TU_PASSWORD` por la misma contraseña del usuario Atlas.

**imposter-app-dev**

| Variable          | Valor                                            |
| ----------------- | ------------------------------------------------ |
| `VITE_API_URL`    | `https://dev.apiimp.netic.app` (ya en Blueprint) |
| `VITE_SOCKET_URL` | `https://dev.apiimp.netic.app` (ya en Blueprint) |

---

## 4. DNS (subdominios)

En el proveedor de tu dominio (netic.app), configura:

| Tipo  | Nombre         | Apuntar a / Valor                            |
| ----- | -------------- | -------------------------------------------- |
| CNAME | `impostor`     | Lo que indique Render para imposter-app-prod |
| CNAME | `apiimp`       | Lo que indique Render para imposter-api-prod |
| CNAME | `dev.impostor` | Lo que indique Render para imposter-app-dev  |
| CNAME | `dev.apiimp`   | Lo que indique Render para imposter-api-dev  |

(O los registros que Render te muestre al añadir cada dominio en cada servicio.)

---

## 5. Pasos tras conectar el Blueprint

1. En Render, tras crear el Blueprint, entra en cada servicio y en **Environment** asigna **solo** `MONGODB_URI` (producción con `/production`, desarrollo con `/develop`). El resto de variables ya vienen del `render.yaml`.
2. En MongoDB Atlas, **Network Access**: permite acceso desde cualquier IP (`0.0.0.0/0`) para que Render pueda conectar.
3. Comprueba: `https://apiimp.netic.app/health` y `https://dev.apiimp.netic.app/health`; luego abre las URLs de la app.

---

## 6. 502 Bad Gateway + CORS en el navegador

Si ves **502 (Bad Gateway)** y **"No 'Access-Control-Allow-Origin' header"** al abrir la app:

1. **Backend dormido (plan Free):** En Render, los Web Services Free se suspenden tras ~15 min sin tráfico. La primera petición puede tardar **30–60 segundos** y a veces el proxy responde 502 antes de que el servicio despierte. **Solución:** Espera 1 minuto, recarga la página o abre primero `https://apiimp.netic.app/health` hasta que responda `{"ok":true,...}` y luego usa la app.
2. **Backend caído:** Revisa en Render → **imposter-api-prod** → **Logs**. Si falla al arrancar, suele ser **MONGODB_URI** incorrecta (contraseña, red) o que Atlas no tiene `0.0.0.0/0` en Network Access.
3. **CORS:** Cuando el backend sí responde, debe tener `CORS_ORIGIN=https://impostor.netic.app` (sin barra final). Si usas también la URL `.onrender.com` del frontend, añade ese origen separado por coma en `CORS_ORIGIN`.

Los avisos de **Permissions-Policy** (browsing-topics, run-ad-auction, etc.) vienen del host (Render/CDN) y son inofensivos; no afectan a la app.

---

**Importante:** No guardes la contraseña de MongoDB en el repositorio. Configúrala solo en el Dashboard de Render (Environment Variables).
