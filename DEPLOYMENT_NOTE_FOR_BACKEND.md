# Deployment note for backend developer

This repo is the **frontend** of the direct-apply archiving system. It is a **static web app** (React + Vite). At runtime it only needs to be served as static files; no Node.js or Python is required to run it. Your backend (Python/Odoo) will run separately and the frontend will call its APIs.

---

## 1. What you need to build (one-time or on each release)

- **Node.js** (LTS, e.g. v20 or v22) and **npm** installed on the machine where you build.
- Clone the repo, then from the project root:

```bash
npm install
npm run build
```

This produces a **`dist`** folder with the built app. Building may take 1–2 minutes.

---

## 2. What to deploy

- Deploy **only the contents of the `dist` folder** (or the whole `dist` folder as the web root).
- **Do not** deploy `node_modules`, `src`, or any other project files.
- The entry point is **`dist/index.html`**. The web server must serve this for the app route (e.g. `/` and client-side routes).

---

## 3. How to serve the frontend

You can use **any static file server**. The app is just HTML, CSS, and JavaScript.

**Examples:**

- **Nginx** – set `root` (or `alias`) to the path that contains `dist`’s contents (or to `dist` itself).
- **Apache** – set `DocumentRoot` to that path.
- **Docker** – copy `dist` into the image and point nginx/apache at it.
- **Cloud** (Netlify, Vercel, S3 + CloudFront, etc.) – set “build output” or “publish directory” to `dist`.

**Important:** For client-side routing (React Router), the server must serve `index.html` for paths that don’t match a real file (e.g. `/documents`, `/folders`). In **nginx** you typically do:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 4. Connecting the frontend to your backend (API)

The frontend calls **REST/JSON-RPC** endpoints under **`/api`** (and uses **`/websocket`** for WebSockets if you use them). You have two main options.

### Option A – Same origin (recommended if frontend and backend are on the same server)

- Serve the **frontend** from the same host/port as the **backend** (e.g. `https://yourdomain.com/`).
- Use your web server (e.g. nginx) to **reverse-proxy** `/api` and `/websocket` to your Python/Odoo backend. The frontend then uses relative URLs like `/api/...` and no extra config is needed.

**Example nginx (conceptual):**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (static files from dist)
    root /var/www/archive-frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8070;   # your Odoo/backend port
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSockets (if your backend has a WS endpoint)
    location /websocket {
        proxy_pass http://127.0.0.1:8070;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Adjust `proxy_pass` port and paths to match your actual backend.

### Option B – Frontend and backend on different origins

- Build with the backend base URL set:

  ```bash
  VITE_API_BASE_URL=https://api.yourdomain.com npm run build
  ```

- Deploy the `dist` output to the frontend domain (e.g. `https://app.yourdomain.com`).
- Your **backend must allow CORS** from the frontend origin (e.g. `https://app.yourdomain.com`). The frontend sends `withCredentials: true` and may send cookies/authorization headers, so CORS must allow credentials and the appropriate headers.

---

## 5. Summary checklist

| Step | Action |
|------|--------|
| 1 | Install Node.js (LTS) and run `npm install` then `npm run build` in the project root. |
| 2 | Deploy the **`dist`** folder (or its contents) as the static web root. |
| 3 | Configure the web server so `/` (and app routes) serve `index.html`. |
| 4 | Ensure **`/api`** (and **`/websocket`** if used) reach your Python/Odoo backend (reverse proxy or CORS + `VITE_API_BASE_URL`). |

No Python or Odoo is needed to build or serve the frontend; only to run the API that the frontend calls.

---

## Serving Compressed Assets

After running `vite build`, the `/dist/assets/` folder will contain `.gz` and `.br` compressed versions of all JS/CSS files. Configure your web server to serve these pre-compressed files instead of compressing on the fly.

### Nginx
```nginx
gzip_static on;
brotli_static on;
```

### Apache
```apache
<IfModule mod_headers.c>
  <FilesMatch "\.(js|css)\.gz$">
    Header set Content-Encoding gzip
    Header append Vary Accept-Encoding
  </FilesMatch>
  <FilesMatch "\.(js|css)\.br$">
    Header set Content-Encoding br
    Header append Vary Accept-Encoding
  </FilesMatch>
</IfModule>
```
