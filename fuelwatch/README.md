# FuelWatch Tuguegarao  -- SAMPLE

Community-powered fuel price tracking platform for Tuguegarao, Cagayan, Philippines.

---

## Architecture Overview

```
fuelwatch/
├── backend/     Node.js + Express REST API  (port 5000)
│   └── src/
│       ├── config/       DB connection, app constants
│       ├── controllers/  Request handlers (thin, delegate to DB)
│       ├── routes/       Express router definitions
│       ├── middleware/   Auth (JWT), upload (Multer), error handler
│       ├── validators/   express-validator rule sets
│       ├── db/           Schema SQL + migration runner
│       ├── seeds/        Admin user, fuel products, stations
│       ├── utils/        helpers (uuid, dates)
│       └── uploads/      Proof images (local storage)
│
└── frontend/    React + Vite app  (port 3000)
    └── src/
        ├── api/        Axios wrappers for each resource
        ├── components/ Reusable UI (Header, StationCard, MapComponent, …)
        ├── pages/      One file per route (Home, Stations, Map, Admin, …)
        ├── layouts/    MainLayout (public) + AdminLayout (admin sidebar)
        ├── context/    AuthContext (JWT, user state)
        ├── hooks/      useAuth
        ├── utils/      formatters (PHP currency, dates)
        └── styles/     CSS variables + global styles
```

**Database:** SQLite (better-sqlite3, synchronous API)  
**Auth:** JWT stored in localStorage, verified per-request in middleware  
**Map:** MapLibre GL JS with configurable OSM raster tiles  
**Uploads:** Multer → `backend/uploads/` served as static files  

---

## Prerequisites

- **Node.js** v18 or v20 LTS recommended (v18 / v20 are tested stable with `better-sqlite3`)
  - Download: https://nodejs.org/en/download/
  - On Windows, use the **Windows Installer (.msi)** — includes npm automatically
- **npm** v9 or later (bundled with Node.js)
- Works on Windows, macOS, and Linux
- On Windows you may also need **Windows Build Tools** for the native SQLite addon:
  ```
  npm install -g windows-build-tools
  ```
  Or install Visual Studio Build Tools (C++ workload) from https://visualstudio.microsoft.com/downloads/

---

## Quick Start (Local Setup)

### 1. Clone / navigate to the project

```bash
cd fuelwatch
```

### 2. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env       # Windows
# OR
cp .env.example .env         # macOS/Linux

# Edit .env — at minimum change JWT_SECRET to something random
# notepad .env              (Windows)
# nano .env                 (macOS/Linux)

# Run database migrations + seed data
npm run setup
```

### 3. Set up the Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env       # Windows
# OR
cp .env.example .env         # macOS/Linux
```

### 4. Start both servers

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd fuelwatch/backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd fuelwatch/frontend
npm run dev
# Running on http://localhost:3000
```

Open your browser at **http://localhost:3000**

---

## Default Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@fuelwatch.local    | admin1234  |

> **Change the admin password** after first login via the Users page.

---

## Environment Variables

### backend/.env

| Variable              | Default                   | Description                              |
|-----------------------|---------------------------|------------------------------------------|
| PORT                  | 5000                      | API server port                          |
| NODE_ENV              | development               |                                          |
| DB_PATH               | ./data/fuelwatch.db       | SQLite database file path                |
| JWT_SECRET            | *(change this!)*          | Secret for signing JWTs                  |
| JWT_EXPIRES_IN        | 7d                        | Token expiry                             |
| UPLOADS_DIR           | ./uploads                 | Proof image storage directory            |
| MAX_FILE_SIZE_MB      | 5                         | Max proof image size                     |
| CORS_ORIGIN           | http://localhost:3000     | Allowed frontend origin                  |
| STALE_PRICE_DAYS      | 7                         | Days before a price is marked stale      |
| SPAM_INTERVAL_MINUTES | 30                        | Min minutes between duplicate submissions|

### frontend/.env

| Variable               | Default                                         | Description                       |
|------------------------|-------------------------------------------------|-----------------------------------|
| VITE_API_BASE_URL      | http://localhost:5000/api                       | Backend API base URL              |
| VITE_MAP_TILE_URL      | https://tile.openstreetmap.org/{z}/{x}/{y}.png  | Map tile server                   |
| VITE_MAP_CENTER_LAT    | 17.6132                                         | Default map center latitude       |
| VITE_MAP_CENTER_LNG    | 121.7270                                        | Default map center longitude      |
| VITE_MAP_DEFAULT_ZOOM  | 13                                              | Default map zoom level            |
| VITE_APP_NAME          | FuelWatch Tuguegarao                            | App display name                  |

---

## Re-seeding

If you want to reset and reseed:

```bash
cd backend

# Delete the database file
del data\fuelwatch.db       # Windows
# OR
rm data/fuelwatch.db        # macOS/Linux

# Run setup again
npm run setup
```

---

## API Endpoints Reference

### Auth
| Method | Path                  | Auth     | Description               |
|--------|-----------------------|----------|---------------------------|
| POST   | /api/auth/register    | Public   | Register new user         |
| POST   | /api/auth/login       | Public   | Login, returns JWT        |
| GET    | /api/auth/me          | User     | Get current user          |

### Stations
| Method | Path                  | Auth     | Description               |
|--------|-----------------------|----------|---------------------------|
| GET    | /api/stations         | Public   | List/search stations      |
| GET    | /api/stations/:id     | Public   | Station details           |
| POST   | /api/stations         | Admin    | Create station            |
| PUT    | /api/stations/:id     | Admin    | Update station            |
| DELETE | /api/stations/:id     | Admin    | Deactivate station        |

### Prices
| Method | Path                            | Auth   | Description              |
|--------|---------------------------------|--------|--------------------------|
| GET    | /api/prices/station/:id         | Public | Latest approved prices   |
| GET    | /api/prices/station/:id/history | Public | Recent approved history  |

### Submissions
| Method | Path                          | Auth  | Description                   |
|--------|-------------------------------|-------|-------------------------------|
| GET    | /api/submissions/my           | User  | My submissions                |
| POST   | /api/submissions              | User  | Submit price (multipart)      |
| GET    | /api/submissions/pending      | Admin | Pending queue                 |
| GET    | /api/submissions              | Admin | All submissions (filter)      |
| PUT    | /api/submissions/:id/approve  | Admin | Approve submission            |
| PUT    | /api/submissions/:id/reject   | Admin | Reject submission             |
| PUT    | /api/submissions/:id/edit     | Admin | Edit price + approve          |

### Reports
| Method | Path                          | Auth     | Description               |
|--------|-------------------------------|----------|---------------------------|
| POST   | /api/reports                  | Optional | Submit a report           |
| GET    | /api/reports                  | Admin    | All reports               |
| PUT    | /api/reports/:id/status       | Admin    | Update report status      |

### Admin
| Method | Path                          | Auth  | Description              |
|--------|-------------------------------|-------|--------------------------|
| GET    | /api/admin/dashboard          | Admin | Dashboard stats          |
| GET    | /api/admin/users              | Admin | All users                |
| PUT    | /api/admin/users/:id          | Admin | Update user role/status  |

---

## Frontend Pages

| URL                       | Description                          |
|---------------------------|--------------------------------------|
| /                         | Home page with intro and search      |
| /stations                 | Station list with filters            |
| /stations/:id             | Station detail + prices + map        |
| /map                      | MapLibre map of all stations         |
| /login                    | Login                                |
| /register                 | Registration                         |
| /profile                  | My submissions + account             |
| /submit-price             | Submit a price update                |
| /submit-price/:stationId  | Submit for a specific station        |
| /admin                    | Admin dashboard                      |
| /admin/submissions        | Moderate submissions                 |
| /admin/stations           | Manage stations                      |
| /admin/reports            | Manage reports                       |
| /admin/users              | Manage users                         |

---

## Updating Station Data

The seed stations are placeholders. To replace them with verified data:

1. Open `backend/src/seeds/03_stations.js`
2. Edit the `STATIONS` array with real station names, addresses, barangays, and accurate lat/lng coordinates from Google Maps or OpenStreetMap
3. Delete `backend/data/fuelwatch.db` and run `npm run setup` again

---

## Phase 2 Recommended Improvements

1. **Multi-city support** — Add a `city_id` foreign key to stations; allow users to select city
2. **Email verification** — Require email confirmation on registration
3. **Password reset** — Forgot password flow via email
4. **Price charts** — Historical line charts per product per station (Chart.js or Recharts)
5. **Push notifications** — Notify users when submitted prices are approved/rejected
6. **PWA / offline support** — Service worker for mobile offline browsing
7. **Pagination** — Paginate station list and submission list
8. **Rate limiting** — Express rate limiter on API endpoints
9. **Advanced moderation** — Bulk approve, assign trusted users (reduced moderation)
10. **Import CSV** — Admin import tool for batch station upload via CSV
11. **User reputation system** — Track accuracy score per contributor
12. **Search autocomplete** — Real-time station search suggestions
13. **Price alerts** — Users subscribe to a station for price change alerts

---

## Branding Customization Checklist

Files to edit first when renaming from "FuelWatch Tuguegarao" to your own brand:

- [ ] `frontend/src/components/common/Header.jsx` — Logo text and icon
- [ ] `frontend/src/components/common/Footer.jsx` — Footer brand name and links
- [ ] `frontend/src/pages/HomePage.jsx` — Hero section title and description
- [ ] `frontend/index.html` — `<title>` and `<meta name="description">`
- [ ] `frontend/.env` — `VITE_APP_NAME`
- [ ] `frontend/src/layouts/AdminLayout.jsx` — "FuelWatch Admin" header text
- [ ] `backend/src/seeds/index.js` — Default admin email
- [ ] `frontend/src/styles/variables.css` — Brand colors (`--color-primary`, `--color-accent`)
- [ ] Both `package.json` files — `"name"` field
- [ ] `README.md` — Project name throughout
