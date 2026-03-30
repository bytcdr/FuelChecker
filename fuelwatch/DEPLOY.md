# Deploying FuelWatch on a VPS

A step-by-step guide for deploying FuelWatch on a Linux VPS (Ubuntu/Debian) using Node.js, PM2, and Nginx.

## At a glance (checklist)

1. Install Node.js (v18+), Nginx, and Git on the VPS.
2. Clone the repo (e.g. under `/var/www/fuelwatch`) and run `npm install` in `backend/` and `frontend/`.
3. Copy `backend/.env.example` to `backend/.env` and set production values: strong secrets, `CORS_ORIGIN`, `FRONTEND_URL`, and OAuth callback URLs for your domain or IP.
4. Set `frontend/.env` with `VITE_API_BASE_URL=/api` so the browser uses the same host and Nginx proxies `/api` to the backend.
5. Run `npm run setup` in `backend/` (migrations + seed); optionally `npm run osm-import` for OSM stations.
6. Run `npm run build` in `frontend/` to produce `frontend/dist/`.
7. Start the API with PM2: `pm2 start src/server.js --name fuelwatch-api`, then `pm2 save` and `pm2 startup`.
8. Configure Nginx: serve `frontend/dist/` as the site root, `try_files` for the SPA, proxy `/api` and `/uploads` to `127.0.0.1:5000`.
9. (Optional) Add HTTPS with Certbot; update backend `.env` and Google OAuth callback to `https://`.
10. Enable UFW: allow SSH and HTTP/HTTPS; do not expose port 5000 publicly.
11. Ongoing: `git pull`, reinstall deps, rebuild frontend, `pm2 restart`; back up `backend/data/fuelwatch.db` and `backend/uploads/`.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Ubuntu / Debian VPS | 22.04+ recommended |
| Node.js | v18 or v20 LTS |
| npm | Comes with Node.js |
| Nginx | Latest from apt |
| Git | Latest from apt |
| Domain name | Optional (you can use the server IP) |

### Install Node.js (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x
```

### Install Nginx and Git

```bash
sudo apt update
sudo apt install -y nginx git
```

---

## 1. Clone and Install Dependencies

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/fuelwatch.git
sudo chown -R $USER:$USER /var/www/fuelwatch
cd /var/www/fuelwatch

# Install backend dependencies
cd backend
npm install --production
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

Important: do not copy/upload `node_modules` from your local machine.
`better-sqlite3` contains a native binary, and copying it can cause errors like `invalid ELF header` on the VPS.
Always run `npm install` on the VPS so native dependencies are built for Linux.

If you already copied `node_modules` and see:
`better_sqlite3.node: invalid ELF header`

run this on the VPS:

```bash
cd /var/www/fuelwatch/backend
rm -rf node_modules
sudo apt-get update
sudo apt-get install -y build-essential python3 make g++ libsqlite3-dev
npm install
npm run setup
```

---

## 2. Configure the Backend `.env`

Copy the example and edit it:

```bash
cd /var/www/fuelwatch/backend
cp .env.example .env
nano .env
```

Update the following values for production:

```env
# Server
PORT=5000
NODE_ENV=production

# Database (relative to backend/)
DB_PATH=./data/fuelwatch.db

# JWT — generate a strong random secret
JWT_SECRET=CHANGE_ME_use_openssl_rand_hex_64
JWT_EXPIRES_IN=7d

# Session secret — also generate a strong random value
SESSION_SECRET=CHANGE_ME_another_random_secret

# Uploads
UPLOADS_DIR=./uploads
MAX_FILE_SIZE_MB=5

# CORS / Frontend URL — use your domain or IP
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Stale price threshold
STALE_PRICE_DAYS=7
SPAM_INTERVAL_MINUTES=30

# Google OAuth — update the callback URL to your domain
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

Generate strong secrets with:

```bash
openssl rand -hex 64    # use output for JWT_SECRET
openssl rand -hex 32    # use output for SESSION_SECRET
```

> If you don't have a domain yet, replace `https://yourdomain.com` with `http://YOUR_SERVER_IP`.

---

## 3. Configure the Frontend `.env`

```bash
cd /var/www/fuelwatch/frontend
nano .env
```

For a production deployment behind Nginx (same domain serves both frontend and API):

```env
VITE_API_BASE_URL=/api

VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION=© OpenStreetMap Contributors

VITE_MAP_CENTER_LAT=17.5000
VITE_MAP_CENTER_LNG=121.0000
VITE_MAP_DEFAULT_ZOOM=8

VITE_APP_NAME=FuelWatch Philippines
```

The key setting is `VITE_API_BASE_URL=/api` -- this works because Nginx will reverse-proxy `/api` requests to the backend.

---

## 4. Initialize the Database

```bash
cd /var/www/fuelwatch/backend

# Run migrations and seed initial data (admin user, fuel products)
npm run setup

# (Optional) Import real gas stations from OpenStreetMap
npm run osm-import
```

This creates `backend/data/fuelwatch.db`. Make sure the `data/` and `uploads/` directories exist and are writable.

---

## 5. Build the Frontend

```bash
cd /var/www/fuelwatch/frontend
npm run build
```

This produces a `dist/` directory containing the static site. Nginx will serve these files directly.

---

## 6. Run the Backend with PM2

PM2 keeps the Node.js backend running and restarts it on crashes or server reboots.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the backend
cd /var/www/fuelwatch/backend
pm2 start src/server.js --name fuelwatch-api

# Save the process list and enable startup on boot
pm2 save
pm2 startup
```

The last command prints a `sudo` command -- copy and run it to enable auto-start on reboot.

### Useful PM2 commands

```bash
pm2 status              # check running processes
pm2 logs fuelwatch-api  # view live logs
pm2 restart fuelwatch-api
pm2 stop fuelwatch-api
```

---

## 7. Nginx Reverse Proxy Configuration

Create a new Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/fuelwatch
```

Paste the following (replace `yourdomain.com` with your domain or server IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend — serve the Vite build output
    root /var/www/fuelwatch/frontend/dist;
    index index.html;

    # SPA fallback — all non-file routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API requests to the Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Reverse proxy uploaded files
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Gzip compression for static assets
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;
    gzip_min_length 256;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and reload Nginx:

```bash
# Enable the config
sudo ln -s /etc/nginx/sites-available/fuelwatch /etc/nginx/sites-enabled/

# Remove the default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test the config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Your site should now be accessible at `http://yourdomain.com` (or `http://YOUR_SERVER_IP`).

---

## 8. HTTPS with Let's Encrypt (Optional but Recommended)

If you have a domain name pointed at your server:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install the certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will:
# - Obtain a free SSL certificate
# - Automatically update your Nginx config
# - Set up auto-renewal
```

After enabling HTTPS, update your backend `.env`:

```env
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

Then restart the backend:

```bash
pm2 restart fuelwatch-api
```

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

---

## 9. Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'    # allows both HTTP (80) and HTTPS (443)
sudo ufw enable
sudo ufw status
```

> Do **not** expose port 5000 externally. Nginx proxies requests to it internally.

---

## 10. Maintenance

### Updating the Application

```bash
cd /var/www/fuelwatch

# Pull latest code
git pull origin main

# Update backend dependencies
cd backend
npm install --production
cd ..

# Rebuild the frontend
cd frontend
npm install
npm run build
cd ..

# Restart the backend (migrations run automatically on startup)
pm2 restart fuelwatch-api
```

### Backing Up the Database

The SQLite database and uploaded files should be backed up regularly:

```bash
# Create a backup directory
mkdir -p /var/backups/fuelwatch

# Backup the database (use .backup for a consistent copy while the app runs)
sqlite3 /var/www/fuelwatch/backend/data/fuelwatch.db ".backup '/var/backups/fuelwatch/fuelwatch-$(date +%Y%m%d).db'"

# Backup uploads
tar -czf /var/backups/fuelwatch/uploads-$(date +%Y%m%d).tar.gz -C /var/www/fuelwatch/backend uploads/
```

You can automate this with a cron job:

```bash
crontab -e
```

Add a daily backup at 2 AM:

```
0 2 * * * sqlite3 /var/www/fuelwatch/backend/data/fuelwatch.db ".backup '/var/backups/fuelwatch/fuelwatch-$(date +\%Y\%m\%d).db'"
```

### Viewing Logs

```bash
pm2 logs fuelwatch-api          # application logs
sudo tail -f /var/log/nginx/access.log   # Nginx access logs
sudo tail -f /var/log/nginx/error.log    # Nginx error logs
```

---

## Quick Reference

| What | Command |
|---|---|
| Start backend | `pm2 start fuelwatch-api` |
| Stop backend | `pm2 stop fuelwatch-api` |
| Restart backend | `pm2 restart fuelwatch-api` |
| View logs | `pm2 logs fuelwatch-api` |
| Rebuild frontend | `cd frontend && npm run build` |
| Test Nginx config | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Renew SSL cert | `sudo certbot renew` |
| Backup database | `sqlite3 backend/data/fuelwatch.db ".backup 'backup.db'"` |
