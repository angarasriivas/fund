# FundFlow Deployment Guide

## 1) Deploy Backend (Render + SQLite)

1. Push project to GitHub.
2. Create a new **Web Service** in Render pointing to the `server` folder.
3. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables in Render:
   - `PORT=5000`
   - `JWT_SECRET=...` (long random value)
   - `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`
   - `ADMIN_IMPORT_SECRET=...` (required for `POST /api/admin/import`)
5. Add a **Persistent Disk** in Render (required for SQLite):
   - Mount path: `/opt/render/project/src/server/data`
   - This keeps `fundflow.sqlite` safe across restart/redeploy.
6. Deploy and copy backend URL, for example:
   - `https://fundflow-api.onrender.com`

## 2) Deploy Frontend (Vercel)

1. Import repository to Vercel and set root directory to `client`.
2. Set environment variable:
   - `VITE_API_BASE_URL=https://fundflow-api.onrender.com`
3. Deploy and copy frontend URL.

## 3) Update Backend CORS

After frontend URL is known, update backend env:
- `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`

Redeploy backend.

## 4) Seed Production Data (one time)

Use Render shell and run:

```bash
npm run seed
```

Default login credentials created by seed:

- Admin: `admin@fundflow.com` / `Admin@123`
- User: `user@fundflow.com` / `User@123`

## 5) Backup / Export (Admin only)

Use this endpoint with admin JWT token:

- `GET /api/admin/export`

Example curl:

```bash
curl -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  https://fundflow-api.onrender.com/api/admin/export
```

It returns all users, groups, members, payments, and loans in one JSON payload for backup.

Download as file:

- `GET /api/admin/export/download`

Restore from a previous backup JSON:

- `POST /api/admin/import`
- Body can be either full export payload (`{ exportedAt, counts, data }`) or just `{ users, groups, groupMembers, payments, loans }`.
- Header required (when `ADMIN_IMPORT_SECRET` is set):
  - `x-admin-import-secret: <ADMIN_IMPORT_SECRET>`

## 6) Production Hardening Checklist

- `helmet` is enabled for secure HTTP headers.
- Login endpoint is rate-limited (`/api/auth/login`).
- Health endpoint is available at `GET /health`.
- Audit logs are recorded in SQLite table `audit_logs` for admin backup actions (export/download/import).

## 7) Security Before Real Usage

- Change default seeded passwords immediately.
- Keep `JWT_SECRET` strong and private.
- Keep Render service private to trusted usage.
- Treat backup files as sensitive (they include hashed passwords).
- Rotate `ADMIN_IMPORT_SECRET` if it is ever exposed.

