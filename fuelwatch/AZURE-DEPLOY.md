# Azure Minimal-Cost Deployment (SQLite + Nginx + PM2)

This is a step-by-step playbook for deploying FuelWatch to **Azure** using the **lowest-complexity** setup:

- **Azure Linux Virtual Machine (Ubuntu 22.04+)**
- **SQLite stored on the VM disk**
- **Nginx** serves the built frontend and reverse-proxies `/api` and `/uploads`
- **PM2** keeps the Node backend running
- **Custom domain + HTTPS** using **Let’s Encrypt (certbot)**

## Assumptions

1. You will deploy to an **Azure Linux VM** (Ubuntu 22.04+).
2. You will use a **custom domain** and enable **HTTPS** with Let’s Encrypt.
3. You will use **SQLite** on the VM disk (`backend/data/fuelwatch.db`).
4. You will use **Nginx** to proxy:
   - `/api/*` → `http://127.0.0.1:5000`
   - `/uploads/*` → `http://127.0.0.1:5000`

If you want a cheaper “no domain yet” mode, you can temporarily use the VM public IP over HTTP, but OAuth redirect URLs and CORS must match what you actually use in production.

## 0. Cost-minimizing choices (do this first)

For 100–200 users, a small VM is usually enough:

- Pick a **small** size (example guidance):
  - **1 vCPU, 1–2 GB RAM**
  - If Azure offers “burstable” options, they can be cheaper for light traffic.
- Use **managed disk** (default for VM) so your SQLite DB persists.
- Don’t expose port `5000` to the internet. Only allow `22`, `80`, `443`.

## 1. Create Azure resources

### 1.1 Resource Group

- Create a Resource Group (example name: `fuelwatch-rg`).

### 1.2 Create a VM (Ubuntu)

In Azure Portal:

1. **Create VM**
2. Choose:
   - **OS:** Ubuntu Server 22.04 LTS (recommended)
   - **Region:** pick the closest to your users (Philippines users usually prefer APAC regions)
   - **Size:** smallest workable (1 vCPU, 1–2 GB RAM)
3. Networking:
   - Select **public inbound ports**:
     - **SSH (22)**
     - **HTTP (80)**
     - **HTTPS (443)**
   - Do **not** open port `5000`.
4. Authentication:
   - Use SSH key (recommended) or password (if key not possible).

### 1.3 Add DNS for your domain

In your domain provider (or Azure DNS if you manage it there):

- Create an **A record** (IPv4) pointing `yourdomain.com` to your VM public IP.
- Create a **CNAME** or A record for `www.yourdomain.com` if needed.

Make sure DNS is active before you run certbot.

## 2. Connect to the VM

From your computer:

```bash
ssh ubuntu@YOUR_VM_PUBLIC_IP
```

(Replace `ubuntu` with whatever username Azure gave you.)

## 3. Install system dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git sqlite3 curl
```

### 3.1 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

### 3.2 Install PM2

```bash
sudo npm install -g pm2
pm2 -v
```

## 4. Clone and install FuelWatch

Choose a folder, usually:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

cd /var/www
git clone YOUR_GIT_URL fuelwatch
cd fuelwatch
```

Install:

```bash
cd backend
npm install --production

cd ../frontend
npm install
```

Important: do not copy/upload `node_modules` from your local machine.
`better-sqlite3` contains a native binary, and copying it can cause errors like `invalid ELF header` on the VPS.
Always run `npm install` on the Azure VM so native dependencies build for Linux.

If you already copied `node_modules` and see:
`better_sqlite3.node: invalid ELF header`

run this on the Azure VM:

```bash
cd /var/www/fuelwatch/backend
rm -rf node_modules
sudo apt-get update
sudo apt-get install -y build-essential python3 make g++ libsqlite3-dev
npm install
npm run setup
```

## 5. Configure backend environment (.env)

```bash
cd /var/www/fuelwatch/backend
cp .env.example .env
nano .env
```

Set at minimum:

```env
NODE_ENV=production
PORT=5000
DB_PATH=./data/fuelwatch.db
UPLOADS_DIR=./uploads

# IMPORTANT: set these to strong random values
JWT_SECRET=REPLACE_WITH_RANDOM_SECRET
SESSION_SECRET=REPLACE_WITH_RANDOM_SESSION_SECRET

# Domain/CORS for production
CORS_ORIGIN=https://lakbahay.com
FRONTEND_URL=https://lakbahay.com

# OAuth callback (must match Google console redirect URLs)
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

Generate strong secrets on the VM:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

> Do not commit your `.env` file to Git.

## 6. Configure frontend environment (frontend/.env)

```bash
cd /var/www/fuelwatch/frontend
nano .env
```

Keep:

```env
VITE_API_BASE_URL=/api
```

This matches the Nginx reverse proxy setup (same host, same origin).

## 7. Initialize the database (SQLite)

From `backend/`:

```bash
cd /var/www/fuelwatch/backend
npm run setup
```

Optional (can be slow and rate-limited):

```bash
npm run osm-import
```

## 8. Build the frontend

```bash
cd /var/www/fuelwatch/frontend
npm run build
```

After this, you should have:

- `frontend/dist/`

## 9. Configure Nginx (serve frontend + proxy API)

Create an Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/fuelwatch
```

Use this config (replace `yourdomain.com` only in `server_name`):

```nginx
server {
    listen 80;
    server_name lakbahay.com www.lakbahay.com;

    # Frontend (Vite build output)
    root /var/www/fuelwatch/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Reverse proxy uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable it and test:

```bash
sudo ln -s /etc/nginx/sites-available/fuelwatch /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

## 10. Start the backend with PM2

Start from the `backend/` folder so `.env` is found:

```bash
cd /var/www/fuelwatch/backend
pm2 start src/server.js --name fuelwatch-api
pm2 save
pm2 startup
```

`pm2 startup` prints a `sudo ...` command. Copy it and run it exactly.

Check:

```bash
pm2 status
curl http://127.0.0.1:5000/health
```

## 11. Enable HTTPS with Let’s Encrypt (certbot)

Install certbot for nginx:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Run certbot:

```bash
sudo certbot --nginx -d gastolina.info -d www.gastolina.info
```

Restart the backend after `.env` changes (if you edited CORS/OAuth URLs):

```bash
pm2 restart fuelwatch-api
```

Test:

- Open: `https://yourdomain.com`
- Also test API: `https://yourdomain.com/api/health` (may show JSON)

## 12. Firewall rules (NSG) recap

In Azure VM Network Security Group / inbound rules:

- Allow: `22`, `80`, `443`
- Do not allow: `5000` from the public internet

## 13. Backups (SQLite + uploads)

You should back up:

- `backend/data/fuelwatch.db`
- `backend/uploads/`

On Azure you can do backups by:

1. Periodic VM snapshot / managed disk snapshot, or
2. Periodic `rsync`/tar to another storage location.

Minimum safe approach:

```bash
tar -czf /tmp/fuelwatch-backup-$(date +%Y%m%d).tar.gz -C /var/www/fuelwatch backend/data/fuelwatch.db backend/uploads
```

Then copy that tarball somewhere safe.

## 14. Maintenance / updates

When you update code:

```bash
cd /var/www/fuelwatch
git pull

cd backend
npm install --production

cd ../frontend
npm install
npm run build

pm2 restart fuelwatch-api
sudo systemctl reload nginx
```

Your SQLite migrations run on startup (`runMigrations()` in `backend/src/server.js`).

---

## Common problems (quick checks)

1. **Site loads but API doesn’t**
   - Check backend: `pm2 logs fuelwatch-api`
   - Check nginx error: `/var/log/nginx/error.log`
2. **Blank page**
   - Confirm Nginx `try_files $uri $uri/ /index.html;`
3. **OAuth login fails**
   - Ensure `GOOGLE_CALLBACK_URL` uses the exact `https://yourdomain.com/...` URL you configured in Google Cloud.

