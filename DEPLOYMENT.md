# FundFlow Deployment Guide

## 1) Deploy Backend (Render)

1. Push project to GitHub.
2. Create a new **Web Service** in Render pointing to the `server` folder.
3. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables in Render:
   - `PORT=5000`
   - `MONGO_URI=...`
   - `JWT_SECRET=...` (long random value)
   - `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`
5. Deploy and copy backend URL, for example:
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

Use Render shell (or local terminal with production `MONGO_URI`) and run:

```bash
npm run seed
```

Default login credentials created by seed:

- Admin: `admin@fundflow.com` / `Admin@123`
- User: `user@fundflow.com` / `User@123`

## 5) Security Before Real Usage

- Change default seeded passwords immediately.
- Rotate DB credentials if ever exposed.
- Keep `JWT_SECRET` strong and private.
- Restrict MongoDB Atlas network access.

