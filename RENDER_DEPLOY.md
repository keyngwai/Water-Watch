# Render Deployment Instructions for Maji Watch

## 1. Backend (Express API)

1. Go to https://dashboard.render.com and create a new Web Service.
2. Connect your GitHub repo or upload your code.
3. Set the root directory to `/backend`.
4. Set the build command to `npm install`.
5. Set the start command to `node src/app.js` (or `npm start` if you have a script).
6. Set environment variables (copy from your `.env` file, do NOT commit secrets):
   - PORT=3001
   - All other variables from your backend `.env`
7. Expose port 3001.
8. Deploy.

## 2. Frontend (Vite + React)

1. Create a new Static Site on Render.
2. Set the root directory to `/frontend`.
3. Set the build command to `npm install && npm run build`.
4. Set the publish directory to `dist`.
5. In your frontend `.env`, set `VITE_API_BASE_URL` to your backend Render URL (e.g., `https://your-backend.onrender.com`).
6. Deploy.

## 3. CORS & API URLs
- Make sure your backend CORS settings allow your frontend Render domain.
- Update all API URLs in your frontend to use the Render backend URL.

## 4. Mobile Access
- Once deployed, your Render URLs are public and accessible from any device.

---

**Optional: Docker Deploy**
- You can use the provided Dockerfiles for custom Docker deployments if you prefer Render's Docker service.
- For most users, Render's native Node.js and Static Site services are simpler and recommended.
